<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: 'min(520px, 96vw)' }"
    :showCloseIcon="true"
  >
    <template #header>
      <div>
        <div class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)]">
          {{ headerTitle }}
        </div>
        <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
          Icons are automatic by type; you can also store a Lucide icon name override.
        </div>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Type</label>
            <Dropdown
              v-model="draft.type"
              :options="socialTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Label</label>
            <InputText v-model="draft.label" class="w-full" placeholder="e.g. @yourname" />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">URL</label>
            <InputText v-model="draft.url" class="w-full" placeholder="https://..." />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]"
              >Lucide icon override (optional)</label
            >
            <InputText
              v-model="lucideIcon"
              class="w-full"
              placeholder="e.g. Github, Instagram, Globe"
            />
            <div class="text-xs font-semibold text-[color:var(--color-ink-soft)]">
              Stored in JSON; the public page currently uses automatic icons.
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
            <div>
              <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Enabled</div>
              <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                Only enabled socials with a URL will show.
              </div>
            </div>
            <ToggleSwitch v-model="draft.enabled" />
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
          :disabled="busy"
        >
          <i class="pi pi-trash" />
          <span class="ml-2">Delete</span>
        </Button>

        <div class="flex items-center gap-2">
          <Button rounded severity="secondary" class="!rounded-full" @click="reset" :disabled="busy">
            <i class="pi pi-undo" />
            <span class="ml-2">Reset</span>
          </Button>
          <Button rounded class="cmsPrimary !rounded-full" @click="save" :disabled="busy">
            <i class="pi pi-check" />
            <span class="ml-2">Save</span>
          </Button>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";

import Button from "primevue/button";
import Drawer from "primevue/drawer";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";

import type { SocialLink } from "../lib/model";

export default defineComponent({
  name: "SocialEditorDrawer",
  components: { Drawer, Button, Dropdown, InputText, ToggleSwitch },
  props: {
    open: { type: Boolean, required: true },
    modelValue: { type: Object as () => SocialLink, required: true },
    busy: { type: Boolean, default: false },
  },
  emits: ["update:open", "update:modelValue", "delete"],
  setup(props, { emit }) {
    const visible = ref(props.open);
    watch(
      () => props.open,
      (v) => (visible.value = v)
    );
    watch(visible, (v) => emit("update:open", v));

    const draft = ref<SocialLink>({ ...props.modelValue });
    watch(
      () => props.modelValue,
      (v) => (draft.value = { ...v }),
      { deep: true }
    );

    const socialTypeOptions = [
      { label: "Website", value: "website" },
      { label: "Email", value: "email" },
      { label: "GitHub", value: "github" },
      { label: "Instagram", value: "instagram" },
      { label: "X", value: "x" },
      { label: "YouTube", value: "youtube" },
      { label: "TikTok", value: "tiktok" },
    ];

    // Stored as an "extra" property in JSON.
    const lucideIcon = ref<string>(((props.modelValue as any).lucideIcon as string) ?? "");
    watch(
      () => props.modelValue,
      (v) => {
        lucideIcon.value = ((v as any).lucideIcon as string) ?? "";
      },
      { deep: true }
    );

    const headerTitle = computed(() => {
      const label = (draft.value.label || "").trim();
      return label ? `Edit social · ${label}` : "Edit social";
    });

    const reset = () => {
      draft.value = { ...props.modelValue };
      lucideIcon.value = ((props.modelValue as any).lucideIcon as string) ?? "";
    };

    const save = () => {
      const out: any = { ...draft.value };
      const icon = lucideIcon.value.trim();
      if (icon) out.lucideIcon = icon;
      else delete out.lucideIcon;

      emit("update:modelValue", out as SocialLink);
      visible.value = false;
    };

    return { visible, draft, socialTypeOptions, lucideIcon, headerTitle, reset, save };
  },
});
</script>

<style scoped>
.cmsPrimary {
  border: 0 !important;
  background: var(--color-brand) !important;
  box-shadow: 0 16px 44px rgba(37, 99, 235, 0.22) !important;
}

/* PrimeVue Drawer surface (solid, readable) */
:deep(.p-drawer) {
  background: #ffffff !important;
}
:deep(.p-drawer-header) {
  background: #ffffff !important;
  border-bottom: 1px solid rgba(11, 18, 32, 0.08);
}
:deep(.p-drawer-content) {
  background: #ffffff !important;
}
</style>