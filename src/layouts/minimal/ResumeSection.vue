<template>
  <section class="space-y-6 sm:space-y-8">
    <!-- Bio -->
    <div v-if="resume.bio">
      <h2
        class="mb-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-soft)]"
      >
        About
      </h2>
      <p
        class="text-sm leading-relaxed text-[color:var(--color-ink)] sm:text-[15px]"
        style="white-space: pre-line"
      >
        {{ resume.bio }}
      </p>
    </div>

    <!-- Experience -->
    <div v-if="resume.employment.length">
      <h2
        class="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-soft)]"
      >
        Experience
      </h2>
      <div class="divide-y divide-[var(--color-border2)]">
        <div
          v-for="job in resume.employment"
          :key="job.id"
          class="py-3 first:pt-0 sm:py-4"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-medium text-[color:var(--color-ink)]">
                {{ job.role }}
              </div>
              <div class="text-xs text-[color:var(--color-ink-soft)]">
                {{ job.company }}
              </div>
            </div>
            <div
              v-if="job.startYear || job.endYear"
              class="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-soft)]"
            >
              {{ job.startYear }}–{{ job.endYear }}
            </div>
          </div>
          <p
            v-if="job.description"
            class="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-soft)]"
            style="white-space: pre-line"
          >
            {{ job.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Education -->
    <div v-if="resume.education.length">
      <h2
        class="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-soft)]"
      >
        Education
      </h2>
      <div class="divide-y divide-[var(--color-border2)]">
        <div
          v-for="edu in resume.education"
          :key="edu.id"
          class="py-3 first:pt-0 sm:py-4"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-medium text-[color:var(--color-ink)]">
                {{ edu.institution }}
              </div>
              <div class="text-xs text-[color:var(--color-ink-soft)]">
                {{ [edu.degree, edu.field].filter(Boolean).join(" · ") }}
              </div>
            </div>
            <div
              v-if="edu.startYear || edu.endYear"
              class="shrink-0 text-xs tabular-nums text-[color:var(--color-ink-soft)]"
            >
              {{ edu.startYear }}–{{ edu.endYear }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skills -->
    <div v-if="resume.skills.length">
      <h2
        class="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-soft)]"
      >
        Skills
      </h2>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(skill, i) in resume.skills"
          :key="i"
          class="rounded-md border border-[var(--color-border2)] px-2.5 py-1 text-xs text-[color:var(--color-ink)]"
        >
          {{ skill }}
        </span>
      </div>
    </div>

    <!-- Achievements -->
    <div v-if="resume.achievements.length">
      <h2
        class="mb-3 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-ink-soft)]"
      >
        Achievements
      </h2>
      <div class="divide-y divide-[var(--color-border2)]">
        <div
          v-for="ach in resume.achievements"
          :key="ach.id"
          class="py-3 first:pt-0 sm:py-4"
        >
          <div class="flex items-baseline justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-medium text-[color:var(--color-ink)]">
                {{ ach.title }}
              </div>
              <div v-if="ach.issuer" class="text-xs text-[color:var(--color-ink-soft)]">
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
            class="mt-1.5 text-xs leading-relaxed text-[color:var(--color-ink-soft)]"
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
  name: "MinimalResumeSection",
  props: {
    resume: { type: Object as PropType<ResumeData>, required: true },
  },
});
</script>
