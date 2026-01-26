import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Bell, 
  MessageSquare, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  RefreshCw, 
  UserPlus, 
  FileText,
  Save,
  Send,
  Loader2
} from "lucide-react";
import { useNotificationSettings, ChannelConfig, NotificationSettings } from "@/hooks/useNotificationSettings";

const ALERT_TYPES = [
  {
    key: 'alert_critical_issue' as const,
    label: 'Issue Crítico Detectado',
    description: 'Quando um novo issue com severidade crítica é detectado',
    icon: AlertTriangle,
    color: 'text-destructive',
  },
  {
    key: 'alert_score_drop' as const,
    label: 'Queda no Score de Compliance',
    description: 'Quando o score cai mais de X% em 24 horas',
    icon: TrendingDown,
    color: 'text-amber-500',
    hasThreshold: true,
  },
  {
    key: 'alert_sla_expiring' as const,
    label: 'SLA Próximo do Vencimento',
    description: 'Quando um SLA está a menos de 24h do vencimento',
    icon: Clock,
    color: 'text-orange-500',
  },
  {
    key: 'alert_sync_failed' as const,
    label: 'Sincronização Falhou',
    description: 'Quando uma sincronização de integração falha',
    icon: RefreshCw,
    color: 'text-muted-foreground',
  },
  {
    key: 'alert_new_user' as const,
    label: 'Novo Usuário na Organização',
    description: 'Quando um novo membro entra na organização',
    icon: UserPlus,
    color: 'text-blue-500',
  },
  {
    key: 'alert_weekly_report' as const,
    label: 'Relatório Semanal de Compliance',
    description: 'Resumo semanal com score, issues e remediações',
    icon: FileText,
    color: 'text-primary',
  },
];

const DAYS_OF_WEEK = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

