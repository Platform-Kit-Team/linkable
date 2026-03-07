import type { DefaultConfigOptions } from "@formkit/vue";
import { createInput } from "@formkit/vue";
import ColorPickerInput from "../components/formkit/ColorPickerInput.vue";

/**
 * Custom FormKit inputs registered globally.
 *
 * Layouts can use these in their schema:
 *   { $formkit: 'colorpicker', name: 'accent', label: 'Accent Color' }
 */
const customInputs: DefaultConfigOptions["inputs"] = {
  colorpicker: createInput(ColorPickerInput, {
    props: ["placeholder"],
  }),
};

export const formkitConfig: DefaultConfigOptions = {
  inputs: customInputs,
};
