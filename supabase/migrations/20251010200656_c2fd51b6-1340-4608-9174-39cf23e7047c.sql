-- Atribuir role de admin ao primeiro usuário do sistema
-- (usuários que existiam antes da implementação do sistema de roles)

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;