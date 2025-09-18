import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Search, 
  Download, 
  Filter,
  User,
  Shield,
  Database,
  FileText
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'auth' | 'data' | 'security' | 'system';
  details: string;
  ip: string;
  userAgent: string;
}

interface ViewLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewLogsModal = ({ open, onOpenChange }: ViewLogsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const logs: LogEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-15 14:30:25',
      action: 'Login realizado',
      category: 'auth',
      details: 'Usuário fez login via email/senha',
      ip: '192.168.1.100',
      userAgent: 'Chrome 118.0 - Windows'
    },
    {
      id: '2',
      timestamp: '2024-01-15 14:25:10',
      action: 'Relatório gerado',
      category: 'data',
      details: 'Relatório de compliance SOX exportado',
      ip: '192.168.1.100',
      userAgent: 'Chrome 118.0 - Windows'
    },
    {
      id: '3',
      timestamp: '2024-01-15 13:45:33',
      action: 'Configuração alterada',
      category: 'system',
      details: 'Notificações por email ativadas',
      ip: '192.168.1.100',
      userAgent: 'Chrome 118.0 - Windows'
    },
    {
      id: '4',
      timestamp: '2024-01-15 12:20:17',
      action: 'Tentativa de login suspeita',
      category: 'security',
      details: 'Múltiplas tentativas de login falharam',
      ip: '203.45.67.89',
      userAgent: 'Unknown - Bot'
    },
    {
      id: '5',
      timestamp: '2024-01-15 11:15:42',
      action: 'Documento enviado',
      category: 'data',
      details: 'Evidência de auditoria carregada',
      ip: '192.168.1.100',
      userAgent: 'Safari 17.0 - macOS'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <User className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'system': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      auth: 'bg-blue-100 text-blue-800',
      security: 'bg-red-100 text-red-800', 
      data: 'bg-green-100 text-green-800',
      system: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const exportLogs = () => {
    const data = filteredLogs.map(log => 
      `${log.timestamp}\t${log.category.toUpperCase()}\t${log.action}\t${log.details}\t${log.ip}`
    ).join('\n');
    
    const blob = new Blob([`Timestamp\tCategoria\tAção\tDetalhes\tIP\n${data}`], { 
      type: 'text/tab-separated-values' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.tsv`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <span>Log de Atividades</span>
            </div>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Recentes</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <div className="flex gap-4 mt-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="auth">Autenticação</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
                <SelectItem value="data">Dados</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="recent" className="mt-0">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredLogs.slice(0, 10).map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getCategoryIcon(log.category)}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{log.action}</span>
                              <Badge className={getCategoryBadge(log.category)}>
                                {log.category.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{log.timestamp}</span>
                              <span>IP: {log.ip}</span>
                              <span>{log.userAgent}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredLogs.filter(log => log.category === 'security').map((log) => (
                  <Card key={log.id} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-4 w-4 text-red-600" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.action}</span>
                            <Badge className="bg-red-100 text-red-800">SEGURANÇA</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{log.details}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{log.timestamp}</span>
                            <span>IP: {log.ip}</span>
                            <span>{log.userAgent}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(log.category)}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.action}</span>
                            <Badge className={getCategoryBadge(log.category)}>
                              {log.category.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{log.details}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{log.timestamp}</span>
                            <span>IP: {log.ip}</span>
                            <span>{log.userAgent}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};