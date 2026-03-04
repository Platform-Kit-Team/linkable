<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">
        {{ label }}
      </label>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-full border border-[var(--color-border)] bg-[var(--glass-strong)] px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-ink)]"
          @click.stop="showUrlInput = !showUrlInput"
        >
          <i class="pi pi-link mr-1 text-[10px]" />{{ showUrlInput ? 'Hide URL' : 'Paste URL' }}
        </button>
        <button
          v-if="modelValue"
          type="button"
          class="rounded-full border border-[var(--color-border)] bg-[var(--glass-strong)] px-2.5 py-0.5 text-[11px] font-semibold text-red-500/80 transition hover:text-red-600"
          @click.stop="clearImage"
          :disabled="uploading"
        >
          Remove
        </button>
      </div>
    </div>

    <!-- Collapsible URL input -->
    <div v-if="showUrlInput" class="flex gap-2">
      <InputText
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)"
        class="w-full !text-xs"
        placeholder="https://..."
      />
    </div>

    <!-- Thumbnail preview OR drop zone -->
    <div v-if="modelValue" class="relative w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--glass)] shadow-sm">
      <div class="flex items-center gap-3 p-2">
        <img :src="modelValue" alt="" class="block h-16 w-auto max-w-[120px] rounded-lg object-contain" />
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />
    </div>

    <div
      v-else
      class="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-[var(--glass)] transition"
      :class="dropZoneState"
      @click="browse"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />

      <div
        v-if="uploading"
        class="absolute inset-0 z-10 grid place-items-center bg-[var(--glass-strong)] text-xs font-semibold text-[color:var(--color-ink)]"
      >
        Uploading…
      </div>

      <div
        class="pointer-events-none flex flex-col items-center justify-center gap-2 px-4 py-5 text-center"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--glass-strong)] text-[color:var(--color-ink-soft)] shadow-sm"
        >
          <i class="pi pi-image text-sm"></i>
        </div>
        <div class="text-xs font-semibold text-[color:var(--color-ink)]">
          {{ uploadHeadline }}
        </div>
        <div class="text-[11px] font-medium leading-relaxed text-[color:var(--color-ink-soft)]">
          {{ helperCopy }}
        </div>
      </div>
    </div>

    <div class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
      <slot name="helper">
        {{ defaultHelper }}
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";
import InputText from "primevue/inputtext";

import {
  canUseGithubSync,
  loadGithubSettings,
  uploadImageToGithub,
  addPendingUpload,
  GITHUB_SYNC_EVENT,
} from "../lib/github";
import { convertToJpeg } from "../lib/image-convert";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    description?: string;
    /** Fixed output filename (e.g. "avatar.jpg"). When set, the file is
     *  converted to JPEG and saved under this name, replacing any previous
     *  upload instead of accumulating files. */
    targetFilename?: string;
  }>(),
  {
    label: "Image",
    description: "PNG, JPG, WEBP — aim for at least 1200px on the long edge.",
    targetFilename: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const toast = useToast();

const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const uploading = ref(false);
const showUrlInput = ref(false);

const isDev = import.meta.env.DEV;
const githubReady = ref(false);
const githubUploadsDir = ref("public/uploads");

const refreshGithubState = () => {
  githubReady.value = canUseGithubSync();
  githubUploadsDir.value = loadGithubSettings().uploadsDir || "public/uploads";
};

onMounted(() => {
  if (!isDev) {
    refreshGithubState();
    window.addEventListener(GITHUB_SYNC_EVENT, refreshGithubState);
  } else {
    githubReady.value = true;
  }
});

onBeforeUnmount(() => {
  if (!isDev) {
    window.removeEventListener(GITHUB_SYNC_EVENT, refreshGithubState);
  }
});

const canUpload = computed(() => isDev || githubReady.value);

const uploadHeadline = computed(() =>
  canUpload.value ? "Drop an image or click to browse" : "Configure GitHub sync to upload",
);

const helperCopy = computed(() => {
  if (canUpload.value) {
    return props.description;
  }
  return isDev ? "Uploads are disabled outside local development." : "Open GitHub sync settings to enable uploads.";
});

const displayUploadsDir = computed(() => {
  const raw = githubUploadsDir.value || "public/uploads";
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) return "/";
  if (normalized.startsWith("public/")) {
    return `/${normalized.slice("public/".length) || ""}`.replace(/\/+/g, "/");
  }
  return `/${normalized}`.replace(/\/+/g, "/");
});

