
-- Drop the incorrectly-created analytics_events table
DROP TABLE IF EXISTS public.analytics_events CASCADE;

-- Recreate with the correct original schema (bigint id, CHECK constraint, country column)
CREATE TABLE public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('pageview', 'click')),
  page text not null default '/',
  referrer text,
  visitor_id text,
  user_agent text,
  country text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for common queries
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at);
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events (event_type, created_at);
CREATE INDEX idx_analytics_events_visitor ON public.analytics_events (visitor_id, created_at);

-- Enable Row-Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public tracking from the frontend)
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events
  FOR insert
  TO anon
  WITH CHECK (true);

-- Only authenticated (admin) can read analytics
CREATE POLICY "Authenticated users can read analytics"
  ON public.analytics_events
  FOR select
  TO authenticated
  USING (true);

-- Service role full read access
CREATE POLICY "Service role can read all events"
  ON public.analytics_events
  FOR select
  TO service_role
  USING (true);
