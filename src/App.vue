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
      :initial-embed-id="''"
      :initial-blog-slug="''"
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

import CmsDialog from './admin/CmsDialog.vue';
import CollectionItemDrawer from './admin/CollectionItemDrawer.vue';
import GitCommitDialog from './admin/GitCommitDialog.vue';

import { getLayoutManifest } from './lib/component-resolver';
import { useLayoutRoutes } from './lib/component-resolver';
import { defaultModel, type BioModel, sanitizeModel, stableStringify } from './lib/model';
import { fetchModel, persistModel, getStagedData, clearStagedData } from './lib/persistence';
import { fetchBlogPosts, type BlogPostMeta } from './lib/blog';
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
  type GithubSettings,
} from './lib/github';
import { setCmsPassword, clearCmsPassword } from './lib/cms-auth';
import { trackPageview } from './lib/analytics';

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
  },
  setup() {
    const isDev = import.meta.env.DEV;
    const toast = useToast();
    const route = useRoute();
    const router = useRouter();

    // ── Model & Layout ─────────────────────────────────────────────
    const model = ref<BioModel>(defaultModel());
    provide('bioModel', model);
    const activeLayout = computed(() => model.value.theme.layout || 'default');

    // ── Layout-contributed routes ────────────────────────────────────
    const layoutRoutes = useLayoutRoutes(router, activeLayout);

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

    const applyHashCms = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.toLowerCase();
      if (hash === '#cms') {
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
        window.addEventListener('hashchange', applyHashCms);
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

      // Load blog posts (for CMS panel)
      await loadBlogPosts();

      // Handle #cms hash
      applyHashCms();

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
        window.removeEventListener('hashchange', applyHashCms);
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

    // Track pageview on route changes
    watch(() => route.name, () => {
      trackPageview();
    });

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
      let faviconLink = document.querySelector<HTMLLinkElement>('link#__platformkit-favicon');
      if (p.faviconUrl) {
        if (!faviconLink) {
          faviconLink = document.createElement('link');
          faviconLink.id = '__platformkit-favicon';
          faviconLink.rel = 'icon';
          document.head.appendChild(faviconLink);
        }
        faviconLink.href = p.faviconUrl;
      } else if (faviconLink) {
        faviconLink.remove();
      }

      // Apple touch icon — only use favicon if explicitly set by the user
      const touchSrc = p.faviconUrl;
      let touchLink = document.querySelector<HTMLLinkElement>('link#__platformkit-apple-touch');
      if (touchSrc) {
        if (!touchLink) {
          touchLink = document.createElement('link');
          touchLink.id = '__platformkit-apple-touch';
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
    _headContainer.id = '__platformkit-head-scripts';
    const _bodyContainer = document.createElement('div');
    _bodyContainer.id = '__platformkit-body-scripts';

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

    const performCommit = async (message: string) => {
      if (!message.trim()) return;

      syncing.value = true;
      try {
        if (isDev) {
          // dev: call the push endpoint which runs export-to-github.mjs
          const res = await fetch(typeof __PK_CMS_PUSH_ENDPOINT__ !== "undefined" ? __PK_CMS_PUSH_ENDPOINT__ : '/__cms-push', {
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

          console.warn('[PlatformKit commit]', {
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

    // ── Blog posts (for CMS panel) ──────────────────────────────────
    const blogPosts = ref<BlogPostMeta[]>([]);
    provide('blogPosts', blogPosts);

    const loadBlogPosts = async () => {
      try {
        blogPosts.value = await fetchBlogPosts();
      } catch {
        blogPosts.value = [];
      }
    };

    // Derive CMS initial tab from route
    const cmsInitialTab = computed(() => {
      const path = route.path;
      if (path.startsWith('/content/')) return 'blog';
      if (path.startsWith('/newsletter/')) return 'newsletter';
      if (path === '/about') return 'resume';
      if (path === '/gallery') return 'gallery';
      if (path === '/blog') return 'blog';
      if (path === '/embeds') return 'embeds';
      if (path === '/newsletter') return 'newsletter';
      return 'site';
    });

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
      cmsInitialTab,
      canUseCms,
      gitDialogOpen,
      performCommit,
      syncStatusText,
      syncStatusShort,
      syncIndicatorClass,
      togglePreviewMode,
      unsynced,
      loadBlogPosts,
      exportJson,
      importOpen,
      importText,
      applyImport,
      updateModel,
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
