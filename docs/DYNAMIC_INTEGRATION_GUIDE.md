# Guia de Integração Dinâmica de APIs

## Visão Geral

Sistema extensível para conectar APIs externas de forma segura, começando com Azure AD/Entra ID e facilmente adaptável para outras APIs.

## Fluxo do Usuário

### 1. Seleção de API
- Visualizar catálogo de APIs disponíveis
- Filtrar por categoria (Identity & Access, Cloud, etc.)
- Ver status (Disponível, Em breve)

### 2. Configuração
- Inserir credenciais (Tenant ID, Client ID, Client Secret)
- Validação automática de formato
- Documentação inline com links para portais

### 3. Permissões
- Selecionar escopos necessários
- Descrições claras de cada permissão
- Marcação de escopos obrigatórios

### 4. Autenticação
- Redirecionamento seguro para OAuth
- Proteção CSRF com state token
- Callback automático

### 5. Confirmação
- Status de sucesso visual
- Informações sobre tokens armazenados
- Próximos passos claros

## Segurança

### Armazenamento
- Tokens criptografados no Supabase
- Isolamento por usuário (RLS)
- Client secrets nunca expostos no frontend

### OAuth
- HTTPS obrigatório
- State token único por requisição
- Validação de redirect URI

### Auditoria
- Log completo de todas as ações
- Rastreamento de erros
- Histórico acessível ao usuário

## Controles do Usuário

### Desconectar
Usuário pode desconectar integração a qualquer momento, removendo todos os tokens.

### Renovar
Tokens são renovados automaticamente usando refresh token quando necessário.

### Logs
Histórico completo com:
- Data/hora de cada ação
- Status (sucesso/erro)
- Mensagens de erro detalhadas
- Payloads completos

## Mensagens de Erro

### Erro 403 - Permissões Insuficientes
**Mensagem:** "Permissões insuficientes. Verifique os escopos configurados."
**Ação:** Revisar permissões no Azure Portal

### Erro 400 - Credenciais Inválidas
**Mensagem:** "Credenciais inválidas. Verifique Tenant ID, Client ID e Secret."
**Ação:** Regenerar credenciais no portal

### Token Expirado
**Mensagem:** "Token expirado. Renovando automaticamente..."
**Ação:** Sistema renova automaticamente

## Extensibilidade

### Estrutura Modular
Cada API provider tem:
- Componente conector específico
- Edge functions para OAuth
- Configuração de escopos
- Documentação integrada

### Adicionar Nova API
1. Criar definição no `API_PROVIDERS`
2. Implementar componente conector
3. Criar edge functions OAuth
4. Adicionar configuração no `config.toml`
5. Documentar escopos e permissões

## Exemplos de Uso

### Azure AD/Entra ID
**Use case:** Gestão de usuários e grupos
**Escopos comuns:** User.Read.All, Group.Read.All
**Documentação:** [Azure AD Docs](https://docs.microsoft.com/azure/active-directory/)

### Okta (Em breve)
**Use case:** Identity & Access Management
**Escopos comuns:** okta.users.read, okta.groups.read

### AWS IAM (Em breve)
**Use case:** Cloud access management
**Auth type:** API Key (não OAuth)

## Boas Práticas

1. **Sempre use HTTPS** em produção
2. **Validar permissões mínimas** necessárias
3. **Monitorar logs** regularmente
4. **Renovar credenciais** periodicamente
5. **Documentar integrações** customizadas

## Troubleshooting

### Problema: Redirect URI mismatch
**Solução:** Configurar URI correto no portal do provider

### Problema: Token expirado
**Solução:** Sistema renova automaticamente via refresh token

### Problema: Erro 403 ao acessar recursos
**Solução:** Verificar se escopos estão autorizados no portal

## Suporte

Para dúvidas:
1. Consultar logs da integração
2. Verificar documentação do provider
3. Validar credenciais no portal
4. Revisar políticas RLS no Supabase
