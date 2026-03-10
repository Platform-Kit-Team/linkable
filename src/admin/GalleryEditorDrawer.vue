<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: expanded ? '100vw' : 'min(580px, 96vw)' }"
    :showCloseIcon="true"
  >
    <template #header>
      <div class="flex w-full items-center justify-between">
        <div>
          <div class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)]">
            Edit Gallery Item
          </div>
          <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
            Update details, then close to continue.
          </div>
        </div>
        <button
          type="button"
          class="cms-expand-toggle hidden md:flex"
          :title="expanded ? 'Collapse panel' : 'Expand panel'"
          @click="expanded = !expanded"
        >
          <i class="pi" :class="expanded ? 'pi-angle-right' : 'pi-angle-left'" />
        </button>
      </div>
    </template>

    <div v-if="draftItem" class="space-y-4 p-2">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <!-- Type selector -->
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

          <!-- Tags -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Tags</label>
            <MultiSelect
              v-model="draftItem.tags"
              :options="allGalleryTags"
              display="chip"
              filter
              :maxSelectedLabels="10"
              class="w-full"
              placeholder="Select or type tags…"
              @filter="onTagFilter"
            >
              <template #footer>
                <div v-if="tagFilterValue && !allGalleryTags.includes(tagFilterValue)" class="px-3 py-2">
                  <button
                    type="button"
                    class="w-full rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-[color:var(--color-brand)] transition hover:bg-blue-50"
                    @click="addNewTag(tagFilterValue)"
                  >
                    <i class="pi pi-plus mr-1 text-[10px]" />Create “{{ tagFilterValue }}”
                  </button>
                </div>
              </template>
            </MultiSelect>
          </div>

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
                class="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-[var(--glass)] transition hover:border-[rgba(59,130,246,0.55)] hover:bg-[var(--glass-strong)]"
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
          </template>

          <!-- Schedule -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Publish Date (optional)</label>
            <DatePicker v-model="publishDateObj" dateFormat="yy-mm-dd" class="w-full" showIcon iconDisplay="input" showButtonBar />
            <div class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
              This item won't appear in the gallery before this date.
            </div>
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Expiration Date (optional)</label>
            <DatePicker v-model="expirationDateObj" dateFormat="yy-mm-dd" class="w-full" showIcon iconDisplay="input" showButtonBar />
            <div class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
              This item will be hidden from the gallery after this date.
            </div>
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
import { computed, defineComponent, reactive, ref, watch, nextTick } from "vue";

import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import Drawer from "primevue/drawer";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";

import ImageUploadField from "./ImageUploadField.vue";
import type { GalleryItem, GalleryItemType } from "@/themes/bento/collection-types";

export default defineComponent({
  name: "GalleryEditorDrawer",
  components: { Drawer, Button, DatePicker, InputText, MultiSelect, Textarea, ToggleSwitch, ImageUploadField },
  props: {
    open: { type: Boolean, required: true },
    item: { type: Object as () => GalleryItem | null, default: null },
    allTags: { type: Array as () => string[], default: () => [] },
  },
  emits: ["update:open", "update:item", "delete"],
  setup(props, { emit }) {
    const toast = useToast();

    const visible = ref(props.open);
    const expanded = ref(false);
    watch(
      () => props.open,
      (v) => (visible.value = v),
    );
    watch(visible, (v) => emit("update:open", v));

    // ── Draft item with cycle-safe sync ───────────────────────────
    const draftItem = ref<GalleryItem | null>(null);
    let syncing = false; // guard to break watcher loop

    // ── Schedule date helpers ──────────────────────────────────────
    const toDateObj = (iso: string) => {
      if (!iso) return null;
      const d = new Date(iso + "T00:00:00");
      return isNaN(d.getTime()) ? null : d;
    };
    const fromDateObj = (d: Date | null) => {
      if (!d) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const publishDateObj = computed({
      get: () => toDateObj(draftItem.value?.publishDate ?? ""),
      set: (v: Date | null) => { if (draftItem.value) draftItem.value = { ...draftItem.value, publishDate: fromDateObj(v) }; },
    });
    const expirationDateObj = computed({
      get: () => toDateObj(draftItem.value?.expirationDate ?? ""),
      set: (v: Date | null) => { if (draftItem.value) draftItem.value = { ...draftItem.value, expirationDate: fromDateObj(v) }; },
    });

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
        const res = await fetch(typeof __PK_CMS_UPLOAD_ENDPOINT__ !== "undefined" ? __PK_CMS_UPLOAD_ENDPOINT__ : "/cms-upload", { method: "POST", body: formData });
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

    // ── Tags ──────────────────────────────────────────────────────
    const tagFilterValue = ref("");

    const allGalleryTags = computed(() => {
      const set = new Set<string>(props.allTags);
      // Also include any tags on the current draft
      if (draftItem.value?.tags) {
        for (const t of draftItem.value.tags) set.add(t);
      }
      return [...set].sort();
    });

    const onTagFilter = (event: any) => {
      tagFilterValue.value = (event.value ?? "").trim();
    };

    const addNewTag = (tag: string) => {
      if (!draftItem.value || !tag) return;
      const normalized = tag.trim();
      if (!normalized) return;
      const tags = [...(draftItem.value.tags || [])];
      if (!tags.includes(normalized)) {
        tags.push(normalized);
        draftItem.value = { ...draftItem.value, tags };
      }
      tagFilterValue.value = "";
    };

    return {
      visible,
      expanded,
      draftItem,
      publishDateObj,
      expirationDateObj,
      setType,
      videoFileInput,
      videoUploading,
      browseVideo,
      onDropVideo,
      onVideoFileChange,
      allGalleryTags,
      tagFilterValue,
      onTagFilter,
      addNewTag,
    };
  },
});
</script>

<style scoped>
:deep(.p-drawer) {
  background: #ffffff !important;
  transition: width 200ms ease;
}
:deep(.p-drawer-header) {
  background: #ffffff !important;
  border-bottom: 1px solid rgba(11, 18, 32, 0.08);
}
:deep(.p-drawer-content) {
  background: #ffffff !important;
}

.cms-expand-toggle {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(11, 18, 32, 0.1);
  background: rgba(255, 255, 255, 0.7);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(11, 18, 32, 0.5);
  transition: background 140ms ease, color 140ms ease;
  flex-shrink: 0;
}
.cms-expand-toggle:hover {
  background: rgba(11, 18, 32, 0.06);
  color: rgba(11, 18, 32, 0.8);
}
</style>
