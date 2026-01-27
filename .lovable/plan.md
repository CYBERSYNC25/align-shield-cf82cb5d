

# Plano: Atualizar README com Novas Funcionalidades

## Contexto

O README atual não reflete as novas funcionalidades de segurança e conformidade implementadas recentemente:

1. **Proteção contra Abuso de API** - Rate limiting por tier, security headers, IP blacklist
2. **Controles LGPD/GDPR** - Classificação de dados, sanitização de PII, auditoria de acesso, retenção automática

## Atualizações Necessárias

### 1. Adicionar na Seção "Funcionalidades" (após linha ~130)

Nova subseção para destacar conformidade com privacidade:

```markdown
### 🛡️ Proteção de Dados (LGPD/GDPR)
- Classificação de dados por nível (public/internal/confidential/restricted)
- Mascaramento automático de PII em logs (email, CPF, telefone, IP)
- Auditoria de acesso a dados pessoais (append-only)
- Retenção automática com exclusão e anonimização
- Exportação de dados pessoais (portabilidade)
- Exclusão de conta com opção imediata ou agendada (30 dias)
```

### 2. Expandir Seção "Segurança" (linha 454-493)

Adicionar novas subseções:

```markdown
### Proteção contra Abuso de API

Rate limiting por tier com Upstash Redis:

| Tipo de Acesso | Limite | Janela |
|----------------|--------|--------|
| Não autenticado (por IP) | 100 | 1 hora |
| Autenticado (por user_id) | 1000 | 1 hora |
| API Key Free | 100 | 1 minuto |
| API Key Pro | 5000 | 1 hora |
| API Key Enterprise | 20000 | 1 hora |
| Login | 5 | 15 minutos |

### Security Headers

Headers aplicados em todas as respostas:

| Header | Valor |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=31536000 |
| Content-Security-Policy | (restritiva) |
| Referrer-Policy | strict-origin-when-cross-origin |

### Proteção contra IPs Maliciosos

- Tabela `blocked_ips` para bloqueio manual/automático
- Logs de atividade suspeita em `suspicious_activity_logs`
- Auto-bloqueio após excesso de rate limit

### Conformidade LGPD/GDPR

#### Classificação de Dados

| Nível | Descrição | Exemplo |
|-------|-----------|---------|
| public | Dados públicos | Nome da organização |
| internal | Apenas membros da org | Display name |
| confidential | PII, requer auditoria | Email, CPF, IP |
| restricted | NUNCA logado | Tokens, senhas |

#### Mascaramento de PII

| Tipo | Original | Mascarado |
|------|----------|-----------|
| Email | joao@empresa.com | jo***@empresa.com |
| CPF | 123.456.789-01 | ***.456.789-** |
| Telefone | (11) 98765-4321 | ***-**21 |
| IP | 192.168.1.100 | 192.168.*.* |
| Token | sk_live_abc123xyz789 | sk_live_abc1****z789 |

#### Auditoria de Acesso a PII

- Tabela imutável `pii_access_audit`
- Registra: quem, quando, qual dado, motivo
- Apenas service_role pode inserir (via Edge Functions)
- Admins podem visualizar logs de sua organização

#### Retenção de Dados

| Tipo de Dado | Retenção | Ação |
|--------------|----------|------|
| Contas excluídas | 30 dias | Hard delete |
| Contas inativas | 2 anos | Anonimização |
| Logs de auditoria | 7 anos | Imutável |
| Exportações | 24 horas | Delete |
| Logs de sistema | 90 dias | Delete |

#### Direitos do Titular

- **Portabilidade**: Exportar todos os dados em JSON
- **Esquecimento**: Exclusão agendada (30 dias) ou imediata
- **Acesso**: Visualizar dados pessoais em Settings
```

### 3. Atualizar Seção "Edge Functions" (linha 401-451)

Adicionar novas funções na tabela "Outros":

```markdown
| `cleanup-pii-data` | Cron job de limpeza de dados (LGPD) |
| `export-user-data` | Exporta dados pessoais do usuário |
| `delete-user-account` | Exclui conta (soft/hard delete) |
| `public-api` | API pública com rate limiting |
```

### 4. Atualizar Seção "Arquitetura" (linha 225-264)

Adicionar na tabela "Stack Tecnológico":

```markdown
| **Segurança** | AES-256-GCM, HMAC-SHA256, RLS, Rate Limiting, PII Sanitization |
| **Privacidade** | LGPD/GDPR compliant, Data Classification, Audit Trail |
```

### 5. Atualizar "Boas Práticas Implementadas" (linha 486-492)

Adicionar novos itens:

```markdown
- ✅ Mascaramento automático de PII em todos os logs
- ✅ Classificação de dados por nível de sensibilidade
- ✅ Auditoria imutável de acesso a dados pessoais
- ✅ Rate limiting por tier (IP, usuário, API key)
- ✅ Security headers em todas as respostas
- ✅ Auto-bloqueio de IPs suspeitos
- ✅ Retenção automática com exclusão/anonimização
- ✅ Conformidade LGPD/GDPR integrada
```

### 6. Adicionar Seção "Conformidade" (nova seção após Segurança)

```markdown
## 📜 Conformidade

### LGPD (Lei Geral de Proteção de Dados)

O APOC implementa controles nativos para conformidade com a LGPD:

| Artigo | Requisito | Implementação |
|--------|-----------|---------------|
| Art. 18, I | Acesso aos dados | Settings > Meus Dados |
| Art. 18, II | Correção | Edição de perfil |
| Art. 18, IV | Anonimização | Automática após 2 anos |
| Art. 18, V | Portabilidade | Export em JSON |
| Art. 18, VI | Eliminação | Exclusão de conta |
| Art. 37 | Registro de operações | pii_access_audit |
| Art. 46 | Segurança | AES-256, RLS, Rate Limit |

### GDPR (General Data Protection Regulation)

| Artigo | Requisito | Implementação |
|--------|-----------|---------------|
| Art. 15 | Right of access | Data export |
| Art. 17 | Right to erasure | Account deletion |
| Art. 20 | Data portability | JSON export |
| Art. 30 | Records of processing | Audit logs |
| Art. 32 | Security | Encryption, access control |

### SOC 2 Type II

O APOC auxilia na conformidade SOC 2:

- **CC6.1**: Logical and physical access controls (RLS, Auth)
- **CC6.6**: Secure transmission (HTTPS, TLS)
- **CC6.7**: Disposal (Data retention automation)
- **CC7.2**: System monitoring (Audit logs, alerts)
```

---

## Resumo das Alterações

| Seção | Ação |
|-------|------|
| Funcionalidades | Adicionar "Proteção de Dados (LGPD/GDPR)" |
| Arquitetura > Stack | Atualizar linha de Segurança, adicionar Privacidade |
| Edge Functions | Adicionar 4 novas funções |
| Segurança | Expandir com Rate Limiting, Headers, LGPD |
| Conformidade | Nova seção completa (LGPD, GDPR, SOC 2) |
| Boas Práticas | Adicionar 8 novos itens |

## Seção Técnica

### Arquivos a Modificar

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Documento principal do projeto |

### Estrutura Final do README

1. Visão Geral
2. Funcionalidades (+ Proteção de Dados)
3. Integrações Suportadas
4. Motor de Compliance
5. Arquitetura (atualizada)
6. Instalação
7. Como Usar
8. Estrutura de Páginas
9. Edge Functions (atualizada)
10. Segurança (expandida)
11. **Conformidade** (NOVA)
12. Documentação
13. Contribuindo
14. Licença

