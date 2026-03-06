-- Enable pg_cron and pg_net extensions for scheduled edge function invocation
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Vault secrets (project_url, anon_key, cron_secret) are pushed from .env
-- by the deploy script (cli.mjs) or the local sync (sync-vault-local.mjs).
-- They do NOT need to exist when this migration runs — the cron job's
-- SQL query reads them at fire time.

-- Schedule newsletter-cron to run every 5 minutes
select cron.schedule(
  'newsletter-cron-job',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
              || '/functions/v1/newsletter-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
    ),
    body   := '{}'::jsonb
  ) as request_id;
  $$
);
