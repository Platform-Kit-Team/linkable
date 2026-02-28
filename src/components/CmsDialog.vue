<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="CMS"
    :style="{ width: 'min(980px, 96vw)' }"
    :contentStyle="{ overflow: 'hidden' }"
  >
    <div class="cms">
      <!-- Left nav -->
      <aside class="cms__nav">
        <button
          type="button"
          class="cms__tab"
          :class="{ 'is-active': tab === 'profile' }"
          @click="tab = 'profile'"
        >
          <span class="cms__tab-icon"><i class="pi pi-user" /></span>
          <span class="cms__tab-label">Profile</span>
          <span class="cms__tab-pill cms__tab-pill--ghost" aria-hidden="true">0</span>
        </button>

        <button
          type="button"
          class="cms__tab"
          :class="{ 'is-active': tab === 'links' }"
          @click="tab = 'links'"
        >
          <span class="cms__tab-icon"><i class="pi pi-link" /></span>
          <span class="cms__tab-label">Links</span>
          <span class="cms__tab-pill">{{ draft.links.length }}</span>
        </button>

        <button
          type="button"
          class="cms__tab"
          :class="{ 'is-active': tab === 'socials' }"
          @click="tab = 'socials'"
        >
          <span class="cms__tab-icon"><i class="pi pi-share-alt" /></span>
          <span class="cms__tab-label">Socials</span>
          <span class="cms__tab-pill">{{ draft.socials.length }}</span>
        </button>

        <div class="cms__nav-footer">
          <div class="cms__status" :class="{ 'is-dirty': hasChanges }">
            <span class="cms__dot" />
            <span>{{ hasChanges ? "Unsaved changes" : "Saved" }}</span>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="cms__main">
        <!-- Profile -->
        <section v-if="tab === 'profile'" class="cms__panel">
          <div class="cms__panel-head">
            <div class="cms__title">Profile</div>
            <div class="cms__sub">Edit your site name and description.</div>
          </div>

          <div class="cms__card">
            <div class="cms__form">
              <div class="cms__field">
                <label class="cms__label">Name</label>
                <InputText v-model="draft.profile.displayName" class="w-full" />
              </div>

              <div class="cms__field">
                <label class="cms__label">Description</label>
                <Textarea v-model="draft.profile.tagline" autoResize rows="4" class="w-full" />
              </div>

              <div class="cms__field">
                <label class="cms__label">Avatar URL (optional)</label>
                <InputText
                  v-model="draft.profile.avatarUrl"
                  class="w-full"
                  placeholder="https://..."
                />
                <div class="cms__help">If empty or invalid, initials will show.</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Links -->
        <section v-else-if="tab === 'links'" class="cms__panel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Links</div>
              <div class="cms__sub">Add, edit, and reorder your buttons.</div>
            </div>

            <Button rounded class="cms__primary" @click="createAndEditLink">
              <i class="pi pi-plus" />
              <span class="ml-2">Add link</span>
            </Button>
          </div>

          <div class="cms__card">
            <div v-if="draft.links.length === 0" class="cms__empty">
              <div class="cms__empty-title">No links yet</div>
              <div class="cms__empty-sub">Click “Add link” to create your first one.</div>
            </div>

            <draggable
              v-else
              v-model="draft.links"
              item-key="id"
              handle=".drag"
              :animation="160"
              class="cms__list"
            >
              <template #item="{ element }">
                <button type="button" class="cms__row" @click="openLinkEditor(element.id)">
                  <span class="cms__row-drag drag" aria-label="Drag">
                    <i class="pi pi-bars" />
                  </span>

                  <span class="cms__row-thumb">
                    <img
                      v-if="element.imageUrl"
                      :src="element.imageUrl"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                    <i v-else class="pi pi-link text-[color:var(--color-ink-soft)]" />
                  </span>

                  <span class="cms__row-text">
                    <span class="cms__row-title">{{ element.title || "Untitled" }}</span>
                    <span class="cms__row-sub">{{ element.url || "(no url)" }}</span>
                  </span>

                  <span class="cms__row-meta">
                    <Tag
                      v-if="!element.enabled"
                      severity="warning"
                      value="Hidden"
                      class="!rounded-full"
                    />
                    <i v-else class="pi pi-check-circle cms__ok" />
                    <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                  </span>
                </button>
              </template>
            </draggable>
          </div>
        </section>

        <!-- Socials -->
        <section v-else class="cms__panel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Social links</div>
              <div class="cms__sub">Add socials that show under your name.</div>
            </div>

            <Button rounded class="cms__primary" @click="createAndEditSocial">
              <i class="pi pi-plus" />
              <span class="ml-2">Add social</span>
            </Button>
          </div>

          <div class="cms__card">
            <div v-if="draft.socials.length === 0" class="cms__empty">
              <div class="cms__empty-title">No socials yet</div>
              <div class="cms__empty-sub">
                Add GitHub, Instagram, X, YouTube, TikTok, or Website.
              </div>
            </div>

            <div v-else class="cms__socialList">
              <button
                v-for="s in draft.socials"
                :key="s.id"
                type="button"
                class="cms__row"
                @click="openSocialEditor(s.id)"
              >
                <span class="cms__row-drag cms__row-drag--muted" aria-hidden="true">
                  <i class="pi" :class="primeSocialIcon(s.type)" />
                </span>

                <span class="cms__row-text">
                  <span class="cms__row-title">{{ s.label || socialLabel(s.type) }}</span>
                  <span class="cms__row-sub">{{ s.url || "(no url)" }}</span>
                </span>

                <span class="cms__row-meta">
                  <Tag v-if="!s.enabled" severity="warning" value="Hidden" class="!rounded-full" />
                  <i v-else class="pi pi-check-circle cms__ok" />
                  <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>

    <template #footer>
      <div class="cms__footer">
        <Button rounded severity="secondary" @click="visible = false">
          <i class="pi pi-times" />
          <span class="ml-2">Close</span>
        </Button>

        <div class="cms__footer-right">
          <Button rounded severity="secondary" :disabled="!hasChanges" @click="discard">
            <i class="pi pi-undo" />
            <span class="ml-2">Discard</span>
          </Button>

          <Button rounded class="cms__primary" :disabled="!hasChanges" @click="save">
            <i class="pi pi-check" />
            <span class="ml-2">Save</span>
          </Button>
        </div>
      </div>
    </template>

    <!-- Editors -->
    <LinkEditorDrawer
      v-if="activeLink"
      v-model:open="linkEditorOpen"
      v-model="activeLinkProxy"
      @delete="deleteActiveLink"
    />
    <SocialEditorDrawer
      v-if="activeSocial"
      v-model:open="socialEditorOpen"
      v-model="activeSocialProxy"
      @delete="deleteActiveSocial"
    />
  </Dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import draggable from "vuedraggable";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";

