# APOC - Arquitetura do Sistema v3.0

> **Documento Mestre de Arquitetura**  
> Última atualização: Dezembro 2025  
> Versão: 3.0 (MVP Feature Complete)  
> Status: **Produção Ready**

---

## 📋 Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Arquitetura de Dados (Backend)](#2-arquitetura-de-dados-backend)
3. [O Agente IoT Multi-Device](#3-o-agente-iot-multi-device)
4. [Sistema de Resiliência e Alertas](#4-sistema-de-resiliência-e-alertas)
5. [Módulos de Compliance](#5-módulos-de-compliance)
6. [Relatórios e Evidências](#6-relatórios-e-evidências)
7. [Funcionalidades do Frontend](#7-funcionalidades-do-frontend)
8. [Guia de Instalação](#8-guia-de-instalação)
9. [Stack Completa](#9-stack-completa)
10. [Roadmap Futuro](#10-roadmap-futuro)

---

## 1. Visão Geral do Produto

### 1.1 Definição

| Atributo | Valor |
|----------|-------|
| **Nome** | APOC (Automated Platform for Online Compliance) |
| **Tipo** | SaaS Híbrido de Monitoramento de Redes e Compliance |
| **Modelo** | Multi-tenant com isolamento por usuário |
| **Licenciamento** | Por organização/agente |
| **Estágio** | MVP Feature Complete |

### 1.2 Proposta de Valor

O APOC é uma plataforma que combina **monitoramento de infraestrutura de rede** com **gestão de compliance corporativo**, permitindo que empresas:

- **Monitorem dispositivos de rede** (MikroTik) em tempo real com detecção de offline automática
- **Gerenciem frameworks de compliance** (ISO 27001, LGPD, SOC 2) com mapeamento de controles
- **Automatizem coleta de evidências** para auditorias conectando dados técnicos a controles
- **Centralizem gestão de riscos, políticas e incidentes** em um hub único
- **Recebam alertas inteligentes** quando dispositivos ficam offline ou versões ficam desatualizadas

### 1.3 Diferencial Competitivo

```
┌─────────────────────────────────────────────────────────────────┐
│              O QUE TORNA O APOC ÚNICO?                           │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Agente Python Multi-Device (1 agente → N roteadores)         │
│  ✓ Heartbeat Inteligente (detecção de offline em 90 segundos)   │
│  ✓ Alertas Automatizados (notificações em tempo real)           │
│  ✓ Mapeamento Técnico ↔ Compliance (CPU → ISO 27001 A.12.1)     │
│  ✓ Gestão de Políticas com Controle de Versão                   │
│  ✓ Exportação de Relatórios Client-Side (sem custo backend)     │
│  ✓ Senhas Ofuscadas em Base64 (segurança do config.ini)         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  React 18 + TypeScript + Vite + TailwindCSS + Shadcn/UI         │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND                                   │
│  Supabase (PostgreSQL + Auth + Edge Functions + Storage)        │
├─────────────────────────────────────────────────────────────────┤
│                     AGENTE LOCAL                                 │
│  Python 3.x (compilado para .exe via PyInstaller)               │
│  + Suporte Multi-Device com Config Centralizado                 │
└─────────────────────────────────────────────────────────────────┘
```

| Camada | Tecnologia | Função |
|--------|------------|--------|
| **Frontend** | React 18, TypeScript, Vite | Interface do usuário SPA |
| **Estilização** | TailwindCSS, Shadcn/UI | Design system componentizado |
| **Backend** | Supabase | BaaS serverless |
| **Banco de Dados** | PostgreSQL | Armazenamento relacional |
| **Autenticação** | Supabase Auth | JWT + Row Level Security |
| **Edge Functions** | Deno (Supabase Functions) | Lógica serverless |
| **Agente IoT** | Python → PyInstaller | Coleta de dados local |
| **Notificações** | Sistema próprio + RPC Functions | Alertas em tempo real |

---

## 2. Arquitetura de Dados (Backend)

### 2.1 Modelo de Dados Principal

#### 2.1.1 Tabela: `device_logs`

Armazena todos os dados de telemetria enviados pelos agentes de monitoramento.

```sql
CREATE TABLE public.device_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT NOT NULL,        -- Token único do agente
  router_name TEXT NOT NULL,        -- Nome identificador do roteador
  cpu_usage   INTEGER NOT NULL,     -- Uso de CPU (0-100%)
  version     TEXT NOT NULL,        -- Versão do agente
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultas rápidas por device_id
CREATE INDEX idx_device_logs_device_id ON device_logs(device_id);

-- Índice para consultas temporais
CREATE INDEX idx_device_logs_created_at ON device_logs(created_at DESC);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único do registro |
| `device_id` | TEXT | Token do agente (vinculado ao usuário) |
| `router_name` | TEXT | Nome do roteador MikroTik |
| `cpu_usage` | INTEGER | Percentual de uso de CPU (0-100) |
| `version` | TEXT | Versão do agente (ex: "1.0.0") |
| `created_at` | TIMESTAMPTZ | Timestamp de quando o dado foi recebido |

#### 2.1.2 Tabela: `notifications`

Sistema de notificações automatizado para alertas e eventos.

```sql
CREATE TABLE public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'info',     -- info, success, warning, danger
  priority      TEXT NOT NULL DEFAULT 'normal',   -- low, normal, high, critical
  read          BOOLEAN DEFAULT false,
  action_url    TEXT,
  action_label  TEXT,
  related_table TEXT,
  related_id    UUID,
  metadata      JSONB DEFAULT '{}',
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- RPC Function para criar notificações
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_priority TEXT DEFAULT 'normal',
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_related_table TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, priority, action_url, 
    action_label, related_table, related_id, metadata, expires_at
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority, p_action_url,
    p_action_label, p_related_table, p_related_id, p_metadata, p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2.1.3 Tabela: `policies`

Biblioteca de documentos de conformidade com controle de versão.

```sql
CREATE TABLE public.policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  version         TEXT NOT NULL DEFAULT '1.0',
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft, active, review
  owner           TEXT,
  approver        TEXT,
  approval_status TEXT DEFAULT 'draft',           -- draft, pending, approved, rejected
  approved_by     UUID,
  approved_at     TIMESTAMPTZ,
  effective_date  DATE,
  review_date     DATE,
  next_review     DATE,
  file_url        TEXT,
  tags            TEXT[],
  version_history JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### 2.1.4 Tabela: `frameworks`

Frameworks de compliance (ISO 27001, LGPD, SOC 2).

```sql
CREATE TABLE public.frameworks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  version          TEXT,
  status           TEXT NOT NULL DEFAULT 'active',
  compliance_score INTEGER DEFAULT 0,
  total_controls   INTEGER DEFAULT 0,
  passed_controls  INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
```

#### 2.1.5 Tabela: `controls`

Controles específicos de cada framework.

```sql
CREATE TABLE public.controls (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  framework_id   UUID REFERENCES frameworks(id),
  code           TEXT NOT NULL,
  title          TEXT NOT NULL,
  category       TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',  -- pending, implemented, partial, missing
  owner          TEXT,
  evidence_count INTEGER DEFAULT 0,
  last_verified  DATE,
  next_review    DATE,
  findings       TEXT[],
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Políticas RLS (Row Level Security)

```sql
-- device_logs: Inserção pública para agentes, leitura autenticada
ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert device logs" 
ON device_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view device logs" 
ON device_logs FOR SELECT USING (true);

-- notifications: Usuários só veem suas próprias notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON notifications FOR DELETE USING (auth.uid() = user_id);

-- policies: Usuários gerenciam suas próprias políticas
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own policies" 
ON policies FOR ALL USING (auth.uid() = user_id);

-- frameworks: Usuários gerenciam seus próprios frameworks
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own frameworks" 
ON frameworks FOR ALL USING (auth.uid() = user_id);

-- controls: Usuários gerenciam seus próprios controles
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own controls" 
ON controls FOR ALL USING (auth.uid() = user_id);
```

### 2.3 Edge Function: `ingest-metrics`

Endpoint serverless responsável por receber e validar dados dos agentes.

**URL:** `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics`

**Método:** `POST`

#### Fluxo de Validação

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Agente     │────▶│  Edge Function  │────▶│   device_logs   │
│   Python     │     │  ingest-metrics │     │   (Supabase)    │
└──────────────┘     └─────────────────┘     └─────────────────┘
       │                     │
       │  Headers:           │  Validações:
       │  - apikey (anon)    │  1. Verifica apikey
       │                     │  2. Valida agent_token
       │  Body:              │  3. Valida cpu (0-100)
       │  - agent_token      │  4. Valida campos obrigatórios
       │  - router_name      │  5. Salva no banco
       │  - cpu              │
       │  - version          │
```

#### Exemplo de Request

```bash
curl -X POST \
  'https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "agent_token": "apoc_agent_abc12345",
    "router_name": "MikroTik-Escritorio",
    "cpu": 45,
    "version": "1.0.0"
  }'
```

---

## 3. O Agente IoT Multi-Device

### 3.1 Visão Geral

O Agente APOC v2 suporta **monitoramento de múltiplos roteadores** em uma única instalação, com senhas ofuscadas em Base64 para maior segurança.

```
┌─────────────────────────────────────────────────────────────────┐
│                    REDE LOCAL DO CLIENTE                         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MikroTik   │  │   MikroTik   │  │   MikroTik   │          │
│  │  Escritório  │  │    Matriz    │  │    Filial    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────▼───────┐                             │
│                    │    Agente    │                             │
│                    │   APOC.exe   │                             │
│                    │ (Multi-Device)│                            │
│                    └──────┬───────┘                             │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS (a cada 5s por dispositivo)
                            ▼
             ┌──────────────────────────┐
             │    Supabase Cloud        │
             │    (Edge Function)       │
             └──────────────────────────┘
```

### 3.2 Novo Formato: `config.ini` Multi-Device

O arquivo de configuração agora suporta **seções dinâmicas** para cada roteador:

```ini
[supabase]
url = https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics
anon_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYnl4bnBwcnd3dWllYWJ3aGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDY4NTEsImV4cCI6MjA3MzE4Mjg1MX0.aHH2NWUQZnvV6FALdBIP5SB02YbrE8u12lXI1DtIbiw

[agent]
token = apoc_agent_XXXXXXXX
version = 1.0.0
intervalo = 5

[settings]
modo_simulacao = false

# ═══════════════════════════════════════════════════════════════
#  SEÇÃO DE ROTEADORES (Adicione quantos precisar)
# ═══════════════════════════════════════════════════════════════

[MikroTik-Escritorio]
host = 192.168.88.1
username = admin
password_b64 = YWRtaW4xMjM=
port = 8728

[MikroTik-Matriz]
host = 192.168.10.1
username = admin
password_b64 = c2VjcmV0UGFzczQ1Ng==
port = 8728

[MikroTik-Filial]
host = 10.0.0.1
username = monitoring
password_b64 = bW9uaXRvcjc4OQ==
port = 8728
```

### 3.3 Segurança de Senhas (Base64 Obfuscation)

Para evitar senhas em texto puro, o agente suporta **ofuscação em Base64**:

```python
import base64

# Codificar senha
senha_original = "admin123"
senha_b64 = base64.b64encode(senha_original.encode()).decode()
print(senha_b64)  # Output: YWRtaW4xMjM=

# Decodificar senha (dentro do agente)
senha_decoded = base64.b64decode(senha_b64).decode()
```

**Passos para o usuário:**
1. No terminal Python ou ferramenta online: `base64.b64encode(b'minha_senha').decode()`
2. Copiar o resultado (ex: `bWluaGFfc2VuaGE=`)
3. Colar em `password_b64` no `config.ini`

> ⚠️ **Nota de Segurança:** Base64 é ofuscação, não criptografia. Para ambientes críticos, considere variáveis de ambiente ou gestores de secrets.

### 3.4 Código Python do Agente Multi-Device

```python
#!/usr/bin/env python3
"""
APOC Agent - MikroTik Network Monitor (Multi-Device)
Versão: 1.2.0
Suporta múltiplos roteadores e senhas em Base64
"""

import configparser
import requests
import random
import time
import sys
import base64
from datetime import datetime

# Carregar configurações
config = configparser.ConfigParser()
config.read('config.ini')

# Configurações Supabase
SUPABASE_URL = config.get('supabase', 'url')
ANON_KEY = config.get('supabase', 'anon_key')

# Configurações do Agente
AGENT_TOKEN = config.get('agent', 'token')
VERSION = config.get('agent', 'version', fallback='1.2.0')
INTERVALO = config.getint('agent', 'intervalo', fallback=5)

# Configurações Gerais
MODO_SIMULACAO = config.getboolean('settings', 'modo_simulacao')

def log(message):
    """Imprime log com timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def decode_password(password_b64):
    """Decodifica senha em Base64"""
    try:
        return base64.b64decode(password_b64).decode('utf-8')
    except Exception as e:
        log(f"Erro ao decodificar senha: {e}")
        return None

def get_routers():
    """Retorna lista de roteadores configurados"""
    routers = []
    for section in config.sections():
        if section not in ['supabase', 'agent', 'settings', 'mikrotik']:
            routers.append({
                'name': section,
                'host': config.get(section, 'host'),
                'username': config.get(section, 'username'),
                'password_b64': config.get(section, 'password_b64', fallback=None),
                'password': config.get(section, 'password', fallback=None),
                'port': config.getint(section, 'port', fallback=8728)
            })
    return routers

def get_cpu_usage_simulado():
    """Gera valor de CPU simulado para testes"""
    return random.randint(10, 85)

def get_cpu_usage_real(router):
    """Coleta CPU real do MikroTik via API RouterOS"""
    try:
        import librouteros
        
        # Decodificar senha se estiver em Base64
        password = router['password']
        if router.get('password_b64'):
            password = decode_password(router['password_b64'])
            if password is None:
                return None
        
        api = librouteros.connect(
            host=router['host'],
            username=router['username'],
            password=password,
            port=router['port']
        )
        resources = api.path('system', 'resource')
        for r in resources:
            return int(r.get('cpu-load', 0))
    except Exception as e:
        log(f"[{router['name']}] Erro ao conectar: {e}")
        return None

def send_metrics(router_name, cpu):
    """Envia métricas para o Supabase"""
    headers = {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
    }
    
    payload = {
        'agent_token': AGENT_TOKEN,
        'router_name': router_name,
        'cpu': cpu,
        'version': VERSION
    }
    
    try:
        response = requests.post(SUPABASE_URL, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            log(f"[{router_name}] ✓ Dados enviados: CPU={cpu}%")
            return True
        else:
            log(f"[{router_name}] ✗ Erro HTTP {response.status_code}: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        log(f"[{router_name}] ✗ Erro de conexão: {e}")
        return False

def main():
    """Loop principal do agente"""
    log("=" * 60)
    log(f"APOC Agent v{VERSION} - Multi-Device")
    log("=" * 60)
    log(f"Modo: {'SIMULAÇÃO' if MODO_SIMULACAO else 'PRODUÇÃO'}")
    log(f"Intervalo: {INTERVALO}s")
    
    # Carregar roteadores
    routers = get_routers()
    if not routers:
        log("ERRO: Nenhum roteador configurado!")
        log("Configure ao menos uma seção [NOME_ROTEADOR] no config.ini")
        sys.exit(1)
    
    log(f"Roteadores configurados: {len(routers)}")
    for router in routers:
        log(f"  • {router['name']} ({router['host']})")
    log("=" * 60)
    
    while True:
        try:
            for router in routers:
                if MODO_SIMULACAO:
                    cpu = get_cpu_usage_simulado()
                else:
                    cpu = get_cpu_usage_real(router)
                    if cpu is None:
                        log(f"[{router['name']}] Pulando envio - falha na coleta")
                        continue
                
                send_metrics(router['name'], cpu)
            
            time.sleep(INTERVALO)
            
        except KeyboardInterrupt:
            log("Agente encerrado pelo usuário")
            sys.exit(0)
        except Exception as e:
            log(f"Erro inesperado: {e}")
            time.sleep(INTERVALO)

if __name__ == "__main__":
    main()
```

### 3.5 Compilação para Windows

```bash
# Instalar dependências
pip install pyinstaller requests librouteros

# Compilar para executável único
pyinstaller --onefile --name "APOC-Agent" main.py

# O executável estará em: dist/APOC-Agent.exe
```

---

## 4. Sistema de Resiliência e Alertas

### 4.1 Lógica de Heartbeat (Monitoramento de Disponibilidade)

O sistema detecta automaticamente quando um agente para de enviar dados.

#### Regra de Negócio

```
IF (current_time - last_log_timestamp) > 90 segundos
THEN status = "Offline"
ELSE status = "Online"
```

#### Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                   HEARTBEAT DETECTION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │   Agente     │  Envia dados a cada 5s
  │   MikroTik   │─────────────────────┐
  └──────────────┘                     │
                                       ▼
                          ┌─────────────────────┐
                          │   device_logs       │
                          │  (Supabase Table)   │
                          └──────────┬──────────┘
                                     │
                                     │ Timestamp: created_at
                                     ▼
                          ┌─────────────────────┐
                          │   Frontend React    │
                          │  (useNetworkAlerts) │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             ┌────────────┐   ┌────────────┐   ┌────────────┐
             │ Last Log   │   │   Timer    │   │  Diff      │
             │ Timestamp  │   │ (1s tick)  │   │ Calculate  │
             └────────────┘   └────────────┘   └────────────┘
                                                      │
                                  ┌───────────────────┼───────────────────┐
                                  │                   │                   │
                                  ▼                   ▼                   ▼
                           diff <= 90s         diff > 90s          Transition
                           ┌──────────┐        ┌──────────┐        Detected
                           │  Status  │        │  Status  │        ┌──────────┐
                           │  ONLINE  │        │  OFFLINE │        │  Create  │
                           │    🟢    │        │    🔴    │        │  Notif   │
                           └──────────┘        └──────────┘        └────┬─────┘
                                                                         │
                                                                         ▼
                                                            ┌─────────────────────┐
                                                            │  notifications      │
                                                            │  (Supabase RPC)     │
                                                            └─────────────────────┘
```

### 4.2 Automação de Notificações

O hook `useNetworkAlerts` detecta transições de estado e cria notificações automaticamente.

#### Código do Hook

```typescript
// src/hooks/useNetworkAlerts.tsx
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const COOLDOWN_MS = 60000; // 60 segundos entre alertas

export const useNetworkAlerts = (isOnline: boolean) => {
  const { user } = useAuth();
  const wasOnlineRef = useRef<boolean | null>(null);
  const lastOfflineAlertRef = useRef<number>(0);
  const lastOnlineAlertRef = useRef<number>(0);

  useEffect(() => {
    // Ignora a primeira renderização (inicialização)
    if (wasOnlineRef.current === null) {
      wasOnlineRef.current = isOnline;
      return;
    }

    // Detecta transição: Online → Offline
    const transitionedToOffline = wasOnlineRef.current === true && isOnline === false;
    
    // Detecta transição: Offline → Online (recuperação)
    const transitionedToOnline = wasOnlineRef.current === false && isOnline === true;

    if (transitionedToOffline && user) {
      const now = Date.now();
      const timeSinceLastAlert = now - lastOfflineAlertRef.current;

      // Cooldown anti-spam: só cria alerta se passou 60s
      if (timeSinceLastAlert > COOLDOWN_MS) {
        createOfflineNotification(user.id);
        lastOfflineAlertRef.current = now;
      }
    }

    if (transitionedToOnline && user) {
      const now = Date.now();
      const timeSinceLastAlert = now - lastOnlineAlertRef.current;

      if (timeSinceLastAlert > COOLDOWN_MS) {
        createOnlineNotification(user.id);
        lastOnlineAlertRef.current = now;
      }
    }

    wasOnlineRef.current = isOnline;
  }, [isOnline, user]);

  const createOfflineNotification = async (userId: string) => {
    const currentTime = format(new Date(), 'HH:mm:ss');
    
    await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_title: '🔴 Alerta Crítico: Dispositivo Offline',
      p_message: `O Agente MikroTik parou de enviar dados às ${currentTime}. Verifique a conexão do dispositivo.`,
      p_type: 'danger',
      p_priority: 'high',
      p_related_table: 'device_logs',
      p_metadata: {
        event: 'device_offline',
        detected_at: new Date().toISOString()
      }
    });
  };

  const createOnlineNotification = async (userId: string) => {
    const currentTime = format(new Date(), 'HH:mm:ss');
    
    await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_title: '🟢 Agente de Monitoramento Recuperado',
      p_message: `O Agente MikroTik voltou a enviar dados às ${currentTime}. Conexão restabelecida com sucesso.`,
      p_type: 'success',
      p_priority: 'normal',
      p_related_table: 'device_logs',
      p_metadata: {
        event: 'device_online',
        recovered_at: new Date().toISOString()
      }
    });
  };
};
```

### 4.3 Componente Visual: Notification Bell

O sistema exibe um sino com badge de contagem no header.

```typescript
// src/components/notifications/NotificationCenter.tsx
const NotificationCenter = () => {
  const { notifications, unreadCount } = useNotifications();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          {notifications.map(notif => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
```

### 4.4 Tipos de Alertas Automatizados

| Evento | Trigger | Tipo | Prioridade |
|--------|---------|------|------------|
| **Dispositivo Offline** | Last seen > 90s | danger | high |
| **Dispositivo Recuperado** | Volta a enviar dados | success | normal |
| **Versão Desatualizada** | version < "7.10.0" | warning | normal |
| **CPU Alta** | cpu_usage > 85% | warning | normal |

---

## 5. Módulos de Compliance

### 5.1 Frameworks Hub

O sistema mapeia **dados técnicos** para **controles de compliance**, criando a ponte entre monitoramento e auditoria.

#### Exemplo de Mapeamento

```
┌─────────────────────────────────────────────────────────────────┐
│           MAPEAMENTO: Dados Técnicos → Controles                 │
├─────────────────────────────────────────────────────────────────┤
│  device_logs.cpu_usage  →  ISO 27001 - A.12.1.3                 │
│  "Capacidade de Recursos"                                        │
│                                                                  │
│  device_logs.created_at →  ISO 27001 - A.12.4.1                 │
│  "Log de Eventos"                                                │
│                                                                  │
│  notifications (offline) → ISO 27001 - A.16.1.2                 │
│  "Resposta a Incidentes"                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Framework: ISO 27001

| Controle | Título | Evidência Automática |
|----------|--------|---------------------|
| **A.12.1** | Capacidade de Recursos | ✅ CPU Usage (device_logs) |
| **A.12.4** | Log e Monitoramento | ✅ Timestamps (device_logs) |
| **A.16.1** | Gestão de Incidentes | ✅ Alertas (notifications) |

### 5.2 Componente: Framework Details Sheet

Ao clicar em um card de framework, abre um drawer lateral com detalhes dos controles.

```typescript
// src/components/controls/FrameworkDetailsSheet.tsx
<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
  <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>{selectedFramework?.name}</SheetTitle>
    </SheetHeader>
    
    <div className="space-y-4">
      {/* Resumo de Compliance */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>Implementados</span>
            <CheckCircle2 className="text-green-500" />
            <span>{implementedCount}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Controles */}
      {controls.map(control => (
        <Card key={control.id}>
          <CardHeader>
            <CardTitle>{control.code} - {control.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {control.status === 'implemented' && <CheckCircle2 className="text-green-500" />}
              {control.evidence && (
                <Badge variant="outline">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  {control.evidence}
                </Badge>
              )}
              {control.automated && (
                <Badge variant="secondary">
                  <Zap className="w-3 h-3 mr-1" />
                  Automatizado
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </SheetContent>
</Sheet>
```

### 5.3 Gestão de Políticas (PolicyDocuments)

Biblioteca de documentos de conformidade com:

- **Upload de PDFs** → Supabase Storage (`documents` bucket)
- **Controle de Versão** → Campo editável `version` (ex: v1.0, v2.3)
- **Data de Aprovação** → Campo `effective_date`
- **Status Visual** → "Em Vigor" (Verde), "Revisão Necessária" (Amarelo), "Não Iniciado" (Cinza)

#### Templates Predefinidos

```typescript
const DOCUMENT_TEMPLATES = [
  { name: 'Política de Segurança da Informação', category: 'ISO 27001' },
  { name: 'Código de Ética e Conduta', category: 'Governança' },
  { name: 'Política de Privacidade (LGPD)', category: 'LGPD' },
  { name: 'Plano de Continuidade de Negócios (BCP)', category: 'ISO 27001' },
  { name: 'Política de Controle de Acesso', category: 'ISO 27001' },
  { name: 'Procedimento de Gestão de Incidentes', category: 'ISO 27001' },
  { name: 'Política de Backup e Recuperação', category: 'ISO 27001' },
  { name: 'Termos de Uso de TI', category: 'Governança' }
];
```

#### Barra de Progresso de Conformidade

```typescript
const documentsInForce = documents.filter(doc => doc.status === 'active').length;
const compliancePercentage = Math.round((documentsInForce / documents.length) * 100);

<Progress value={compliancePercentage} className="h-4" />
<span className="text-sm font-medium">{compliancePercentage}%</span>
```

---

## 6. Relatórios e Evidências

### 6.1 Exportação Client-Side (Print-to-PDF)

O sistema gera relatórios em PDF **sem custo de backend**, usando apenas CSS e JavaScript nativo.

#### Implementação Técnica

```typescript
const handleExportReport = () => {
  window.print();
};
```

#### Regras CSS `@media print`

```css
@media print {
  /* ===== OCULTAR ELEMENTOS DE NAVEGAÇÃO ===== */
  .sidebar, 
  header, 
  footer, 
  .print-hide,
  button:not(.print-show) {
    display: none !important;
  }
  
  /* ===== FORÇAR CORES PARA IMPRESSÃO ===== */
  body {
    background: white !important;
    color: black !important;
  }
  
  /* ===== CARDS COM BORDA PARA DEFINIÇÃO ===== */
  .card {
    background: white !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: none !important;
    page-break-inside: avoid;
  }
  
  /* ===== CABEÇALHO DO DOCUMENTO ===== */
  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
  }
  
  .print-header::before {
    content: "Relatório de Status APOC";
    font-size: 24px;
    font-weight: bold;
  }
  
  .print-header::after {
    content: "Gerado em: " attr(data-timestamp);
    display: block;
    font-size: 12px;
    color: #666;
    margin-top: 5px;
  }
  
  /* ===== RODAPÉ DO DOCUMENTO ===== */
  .print-footer {
    display: block !important;
    position: fixed;
    bottom: 0;
    width: 100%;
    text-align: center;
    font-size: 10px;
    color: #666;
    border-top: 1px solid #e5e7eb;
    padding-top: 5px;
  }
  
  .print-footer::after {
    content: "Gerado automaticamente pela plataforma APOC Compliance";
  }
  
  /* ===== GRÁFICOS E TABELAS ===== */
  .recharts-wrapper {
    page-break-inside: avoid;
  }
  
  table {
    page-break-inside: avoid;
    border-collapse: collapse;
  }
  
  /* ===== QUEBRAS DE PÁGINA ===== */
  .page-break {
    page-break-before: always;
  }
}
```

#### Estrutura de um Relatório

```html
<div className="print-container">
  {/* Cabeçalho (só aparece no PDF) */}
  <div className="print-header" data-timestamp="2025-12-01 14:30">
    <!-- Conteúdo gerado via CSS ::before e ::after -->
  </div>
  
  {/* Conteúdo Principal */}
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Resumo de Conformidade</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={85} />
        <p>ISO 27001: 85% compliant</p>
      </CardContent>
    </Card>
    
    <div className="page-break"></div>
    
    <Card>
      <CardHeader>
        <CardTitle>Dispositivos Monitorados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>CPU</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map(device => (
              <TableRow key={device.id}>
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.status}</TableCell>
                <TableCell>{device.cpu}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
  
  {/* Rodapé (só aparece no PDF) */}
  <div className="print-footer">
    <!-- Conteúdo gerado via CSS ::after -->
  </div>
</div>
```

### 6.2 Tipos de Relatórios Disponíveis

| Relatório | Fonte de Dados | Uso |
|-----------|---------------|-----|
| **Status de Rede** | device_logs | Auditoria de infraestrutura |
| **Conformidade por Framework** | frameworks, controls | Auditorias ISO/LGPD |
| **Gestão de Riscos** | risks, vendors | Due diligence |
| **Inventário de Ativos** | device_logs (agrupado) | Gestão de ativos |
| **Políticas Vigentes** | policies (status=active) | Documentação oficial |

### 6.3 Benefícios da Abordagem Client-Side

✅ **Sem custo de processamento backend**  
✅ **Geração instantânea**  
✅ **Funciona offline** (depois dos dados carregados)  
✅ **Customização total via CSS**  
✅ **Compatível com todos os browsers modernos**

---

## 7. Funcionalidades do Frontend

### 7.1 Monitoramento em Tempo Real

O componente `NetworkMonitoring` exibe métricas de rede em um gráfico de área interativo.

#### Características

| Feature | Valor |
|---------|-------|
| **Tipo de Gráfico** | Area Chart (Recharts) |
| **Taxa de Atualização** | 5 segundos |
| **Histórico Exibido** | Últimos 50 registros |
| **Métricas** | CPU Usage (%), Timestamp |

### 7.2 Inventário de Ativos (AssetInventory)

Nova página que exibe:

- **Fleet Summary Cards**: Total, Healthy, At-Risk, Distinct Versions
- **Real-Time Device Table**: Status (Online/Offline), Host Name, Version, CPU, Last Seen
- **Version Checking**: Alerta para versões < "7.10.0"
- **Polling + Realtime**: Atualiza a cada 10s + WebSocket

### 7.3 Controles e Frameworks

- **Cards Clicáveis**: Hover effect + cursor pointer
- **Sheet Lateral**: Detalhes dos controles ao clicar
- **Indicador de Automação**: Badge com raio (⚡) mostrando controles automatizados
- **Última Verificação**: Timestamp relativo (ex: "Há 2 minutos")
- **Exportação de Relatório**: Botão de download no card

### 7.4 Políticas e Documentos

- **Biblioteca de Cards**: 8 documentos predefinidos
- **Upload de PDFs**: Conectado ao bucket `documents` do Supabase
- **Status Visual**: Cores semânticas (Verde/Amarelo/Cinza)
- **Controle de Versão**: Campo editável inline
- **Barra de Progresso**: Percentual de documentos implementados

---

## 8. Guia de Instalação

### 8.1 Pré-requisitos

- Windows 10/11 (64-bit)
- Conexão com a internet
- Acesso aos roteadores MikroTik (IPs + credenciais)
- Conta ativa no APOC Dashboard

### 8.2 Passo a Passo

```
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 1: DOWNLOAD                                               │
│  • Acesse o Dashboard APOC                                       │
│  • Vá em Integrações → MikroTik                                  │
│  • Clique em "Baixar Agente (.zip)"                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 2: EXTRAIR                                                │
│  • Extraia o ZIP em uma pasta permanente                         │
│  • Ex: C:\APOC-Agent\                                            │
│  • Conteúdo: APOC-Agent.exe + config.ini                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 3: CONFIGURAR                                             │
│  • Abra config.ini com Bloco de Notas                            │
│  • Copie o token do Dashboard e cole em [agent] token            │
│  • Para CADA roteador, adicione uma seção [NOME]                 │
│  • Codifique as senhas em Base64: python -c "import base64;      │
│    print(base64.b64encode(b'senha').decode())"                   │
│  • Defina modo_simulacao = false para produção                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 4: EXECUTAR                                               │
│  • Dê duplo-clique em APOC-Agent.exe                             │
│  • Uma janela de terminal abrirá mostrando os logs               │
│  • Verifique no Dashboard se os dados estão chegando             │
│  • Vá em "Inventário de Ativos" para ver todos os dispositivos  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 5: AUTOMATIZAR (Opcional)                                 │
│  • Crie um atalho do .exe na pasta de Inicialização              │
│  • Windows+R → shell:startup → Colar atalho                      │
│  • O agente iniciará automaticamente com o Windows               │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Verificação Multi-Device

| Indicador | Esperado |
|-----------|----------|
| Terminal do Agente | Mensagens "✓ Dados enviados" para CADA dispositivo |
| Dashboard → Inventário | Todos os roteadores listados na tabela |
| Status | Badge "🟢 Online" para cada dispositivo ativo |
| Gráfico | Dados de todos os dispositivos (filtráveis) |

---

## 9. Stack Completa

### 9.1 Tabelas do Supabase (Completo)

| Tabela | Função |
|--------|--------|
| `device_logs` | Telemetria dos agentes (CPU, versão, timestamp) |
| `notifications` | Sistema de alertas e notificações |
| `policies` | Biblioteca de documentos de conformidade |
| `frameworks` | Frameworks de compliance (ISO 27001, LGPD, SOC 2) |
| `controls` | Controles específicos de cada framework |
| `risks` | Registro de riscos corporativos |
| `vendors` | Gestão de fornecedores e third-parties |
| `risk_assessments` | Avaliações de risco de terceiros |
| `audits` | Auditorias internas e externas |
| `evidence` | Evidências de controles |
| `incidents` | Incidentes de segurança |
| `incident_playbooks` | Playbooks de resposta a incidentes |
| `bcp_plans` | Planos de continuidade de negócios |
| `access_anomalies` | Anomalias de acesso detectadas |
| `control_assignments` | Atribuições de controles a responsáveis |
| `control_tests` | Testes automatizados de controles |
| `integration_oauth_tokens` | Tokens OAuth de integrações |
| `integration_webhooks` | Webhooks de integrações externas |
| `integration_status` | Status de saúde das integrações |
| `integration_evidence_mapping` | Mapeamento de evidências automáticas |
| `profiles` | Perfis de usuários |
| `user_roles` | Sistema de permissões (RBAC) |
| `user_deletion_requests` | Fluxo de exclusão de usuários (compliance) |
| `audit_logs` | Logs de auditoria de ações do sistema |
| `tasks` | Gerenciamento de tarefas |

### 9.2 Edge Functions

| Nome | Função |
|------|--------|
| `ingest-metrics` | Recebe telemetria dos agentes |
| `google-oauth-start` | Inicia fluxo OAuth Google Workspace |
| `google-oauth-callback` | Callback OAuth Google |
| `google-oauth-refresh` | Renova tokens OAuth |
| `google-oauth-revoke` | Revoga tokens OAuth |
| `google-workspace-sync` | Sincroniza dados do Google Workspace |
| `azure-oauth-start` | Inicia fluxo OAuth Azure AD |
| `azure-oauth-callback` | Callback OAuth Azure |
| `azure-integration` | Integração com Azure AD |
| `aws-integration` | Integração com AWS IAM |

### 9.3 Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `evidence` | Não | Evidências de controles (PDFs, screenshots) |
| `documents` | Não | Documentos de políticas e procedimentos |

### 9.4 Database Functions (RPC)

| Função | Descrição |
|--------|-----------|
| `create_notification` | Cria notificação para um usuário |
| `has_role` | Verifica se usuário tem uma role específica |
| `get_user_roles` | Retorna todas as roles de um usuário |
| `assign_first_admin` | Atribui role admin ao primeiro usuário |

---

## 10. Roadmap Futuro

### 10.1 Versão 3.1 (Q1 2026)

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Alertas por E-mail** | Integração com send-notification-email function | Alta |
| **Dashboard Mobile** | PWA responsivo para monitoramento mobile | Alta |
| **Histórico Extendido** | Gráficos com dados de 7/30/90 dias | Média |
| **Agente Linux** | Suporte a servidores Linux | Média |

### 10.2 Versão 4.0 (Q2-Q3 2026)

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Stripe Payments** | Cobrança por agente/mês | Alta |
| **API Pública** | REST API para integrações terceiras | Média |
| **White-label** | Personalização da marca para MSPs | Média |
| **Alertas Slack/Teams** | Integração com ferramentas de comunicação | Baixa |

### 10.3 Backlog Técnico

- [ ] Implementar testes automatizados (Jest + Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento de erros (Sentry)
- [ ] Rate limiting na Edge Function
- [ ] Compressão de dados históricos (particionamento de tabelas)
- [ ] Criptografia E2E para senhas no config.ini
- [ ] Suporte a SNMP além da API RouterOS
- [ ] Exportação de relatórios em formatos adicionais (Excel, CSV)

---

## 📎 Anexos

### A. Diagrama de Arquitetura Completo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser/PWA)                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      React SPA + TypeScript                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │Dashboard │ │  Assets  │ │Frameworks│ │ Policies │ │  Audit   │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS + WebSocket
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE CLOUD (BaaS)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │    Auth     │  │  PostgreSQL │  │   Storage   │  │  Edge Fn    │       │
│  │  (JWT+RLS)  │  │  (25 tabelas)│  │  (Buckets)  │  │  (Deno)     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                          │                                  │               │
│                          │ Realtime (WebSocket)            │               │
│                          ▼                                  │               │
│                   ┌──────────────┐                         │               │
│                   │ device_logs  │◀────────────────────────┘               │
│                   │notifications │   ingest-metrics                        │
│                   └──────────────┘                                         │
└────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ HTTPS POST (a cada 5s)
                                      │
┌────────────────────────────────────────────────────────────────────────────┐
│                      REDE LOCAL DO CLIENTE                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                            │
│  │ MikroTik 1 │  │ MikroTik 2 │  │ MikroTik N │                            │
│  │ Escritório │  │   Matriz   │  │   Filial   │                            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                            │
│        │               │               │                                   │
│        └───────────────┼───────────────┘                                   │
│                        │                                                   │
│                 ┌──────▼──────┐                                            │
│                 │ APOC Agent  │                                            │
│                 │ (Python.exe)│                                            │
│                 │ Multi-Device│                                            │
│                 └─────────────┘                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### B. Credenciais de Ambiente

| Recurso | Valor |
|---------|-------|
| **Supabase Project ID** | `ofbyxnpprwwuieabwhdo` |
| **Supabase URL** | `https://ofbyxnpprwwuieabwhdo.supabase.co` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (ver config.ini) |
| **Edge Function URL** | `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics` |

### C. Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **Heartbeat** | Sistema de detecção de disponibilidade baseado em timestamp |
| **RLS** | Row Level Security - isolamento de dados por usuário |
| **Edge Function** | Função serverless executada em Deno |
| **Multi-Device** | Capacidade de um agente monitorar múltiplos dispositivos |
| **Base64 Obfuscation** | Codificação de senhas em Base64 para dificultar leitura |
| **Client-Side PDF** | Geração de PDF no navegador usando `window.print()` |
| **Framework Mapping** | Mapeamento de dados técnicos para controles de compliance |

---

> **Documento gerado para o APOC MVP v3.0 (Feature Complete)**  
> Este é o documento mestre oficial da arquitetura do sistema.  
> Para dúvidas ou contribuições, contate a equipe de desenvolvimento.

**Última atualização:** Dezembro 2025  
**Versão:** 3.0  
**Status:** Production Ready 🚀
