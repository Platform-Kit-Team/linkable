<template>
  <div class="min-h-dvh">
    <header class="mx-auto w-full max-w-[740px] px-4 pt-6 sm:pt-10">
      <div
        class="glass rounded-[var(--radius-xl)] p-4 sm:p-6"
      >
        <div class="flex items-start gap-4">
          <div
            class="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-sm backdrop-blur-md"
          >
            <img
              v-if="model.profile.avatarUrl"
              :src="model.profile.avatarUrl"
              alt="Avatar"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="grid h-full w-full place-items-center text-sm font-semibold text-[color:var(--color-ink-soft)]"
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
                  severity="secondary"
                  rounded
                  class="!px-3"
                  @click="previewMode = !previewMode"
                >
                  <i class="pi" :class="previewMode ? 'pi-pencil' : 'pi-eye'" />
                  <span class="ml-2 hidden sm:inline">{{ previewMode ? "Edit" : "Preview" }}</span>
                </Button>
                <Button
                  rounded
                  class="!border-0 !bg-[color:var(--color-brand)] shadow-[0_14px_36px_rgba(99,102,241,0.28)]"
                  @click="cmsOpen = true"
                >
                  <i class="pi pi-sliders-h" />
                  <span class="ml-2 hidden sm:inline">CMS</span>
                </Button>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <a
                v-for="s in enabledSocials"
                :key="s.id"
                class="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/45 px-3 py-1.5 text-xs font-medium text-[color:var(--color-ink)] shadow-sm backdrop-blur-md transition hover:bg-white/60"
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
              <span class="h-2 w-2 rounded-full bg-[color:var(--color-brand-2)] shadow-[0_0_0_4px_rgba(34,197,94,0.18)]"></span>
              <span>Static site · Saved locally</span>
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button
              v-if="!previewMode"
              rounded
              severity="secondary"
              class="!px-3"
              @click="exportJson"
            >
              <i class="pi pi-download" />
              <span class="ml-2 hidden sm:inline">Export</span>
            </Button>
            <Button
              v-if="!previewMode"
              rounded
              severity="secondary"
              class="!px-3"
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
        <div class="grid gap-2">
          <a
            v-for="link in enabledLinks"
            :key="link.id"
            class="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/50 px-4 py-3 shadow-sm backdrop-blur-md transition hover:bg-white/65 hover:shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
            :href="link.url"
            target="_blank"
            rel="noreferrer"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span
                  class="grid h-9 w-9 place-items-center rounded-xl border border-white/60 bg-white/55 text-sm shadow-sm backdrop-blur-md"
                >
                  <i class="pi" :class="linkIcon(link.icon)" />
                </span>
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold">{{ link.title }}</div>
                  <div
                    v-if="link.subtitle"
                    class="truncate text-xs text-[color:var(--color-ink-soft)]"
                  >
                    {{ link.subtitle }}
                  </div>
                </div>
              </div>
            </div>
            <i
              class="pi pi-arrow-right text-[color:var(--color-ink-soft)] transition group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <div v-if="enabledLinks.length === 0" class="p-6 text-center">
          <div class="text-sm font-semibold">No links yet</div>
          <div class="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            Open the CMS and add your first button.
          </div>
          <Button
            rounded
            class="mt-4 !border-0 !bg-[color:var(--color-brand)] shadow-[0_14px_36px_rgba(99,102,241,0.28)]"
            @click="cmsOpen = true"
            >Add links</Button
          >
        </div>
      </section>

      <footer class="mt-6 text-center text-xs text-[color:var(--color-ink-soft)]">
        <div class="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-3 py-1.5 shadow-sm backdrop-blur-md">
          <span class="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_0_4px_rgba(251,113,133,0.16)]"></span>
          <span>Tip: drag links in the CMS to reorder.</span>
        </div>
      </footer>
    </main>

    <CmsDialog
      v-model:open="cmsOpen"
      :model="model"
      @update:model="(m) => (model = m)"
    />

    <Dialog v-model:visible="importOpen" modal header="Import JSON" :style="{ width: 'min(680px, 92vw)' }">
      <div class="space-y-3">
        <p class="text-sm text-[color:var(--color-ink-soft)]">
          Paste an exported JSON to restore your profile/links.
        </p>
        <Textarea v-model="importText" autoResize rows="7" class="w-full" />
        <div class="flex justify-end gap-2">
          <Button severity="secondary" rounded @click="importOpen = false">Cancel</Button>
          <Button rounded class="!border-0 !bg-[color:var(--color-brand)] shadow-[0_14px_36px_rgba(99,102,241,0.28)]" @click="applyImport"
            >Import</Button
          >
        </div>
      </div>
    </Dialog>

    <Toast />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { computed, ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";

import CmsDialog from "./components/CmsDialog.vue";
import {
  defaultModel,
  type BioModel,
  sanitizeModel,
  stableStringify,
} from "./lib/model";

export default defineComponent({
  name: "App",
  components: {
    Button,
    Dialog,
    Textarea,
    Toast,
    CmsDialog,
  },
  setup() {
    const toast = useToast();

    const stored = useLocalStorage<BioModel>("libio:model", defaultModel(), {
      serializer: {
        read: (v: string) => {
          try {
            return sanitizeModel(JSON.parse(v));
          } catch {
            return defaultModel();
          }
        },
        write: (v: BioModel) => stableStringify(v),
      },
    });

    const model = ref<BioModel>(stored.value);
    watch(
      model,
      (m) => {
        stored.value = sanitizeModel(m);
      },
      { deep: true }
    );

    const cmsOpen = ref(false);
    const previewMode = ref(true);

    const enabledLinks = computed(() => model.value.links.filter((l) => l.enabled));
    const enabledSocials = computed(() => model.value.socials.filter((s) => s.enabled && s.url));

    const initials = computed(() => {
      const name = (model.value.profile.displayName || "").trim();
      if (!name) return "LB";
      const parts = name.split(/\s+/).slice(0, 2);
      return parts.map((p) => (p[0] || "").toUpperCase()).join("");
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
        case "website":
        default:
          return "pi-globe";
      }
    };

    const linkIcon = (icon: string) => {
      switch (icon) {
        case "sparkle":
          return "pi-star";
        case "shop":
          return "pi-shopping-bag";
        case "music":
          return "pi-volume-up";
        case "video":
          return "pi-play";
        case "mail":
          return "pi-envelope";
        case "calendar":
          return "pi-calendar";
        case "doc":
          return "pi-file";
        case "link":
        default:
          return "pi-link";
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

    const applyImport = () => {
      try {
        const parsed = sanitizeModel(JSON.parse(importText.value));
        model.value = parsed;
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
          detail: "Please paste a valid export.",
          life: 2600,
        });
      }
    };

    return {
      model,
      cmsOpen,
      previewMode,
      enabledLinks,
      enabledSocials,
      initials,
      socialIcon,
      linkIcon,
      exportJson,
      importOpen,
      importText,
      applyImport,
    };
  },
});
</script>