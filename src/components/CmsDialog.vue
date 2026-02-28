<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Content Manager"
    :style="{ width: 'min(1160px, 96vw)' }"
    :contentStyle="{ overflow: 'hidden' }"
  >
    <div class="cms-shell">
      <!-- Left: Navigation / Collections -->
      <aside class="cms-sidebar">
        <div class="cms-sidebar-header">
          <div class="cms-title">
            <div class="cms-title__kicker">Local CMS</div>
            <div class="cms-title__main">Nova Bio</div>
          </div>

          <div class="cms-actions">
            <Button
              rounded
              severity="secondary"
              class="cms-btn"
              :disabled="!hasChanges"
              @click="discard"
              v-tooltip.bottom="'Discard unsaved changes'"
            >
              <i class="pi pi-undo" />
              <span class="cms-btn__label">Discard</span>
            </Button>
            <Button
              rounded
              class="cms-btn cms-btn--primary"
              :disabled="!hasChanges"
              @click="save"
              v-tooltip.bottom="'Save changes'"
            >
              <i class="pi pi-check" />
              <span class="cms-btn__label">Save</span>
            </Button>
          </div>
        </div>

        <div class="cms-nav">
          <button
            type="button"
            class="cms-nav-item"
            :class="{ 'is-active': section === 'profile' }"
            @click="section = 'profile'"
          >
            <i class="pi pi-user" />
            <span>Profile</span>
            <span class="cms-nav-item__meta">1</span>
          </button>

          <button
            type="button"
            class="cms-nav-item"
            :class="{ 'is-active': section === 'links' }"
            @click="section = 'links'"
          >
            <i class="pi pi-link" />
            <span>Links</span>
            <span class="cms-nav-item__meta">{{ draft.links.length }}</span>
          </button>

          <button
            type="button"
            class="cms-nav-item"
            :class="{ 'is-active': section === 'socials' }"
            @click="section = 'socials'"
          >
            <i class="pi pi-share-alt" />
            <span>Social</span>
            <span class="cms-nav-item__meta">{{ draft.socials.length }}</span>
          </button>

          <div class="cms-nav-sep" />

          <button
            type="button"
            class="cms-nav-item"
            :class="{ 'is-active': section === 'settings' }"
            @click="section = 'settings'"
          >
            <i class="pi pi-cog" />
            <span>Tools</span>
          </button>
        </div>

        <div class="cms-sidebar-footer">
          <div class="cms-hint">
            <div class="cms-hint__dot" />
            <div class="cms-hint__text">
              <div class="cms-hint__title">Saved locally</div>
              <div class="cms-hint__sub">No account · No backend</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Middle: Editor -->
      <main class="cms-main">
        <div class="cms-main-top">
          <div class="cms-breadcrumb">
            <span class="cms-breadcrumb__label">Content</span>
            <i class="pi pi-angle-right" />
            <span class="cms-breadcrumb__value">{{ sectionLabel }}</span>
          </div>

          <div class="cms-main-top-actions">
            <Button
              v-if="section === 'links'"
              rounded
              severity="secondary"
              class="cms-btn"
              @click="addLink"
            >
              <i class="pi pi-plus" />
              <span class="cms-btn__label">New link</span>
            </Button>
            <Button
              v-if="section === 'socials'"
              rounded
              severity="secondary"
              class="cms-btn"
              @click="addSocial"
            >
              <i class="pi pi-plus" />
              <span class="cms-btn__label">New social</span>
            </Button>
          </div>
        </div>

        <div class="cms-main-body">
          <!-- Profile -->
          <section v-if="section === 'profile'" class="cms-panel">
            <div class="cms-panel__header">
              <div class="cms-panel__title">Profile</div>
              <div class="cms-panel__sub">
                These fields appear at the top of your page.
              </div>
            </div>

            <div class="cms-form">
              <div class="cms-field">
                <label class="cms-label">Display name</label>
                <InputText v-model="draft.profile.displayName" class="w-full" />
                <div class="cms-help">Max 80 characters.</div>
              </div>

              <div class="cms-field">
                <label class="cms-label">Tagline</label>
                <Textarea v-model="draft.profile.tagline" autoResize rows="3" class="w-full" />
                <div class="cms-help">Max 140 characters.</div>
              </div>

              <div class="cms-field">
                <label class="cms-label">Avatar image URL</label>
                <InputText v-model="draft.profile.avatarUrl" class="w-full" placeholder="https://..." />
                <div class="cms-help">Use a square-ish image for best results.</div>

                <div class="cms-avatar-preview">
                  <div class="cms-avatar">
                    <img
                      v-if="avatarPreviewSrc"
                      :src="avatarPreviewSrc"
                      alt="Avatar preview"
                      class="cms-avatar__img"
                      @error="onAvatarPreviewError"
                    />
                    <div v-else class="cms-avatar__fallback">
                      {{ initials }}
                    </div>
                  </div>

                  <div class="cms-avatar-meta">
                    <div class="cms-avatar-meta__title">Preview</div>
                    <div class="cms-avatar-meta__sub">
                      {{ avatarPreviewSrc ? "Loaded from URL" : "Using initials fallback" }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Links -->
          <section v-else-if="section === 'links'" class="cms-split">
            <div class="cms-collection">
              <div class="cms-collection__top">
                <div class="cms-collection__title">Links</div>
                <div class="cms-collection__sub">Drag to reorder · Click to edit</div>
              </div>

              <span class="p-input-icon-left cms-search">
                <i class="pi pi-search" />
                <InputText v-model="linkQuery" placeholder="Search links…" class="w-full" />
              </span>

              <div class="cms-list">
                <draggable
                  v-model="draft.links"
                  item-key="id"
                  handle=".drag"
                  :animation="170"
                  class="cms-list-inner"
                >
                  <template #item="{ element, index }">
                    <button
                      type="button"
                      class="cms-row"
                      :class="{ 'is-active': selectedLinkId === element.id }"
                      @click="selectLink(element.id)"
                    >
                      <span class="cms-row__drag drag" aria-label="Drag">
                        <i class="pi pi-bars" />
                      </span>

                      <span class="cms-row__main">
                        <span class="cms-row__title">
                          {{ element.title || "Untitled" }}
                        </span>
                        <span class="cms-row__sub">
                          {{ element.url || "(no url)" }}
                        </span>
                      </span>

                      <span class="cms-row__meta">
                        <Tag
                          v-if="!element.enabled"
                          severity="warning"
                          value="Hidden"
                          class="!rounded-full"
                        />
                        <i v-else class="pi pi-check-circle cms-row__ok" />
                      </span>
                    </button>
                  </template>
                </draggable>

                <div v-if="draft.links.length === 0" class="cms-empty">
                  <div class="cms-empty__title">No links yet</div>
                  <div class="cms-empty__sub">Create your first button to get started.</div>
                  <Button rounded class="cms-btn cms-btn--primary mt-3" @click="addLink">
                    <i class="pi pi-plus" />
                    <span class="cms-btn__label">New link</span>
                  </Button>
                </div>
              </div>
            </div>

            <div class="cms-editor">
              <div class="cms-panel__header">
                <div class="cms-panel__title">Edit link</div>
                <div class="cms-panel__sub">
                  Fields update the live preview on the right.
                </div>
              </div>

              <div v-if="selectedLink" class="cms-form">
                <div class="cms-field">
                  <label class="cms-label">Title</label>
                  <InputText v-model="selectedLink.title" class="w-full" />
                </div>

                <div class="cms-field">
                  <label class="cms-label">Subtitle</label>
                  <InputText v-model="selectedLink.subtitle" class="w-full" placeholder="Optional" />
                </div>

                <div class="cms-field">
                  <label class="cms-label">URL</label>
                  <InputText v-model="selectedLink.url" class="w-full" placeholder="https://..." />
                  <div class="cms-help">Must start with http(s).</div>
                </div>

                <div class="cms-field">
                  <label class="cms-label">Image URL (optional)</label>
                  <InputText v-model="selectedLink.imageUrl" class="w-full" placeholder="https://..." />
                  <div class="cms-help">Shown as the left thumbnail on the button.</div>
                </div>

                <div class="cms-inline">
                  <div class="cms-inline__item">
                    <span class="cms-inline__label">Enabled</span>
                    <ToggleSwitch v-model="selectedLink.enabled" />
                  </div>

                  <Button rounded text severity="danger" class="cms-danger" @click="removeSelectedLink">
                    <i class="pi pi-trash" />
                    <span class="ml-2">Delete</span>
                  </Button>
                </div>

                <div class="cms-card-preview">
                  <div class="cms-card-preview__title">Card preview</div>
                  <div class="cms-card">
                    <div class="cms-card__thumb">
                      <img
                        v-if="selectedLink.imageUrl"
                        :src="selectedLink.imageUrl"
                        alt=""
                        class="cms-card__img"
                        @error="onSelectedLinkImageError"
                      />
                      <i v-else class="pi pi-link cms-card__icon" />
                    </div>
                    <div class="cms-card__body">
                      <div class="cms-card__name">{{ selectedLink.title || "Untitled" }}</div>
                      <div class="cms-card__sub">
                        {{ selectedLink.subtitle || selectedLink.url || "" }}
                      </div>
                    </div>
                    <i class="pi pi-arrow-right cms-card__arrow" />
                  </div>
                  <div v-if="selectedLinkImageErrored" class="cms-help mt-2">
                    That image couldn’t be loaded — it will fall back to the icon.
                  </div>
                </div>
              </div>

              <div v-else class="cms-empty cms-empty--soft">
                <div class="cms-empty__title">Select a link</div>
                <div class="cms-empty__sub">Pick an item from the list to edit it.</div>
              </div>
            </div>
          </section>

          <!-- Socials -->
          <section v-else-if="section === 'socials'" class="cms-panel">
            <div class="cms-panel__header">
              <div class="cms-panel__title">Social chips</div>
              <div class="cms-panel__sub">Shown under your name (optional).</div>
            </div>

            <div class="cms-form">
              <div class="cms-grid">
                <div
                  v-for="(s, i) in draft.socials"
                  :key="s.id"
                  class="cms-block"
                >
                  <div class="cms-block__top">
                    <div class="cms-block__title">Social</div>
                    <Button rounded text severity="danger" class="cms-danger" @click="removeSocial(i)">
                      <i class="pi pi-trash" />
                      <span class="ml-2">Delete</span>
                    </Button>
                  </div>

                  <div class="cms-field">
                    <label class="cms-label">Type</label>
                    <Dropdown
                      v-model="s.type"
                      :options="socialTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                  </div>

                  <div class="cms-field">
                    <label class="cms-label">Label</label>
                    <InputText v-model="s.label" class="w-full" placeholder="e.g. @yourname" />
                  </div>

                  <div class="cms-field">
                    <label class="cms-label">URL</label>
                    <InputText v-model="s.url" class="w-full" placeholder="https://..." />
                  </div>

                  <div class="cms-inline">
                    <div class="cms-inline__item">
                      <span class="cms-inline__label">Enabled</span>
                      <ToggleSwitch v-model="s.enabled" />
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="draft.socials.length === 0" class="cms-empty">
                <div class="cms-empty__title">No socials yet</div>
                <div class="cms-empty__sub">Add chips like Instagram, GitHub, or Website.</div>
                <Button rounded class="cms-btn cms-btn--primary mt-3" @click="addSocial">
                  <i class="pi pi-plus" />
                  <span class="cms-btn__label">New social</span>
                </Button>
              </div>
            </div>
          </section>

          <!-- Tools -->
          <section v-else class="cms-panel">
            <div class="cms-panel__header">
              <div class="cms-panel__title">Tools</div>
              <div class="cms-panel__sub">Reset, export, and import your content.</div>
            </div>

            <div class="cms-tools">
              <div class="cms-tool">
                <div class="cms-tool__title">Reset to defaults</div>
                <div class="cms-tool__sub">Start fresh with the starter content.</div>
                <Button rounded severity="secondary" class="cms-btn" @click="resetToDefaults">
                  <i class="pi pi-refresh" />
                  <span class="cms-btn__label">Reset</span>
                </Button>
              </div>

              <div class="cms-tool">
                <div class="cms-tool__title">Export JSON</div>
                <div class="cms-tool__sub">Copies your content to clipboard.</div>
                <Button rounded severity="secondary" class="cms-btn" @click="exportJson">
                  <i class="pi pi-download" />
                  <span class="cms-btn__label">Export</span>
                </Button>
              </div>

              <div class="cms-tool">
                <div class="cms-tool__title">Import JSON</div>
                <div class="cms-tool__sub">Paste a previous export to restore.</div>
                <Button rounded class="cms-btn cms-btn--primary" @click="importOpen = true">
                  <i class="pi pi-upload" />
                  <span class="cms-btn__label">Import</span>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- Right: Live Preview -->
      <aside class="cms-preview">
        <div class="cms-preview__top">
          <div class="cms-preview__title">Live preview</div>
          <div class="cms-preview__sub">Matches your public page layout.</div>
        </div>

        <div class="cms-preview__body">
          <div class="cms-preview-card">
            <div class="cms-preview-profile">
              <div class="cms-preview-avatar">
                <img
                  v-if="avatarPreviewSrc"
                  :src="avatarPreviewSrc"
                  alt="Avatar"
                  class="cms-preview-avatar__img"
                  @error="onAvatarPreviewError"
                />
                <div v-else class="cms-preview-avatar__fallback">{{ initials }}</div>
              </div>
              <div class="min-w-0">
                <div class="cms-preview-name">
                  {{ draft.profile.displayName || "Your Name" }}
                </div>
                <div class="cms-preview-tagline">
                  {{ draft.profile.tagline || "Add a short tagline in the CMS." }}
                </div>
              </div>
            </div>

            <div class="cms-preview-chips">
              <span
                v-for="s in draft.socials.filter((x) => x.enabled && x.url)"
                :key="s.id"
                class="cms-chip"
              >
                <i class="pi" :class="socialIcon(s.type)" />
                <span class="cms-chip__text">{{ s.label || s.url }}</span>
              </span>
            </div>

            <div class="cms-preview-links">
              <div
                v-for="l in draft.links.filter((x) => x.enabled)"
                :key="l.id"
                class="cms-preview-link"
              >
                <div class="cms-preview-link__thumb">
                  <img
                    v-if="l.imageUrl"
                    :src="l.imageUrl"
                    alt=""
                    class="cms-preview-link__img"
                    loading="lazy"
                  />
                  <i v-else class="pi pi-link cms-preview-link__icon" />
                </div>
                <div class="min-w-0">
                  <div class="cms-preview-link__title">{{ l.title || "Untitled" }}</div>
                  <div class="cms-preview-link__sub">
                    {{ l.subtitle || "" }}
                  </div>
                </div>
                <i class="pi pi-arrow-right cms-preview-link__arrow" />
              </div>

              <div v-if="draft.links.filter((x) => x.enabled).length === 0" class="cms-preview-empty">
                No enabled links.
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <template #footer>
      <div class="cms-footer">
        <Button rounded severity="secondary" class="cms-btn" @click="visible = false">
          <i class="pi pi-times" />
          <span class="cms-btn__label">Close</span>
        </Button>

        <div class="cms-footer__right">
          <div class="cms-status" :class="{ 'is-dirty': hasChanges }">
            <span class="cms-status__dot" />
            <span class="cms-status__text">{{ hasChanges ? "Unsaved changes" : "All changes saved" }}</span>
          </div>

          <Button
            rounded
            class="cms-btn cms-btn--primary"
            :disabled="!hasChanges"
            @click="save"
          >
            <i class="pi pi-check" />
            <span class="cms-btn__label">Save</span>
          </Button>
        </div>
      </div>
    </template>
  </Dialog>

  <Dialog
    v-model:visible="importOpen"
    modal
    header="Import JSON"
    :style="{ width: 'min(720px, 94vw)' }"
  >
    <div class="space-y-3">
      <p class="text-sm text-[color:var(--color-ink-soft)]">
        Paste an exported JSON to restore your profile/links.
      </p>
      <Textarea v-model="importText" autoResize rows="8" class="w-full" />
      <div class="flex justify-end gap-2">
        <Button severity="secondary" rounded @click="importOpen = false">Cancel</Button>
        <Button rounded class="cms-btn--primary !border-0 !px-4 !py-2.5" @click="applyImport">
          Import
        </Button>
      </div>
    </div>
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

import { defaultModel, type BioModel, newLink, newSocial, sanitizeModel, stableStringify } from "../lib/model";

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
    open: {
      type: Boolean,
      required: true,
    },
    model: {
      type: Object as () => BioModel,
      required: true,
    },
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

    const draft = ref<BioModel>(sanitizeModel(props.model));
    watch(
      () => props.model,
      (m) => {
        draft.value = sanitizeModel(m);
      },
      { deep: true }
    );

    const section = ref<"profile" | "links" | "socials" | "settings">("links");

    const sectionLabel = computed(() => {
      switch (section.value) {
        case "profile":
          return "Profile";
        case "links":
          return "Links";
        case "socials":
          return "Social";
        case "settings":
          return "Tools";
      }
    });

    const linkQuery = ref("");
    const selectedLinkId = ref<string>("");

    watch(
      () => draft.value.links,
      (links) => {
        if (!selectedLinkId.value && links[0]?.id) selectedLinkId.value = links[0].id;
        if (selectedLinkId.value && !links.some((l) => l.id === selectedLinkId.value)) {
          selectedLinkId.value = links[0]?.id || "";
        }
      },
      { deep: true, immediate: true }
    );

    const selectedLink = computed(() => {
      const q = linkQuery.value.trim().toLowerCase();
      const all = draft.value.links;
      const filtered = !q
        ? all
        : all.filter((l) => {
            const hay = `${l.title} ${l.subtitle} ${l.url}`.toLowerCase();
            return hay.includes(q);
          });

      // If query active and selected is not in filtered set, show nothing (keeps behavior predictable)
      if (q && selectedLinkId.value && !filtered.some((l) => l.id === selectedLinkId.value)) {
        return null;
      }

      return all.find((l) => l.id === selectedLinkId.value) ?? null;
    });

    const selectLink = (id: string) => {
      selectedLinkId.value = id;
    };

    const addLink = () => {
      const l = newLink();
      draft.value.links.unshift(l);
      selectedLinkId.value = l.id;
      section.value = "links";
      toast.add({ severity: "success", summary: "Created", detail: "New link added.", life: 1800 });
    };

    const removeSelectedLink = () => {
      if (!selectedLink.value) return;
      const idx = draft.value.links.findIndex((l) => l.id === selectedLink.value?.id);
      if (idx >= 0) {
        draft.value.links.splice(idx, 1);
        toast.add({ severity: "warn", summary: "Deleted", detail: "Link removed.", life: 1800 });
      }
    };

    const socialTypeOptions = [
      { label: "Website", value: "website" },
      { label: "Instagram", value: "instagram" },
      { label: "X", value: "x" },
      { label: "YouTube", value: "youtube" },
      { label: "TikTok", value: "tiktok" },
      { label: "GitHub", value: "github" },
    ];

    const addSocial = () => {
      draft.value.socials.unshift(newSocial());
      section.value = "socials";
      toast.add({ severity: "success", summary: "Created", detail: "New social added.", life: 1800 });
    };

    const removeSocial = (index: number) => {
      draft.value.socials.splice(index, 1);
      toast.add({ severity: "warn", summary: "Deleted", detail: "Social removed.", life: 1800 });
    };

    const resetToDefaults = () => {
      draft.value = defaultModel();
      draft.value.profile.displayName = props.model.profile.displayName || "";
      draft.value.profile.avatarUrl = props.model.profile.avatarUrl || "";
      section.value = "links";
      toast.add({ severity: "info", summary: "Reset", detail: "Defaults restored (not saved yet).", life: 2200 });
    };

    const save = () => {
      emit("update:model", sanitizeModel(draft.value));
      visible.value = false;
      toast.add({ severity: "success", summary: "Saved", detail: "Your site content was updated.", life: 2000 });
    };

    const discard = () => {
      draft.value = sanitizeModel(props.model);
      toast.add({ severity: "info", summary: "Discarded", detail: "Reverted unsaved changes.", life: 2000 });
    };

    const hasChanges = computed(() => stableStringify(sanitizeModel(draft.value)) !== stableStringify(sanitizeModel(props.model)));

    const avatarPreviewErrored = ref(false);
    watch(
      () => draft.value.profile.avatarUrl,
      () => (avatarPreviewErrored.value = false)
    );

    const avatarPreviewSrc = computed(() => {
      const u = (draft.value.profile.avatarUrl || "").trim();
      if (!u) return "";
      if (avatarPreviewErrored.value) return "";
      return u;
    });

    const onAvatarPreviewError = () => {
      avatarPreviewErrored.value = true;
    };

    const initials = computed(() => {
      const name = (draft.value.profile.displayName || "").trim();
      if (!name) return "LB";
      const parts = name.split(/\s+/).slice(0, 2);
      return parts.map((p) => (p[0] || "").toUpperCase()).join("");
    });

    const selectedLinkImageErrored = ref(false);
    watch(selectedLink, () => (selectedLinkImageErrored.value = false));

    const onSelectedLinkImageError = () => {
      selectedLinkImageErrored.value = true;
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

    const importOpen = ref(false);
    const importText = ref("");

    const applyImport = () => {
      const parsed = sanitizeModel(JSON.parse(importText.value));
      draft.value = parsed;
      importOpen.value = false;
      importText.value = "";
      toast.add({ severity: "success", summary: "Imported", detail: "Draft updated (save to apply).", life: 2200 });
    };

    const exportJson = async () => {
      const json = stableStringify(sanitizeModel(draft.value));
      await navigator.clipboard.writeText(json);
      toast.add({ severity: "success", summary: "Copied", detail: "Draft JSON copied to clipboard.", life: 2200 });
    };

    return {
      visible,
      draft,
      section,
      sectionLabel,
      linkQuery,
      selectedLinkId,
      selectedLink,
      selectLink,
      addLink,
      removeSelectedLink,
      socialTypeOptions,
      addSocial,
      removeSocial,
      resetToDefaults,
      save,
      discard,
      hasChanges,
      avatarPreviewSrc,
      onAvatarPreviewError,
      initials,
      selectedLinkImageErrored,
      onSelectedLinkImageError,
      socialIcon,
      importOpen,
      importText,
      applyImport,
      exportJson,
    };
  },
});
</script>

