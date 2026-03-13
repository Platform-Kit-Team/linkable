<template>
  <div>
    <!-- Header: title + actions -->
    <div class="cms__panel-head cms__panel-head--row" style="margin-bottom: 8px">
      <div>
        <div class="cms__sub">
          Manage products. {{ stripeAvailable ? 'Stripe sync is available.' : 'Connect to Lovable Cloud for Stripe sync.' }}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="stripeAvailable && importEnabled"
          rounded
          severity="secondary"
          class="!px-3 !py-1.5 !text-xs"
          @click="importDialogOpen = true"
        >
          <i class="pi pi-download mr-1" />
          Import from Stripe
        </Button>
        <Button rounded class="cms__primary cms__primary--addon" @click="openNew">
          <i class="pi pi-plus mr-1" />
          <span class="cms__btn-label">New product</span>
          <span class="cms__btn-label--compact">New</span>
        </Button>
      </div>
    </div>

    <div class="cms__card">
      <div v-if="items.length === 0" class="cms__empty">
        <div class="cms__empty-title">No products yet</div>
        <div class="cms__empty-sub">Click "New product" to create one{{ stripeAvailable && importEnabled ? ', or import from Stripe' : '' }}.</div>
      </div>

      <div v-else class="cms__list">
        <button
          v-for="item in items"
          :key="item.slug || item.name"
          type="button"
          class="cms__row"
          style="grid-template-columns: 44px 1fr auto auto;"
          @click="openExisting(String(item.slug || item.name))"
        >
          <span v-if="getThumb(item)" class="cms__row-thumb">
            <img :src="getThumb(item)" class="h-8 w-8 rounded object-cover" />
          </span>
          <span v-else class="cms__row-thumb">
            <i class="pi pi-shopping-cart text-[color:var(--color-ink-soft)]" />
          </span>
          <span class="cms__row-text">
            <span class="cms__row-title">{{ getLabel(item) }}</span>
            <span class="cms__row-sub">
              {{ formatPrice(item) }}
              <template v-if="item.product_type === 'subscription'"> · {{ item.recurring_interval || 'monthly' }}</template>
              <template v-if="item.stripe_price_id"> · <i class="pi pi-check text-green-500" /> Stripe</template>
            </span>
          </span>
          <span
            v-if="stripeAvailable && pushEnabled"
            class="cms__row-meta"
            @click.stop="openPushDialog(item)"
            :title="item.stripe_product_id ? 'Update in Stripe' : 'Push to Stripe'"
          >
            <i class="pi pi-upload" :class="item.stripe_product_id ? 'text-green-500' : ''" />
          </span>
          <span class="cms__row-meta">
            <i class="pi pi-angle-right text-[color:var(--color-ink-soft)]" />
          </span>
        </button>
      </div>
    </div>

    <!-- Item editor drawer -->
    <CollectionItemDrawer
      v-if="drawerOpen && drawerItem && itemSchema"
      :open="drawerOpen"
      :schema="itemSchema"
      :schemaKey="drawerSlug"
      :modelValue="drawerItem"
      :title="drawerSlug ? 'Edit Product' : 'New Product'"
      :manualSave="true"
      @update:open="drawerOpen = $event"
      @save="onDrawerSave"
      @delete="onDelete"
    >
      <template #before-form>
        <!-- Stripe price context info -->
        <div v-if="drawerItem?.stripe_price_id" class="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          <div class="font-semibold flex items-center gap-1"><i class="pi pi-check-circle" /> Synced to Stripe</div>
          <div class="mt-0.5 text-green-700">Price ID: <code class="font-mono">{{ drawerItem.stripe_price_id }}</code></div>
          <div class="mt-0.5 text-green-600">Changing the price will create a new Stripe price on next push.</div>
        </div>
      </template>
      <template #after-actions>
        <Button
          v-if="stripeAvailable && pushEnabled && drawerSlug"
          text
          rounded
          severity="info"
          size="small"
          @click="openPushDialog(drawerItem!)"
        >
          <i class="pi pi-upload mr-1" />
          {{ drawerItem?.stripe_product_id ? 'Update in Stripe' : 'Push to Stripe' }}
        </Button>
      </template>
    </CollectionItemDrawer>

    <!-- Push to Stripe confirmation dialog -->
    <PrimeDialog
      v-model:visible="pushDialogOpen"
      modal
      :closable="true"
      :dismissableMask="true"
      header="Sync to Stripe"
      :style="{ width: 'min(440px, 92vw)' }"
    >
      <div class="space-y-3">
        <p class="text-sm text-[color:var(--color-ink-soft)]">
          Push <strong>{{ pushProductName }}</strong> to Stripe?
          This will {{ pushProductStripeId ? 'update the existing product' : 'create a new product' }} and generate a new price in Stripe.
        </p>
        <div v-if="pushError" class="text-red-500 text-sm">{{ pushError }}</div>
        <div class="flex justify-end gap-2 pt-2">
          <Button severity="secondary" size="small" text @click="pushDialogOpen = false">Skip</Button>
          <Button size="small" :loading="pushLoading" @click="doPush">
            <i class="pi pi-upload mr-1" />
            {{ pushProductStripeId ? 'Update in Stripe' : 'Create in Stripe' }}
          </Button>
        </div>
      </div>
    </PrimeDialog>

    <!-- Import from Stripe dialog -->
    <PrimeDialog
      v-model:visible="importDialogOpen"
      modal
      :closable="true"
      :dismissableMask="true"
      header="Import from Stripe"
      :style="{ width: 'min(640px, 96vw)' }"
    >
      <div class="space-y-4">
        <div v-if="importLoading" class="text-center py-8 text-[color:var(--color-ink-soft)]">
          <i class="pi pi-spinner pi-spin mr-2" /> Loading Stripe products…
        </div>
        <div v-else-if="importError" class="text-red-500 text-sm py-4">{{ importError }}</div>
        <template v-else>
          <div v-if="stripeProducts.length === 0" class="text-center py-8 text-[color:var(--color-ink-soft)]">
            No products found in your Stripe account.
          </div>
          <div v-else class="max-h-[400px] overflow-y-auto space-y-2">
            <label
              v-for="sp in stripeProducts"
              :key="sp.id"
              class="flex items-center gap-3 rounded-xl border border-black/5 bg-white/80 px-3 py-2.5 cursor-pointer hover:border-[var(--color-brand)]/30 transition"
              :class="{ 'border-[var(--color-brand)] bg-blue-50/30': selectedImports.has(sp.id) }"
            >
              <input
                type="checkbox"
                :checked="selectedImports.has(sp.id)"
                @change="toggleImport(sp.id)"
                class="accent-[var(--color-brand)]"
              />
              <img
                v-if="sp.images?.[0]"
                :src="sp.images[0]"
                class="h-10 w-10 rounded object-cover"
              />
              <div v-else class="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center">
                <i class="pi pi-shopping-cart text-zinc-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm text-[color:var(--color-ink)] truncate">{{ sp.name }}</div>
                <div class="text-xs text-[color:var(--color-ink-soft)]">
                  {{ sp.id }}
                  <template v-if="sp.prices?.[0]">
                    · {{ formatStripePriceAmount(sp.prices[0]) }}
                    <template v-if="sp.prices[0].recurring"> / {{ sp.prices[0].recurring.interval }}</template>
                  </template>
                </div>
              </div>
              <span v-if="alreadyImported(sp.id)" class="text-xs text-green-600 font-medium">Already imported</span>
            </label>
          </div>
          <div class="flex justify-between items-center pt-2">
            <span class="text-xs text-[color:var(--color-ink-soft)]">{{ selectedImports.size }} selected</span>
            <div class="flex gap-2">
              <Button severity="secondary" size="small" text @click="importDialogOpen = false">Cancel</Button>
              <Button size="small" :disabled="selectedImports.size === 0" :loading="importSaving" @click="doImport">
                <i class="pi pi-download mr-1" />
                Import Selected
              </Button>
            </div>
          </div>
        </template>
      </div>
    </PrimeDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, type PropType } from "vue";
