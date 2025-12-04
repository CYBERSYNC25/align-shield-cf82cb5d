-- Criar tabela de convites
CREATE TABLE public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar convites por email e status
CREATE INDEX idx_user_invites_email_status ON public.user_invites(email, status);

-- Enable RLS
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar convites
CREATE POLICY "Admins can manage invites"
  ON public.user_invites FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atribuir role do convite quando usuário fizer signup
CREATE OR REPLACE FUNCTION public.assign_role_from_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Buscar convite pendente para este email
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY invited_at DESC
  LIMIT 1;

  -- Se encontrou convite, atribuir a role
  IF FOUND THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, invite_record.role, invite_record.invited_by);
    
    -- Marcar convite como aceito
    UPDATE public.user_invites
    SET status = 'accepted', accepted_at = now(), updated_at = now()
    WHERE id = invite_record.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger após criar usuário
CREATE TRIGGER on_user_created_assign_invite_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_role_from_invite();