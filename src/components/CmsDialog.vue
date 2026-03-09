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
              :class="{ 'is-active': tab === 'theme' }"
              @click="tab = 'theme'"
            >
              <span class="cms__tab-icon"><i class="pi pi-palette" /></span>
              <span class="cms__tab-label">Theme</span>
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
              <span class="cms__tab-pill cms__tab-pill--ghost" aria-hidden="true">0</span>
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
            <div class="cms__sub">Configure your profile, images, and integrations.</div>
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

        <section v-else-if="tab === 'theme'" class="cms__panel">
          <div class="cms__panel-head">
            <div class="cms__title">Theme</div>
            <div class="cms__sub">Layout, preset, colours, and layout-specific settings.</div>
          </div>

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
          </div>

          <!-- Images -->
          <button type="button" class="cms__accordion-trigger" @click="themeSection.images = !themeSection.images">
            <span class="cms__accordion-label"><i class="pi pi-image" /> Images</span>
            <i class="pi" :class="themeSection.images ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="themeSection.images" class="cms__accordion-body">
              <div class="cms__form">
                <div class="cms__field">
                  <ImageUploadField
                    :modelValue="(draft.theme.layoutData.bannerUrl as string) ?? ''"
                    @update:modelValue="draft.theme.layoutData = { ...draft.theme.layoutData, bannerUrl: $event }"
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
                    :modelValue="(draft.theme.layoutData.avatarUrl as string) ?? ''"
                    @update:modelValue="draft.theme.layoutData = { ...draft.theme.layoutData, avatarUrl: $event }"
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

          <!-- Colours -->
          <button type="button" class="cms__accordion-trigger" @click="themeSection.colours = !themeSection.colours">
            <span class="cms__accordion-label"><i class="pi pi-palette" /> Colours</span>
            <i class="pi" :class="themeSection.colours ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="themeSection.colours" class="cms__accordion-body">
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
            </div>
          </Transition>

          <!-- Surfaces & Borders -->
          <button type="button" class="cms__accordion-trigger" @click="themeSection.surfaces = !themeSection.surfaces">
            <span class="cms__accordion-label"><i class="pi pi-stop" /> Surfaces &amp; Borders</span>
            <i class="pi" :class="themeSection.surfaces ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="themeSection.surfaces" class="cms__accordion-body">
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
            </div>
          </Transition>

          <!-- Card Items -->
          <button type="button" class="cms__accordion-trigger" @click="themeSection.cards = !themeSection.cards">
            <span class="cms__accordion-label"><i class="pi pi-th-large" /> Card Items</span>
            <i class="pi" :class="themeSection.cards ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="themeSection.cards" class="cms__accordion-body">
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
            </div>
          </Transition>

          <!-- Radius -->
          <button type="button" class="cms__accordion-trigger" @click="themeSection.radius = !themeSection.radius">
            <span class="cms__accordion-label"><i class="pi pi-circle" /> Radius</span>
            <i class="pi" :class="themeSection.radius ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="themeSection.radius" class="cms__accordion-body">
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
            </div>
          </Transition>

          <!-- Typography -->
          <button type="button" class="cms__accordion-trigger" @click="themeSection.typography = !themeSection.typography">
            <span class="cms__accordion-label"><i class="pi pi-text" /> Typography</span>
            <i class="pi" :class="themeSection.typography ? 'pi-chevron-up' : 'pi-chevron-down'" />
          </button>
          <Transition name="cms-collapse">
            <div v-if="themeSection.typography" class="cms__accordion-body">
              <div class="cms__color-grid" style="grid-template-columns: 1fr;">
                <div class="cms__color-field" style="max-width: 100%;">
                  <label class="cms__label">Page font family
                    <button v-if="isOverridden('fontFamily')" class="cms__reset-btn" @click="resetField('fontFamily')" title="Reset to preset"><i class="pi pi-undo" /></button>
                  </label>
                  <GoogleFontPicker
                    :modelValue="draft.theme.fontFamily || ''"
                    @update:modelValue="draft.theme.fontFamily = $event"
                  />
                </div>
                <div class="cms__color-field">
                  <label class="cms__label">Font weight
                    <button v-if="isOverridden('fontWeight')" class="cms__reset-btn" @click="resetField('fontWeight')" title="Reset to preset"><i class="pi pi-undo" /></button>
                  </label>
                  <select v-model="draft.theme.fontWeight" class="cms__color-hex cms__color-hex--full" style="appearance: auto;">
                    <option value="">Default</option>
                    <option value="300">300 – Light</option>
                    <option value="400">400 – Regular</option>
                    <option value="500">500 – Medium</option>
                    <option value="600">600 – Semi Bold</option>
                    <option value="700">700 – Bold</option>
                    <option value="800">800 – Extra Bold</option>
                    <option value="900">900 – Black</option>
                  </select>
                </div>
                <div class="cms__color-field">
                  <label class="cms__label">Letter spacing
                    <button v-if="isOverridden('letterSpacing')" class="cms__reset-btn" @click="resetField('letterSpacing')" title="Reset to preset"><i class="pi pi-undo" /></button>
                  </label>
                  <InputText v-model="draft.theme.letterSpacing" class="cms__color-hex cms__color-hex--full" placeholder="e.g. 0.05em, -0.01em" />
                </div>
              </div>
            </div>
          </Transition>

          <!-- Layout-specific variables -->
          <template v-if="activeManifest && activeManifest.vars.length > 0">
            <button type="button" class="cms__accordion-trigger" @click="themeSection.layoutVars = !themeSection.layoutVars">
              <span class="cms__accordion-label"><i class="pi pi-sliders-h" /> {{ activeManifest.name }} Layout</span>
              <i class="pi" :class="themeSection.layoutVars ? 'pi-chevron-up' : 'pi-chevron-down'" />
            </button>
            <Transition name="cms-collapse">
              <div v-if="themeSection.layoutVars" class="cms__accordion-body">
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
              </div>
            </Transition>
          </template>

          <!-- Layout-specific schema settings -->
          <template v-if="activeManifest?.schema?.length">
            <button type="button" class="cms__accordion-trigger" @click="themeSection.layoutSettings = !themeSection.layoutSettings">
              <span class="cms__accordion-label"><i class="pi pi-cog" /> {{ activeManifest.name }} Settings</span>
              <i class="pi" :class="themeSection.layoutSettings ? 'pi-chevron-up' : 'pi-chevron-down'" />
            </button>
            <Transition name="cms-collapse">
              <div v-if="themeSection.layoutSettings" class="cms__accordion-body">
                <LayoutSchemaRenderer
                  :schema="activeManifest.schema"
                  :modelValue="draft.theme.layoutData"
                  @update:modelValue="draft.theme.layoutData = $event"
                />
              </div>
            </Transition>
          </template>

          <div class="cms__form">
            <button
              type="button"
              class="cms__reset-theme"
              @click="resetTheme"
            >
              <i class="pi pi-refresh" /> Reset to defaults
            </button>
          </div>
        </section>

        <section v-else-if="tab === 'content'" class="cms__panel">
          <!-- Content sub-tabs (desktop) -->
          <div class="cms__subTabBar cms__subTabBar--desktop">
            <button
              v-for="cs in (activeManifest?.contentSchemas ?? [])"
              :key="cs.key"
              type="button"
              class="cms__subTab"
              :class="{ 'is-active': contentSubTab === cs.key }"
              @click="contentSubTab = cs.key"
            >
              <component :is="getTabIconComponent(cs.icon)" :size="14" /> {{ cs.label }}
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

          <!-- Dynamic content schema panels -->
          <template v-for="cs in (activeManifest?.contentSchemas ?? [])" :key="cs.key">
            <div v-if="contentSubTab === cs.key" class="cms__subPanel">
              <!-- Nav visibility / label / icon settings (shown for all tab-nav collections) -->
              <div
                v-if="!['socials', 'widgets', 'embeds'].includes(cs.key) && draft.collections[cs.key]"
                class="cms__card"
                style="margin-bottom: 10px"
              >
                <div class="cms__form">
                  <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
                    <div>
                      <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Show in navigation</div>
                      <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                        Display this section as a tab on your public page.
                      </div>
                    </div>
                    <ToggleSwitch
                      :modelValue="draft.collections[cs.key].enabled"
                      @update:modelValue="updateCollectionMeta(cs.key, { ...draft.collections[cs.key], enabled: $event })"
                    />
                  </div>
                  <div class="mt-2 flex flex-col gap-1">
                    <label class="cms__label">Tab label</label>
                    <InputText
                      class="w-full"
                      :modelValue="draft.collections[cs.key].label"
                      :placeholder="cs.label"
                      @update:modelValue="updateCollectionMeta(cs.key, { ...draft.collections[cs.key], label: String($event) })"
                    />
                  </div>
                  <div class="mt-2 flex flex-col gap-1">
                    <label class="cms__label">
                      Tab icon
                      <span class="font-normal text-[color:var(--color-ink-soft)]">(Lucide name, e.g. &ldquo;BookOpen&rdquo;)</span>
                    </label>
                    <div class="flex items-center gap-2">
                      <InputText
                        class="w-full"
                        :modelValue="draft.collections[cs.key].icon"
                        :placeholder="cs.icon"
                        @update:modelValue="updateCollectionMeta(cs.key, { ...draft.collections[cs.key], icon: String($event) })"
                      />
                      <component
                        :is="getTabIconComponent(draft.collections[cs.key].icon || cs.icon)"
                        :size="18"
                        class="shrink-0 text-[color:var(--color-ink-soft)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <!-- Custom editor component (resume, blog, newsletter, etc.) -->
              <template v-if="resolvedEditorComponents[cs.key]">
                <div v-if="cs.searchable && draft.collections[cs.key]" class="cms__card" style="margin-bottom: 10px">
                  <div class="cms__form">
                    <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--glass-2)] p-3">
                      <div>
                        <div class="text-xs font-extrabold text-[color:var(--color-ink)]">Enable search</div>
                        <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                          Show a search bar on the public page for this section.
                        </div>
                      </div>
                      <ToggleSwitch :modelValue="draft.collections[cs.key].searchEnabled" @update:modelValue="updateCollectionMeta(cs.key, { ...draft.collections[cs.key], searchEnabled: $event })" />
                    </div>
                  </div>
                </div>
                <component
                  :is="resolvedEditorComponents[cs.key]"
                  :collection="draft.collections[cs.key]"
                  :model="draft"
                  @reauth="$emit('reauth')"
                  @blog-posts-updated="$emit('blog-posts-updated')"
                />
              </template>
              <!-- Schema-driven list editor (links, gallery, embeds, etc.) -->
              <CollectionListEditor
                v-else-if="cs.itemSchema && draft.collections[cs.key]"
                :schema="cs"
                :collection="draft.collections[cs.key]"
                :items="draft.collections[cs.key]?.items ?? []"
                :initial-item-id="cs.key === contentSubTab ? initialItemId : ''"
                @update:items="updateCollectionItems(cs.key, $event)"
                @update:collection="updateCollectionMeta(cs.key, $event)"
              />
            </div>
          </template>
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
  </Dialog>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, shallowRef, watch, watchEffect, type Component, markRaw } from "vue";
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
import GoogleFontPicker from "./GoogleFontPicker.vue";

