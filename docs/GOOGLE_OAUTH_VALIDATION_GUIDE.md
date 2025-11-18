# Guia de Validação OAuth Google - Sistema Automatizado

## 📋 Visão Geral

Este documento descreve o sistema completo de validação automática da configuração OAuth com o Google Workspace, implementado para facilitar o diagnóstico e configuração da integração.

**Data de Criação:** 18 de novembro de 2025  
**Última Atualização:** 18 de novembro de 2025

---

## 🎯 Objetivo

Fornecer uma ferramenta de diagnóstico automatizado que verifica todos os aspectos críticos da integração OAuth com o Google, identificando problemas e fornecendo recomendações claras para correção.

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **Edge Function de Validação** (`google-oauth-validate`)
   - Executa verificações automáticas no backend
   - Acessa secrets e configurações do Supabase
   - Valida tokens armazenados
   - Retorna relatório estruturado

2. **Hook React** (`useGoogleOAuthValidation`)
   - Interface entre frontend e edge function
   - Gerencia estados de loading e resultados
   - Fornece helpers para formatação visual

3. **Componente UI** (`GoogleOAuthValidator`)
   - Interface visual para executar validações
   - Exibe resultados de forma clara e organizada
   - Fornece links diretos para correção

---

## ✅ Verificações Automáticas

### 1. Secrets do Google OAuth
- **Verifica:** Existência de `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
- **Status:** Sucesso | Erro
- **Ação em caso de erro:** Configurar secrets no Supabase Dashboard

### 2. Redirect URI - Estrutura
- **Verifica:** 
  - Protocolo HTTPS
  - Ausência de barra final
  - Formato correto
- **Status:** Sucesso | Aviso | Erro
- **URI Esperado:** `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback`

### 3. Token OAuth Armazenado
- **Verifica:**
  - Existência de token para o usuário
  - Validade do access_token
  - Presença de refresh_token
  - Metadados do usuário
- **Status:** Sucesso | Aviso | Erro
- **Ação em caso de erro:** Reconectar integração

### 4. Parâmetros de Autorização
- **Verifica:** Presença de todos os parâmetros obrigatórios:
  - `client_id`
  - `redirect_uri`
  - `response_type`
  - `scope`
  - `access_type`
  - `prompt`
  - `state` (CSRF protection)
- **Status:** Sempre sucesso (hardcoded)

### 5. Escopos Configurados
- **Verifica:** Lista de escopos ativos
- **Escopos Admin SDK:**
  - `admin.directory.user.readonly`
  - `admin.directory.group.readonly`
  - `admin.reports.audit.readonly`
- **Escopos Básicos:**
  - `openid`
  - `profile`
  - `email`
  - `drive.metadata.readonly`

---

## ⚠️ Verificações Manuais (Instruções Fornecidas)

### 1. Redirect URI no Google Cloud Console
**Por que é manual:** Não há API pública para verificar configuração do OAuth Client

**Instruções fornecidas:**
- Link direto para Google Cloud Console
- URI exato que deve estar cadastrado
- Alertas sobre case-sensitivity e formatação

**Como verificar:**
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no OAuth 2.0 Client ID
3. Verifique em "Authorized redirect URIs"
4. Confirme que contém EXATAMENTE: `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback`

### 2. Test Users na Tela de Consentimento
**Por que é manual:** Informação protegida por permissões de administrador

**Instruções fornecidas:**
- Explicação sobre modo Testing vs Production
- Link para configuração de consent screen
- Passos para adicionar test users

**Como verificar:**
1. Acesse: https://console.cloud.google.com/apis/credentials/consent
2. Verifique seção "Test users"
3. Adicione seu email se necessário

### 3. APIs Habilitadas
**Por que é manual:** Requer credenciais de admin do projeto Google Cloud

**APIs necessárias:**
- Admin SDK API
- Google People API
- Google Drive API
- Admin SDK Reports API

**Como verificar:**
1. Acesse: https://console.cloud.google.com/apis/library
2. Pesquise cada API
3. Verifique se está "Enabled"
4. Clique em "ENABLE" se necessário

### 4. Compatibilidade de Escopos com Tipo de Conta
**Por que é manual:** Não sabemos o tipo de conta até tentativa de OAuth

**Orientações:**
- **Contas pessoais (@gmail.com):** Usar apenas `openid`, `profile`, `email`, `drive.metadata.readonly`
- **Google Workspace:** Pode usar todos os escopos Admin SDK

### 5. Restrições Administrativas/Empresariais
**Por que é manual:** Políticas definidas pelo admin do domínio

**Orientações:**
- Para contas corporativas, verificar Admin Console
- Políticas de API Controls podem bloquear apps de terceiros
- Solicitar ao admin adicionar app à lista de confiança

---

## 📊 Status de Validação

O sistema retorna um dos seguintes status gerais:

### ✅ Ready (Pronto)
- **Condição:** Todas as verificações automáticas OK, sem erros
- **Ação sugerida:** Conectar ao Google Workspace
- **Cor:** Verde

### ⚠️ Needs Attention (Atenção Necessária)
- **Condição:** Avisos ou múltiplas verificações manuais pendentes
- **Ação sugerida:** Completar verificações manuais
- **Cor:** Amarelo

### ❌ Critical Issues (Problemas Críticos)
- **Condição:** Um ou mais erros que impedem integração
- **Ação sugerida:** Corrigir erros antes de continuar
- **Cor:** Vermelho

### ℹ️ Needs Configuration (Configuração Necessária)
- **Condição:** Configuração básica OK, mas passos manuais pendentes
- **Ação sugerida:** Seguir instruções de configuração
- **Cor:** Azul

---

## 🎨 Interface do Usuário

### Estrutura Visual

1. **Cabeçalho**
   - Título: "Validação OAuth Google"
   - Botão: "Validar Configuração"
   - Estado de loading com spinner

2. **Status Geral**
   - Badge com status colorido
   - Mensagem descritiva
   - Timestamp da validação

3. **Resumo em Cards**
   - 4 cards coloridos:
     - ✓ Sucessos (verde)
     - ⚠ Avisos (amarelo)
     - ✗ Erros (vermelho)
     - 👉 Manuais (azul)

4. **Próximos Passos**
   - Lista de ações recomendadas
   - Ordenadas por prioridade

5. **Verificações Detalhadas**
   - Lista scrollável de todas as verificações
   - Cada item expansível com:
     - Ícone de status
     - Nome da verificação
     - Mensagem
     - Detalhes (quando expandido)
     - Recomendação (quando expandido)
     - Link externo (quando disponível)

6. **Configuração Técnica**
   - Detalhes colapsáveis com:
     - Project ID
     - Redirect URI
     - Lista de escopos

---

## 🔧 Como Usar

### Para Usuários

1. **Acessar o Hub de Integrações**
   - Navegar para: `/integrations`
   - Clicar na aba "✅ Testar Conexão"

2. **Executar Validação**
   - Clicar em "Validar Configuração"
   - Aguardar processamento (geralmente < 3 segundos)

3. **Interpretar Resultados**
   - Verificar status geral no topo
   - Revisar resumo numérico
   - Ler próximos passos sugeridos

4. **Expandir Verificações Detalhadas**
   - Clicar em cada verificação para ver detalhes
   - Seguir recomendações específicas
   - Usar links fornecidos para correções

5. **Corrigir Problemas**
   - Priorizar erros críticos (vermelho)
   - Completar verificações manuais
   - Re-validar após correções

### Para Desenvolvedores

#### Chamar Edge Function Diretamente

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('google-oauth-validate', {
  body: {}
});

console.log('Validation report:', data.validation);
```

#### Usar Hook em Componente Customizado

```typescript
import { useGoogleOAuthValidation } from '@/hooks/useGoogleOAuthValidation';

function MyComponent() {
  const { validateConfiguration, validation, loading } = useGoogleOAuthValidation();

  const handleValidate = async () => {
    const report = await validateConfiguration();
    
    if (report?.overallStatus === 'ready') {
      // Integração pronta!
    } else {
      // Mostrar problemas
      console.log('Issues:', report?.results.filter(r => r.status === 'error'));
    }
  };

  return (
    <button onClick={handleValidate} disabled={loading}>
      Validar
    </button>
  );
}
```

