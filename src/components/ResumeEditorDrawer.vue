<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: expanded ? '100vw' : 'min(580px, 96vw)' }"
    :showCloseIcon="true"
  >
    <template #header>
      <div class="flex w-full items-center justify-between">
        <div>
          <div class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)]">
            {{ editMode === 'education' ? 'Edit Education' : editMode === 'employment' ? 'Edit Employment' : 'Edit Achievement' }}
          </div>
          <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
            Update details, then close to continue.
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
      <!-- Education entry editing -->
      <div v-if="editMode === 'education' && draftEducation" class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Institution</label>
            <InputText v-model="draftEducation.institution" class="w-full" placeholder="University / School name" />
          </div>
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Degree</label>
            <InputText v-model="draftEducation.degree" class="w-full" placeholder="e.g. Bachelor of Science" />
          </div>
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Field of study</label>
            <InputText v-model="draftEducation.field" class="w-full" placeholder="e.g. Computer Science" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Start year</label>
              <InputText v-model="draftEducation.startYear" class="w-full" placeholder="2018" />
            </div>
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">End year</label>
              <InputText v-model="draftEducation.endYear" class="w-full" placeholder="2022 or Present" />
            </div>
          </div>
        </div>
      </div>

      <!-- Employment entry editing -->
      <div v-if="editMode === 'employment' && draftEmployment" class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Company</label>
            <InputText v-model="draftEmployment.company" class="w-full" placeholder="Company name" />
          </div>
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Role / Title</label>
            <InputText v-model="draftEmployment.role" class="w-full" placeholder="e.g. Senior Engineer" />
          </div>
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Description</label>
            <Textarea v-model="draftEmployment.description" autoResize rows="3" class="w-full" placeholder="What you did…" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Start year</label>
              <InputText v-model="draftEmployment.startYear" class="w-full" placeholder="2020" />
            </div>
            <div class="grid gap-1.5">
              <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">End year</label>
              <InputText v-model="draftEmployment.endYear" class="w-full" placeholder="2024 or Present" />
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement entry editing -->
      <div v-if="editMode === 'achievement' && draftAchievement" class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Title</label>
            <InputText v-model="draftAchievement.title" class="w-full" placeholder="e.g. Best Paper Award" />
          </div>
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Issuer / Organization</label>
            <InputText v-model="draftAchievement.issuer" class="w-full" placeholder="e.g. IEEE, Google, Hackathon XYZ" />
          </div>
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Year</label>
            <InputText v-model="draftAchievement.year" class="w-full" placeholder="2024" />
          </div>
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Description</label>
            <Textarea v-model="draftAchievement.description" autoResize rows="3" class="w-full" placeholder="What you achieved…" />
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
        >
          <i class="pi pi-trash" />
          <span class="ml-2">Delete</span>
        </Button>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

import Button from "primevue/button";
import Drawer from "primevue/drawer";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";

import type { EducationEntry, EmploymentEntry, AchievementEntry } from "../lib/model";

export default defineComponent({
  name: "ResumeEditorDrawer",
  components: { Drawer, Button, InputText, Textarea },
  props: {
    open: { type: Boolean, required: true },
    editMode: { type: String as () => "education" | "employment" | "achievement", required: true },
    education: { type: Object as () => EducationEntry | null, default: null },
    employment: { type: Object as () => EmploymentEntry | null, default: null },
    achievement: { type: Object as () => AchievementEntry | null, default: null },
  },
  emits: ["update:open", "update:education", "update:employment", "update:achievement", "delete"],
  setup(props, { emit }) {
    const visible = ref(props.open);
    const expanded = ref(false);
    watch(() => props.open, (v) => (visible.value = v));
    watch(visible, (v) => emit("update:open", v));

    const draftEducation = ref<EducationEntry | null>(
      props.education ? { ...props.education } : null
    );
    const draftEmployment = ref<EmploymentEntry | null>(
      props.employment ? { ...props.employment } : null
    );
    const draftAchievement = ref<AchievementEntry | null>(
      props.achievement ? { ...props.achievement } : null
    );

    // Deep-equal helper to break the prop ↔ draft watcher cycle.
    // Without this, editing a field triggers: draft→emit→prop update→draft overwrite→emit… (infinite loop).
    const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

    // When props change (e.g. switching which item is edited), update drafts
    watch(() => props.education, (v) => {
      if (!eq(v, draftEducation.value)) draftEducation.value = v ? { ...v } : null;
    });

    watch(() => props.employment, (v) => {
      if (!eq(v, draftEmployment.value)) draftEmployment.value = v ? { ...v } : null;
    });

    watch(() => props.achievement, (v) => {
      if (!eq(v, draftAchievement.value)) draftAchievement.value = v ? { ...v } : null;
    });

    // Live-sync edits back to parent
    watch(draftEducation, (v) => {
      if (v && !eq(v, props.education)) emit("update:education", { ...v });
    }, { deep: true });

    watch(draftEmployment, (v) => {
      if (v && !eq(v, props.employment)) emit("update:employment", { ...v });
    }, { deep: true });

    watch(draftAchievement, (v) => {
      if (v && !eq(v, props.achievement)) emit("update:achievement", { ...v });
    }, { deep: true });

    return { visible, expanded, draftEducation, draftEmployment, draftAchievement };
  },
});
</script>

<style scoped>
:deep(.p-drawer) {
  background: #ffffff !important;
  transition: width 200ms ease;
}
:deep(.p-drawer-header) {
  background: #ffffff !important;
  border-bottom: 1px solid rgba(11, 18, 32, 0.08);
}
:deep(.p-drawer-content) {
  background: #ffffff !important;
}

.cms-expand-toggle {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(11, 18, 32, 0.1);
  background: rgba(255, 255, 255, 0.7);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(11, 18, 32, 0.5);
  transition: background 140ms ease, color 140ms ease;
  flex-shrink: 0;
}
.cms-expand-toggle:hover {
  background: rgba(11, 18, 32, 0.06);
  color: rgba(11, 18, 32, 0.8);
}
</style>