import Button from "primevue/button";
import PrimeDialog from "primevue/dialog";
import { useToast } from "primevue/usetoast";
import CollectionItemDrawer from "@/admin/CollectionItemDrawer.vue";
import type { ContentSchema } from "@/lib/layout-manifest";
import type { ContentCollection } from "@/lib/model";
import {
  fetchCollectionItems,
  fetchCollectionItem,
  saveCollectionItem,
  deleteCollectionItem,
} from "@/lib/collections";
import { hasBackendConfig, getBackendBaseUrl, getBackendApiKey } from "@/lib/cloud-env";
import type { FormKitSchemaNode } from "@formkit/core";

export default defineComponent({
  name: "ProductCollectionEditor",
  components: { Button, PrimeDialog, CollectionItemDrawer },
  props: {
    schema: { type: Object as PropType<ContentSchema>, required: true },
    collection: { type: Object as PropType<ContentCollection>, required: true },
  },
  setup(props) {
    const toast = useToast();
    const items = ref<Record<string, unknown>[]>([]);
    const drawerOpen = ref(false);
    const drawerItem = ref<Record<string, unknown> | null>(null);
    const drawerSlug = ref("");

    // ENV feature flags
    const env = (import.meta as any).env ?? {};
    const pushEnabled = env.VITE_STRIPE_PUSH_ENABLED !== "false";
    const importEnabled = env.VITE_STRIPE_IMPORT_ENABLED !== "false";
    const stripeAvailable = hasBackendConfig();

    const itemSchema = computed<FormKitSchemaNode[] | undefined>(() => {
      const s = props.schema.itemSchema;
      if (!s) return undefined;
      if (typeof s === "function") return s(drawerItem.value ?? {});
      return s;
    });

    const getLabel = (item: Record<string, unknown>): string =>
      (item.name as string) || (item.title as string) || "Untitled";

    const getThumb = (item: Record<string, unknown>): string | undefined => {
      if (item.image) return item.image as string;
      const images = item.images as any[];
      if (Array.isArray(images) && images.length > 0) {
        return images[0]?.image || images[0];
      }
      return undefined;
    };

    const formatPrice = (item: Record<string, unknown>): string => {
      const price = Number(item.price);
      if (isNaN(price)) return "";
      const currency = (item.currency as string) || "usd";
      try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(price);
      } catch {
        return `$${price.toFixed(2)}`;
      }
    };

    const slugify = (text: string): string =>
      text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "untitled";

    const refresh = async () => {
      try {
        items.value = await fetchCollectionItems(props.schema.key);
      } catch {
        items.value = [];
      }
    };

    const openNew = () => {
      drawerItem.value = props.schema.newItem?.() ?? {};
      drawerSlug.value = "";
      drawerOpen.value = true;
    };

    const openExisting = async (slug: string) => {
      try {
        const item = await fetchCollectionItem(props.schema.key, slug);
        if (!item) {
          toast.add({ severity: "error", summary: "Error", detail: "Product not found.", life: 2600 });
          return;
        }
        drawerItem.value = item;
        drawerSlug.value = slug;
        drawerOpen.value = true;
      } catch {
        toast.add({ severity: "error", summary: "Error", detail: "Could not load product.", life: 2600 });
      }
    };

    // ── Push to Stripe ─────────────────────────────────────────────
    const pushDialogOpen = ref(false);
    const pushLoading = ref(false);
    const pushError = ref("");
    const pushProductName = ref("");
    const pushProductStripeId = ref("");
    const pendingPushItem = ref<Record<string, unknown> | null>(null);
    const pendingPushSlug = ref("");

    const openPushDialog = (item: Record<string, unknown>) => {
      const slug = String(item.slug || item.name || "");
      pendingPushItem.value = { ...item };
      pendingPushSlug.value = slug;
      pushProductName.value = getLabel(item);
      pushProductStripeId.value = (item.stripe_product_id as string) || "";
      pushError.value = "";
      pushDialogOpen.value = true;
    };

    const onDrawerSave = async (value: Record<string, unknown>) => {
      drawerItem.value = value;

      const slugField = "name";
      let slugValue = String(value[slugField] || "");
      if (!slugValue.trim()) slugValue = `product-${Date.now()}`;
      const slug = drawerSlug.value || slugify(slugValue);

      try {
        await saveCollectionItem(props.schema.key, slug, value);
        if (!drawerSlug.value) drawerSlug.value = slug;
        await refresh();
        toast.add({ severity: "success", summary: "Saved", detail: "Product saved.", life: 2000 });
      } catch (e: any) {
        toast.add({ severity: "error", summary: "Save failed", detail: e?.message, life: 3000 });
      }
    };

    const doPush = async () => {
      if (!pendingPushItem.value) return;
      pushLoading.value = true;
      pushError.value = "";

      try {
        const item = pendingPushItem.value;
        const baseUrl = getBackendBaseUrl();
        const apiKey = getBackendApiKey();

        const images: string[] = [];
        if (Array.isArray(item.images)) {
          for (const img of item.images) {
            const url = typeof img === "string" ? img : (img as any)?.image;
            if (url) images.push(url);
          }
        }

        const res = await fetch(`${baseUrl}/functions/v1/stripe-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({
            action: "push",
            name: item.name || item.title,
            description: item.description,
            images,
            price: Number(item.price) || 0,
            currency: item.currency || "usd",
            product_type: item.product_type,
            recurring_interval: item.recurring_interval,
            recurring_interval_count: Number(item.recurring_interval_count) || 1,
            billing_scheme: item.billing_scheme,
            usage_type: item.usage_type,
            tiers_mode: item.tiers_mode,
            shippable: item.shippable,
            metadata: item.metadata,
            stripe_product_id: item.stripe_product_id || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any).error || `Push failed: ${res.status}`);
        }

        const data = await res.json();

        // Write back the Stripe IDs to the CMS item
        const updated = {
          ...item,
          stripe_product_id: data.stripe_product_id,
          stripe_price_id: data.stripe_price_id,
        };

        await saveCollectionItem(props.schema.key, pendingPushSlug.value, updated);
        if (drawerItem.value) {
          drawerItem.value = updated;
        }
        await refresh();

        pushDialogOpen.value = false;
        toast.add({ severity: "success", summary: "Synced to Stripe", detail: `Product ID: ${data.stripe_product_id}`, life: 3000 });
      } catch (e: any) {
        pushError.value = e?.message || "Failed to push to Stripe";
      } finally {
        pushLoading.value = false;
      }
    };

    // ── Import from Stripe ─────────────────────────────────────────
    const importDialogOpen = ref(false);
    const importLoading = ref(false);
    const importError = ref("");
    const importSaving = ref(false);
    const stripeProducts = ref<any[]>([]);
    const selectedImports = ref<Set<string>>(new Set());

    watch(importDialogOpen, (open) => {
      if (open) loadStripeProducts();
    });

    const loadStripeProducts = async () => {
      importLoading.value = true;
      importError.value = "";
      stripeProducts.value = [];
      selectedImports.value = new Set();

      try {
        const baseUrl = getBackendBaseUrl();
        const apiKey = getBackendApiKey();

        const res = await fetch(`${baseUrl}/functions/v1/stripe-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({ action: "list", limit: 100 }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any).error || `Failed to load: ${res.status}`);
        }

        const data = await res.json();
        stripeProducts.value = (data.products || []).filter((p: any) => p.active);
      } catch (e: any) {
        importError.value = e?.message || "Failed to load Stripe products";
      } finally {
        importLoading.value = false;
      }
    };

    const alreadyImported = (stripeProductId: string): boolean =>
      items.value.some((i) => i.stripe_product_id === stripeProductId);

    const toggleImport = (id: string) => {
      const s = new Set(selectedImports.value);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      selectedImports.value = s;
    };

    const formatStripePriceAmount = (price: any): string => {
      if (!price?.unit_amount && price?.unit_amount !== 0) return "";
      const amount = price.unit_amount / 100;
      const currency = price.currency || "usd";
      try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);
      } catch {
        return `$${amount.toFixed(2)}`;
      }
    };

    const doImport = async () => {
      importSaving.value = true;
      let imported = 0;

      try {
        for (const sp of stripeProducts.value) {
          if (!selectedImports.value.has(sp.id)) continue;

          const defaultPrice = sp.prices?.[0];
          const isSubscription = defaultPrice?.recurring;
          const priceAmount = defaultPrice?.unit_amount ? defaultPrice.unit_amount / 100 : 0;

          const newItem: Record<string, unknown> = {
            ...(props.schema.newItem?.() ?? {}),
            name: sp.name,
            description: sp.description || "",
            price: priceAmount,
            currency: defaultPrice?.currency || "usd",
            product_type: isSubscription ? "subscription" : "physical",
            stripe_product_id: sp.id,
            stripe_price_id: defaultPrice?.id || "",
            shippable: sp.shippable ?? false,
            images: (sp.images || []).map((url: string) => ({ image: url })),
          };

          if (isSubscription) {
            newItem.recurring_interval = defaultPrice.recurring?.interval || "month";
            newItem.recurring_interval_count = defaultPrice.recurring?.interval_count || 1;
            if (defaultPrice.billing_scheme) newItem.billing_scheme = defaultPrice.billing_scheme;
            if (defaultPrice.tiers_mode) newItem.tiers_mode = defaultPrice.tiers_mode;
          }

          const slug = slugify(sp.name || `stripe-${sp.id}`);
          await saveCollectionItem(props.schema.key, slug, newItem);
          imported++;
        }

        await refresh();
        importDialogOpen.value = false;
        toast.add({
          severity: "success",
          summary: "Imported",
          detail: `${imported} product${imported !== 1 ? "s" : ""} imported from Stripe.`,
          life: 3000,
        });
      } catch (e: any) {
        importError.value = e?.message || "Import failed";
      } finally {
        importSaving.value = false;
      }
    };

    const onDelete = async () => {
      if (!drawerSlug.value) {
        drawerOpen.value = false;
        return;
      }
      try {
        await deleteCollectionItem(props.schema.key, drawerSlug.value);
        drawerOpen.value = false;
        await refresh();
        toast.add({ severity: "success", summary: "Deleted", detail: "Product removed.", life: 2000 });
      } catch (e: any) {
        toast.add({ severity: "error", summary: "Delete failed", detail: e?.message, life: 3000 });
      }
    };

    onMounted(() => refresh());

    return {
      items,
      drawerOpen,
      drawerItem,
      drawerSlug,
      itemSchema,
      getLabel,
      getThumb,
      formatPrice,
      openNew,
      openExisting,
      onDrawerSave,
      onDelete,
      // Stripe features
      stripeAvailable,
      pushEnabled,
      importEnabled,
      // Push
      pushDialogOpen,
      pushLoading,
      pushError,
      pushProductName,
      pushProductStripeId,
      doPush,
      openPushDialog,
      // Import
      importDialogOpen,
      importLoading,
      importError,
      importSaving,
      stripeProducts,
      selectedImports,
      toggleImport,
      alreadyImported,
      formatStripePriceAmount,
      doImport,
    };
  },
});
</script>
