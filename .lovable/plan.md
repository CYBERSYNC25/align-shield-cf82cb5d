
# Plano de Auditoria e Fortalecimento de RLS

## Resumo Executivo

Auditoria completa de 57 tabelas públicas revelou que **TODAS as tabelas têm RLS habilitado** ✅, porém existem **vulnerabilidades críticas** que permitem vazamento de dados entre organizações.

---

## Status Atual do RLS

### ✅ Tabelas com RLS Habilitado: 57/57 (100%)

Nenhuma tabela está sem RLS habilitado. Todas as 57 tabelas públicas possuem `ROW LEVEL SECURITY` ativo.

### 🔴 Vulnerabilidades CRÍTICAS Identificadas

| # | Vulnerabilidade | Tabelas Afetadas | Severidade |
|---|-----------------|------------------|------------|
| 1 | **`OR (org_id IS NULL)`** - Permite acesso a dados sem org_id | 25 tabelas | **CRÍTICO** |
| 2 | **`USING(true)`** - Acesso irrestrito | control_tests (SELECT) | **HIGH** |
| 3 | **`WITH CHECK(true)`** - Insert irrestrito | auth_login_attempts | MEDIUM |
| 4 | **api_keys sem org_id check** | api_keys | **HIGH** |
| 5 | **Credenciais expostas via RLS** | integration_oauth_tokens, integrations | **CRÍTICO** |
| 6 | **profiles sem org_id isolation** | profiles | MEDIUM |

---

## Análise Detalhada

### 1. CRÍTICO: Padrão `OR (org_id IS NULL)` em 25 Tabelas

Este padrão permite que usuários de qualquer organização vejam registros onde `org_id` é `NULL`, quebrando o isolamento multi-tenant.

**Tabelas afetadas:**
- answer_library, auditor_access_tokens, audits
- bcp_plans, compliance_alerts, controls
- custom_compliance_tests, evidence, frameworks
- incident_playbooks, incidents, integration_collected_data
- integration_oauth_tokens, integration_status, integrations
- notifications, policies, risk_acceptances
- risks, security_questionnaires, system_logs
- tasks, trust_center_settings, user_roles, vendors

**Políticas problemáticas (exemplo):**
```sql
-- VULNERÁVEL:
USING ((org_id = get_user_org_id(auth.uid())) OR (org_id IS NULL))

-- CORRIGIDO:
USING (org_id = get_user_org_id(auth.uid()))
```

### 2. HIGH: control_tests com USING(true)

```sql
-- VULNERÁVEL: Qualquer usuário autenticado pode ver TODOS os testes
SELECT policyname:Users can view control tests 
USING(true)
```

### 3. HIGH: api_keys sem org_id check

A tabela `api_keys` tem `org_id` column, mas as políticas usam apenas `user_id`:
```sql
-- Atual (user_id only):
USING (auth.uid() = user_id)

-- Deveria incluir org_id:
USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()))
```

### 4. CRÍTICO: Credenciais OAuth expostas

A tabela `integration_oauth_tokens` contém `access_token` e `refresh_token` que podem ser selecionados via RLS. Usuários NÃO devem ver tokens descriptografados.

**Colunas expostas:**
- access_token (encrypted but visible)
- refresh_token (encrypted but visible)

### 5. MEDIUM: profiles sem org_id isolation

Admins podem ver perfis de outras orgs via `has_role()` check sem validar org_id.

---

## Plano de Correção

### Fase 1: Corrigir Padrão OR (org_id IS NULL)

Atualizar políticas em 25 tabelas para remover `OR (org_id IS NULL)`:

```sql
-- PADRÃO CORRETO:
CREATE POLICY "Org members can view {table}"
  ON public.{table} FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can insert {table}"
  ON public.{table} FOR INSERT
  WITH CHECK (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can update {table}"
  ON public.{table} FOR UPDATE
  USING (org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org members can delete {table}"
  ON public.{table} FOR DELETE
  USING (org_id = get_user_org_id(auth.uid()));
```

### Fase 2: Restringir control_tests

```sql
DROP POLICY "Users can view control tests" ON public.control_tests;
CREATE POLICY "Org members can view control tests"
  ON public.control_tests FOR SELECT
  USING (org_id = get_user_org_id(auth.uid()));
```

### Fase 3: Adicionar org_id check em api_keys

```sql
DROP POLICY "Users can view own API keys" ON public.api_keys;
DROP POLICY "Users can insert own API keys" ON public.api_keys;
DROP POLICY "Users can update own API keys" ON public.api_keys;
DROP POLICY "Users can delete own API keys" ON public.api_keys;

CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id AND org_id = get_user_org_id(auth.uid()));
```

### Fase 4: Proteger Credenciais Sensíveis

#### 4.1 Criar VIEW sem credenciais para integrations

```sql
CREATE VIEW public.integrations_safe AS
SELECT 
  id, user_id, provider, name, status, 
  last_sync_at, created_at, updated_at, org_id, last_used_at
  -- OMITIR: configuration (contém credenciais criptografadas)
FROM public.integrations;

-- Revogar SELECT direto na tabela
DROP POLICY "Org members can view integrations" ON public.integrations;
CREATE POLICY "No direct SELECT on integrations"
  ON public.integrations FOR SELECT
  USING (false); -- Bloqueia acesso direto

-- Permitir via VIEW
GRANT SELECT ON public.integrations_safe TO authenticated;
```

#### 4.2 Criar VIEW sem tokens para integration_oauth_tokens

