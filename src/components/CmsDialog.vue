<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="CMS"
    :style="{ width: 'min(980px, 96vw)' }"
    :contentStyle="{ overflow: 'hidden' }"
    :showCloseIcon="true"
  >
    <template #icons>
      <div class="cms__status" :class="{ 'is-dirty': hasChanges }">
        <span class="cms__dot" />
        <span>{{ hasChanges ? "Unsaved changes" : "Saved" }}</span>
      </div>
    </template>

    <div class="cms">
      <div class="cms__tabBar">
        <div class="cms__tabBarInner">
          <div class="cms__tabs">
            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'profile' }"
              @click="tab = 'profile'"
            >
              <span class="cms__tab-icon"><i class="pi pi-cog" /></span>
              <span class="cms__tab-label">Site</span>
              <span class="cms__tab-pill cms__tab-pill--ghost" aria-hidden="true">0</span>
            </button>

            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'links' }"
              @click="tab = 'links'"
            >
              <span class="cms__tab-icon"><i class="pi pi-link" /></span>
              <span class="cms__tab-label">Links</span>
              <span class="cms__tab-pill">{{ draft.links.length }}</span>
            </button>

            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'socials' }"
              @click="tab = 'socials'"
            >
              <span class="cms__tab-icon"><i class="pi pi-share-alt" /></span>
              <span class="cms__tab-label">Socials</span>
              <span class="cms__tab-pill">{{ draft.socials.length }}</span>
            </button>

            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'resume' }"
              @click="tab = 'resume'"
            >
              <span class="cms__tab-icon"><i class="pi pi-file" /></span>
              <span class="cms__tab-label">Resume</span>
              <span class="cms__tab-pill" :class="{ 'cms__tab-pill--ghost': !draft.resume.enabled }">{{ draft.resume.enabled ? '✓' : '0' }}</span>
            </button>

            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'gallery' }"
              @click="tab = 'gallery'"
            >
              <span class="cms__tab-icon"><i class="pi pi-images" /></span>
              <span class="cms__tab-label">Gallery</span>
              <span class="cms__tab-pill" :class="{ 'cms__tab-pill--ghost': !draft.gallery.enabled }">{{ draft.gallery.items.length }}</span>
            </button>

            <button
              type="button"
              class="cms__tab"
              :class="{ 'is-active': tab === 'github' }"
              @click="tab = 'github'"
            >
              <span class="cms__tab-icon"><i class="pi pi-github" /></span>
              <span class="cms__tab-label">GitHub</span>
              <span class="cms__tab-pill cms__tab-pill--ghost" aria-hidden="true">{{ githubReady ? 0 : 0 }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="cms__content">
        <section v-if="tab === 'profile'" class="cms__panel">
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
                  <label class="cms__label">Banner URL (optional)</label>
                  <InputText v-model="draft.profile.bannerUrl" class="w-full" placeholder="https://..." />
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
                <div class="cms__field">
                  <label class="cms__label">Avatar URL (optional)</label>
                  <InputText v-model="draft.profile.avatarUrl" class="w-full" placeholder="https://..." />
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
                  <div class="cms__help">Choose a preset to populate all values, or pick Custom to edit freely.</div>
                </div>

                <div class="cms__color-section-label">Colours</div>
                <div class="cms__color-grid">
                  <div class="cms__color-field">
                    <label class="cms__label">Brand</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorBrand" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBrand" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Brand Strong</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorBrandStrong" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBrandStrong" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Accent</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorAccent" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorAccent" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Text</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorInk" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorInk" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Text Soft</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.colorInkSoft" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorInkSoft" class="cms__color-hex" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Background</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" v-model="draft.theme.bg" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.bg" class="cms__color-hex" />
                    </div>
                  </div>
                </div>

                <div class="cms__color-section-label">Surfaces &amp; Borders</div>
                <div class="cms__color-grid">
                  <div class="cms__color-field">
                    <label class="cms__label">Glass</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.glass)" @input="draft.theme.glass = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.glass" class="cms__color-hex" placeholder="rgba(255,255,255,0.66)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Glass 2</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.glass2)" @input="draft.theme.glass2 = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.glass2" class="cms__color-hex" placeholder="rgba(255,255,255,0.52)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Glass Strong</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.glassStrong)" @input="draft.theme.glassStrong = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.glassStrong" class="cms__color-hex" placeholder="rgba(255,255,255,0.82)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Border</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.colorBorder)" @input="draft.theme.colorBorder = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBorder" class="cms__color-hex" placeholder="rgba(255,255,255,0.62)" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Border 2</label>
                    <div class="cms__color-input-wrap">
                      <input type="color" :value="toHex(draft.theme.colorBorder2)" @input="draft.theme.colorBorder2 = ($event.target as HTMLInputElement).value" class="cms__color-swatch" />
                      <InputText v-model="draft.theme.colorBorder2" class="cms__color-hex" placeholder="rgba(11,18,32,0.10)" />
                    </div>
                  </div>
                </div>

                <div class="cms__color-section-label">Radius</div>
                <div class="cms__color-grid">
                  <div class="cms__color-field">
                    <label class="cms__label">Card Radius (XL)</label>
                    <div class="cms__color-input-wrap">
                      <InputText v-model="draft.theme.radiusXl" class="cms__color-hex cms__color-hex--full" placeholder="1.6rem" />
                    </div>
                  </div>
                  <div class="cms__color-field">
                    <label class="cms__label">Inner Radius (LG)</label>
                    <div class="cms__color-input-wrap">
                      <InputText v-model="draft.theme.radiusLg" class="cms__color-hex cms__color-hex--full" placeholder="1.2rem" />
                    </div>
                  </div>
                </div>

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
        </section>

        <section v-else-if="tab === 'links'" class="cms__panel">
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
        </section>

        <section v-else-if="tab === 'socials'" class="cms__panel">
          <div class="cms__panel-head cms__panel-head--row">
            <div>
              <div class="cms__title">Social links</div>
              <div class="cms__sub">Add socials that show under your name.</div>
            </div>

            <Button rounded class="cms__primary cms__primary--addon" @click="createAndEditSocial">
              <i class="pi pi-plus" />
              <span class="cms__btn-label">Add social</span>
              <span class="cms__btn-label--compact">Add</span>
            </Button>
          </div>

          <div class="cms__card">
            <div v-if="draft.socials.length === 0" class="cms__empty">
              <div class="cms__empty-title">No socials yet</div>
              <div class="cms__empty-sub">
                Add GitHub, Instagram, X, YouTube, TikTok, or Website.
              </div>
            </div>

            <div v-else class="cms__socialList">
              <button
                v-for="s in draft.socials"
                :key="s.id"
                type="button"
                class="cms__row"
                @click="openSocialEditor(s.id)"
              >
                <span class="cms__row-drag cms__row-drag--muted" aria-hidden="true">
                  <i class="pi" :class="primeSocialIcon(s.type)" />
                </span>

                <span class="cms__row-text">
                  <span class="cms__row-title">{{ s.label || socialLabel(s.type) }}</span>
                  <span class="cms__row-sub">{{ s.url || "(no url)" }}</span>
                </span>

                <span class="cms__row-meta">
                  <Tag v-if="!s.enabled" severity="warning" value="Hidden" class="!rounded-full" />
                  <i v-else class="pi pi-check-circle cms__ok" />
                  <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
                </span>
              </button>
            </div>
          </div>
        </section>

        <section v-else-if="tab === 'resume'" class="cms__panel">
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
                <div v-else class="grid gap-2">
                  <button
                    v-for="edu in draft.resume.education"
                    :key="edu.id"
                    type="button"
                    class="cms__row"
                    style="grid-template-columns: 44px 1fr auto;"
                    @click="openEducationEditor(edu.id)"
                  >
                    <span class="cms__row-drag cms__row-drag--muted">
                      <i class="pi pi-graduation-cap" />
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
                </div>
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
                <div v-else class="grid gap-2">
                  <button
                    v-for="job in draft.resume.employment"
                    :key="job.id"
                    type="button"
                    class="cms__row"
                    style="grid-template-columns: 44px 1fr auto;"
                    @click="openEmploymentEditor(job.id)"
                  >
                    <span class="cms__row-drag cms__row-drag--muted">
                      <i class="pi pi-briefcase" />
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
                </div>
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
                <div v-else class="grid gap-2">
                  <button
                    v-for="ach in draft.resume.achievements"
                    :key="ach.id"
                    type="button"
                    class="cms__row"
                    style="grid-template-columns: 44px 1fr auto;"
                    @click="openAchievementEditor(ach.id)"
                  >
                    <span class="cms__row-drag cms__row-drag--muted">
                      <i class="pi pi-star" />
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
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="tab === 'gallery'" class="cms__panel">
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
        </section>

        <section v-else-if="tab === 'github'" class="cms__panel">
          <div class="cms__panel-head">
            <div class="cms__title">GitHub Sync</div>
            <div class="cms__sub">Connect your repository for automatic syncing.</div>
          </div>

          <div class="cms__card">
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
                    <InputText v-model="githubForm.owner" placeholder="e.g. your-github-username" :disabled="!!envOwner" />
                    <span v-if="envOwner" class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">Set via environment variable</span>
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Repository</label>
                    <InputText v-model="githubForm.repo" placeholder="e.g. linkable" :disabled="!!envRepo" />
                    <span v-if="envRepo" class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">Set via environment variable</span>
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Branch</label>
                    <InputText v-model="githubForm.branch" placeholder="main" :disabled="!!envBranch" />
                    <span v-if="envBranch" class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">Set via environment variable</span>
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Uploads directory</label>
                    <InputText v-model="githubForm.uploadsDir" placeholder="public/uploads" />
                    <span class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
                      Image uploads will be stored in this path.
                    </span>
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Data file path</label>
                    <InputText v-model="githubForm.dataPath" placeholder="cms-data.json" />
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Static data path</label>
                    <InputText v-model="githubForm.staticDataPath" placeholder="public/data.json" />
                    <span class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
                      Optional second file to keep your exported JSON in sync.
                    </span>
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Committer name</label>
                    <InputText v-model="githubForm.committerName" placeholder="Linkable CMS" />
                  </div>

                  <div class="grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Committer email</label>
                    <InputText v-model="githubForm.committerEmail" placeholder="cms@linkable.local" />
                  </div>

                  <div class="md:col-span-2 grid gap-2">
                    <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Personal access token</label>
                    <InputText
                      v-model="githubForm.token"
                      type="password"
                      placeholder="ghp_..."
                      autocomplete="off"
                    />
                    <span class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
                      Store a token with <code>repo</code> scope. It's saved locally in your browser.
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--glass-2)] p-4 text-[13px] font-semibold text-[color:var(--color-ink-soft)]"
              >
                <div>
                  <div class="font-extrabold text-[color:var(--color-ink)]">Tips</div>
                  <ul class="mt-1 space-y-1 text-xs font-semibold text-[color:var(--color-ink-soft)]">
                    <li>Use fine-grained PATs limited to this repository when possible.</li>
                    <li>Commits run from your browser; no secrets leave your device.</li>
                    <li>Keep static deployments fresh by running <code>npm run export</code> after syncing.</li>
                  </ul>
                </div>

                <Button
                  text
                  severity="danger"
                  class="!rounded-full"
                  @click="clearGithubToken"
                  :disabled="!githubForm.token"
                >
                  <i class="pi pi-times" />
                  <span class="ml-2">Clear token</span>
                </Button>
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
              <Button
                rounded
                severity="secondary"
                :loading="githubSaving"
                @click="handleGithubSave"
              >
                <i class="pi pi-check" />
                <span class="ml-2">Save</span>
              </Button>
            </div>
          </div>
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
      @update:item="updateGalleryItem"
      @delete="deleteActiveGalleryItem"
    />
  </Dialog>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from "vue";
