import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Code, Settings, AlertCircle, Package } from "lucide-react";

const TechnicalDocumentation = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentação Técnica</h1>
          <p className="text-muted-foreground">Arquitetura e Implementação do APOC Agent</p>
        </div>
      </div>

      {/* Visão Geral da Arquitetura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Visão Geral da Arquitetura
          </CardTitle>
          <CardDescription>Arquitetura híbrida de IoT para monitoramento em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">🖥️ Agente Local (.exe)</h3>
              <p className="text-sm text-muted-foreground">
                Roda na rede do cliente (Windows), coleta dados do MikroTik via API e envia para a nuvem via HTTPS.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">☁️ Backend (Supabase)</h3>
              <p className="text-sm text-muted-foreground">
                Recebe os dados via Edge Function (ingest-metrics) e salva no banco de dados PostgreSQL.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">🔒 Segurança</h3>
              <p className="text-sm text-muted-foreground">
                A comunicação é unidirecional (Agente → Nuvem) e autenticada via Anon Key. 
                Nenhuma porta precisa ser aberta na rede local.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accordion com Seções Técnicas */}
      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* O Agente Python */}
        <AccordionItem value="python-agent" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <span className="font-semibold">O Agente Python</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Script principal que coleta métricas e envia para a nuvem.
            </p>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{`# main.py - APOC Agent
import time
import configparser
import requests
import sys
import os
import random

def run_agent():
    # Leitura de config segura (UTF-8)
    config = configparser.ConfigParser()
    config.read('config.ini', encoding='utf-8')
    
    API_URL = config['APOC']['api_url']
    ANON_KEY = config['APOC']['anon_key']
    ROUTER_NAME = config['MIKROTIK']['router_name']
    INTERVAL = int(config['APOC']['intervalo_segundos'])
    
    headers = {
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    print(f"🚀 APOC Agent iniciado")
    print(f"📡 Router: {ROUTER_NAME}")
    print(f"🔄 Intervalo: {INTERVAL}s\\n")
    
    # Loop de envio
    while True:
        try:
            # Simulação de coleta de CPU (substitua com API MikroTik real)
            cpu_usage = random.randint(10, 90)
            
            payload = {
                "agent_token": config['APOC']['token'],
                "router_name": ROUTER_NAME,
                "cpu": cpu_usage,
                "version": "7.11.2"
            }
            
            response = requests.post(API_URL, json=payload, headers=headers)
            
            if response.status_code == 200:
                print(f"✅ Métricas enviadas: CPU={cpu_usage}%")
            else:
                print(f"❌ Erro: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Exceção: {e}")
            
        time.sleep(INTERVAL)

if __name__ == "__main__":
    run_agent()`}</code>
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Como Compilar (Build) */}
        <AccordionItem value="build" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-semibold">Como Compilar (Build)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Para transformar o script Python em um executável Windows (.exe), utilizamos o PyInstaller:
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">1. Instale o PyInstaller:</h4>
                <div className="bg-slate-950 text-slate-50 p-3 rounded-lg">
                  <code className="text-sm">pip install pyinstaller</code>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">2. Compile o executável:</h4>
                <div className="bg-slate-950 text-slate-50 p-3 rounded-lg">
                  <code className="text-sm">python -m PyInstaller --onefile --name APOC_Agent main.py</code>
                </div>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <strong>📦 Resultado:</strong> O executável será criado em <code className="bg-muted px-1 py-0.5 rounded">dist/APOC_Agent.exe</code>
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">3. Distribua junto com config.ini:</h4>
                <p className="text-sm text-muted-foreground">
                  O arquivo <code className="bg-muted px-1 py-0.5 rounded">config.ini</code> deve estar na mesma pasta que o executável.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Arquivo de Configuração */}
        <AccordionItem value="config" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-semibold">Arquivo de Configuração (config.ini)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Estrutura do arquivo de configuração que deve ser fornecido ao cliente final:
            </p>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{`[MIKROTIK]
router_name = MikroTik-Principal
ip = 192.168.88.1
user = admin
password = sua_senha_aqui

[APOC]
api_url = https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics
token = SEU_UUID_UNICO_AQUI
anon_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
intervalo_segundos = 5`}</code>
              </pre>
            </div>
            
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">⚙️ Parâmetros:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><code className="bg-muted px-1 py-0.5 rounded">router_name</code>: Nome identificador do roteador</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">token</code>: UUID único para identificar o dispositivo (gere com uuidgen ou online)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">anon_key</code>: Chave pública do Supabase para autenticação</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">intervalo_segundos</code>: Frequência de envio de métricas (recomendado: 5-30s)</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Troubleshooting */}
        <AccordionItem value="troubleshooting" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-semibold">Troubleshooting - Erros Comuns</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-4">
              <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">❌ Erro 401 (Unauthorized)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Causa:</strong> A chave <code className="bg-muted px-1 py-0.5 rounded">anon_key</code> está errada, 
                  faltando ou expirou.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Solução:</strong> Verifique se a anon_key no <code className="bg-muted px-1 py-0.5 rounded">config.ini</code> está 
                  correta e completa. Copie novamente do dashboard do Supabase.
                </p>
              </div>

              <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                <h4 className="font-semibold text-warning mb-2">⚠️ Janela fecha imediatamente</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Causa:</strong> O arquivo <code className="bg-muted px-1 py-0.5 rounded">config.ini</code> não 
                  está na mesma pasta que o executável.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Solução:</strong> Certifique-se de que <code className="bg-muted px-1 py-0.5 rounded">config.ini</code> e 
                  <code className="bg-muted px-1 py-0.5 rounded">APOC_Agent.exe</code> estão no mesmo diretório.
                </p>
              </div>

              <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">🔌 Connection Timeout</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Causa:</strong> O IP do MikroTik está inacessível, incorreto ou o dispositivo está offline.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Solução:</strong> Verifique:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 mt-1">
                  <li>O IP está correto no <code className="bg-muted px-1 py-0.5 rounded">config.ini</code></li>
                  <li>O roteador está ligado e acessível na rede</li>
                  <li>Teste conectividade: <code className="bg-muted px-1 py-0.5 rounded">ping 192.168.88.1</code></li>
                </ul>
              </div>

              <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                <h4 className="font-semibold text-warning mb-2">📄 Erro ao ler config.ini (UnicodeDecodeError)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Causa:</strong> Arquivo config.ini com encoding errado (geralmente Windows-1252).
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Solução:</strong> Salve o arquivo como UTF-8. No Notepad++: 
                  Encoding → UTF-8. No VSCode, já salva como UTF-8 por padrão.
                </p>
              </div>

              <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                <h4 className="font-semibold text-primary mb-2">💡 Dica: Logs de Depuração</h4>
                <p className="text-sm text-muted-foreground">
                  Execute o agente via terminal/CMD para ver mensagens de erro detalhadas:
                </p>
                <div className="bg-slate-950 text-slate-50 p-2 rounded mt-2">
                  <code className="text-xs">cd caminho/para/pasta</code><br/>
                  <code className="text-xs">APOC_Agent.exe</code>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Info */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Documentação Adicional</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Para exemplos completos em Python, Bash e Node.js, consulte:
              </p>
              <code className="text-sm bg-muted px-2 py-1 rounded">docs/APOC_AGENT_EXAMPLE.md</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicalDocumentation;
