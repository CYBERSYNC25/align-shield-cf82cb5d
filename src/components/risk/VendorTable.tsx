import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRisks } from '@/hooks/useRisks';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const VendorTable = () => {
  const { vendors, loading } = useRisks();
  const { toast } = useToast();

  const handleAssessVendor = async (vendorName: string) => {
    toast({
      title: "Avaliação iniciada",
      description: `Iniciando avaliação para ${vendorName}...`,
    });
  };

  const getCriticalityBadge = (criticality: string) => {
    const config = {
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
      high: { label: 'Alto', className: 'bg-warning text-warning-foreground' },
      medium: { label: 'Médio', className: 'bg-info text-info-foreground' },
      low: { label: 'Baixo', className: 'bg-success text-success-foreground' }
    };
    
    const conf = config[criticality as keyof typeof config];
    return <Badge variant="secondary" className={conf.className}>{conf.label}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      high: { label: 'Alto', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      medium: { label: 'Médio', className: 'bg-warning/10 text-warning border-warning/20' },
      low: { label: 'Baixo', className: 'bg-success/10 text-success border-success/20' }
    };
    
    const conf = config[risk as keyof typeof config];
    return <Badge variant="outline" className={conf.className}>{conf.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Ativo', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
      review: { label: 'Em Revisão', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
      expired: { label: 'Expirado', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive border-destructive/20' }
    };
    
    const conf = config[status as keyof typeof config];
    const Icon = conf.icon;
    
    return (
      <Badge variant="outline" className={`gap-1 ${conf.className}`}>
        <Icon className="h-3 w-3" />
        {conf.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="rounded-md border border-card-border bg-surface-elevated p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum fornecedor cadastrado</h3>
        <p className="text-muted-foreground">Adicione fornecedores para gerenciar riscos de terceiros</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-card-border bg-surface-elevated">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Criticidade</TableHead>
            <TableHead>Risco</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Compliance</TableHead>
            <TableHead>Valor Contrato</TableHead>
            <TableHead>Certificações</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="font-medium">{vendor.name}</div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{vendor.category}</span>
              </TableCell>
              <TableCell>
                {getCriticalityBadge(vendor.criticality)}
              </TableCell>
              <TableCell>
                {getRiskBadge(vendor.riskLevel)}
              </TableCell>
              <TableCell>
                {getStatusBadge(vendor.status)}
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{vendor.complianceScore}%</span>
                  </div>
                  <Progress value={vendor.complianceScore} className="h-2 w-20" />
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">{vendor.contractValue}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-40">
                  {vendor.certifications.slice(0, 2).map((cert, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                  {vendor.certifications.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{vendor.certifications.length - 2}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAssessVendor(vendor.name)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Avaliar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VendorTable;