<style scoped>
.cms-shell {
  display: grid;
  grid-template-columns: 300px 1fr 360px;
  gap: 14px;
  height: min(72vh, 720px);
  min-height: 520px;
}

/* Sidebar */
.cms-sidebar {
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 18px 55px rgba(11, 18, 32, 0.08);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.cms-sidebar-header {
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.45);
}

.cms-title__kicker {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(11, 18, 32, 0.58);
  font-weight: 800;
}

.cms-title__main {
  margin-top: 2px;
  font-size: 16px;
  letter-spacing: -0.02em;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.95);
}

.cms-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cms-btn {
  padding: 0.62rem 0.95rem !important;
}

.cms-btn__label {
  margin-left: 0.55rem;
  font-weight: 800;
  font-size: 13px;
}

.cms-btn--primary {
  border: 0 !important;
  background: var(--color-brand) !important;
  box-shadow: 0 16px 44px rgba(37, 99, 235, 0.22) !important;
}

.cms-nav {
  padding: 12px;
  overflow: auto;
}

.cms-nav-item {
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
  font-weight: 800;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
}

.cms-nav-item:hover {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(11, 18, 32, 0.06);
}

.cms-nav-item:active {
  transform: translateY(1px);
}

.cms-nav-item.is-active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.24);
}

