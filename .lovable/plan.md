
# Plano: Gerenciamento Avançado de Sessões

## Visão Geral

Implementar um sistema completo de gerenciamento de sessões que inclui:
- Tracking de sessões ativas com device info e geolocalização
- Limites de sessões simultâneas (máx. 5 por usuário)
- Timeout por inatividade (30min) com modal de warning
- Notificações de segurança (novo dispositivo, localização diferente)
- UI completa para gestão de sessões em `/settings/security`

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                   Session Management Architecture                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐                                              │
│  │   Login Flow         │ ─── Ao fazer login:                          │
│  │   (Auth.tsx)         │     • Detectar device_info (User-Agent)      │
│  │                      │     • Capturar IP via Edge Function          │
│  │                      │     • Geolocalizar via ip-api.com            │
│  │                      │     • Criar registro em user_sessions        │
│  │                      │     • Verificar limite de 5 sessões          │
│  │                      │     • Enviar email se novo dispositivo       │
│  └──────────┬───────────┘                                              │
│             │                                                           │
│             ▼                                                           │
│  ┌──────────────────────┐                                              │
│  │   user_sessions      │ ─── Tabela de Sessões                        │
│  │   (PostgreSQL)       │     • id, user_id, org_id                    │
│  │                      │     • device_info, browser, os               │
│  │                      │     • ip_address, city, country              │
│  │                      │     • created_at, last_active_at, expires_at │
│  │                      │     • is_current, revoked                    │
│  └──────────────────────┘                                              │
│                                                                         │
│  ┌──────────────────────┐                                              │
│  │   useSessionActivity │ ─── Hook de Atividade                        │
│  │   (React Hook)       │     • Detecta mouse, teclado, scroll         │
│  │                      │     • Atualiza last_active_at a cada 60s     │
│  │                      │     • Mostra warning aos 25min               │
│  │                      │     • Logout automático aos 30min            │
│  └──────────────────────┘                                              │
│                                                                         │
│  ┌──────────────────────┐                                              │
│  │   SessionTimeout     │ ─── Modal de Warning                         │
│  │   Modal (UI)         │     • "Sua sessão expira em 5 minutos"       │
│  │                      │     • Botão "Continuar" renova sessão        │
│  │                      │     • Timer visual regressivo                │
│  └──────────────────────┘                                              │
│                                                                         │
│  ┌──────────────────────┐                                              │
│  │   ManageSessions     │ ─── UI de Gestão                             │
│  │   (Settings)         │     • Lista sessões ativas                   │
│  │                      │     • Device, localização, última atividade  │
│  │                      │     • Botão "Encerrar" por sessão            │
│  │                      │     • "Encerrar todas as outras"             │
│  └──────────────────────┘                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Database - Tabela de Sessões

### 1.1 Migration SQL

Criar tabela `user_sessions` para tracking de sessões ativas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único da sessão |
| `user_id` | UUID | Referência ao usuário |
| `org_id` | UUID | Organização do usuário |
| `session_token_hash` | TEXT | Hash do token JWT (para invalidação) |
| `device_info` | TEXT | Nome do dispositivo (ex: "Chrome on Windows") |
| `browser` | TEXT | Navegador e versão |
| `os` | TEXT | Sistema operacional |
| `device_type` | TEXT | desktop, mobile, tablet |
| `ip_address` | TEXT | Endereço IP do cliente |
| `city` | TEXT | Cidade (geolocalização) |
| `country` | TEXT | País (geolocalização) |
| `country_code` | TEXT | Código do país (BR, US, etc.) |
| `created_at` | TIMESTAMPTZ | Quando a sessão foi criada |
| `last_active_at` | TIMESTAMPTZ | Última atividade |
| `expires_at` | TIMESTAMPTZ | Expiração (30 dias) |
| `is_current` | BOOLEAN | Se é a sessão atual |
| `revoked` | BOOLEAN | Se foi encerrada manualmente |
| `revoked_at` | TIMESTAMPTZ | Quando foi encerrada |
| `revoked_reason` | TEXT | Motivo (manual, timeout, new_device) |

### 1.2 Funções SQL

| Função | Descrição |
|--------|-----------|
| `create_user_session()` | Cria nova sessão e verifica limite de 5 |
| `update_session_activity()` | Atualiza last_active_at |
| `revoke_session()` | Marca sessão como revogada |
| `revoke_all_other_sessions()` | Revoga todas exceto atual |
| `cleanup_expired_sessions()` | Limpa sessões expiradas |
| `check_session_limit()` | Verifica se usuário tem 5+ sessões |

