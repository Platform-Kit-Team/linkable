<template>
  <div class="min-h-dvh">
    <header class="mx-auto w-full max-w-[740px] px-4 pt-6 sm:pt-10">
      <div class="glass overflow-hidden rounded-[var(--radius-xl)]">
        <!-- Banner image -->
        <img
          v-if="bannerSrc"
          :src="bannerSrc"
          alt="Banner"
          class="h-40 w-full object-cover sm:h-52"
          @error="onBannerError"
        />

        <div class="p-4 sm:p-6">
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
            <div class="flex items-start justify-between gap-3" @dblclick="toggleCmsButton">
              <div class="min-w-0 cursor-pointer select-none">
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

            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <a
                v-for="s in enabledSocials"
                :key="s.id"
                class="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/50 px-3 py-1.5 text-xs font-semibold text-[color:var(--color-ink)] shadow-sm backdrop-blur-md transition hover:bg-white/65"
                :href="s.type === 'email' && s.url && !s.url.startsWith('mailto:') ? 'mailto:' + s.url : s.url"
                :target="s.type === 'email' ? undefined : '_blank'"
                rel="noreferrer"
              >
                <i class="pi" :class="socialIcon(s.type)" />
                <span class="max-w-[16rem] truncate">{{ s.label }}</span>
              </a>
            </div>
          </div>
        </div>

      </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[740px] px-4 pb-10 pt-5 sm:pt-6">
      <section class="glass rounded-[var(--radius-xl)] p-3 sm:p-4">
        <div v-if="enabledLinks.length" class="grid gap-2">
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
                  :src="resolveUploadUrl(link.imageUrl)"
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

            <i class="pi pi-arrow-right text-[color:var(--color-ink-soft)] transition group-hover:translate-x-0.5" />
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
          >
            Add links
          </Button>
        </div>
      </section>

      <footer class="mt-6 text-center text-xs text-[color:var(--color-ink-soft)]">
        <a
          href="https://github.com/platform-kit-team/linkable"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/50 px-3 py-1.5 shadow-sm backdrop-blur-md transition hover:bg-white/65"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand)] shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"></span>
          <span>Made with Linkable</span>
        </a>
      </footer>
    </main>

    <CmsDialog
      v-if="canUseCms"
      v-model:open="cmsOpen"
      :model="model"
      :preview-mode="previewMode"
      @update:model="updateModel"
      @toggle-preview="togglePreviewMode"
      @open-github="openGithubSettings"
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
          >
            Import
          </Button>
        </div>
      </div>
    </Dialog>

    <GithubSettingsDialog v-model:open="githubDialogOpen" />
    <GitCommitDialog v-if="unsynced" v-model:open="gitDialogOpen" @commit="performCommit" />

    <Toast />

    <!-- Floating CMS button -->
    <Button
      v-if="canUseCms"
      rounded
      class="!fixed !bottom-6 !right-6 !z-50 !border-0 !bg-[color:var(--color-brand)] !px-5 !py-3 !text-sm !shadow-[0_14px_38px_rgba(37,99,235,0.28)] hover:!shadow-[0_18px_52px_rgba(37,99,235,0.32)]"
      @click="cmsOpen = true"
    >
      <i class="pi pi-sliders-h" />
      <span class="ml-2">CMS</span>
    </Button>

    <!-- Floating status bar -->
    <div
      v-if="canUseCms"
      class="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-full border border-white/65 bg-white/70 px-4 py-2 text-xs text-[color:var(--color-ink-soft)] shadow-sm backdrop-blur-md"
    >
      <span class="inline-flex items-center gap-2">
        <span class="h-2 w-2 rounded-full transition-all" :class="syncIndicatorClass"></span>
        <span>{{ syncStatusText }}</span>
      </span>

      <div class="flex items-center gap-1.5">
        <Button
          v-if="unsynced"
          rounded
          severity="secondary"
          class="!px-2.5 !py-1.5 !text-xs"
          @click="gitDialogOpen = true"
        >
          <i class="pi pi-git-branch" />
          <span class="ml-1.5 hidden sm:inline">Commit</span>
        </Button>
        <Button
          v-if="!previewMode"
          rounded
          severity="secondary"
          class="!px-2.5 !py-1.5 !text-xs"
          @click="exportJson"
        >
          <i class="pi pi-download" />
        </Button>
        <Button
          v-if="!previewMode && isDev"
          rounded
          severity="secondary"
          class="!px-2.5 !py-1.5 !text-xs"
          @click="importOpen = true"
        >
          <i class="pi pi-upload" />
        </Button>
      </div>
    </div>
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
  watchEffect,
} from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";

