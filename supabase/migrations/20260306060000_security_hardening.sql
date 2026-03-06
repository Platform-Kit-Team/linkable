-- ────────────────────────────────────────────────────────────────────
-- Security hardening migration
-- 1. Update pg_cron job to send cron_secret header (keeps anon key for JWT auth)
-- 2. Revoke public EXECUTE on security-definer RPC functions
--
-- NOTE: The cron_secret Vault entry is created by the deploy script
-- (cli.mjs / sync-vault-local.mjs) from the CRON_SECRET env var.
-- The cron job query reads it at fire time, so it doesn't need to
-- exist when this migration runs.
-- ────────────────────────────────────────────────────────────────────

-- ── 1. Update cron job to pass cron_secret as a custom header ──────
select cron.unschedule('newsletter-cron-job');

select cron.schedule(
  'newsletter-cron-job',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
              || '/functions/v1/newsletter-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body   := '{}'::jsonb
  ) as request_id;
  $$
);

-- ── 2. Restrict security-definer RPC functions ─────────────────────
-- These functions wrap pgmq operations and should only be callable
-- from edge functions running with the service_role key.
revoke execute on function public.newsletter_enqueue_send(uuid) from anon, authenticated;
revoke execute on function public.newsletter_queue_read(integer, integer) from anon, authenticated;
revoke execute on function public.newsletter_queue_delete(bigint) from anon, authenticated;
revoke execute on function public.newsletter_queue_archive(bigint) from anon, authenticated;
revoke execute on function public.newsletter_finalize_send(uuid) from anon, authenticated;
