<template>
  <Dialog
    v-model:visible="visible"
    modal
    :style="{ width: 'min(980px, 96vw)' }"
    :contentStyle="{ overflow: 'hidden' }"
    :showCloseIcon="true"
  >
    <template #header>
      <div class="flex items-center justify-between w-full pr-2">
        <span class="font-bold">CMS</span>
        <div class="flex items-center gap-2">
          <div class="cms__status" :class="{ 'is-dirty': hasChanges }">
            <span class="cms__dot" />
            <span>{{ hasChanges ? "Unsaved changes" : "Saved" }}</span>
          </div>
          <Button text rounded size="small" @click="lockCms" v-tooltip.bottom="'Lock &amp; sign out'">
            <i class="pi pi-lock" />
          </Button>
        </div>
      </div>
    </template>

    <div class="cms">
      <div class="cms__tabBar">
        <div class="cms__tabBarInner">
          <div class="cms__tabs" :class="{ 'cms__tabs--4': supabaseUrl }">
            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'site' }"
              @click="tab = 'site'"
            >
              <span class="cms__tab-icon"><i class="pi pi-cog" /></span>
              <span class="cms__tab-label">Site</span>
              <span class="cms__tab-pill cms__tab-pill--ghost" aria-hidden="true">0</span>
            </button>

            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'content' }"
              @click="tab = 'content'"
            >
              <span class="cms__tab-icon"><i class="pi pi-th-large" /></span>
              <span class="cms__tab-label">Content</span>
              <span class="cms__tab-pill">{{ draft.links.length + draft.embeds.length + draft.gallery.items.length }}</span>
            </button>

            <button
              v-if="supabaseUrl"
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'newsletter' }"
              @click="tab = 'newsletter'; if (subscribers.length === 0) { loadSubscribers(); loadSends(); }"
            >
              <span class="cms__tab-icon"><i class="pi pi-envelope" /></span>
              <span class="cms__tab-label">Newsletter</span>
              <span class="cms__tab-pill" :class="{ 'cms__tab-pill--ghost': subscriberCounts.total === 0 }">{{ subscriberCounts.confirmed }}</span>
            </button>

            <button
              v-if="supabaseUrl"
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'analytics' }"
              @click="tab = 'analytics'"
            >
              <span class="cms__tab-icon"><i class="pi pi-chart-line" /></span>
              <span class="cms__tab-label">Analytics</span>
              <span class="cms__tab-pill cms__tab-pill--ghost" aria-hidden="true">0</span>
            </button>

            <button
              v-for="lt in layoutCmsTabs"
              :key="lt.key"
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === lt.key }"
              @click="tab = lt.key"
            >
              <span class="cms__tab-icon"><i :class="'pi ' + lt.icon" /></span>
              <span class="cms__tab-label">{{ lt.label }}</span>
              <span class="cms__tab-pill cms__tab-pill--ghost" aria-hidden="true">0</span>
            </button>
          </div>
        </div>
      </div>

      <div class="cms__content">
        <section v-if="tab === 'site'" class="cms__panel">
          <div class="cms__panel-head">
            <div class="cms__title">Site</div>
            <div class="cms__sub">Configure your profile, images, and theme.</div>
          </div>

          <!-- Identity -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.identity = !siteSection.identity">
            <span class="cms__accordion-label"><i class="pi pi-user" /> Identity</span>
            <i class="pi" :class="siteSection.identity ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.identity" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__field">
                  <label class="cms__label">Name</label>
                  <InputText v-model="draft.profile.displayName" class="w-full" />
                </div>
                <div class="cms__field">
                  <label class="cms__label">Description</label>
                  <Textarea v-model="draft.profile.tagline" autoResize rows="3" class="w-full" />
                </div>
              </div>
            </div>
          </Transition>

          <!-- Images -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.images = !siteSection.images">
            <span class="cms__accordion-label"><i class="pi pi-image" /> Images</span>
            <i class="pi" :class="siteSection.images ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.images" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__field">
                  <ImageUploadField
                    v-model="draft.profile.bannerUrl"
                    label="Banner image"
                    description="A wide image displayed above your profile card."
                    targetFilename="banner.jpg"
                  >
                    <template #helper>
                      <div class="cms__help">Recommended: 1480 × 420 px.</div>
                    </template>
                  </ImageUploadField>
                </div>
                <div class="cms__field">
                  <ImageUploadField
                    v-model="draft.profile.avatarUrl"
                    label="Avatar image"
                    description="Square image for your profile."
                    targetFilename="avatar.jpg"
                  >
                    <template #helper>
                      <div class="cms__help">Crisp, square images work best.</div>
                    </template>
                  </ImageUploadField>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Favicon & Social Image -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.favicon = !siteSection.favicon">
            <span class="cms__accordion-label"><i class="pi pi-globe" /> Favicon &amp; Social Image</span>
            <i class="pi" :class="siteSection.favicon ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.favicon" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__field">
                  <ImageUploadField
                    v-model="draft.profile.faviconUrl"
                    label="Favicon"
                    description="PNG or SVG — appears in browser tabs and bookmarks."
                    targetFilename="favicon.png"
                  >
                    <template #helper>
                      <div class="cms__help">Recommended: 512 × 512 px square PNG.</div>
                    </template>
                  </ImageUploadField>
                </div>
                <div class="cms__field">
                  <ImageUploadField
                    v-model="draft.profile.ogImageUrl"
                    label="Social / PWA thumbnail"
                    description="Shown when your site is shared on social media and used as the PWA icon."
                    targetFilename="og-image.jpg"
                  >
                    <template #helper>
                      <div class="cms__help">Recommended: 1200 × 630 px for social cards.</div>
                    </template>
                  </ImageUploadField>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Theme -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.theme = !siteSection.theme">
            <span class="cms__accordion-label"><i class="pi pi-palette" /> Theme</span>
            <i class="pi" :class="siteSection.theme ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.theme" class="cms__accordion-body">
              <div class="cms__form">
                <div v-if="layoutOptions.length > 1" class="cms__field">
                  <label class="cms__label">Layout</label>
                  <Select
                    v-model="draft.theme.layout"
                    :options="layoutOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                  <div class="cms__help">Choose a layout style for the public page.</div>
                </div>

                <div class="cms__field">
                  <label class="cms__label">Preset</label>
                  <Select
                    :modelValue="draft.theme.preset"
                    @update:modelValue="applyPreset($event)"
                    :options="presetOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                  <div class="cms__help">Choose a base theme. You can override individual values below.</div>
                </div>

                <div v-if="hasAnyOverride" class="cms__field" style="margin-bottom: 4px;">
                  <button class="cms__reset-all-btn" @click="resetAll">
                    <i class="pi pi-undo" style="font-size: 12px;" /> Reset all overrides
                  </button>
                </div>

                <div class="cms__color-section-label">Colours</div>
                <div class="cms__color-grid">
                  <div class="cms__color-field">
                    <label class="cms__label">Brand <button v-if="isOverridden('colorBrand')" class="cms__reset-btn" @click="resetField('colorBrand')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorBrand" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBrand" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Brand Strong <button v-if="isOverridden('colorBrandStrong')" class="cms__reset-btn" @click="resetField('colorBrandStrong')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorBrandStrong" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBrandStrong" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Accent <button v-if="isOverridden('colorAccent')" class="cms__reset-btn" @click="resetField('colorAccent')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorAccent" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorAccent" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Text <button v-if="isOverridden('colorInk')" class="cms__reset-btn" @click="resetField('colorInk')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorInk" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorInk" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Text Soft <button v-if="isOverridden('colorInkSoft')" class="cms__reset-btn" @click="resetField('colorInkSoft')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorInkSoft" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorInkSoft" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Background <button v-if="isOverridden('bg')" class="cms__reset-btn" @click="resetField('bg')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.bg" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.bg" class="cms__color-hex" />
                    </div>
                  </div>
                </div>

                <div class="cms__color-section-label">Surfaces &amp; Borders</div>
                <div class="cms__color-grid">
                  <div class="cms__color-field">
                    <label class="cms__label">Glass <button v-if="isOverridden('glass')" class="cms__reset-btn" @click="resetField('glass')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.glass)" @input="draft.theme.glass = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.glass" class="cms__color-hex" placeholder="rgba(255,255,255,0.66)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Glass 2 <button v-if="isOverridden('glass2')" class="cms__reset-btn" @click="resetField('glass2')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.glass2)" @input="draft.theme.glass2 = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.glass2" class="cms__color-hex" placeholder="rgba(255,255,255,0.52)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Glass Strong <button v-if="isOverridden('glassStrong')" class="cms__reset-btn" @click="resetField('glassStrong')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.glassStrong)" @input="draft.theme.glassStrong = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.glassStrong" class="cms__color-hex" placeholder="rgba(255,255,255,0.82)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Border <button v-if="isOverridden('colorBorder')" class="cms__reset-btn" @click="resetField('colorBorder')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.colorBorder)" @input="draft.theme.colorBorder = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBorder" class="cms__color-hex" placeholder="rgba(255,255,255,0.62)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Border 2 <button v-if="isOverridden('colorBorder2')" class="cms__reset-btn" @click="resetField('colorBorder2')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.colorBorder2)" @input="draft.theme.colorBorder2 = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBorder2" class="cms__color-hex" placeholder="rgba(11,18,32,0.10)" />
                    </div>
                  </div>
                </div>

                <div class="cms__color-section-label">Card Items</div>
                <div class="cms__color-grid">
                  <div class="cms__color-field">
                    <label class="cms__label">Card Background <button v-if="isOverridden('cardBg')" class="cms__reset-btn" @click="resetField('cardBg')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.cardBg)" @input="draft.theme.cardBg = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.cardBg" class="cms__color-hex" placeholder="rgba(255,255,255,0.66)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Card Border <button v-if="isOverridden('cardBorder')" class="cms__reset-btn" @click="resetField('cardBorder')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.cardBorder)" @input="draft.theme.cardBorder = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.cardBorder" class="cms__color-hex" placeholder="rgba(255,255,255,0.62)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Card Text <button v-if="isOverridden('cardText')" class="cms__reset-btn" @click="resetField('cardText')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.cardText" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.cardText" class="cms__color-hex" placeholder="#0b1220" />
                    </div>
                  </div>
                </div>

                <div class="cms__color-section-label">Radius</div>
                <div class="cms__color-grid">
                  <div class="cms__color-field">
                    <label class="cms__label">Card Radius (XL) <button v-if="isOverridden('radiusXl')" class="cms__reset-btn" @click="resetField('radiusXl')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <InputText v-model="draft.theme.radiusXl" class="cms__color-hex cms__color-hex--full" placeholder="1.6rem" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Inner Radius (LG) <button v-if="isOverridden('radiusLg')" class="cms__reset-btn" @click="resetField('radiusLg')" title="Reset to preset"><i class="pi pi-undo" /></button></label>
                    <div class="cms__color-input-wrap">
                      <InputText v-model="draft.theme.radiusLg" class="cms__color-hex cms__color-hex--full" placeholder="1.2rem" />
                    </div>
                  </div>
                </div>

                <!-- Layout-specific variables -->
                <template v-if="activeManifest && activeManifest.vars.length > 0">
                  <div class="cms__color-section-label">{{ activeManifest.name }} Layout</div>
                  <div class="cms__color-grid">
                    <div v-for="v in activeManifest.vars" :key="v.cssVar" class="cms__color-field">
                      <label class="cms__label">{{ v.label }}</label>
                      <div class="cms__color-input-wrap">
                        <input
                          v-if="v.type === 'color'"
                          type="color"
                          :value="toHex(getLayoutVar(v))"
                          @input="setLayoutVar(v.cssVar, ($event.target as HTMLInputElement).value)"
                          class="cms__color-swatch"
                        />
                        <InputText
                          :modelValue="getLayoutVar(v)"
                          @update:modelValue="setLayoutVar(v.cssVar, $event as string)"
                          class="cms__color-hex"
                          :class="{ 'cms__color-hex--full': v.type !== 'color' }"
                          :placeholder="draft.theme.preset === 'dark' ? v.defaultDark : v.defaultLight"
                        />
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Layout-specific schema settings -->
                <template v-if="activeManifest?.schema?.length">
                  <div class="cms__color-section-label">{{ activeManifest.name }} Settings</div>
                  <LayoutSchemaRenderer
                    :schema="activeManifest.schema"
                    :modelValue="draft.theme.layoutData"
                    @update:modelValue="draft.theme.layoutData = $event"
                  />
                </template>

                <button
                  type="button"
                  class="cms__reset-theme"
                  @click="resetTheme"
                >
                  <i class="pi pi-refresh" /> Reset to defaults
                </button>
              </div>
            </div>
          </Transition>

          <!-- Search -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.search = !siteSection.search">
            <span class="cms__accordion-label"><i class="pi pi-search" /> Search</span>
            <i class="pi" :class="siteSection.search ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.search" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__help" style="margin-bottom: 8px">Enable search bars for visitors to filter content in each section.</div>
                <div class="cms__field" style="display: flex; align-items: center; gap: 12px">
                  <ToggleSwitch v-model="draft.profile.searchLinks" />
                  <label class="cms__label" style="margin: 0">Links search</label>
                </div>
                <div class="cms__field" style="display: flex; align-items: center; gap: 12px">
                  <ToggleSwitch v-model="draft.profile.searchGallery" />
                  <label class="cms__label" style="margin: 0">Gallery search</label>
                </div>
                <div class="cms__field" style="display: flex; align-items: center; gap: 12px">
                  <ToggleSwitch v-model="draft.profile.searchBlog" />
                  <label class="cms__label" style="margin: 0">Blog search</label>
                </div>
                <div v-if="supabaseUrl" class="cms__field" style="display: flex; align-items: center; gap: 12px">
                  <ToggleSwitch v-model="draft.profile.searchNewsletter" />
                  <label class="cms__label" style="margin: 0">Newsletter search</label>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Navigation -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.navigation = !siteSection.navigation">
            <span class="cms__accordion-label"><i class="pi pi-compass" /> Navigation</span>
            <i class="pi" :class="siteSection.navigation ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.navigation" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__field">
                  <label class="cms__label">Default tab</label>
                  <Select
                    v-model="draft.profile.defaultTab"
                    :options="defaultTabOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                  <div class="cms__help">The tab visitors see first when they land on your page.</div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Socials -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.socials = !siteSection.socials">
            <span class="cms__accordion-label"><i class="pi pi-share-alt" /> Socials</span>
            <i class="pi" :class="siteSection.socials ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.socials" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__help" style="margin-bottom: 8px">
                  Add social links that show under your name.
                </div>

                <div class="flex justify-end" style="margin-bottom: 8px">
                  <Button rounded class="cms__primary cms__primary--addon" @click="createAndEditSocial">
                    <i class="pi pi-plus" />
                    <span class="cms__btn-label">Add social</span>
                  </Button>
                </div>

                <div v-if="draft.socials.length === 0" class="cms__empty">
                  <div class="cms__empty-title">No socials yet</div>
                  <div class="cms__empty-sub">
                    Add GitHub, Instagram, X, YouTube, TikTok, or Website.
                  </div>
                </div>

                <draggable
                  v-else
                  v-model="draft.socials"
                  item-key="id"
                  handle=".drag"
                  :animation="160"
                  class="cms__socialList"
                >
                  <template #item="{ element: s }">
                    <button
                      type="button"
                      class="cms__row"
                      @click="openSocialEditor(s.id)"
                    >
                      <span class="cms__row-drag drag" aria-label="Drag">
                        <i class="pi pi-bars" />
                      </span>

                      <span class="cms__row-thumb">
                        <component :is="resolveLucideIcon(s.icon)" :size="16" />
                      </span>

                      <span class="cms__row-text">
                        <span class="cms__row-title">{{ s.label || s.icon || 'Social' }}</span>
                        <span class="cms__row-sub">{{ s.url || "(no url)" }}</span>
                      </span>

                      <span class="cms__row-meta">
                        <Tag v-if="!s.enabled" severity="warning" value="Hidden" class="!rounded-full" />
                        <i v-else class="pi pi-check-circle cms__ok" />
                        <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                      </span>
                    </button>
                  </template>
                </draggable>
              </div>
            </div>
          </Transition>

          <!-- Scripts -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.scripts = !siteSection.scripts">
            <span class="cms__accordion-label"><i class="pi pi-code" /> Scripts</span>
            <i class="pi" :class="siteSection.scripts ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.scripts" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__help" style="margin-bottom: 8px">Inject custom JavaScript for analytics, tracking pixels, or other third-party scripts.</div>
                <div class="cms__field">
                  <label class="cms__label">Head scripts</label>
                  <div class="cms__help">Inserted inside <code>&lt;head&gt;</code> — ideal for analytics, meta-pixel, etc.</div>
                  <Textarea v-model="draft.scripts.headScript" rows="5" placeholder='<script src="https://..."></script>' style="font-family: monospace; font-size: 13px" />
                </div>
                <div class="cms__field">
                  <label class="cms__label">Body-end scripts</label>
                  <div class="cms__help">Inserted just before <code>&lt;/body&gt;</code> — for chat widgets, defer scripts, etc.</div>
                  <Textarea v-model="draft.scripts.bodyEndScript" rows="5" placeholder='<script src="https://..."></script>' style="font-family: monospace; font-size: 13px" />
                </div>
              </div>
            </div>
          </Transition>

          <!-- GitHub Sync -->
          <button type="button" class="cms__accordion-trigger" @click="siteSection.github = !siteSection.github">
            <span class="cms__accordion-label"><i class="pi pi-github" /> GitHub Sync</span>
            <i class="pi" :class="siteSection.github ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="siteSection.github" class="cms__accordion-body">
              <div class="cms__form">
                <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-4 shadow-sm">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div class="text-sm font-extrabold text-[color:var(--color-ink)]">Repository connection</div>
                      <div class="text-xs font-semibold text-[color:var(--color-ink-soft)]">
                        Changes made in production will commit to this repository.
                      </div>
                    </div>
                    <Tag
                      :value="githubReady ? 'Connected' : 'Not configured'"
                      :severity="githubReady ? 'success' : 'warning'"
                      class="!rounded-full"
                    />
                  </div>

                  <div class="mt-4 grid gap-3 md:grid-cols-2">
                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Owner</label>
                      <InputText :model-value="githubForm.owner" placeholder="e.g. your-github-username" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Repository</label>
                      <InputText :model-value="githubForm.repo" placeholder="e.g. linkable" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Branch</label>
                      <InputText :model-value="githubForm.branch" placeholder="main" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Uploads directory</label>
                      <InputText :model-value="githubForm.uploadsDir" placeholder="public/uploads" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Data file path</label>
                      <InputText :model-value="githubForm.dataPath" placeholder="cms-data.json" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Static data path</label>
                      <InputText :model-value="githubForm.staticDataPath" placeholder="public/data.json" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Blog directory</label>
                      <InputText :model-value="githubForm.blogDir" placeholder="blog" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Committer name</label>
                      <InputText :model-value="githubForm.committerName" placeholder="Linkable CMS" disabled />
                    </div>

                    <div class="grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Committer email</label>
                      <InputText :model-value="githubForm.committerEmail" placeholder="cms@linkable.local" disabled />
                    </div>

                  </div>
                </div>


                <div class="mt-4 flex gap-2 justify-end">
                  <Button
                    rounded
                    severity="secondary"
                    :loading="githubTesting"
                    @click="handleGithubTest"
                    class="!rounded-full"
                  >
                    <i class="pi pi-shield" />
                    <span class="ml-2">Test connection</span>
                  </Button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Supabase -->
          <template v-if="supabaseUrl">
            <button type="button" class="cms__accordion-trigger" @click="siteSection.supabase = !siteSection.supabase">
              <span class="cms__accordion-label"><i class="pi pi-database" /> Supabase</span>
              <i class="pi" :class="siteSection.supabase ? 'pi-chevron-up' : 'pi-chevron-down'" />
            </button>
            <Transition name="cms-collapse">
              <div v-if="siteSection.supabase" class="cms__accordion-body">
                <div class="cms__form">
                  <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-4 shadow-sm">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div class="text-sm font-extrabold text-[color:var(--color-ink)]">Backend connection</div>
                        <div class="text-xs font-semibold text-[color:var(--color-ink-soft)]">
                          Supabase provides the database, auth, and edge functions for backend features.
                        </div>
                      </div>
                      <Tag value="Connected" severity="success" class="!rounded-full" />
                    </div>
                    <div class="mt-4 grid gap-2">
                      <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Project URL</label>
                      <InputText :model-value="supabaseUrl" disabled />
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </template>
        </section>

        <section v-else-if="tab === 'content'" class="cms__panel">
          <!-- Content sub-tabs (desktop) -->
          <div class="cms__subTabBar cms__subTabBar--desktop">
            <button type="button" class="cms__subTab" :class="{ 'is-active': contentSubTab === 'links' }" @click="contentSubTab = 'links'">
              <i class="pi pi-link" /> Links
            </button>
            <button type="button" class="cms__subTab" :class="{ 'is-active': contentSubTab === 'gallery' }" @click="contentSubTab = 'gallery'">
              <i class="pi pi-images" /> Gallery
            </button>
            <button type="button" class="cms__subTab" :class="{ 'is-active': contentSubTab === 'blog' }" @click="contentSubTab = 'blog'">
              <i class="pi pi-pencil" /> Blog
            </button>
            <button type="button" class="cms__subTab" :class="{ 'is-active': contentSubTab === 'resume' }" @click="contentSubTab = 'resume'">
              <i class="pi pi-file" /> Resume
            </button>
            <button type="button" class="cms__subTab" :class="{ 'is-active': contentSubTab === 'embeds' }" @click="contentSubTab = 'embeds'">
              <i class="pi pi-code" /> Embeds
            </button>
          </div>
          <!-- Content sub-tabs (mobile) -->
          <div class="cms__subTabBar cms__subTabBar--mobile">
            <Select
              :modelValue="contentSubTab"
              @update:modelValue="contentSubTab = $event"
              :options="contentSubTabOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div v-if="contentSubTab === 'links'" class="cms__subPanel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Links</div>
              <div class="cms__sub">Add, edit, and reorder your buttons.</div>
            </div>

            <Button rounded class="cms__primary cms__primary--addon" @click="createAndEditLink">
              <i class="pi pi-plus" />
              <span class="cms__btn-label">Add link</span>
              <span class="cms__btn-label--compact">Add</span>
            </Button>
          </div>

          <div class="cms__card" style="margin-bottom: 10px">
            <div class="cms__form">
              <div class="cms__field">
                <label class="cms__label">Tab label</label>
                <InputText v-model="draft.profile.linksLabel" class="w-full" placeholder="Links" />
                <div class="cms__help">Customise the tab name shown on the public page.</div>
              </div>
              <div class="cms__field">
                <label class="cms__label">Tab icon</label>
                <AutoComplete
                  v-model="draft.profile.linksIcon"
                  :suggestions="filteredTabIcons"
                  @complete="searchTabIcons"
                  placeholder="Search icons… e.g. Link"
                  class="w-full"
                  :inputClass="'w-full'"
                  forceSelection
                >
                  <template #option="{ option }">
                    <div class="flex items-center gap-2.5 py-0.5">
                      <component :is="getTabIconComponent(option)" :size="18" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span class="text-sm font-medium">{{ option }}</span>
                    </div>
                  </template>
                  <template #value="{ value }">
                    <div v-if="value" class="flex items-center gap-2">
                      <component :is="getTabIconComponent(value)" :size="16" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span>{{ value }}</span>
                    </div>
                  </template>
                </AutoComplete>
                <div class="cms__help">Choose from <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" class="underline">Lucide icons</a>. Leave empty for default.</div>
              </div>
            </div>
          </div>

          <div class="cms__card">
            <div v-if="draft.links.length === 0" class="cms__empty">
              <div class="cms__empty-title">No links yet</div>
              <div class="cms__empty-sub">Click “Add link” to create your first one.</div>
            </div>

            <draggable
              v-else
              v-model="draft.links"
              item-key="id"
              handle=".drag"
              :animation="160"
              class="cms__list"
            >
              <template #item="{ element }">
                <button type="button" class="cms__row" @click="openLinkEditor(element.id)">
                  <span class="cms__row-drag drag" aria-label="Drag">
                    <i class="pi pi-bars" />
                  </span>

                  <span class="cms__row-thumb">
                    <img
                      v-if="element.imageUrl"
                      :src="element.imageUrl"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                    <i v-else class="pi pi-link text-[color:var(--color-ink-soft)]" />
                  </span>

                  <span class="cms__row-text">
                    <span class="cms__row-title">{{ element.title || "Untitled" }}</span>
                    <span class="cms__row-sub">{{ element.url || "(no url)" }}</span>
                  </span>

                  <span class="cms__row-meta">
                    <Tag v-if="!element.enabled" severity="warning" value="Hidden" class="!rounded-full" />
                    <i v-else class="pi pi-check-circle cms__ok" />
                    <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                  </span>
                </button>
              </template>
            </draggable>
          </div>
          </div>

          <div v-else-if="contentSubTab === 'gallery'" class="cms__subPanel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Gallery</div>
              <div class="cms__sub">Manage images and videos for your gallery.</div>
            </div>

            <Button rounded class="cms__primary cms__primary--addon" @click="createAndEditGalleryItem">
              <i class="pi pi-plus" />
              <span class="cms__btn-label">Add item</span>
              <span class="cms__btn-label--compact">Add</span>
            </Button>
          </div>

          <div class="cms__card" style="margin-bottom: 10px">
            <div class="cms__form">
              <div class="cms__field">
                <label class="cms__label">Tab label</label>
                <InputText v-model="draft.profile.galleryLabel" class="w-full" placeholder="Gallery" />
                <div class="cms__help">Customise the tab name shown on the public page.</div>
              </div>
              <div class="cms__field">
                <label class="cms__label">Tab icon</label>
                <AutoComplete
                  v-model="draft.profile.galleryIcon"
                  :suggestions="filteredTabIcons"
                  @complete="searchTabIcons"
                  placeholder="Search icons… e.g. Images"
                  class="w-full"
                  :inputClass="'w-full'"
                  forceSelection
                >
                  <template #option="{ option }">
                    <div class="flex items-center gap-2.5 py-0.5">
                      <component :is="getTabIconComponent(option)" :size="18" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span class="text-sm font-medium">{{ option }}</span>
                    </div>
                  </template>
                  <template #value="{ value }">
                    <div v-if="value" class="flex items-center gap-2">
                      <component :is="getTabIconComponent(value)" :size="16" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span>{{ value }}</span>
                    </div>
                  </template>
                </AutoComplete>
                <div class="cms__help">Choose from <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" class="underline">Lucide icons</a>. Leave empty for default.</div>
              </div>
            </div>
          </div>

          <div class="cms__card">
            <div class="cms__form">
              <!-- Enable / disable gallery -->
              <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
                <div>
                  <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Enable gallery</div>
                  <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                    When disabled, the gallery tab will not appear on the public page.
                  </div>
                </div>
                <ToggleSwitch v-model="draft.gallery.enabled" />
              </div>
            </div>

            <div v-if="draft.gallery.items.length === 0" class="cms__empty mt-3">
              <div class="cms__empty-title">No gallery items yet</div>
              <div class="cms__empty-sub">Click "Add item" to upload an image or add a video.</div>
            </div>

            <draggable
              v-else
              v-model="draft.gallery.items"
              item-key="id"
              handle=".drag"
              :animation="160"
              class="cms__list mt-3"
            >
              <template #item="{ element }">
                <button type="button" class="cms__row" @click="openGalleryEditor(element.id)">
                  <span class="cms__row-drag drag" aria-label="Drag">
                    <i class="pi pi-bars" />
                  </span>

                  <span class="cms__row-thumb">
                    <img
                      v-if="element.type === 'image' && element.src"
                      :src="element.src"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                    <img
                      v-else-if="element.type === 'video' && element.coverUrl"
                      :src="element.coverUrl"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                    <i v-else-if="element.type === 'video'" class="pi pi-video text-[color:var(--color-ink-soft)]" />
                    <i v-else class="pi pi-image text-[color:var(--color-ink-soft)]" />
                  </span>

                  <span class="cms__row-text">
                    <span class="cms__row-title">{{ element.title || 'Untitled' }}</span>
                    <span class="cms__row-sub">{{ element.type === 'video' ? (element.src || '(no source)') : (element.src ? 'Image' : '(no image)') }}</span>
                  </span>

                  <span class="cms__row-meta">
                    <Tag v-if="!element.enabled" severity="warning" value="Hidden" class="!rounded-full" />
                    <i v-else class="pi pi-check-circle cms__ok" />
                    <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                  </span>
                </button>
              </template>
            </draggable>
          </div>
          </div>

          <div v-else-if="contentSubTab === 'blog'" class="cms__subPanel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Blog</div>
              <div class="cms__sub">Create and manage blog posts (stored as Markdown files).</div>
            </div>

            <Button rounded class="cms__primary cms__primary--addon" @click="openBlogEditorNew">
              <i class="pi pi-plus" />
              <span class="cms__btn-label">New post</span>
              <span class="cms__btn-label--compact">New</span>
            </Button>
          </div>

          <div class="cms__card" style="margin-bottom: 10px">
            <div class="cms__form">
              <div class="cms__field">
                <label class="cms__label">Tab label</label>
                <InputText v-model="draft.profile.blogLabel" class="w-full" placeholder="Blog" />
                <div class="cms__help">Customise the tab name shown on the public page.</div>
              </div>
              <div class="cms__field">
                <label class="cms__label">Tab icon</label>
                <AutoComplete
                  v-model="draft.profile.blogIcon"
                  :suggestions="filteredTabIcons"
                  @complete="searchTabIcons"
                  placeholder="Search icons… e.g. Pencil"
                  class="w-full"
                  :inputClass="'w-full'"
                  forceSelection
                >
                  <template #option="{ option }">
                    <div class="flex items-center gap-2.5 py-0.5">
                      <component :is="getTabIconComponent(option)" :size="18" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span class="text-sm font-medium">{{ option }}</span>
                    </div>
                  </template>
                  <template #value="{ value }">
                    <div v-if="value" class="flex items-center gap-2">
                      <component :is="getTabIconComponent(value)" :size="16" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span>{{ value }}</span>
                    </div>
                  </template>
                </AutoComplete>
                <div class="cms__help">Choose from <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" class="underline">Lucide icons</a>. Leave empty for default.</div>
              </div>
            </div>
          </div>

          <div class="cms__card">
            <div class="cms__form">
              <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
                <div>
                  <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Enable blog</div>
                  <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                    When disabled, the blog tab will not appear on the public page.
                  </div>
                </div>
                <ToggleSwitch v-model="draft.blog.enabled" />
              </div>
            </div>

            <div v-if="blogPosts.length === 0" class="cms__empty mt-3">
              <div class="cms__empty-title">No blog posts yet</div>
              <div class="cms__empty-sub">Click "New post" to create your first article.</div>
            </div>

            <div v-else class="cms__blogList cms__list mt-3">
              <button
                v-for="post in blogPosts"
                :key="post.slug"
                type="button"
                class="cms__row"
                @click="openBlogEditorExisting(post.slug)"
              >
                <span class="cms__row-thumb">
                  <i class="pi pi-file-edit text-[color:var(--color-ink-soft)]" />
                </span>

                <span class="cms__row-text">
                  <span class="cms__row-title">{{ post.title }}</span>
                  <span class="cms__row-sub">{{ post.date }}{{ post.tags.length ? ' · ' + post.tags.join(', ') : '' }}</span>
                </span>

                <span class="cms__row-meta">
                  <Tag v-if="!post.published" severity="warning" value="Draft" class="!rounded-full" />
                  <i v-else class="pi pi-check-circle cms__ok" />
                  <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                </span>
              </button>
            </div>
          </div>
          </div>

          <div v-else-if="contentSubTab === 'resume'" class="cms__subPanel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Resume</div>
              <div class="cms__sub">Add your bio, education, experience, and skills.</div>
            </div>
          </div>

          <div class="cms__card" style="margin-bottom: 10px">
            <div class="cms__form">
              <div class="cms__field">
                <label class="cms__label">Tab label</label>
                <InputText v-model="draft.profile.resumeLabel" class="w-full" placeholder="Resume" />
                <div class="cms__help">Customise the tab name shown on the public page.</div>
              </div>
              <div class="cms__field">
                <label class="cms__label">Tab icon</label>
                <AutoComplete
                  v-model="draft.profile.resumeIcon"
                  :suggestions="filteredTabIcons"
                  @complete="searchTabIcons"
                  placeholder="Search icons… e.g. FileText"
                  class="w-full"
                  :inputClass="'w-full'"
                  forceSelection
                >
                  <template #option="{ option }">
                    <div class="flex items-center gap-2.5 py-0.5">
                      <component :is="getTabIconComponent(option)" :size="18" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span class="text-sm font-medium">{{ option }}</span>
                    </div>
                  </template>
                  <template #value="{ value }">
                    <div v-if="value" class="flex items-center gap-2">
                      <component :is="getTabIconComponent(value)" :size="16" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span>{{ value }}</span>
                    </div>
                  </template>
                </AutoComplete>
                <div class="cms__help">Choose from <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" class="underline">Lucide icons</a>. Leave empty for default.</div>
              </div>
            </div>
          </div>

          <div class="cms__card">
            <div class="cms__form">
              <!-- Enable / disable resume -->
              <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
                <div>
                  <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Enable resume</div>
                  <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                    When disabled, the resume tab will not appear on the public page.
                  </div>
                </div>
                <ToggleSwitch v-model="draft.resume.enabled" />
              </div>

              <!-- Bio -->
              <div class="cms__field">
                <label class="cms__label">Bio</label>
                <Textarea v-model="draft.resume.bio" autoResize rows="4" class="w-full" placeholder="A brief professional summary…" />
              </div>

              <!-- Education -->
              <div class="cms__field">
                <div class="flex items-center justify-between mb-2">
                  <label class="cms__label">Education</label>
                  <Button rounded size="small" class="cms__primary !py-1 !px-3 !text-xs" @click="addEducation">
                    <i class="pi pi-plus mr-1" />
                    Add
                  </Button>
                </div>

                <div v-if="draft.resume.education.length === 0" class="cms__empty">
                  <div class="cms__empty-sub">No education entries yet.</div>
                </div>
                <draggable
                  v-else
                  v-model="draft.resume.education"
                  item-key="id"
                  handle=".drag"
                  :animation="160"
                  class="grid gap-2"
                >
                  <template #item="{ element: edu }">
                    <button
                      type="button"
                      class="cms__row"
                      style="grid-template-columns: 44px 1fr auto;"
                      @click="openEducationEditor(edu.id)"
                    >
                      <span class="cms__row-drag drag" aria-label="Drag">
                        <i class="pi pi-bars" />
                      </span>
                      <span class="cms__row-text">
                        <span class="cms__row-title">{{ edu.institution || 'Untitled' }}</span>
                        <span class="cms__row-sub">{{ [edu.degree, edu.field].filter(Boolean).join(' · ') || '(no details)' }}</span>
                      </span>
                      <span class="cms__row-meta">
                        <span v-if="edu.startYear || edu.endYear" class="text-xs text-[color:var(--color-ink-soft)]">{{ edu.startYear }}–{{ edu.endYear }}</span>
                        <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                      </span>
                    </button>
                  </template>
                </draggable>
              </div>

              <!-- Employment -->
              <div class="cms__field">
                <div class="flex items-center justify-between mb-2">
                  <label class="cms__label">Employment</label>
                  <Button rounded size="small" class="cms__primary !py-1 !px-3 !text-xs" @click="addEmployment">
                    <i class="pi pi-plus mr-1" />
                    Add
                  </Button>
                </div>

                <div v-if="draft.resume.employment.length === 0" class="cms__empty">
                  <div class="cms__empty-sub">No employment entries yet.</div>
                </div>
                <draggable
                  v-else
                  v-model="draft.resume.employment"
                  item-key="id"
                  handle=".drag"
                  :animation="160"
                  class="grid gap-2"
                >
                  <template #item="{ element: job }">
                    <button
                      type="button"
                      class="cms__row"
                      style="grid-template-columns: 44px 1fr auto;"
                      @click="openEmploymentEditor(job.id)"
                    >
                      <span class="cms__row-drag drag" aria-label="Drag">
                        <i class="pi pi-bars" />
                      </span>
                      <span class="cms__row-text">
                        <span class="cms__row-title">{{ job.company || 'Untitled' }}</span>
                        <span class="cms__row-sub">{{ job.role || '(no role)' }}</span>
                      </span>
                      <span class="cms__row-meta">
                        <span v-if="job.startYear || job.endYear" class="text-xs text-[color:var(--color-ink-soft)]">{{ job.startYear }}–{{ job.endYear }}</span>
                        <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                      </span>
                    </button>
                  </template>
                </draggable>
              </div>

              <!-- Skills -->
              <div class="cms__field">
                <label class="cms__label">Skills</label>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(skill, i) in draft.resume.skills"
                    :key="i"
                    class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--glass)] px-3 py-1 text-xs font-semibold text-[color:var(--color-ink)] shadow-sm"
                  >
                    {{ skill }}
                    <button type="button" class="hover:text-red-500 transition" @click="removeSkill(i)">
                      <i class="pi pi-times text-[10px]" />
                    </button>
                  </span>
                </div>
                <div class="flex gap-2 mt-1">
                  <InputText
                    v-model="newSkillText"
                    class="w-full"
                    placeholder="Type a skill and press Add…"
                    @keydown.enter.prevent="addSkill"
                  />
                  <Button rounded size="small" severity="secondary" @click="addSkill" :disabled="!newSkillText.trim()">
                    Add
                  </Button>
                </div>
              </div>

              <!-- Achievements -->
              <div class="cms__field">
                <div class="flex items-center justify-between mb-2">
                  <label class="cms__label">Achievements</label>
                  <Button rounded size="small" class="cms__primary !py-1 !px-3 !text-xs" @click="addAchievementEntry">
                    <i class="pi pi-plus mr-1" />
                    Add
                  </Button>
                </div>

                <div v-if="draft.resume.achievements.length === 0" class="cms__empty">
                  <div class="cms__empty-sub">No achievements yet.</div>
                </div>
                <draggable
                  v-else
                  v-model="draft.resume.achievements"
                  item-key="id"
                  handle=".drag"
                  :animation="160"
                  class="grid gap-2"
                >
                  <template #item="{ element: ach }">
                    <button
                      type="button"
                      class="cms__row"
                      style="grid-template-columns: 44px 1fr auto;"
                      @click="openAchievementEditor(ach.id)"
                    >
                      <span class="cms__row-drag drag" aria-label="Drag">
                        <i class="pi pi-bars" />
                      </span>
                      <span class="cms__row-text">
                        <span class="cms__row-title">{{ ach.title || 'Untitled' }}</span>
                        <span class="cms__row-sub">{{ ach.issuer || '(no issuer)' }}</span>
                      </span>
                      <span class="cms__row-meta">
                        <span v-if="ach.year" class="text-xs text-[color:var(--color-ink-soft)]">{{ ach.year }}</span>
                        <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                      </span>
                    </button>
                  </template>
                </draggable>
              </div>
            </div>
          </div>
          </div>

          <div v-else-if="contentSubTab === 'embeds'" class="cms__subPanel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Embeds</div>
              <div class="cms__sub">Add HTML embeds (Cal.com, Zoom, YouTube, etc.) that appear as separate tabs.</div>
            </div>

            <Button rounded class="cms__primary cms__primary--addon" @click="createAndEditEmbed">
              <i class="pi pi-plus" />
              <span class="cms__btn-label">Add embed</span>
              <span class="cms__btn-label--compact">Add</span>
            </Button>
          </div>

          <div class="cms__card">
            <div v-if="draft.embeds.length === 0" class="cms__empty">
              <div class="cms__empty-title">No embeds yet</div>
              <div class="cms__empty-sub">Click "Add embed" to create your first embedded tab.</div>
            </div>

            <draggable
              v-else
              v-model="draft.embeds"
              item-key="id"
              handle=".drag"
              :animation="160"
              class="cms__list"
            >
              <template #item="{ element }">
                <button type="button" class="cms__row" @click="openEmbedEditor(element.id)">
                  <span class="cms__row-drag drag" aria-label="Drag">
                    <i class="pi pi-bars" />
                  </span>

                  <span class="cms__row-thumb">
                    <component :is="resolveLucideIcon(element.icon)" :size="18" class="text-[color:var(--color-ink-soft)]" />
                  </span>

                  <span class="cms__row-text">
                    <span class="cms__row-title">{{ element.label || "Untitled" }}</span>
                    <span class="cms__row-sub">{{ element.html ? 'Has embed code' : '(no embed code)' }}</span>
                  </span>

                  <span class="cms__row-meta">
                    <Tag v-if="!element.enabled" severity="warning" value="Hidden" class="!rounded-full" />
                    <i v-else class="pi pi-check-circle cms__ok" />
                    <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                  </span>
                </button>
              </template>
            </draggable>
          </div>
          </div>
        </section>

        <!-- Newsletter tab -->
        <section v-else-if="tab === 'newsletter'" class="cms__panel">
          <div class="cms__panel-head">
            <div class="cms__title">Newsletter</div>
            <div class="cms__sub">Manage subscribers and send broadcasts.</div>
          </div>

          <div class="cms__card" style="margin-bottom: 10px">
            <div class="cms__form">
              <div class="cms__help" style="margin-bottom: 8px">Show an email signup form on your page so visitors can subscribe to your newsletter.</div>
              <div class="cms__field" style="display: flex; align-items: center; gap: 12px">
                <ToggleSwitch v-model="draft.profile.newsletterEnabled" />
                <label class="cms__label" style="margin: 0">Enable newsletter signup</label>
              </div>
            </div>
          </div>

          <div class="cms__card" style="margin-bottom: 10px">
            <div class="cms__form">
              <div class="cms__field">
                <label class="cms__label">Tab label</label>
                <InputText v-model="draft.profile.newsletterLabel" class="w-full" placeholder="Newsletter" />
                <div class="cms__help">Customise the tab name shown on the public page.</div>
              </div>
              <div class="cms__field">
                <label class="cms__label">Tab icon</label>
                <AutoComplete
                  v-model="draft.profile.newsletterIcon"
                  :suggestions="filteredTabIcons"
                  @complete="searchTabIcons"
                  placeholder="Search icons… e.g. Mail"
                  class="w-full"
                  :inputClass="'w-full'"
                  forceSelection
                >
                  <template #option="{ option }">
                    <div class="flex items-center gap-2.5 py-0.5">
                      <component :is="getTabIconComponent(option)" :size="18" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span class="text-sm font-medium">{{ option }}</span>
                    </div>
                  </template>
                  <template #value="{ value }">
                    <div v-if="value" class="flex items-center gap-2">
                      <component :is="getTabIconComponent(value)" :size="16" class="shrink-0 text-[color:var(--color-ink-soft)]" />
                      <span>{{ value }}</span>
                    </div>
                  </template>
                </AutoComplete>
                <div class="cms__help">Choose from <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" class="underline">Lucide icons</a>. Leave empty for default.</div>
              </div>
            </div>
          </div>

          <!-- Subscriber stats -->
          <div class="cms__card" style="margin-bottom: 10px">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-extrabold text-[color:var(--color-ink)]">Subscribers</span>
              <Button
                text
                rounded
                size="small"
                :loading="subscribersLoading"
                @click="loadSubscribers"
              >
                <i class="pi pi-refresh" />
              </Button>
            </div>
            <div class="flex gap-3 text-xs font-semibold text-[color:var(--color-ink-soft)]">
              <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-green-500" /> {{ subscriberCounts.confirmed }} confirmed</span>
              <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-yellow-500" /> {{ subscriberCounts.pending }} pending</span>
              <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-gray-400" /> {{ subscriberCounts.unsubscribed }} unsubbed</span>
            </div>

            <!-- Subscriber list -->
            <div v-if="subscribersLoading" class="mt-3 text-xs text-[color:var(--color-ink-soft)] text-center py-4">Loading…</div>
            <div v-else-if="subscribersError" class="mt-3 text-xs text-red-500 text-center py-4">{{ subscribersError }}</div>
            <div v-else-if="subscribers.length === 0" class="mt-3 text-xs text-[color:var(--color-ink-soft)] text-center py-4">No subscribers yet.</div>
            <div v-else class="mt-3 max-h-[240px] overflow-y-auto space-y-1">
              <div
                v-for="sub in subscribers"
                :key="sub.id"
                class="flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-[var(--glass)]"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="inline-block w-2 h-2 rounded-full shrink-0"
                    :class="sub.unsubscribed_at ? 'bg-gray-400' : sub.confirmed_at ? 'bg-green-500' : 'bg-yellow-500'"
                  />
                  <span class="truncate font-medium text-[color:var(--color-ink)]">{{ sub.email }}</span>
                </div>
                <Button
                  text
                  rounded
                  severity="danger"
                  size="small"
                  class="!p-1"
                  @click="deleteSubscriber(sub.id)"
                >
                  <i class="pi pi-trash text-[10px]" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Broadcasts / Send History -->
          <div class="cms__card">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-extrabold text-[color:var(--color-ink)]">Broadcasts</span>
              <div class="flex items-center gap-1">
                <Button text rounded size="small" :loading="sendsLoading" @click="loadSends">
                  <i class="pi pi-refresh" />
                </Button>
                <Button rounded size="small" class="cms__primary" @click="openComposeNew">
                  <i class="pi pi-plus" />
                  <span class="ml-1">New</span>
                </Button>
              </div>
            </div>

            <div v-if="sendsLoading" class="text-xs text-[color:var(--color-ink-soft)] text-center py-4">Loading…</div>
            <div v-else-if="newsletterSends.length === 0" class="text-xs text-[color:var(--color-ink-soft)] text-center py-4">No broadcasts yet. Create your first one!</div>
            <div v-else class="max-h-[300px] overflow-y-auto space-y-1.5">
              <button
                v-for="send in newsletterSends"
                :key="send.id"
                type="button"
                class="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--glass)] transition-colors"
                @click="openComposeEdit(send)"
              >
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-[color:var(--color-ink)] truncate">{{ send.subject || '(no subject)' }}</div>
                  <div class="text-[10px] text-[color:var(--color-ink-soft)] mt-0.5">
                    <template v-if="send.status === 'sent'">
                      Sent {{ formatSendDate(send.sent_at) }} · {{ send.recipient_count }} recipients · {{ send.click_count || 0 }} clicks
                    </template>
                    <template v-else-if="send.status === 'scheduled'">
                      Scheduled for {{ formatSendDate(send.scheduled_at) }}
                    </template>
                    <template v-else-if="send.status === 'sending'">
                      Sending…
                    </template>
                    <template v-else>
                      Draft · Updated {{ formatSendDate(send.updated_at) }}
                    </template>
                  </div>
                </div>
                <Tag
                  :value="send.status === 'sent' ? 'Sent' : send.status === 'scheduled' ? 'Scheduled' : send.status === 'sending' ? 'Sending' : 'Draft'"
                  :severity="send.status === 'sent' ? 'success' : send.status === 'scheduled' ? 'warn' : send.status === 'sending' ? 'info' : 'secondary'"
                  class="!rounded-full !text-[10px] shrink-0"
                />
              </button>
            </div>
          </div>
        </section>

        <AnalyticsPanel
          v-else-if="tab === 'analytics'"
          @reauth="$emit('reauth')"
        />

        <!-- Layout-contributed CMS tabs -->
        <section
          v-else-if="layoutCmsTabs.some(lt => lt.key === tab)"
          class="cms__panel"
        >
          <template v-for="lt in layoutCmsTabs" :key="lt.key">
            <template v-if="lt.key === tab">
              <!-- Custom component override -->
              <component
                v-if="lt.component"
                :is="lt.component"
                :modelValue="getTabData(lt.key)"
                :model="draft"
                @update:modelValue="setTabData(lt.key, $event)"
              />
              <!-- Schema-driven auto-rendered form -->
              <LayoutSchemaRenderer
                v-else-if="lt.schema"
                :schema="lt.schema"
                :modelValue="getTabData(lt.key)"
                @update:modelValue="setTabData(lt.key, $event)"
              />
            </template>
          </template>
        </section>

      </div>
    </div>

    <template #footer>
      <div class="cms__footer">
        <div class="cms__footer-right">
          <Button rounded severity="secondary" :disabled="!hasChanges" @click="discard">
            <i class="pi pi-undo" />
            <span class="ml-2">Discard</span>
          </Button>

          <Button rounded class="cms__primary" :disabled="!hasChanges" @click="save">
            <i class="pi pi-check" />
            <span class="ml-2">Save</span>
          </Button>
        </div>
      </div>
    </template>

    <LinkEditorDrawer
      v-if="activeLink"
      v-model:open="linkEditorOpen"
      v-model="activeLinkProxy"
      :allTags="allLinkTags"
      @delete="deleteActiveLink"
    />
    <SocialEditorDrawer
      v-if="activeSocial"
      v-model:open="socialEditorOpen"
      v-model="activeSocialProxy"
      @delete="deleteActiveSocial"
    />
    <ResumeEditorDrawer
      v-if="activeEducation || activeEmployment || activeAchievement"
      v-model:open="resumeEditorOpen"
      :editMode="resumeEditMode"
      :education="activeEducation"
      :employment="activeEmployment"
      :achievement="activeAchievement"
      @update:education="updateEducation"
      @update:employment="updateEmployment"
      @update:achievement="updateAchievement"
      @delete="deleteResumeEntry"
    />
    <GalleryEditorDrawer
      v-if="activeGalleryItem"
      v-model:open="galleryEditorOpen"
      :item="activeGalleryItem"
      :allTags="allGalleryTags"
      @update:item="updateGalleryItem"
      @delete="deleteActiveGalleryItem"
    />
    <BlogEditorDrawer
      v-model:open="blogEditorOpen"
      :post="blogEditorPost"
      :originalSlug="blogEditorOriginalSlug"
      :allTags="allBlogTags"
      @saved="refreshBlogPosts"
      @deleted="refreshBlogPosts"
    />
    <EmbedEditorDrawer
      v-if="activeEmbed"
      v-model:open="embedEditorOpen"
      v-model="activeEmbedProxy"
      @delete="deleteActiveEmbed"
    />
    <NewsletterComposeDrawer
      v-model:open="composeOpen"
      :sendRecord="composeRecord"
      @saved="onComposeSaved"
      @deleted="onComposeDeleted"
      @sent="onComposeSent"
      @reauth="$emit('reauth')"
    />
  </Dialog>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, shallowRef, watch, watchEffect, type Component, markRaw } from "vue";
