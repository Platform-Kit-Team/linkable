/**
 * Component Contracts
 *
 * Exported prop & emit interfaces for every overridable component.
 * When creating an override in `src/overrides/`, import the matching
 * interface so TypeScript enforces the same API the shell (App.vue) expects.
 *
 * Example:
 *   import type { ProfileHeaderProps, ProfileHeaderEmits } from "../lib/component-contracts";
 */

import type { BioLink, SocialLink, BioResume, GalleryItem } from "./model";
import type { BlogPostMeta, BlogPost } from "./blog";
import type { MasonryItem } from "../components/MasonryGrid.vue";

/* ------------------------------------------------------------------ */
/*  TabNav                                                             */
/* ------------------------------------------------------------------ */

export interface TabItem {
  key: string;
  label: string;
  icon: string;
}

/* ------------------------------------------------------------------ */
/*  ProfileHeader                                                      */
/* ------------------------------------------------------------------ */

export interface ProfileHeaderProps {
  displayName?: string;
  tagline?: string;
  avatarSrc?: string;
  bannerSrc?: string;
  initials?: string;
  socials?: SocialLink[];
}

export interface ProfileHeaderEmits {
  (e: "avatar-error"): void;
  (e: "banner-error"): void;
  (e: "dblclick-name"): void;
  (e: "social-click", url: string, label: string): void;
}

/* ------------------------------------------------------------------ */
/*  TabNav                                                             */
/* ------------------------------------------------------------------ */

export interface TabNavProps {
  visible?: boolean;
  activeTab: string;
  tabs: TabItem[];
}

export interface TabNavEmits {
  (e: "switch", tabKey: string): void;
}

/* ------------------------------------------------------------------ */
/*  LinksSection                                                       */
/* ------------------------------------------------------------------ */

export interface LinksSectionProps {
  links: BioLink[];
  searchEnabled?: boolean;
  availableTags?: string[];
  selectedTags?: string[];
}

export interface LinksSectionEmits {
  (e: "link-click", url: string, title: string): void;
  (e: "filter-click"): void;
}

/* ------------------------------------------------------------------ */
/*  ResumeSection                                                      */
/* ------------------------------------------------------------------ */

export interface ResumeSectionProps {
  resume: BioResume;
}

/* ------------------------------------------------------------------ */
/*  GallerySection                                                     */
/* ------------------------------------------------------------------ */

export interface GallerySectionProps {
  items: MasonryItem[];
  searchEnabled?: boolean;
  availableTags?: string[];
  selectedTags?: string[];
}

export interface GallerySectionEmits {
  (e: "open-lightbox", item: MasonryItem): void;
  (e: "open-video", item: MasonryItem): void;
  (e: "filter-click"): void;
}

/* ------------------------------------------------------------------ */
/*  BlogSection                                                        */
/* ------------------------------------------------------------------ */

export interface BlogSectionProps {
  posts: BlogPostMeta[];
  currentPost?: BlogPost | null;
  label?: string;
  searchEnabled?: boolean;
  availableTags?: string[];
  selectedTags?: string[];
}

export interface BlogSectionEmits {
  (e: "load-post", slug: string): void;
  (e: "back"): void;
  (e: "filter-click"): void;
}

/* ------------------------------------------------------------------ */
/*  EmbedSection                                                       */
/* ------------------------------------------------------------------ */

export interface EmbedSectionProps {
  html: string;
}

/* ------------------------------------------------------------------ */
/*  NewsletterSection                                                  */
/* ------------------------------------------------------------------ */

export interface NewsletterSectionProps {
  searchEnabled?: boolean;
  availableTags?: string[];
  selectedTags?: string[];
}

export interface NewsletterSectionEmits {
  (e: "view", id: string): void;
  (e: "tags-loaded", tags: string[]): void;
  (e: "filter-click"): void;
}

/* ------------------------------------------------------------------ */
/*  NewsletterViewPage                                                 */
/* ------------------------------------------------------------------ */

export interface NewsletterViewPageProps {
  sendId: string;
  subscriberId?: string;
  token?: string;
}

export interface NewsletterViewPageEmits {
  (e: "back"): void;
}

/* ------------------------------------------------------------------ */
/*  LightboxOverlay                                                    */
/* ------------------------------------------------------------------ */

export interface LightboxOverlayProps {
  open: boolean;
  item?: GalleryItem | null;
}

export interface LightboxOverlayEmits {
  (e: "close"): void;
}

/* ------------------------------------------------------------------ */
/*  VideoOverlay                                                       */
/* ------------------------------------------------------------------ */

export interface VideoOverlayProps {
  open: boolean;
  videoItems: GalleryItem[];
  activeIndex?: number | null;
  activeItem?: GalleryItem | null;
}

export interface VideoOverlayEmits {
  (e: "close"): void;
  (e: "set-ref", index: number, el: unknown): void;
}

/* ------------------------------------------------------------------ */
/*  PageFooter                                                         */
/* ------------------------------------------------------------------ */

export interface PageFooterProps {
  showRss?: boolean;
}
