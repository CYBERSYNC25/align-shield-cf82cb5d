import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Building, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  Shield,
  Calendar
} from 'lucide-react';

const VendorManagement = () => {
  const vendors = [
    {
      name: 'CloudSecure Inc.',
      category: 'Cloud Infrastructure',
      criticality: 'critical',
      riskLevel: 'high',
      contractValue: '$120k/ano',
      lastAssessment: '15/10/2024',
      nextAssessment: '15/04/2025',
      complianceScore: 85,
      status: 'active',
      certifications: ['SOC 2', 'ISO 27001', 'FedRAMP'],
      pendingActions: 3,
      logo: '☁️'
    },
    {
      name: 'DataProtect Solutions',
      category: 'Security Services',
      criticality: 'high',
      riskLevel: 'medium',
      contractValue: '$85k/ano',
      lastAssessment: '22/09/2024',
      nextAssessment: '22/03/2025',
      complianceScore: 92,
      status: 'active',
      certifications: ['ISO 27001', 'PCI DSS'],
      pendingActions: 1,
      logo: '🛡️'
    },
    {
      name: 'TechSupport Pro',
      category: 'IT Services',
      criticality: 'medium',
      riskLevel: 'low',
      contractValue: '$45k/ano',
      lastAssessment: '05/11/2024',
      nextAssessment: '05/05/2025',
      complianceScore: 78,
      status: 'review',
      certifications: ['ISO 9001'],
      pendingActions: 0,
      logo: '🔧'
    },
    {
      name: 'Analytics Corp',
      category: 'Data Processing',
      criticality: 'critical',
      riskLevel: 'medium',
      contractValue: '$200k/ano',
      lastAssessment: '30/10/2024',
      nextAssessment: '30/04/2025',
      complianceScore: 89,
      status: 'active',
      certifications: ['SOC 2', 'GDPR Certified'],
      pendingActions: 2,
      logo: '📊'
    },
    {
      name: 'OfficeSpace Ltd',
      category: 'Facilities',
      criticality: 'low',
      riskLevel: 'low',
      contractValue: '$30k/ano',
      lastAssessment: '12/08/2024',
      nextAssessment: '12/02/2025',
      complianceScore: 72,
      status: 'expired',
      certifications: ['ISO 14001'],
      pendingActions: 5,
      logo: '🏢'
    }
  ];

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Gestão de Fornecedores
        </h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {vendors.map((vendor, index) => (
          <Card key={index} className="bg-surface-elevated border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-xl">{vendor.logo}</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold mb-2">
                      {vendor.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mb-2">
                      {vendor.category}
                    </p>
                    <div className="flex items-center gap-2">
                      {getCriticalityBadge(vendor.criticality)}
                      {getRiskBadge(vendor.riskLevel)}
                      {getStatusBadge(vendor.status)}
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Avaliar
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contract & Compliance */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/10 rounded-lg">
                <div>
                  <span className="text-xs text-muted-foreground">Valor do Contrato</span>
                  <div className="font-semibold text-foreground">{vendor.contractValue}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Score de Compliance</span>
                  <div className="font-semibold text-foreground">{vendor.complianceScore}%</div>
                </div>
              </div>

              {/* Compliance Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Compliance:</span>
                  <span className="font-medium">{vendor.complianceScore}%</span>
                </div>
                <Progress value={vendor.complianceScore} className="h-2" />
              </div>

              {/* Certifications */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">CERTIFICAÇÕES</p>
                <div className="flex flex-wrap gap-1">
                  {vendor.certifications.map((cert, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pending Actions */}
              {vendor.pendingActions > 0 && (
                <div className="flex items-center justify-between p-2 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Ações Pendentes</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {vendor.pendingActions}
                  </Badge>
                </div>
              )}

              {/* Assessment Timeline */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Última avaliação: {vendor.lastAssessment}
                </div>
                <div>
                  Próxima: {vendor.nextAssessment}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorManagement;