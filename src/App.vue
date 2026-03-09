<template>
  <div class="min-h-dvh overflow-x-hidden">
    <!-- Only render layout or CMS UI, never default content UI -->
    <router-view v-slot="{ Component: RouteComponent }">
      <component
        :is="RouteComponent"
        :model="model"
        :layout-data="model.theme.layoutData"
        :route="$route"
        :router="$router"
      />
    </router-view>

    <CollectionItemDrawer
      v-if="itemEditorOpen && itemEditorSchema.length && itemEditorItem"
      :open="itemEditorOpen"
      :schema="itemEditorSchema"
      :schema-key="itemEditorCollectionKey + '-' + itemEditorItemId"
      :model-value="itemEditorItem"
      :title="itemEditorTitle"
      @update:open="itemEditorOpen = $event"
      @update:model-value="updateItemEditorItem"
      @delete="deleteItemEditorItem"
      @duplicate="duplicateItemEditorItem"
    />

    <CmsDialog
      v-if="canUseCms"
      v-model:open="cmsOpen"
      :model="model"
      :initial-tab="cmsInitialTab"
      :initial-embed-id="activeTab.startsWith('embed-') ? activeTab.slice(6) : ''"
      :initial-blog-slug="activeTab === 'blog' && currentBlogPost ? currentBlogPost.slug : ''"
      :initial-content-sub-tab="cmsTargetSubTab"
      :initial-item-id="cmsTargetItemId"
      :nav-trigger="cmsNavTrigger"
      :preview-mode="previewMode"
      @update:model="updateModel"
      @toggle-preview="togglePreviewMode"
      @blog-posts-updated="loadBlogPosts"
      @lock="handleCmsLock"
      @reauth="handleCmsReauth"
    />

    <!-- CMS password gate -->
    <Dialog
      v-model:visible="cmsPasswordOpen"
      modal
      header="Unlock CMS"
      :style="{ width: 'min(400px, 92vw)' }"
    >
      <div class="space-y-4">
        <div class="text-sm text-[color:var(--color-ink-soft)]">
          Enter your password to access the CMS.
        </div>
        <InputText
          v-model="cmsPassword"
          type="password"
          placeholder="Password"
          autocomplete="off"
          class="w-full"
          @keyup.enter="submitCmsPassword"
        />
        <div v-if="cmsPasswordError" class="text-xs font-semibold text-red-500">
          {{ cmsPasswordError }}
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button rounded severity="secondary" @click="cmsPasswordOpen = false">Cancel</Button>
          <Button
            rounded
            class="!border-0 !bg-[color:var(--color-brand)] !px-4 !py-2.5"
            :disabled="!cmsPassword"
            @click="submitCmsPassword"
          >
            <i class="pi pi-lock-open" />
            <span class="ml-2">Unlock</span>
          </Button>
        </div>
      </template>
    </Dialog>

    <Dialog
      v-if="isDev"
      v-model:visible="importOpen"
      modal
      header="Import JSON"
      :style="{ width: 'min(680px, 92vw)' }"
    >
      <div class="space-y-3">
        <p class="text-sm text-[color:var(--color-ink-soft)]">
          Paste an exported JSON to restore your profile/links.
        </p>
        <Textarea v-model="importText" autoResize rows="7" class="w-full" />
        <div class="flex justify-end gap-2">
          <Button severity="secondary" rounded @click="importOpen = false">Cancel</Button>
          <Button
            rounded
            class="!border-0 !bg-[color:var(--color-brand)] !px-4 !py-2.5 shadow-[0_14px_38px_rgba(37,99,235,0.22)]"
            @click="applyImport"
          >
            Import
          </Button>
        </div>
      </div>
    </Dialog>

    <GitCommitDialog v-if="unsynced" v-model:open="gitDialogOpen" @commit="performCommit" />

    <Toast />

    <!-- Tag filter dialogs -->
    <TagFilterDialog
      :open="linkTagFilterOpen"
      :tags="availableLinkTags"
      :selected-tags="selectedLinkTags"
      @update:open="linkTagFilterOpen = $event"
      @update:selected-tags="selectedLinkTags = $event"
    />
    <TagFilterDialog
      :open="galleryTagFilterOpen"
      :tags="availableGalleryTags"
      :selected-tags="selectedGalleryTags"
      @update:open="galleryTagFilterOpen = $event"
      @update:selected-tags="selectedGalleryTags = $event"
    />
    <TagFilterDialog
      :open="blogTagFilterOpen"
      :tags="availableBlogTags"
      :selected-tags="selectedBlogTags"
      @update:open="blogTagFilterOpen = $event"
      @update:selected-tags="selectedBlogTags = $event"
    />
    <TagFilterDialog
      :open="newsletterTagFilterOpen"
      :tags="availableNewsletterTags"
      :selected-tags="selectedNewsletterTags"
      @update:open="newsletterTagFilterOpen = $event"
      @update:selected-tags="selectedNewsletterTags = $event"
    />

    <!-- Floating CMS button -->
    <Transition name="cms-slide-right">
      <Button
        v-if="canUseCms"
        rounded
        class="!fixed border-none !bottom-4 !right-3 !z-50 flex h-12 w-12 items-center justify-center rounded-full !bg-[color:var(--color-brand)]  text-white shadow-lg hover:brightness-110 transition !border-none"
        @click="openCms"
      >
        <i class="pi pi-sliders-h" />
      </Button>
    </Transition>

    <!-- Floating status bar -->
    <Transition name="cms-slide-left">
      <div
        v-if="canUseCms"
        class="fixed bottom-4 left-3 z-50 flex max-w-[calc(100vw-5rem)] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--glass-strong)] px-4 py-2.5 text-[11px] text-[color:var(--color-ink-soft)] shadow-sm backdrop-blur-md sm:bottom-6 sm:left-6 sm:gap-3 sm:px-5 sm:py-3 sm:text-xs"
        :class="{ 'cursor-pointer sm:cursor-default': unsynced }"
        @click="unsynced ? (gitDialogOpen = true) : undefined"
      >
        <span class="inline-flex items-center gap-1.5 sm:gap-2">
          <span
            class="h-2 w-2 shrink-0 rounded-full transition-all"
            :class="syncIndicatorClass"
          ></span>
          <span class="truncate sm:hidden">{{ syncStatusShort }}</span>
          <span class="hidden truncate sm:inline">{{ syncStatusText }}</span>
        </span>

        <div class="hidden items-center gap-1.5 sm:flex">
          <Button
            v-if="unsynced"
            rounded
            severity="secondary"
            class="!px-2.5 !py-1.5 !text-xs"
            @click.stop="gitDialogOpen = true"
          >
            <i class="pi pi-git-branch" />
            <span class="ml-1.5">Commit</span>
          </Button>
          <Button
            v-if="!previewMode"
            rounded
            severity="secondary"
            class="!px-2.5 !py-1.5 !text-xs"
            @click.stop="exportJson"
          >
            <i class="pi pi-download" />
          </Button>
          <Button
            v-if="!previewMode && isDev"
            rounded
            severity="secondary"
            class="!px-2.5 !py-1.5 !text-xs"
            @click.stop="importOpen = true"
          >
            <i class="pi pi-upload" />
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  watchEffect,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

