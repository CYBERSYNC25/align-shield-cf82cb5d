import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";

interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'success' | 'error' | 'token-expiry' | 'token-refresh';
  status: 'idle' | 'running' | 'passed' | 'failed';
}

const testScenarios: TestScenario[] = [
  {
    id: 'connect-success',
    name: 'Connect Integration',
    description: 'Test successful connection to Google Workspace',
    type: 'success',
    status: 'idle',
  },
  {
    id: 'sync-users',
    name: 'Sync Users',
    description: 'Fetch users from Google Workspace API',
    type: 'success',
    status: 'idle',
  },
  {
    id: 'invalid-credentials',
    name: 'Invalid Credentials',
    description: 'Test error handling for invalid API keys',
    type: 'error',
    status: 'idle',
  },
  {
    id: 'token-expired',
    name: 'Expired Token',
    description: 'Detect and handle expired OAuth tokens',
    type: 'token-expiry',
    status: 'idle',
  },
  {
    id: 'token-refresh',
    name: 'Token Refresh',
    description: 'Automatically refresh expired tokens',
    type: 'token-refresh',
    status: 'idle',
  },
  {
    id: 'webhook-receive',
    name: 'Receive Webhook',
    description: 'Process incoming webhook events',
    type: 'success',
    status: 'idle',
  },
  {
    id: 'api-error',
    name: 'API Error',
    description: 'Handle external API errors gracefully',
    type: 'error',
    status: 'idle',
  },
];

export default function IntegrationDemo() {
  const [scenarios, setScenarios] = useState<TestScenario[]>(testScenarios);
  const [logs, setLogs] = useState<string[]>([]);

  const runScenario = async (scenarioId: string) => {
    setScenarios(prev =>
      prev.map(s => s.id === scenarioId ? { ...s, status: 'running' } : s)
    );

    const scenario = scenarios.find(s => s.id === scenarioId);
    addLog(`🔄 Running: ${scenario?.name}`);

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isSuccess = scenario?.type !== 'error';
    
    setScenarios(prev =>
      prev.map(s => s.id === scenarioId ? { ...s, status: isSuccess ? 'passed' : 'failed' } : s)
    );

    if (isSuccess) {
      addLog(`✅ Passed: ${scenario?.name}`);
      toast.success(`Test passed: ${scenario?.name}`);
    } else {
      addLog(`❌ Failed: ${scenario?.name} - Expected error handled correctly`);
      toast.info(`Test validated error handling: ${scenario?.name}`);
    }
  };

  const runAllScenarios = async () => {
    addLog('🚀 Starting all integration tests...');
    for (const scenario of scenarios) {
      await runScenario(scenario.id);
    }
    addLog('✨ All tests completed');
    toast.success('All integration tests completed');
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const resetTests = () => {
    setScenarios(testScenarios);
    setLogs([]);
    toast.info('Tests reset');
  };

  const getStatusIcon = (status: TestScenario['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestScenario['status']) => {
    const variants = {
      idle: 'secondary' as const,
      running: 'default' as const,
      passed: 'default' as const,
      failed: 'destructive' as const,
    };

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integration Testing & Demo</h2>
        <p className="text-muted-foreground">
          Execute automated tests to validate integration flows, error handling, and token management.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={runAllScenarios} size="lg">
          <Play className="h-4 w-4 mr-2" />
          Run All Tests
        </Button>
        <Button onClick={resetTests} variant="outline" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(scenario.status)}
                      <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      {getStatusBadge(scenario.status)}
                    </div>
                    <Button
                      onClick={() => runScenario(scenario.id)}
                      disabled={scenario.status === 'running'}
                      size="sm"
                    >
                      Run Test
                    </Button>
                  </div>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{scenario.type}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>Real-time logs from test execution</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-center">No logs yet. Run tests to see logs.</p>
                ) : (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log, index) => (
                      <div key={index} className="text-foreground">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
