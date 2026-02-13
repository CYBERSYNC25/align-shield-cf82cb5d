

# Remover Seção "Tutorial e Onboarding" das Configurações

## O que será feito

Remover o card "Tutorial e Onboarding" da aba de perfil nas configurações (linhas 137-178 de `src/pages/Settings.tsx`).

## Detalhes Técnicos

### Arquivo: `src/pages/Settings.tsx`

- Remover o bloco `{/* Onboarding Section */}` completo (linhas 137-178), que inclui o Card com título "Tutorial e Onboarding", descrição, status do onboarding e botão "Refazer Onboarding"
- Verificar se as importações de `Rocket`, `Play`, `resetOnboarding` e `onboardingState` ainda são usadas em outro lugar do arquivo; se não, removê-las também para manter o código limpo