.cms-nav-item__meta {
  font-size: 12px;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.62);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
}

.cms-nav-sep {
  height: 1px;
  background: rgba(11, 18, 32, 0.08);
  margin: 12px 6px;
  opacity: 0.6;
}

.cms-sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.45);
}

.cms-hint {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cms-hint__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.14);
}

.cms-hint__title {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.cms-hint__sub {
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
}

/* Main */
.cms-main {
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 18px 55px rgba(11, 18, 32, 0.08);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}

.cms-main-top {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cms-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(11, 18, 32, 0.72);
  font-weight: 900;
  letter-spacing: -0.02em;
}

.cms-breadcrumb__label {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.55);
}

.cms-breadcrumb__value {
  color: rgba(11, 18, 32, 0.92);
}

.cms-main-body {
  padding: 14px;
  overflow: auto;
}

.cms-panel__header {
  margin-bottom: 12px;
}

.cms-panel__title {
  font-size: 15px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: rgba(11, 18, 32, 0.96);
}

.cms-panel__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 700;
}

.cms-form {
  display: grid;
  gap: 12px;
}

.cms-field {
  display: grid;
  gap: 6px;
}

.cms-label {
  font-size: 12px;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.70);
}

.cms-help {
  font-size: 12px;
  color: rgba(11, 18, 32, 0.60);
  font-weight: 650;
}

