# Plano de Auditoria e Fortalecimento de RLS

## ✅ Status: COMPLETO

Migração executada com sucesso em 26/01/2026.

---

## Resumo da Implementação

### Correções Aplicadas

| Item | Status | Descrição |
|------|--------|-----------|
| 25 tabelas com `OR (org_id IS NULL)` | ✅ Corrigido | Políticas agora usam `org_id = get_user_org_id(auth.uid())` estrito |
| `control_tests` com `USING(true)` | ✅ Corrigido | Agora restringe por org_id |
| `api_keys` sem org_id check | ✅ Corrigido | Adicionado `org_id = get_user_org_id(auth.uid())` |
| `integrations` expondo credenciais | ✅ Corrigido | Criada VIEW `integrations_safe`, SELECT direto bloqueado |
| `integration_oauth_tokens` expondo tokens | ✅ Corrigido | Criada VIEW `integration_oauth_tokens_safe`, SELECT = service_role only |
| `profiles` sem org isolation | ✅ Corrigido | Política atualizada para org_id + master_admin |
| Função `test_rls_bypass()` | ✅ Criada | Testa isolamento entre organizações |

### VIEWs Seguras Criadas

```sql
-- Não expõe configuration (credenciais criptografadas)
CREATE VIEW integrations_safe WITH (security_invoker=true) AS
  SELECT id, user_id, provider, name, status, last_sync_at, 
         created_at, updated_at, org_id, last_used_at
  FROM integrations;

-- Não expõe access_token, refresh_token, metadata
CREATE VIEW integration_oauth_tokens_safe WITH (security_invoker=true) AS
  SELECT id, user_id, integration_name, token_type, expires_at, 
         scope, created_at, updated_at, org_id, last_used_at
  FROM integration_oauth_tokens;
```

### Frontend Atualizado

- `src/hooks/useIntegrations.tsx` agora usa `integrations_safe` view
- Credenciais NUNCA são retornadas ao frontend

---

## Warnings Residuais (Pré-existentes)

| Warning | Severidade | Ação Requerida |
|---------|------------|----------------|
| `auth_login_attempts` WITH CHECK(true) | MEDIUM | **Intencional** - tabela de logging público |
| Leaked Password Protection | MEDIUM | **Manual** - Ativar em Supabase Dashboard > Auth > Settings |

---

## Função de Teste de Penetração

Execute no SQL Editor para validar isolamento:

```sql
SELECT * FROM test_rls_bypass('outro-org-id-aqui');
```

Todos os resultados devem mostrar `PASS` e 0 rows visíveis.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/...` | Migração RLS completa |
| `src/hooks/useIntegrations.tsx` | Usa `integrations_safe` view |
