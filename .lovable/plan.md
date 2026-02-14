

# Corrigir Acesso do Usuário diazbrd@yahoo.com.br ao Dashboard

## Problema Identificado

O perfil do usuário no banco de dados tem `onboarding_completed = false` e `onboarding_skipped = false`. O componente `ProtectedRoute` verifica essas flags e, quando ambas são falsas, exibe o **OnboardingWizard** em vez do dashboard. O usuário fica travado no onboarding.

## Solução

Atualizar o perfil diretamente no banco de dados para marcar o onboarding como concluído:

```sql
UPDATE public.profiles 
SET onboarding_completed = true, 
    onboarding_completed_at = now()
WHERE user_id = '9bcf7941-d5e7-4496-a416-f6a73f69a37d';
```

Isso fará com que `onboardingState.hasCompleted` retorne `true`, e o `ProtectedRoute` renderizará o dashboard normalmente.

## Detalhes Técnicos

O fluxo no `ProtectedRoute.tsx` é:

```text
Usuario autenticado
  -> Onboarding completo? NAO
  -> Onboarding pulado? NAO
  -> Mostra OnboardingWizard (TRAVADO AQUI)
```

Apos a correcao:

```text
Usuario autenticado
  -> Onboarding completo? SIM
  -> Prossegue para o dashboard
```

Nenhum arquivo de codigo precisa ser alterado -- apenas o registro no banco de dados.