.cms-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
}

.cms-inline__item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cms-inline__label {
  font-size: 12px;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.70);
}

.cms-danger {
  font-weight: 900;
}

/* Avatar preview */
.cms-avatar-preview {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 18px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  padding: 10px;
}

.cms-avatar {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.65);
  background: rgba(255, 255, 255, 0.6);
  display: grid;
  place-items: center;
}

.cms-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-avatar__fallback {
  font-weight: 950;
  color: rgba(11, 18, 32, 0.70);
}

.cms-avatar-meta__title {
  font-size: 12px;
  font-weight: 950;
  letter-spacing: -0.01em;
}

.cms-avatar-meta__sub {
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

/* Links split */
.cms-split {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 12px;
  align-items: start;
}

.cms-collection,
.cms-editor {
  border-radius: 20px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  overflow: hidden;
}

.cms-collection__top {
  padding: 12px 12px 10px;
  border-bottom: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.45);
}

.cms-collection__title {
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
}

.cms-collection__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.60);
  font-weight: 650;
}

.cms-search {
  display: block;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(11, 18, 32, 0.06);
}

.cms-list {
  height: 420px;
  overflow: auto;
}

.cms-list-inner {
  display: grid;
  gap: 8px;
  padding: 10px 12px 12px;
}

.cms-row {
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
  transition: background 140ms ease, transform 140ms ease, border-color 140ms ease;
}

