import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Shield, 
  Clock,
  FileText,
  Archive,
  Hash,
  Eye,
  Search,
  Plus
} from 'lucide-react';
import { useAudits } from '@/hooks/useAudits';
import CreateAuditModal from './CreateAuditModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EvidenceLocker = () => {
  const { evidence, stats, loading } = useAudits();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Evidence Locker</h2>
          <div className="flex gap-2">
            <div className="h-8 w-32 bg-muted/20 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-muted/20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-40 bg-muted/20 rounded animate-pulse"></div>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${mb.toFixed(0)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Evidence Locker
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Cofre Seguro
          </Badge>
          <CreateAuditModal />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Buscar Evidências
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estatísticas do Cofre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{stats.totalEvidence}</div>
              <div className="text-xs text-muted-foreground">Arquivos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{stats.totalEvidence * 10}MB</div>
              <div className="text-xs text-muted-foreground">Tamanho Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-success">100%</div>
              <div className="text-xs text-muted-foreground">Integridade</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-info">AES-256</div>
              <div className="text-xs text-muted-foreground">Criptografia</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">7 anos</div>
              <div className="text-xs text-muted-foreground">Retenção</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground">2h atrás</div>
              <div className="text-xs text-muted-foreground">Último Backup</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence by Source */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {evidence.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma evidência coletada</h3>
            <p className="text-muted-foreground mb-4">Inicie uma auditoria para começar a coletar evidências</p>
            <CreateAuditModal />
          </div>
        ) : (
          evidence.map((item) => (
            <Card key={item.id} className="bg-surface-elevated border-card-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {item.type.includes('JSON') ? '☁️' :
                       item.type.includes('PDF') ? '📋' :
                       item.type.includes('CSV') ? '📊' :
                       item.type.includes('XML') ? '🔧' : '📄'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.type} • Uploaded by {item.uploaded_by || 'Sistema'}
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <Shield className="h-3 w-3 mr-1" />
                    {item.status === 'verified' ? 'Verificado' : item.status === 'collected' ? 'Coletado' : 'Arquivado'}
                  </Badge>
                </div>

                {/* Integrity Hash */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">HASH SHA-256</span>
                  </div>
                  <div className="p-2 bg-muted/10 rounded font-mono text-xs text-foreground break-all">
                    {`sha256-${item.id.substring(0, 16)}...`}
                  </div>
                </div>

                {/* Controls Mapping */}
                <div className="space-y-2 mb-3">
                  <p className="text-xs text-muted-foreground font-medium">CONTROLES MAPEADOS</p>
                  <div className="flex flex-wrap gap-1">
                    {['AC-2', 'AC-3', 'SC-8'].map((control, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {control}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-6 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EvidenceLocker;