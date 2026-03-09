#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "onnxruntime",
#   "huggingface_hub",
#   "transformers",
#   "numpy",
#   "tqdm",
#   "librosa",
#   "soundfile",
#   "markdown",
#   "jinja2",
#   "num2words",
#   "optimum",
#   "llama-cpp-python",
#   "requests",
# ]
# ///
"""
Build-time TTS generator using onnx-community/chatterbox-multilingual-ONNX.

Scans content/blog/*.md, converts the body of every *published* post from
markdown → HTML → plain text, then synthesises speech to
public/blog/audio/<slug>.wav. Only runs when VITE_TTS_ENABLED is set.

Voice file priority (first found wins):
  1. public/voice.mp3          staged from the content repo (voice.mp3 at its root)
  2. public/default_voice.mp3  shipped with the app as a fallback
  3. .tts-cache/default_voice.wav  downloaded from HuggingFace on first run

Required Python packages:
  pip install onnxruntime huggingface_hub transformers numpy tqdm librosa soundfile markdown

Optional env vars:
  VITE_TTS_LANGUAGE         BCP-47 language code (default: en)
  VITE_TTS_EXAGGERATION     Emotion intensity 0.0–1.0 (default: 0.5)
  VITE_TTS_MAX_TOKENS       Max speech tokens per post (default: 1200)
  VITE_TTS_MAX_CHARS        Max plain-text chars to synthesize per post (default: 3000)
  VITE_TTS_FORCE            Set to any non-empty value to regenerate existing audio
  VITE_TTS_CHUNK_SIZE       Max chars per TTS chunk (default: 280)
  VITE_TTS_LLM_PREPROCESS   Enable Gemma-3-1b LLM formatting pass before TTS
  VITE_TTS_LLM_MAX_TOKENS   Max tokens Gemma may generate per post (default: 2048)
"""

import os
import sys
import re
import json
import hashlib
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Tuple
import requests
from llama_cpp import Llama

# ── helpers ──────────────────────────────────────────────────────────

def env(key, default=""):
    return os.environ.get(key, default).strip().strip('"').strip("'")

if not env("VITE_TTS_ENABLED"):
    print("[tts-blog] VITE_TTS_ENABLED not set — skipping TTS generation.")
    sys.exit(0)

LANGUAGE_ID  = env("VITE_TTS_LANGUAGE", "en")
EXAGGERATION = float(env("VITE_TTS_EXAGGERATION", "0.5"))
MAX_TOKENS   = int(env("VITE_TTS_MAX_TOKENS", "1200"))
MAX_CHARS    = int(env("VITE_TTS_MAX_CHARS", "3000"))
FORCE_REGEN  = bool(env("VITE_TTS_FORCE"))

SUPPORTED_LANGUAGES = {
    "ar", "da", "de", "el", "en", "es", "fi", "fr", "he", "hi",
    "it", "ja", "ko", "ms", "nl", "no", "pl", "pt", "ru", "sv",
    "sw", "tr", "zh",
}

if LANGUAGE_ID not in SUPPORTED_LANGUAGES:
    print(f"[tts-blog] Unsupported language '{LANGUAGE_ID}'. Falling back to 'en'.")
    LANGUAGE_ID = "en"

SCRIPT_DIR    = Path(__file__).parent
PROJECT_ROOT  = SCRIPT_DIR.parent
BLOG_DIR      = PROJECT_ROOT / "content" / "blog"
OUTPUT_DIR    = PROJECT_ROOT / "public" / "blog" / "audio"
MODEL_CACHE   = PROJECT_ROOT / ".tts-cache"
MODEL_ID      = "onnx-community/chatterbox-multilingual-ONNX"
S3GEN_SR      = 24000
START_TOKEN   = 6561
STOP_TOKEN    = 6562

