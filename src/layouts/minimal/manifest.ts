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
};

export default manifest;