export function NotificationSettingsPanel() {
  const { 
    settings, 
    isLoading, 
    saveSettings, 
    isSaving,
    testSlackWebhook,
    isTestingSlack 
  } = useNotificationSettings();
  
  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    } else if (!isLoading) {
      // Initialize with defaults if no settings exist
      setLocalSettings({
        email_enabled: true,
        in_app_enabled: true,
        slack_enabled: false,
        slack_webhook_url: null,
        alert_critical_issue: { email: true, in_app: true, slack: true },
        alert_score_drop: { email: true, in_app: true, slack: false },
        alert_score_drop_threshold: 10,
        alert_sla_expiring: { email: true, in_app: true, slack: false },
        alert_sync_failed: { email: false, in_app: true, slack: false },
        alert_new_user: { email: true, in_app: false, slack: false },
        alert_weekly_report: { email: true, in_app: false, slack: false },
        digest_daily_enabled: false,
        digest_weekly_enabled: true,
        digest_time: '08:00:00',
        digest_day_of_week: 1,
      });
    }
  }, [settings, isLoading]);
  
  const updateLocalSettings = <K extends keyof NotificationSettings>(
    key: K, 
    value: NotificationSettings[K]
  ) => {
    setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };
  
  const updateAlertChannel = (
    alertKey: keyof Pick<NotificationSettings, 'alert_critical_issue' | 'alert_score_drop' | 'alert_sla_expiring' | 'alert_sync_failed' | 'alert_new_user' | 'alert_weekly_report'>,
    channel: keyof ChannelConfig,
    value: boolean
  ) => {
    if (!localSettings) return;
    const current = localSettings[alertKey] as ChannelConfig;
    updateLocalSettings(alertKey, { ...current, [channel]: value });
  };
  
  const handleSave = async () => {
    if (!localSettings) return;
    await saveSettings(localSettings);
    setHasChanges(false);
  };
  
  const handleTestSlack = async () => {
    if (!localSettings?.slack_webhook_url) return;
    await testSlackWebhook(localSettings.slack_webhook_url);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (!localSettings) return null;
  
  return (
    <div className="space-y-6">
      {/* Canais de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canais de Notificação
          </CardTitle>
          <CardDescription>
            Configure os canais por onde deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações por email
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.email_enabled}
              onCheckedChange={(checked) => updateLocalSettings('email_enabled', checked)}
            />
          </div>
          
          <Separator />
          
          {/* In-App */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="font-medium">In-App</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações dentro da aplicação
                </p>
              </div>
            </div>
            <Switch
              checked={localSettings.in_app_enabled}
              onCheckedChange={(checked) => updateLocalSettings('in_app_enabled', checked)}
            />
          </div>
          
          <Separator />
          
          {/* Slack */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="font-medium">Slack</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar alertas para canal do Slack
                  </p>
                </div>
              </div>
              <Switch
                checked={localSettings.slack_enabled}
                onCheckedChange={(checked) => updateLocalSettings('slack_enabled', checked)}
              />
            </div>
            
            {localSettings.slack_enabled && (
              <div className="ml-12 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={localSettings.slack_webhook_url || ''}
                    onChange={(e) => updateLocalSettings('slack_webhook_url', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestSlack}
                    disabled={!localSettings.slack_webhook_url || isTestingSlack}
                  >
                    {isTestingSlack ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="ml-2">Testar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure um Incoming Webhook no Slack e cole a URL aqui
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Alertas Proativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Proativos
          </CardTitle>
          <CardDescription>
            Configure quais eventos disparam notificações e por quais canais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ALERT_TYPES.map((alertType, index) => {
            const Icon = alertType.icon;
            const alertConfig = localSettings[alertType.key] as ChannelConfig;
            
            return (
              <div key={alertType.key}>
                {index > 0 && <Separator className="mb-6" />}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-muted rounded-lg ${alertType.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <Label className="font-medium">{alertType.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {alertType.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-12 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${alertType.key}-email`}
                        checked={alertConfig?.email ?? false}
                        onCheckedChange={(checked) => 
                          updateAlertChannel(alertType.key, 'email', checked)
                        }
                        disabled={!localSettings.email_enabled}
                      />
                      <Label htmlFor={`${alertType.key}-email`} className="text-sm">
                        <Badge variant="outline" className="gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </Badge>
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${alertType.key}-inapp`}
                        checked={alertConfig?.in_app ?? false}
                        onCheckedChange={(checked) => 
                          updateAlertChannel(alertType.key, 'in_app', checked)
                        }
                        disabled={!localSettings.in_app_enabled}
                      />
                      <Label htmlFor={`${alertType.key}-inapp`} className="text-sm">
                        <Badge variant="outline" className="gap-1">
                          <Bell className="h-3 w-3" />
                          In-App
                        </Badge>
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${alertType.key}-slack`}
                        checked={alertConfig?.slack ?? false}
                        onCheckedChange={(checked) => 
                          updateAlertChannel(alertType.key, 'slack', checked)
                        }
                        disabled={!localSettings.slack_enabled}
                      />
                      <Label htmlFor={`${alertType.key}-slack`} className="text-sm">
                        <Badge variant="outline" className="gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Slack
                        </Badge>
                      </Label>
                    </div>
                  </div>
                  
                  {alertType.hasThreshold && (
                    <div className="ml-12 flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">
                        Alertar quando score cair mais de
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={localSettings.alert_score_drop_threshold || 10}
                        onChange={(e) => 
                          updateLocalSettings('alert_score_drop_threshold', parseInt(e.target.value) || 10)
                        }
                        className="w-16 h-8"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* Digest por Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Digest por Email
          </CardTitle>
          <CardDescription>
            Receba resumos periódicos de compliance por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Digest Diário */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Digest Diário</Label>
              <p className="text-sm text-muted-foreground">
                Resumo diário de issues e score
              </p>
            </div>
            <Switch
              checked={localSettings.digest_daily_enabled}
              onCheckedChange={(checked) => updateLocalSettings('digest_daily_enabled', checked)}
            />
          </div>
          
          <Separator />
          
          {/* Digest Semanal */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Digest Semanal</Label>
              <p className="text-sm text-muted-foreground">
                Resumo semanal completo de compliance
              </p>
            </div>
            <Switch
              checked={localSettings.digest_weekly_enabled}
              onCheckedChange={(checked) => updateLocalSettings('digest_weekly_enabled', checked)}
            />
          </div>
          
          {(localSettings.digest_daily_enabled || localSettings.digest_weekly_enabled) && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Horário de Envio</Label>
                  <Input
                    type="time"
                    value={localSettings.digest_time?.slice(0, 5) || '08:00'}
                    onChange={(e) => updateLocalSettings('digest_time', `${e.target.value}:00`)}
                    className="w-32"
                  />
                </div>
                
                {localSettings.digest_weekly_enabled && (
                  <div className="space-y-2">
                    <Label className="text-sm">Dia da Semana (Semanal)</Label>
                    <Select
                      value={String(localSettings.digest_day_of_week ?? 1)}
                      onValueChange={(value) => updateLocalSettings('digest_day_of_week', parseInt(value))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
