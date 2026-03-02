<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: 'min(580px, 96vw)' }"
    :showCloseIcon="true"
  >
    <template #header>
      <div>
        <div class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)]">
          Edit Gallery Item
        </div>
        <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
          Update details, then close to continue.
        </div>
      </div>
    </template>

    <div v-if="draftItem" class="space-y-4 p-2">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <!-- Type selector -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Type</label>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition"
                :class="draftItem.type === 'image'
                  ? 'border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]'
                  : 'border-[var(--color-border)] bg-[var(--glass-2)] text-[color:var(--color-ink-soft)] hover:bg-[var(--glass)]'"
                @click="setType('image')"
              >
                <i class="pi pi-image mr-1" /> Image
              </button>
              <button
                type="button"
                class="flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition"
                :class="draftItem.type === 'video'
                  ? 'border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]'
                  : 'border-[var(--color-border)] bg-[var(--glass-2)] text-[color:var(--color-ink-soft)] hover:bg-[var(--glass)]'"
                @click="setType('video')"
              >
                <i class="pi pi-video mr-1" /> Video
              </button>
            </div>
          </div>

          <!-- ═══════════ IMAGE FIELDS ═══════════ -->
          <template v-if="draftItem.type === 'image'">
            <ImageUploadField
              v-model="draftItem.src"
              label="Image"
              description="PNG, JPG, WEBP — the image to display in the gallery."
              :targetFilename="`${draftItem.id}.jpg`"
            />
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Image URL (optional)</label>
              <InputText v-model="draftItem.src" class="w-full" placeholder="https://..." />
              <div class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
                Paste a URL instead of uploading if you prefer.
              </div>
            </div>
          </template>

          <!-- ═══════════ VIDEO FIELDS ═══════════ -->
          <template v-if="draftItem.type === 'video'">
            <!-- Video URL -->
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Video URL</label>
              <InputText v-model="draftItem.src" class="w-full" placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…" />
              <div class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
                Paste a YouTube, Vimeo, or direct .mp4 link.
              </div>
            </div>

            <!-- MP4 file upload -->
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Upload MP4 (optional)</label>
              <div
                class="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--glass)] transition hover:border-[rgba(59,130,246,0.55)] hover:bg-[var(--glass-strong)]"
                :class="{ 'pointer-events-none opacity-60': videoUploading }"
                @click="browseVideo"
                @dragenter.prevent
                @dragover.prevent
                @drop.prevent="onDropVideo"
              >
                <input
                  ref="videoFileInput"
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  class="hidden"
                  @change="onVideoFileChange"
                />

                <div
                  v-if="videoUploading"
                  class="absolute inset-0 z-10 grid place-items-center bg-[var(--glass-strong)] text-sm font-semibold text-[color:var(--color-ink)]"
                >
                  Uploading…
                </div>

                <div class="flex flex-col items-center justify-center gap-2 px-6 py-6 text-center">
                  <div class="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--glass-strong)] text-[color:var(--color-ink-soft)] shadow-sm">
                    <i class="pi pi-upload text-base"></i>
                  </div>
                  <div class="text-xs font-semibold text-[color:var(--color-ink)]">
                    Drop an .mp4 file or click to browse
                  </div>
                  <div class="text-[11px] font-medium text-[color:var(--color-ink-soft)]">
                    The file will be uploaded and the URL filled automatically.
                  </div>
                </div>
              </div>
            </div>

            <!-- Cover / poster image -->
            <ImageUploadField
              v-model="draftItem.coverUrl"
              label="Cover image (optional)"
              description="A poster thumbnail shown before the video plays."
              :targetFilename="`${draftItem.id}-cover.jpg`"
            />
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Cover URL (optional)</label>
              <InputText v-model="draftItem.coverUrl" class="w-full" placeholder="https://..." />
            </div>
          </template>

          <!-- ═══════════ COMMON FIELDS ═══════════ -->
          <!-- Title -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Title</label>
            <InputText v-model="draftItem.title" class="w-full" placeholder="Give it a name…" />
          </div>

          <!-- Description -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Description</label>
            <Textarea v-model="draftItem.description" autoResize rows="3" class="w-full" placeholder="Optional caption / description…" />
          </div>

          <!-- Enabled toggle -->
          <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
            <div>
              <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Visible</div>
              <div class="mt-0.5 text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
                Hidden items won't appear in the gallery.
              </div>
            </div>
            <ToggleSwitch v-model="draftItem.enabled" />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2">
        <Button
          rounded
          text
          severity="danger"
          class="!rounded-full"
          @click="$emit('delete')"
        >
          <i class="pi pi-trash" />
          <span class="ml-2">Delete</span>
        </Button>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch, nextTick } from "vue";

