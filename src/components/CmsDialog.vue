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
          class="cms__nav-item"
          :class="{ 'is-active': tab === 'profile' }"
          @click="tab = 'profile'"
        >
          <i class="pi pi-user" />
          <span>Profile</span>
        </button>
        <button
          type="button"
          class="cms__nav-item"
          :class="{ 'is-active': tab === 'links' }"
          @click="tab = 'links'"
        >
          <i class="pi pi-link" />
          <span>Links</span>
          <span class="cms__pill">{{ draft.links.length }}</span>
        </button>
        <button
          type="button"
          class="cms__nav-item"
          :class="{ 'is-active': tab === 'socials' }"
          @click="tab = 'socials'"
        >
          <i class="pi pi-share-alt" />
          <span>Socials</span>
          <span class="cms__pill">{{ draft.socials.length }}</span>
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
              <InputText v-model="draft.profile.avatarUrl" class="w-full" placeholder="https://..." />
              <div class="cms__help">If empty or invalid, initials will show.</div>
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

            <Button rounded class="cms__primary" @click="addLink">
              <i class="pi pi-plus" />
              <span class="ml-2">Add link</span>
            </Button>
          </div>

          <div class="cms__split">
            <div class="cms__list">
              <draggable
                v-model="draft.links"
                item-key="id"
                handle=".drag"
                :animation="160"
                class="cms__list-inner"
              >
                <template #item="{ element }">
                  <button
                    type="button"
                    class="cms__row"
                    :class="{ 'is-active': selectedLinkId === element.id }"
                    @click="selectedLinkId = element.id"
                  >
                    <span class="cms__row-drag drag" aria-label="Drag">
                      <i class="pi pi-bars" />
                    </span>

                    <span class="cms__row-text">
                      <span class="cms__row-title">{{ element.title || "Untitled" }}</span>
                      <span class="cms__row-sub">{{ element.url || "(no url)" }}</span>
                    </span>

                    <span class="cms__row-meta">
                      <Tag v-if="!element.enabled" severity="warning" value="Hidden" class="!rounded-full" />
                      <i v-else class="pi pi-check-circle cms__ok" />
                    </span>
                  </button>
                </template>
              </draggable>

              <div v-if="draft.links.length === 0" class="cms__empty">
                <div class="cms__empty-title">No links yet</div>
                <div class="cms__empty-sub">Click “Add link” to create your first one.</div>
              </div>
            </div>

            <div class="cms__editor">
              <div v-if="selectedLink" class="cms__form">
                <div class="cms__field">
                  <label class="cms__label">Title</label>
                  <InputText v-model="selectedLink.title" class="w-full" />
                </div>

                <div class="cms__field">
                  <label class="cms__label">Description (optional)</label>
                  <InputText v-model="selectedLink.subtitle" class="w-full" placeholder="Short helper text…" />
                </div>

                <div class="cms__field">
                  <label class="cms__label">URL</label>
                  <InputText v-model="selectedLink.url" class="w-full" placeholder="https://..." />
                </div>

                <div class="cms__field">
                  <label class="cms__label">Thumbnail image URL (optional)</label>
                  <InputText v-model="selectedLink.imageUrl" class="w-full" placeholder="https://..." />
                </div>

                <div class="cms__inline">
                  <div class="cms__inline-item">
                    <span class="cms__label">Enabled</span>
                    <ToggleSwitch v-model="selectedLink.enabled" />
                  </div>

                  <Button rounded text severity="danger" @click="removeSelectedLink">
                    <i class="pi pi-trash" />
                    <span class="ml-2">Delete</span>
                  </Button>
                </div>
              </div>

              <div v-else class="cms__empty cms__empty--soft">
                <div class="cms__empty-title">Select a link</div>
                <div class="cms__empty-sub">Choose a link on the left to edit it.</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Socials -->
        <section v-else class="cms__panel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Social links</div>
              <div class="cms__sub">
                Choose a type for automatic icons, or provide a Lucide icon name override.
              </div>
            </div>

            <Button rounded class="cms__primary" @click="addSocial">
              <i class="pi pi-plus" />
              <span class="ml-2">Add social</span>
            </Button>
          </div>

          <div class="cms__socials">
            <div v-for="(s, i) in draft.socials" :key="s.id" class="cms__card">
              <div class="cms__card-top">
                <div class="cms__card-title">
                  <span class="cms__chip">
                    <i class="pi" :class="primeSocialIcon(s.type)" />
                  </span>
                  <span>{{ socialLabel(s.type) }}</span>
                </div>

                <Button rounded text severity="danger" @click="removeSocial(i)">
                  <i class="pi pi-trash" />
                  <span class="ml-2">Delete</span>
                </Button>
              </div>

              <div class="cms__grid">
                <div class="cms__field">
                  <label class="cms__label">Type</label>
                  <Dropdown
                    v-model="s.type"
                    :options="socialTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>

                <div class="cms__field">
                  <label class="cms__label">Label</label>
                  <InputText v-model="s.label" class="w-full" placeholder="e.g. @yourname" />
                </div>

                <div class="cms__field cms__field--wide">
                  <label class="cms__label">URL</label>
                  <InputText v-model="s.url" class="w-full" placeholder="https://..." />
                </div>

                <div class="cms__field">
                  <label class="cms__label">Lucide icon override (optional)</label>
                  <InputText v-model="(s as any).lucideIcon" class="w-full" placeholder="e.g. Github, Instagram, Globe" />
                  <div class="cms__help">
                    This is stored in your JSON, but your public page currently uses automatic icons.
                  </div>
                </div>

                <div class="cms__inline cms__field--wide">
                  <div class="cms__inline-item">
                    <span class="cms__label">Enabled</span>
                    <ToggleSwitch v-model="s.enabled" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="draft.socials.length === 0" class="cms__empty">
              <div class="cms__empty-title">No socials yet</div>
              <div class="cms__empty-sub">Add GitHub, Instagram, X, YouTube, TikTok, or Website.</div>
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
  </Dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import draggable from "vuedraggable";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";

