<template>
  <div class="min-h-dvh">
    <header class="mx-auto w-full max-w-[740px] px-4 pt-6 sm:pt-10">
      <div class="glass rounded-[var(--radius-xl)] p-4 sm:p-6">
        <div class="flex items-start gap-4">
          <div
            class="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/60 bg-white/45 shadow-sm backdrop-blur-md"
          >
            <img
              v-if="avatarSrc"
              :src="avatarSrc"
              alt="Avatar"
              class="h-full w-full object-cover"
              @error="onAvatarError"
            />
            <div
              v-else
              class="grid h-full w-full place-items-center bg-white/55 text-sm font-semibold text-[color:var(--color-ink-soft)]"
            >
              {{ initials }}
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h1 class="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {{ model.profile.displayName || "Your Name" }}
                </h1>
                <p
                  v-if="model.profile.tagline"
                  class="mt-1 line-clamp-2 text-sm text-[color:var(--color-ink-soft)]"
                >
                  {{ model.profile.tagline }}
                </p>
                <p v-else class="mt-1 text-sm text-[color:var(--color-ink-soft)]">
                  Add a short tagline in the CMS.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  v-if="canUseCms"
                  severity="secondary"
                  rounded
                  class="!px-3 !py-2 !text-sm"
                  @click="previewMode = !previewMode"
                >
                  <i class="pi" :class="previewMode ? 'pi-pencil' : 'pi-eye'" />
                  <span class="ml-2 hidden sm:inline">{{ previewMode ? "Edit" : "Preview" }}</span>
                </Button>
                <Button
                  v-if="canUseCms"
                  rounded
                  class="!border-0 !bg-[color:var(--color-brand)] !px-4 !py-2.5 !text-sm shadow-[0_14px_38px_rgba(37,99,235,0.22)] hover:shadow-[0_18px_52px_rgba(37,99,235,0.26)]"
                  @click="cmsOpen = true"
                >
                  <i class="pi pi-sliders-h" />
                  <span class="ml-2 hidden sm:inline">CMS</span>
                </Button>
                <Button
                  severity="secondary"
                  rounded
                  class="!px-3 !py-2 !text-sm"
                  @click="githubDialogOpen = true"
                >
                  <i class="pi pi-github" />
                  <span class="ml-2 hidden sm:inline">GitHub</span>
                </Button>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <a
                v-for="s in enabledSocials"
                :key="s.id"
                class="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/50 px-3 py-1.5 text-xs font-semibold text-[color:var(--color-ink)] shadow-sm backdrop-blur-md transition hover:bg-white/65"
                :href="s.url"
                target="_blank"
                rel="noreferrer"
              >
                <i class="pi" :class="socialIcon(s.type)" />
                <span class="max-w-[16rem] truncate">{{ s.label }}</span>
              </a>
            </div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <div class="text-xs text-[color:var(--color-ink-soft)]">
            <span class="inline-flex items-center gap-2">
              <span
                class="h-2 w-2 rounded-full transition-all"
                :class="syncIndicatorClass"
              ></span>
              <span>{{ syncStatusText }}</span>
            </span>
          </div>

          <div v-if="canUseCms" class="flex items-center gap-2">
            <Button
              v-if="!previewMode"
              rounded
              severity="secondary"
              class="!px-3 !py-2 !text-sm"
              @click="exportJson"
            >
              <i class="pi pi-download" />
              <span class="ml-2 hidden sm:inline">Export</span>
            </Button>
            <Button
              v-if="!previewMode && isDev"
              rounded
              severity="secondary"
              class="!px-3 !py-2 !text-sm"
              @click="importOpen = true"
            >
              <i class="pi pi-upload" />
              <span class="ml-2 hidden sm:inline">Import</span>
            </Button>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[740px] px-4 pb-10 pt-5 sm:pt-6">
      <section class="glass rounded-[var(--radius-xl)] p-3 sm:p-4">
        <div class="grid gap-2" v-if="enabledLinks.length">
          <a
            v-for="link in enabledLinks"
            :key="link.id"
            class="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/65 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-md transition hover:bg-white/70 hover:shadow-[0_18px_52px_rgba(11,18,32,0.14)]"
            :href="link.url"
            target="_blank"
            rel="noreferrer"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/70 bg-white/60 shadow-sm backdrop-blur-md"
              >
                <img
                  v-if="link.imageUrl"
                  :src="link.imageUrl"
                  alt=""
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <i v-else class="pi pi-link text-[color:var(--color-ink-soft)]" />
              </div>

              <div class="min-w-0">
                <div class="truncate text-sm font-semibold">{{ link.title }}</div>
                <div v-if="link.subtitle" class="truncate text-xs text-[color:var(--color-ink-soft)]">
                  {{ link.subtitle }}
                </div>
              </div>
            </div>

            <i
              class="pi pi-arrow-right text-[color:var(--color-ink-soft)] transition group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <div v-else class="p-6 text-center">
          <div class="text-sm font-semibold">No links yet</div>
          <div class="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            Open the CMS and add your first button.
          </div>
          <Button
            v-if="canUseCms"
            rounded
            class="mt-4 !border-0 !bg-[color:var(--color-brand)] !px-4 !py-2.5 shadow-[0_14px_38px_rgba(37,99,235,0.22)]"
            @click="cmsOpen = true"
            >Add links</Button
          >
        </div>
      </section>

      <footer class="mt-6 text-center text-xs text-[color:var(--color-ink-soft)]">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/50 px-3 py-1.5 shadow-sm backdrop-blur-md"
        >
          <span
            class="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_0_4px_rgba(255,90,122,0.12)]"
          ></span>
          <span>Tip: drag links in the CMS to reorder.</span>
        </div>
      </footer>
    </main>

    <CmsDialog
      v-if="canUseCms"
      v-model:open="cmsOpen"
      :model="model"
      @update:model="updateModel"
    />

    <Dialog
      v-if="isDev"
      v-model:visible="importOpen"
      modal
      header="Import JSON"
      :style="{ width: 'min(680px, 92vw)' }"
    >
      <div class="space-y-3">
        <p class="text-sm text-[color:var(--color-ink-soft)]">
          Paste an exported JSON to restore your profile/links.
        </p>
        <Textarea v-model="importText" autoResize rows="7" class="w-full" />
        <div class="flex justify-end gap-2">
          <Button severity="secondary" rounded @click="importOpen = false">Cancel</Button>
          <Button
            rounded
            class="!border-0 !bg-[color:var(--color-brand)] !px-4 !py-2.5 shadow-[0_14px_38px_rgba(37,99,235,0.22)]"
            @click="applyImport"
            >Import</Button
          >
        </div>
      </div>
    </Dialog>

    <GithubSettingsDialog v-model:open="githubDialogOpen" />

    <Toast />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";

