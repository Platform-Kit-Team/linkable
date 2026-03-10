<template>  
  <div class="min-h-dvh flex flex-col">        
    <div v-if="!loaded" class="flex flex-1 items-center justify-center">
      <span class="text-lg text-[color:var(--color-ink-soft)]">Loading…</span>
    </div>
    <template v-else>          
      <component :is="LayoutRoot" :model="model" :layoutData="model.theme?.layoutData || {}" :route="route" :router="router" />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, provide, computed, watch, type PropType } from "vue";
import { defaultModel, type BioModel } from "../lib/model";
import { useComponent } from "../lib/component-resolver";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  name: "IndexPage",
  props: {
    model: {
      type: Object as PropType<BioModel>,
      required: false,
    },
  },
  setup(props: { model?: BioModel }) {
    const model = ref<BioModel>(props.model ?? defaultModel());
    const loaded = ref(!!props.model);

    // Keep using App.vue's live model when provided so CMS edits are instant.
    watch(
      () => props.model,
      (nextModel: BioModel | undefined) => {
        if (nextModel) {
          model.value = nextModel;
          loaded.value = true;
        }
      },
      { immediate: true },
    );

    // Fallback for standalone usage where parent doesn't pass a model.
    if (!props.model) {
      fetch("/content/data.json")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch /content/data.json: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          model.value = data;
          loaded.value = true;
        })
        .catch((err) => {
          loaded.value = true;
          console.error("Model load error:", err);
        });
    }

    provide("bioModel", model);

    // Dynamically resolve the layout root component
    const activeLayout = computed(() => model.value.theme?.layout || "bento");
    // Minimal fallback component to avoid blank page
    const FallbackRoot = defineComponent({
      name: "FallbackRoot",
      template: `<div class='text-red-600 p-8 text-center'>Root layout component not found.</div>`
    });
    const LayoutRoot = useComponent("Root", FallbackRoot, activeLayout);
    const route = useRoute();
    const router = useRouter();
    // Pass route info to layout root
    return { model, loaded, LayoutRoot, route, router };
  },
});
</script>