import draggable from "vuedraggable";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import AutoComplete from "primevue/autocomplete";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";
import LayoutSchemaRenderer from "./LayoutSchemaRenderer.vue";

import ImageUploadField from "./ImageUploadField.vue";
import LinkEditorDrawer from "./LinkEditorDrawer.vue";
import SocialEditorDrawer from "./SocialEditorDrawer.vue";
import ResumeEditorDrawer from "./ResumeEditorDrawer.vue";
import GalleryEditorDrawer from "./GalleryEditorDrawer.vue";
import BlogEditorDrawer from "./BlogEditorDrawer.vue";
import EmbedEditorDrawer from "./EmbedEditorDrawer.vue";
import NewsletterComposeDrawer from "./NewsletterComposeDrawer.vue";
import AnalyticsPanel from "./AnalyticsPanel.vue";
import { icons as lucideIcons } from "lucide-vue-next";
import { getAvailableLayouts, getLayoutManifest } from "../lib/component-resolver";
import type { LayoutManifest, LayoutVar } from "../lib/layout-manifest";
import type { BioLink, BioModel, SocialLink, EducationEntry, EmploymentEntry, AchievementEntry, GalleryItem, ThemePreset, EmbedItem } from "../lib/model";
import {
  defaultModel,
  defaultResume,
  defaultGallery,
  defaultTheme,
  darkTheme,
  THEME_PRESETS,
  LAYOUT_PRESETS,
  newLink,
  newSocial,
  newEducation,
  newEmployment,
  newAchievement,
  newGalleryItem,
  newEmbed,
  sanitizeModel,
  stableStringify,
} from "../lib/model";
import {
  fetchBlogPosts,
  fetchBlogPost,
  type BlogPostMeta,
  type BlogPost,
} from "../lib/blog";
import {
  loadGithubSettings,
  saveGithubSettings,
  getPlaintextToken,
  canUseGithubSync,
  testGithubConnection,
  type GithubSettings,
} from "../lib/github";
import { encryptPayload } from "../lib/admin-crypto";
import { getCmsPassword } from "../lib/cms-auth";

export default defineComponent({
  name: "CmsDialog",
  components: {
    Dialog,
    Button,
    InputText,
    AutoComplete,
    Select,
    Textarea,
    Tag,
    draggable,
    LinkEditorDrawer,
    SocialEditorDrawer,
    ImageUploadField,
    ResumeEditorDrawer,
    GalleryEditorDrawer,
    BlogEditorDrawer,
    EmbedEditorDrawer,
    NewsletterComposeDrawer,
    AnalyticsPanel,
    ToggleSwitch,
    LayoutSchemaRenderer,
  },
  props: {
    open: { type: Boolean, required: true },
    model: { type: Object as () => BioModel, required: true },
    initialTab: { type: String as () => "site" | "content" | "newsletter" | "analytics" | "links" | "embeds" | "resume" | "gallery" | "blog", default: "site" },
    initialEmbedId: { type: String, default: "" },
    initialBlogSlug: { type: String, default: "" },
  },
  emits: ["update:open", "update:model", "blog-posts-updated", "lock", "reauth"],
  setup(props, { emit }) {
    const toast = useToast();

    const visible = ref(props.open);

    const contentSubTabs = ["links", "gallery", "blog", "resume", "embeds"] as const;
    type ContentSubTab = typeof contentSubTabs[number];

    const contentSubTabOptions = [
      { label: "Links", value: "links" },
      { label: "Gallery", value: "gallery" },
      { label: "Blog", value: "blog" },
      { label: "Resume", value: "resume" },
      { label: "Embeds", value: "embeds" },
    ];

    function resolveInitialTab(val: string): { main: "site" | "content" | "newsletter" | "analytics"; sub: ContentSubTab } {
      if (contentSubTabs.includes(val as ContentSubTab)) return { main: "content", sub: val as ContentSubTab };
      if (val === "newsletter") return { main: "newsletter", sub: "links" };
      if (val === "analytics") return { main: "analytics", sub: "links" };
      return { main: "site", sub: "links" };
    }

    const initialResolved = resolveInitialTab(props.initialTab);
    const tab = ref<string>(initialResolved.main);
    const contentSubTab = ref<ContentSubTab>(initialResolved.sub);

    const siteSection = reactive({
      identity: false,
      images: false,
      favicon: false,
      theme: false,
      github: false,
      search: false,
      navigation: false,
      socials: false,
      scripts: false,
      supabase: false,
    });

    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";

    // ── Newsletter subscriber management ──────────────────────────
    interface Subscriber {
      id: string;
      email: string;
      created_at: string;
      confirmed_at: string | null;
      unsubscribed_at: string | null;
    }
    const subscribers = ref<Subscriber[]>([]);
    const subscribersLoading = ref(false);
    const subscribersError = ref("");
    const subscriberCounts = computed(() => {
      const confirmed = subscribers.value.filter((s) => s.confirmed_at && !s.unsubscribed_at).length;
      const pending = subscribers.value.filter((s) => !s.confirmed_at && !s.unsubscribed_at).length;
      const unsubscribed = subscribers.value.filter((s) => s.unsubscribed_at).length;
      return { confirmed, pending, unsubscribed, total: subscribers.value.length };
    });

    async function invokeAdmin(body: Record<string, unknown>): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
      const pw = getCmsPassword();
      const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";
      if (!pw || !anonKey || !supabaseUrl) {
        emit("reauth");
        return { data: null, error: "__reauth__" };
      }
      const token = await encryptPayload(
        JSON.stringify({ password: pw, ts: Date.now() }),
        anonKey,
      );
      const res = await fetch(`${supabaseUrl}/functions/v1/newsletter-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          "x-admin-token": token,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        return { data: null, error: text || `HTTP ${res.status}` };
      }
      const data = await res.json();
      return { data, error: null };
    }

    async function loadSubscribers() {
      subscribersLoading.value = true;
      subscribersError.value = "";
      try {
        const { data, error } = await invokeAdmin({ action: "list" });
        if (error === "__reauth__") return;
        if (error) {
          subscribersError.value = error;
          return;
        }
        if (data?.subscribers) {
          subscribers.value = data.subscribers as Subscriber[];
        }
      } catch (e) {
        subscribersError.value = String(e);
      } finally {
        subscribersLoading.value = false;
      }
    }

    async function deleteSubscriber(id: string) {
      const { error } = await invokeAdmin({ action: "delete", id });
      if (error) return;
      subscribers.value = subscribers.value.filter((s) => s.id !== id);
    }

    // ── Newsletter sends (broadcasts) management ──────────────────
    interface SendRecord {
      id: string;
      subject: string;
      cover_image: string;
      tags: string[];
      excerpt_html: string;
      body_html: string;
      status: string;
      scheduled_at: string | null;
      sent_at: string | null;
      recipient_count: number;
      created_at: string;
      updated_at: string;
      click_count?: number;
    }
    const newsletterSends = ref<SendRecord[]>([]);
    const sendsLoading = ref(false);
    const composeOpen = ref(false);
    const composeRecord = ref<SendRecord | null>(null);

    async function loadSends() {
      sendsLoading.value = true;
      try {
        const { data, error } = await invokeAdmin({ action: "list-sends" });
        if (!error && data?.sends) {
          newsletterSends.value = data.sends as SendRecord[];
        }
      } catch (e) {
        console.error("[newsletter] loadSends error:", e);
      } finally {
        sendsLoading.value = false;
      }
    }

    function openComposeNew() {
      composeRecord.value = null;
      composeOpen.value = true;
    }

    function openComposeEdit(send: SendRecord) {
      composeRecord.value = send;
      composeOpen.value = true;
    }

    function onComposeSaved() {
      loadSends();
    }

    function onComposeDeleted() {
      composeOpen.value = false;
      loadSends();
    }

    function onComposeSent() {
      loadSends();
    }

    function formatSendDate(d: string | null): string {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }

    watch(
      () => props.open,
      (v) => {
        visible.value = v;
        if (v) {
          // Close all editor sidebars before switching tabs
          linkEditorOpen.value = false;
          socialEditorOpen.value = false;
          resumeEditorOpen.value = false;
          galleryEditorOpen.value = false;
          blogEditorOpen.value = false;
          embedEditorOpen.value = false;

          const resolved = resolveInitialTab(props.initialTab);
          tab.value = resolved.main;
          contentSubTab.value = resolved.sub;
          // If an embed ID is provided, auto-open the embed editor for that embed
          if (props.initialEmbedId) {
            tab.value = 'content';
            contentSubTab.value = 'embeds';
            openEmbedEditor(props.initialEmbedId);
          }
          // If a blog slug is provided, auto-open the blog editor for that post
          if (props.initialBlogSlug) {
            tab.value = 'content';
            contentSubTab.value = 'blog';
            openBlogEditorExisting(props.initialBlogSlug);
          }
        }
      },
    );
    watch(visible, (v) => emit("update:open", v));

    function lockCms() {
      visible.value = false;
      emit("lock");
    }

    const defaultTabOptions = [
      { label: "Links", value: "links" },
      { label: "Resume", value: "resume" },
      { label: "Gallery", value: "gallery" },
      { label: "Blog", value: "blog" },
    ];

    // ── Icon autocomplete for tab icons ──
    const FEATURED_TAB_ICONS = [
      "Link", "FileText", "Images", "Pencil", "Globe", "Star", "Heart",
      "Briefcase", "BookOpen", "Camera", "Music", "Video", "Code",
      "Users", "MessageCircle", "Mail", "Phone", "Map", "Layers",
      "Palette", "Newspaper", "GraduationCap", "Award", "Zap",
    ];
    const ALL_ICON_NAMES: string[] = Object.keys(lucideIcons);
    const filteredTabIcons = ref<string[]>(FEATURED_TAB_ICONS);

    const searchTabIcons = (event: { query: string }) => {
      const q = (event.query || "").trim().toLowerCase();
      if (!q) {
        filteredTabIcons.value = FEATURED_TAB_ICONS;
        return;
      }
      filteredTabIcons.value = ALL_ICON_NAMES
        .filter((name) => name.toLowerCase().includes(q))
        .slice(0, 40);
    };

    const getTabIconComponent = (name: string) => {
      const table = lucideIcons as Record<string, any>;
      return table[name] ?? table["Globe"];
    };

    const draft = ref<BioModel>(sanitizeModel(props.model));
    // Cache the serialised saved-model so hasChanges doesn't re-stringify it on every access
    const savedSnapshot = ref(stableStringify(sanitizeModel(props.model)));

    watch(
      () => stableStringify(props.model),
      (snapshot) => {
        savedSnapshot.value = snapshot;
        draft.value = sanitizeModel(props.model);
      },
    );

    const hasChanges = computed(
      () =>
        stableStringify(draft.value) !== savedSnapshot.value,
    );

    const linkEditorOpen = ref(false);
    const activeLinkId = ref("");

    const activeLink = computed<BioLink | null>(() => {
      const id = activeLinkId.value;
      if (!id) return null;
      return draft.value.links.find((l) => l.id === id) ?? null;
    });

    const activeLinkProxy = computed<BioLink>({
      get() {
        return activeLink.value ?? newLink();
      },
      set(v) {
        const idx = draft.value.links.findIndex((l) => l.id === v.id);
        if (idx >= 0) draft.value.links[idx] = v;
      },
    });

    const openLinkEditor = (id: string) => {
      activeLinkId.value = id;
      linkEditorOpen.value = true;
    };

    const createAndEditLink = () => {
      const l = newLink();
      l.subtitle = "";
      draft.value.links.unshift(l);
      activeLinkId.value = l.id;
      tab.value = "links";
      linkEditorOpen.value = true;
      toast.add({ severity: "success", summary: "Added", detail: "Link created.", life: 1600 });
    };

    const deleteActiveLink = () => {
      const l = activeLink.value;
      if (!l) return;
      draft.value.links = draft.value.links.filter((x) => x.id !== l.id);
      linkEditorOpen.value = false;
      activeLinkId.value = "";
      toast.add({ severity: "warn", summary: "Deleted", detail: "Link removed.", life: 1600 });
    };

    watch(linkEditorOpen, (open) => {
      if (!open) activeLinkId.value = "";
    });

    const socialEditorOpen = ref(false);
    const activeSocialId = ref("");

    const activeSocial = computed<SocialLink | null>(() => {
      const id = activeSocialId.value;
      if (!id) return null;
      return draft.value.socials.find((s) => s.id === id) ?? null;
    });

    const activeSocialProxy = computed<SocialLink>({
      get() {
        return activeSocial.value ?? newSocial();
      },
      set(v) {
        const idx = draft.value.socials.findIndex((s) => s.id === v.id);
        if (idx >= 0) draft.value.socials[idx] = v;
      },
    });

    const openSocialEditor = (id: string) => {
      activeSocialId.value = id;
      socialEditorOpen.value = true;
    };

    const createAndEditSocial = () => {
      const s = newSocial();
      s.enabled = true;
      draft.value.socials.unshift(s);
      activeSocialId.value = s.id;
      tab.value = "socials";
      socialEditorOpen.value = true;
      toast.add({ severity: "success", summary: "Added", detail: "Social created.", life: 1600 });
    };

    const deleteActiveSocial = () => {
      const s = activeSocial.value;
      if (!s) return;
      draft.value.socials = draft.value.socials.filter((x) => x.id !== s.id);
      socialEditorOpen.value = false;
      activeSocialId.value = "";
      toast.add({ severity: "warn", summary: "Deleted", detail: "Social removed.", life: 1600 });
    };

    watch(socialEditorOpen, (open) => {
      if (!open) activeSocialId.value = "";
    });

    const resolveLucideIcon = (name: string) => {
      return (lucideIcons as Record<string, any>)[name] ?? (lucideIcons as Record<string, any>)["Globe"];
    };

    const discard = () => {
      draft.value = sanitizeModel(props.model);
      toast.add({ severity: "info", summary: "Discarded", detail: "Changes reverted.", life: 1600 });
    };

    const save = () => {
      emit("update:model", sanitizeModel(draft.value));
      toast.add({
        severity: "success",
        summary: "Saved",
        detail: "Your content was updated.",
        life: 1800,
      });
      visible.value = false;
    };

    const resetTheme = () => {
      const layout = draft.value.theme.layout || "default";
      const preset = draft.value.theme.preset === "dark" ? "dark" : "light";
      const layoutPresets = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS.default;
      const factory = layoutPresets[preset] || THEME_PRESETS[preset];
      const base = factory ? factory() : defaultTheme();
      const { layoutVars } = draft.value.theme;
      draft.value.theme = { ...base, preset: draft.value.theme.preset, layout, layoutVars };
      toast.add({ severity: "info", summary: "Theme reset", detail: "Colours restored to defaults.", life: 1600 });
    };

    const presetOptions = [
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
    ];

    const layoutOptions = computed(() =>
      getAvailableLayouts().map((name) => ({
        label: name.charAt(0).toUpperCase() + name.slice(1),
        value: name,
      })),
    );

    const activeManifest = computed<LayoutManifest | null>(() =>
      getLayoutManifest(draft.value.theme.layout || "default"),
    );

    const layoutCmsTabs = shallowRef<Array<{ key: string; label: string; icon: string; component?: Component; schema?: import('@formkit/core').FormKitSchemaNode[] }>>([]);
    watchEffect(async () => {
      const manifest = activeManifest.value;
      // Resolve CMS tabs (component-based ones need async resolution)
      if (manifest?.cmsTabs?.length) {
        const tabs = await Promise.all(
          manifest.cmsTabs.map(async (t) => {
            let comp: Component | undefined;
            if (t.component) {
              const mod = await t.component();
              comp = markRaw(mod.default);
            }
            return { key: t.key, label: t.label, icon: t.icon, component: comp, schema: t.schema };
          }),
        );
        layoutCmsTabs.value = tabs;
      } else {
        layoutCmsTabs.value = [];
      }
    });

    /** Get sub-keyed layoutData for a CMS tab */
    const getTabData = (key: string): Record<string, unknown> => {
      const data = draft.value.theme.layoutData?.[key];
      return (data && typeof data === "object" && !Array.isArray(data))
        ? data as Record<string, unknown>
        : {};
    };

    /** Set sub-keyed layoutData for a CMS tab */
    const setTabData = (key: string, value: Record<string, unknown>) => {
      draft.value.theme.layoutData = {
        ...draft.value.theme.layoutData,
        [key]: value,
      };
    };

    const getLayoutVar = (v: LayoutVar): string => {
      const stored = draft.value.theme.layoutVars?.[v.cssVar];
      if (stored) return stored;
      return draft.value.theme.preset === "dark" ? v.defaultDark : v.defaultLight;
    };

    const setLayoutVar = (cssVar: string, value: string) => {
      if (!draft.value.theme.layoutVars) draft.value.theme.layoutVars = {};
      draft.value.theme.layoutVars[cssVar] = value;
    };

    const getPresetDefaults = () => {
      const layout = draft.value.theme.layout || "default";
      const preset = draft.value.theme.preset === "dark" ? "dark" : "light";
      const layoutPresets = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS.default;
      const factory = layoutPresets[preset] || THEME_PRESETS[preset];
      return factory ? factory() : defaultTheme();
    };

    const themeVarKeys = [
      "colorBrand", "colorBrandStrong", "colorAccent", "colorInk", "colorInkSoft",
      "bg", "glass", "glass2", "glassStrong", "colorBorder", "colorBorder2",
      "cardBg", "cardBorder", "cardText", "radiusXl", "radiusLg",
    ] as const;

    const isOverridden = (key: string) => {
      const defaults = getPresetDefaults();
      return (draft.value.theme as any)[key] !== (defaults as any)[key];
    };

    const resetField = (key: string) => {
      const defaults = getPresetDefaults();
      (draft.value.theme as any)[key] = (defaults as any)[key];
    };

    const hasAnyOverride = computed(() =>
      themeVarKeys.some((k) => isOverridden(k)),
    );

    const resetAll = () => {
      const defaults = getPresetDefaults();
      for (const k of themeVarKeys) {
        (draft.value.theme as any)[k] = (defaults as any)[k];
      }
    };

    const applyPreset = (preset: ThemePreset) => {
      const layout = draft.value.theme.layout || "default";
      const layoutPresets = LAYOUT_PRESETS[layout] || LAYOUT_PRESETS.default;
      const factory = layoutPresets[preset] || THEME_PRESETS[preset];
      if (factory) {
        const presetTheme = factory();
        const { layoutVars } = draft.value.theme;
        draft.value.theme = { ...presetTheme, preset, layout, layoutVars };
      } else {
        draft.value.theme.preset = preset;
      }
    };

    // Save/restore per-layout theme when switching layouts
    let previousLayout = draft.value.theme.layout || "default";
    watch(
      () => draft.value.theme.layout,
      (newLayout) => {
        if (!newLayout || newLayout === previousLayout) return;
        // Save current theme to old layout's storage
        draft.value.layoutThemes[previousLayout] = { ...draft.value.theme, layout: previousLayout };
        // Load saved theme for new layout (or create from defaults)
        const saved = draft.value.layoutThemes[newLayout];
        if (saved && saved.preset) {
          draft.value.theme = { ...saved, layout: newLayout };
        } else {
          const presets = LAYOUT_PRESETS[newLayout] || LAYOUT_PRESETS.default;
          draft.value.theme = { ...presets.light(), layout: newLayout };
        }
        previousLayout = newLayout;
      },
    );



    /** Convert any CSS color string (hex, rgb, rgba) to #rrggbb for <input type="color"> */
    const toHex = (color: string): string => {
      if (!color) return "#000000";
      // Already a hex value
      if (/^#[0-9a-f]{6}$/i.test(color)) return color;
      if (/^#[0-9a-f]{3}$/i.test(color)) {
        const [, r, g, b] = color.match(/^#(.)(.)(.)$/)!;
        return `#${r}${r}${g}${g}${b}${b}`;
      }
      // Parse rgb/rgba
      const m = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
      if (m) {
        const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
        return `#${hex(+m[1])}${hex(+m[2])}${hex(+m[3])}`;
      }
      return "#000000";
    };

    if (!draft.value) draft.value = defaultModel();
    // ensure resume section exists on draft
    if (!draft.value.resume) {
      draft.value.resume = defaultResume();
    }
    // ensure gallery section exists on draft
    if (!draft.value.gallery) {
      draft.value.gallery = defaultGallery();
    }

    // Resume editor state
    const resumeEditorOpen = ref(false);
    const resumeEditMode = ref<"education" | "employment" | "achievement">("education");
    const activeEducationId = ref("");
    const activeEmploymentId = ref("");
    const activeAchievementId = ref("");
    const newSkillText = ref("");

    const activeEducation = computed<EducationEntry | null>(() => {
      const id = activeEducationId.value;
      if (!id) return null;
      return draft.value.resume.education.find((e) => e.id === id) ?? null;
    });

    const activeEmployment = computed<EmploymentEntry | null>(() => {
      const id = activeEmploymentId.value;
      if (!id) return null;
      return draft.value.resume.employment.find((e) => e.id === id) ?? null;
    });

    const activeAchievement = computed<AchievementEntry | null>(() => {
      const id = activeAchievementId.value;
      if (!id) return null;
      return draft.value.resume.achievements.find((a) => a.id === id) ?? null;
    });

    const openEducationEditor = (id: string) => {
      activeEducationId.value = id;
      resumeEditMode.value = "education";
      resumeEditorOpen.value = true;
    };

    const openEmploymentEditor = (id: string) => {
      activeEmploymentId.value = id;
      resumeEditMode.value = "employment";
      resumeEditorOpen.value = true;
    };

    const openAchievementEditor = (id: string) => {
      activeAchievementId.value = id;
      resumeEditMode.value = "achievement";
      resumeEditorOpen.value = true;
    };

    const addEducation = () => {
      const e = newEducation();
      draft.value.resume.education.push(e);
      openEducationEditor(e.id);
      toast.add({ severity: "success", summary: "Added", detail: "Education entry created.", life: 1600 });
    };

    const addEmployment = () => {
      const e = newEmployment();
      draft.value.resume.employment.push(e);
      openEmploymentEditor(e.id);
      toast.add({ severity: "success", summary: "Added", detail: "Employment entry created.", life: 1600 });
    };

    const addAchievementEntry = () => {
      const a = newAchievement();
      draft.value.resume.achievements.push(a);
      openAchievementEditor(a.id);
      toast.add({ severity: "success", summary: "Added", detail: "Achievement entry created.", life: 1600 });
    };

    const updateEducation = (updated: EducationEntry) => {
      const idx = draft.value.resume.education.findIndex((e) => e.id === updated.id);
      if (idx >= 0) draft.value.resume.education[idx] = { ...updated };
    };

    const updateEmployment = (updated: EmploymentEntry) => {
      const idx = draft.value.resume.employment.findIndex((e) => e.id === updated.id);
      if (idx >= 0) draft.value.resume.employment[idx] = { ...updated };
    };

    const updateAchievement = (updated: AchievementEntry) => {
      const idx = draft.value.resume.achievements.findIndex((a) => a.id === updated.id);
      if (idx >= 0) draft.value.resume.achievements[idx] = { ...updated };
    };

    const deleteResumeEntry = () => {
      if (resumeEditMode.value === "education" && activeEducationId.value) {
        draft.value.resume.education = draft.value.resume.education.filter(
          (e) => e.id !== activeEducationId.value
        );
        activeEducationId.value = "";
      } else if (resumeEditMode.value === "employment" && activeEmploymentId.value) {
        draft.value.resume.employment = draft.value.resume.employment.filter(
          (e) => e.id !== activeEmploymentId.value
        );
        activeEmploymentId.value = "";
      } else if (resumeEditMode.value === "achievement" && activeAchievementId.value) {
        draft.value.resume.achievements = draft.value.resume.achievements.filter(
          (a) => a.id !== activeAchievementId.value
        );
        activeAchievementId.value = "";
      }
      resumeEditorOpen.value = false;
      toast.add({ severity: "warn", summary: "Deleted", detail: "Entry removed.", life: 1600 });
    };

    const addSkill = () => {
      const skill = newSkillText.value.trim();
      if (!skill) return;
      if (draft.value.resume.skills.includes(skill)) return;
      draft.value.resume.skills.push(skill);
      newSkillText.value = "";
    };

    const removeSkill = (index: number) => {
      draft.value.resume.skills.splice(index, 1);
    };

    watch(resumeEditorOpen, (open) => {
      if (!open) {
        activeEducationId.value = "";
        activeEmploymentId.value = "";
      }
    });

    // Gallery editor state
    const galleryEditorOpen = ref(false);
    const activeGalleryItemId = ref("");

    const activeGalleryItem = computed<GalleryItem | null>(() => {
      const id = activeGalleryItemId.value;
      if (!id) return null;
      return draft.value.gallery.items.find((g) => g.id === id) ?? null;
    });

    const openGalleryEditor = (id: string) => {
      activeGalleryItemId.value = id;
      galleryEditorOpen.value = true;
    };

    const createAndEditGalleryItem = () => {
      const item = newGalleryItem();
      draft.value.gallery.items.unshift(item);
      activeGalleryItemId.value = item.id;
      galleryEditorOpen.value = true;
      toast.add({ severity: "success", summary: "Added", detail: "Gallery item created.", life: 1600 });
    };

    const updateGalleryItem = (updated: GalleryItem) => {
      const idx = draft.value.gallery.items.findIndex((g) => g.id === updated.id);
      if (idx >= 0) draft.value.gallery.items[idx] = { ...updated };
    };

    const deleteActiveGalleryItem = () => {
      const id = activeGalleryItemId.value;
      if (!id) return;
      draft.value.gallery.items = draft.value.gallery.items.filter((g) => g.id !== id);
      galleryEditorOpen.value = false;
      activeGalleryItemId.value = "";
      toast.add({ severity: "warn", summary: "Deleted", detail: "Gallery item removed.", life: 1600 });
    };

    watch(galleryEditorOpen, (open) => {
      if (!open) activeGalleryItemId.value = "";
    });

    // ── Embed editor ─────────────────────────────────────────────────
    const embedEditorOpen = ref(false);
    const activeEmbedId = ref("");

    const activeEmbed = computed<EmbedItem | null>(() => {
      const id = activeEmbedId.value;
      if (!id) return null;
      return draft.value.embeds.find((e) => e.id === id) ?? null;
    });

    const activeEmbedProxy = computed<EmbedItem>({
      get() {
        return activeEmbed.value ?? newEmbed();
      },
      set(v) {
        const idx = draft.value.embeds.findIndex((e) => e.id === v.id);
        if (idx >= 0) draft.value.embeds[idx] = v;
      },
    });

    const openEmbedEditor = (id: string) => {
      activeEmbedId.value = id;
      embedEditorOpen.value = true;
    };

    const createAndEditEmbed = () => {
      const item = newEmbed();
      draft.value.embeds.unshift(item);
      activeEmbedId.value = item.id;
      embedEditorOpen.value = true;
      toast.add({ severity: "success", summary: "Added", detail: "Embed created.", life: 1600 });
    };

    const deleteActiveEmbed = () => {
      const id = activeEmbedId.value;
      if (!id) return;
      draft.value.embeds = draft.value.embeds.filter((e) => e.id !== id);
      embedEditorOpen.value = false;
      activeEmbedId.value = "";
      toast.add({ severity: "warn", summary: "Deleted", detail: "Embed removed.", life: 1600 });
    };

    watch(embedEditorOpen, (open) => {
      if (!open) activeEmbedId.value = "";
    });

    // GitHub Settings
    const envOwner = import.meta.env.VITE_GITHUB_OWNER || "";
    const envRepo = import.meta.env.VITE_GITHUB_REPO || "";
    const envBranch = import.meta.env.VITE_GITHUB_BRANCH || "";

    const defaultGithubForm = (): GithubSettings => {
      const settings = loadGithubSettings();
      return {
        ...settings,
        owner: envOwner || settings.owner,
        repo: envRepo || settings.repo,
        branch: envBranch || settings.branch,
      };
    };

    const githubForm = reactive<GithubSettings>(defaultGithubForm());
    const githubSaving = ref(false);
    const githubTesting = ref(false);
    const githubReady = ref(canUseGithubSync());
    const refreshGithubForm = () => {
      const current = defaultGithubForm();
      Object.assign(githubForm, current);
      githubReady.value = canUseGithubSync();
    };

    const validateGithub = () => {
      if (!githubForm.owner.trim()) {
        throw new Error("Owner is required.");
      }
      if (!githubForm.repo.trim()) {
        throw new Error("Repository is required.");
      }
      if (!githubForm.branch.trim()) {
        throw new Error("Branch is required.");
      }
    };

    const handleGithubSave = async () => {
      try {
        validateGithub();
      } catch (error) {
        toast.add({
          severity: "warn",
          summary: "Missing details",
          detail: error instanceof Error ? error.message : "Fill out the required fields.",
          life: 2400,
        });
        return;
      }

      githubSaving.value = true;
      try {
        saveGithubSettings(githubForm);
        githubReady.value = canUseGithubSync();
        toast.add({
          severity: "success",
          summary: "Saved",
          detail: "GitHub sync settings updated.",
          life: 2200,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to save GitHub settings.";
        toast.add({
          severity: "error",
          summary: "Save failed",
          detail: message,
          life: 3000,
        });
      } finally {
        githubSaving.value = false;
      }
    };

    const handleGithubTest = async () => {
      githubTesting.value = true;
      try {
        const token = getPlaintextToken();
        if (!token) {
          throw new Error("No token available. Unlock or configure a token first.");
        }
        await testGithubConnection(githubForm, token);
        toast.add({
          severity: "success",
          summary: "Connection successful",
          detail: "Repository and branch are reachable.",
          life: 2200,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to reach the repository.";
        toast.add({
          severity: "error",
          summary: "Connection failed",
          detail: message,
          life: 3200,
        });
      } finally {
        githubTesting.value = false;
      }
    };



    // ── Blog ─────────────────────────────────────────────────────────
    const blogPosts = ref<BlogPostMeta[]>([]);
    const blogPostCount = computed(() => blogPosts.value.length);
    const blogEditorOpen = ref(false);
    const blogEditorPost = ref<BlogPost | null>(null);
    const blogEditorOriginalSlug = ref("");

    const refreshBlogPosts = async () => {
      try {
        blogPosts.value = await fetchBlogPosts();
      } catch {
        blogPosts.value = [];
      }
      emit("blog-posts-updated");
    };

    // Load blog posts when tab becomes 'blog'
    watch(tab, (t) => {
      if (t === "blog") refreshBlogPosts();
    });

    // Also load on mount
    onMounted(() => {
      refreshBlogPosts();
    });

    const openBlogEditorNew = () => {
      blogEditorPost.value = null;
      blogEditorOriginalSlug.value = "";
      blogEditorOpen.value = true;
    };

    const openBlogEditorExisting = async (slug: string) => {
      try {
        const post = await fetchBlogPost(slug);
        blogEditorPost.value = post;
        blogEditorOriginalSlug.value = slug;
        blogEditorOpen.value = true;
      } catch {
        toast.add({ severity: "error", summary: "Error", detail: "Could not load blog post.", life: 2600 });
      }
    };

    // ── Tag collections for editor drawers ───────────────────────
    const allLinkTags = computed(() => {
      const tagSet = new Set<string>();
      for (const l of draft.value.links) {
        if (l.tags) l.tags.forEach((t: string) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    const allGalleryTags = computed(() => {
      const tagSet = new Set<string>();
      for (const item of draft.value.gallery.items) {
        if (item.tags) item.tags.forEach((t: string) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    const allBlogTags = computed(() => {
      const tagSet = new Set<string>();
      for (const p of blogPosts.value) {
        if (p.tags) p.tags.forEach((t: string) => tagSet.add(t));
      }
      return [...tagSet].sort();
    });

    return {
      visible,
      tab,
      draft,
      siteSection,
      hasChanges,
      discard,
      save,
      resetTheme,
      toHex,
      presetOptions,
      layoutOptions,
      activeManifest,
      layoutCmsTabs,
      getTabData,
      setTabData,
      getLayoutVar,
      setLayoutVar,
      applyPreset,
      isOverridden,
      resetField,
      hasAnyOverride,
      resetAll,
      linkEditorOpen,
      activeLink,
      activeLinkProxy,
      openLinkEditor,
      createAndEditLink,
      deleteActiveLink,
      socialEditorOpen,
      activeSocial,
      activeSocialProxy,
      openSocialEditor,
      createAndEditSocial,
      deleteActiveSocial,
      resolveLucideIcon,
      githubForm,
      githubSaving,
      githubTesting,
      githubReady,
      handleGithubSave,
      handleGithubTest,
      envOwner,
      envRepo,
      envBranch,
      resumeEditorOpen,
      resumeEditMode,
      activeEducation,
      activeEmployment,
      activeAchievement,
      openEducationEditor,
      openEmploymentEditor,
      openAchievementEditor,
      addEducation,
      addEmployment,
      addAchievementEntry,
      updateEducation,
      updateEmployment,
      updateAchievement,
      deleteResumeEntry,
      newSkillText,
      addSkill,
      removeSkill,
      galleryEditorOpen,
      activeGalleryItem,
      openGalleryEditor,
      createAndEditGalleryItem,
      updateGalleryItem,
      deleteActiveGalleryItem,
      embedEditorOpen,
      activeEmbed,
      activeEmbedProxy,
      openEmbedEditor,
      createAndEditEmbed,
      deleteActiveEmbed,
      blogPosts,
      blogPostCount,
      blogEditorOpen,
      blogEditorPost,
      blogEditorOriginalSlug,
      openBlogEditorNew,
      openBlogEditorExisting,
      refreshBlogPosts,
      allLinkTags,
      allGalleryTags,
      allBlogTags,
      defaultTabOptions,
      filteredTabIcons,
      searchTabIcons,
      getTabIconComponent,
      supabaseUrl,
      subscribers,
      subscribersLoading,
      subscriberCounts,
      loadSubscribers,
      deleteSubscriber,
      newsletterSends,
      sendsLoading,
      composeOpen,
      composeRecord,
      loadSends,
      openComposeNew,
      openComposeEdit,
      onComposeSaved,
      onComposeDeleted,
      onComposeSent,
      formatSendDate,
      lockCms,
      subscribersError,
      contentSubTab,
      contentSubTabOptions,
    };
  },
});
</script>

<style scoped>
.cms {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: min(72vh, 740px);
  min-height: 520px;
}

cms__tabBar {
  padding: 12px;
  border-radius: 22px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.cms__tabBar {
  padding: 12px;
  border-radius: 22px;
  border: 1px solid var(--color-border-2);
  background: var(--glass);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.cms__tabBarInner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cms__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.cms__tabs--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.cms__tab {
  height: 48px;
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 12px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: var(--glass);
  color: var(--color-ink);
  font-weight: 900;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

.cms__tab:hover {
  background: var(--glass-strong);
  border-color: var(--color-border-2);
  transform: translateY(-1px);
}

.cms__tab.is-active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.32);
  box-shadow: 0 18px 44px rgba(59, 130, 246, 0.18);
  color: rgba(11, 18, 32, 0.96);
}

.cms__tab.is-active .cms__tab-icon {
  background: rgba(59, 130, 246, 0.22);
  border-color: rgba(59, 130, 246, 0.3);
  color: rgba(37, 99, 235, 0.96);
}

.cms__tab-icon {
  height: 28px;
  width: 28px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid var(--color-border-2);
  background: var(--glass-strong);
  color: var(--color-ink-soft);
}

cms__tab-label {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms__tab-label {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

cms__tab-pill {
  justify-self: end;
  min-width: 28px;
  height: 20px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.68);
  font-size: 11px;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.62);
}

.cms__tab-pill {
  justify-self: end;
  min-width: 28px;
  height: 20px;
  padding: 0 8px;
  display: inline-flex;
  alignments_CENTER: center;
  justify-control: center;
  border-radius: 999px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.68);
  font-size: 11px;
  font-weight: 900;
  color: rgba(11, 18, 32, 0.62);
}

.cms__tab-pill--ghost {
  opacity: 0;
  pointer-events: none;
}

.cms__subTabBar {
  padding: 0 0 12px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 16px;
}

.cms__subTabBar--desktop {
  display: none;
  gap: 4px;
  overflow-x: auto;
}

.cms__subTabBar--mobile {
  display: block;
}

@media (min-width: 640px) {
  .cms__subTabBar--desktop {
    display: flex;
  }
  .cms__subTabBar--mobile {
    display: none;
  }
}

.cms__subTab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: var(--glass);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-ink);
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  white-space: nowrap;
}

.cms__subTab:hover {
  background: var(--glass-strong);
  border-color: var(--color-border-2);
}

.cms__subTab.is-active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.32);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12);
  color: rgba(11, 18, 32, 0.96);
}

.cms__subPanel {
  /* no extra spacing needed, panel-head handles it */
}

.cms__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border-2);
  background: var(--glass);
  font-size: 12px;
  font-weight: 800;
  color: var(--color-ink-soft);
  margin-right: 0.25rem;
}

.cms__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
}

.cms__status.is-dirty .cms__dot {
  background: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14);
}

.cms__content {
  flex: 1;
  border-radius: 22px;
  border: 1px solid var(--color-border-2);
  background: var(--glass);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  padding: 14px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
}

.cms__panel-head {
  margin-bottom: 12px;
}

.cms__panel-head--row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.cms__title {
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

cms__sub {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 700;
}

.cms__sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-ink-soft);
  font-weight: 700;
}

.cms__card {
  border-radius: 22px;
  border: 1px solid var(--color-border-2);
  background: var(--glass-2);
  overflow: hidden;
  padding: 12px;
}

cms__form {
  display: grid;
  gap: 12px;
}

.cms__form {
  display: grid;
  gap: 12px;
}

cms__field {
  display: grid;
  gap: 6px;
}

.cms__field {
  display: grid;
  gap: 6px;
}

cms__label {
  font-size: 12px;
  font-weight: 950;
  color: rgba(11, 18, 32, 0.7);
}

.cms__label {
  font-size: 12px;
  font-weight: 950;
  color: var(--color-ink-soft);
}

cms__help {
  font-size: 12px;
  color: rgba(11, 18, 32, 0.6);
  font-weight: 650;
}

.cms__help {
  font-size: 12px;
  color: var(--color-ink-soft);
  font-weight: 650;
}

.cms__primary {
  border: 0 !important;
  background: var(--color-brand) !important;
  box-shadow: 0 16px 44px rgba(37, 99, 235, 0.22) !important;
}

cms__primary--addon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 136px;
}

.cms__primary--addon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 136px;
}

\CMS__btn-label,
\CMS__btn-label--compact {
  margin-left: 0.5rem;
}

.cms__btn-label,
.cms__btn-label--compact {
  margin-left: 0.5rem;
}

.cms__btn-label--compact {
  display: none;
}

cms__list {
  display: grid;
  gap: 8px;
}

.cms__list {
  display: grid;
  gap: 8px;
}

cms__socialList {
  display: grid;
  gap: 8px;
}

.cms__socialList {
  display: grid;
  gap: 8px;
}

cms__row {
  width: 100%;
  text-align: left;
  display: grid;
  grid-template-columns: 34px 44px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.cms__row {
  width: 100%;
  text-align: left;
  display: grid;
  grid-template-columns: 34px 44px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(11, 18, 32, 0.06);
  background: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

cms__socialList .cms__row {
  grid-template-columns: 34px 44px 1fr auto;
}

.cms__socialList .cms__row {
  grid-template-columns: 34px 44px 1fr auto;
}

.cms__blogList .cms__row {
  grid-template-columns: 44px 1fr auto;
}

cms__row:hover {
  background: rgba(255, 255, 255, 0.76);
  border-color: rgba(11, 18, 32, 0.1);
}

.cms__row:hover {
  background: rgba(255, 255, 255, 0.76);
  border-color: rgba(11, 18, 32, 0.1);
}

cms__row-drag {
  height: 34px;
  width: 34px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  display: grid;
  place-items: center;
  color: rgba(11, 18, 32, 0.55);
}

.cms__row-drag {
  height: 34px;
  width: 34px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  display: grid;
  place-items: center;
  color: rgba(11, 18, 32, 0.55);
}

cms__row-drag--muted {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}

.cms__row-drag--muted {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}

cms__row-thumb {
  height: 44px;
  width: 44px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.cms__row-thumb {
  height: 44px;
  width: 44px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.58);
  overflow: hidden;
  display: grid;
  place-items: center;
}

cms__row-text {
  min-width: 0;
}

.cms__row-text {
  min-width: 0;
}

cms__row-title {
  display: block;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: rgba(11, 18, 32, 0.92);
}

.cms__row-title {
  display: block;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: rgba(11, 18, 32, 0.92);
}

cms__row-sub {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms__row-sub {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

cms__row-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cms__row-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cms__ok {
  color: #10b981;
}

cms__empty {
  padding: 16px 12px;
  text-align: center;
}

.cms__empty {
  padding: 16px 12px;
  text-align: center;
}

cms__empty-title {
  font-weight: 950;
  letter-spacing: -0.02em;
}

.cms__empty-title {
  font-weight: 950;
  letter-spacing: -0.02em;
}

cms__empty-sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

.cms__empty-sub {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(11, 18, 32, 0.62);
  font-weight: 650;
}

cms__footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cms__footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

cms__footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cms__footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 820px) {
  .cms {
    height: min(82vh, 820px);
  }

  .cms__tabBar {
    padding: 10px;
  }

  .cms__tab {
    height: 44px;
    grid-template-columns: 28px 1fr 24px;
    gap: 8px;
    padding: 0 10px;
  }

  .cms__tab-label {
    font-size: 12px;
  }

  .cms__tab-pill {
    min-width: 24px;
    height: 18px;
    font-size: 10px;
  }
}

@media (max-width: 640px) {
  .cms__tabBarInner {
    gap: 10px;
  }

  .cms__tab {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 0;
  }

  .cms__tab-icon {
    height: 32px;
    width: 32px;
  }

  .cms__tab-label,
  .cms__tab-pill {
    display: none;
  }

  .cms__btn-label {
    display: none;
  }

  .cms__btn-label--compact {
    display: inline;
  }

  .cms__primary--addon {
    min-width: auto;
  }
}

/* Accordion */
.cms__accordion-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  margin-top: 8px;
  border-radius: 16px;
  border: 1px solid rgba(11, 18, 32, 0.08);
  background: rgba(255, 255, 255, 0.55);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: rgba(11, 18, 32, 0.88);
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}

.cms__accordion-trigger:first-of-type {
  margin-top: 0;
}

.cms__accordion-trigger:hover {
  background: rgba(255, 255, 255, 0.78);
  border-color: rgba(11, 18, 32, 0.12);
}

.cms__accordion-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cms__accordion-body {
  padding: 12px 2px 4px;
  overflow: hidden;
}

/* Collapse transition */
.cms-collapse-enter-active,
.cms-collapse-leave-active {
  transition: all 200ms ease;
  max-height: 600px;
  opacity: 1;
}
.cms-collapse-enter-from,
.cms-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}

/* Color editor grid */
.cms__color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 16px;
}