import LinkEditorDrawer from "./LinkEditorDrawer.vue";
import SocialEditorDrawer from "./SocialEditorDrawer.vue";
import {
  type BioLink,
  type BioModel,
  type SocialLink,
  defaultModel,
  newLink,
  newSocial,
  sanitizeModel,
  stableStringify,
} from "../lib/model";

export default defineComponent({
  name: "CmsDialog",
  components: {
    Dialog,
    Button,
    InputText,
    Textarea,
    Tag,
    draggable,
    LinkEditorDrawer,
    SocialEditorDrawer,
  },
  props: {
    open: { type: Boolean, required: true },
    model: { type: Object as () => BioModel, required: true },
  },
  emits: ["update:open", "update:model"],
  setup(props, { emit }) {
    const toast = useToast();

    const visible = ref(props.open);
    watch(
      () => props.open,
      (v) => (visible.value = v)
    );
    watch(visible, (v) => emit("update:open", v));

    const tab = ref<"profile" | "links" | "socials">("links");

    const draft = ref<BioModel>(sanitizeModel(props.model));
    watch(
      () => props.model,
      (m) => {
        draft.value = sanitizeModel(m);
      },
      { deep: true }
    );

    const hasChanges = computed(
      () =>
        stableStringify(sanitizeModel(draft.value)) !==
        stableStringify(sanitizeModel(props.model))
    );

    // --- Links editor
    const linkEditorOpen = ref(false);
    const activeLinkId = ref<string>("");

    const activeLink = computed<BioLink | null>(() => {
      const id = activeLinkId.value;
      if (!id) return null;
      return draft.value.links.find((l) => l.id === id) ?? null;
    });

    const activeLinkProxy = computed<BioLink>({
      get() {
        return activeLink.value ?? newLink();
      },
      set(v) {
        const idx = draft.value.links.findIndex((l) => l.id === v.id);
        if (idx >= 0) draft.value.links[idx] = v;
      },
    });

    const openLinkEditor = (id: string) => {
      activeLinkId.value = id;
      linkEditorOpen.value = true;
    };

    const createAndEditLink = () => {
      const l = newLink();
      l.subtitle = "";
      draft.value.links.unshift(l);
      activeLinkId.value = l.id;
      tab.value = "links";
      linkEditorOpen.value = true;
      toast.add({ severity: "success", summary: "Added", detail: "Link created.", life: 1600 });
    };

    const deleteActiveLink = () => {
      const l = activeLink.value;
      if (!l) return;
      draft.value.links = draft.value.links.filter((x) => x.id !== l.id);
      linkEditorOpen.value = false;
      activeLinkId.value = "";
      toast.add({ severity: "warn", summary: "Deleted", detail: "Link removed.", life: 1600 });
    };

    watch(linkEditorOpen, (open) => {
      if (!open) activeLinkId.value = "";
    });

    // --- Socials editor
    const socialEditorOpen = ref(false);
    const activeSocialId = ref<string>("");

    const activeSocial = computed<SocialLink | null>(() => {
      const id = activeSocialId.value;
      if (!id) return null;
      return draft.value.socials.find((s) => s.id === id) ?? null;
    });

    const activeSocialProxy = computed<SocialLink>({
      get() {
        return activeSocial.value ?? newSocial();
      },
      set(v) {
        const idx = draft.value.socials.findIndex((s) => s.id === v.id);
        if (idx >= 0) (draft.value.socials[idx] as any) = v as any;
      },
    });

    const openSocialEditor = (id: string) => {
      activeSocialId.value = id;
      socialEditorOpen.value = true;
    };

    const createAndEditSocial = () => {
      const s = newSocial();
      s.enabled = true;
      draft.value.socials.unshift(s);
      activeSocialId.value = s.id;
      tab.value = "socials";
      socialEditorOpen.value = true;
      toast.add({ severity: "success", summary: "Added", detail: "Social created.", life: 1600 });
    };

    const deleteActiveSocial = () => {
      const s = activeSocial.value;
      if (!s) return;
      draft.value.socials = draft.value.socials.filter((x) => x.id !== s.id);
      socialEditorOpen.value = false;
      activeSocialId.value = "";
      toast.add({ severity: "warn", summary: "Deleted", detail: "Social removed.", life: 1600 });
    };

    watch(socialEditorOpen, (open) => {
      if (!open) activeSocialId.value = "";
    });

    // Labels/icons
    const socialLabel = (type: string) => {
      const m: Record<string, string> = {
        website: "Website",
        github: "GitHub",
        instagram: "Instagram",
        x: "X",
        youtube: "YouTube",
        tiktok: "TikTok",
      };
      return m[type] ?? "Social";
    };

    const primeSocialIcon = (type: string) => {
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

    const discard = () => {
      draft.value = sanitizeModel(props.model);
      toast.add({ severity: "info", summary: "Discarded", detail: "Changes reverted.", life: 1600 });
    };

    const save = () => {
      emit("update:model", sanitizeModel(draft.value));
      visible.value = false;
      toast.add({ severity: "success", summary: "Saved", detail: "Your content was updated.", life: 1800 });
    };

    if (!draft.value) draft.value = defaultModel();

    return {
      visible,
      tab,
      draft,
      hasChanges,
      discard,
      save,

      // links
      linkEditorOpen,
      activeLink,
      activeLinkProxy,
      openLinkEditor,
      createAndEditLink,
      deleteActiveLink,

      // socials
      socialEditorOpen,
      activeSocial,
      activeSocialProxy,
      openSocialEditor,
      createAndEditSocial,
      deleteActiveSocial,

      // helpers
      socialLabel,
      primeSocialIcon,
    };
  },
});
</script>

<style scoped>
.cms {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 12px;
  height: min(72vh, 740px);
  min-height: 520px;
}

/* Stable layout: always reserve potential scrollbar space so widths don't jump */
.cms__main {
  scrollbar-gutter: stable both-edges;
  overflow-y: auto;
  overflow-x: hidden;
}

.cms__nav {
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr auto;
  padding: 10px;
}

/* Compact, consistent tabs (smaller + no extra vertical space) */
.cms__tab {
  width: 100%;
  height: 38px;
  display: grid;
  grid-template-columns: 30px 1fr 34px;
  gap: 10px;
  align-items: center;
  padding: 0 10px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(11, 18, 32, 0.88);
  font-weight: 950;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  margin-bottom: 6px;
  text-align: left;
}

.cms__tab:hover {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(11, 18, 32, 0.06);
}

.cms__tab.is-active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.24);
  box-shadow: 0 10px 28px rgba(11, 18, 32, 0.06);
}

