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
          {{ title || "Edit link" }}
        </div>
        <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
          Update the link details, then close to continue.
        </div>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Title</label>
            <InputText v-model="draft.title" class="w-full" />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]"
              >Description (optional)</label
            >
            <InputText v-model="draft.subtitle" class="w-full" placeholder="Short helper text…" />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">URL</label>
            <InputText v-model="draft.url" class="w-full" placeholder="https://..." />
          </div>

          <div class="grid gap-1.5">
            <ImageUploadField
              v-model="draft.imageUrl"
              label="Thumbnail image (optional)"
              description="Drag in a square image to give this button extra presence."
              :targetFilename="`${draft.id}.jpg`"
            >
              <template #helper>
                <div class="text-xs font-semibold text-[color:var(--color-ink-soft)]">
                  Uploaded files live in
                  <span
                    class="rounded-full bg-[var(--glass)] px-2 py-0.5 font-bold text-[color:var(--color-ink)]"
                    >public/uploads</span
                  >
                  while you iterate locally.
                </div>
              </template>
            </ImageUploadField>
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]"
              >Thumbnail image URL (optional)</label
            >
            <InputText v-model="draft.imageUrl" class="w-full" placeholder="https://..." />
            <div class="text-xs font-semibold text-[color:var(--color-ink-soft)]">
              Paste a fully qualified URL if your asset is already hosted elsewhere.
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
            <div>
              <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Enabled</div>
              <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                Disable to hide this link from the public page.
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
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";

import ImageUploadField from "./ImageUploadField.vue";
import type { BioLink } from "../lib/model";

export default defineComponent({
  name: "LinkEditorDrawer",
  components: { Drawer, Button, InputText, ToggleSwitch, ImageUploadField },
  props: {
    open: { type: Boolean, required: true },
    modelValue: { type: Object as () => BioLink, required: true },
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

    const draft = ref<BioLink>({ ...props.modelValue });
    watch(
      () => props.modelValue,
      (v) => (draft.value = { ...v }),
      { deep: true }
    );

    const title = computed(() => (draft.value.title || "").trim());

    const reset = () => {
      draft.value = { ...props.modelValue };
    };

    const save = () => {
      emit("update:modelValue", { ...draft.value });
      visible.value = false;
    };

    return { visible, draft, title, reset, save };
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