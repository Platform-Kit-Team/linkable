<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: expanded ? '100vw' : 'min(520px, 96vw)' }"
    :showCloseIcon="true"
  >
    <template #header>
      <div class="flex w-full items-center justify-between">
        <div>
          <div class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)]">
            {{ title }}
          </div>
          <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
            Update the details, then close to continue.
          </div>
        </div>
        <button
          type="button"
          class="cms-expand-toggle hidden md:flex"
          :title="expanded ? 'Collapse panel' : 'Expand panel'"
          @click="expanded = !expanded"
        >
          <i class="pi" :class="expanded ? 'pi-angle-right' : 'pi-angle-left'" />
        </button>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-4 shadow-sm">
        <FormKit
          type="form"
          :actions="false"
          :value="modelValue"
          :classes="{ form: 'formkit-cms-form' }"
          @input="onInput"
        >
          <FormKitSchema :schema="schema" />
        </FormKit>
      </div>

      <div class="flex items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-2">
          <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Enabled</label>
          <ToggleSwitch :modelValue="modelValue.enabled ?? true" @update:modelValue="onToggle" />
        </div>
        <Button
          text
          rounded
          severity="danger"
          size="small"
          @click="$emit('delete')"
        >
          <i class="pi pi-trash mr-1" />
          Delete
        </Button>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, ref, type PropType } from "vue";
import Drawer from "primevue/drawer";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import { FormKit, FormKitSchema } from "@formkit/vue";
import type { FormKitSchemaNode } from "@formkit/core";

export default defineComponent({
  name: "CollectionItemDrawer",
  components: { Drawer, Button, ToggleSwitch, FormKit, FormKitSchema },
  props: {
    open: { type: Boolean, required: true },
    schema: { type: Array as PropType<FormKitSchemaNode[]>, required: true },
    modelValue: { type: Object as PropType<Record<string, any>>, required: true },
    title: { type: String, default: "Edit item" },
  },
  emits: ["update:open", "update:modelValue", "delete"],
  setup(props, { emit }) {
    const expanded = ref(false);
    const visible = ref(props.open);

    const onInput = (value: unknown) => {
      if (value && typeof value === "object") {
        emit("update:modelValue", { ...props.modelValue, ...(value as Record<string, unknown>) });
      }
    };

    const onToggle = (v: boolean) => {
      emit("update:modelValue", { ...props.modelValue, enabled: v });
    };

    return { expanded, visible, onInput, onToggle };
  },
  watch: {
    open(v) { this.visible = v; },
    visible(v) { this.$emit("update:open", v); },
  },
});
</script>
