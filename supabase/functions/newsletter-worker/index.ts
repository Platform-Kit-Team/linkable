import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { processEmailQueue } from "../_shared/queue-worker.ts";

/**
 * Newsletter queue worker.
 * Reads messages from the pgmq newsletter_emails queue, sends emails,
 * updates delivery tracking, and finalizes completed sends.
 *
 * Called periodically by cron or on-demand.
 * POST /newsletter-worker
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  // Only allow calls that carry the dedicated cron secret
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers },
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const result = await processEmailQueue(supabase);

    return new Response(JSON.stringify(result), { headers });
  } catch (err) {
    console.error("newsletter-worker error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers },
    );
  }
});