@media (max-width: 720px) {
  .cms__color-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .cms__color-grid {
    grid-template-columns: 1fr;
  }
}

.cms__color-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.cms__color-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cms__color-swatch {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 12px;
  border: 1px solid rgba(11, 18, 32, 0.12);
  padding: 2px;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
}

.cms__color-swatch::-webkit-color-swatch-wrapper {
  padding: 0;
}

.cms__color-swatch::-webkit-color-swatch {
  border: none;
  border-radius: 8px;
}

.cms__color-swatch::-moz-color-swatch {
  border: none;
  border-radius: 8px;
}

.cms__color-hex {
  flex: 1 1 0;
  min-width: 0;
  width: 0;
  font-size: 12px !important;
  font-family: ui-monospace, monospace !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cms__color-hex--full {
  flex: 1 1 100%;
  width: 100%;
}

.cms__color-section-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(11, 18, 32, 0.45);
  margin-top: 6px;
}

.cms__reset-theme {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(11, 18, 32, 0.1);
  background: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  font-weight: 800;
  color: rgba(11, 18, 32, 0.65);
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
  justify-self: start;
}

.cms__reset-theme:hover {
  background: rgba(255, 255, 255, 0.82);
  color: rgba(11, 18, 32, 0.85);
}

.cms__reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  transition: background 120ms ease;
  vertical-align: middle;
  margin-left: 4px;
  flex-shrink: 0;
}

.cms__reset-btn:hover {
  background: rgba(59, 130, 246, 0.24);
}

.cms__reset-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: rgba(59, 130, 246, 0.08);
  font-size: 12px;
  font-weight: 700;
  color: #3b82f6;
  cursor: pointer;
  transition: background 120ms ease;
}

.cms__reset-all-btn:hover {
  background: rgba(59, 130, 246, 0.16);
}
</style>