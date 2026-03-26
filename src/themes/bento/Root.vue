<template>
  <div class="min-h-dvh flex flex-col">
    <ProfileHeader
      :displayName="model.profile.displayName"
      :tagline="model.profile.tagline"
      :avatarSrc="model.theme.layoutData?.avatarUrl || ''"
      :bannerSrc="model.theme.layoutData?.bannerUrl || ''"
      :initials="model.profile.displayName?.split(' ').map(n => n[0]).join('') || ''"
      :socials="model.collections.socials?.items || []"
    />
    <TabNav
      :visible="true"
      :activeTab="activeTab"
      :tabs="tabs"
      @switch="onTabSwitch"
    />
    <div class="px-8">
      <LinksSection
        v-if="activeTab === 'links'"
        :links="model.collections.links?.items || []"
        :searchEnabled="model.collections.links?.searchEnabled || false"
        :availableTags="[]"
        :selectedTags="[]"
        @open-lightbox="openLightbox"
        @open-video="openVideo"
        @load-post="openBlogPost"
      />
      <ResumeSection
        v-if="activeTab === 'resume'"
        :resume="model.collections.resume?.items[0] || {}"
      />
      <GallerySection
        v-if="activeTab === 'gallery'"
        :items="model.collections.gallery?.items || []"
        :searchEnabled="model.collections.gallery?.searchEnabled || false"
        :availableTags="[]"
        :selectedTags="[]"
        :gridCols="model.theme.layoutData?.grid?.columns || 4"
        @open-lightbox="openLightbox"
        @open-video="openVideo"
      />
      <BlogSection
        v-if="activeTab === 'blog'"
        :posts="blogPosts"
        :currentPost="currentBlogPost"
        :label="model.collections.blog?.label || 'Articles'"
        :searchEnabled="model.collections.blog?.searchEnabled || false"
        :availableTags="[]"
        :selectedTags="[]"
        @load-post="openBlogPost"
        @back="goBackFromBlogPost"
      />
      <EcommerceSection v-if="activeTab === 'shop'" />
      <EmbedSection
        v-if="activeTab === 'embeds'"
        :html="''"
      />
      <NewsletterSection
        v-if="activeTab === 'newsletter'"
        :searchEnabled="model.collections.newsletter?.searchEnabled || false"
        :availableTags="[]"
        :selectedTags="[]"
      />
      <DocsSection
        v-if="activeTab === 'docs'"
        :docs="docItems"
        :currentDoc="currentDoc"
        :label="model.collections.docs?.label || 'Documentation'"
        :searchEnabled="model.collections.docs?.searchEnabled || false"
        @load-doc="openDoc"
        @back="goBackFromDoc"
      />
      <section
        v-if="activeTab === 'confirmed'"
        class="mx-auto flex w-full max-w-[var(--bento-grid-width,960px)] flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div class="text-5xl">{{ confirmationIcon }}</div>
        <h1 class="mt-4 text-2xl font-extrabold text-[color:var(--color-ink)] sm:text-3xl">
          {{ confirmationTitle }}
        </h1>
        <p class="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--color-ink-soft)] sm:text-base">
          {{ confirmationMessage }}
        </p>
        <button
          class="mt-6 rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
          @click="onTabSwitch('links')"
        >
          Go Home
        </button>
      </section>
    </div>
    <PageFooter :showRss="true" />

    <LightboxOverlay
      :open="lightboxOpen"
      :item="lightboxItem"
      @close="closeLightbox"
    />
    <VideoOverlay
      :open="videoOpen"
      :video-items="videoItems"
      :active-index="activeVideoIndex"
      :active-item="activeVideoItem"
      @close="closeVideo"
      @set-ref="setVideoRef"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { fetchCollectionItems, fetchCollectionItem } from "../../lib/collections";