LLM_MODEL_ID      = "onnx-community/Qwen2.5-1.5B-Instruct"
LLM_CACHE         = MODEL_CACHE / "qwen2.5-1.5b"
LLM_PREPROCESS    = bool(env("VITE_TTS_LLM_PREPROCESS"))
LLM_MAX_NEW_TOKENS = int(env("VITE_TTS_LLM_MAX_TOKENS", "2048"))
LLM_EOS_TOKEN_ID  = 151645  # Qwen2.5 <|im_end|>
CHUNK_SIZE        = int(env("VITE_TTS_CHUNK_SIZE", "280"))  # max chars per TTS chunk

# ── dependency check ─────────────────────────────────────────────────

try:
    import numpy as np
    from tqdm import tqdm
    import soundfile as sf
    import librosa
    from huggingface_hub import hf_hub_download
    from transformers import AutoTokenizer, AutoConfig
    import onnxruntime
    import markdown as md_lib
except ImportError as exc:
    print(f"[tts-blog] Missing dependency: {exc}")
    print("[tts-blog] Install with:")
    print("  pip install onnxruntime huggingface_hub transformers numpy tqdm librosa soundfile markdown")
    sys.exit(1)

# ── frontmatter parser ────────────────────────────────────────────────

def parse_frontmatter(raw: str) -> Tuple[Dict, str]:
    """Split --- frontmatter from body. Returns (meta_dict, body_str)."""
    m = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?", raw)
    if not m:
        return {}, raw
    meta: dict = {}
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        colon = line.find(":")
        if colon == -1:
            continue
        key = line[:colon].strip()
        val: object = line[colon + 1:].strip().strip('"').strip("'")
        if val == "true":
            val = True
        elif val == "false":
            val = False
        meta[key] = val
    return meta, raw[m.end():]

# ── markdown → plain text ─────────────────────────────────────────────

class _TagStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts: List[str] = []
    def handle_data(self, data: str) -> None:
        self._parts.append(data)
    def get_text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self._parts)).strip()

def markdown_to_plain(body: str) -> str:
    """Convert markdown body → HTML → plain text suitable for TTS."""
    html = md_lib.markdown(body, extensions=["fenced_code", "tables"])
    # Strip code blocks entirely — not worth reading aloud
    html = re.sub(r"<pre[\s\S]*?</pre>", " ", html)
    stripper = _TagStripper()
    stripper.feed(html)
    return stripper.get_text()

# ── logits processor ──────────────────────────────────────────────────

class RepetitionPenaltyLogitsProcessor:
    def __init__(self, penalty: float):
        self.penalty = penalty

    def __call__(self, input_ids: "np.ndarray", scores: "np.ndarray") -> "np.ndarray":
        score = np.take_along_axis(scores, input_ids, axis=1)
        score = np.where(score < 0, score * self.penalty, score / self.penalty)
        out = scores.copy()
        np.put_along_axis(out, input_ids, score, axis=1)
        return out

# ── model loading ─────────────────────────────────────────────────────

_loaded_sessions = None

def load_sessions():
    global _loaded_sessions
    if _loaded_sessions is not None:
        return _loaded_sessions

    print(f"[tts-blog] Downloading / verifying model files ({MODEL_ID})…")
    MODEL_CACHE.mkdir(parents=True, exist_ok=True)

    def dl(filename, subfolder=None):
        kwargs = {"subfolder": subfolder} if subfolder else {}
        return hf_hub_download(
            repo_id=MODEL_ID,
            filename=filename,
            local_dir=str(MODEL_CACHE),
            **kwargs,
        )

    # Ensure data files are present first
    for fname in [
        "speech_encoder.onnx_data",
        "embed_tokens.onnx_data",
        "conditional_decoder.onnx_data",
        "language_model.onnx_data",
    ]:
        dl(fname, "onnx")

    speech_encoder_path = dl("speech_encoder.onnx",     "onnx")
    embed_tokens_path   = dl("embed_tokens.onnx",       "onnx")
    cond_decoder_path   = dl("conditional_decoder.onnx","onnx")
    lm_path             = dl("language_model.onnx",     "onnx")

    print("[tts-blog] Loading ONNX inference sessions…")
    opts = onnxruntime.SessionOptions()
    opts.log_severity_level = 3  # suppress verbose output

    _loaded_sessions = (
        onnxruntime.InferenceSession(speech_encoder_path, opts),
        onnxruntime.InferenceSession(embed_tokens_path,   opts),
        onnxruntime.InferenceSession(lm_path,             opts),
        onnxruntime.InferenceSession(cond_decoder_path,   opts),
    )
    print("[tts-blog] Model ready.")
    return _loaded_sessions

