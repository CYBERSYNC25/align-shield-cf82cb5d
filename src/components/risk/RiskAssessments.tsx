import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRisks } from '@/hooks/useRisks';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  FileText, 
  Send, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Building,
  Users,
  Calendar,
  Download
} from 'lucide-react';

const RiskAssessments = () => {
  const { assessments, loading, sendAssessment } = useRisks();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Avaliações Ativas</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="bg-surface-elevated border-card-border animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-2 bg-muted rounded w-full"></div>
                    <div className="h-12 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  const handleViewAssessment = (vendorName: string) => {
    toast({
      title: "Visualizar Avaliação",
      description: `Abrindo avaliação de "${vendorName}"...`,
    });
  };

  const handleDownloadReport = (vendorName: string) => {
    toast({
      title: "Download Iniciado",
      description: `Baixando relatório de "${vendorName}"...`,
    });
  };

  const handleUseTemplate = (templateName: string) => {
    toast({
      title: "Usar Template",
      description: `Configurando "${templateName}"...`,
    });
  };
  const assessmentTemplates = [
    {
      name: 'SOC 2 Vendor Assessment',
      category: 'Security',
      questions: 45,
      avgCompletionTime: '35 min',
      frameworks: ['SOC 2', 'ISO 27001'],
      description: 'Avaliação completa de controles de segurança para fornecedores críticos'
    },
    {
      name: 'LGPD Data Processing',
      category: 'Privacy',
      questions: 32,
      avgCompletionTime: '25 min',
      frameworks: ['LGPD', 'GDPR'],
      description: 'Questionário específico para processamento de dados pessoais'
    },
    {
      name: 'Financial Services Risk',
      category: 'Compliance',
      questions: 28,
      avgCompletionTime: '20 min',
      frameworks: ['PCI DSS', 'SOX'],
      description: 'Avaliação para fornecedores de serviços financeiros'
    },
    {
      name: 'General Vendor Onboarding',
      category: 'General',
      questions: 18,
      avgCompletionTime: '15 min',
      frameworks: ['ISO 9001'],
      description: 'Questionário padrão para onboarding de novos fornecedores'
    }
  ];

  const activeAssessments = [
    {
      vendor: 'CloudSecure Inc.',
      template: 'SOC 2 Vendor Assessment',
      status: 'in_progress',
      progress: 65,
      sentDate: '15/11/2024',
      dueDate: '25/11/2024',
      completedQuestions: 29,
      totalQuestions: 45,
      riskFlags: 2,
      contactPerson: 'James Wilson',
      contactEmail: 'james@cloudsecure.com'
    },
    {
      vendor: 'DataProtect Solutions',
      template: 'LGPD Data Processing',
      status: 'completed',
      progress: 100,
      sentDate: '08/11/2024',
      dueDate: '18/11/2024',
      completedQuestions: 32,
      totalQuestions: 32,
      riskFlags: 0,
      contactPerson: 'Sarah Chen',
      contactEmail: 'sarah@dataprotect.com'
    },
    {
      vendor: 'Analytics Corp',
      template: 'SOC 2 Vendor Assessment',
      status: 'overdue',
      progress: 35,
      sentDate: '05/11/2024',
      dueDate: '15/11/2024',
      completedQuestions: 16,
      totalQuestions: 45,
      riskFlags: 4,
      contactPerson: 'Mike Rodriguez',
      contactEmail: 'mike@analyticscorp.com'
    },
    {
      vendor: 'TechSupport Pro',
      template: 'General Vendor Onboarding',
      status: 'sent',
      progress: 0,
      sentDate: '20/11/2024',
      dueDate: '30/11/2024',
      completedQuestions: 0,
      totalQuestions: 18,
      riskFlags: 0,
      contactPerson: 'Lisa Zhang',
      contactEmail: 'lisa@techsupportpro.com'
    }
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      sent: { label: 'Enviado', icon: Send, className: 'bg-info/10 text-info border-info/20' },
      in_progress: { label: 'Em Progresso', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
      completed: { label: 'Concluído', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
      overdue: { label: 'Atrasado', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive border-destructive/20' }
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
          Avaliações de Risco
        </h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Avaliações Ativas ({assessments.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            Templates (4)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {assessments.map((assessment, index) => (
              <Card key={index} className="bg-surface-elevated border-card-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold mb-1">
                        {assessment.vendor}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {assessment.template}
                      </p>
                    </div>
                    {getStatusBadge(assessment.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso:</span>
                      <span className="font-medium">
                        {assessment.completedQuestions}/{assessment.totalQuestions} questões
                      </span>
                    </div>
                    <Progress value={assessment.progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {assessment.progress}% concluído
                    </p>
                  </div>

                  {/* Contact Person */}
                  <div className="p-3 bg-muted/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{assessment.contactPerson}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{assessment.contactEmail}</p>
                  </div>

                  {/* Risk Flags */}
                  {assessment.riskFlags > 0 && (
                    <div className="flex items-center justify-between p-2 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium">Flags de Risco</span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {assessment.riskFlags}
                      </Badge>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Enviado:</span>
                      <div className="font-medium">{assessment.sentDate}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prazo:</span>
                      <div className={`font-medium ${assessment.status === 'overdue' ? 'text-destructive' : ''}`}>
                        {assessment.dueDate}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewAssessment(assessment.vendor)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    {assessment.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadReport(assessment.vendor)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Relatório
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'SOC 2 Vendor Assessment',
                category: 'Security',
                questions: 45,
                avgCompletionTime: '35 min',
                frameworks: ['SOC 2', 'ISO 27001'],
                description: 'Avaliação completa de controles de segurança para fornecedores críticos'
              },
              {
                name: 'LGPD Data Processing',
                category: 'Privacy',
                questions: 32,
                avgCompletionTime: '25 min',
                frameworks: ['LGPD', 'GDPR'],
                description: 'Questionário específico para processamento de dados pessoais'
              },
              {
                name: 'Financial Services Risk',
                category: 'Compliance',
                questions: 28,
                avgCompletionTime: '20 min',
                frameworks: ['PCI DSS', 'SOX'],
                description: 'Avaliação para fornecedores de serviços financeiros'
              },
              {
                name: 'General Vendor Onboarding',
                category: 'General',
                questions: 18,
                avgCompletionTime: '15 min',
                frameworks: ['ISO 9001'],
                description: 'Questionário padrão para onboarding de novos fornecedores'
              }
            ].map((template, index) => (
              <Card key={index} className="bg-surface-elevated border-card-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold mb-1">
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Template Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Questões:</span>
                      <div className="font-medium">{template.questions}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tempo médio:</span>
                      <div className="font-medium">{template.avgCompletionTime}</div>
                    </div>
                  </div>

                  {/* Frameworks */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">FRAMEWORKS</p>
                    <div className="flex flex-wrap gap-1">
                      {template.frameworks.map((framework, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      Prévia
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleUseTemplate(template.name)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Usar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskAssessments;