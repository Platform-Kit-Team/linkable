<template>
  <div class="tiptap-wrapper">
    <!-- Toolbar -->
    <div v-if="editor" class="tiptap-toolbar" :class="{ 'is-expanded': moreOpen }">
      <!-- ═══ Text formatting (essential) ═══ -->
      <div class="tb-group">
        <button type="button" class="tb" :class="{ 'is-active': editor.isActive('bold') }" title="Bold" @click="editor.chain().focus().toggleBold().run()">
          <span class="font-extrabold">B</span>
        </button>
        <button type="button" class="tb" :class="{ 'is-active': editor.isActive('italic') }" title="Italic" @click="editor.chain().focus().toggleItalic().run()">
          <span class="italic font-bold">I</span>
        </button>
        <button type="button" class="tb" :class="{ 'is-active': editor.isActive('underline') }" title="Underline" @click="editor.chain().focus().toggleUnderline().run()">
          <span class="underline font-bold">U</span>
        </button>
        <button type="button" class="tb tb-overflow" :class="{ 'is-active': editor.isActive('strike') }" title="Strikethrough" @click="editor.chain().focus().toggleStrike().run()">
          <span class="line-through font-bold">S</span>
        </button>
      </div>

      <span class="tb-sep" />

      <!-- ═══ Block type dropdown (essential) ═══ -->
      <div class="tb-group">
        <select
          class="tb-select"
          :value="currentBlockType"
          @change="setBlockType(($event.target as HTMLSelectElement).value)"
          title="Block type"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
      </div>

      <span class="tb-sep" />

      <!-- ═══ Font size dropdown ═══ -->
      <div class="tb-group tb-overflow">
        <select
          class="tb-select tb-select-sm"
          :value="currentFontSize"
          @change="setFontSize(($event.target as HTMLSelectElement).value)"
          title="Font size"
        >
          <option value="">Size</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
        </select>
      </div>

      <span class="tb-sep tb-overflow" />

      <!-- ═══ Text color & highlight ═══ -->
      <div class="tb-group tb-overflow">
        <label class="tb tb-color-wrap" title="Text color">
          <span class="tb-color-label" :style="{ borderBottomColor: currentTextColor || '#1a1a1a' }">A</span>
          <input type="color" class="tb-color-input" :value="currentTextColor || '#1a1a1a'" @input="setTextColor(($event.target as HTMLInputElement).value)" />
        </label>
        <label class="tb tb-color-wrap" title="Highlight color">
          <span class="tb-color-label tb-color-label-bg" :style="{ backgroundColor: currentHighlight || 'transparent' }">
            <i class="pi pi-palette" style="font-size:11px" />
          </span>
          <input type="color" class="tb-color-input" :value="currentHighlight || '#ffff00'" @input="setHighlight(($event.target as HTMLInputElement).value)" />
        </label>
        <button type="button" class="tb" title="Clear formatting" @click="editor.chain().focus().unsetAllMarks().run()">
          <i class="pi pi-eraser" style="font-size:12px" />
        </button>
      </div>

      <span class="tb-sep tb-overflow" />

      <!-- ═══ Lists & blocks (dropdown) ═══ -->
      <div class="tb-group">
        <select
          class="tb-select"
          :value="currentListType"
          @change="setListType(($event.target as HTMLSelectElement).value)"
          title="Lists & blocks"
        >
          <option value="">Lists…</option>
          <option value="bulletList">• Bullet list</option>
          <option value="orderedList">1. Ordered list</option>
          <option value="blockquote">❝ Blockquote</option>
        </select>
      </div>

      <span class="tb-sep" />

      <!-- ═══ Insert dropdown ═══ -->
      <div class="tb-group">
        <select
          class="tb-select"
          value=""
          @change="handleInsert(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
          title="Insert"
        >
          <option value="">Insert…</option>
          <option value="link">🔗 Link</option>
          <option value="image">🖼 Image</option>
          <option value="code">⟨⟩ Inline code</option>
          <option value="codeBlock">📋 Code block</option>
          <option value="hr">— Horizontal rule</option>
        </select>
      </div>

      <!-- ═══ Mobile overflow toggle ═══ -->
      <button
        type="button"
        class="tb tb-more-btn"
        :class="{ 'is-active': moreOpen }"
        title="More options"
        @click="moreOpen = !moreOpen"
      >
        <i class="pi pi-ellipsis-h" />
      </button>

      <span class="tb-sep" />

      <!-- ═══ Undo / Redo (essential) ═══ -->
      <div class="tb-group">
        <button type="button" class="tb" title="Undo" :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()">
          <i class="pi pi-undo" />
        </button>
        <button type="button" class="tb" title="Redo" :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()">
          <i class="pi pi-refresh" />
        </button>
      </div>

      <span class="tb-sep" />

      <!-- ═══ Source toggle (essential) ═══ -->
      <div class="tb-group">
        <button type="button" class="tb" :class="{ 'is-active': sourceMode }" title="Toggle markdown source" @click="toggleSourceMode">MD</button>
      </div>
    </div>

    <!-- Rich editor -->
    <div v-show="!sourceMode" class="tiptap-body">
      <EditorContent :editor="editor" />
    </div>

    <!-- Markdown source textarea -->
    <textarea
      v-show="sourceMode"
      ref="sourceTextarea"
      class="tiptap-source"
      :value="markdownSource"
      @input="onSourceInput"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onBeforeUnmount, ref, watch } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import { TextStyle, FontSize, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { common, createLowlight } from "lowlight";
import { markdownToHtml, htmlToMarkdown } from "../lib/markdown-utils";
import { ImageUpload } from "./tiptap-image-upload";
import { uploadImage } from "../lib/upload";
import { useToast } from "primevue/usetoast";

const lowlight = createLowlight(common);

export default defineComponent({
  name: "MarkdownEditor",
  components: { EditorContent },
  props: {
    modelValue: { type: String, default: "" },
    placeholder: { type: String, default: "Write something…" },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const toast = useToast();
    const sourceMode = ref(false);
    const moreOpen = ref(false);
    const markdownSource = ref(props.modelValue);
    const sourceTextarea = ref<HTMLTextAreaElement | null>(null);

    let skipUpdate = false;

    const editor = new Editor({
      content: markdownToHtml(props.modelValue),
      extensions: [
        StarterKit.configure({
          codeBlock: false, // replaced by lowlight version
        }),
        CodeBlockLowlight.configure({ lowlight }),
        Image.configure({ inline: false, allowBase64: true }),
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: props.placeholder }),
        Underline,
        TextStyle,
        FontSize,
        Color,
        Highlight.configure({ multicolor: true }),
        ImageUpload.configure({
          onUpload: (url: string) => {
            toast.add({
              severity: "success",
              summary: "Image uploaded",
              detail: import.meta.env.DEV
                ? "Saved locally."
                : "Queued for commit.",
              life: 2000,
            });
          },
          onError: (err: Error) => {
            toast.add({
              severity: "error",
              summary: "Upload failed",
              detail: err.message || "Unable to upload image.",
              life: 2800,
            });
          },
        }),
      ],
      onUpdate: () => {
        if (skipUpdate) return;
        const html = editor.getHTML();
        const md = htmlToMarkdown(html);
        markdownSource.value = md;
        emit("update:modelValue", md);
      },
    });

    // Sync prop → editor when parent changes content (e.g. loading a different post)
    watch(
      () => props.modelValue,
      (newVal) => {
        const current = htmlToMarkdown(editor.getHTML());
        if (newVal !== current) {
          skipUpdate = true;
          editor.commands.setContent(markdownToHtml(newVal));
          markdownSource.value = newVal;
          skipUpdate = false;
        }
      }
    );

    const toggleSourceMode = () => {
      if (sourceMode.value) {
        skipUpdate = true;
        editor.commands.setContent(markdownToHtml(markdownSource.value));
        skipUpdate = false;
        emit("update:modelValue", markdownSource.value);
      } else {
        markdownSource.value = htmlToMarkdown(editor.getHTML());
      }
      sourceMode.value = !sourceMode.value;
    };

    const onSourceInput = (e: Event) => {
      const val = (e.target as HTMLTextAreaElement).value;
      markdownSource.value = val;
      emit("update:modelValue", val);
    };

    const setLink = () => {
      const previousUrl = editor.getAttributes("link").href ?? "";
      const url = window.prompt("URL", previousUrl);
      if (url === null) return;
      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      }
    };

    const addImage = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        void (async () => {
          try {
            const url = await uploadImage(file);
            editor.chain().focus().setImage({ src: url }).run();
            toast.add({
              severity: "success",
              summary: "Image uploaded",
              detail: import.meta.env.DEV ? "Saved locally." : "Queued for commit.",
              life: 2000,
            });
          } catch (err) {
            toast.add({
              severity: "error",
              summary: "Upload failed",
              detail: err instanceof Error ? err.message : "Unable to upload image.",
              life: 2800,
            });
          }
        })();
      };
      input.click();
    };

    // ── Block type (heading / paragraph) ──
    const blockTypeKey = ref(0);
    const currentBlockType = computed(() => {
      void blockTypeKey.value;
      if (editor.isActive('heading', { level: 1 })) return 'h1';
      if (editor.isActive('heading', { level: 2 })) return 'h2';
      if (editor.isActive('heading', { level: 3 })) return 'h3';
      if (editor.isActive('heading', { level: 4 })) return 'h4';
      return 'paragraph';
    });

    const setBlockType = (type: string) => {
      if (type === 'paragraph') {
        editor.chain().focus().setParagraph().run();
      } else {
        const level = Number(type.replace('h', '')) as 1 | 2 | 3 | 4;
        editor.chain().focus().toggleHeading({ level }).run();
      }
    };

    // ── List & block type ──
    const currentListType = computed(() => {
      void blockTypeKey.value;
      if (editor.isActive('bulletList')) return 'bulletList';
      if (editor.isActive('orderedList')) return 'orderedList';
      if (editor.isActive('blockquote')) return 'blockquote';
      return '';
    });

    const setListType = (type: string) => {
      if (!type) return;
      switch (type) {
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'blockquote':
          editor.chain().focus().toggleBlockquote().run();
          break;
      }
    };

    // ── Insert actions ──
    const handleInsert = (type: string) => {
      if (!type) return;
      switch (type) {
        case 'link':
          setLink();
          break;
        case 'image':
          addImage();
          break;
        case 'code':
          editor.chain().focus().toggleCode().run();
          break;
        case 'codeBlock':
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case 'hr':
          editor.chain().focus().setHorizontalRule().run();
          break;
      }
    };

    // ── Font size ──
    const currentFontSize = computed(() => {
      void blockTypeKey.value;
      const attrs = editor.getAttributes('textStyle');
      return (attrs?.fontSize as string) || '';
    });

    const setFontSize = (size: string) => {
      if (!size) {
        editor.chain().focus().unsetFontSize().run();
      } else {
        editor.chain().focus().setFontSize(size).run();
      }
    };

    // ── Text color ──
    const currentTextColor = computed(() => {
      void blockTypeKey.value;
      const attrs = editor.getAttributes('textStyle');
      return (attrs?.color as string) || '';
    });

    const setTextColor = (color: string) => {
      editor.chain().focus().setColor(color).run();
    };

    // ── Highlight / background color ──
    const currentHighlight = computed(() => {
      void blockTypeKey.value;
      const attrs = editor.getAttributes('highlight');
      return (attrs?.color as string) || '';
    });

    const setHighlight = (color: string) => {
      editor.chain().focus().setHighlight({ color }).run();
    };

    // Keep the computed in sync when the editor selection changes
    editor.on('selectionUpdate', () => { blockTypeKey.value++; });
    editor.on('update', () => { blockTypeKey.value++; });

    onBeforeUnmount(() => {
      editor.destroy();
    });

    return {
      editor,
      sourceMode,
      moreOpen,
      markdownSource,
      sourceTextarea,
      currentBlockType,
      setBlockType,
      currentListType,
      setListType,
      handleInsert,
      currentFontSize,
      setFontSize,
      currentTextColor,
      setTextColor,
      currentHighlight,
      setHighlight,
      toggleSourceMode,
      onSourceInput,
      setLink,
      addImage,
    };
  },
});
</script>