```sql
CREATE VIEW public.integration_oauth_tokens_safe AS
SELECT 
  id, user_id, integration_name, token_type, 
  expires_at, scope, created_at, updated_at, org_id, last_used_at
  -- OMITIR: access_token, refresh_token, metadata
FROM public.integration_oauth_tokens;

-- Bloquear SELECT direto
DROP POLICY "Org members can view integration_oauth_tokens" ON public.integration_oauth_tokens;
CREATE POLICY "Only service role can SELECT oauth tokens"
  ON public.integration_oauth_tokens FOR SELECT
  USING (auth.role() = 'service_role');
```

### Fase 5: Adicionar org_id isolation em profiles

```sql
-- Adicionar política para limitar visibilidade a mesma org
CREATE POLICY "Org members can view org profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id 
    OR org_id = get_user_org_id(auth.uid())
    OR has_role(auth.uid(), 'master_admin')
  );
```

### Fase 6: Criar Função de Teste de Penetração

```sql
CREATE OR REPLACE FUNCTION public.test_rls_bypass(test_org_id uuid)
RETURNS TABLE(
  table_name text,
  rows_visible bigint,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_org uuid;
BEGIN
  current_user_org := get_user_org_id(auth.uid());
  
  -- Verificar que o org de teste é DIFERENTE do usuário atual
  IF test_org_id = current_user_org THEN
    RAISE EXCEPTION 'Use um org_id diferente do seu para testar';
  END IF;
  
  -- Testar cada tabela com org_id
  RETURN QUERY
  SELECT 'integrations'::text, 
    (SELECT COUNT(*) FROM integrations WHERE org_id = test_org_id),
    CASE WHEN (SELECT COUNT(*) FROM integrations WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  RETURN QUERY
  SELECT 'risks'::text,
    (SELECT COUNT(*) FROM risks WHERE org_id = test_org_id),
    CASE WHEN (SELECT COUNT(*) FROM risks WHERE org_id = test_org_id) = 0 
      THEN 'PASS' ELSE 'FAIL - CROSS-ORG LEAK' END;
  
  -- Adicionar mais tabelas...
END;
$$;
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Migration SQL | **NOVO** | Atualizar 25+ políticas RLS |
| `src/hooks/useIntegrations.ts` | Modificar | Usar view `integrations_safe` |
| `src/hooks/useApiKeys.tsx` | Verificar | Garantir que key_hash não é exposto |

---

## Tabelas por Prioridade de Correção

### 🔴 CRÍTICO (Corrigir Primeiro)

| Tabela | Problema | Ação |
|--------|----------|------|
| integration_oauth_tokens | Tokens OAuth visíveis | Criar VIEW, bloquear SELECT |
| integrations | Credenciais criptografadas visíveis | Criar VIEW, bloquear SELECT |
| api_keys | Sem org_id check | Adicionar org_id à policy |
| control_tests | USING(true) | Restringir por org_id |

### 🟠 HIGH (Corrigir em Seguida)

| Tabela | Problema |
|--------|----------|
| risks | OR (org_id IS NULL) |
| incidents | OR (org_id IS NULL) |
| audits | OR (org_id IS NULL) |
| frameworks | OR (org_id IS NULL) |
| controls | OR (org_id IS NULL) |
| policies | OR (org_id IS NULL) |
| evidence | OR (org_id IS NULL) |
| vendors | OR (org_id IS NULL) |

### 🟡 MEDIUM (25 tabelas restantes)

Todas as outras tabelas com padrão `OR (org_id IS NULL)`.

---

## Benefícios Pós-Correção

1. **Isolamento Multi-Tenant Completo**: Nenhum vazamento entre organizações
2. **Credenciais Protegidas**: Tokens OAuth e API keys nunca expostos ao frontend
3. **Auditabilidade**: Função de teste de penetração para validação contínua
4. **Conformidade**: SOC2, ISO27001, LGPD requirements atendidos
5. **Defesa em Profundidade**: RLS + Views + Edge Functions

---

## Seção Técnica: SQL de Migração Completo

A migração será dividida em 6 partes:

### Parte 1: Drop policies vulneráveis
```sql
-- 25 DROP POLICY statements
```

### Parte 2: Criar policies corrigidas (sem OR NULL)
```sql
-- 100+ CREATE POLICY statements
```

### Parte 3: Criar VIEWs seguras
```sql
CREATE VIEW integrations_safe WITH (security_invoker=on) AS ...
CREATE VIEW integration_oauth_tokens_safe WITH (security_invoker=on) AS ...
```

### Parte 4: Bloquear SELECT direto em tabelas sensíveis
```sql
CREATE POLICY "Only service role" ON integrations FOR SELECT USING(false);
-- Service role e edge functions ainda podem acessar
```

### Parte 5: Atualizar hooks frontend
```typescript
// Mudar de 'integrations' para 'integrations_safe'
```

### Parte 6: Criar função de teste
```sql
CREATE FUNCTION test_rls_bypass(...) ...
```

---

## Resumo de Achados

| Categoria | Status |
|-----------|--------|
| Tabelas com RLS | ✅ 57/57 (100%) |
| Políticas com org_id IS NULL | ❌ 25 tabelas vulneráveis |
| Políticas com USING(true) | ❌ 1 tabela (control_tests) |
| Credenciais expostas | ❌ 2 tabelas (integrations, oauth_tokens) |
| api_keys sem org_id | ❌ 1 tabela |
| Leaked Password Protection | ❌ Desabilitado (manual) |
