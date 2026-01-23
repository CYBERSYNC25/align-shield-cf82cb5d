-- Tabela para rastrear solicitações de exportação e exclusão LGPD
CREATE TABLE public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_url TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_data_export_requests_user_id ON public.data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON public.data_export_requests(status);
CREATE INDEX idx_data_export_requests_type ON public.data_export_requests(request_type);

-- Colunas para soft delete na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Índice para encontrar contas agendadas para exclusão
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled ON public.profiles(deletion_scheduled_for) 
WHERE deletion_scheduled_for IS NOT NULL;

-- Enable RLS
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

-- Policies para data_export_requests
CREATE POLICY "Users can view own export requests"
  ON public.data_export_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own export requests"
  ON public.data_export_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own export requests"
  ON public.data_export_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar bucket para exportações de dados (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('data-exports', 'data-exports', false, 104857600, ARRAY['application/json', 'application/zip'])
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket de exportações
CREATE POLICY "Users can view own exports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'data-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can insert exports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'data-exports');

CREATE POLICY "Users can delete own exports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'data-exports' AND auth.uid()::text = (storage.foldername(name))[1]);