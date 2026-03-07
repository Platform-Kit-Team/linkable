<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: expanded ? '100vw' : 'min(580px, 96vw)' }"
    :showCloseIcon="true"
  >
    <template #header>
      <div class="flex w-full items-center justify-between">
        <div>
          <div
            class="text-sm font-extrabold tracking-tight text-[color:var(--color-ink)] flex items-center gap-2"
          >
            {{ isNew ? 'New Broadcast' : 'Edit Broadcast' }}
            <Tag
              v-if="form.status === 'sent'"
              value="Sent"
              severity="success"
              class="!rounded-full !text-[10px]"
            />
            <Tag
              v-else-if="form.status === 'scheduled'"
              value="Scheduled"
              severity="warn"
              class="!rounded-full !text-[10px]"
            />
            <Tag
              v-else-if="form.status === 'sending'"
              value="Sending…"
              severity="info"
              class="!rounded-full !text-[10px]"
            />
            <Tag v-else value="Draft" severity="secondary" class="!rounded-full !text-[10px]" />
          </div>
          <div class="mt-0.5 text-xs font-semibold text-[color:var(--color-ink-soft)]">
            Compose and send your newsletter broadcast.
          </div>
        </div>
        <button
          type="button"
          class="cms-expand-toggle hidden md:flex"
          :title="expanded ? 'Collapse panel' : 'Expand panel'"
          @click="expanded = !expanded"
        >
          <i class="pi" :class="expanded ? 'pi-angle-right' : 'pi-angle-left'" />
        </button>
      </div>
    </template>

    <div class="space-y-4 p-2">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Subject</label>
            <InputText
              v-model="form.subject"
              class="w-full"
              placeholder="Newsletter subject line"
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <ImageUploadField
              v-model="form.coverImage"
              label="Cover Image"
              description="Optional banner displayed at the top of the email and web page."
            />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Tags</label>
            <MultiSelect
              v-model="form.tags"
              :options="availableTags"
              display="chip"
              filter
              :maxSelectedLabels="10"
              class="w-full"
              placeholder="Select or type tags…"
              @filter="onTagFilter"
            >
              <template #footer>
                <div v-if="tagFilterValue && !availableTags.includes(tagFilterValue)" class="px-3 py-2">
                  <button
                    type="button"
                    class="w-full rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-[color:var(--color-brand)] transition hover:bg-blue-50"
                    @click="addNewTag(tagFilterValue)"
                  >
                    <i class="pi pi-plus mr-1 text-[10px]" />Create "{{ tagFilterValue }}"
                  </button>
                </div>
              </template>
            </MultiSelect>
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]">Excerpt</label>
            <div class="text-[11px] text-[color:var(--color-ink-soft)] mb-1">
              Sent in the email body. Keep it concise — a teaser to drive clicks.
            </div>
            <MarkdownEditor
              v-model="form.excerptMd"
              placeholder="Write the email excerpt…"
              :key="'excerpt-' + editorKey"
            />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]"
              >Full Content</label
            >
            <div class="text-[11px] text-[color:var(--color-ink-soft)] mb-1">
              Displayed on the web page when readers click "Read More".
            </div>
            <MarkdownEditor
              v-model="form.bodyMd"
              placeholder="Write the full newsletter content…"
              :key="'body-' + editorKey"
            />
          </div>
        </div>
      </div>

      <!-- Schedule -->
      <div
        v-if="!isSent"
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm"
      >
        <div class="flex items-center gap-3 mb-2">
          <ToggleSwitch v-model="scheduleEnabled" />
          <label class="text-xs font-extrabold text-[color:var(--color-ink-soft)]" style="margin: 0"
            >Schedule for later</label
          >
        </div>
        <div v-if="scheduleEnabled" class="flex gap-2 mt-1">
          <InputText type="date" v-model="scheduleDate" class="flex-1" />
          <InputText type="time" v-model="scheduleTime" class="w-[120px]" />
        </div>
      </div>

      <!-- Analytics (sent broadcasts only) -->
      <div
        v-if="isSent && analytics"
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--glass)] p-3 shadow-sm"
      >
        <div class="text-sm font-extrabold text-[color:var(--color-ink)] mb-3">Analytics</div>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <div class="text-xl font-extrabold text-[color:var(--color-ink)]">
              {{ analytics.recipientCount }}
            </div>
            <div class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">Sent</div>
          </div>
          <div>
            <div class="text-xl font-extrabold text-blue-500">{{ analytics.uniqueClicks }}</div>
            <div class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">
              Unique Clicks
            </div>
          </div>
          <div>
            <div class="text-xl font-extrabold text-green-500">{{ analytics.clickRate }}%</div>
            <div class="text-[10px] font-semibold text-[color:var(--color-ink-soft)]">
              Click Rate
            </div>
          </div>
        </div>

        <!-- Click log -->
        <div v-if="analytics.clicks.length > 0" class="mt-3">
          <div class="text-xs font-bold text-[color:var(--color-ink-soft)] mb-2">Recent clicks</div>
          <div class="max-h-[160px] overflow-y-auto space-y-1">
            <div
              v-for="click in analytics.clicks"
              :key="click.id"
              class="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-[var(--glass)]"
            >
              <span class="truncate text-[color:var(--color-ink)]">{{
                click.email || 'Unknown'
              }}</span>
              <span class="text-[color:var(--color-ink-soft)] shrink-0 ml-2">{{
                formatClickDate(click.clicked_at)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer actions -->
      <div class="mt-6 flex items-center gap-2 border-t border-[var(--color-border)] pt-4">
        <Button
          v-if="!isNew"
          text
          rounded
          severity="danger"
          size="small"
          @click="handleDelete"
          :loading="deleting"
        >
          <i class="pi pi-trash" />
          <span class="ml-2">Delete</span>
        </Button>
        <div class="flex-1" />
        <template v-if="isSent">
          <Button
            rounded
            size="small"
            class="cmsPrimary"
            @click="handleUpdate"
            :loading="saving"
            :disabled="!form.subject.trim()"
          >
            <i class="pi pi-check" />
            <span class="ml-1">Update</span>
          </Button>
        </template>
        <template v-else>
          <Button
            size="small"
            @click="handleSave"
            :loading="saving"
            :disabled="!form.subject.trim()"
          >
            <i class="pi pi-save" />
            <span class="ml-1">Save draft</span>
          </Button>
          <Button
            v-if="scheduleEnabled"
            rounded
            size="small"
            class="cmsPrimary"
            @click="handleSchedule"
            :loading="saving"
            :disabled="!form.subject.trim() || !scheduleDate"
          >
            <i class="pi pi-clock" />
            <span class="ml-1">Schedule</span>
          </Button>
          <Button
            v-else
            rounded
            size="small"
            class="cmsPrimary"
            @click="handleSendNow"
            :loading="sending"
            :disabled="!form.subject.trim()"
          >
            <i class="pi pi-send" />
            <span class="ml-1">Send now</span>
          </Button>
        </template>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch } from 'vue';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import { useToast } from 'primevue/usetoast';
import MarkdownEditor from './MarkdownEditor.vue';
import ImageUploadField from './ImageUploadField.vue';
import { encryptPayload } from '../lib/admin-crypto';
import { getCmsPassword } from '../lib/cms-auth';
import { markdownToHtml, htmlToMarkdown } from '../lib/markdown-utils';

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
}

