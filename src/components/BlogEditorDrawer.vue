<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: expanded ? '100vw' : 'min(580px, 96vw)' }"
    :showCloseIcon="true"
    class="blog-editor-drawer"
  >
    <template #header>
      <div class="flex w-full items-center justify-between">
        <div>
          <div class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)]">
            {{ isNew ? 'New Blog Post' : 'Edit Post' }}
          </div>
          <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
            Update details, then save to continue.
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
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <!-- Title -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Title</label>
            <InputText v-model="localTitle" class="w-full" placeholder="Post title" />
          </div>

          <!-- Excerpt -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Excerpt</label>
            <Textarea v-model="localExcerpt" autoResize rows="2" class="w-full" placeholder="Brief summary…" />
          </div>

          <!-- Tags -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Tags</label>
            <MultiSelect
              v-model="localTagsList"
              :options="allBlogTags"
              display="chip"
              filter
              :maxSelectedLabels="10"
              class="w-full"
              placeholder="Select or type tags…"
              @filter="onTagFilter"
            >
              <template #footer>
                <div v-if="tagFilterValue && !allBlogTags.includes(tagFilterValue)" class="px-3 py-2">
                  <button
                    type="button"
                    class="w-full rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-[color:var(--color-brand)] transition hover:bg-blue-50"
                    @click="addNewTag(tagFilterValue)"
                  >
                    <i class="pi pi-plus mr-1 text-[10px]" />Create “{{ tagFilterValue }}”
                  </button>
                </div>
              </template>
            </MultiSelect>
          </div>

          <!-- Slug -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Slug</label>
            <InputText v-model="localSlug" class="w-full" placeholder="my-post-slug" />
            <div class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">
              URL-friendly identifier. Auto-generated from title if left empty.
            </div>
          </div>

          <!-- Date -->
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Date</label>
            <DatePicker v-model="localDateObj" dateFormat="yy-mm-dd" class="w-full" showIcon iconDisplay="input" />
          </div>

          <!-- Cover Image -->
          <div class="grid gap-1.5">
            <ImageUploadField
              v-model="localCoverImage"
              label="Cover Image"
              description="Displayed at the top of the blog post. Aim for 1200 × 630 px."
              :targetFilename="coverFilename"
            />
          </div>

        </div>
      </div>

      <!-- Markdown body -->
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-1.5">
          <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Content (Markdown)</label>
          <MarkdownEditor
            v-model="localBody"
            placeholder="Write your blog post in Markdown…"
          />
        </div>
      </div>

      <!-- Published -->
      <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div>
          <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Published</div>
          <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
            Draft posts won't appear on the public page.
          </div>
        </div>
        <ToggleSwitch v-model="localPublished" />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between gap-2">
        <Button
          v-if="!isNew"
          rounded
          text
          severity="danger"
          class="!rounded-full"
          @click="deletePost"
          :disabled="saving"
        >
          <i class="pi pi-trash" />
          <span class="ml-2">Delete</span>
        </Button>
        <span v-else />

        <div class="flex items-center gap-2">
          <Button rounded severity="secondary" class="!rounded-full" @click="visible = false" :disabled="saving">
            <i class="pi pi-times" />
            <span class="ml-2">Cancel</span>
          </Button>
          <Button rounded class="cmsPrimary !rounded-full" :loading="saving" @click="savePost">
            <i class="pi pi-check" />
            <span class="ml-2">{{ isNew ? 'Create' : 'Save' }}</span>
          </Button>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import Drawer from "primevue/drawer";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";
import ImageUploadField from "./ImageUploadField.vue";
import MarkdownEditor from "./MarkdownEditor.vue";
import { useToast } from "primevue/usetoast";

import {
  saveBlogPost,
  deleteBlogPost,
  type BlogPost,
} from "../lib/blog";

const toSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export default defineComponent({
  name: "BlogEditorDrawer",
  components: { Button, DatePicker, Drawer, ImageUploadField, InputText, MultiSelect, Textarea, ToggleSwitch, MarkdownEditor },
  props: {
    open: { type: Boolean, required: true },
    post: { type: Object as PropType<BlogPost | null>, default: null },
    originalSlug: { type: String, default: "" },
    allTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ["update:open", "saved", "deleted"],
  setup(props, { emit }) {
    const toast = useToast();
    const saving = ref(false);
    const expanded = ref(false);

    const visible = ref(props.open);
    watch(() => props.open, (v) => (visible.value = v));
    watch(visible, (v) => emit("update:open", v));

    const isNew = ref(!props.post);
    const localId = ref(props.post?.id || crypto.randomUUID());
    const localTitle = ref(props.post?.title ?? "");
    const localSlug = ref(props.post?.slug ?? "");
    const localDate = ref(props.post?.date ?? new Date().toISOString().slice(0, 10));
    const localExcerpt = ref(props.post?.excerpt ?? "");
    const localCoverImage = ref(props.post?.coverImage ?? "");
    const localPublished = ref(props.post?.published ?? true);
    const localTagsList = ref<string[]>(props.post?.tags ? [...props.post.tags] : []);
    const localBody = ref(props.post?.content ?? "");

    const coverFilename = computed(() => {
      return `cover-${localId.value}.jpg`;
    });

    const localDateObj = computed({
      get: () => {
        const d = new Date(localDate.value + "T00:00:00");
        return isNaN(d.getTime()) ? new Date() : d;
      },
      set: (v: Date | null) => {
        if (!v) return;
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, "0");
        const d = String(v.getDate()).padStart(2, "0");
        localDate.value = `${y}-${m}-${d}`;
      },
    });

    const tagFilterValue = ref("");

    const allBlogTags = computed(() => {
      const set = new Set<string>(props.allTags);
      for (const t of localTagsList.value) set.add(t);
      return [...set].sort();
    });

    const onTagFilter = (event: any) => {
      tagFilterValue.value = (event.value ?? "").trim();
    };

    const addNewTag = (tag: string) => {
      const normalized = tag.trim();
      if (!normalized) return;
      if (!localTagsList.value.includes(normalized)) {
        localTagsList.value = [...localTagsList.value, normalized];
      }
      tagFilterValue.value = "";
    };

    watch(() => props.post, (p) => {
      isNew.value = !p;
      localId.value = p?.id || crypto.randomUUID();
      localTitle.value = p?.title ?? "";
      localSlug.value = p?.slug ?? "";
      localDate.value = p?.date ?? new Date().toISOString().slice(0, 10);
      localExcerpt.value = p?.excerpt ?? "";
      localCoverImage.value = p?.coverImage ?? "";
      localPublished.value = p?.published ?? true;
      localTagsList.value = p?.tags ? [...p.tags] : [];
      localBody.value = p?.content ?? "";
    });

    const savePost = async () => {
      const slug = (localSlug.value.trim() || toSlug(localTitle.value)).replace(/[^a-zA-Z0-9_-]/g, "-");
      if (!slug) {
        toast.add({ severity: "error", summary: "Missing slug", detail: "Provide a title or slug.", life: 2600 });
        return;
      }

      saving.value = true;
      try {
        if (props.originalSlug && props.originalSlug !== slug) {
          await deleteBlogPost(props.originalSlug);
        }

        const frontmatter: Record<string, unknown> = {
          id: localId.value,
          title: localTitle.value.trim() || "Untitled",
          slug,
          date: localDate.value.trim() || new Date().toISOString().slice(0, 10),
          excerpt: localExcerpt.value.trim(),
          coverImage: localCoverImage.value.trim(),
          published: localPublished.value,
          tags: [...localTagsList.value],
        };

        await saveBlogPost(slug, frontmatter, localBody.value);

        toast.add({ severity: "success", summary: isNew.value ? "Created" : "Saved", detail: `Post "${frontmatter.title}" saved.`, life: 2200 });
        emit("saved");
        visible.value = false;
      } catch (err) {
        toast.add({ severity: "error", summary: "Error", detail: err instanceof Error ? err.message : "Failed to save post.", life: 3000 });
      } finally {
        saving.value = false;
      }
    };

    const deletePost = async () => {
      if (!props.originalSlug && !localSlug.value) return;
      const slug = props.originalSlug || localSlug.value;
      try {
        await deleteBlogPost(slug);
        toast.add({ severity: "warn", summary: "Deleted", detail: "Blog post removed.", life: 2200 });
        emit("deleted");
        visible.value = false;
      } catch (err) {
        toast.add({ severity: "error", summary: "Error", detail: err instanceof Error ? err.message : "Failed to delete.", life: 3000 });
      }
    };

    return {
      visible,
      expanded,
      isNew,
      localTitle,
      localSlug,
      localDate,
      localExcerpt,
      localCoverImage,
      localPublished,
      localTagsList,
      localBody,
      saving,
      coverFilename,
      localDateObj,
      savePost,
      deletePost,
      allBlogTags,
      tagFilterValue,
      onTagFilter,
      addNewTag,
    };
  },
});
</script>

<style scoped>
.cmsPrimary {
  border: 0 !important;
  background: var(--color-brand) !important;
  box-shadow: 0 16px 44px rgba(37, 99, 235, 0.22) !important;
}

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

:deep(.p-datepicker-input-icon-container) {
  position: absolute;
  right: 0.75rem;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  color: rgba(11, 18, 32, 0.4);
  pointer-events: none;
}
:deep(.p-datepicker-input-icon) {
  display: block;
  line-height: 1;
}
:deep(.p-datepicker) {
  position: relative;
}
:deep(.p-datepicker .p-inputtext) {
  width: 100%;
  padding-right: 2.5rem;
}
</style>