import draggable from "vuedraggable";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";

import ImageUploadField from "./ImageUploadField.vue";
import LinkEditorDrawer from "./LinkEditorDrawer.vue";
import SocialEditorDrawer from "./SocialEditorDrawer.vue";
import ResumeEditorDrawer from "./ResumeEditorDrawer.vue";
import GalleryEditorDrawer from "./GalleryEditorDrawer.vue";
import {
  type BioLink,
  type BioModel,
  type SocialLink,
  type EducationEntry,
  type EmploymentEntry,
  type AchievementEntry,
  type GalleryItem,
  type ThemePreset,
  defaultModel,
  defaultResume,
  defaultGallery,
  defaultTheme,
  darkTheme,
  THEME_PRESETS,
  newLink,
  newSocial,
  newEducation,
  newEmployment,
  newAchievement,
  newGalleryItem,
  sanitizeModel,
  stableStringify,
} from "../lib/model";
import {
  loadGithubSettings,
  saveGithubSettings,
  getGithubToken,
  saveGithubToken,
  clearGithubToken,
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
    Select,
    Textarea,
    Tag,
    draggable,
    LinkEditorDrawer,
    SocialEditorDrawer,
    ImageUploadField,
    ResumeEditorDrawer,
    GalleryEditorDrawer,
    ToggleSwitch,
  },
  props: {
    open: { type: Boolean, required: true },
    model: { type: Object as () => BioModel, required: true },
  },
  emits: ["update:open", "update:model", "open-github"],
  setup(props, { emit }) {
    const toast = useToast();

    const visible = ref(props.open);
    watch(
      () => props.open,
      (v) => (visible.value = v),
    );
    watch(visible, (v) => emit("update:open", v));

    const tab = ref<"profile" | "links" | "socials" | "resume" | "gallery" | "github">("links");

    const siteSection = reactive({
      identity: false,
      images: false,
      theme: false,
    });

    const draft = ref<BioModel>(sanitizeModel(props.model));
    watch(
      () => props.model,
      (m) => {
        draft.value = sanitizeModel(m);
      },
      { deep: true },
    );

    const hasChanges = computed(
      () =>
        stableStringify(sanitizeModel(draft.value)) !==
        stableStringify(sanitizeModel(props.model)),
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

    const socialLabel = (type: string) => {
      const m: Record<string, string> = {
        website: "Website",
        github: "GitHub",
        instagram: "Instagram",
        x: "X",
        youtube: "YouTube",
        tiktok: "TikTok",
      };
      return m[type] ?? "Social";
    };

    const primeSocialIcon = (type: string) => {
      switch (type) {
        case "instagram":
          return "pi-instagram";
        case "x":
          return "pi-twitter";
        case "youtube":
          return "pi-youtube";
        case "tiktok":
          return "pi-video";
        case "github":
          return "pi-github";
        case "website":
        default:
          return "pi-globe";
      }
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
      draft.value.theme = defaultTheme();
      toast.add({ severity: "info", summary: "Theme reset", detail: "Colours restored to defaults.", life: 1600 });
    };

    const presetOptions = [
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
      { label: "Custom", value: "custom" },
    ];

    let applyingPreset = false;
    const applyPreset = (preset: ThemePreset) => {
      const factory = THEME_PRESETS[preset];
      applyingPreset = true;
      if (factory) {
        const presetTheme = factory();
        draft.value.theme = { ...presetTheme, preset };
      } else {
        draft.value.theme.preset = preset;
      }
      setTimeout(() => { applyingPreset = false; }, 0);
    };

    // Auto-switch to "custom" when user manually edits a theme value
    const themeColorKeys = [
      "colorBrand", "colorBrandStrong", "colorAccent", "colorInk", "colorInkSoft",
      "bg", "glass", "glass2", "glassStrong", "colorBorder", "colorBorder2",
      "radiusXl", "radiusLg",
    ] as const;
    watch(
      () => themeColorKeys.map((k) => draft.value.theme[k]).join("|"),
      () => {
        if (!applyingPreset && draft.value.theme.preset !== "custom") {
          draft.value.theme.preset = "custom";
        }
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

    // GitHub Settings
    type GithubFormState = GithubSettings & { token: string };
    const envOwner = import.meta.env.VITE_GITHUB_OWNER || "";
    const envRepo = import.meta.env.VITE_GITHUB_REPO || "";
    const envBranch = import.meta.env.VITE_GITHUB_BRANCH || "";

    const defaultGithubForm = (): GithubFormState => {
      const settings = loadGithubSettings();
      return {
        ...settings,
        owner: envOwner || settings.owner,
        repo: envRepo || settings.repo,
        branch: envBranch || settings.branch,
        token: getGithubToken(),
      };
    };

    const githubForm = reactive<GithubFormState>(defaultGithubForm());
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
      if (!githubForm.token.trim()) {
        throw new Error("Personal access token is required.");
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
        const { token, ...settings } = githubForm;
        saveGithubSettings(settings);
        saveGithubToken(token);
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
        await testGithubConnection(githubForm, githubForm.token);
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

    const clearGithubToken = () => {
      clearGithubToken();
      githubForm.token = "";
      githubReady.value = canUseGithubSync();
      toast.add({
        severity: "info",
        summary: "Token cleared",
        detail: "Add a new token to resume syncing.",
        life: 2200,
      });
    };

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
      applyPreset,
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
      socialLabel,
      primeSocialIcon,
      githubForm,
      githubSaving,
      githubTesting,
      githubReady,
      handleGithubSave,
      handleGithubTest,
      clearGithubToken,
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
  grid-template-columns: 44px 1fr auto;
}

.cms__socialList .cms__row {
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
</style>