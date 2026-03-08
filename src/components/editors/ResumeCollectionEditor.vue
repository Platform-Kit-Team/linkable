<template>
  <div>
    <!-- Bio -->
    <div class="cms__field">
      <label class="cms__label">Bio</label>
      <Textarea v-model="resume.bio" autoResize rows="4" class="w-full" placeholder="A brief professional summary…" />
    </div>

    <!-- Education -->
    <div class="cms__field">
      <div class="flex items-center justify-between mb-2">
        <label class="cms__label">Education</label>
        <Button rounded size="small" class="cms__primary !py-1 !px-3 !text-xs" @click="addEducation">
          <i class="pi pi-plus mr-1" /> Add
        </Button>
      </div>
      <div v-if="resume.education.length === 0" class="cms__empty">
        <div class="cms__empty-sub">No education entries yet.</div>
      </div>
      <draggable v-else v-model="resume.education" item-key="id" handle=".drag" :animation="160" class="grid gap-2">
        <template #item="{ element: edu }">
          <button type="button" class="cms__row" style="grid-template-columns: 44px 1fr auto;" @click="openEditor('education', edu.id)">
            <span class="cms__row-drag drag" aria-label="Drag"><i class="pi pi-bars" /></span>
            <span class="cms__row-text">
              <span class="cms__row-title">{{ edu.institution || 'Untitled' }}</span>
              <span class="cms__row-sub">{{ [edu.degree, edu.field].filter(Boolean).join(' · ') || '(no details)' }}</span>
            </span>
            <span class="cms__row-meta">
              <span v-if="edu.startYear || edu.endYear" class="text-xs text-[color:var(--color-ink-soft)]">{{ edu.startYear }}–{{ edu.endYear }}</span>
              <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
            </span>
          </button>
        </template>
      </draggable>
    </div>

    <!-- Employment -->
    <div class="cms__field">
      <div class="flex items-center justify-between mb-2">
        <label class="cms__label">Employment</label>
        <Button rounded size="small" class="cms__primary !py-1 !px-3 !text-xs" @click="addEmployment">
          <i class="pi pi-plus mr-1" /> Add
        </Button>
      </div>
      <div v-if="resume.employment.length === 0" class="cms__empty">
        <div class="cms__empty-sub">No employment entries yet.</div>
      </div>
      <draggable v-else v-model="resume.employment" item-key="id" handle=".drag" :animation="160" class="grid gap-2">
        <template #item="{ element: job }">
          <button type="button" class="cms__row" style="grid-template-columns: 44px 1fr auto;" @click="openEditor('employment', job.id)">
            <span class="cms__row-drag drag" aria-label="Drag"><i class="pi pi-bars" /></span>
            <span class="cms__row-text">
              <span class="cms__row-title">{{ job.company || 'Untitled' }}</span>
              <span class="cms__row-sub">{{ job.role || '(no role)' }}</span>
            </span>
            <span class="cms__row-meta">
              <span v-if="job.startYear || job.endYear" class="text-xs text-[color:var(--color-ink-soft)]">{{ job.startYear }}–{{ job.endYear }}</span>
              <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
            </span>
          </button>
        </template>
      </draggable>
    </div>

    <!-- Skills -->
    <div class="cms__field">
      <label class="cms__label">Skills</label>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(skill, i) in resume.skills"
          :key="i"
          class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--glass)] px-3 py-1 text-xs font-semibold text-[color:var(--color-ink)] shadow-sm"
        >
          {{ skill }}
          <button type="button" class="hover:text-red-500 transition" @click="removeSkill(i)">
            <i class="pi pi-times text-[10px]" />
          </button>
        </span>
      </div>
      <div class="flex gap-2 mt-1">
        <InputText v-model="newSkillText" class="w-full" placeholder="Type a skill and press Add…" @keydown.enter.prevent="addSkill" />
        <Button rounded size="small" severity="secondary" @click="addSkill" :disabled="!newSkillText.trim()">Add</Button>
      </div>
    </div>

    <!-- Achievements -->
    <div class="cms__field">
      <div class="flex items-center justify-between mb-2">
        <label class="cms__label">Achievements</label>
        <Button rounded size="small" class="cms__primary !py-1 !px-3 !text-xs" @click="addAchievement">
          <i class="pi pi-plus mr-1" /> Add
        </Button>
      </div>
      <div v-if="resume.achievements.length === 0" class="cms__empty">
        <div class="cms__empty-sub">No achievements yet.</div>
      </div>
      <draggable v-else v-model="resume.achievements" item-key="id" handle=".drag" :animation="160" class="grid gap-2">
        <template #item="{ element: ach }">
          <button type="button" class="cms__row" style="grid-template-columns: 44px 1fr auto;" @click="openEditor('achievement', ach.id)">
            <span class="cms__row-drag drag" aria-label="Drag"><i class="pi pi-bars" /></span>
            <span class="cms__row-text">
              <span class="cms__row-title">{{ ach.title || 'Untitled' }}</span>
              <span class="cms__row-sub">{{ ach.issuer || '(no issuer)' }}</span>
            </span>
            <span class="cms__row-meta">
              <span v-if="ach.year" class="text-xs text-[color:var(--color-ink-soft)]">{{ ach.year }}</span>
              <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
            </span>
          </button>
        </template>
      </draggable>
    </div>

    <ResumeEditorDrawer
      v-if="activeEducation || activeEmployment || activeAchievement"
      v-model:open="editorOpen"
      :editMode="editMode"
      :education="activeEducation"
      :employment="activeEmployment"
      :achievement="activeAchievement"
      @update:education="updateEducation"
      @update:employment="updateEmployment"
      @update:achievement="updateAchievement"
      @delete="deleteEntry"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import draggable from "vuedraggable";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import ResumeEditorDrawer from "../ResumeEditorDrawer.vue";