---

## 📈 Métricas e Diagnóstico

### Logs da Edge Function

A function `google-oauth-validate` gera logs detalhados:

```
Google OAuth Validation: Starting comprehensive check
Google OAuth Validation: Completed { status: 'ready', errors: 0, warnings: 0 }
```

### Erros Comuns e Soluções

#### 1. Secrets não configurados
```
{
  "error": "GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados"
}
```
**Solução:** Configurar secrets no Supabase Dashboard

#### 2. Token expirado sem refresh_token
```
{
  "status": "error",
  "message": "Refresh token não disponível"
}
```
**Solução:** Reconectar integração com `access_type=offline`

#### 3. Redirect URI com barra final
```
{
  "status": "warning",
  "message": "Redirect URI contém barra final"
}
```
**Solução:** Remover barra final da configuração

---

## 🔒 Segurança

### Informações Sensíveis

A edge function **NÃO expõe**:
- Valores completos de secrets
- Access tokens ou refresh tokens
- Client secrets

Apenas expõe:
- Primeiros 20 caracteres do Client ID (para confirmação)
- Status de existência de tokens
- Metadados públicos (email do usuário, nome)

### Autenticação

- Function configurada com `verify_jwt = false` para permitir validação pré-login
- Porém, para validar tokens do usuário, requer header de autenticação
- Falha graciosamente se usuário não autenticado

---

## 🚀 Próximos Passos e Melhorias Futuras

### Implementado ✅
- [x] Validação automática de secrets
- [x] Verificação de estrutura do redirect URI
- [x] Validação de tokens armazenados
- [x] Instruções detalhadas para verificações manuais
- [x] Interface visual completa
- [x] Links diretos para Google Cloud Console

### Planejado 🎯
- [ ] Integração com Google Cloud API para validar configurações remotamente
- [ ] Teste automático de conectividade (call test API)
- [ ] Histórico de validações
- [ ] Alertas proativos quando tokens próximos de expirar
- [ ] Modo debug com logs detalhados
- [ ] Exportar relatório como PDF

---

## 📚 Referências

### Documentação do Projeto
- [GOOGLE_OAUTH_ANALYSIS.md](./GOOGLE_OAUTH_ANALYSIS.md) - Análise detalhada da implementação OAuth
- [OAUTH_FLOW_DOCUMENTATION.md](./OAUTH_FLOW_DOCUMENTATION.md) - Documentação completa do fluxo OAuth
- [GOOGLE_API_USAGE.md](./GOOGLE_API_USAGE.md) - Como usar APIs do Google após conectar

### Links Externos
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Edge Functions Relacionadas
- `google-oauth-start` - Inicia fluxo OAuth
- `google-oauth-callback` - Processa callback do Google
- `google-oauth-refresh` - Renova tokens
- `google-oauth-validate` - **Esta função** - Valida configuração

---

## ✅ Checklist Rápido para Usuários

Antes de tentar conectar ao Google Workspace:

```
☐ Executar validação OAuth no Hub de Integrações
☐ Verificar que não há erros críticos (vermelho)
☐ Confirmar redirect URI no Google Cloud Console
☐ Adicionar email como Test User (se app não publicado)
☐ Habilitar APIs necessárias no Google Cloud
☐ Verificar tipo de conta (pessoal vs. workspace)
☐ Ajustar escopos se necessário
☐ Re-validar após correções
☐ Tentar conectar ao Google Workspace
```

---

## 🆘 Suporte

Se após seguir todas as recomendações a integração ainda não funcionar:

1. **Exportar relatório de validação** (copiar JSON do console)
2. **Verificar logs da edge function** no Supabase Dashboard
3. **Revisar documentação do Google OAuth 2.0**
4. **Contatar suporte** com relatório completo

---

**Documento mantido por:** Equipe de Desenvolvimento  
**Última revisão:** 2025-11-18  
**Versão:** 1.0.0
