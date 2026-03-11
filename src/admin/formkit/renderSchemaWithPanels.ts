import { h, ref } from "vue";
import ListFieldPanel from "./ListFieldPanel.vue";

/**
 * Recursively wraps $formkit: "list" nodes in ListFieldPanel for collapsible UI.
 * Returns a new schema array ready for FormKitSchema.
 */
export function renderSchemaWithPanels(schema, model = {}) {
  if (!Array.isArray(schema)) return schema;
  return schema.map((node) => {
    if (node.$formkit === "list") {
      // Get label, summary, collapsed from node
      const label = node.label || "List";
      const collapsed = node.ui?.collapsed ?? true;
      // Compute summary from summaryField if available
      let summary = "";
      if (node.ui?.summaryField && Array.isArray(model[node.name]) && model[node.name]?.length > 0) {
        const first = model[node.name][0];
        summary = first?.[node.ui.summaryField] || "";
      }
      return {
        $el: ListFieldPanel,
        label,
        summary,
        collapsed,
        children: [
          // Recursively render children
          ...renderSchemaWithPanels(node.children || [], model[node.name]?.[0] || {})
        ]
      };
    } else if (node.children) {
      return { ...node, children: renderSchemaWithPanels(node.children, model[node.name] || {}) };
    } else {
      return node;
    }
  });
}