.cms-row:hover {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(11, 18, 32, 0.08);
}

.cms-row.is-active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.24);
}

.cms-row__drag {
  height: 34px;
  width: 34px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  display: grid;
  place-items: center;
  color: rgba(11, 18, 32, 0.55);
}

.cms-row__title {
  display: block;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: rgba(11, 18, 32, 0.92);
}

.cms-row__sub {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-row__ok {
  color: #10b981;
}

.cms-editor {
  padding: 12px 12px 12px;
}

.cms-card-preview {
  margin-top: 6px;
  border-radius: 18px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  padding: 10px;
}

.cms-card-preview__title {
  font-size: 12px;
  font-weight: 950;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
}

.cms-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.60);
  padding: 10px;
}

.cms-card__thumb {
  height: 44px;
  width: 44px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.60);
  overflow: hidden;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.cms-card__img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.cms-card__icon {
  color: rgba(11, 18, 32, 0.55);
}

.cms-card__body {
  min-width: 0;
  flex: 1 1 auto;
}

.cms-card__name {
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-card__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-card__arrow {
  color: rgba(11, 18, 32, 0.55);
}

/* Socials */
.cms-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

.cms-block {
  border-radius: 20px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  padding: 12px;
}

.cms-block__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cms-block__title {
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
}

/* Tools */
.cms-tools {
  display: grid;
  gap: 12px;
}

.cms-tool {
  border-radius: 20px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  padding: 12px;
  display: grid;
  gap: 8px;
}

.cms-tool__title {
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
}

.cms-tool__sub {
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

/* Preview */
.cms-preview {
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 18px 55px rgba(11, 18, 32, 0.08);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
}

.cms-preview__top {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.45);
}

.cms-preview__title {
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
}

.cms-preview__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

.cms-preview__body {
  padding: 14px;
  overflow: auto;
}

.cms-preview-card {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.55);
  padding: 12px;
}