import { type BioModel, defaultModel, newLink, newSocial, sanitizeModel, stableStringify } from "../lib/model";

export default defineComponent({
  name: "CmsDialog",
  components: {
    Dialog,
    Button,
    Dropdown,
    InputText,
    Textarea,
    Tag,
    ToggleSwitch,
    draggable,
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

    const hasChanges = computed(() => stableStringify(sanitizeModel(draft.value)) !== stableStringify(sanitizeModel(props.model)));

    // Links
    const selectedLinkId = ref<string>("");

    watch(
      () => draft.value.links,
      (links) => {
        if (!selectedLinkId.value) selectedLinkId.value = links[0]?.id || "";
        if (selectedLinkId.value && !links.some((l) => l.id === selectedLinkId.value)) {
          selectedLinkId.value = links[0]?.id || "";
        }
      },
      { deep: true, immediate: true }
    );

    const selectedLink = computed(() => draft.value.links.find((l) => l.id === selectedLinkId.value) ?? null);

    const addLink = () => {
      const l = newLink();
      // Rename "subtitle" to act as the requested optional description field.
      l.subtitle = "";
      draft.value.links.unshift(l);
      selectedLinkId.value = l.id;
      tab.value = "links";
      toast.add({ severity: "success", summary: "Added", detail: "Link created.", life: 1800 });
    };

    const removeSelectedLink = () => {
      const l = selectedLink.value;
      if (!l) return;
      const idx = draft.value.links.findIndex((x) => x.id === l.id);
      if (idx >= 0) {
        draft.value.links.splice(idx, 1);
        toast.add({ severity: "warn", summary: "Deleted", detail: "Link removed.", life: 1800 });
      }
    };

    // Socials
    const socialTypeOptions = [
      { label: "Website", value: "website" },
      { label: "GitHub", value: "github" },
      { label: "Instagram", value: "instagram" },
      { label: "X", value: "x" },
      { label: "YouTube", value: "youtube" },
      { label: "TikTok", value: "tiktok" },
    ];

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

    const addSocial = () => {
      draft.value.socials.unshift(newSocial());
      tab.value = "socials";
      toast.add({ severity: "success", summary: "Added", detail: "Social created.", life: 1800 });
    };

    const removeSocial = (index: number) => {
      draft.value.socials.splice(index, 1);
      toast.add({ severity: "warn", summary: "Deleted", detail: "Social removed.", life: 1800 });
    };

    const discard = () => {
      draft.value = sanitizeModel(props.model);
      toast.add({ severity: "info", summary: "Discarded", detail: "Changes reverted.", life: 1800 });
    };

    const save = () => {
      emit("update:model", sanitizeModel(draft.value));
      visible.value = false;
      toast.add({ severity: "success", summary: "Saved", detail: "Your content was updated.", life: 2000 });
    };

    // If user wipes everything somehow, keep UI usable
    watch(
      () => draft.value,
      (m) => {
        if (!m.profile?.displayName && !m.profile?.tagline && m.links.length === 0 && m.socials.length === 0) {
          // do nothing; valid state
        }
      },
      { deep: true }
    );

    // Safety: ensure draft always exists (never used, but avoids null edge)
    if (!draft.value) draft.value = defaultModel();

    return {
      visible,
      tab,
      draft,
      hasChanges,
      selectedLinkId,
      selectedLink,
      addLink,
      removeSelectedLink,
      socialTypeOptions,
      socialLabel,
      primeSocialIcon,
      addSocial,
      removeSocial,
      discard,
      save,
    };
  },
});
</script>

