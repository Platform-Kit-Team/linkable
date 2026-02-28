<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Your mini CMS"
    :style="{ width: 'min(860px, 94vw)' }"
  >
    <div class="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <section class="rounded-[var(--radius-xl)] border border-white/55 bg-white/45 p-4 shadow-sm backdrop-blur-md">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-sm font-semibold">Links</div>
            <div class="text-xs text-[color:var(--color-ink-soft)]">
              Drag to reorder · Toggle to hide
            </div>
          </div>
          <Button rounded class="!border-0 !bg-[color:var(--color-brand)] shadow-[0_14px_36px_rgba(99,102,241,0.28)]" @click="addLink">
            <i class="pi pi-plus" />
            <span class="ml-2">Add</span>
          </Button>
        </div>

        <div class="mt-3">
          <draggable
            v-model="draft.links"
            item-key="id"
            handle=".drag"
            :animation="170"
            class="grid gap-2"
          >
            <template #item="{ element, index }">
              <div class="group rounded-2xl border border-white/60 bg-white/50 p-3 shadow-sm backdrop-blur-md transition hover:bg-white/65">
                <div class="flex items-start gap-3">
                  <button
                    type="button"
                    class="drag mt-1 grid h-9 w-9 place-items-center rounded-xl border border-white/60 bg-white/55 text-[color:var(--color-ink-soft)] shadow-sm backdrop-blur-md transition group-hover:bg-white/70"
                    aria-label="Drag"
                  >
                    <i class="pi pi-bars" />
                  </button>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="truncate text-sm font-semibold">{{ element.title || "Untitled" }}</span>
                          <Tag
                            v-if="!element.enabled"
                            severity="warning"
                            value="Hidden"
                            class="!rounded-full"
                          />
                        </div>
                        <div class="mt-0.5 truncate text-xs text-[color:var(--color-ink-soft)]">
                          {{ element.url || "(no url)" }}
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <Button
                          rounded
                          text
                          severity="secondary"
                          class="!px-3"
                          @click="openEditLink(index)"
                        >
                          <i class="pi pi-pencil" />
                        </Button>
                        <Button
                          rounded
                          text
                          severity="danger"
                          class="!px-3"
                          @click="removeLink(index)"
                        >
                          <i class="pi pi-trash" />
                        </Button>
                      </div>
                    </div>

                    <div class="mt-2 flex flex-wrap items-center gap-3">
                      <div class="inline-flex items-center gap-2">
                        <span class="text-xs text-[color:var(--color-ink-soft)]">Enabled</span>
                        <ToggleSwitch v-model="element.enabled" />
                      </div>
                      <div class="inline-flex items-center gap-2">
                        <span class="text-xs text-[color:var(--color-ink-soft)]">Icon</span>
                        <Dropdown
                          v-model="element.icon"
                          :options="iconOptions"
                          optionLabel="label"
                          optionValue="value"
                          class="w-40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>

          <div
            v-if="draft.links.length === 0"
            class="mt-3 rounded-2xl border border-dashed border-white/60 bg-white/35 p-6 text-center shadow-sm backdrop-blur-md"
          >
            <div class="text-sm font-semibold">Your buttons will appear here</div>
            <div class="mt-1 text-sm text-[color:var(--color-ink-soft)]">
              Add your first link to get started.
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[var(--radius-xl)] border border-white/55 bg-white/45 p-4 shadow-sm backdrop-blur-md">
        <div class="text-sm font-semibold">Profile</div>
        <div class="mt-3 grid gap-3">
          <div class="grid gap-1">
            <label class="text-xs font-medium text-[color:var(--color-ink-soft)]">Display name</label>
            <InputText v-model="draft.profile.displayName" class="w-full" />
          </div>
          <div class="grid gap-1">
            <label class="text-xs font-medium text-[color:var(--color-ink-soft)]">Tagline</label>
            <Textarea v-model="draft.profile.tagline" autoResize rows="3" class="w-full" />
          </div>
          <div class="grid gap-1">
            <label class="text-xs font-medium text-[color:var(--color-ink-soft)]">Avatar image URL</label>
            <InputText v-model="draft.profile.avatarUrl" class="w-full" placeholder="https://..." />
          </div>

          <Divider />

          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold">Social chips</div>
              <div class="text-xs text-[color:var(--color-ink-soft)]">Optional, shown under your name</div>
            </div>
            <Button rounded severity="secondary" class="!px-3" @click="addSocial">
              <i class="pi pi-plus" />
              <span class="ml-2">Add</span>
            </Button>
          </div>

          <div class="grid gap-2">
            <div
              v-for="(s, i) in draft.socials"
              :key="s.id"
              class="rounded-2xl border border-white/60 bg-white/50 p-3 shadow-sm backdrop-blur-md transition hover:bg-white/65"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="grid flex-1 gap-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <Dropdown
                      v-model="s.type"
                      :options="socialTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-36"
                    />
                    <InputText v-model="s.label" class="flex-1" placeholder="Label (e.g. @yourname)" />
                  </div>
                  <InputText v-model="s.url" class="w-full" placeholder="https://..." />
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-[color:var(--color-ink-soft)]">Enabled</span>
                    <ToggleSwitch v-model="s.enabled" />
                  </div>
                </div>
                <Button rounded text severity="danger" class="!px-3" @click="removeSocial(i)">
                  <i class="pi pi-trash" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <Button rounded severity="secondary" @click="resetToDefaults">Reset</Button>
        <div class="flex items-center gap-2">
          <Button rounded severity="secondary" @click="visible = false">Close</Button>
          <Button rounded class="!border-0 !bg-[color:var(--color-brand)] shadow-[0_14px_36px_rgba(99,102,241,0.28)]" @click="save">
            Save
          </Button>
        </div>
      </div>
    </template>
  </Dialog>

  <Dialog
    v-model:visible="editOpen"
    modal
    header="Edit link"
    :style="{ width: 'min(680px, 92vw)' }"
  >
    <div v-if="editing" class="grid gap-3">
      <div class="grid gap-1">
        <label class="text-xs font-medium text-[color:var(--color-ink-soft)]">Title</label>
        <InputText v-model="editing.title" class="w-full" />
      </div>
      <div class="grid gap-1">
        <label class="text-xs font-medium text-[color:var(--color-ink-soft)]">Subtitle</label>
        <InputText v-model="editing.subtitle" class="w-full" placeholder="Optional" />
      </div>
      <div class="grid gap-1">
        <label class="text-xs font-medium text-[color:var(--color-ink-soft)]">URL</label>
        <InputText v-model="editing.url" class="w-full" placeholder="https://..." />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex items-center gap-2">
          <span class="text-xs text-[color:var(--color-ink-soft)]">Enabled</span>
          <ToggleSwitch v-model="editing.enabled" />
        </div>
        <div class="inline-flex items-center gap-2">
          <span class="text-xs text-[color:var(--color-ink-soft)]">Icon</span>
          <Dropdown
            v-model="editing.icon"
            :options="iconOptions"
            optionLabel="label"
            optionValue="value"
            class="w-44"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button rounded severity="secondary" @click="editOpen = false">Done</Button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import draggable from "vuedraggable";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Divider from "primevue/divider";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";