# ── LLM (Gemma-3-1b) preprocessing ───────────────────────────────────

_llm_session = None
_llm_config  = None

_TTS_FORMAT_PROMPT = (
    "Format the following text for text-to-speech by converting numbers to spoken words, URLs to phonetic equivalents, and fixing other TTS-unfriendly elements. "
    "Preserve the author's exact wording where possible. Return only the formatted text.\n\n"
    "Examples:\n"
    "Input: Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.\n"
    "Output: Lorem Ipsum has been the industry's standard dummy text ever since the fifteen hundreds.\n\n"
    "Input: It was popularised in the 1960s with the release of Letraset sheets.\n"
    "Output: It was popularised in the nineteen sixties with the release of Letraset sheets.\n\n"
    "Input: Visit https://www.example.com for more info.\n"
    "Output: Visit example dot com for more info.\n\n"
    "Input: The price is $50 and it's 10% off.\n"
    "Output: The price is fifty dollars and it's ten percent off.\n\n"
    "Input: {text}\n"
    "Output:"
)


def load_llm_session():
    global _llm_session, _llm_config
    if _llm_session is not None:
        return _llm_session, _llm_config

    print(f"[tts-blog] Downloading / verifying LLM ({LLM_MODEL_ID})…")
    LLM_CACHE.mkdir(parents=True, exist_ok=True)

    # Download GGUF model
    model_path = hf_hub_download(
        repo_id="Qwen/Qwen2.5-1.5B-Instruct-GGUF",
        filename="qwen2.5-1.5b-instruct-q8_0.gguf",
        local_dir=str(LLM_CACHE),
    )

    print("[tts-blog] Loading LLM model…")
    _llm_session = Llama(model_path, n_ctx=2048, verbose=False)
    _llm_config = None  # Not needed
    print("[tts-blog] LLM ready.")
    return _llm_session, _llm_config


def llm_format_for_tts(text: str) -> str:
    """Run text through Llama 3.2 via Ollama to reformat it for natural TTS output."""
    prompt = (
        "You are a text preprocessor for text-to-speech systems. "
        "Your job is to format text for natural speech by converting numbers to spoken words, URLs to phonetic equivalents, and fixing other issues that sound unnatural when read aloud. "
        "Preserve the author's exact wording where possible. "
        "Examples:\n"
        "- '1500s' → 'fifteen hundreds'\n"
        "- '1960s' → 'nineteen sixties'\n"
        "- '42' → 'forty-two'\n"
        "- 'https://example.com' → 'example dot com'\n"
        "Return only the formatted text, no explanations.\n\n"
        f"Format this text: {text}"
    )

    print(f"[tts-blog] LLM formatting text ({len(text)} chars)…")
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3.2", "prompt": prompt, "stream": False},
            timeout=60
        )
        if response.status_code == 200:
            data = response.json()
            result = data.get("response", "").strip()
            if result:
                print(f"[tts-blog] LLM formatted: {len(text)} → {len(result)} chars")
                print(f"[tts-blog] LLM output:\n{'─'*60}\n{result}\n{'─'*60}")
                return result
    except Exception as e:
        print(f"[tts-blog] LLM failed ({e}), falling back to manual formatting")
    
    # Fallback to manual formatting
    print("[tts-blog] Using manual text formatting")
    return manual_format_for_tts(text)


