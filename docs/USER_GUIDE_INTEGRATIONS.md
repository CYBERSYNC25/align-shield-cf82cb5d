# Guia do Usuário - Integrações

Bem-vindo ao Hub de Integrações do ComplianceSync! Este guia irá ajudá-lo a conectar suas ferramentas e automatizar a coleta de evidências de compliance.

## Índice

1. [Visão Geral](#visão-geral)
2. [Primeiros Passos](#primeiros-passos)
3. [Integrações Disponíveis](#integrações-disponíveis)
4. [Solução de Problemas](#solução-de-problemas)
5. [Perguntas Frequentes](#perguntas-frequentes)

---

## Visão Geral

O Hub de Integrações permite que você conecte serviços externos ao ComplianceSync para:

- ✅ **Coletar evidências automaticamente** de usuários, grupos, recursos e logs
- ✅ **Sincronizar em tempo real** via webhooks
- ✅ **Monitorar a saúde** das integrações
- ✅ **Auditar alterações** em seus sistemas

### Benefícios

- **Economia de tempo**: Reduza coleta manual de evidências em até 90%
- **Conformidade contínua**: Monitore mudanças em tempo real
- **Auditoria automatizada**: Logs completos de todas as atividades
- **Visibilidade centralizada**: Todos os sistemas em um só lugar

---

## Primeiros Passos

### 1. Acesse o Hub de Integrações

No menu lateral, clique em **"Integrações"** ou visite `/integrations-hub`.

### 2. Escolha uma Integração

Na aba **"📚 Guia"**, você encontrará instruções detalhadas para cada integração disponível.

### 3. Siga o Guia Passo a Passo

Cada integração tem um guia visual que inclui:

- ✅ Instruções passo a passo
- ✅ Capturas de tela
- ✅ Exemplos de configuração
- ✅ Erros comuns e soluções

### 4. Configure as Credenciais

Na aba **"🔐 Secrets"**, adicione as credenciais necessárias de forma segura.

⚠️ **Importante**: Nunca compartilhe suas credenciais. Elas são armazenadas de forma criptografada.

### 5. Teste a Integração

Use a aba **"Demo API"** para testar a conexão antes de usá-la em produção.

---

## Integrações Disponíveis

### Google Workspace

Colete evidências de usuários, grupos e logs de auditoria do Google Workspace.

**O que você pode fazer:**
- Listar usuários e suas permissões
- Monitorar grupos e membros
- Auditar mudanças administrativas
- Verificar configurações de segurança

**Tempo de configuração**: ~10 minutos

[Ver guia completo →](#google-workspace-detalhado)

---

### AWS (Amazon Web Services)

Integre com AWS para monitorar recursos, buckets S3 e usuários IAM.

**O que você pode fazer:**
- Listar buckets S3 e verificar criptografia
- Auditar usuários e roles do IAM
- Monitorar recursos EC2 e VPCs
- Coletar logs do CloudTrail

**Tempo de configuração**: ~15 minutos

[Ver guia completo →](#aws-detalhado)

---

### Microsoft Azure

Conecte ao Azure para monitorar recursos, grupos e subscriptions.

**O que você pode fazer:**
- Listar recursos e grupos
- Auditar subscriptions
- Monitorar Active Directory
- Verificar configurações de segurança

**Tempo de configuração**: ~15 minutos

---

### Okta

Integre com Okta para gerenciar identidades e acessos.

**O que você pode fazer:**
- Listar usuários e grupos
- Monitorar autenticações
- Auditar mudanças de permissões
- Verificar políticas de segurança

**Tempo de configuração**: ~10 minutos

---

## Google Workspace Detalhado

### Pré-requisitos

- ✅ Conta Google Workspace com permissões de admin
- ✅ Acesso ao Google Cloud Console
- ✅ 10-15 minutos disponíveis

### Passo 1: Criar Projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Clique em **"Select a project" → "NEW PROJECT"**
3. Nome do projeto: `ComplianceSync Integration`
4. Clique em **"CREATE"**

### Passo 2: Ativar APIs

1. No menu lateral, vá em **"APIs & Services" → "Library"**
2. Busque e ative:
   - **Admin SDK API**
   - **Google People API**

### Passo 3: Configurar Tela de Consentimento

1. Vá em **"APIs & Services" → "OAuth consent screen"**
2. Escolha **"Internal"** (recomendado para organizações)
3. Preencha:
   - **App name**: `ComplianceSync`
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Clique em **"SAVE AND CONTINUE"**
5. Em **"Scopes"**, adicione:
   - `userinfo.email`
   - `userinfo.profile`
   - `admin.directory.user.readonly`
   - `admin.directory.group.readonly`
6. Clique em **"SAVE AND CONTINUE"**

### Passo 4: Criar Credenciais OAuth

1. Vá em **"APIs & Services" → "Credentials"**
2. Clique em **"+ CREATE CREDENTIALS" → "OAuth client ID"**
3. Selecione **"Web application"**
4. Nome: `ComplianceSync OAuth Client`
5. Em **"Authorized redirect URIs"**, adicione:
   ```
   https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
   ```
6. Clique em **"CREATE"**
7. **COPIE** o Client ID e Client Secret

### Passo 5: Adicionar Credenciais ao ComplianceSync

1. No ComplianceSync, vá na aba **"🔐 Secrets"**
2. Clique em **"Adicionar Secret"**
3. Adicione:
   - Nome: `GOOGLE_CLIENT_ID`
   - Valor: [Cole o Client ID]
4. Clique em **"Adicionar Secret"** novamente
5. Adicione:
   - Nome: `GOOGLE_CLIENT_SECRET`
   - Valor: [Cole o Client Secret]

### Passo 6: Conectar

1. Vá na aba **"OAuth 2.0"**
2. Clique em **"Conectar Google Workspace"**
3. Faça login com sua conta admin do Google
4. Autorize o acesso
5. Pronto! ✅

### Verificar Conexão

Após conectar:

1. Vá na aba **"Conectadas"**
2. Você deve ver o Google Workspace com status **"Ativa"**
3. Clique em **"Ver Detalhes"** para mais informações

---

## Solução de Problemas

### Erro: "redirect_uri_mismatch"

**Problema**: A URL de redirecionamento não está configurada corretamente.

**Solução**:
1. Verifique se adicionou EXATAMENTE esta URL no Google Cloud:
   ```
   https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
   ```
2. Não pode ter espaços ou barras extras
3. Aguarde 2-3 minutos após salvar no Google

---

### Erro: "invalid_client"

**Problema**: Client ID ou Secret incorretos.

**Solução**:
1. Revise os valores na aba **"🔐 Secrets"**
2. Certifique-se de copiar os valores COMPLETOS
3. Se necessário, gere novas credenciais no Google Cloud

---

### Erro: "access_denied"

**Problema**: Você negou o acesso durante a autorização.

**Solução**:
1. Tente conectar novamente
2. Clique em **"Permitir"** quando o Google pedir autorização
3. Certifique-se de estar logado como admin

---

### Integração aparece como "Degradada"

**Problema**: A integração está tendo problemas de sincronização.

**Solução**:
1. Vá na aba **"Conectadas"**
2. Clique nos **três pontos (⋮)** → **"Ver Detalhes"**
3. Na aba **"Webhooks"**, verifique se há erros
4. Tente **"Reconectar"** se necessário

---

### Webhooks não estão chegando

**Problema**: Eventos não estão sendo recebidos em tempo real.

**Solução**:
1. Verifique se configurou a URL do webhook no painel da integração:
   ```
   https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/integration-webhook
   ```
2. Aguarde alguns minutos para a configuração propagar
3. Vá na aba **"Webhooks"** para ver os logs

---

## Perguntas Frequentes

### Minhas credenciais estão seguras?

✅ **Sim!** Todas as credenciais são:
- Armazenadas criptografadas no Supabase
- Nunca expostas no frontend
- Acessíveis apenas via Edge Functions seguras
- Nunca compartilhadas com terceiros

---

### Quantas integrações posso conectar?

✅ Você pode conectar **quantas integrações quiser**.

Não há limite de número de integrações no plano atual.

---

### Como desconectar uma integração?

1. Vá na aba **"Conectadas"**
2. Encontre a integração
3. Clique nos **três pontos (⋮)** → **"Desconectar"**
4. Confirme a ação

⚠️ **Atenção**: Desconectar uma integração **não apaga** os dados já coletados.

---

### Os dados são coletados em tempo real?

✅ **Sim**, se você configurar webhooks!

Sem webhooks, os dados são sincronizados quando você acessa o sistema ou manualmente.

Com webhooks, os dados são atualizados instantaneamente quando algo muda.

---

### Posso pausar uma integração?

✅ **Sim!**

1. Vá na aba **"Conectadas"**
2. Clique nos **três pontos (⋮)** → **"Pausar"**
3. A integração para de coletar dados mas não é desconectada

---

### Como vejo os logs da integração?

1. Vá na aba **"Webhooks"**
2. Filtre por integração
3. Você verá todos os eventos recebidos
4. Clique em um evento para ver detalhes

---

### Preciso renovar os tokens OAuth?

✅ **Não!** O sistema renova automaticamente.

Os tokens OAuth são renovados automaticamente antes de expirarem.

Você só precisa reconectar se:
- Revogar o acesso manualmente
- Mudar as permissões
- Trocar a conta usada

---

### Onde encontro mais ajuda?

📚 **Documentação Técnica**:
- [OAuth Flow](/docs/OAUTH_FLOW_DOCUMENTATION.md)
- [API Reference](/docs/INTEGRATION_API_REFERENCE.md)
- [Webhooks](/docs/WEBHOOK_DOCUMENTATION.md)

💬 **Suporte**: Entre em contato com o suporte técnico se precisar de ajuda adicional.

---

## Próximos Passos

Agora que você conectou suas integrações:

1. ✅ Vá em **"Demo API"** para testar as funcionalidades
2. ✅ Configure **webhooks** para sincronização em tempo real
3. ✅ Explore **"Webhooks"** para monitorar eventos
4. ✅ Use os dados coletados em **auditorias** e **relatórios**

**Bom trabalho!** 🎉 Suas integrações estão funcionando e coletando evidências automaticamente.
