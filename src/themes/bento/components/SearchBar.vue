<template>
  <div class="mb-3 flex justify-center">
    <div
      :class="[
        'search-bar flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-md transition-all duration-200 !rounded-full',
        modelValue.trim()
          ? 'search-bar--active border-transparent'
          : 'border-transparent',
        'focus-within:border-[var(--color-brand)] focus-within:ring-1 focus-within:ring-[var(--color-brand)]',
      ]"
      style="max-width:450px;width:100%"
    >
      <i
        v-if="showSearch"
        class="pi pi-search shrink-0 text-[13px] text-[color:var(--color-ink-soft)]"
      />
      <input
        v-if="showSearch"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        type="text"
        autocomplete="off"
        :placeholder="placeholder"
        class="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-soft)] outline-none"
      />
      <span v-if="!showSearch" class="min-w-0 flex-1" />
      <button
        type="button"
        :class="[
          'relative shrink-0 rounded-lg p-1 text-[color:var(--color-ink-soft)] transition hover:text-[color:var(--color-brand)]',
          tagCount === null ? 'opacity-0 pointer-events-none' : ''
        ]"
        @click.stop="$emit('filter-click')"
      >
        <i class="pi pi-filter text-[13px]" />
        <span
          v-if="selectedTagCount > 0"
          class="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-bold text-white"
        >{{ selectedTagCount }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SearchBar",
  props: {
    /** v-model for the search query */
    modelValue: { type: String, required: true },
    /** Placeholder text for the input */
    placeholder: { type: String, default: "Search…" },
    /** Whether to show the search icon + input (false = filter-only bar) */
    showSearch: { type: Boolean, default: true },
    /** Total number of available tags (null = hide filter button) */
    tagCount: { type: Number, default: null },
    /** Number of currently selected tags (drives the badge) */
    selectedTagCount: { type: Number, default: 0 },
  },
  emits: ["update:modelValue", "filter-click"],
});
</script>

<style>
/* Light mode: darken the search bar against the lighter glass container */

.search-bar {
  background: rgba(0, 0, 0, 0.06);
  margin-left: auto;
  margin-right: auto;
}
.search-bar:hover,
.search-bar--active,
.search-bar:focus-within {
  background: rgba(0, 0, 0, 0.10);
}

/* Neutralize browser autofill styling */
.search-bar input:-webkit-autofill,
.search-bar input:-webkit-autofill:hover,
.search-bar input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--color-ink);
  -webkit-box-shadow: 0 0 0 1000px transparent inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