const defaultHelper = computed(() => {
  if (isDev) {
    return "Files are saved to public/uploads while you iterate locally.";
  }
  if (!githubReady.value) {
    return "Images will sync once GitHub settings are configured.";
  }
  return `Images are committed to GitHub under ${displayUploadsDir.value}.`;
});

const dropZoneState = computed(() => {
  const classes = ["px-4 py-3 sm:px-5 sm:py-6"];
  if (canUpload.value && !uploading.value) {
    classes.push("cursor-pointer hover:border-[rgba(59,130,246,0.55)] hover:bg-[var(--glass-strong)]");
  } else {
    classes.push("cursor-not-allowed opacity-80");
  }
  if (dragging.value) {
    classes.push("border-[rgba(59,130,246,0.75)] bg-[var(--glass-strong)] shadow-[0_12px_40px_rgba(59,130,246,0.18)]");
  }
  if (uploading.value) {
    classes.push("pointer-events-none opacity-60");
  }
  return classes.join(" ");
});

const browse = () => {
  if (!canUpload.value || uploading.value) return;
  fileInput.value?.click();
};

const clearImage = () => {
  if (uploading.value) return;
  emit("update:modelValue", "");
};

const resetInputValue = () => {
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const onDragEnter = () => {
  if (!canUpload.value || uploading.value) return;
  dragging.value = true;
};

const onDragOver = () => {
  if (!canUpload.value || uploading.value) return;
  dragging.value = true;
};

const onDragLeave = () => {
  dragging.value = false;
};

const onDrop = (event: DragEvent) => {
  if (!canUpload.value || uploading.value) return;
  dragging.value = false;
  const file = event.dataTransfer?.files?.item(0);
  void processFile(file ?? undefined);
};

const onFileChange = (event: Event) => {
  if (!canUpload.value || uploading.value) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.item(0);
  void processFile(file ?? undefined);
};

const uploadViaDevServer = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await fetch("/cms-upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(reason || `Upload failed with ${response.status}`);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return payload.url;
};

/** Convert raw file to JPEG with the deterministic target filename. */
const prepareFile = async (raw: File): Promise<File> => {
  const target = props.targetFilename;
  if (!target) return raw; // no target → legacy behaviour
  return convertToJpeg(raw, target, 0.9);
};

const performUpload = async (file: File) => {
  // Convert to JPEG with a deterministic name when targetFilename is set
  const prepared = await prepareFile(file);

  if (isDev) {
    return uploadViaDevServer(prepared);
  }

  if (!githubReady.value) {
    throw new Error("Configure GitHub sync to enable uploads.");
  }

  // in production, queue the upload and return its future public path
  return addPendingUpload(prepared);
};

const processFile = async (file?: File) => {
  if (!file) {
    resetInputValue();
    return;
  }

  if (!file.type.startsWith("image/")) {
    toast.add({
      severity: "warn",
      summary: "Unsupported file",
      detail: "Please choose an image file (png, jpg, webp, gif).",
      life: 2400,
    });
    resetInputValue();
    return;
  }

  uploading.value = true;

  try {
    const url = await performUpload(file);
    emit("update:modelValue", url);
    toast.add({
      severity: "success",
      summary: "Uploaded",
      detail: isDev
        ? "Image saved locally and ready to use."
        : "Image queued for commit; it will be pushed when you commit changes.",
      life: 2200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload image.";
    toast.add({
      severity: "error",
      summary: "Upload failed",
      detail: message,
      life: 2800,
    });
  } finally {
    dragging.value = false;
    uploading.value = false;
    resetInputValue();
  }
};
</script>