def manual_format_for_tts(text: str) -> str:
    """Manual text formatting for TTS as fallback."""
    # Convert numbers to spoken form
    def replace_number(match):
        num_str = match.group(1)
        suffix = match.group(2) or ""
        try:
            num = int(num_str)
            if suffix == 's' and 1000 <= num <= 9999:
                # Handle decades/years like 1500s, 1960s
                century = num // 100
                decade = (num % 100) // 10
                if decade == 0:
                    return f"{num2words(century)} hundreds"
                else:
                    decade_num = decade * 10
                    decade_word = num2words(decade_num).replace('ty', 'ties')
                    return f"{num2words(century)} {decade_word}"
            elif suffix:
                return f"{num2words(num)}{suffix}"
            else:
                return num2words(num)
        except ValueError:
            return match.group(0)
    
    text = re.sub(r'\b(\d+)(s?)\b', replace_number, text)
    
    # Convert URLs to phonetic
    def replace_url(match):
        url = match.group(0)
        # Simple: remove http(s)://, replace . with dot, / with slash
        url = re.sub(r'^https?://', '', url)
        url = url.replace('.', ' dot ')
        url = url.replace('/', ' slash ')
        return url.strip()
    
    text = re.sub(r'https?://[^\s]+', replace_url, text)
    
    # Expand common abbreviations
    text = re.sub(r'\be\.g\.', 'for example', text, flags=re.IGNORECASE)
    text = re.sub(r'\bi\.e\.', 'that is', text, flags=re.IGNORECASE)
    text = re.sub(r'\betc\.', 'and so on', text, flags=re.IGNORECASE)
    text = re.sub(r'\bvs\.', 'versus', text, flags=re.IGNORECASE)
    
    # Remove markdown symbols
    text = re.sub(r'[*_#`|]', '', text)
    
    return text
    """
    Split text into chunks of at most max_chars, breaking only at sentence
    boundaries (. ! ?) or, failing that, at word boundaries.
    """
    # Sentence-boundary split — keep the delimiter attached to its sentence
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks: List[str] = []
    current = ""
    for sentence in sentences:
        # A single sentence longer than the limit must be word-split
        if len(sentence) > max_chars:
            words = sentence.split()
            for word in words:
                probe = (current + " " + word).strip()
                if len(probe) > max_chars:
                    if current:
                        chunks.append(current.strip())
                    current = word
                else:
                    current = probe
            continue
        probe = (current + " " + sentence).strip()
        if len(probe) > max_chars:
            if current:
                chunks.append(current.strip())
            current = sentence
        else:
            current = probe
    if current.strip():
        chunks.append(current.strip())
    return [c for c in chunks if c]


# ── inference ─────────────────────────────────────────────────────────