import CmsDialog from "./components/CmsDialog.vue";
import GithubSettingsDialog from "./components/GithubSettingsDialog.vue";
import {
  defaultModel,
  type BioModel,
  sanitizeModel,
  stableStringify,
} from "./lib/model";
import { fetchModel, persistModel, type PersistResult } from "./lib/persistence";
import {
  GITHUB_SYNC_EVENT,
  canUseGithubSync,
  loadGithubSettings,
  type GithubSettings,
} from "./lib/github";

export default defineComponent({
  name: "App",
  components: {
    Button,
    Dialog,
    Textarea,
    Toast,
    CmsDialog,
    GithubSettingsDialog,
  },
  setup() {
    const isDev = import.meta.env.DEV;
    const toast = useToast();

    const model = ref<BioModel>(defaultModel());
    const modelLoaded = ref(false);
    const suppressPersist = ref(true);
    const cmsOpen = ref(false);
    const githubDialogOpen = ref(false);
    const previewMode = ref(true);

    const githubReady = ref(false);
    const githubSettings = ref<GithubSettings>(loadGithubSettings());
    const syncing = ref(false);

    const updateGithubStatus = () => {
      githubReady.value = canUseGithubSync();
      githubSettings.value = loadGithubSettings();
    };

    onMounted(async () => {
      const remoteModel = await fetchModel();
      model.value = remoteModel;
      modelLoaded.value = true;

      setTimeout(() => {
        suppressPersist.value = false;
      }, 0);

      updateGithubStatus();
      if (typeof window !== "undefined") {
        window.addEventListener(GITHUB_SYNC_EVENT, updateGithubStatus);
      }
    });

    onBeforeUnmount(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener(GITHUB_SYNC_EVENT, updateGithubStatus);
      }
    });

    const canUseCms = computed(() => isDev || githubReady.value);

    const enabledLinks = computed(() => model.value.links.filter((l) => l.enabled));
    const enabledSocials = computed(() => model.value.socials.filter((s) => s.enabled && s.url));

    const initials = computed(() => {
      const name = (model.value.profile.displayName || "").trim();
      if (!name) return "LB";
      const parts = name.split(/\s+/).slice(0, 2);
      return parts.map((p) => (p[0] || "").toUpperCase()).join("");
    });

    const avatarErrored = ref(false);
    const avatarSrc = computed(() => {
      const u = (model.value.profile.avatarUrl || "").trim();
      if (!u) return "";
      if (avatarErrored.value) return "";
      return u;
    });

    watch(
      () => model.value.profile.avatarUrl,
      () => {
        avatarErrored.value = false;
      },
    );

    const onAvatarError = () => {
      avatarErrored.value = true;
    };

    const socialIcon = (type: string) => {
      switch (type) {
        case "instagram":
          return "pi-instagram";
        case "x":
          return "pi-twitter";
        case "youtube":
          return "pi-youtube";
        case "tiktok":
          return "pi-video";
        case "github":
          return "pi-github";
        case "website":
        default:
          return "pi-globe";
      }
    };

    const exportJson = async () => {
      const json = stableStringify(model.value);
      await navigator.clipboard.writeText(json);
      toast.add({
        severity: "success",
        summary: "Copied",
        detail: "Your JSON export is copied to clipboard.",
        life: 2200,
      });
    };

    const importOpen = ref(false);
    const importText = ref("");

    const updateModel = (next: BioModel) => {
      model.value = sanitizeModel(next);
    };

    const applyImport = () => {
      try {
        const parsed = sanitizeModel(JSON.parse(importText.value));
        updateModel(parsed);
        importOpen.value = false;
        importText.value = "";
        toast.add({
          severity: "success",
          summary: "Imported",
          detail: "Your site content was updated.",
          life: 2200,
        });
      } catch {
        toast.add({
          severity: "error",
          summary: "Invalid JSON",
          detail: "Please paste a valid export file.",
          life: 2600,
        });
      }
    };

    let persistChain: Promise<void> = Promise.resolve();
    let lastGithubToastAt = 0;

    watch(
      model,
      () => {
        if (!modelLoaded.value || suppressPersist.value) {
          return;
        }

        persistChain = persistChain.then(async () => {
          syncing.value = true;
          try {
            const result = await persistModel(model.value);
            if (result === "github") {
              const now = Date.now();
              if (now - lastGithubToastAt > 1500) {
                toast.add({
                  severity: "success",
                  summary: "Synced",
                  detail: "Changes pushed to GitHub.",
                  life: 2200,
                });
                lastGithubToastAt = now;
              }
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Unable to save changes.";
            toast.add({
              severity: "error",
              summary: "Save failed",
              detail: message,
              life: 3200,
            });
          } finally {
            syncing.value = false;
          }
        });
      },
      { deep: true },
    );

    const repoLabel = computed(() => {
      const owner = githubSettings.value.owner;
      const repo = githubSettings.value.repo;
      return owner && repo ? `${owner}/${repo}` : "GitHub not configured";
    });

    const syncStatusText = computed(() => {
      if (isDev) {
        return "Static site · Saved locally";
      }
      if (syncing.value) {
        return `Syncing with GitHub · ${repoLabel.value}`;
      }
      if (githubReady.value) {
        return `Synced to GitHub · ${repoLabel.value}`;
      }
      return "Static site · Read-only · Add GitHub sync to enable editing";
    });

    const syncIndicatorClass = computed(() => {
      if (syncing.value) {
        return "bg-[color:var(--color-brand)] shadow-[0_0_0_4px_rgba(59,130,246,0.18)] animate-pulse";
      }
      if (isDev || githubReady.value) {
        return "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]";
      }
      return "bg-amber-400 shadow-[0_0_0_4px_rgba(245,158,11,0.20)]";
    });

    return {
      isDev,
      model,
      cmsOpen,
      previewMode,
      enabledLinks,
      enabledSocials,
      initials,
      avatarSrc,
      onAvatarError,
      socialIcon,
      exportJson,
      importOpen,
      importText,
      applyImport,
      updateModel,
      canUseCms,
      githubDialogOpen,
      syncStatusText,
      syncIndicatorClass,
    };
  },
});
</script>