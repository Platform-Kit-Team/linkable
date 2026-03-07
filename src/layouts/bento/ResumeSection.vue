<template>
  <section
    class="bento-resume bento-card mx-auto w-full p-6 sm:p-8"
    style="max-width: var(--bento-grid-width, 960px)"
  >
    <!-- Bio -->
    <div v-if="resume.bio" class="mb-6 sm:mb-8">
      <h2 class="resume-heading">About</h2>
      <p
        class="text-sm leading-relaxed text-[color:var(--color-ink)] sm:text-[15px]"
        style="white-space: pre-line"
      >
        {{ resume.bio }}
      </p>
    </div>

    <!-- Experience -->
    <div v-if="resume.employment.length" class="mb-6 sm:mb-8">
      <h2 class="resume-heading">Experience</h2>
      <div class="divide-y divide-[color:var(--bento-card-border,rgba(0,0,0,0.06))]">
        <div
          v-for="job in resume.employment"
          :key="job.id"
          class="py-3.5 first:pt-0 sm:py-4"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-semibold text-[color:var(--color-ink)] sm:text-[15px]">
                {{ job.role }}
              </div>
              <div class="text-xs text-[color:var(--color-ink-soft)] sm:text-[13px]">
                {{ job.company }}
              </div>
            </div>
            <div
              v-if="job.startYear || job.endYear"
              class="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-soft)]"
            >
              {{ job.startYear }}–{{ job.endYear || 'Present' }}
            </div>
          </div>
          <p
            v-if="job.description"
            class="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-soft)] sm:text-[13px]"
            style="white-space: pre-line"
          >
            {{ job.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Education -->
    <div v-if="resume.education.length" class="mb-6 sm:mb-8">
      <h2 class="resume-heading">Education</h2>
      <div class="divide-y divide-[color:var(--bento-card-border,rgba(0,0,0,0.06))]">
        <div
          v-for="edu in resume.education"
          :key="edu.id"
          class="py-3.5 first:pt-0 sm:py-4"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-semibold text-[color:var(--color-ink)] sm:text-[15px]">
                {{ edu.institution }}
              </div>
              <div class="text-xs text-[color:var(--color-ink-soft)] sm:text-[13px]">
                {{ [edu.degree, edu.field].filter(Boolean).join(' · ') }}
              </div>
            </div>
            <div
              v-if="edu.startYear || edu.endYear"
              class="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-soft)]"
            >
              {{ edu.startYear }}–{{ edu.endYear || 'Present' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skills -->
    <div v-if="resume.skills.length" class="mb-6 sm:mb-8">
      <h2 class="resume-heading">Skills</h2>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(skill, i) in resume.skills"
          :key="i"
          class="rounded-full bg-[color:var(--color-ink)]/[0.05] px-3 py-1 text-xs font-medium text-[color:var(--color-ink)] sm:text-[13px]"
        >
          {{ skill }}
        </span>
      </div>
    </div>

    <!-- Achievements -->
    <div v-if="resume.achievements.length">
      <h2 class="resume-heading">Achievements</h2>
      <div class="divide-y divide-[color:var(--bento-card-border,rgba(0,0,0,0.06))]">
        <div
          v-for="ach in resume.achievements"
          :key="ach.id"
          class="py-3.5 first:pt-0 sm:py-4"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-semibold text-[color:var(--color-ink)] sm:text-[15px]">
                {{ ach.title }}
              </div>
              <div
                v-if="ach.issuer"
                class="text-xs text-[color:var(--color-ink-soft)] sm:text-[13px]"
              >
                {{ ach.issuer }}
              </div>
            </div>
            <div
              v-if="ach.year"
              class="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-soft)]"
            >
              {{ ach.year }}
            </div>
          </div>
          <p
            v-if="ach.description"
            class="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-soft)] sm:text-[13px]"
            style="white-space: pre-line"
          >
            {{ ach.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ResumeData } from "../../lib/model";
export type { ResumeSectionProps } from "../../lib/component-contracts";

export default defineComponent({
  name: "BentoResumeSection",
  props: {
    resume: { type: Object as PropType<ResumeData>, required: true },
  },
});
</script>

<style scoped>
.bento-card {
  background: var(--bento-card-bg, #fff);
  border: 1px solid var(--bento-card-border, transparent);
  border-radius: var(--bento-card-radius, 1.5rem);
  box-shadow: var(--bento-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.resume-heading {
  margin-bottom: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-ink-soft);
}
</style>