def synthesize(text: str, voice_path: str) -> "np.ndarray":
    speech_enc, embed_tok, lm, cond_dec = load_sessions()

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, cache_dir=str(MODEL_CACHE))
    text = f"[{LANGUAGE_ID.lower()}]{text}"

    audio_ref, _ = librosa.load(voice_path, sr=S3GEN_SR)
    audio_ref = audio_ref[np.newaxis, :].astype(np.float32)

    input_ids    = tokenizer(text, return_tensors="np")["input_ids"].astype(np.int64)
    position_ids = np.where(
        input_ids >= START_TOKEN,
        0,
        np.arange(input_ids.shape[1])[np.newaxis, :] - 1,
    )

    embed_inputs = {
        "input_ids":    input_ids,
        "position_ids": position_ids.astype(np.int64),
        "exaggeration": np.array([EXAGGERATION], dtype=np.float32),
    }

    NUM_LAYERS  = 30
    NUM_KV_HEAD = 16
    HEAD_DIM    = 64
    rep_proc    = RepetitionPenaltyLogitsProcessor(penalty=1.2)
    gen_tokens  = np.array([[START_TOKEN]])

    cond_emb = prompt_token = ref_x_vector = prompt_feat = None
    past_kv  = {}
    attn_mask = None

    for i in tqdm(range(MAX_TOKENS), desc=f"[{LANGUAGE_ID}] Generating", dynamic_ncols=True):
        embeds = embed_tok.run(None, embed_inputs)[0]

        if i == 0:
            cond_emb, prompt_token, ref_x_vector, prompt_feat = speech_enc.run(
                None, {"audio_values": audio_ref}
            )
            embeds = np.concatenate((cond_emb, embeds), axis=1)
            bs, seq_len, _ = embeds.shape
            past_kv = {
                f"past_key_values.{layer}.{kv}": np.zeros(
                    [bs, NUM_KV_HEAD, 0, HEAD_DIM], dtype=np.float32
                )
                for layer in range(NUM_LAYERS)
                for kv in ("key", "value")
            }
            attn_mask = np.ones((bs, seq_len), dtype=np.int64)

        logits, *present_kvs = lm.run(
            None, {"inputs_embeds": embeds, "attention_mask": attn_mask, **past_kv}
        )
        logits = logits[:, -1, :]
        logits = rep_proc(gen_tokens, logits)

        next_token = np.argmax(logits, axis=-1, keepdims=True).astype(np.int64)
        gen_tokens = np.concatenate((gen_tokens, next_token), axis=-1)

        if (next_token.flatten() == STOP_TOKEN).all():
            break

        embed_inputs["input_ids"]    = next_token
        embed_inputs["position_ids"] = np.full((input_ids.shape[0], 1), i + 1, dtype=np.int64)
        attn_mask = np.concatenate(
            [attn_mask, np.ones((attn_mask.shape[0], 1), dtype=np.int64)], axis=1
        )
        for j, key in enumerate(past_kv):
            past_kv[key] = present_kvs[j]

    speech_tokens = gen_tokens[:, 1:-1]
    speech_tokens = np.concatenate([prompt_token, speech_tokens], axis=1)

    wav = cond_dec.run(None, {
        "speech_tokens":      speech_tokens,
        "speaker_embeddings": ref_x_vector,
        "speaker_features":   prompt_feat,
    })[0]
    return np.squeeze(wav, axis=0)


def synthesize_long(text: str, voice_path: str) -> "np.ndarray":
    """
    Synthesize arbitrarily long text by splitting into chunks and
    concatenating the resulting audio arrays.
    """
    chunks = split_into_chunks(text)
    if len(chunks) == 1:
        return synthesize(chunks[0], voice_path)

    print(f"[tts-blog] Splitting into {len(chunks)} chunk(s) ≤ {CHUNK_SIZE} chars each")
    parts: List["np.ndarray"] = []
    for idx, chunk in enumerate(chunks, 1):
        print(f"[tts-blog]   chunk {idx}/{len(chunks)}: {len(chunk)} chars")
        parts.append(synthesize(chunk, voice_path))

    return np.concatenate(parts)

def resolve_voice() -> Path:
    """Return the voice file to use, by priority."""
    # 1. Staged from content repo
    for name in ("voice.mp3", "voice.wav"):
        staged = PROJECT_ROOT / "public" / name
        if staged.exists():
            print(f"[tts-blog] Using content repo voice: {staged.name}")
            return staged
    # 2. Default shipped with app (any format)
    for name in ("default_voice.mp3", "default_voice.wav"):
        default_app = PROJECT_ROOT / "public" / name
        if default_app.exists():
            print(f"[tts-blog] Using app default voice: {default_app.name}")
            return default_app
    # 3. Download from HuggingFace
    cached = MODEL_CACHE / "default_voice.wav"
    if not cached.exists():
        MODEL_CACHE.mkdir(parents=True, exist_ok=True)
        print("[tts-blog] Downloading default reference voice from HuggingFace\u2026")
        hf_hub_download(repo_id=MODEL_ID, filename="default_voice.wav", local_dir=str(MODEL_CACHE))
    return cached