import type { ContentCollection } from "../../lib/model";
import type { ResumeData, EducationEntry, EmploymentEntry, AchievementEntry } from "../../lib/model";
import { newEducation, newEmployment, newAchievement } from "../../lib/model";

export default defineComponent({
  name: "ResumeCollectionEditor",
  components: { draggable, Button, InputText, Textarea, ResumeEditorDrawer },
  props: {
    collection: { type: Object as PropType<ContentCollection>, required: true },
  },
  setup(props) {
    const toast = useToast();
    const resume = computed(() => props.collection.items[0] as ResumeData);

    const editorOpen = ref(false);
    const editMode = ref<"education" | "employment" | "achievement">("education");
    const activeEducationId = ref("");
    const activeEmploymentId = ref("");
    const activeAchievementId = ref("");
    const newSkillText = ref("");

    const activeEducation = computed<EducationEntry | null>(() =>
      activeEducationId.value ? resume.value.education.find((e) => e.id === activeEducationId.value) ?? null : null,
    );
    const activeEmployment = computed<EmploymentEntry | null>(() =>
      activeEmploymentId.value ? resume.value.employment.find((e) => e.id === activeEmploymentId.value) ?? null : null,
    );
    const activeAchievement = computed<AchievementEntry | null>(() =>
      activeAchievementId.value ? resume.value.achievements.find((a) => a.id === activeAchievementId.value) ?? null : null,
    );

    const openEditor = (mode: "education" | "employment" | "achievement", id: string) => {
      editMode.value = mode;
      if (mode === "education") activeEducationId.value = id;
      else if (mode === "employment") activeEmploymentId.value = id;
      else activeAchievementId.value = id;
      editorOpen.value = true;
    };

    const addEducation = () => {
      const e = newEducation();
      resume.value.education.push(e);
      openEditor("education", e.id);
      toast.add({ severity: "success", summary: "Added", detail: "Education entry created.", life: 1600 });
    };

    const addEmployment = () => {
      const e = newEmployment();
      resume.value.employment.push(e);
      openEditor("employment", e.id);
      toast.add({ severity: "success", summary: "Added", detail: "Employment entry created.", life: 1600 });
    };

    const addAchievement = () => {
      const a = newAchievement();
      resume.value.achievements.push(a);
      openEditor("achievement", a.id);
      toast.add({ severity: "success", summary: "Added", detail: "Achievement entry created.", life: 1600 });
    };

    const updateEducation = (updated: EducationEntry) => {
      const idx = resume.value.education.findIndex((e) => e.id === updated.id);
      if (idx >= 0) resume.value.education[idx] = { ...updated };
    };
    const updateEmployment = (updated: EmploymentEntry) => {
      const idx = resume.value.employment.findIndex((e) => e.id === updated.id);
      if (idx >= 0) resume.value.employment[idx] = { ...updated };
    };
    const updateAchievement = (updated: AchievementEntry) => {
      const idx = resume.value.achievements.findIndex((a) => a.id === updated.id);
      if (idx >= 0) resume.value.achievements[idx] = { ...updated };
    };

    const deleteEntry = () => {
      if (editMode.value === "education" && activeEducationId.value) {
        resume.value.education = resume.value.education.filter((e) => e.id !== activeEducationId.value);
        activeEducationId.value = "";
      } else if (editMode.value === "employment" && activeEmploymentId.value) {
        resume.value.employment = resume.value.employment.filter((e) => e.id !== activeEmploymentId.value);
        activeEmploymentId.value = "";
      } else if (editMode.value === "achievement" && activeAchievementId.value) {
        resume.value.achievements = resume.value.achievements.filter((a) => a.id !== activeAchievementId.value);
        activeAchievementId.value = "";
      }
      editorOpen.value = false;
      toast.add({ severity: "warn", summary: "Deleted", detail: "Entry removed.", life: 1600 });
    };

    const addSkill = () => {
      const skill = newSkillText.value.trim();
      if (!skill || resume.value.skills.includes(skill)) return;
      resume.value.skills.push(skill);
      newSkillText.value = "";
    };

    const removeSkill = (index: number) => {
      resume.value.skills.splice(index, 1);
    };

    watch(editorOpen, (open) => {
      if (!open) {
        activeEducationId.value = "";
        activeEmploymentId.value = "";
        activeAchievementId.value = "";
      }
    });

    return {
      resume, editorOpen, editMode, newSkillText,
      activeEducation, activeEmployment, activeAchievement,
      openEditor, addEducation, addEmployment, addAchievement,
      updateEducation, updateEmployment, updateAchievement,
      deleteEntry, addSkill, removeSkill,
    };
  },
});
</script>