import ImageUploadField from "./ImageUploadField.vue";
import CollectionListEditor from "./CollectionListEditor.vue";
import AnalyticsPanel from "./AnalyticsPanel.vue";
import { icons as lucideIcons } from "lucide-vue-next";
import { getAvailableLayouts, getLayoutManifest, getLayoutPresets } from "../lib/component-resolver";
import type { LayoutManifest, LayoutVar } from "../lib/layout-manifest";
import type { BioModel, ThemePreset } from "../lib/model";
import {
  defaultModel,
  defaultTheme,
  THEME_PRESETS,
  sanitizeModel,
  stableStringify,
} from "../lib/model";
import {
  loadGithubSettings,
  saveGithubSettings,
  getPlaintextToken,
  canUseGithubSync,
  testGithubConnection,
  type GithubSettings,
} from "../lib/github";

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
    ImageUploadField,
    CollectionListEditor,
    AnalyticsPanel,
    ToggleSwitch,
    LayoutSchemaRenderer,
    GoogleFontPicker,
  },
  props: {
    open: { type: Boolean, required: true },
    model: { type: Object as () => BioModel, required: true },
    initialTab: { type: String, default: "site" },
    initialEmbedId: { type: String, default: "" },
    initialBlogSlug: { type: String, default: "" },
    initialContentSubTab: { type: String, default: "" },
    initialItemId: { type: String, default: "" },
    navTrigger: { type: Number, default: 0 },
  },
  emits: ["update:open", "update:model", "blog-posts-updated", "lock", "reauth"],
  setup(props, { emit }) {
    const toast = useToast();

    const visible = ref(props.open);

    const draft = ref<BioModel>(sanitizeModel(props.model));

    const activeManifest = computed<LayoutManifest | null>(() =>
      getLayoutManifest(draft.value.theme.layout || "default"),
    );

    const contentSubTabs = computed(() =>
      (activeManifest.value?.contentSchemas ?? []).map((s) => s.key),
    );

    const contentSubTabOptions = computed(() =>
      (activeManifest.value?.contentSchemas ?? []).map((s) => ({
        label: s.label,
        value: s.key,
      })),
    );

    // Resolve editorComponents from contentSchemas
    const resolvedEditorComponents = shallowRef<Record<string, Component>>({});
    watchEffect(async () => {
      const manifest = activeManifest.value;
      const schemas = manifest?.contentSchemas ?? [];
      const resolved: Record<string, Component> = {};
      await Promise.all(
        schemas.map(async (s) => {
          if (s.editorComponent) {
            const mod = await s.editorComponent();
            resolved[s.key] = markRaw(mod.default);
          }
        }),
      );
      resolvedEditorComponents.value = resolved;
    });

    function resolveInitialTab(val: string): { main: string; sub: string } {
      const schemas = activeManifest.value?.contentSchemas ?? [];
      const keys = schemas.map((s) => s.key);
      if (keys.includes(val)) return { main: "content", sub: val };
      if (val === "analytics") return { main: "analytics", sub: keys[0] || "links" };
      return { main: "site", sub: keys[0] || "links" };
    }

    const initialResolved = resolveInitialTab(props.initialTab);
    const tab = ref<string>(initialResolved.main);
    const contentSubTab = ref<string>(initialResolved.sub);

    const siteSection = reactive({
      identity: false,
      favicon: false,
      github: false,
      scripts: false,
      supabase: false,
    });

    const themeSection = reactive({
      images: false,
      colours: false,
      surfaces: false,
      cards: false,
      radius: false,
      typography: false,
      layoutVars: false,
      layoutSettings: false,
    });

    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";

    watch(
      () => props.open,
      (v) => {
        visible.value = v;
        if (v) {
          const resolved = resolveInitialTab(props.initialTab);
          tab.value = resolved.main;
          contentSubTab.value = resolved.sub;
          // If an embed ID is provided, navigate to embeds sub-tab
          if (props.initialEmbedId) {
            tab.value = 'content';
            contentSubTab.value = 'embeds';
          }
          // If a blog slug is provided, navigate to blog sub-tab
          if (props.initialBlogSlug) {
            tab.value = 'content';
            contentSubTab.value = 'blog';
          }
          // If a direct content sub-tab is provided, navigate to it
          if (props.initialContentSubTab) {
            tab.value = 'content';
            contentSubTab.value = props.initialContentSubTab;
          }
        }
      },
    );
    // Also react when navTrigger increments (CMS already open case)
    watch(
      () => props.navTrigger,
      () => {
        if (props.initialContentSubTab) {
          tab.value = 'content';
          contentSubTab.value = props.initialContentSubTab;
        }
      },
    );
    watch(visible, (v) => emit("update:open", v));

    function lockCms() {
      visible.value = false;
      emit("lock");
    }

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
      const presets = getLayoutPresets(layout);
      const factory = presets[preset] || THEME_PRESETS[preset];
      const base = factory ? factory() : defaultTheme();
      const { layoutVars, layoutData } = draft.value.theme;
      draft.value.theme = { ...base, preset: draft.value.theme.preset, layout, layoutVars, layoutData };
      toast.add({ severity: "info", summary: "Theme reset", detail: "Colours restored to defaults.", life: 1600 });
    };

    const presetOptions = computed(() => {
      const layout = draft.value.theme.layout || "default";
      const presets = getLayoutPresets(layout);
      return Object.keys(presets).map((key) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: key,
      }));
    });

    const layoutOptions = computed(() =>
      getAvailableLayouts().map((name) => ({
        label: name.charAt(0).toUpperCase() + name.slice(1),
        value: name,
      })),
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
      const presets = getLayoutPresets(layout);
      const factory = presets[preset] || THEME_PRESETS[preset];
      return factory ? factory() : defaultTheme();
    };

    const themeVarKeys = [
      "colorBrand", "colorBrandStrong", "colorAccent", "colorInk", "colorInkSoft",
      "bg", "glass", "glass2", "glassStrong", "colorBorder", "colorBorder2",
      "cardBg", "cardBorder", "cardText", "radiusXl", "radiusLg",
      "fontFamily", "fontWeight", "letterSpacing",
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
      const presets = getLayoutPresets(layout);
      const factory = presets[preset] || THEME_PRESETS[preset];
      if (factory) {
        const presetTheme = factory();
        const { layoutVars, layoutData } = draft.value.theme;
        draft.value.theme = { ...presetTheme, preset, layout, layoutVars, layoutData };
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
          const presets = getLayoutPresets(newLayout);
          const firstFactory = presets.light || Object.values(presets)[0];
          draft.value.theme = { ...firstFactory(), layout: newLayout };
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

    // ── Collection update helpers (used by dynamic content tab) ──
    const getContentSchema = (key: string) =>
      (activeManifest.value?.contentSchemas ?? []).find((s) => s.key === key);

    const updateCollectionItems = (key: string, items: Record<string, unknown>[]) => {
      if (draft.value.collections[key]) {
        draft.value.collections[key].items = items;
      }
    };

    const updateCollectionMeta = (key: string, patch: Record<string, unknown>) => {
      if (draft.value.collections[key]) {
        draft.value.collections[key] = { ...draft.value.collections[key], ...patch };
      }
    };

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



    return {
      visible,
      tab,
      draft,
      siteSection,
      themeSection,
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
      filteredTabIcons,
      searchTabIcons,
      getTabIconComponent,
      supabaseUrl,
      lockCms,
      contentSubTab,
      contentSubTabOptions,
      contentSubTabs,
      resolvedEditorComponents,
      getContentSchema,
      updateCollectionItems,
      updateCollectionMeta,
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.cms__tab-pill {
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

<!-- Shared styles that flow into child editor components (CollectionListEditor, ResumeCollectionEditor, etc.) -->
<style>
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
.cms__form {
  display: grid;
  gap: 12px;
}
.cms__field {
  display: grid;
  gap: 6px;
}
.cms__label {
  font-size: 12px;
  font-weight: 950;
  color: var(--color-ink-soft);
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
.cms__primary--addon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 136px;
}
.cms__list {
  display: grid;
  gap: 8px;
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
  border: 1px solid var(--color-border-2, rgba(11, 18, 32, 0.06));
  background: var(--glass, rgba(255, 255, 255, 0.62));
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
}
.cms__row:hover {
  background: var(--glass-strong, rgba(255, 255, 255, 0.76));
  border-color: var(--color-border, rgba(11, 18, 32, 0.1));
}
.cms__row-drag {
  height: 34px;
  width: 34px;
  border-radius: 14px;
  border: 1px solid var(--color-border-2, rgba(255, 255, 255, 0.7));
  background: var(--glass-2, rgba(255, 255, 255, 0.58));
  display: grid;
  place-items: center;
  color: var(--color-ink-soft, rgba(11, 18, 32, 0.55));
}
.cms__row-thumb {
  height: 44px;
  width: 44px;
  border-radius: 16px;
  border: 1px solid var(--color-border-2, rgba(255, 255, 255, 0.7));
  background: var(--glass-2, rgba(255, 255, 255, 0.58));
  overflow: hidden;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.cms__row-text {
  min-width: 0;
}
.cms__row-title {
  display: block;
  font-size: 13px;
  font-weight: 950;
  letter-spacing: -0.02em;
  color: var(--color-ink, rgba(11, 18, 32, 0.92));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cms__row-sub {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-ink-soft, rgba(11, 18, 32, 0.62));
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cms__row-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.cms__ok {
  color: #10b981;
}
.cms__empty {
  padding: 16px 12px;
  text-align: center;
}
.cms__empty-title {
  font-weight: 950;
  letter-spacing: -0.02em;
}
.cms__empty-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-ink-soft, rgba(11, 18, 32, 0.62));
  font-weight: 650;
}
</style>