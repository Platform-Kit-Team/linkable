CREATE TABLE public.cms_data (
  id text PRIMARY KEY DEFAULT 'site',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cms_data" ON public.cms_data
  FOR SELECT USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-uploads', 'cms-uploads', true);

CREATE POLICY "Public read cms-uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'cms-uploads');

CREATE POLICY "Service role upload cms-uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cms-uploads');