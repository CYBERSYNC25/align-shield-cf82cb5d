/**
 * SystemLogsViewer Component
 * 
 * Admin interface for viewing and analyzing system logs.
 * Includes filtering, search, pagination, and export functionality.
 */

import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Terminal,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Code,
} from 'lucide-react';
import { useSystemLogs, SystemLog, LogLevel, LogSource } from '@/hooks/useSystemLogs';

const LEVEL_CONFIG: Record<LogLevel, { icon: typeof Info; color: string; bgColor: string }> = {
  debug: { icon: Bug, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  warn: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  error: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  critical: { icon: XCircle, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
};

const SOURCE_LABELS: Record<LogSource, string> = {
  frontend: 'Frontend',
  edge_function: 'Edge Function',
  webhook: 'Webhook',
  scheduled_job: 'Job Agendado',
  database: 'Database',
};

const PAGE_SIZE = 20;

export function SystemLogsViewer() {
  const [level, setLevel] = useState<LogLevel | 'all'>('all');
  const [source, setSource] = useState<LogSource | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Simple debounce
    setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  };

  const {
    logs,
    isLoading,
    statistics,
    totalCount,
    exportLogs,
    isExporting,
    refresh,
  } = useSystemLogs({
    level,
    source,
    search: debouncedSearch,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getLevelBadge = (logLevel: LogLevel) => {
    const config = LEVEL_CONFIG[logLevel];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 gap-1`}>
        <Icon className="w-3 h-3" />
        {logLevel.toUpperCase()}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd/MM HH:mm:ss", { locale: ptBR });
    } catch {
      return timestamp;
    }
  };

  const truncateMessage = (message: string, maxLength = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Logs do Sistema
              </CardTitle>
              <CardDescription>
                Visualize erros e eventos do sistema nas últimas 24 horas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportLogs('csv')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportLogs('json')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mb-6">
            {statistics.map((stat) => {
              const config = LEVEL_CONFIG[stat.level as LogLevel];
              const Icon = config?.icon || Info;
              return (
                <div
                  key={stat.level}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config?.bgColor || 'bg-muted'}`}
                >
                  <Icon className={`w-4 h-4 ${config?.color || ''}`} />
                  <span className="font-medium">{stat.count}</span>
                  <span className="text-muted-foreground text-sm">{stat.level}</span>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar em mensagens..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={level} onValueChange={(v) => { setLevel(v as LogLevel | 'all'); setPage(0); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={(v) => { setSource(v as LogSource | 'all'); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fontes</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="edge_function">Edge Function</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="scheduled_job">Job Agendado</SelectItem>
                <SelectItem value="database">Database</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Level</TableHead>
                  <TableHead className="w-[120px]">Source</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-[120px]">Componente</TableHead>
                  <TableHead className="w-[130px]">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {SOURCE_LABELS[log.source] || log.source}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {truncateMessage(log.message)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.component_name || log.function_name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(log.created_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Detalhes do Log
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatTimestamp(selectedLog.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="flex items-center gap-4">
                  {getLevelBadge(selectedLog.level)}
                  <Badge variant="outline">{SOURCE_LABELS[selectedLog.source]}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Mensagem</p>
                  <p className="text-sm font-mono bg-muted p-3 rounded-lg whitespace-pre-wrap">
                    {selectedLog.message}
                  </p>
                </div>

                {selectedLog.component_name && (
                  <div>
                    <p className="text-sm font-medium mb-1">Componente</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.component_name}</p>
                  </div>
                )}

                {selectedLog.function_name && (
                  <div>
                    <p className="text-sm font-medium mb-1">Função</p>
                    <p className="text-sm text-muted-foreground">{selectedLog.function_name}</p>
                  </div>
                )}

                {selectedLog.stack_trace && (
                  <div>
                    <p className="text-sm font-medium mb-1">Stack Trace</p>
                    <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.stack_trace}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Metadata</p>
                    <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">ID do Log</p>
                    <p className="text-muted-foreground font-mono text-xs">{selectedLog.id}</p>
                  </div>
                  {selectedLog.request_id && (
                    <div>
                      <p className="font-medium mb-1">Request ID</p>
                      <p className="text-muted-foreground font-mono text-xs">{selectedLog.request_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SystemLogsViewer;
