import type { DefaultConfigOptions } from "@formkit/vue";
import { createInput } from "@formkit/vue";
import ColorPickerInput from "../components/formkit/ColorPickerInput.vue";
import ImageUploadInput from "../components/formkit/ImageUploadInput.vue";
import TagListInput from "../components/formkit/TagListInput.vue";
import IconSelectInput from "../components/formkit/IconSelectInput.vue";
import GoogleFontPickerInput from "../components/formkit/GoogleFontPickerInput.vue";

/**
 * Custom FormKit inputs registered globally.
 *
 * Layouts can use these in their content schemas:
 *   { $formkit: 'colorpicker', name: 'accent', label: 'Accent Color' }
 *   { $formkit: 'imageUpload', name: 'imageUrl', label: 'Image' }
 *   { $formkit: 'tagList', name: 'tags', label: 'Tags' }
 *   { $formkit: 'iconSelect', name: 'icon', label: 'Icon' }
 *   { $formkit: 'googleFontPicker', name: 'fontFamily', label: 'Font family' }
 */
const customInputs: DefaultConfigOptions["inputs"] = {
  colorpicker: createInput(ColorPickerInput, {
    props: ["placeholder"],
  }),
  imageUpload: createInput(ImageUploadInput, {
    props: ["description"],
  }),
  tagList: createInput(TagListInput, {
    props: ["allTags", "placeholder"],
  }),
  iconSelect: createInput(IconSelectInput, {
    props: ["placeholder"],
  }),
  googleFontPicker: createInput(GoogleFontPickerInput, {
    props: [],
  }),
};

/**
 * Tailwind class map matching the existing CMS drawer UI.
 * Uses "fk-input" utility class defined in styles.css for visible input chrome.
 */
const inputCls = "fk-input w-full";

const sectionClasses: Record<string, Record<string, string>> = {
  global: {
    outer: "formkit-field grid gap-1.5 mb-3",
    label: "text-xs font-extrabold text-[color:var(--color-ink-soft)]",
    inner: "",
    help: "text-xs text-[color:var(--color-ink-soft)]/70 mt-0.5",
    messages: "mt-1",
    message: "text-xs text-red-500 font-semibold",
    wrapper: "",
  },
  text: { input: inputCls },
  url: { input: inputCls },
  email: { input: inputCls },
  number: { input: inputCls },
  date: { input: inputCls },
  textarea: { input: inputCls + " min-h-[80px] resize-y" },
  select: { input: inputCls + " appearance-none cursor-pointer" },
  checkbox: {
    wrapper: "flex items-center gap-2",
    input: "h-4 w-4 rounded accent-[var(--color-brand,#3b82f6)] cursor-pointer",
    label: "text-xs font-bold text-[color:var(--color-ink)] cursor-pointer",
    outer: "formkit-field flex items-center gap-2 mb-3",
  },
};

/**
 * rootClasses — called for every section of every input.
 * Returns a class-map object ({ className: true/false }).
 */
function rootClasses(sectionKey: string, node: { props: { type?: string } }) {
  const type = node.props.type || "text";
  const globals = sectionClasses.global?.[sectionKey] ?? "";
  const typeSpecific = sectionClasses[type]?.[sectionKey] ?? "";
  const combined = [globals, typeSpecific].filter(Boolean).join(" ");
  if (!combined) return {};
  const map: Record<string, boolean> = {};
  for (const cls of combined.split(/\s+/)) {
    if (cls) map[cls] = true;
  }
  return map;
}

export const formkitConfig: DefaultConfigOptions = {
  inputs: customInputs,
  config: { rootClasses },
};
