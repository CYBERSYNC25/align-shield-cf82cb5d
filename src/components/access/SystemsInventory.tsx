import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Cloud, 
  Building2, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  MoreVertical,
  Settings,
  Eye,
  UserPlus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAccess } from '@/hooks/useAccess';
import ConfigureIntegrationModal from './ConfigureIntegrationModal';
import SystemDetailsModal from './SystemDetailsModal';
import ManageUsersModal from './ManageUsersModal';

const SystemsInventory = () => {
  const { systems, loading } = useAccess();
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (systemId: string, systemName: string) => {
    setSyncing(systemId);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Sistema ${systemName} sincronizado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao sincronizar sistema');
    } finally {
      setSyncing(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cloud': return <Cloud className="h-4 w-4" />;
      case 'saas': return <Server className="h-4 w-4" />;
      case 'on-premise': return <Building2 className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': 
        return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
      case 'high': 
        return <Badge variant="destructive" className="text-xs bg-warning text-warning-foreground">Alto</Badge>;
      case 'medium': 
        return <Badge variant="secondary" className="text-xs">Médio</Badge>;
      case 'low': 
        return <Badge variant="outline" className="text-xs">Baixo</Badge>;
      default: 
        return <Badge variant="secondary" className="text-xs">Médio</Badge>;
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': 
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'non-compliant': 
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: 
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getIntegrationIcon = (status: string) => {
    switch (status) {
      case 'connected': 
        return <Wifi className="h-4 w-4 text-success" />;
      case 'error': 
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: 
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Inventário de Sistemas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {systems.map((system) => (
            <div key={system.id} className="flex items-center justify-between p-4 border border-card-border rounded-lg bg-surface hover:bg-surface-elevated transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted">
                  {getTypeIcon(system.type)}
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">{system.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{system.users_count} usuários</span>
                    <span>Última revisão: {new Date(system.last_review || '').toLocaleDateString() || 'Nunca'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getRiskBadge(system.risk_level)}
                <div className="flex items-center space-x-2">
                  {getComplianceIcon(system.compliance_status)}
                  {getIntegrationIcon(system.integration_status)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setSelectedSystem(system);
                      setShowDetailsModal(true);
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedSystem(system);
                      setShowConfigModal(true);
                    }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Integração
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedSystem(system);
                      setShowUsersModal(true);
                    }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Gerenciar Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleSync(system.id, system.name)}
                      disabled={syncing === system.id}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncing === system.id ? 'animate-spin' : ''}`} />
                      {syncing === system.id ? 'Sincronizando...' : 'Sincronizar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          
          {systems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum sistema encontrado</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Modals */}
      <ConfigureIntegrationModal
        system={selectedSystem}
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setSelectedSystem(null);
        }}
      />

      <SystemDetailsModal
        system={selectedSystem}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedSystem(null);
        }}
      />

      <ManageUsersModal
        system={selectedSystem}
        isOpen={showUsersModal}
        onClose={() => {
          setShowUsersModal(false);
          setSelectedSystem(null);
        }}
      />
    </Card>
  );
};

export default SystemsInventory;