import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { processEmailQueue } from "../_shared/queue-worker.ts";

/**
 * Newsletter cron function.
 * 1. Enqueues any scheduled sends whose scheduled_at <= now()
 * 2. Processes the email queue (sends emails in batches)
 *
 * Called periodically via Supabase cron or an external scheduler.
 * POST /newsletter-cron
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

    // ── Step 1: Enqueue scheduled sends that are due ─────────────────
    const { data: dueSends } = await supabase
      .from("newsletter_sends")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString());

    const enqueued: Array<{ sendId: string; queued: number }> = [];

    if (dueSends?.length) {
      for (const send of dueSends) {
        try {
          // Atomically mark as sending (prevents duplicate processing)
          const { data: updated } = await supabase
            .from("newsletter_sends")
            .update({ status: "sending" })
            .eq("id", send.id)
            .eq("status", "scheduled")
            .select("id")
            .single();

          if (!updated) continue; // Another instance got it first

          const { data: count } = await supabase.rpc(
            "newsletter_enqueue_send",
            { p_send_id: send.id },
          );

          enqueued.push({ sendId: send.id, queued: count || 0 });
        } catch (err) {
          console.error(`Failed to enqueue send ${send.id}:`, err);
          // Revert to scheduled so it can be retried next run
          await supabase
            .from("newsletter_sends")
            .update({ status: "scheduled" })
            .eq("id", send.id);
        }
      }
    }

    // ── Step 2: Process the email queue ──────────────────────────────
    const queueResult = await processEmailQueue(supabase);

    return new Response(
      JSON.stringify({
        enqueued,
        ...queueResult,
      }),
      { headers },
    );
  } catch (err) {
    console.error("newsletter-cron error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers },
    );
  }
});
