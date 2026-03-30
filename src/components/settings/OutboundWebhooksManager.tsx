import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Webhook,
  Plus,
  MoreHorizontal,
  Send,
  Trash2,
  Edit,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { useOutboundWebhooks, WEBHOOK_EVENTS, OutboundWebhook, CreateWebhookInput } from "@/hooks/useOutboundWebhooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export function OutboundWebhooksManager() {
  const {
    webhooks,
    isLoading,
    createWebhook,
    isCreating,
    updateWebhook,
    isUpdating,
    deleteWebhook,
    isDeleting,
    toggleWebhook,
    testWebhook,
    isTesting,
    useWebhookLogs,
  } = useOutboundWebhooks();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<OutboundWebhook | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateWebhookInput>({
    name: '',
    url: '',
    secret: '',
    events: WEBHOOK_EVENTS.map((e) => e.id),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      secret: '',
      events: WEBHOOK_EVENTS.map((e) => e.id),
    });
    setShowSecret(false);
  };

  const handleCreate = async () => {
    await createWebhook(formData);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEdit = (webhook: OutboundWebhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret || '',
      events: webhook.events,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedWebhook) return;
    await updateWebhook({ id: selectedWebhook.id, ...formData });
    setShowEditDialog(false);
    setSelectedWebhook(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedWebhook) return;
    await deleteWebhook(selectedWebhook.id);
    setShowDeleteDialog(false);
    setSelectedWebhook(null);
  };

  const handleTest = async (webhook: OutboundWebhook) => {
    await testWebhook(webhook);
  };

  const handleViewLogs = (webhook: OutboundWebhook) => {
    setSelectedWebhook(webhook);
    setShowLogsDialog(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  const toggleEvent = (eventId: string) => {
    const events = formData.events || [];
    if (events.includes(eventId)) {
      setFormData({ ...formData, events: events.filter((e) => e !== eventId) });
    } else {
      setFormData({ ...formData, events: [...events, eventId] });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Webhooks de Saída</h3>
          <p className="text-sm text-muted-foreground">
            Configure webhooks para enviar eventos para sistemas externos
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">Nenhum webhook configurado</h4>
            <p className="text-muted-foreground text-center mb-4">
              Configure webhooks para integrar o Compliance Sync com seus sistemas externos
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estatísticas</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm text-muted-foreground">
                          {webhook.url}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(webhook.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {webhook.events.length} eventos
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.enabled}
                          onCheckedChange={(enabled) =>
                            toggleWebhook({ id: webhook.id, enabled })
                          }
                        />
                        <span className={webhook.enabled ? 'text-green-600' : 'text-muted-foreground'}>
                          {webhook.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          {webhook.success_count}
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3" />
                          {webhook.failure_count}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTest(webhook)}>
                            <Send className="h-4 w-4 mr-2" />
                            Testar Webhook
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewLogs(webhook)}>
                            <History className="h-4 w-4 mr-2" />
                            Ver Logs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(webhook)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            setSelectedWebhook(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Editar Webhook' : 'Novo Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configure um webhook para enviar eventos para sistemas externos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Slack Alerts, PagerDuty"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <Input
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Secret (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Secret para assinatura HMAC"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Se configurado, os payloads serão assinados com HMAC-SHA256
              </p>
            </div>

            <div className="space-y-2">
              <Label>Eventos</Label>
              <ScrollArea className="h-48 border rounded-md p-3">
                <div className="space-y-3">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <Checkbox
                        id={event.id}
                        checked={formData.events?.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={event.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {event.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={showEditDialog ? handleUpdate : handleCreate}
              disabled={!formData.name || !formData.url || isCreating || isUpdating}
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {showEditDialog ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Webhook</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o webhook "{selectedWebhook?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <WebhookLogsDialog
        open={showLogsDialog}
        onOpenChange={setShowLogsDialog}
        webhook={selectedWebhook}
        webhookId={selectedWebhook?.id || ''}
      />
    </div>
  );
}

interface WebhookLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: OutboundWebhook | null;
  webhookId: string;
}

function WebhookLogsDialog({ open, onOpenChange, webhook, webhookId }: WebhookLogsDialogProps) {
  const { useWebhookLogs } = useOutboundWebhooks();
  const { data: logs = [], isLoading } = useWebhookLogs(webhookId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600/10 text-green-600 border-green-600/20">Sucesso</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Logs do Webhook: {webhook?.name}</DialogTitle>
          <DialogDescription>
            Histórico de entregas dos últimos 50 eventos
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum log encontrado
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Código HTTP</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.event_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status_code ? (
                        <Badge
                          variant={log.status_code >= 200 && log.status_code < 300 ? 'default' : 'destructive'}
                        >
                          {log.status_code}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{log.attempts}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
