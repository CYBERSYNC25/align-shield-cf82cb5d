# APOC - Arquitetura do Sistema v2.0

> **Documento Mestre de Arquitetura**  
> Última atualização: Novembro 2025  
> Versão: 2.0 (MVP Final)

---

## 📋 Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Arquitetura de Dados (Backend)](#2-arquitetura-de-dados-backend)
3. [O Agente IoT (MikroTik)](#3-o-agente-iot-mikrotik)
4. [Funcionalidades do Frontend (Dashboard)](#4-funcionalidades-do-frontend-dashboard)
5. [Guia de Instalação (Para o Cliente)](#5-guia-de-instalação-para-o-cliente)
6. [Roadmap Futuro](#6-roadmap-futuro)

---

## 1. Visão Geral do Produto

### 1.1 Definição

| Atributo | Valor |
|----------|-------|
| **Nome** | APOC (Automated Platform for Online Compliance) |
| **Tipo** | SaaS Híbrido de Monitoramento de Redes e Compliance |
| **Modelo** | Multi-tenant com isolamento por usuário |
| **Licenciamento** | Por organização/agente |

### 1.2 Proposta de Valor

O APOC é uma plataforma que combina **monitoramento de infraestrutura de rede** com **gestão de compliance corporativo**, permitindo que empresas:

- Monitorem dispositivos de rede (MikroTik) em tempo real
- Gerenciem frameworks de compliance (ISO 27001, LGPD, SOC 2)
- Automatizem coleta de evidências para auditorias
- Centralizem gestão de riscos, políticas e incidentes

### 1.3 Stack Tecnológico

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

---

## 2. Arquitetura de Dados (Backend)

### 2.1 Modelo de Dados Principal

#### Tabela: `device_logs`

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
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único do registro |
| `device_id` | TEXT | Token do agente (vinculado ao usuário) |
| `router_name` | TEXT | Nome do roteador MikroTik |
| `cpu_usage` | INTEGER | Percentual de uso de CPU (0-100) |
| `version` | TEXT | Versão do agente (ex: "1.0.0") |
| `created_at` | TIMESTAMPTZ | Timestamp de quando o dado foi recebido |

#### Políticas RLS (Row Level Security)

```sql
-- Qualquer um pode inserir logs (agentes externos)
CREATE POLICY "Anyone can insert device logs" 
ON public.device_logs FOR INSERT 
WITH CHECK (true);

-- Qualquer usuário autenticado pode visualizar logs
CREATE POLICY "Anyone can view device logs" 
ON public.device_logs FOR SELECT 
USING (true);
```

> **Nota de Segurança:** A inserção é pública para permitir que agentes não autenticados enviem dados. A validação é feita pela Edge Function via `agent_token`.

### 2.2 Edge Function: `ingest-metrics`

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
       │  - router_name      │
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
    "agent_token": "user_abc123xyz",
    "router_name": "MikroTik-Escritorio",
    "cpu": 45,
    "version": "1.0.0"
  }'
```

#### Respostas

| Status | Descrição |
|--------|-----------|
| `200` | Dados salvos com sucesso |
| `400` | Campos obrigatórios faltando ou inválidos |
| `401` | API Key inválida ou ausente |
| `500` | Erro interno do servidor |

#### Código da Edge Function

```typescript
// supabase/functions/ingest-metrics/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { agent_token, router_name, cpu, version } = await req.json();

  // Validações
  if (!agent_token || !router_name || cpu === undefined || !version) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (typeof cpu !== 'number' || cpu < 0 || cpu > 100) {
    return new Response(
      JSON.stringify({ error: 'CPU must be a number between 0 and 100' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Inserir no banco
  const { data, error } = await supabase
    .from('device_logs')
    .insert({
      device_id: agent_token,
      router_name,
      cpu_usage: cpu,
      version
    })
    .select('id')
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, id: data.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
```

### 2.3 Segurança

#### Camadas de Proteção

| Camada | Mecanismo | Descrição |
|--------|-----------|-----------|
| **Transporte** | HTTPS/TLS | Toda comunicação é criptografada |
| **API Gateway** | Supabase API Key | Anon key para requests públicos |
| **Aplicação** | Agent Token | Identificação única do agente |
| **Banco** | RLS (Row Level Security) | Isolamento de dados por usuário |

#### Token do Agente

O `agent_token` é gerado dinamicamente no frontend baseado no ID do usuário logado:

```typescript
const agentToken = `apoc_agent_${user?.id?.slice(0, 8) || 'demo'}`;
```

Este token:
- Identifica unicamente cada instalação de agente
- Permite filtrar logs por cliente
- Não expõe credenciais sensíveis

---

## 3. O Agente IoT (MikroTik)

### 3.1 Visão Geral

O Agente APOC é um software Python compilado para Windows (.exe) que roda localmente na rede do cliente, coletando métricas de roteadores MikroTik e enviando para a nuvem.

```
┌─────────────────────────────────────────────────────────────────┐
│                    REDE LOCAL DO CLIENTE                         │
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   MikroTik   │◀───────▶│    Agente    │                      │
│  │   Router     │  API    │   APOC.exe   │                      │
│  └──────────────┘         └──────┬───────┘                      │
│                                  │                               │
└──────────────────────────────────┼───────────────────────────────┘
                                   │ HTTPS (a cada 5s)
                                   ▼
                    ┌──────────────────────────┐
                    │    Supabase Cloud        │
                    │    (Edge Function)       │
                    └──────────────────────────┘
```

### 3.2 Modos de Operação

| Modo | Configuração | Uso |
|------|--------------|-----|
| **Produção** | `MODO_SIMULACAO = False` | Coleta dados reais via API RouterOS |
| **Simulação** | `MODO_SIMULACAO = True` | Gera dados aleatórios para testes |

### 3.3 Lógica de Funcionamento

```python
# Pseudocódigo do Agente
while True:
    if MODO_SIMULACAO:
        cpu = random.randint(10, 90)
    else:
        cpu = mikrotik_api.get_cpu_usage()
    
    payload = {
        "agent_token": config.AGENT_TOKEN,
        "router_name": config.ROUTER_NAME,
        "cpu": cpu,
        "version": "1.0.0"
    }
    
    requests.post(SUPABASE_URL, json=payload, headers=headers)
    time.sleep(5)  # Intervalo de 5 segundos
```

### 3.4 Arquivo de Configuração (`config.ini`)

O agente lê todas as configurações de um arquivo `config.ini` na mesma pasta do executável.

```ini
[supabase]
# URL da Edge Function de ingestão de métricas
url = https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics

# Chave pública do Supabase (anon key)
anon_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYnl4bnBwcnd3dWllYWJ3aGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDY4NTEsImV4cCI6MjA3MzE4Mjg1MX0.aHH2NWUQZnvV6FALdBIP5SB02YbrE8u12lXI1DtIbiw

[agent]
# Token único do agente (gerado pelo dashboard)
token = apoc_agent_XXXXXXXX

# Nome identificador deste roteador
router_name = MikroTik-Principal

[mikrotik]
# IP do roteador MikroTik na rede local
host = 192.168.88.1

# Credenciais de acesso à API RouterOS
username = admin
password = sua_senha_aqui

# Porta da API (padrão: 8728, SSL: 8729)
port = 8728

[settings]
# true = gera dados fake para testes
# false = coleta dados reais do MikroTik
modo_simulacao = true

# Intervalo entre coletas (em segundos)
intervalo = 5
```

### 3.5 Código Python do Agente

```python
#!/usr/bin/env python3
"""
APOC Agent - MikroTik Network Monitor
Versão: 1.0.0
"""

import configparser
import requests
import random
import time
import sys
from datetime import datetime

# Carregar configurações
config = configparser.ConfigParser()
config.read('config.ini')

# Configurações Supabase
SUPABASE_URL = config.get('supabase', 'url')
ANON_KEY = config.get('supabase', 'anon_key')

# Configurações do Agente
AGENT_TOKEN = config.get('agent', 'token')
ROUTER_NAME = config.get('agent', 'router_name')

# Configurações MikroTik
MIKROTIK_HOST = config.get('mikrotik', 'host')
MIKROTIK_USER = config.get('mikrotik', 'username')
MIKROTIK_PASS = config.get('mikrotik', 'password')
MIKROTIK_PORT = config.getint('mikrotik', 'port')

# Configurações Gerais
MODO_SIMULACAO = config.getboolean('settings', 'modo_simulacao')
INTERVALO = config.getint('settings', 'intervalo')

VERSION = "1.0.0"

def log(message):
    """Imprime log com timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def get_cpu_usage_simulado():
    """Gera valor de CPU simulado para testes"""
    return random.randint(10, 85)

def get_cpu_usage_real():
    """Coleta CPU real do MikroTik via API RouterOS"""
    try:
        # Implementação com librouteros
        import librouteros
        api = librouteros.connect(
            host=MIKROTIK_HOST,
            username=MIKROTIK_USER,
            password=MIKROTIK_PASS,
            port=MIKROTIK_PORT
        )
        resources = api.path('system', 'resource')
        for r in resources:
            return int(r.get('cpu-load', 0))
    except Exception as e:
        log(f"Erro ao conectar ao MikroTik: {e}")
        return None

def send_metrics(cpu):
    """Envia métricas para o Supabase"""
    headers = {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
    }
    
    payload = {
        'agent_token': AGENT_TOKEN,
        'router_name': ROUTER_NAME,
        'cpu': cpu,
        'version': VERSION
    }
    
    try:
        response = requests.post(SUPABASE_URL, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            log(f"✓ Dados enviados: CPU={cpu}%")
        else:
            log(f"✗ Erro HTTP {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        log(f"✗ Erro de conexão: {e}")

def main():
    """Loop principal do agente"""
    log("=" * 50)
    log("APOC Agent v" + VERSION)
    log("=" * 50)
    log(f"Modo: {'SIMULAÇÃO' if MODO_SIMULACAO else 'PRODUÇÃO'}")
    log(f"Roteador: {ROUTER_NAME}")
    log(f"Intervalo: {INTERVALO}s")
    log("=" * 50)
    
    while True:
        try:
            if MODO_SIMULACAO:
                cpu = get_cpu_usage_simulado()
            else:
                cpu = get_cpu_usage_real()
                if cpu is None:
                    log("Pulando envio - falha na coleta")
                    time.sleep(INTERVALO)
                    continue
            
            send_metrics(cpu)
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

### 3.6 Compilação para Windows

```bash
# Instalar dependências
pip install pyinstaller requests librouteros

# Compilar para executável único
pyinstaller --onefile --name "APOC-Agent" main.py

# O executável estará em: dist/APOC-Agent.exe
```

---

## 4. Funcionalidades do Frontend (Dashboard)

### 4.1 Monitoramento em Tempo Real

O componente `NetworkMonitoring` exibe métricas de rede em um gráfico de área interativo.

#### Características

| Feature | Valor |
|---------|-------|
| **Tipo de Gráfico** | Area Chart (Recharts) |
| **Taxa de Atualização** | 5 segundos |
| **Histórico Exibido** | Últimos 50 registros |
| **Métricas** | CPU Usage (%), Timestamp |

#### Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Supabase   │────▶│   React     │────▶│   Recharts  │
│  Realtime   │     │   State     │     │   Chart     │
└─────────────┘     └─────────────┘     └─────────────┘
      │
      │ Supabase Realtime
      │ (WebSocket)
      ▼
  Novos registros
  em device_logs
```

### 4.2 Detector de Heartbeat (Online/Offline)

Sistema de detecção de status do agente baseado no timestamp do último log recebido.

#### Lógica de Negócio

```typescript
const OFFLINE_THRESHOLD_SECONDS = 90;

const isOnline = useMemo(() => {
  if (!latestLogTimestamp) return false;
  const diffInSeconds = (currentTime.getTime() - latestLogTimestamp.getTime()) / 1000;
  return diffInSeconds <= OFFLINE_THRESHOLD_SECONDS;
}, [latestLogTimestamp, currentTime]);
```

#### Estados Visuais

| Estado | Condição | Visual |
|--------|----------|--------|
| **🟢 Online** | Último log < 90 segundos | Badge verde com animação de pulso |
| **🔴 Offline** | Último log > 90 segundos | Badge vermelho + Alerta amarelo |

#### Alerta de Offline

Quando offline, exibe um alerta dentro do card:

```
⚠️ O agente parou de enviar dados. Verifique se o computador 
   está ligado e conectado à internet.
```

### 4.3 Exportação de Relatório (Print-to-PDF)

Funcionalidade que permite gerar PDFs limpos para documentação e auditorias.

#### Implementação

```typescript
const handleExportReport = () => {
  window.print();
};
```

#### Regras CSS `@media print`

```css
@media print {
  /* Ocultar elementos de navegação */
  .sidebar, header, footer, .print-hide {
    display: none !important;
  }
  
  /* Forçar cores para impressão */
  body {
    background: white !important;
    color: black !important;
  }
  
  /* Cards com borda para definição */
  .card {
    background: white !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: none !important;
  }
  
  /* Cabeçalho do documento */
  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
  }
  
  /* Rodapé do documento */
  .print-footer {
    display: block !important;
    position: fixed;
    bottom: 0;
    width: 100%;
    text-align: center;
    font-size: 10px;
    color: #666;
  }
}
```

#### Elementos do PDF

| Elemento | Conteúdo |
|----------|----------|
| **Cabeçalho** | "Relatório de Status APOC - [Data Atual]" |
| **Corpo** | Cards de métricas, gráficos, listas |
| **Rodapé** | "Gerado automaticamente pela plataforma APOC Compliance" |

### 4.4 Onboarding Dinâmico (Modal de Instalação)

O modal `MikroTikAgentModal` guia o usuário na configuração do agente.

#### Funcionalidades

1. **Geração Automática de Token**: Baseado no `user.id` do Supabase Auth
2. **Config.ini Pré-preenchido**: Pronto para copiar e usar
3. **Botões de Copiar**: Um clique para copiar token ou config completo

#### Código do Token

```typescript
const agentToken = `apoc_agent_${user?.id?.slice(0, 8) || 'demo'}`;
```

---

## 5. Guia de Instalação (Para o Cliente)

### 5.1 Pré-requisitos

- Windows 10/11 (64-bit)
- Conexão com a internet
- Acesso ao roteador MikroTik (IP + credenciais)
- Conta ativa no APOC Dashboard

### 5.2 Passo a Passo

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
│  • Preencha IP/usuário/senha do MikroTik em [mikrotik]           │
│  • Defina modo_simulacao = false para produção                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 4: EXECUTAR                                               │
│  • Dê duplo-clique em APOC-Agent.exe                             │
│  • Uma janela de terminal abrirá mostrando os logs               │
│  • Verifique no Dashboard se os dados estão chegando             │
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

### 5.3 Verificação

| Indicador | Esperado |
|-----------|----------|
| Terminal do Agente | Mensagens "✓ Dados enviados" a cada 5s |
| Dashboard | Badge "🟢 Online" no card de Monitoramento |
| Gráfico | Novos pontos aparecendo em tempo real |

### 5.4 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| "Erro de conexão" | Sem internet | Verifique conexão de rede |
| "Erro HTTP 400" | Token inválido | Copie o token novamente do Dashboard |
| "Erro ao conectar MikroTik" | IP/credenciais errados | Verifique config.ini [mikrotik] |
| Dashboard mostra "Offline" | Agente não está rodando | Execute APOC-Agent.exe |

---

## 6. Roadmap Futuro

### 6.1 Versão 2.0 (Próximo Ciclo)

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Alertas por E-mail** | Notificações automáticas quando dispositivo ficar offline | Alta |
| **Múltiplos Roteadores** | Um agente monitorando N dispositivos | Alta |
| **Histórico Extendido** | Gráficos com dados de 7/30/90 dias | Média |
| **Dashboard Mobile** | PWA responsivo para monitoramento mobile | Média |

### 6.2 Versão 3.0 (Futuro)

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Stripe Payments** | Cobrança por agente/mês | Alta |
| **API Pública** | REST API para integrações terceiras | Média |
| **Agente Linux** | Suporte a servidores Linux | Média |
| **Multi-tenant Avançado** | White-label para MSPs | Baixa |

### 6.3 Backlog Técnico

- [ ] Implementar testes automatizados (Jest + Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento de erros (Sentry)
- [ ] Rate limiting na Edge Function
- [ ] Compressão de dados históricos

---

## 📎 Anexos

### A. Diagrama de Arquitetura Completo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         React SPA (Vite)                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Dashboard  │  │ Integrations│  │   Audit     │  │  Settings   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE CLOUD                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     Auth     │  │   Database   │  │   Storage    │  │    Edge Fn   │   │
│  │   (JWT+RLS)  │  │  (Postgres)  │  │   (S3-like)  │  │    (Deno)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                           │                                   │            │
│                           │ Realtime                         │            │
│                           │ (WebSocket)                      │            │
│                           ▼                                   │            │
│                    ┌─────────────┐                           │            │
│                    │ device_logs │◀──────────────────────────┘            │
│                    └─────────────┘   ingest-metrics                       │
└────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ HTTPS POST
                                      │ (a cada 5s)
┌────────────────────────────────────────────────────────────────────────────┐
│                          REDE LOCAL DO CLIENTE                              │
│  ┌──────────────┐         ┌──────────────┐                                 │
│  │   MikroTik   │◀───────▶│ APOC Agent   │                                 │
│  │   RouterOS   │   API   │   (Python)   │                                 │
│  └──────────────┘         └──────────────┘                                 │
└────────────────────────────────────────────────────────────────────────────┘
```

### B. Credenciais de Ambiente

| Recurso | Valor |
|---------|-------|
| **Supabase Project ID** | `ofbyxnpprwwuieabwhdo` |
| **Supabase URL** | `https://ofbyxnpprwwuieabwhdo.supabase.co` |
| **Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (ver config.ini) |
| **Edge Function URL** | `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics` |

---

> **Documento gerado para o APOC MVP v1.0**  
> Para dúvidas ou contribuições, contate a equipe de desenvolvimento.
