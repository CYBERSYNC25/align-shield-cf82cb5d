-- Criar tabela para armazenar tokens OAuth das integrações
CREATE TABLE IF NOT EXISTS public.integration_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT integration_oauth_tokens_user_id_integration_name_key UNIQUE (user_id, integration_name)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_integration_oauth_tokens_user_id ON public.integration_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_oauth_tokens_integration_name ON public.integration_oauth_tokens(integration_name);
CREATE INDEX IF NOT EXISTS idx_integration_oauth_tokens_expires_at ON public.integration_oauth_tokens(expires_at);

-- Habilitar RLS
ALTER TABLE public.integration_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários só podem ver e gerenciar seus próprios tokens
CREATE POLICY "Users can view their own OAuth tokens"
  ON public.integration_oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth tokens"
  ON public.integration_oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth tokens"
  ON public.integration_oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth tokens"
  ON public.integration_oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_integration_oauth_tokens_updated_at
  BEFORE UPDATE ON public.integration_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.integration_oauth_tokens IS 'Armazena tokens OAuth 2.0 para integrações externas';
COMMENT ON COLUMN public.integration_oauth_tokens.access_token IS 'Token de acesso OAuth (criptografado em produção)';
COMMENT ON COLUMN public.integration_oauth_tokens.refresh_token IS 'Token de refresh para renovação automática';
COMMENT ON COLUMN public.integration_oauth_tokens.expires_at IS 'Data/hora de expiração do access_token';
COMMENT ON COLUMN public.integration_oauth_tokens.metadata IS 'Dados adicionais do provider (email, nome, etc)';