.cms-preview-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cms-preview-avatar {
  width: 46px;
  height: 46px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.6);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.cms-preview-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cms-preview-avatar__fallback {
  font-weight: 950;
  color: rgba(11, 18, 32, 0.70);
}

.cms-preview-name {
  font-weight: 950;
  letter-spacing: -0.02em;
}

.cms-preview-tagline {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

.cms-preview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.cms-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 800;
  color: rgba(11, 18, 32, 0.88);
}

.cms-chip__text {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-preview-links {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.cms-preview-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.6);
}

.cms-preview-link__thumb {
  height: 42px;
  width: 42px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.cms-preview-link__img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.cms-preview-link__icon,
.cms-preview-link__arrow {
  color: rgba(11, 18, 32, 0.55);
}

.cms-preview-link__title {
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-preview-link__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms-preview-empty {
  font-size: 12px;
  font-weight: 750;
  color: rgba(11, 18, 32, 0.62);
  padding: 10px;
  border-radius: 18px;
  border: 1px dashed rgba(11, 18, 32, 0.14);
}

/* Empty states */
.cms-empty {
  padding: 16px 12px;
  text-align: center;
}

.cms-empty--soft {
  border-radius: 18px;
  border: 1px dashed rgba(11, 18, 32, 0.14);
  background: rgba(255, 255, 255, 0.45);
}

.cms-empty__title {
  font-weight: 950;
  letter-spacing: -0.02em;
}

.cms-empty__sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

/* Footer */
.cms-footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cms-footer__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cms-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(11, 18, 32, 0.10);
  background: rgba(255, 255, 255, 0.55);
}

.cms-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
}

.cms-status.is-dirty .cms-status__dot {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14);
}

.cms-status__text {
  font-size: 12px;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.72);
}

/* Responsive: hide preview on smaller screens */
@media (max-width: 980px) {
  .cms-shell {
    grid-template-columns: 290px 1fr;
  }
  .cms-preview {
    display: none;
  }
}

@media (max-width: 760px) {
  .cms-shell {
    grid-template-columns: 1fr;
    height: min(78vh, 760px);
    min-height: 520px;
  }
  .cms-sidebar {
    display: none;
  }
  .cms-split {
    grid-template-columns: 1fr;
  }
  .cms-list {
    height: auto;
    max-height: 260px;
  }
}
</style>