import CmsDialog from './components/CmsDialog.vue';
import CollectionItemDrawer from './components/CollectionItemDrawer.vue';
import GitCommitDialog from './components/GitCommitDialog.vue';
import DefaultNewsletterViewPage from './components/NewsletterViewPage.vue';
import { resolveEmbedHtml } from './components/EmbedEditorDrawer.vue';
import type { MasonryItem } from './components/MasonryGrid.vue';

// Default user-facing components (overridable via src/overrides/)
import DefaultProfileHeader from './components/ProfileHeader.vue';
import DefaultTabNav from './components/TabNav.vue';
import type { TabItem } from './components/TabNav.vue';
import DefaultLinksSection from './components/LinksSection.vue';
import DefaultResumeSection from './components/ResumeSection.vue';
import DefaultGallerySection from './components/GallerySection.vue';
import DefaultBlogSection from './components/BlogSection.vue';
import DefaultEmbedSection from './components/EmbedSection.vue';
import DefaultNewsletterSection from './components/NewsletterSection.vue';
import DefaultLightboxOverlay from './components/LightboxOverlay.vue';
import DefaultVideoOverlay from './components/VideoOverlay.vue';
import DefaultPageFooter from './components/PageFooter.vue';
import TagFilterDialog from './components/TagFilterDialog.vue';

import { useComponent, useLayoutRoutes, isLayoutRoute, getLayoutManifest } from './lib/component-resolver';
import { icons as lucideIcons } from 'lucide-vue-next';
import { defaultModel, type BioModel, sanitizeModel, stableStringify } from './lib/model';
import { fetchModel, persistModel, getStagedData, clearStagedData } from './lib/persistence';
import { fetchBlogPosts, fetchBlogPost, type BlogPostMeta, type BlogPost } from './lib/blog';
import {
  GITHUB_SYNC_EVENT,
  canUseGithubSync,
  loadGithubSettings,
  pushCmsDataToGithub,
  commitPendingUploads,
  getPlaintextToken,
  hasEmbeddedToken,
  isTokenUnlocked,
  unlockToken,
  clearSessionToken,
  resolveUploadUrl,
  type GithubSettings,
} from './lib/github';
import { setCmsPassword, clearCmsPassword } from './lib/cms-auth';
import { isScheduleVisible } from './lib/scheduling';
import { trackPageview, trackClick, isAnalyticsEnabled } from './lib/analytics';