import CmsDialog from "./components/CmsDialog.vue";
import GitCommitDialog from "./components/GitCommitDialog.vue";
import GithubSettingsDialog from "./components/GithubSettingsDialog.vue";
import {
  defaultModel,
  type BioModel,
  sanitizeModel,
  stableStringify,
} from "./lib/model";
import { fetchModel, persistModel, getStagedData, clearStagedData } from "./lib/persistence";
import {
  GITHUB_SYNC_EVENT,
  canUseGithubSync,
  loadGithubSettings,
  pushCmsDataToGithub,
  commitPendingUploads,
  getGithubToken,
  resolveUploadUrl,
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
    GitCommitDialog,
  },
  setup() {
    const isDev = import.meta.env.DEV;
    const toast = useToast();

    const model = ref<BioModel>(defaultModel());
    const modelLoaded = ref(false);
    const suppressPersist = ref(true);
    const cmsOpen = ref(false);
    const githubDialogOpen = ref(false);
    const gitDialogOpen = ref(false);
    const previewMode = ref(true);
    const cmsBtnVisible = ref(false);

    const githubReady = ref(false);
    const githubSettings = ref<GithubSettings>(loadGithubSettings());
    const syncing = ref(false);
    const unsynced = ref(false);

    const updateGithubStatus = () => {
      githubReady.value = canUseGithubSync();
      githubSettings.value = loadGithubSettings();
    };

    let keydownListener: ((e: KeyboardEvent) => void) | null = null;

    onMounted(async () => {
      // initialize visibility, keyboard, and other window stuff first
      if (typeof window !== "undefined") {
        window.addEventListener(GITHUB_SYNC_EVENT, updateGithubStatus);

        const storedCmsVisible = localStorage.getItem("cms-button-visible") === "true";
        const urlParams = new URLSearchParams(window.location.search);
        const cmsFromUrl = urlParams.has("cms");
        cmsBtnVisible.value = storedCmsVisible || cmsFromUrl;
        // kick off unsynced flag if there's pending JSON or uploads stored
        if (localStorage.getItem("pending-cms") || localStorage.getItem("pending-uploads")) {
          unsynced.value = true;
        }

        // Keyboard shortcut: Cmd/Ctrl + Shift + E
        keydownListener = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e") {
            e.preventDefault();
            cmsBtnVisible.value = !cmsBtnVisible.value;
            localStorage.setItem("cms-button-visible", cmsBtnVisible.value ? "true" : "false");
          }
        };
        window.addEventListener("keydown", keydownListener);
      }

      try {
        const remoteModel = await fetchModel();
        model.value = remoteModel;
      } catch (err) {
        console.warn("fetchModel failed", err);
      }

      modelLoaded.value = true;

      setTimeout(() => {
        suppressPersist.value = false;
      }, 0);

      updateGithubStatus();
    });

    onBeforeUnmount(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener(GITHUB_SYNC_EVENT, updateGithubStatus);
        if (keydownListener) {
          window.removeEventListener("keydown", keydownListener);
        }
      }
    });

    const canUseCms = computed(() => cmsBtnVisible.value);

    const toggleCmsButton = () => {
      cmsBtnVisible.value = !cmsBtnVisible.value;
      localStorage.setItem("cms-button-visible", cmsBtnVisible.value ? "true" : "false");
    };

    const performCommit = async (message: string) => {
      if (!message.trim()) return;

      syncing.value = true;
      try {
        if (isDev) {
          // dev: call the push endpoint which runs export-to-github.mjs
          const res = await fetch("/__cms-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message.trim() }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `Push failed (${res.status})`);
          }
        } else {
          // production: push staged CMS JSON + queued uploads to GitHub
          const payload = getStagedData() || stableStringify(model.value);

          // first commit any queued uploads that are still referenced
          const settings = loadGithubSettings();
          const token = getGithubToken();

          console.warn("[Linkable commit]", {
            owner: settings.owner,
            repo: settings.repo,
            branch: settings.branch,
            dataPath: settings.dataPath,
            staticDataPath: settings.staticDataPath,
            hasToken: !!token,
            payloadLength: payload?.length ?? 0,
          });

          const usedPaths = [model.value.profile.avatarUrl, model.value.profile.bannerUrl];
          model.value.links.forEach((l: any) => {
            if (l.imageUrl) usedPaths.push(l.imageUrl);
          });
          await commitPendingUploads(settings, token, usedPaths.filter(Boolean), message);

          // then commit the CMS JSON
          await pushCmsDataToGithub(payload, message);

          // clear staged data on success
          clearStagedData();
        }

        const commitTarget = isDev
          ? "local → GitHub"
          : `${loadGithubSettings().owner}/${loadGithubSettings().repo} → ${loadGithubSettings().dataPath}`;
        unsynced.value = false;
        toast.add({
          severity: "success",
          summary: "Committed",
          detail: commitTarget,
          life: 4000,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unable to push to GitHub.";
        toast.add({ severity: "error", summary: "Commit failed", detail: msg, life: 3200 });
      } finally {
        syncing.value = false;
      }
    };

    const enabledLinks = computed(() => model.value.links.filter((l) => l.enabled));
    const enabledSocials = computed(() =>
      model.value.socials.filter((s) => s.enabled && s.url),
    );

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
      return resolveUploadUrl(u);
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

    const bannerErrored = ref(false);
    const bannerSrc = computed(() => {
      const u = (model.value.profile.bannerUrl || "").trim();
      if (!u) return "";
      if (bannerErrored.value) return "";
      return resolveUploadUrl(u);
    });

    watch(
      () => model.value.profile.bannerUrl,
      () => {
        bannerErrored.value = false;
      },
    );

    const onBannerError = () => {
      bannerErrored.value = true;
    };

    watchEffect(() => {
      const name = (model.value.profile.displayName || "").trim();
      const tagline = (model.value.profile.tagline || "").trim();
      if (name && tagline) {
        document.title = `${name} — ${tagline}`;
      } else if (name) {
        document.title = name;
      } else {
        document.title = "Linkable";
      }
    });

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
        case "email":
          return "pi-envelope";
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
    let persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    watch(
      model,
      () => {
        if (!modelLoaded.value || suppressPersist.value) {
          return;
        }
        // mark unsynced immediately when model changes
        unsynced.value = true;

        // debounce to batch rapid changes (e.g. drag reorder)
        if (persistDebounceTimer) clearTimeout(persistDebounceTimer);
        persistDebounceTimer = setTimeout(() => {
          persistChain = persistChain.then(async () => {
            syncing.value = true;
            try {
              await persistModel(model.value);
              // Keep unsynced=true in both dev and prod.
              // In dev: local file is saved but not pushed to GitHub yet.
              // In prod: staged in localStorage, not committed yet.
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Unable to save changes.";
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
        }, isDev ? 100 : 300);
      },
      { deep: true },
    );

    const repoLabel = computed(() => {
      const owner = githubSettings.value.owner;
      const repo = githubSettings.value.repo;
      return owner && repo ? `${owner}/${repo}` : "GitHub not configured";
    });

    const syncStatusText = computed(() => {
      if (syncing.value) {
        return isDev
          ? "Pushing to GitHub…"
          : `Syncing with GitHub · ${repoLabel.value}`;
      }
      if (unsynced.value) {
        return isDev
          ? "Uncommitted changes · Saved locally"
          : `Uncommitted changes · ${repoLabel.value}`;
      }
      if (isDev) {
        return "Up to date";
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
      if (unsynced.value) {
        return "bg-yellow-400 shadow-[0_0_0_4px_rgba(245,158,11,0.20)]";
      }
    });

    const togglePreviewMode = () => {
      previewMode.value = !previewMode.value;
    };

    const openGithubSettings = () => {
      githubDialogOpen.value = true;
    };

    return {
      isDev,
      model,
      cmsOpen,
      cmsBtnVisible,
      previewMode,
      enabledLinks,
      enabledSocials,
      initials,
      avatarSrc,
      onAvatarError,
      bannerSrc,
      onBannerError,
      socialIcon,
      exportJson,
      importOpen,
      importText,
      applyImport,
      updateModel,
      canUseCms,
      toggleCmsButton,
      githubDialogOpen,
      gitDialogOpen,
      performCommit,
      syncStatusText,
      syncIndicatorClass,
      togglePreviewMode,
      openGithubSettings,
      unsynced,
      resolveUploadUrl,
    };
  },
});
</script>