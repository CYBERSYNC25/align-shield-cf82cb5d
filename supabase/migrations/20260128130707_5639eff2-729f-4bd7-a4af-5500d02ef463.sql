-- Tabela para tracking de uploads e quotas de arquivos
CREATE TABLE public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- File identification
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL,
  
  -- Validation metadata
  mime_type TEXT NOT NULL,
  detected_type TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  
  -- Security flags
  exif_stripped BOOLEAN DEFAULT false,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_bucket CHECK (bucket IN ('evidence', 'documents', 'data-exports')),
  CONSTRAINT valid_size CHECK (size_bytes > 0 AND size_bytes <= 26214400)
);

-- Índices para quotas
CREATE INDEX idx_file_uploads_user_date ON public.file_uploads(user_id, created_at);
CREATE INDEX idx_file_uploads_org ON public.file_uploads(org_id);
CREATE INDEX idx_file_uploads_hash ON public.file_uploads(file_hash);

-- RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own uploads"
  ON public.file_uploads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own uploads"
  ON public.file_uploads FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Verificar quota diária do usuário (100MB/dia)
CREATE OR REPLACE FUNCTION public.check_user_daily_quota(_user_id UUID)
RETURNS TABLE(used_bytes BIGINT, limit_bytes BIGINT, remaining_bytes BIGINT, can_upload BOOLEAN)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH daily_usage AS (
    SELECT COALESCE(SUM(size_bytes), 0)::BIGINT as used
    FROM file_uploads
    WHERE user_id = _user_id
    AND created_at >= CURRENT_DATE
  )
  SELECT 
    du.used as used_bytes,
    104857600::BIGINT as limit_bytes,
    GREATEST(0, 104857600 - du.used)::BIGINT as remaining_bytes,
    du.used < 104857600 as can_upload
  FROM daily_usage du;
$$;

-- Verificar quota total da organização (1GB)
CREATE OR REPLACE FUNCTION public.check_org_total_quota(_org_id UUID)
RETURNS TABLE(used_bytes BIGINT, limit_bytes BIGINT, remaining_bytes BIGINT, can_upload BOOLEAN)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH org_usage AS (
    SELECT COALESCE(SUM(size_bytes), 0)::BIGINT as used
    FROM file_uploads
    WHERE org_id = _org_id
  )
  SELECT 
    ou.used as used_bytes,
    1073741824::BIGINT as limit_bytes,
    GREATEST(0, 1073741824 - ou.used)::BIGINT as remaining_bytes,
    ou.used < 1073741824 as can_upload
  FROM org_usage ou;
$$;

-- Detectar duplicata por hash
CREATE OR REPLACE FUNCTION public.find_duplicate_file(_org_id UUID, _file_hash TEXT)
RETURNS TABLE(id UUID, storage_path TEXT, original_name TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, storage_path, original_name
  FROM file_uploads
  WHERE org_id = _org_id AND file_hash = _file_hash
  LIMIT 1;
$$;