export default defineComponent({
  name: 'App',
  components: {
    Button,
    Dialog,
    InputText,
    Textarea,
    Toast,
    CmsDialog,
    CollectionItemDrawer,
    GitCommitDialog,
    TagFilterDialog,
  },
  setup() {
    const isDev = import.meta.env.DEV;
    const toast = useToast();
    const route = useRoute();
    const router = useRouter();

    // ── Override-aware component resolution ──────────────────────────
    const model = ref<BioModel>(defaultModel());
    provide('bioModel', model);
    const activeLayout = computed(() => model.value.theme.layout || 'default');

    const resolvedProfileHeader = useComponent('ProfileHeader', DefaultProfileHeader, activeLayout);
    const resolvedTabNav = useComponent('TabNav', DefaultTabNav, activeLayout);
    const resolvedLinksSection = useComponent('LinksSection', DefaultLinksSection, activeLayout);
    const resolvedResumeSection = useComponent('ResumeSection', DefaultResumeSection, activeLayout);
    const resolvedGallerySection = useComponent(
      'GallerySection',
      DefaultGallerySection,
      activeLayout,
    );
    const resolvedBlogSection = useComponent('BlogSection', DefaultBlogSection, activeLayout);
    const resolvedEmbedSection = useComponent('EmbedSection', DefaultEmbedSection, activeLayout);
    const resolvedNewsletterSection = useComponent(
      'NewsletterSection',
      DefaultNewsletterSection,
      activeLayout,
    );
    const resolvedNewsletterViewPage = useComponent(
      'NewsletterViewPage',
      DefaultNewsletterViewPage,
      activeLayout,
    );
    const resolvedLightboxOverlay = useComponent(
      'LightboxOverlay',
      DefaultLightboxOverlay,
      activeLayout,
    );
    const resolvedVideoOverlay = useComponent('VideoOverlay', DefaultVideoOverlay, activeLayout);
    const resolvedPageFooter = useComponent('PageFooter', DefaultPageFooter, activeLayout);

    // ── Layout-contributed routes ────────────────────────────────────
    const layoutRoutes = useLayoutRoutes(router, activeLayout);
    const isOnLayoutRoute = computed(() => isLayoutRoute(route));

    const modelLoaded = ref(false);
    const suppressPersist = ref(true);
    const cmsOpen = ref(false);
    const cmsPasswordOpen = ref(false);
    const cmsPassword = ref('');
    const cmsPasswordError = ref('');
    const gitDialogOpen = ref(false);
    const previewMode = ref(true);
    const cmsBtnVisible = ref(false);

    const githubReady = ref(false);
    const githubSettings = ref<GithubSettings>(loadGithubSettings());
    const syncing = ref(false);
    const unsynced = ref(false);

    const updateGithubStatus = () => {
      githubReady.value = canUseGithubSync();
      githubSettings.value = loadGithubSettings();
    };

    let keydownListener: ((e: KeyboardEvent) => void) | null = null;

    const applyHashTab = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.toLowerCase();
      if (hash === '#links' && enabledLinks.value.length > 0) {
        activeTab.value = 'links';
      } else if (hash === '#resume' && resumeHasContent.value) {
        activeTab.value = 'resume';
      } else if (hash === '#gallery' && galleryHasContent.value) {
        activeTab.value = 'gallery';
      } else if (hash === '#blog' && blogHasContent.value) {
        activeTab.value = 'blog';
      } else if (hash === '#newsletter' && model.value.collections.newsletter.enabled) {
        activeTab.value = 'newsletter';
      } else if (hash.startsWith('#embed-')) {
        const embedId = window.location.hash.slice(1); // preserve case for ID
        const found = enabledEmbeds.value.find((e) => `embed-${e.id}` === embedId);
        if (found) activeTab.value = embedId;
      } else if (hash === '#cms') {
        cmsBtnVisible.value = true;
        localStorage.setItem('cms-button-visible', 'true');
      }
    };

    onMounted(async () => {
      // initialize visibility, keyboard, and other window stuff first
      if (typeof window !== 'undefined') {
        window.addEventListener(GITHUB_SYNC_EVENT, updateGithubStatus);

        const storedCmsVisible = localStorage.getItem('cms-button-visible') === 'true';
        const hashCms = window.location.hash === '#cms';
        cmsBtnVisible.value = storedCmsVisible || hashCms;

        // Listen for hash changes
        window.addEventListener('hashchange', applyHashTab);
        // kick off unsynced flag if there's pending JSON or uploads stored
        if (localStorage.getItem('pending-cms') || localStorage.getItem('pending-uploads')) {
          unsynced.value = true;
        }

        // Keyboard shortcut: Cmd/Ctrl + Shift + E
        keydownListener = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            cmsBtnVisible.value = !cmsBtnVisible.value;
            localStorage.setItem('cms-button-visible', cmsBtnVisible.value ? 'true' : 'false');
          }
        };
        window.addEventListener('keydown', keydownListener);
      }

      try {
        const remoteModel = await fetchModel();
        model.value = remoteModel;
      } catch (err) {
        console.warn('fetchModel failed', err);
      }

      modelLoaded.value = true;

      // Signal pre-renderer that the page content is ready
      nextTick(() => {
        (document as any).__APP_RENDERED__ = true;
        document.dispatchEvent(new Event('app-rendered'));
      });

      // Set default tab from model settings
      const dt = (model.value.theme.layoutData as Record<string, unknown>)?.defaultTab as
        | string
        | undefined;
      if (dt) {
        activeTab.value = dt;
      }

      // Load blog posts
      await loadBlogPosts();

      // Apply hash-based tab after model is available
      applyHashTab();

      // Handle route-based blog post navigation (e.g. /content/:slug)
      if (route.name === 'blog-post' && route.params.slug) {
        const slug = route.params.slug as string;
        activeTab.value = 'blog';
        await loadBlogPost(slug, false);
      }

      // Handle route-based newsletter view (e.g. /newsletter/:id)
      if (route.name === 'newsletter-view' && route.params.id) {
        activeTab.value = 'newsletter';
        newsletterViewId.value = route.params.id as string;
        newsletterViewSid.value = (route.query.sid as string) || '';
        newsletterViewToken.value = (route.query.token as string) || '';
      }

      // Handle newsletter confirmation page (e.g. /confirmed?status=success)
      if (route.name === 'newsletter-confirmed') {
        activeTab.value = 'newsletter';
        confirmationStatus.value = (route.query.status as string) || 'error';
      }

      setTimeout(() => {
        suppressPersist.value = false;
      }, 0);

      // Track initial pageview
      trackPageview();

      updateGithubStatus();
    });

    onBeforeUnmount(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(GITHUB_SYNC_EVENT, updateGithubStatus);
        window.removeEventListener('hashchange', applyHashTab);
        if (keydownListener) {
          window.removeEventListener('keydown', keydownListener);
        }
      }
      // Cancel any pending persist timer
      if (persistDebounceTimer) clearTimeout(persistDebounceTimer);
      // Clean up injected script containers
      _headContainer.remove();
      _bodyContainer.remove();
    });

    // Watch route changes for browser back/forward
    watch(
      () => route.name,
      (name) => {
        if (name === 'blog-post' && route.params.slug) {
          activeTab.value = 'blog';
          loadBlogPost(route.params.slug as string, false);
        } else if (name === 'newsletter-view' && route.params.id) {
          activeTab.value = 'newsletter';
          newsletterViewId.value = route.params.id as string;
          newsletterViewSid.value = (route.query.sid as string) || '';
          newsletterViewToken.value = (route.query.token as string) || '';
        } else if (name === 'newsletter-confirmed') {
          activeTab.value = 'newsletter';
          confirmationStatus.value = (route.query.status as string) || 'error';
        } else if (name === 'home') {
          if (currentBlogPost.value) currentBlogPost.value = null;
          newsletterViewId.value = '';
          confirmationStatus.value = '';
        }
        // Track pageview on route change
        trackPageview();
      },
    );

    // Apply theme CSS variables reactively
    watchEffect(() => {
      const t = model.value.theme;
      if (!t) return;
      const root = document.documentElement.style;
      if (t.colorBrand) root.setProperty('--color-brand', t.colorBrand);
      if (t.colorBrandStrong) root.setProperty('--color-brand-strong', t.colorBrandStrong);
      if (t.colorAccent) root.setProperty('--color-accent', t.colorAccent);
      if (t.colorInk) root.setProperty('--color-ink', t.colorInk);
      if (t.colorInkSoft) root.setProperty('--color-ink-soft', t.colorInkSoft);
      if (t.bg) root.setProperty('--bg', t.bg);
      if (t.glass) root.setProperty('--glass', t.glass);
      if (t.glass2) root.setProperty('--glass-2', t.glass2);
      if (t.glassStrong) root.setProperty('--glass-strong', t.glassStrong);
      if (t.colorBorder) root.setProperty('--color-border', t.colorBorder);
      if (t.colorBorder2) root.setProperty('--color-border-2', t.colorBorder2);
      if (t.cardBg) root.setProperty('--card-bg', t.cardBg);
      if (t.cardBorder) root.setProperty('--card-border', t.cardBorder);
      if (t.cardText) root.setProperty('--card-text', t.cardText);
      if (t.radiusXl) root.setProperty('--radius-xl', t.radiusXl);
      if (t.radiusLg) root.setProperty('--radius-lg', t.radiusLg);
      root.setProperty('--page-font-family', t.fontFamily ? `'${t.fontFamily}', sans-serif` : '');
      root.setProperty('--page-font-weight', t.fontWeight || '');
      root.setProperty('--page-letter-spacing', t.letterSpacing || '');

      // Load Google Font for page font family
      if (t.fontFamily) {
        const id = `gf-page-${t.fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
        if (!document.getElementById(id)) {
          const link = document.createElement('link');
          link.id = id;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.fontFamily)}:wght@300;400;500;600;700;800;900&display=swap`;
          document.head.appendChild(link);
        }
      }

      // Apply layout-specific custom variables
      if (t.layoutVars) {
        for (const [cssVar, value] of Object.entries(t.layoutVars)) {
          if (cssVar.startsWith('--') && value) {
            root.setProperty(cssVar, value);
          }
        }
      }

      // Toggle dark-mode attribute for CSS-driven glow effects
      if (t.preset === 'dark') {
        document.documentElement.setAttribute('data-dark', '');
      } else {
        document.documentElement.removeAttribute('data-dark');
      }

      // Set layout attribute for layout-specific CSS overrides
      const layout = t.layout || 'default';
      document.documentElement.setAttribute('data-layout', layout);
    });

    // Dynamically inject favicon and OG/social meta tags
    watchEffect(() => {
      const p = model.value.profile;

      // Favicon
      let faviconLink = document.querySelector<HTMLLinkElement>('link#__linkable-favicon');
      if (p.faviconUrl) {
        if (!faviconLink) {
          faviconLink = document.createElement('link');
          faviconLink.id = '__linkable-favicon';
          faviconLink.rel = 'icon';
          document.head.appendChild(faviconLink);
        }
        faviconLink.href = p.faviconUrl;
      } else if (faviconLink) {
        faviconLink.remove();
      }

      // Apple touch icon — only use favicon if explicitly set by the user
      const touchSrc = p.faviconUrl;
      let touchLink = document.querySelector<HTMLLinkElement>('link#__linkable-apple-touch');
      if (touchSrc) {
        if (!touchLink) {
          touchLink = document.createElement('link');
          touchLink.id = '__linkable-apple-touch';
          touchLink.rel = 'apple-touch-icon';
          document.head.appendChild(touchLink);
        }
        touchLink.href = touchSrc;
      } else if (touchLink) {
        touchLink.remove();
      }

      // OG image meta tag
      let ogMeta = document.querySelector<HTMLMetaElement>("meta[property='og:image']");
      if (p.ogImageUrl) {
        if (!ogMeta) {
          ogMeta = document.createElement('meta');
          ogMeta.setAttribute('property', 'og:image');
          document.head.appendChild(ogMeta);
        }
        ogMeta.content = p.ogImageUrl;
      } else if (ogMeta) {
        ogMeta.remove();
      }

      // OG title
      let ogTitle = document.querySelector<HTMLMetaElement>("meta[property='og:title']");
      if (p.displayName) {
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.content = p.displayName;
      } else if (ogTitle) {
        ogTitle.remove();
      }

      // OG description
      let ogDesc = document.querySelector<HTMLMetaElement>("meta[property='og:description']");
      if (p.tagline) {
        if (!ogDesc) {
          ogDesc = document.createElement('meta');
          ogDesc.setAttribute('property', 'og:description');
          document.head.appendChild(ogDesc);
        }
        ogDesc.content = p.tagline;
      } else if (ogDesc) {
        ogDesc.remove();
      }

      // Twitter card tags
      let twCard = document.querySelector<HTMLMetaElement>("meta[name='twitter:card']");
      if (p.ogImageUrl) {
        if (!twCard) {
          twCard = document.createElement('meta');
          twCard.name = 'twitter:card';
          document.head.appendChild(twCard);
        }
        twCard.content = 'summary_large_image';
      } else if (twCard) {
        twCard.remove();
      }

      // Update page title
      if (p.displayName) {
        document.title = p.displayName;
      }

      // Update meta description
      let descMeta = document.querySelector<HTMLMetaElement>("meta[name='description']");
      if (p.tagline && descMeta) {
        descMeta.content = p.tagline;
      }

      // Theme color meta (for mobile browser chrome)
      let themeMeta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
      const themeColor = model.value.theme?.colorBrand;
      if (themeColor) {
        if (!themeMeta) {
          themeMeta = document.createElement('meta');
          themeMeta.name = 'theme-color';
          document.head.appendChild(themeMeta);
        }
        themeMeta.content = themeColor;
      }
    });

    // Inject custom user scripts into <head> and before </body>
    const _headContainer = document.createElement('div');
    _headContainer.id = '__linkable-head-scripts';
    const _bodyContainer = document.createElement('div');
    _bodyContainer.id = '__linkable-body-scripts';

    const injectScripts = (container: HTMLElement, html: string, parent: HTMLElement) => {
      // Remove old container if present
      const existing = parent.querySelector(`#${container.id}`);
      if (existing) existing.remove();

      if (!html.trim()) return;

      container.innerHTML = html;
      // innerHTML won't execute <script> tags, so we clone them as live scripts
      const scripts = container.querySelectorAll('script');
      const live = document.createDocumentFragment();
      const nonScripts = document.createDocumentFragment();
      // Keep non-script children (e.g. <noscript>, <meta>, <link>)
      Array.from(container.childNodes).forEach((node) => {
        if ((node as Element).tagName !== 'SCRIPT') {
          nonScripts.appendChild(node.cloneNode(true));
        }
      });
      scripts.forEach((s) => {
        const el = document.createElement('script');
        // Copy attributes (src, async, defer, type, etc.)
        Array.from(s.attributes).forEach((a) => el.setAttribute(a.name, a.value));
        if (s.textContent) el.textContent = s.textContent;
        live.appendChild(el);
      });
      container.innerHTML = '';
      container.appendChild(nonScripts);
      container.appendChild(live);
      parent.appendChild(container);
    };

    watchEffect(() => {
      const s = model.value.scripts;
      if (!s) return;
      injectScripts(_headContainer, s.headScript, document.head);
      injectScripts(_bodyContainer, s.bodyEndScript, document.body);
    });

    const canUseCms = computed(() => cmsBtnVisible.value);
    provide('canUseCms', canUseCms);

    const cmsTargetSubTab = ref('');
    const cmsTargetItemId = ref('');
    const cmsNavTrigger = ref(0);

    const openCmsItem = async (collectionKey: string, itemId: string) => {
      cmsTargetSubTab.value = collectionKey;
      cmsTargetItemId.value = itemId;
      cmsNavTrigger.value++;
      if (!cmsOpen.value) await openCms();
    };
    provide('openCmsItem', openCmsItem);

    // Standalone per-item editor (opens CollectionItemDrawer without the CMS dialog)
    const itemEditorOpen = ref(false);
    const itemEditorCollectionKey = ref('');
    const itemEditorItemId = ref('');

    const itemEditorContentSchema = computed(() => {
      const key = itemEditorCollectionKey.value;
      if (!key) return null;
      const manifest = getLayoutManifest(activeLayout.value);
      return (manifest?.contentSchemas ?? []).find((s) => s.key === key) ?? null;
    });

    const itemEditorItem = computed(() => {
      const key = itemEditorCollectionKey.value;
      const id = itemEditorItemId.value;
      if (!key || !id) return null;
      const col = (model.value.collections as Record<string, any>)[key];
      return (col?.items ?? []).find((i: any) => i.id === id) ?? null;
    });

    const itemEditorSchema = computed(() => {
      const cs = itemEditorContentSchema.value;
      const item = itemEditorItem.value;
      if (!cs?.itemSchema) return [];
      if (typeof cs.itemSchema === 'function') return cs.itemSchema(item ?? {});
      return cs.itemSchema;
    });

    const itemEditorTitle = computed(() => {
      const cs = itemEditorContentSchema.value;
      const item = itemEditorItem.value;
      if (!cs || !item) return 'Edit item';
      return cs.itemLabel ? cs.itemLabel(item) : cs.label;
    });

    const openItemEditor = (collectionKey: string, itemId: string) => {
      itemEditorCollectionKey.value = collectionKey;
      itemEditorItemId.value = itemId;
      itemEditorOpen.value = true;
    };
    provide('openItemEditor', openItemEditor);

    const updateItemEditorItem = (updated: Record<string, unknown>) => {
      const key = itemEditorCollectionKey.value;
      const col = (model.value.collections as Record<string, any>)[key];
      if (!col?.items) return;
      const idx = col.items.findIndex((i: any) => i.id === itemEditorItemId.value);
      if (idx !== -1) col.items[idx] = updated;
    };

    const deleteItemEditorItem = () => {
      const key = itemEditorCollectionKey.value;
      const col = (model.value.collections as Record<string, any>)[key];
      if (!col?.items) return;
      col.items = col.items.filter((i: any) => i.id !== itemEditorItemId.value);
      itemEditorOpen.value = false;
    };

    const duplicateItemEditorItem = () => {
      const key = itemEditorCollectionKey.value;
      const col = (model.value.collections as Record<string, any>)[key];
      if (!col?.items) return;
      const original = col.items.find((i: any) => i.id === itemEditorItemId.value);
      if (!original) return;
      const cloned = globalThis.structuredClone
        ? globalThis.structuredClone(original)
        : JSON.parse(JSON.stringify(original));
      cloned.id = String(Date.now());
      col.items.push(cloned);
    };

    const openCms = async () => {
      if (hasEmbeddedToken() && !isTokenUnlocked()) {
        cmsPassword.value = '';
        cmsPasswordError.value = '';
        cmsPasswordOpen.value = true;
        return;
      }
      cmsOpen.value = true;
    };

    const submitCmsPassword = async () => {
      try {
        await unlockToken(cmsPassword.value);
        setCmsPassword(cmsPassword.value);
        cmsPasswordOpen.value = false;
        cmsPassword.value = '';
        cmsPasswordError.value = '';
        updateGithubStatus();
        cmsOpen.value = true;
      } catch {
        cmsPasswordError.value = 'Wrong password. Try again.';
      }
    };

    const handleCmsLock = () => {
      cmsOpen.value = false;
      clearCmsPassword();
      clearSessionToken();
    };

    const handleCmsReauth = () => {
      cmsOpen.value = false;
      clearCmsPassword();
      clearSessionToken();
      cmsPassword.value = '';
      cmsPasswordError.value = '';
      cmsPasswordOpen.value = true;
    };

    const toggleCmsButton = () => {
      cmsBtnVisible.value = !cmsBtnVisible.value;
      localStorage.setItem('cms-button-visible', cmsBtnVisible.value ? 'true' : 'false');
    };

    const performCommit = async (message: string) => {
      if (!message.trim()) return;

      syncing.value = true;
      try {
        if (isDev) {
          // dev: call the push endpoint which runs export-to-github.mjs
          const res = await fetch('/__cms-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message.trim() }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `Push failed (${res.status})`);
          }
        } else {
          // production: push staged CMS JSON + queued uploads to GitHub
          const payload = getStagedData() || stableStringify(model.value);

          // first commit any queued uploads that are still referenced
          const settings = loadGithubSettings();
          const token = getPlaintextToken();

          console.warn('[Linkable commit]', {
            owner: settings.owner,
            repo: settings.repo,
            branch: settings.branch,
            dataPath: settings.dataPath,
            staticDataPath: settings.staticDataPath,
            hasToken: !!token,
            payloadLength: payload?.length ?? 0,
          });

          const usedPaths = [
            (model.value.theme.layoutData as Record<string, any>).avatarUrl || '',
            (model.value.theme.layoutData as Record<string, any>).bannerUrl || '',
          ];
          model.value.collections.links.items.forEach((l: any) => {
            if (l.imageUrl) usedPaths.push(l.imageUrl);
          });
          // include gallery image sources and cover thumbnails
          if (model.value.collections.gallery?.items) {
            model.value.collections.gallery.items.forEach((g: any) => {
              if (g.src) usedPaths.push(g.src);
              if (g.coverUrl) usedPaths.push(g.coverUrl);
            });
          }
          await commitPendingUploads(settings, token, usedPaths.filter(Boolean), message);

          // then commit the CMS JSON
          await pushCmsDataToGithub(payload, message);

          // clear staged data on success
          clearStagedData();
        }

        const commitTarget = isDev
          ? 'local → GitHub'
          : `${loadGithubSettings().owner}/${loadGithubSettings().repo} → ${loadGithubSettings().dataPath}`;
        unsynced.value = false;
        toast.add({
          severity: 'success',
          summary: 'Committed',
          detail: commitTarget,
          life: 4000,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unable to push to GitHub.';
        toast.add({
          severity: 'error',
          summary: 'Commit failed',
          detail: msg,
          life: 3200,
        });
      } finally {
        syncing.value = false;
      }
    };

    const enabledLinks = computed(() =>
      (model.value.collections.links.items as any[]).filter(
        (l) => l.enabled && isScheduleVisible(l),
      ),
    );
    const enabledSocials = computed(() =>
      ((model.value.collections.socials?.items as any[]) ?? []).filter(
        (s: any) => s.enabled && s.url,
      ),
    );

    // ── Search state ─────────────────────────────────────────────────
    const searchLinksQuery = ref('');
    const searchGalleryQuery = ref('');
    const searchBlogQuery = ref('');
    const selectedLinkTags = ref<string[]>([]);
    const selectedGalleryTags = ref<string[]>([]);
    const selectedBlogTags = ref<string[]>([]);
    const linkTagFilterOpen = ref(false);
    const galleryTagFilterOpen = ref(false);
    const blogTagFilterOpen = ref(false);
    const searchNewsletterQuery = ref('');
    const selectedNewsletterTags = ref<string[]>([]);
    const newsletterTagFilterOpen = ref(false);
    const availableNewsletterTags = ref<string[]>([]);

    const filteredLinks = computed(() => {
      const q = searchLinksQuery.value.trim().toLowerCase();
      const tags = selectedLinkTags.value;
      let source = enabledLinks.value;
      if (q) {
        source = source.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.subtitle.toLowerCase().includes(q) ||
            l.url.toLowerCase().includes(q) ||
            l.tags?.some((t: string) => t.toLowerCase().includes(q)),
        );
      }
      if (tags.length > 0) {
        source = source.filter((l) => l.tags && tags.some((t: string) => l.tags.includes(t)));
      }
      return source;
    });

    const availableLinkTags = computed(() => {
      const tagSet = new Set<string>();
      for (const l of enabledLinks.value) {
        if (l.tags) l.tags.forEach((t: string) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    const toggleLinkTag = (tag: string) => {
      const idx = selectedLinkTags.value.indexOf(tag);
      if (idx >= 0) selectedLinkTags.value.splice(idx, 1);
      else selectedLinkTags.value.push(tag);
    };

    const activeTab = ref<string>('links');

    const cmsInitialTab = computed(() => {
      const contentTabs = ['links', 'embeds', 'resume', 'gallery', 'blog'];
      if (contentTabs.includes(activeTab.value)) return activeTab.value;
      if (activeTab.value.startsWith('embed-')) return 'embeds';
      if (activeTab.value === 'newsletter') return 'newsletter';
      return 'site';
    });

    const switchTab = (tab: string) => {
      activeTab.value = tab;
      // Clear newsletter view when switching away
      if (newsletterViewId.value && tab !== 'newsletter') {
        newsletterViewId.value = '';
        router.push('/');
      }
      if (typeof window !== 'undefined' && !newsletterViewId.value) {
        history.replaceState(null, '', `#${tab}`);
      }
    };

    const resumeHasContent = computed(() => {
      const rc = model.value.collections.resume;
      if (!rc || !rc.enabled) return false;
      const r = rc.items[0] as any;
      if (!r) return false;
      return !!(
        r.bio?.trim() ||
        r.education?.length ||
        r.employment?.length ||
        r.skills?.length ||
        r.achievements?.length
      );
    });

    // Resume singleton data for display
    const resumeDataForDisplay = computed(() => {
      const rc = model.value.collections.resume;
      if (!rc)
        return {
          enabled: false,
          bio: '',
          education: [],
          employment: [],
          skills: [],
          achievements: [],
        };
      const data = (rc.items[0] as any) ?? {};
      return {
        enabled: rc.enabled,
        bio: data.bio ?? '',
        education: data.education ?? [],
        employment: data.employment ?? [],
        skills: data.skills ?? [],
        achievements: data.achievements ?? [],
      };
    });

    const enabledGalleryItems = computed(() => {
      const g = model.value.collections.gallery;
      if (!g || !g.enabled) return [];
      return (g.items as any[]).filter(
        (item) => item.enabled && item.src && isScheduleVisible(item),
      );
    });

    const availableGalleryTags = computed(() => {
      const g = model.value.collections.gallery;
      if (!g || !g.enabled) return [];
      const tagSet = new Set<string>();
      for (const item of g.items as any[]) {
        if (item.enabled && item.tags) item.tags.forEach((t: string) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    const toggleGalleryTag = (tag: string) => {
      const idx = selectedGalleryTags.value.indexOf(tag);
      if (idx >= 0) selectedGalleryTags.value.splice(idx, 1);
      else selectedGalleryTags.value.push(tag);
    };

    /** Gallery items shaped for MasonryGrid layout */
    const masonryItems = computed<MasonryItem[]>(() => {
      const q = searchGalleryQuery.value.trim().toLowerCase();
      const tags = selectedGalleryTags.value;
      let source = enabledGalleryItems.value;
      if (q) {
        source = source.filter(
          (item) =>
            item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
        );
      }
      if (tags.length > 0) {
        source = source.filter((item) => item.tags && tags.some((t) => item.tags.includes(t)));
      }
      return source.map((item) => ({
        ...item,
        height: item.type === 'video' ? 300 : 400,
      }));
    });

    const galleryHasContent = computed(() => enabledGalleryItems.value.length > 0);

    // ── Blog ─────────────────────────────────────────────────────────
    const blogPosts = ref<BlogPostMeta[]>([]);
    provide('blogPosts', blogPosts);
    const currentBlogPost = ref<BlogPost | null>(null);

    // Newsletter view state (driven by /newsletter/:id route)
    const newsletterViewId = ref('');
    const newsletterViewSid = ref('');
    const newsletterViewToken = ref('');

    // Newsletter confirmation state (driven by /confirmed?status=... route)
    const confirmationStatus = ref('');

    const confirmationMap: Record<
      string,
      { icon: string; title: string; message: string; error?: boolean }
    > = {
      success: {
        icon: '🎉',
        title: "You're subscribed!",
        message: "Your email has been confirmed. You'll now receive updates.",
      },
      expired: {
        icon: '⏰',
        title: 'Link Expired',
        message: 'This confirmation link has expired. Please subscribe again to receive a new one.',
        error: true,
      },
      invalid: {
        icon: '⚠️',
        title: 'Invalid Link',
        message: 'This confirmation link is invalid or missing required parameters.',
        error: true,
      },
      'not-found': {
        icon: '🔍',
        title: 'Not Found',
        message: "We couldn't find a pending subscription for this email address.",
        error: true,
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
        error: true,
      },
    };

    const confirmationInfo = computed(
      () => confirmationMap[confirmationStatus.value] || confirmationMap.error,
    );
    const confirmationIcon = computed(() => confirmationInfo.value.icon);
    const confirmationTitle = computed(() => confirmationInfo.value.title);
    const confirmationMessage = computed(() => confirmationInfo.value.message);
    const confirmationIsError = computed(() => !!confirmationInfo.value.error);

    function goBackFromNewsletter() {
      newsletterViewId.value = '';
      router.push('/');
    }

    function viewNewsletter(id: string) {
      router.push(`/newsletter/${id}`);
    }

    const blogHasContent = computed(() => {
      const b = model.value.collections.blog;
      if (!b || !b.enabled) return false;
      return blogPosts.value.filter((p) => p.published).length > 0;
    });

    // ── Embeds ───────────────────────────────────────────────────────
    const enabledEmbeds = computed(() =>
      (model.value.collections.embeds.items as any[]).filter(
        (e) => e.enabled && e.html.trim() && isScheduleVisible(e),
      ),
    );

    const activeEmbedItem = computed(() => {
      const tab = activeTab.value;
      if (!tab.startsWith('embed-')) return null;
      const id = tab.slice(6);
      return enabledEmbeds.value.find((e) => e.id === id) ?? null;
    });

    const activeEmbedHtml = computed(() => {
      const item = activeEmbedItem.value;
      if (!item) return '';
      return resolveEmbedHtml(item.html);
    });

    const publishedBlogPosts = computed(() =>
      blogPosts.value.filter((p) => p.published && isScheduleVisible(p)),
    );

    const availableBlogTags = computed(() => {
      const tagSet = new Set<string>();
      for (const p of publishedBlogPosts.value) {
        if (p.tags) p.tags.forEach((t) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    const toggleBlogTag = (tag: string) => {
      const idx = selectedBlogTags.value.indexOf(tag);
      if (idx >= 0) selectedBlogTags.value.splice(idx, 1);
      else selectedBlogTags.value.push(tag);
    };

    const toggleNewsletterTag = (tag: string) => {
      const idx = selectedNewsletterTags.value.indexOf(tag);
      if (idx >= 0) selectedNewsletterTags.value.splice(idx, 1);
      else selectedNewsletterTags.value.push(tag);
    };

    const onNewsletterTagsLoaded = (tags: string[]) => {
      availableNewsletterTags.value = tags;
    };

    const filteredBlogPosts = computed(() => {
      const q = searchBlogQuery.value.trim().toLowerCase();
      const tags = selectedBlogTags.value;
      let source = publishedBlogPosts.value;
      if (q) {
        source = source.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.excerpt?.toLowerCase().includes(q) ||
            p.tags?.some((t) => t.toLowerCase().includes(q)),
        );
      }
      if (tags.length > 0) {
        source = source.filter((p) => p.tags && tags.some((t) => p.tags!.includes(t)));
      }
      return source;
    });

    const loadBlogPosts = async () => {
      try {
        blogPosts.value = await fetchBlogPosts();
      } catch {
        blogPosts.value = [];
      }
    };

    const loadBlogPost = async (slug: string, pushRoute = true) => {
      try {
        currentBlogPost.value = await fetchBlogPost(slug);
        if (pushRoute && router) {
          router.push({ name: 'blog-post', params: { slug } });
        }
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not load post.',
          life: 2600,
        });
      }
    };

    const goBackFromBlogPost = () => {
      currentBlogPost.value = null;
      if (router) {
        router.push('/');
      }
    };

    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return dateStr;
      }
    };

    // Show tabs when 2+ content sections have content
    const contentSections = computed(() => {
      let count = 0;
      if (enabledLinks.value.length > 0) count++;
      if (resumeHasContent.value) count++;
      if (galleryHasContent.value) count++;
      if (blogHasContent.value) count++;
      count += enabledEmbeds.value.length;
      if (model.value.collections.newsletter.enabled) count++;
      return count;
    });

    const showTabs = computed(() => contentSections.value >= 2);

    const tabItems = computed<TabItem[]>(() => {
      const items: TabItem[] = [];
      if (enabledLinks.value.length > 0) {
        items.push({
          key: 'links',
          label: model.value.collections.links.label || 'Links',
          icon: model.value.collections.links.icon || 'Link',
        });
      }
      if (galleryHasContent.value) {
        items.push({
          key: 'gallery',
          label: model.value.collections.gallery.label || 'Gallery',
          icon: model.value.collections.gallery.icon || 'Images',
        });
      }
      if (blogHasContent.value) {
        items.push({
          key: 'blog',
          label: model.value.collections.blog.label || 'Blog',
          icon: model.value.collections.blog.icon || 'Pencil',
        });
      }
      if (resumeHasContent.value) {
        items.push({
          key: 'resume',
          label: model.value.collections.resume.label || 'Resume',
          icon: model.value.collections.resume.icon || 'FileText',
        });
      }
      for (const embed of enabledEmbeds.value) {
        items.push({ key: 'embed-' + embed.id, label: embed.label, icon: embed.icon });
      }
      if (model.value.collections.newsletter.enabled) {
        items.push({
          key: 'newsletter',
          label: model.value.collections.newsletter.label || 'Newsletter',
          icon: model.value.collections.newsletter.icon || 'Mail',
        });
      }
      return items;
    });

    const handleTabSwitch = (tab: string) => {
      if (tab === 'blog') goBackFromBlogPost();
      switchTab(tab);
    };

    const showLinksSection = computed(() => {
      if (activeEmbedItem.value) return false;
      if (showTabs.value) return activeTab.value === 'links';
      return (
        enabledLinks.value.length > 0 ||
        (!resumeHasContent.value && !galleryHasContent.value && !blogHasContent.value)
      );
    });

    const showResumeSection = computed(() => {
      if (!resumeHasContent.value) return false;
      if (activeEmbedItem.value) return false;
      if (showTabs.value) return activeTab.value === 'resume';
      return true;
    });

    const showGallerySection = computed(() => {
      if (!galleryHasContent.value) return false;
      if (activeEmbedItem.value) return false;
      if (showTabs.value) return activeTab.value === 'gallery';
      return true;
    });

    const showBlogSection = computed(() => {
      if (!blogHasContent.value) return false;
      if (activeEmbedItem.value) return false;
      if (showTabs.value) return activeTab.value === 'blog';
      return true;
    });

    const showNewsletterSection = computed(() => {
      if (!model.value.collections.newsletter.enabled) return false;
      if (activeEmbedItem.value) return false;
      if (showTabs.value) return activeTab.value === 'newsletter';
      return true;
    });

    // Lightbox state
    const lightboxOpen = ref(false);
    const lightboxItem = ref<any>(null);

    const openLightbox = (item: any) => {
      lightboxItem.value = item;
      lightboxOpen.value = true;
    };

    const closeLightbox = () => {
      lightboxOpen.value = false;
      lightboxItem.value = null;
    };

    // Video player state — pre-loaded players
    const videoGalleryItems = computed(() =>
      enabledGalleryItems.value.filter((i: any) => i.type === 'video'),
    );

    const videoPlayerRefs = ref<Record<number, any>>({});
    const setVideoPlayerRef = (idx: number, el: any) => {
      if (el) videoPlayerRefs.value[idx] = el;
      else delete videoPlayerRefs.value[idx];
    };

    const videoPlayerOpen = ref(false);
    const activeVideoIdx = ref<number | null>(null);
    const videoPlayerItem = ref<any>(null);

    const openVideoPlayer = (item: any) => {
      // Find the index in the pre-loaded pool
      const idx = videoGalleryItems.value.findIndex((v: any) => v.src === item.src);
      videoPlayerItem.value = item;
      activeVideoIdx.value = idx >= 0 ? idx : null;
      videoPlayerOpen.value = true;

      // Seek to start and play — async-safe; waits for provider readiness
      if (idx >= 0) {
        const playerComp = videoPlayerRefs.value[idx];
        if (playerComp?.restart) {
          playerComp.restart().catch(() => {
            // swallow — user can tap the built-in play button as fallback
          });
        } else if (playerComp?.play) {
          playerComp.play().catch(() => {});
        }
      }
    };

    const closeVideoPlayer = () => {
      // Pause the active player so it doesn't keep playing in the background
      if (activeVideoIdx.value !== null) {
        const playerComp = videoPlayerRefs.value[activeVideoIdx.value];
        if (playerComp?.pause) {
          playerComp.pause();
        }
      }
      videoPlayerOpen.value = false;
      activeVideoIdx.value = null;
      videoPlayerItem.value = null;
    };

    const initials = computed(() => {
      const name = (model.value.profile.displayName || '').trim();
      if (!name) return 'LB';
      const parts = name.split(/\s+/).slice(0, 2);
      return parts.map((p) => (p[0] || '').toUpperCase()).join('');
    });

    const avatarErrored = ref(false);
    const avatarSrc = computed(() => {
      const u = ((model.value.theme.layoutData as Record<string, any>).avatarUrl || '').trim();
      if (!u) return '';
      if (avatarErrored.value) return '';
      return resolveUploadUrl(u);
    });

    watch(
      () => (model.value.theme.layoutData as Record<string, any>).avatarUrl,
      () => {
        avatarErrored.value = false;
      },
    );

    const onAvatarError = () => {
      avatarErrored.value = true;
    };

    const bannerErrored = ref(false);
    const bannerSrc = computed(() => {
      const u = ((model.value.theme.layoutData as Record<string, any>).bannerUrl || '').trim();
      if (!u) return '';
      if (bannerErrored.value) return '';
      return resolveUploadUrl(u);
    });

    watch(
      () => (model.value.theme.layoutData as Record<string, any>).bannerUrl,
      () => {
        bannerErrored.value = false;
      },
    );

    const onBannerError = () => {
      bannerErrored.value = true;
    };

    watchEffect(() => {
      const name = (model.value.profile.displayName || '').trim();
      const tagline = (model.value.profile.tagline || '').trim();
      if (name && tagline) {
        document.title = `${name} — ${tagline}`;
      } else if (name) {
        document.title = name;
      } else {
        document.title = 'Linkable';
      }
    });

    /** Detect email-like URLs: contains @ and . (e.g. "foo@bar.com") */
    const isEmailUrl = (url: string) => {
      if (!url) return false;
      if (url.startsWith('mailto:')) return true;
      return url.includes('@') && url.includes('.');
    };

    const socialHref = (s: { url: string }) => {
      if (isEmailUrl(s.url) && !s.url.startsWith('mailto:')) {
        return 'mailto:' + s.url;
      }
      return s.url;
    };

    const resolveSocialIcon = (name: string) => {
      return (
        (lucideIcons as Record<string, any>)[name] ?? (lucideIcons as Record<string, any>)['Globe']
      );
    };

    const exportJson = async () => {
      const json = stableStringify(model.value);
      await navigator.clipboard.writeText(json);
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Your JSON export is copied to clipboard.',
        life: 2200,
      });
    };

    const importOpen = ref(false);
    const importText = ref('');

    const updateModel = (next: BioModel) => {
      model.value = next;
    };

    const applyImport = () => {
      try {
        const parsed = sanitizeModel(JSON.parse(importText.value));
        updateModel(parsed);
        importOpen.value = false;
        importText.value = '';
        toast.add({
          severity: 'success',
          summary: 'Imported',
          detail: 'Your site content was updated.',
          life: 2200,
        });
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Invalid JSON',
          detail: 'Please paste a valid export file.',
          life: 2600,
        });
      }
    };

    let persistChain: Promise<void> = Promise.resolve();
    let persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let lastModelSnapshot = '';

    watch(
      () => stableStringify(model.value),
      (snapshot) => {
        if (!modelLoaded.value || suppressPersist.value) {
          lastModelSnapshot = snapshot;
          return;
        }
        // Skip if the serialised form hasn't actually changed
        if (snapshot === lastModelSnapshot) return;
        lastModelSnapshot = snapshot;

        // mark unsynced immediately when model changes
        unsynced.value = true;

        // debounce to batch rapid changes (e.g. drag reorder)
        if (persistDebounceTimer) clearTimeout(persistDebounceTimer);
        persistDebounceTimer = setTimeout(
          () => {
            persistChain = persistChain.then(async () => {
              syncing.value = true;
              try {
                await persistModel(model.value);
                // Keep unsynced=true in both dev and prod.
                // In dev: local file is saved but not pushed to GitHub yet.
                // In prod: staged in localStorage, not committed yet.
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Unable to save changes.';
                toast.add({
                  severity: 'error',
                  summary: 'Save failed',
                  detail: message,
                  life: 3200,
                });
              } finally {
                syncing.value = false;
              }
            });
          },
          isDev ? 100 : 300,
        );
      },
    );

    const repoLabel = computed(() => {
      const owner = githubSettings.value.owner;
      const repo = githubSettings.value.repo;
      return owner && repo ? `${owner}/${repo}` : 'GitHub not configured';
    });

    const syncStatusText = computed(() => {
      if (syncing.value) {
        return isDev ? 'Pushing to GitHub…' : `Syncing with GitHub · ${repoLabel.value}`;
      }
      if (unsynced.value) {
        return isDev
          ? 'Uncommitted changes · Saved locally'
          : `Uncommitted changes · ${repoLabel.value}`;
      }
      if (isDev) {
        return 'Up to date';
      }
      if (githubReady.value) {
        return `Synced to GitHub · ${repoLabel.value}`;
      }
      return 'Static site · Read-only · Add GitHub sync to enable editing';
    });

    const syncStatusShort = computed(() => {
      if (syncing.value) return 'Syncing…';
      if (unsynced.value) return 'Publish';
      if (isDev || githubReady.value) return 'Synced';
      return 'Read-only';
    });

    const syncIndicatorClass = computed(() => {
      if (syncing.value) {
        return 'bg-[color:var(--color-brand)] shadow-[0_0_0_4px_rgba(59,130,246,0.18)] animate-pulse';
      }
      if (unsynced.value) {
        return 'bg-yellow-400 shadow-[0_0_0_4px_rgba(245,158,11,0.20)]';
      }
    });

    const togglePreviewMode = () => {
      previewMode.value = !previewMode.value;
    };

    return {
      isDev,
      model,
      cmsOpen,
      cmsPasswordOpen,
      cmsPassword,
      cmsPasswordError,
      openCms,
      submitCmsPassword,
      handleCmsLock,
      handleCmsReauth,
      cmsBtnVisible,
      previewMode,
      cmsTargetSubTab,
      cmsTargetItemId,
      cmsNavTrigger,
      itemEditorOpen,
      itemEditorCollectionKey,
      itemEditorItemId,
      itemEditorSchema,
      itemEditorItem,
      itemEditorTitle,
      updateItemEditorItem,
      deleteItemEditorItem,
      duplicateItemEditorItem,
      enabledLinks,
      enabledSocials,
      activeTab,
      cmsInitialTab,
      resumeHasContent,
      resumeDataForDisplay,
      galleryHasContent,
      enabledGalleryItems,
      masonryItems,
      showTabs,
      showLinksSection,
      showResumeSection,
      showGallerySection,
      lightboxOpen,
      lightboxItem,
      openLightbox,
      closeLightbox,
      videoPlayerOpen,
      videoPlayerItem,
      videoGalleryItems,
      videoPlayerRefs,
      setVideoPlayerRef,
      activeVideoIdx,
      openVideoPlayer,
      closeVideoPlayer,
      initials,
      avatarSrc,
      onAvatarError,
      bannerSrc,
      onBannerError,
      exportJson,
      importOpen,
      importText,
      applyImport,
      updateModel,
      canUseCms,
      toggleCmsButton,
      gitDialogOpen,
      performCommit,
      syncStatusText,
      syncStatusShort,
      syncIndicatorClass,
      togglePreviewMode,
      unsynced,
      resolveUploadUrl,
      blogHasContent,
      enabledEmbeds,
      activeEmbedItem,
      activeEmbedHtml,
      blogPosts,
      publishedBlogPosts,
      currentBlogPost,
      loadBlogPost,
      loadBlogPosts,
      goBackFromBlogPost,
      showBlogSection,
      showNewsletterSection,
      newsletterViewId,
      newsletterViewSid,
      newsletterViewToken,
      goBackFromNewsletter,
      viewNewsletter,
      confirmationStatus,
      confirmationIcon,
      confirmationTitle,
      confirmationMessage,
      confirmationIsError,
      selectedLinkTags,
      selectedGalleryTags,
      selectedBlogTags,
      availableLinkTags,
      availableGalleryTags,
      availableBlogTags,
      linkTagFilterOpen,
      galleryTagFilterOpen,
      blogTagFilterOpen,
      selectedNewsletterTags,
      availableNewsletterTags,
      newsletterTagFilterOpen,
      onNewsletterTagsLoaded,
      trackClick,
      // Resolved overridable components
      resolvedProfileHeader,
      resolvedTabNav,
      resolvedLinksSection,
      resolvedResumeSection,
      resolvedGallerySection,
      resolvedBlogSection,
      resolvedEmbedSection,
      resolvedNewsletterSection,
      resolvedNewsletterViewPage,
      resolvedLightboxOverlay,
      resolvedVideoOverlay,
      resolvedPageFooter,
      layoutRoutes,
      isOnLayoutRoute,
      tabItems,
      handleTabSwitch,
    };
  },
});
</script>

<style scoped>
/* CMS button: slide in from right */
.cms-slide-right-enter-active,
.cms-slide-right-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.cms-slide-right-enter-from,
.cms-slide-right-leave-to {
  opacity: 0;
  transform: translateY(16px) translateX(12px);
}

/* Status bar: slide in from left */
.cms-slide-left-enter-active,
.cms-slide-left-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.cms-slide-left-enter-from,
.cms-slide-left-leave-to {
  opacity: 0;
  transform: translateY(16px) translateX(-12px);
}
</style>