def wav_to_mp3(wav_path: Path, mp3_path: Path) -> bool:
    """Convert WAV to MP3 via ffmpeg. Returns True on success; caller keeps WAV on False."""
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(wav_path), "-b:a", "128k", "-ac", "1", str(mp3_path)],
            check=True, capture_output=True,
        )
        wav_path.unlink(missing_ok=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def text_hash(text: str) -> str:
    """SHA-256 of the plain text that will be synthesised."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def main():
    if not BLOG_DIR.exists():
        print("[tts-blog] content/blog/ not found — nothing to do.")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    voice_path = resolve_voice()

    md_files = sorted(BLOG_DIR.glob("*.md"))
    if not md_files:
        print("[tts-blog] No .md files found.")
        return

    generated = skipped = failed = 0

    for md_file in md_files:
        slug      = md_file.stem
        out_mp3   = OUTPUT_DIR / f"{slug}.mp3"
        out_wav   = OUTPUT_DIR / f"{slug}.wav"
        hash_file = OUTPUT_DIR / f"{slug}.hash"
        # Best existing audio file (mp3 preferred, wav fallback)
        existing  = out_mp3 if out_mp3.exists() else (out_wav if out_wav.exists() else None)

        raw        = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)

        # Skip unpublished posts (default: published)
        if meta.get("published", True) is False:
            print(f"[tts-blog] {slug}: not published — skipping")
            continue

        clean = markdown_to_plain(body)
        if not clean:
            print(f"[tts-blog] {slug}: empty after conversion — skipping")
            continue

        if len(clean) > MAX_CHARS:
            cutoff = clean.rfind(" ", 0, MAX_CHARS)
            clean  = clean[:cutoff if cutoff > MAX_CHARS * 0.85 else MAX_CHARS]

        # Hash the source text *before* LLM so the cache key is stable
        current_hash = text_hash(clean)

        # Skip if audio exists and text hasn't changed
        if not FORCE_REGEN and existing and hash_file.exists():
            if hash_file.read_text().strip() == current_hash:
                skipped += 1
                continue
            print(f"[tts-blog] {slug}: text changed — regenerating audio")

        # LLM preprocessing — reformat text for natural TTS output
        if LLM_PREPROCESS:
            try:
                clean = llm_format_for_tts(clean)
            except Exception as llm_err:
                print(f"[tts-blog] LLM preprocessing failed ({llm_err}) — using raw text")

        print(f"\n[tts-blog] Synthesizing: {slug} ({len(clean)} chars, lang={LANGUAGE_ID})")
        try:
            wav_data = synthesize_long(clean, str(voice_path))
            # Write WAV first, then attempt MP3 conversion via ffmpeg
            sf.write(str(out_wav), wav_data, S3GEN_SR)
            if wav_to_mp3(out_wav, out_mp3):
                final_file = out_mp3
                audio_url  = f"/blog/audio/{slug}.mp3"
            else:
                print(f"[tts-blog]   ffmpeg not found — keeping WAV")
                final_file = out_wav
                audio_url  = f"/blog/audio/{slug}.wav"
            hash_file.write_text(current_hash)
            print(f"[tts-blog] ✔  Saved {final_file.name} ({len(wav_data)/S3GEN_SR:.1f}s)")
            # Inject audioUrl into the compiled post JSON (works in both standalone and build modes)
            post_json = PROJECT_ROOT / "public" / "blog" / f"{slug}.json"
            if post_json.exists():
                try:
                    data = json.loads(post_json.read_text(encoding="utf-8"))
                    data["audioUrl"] = audio_url
                    post_json.write_text(json.dumps(data, indent=2), encoding="utf-8")
                    print(f"[tts-blog]    Updated {slug}.json with audioUrl")
                except Exception:
                    pass
            generated += 1
        except Exception as exc:
            print(f"[tts-blog] ✘  {slug}: {exc}")
            failed += 1

    print(f"\n[tts-blog] Done — {generated} generated, {skipped} cached, {failed} failed.")


if __name__ == "__main__":
    main()