import type { GalleryItem } from "./collection-types";
import ProfileHeader from "./ProfileHeader.vue";
import TabNav from "./TabNav.vue";
import LinksSection from "./LinksSection.vue";
import ResumeSection from "./ResumeSection.vue";
import GallerySection from "./GallerySection.vue";
import BlogSection from "./BlogSection.vue";
import DocsSection from "./DocsSection.vue";
import EmbedSection from "./EmbedSection.vue";
import NewsletterSection from "./NewsletterSection.vue";
import EcommerceSection from "./EcommerceSection.vue";
import PageFooter from "./PageFooter.vue";
import LightboxOverlay from "./components/LightboxOverlay.vue";
import VideoOverlay from "./components/VideoOverlay.vue";

export default defineComponent({
  name: "Root",
  props: {
    model: { type: Object, required: true },
    layoutData: { type: Object, default: () => ({}) },
    route: { type: Object, required: false },
    router: { type: Object, required: false },
  },
  components: {
    ProfileHeader,
    TabNav,
    LinksSection,
    ResumeSection,
    GallerySection,
    BlogSection,
    EcommerceSection,
    DocsSection,
    EmbedSection,
    NewsletterSection,
    PageFooter,
    LightboxOverlay,
    VideoOverlay,
  },
  data() {
    // Determine initial tab from route
    let initialTab = 'links';
    const path = this.route?.path || '/';
    if (path === '/about') initialTab = 'resume';
    else if (path === '/gallery') initialTab = 'gallery';
    else if (path === '/blog') initialTab = 'blog';
    else if (path === '/docs') initialTab = 'docs';
    else if (path.startsWith('/docs/')) initialTab = 'docs';
    else if (path === '/embeds') initialTab = 'embeds';
    else if (path === '/newsletter') initialTab = 'newsletter';
    else if (path === '/confirmed') initialTab = 'confirmed';
    else if (path.startsWith('/newsletter/')) initialTab = 'blog';
    else if (path.startsWith('/content/')) initialTab = 'blog';
    else if (path === '/shop') initialTab = 'shop';

    const confirmationMap: Record<string, { icon: string; title: string; message: string }> = {
      success: {
        icon: '🎉',
        title: "You're subscribed!",
        message: "Your email has been confirmed. You'll now receive updates.",
      },
      expired: {
        icon: '⏰',
        title: 'Link Expired',
        message: 'This confirmation link has expired. Please subscribe again to receive a new one.',
      },
      invalid: {
        icon: '⚠️',
        title: 'Invalid Link',
        message: 'This confirmation link is invalid or missing required parameters.',
      },
      'not-found': {
        icon: '🔍',
        title: 'Not Found',
        message: "We couldn't find a pending subscription for this email address.",
      },
      'already-confirmed': {
        icon: '✅',
        title: 'Already Confirmed',
        message: "Your email address has already been confirmed. You're all set!",
      },
      error: {
        icon: '❌',
        title: 'Something went wrong',
        message: "We couldn't confirm your subscription. Please try again later.",
      },
    };

    return {
      activeTab: initialTab,
      blogPosts: [] as any[],
      currentBlogPost: null as any,
      docItems: [] as any[],
      currentDoc: null as any,
      lightboxOpen: false,
      lightboxItem: null as GalleryItem | null,
      videoOpen: false,
      activeVideoIndex: null as number | null,
      videoRefs: [] as any[],
      confirmationStatus: '',
      confirmationMap,
    };
  },
  created() {
    void this.loadBlogPosts();
    void this.loadDocItems();
    void this.syncRouteState();
  },
  watch: {
    route() {
      void this.syncRouteState();
    },
    tabs(newTabs: Array<{ key: string }>) {
      if (newTabs.length && !newTabs.find((t) => t.key === this.activeTab)) {
        this.activeTab = newTabs[0].key;
      }
    },
  },
  methods: {
    async loadBlogPosts() {
      try {
        this.blogPosts = await fetchCollectionItems("blog");
      } catch {
        this.blogPosts = [];
      }
    },
    async loadBlogPost(slug: string) {
      try {
        this.currentBlogPost = await fetchCollectionItem("blog", slug);
      } catch {
        this.currentBlogPost = null;
      }
    },
    async loadDocItems() {
      try {
        this.docItems = await fetchCollectionItems("docs");
      } catch {
        this.docItems = [];
      }
    },
    async loadDoc(slug: string) {
      try {
        this.currentDoc = await fetchCollectionItem("docs", slug);
      } catch {
        this.currentDoc = null;
      }
    },
    async syncRouteState() {
      const path = this.route?.path || '/';
      if (path.startsWith('/content/')) {
        this.activeTab = 'blog';
        const slug = decodeURIComponent(path.slice('/content/'.length));
        if (slug) {
          await this.loadBlogPost(slug);
          return;
        }
      }
      if (path.startsWith('/docs/')) {
        this.activeTab = 'docs';
        const slug = decodeURIComponent(path.slice('/docs/'.length));
        if (slug) {
          await this.loadDoc(slug);
          return;
        }
      }
      if (path === '/docs') {
        this.activeTab = 'docs';
        this.currentDoc = null;
        return;
      }
      if (path.startsWith('/newsletter/')) {
        this.activeTab = 'blog';
        this.currentBlogPost = null;
        return;
      }
      if (path === '/confirmed') {
        this.activeTab = 'confirmed';
        this.currentBlogPost = null;
        this.confirmationStatus = (this.route?.query?.status as string) || 'error';
        return;
      }
      this.confirmationStatus = '';
      this.currentBlogPost = null;
      this.currentDoc = null;
    },
    openBlogPost(slug: string) {
      if (!slug || !this.router) return;
      void this.loadBlogPost(slug);
      this.router.push(`/content/${encodeURIComponent(slug)}`);
    },
    openDoc(slug: string) {
      if (!slug || !this.router) return;
      void this.loadDoc(slug);
      this.router.push(`/docs/${slug}`);
    },
    goBackFromDoc() {
      this.currentDoc = null;
      if (!this.router) return;
      this.router.push('/docs');
    },
    openLightbox(item: GalleryItem) {
      this.lightboxItem = item;
      this.lightboxOpen = true;
    },
    closeLightbox() {
      this.lightboxOpen = false;
      this.lightboxItem = null;
    },
    openVideo(item: GalleryItem) {
      const indexById = this.videoItems.findIndex((v) => v.id === item.id);
      const indexBySrc = this.videoItems.findIndex((v) => v.src === item.src);
      const nextIndex = indexById >= 0 ? indexById : indexBySrc;
      this.activeVideoIndex = nextIndex >= 0 ? nextIndex : 0;
      this.videoOpen = this.videoItems.length > 0;
      // Try immediately in the click call stack so browsers treat it as a user gesture.
      this.startVideoAtIndex(this.activeVideoIndex);
      this.tryStartActiveVideo();
    },
    startVideoAtIndex(index: number | null) {
      if (index == null) return;
      const active = this.videoRefs[index];
      if (active?.restart) {
        active.restart().catch(() => {
          // No-op: player UI remains as fallback.
        });
        return;
      }
      if (active?.play) {
        active.play().catch(() => {
          // No-op: player UI remains as fallback.
        });
      }
    },
    tryStartActiveVideo() {
      if (!this.videoOpen || this.activeVideoIndex == null) return;
      this.$nextTick(() => {
        this.startVideoAtIndex(this.activeVideoIndex);
        // Some providers (e.g. Vimeo) initialize asynchronously after mount.
        setTimeout(() => this.startVideoAtIndex(this.activeVideoIndex), 120);
        setTimeout(() => this.startVideoAtIndex(this.activeVideoIndex), 350);
      });
    },
    closeVideo() {
      const active = this.activeVideoIndex != null ? this.videoRefs[this.activeVideoIndex] : null;
      if (active?.pause) active.pause();
      this.videoOpen = false;
      this.activeVideoIndex = null;
    },
    setVideoRef(index: number, el: unknown) {
      if (el) this.videoRefs[index] = el;
      else delete this.videoRefs[index];
      if (el && this.videoOpen && this.activeVideoIndex === index) {
        this.tryStartActiveVideo();
      }
    },
    goBackFromBlogPost() {
      this.currentBlogPost = null;
      if (!this.router) return;
      this.router.push('/blog');
    },
    onTabSwitch(tabKey: string) {
      this.activeTab = tabKey;
      if (tabKey !== 'blog') {
        this.currentBlogPost = null;
      }
      if (tabKey !== 'docs') {
        this.currentDoc = null;
      }
      if (tabKey !== 'confirmed') {
        this.confirmationStatus = '';
      }
      // Navigate to correct route
      if (this.router) {
        if (tabKey === 'links') this.router.push('/');
        else if (tabKey === 'resume') this.router.push('/about');
        else if (tabKey === 'gallery') this.router.push('/gallery');
        else if (tabKey === 'blog') this.router.push('/blog');
        else if (tabKey === 'docs') this.router.push('/docs');
        else if (tabKey === 'embeds') this.router.push('/embeds');
        else if (tabKey === 'newsletter') this.router.push('/newsletter');
        else if (tabKey === 'shop') this.router.push('/shop');
      }
    },
    confirmationInfo() {
      return this.confirmationMap[this.confirmationStatus] || this.confirmationMap.error;
    },
  },
  computed: {
    tabs(): Array<{ key: string; label: string; icon: string }> {
      const collectionOrder = [
        { key: 'links',      label: 'All',        icon: 'Link',        collection: 'links' },
        { key: 'resume',     label: 'About Me',   icon: 'FileText',    collection: 'resume' },
        { key: 'gallery',    label: 'Gallery',    icon: 'Image',       collection: 'gallery' },
        { key: 'blog',       label: 'Blog',       icon: 'BookOpen',    collection: 'blog' },
        { key: 'shop',       label: 'Shop',       icon: 'ShoppingCart',collection: 'products' },
        { key: 'embeds',     label: 'Embeds',     icon: 'Code',        collection: 'embeds' },
        { key: 'newsletter', label: 'Newsletter', icon: 'Mail',        collection: 'newsletter' },
        { key: 'docs',       label: 'Docs',       icon: 'BookMarked',  collection: 'docs' },
      ];
      const path = this.route?.path || '/';
      return collectionOrder
        .filter((def) => {
          if (def.key === 'docs') {
            if (path === '/docs' || path.startsWith('/docs/')) return true;
            if (this.model?.collections?.docs?.enabled !== true) return false;
            if (!this.docItems || this.docItems.length === 0) return false;
            return true;
          }
          const col = this.model?.collections?.[def.collection];
          if (col?.enabled !== true) return false;
          // Hide tabs for collections that are enabled but have no items
          if (['blog', 'shop', 'gallery', 'embeds', 'newsletter'].includes(def.key)) {
            if (!col.items || col.items.length === 0) return false;
          }
          return true;
        })
        .map((def) => {
          const col = this.model?.collections?.[def.collection];
          return {
            key: def.key,
            label: col?.label || def.label,
            icon: col?.icon || def.icon,
          };
        });
    },
    videoItems(): GalleryItem[] {
      const items = this.model?.collections?.gallery?.items || [];
      return items.filter((item: GalleryItem) => item.enabled && item.type === 'video');
    },
    activeVideoItem(): GalleryItem | null {
      if (this.activeVideoIndex == null) return null;
      return this.videoItems[this.activeVideoIndex] || null;
    },
    confirmationIcon(): string {
      return this.confirmationInfo().icon;
    },
    confirmationTitle(): string {
      return this.confirmationInfo().title;
    },
    confirmationMessage(): string {
      return this.confirmationInfo().message;
    },
  },
});
</script>

<style scoped>
/* Add layout-specific styles here */
</style>
