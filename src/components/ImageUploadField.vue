<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">
        {{ label }}
      </label>
      <button
        v-if="modelValue"
        type="button"
        class="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--color-ink)] shadow-sm transition hover:bg-white"
        @click.stop="clearImage"
        :disabled="uploading"
      >
        Remove
      </button>
    </div>

    <div
      class="group relative overflow-hidden rounded-2xl border-2 border-dashed border-white/70 bg-white/55 transition"
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
        class="absolute inset-0 z-10 grid place-items-center bg-white/80 text-sm font-semibold text-[color:var(--color-ink)]"
      >
        Uploading…
      </div>

      <div
        v-if="!modelValue"
        class="pointer-events-none flex flex-col items-center justify-center gap-3 px-6 py-8 text-center sm:px-7 sm:py-9"
      >
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[color:var(--color-ink-soft)] shadow-sm"
        >
          <i class="pi pi-image text-lg"></i>
        </div>
        <div class="text-sm font-semibold text-[color:var(--color-ink)]">
          {{ uploadHeadline }}
        </div>
        <div class="text-xs font-medium leading-relaxed text-[color:var(--color-ink-soft)]">
          {{ helperCopy }}
        </div>
      </div>

      <div v-else class="relative">
        <img :src="modelValue" alt="" class="h-48 w-full object-cover" />
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-[rgba(11,18,32,0.72)] to-transparent px-4 pb-3 pt-10"
        >
          <div class="text-left text-xs font-semibold uppercase tracking-wide text-white/80">
            Drop a new image to replace
          </div>
        </div>
      </div>
    </div>

    <div class="text-xs font-semibold text-[color:var(--color-ink-soft)]">
      <slot name="helper">
        {{ defaultHelper }}
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useToast } from "primevue/usetoast";

import {
  canUseGithubSync,
  loadGithubSettings,
  uploadImageToGithub,
  GITHUB_SYNC_EVENT,
} from "../lib/github";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    description?: string;
  }>(),
  {
    label: "Image",
    description: "PNG, JPG, WEBP — aim for at least 1200px on the long edge.",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const toast = useToast();

const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const uploading = ref(false);

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
    classes.push("cursor-pointer hover:border-[rgba(59,130,246,0.55)] hover:bg-white/70");
  } else {
    classes.push("cursor-not-allowed opacity-80");
  }
  if (dragging.value) {
    classes.push("border-[rgba(59,130,246,0.75)] bg-white/80 shadow-[0_12px_40px_rgba(59,130,246,0.18)]");
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

const performUpload = async (file: File) => {
  if (isDev) {
    return uploadViaDevServer(file);
  }

  if (!githubReady.value) {
    throw new Error("Configure GitHub sync to enable uploads.");
  }

  return uploadImageToGithub(file);
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
        : "Image committed to your GitHub repository.",
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