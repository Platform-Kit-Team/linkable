import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

/**
 * Stripe Products edge function.
 *
 * POST /stripe-products
 * Body: { action: "list" | "push", ... }
 *
 * action=list:
 *   Returns all Stripe products with their prices.
 *   Query: { action: "list", limit?: number, starting_after?: string }
 *
 * action=push:
 *   Creates or updates a Stripe product + price from CMS data.
 *   Body: {
 *     action: "push",
 *     name: string,
 *     description?: string,
 *     images?: string[],
 *     price: number,
 *     currency?: string,
 *     product_type?: "physical" | "digital" | "subscription",
 *     recurring_interval?: string,
 *     recurring_interval_count?: number,
 *     billing_scheme?: string,
 *     usage_type?: string,
 *     tiers_mode?: string,
 *     shippable?: boolean,
 *     metadata?: Record<string, string>,
 *     stripe_product_id?: string,  // if updating existing
 *   }
 *   Returns: { stripe_product_id, stripe_price_id }
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.json();
    const { action } = body;

    if (action === "list") {
      return await handleList(stripe, body);
    } else if (action === "push") {
      return await handlePush(stripe, body);
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe-products] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

async function handleList(stripe: Stripe, body: any) {
  const limit = Math.min(body.limit || 100, 100);
  const params: any = { limit, expand: ["data.default_price"] };
  if (body.starting_after) params.starting_after = body.starting_after;

  const products = await stripe.products.list(params);

  // For each product, also fetch all prices
  const results = await Promise.all(
    products.data.map(async (product: any) => {
      const prices = await stripe.prices.list({ product: product.id, limit: 100 });
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        active: product.active,
        metadata: product.metadata,
        shippable: product.shippable,
        default_price: product.default_price,
        prices: prices.data.map((p: any) => ({
          id: p.id,
          unit_amount: p.unit_amount,
          currency: p.currency,
          type: p.type,
          recurring: p.recurring,
          billing_scheme: p.billing_scheme,
          tiers_mode: p.tiers_mode,
          active: p.active,
        })),
      };
    }),
  );

  return new Response(
    JSON.stringify({ products: results, has_more: products.has_more }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function handlePush(stripe: Stripe, body: any) {
  const {
    name,
    description,
    images,
    price,
    currency = "usd",
    product_type,
    recurring_interval,
    recurring_interval_count,
    billing_scheme,
    usage_type,
    shippable,
    metadata,
    stripe_product_id,
  } = body;

  if (!name) {
    return new Response(
      JSON.stringify({ error: "Product name is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Create or update the product
  let productId = stripe_product_id;

  const productData: any = {
    name,
    ...(description ? { description } : {}),
    ...(images?.length ? { images: images.slice(0, 8) } : {}),
    ...(metadata ? { metadata } : {}),
  };

  if (product_type === "physical" && shippable !== undefined) {
    productData.shippable = shippable;
  }

  if (productId) {
    // Update existing product
    await stripe.products.update(productId, productData);
  } else {
    // Create new product
    const product = await stripe.products.create(productData);
    productId = product.id;
  }

  // Create a new price (Stripe prices are immutable — always create new)
  const unitAmount = Math.round(Number(price) * 100); // Convert to cents
  if (isNaN(unitAmount) || unitAmount < 0) {
    return new Response(
      JSON.stringify({ error: "Invalid price value", stripe_product_id: productId }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const priceData: any = {
    product: productId,
    currency: currency.toLowerCase(),
    unit_amount: unitAmount,
  };

  if (product_type === "subscription") {
    priceData.recurring = {
      interval: recurring_interval || "month",
      ...(recurring_interval_count && recurring_interval_count > 1
        ? { interval_count: recurring_interval_count }
        : {}),
      ...(usage_type === "metered" ? { usage_type: "metered" } : {}),
    };

    if (billing_scheme === "tiered") {
      priceData.billing_scheme = "tiered";
      // For tiered pricing, Stripe requires tiers — we create a simple flat tier as default
      // Users should configure proper tiers in the Stripe Dashboard
      priceData.tiers_mode = body.tiers_mode || "graduated";
      priceData.tiers = [
        { up_to: "inf", unit_amount: unitAmount },
      ];
      delete priceData.unit_amount; // Can't have unit_amount with tiered
    }
  }

  const stripePrice = await stripe.prices.create(priceData);

  // Set as default price on the product
  await stripe.products.update(productId, {
    default_price: stripePrice.id,
  });

  return new Response(
    JSON.stringify({
      stripe_product_id: productId,
      stripe_price_id: stripePrice.id,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
