import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Stripe Checkout edge function.
 *
 * POST /stripe-checkout
 * Body: {
 *   line_items: Array<{ stripe_price_id: string; quantity: number }>,
 *   mode?: "payment" | "subscription",
 *   success_url?: string,
 *   cancel_url?: string,
 *   customer_email?: string,
 *   metadata?: Record<string, string>,
 *   shipping_address_collection?: { allowed_countries: string[] },
 *   allow_promotion_codes?: boolean,
 * }
 *
 * Returns: { url: string } — the Stripe Checkout Session URL to redirect to.
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

    const {
      line_items,
      mode = "payment",
      success_url,
      cancel_url,
      customer_email,
      metadata,
      shipping_address_collection,
      allow_promotion_codes,
    } = body;

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return new Response(
        JSON.stringify({ error: "line_items is required and must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate all items have stripe_price_id
    for (const item of line_items) {
      if (!item.stripe_price_id) {
        return new Response(
          JSON.stringify({ error: "Each line_item must have a stripe_price_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Build Stripe line_items from our product data
    const stripeLineItems = line_items.map((item: any) => ({
      price: item.stripe_price_id,
      quantity: item.quantity || 1,
    }));

    // Determine if any items are subscriptions — auto-detect mode
    // If caller specified mode, use it; otherwise infer from prices
    const sessionMode = mode === "subscription" ? "subscription" : "payment";

    // Look up or create customer by email
    let customerId: string | undefined;
    if (customer_email) {
      const customers = await stripe.customers.list({ email: customer_email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: stripeLineItems,
      mode: sessionMode,
      success_url: success_url || `${origin}/confirmed?status=purchase-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${origin}/shop`,
      ...(customerId ? { customer: customerId } : customer_email ? { customer_email } : {}),
      ...(metadata ? { metadata } : {}),
      ...(shipping_address_collection ? { shipping_address_collection } : {}),
      ...(allow_promotion_codes ? { allow_promotion_codes: true } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe-checkout] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