.cms__tab-icon {
  height: 26px;
  width: 26px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  border: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.55);
  color: rgba(11, 18, 32, 0.58);
}

.cms__tab.is-active .cms__tab-icon {
  background: rgba(59, 130, 246, 0.14);
  border-color: rgba(59, 130, 246, 0.22);
  color: rgba(37, 99, 235, 0.95);
}

.cms__tab-label {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms__tab-pill {
  justify-self: end;
  min-width: 26px;
  height: 20px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  font-weight: 950;
  color: rgba(11, 18, 32, 0.62);
}

.cms__tab-pill--ghost {
  opacity: 0;
  pointer-events: none;
}

.cms__nav-footer {
  padding-top: 10px;
  border-top: 1px solid rgba(11, 18, 32, 0.06);
}

.cms__status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(11, 18, 32, 0.10);
  background: rgba(255, 255, 255, 0.55);
  color: rgba(11, 18, 32, 0.72);
  font-weight: 900;
  font-size: 12px;
}

.cms__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
}

.cms__status.is-dirty .cms__dot {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14);
}

/* Keep the rest of your existing styling as-is */
.cms__main {
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 14px;
}

.cms__panel-head {
  margin-bottom: 12px;
}
.cms__panel-head--row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.cms__title {
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: rgba(11, 18, 32, 0.96);
}