import Button from "primevue/button";
import Drawer from "primevue/drawer";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";

import ImageUploadField from "./ImageUploadField.vue";
import type { GalleryItem, GalleryItemType } from "../lib/model";

export default defineComponent({
  name: "GalleryEditorDrawer",
  components: { Drawer, Button, InputText, Textarea, ToggleSwitch, ImageUploadField },
  props: {
    open: { type: Boolean, required: true },
    item: { type: Object as () => GalleryItem | null, default: null },
  },
  emits: ["update:open", "update:item", "delete"],
  setup(props, { emit }) {
    const toast = useToast();

    const visible = ref(props.open);
    watch(
      () => props.open,
      (v) => (visible.value = v),
    );
    watch(visible, (v) => emit("update:open", v));

    // ── Draft item with cycle-safe sync ───────────────────────────
    const draftItem = ref<GalleryItem | null>(null);
    let syncing = false; // guard to break watcher loop

    watch(
      () => props.item,
      (item) => {
        if (syncing) return;
        draftItem.value = item ? { ...item } : null;
      },
      { immediate: true },
    );

    watch(
      draftItem,
      (val) => {
        if (!val) return;
        syncing = true;
        emit("update:item", { ...val });
        nextTick(() => { syncing = false; });
      },
      { deep: true },
    );

    // Explicit setter so the type change is guaranteed reactive
    const setType = (t: GalleryItemType) => {
      if (!draftItem.value) return;
      draftItem.value = { ...draftItem.value, type: t };
    };

    // ── MP4 file upload ───────────────────────────────────────────
    const videoFileInput = ref<HTMLInputElement | null>(null);
    const videoUploading = ref(false);

    const browseVideo = () => {
      if (videoUploading.value) return;
      videoFileInput.value?.click();
    };

    const onDropVideo = (e: DragEvent) => {
      const file = e.dataTransfer?.files?.item(0);
      void processVideoFile(file ?? undefined);
    };

    const onVideoFileChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.item(0);
      void processVideoFile(file ?? undefined);
    };

    const processVideoFile = async (file?: File) => {
      if (!file) return;
      if (!file.type.startsWith("video/")) {
        toast.add({
          severity: "warn",
          summary: "Unsupported file",
          detail: "Please choose a video file (.mp4, .mov).",
          life: 2400,
        });
        return;
      }

      videoUploading.value = true;
      try {
        const formData = new FormData();
        formData.append("file", file, file.name);
        const res = await fetch("/cms-upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error(await res.text() || `Upload failed (${res.status})`);
        const payload = (await res.json()) as { url?: string };
        if (!payload.url) throw new Error("Upload succeeded but no URL was returned.");
        if (draftItem.value) {
          draftItem.value = { ...draftItem.value, src: payload.url };
        }
        toast.add({
          severity: "success",
          summary: "Uploaded",
          detail: "Video saved — URL has been filled in automatically.",
          life: 2200,
        });
      } catch (err) {
        toast.add({
          severity: "error",
          summary: "Upload failed",
          detail: err instanceof Error ? err.message : "Unable to upload video.",
          life: 2800,
        });
      } finally {
        videoUploading.value = false;
        if (videoFileInput.value) videoFileInput.value.value = "";
      }
    };

    return {
      visible,
      draftItem,
      setType,
      videoFileInput,
      videoUploading,
      browseVideo,
      onDropVideo,
      onVideoFileChange,
    };
  },
});
</script>