### 1.3 RLS Policies

- Usuários só veem suas próprias sessões
- Service role pode gerenciar todas
- Nenhuma sessão pode ser deletada (apenas revogada)

---

## Fase 2: Edge Function - `session-manager`

Edge Function para gerenciar ciclo de vida das sessões:

### Endpoints

| Método | Ação | Descrição |
|--------|------|-----------|
| POST `/create` | Criar sessão | Chamado no login |
| POST `/update-activity` | Atualizar atividade | Chamado a cada 60s |
| POST `/revoke` | Revogar sessão | Chamado ao encerrar |
| POST `/revoke-all-others` | Revogar outras | Encerrar demais sessões |
| GET `/list` | Listar sessões | Retorna sessões ativas |

### Geolocalização

Usar API gratuita para localização por IP:
- Provider: ip-api.com (gratuito, 45 req/min)
- Fallback: ipapi.co (gratuito, 1000/dia)

### Device Detection

Parsear User-Agent para extrair:
- Browser: Chrome, Firefox, Safari, Edge
- OS: Windows, macOS, Linux, iOS, Android
- Device Type: desktop, mobile, tablet

---

## Fase 3: Hook de Atividade - `useSessionActivity`

Hook React para monitorar atividade do usuário:

### Funcionalidades

| Feature | Descrição |
|---------|-----------|
| Detecção de atividade | mousemove, keydown, scroll, click |
| Throttle | Debounce de 60s para updates |
| Inactivity timer | Conta tempo sem atividade |
| Warning modal | Mostra aos 25min (5min antes) |
| Auto-logout | Executa aos 30min de inatividade |

### Constantes

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `INACTIVITY_TIMEOUT` | 30 minutos | Tempo para logout automático |
| `WARNING_BEFORE` | 5 minutos | Tempo antes para mostrar warning |
| `UPDATE_INTERVAL` | 60 segundos | Frequência de update no DB |
| `SESSION_EXPIRY` | 30 dias | Validade máxima da sessão |

---

## Fase 4: Modal de Warning - `SessionTimeoutModal`

Componente de UI para avisar sobre expiração:

### Design

```text
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                    ⚠️ Sessão Expirando                  │
│                                                          │
│    Sua sessão expira em 4:32 por inatividade.           │
│                                                          │
│    Deseja continuar conectado?                          │
│                                                          │
│         [Continuar]           [Sair]                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Comportamento

- Timer visual regressivo (MM:SS)
- Botão "Continuar" renova sessão e reseta timer
- Botão "Sair" faz logout imediato
- Auto-logout se não responder em 5min

---

## Fase 5: Notificações de Segurança

### 5.1 Email para Novo Dispositivo

Quando login de dispositivo não reconhecido:

| Campo | Valor |
|-------|-------|
| Assunto | 🔐 Novo login na sua conta APOC |
| Conteúdo | Dispositivo, localização, data/hora |
| Ação | Link para gerenciar sessões |

### 5.2 Alert In-App para País Diferente

Quando login de país diferente do habitual:

| Tipo | Severidade | Mensagem |
|------|------------|----------|
| Alert | Warning | "Detectamos um login de [País]. Se não foi você, encerre a sessão." |

### 5.3 Trigger de Notificação

Lógica na Edge Function `session-manager`:

1. Ao criar sessão, verificar sessões anteriores
2. Se país diferente, criar notification + alert
3. Se device novo, enviar email

---

## Fase 6: UI de Gestão - `ManageSessionsModal` (Refatorado)

Refatorar componente existente para usar dados reais:

### Antes (Mock Data)
```typescript
const [sessions, setSessions] = useState<Session[]>([
  { id: '1', device: 'Windows PC', ... } // Mock
]);
```

### Depois (Real Data)
```typescript
const { data: sessions, isLoading } = useUserSessions();
const { mutate: revokeSession } = useRevokeSession();
```

### Features da UI

| Feature | Descrição |
|---------|-----------|
| Lista de sessões | Device, browser, localização |
| Badge "Atual" | Indica sessão corrente |
| Última atividade | "Agora", "5 min atrás", "2 horas" |
| Botão Encerrar | Por sessão individual |
| Encerrar todas | Revoga todas exceto atual |

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| **Database Migration** | Criar | Tabela `user_sessions` + funções |
| `supabase/functions/session-manager/index.ts` | **NOVO** | Edge Function de gestão |
| `supabase/functions/_shared/device-parser.ts` | **NOVO** | Parser de User-Agent |
| `supabase/functions/_shared/geolocation.ts` | **NOVO** | Lookup de IP |
| `src/hooks/useSessionActivity.tsx` | **NOVO** | Hook de atividade |
| `src/hooks/useUserSessions.tsx` | **NOVO** | Hook de sessões |
| `src/components/auth/SessionTimeoutModal.tsx` | **NOVO** | Modal de warning |
| `src/components/settings/ManageSessionsModal.tsx` | Refatorar | Usar dados reais |
| `src/pages/Auth.tsx` | Modificar | Criar sessão no login |
| `src/hooks/useAuth.tsx` | Modificar | Integrar activity tracking |
| `src/components/auth/ProtectedRoute.tsx` | Modificar | Incluir SessionTimeoutModal |
| `supabase/config.toml` | Modificar | Adicionar função |
| `README.md` | Modificar | Seção "Gerenciamento de Sessões" |

---

## Limites e Regras

| Regra | Valor | Ação |
|-------|-------|------|
| Máximo sessões simultâneas | 5 | Revogar mais antiga automaticamente |
| Timeout por inatividade | 30 minutos | Logout automático |
| Warning antes do timeout | 5 minutos | Modal de confirmação |
| Expiração de sessão | 30 dias | Requer re-autenticação |
| Update de atividade | 60 segundos | Throttled para performance |

---

## Fluxo de Login Atualizado

```text
1. Usuário faz login (Auth.tsx)
         │
         ▼
2. Verifica MFA se habilitado
         │
         ▼
3. Chama session-manager/create
         │
         ├── Detecta device (User-Agent)
         ├── Captura IP
         ├── Geolocaliza (ip-api.com)
         │
         ▼
4. Verifica limite de 5 sessões
         │
         ├── Se < 5: Criar nova sessão
         └── Se >= 5: Revogar mais antiga
         │
         ▼
5. Verifica se é novo dispositivo
         │
         ├── Se novo: Enviar email
         └── Se país diferente: Alert in-app
         │
         ▼
6. Retorna session_id para frontend
         │
         ▼
7. Hook useSessionActivity inicia tracking
```

---

## Fluxo de Inatividade

```text
┌────────────────────────────────────────────────────────────┐
│                    Timeline de Inatividade                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  0 min          25 min           30 min                    │
│    │              │                │                        │
│    │   [Ativo]    │   [Warning]    │   [Logout]            │
│    │              │                │                        │
│    └──────────────┼────────────────┼───────────────────────│
│                   │                │                        │
│             Modal aparece    Auto-logout se                │
│             "5 min para      não responder                 │
│              expirar"                                       │
│                                                             │
│    Botão "Continuar" → Reseta timer para 0 min            │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Documentação (README)

### Seção a Adicionar

```markdown
### Gerenciamento de Sessões

O sistema implementa controle avançado de sessões para segurança:

#### Limites

| Limite | Valor |
|--------|-------|
| Sessões simultâneas | 5 por usuário |
| Timeout por inatividade | 30 minutos |
| Validade da sessão | 30 dias |

#### Funcionalidades

- **Tracking de Dispositivos**: Registra browser, OS e localização
- **Geolocalização**: Detecta cidade/país via IP
- **Warning de Inatividade**: Modal aos 25min com countdown
- **Auto-logout**: Encerra sessão após 30min sem atividade
- **Notificações de Segurança**: Email para novo dispositivo
- **Alertas de Localização**: Aviso quando login de país diferente

#### Gestão Manual

Acesse `/settings/security` → "Sessões Ativas" para:
- Ver todos os dispositivos conectados
- Encerrar sessões individuais
- Revogar todas as outras sessões
```

---

## Segurança

| Ameaça | Mitigação |
|--------|-----------|
| Session hijacking | Hash do token para invalidação |
| Brute force | Limite de 5 sessões |
| Session fixation | Nova sessão a cada login |
| Inatividade | Timeout de 30min |
| Roubo de conta | Email para novo dispositivo |
| Acesso não autorizado | Alert para país diferente |

---

## Benefícios

1. **Visibilidade**: Usuário sabe onde está conectado
2. **Controle**: Pode encerrar sessões remotamente
3. **Segurança**: Alertas para atividade suspeita
4. **Compliance**: Atende requisitos de auditoria
5. **UX**: Warning antes do logout automático

---

## Dependências Técnicas

| Componente | Dependência | Status |
|------------|-------------|--------|
| Geolocation API | ip-api.com | Gratuito (45 req/min) |
| Device Parser | User-Agent parsing | Implementar |
| Email | Resend (já configurado) | Existente |
| Notifications | create_notification() | Existente |
| Rate Limiting | secure-handler.ts | Existente |