<style scoped>
.tiptap-wrapper {
  border: 1px solid rgba(11, 18, 32, 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

/* ── Toolbar ── */
.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(248, 249, 250, 0.9);
  align-items: center;
}

.tb-group {
  display: inline-flex;
  gap: 2px;
  align-items: center;
}

.tb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(11, 18, 32, 0.55);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.tb:hover {
  background: rgba(11, 18, 32, 0.06);
  color: rgba(11, 18, 32, 0.85);
}
.tb.is-active {
  background: rgba(37, 99, 235, 0.12);
  color: rgb(37, 99, 235);
}
.tb:disabled {
  opacity: 0.35;
  cursor: default;
}

.tb-sep {
  width: 1px;
  height: 20px;
  margin: auto 4px;
  background: rgba(11, 18, 32, 0.1);
}

/* ── Block type select ── */
.tb-select {
  height: 28px;
  padding: 0 24px 0 8px;
  border: 1px solid rgba(11, 18, 32, 0.1);
  border-radius: 6px;
  background: transparent;
  color: rgba(11, 18, 32, 0.65);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 8px 5px;
  transition: border-color 120ms, background-color 120ms;
}
.tb-select:hover {
  border-color: rgba(11, 18, 32, 0.2);
  background-color: rgba(11, 18, 32, 0.03);
}
.tb-select:focus {
  border-color: rgb(37, 99, 235);
}
.tb-select-sm {
  padding: 0 20px 0 6px;
  min-width: 54px;
  font-size: 10px;
}

/* ── Color picker buttons ── */
.tb-color-wrap {
  position: relative;
  cursor: pointer;
}
.tb-color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}
.tb-color-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  border-bottom: 3px solid currentColor;
  line-height: 1;
  padding-bottom: 1px;
}
.tb-color-label-bg {
  border-bottom: none;
  border-radius: 3px;
  width: 18px;
  height: 18px;
}

