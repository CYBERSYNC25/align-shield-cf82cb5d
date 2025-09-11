import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  FileText, 
  Edit,
  Eye,
  Users,
  Calendar,
  MoreHorizontal,
  Download,
  Share2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PoliciesLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const policiesData = [
    {
      title: 'Política de Segurança da Informação',
      category: 'Segurança',
      status: 'published',
      version: '2.1',
      lastUpdated: '15/11/2024',
      nextReview: '15/05/2025',
      signatureRate: 96,
      totalSignatures: 267,
      requiredSignatures: 278,
      author: 'CISO',
      frameworks: ['ISO 27001', 'SOC 2'],
      description: 'Diretrizes gerais para proteção de informações organizacionais'
    },
    {
      title: 'Política de Controle de Acesso',
      category: 'Segurança',
      status: 'published',
      version: '1.3',
      lastUpdated: '08/11/2024',
      nextReview: '08/02/2025',
      signatureRate: 89,
      totalSignatures: 247,
      requiredSignatures: 278,
      author: 'TI',
      frameworks: ['ISO 27001', 'SOC 2', 'LGPD'],
      description: 'Controles de acesso físico e lógico aos sistemas'
    },
    {
      title: 'Política de Classificação de Dados',
      category: 'Dados',
      status: 'draft',
      version: '3.0',
      lastUpdated: '12/11/2024',
      nextReview: '12/12/2024',
      signatureRate: 0,
      totalSignatures: 0,
      requiredSignatures: 278,
      author: 'DPO',
      frameworks: ['LGPD', 'GDPR'],
      description: 'Classificação e tratamento de dados pessoais e corporativos'
    },
    {
      title: 'Política de Continuidade de Negócios',
      category: 'Operações',
      status: 'review',
      version: '1.8',
      lastUpdated: '05/11/2024',
      nextReview: '20/11/2024',
      signatureRate: 78,
      totalSignatures: 217,
      requiredSignatures: 278,
      author: 'COO',
      frameworks: ['ISO 22301', 'SOC 2'],
      description: 'Planos de continuidade e recuperação de desastres'
    },
    {
      title: 'Política de Mudanças',
      category: 'TI',
      status: 'published',
      version: '2.0',
      lastUpdated: '28/10/2024',
      nextReview: '28/04/2025',
      signatureRate: 92,
      totalSignatures: 256,
      requiredSignatures: 278,
      author: 'TI',
      frameworks: ['ITIL', 'SOC 2'],
      description: 'Processo de gestão de mudanças em sistemas e infraestrutura'
    },
    {
      title: 'Política de Desenvolvimento Seguro',
      category: 'Desenvolvimento',
      status: 'published',
      version: '1.5',
      lastUpdated: '22/10/2024',
      nextReview: '22/04/2025',
      signatureRate: 88,
      totalSignatures: 134,
      requiredSignatures: 152,
      author: 'CTO',
      frameworks: ['OWASP', 'SOC 2'],
      description: 'Práticas seguras de desenvolvimento de software'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: 'Publicada', variant: 'secondary' as const, className: 'bg-success/10 text-success border-success/20' },
      draft: { label: 'Rascunho', variant: 'outline' as const, className: 'bg-muted/20 text-muted-foreground' },
      review: { label: 'Em Revisão', variant: 'secondary' as const, className: 'bg-warning/10 text-warning border-warning/20' },
      archived: { label: 'Arquivada', variant: 'outline' as const, className: 'bg-muted/10 text-muted-foreground' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredPolicies = policiesData.filter(policy =>
    policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const policiesByStatus = {
    published: filteredPolicies.filter(p => p.status === 'published'),
    draft: filteredPolicies.filter(p => p.status === 'draft'),
    review: filteredPolicies.filter(p => p.status === 'review'),
    all: filteredPolicies
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Biblioteca de Políticas
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar políticas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Política
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({policiesByStatus.all.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Publicadas ({policiesByStatus.published.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Rascunhos ({policiesByStatus.draft.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            Em Revisão ({policiesByStatus.review.length})
          </TabsTrigger>
        </TabsList>

        {Object.entries(policiesByStatus).map(([status, policies]) => (
          <TabsContent key={status} value={status} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {policies.map((policy, index) => (
                <Card key={index} className="bg-surface-elevated border-card-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {policy.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {policy.description}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />Compartilhar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(policy.status)}
                      <Badge variant="outline" className="text-xs">
                        v{policy.version}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Categoria:</span>
                        <span className="font-medium">{policy.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Autor:</span>
                        <span className="font-medium">{policy.author}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Atualizada:</span>
                        <span className="font-medium">{policy.lastUpdated}</span>
                      </div>
                    </div>

                    {policy.status === 'published' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Assinaturas:</span>
                          <span className="font-medium">
                            {policy.totalSignatures}/{policy.requiredSignatures}
                          </span>
                        </div>
                        <Progress value={policy.signatureRate} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          {policy.signatureRate}% concluído
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">FRAMEWORKS</p>
                      <div className="flex flex-wrap gap-1">
                        {policy.frameworks.map((framework, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Próxima revisão: {policy.nextReview}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PoliciesLibrary;