<style scoped>
.cms {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 12px;
  height: min(72vh, 720px);
  min-height: 520px;
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

.cms__nav-item {
  width: 100%;
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 16px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(11, 18, 32, 0.88);
  font-weight: 900;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
  margin-bottom: 8px;
}

.cms__nav-item:hover {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(11, 18, 32, 0.06);
}

.cms__nav-item.is-active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.24);
}

.cms__pill {
  font-size: 12px;
  font-weight: 950;
  color: rgba(11, 18, 32, 0.62);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
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

.cms__main {
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  overflow: auto;
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

.cms__split {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  align-items: start;
}

.cms__list,
.cms__editor {
  border-radius: 20px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  overflow: hidden;
}

.cms__list {
  height: 520px;
  overflow: auto;
}

.cms__list-inner {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.cms__row {
  width: 100%;
  text-align: left;
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 18px;
  border: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.cms__row:hover {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(11, 18, 32, 0.08);
}

.cms__row.is-active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.24);
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

.cms__ok {
  color: #10b981;
}

.cms__editor {
  padding: 12px;
}

.cms__inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cms__inline-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cms__socials {
  display: grid;
  gap: 12px;
}

.cms__card {
  border-radius: 20px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  padding: 12px;
}

.cms__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cms__card-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 950;
  letter-spacing: -0.02em;
}

.cms__chip {
  height: 34px;
  width: 34px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  color: rgba(11, 18, 32, 0.55);
}

.cms__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.cms__field--wide {
  grid-column: 1 / -1;
}

.cms__empty {
  padding: 16px 12px;
  text-align: center;
}
.cms__empty--soft {
  border-radius: 18px;
  border: 1px dashed rgba(11, 18, 32, 0.14);
  background: rgba(255, 255, 255, 0.45);
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
    height: min(78vh, 760px);
    min-height: 540px;
  }
  .cms__nav {
    grid-template-rows: auto;
    display: flex;
    gap: 8px;
    overflow: auto;
    align-items: center;
  }
  .cms__nav-item {
    margin: 0;
    min-width: 150px;
  }
  .cms__nav-footer {
    display: none;
  }
  .cms__split {
    grid-template-columns: 1fr;
  }
  .cms__list {
    height: auto;
    max-height: 260px;
  }
  .cms__grid {
    grid-template-columns: 1fr;
  }
}
</style>