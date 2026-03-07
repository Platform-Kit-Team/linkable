import type { LayoutManifest } from "../../lib/layout-manifest";

const manifest: LayoutManifest = {
  name: "Minimal",
  vars: [
    {
      cssVar: "--minimal-header-gradient-start",
      label: "Banner gradient start",
      type: "text",
      defaultLight: "25%",
      defaultDark: "25%",
    },
  ],
  contentSchemas: [
    { key: "links",      label: "Links",      icon: "Link",          defaultEnabled: true,  searchable: true },
    { key: "gallery",    label: "Gallery",    icon: "Image",         defaultEnabled: false, searchable: true },
    { key: "resume",     label: "Resume",     icon: "FileText",      defaultEnabled: false, searchable: false, singleton: true },
    { key: "blog",       label: "Blog",       icon: "BookOpen",      defaultEnabled: false, searchable: true,  external: true },
    { key: "embeds",     label: "Embeds",     icon: "Code",          defaultEnabled: true,  searchable: false },
    { key: "newsletter", label: "Newsletter", icon: "Newspaper",     defaultEnabled: false, searchable: true,  external: true },
  ],
  defaultTab: "links",
};

export default manifest;
