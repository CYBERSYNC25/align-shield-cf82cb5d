import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Code,
  Key,
  Zap,
  Shield,
  BookOpen,
  Copy,
  Check,
  ArrowRight,
  Terminal,
  Globe,
  Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/public-api';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  scope: 'read' | 'write';
  params?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/v1/compliance/score',
    description: 'Retorna o score de compliance atual e métricas agregadas',
    scope: 'read',
    response: `{
  "score": 87,
  "total_issues": 45,
  "resolved_issues": 39,
  "open_issues": 6,
  "by_severity": {
    "critical": 0,
    "high": 2,
    "medium": 3,
    "low": 1
  },
  "total_resources": 234,
  "calculated_at": "2026-01-26T12:00:00Z"
}`,
  },
  {
    method: 'GET',
    path: '/v1/compliance/issues',
    description: 'Lista issues de compliance com filtros opcionais',
    scope: 'read',
    params: [
      { name: 'severity', type: 'string', required: false, description: 'Filtrar por severidade: critical, high, medium, low' },
      { name: 'resolved', type: 'boolean', required: false, description: 'Filtrar por status de resolução' },
      { name: 'integration', type: 'string', required: false, description: 'Filtrar por integração' },
      { name: 'limit', type: 'integer', required: false, description: 'Limite de resultados (default: 50)' },
      { name: 'offset', type: 'integer', required: false, description: 'Offset para paginação' },
    ],
    response: `{
  "issues": [
    {
      "id": "uuid",
      "rule_id": "aws-s3-public-bucket",
      "rule_title": "S3 Bucket Público",
      "severity": "high",
      "integration": "aws",
      "status": "open",
      "triggered_at": "2026-01-25T10:00:00Z",
      "affected_resources": 3
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/integrations',
    description: 'Lista todas as integrações conectadas',
    scope: 'read',
    response: `{
  "integrations": [
    {
      "id": "uuid",
      "name": "aws",
      "status": "connected",
      "health_score": 95,
      "last_sync_at": "2026-01-26T11:30:00Z",
      "total_webhooks": 150,
      "failed_webhooks": 2
    }
  ],
  "count": 5
}`,
  },
  {
    method: 'POST',
    path: '/v1/integrations/:id/sync',
    description: 'Dispara sincronização de uma integração específica',
    scope: 'write',
    response: `{
  "success": true,
  "message": "Sync job queued",
  "job_id": "uuid"
}`,
  },
  {
    method: 'GET',
    path: '/v1/resources',
    description: 'Lista recursos coletados das integrações',
    scope: 'read',
    params: [
      { name: 'integration', type: 'string', required: false, description: 'Filtrar por integração' },
      { name: 'type', type: 'string', required: false, description: 'Filtrar por tipo de recurso' },
      { name: 'limit', type: 'integer', required: false, description: 'Limite de resultados (default: 100)' },
      { name: 'offset', type: 'integer', required: false, description: 'Offset para paginação' },
    ],
    response: `{
  "resources": [
    {
      "id": "uuid",
      "resource_id": "i-1234567890",
      "integration": "aws",
      "type": "ec2_instance",
      "data": { ... },
      "collected_at": "2026-01-26T11:00:00Z"
    }
  ],
  "pagination": {
    "total": 234,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}`,
  },
  {
    method: 'GET',
    path: '/v1/frameworks',
    description: 'Lista frameworks de compliance habilitados',
    scope: 'read',
    response: `{
  "frameworks": [
    {
      "id": "uuid",
      "name": "ISO 27001:2022",
      "version": "2022",
      "description": "Padrão internacional para SGSI",
      "compliance_score": 78,
      "total_controls": 93,
      "passed_controls": 73
    }
  ],
  "count": 3
}`,
  },
];

const codeExamples = {
  curl: (endpoint: Endpoint) => `curl -X ${endpoint.method} \\
  "${API_BASE_URL}${endpoint.path}" \\
  -H "x-api-key: apoc_your_api_key_here" \\
  -H "Content-Type: application/json"`,

  javascript: (endpoint: Endpoint) => `const response = await fetch(
  "${API_BASE_URL}${endpoint.path}",
  {
    method: "${endpoint.method}",
    headers: {
      "x-api-key": "apoc_your_api_key_here",
      "Content-Type": "application/json"
    }
  }
);

const data = await response.json();
console.log(data);`,

  python: (endpoint: Endpoint) => `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "${API_BASE_URL}${endpoint.path}",
    headers={
        "x-api-key": "apoc_your_api_key_here",
        "Content-Type": "application/json"
    }
)

data = response.json()
print(data)`,
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        onClick={handleCopy}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [codeTab, setCodeTab] = useState<'curl' | 'javascript' | 'python'>('curl');

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-amber-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge className={`${getMethodColor(endpoint.method)} text-white font-mono`}>
            {endpoint.method}
          </Badge>
          <code className="text-lg font-semibold">{endpoint.path}</code>
          <Badge variant={endpoint.scope === 'write' ? 'destructive' : 'secondary'}>
            {endpoint.scope}
          </Badge>
        </div>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {endpoint.params && (
          <div>
            <h4 className="font-medium mb-2">Parâmetros</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Obrigatório</th>
                    <th className="text-left p-2">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((param) => (
                    <tr key={param.name} className="border-t">
                      <td className="p-2 font-mono">{param.name}</td>
                      <td className="p-2 text-muted-foreground">{param.type}</td>
                      <td className="p-2">
                        {param.required ? (
                          <Badge variant="destructive" className="text-xs">Sim</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Não</Badge>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Exemplo de Código</h4>
          <Tabs value={codeTab} onValueChange={(v) => setCodeTab(v as typeof codeTab)}>
            <TabsList>
              <TabsTrigger value="curl" className="gap-1">
                <Terminal className="w-3 h-3" />
                cURL
              </TabsTrigger>
              <TabsTrigger value="javascript" className="gap-1">
                <Code className="w-3 h-3" />
                JavaScript
              </TabsTrigger>
              <TabsTrigger value="python" className="gap-1">
                <Code className="w-3 h-3" />
                Python
              </TabsTrigger>
            </TabsList>
            <div className="mt-2">
              <TabsContent value="curl">
                <CodeBlock code={codeExamples.curl(endpoint)} language="bash" />
              </TabsContent>
              <TabsContent value="javascript">
                <CodeBlock code={codeExamples.javascript(endpoint)} language="javascript" />
              </TabsContent>
              <TabsContent value="python">
                <CodeBlock code={codeExamples.python(endpoint)} language="python" />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div>
          <h4 className="font-medium mb-2">Resposta</h4>
          <CodeBlock code={endpoint.response} language="json" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Developers() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex flex-1 pt-16">
        <Sidebar />

        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Hero */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="w-3 h-3" />
                    API v1
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold">APOC Developer API</h1>
                <p className="text-xl text-muted-foreground">
                  Integre compliance e segurança diretamente nos seus sistemas
                </p>
              </div>

              {/* Quick Start */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Quick Start
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Crie uma API Key</h4>
                      <p className="text-sm text-muted-foreground">
                        Acesse{' '}
                        <Link to="/settings" className="text-primary hover:underline">
                          Configurações → API Keys
                        </Link>{' '}
                        para gerar sua chave
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Faça sua primeira requisição</h4>
                      <CodeBlock
                        code={`curl "${API_BASE_URL}/v1/compliance/score" \\
  -H "x-api-key: apoc_your_key_here"`}
                        language="bash"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Integre no seu pipeline</h4>
                      <p className="text-sm text-muted-foreground">
                        Use a API em CI/CD, dashboards, SIEM ou qualquer sistema de automação
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Autenticação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Todas as requisições devem incluir o header <code className="bg-muted px-2 py-1 rounded">x-api-key</code> com sua API Key.
                  </p>
                  <CodeBlock
                    code={`curl -H "x-api-key: apoc_your_api_key_here" ${API_BASE_URL}/v1/...`}
                    language="bash"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">read</Badge>
                        <span className="font-medium">Scope de Leitura</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Permite consultar scores, issues, integrações e recursos
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">write</Badge>
                        <span className="font-medium">Scope de Escrita</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Permite disparar sincronizações e ações de automação
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Rate Limiting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Os limites de requisição variam de acordo com o tier da sua API Key:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <Badge variant="secondary" className="mb-2">Free</Badge>
                      <p className="text-3xl font-bold">100</p>
                      <p className="text-sm text-muted-foreground">requisições/minuto</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center border-blue-500/50 bg-blue-500/5">
                      <Badge className="mb-2 bg-blue-500">Pro</Badge>
                      <p className="text-3xl font-bold">1.000</p>
                      <p className="text-sm text-muted-foreground">requisições/minuto</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center border-purple-500/50 bg-purple-500/5">
                      <Badge className="mb-2 bg-purple-500">Enterprise</Badge>
                      <p className="text-3xl font-bold">∞</p>
                      <p className="text-sm text-muted-foreground">ilimitado</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Headers de Rate Limit</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><code>X-RateLimit-Limit</code> - Limite total por minuto</li>
                      <li><code>X-RateLimit-Remaining</code> - Requisições restantes</li>
                      <li><code>Retry-After</code> - Segundos até reset (quando excedido)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Endpoints */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Endpoints
                </h2>

                <Accordion type="single" collapsible className="space-y-4">
                  {endpoints.map((endpoint, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${
                              endpoint.method === 'GET'
                                ? 'bg-green-500'
                                : endpoint.method === 'POST'
                                ? 'bg-blue-500'
                                : 'bg-gray-500'
                            } text-white font-mono`}
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="font-semibold">{endpoint.path}</code>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <EndpointCard endpoint={endpoint} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Error Codes */}
              <Card>
                <CardHeader>
                  <CardTitle>Códigos de Erro</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Código</th>
                        <th className="text-left py-2">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2"><code>401</code></td>
                        <td className="py-2 text-muted-foreground">API Key inválida ou ausente</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>403</code></td>
                        <td className="py-2 text-muted-foreground">Permissão insuficiente (scope)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>404</code></td>
                        <td className="py-2 text-muted-foreground">Endpoint não encontrado</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2"><code>429</code></td>
                        <td className="py-2 text-muted-foreground">Rate limit excedido</td>
                      </tr>
                      <tr>
                        <td className="py-2"><code>500</code></td>
                        <td className="py-2 text-muted-foreground">Erro interno do servidor</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="flex items-center justify-between py-6">
                  <div>
                    <h3 className="text-lg font-semibold">Pronto para começar?</h3>
                    <p className="text-muted-foreground">Crie sua primeira API Key agora</p>
                  </div>
                  <Button asChild>
                    <Link to="/settings">
                      <Key className="w-4 h-4 mr-2" />
                      Criar API Key
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </PageContainer>
          <Footer />
        </main>
      </div>
    </div>
  );
}