interface ClickRecord {
  id: string;
  subscriber_id: string | null;
  clicked_at: string;
  email: string | null;
}

export default defineComponent({
  name: 'NewsletterComposeDrawer',
  components: { Button, Drawer, InputText, MultiSelect, Tag, ToggleSwitch, MarkdownEditor, ImageUploadField },
  props: {
    open: { type: Boolean, default: false },
    sendRecord: { type: Object as () => SendRecord | null, default: null },
  },
  emits: ['update:open', 'saved', 'deleted', 'sent', 'reauth'],
  setup(props, { emit }) {
    const toast = useToast();
    const expanded = ref(false);

    const visible = computed({
      get: () => props.open,
      set: (v: boolean) => emit('update:open', v),
    });

    const form = reactive({
      subject: '',
      coverImage: '',
      tags: [] as string[],
      excerptMd: '',
      bodyMd: '',
      status: 'draft',
    });

    const sendId = ref<string | null>(null);
    const editorKey = ref(0);
    const saving = ref(false);
    const sending = ref(false);
    const deleting = ref(false);
    const scheduleEnabled = ref(false);
    const scheduleDate = ref('');
    const scheduleTime = ref('09:00');

    const analytics = ref<{
      recipientCount: number;
      uniqueClicks: number;
      clickRate: string;
      clicks: ClickRecord[];
    } | null>(null);

    const isNew = computed(() => !sendId.value);
    const isSent = computed(() => form.status === 'sent' || form.status === 'sending');

    // Tag management
    const tagFilterValue = ref('');
    const availableTags = computed(() => {
      const set = new Set<string>(form.tags);
      return [...set].sort();
    });
    // deno-lint-ignore no-explicit-any
    const onTagFilter = (e: any) => {
      tagFilterValue.value = (e?.value ?? '').trim();
    };
    const addNewTag = (raw: string) => {
      const normalized = raw.trim().toLowerCase();
      if (normalized && !form.tags.includes(normalized)) {
        form.tags = [...form.tags, normalized];
      }
      tagFilterValue.value = '';
    };

    // Watch for sendRecord prop changes (opening to edit existing)
    watch(
      () => props.sendRecord,
      (rec) => {
        if (rec) {
          sendId.value = rec.id;
          form.subject = rec.subject;
          form.coverImage = rec.cover_image || '';
          form.tags = Array.isArray(rec.tags) ? [...rec.tags] : [];
          form.excerptMd = htmlToMarkdown(rec.excerpt_html || '');
          form.bodyMd = htmlToMarkdown(rec.body_html || '');
          form.status = rec.status;
          scheduleEnabled.value = rec.status === 'scheduled';
          if (rec.scheduled_at) {
            const d = new Date(rec.scheduled_at);
            scheduleDate.value = d.toISOString().slice(0, 10);
            scheduleTime.value = d.toISOString().slice(11, 16);
          }
          editorKey.value++;
          // Load analytics for sent broadcasts
          if (rec.status === 'sent') {
            loadAnalytics(rec.id);
          } else {
            analytics.value = null;
          }
        } else {
          resetForm();
        }
      },
      { immediate: true },
    );

    watch(
      () => props.open,
      (v) => {
        if (v && !props.sendRecord) {
          resetForm();
        }
      },
    );

    function resetForm() {
      sendId.value = null;
      form.subject = '';
      form.coverImage = '';
      form.tags = [];
      form.excerptMd = '';
      form.bodyMd = '';
      form.status = 'draft';
      scheduleEnabled.value = false;
      scheduleDate.value = '';
      scheduleTime.value = '09:00';
      analytics.value = null;
      editorKey.value++;
    }

    function close() {
      emit('update:open', false);
    }

    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';

    const REAUTH_SENTINEL = '__reauth__';

    async function adminInvoke(body: Record<string, unknown>) {
      const pw = getCmsPassword();
      const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
      if (!pw || !anonKey || !supabaseUrl) {
        emit('reauth');
        throw new Error(REAUTH_SENTINEL);
      }
      const token = await encryptPayload(JSON.stringify({ password: pw, ts: Date.now() }), anonKey);
      const res = await fetch(`${supabaseUrl}/functions/v1/newsletter-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          'x-admin-token': token,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return await res.json();
    }

    async function handleSave() {
      saving.value = true;
      try {
        const excerptHtml = markdownToHtml(form.excerptMd);
        const bodyHtml = markdownToHtml(form.bodyMd);

        if (sendId.value) {
          await adminInvoke({
            action: 'update-send',
            id: sendId.value,
            subject: form.subject,
            cover_image: form.coverImage,
            excerpt_html: excerptHtml,
            body_html: bodyHtml,
            tags: [...form.tags],
            status: 'draft',
            scheduled_at: null,
          });
        } else {
          const data = await adminInvoke({
            action: 'create-send',
            subject: form.subject,
            cover_image: form.coverImage,
            excerpt_html: excerptHtml,
            body_html: bodyHtml,
            tags: [...form.tags],
          });
          if (data?.send?.id) sendId.value = data.send.id;
        }

        form.status = 'draft';
        toast.add({ severity: 'success', summary: 'Draft saved', life: 2000 });
        emit('saved');
      } catch (err) {
        if (err instanceof Error && err.message === REAUTH_SENTINEL) return;
        console.error('Save error:', err);
        toast.add({ severity: 'error', summary: 'Save failed', detail: String(err), life: 3000 });
      } finally {
        saving.value = false;
      }
    }

    async function handleSchedule() {
      if (!scheduleDate.value) return;
      saving.value = true;
      try {
        const excerptHtml = markdownToHtml(form.excerptMd);
        const bodyHtml = markdownToHtml(form.bodyMd);
        const scheduledAt = new Date(
          `${scheduleDate.value}T${scheduleTime.value || '09:00'}`,
        ).toISOString();

        if (sendId.value) {
          await adminInvoke({
            action: 'update-send',
            id: sendId.value,
            subject: form.subject,
            cover_image: form.coverImage,
            excerpt_html: excerptHtml,
            body_html: bodyHtml,
            tags: [...form.tags],
            status: 'scheduled',
            scheduled_at: scheduledAt,
          });
        } else {
          const data = await adminInvoke({
            action: 'create-send',
            subject: form.subject,
            cover_image: form.coverImage,
            excerpt_html: excerptHtml,
            body_html: bodyHtml,
            tags: [...form.tags],
          });
          if (data?.send?.id) {
            sendId.value = data.send.id;
            await adminInvoke({
              action: 'update-send',
              id: data.send.id,
              tags: [...form.tags],
              status: 'scheduled',
              scheduled_at: scheduledAt,
            });
          }
        }

        form.status = 'scheduled';
        toast.add({
          severity: 'success',
          summary: 'Broadcast scheduled',
          detail: `Scheduled for ${scheduleDate.value} ${scheduleTime.value}`,
          life: 3000,
        });
        emit('saved');
      } catch (err) {
        if (err instanceof Error && err.message === REAUTH_SENTINEL) return;
        console.error('Schedule error:', err);
        toast.add({
          severity: 'error',
          summary: 'Schedule failed',
          detail: String(err),
          life: 3000,
        });
      } finally {
        saving.value = false;
      }
    }

    async function handleSendNow() {
      if (!confirm('Send this newsletter to all confirmed subscribers now?')) return;
      sending.value = true;
      try {
        // Save first
        const excerptHtml = markdownToHtml(form.excerptMd);
        const bodyHtml = markdownToHtml(form.bodyMd);

        if (sendId.value) {
          await adminInvoke({
            action: 'update-send',
            id: sendId.value,
            subject: form.subject,
            cover_image: form.coverImage,
            excerpt_html: excerptHtml,
            body_html: bodyHtml,
            tags: [...form.tags],
          });
        } else {
          const data = await adminInvoke({
            action: 'create-send',
            subject: form.subject,
            cover_image: form.coverImage,
            excerpt_html: excerptHtml,
            body_html: bodyHtml,
            tags: [...form.tags],
          });
          if (data?.send?.id) sendId.value = data.send.id;
        }

        if (!sendId.value) throw new Error('Failed to save send record');

        // Trigger the send
        const pw = getCmsPassword();
        const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
        if (!pw || !anonKey || !supabaseUrl) {
          emit('reauth');
          return;
        }
        const sendToken = await encryptPayload(
          JSON.stringify({ password: pw, ts: Date.now() }),
          anonKey,
        );
        const sendRes = await fetch(`${supabaseUrl}/functions/v1/newsletter-send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
            'x-admin-token': sendToken,
          },
          body: JSON.stringify({ sendId: sendId.value }),
        });
        if (!sendRes.ok) throw new Error((await sendRes.text()) || `HTTP ${sendRes.status}`);
        const data = await sendRes.json();

        form.status = 'sending';
        toast.add({
          severity: 'success',
          summary: 'Newsletter queued!',
          detail: `${data?.queued || 0} emails queued for delivery`,
          life: 4000,
        });
        emit('sent');
      } catch (err) {
        if (err instanceof Error && err.message === REAUTH_SENTINEL) return;
        console.error('Send error:', err);
        toast.add({ severity: 'error', summary: 'Send failed', detail: String(err), life: 3000 });
      } finally {
        sending.value = false;
      }
    }

    async function handleDelete() {
      if (!sendId.value) return;
      if (!confirm('Delete this broadcast?')) return;
      deleting.value = true;
      try {
        await adminInvoke({ action: 'delete-send', id: sendId.value });
        toast.add({ severity: 'success', summary: 'Broadcast deleted', life: 2000 });
        emit('deleted');
        close();
      } catch (err) {
        if (err instanceof Error && err.message === REAUTH_SENTINEL) return;
        console.error('Delete error:', err);
        toast.add({ severity: 'error', summary: 'Delete failed', life: 3000 });
      } finally {
        deleting.value = false;
      }
    }

    async function handleUpdate() {
      if (!sendId.value) return;
      saving.value = true;
      try {
        const excerptHtml = markdownToHtml(form.excerptMd);
        const bodyHtml = markdownToHtml(form.bodyMd);
        await adminInvoke({
          action: 'update-send',
          id: sendId.value,
          subject: form.subject,
          cover_image: form.coverImage,
          excerpt_html: excerptHtml,
          body_html: bodyHtml,
          tags: [...form.tags],
        });
        toast.add({ severity: 'success', summary: 'Broadcast updated', life: 2000 });
        emit('saved');
      } catch (err) {
        if (err instanceof Error && err.message === REAUTH_SENTINEL) return;
        console.error('Update error:', err);
        toast.add({ severity: 'error', summary: 'Update failed', detail: String(err), life: 3000 });
      } finally {
        saving.value = false;
      }
    }

    async function loadAnalytics(id: string) {
      try {
        const data = await adminInvoke({ action: 'get-send', id });
        if (data) {
          const recipientCount = data.send?.recipient_count || 0;
          const uniqueClicks = data.unique_clicks || 0;
          analytics.value = {
            recipientCount,
            uniqueClicks,
            clickRate:
              recipientCount > 0 ? ((uniqueClicks / recipientCount) * 100).toFixed(1) : '0.0',
            clicks: data.clicks || [],
          };
        }
      } catch (err) {
        if (err instanceof Error && err.message === REAUTH_SENTINEL) return;
        console.error('Analytics error:', err);
      }
    }

    function formatClickDate(d: string): string {
      return new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return {
      visible,
      expanded,
      form,
      isNew,
      isSent,
      editorKey,
      saving,
      sending,
      deleting,
      scheduleEnabled,
      scheduleDate,
      scheduleTime,
      analytics,
      tagFilterValue,
      availableTags,
      onTagFilter,
      addNewTag,
      close,
      handleSave,
      handleSchedule,
      handleSendNow,
      handleUpdate,
      handleDelete,
      formatClickDate,
    };
  },
});
</script>

<style scoped>
.cmsPrimary {
  border: 0 !important;
  background: var(--color-brand) !important;
  box-shadow: 0 16px 44px rgba(37, 99, 235, 0.22) !important;
}

/* PrimeVue Drawer surface (solid, readable) */
:deep(.p-drawer) {
  background: #ffffff !important;
  transition: width 200ms ease;
}
:deep(.p-drawer-header) {
  background: #ffffff !important;
  border-bottom: 1px solid rgba(11, 18, 32, 0.08);
}
:deep(.p-drawer-content) {
  background: #ffffff !important;
}

.cms-expand-toggle {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(11, 18, 32, 0.1);
  background: rgba(255, 255, 255, 0.7);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(11, 18, 32, 0.5);
  transition:
    background 140ms ease,
    color 140ms ease;
  flex-shrink: 0;
}
.cms-expand-toggle:hover {
  background: rgba(11, 18, 32, 0.06);
  color: rgba(11, 18, 32, 0.8);
}
</style>
