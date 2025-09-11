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
  Image,
  Film,
  Archive,
  Hash,
  Lock,
  Eye,
  Search
} from 'lucide-react';

const EvidenceLocker = () => {
  const evidenceStats = {
    totalSize: '1.24 GB',
    totalFiles: 2847,
    lastBackup: '2 horas atrás',
    integrityChecks: '100%',
    encryptionStatus: 'AES-256',
    retentionPeriod: '7 anos'
  };

  const evidencesBySource = [
    {
      source: 'AWS CloudTrail',
      logo: '☁️',
      files: 1247,
      size: '456 MB',
      lastCollection: '5 min atrás',
      integrityHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      status: 'healthy',
      controls: ['AC-2', 'AC-3', 'SC-8']
    },
    {
      source: 'Okta System Logs',
      logo: '🔐',
      files: 567,
      size: '234 MB',
      lastCollection: '10 min atrás',
      integrityHash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      status: 'healthy',
      controls: ['IA-2', 'IA-5', 'AC-2']
    },
    {
      source: 'GitHub Security Events',
      logo: '🐙',
      files: 389,
      size: '178 MB',
      lastCollection: '15 min atrás',
      integrityHash: 'e258d248fda94c63753607f7c4494ee0fcbe92f1a76bfdac795c9d84101eb317',
      status: 'healthy',
      controls: ['CM-2', 'CM-3', 'SA-10']
    },
    {
      source: 'Microsoft 365 Audit',
      logo: '📧',
      files: 445,
      size: '267 MB',
      lastCollection: '8 min atrás',
      integrityHash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      status: 'healthy',
      controls: ['AU-2', 'AU-3', 'AU-12']
    },
    {
      source: 'Policy Attestations',
      logo: '📋',
      files: 199,
      size: '89 MB',
      lastCollection: '1 hora atrás',
      integrityHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      status: 'healthy',
      controls: ['AT-2', 'AT-3', 'PS-6']
    }
  ];

  const getFileTypeIcon = (source: string) => {
    if (source.includes('Logs') || source.includes('Audit') || source.includes('CloudTrail')) return FileText;
    if (source.includes('Policy') || source.includes('Attestations')) return Archive;
    return Database;
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
              <div className="text-lg font-bold text-foreground">{evidenceStats.totalFiles}</div>
              <div className="text-xs text-muted-foreground">Arquivos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{evidenceStats.totalSize}</div>
              <div className="text-xs text-muted-foreground">Tamanho Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-success">{evidenceStats.integrityChecks}</div>
              <div className="text-xs text-muted-foreground">Integridade</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-info">{evidenceStats.encryptionStatus}</div>
              <div className="text-xs text-muted-foreground">Criptografia</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{evidenceStats.retentionPeriod}</div>
              <div className="text-xs text-muted-foreground">Retenção</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground">{evidenceStats.lastBackup}</div>
              <div className="text-xs text-muted-foreground">Último Backup</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence by Source */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {evidencesBySource.map((evidence, index) => {
          const FileIcon = getFileTypeIcon(evidence.source);
          
          return (
            <Card key={index} className="bg-surface-elevated border-card-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{evidence.logo}</div>
                    <div>
                      <h4 className="font-semibold text-foreground">{evidence.source}</h4>
                      <p className="text-xs text-muted-foreground">
                        {evidence.files} arquivos • {evidence.size}
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Seguro
                  </Badge>
                </div>

                {/* Integrity Hash */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">HASH SHA-256</span>
                  </div>
                  <div className="p-2 bg-muted/10 rounded font-mono text-xs text-foreground break-all">
                    {evidence.integrityHash}
                  </div>
                </div>

                {/* Controls Mapping */}
                <div className="space-y-2 mb-3">
                  <p className="text-xs text-muted-foreground font-medium">CONTROLES MAPEADOS</p>
                  <div className="flex flex-wrap gap-1">
                    {evidence.controls.map((control, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {control}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Coletado {evidence.lastCollection}
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
          );
        })}
      </div>
    </div>
  );
};

export default EvidenceLocker;