import {
  defaultModel,
  type BioModel,
  newId,
  newLink,
  newSocial,
  sanitizeModel,
} from "../lib/model";

export default defineComponent({
  name: "CmsDialog",
  components: {
    Dialog,
    Button,
    Divider,
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

    const iconOptions = [
      { label: "Link", value: "link" },
      { label: "Sparkle", value: "sparkle" },
      { label: "Shop", value: "shop" },
      { label: "Music", value: "music" },
      { label: "Video", value: "video" },
      { label: "Mail", value: "mail" },
      { label: "Calendar", value: "calendar" },
      { label: "Doc", value: "doc" },
    ];

    const socialTypeOptions = [
      { label: "Website", value: "website" },
      { label: "Instagram", value: "instagram" },
      { label: "X", value: "x" },
      { label: "YouTube", value: "youtube" },
      { label: "TikTok", value: "tiktok" },
      { label: "GitHub", value: "github" },
    ];

    const addLink = () => {
      draft.value.links.unshift(newLink());
    };

    const removeLink = (index: number) => {
      draft.value.links.splice(index, 1);
    };

    const editOpen = ref(false);
    const editing = ref<null | BioModel["links"][number]>(null);

    const openEditLink = (index: number) => {
      editing.value = draft.value.links[index];
      editOpen.value = true;
    };

    const addSocial = () => {
      draft.value.socials.unshift(newSocial());
    };

    const removeSocial = (index: number) => {
      draft.value.socials.splice(index, 1);
    };

    const resetToDefaults = () => {
      draft.value = defaultModel();
      draft.value.profile.displayName = props.model.profile.displayName || "";
      draft.value.profile.avatarUrl = props.model.profile.avatarUrl || "";
    };

    const save = () => {
      emit("update:model", sanitizeModel(draft.value));
      visible.value = false;
    };

    return {
      visible,
      draft,
      iconOptions,
      socialTypeOptions,
      addLink,
      removeLink,
      openEditLink,
      editOpen,
      editing,
      addSocial,
      removeSocial,
      save,
      resetToDefaults,
      newId,
    };
  },
});
</script>