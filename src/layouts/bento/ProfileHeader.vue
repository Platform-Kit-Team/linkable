<template>
  <!-- Profile content lives inside the grid. Header is just spacing. -->
  <header class="pt-6 sm:pt-10" @dblclick="$emit('dblclick-name')" />
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { SocialLink } from "../../lib/model";
export type { ProfileHeaderProps, ProfileHeaderEmits } from "../../lib/component-contracts";

export default defineComponent({
  name: "BentoProfileHeader",
  props: {
    displayName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    avatarSrc: { type: String, default: "" },
    bannerSrc: { type: String, default: "" },
    initials: { type: String, default: "" },
    socials: { type: Array as PropType<SocialLink[]>, default: () => [] },
  },
  emits: ["avatar-error", "banner-error", "dblclick-name", "social-click"],
});
</script>