/* ── Mobile overflow: hide non-essential buttons, show "..." toggle ── */
.tb-more-btn {
  display: none;
}

@media (max-width: 767px) {
  .tb-overflow {
    display: none;
  }

  .tb-more-btn {
    display: inline-flex;
  }

  .tiptap-toolbar.is-expanded .tb-overflow {
    display: inline-flex;
  }
}

/* ── Editor body ── */
.tiptap-body {
  min-height: 200px;
  max-height: 70vh;
  overflow-y: auto;
}

.tiptap-body :deep(.tiptap) {
  padding: 12px 16px;
  outline: none;
  min-height: 200px;
  font-size: 14px;
  line-height: 1.7;
  color: #1a1a1a;
}

/* Prose styling */
.tiptap-body :deep(.tiptap h1) {
  font-size: 1.75em;
  font-weight: 800;
  margin: 1em 0 0.4em;
  line-height: 1.3;
}
.tiptap-body :deep(.tiptap h2) {
  font-size: 1.4em;
  font-weight: 700;
  margin: 0.9em 0 0.35em;
  line-height: 1.35;
}
.tiptap-body :deep(.tiptap h3) {
  font-size: 1.15em;
  font-weight: 700;
  margin: 0.8em 0 0.3em;
  line-height: 1.4;
}
.tiptap-body :deep(.tiptap p) {
  margin: 0.5em 0;
}
.tiptap-body :deep(.tiptap ul),
.tiptap-body :deep(.tiptap ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.tiptap-body :deep(.tiptap li) {
  margin: 0.15em 0;
}
.tiptap-body :deep(.tiptap blockquote) {
  border-left: 3px solid rgba(37, 99, 235, 0.35);
  padding-left: 1em;
  margin: 0.75em 0;
  color: rgba(11, 18, 32, 0.6);
  font-style: italic;
}
.tiptap-body :deep(.tiptap code) {
  background: rgba(37, 99, 235, 0.08);
  border-radius: 4px;
  padding: 0.15em 0.35em;
  font-size: 0.9em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.tiptap-body :deep(.tiptap pre) {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 14px 16px;
  margin: 0.75em 0;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}
.tiptap-body :deep(.tiptap pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  color: inherit;
  font-size: inherit;
}
.tiptap-body :deep(.tiptap img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 0.75em 0;
}
.tiptap-body :deep(.tiptap a) {
  color: rgb(37, 99, 235);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.tiptap-body :deep(.tiptap hr) {
  border: none;
  border-top: 2px solid rgba(11, 18, 32, 0.1);
  margin: 1.5em 0;
}
.tiptap-body :deep(.tiptap mark) {
  border-radius: 2px;
  padding: 0.05em 0.15em;
}
.tiptap-body :deep(.tiptap u) {
  text-underline-offset: 2px;
}

/* Placeholder */
.tiptap-body :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: rgba(11, 18, 32, 0.3);
  pointer-events: none;
  height: 0;
}

/* ── Source textarea ── */
.tiptap-source {
  width: 100%;
  min-height: 300px;
  max-height: 70vh;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1a1a1a;
  background: #fff;
}
</style>
