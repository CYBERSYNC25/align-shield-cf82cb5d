import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Server, 
  Users, 
  Shield, 
  Briefcase,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database
} from 'lucide-react';
import { useAssetInventory, AssetComplianceStatus } from '@/hooks/useAssetInventory';

const AuditorAssetInventory = () => {
  const { assets, counts, isLoading } = useAssetInventory();

  if (isLoading) {
    return (
      <Card className="bg-surface-elevated border-card-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity': return <Users className="h-4 w-4 text-info" />;
      case 'infrastructure': return <Server className="h-4 w-4 text-primary" />;
      case 'security': return <Shield className="h-4 w-4 text-success" />;
      case 'productivity': return <Briefcase className="h-4 w-4 text-warning" />;
      default: return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'identity': return 'Identidade';
      case 'infrastructure': return 'Infraestrutura';
      case 'security': return 'Segurança';
      case 'productivity': return 'Produtividade';
      default: return category;
    }
  };

  const getStatusBadge = (status: AssetComplianceStatus) => {
    switch (status) {
      case 'pass':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conforme
          </Badge>
        );
      case 'fail':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Não Conforme
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Não Verificado
          </Badge>
        );
    }
  };

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Inventário de Ativos
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {counts.identity} Identidades
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Server className="h-3 w-3" />
              {counts.infrastructure} Infra
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {counts.security} Segurança
            </Badge>
            <Badge variant="secondary" className="font-medium">
              Total: {counts.total}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum ativo encontrado</h3>
            <p className="text-muted-foreground">
              Os ativos serão exibidos quando integrações estiverem conectadas.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Integração</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.slice(0, 50).map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {asset.typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(asset.category)}
                        <span className="text-sm">{getCategoryLabel(asset.category)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{asset.integrationName}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(asset.complianceStatus)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {assets.length > 50 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Exibindo 50 de {assets.length} ativos
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditorAssetInventory;