.cms__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 700;
}

.cms__card {
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  overflow: hidden;
  padding: 12px;
}

.cms__form {
  display: grid;
  gap: 12px;
}

.cms__field {
  display: grid;
  gap: 6px;
}

.cms__label {
  font-size: 12px;
  font-weight: 950;
  color: rgba(11, 18, 32, 0.70);
}

.cms__help {
  font-size: 12px;
  color: rgba(11, 18, 32, 0.60);
  font-weight: 650;
}

.cms__primary {
  border: 0 !important;
  background: var(--color-brand) !important;
  box-shadow: 0 16px 44px rgba(37, 99, 235, 0.22) !important;
}

.cms__list {
  display: grid;
  gap: 8px;
}

.cms__socialList {
  display: grid;
  gap: 8px;
}

.cms__row {
  width: 100%;
  text-align: left;
  display: grid;
  grid-template-columns: 34px 44px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 18px;
  border: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.cms__socialList .cms__row {
  grid-template-columns: 44px 1fr auto;
}

.cms__row:hover {
  background: rgba(255, 255, 255, 0.76);
  border-color: rgba(11, 18, 32, 0.10);
}

.cms__row-drag {
  height: 34px;
  width: 34px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  display: grid;
  place-items: center;
  color: rgba(11, 18, 32, 0.55);
}

.cms__row-drag--muted {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}

.cms__row-thumb {
  height: 44px;
  width: 44px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.cms__row-text {
  min-width: 0;
}

.cms__row-title {
  display: block;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: rgba(11, 18, 32, 0.92);
}

.cms__row-sub {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms__row-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cms__ok {
  color: #10b981;
}

.cms__empty {
  padding: 16px 12px;
  text-align: center;
}
.cms__empty-title {
  font-weight: 950;
  letter-spacing: -0.02em;
}
.cms__empty-sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

.cms__footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cms__footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 820px) {
  .cms {
    grid-template-columns: 1fr;
    height: min(80vh, 820px);
    min-height: 560px;
  }
  .cms__nav {
    grid-template-rows: auto;
    display: flex;
    gap: 8px;
    overflow: auto;
    align-items: center;
    padding: 10px;
  }
  .cms__tab {
    margin: 0;
    min-width: 142px;
    height: 36px;
    grid-template-columns: 28px 1fr 32px;
  }
  .cms__tab-icon {
    height: 24px;
    width: 24px;
    border-radius: 10px;
  }
  .cms__nav-footer {
    display: none;
  }
}
</style>