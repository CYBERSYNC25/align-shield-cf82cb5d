# APOC Agent - Exemplo de Integração

## Visão Geral

Este documento mostra como enviar métricas de dispositivos para a plataforma APOC usando a API de ingestão.

## Endpoint da API

```
POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics
```

## Formato do Payload

```json
{
  "agent_token": "seu-token-unico-aqui",
  "router_name": "Router-Principal-01",
  "cpu": 45,
  "version": "7.11.2"
}
```

### Campos Obrigatórios

- `agent_token` (string): Token único que identifica o agente/dispositivo
- `router_name` (string): Nome amigável do roteador
- `cpu` (number): Uso de CPU em porcentagem (0-100)
- `version` (string): Versão do RouterOS ou firmware

## Exemplo em Python

```python
import requests
import time
import psutil
import uuid

# Configurações
API_URL = "https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics"
AGENT_TOKEN = str(uuid.uuid4())  # Gere um token único para cada dispositivo
ROUTER_NAME = "Router-Lab-01"
VERSION = "7.11.2"

def get_cpu_usage():
    """Obtém o uso atual da CPU"""
    return psutil.cpu_percent(interval=1)

def send_metrics():
    """Envia métricas para a plataforma APOC"""
    try:
        cpu = get_cpu_usage()
        
        payload = {
            "agent_token": AGENT_TOKEN,
            "router_name": ROUTER_NAME,
            "cpu": int(cpu),
            "version": VERSION
        }
        
        response = requests.post(API_URL, json=payload)
        
        if response.status_code == 200:
            print(f"✅ Métricas enviadas com sucesso: CPU={cpu}%")
            return True
        else:
            print(f"❌ Erro ao enviar métricas: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Exceção ao enviar métricas: {e}")
        return False

if __name__ == "__main__":
    print(f"🚀 APOC Agent iniciado")
    print(f"📡 Token: {AGENT_TOKEN}")
    print(f"🔧 Router: {ROUTER_NAME}")
    print(f"📊 Enviando métricas a cada 5 segundos...\n")
    
    while True:
        send_metrics()
        time.sleep(5)  # Envia métricas a cada 5 segundos
```

## Exemplo em Bash (curl)

```bash
#!/bin/bash

API_URL="https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics"
AGENT_TOKEN="$(uuidgen)"
ROUTER_NAME="Router-Bash-01"
VERSION="7.11.2"

while true; do
    # Obtém uso da CPU (exemplo simples)
    CPU=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    
    # Envia métricas
    curl -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{
        \"agent_token\": \"$AGENT_TOKEN\",
        \"router_name\": \"$ROUTER_NAME\",
        \"cpu\": $CPU,
        \"version\": \"$VERSION\"
      }"
    
    echo ""
    sleep 5
done
```

## Exemplo em Node.js

```javascript
const axios = require('axios');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics';
const AGENT_TOKEN = uuidv4();
const ROUTER_NAME = 'Router-Node-01';
const VERSION = '7.11.2';

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  return 100 - Math.floor((totalIdle / totalTick) * 100);
}

async function sendMetrics() {
  try {
    const cpu = getCpuUsage();
    
    const payload = {
      agent_token: AGENT_TOKEN,
      router_name: ROUTER_NAME,
      cpu: cpu,
      version: VERSION
    };

    const response = await axios.post(API_URL, payload);
    
    if (response.status === 200) {
      console.log(`✅ Métricas enviadas: CPU=${cpu}%`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar métricas:', error.message);
  }
}

console.log('🚀 APOC Agent iniciado');
console.log(`📡 Token: ${AGENT_TOKEN}`);
console.log(`🔧 Router: ${ROUTER_NAME}`);
console.log('📊 Enviando métricas a cada 5 segundos...\n');

// Envia métricas a cada 5 segundos
setInterval(sendMetrics, 5000);
```

## Testando a API

### Usando curl (teste rápido)

```bash
curl -X POST https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "agent_token": "test-agent-123",
    "router_name": "Router-Teste",
    "cpu": 42,
    "version": "7.11.2"
  }'
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Metrics ingested successfully",
  "id": "uuid-do-registro"
}
```

### Resposta de Erro

```json
{
  "error": "Missing required fields",
  "required": ["agent_token", "router_name", "cpu", "version"]
}
```

## Frequência Recomendada

- **Produção**: 30-60 segundos
- **Desenvolvimento/Testes**: 5-10 segundos
- **Demo**: 2-5 segundos

## Visualização no Dashboard

Os dados enviados aparecem automaticamente no card **"Monitoramento de Rede (Tempo Real)"** no Dashboard APOC. O gráfico mostra:

- Evolução da CPU nos últimos 30 minutos
- CPU atual e média
- Nome do dispositivo e versão
- Atualização automática a cada 10 segundos

## Notas Importantes

1. **Token Único**: Cada dispositivo deve ter seu próprio `agent_token` único
2. **Validação**: CPU deve estar entre 0 e 100
3. **Rate Limiting**: Evite enviar mais de 1 requisição por segundo por dispositivo
4. **Segurança**: Em produção, considere adicionar autenticação adicional
5. **Histórico**: Os dados são mantidos indefinidamente (implemente limpeza se necessário)

## Próximos Passos

- [ ] Adicionar autenticação com tokens JWT
- [ ] Implementar métricas adicionais (memória, disco, rede)
- [ ] Criar alertas baseados em thresholds
- [ ] Adicionar compressão de dados históricos
- [ ] Implementar batch processing para múltiplos dispositivos
