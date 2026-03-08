<template>
  <div>
    <!-- Subscriber stats -->
    <div class="cms__card" style="margin-bottom: 10px">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-extrabold text-[color:var(--color-ink)]">Subscribers</span>
        <Button text rounded size="small" :loading="subscribersLoading" @click="loadSubscribers">
          <i class="pi pi-refresh" />
        </Button>
      </div>
      <div class="flex gap-3 text-xs font-semibold text-[color:var(--color-ink-soft)]">
        <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-green-500" /> {{ counts.confirmed }} confirmed</span>
        <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-yellow-500" /> {{ counts.pending }} pending</span>
        <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-gray-400" /> {{ counts.unsubscribed }} unsubbed</span>
      </div>

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
          <Button text rounded severity="danger" size="small" class="!p-1" @click="deleteSubscriber(sub.id)">
            <i class="pi pi-trash text-[10px]" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Broadcasts -->
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
      <div v-else-if="sends.length === 0" class="text-xs text-[color:var(--color-ink-soft)] text-center py-4">No broadcasts yet. Create your first one!</div>
      <div v-else class="max-h-[300px] overflow-y-auto space-y-1.5">
        <button
          v-for="send in sends"
          :key="send.id"
          type="button"
          class="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--glass)] transition-colors"
          @click="openComposeEdit(send)"
        >
          <div class="min-w-0 flex-1">
            <div class="text-xs font-bold text-[color:var(--color-ink)] truncate">{{ send.subject || '(no subject)' }}</div>
            <div class="text-[10px] text-[color:var(--color-ink-soft)] mt-0.5">
              <template v-if="send.status === 'sent'">
                Sent {{ formatDate(send.sent_at) }} · {{ send.recipient_count }} recipients · {{ send.click_count || 0 }} clicks
              </template>
              <template v-else-if="send.status === 'scheduled'">
                Scheduled for {{ formatDate(send.scheduled_at) }}
              </template>
              <template v-else-if="send.status === 'sending'">Sending…</template>
              <template v-else>Draft · Updated {{ formatDate(send.updated_at) }}</template>
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

    <NewsletterComposeDrawer
      v-model:open="composeOpen"
      :sendRecord="composeRecord"
      @saved="loadSends"
      @deleted="composeOpen = false; loadSends()"
      @sent="loadSends"
      @reauth="$emit('reauth')"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, type PropType } from "vue";
import Button from "primevue/button";
import Tag from "primevue/tag";
import NewsletterComposeDrawer from "../NewsletterComposeDrawer.vue";
import { encryptPayload } from "../../lib/admin-crypto";
import { getCmsPassword } from "../../lib/cms-auth";
import type { ContentCollection } from "../../lib/model";

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

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

export default defineComponent({
  name: "NewsletterCollectionEditor",
  components: { Button, Tag, NewsletterComposeDrawer },
  props: {
    collection: { type: Object as PropType<ContentCollection>, required: true },
  },
  emits: ["reauth"],
  setup(_, { emit }) {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
    const subscribers = ref<Subscriber[]>([]);
    const subscribersLoading = ref(false);
    const subscribersError = ref("");
    const sends = ref<SendRecord[]>([]);
    const sendsLoading = ref(false);
    const composeOpen = ref(false);
    const composeRecord = ref<SendRecord | null>(null);

    const counts = computed(() => {
      const confirmed = subscribers.value.filter((s) => s.confirmed_at && !s.unsubscribed_at).length;
      const pending = subscribers.value.filter((s) => !s.confirmed_at && !s.unsubscribed_at).length;
      const unsubscribed = subscribers.value.filter((s) => s.unsubscribed_at).length;
      return { confirmed, pending, unsubscribed, total: subscribers.value.length };
    });

    async function invokeAdmin(body: Record<string, unknown>) {
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
        if (error) { subscribersError.value = error; return; }
        if (data?.subscribers) subscribers.value = data.subscribers as Subscriber[];
      } catch (e) {
        subscribersError.value = String(e);
      } finally {
        subscribersLoading.value = false;
      }
    }

    async function deleteSubscriber(id: string) {
      const { error } = await invokeAdmin({ action: "delete", id });
      if (!error) subscribers.value = subscribers.value.filter((s) => s.id !== id);
    }

    async function loadSends() {
      sendsLoading.value = true;
      try {
        const { data, error } = await invokeAdmin({ action: "list-sends" });
        if (!error && data?.sends) sends.value = data.sends as SendRecord[];
      } catch (e) {
        console.error("[newsletter] loadSends error:", e);
      } finally {
        sendsLoading.value = false;
      }
    }

    function openComposeNew() { composeRecord.value = null; composeOpen.value = true; }
    function openComposeEdit(send: SendRecord) { composeRecord.value = send; composeOpen.value = true; }

    function formatDate(d: string | null): string {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      });
    }

    onMounted(() => {
      loadSubscribers();
      loadSends();
    });

    return {
      subscribers, subscribersLoading, subscribersError, counts,
      loadSubscribers, deleteSubscriber,
      sends, sendsLoading, composeOpen, composeRecord,
      loadSends, openComposeNew, openComposeEdit, formatDate,
    };
  },
});
</script>
