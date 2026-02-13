import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Eye,
  Edit,
  Calendar,
  MoreHorizontal,
  Download,
  Share2,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreatePolicyModal from '@/components/policies/CreatePolicyModal';
import EditPolicyModal from '@/components/policies/EditPolicyModal';
import PolicyVersionHistory from '@/components/policies/PolicyVersionHistory';
import PolicyApprovalWorkflow from '@/components/policies/PolicyApprovalWorkflow';
import { usePolicies } from '@/hooks/usePolicies';
import { useUserRoles } from '@/hooks/useUserRoles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PoliciesLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { policies, loading } = usePolicies();
  const { canEditResources } = useUserRoles();

  const statusMap: Record<string, string> = {
    active: 'published',
    draft: 'draft',
    review: 'review',
    archived: 'archived',
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'secondary' | 'outline'; className: string }> = {
      published: { label: 'Publicada', variant: 'secondary', className: 'bg-success/10 text-success border-success/20' },
      active: { label: 'Ativa', variant: 'secondary', className: 'bg-success/10 text-success border-success/20' },
      draft: { label: 'Rascunho', variant: 'outline', className: 'bg-muted/20 text-muted-foreground' },
      review: { label: 'Em Revisão', variant: 'secondary', className: 'bg-warning/10 text-warning border-warning/20' },
      archived: { label: 'Arquivada', variant: 'outline', className: 'bg-muted/10 text-muted-foreground' }
    };
    
    const config = statusConfig[status] ?? statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '—';
    }
  };

  const filteredPolicies = policies.filter(policy =>
    (policy.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (policy.category?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (policy.description?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const mapStatus = (s: string) => statusMap[s] ?? s;

  const policiesByStatus = {
    all: filteredPolicies,
    published: filteredPolicies.filter(p => p.status === 'active'),
    draft: filteredPolicies.filter(p => p.status === 'draft'),
    review: filteredPolicies.filter(p => p.status === 'review'),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Biblioteca de Políticas</h2>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Carregando políticas...
        </div>
      </div>
    );
  }

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
          <CreatePolicyModal />
        </div>
      </div>

      {policies.length === 0 ? (
        <Card className="bg-surface-elevated border-card-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma política cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira política para começar a gerenciar a conformidade da organização.
            </p>
            {canEditResources() && <CreatePolicyModal />}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              Todas ({policiesByStatus.all.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Ativas ({policiesByStatus.published.length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Rascunhos ({policiesByStatus.draft.length})
            </TabsTrigger>
            <TabsTrigger value="review">
              Em Revisão ({policiesByStatus.review.length})
            </TabsTrigger>
          </TabsList>

          {Object.entries(policiesByStatus).map(([status, items]) => (
            <TabsContent key={status} value={status} className="mt-6">
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma política encontrada nesta categoria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((policy) => (
                    <Card key={policy.id} className="bg-surface-elevated border-card-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold truncate">
                              {policy.name}
                            </CardTitle>
                            {policy.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {policy.description}
                              </p>
                            )}
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
                              {canEditResources() && (
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                              )}
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
                          {policy.version && (
                            <Badge variant="outline" className="text-xs">
                              v{policy.version}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          {policy.category && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Categoria:</span>
                              <span className="font-medium">{policy.category}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Responsável:</span>
                            <span className="font-medium">{policy.owner ?? '—'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Atualizada:</span>
                            <span className="font-medium">{formatDate(policy.updated_at)}</span>
                          </div>
                        </div>

                        {(policy.tags && policy.tags.length > 0) && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">FRAMEWORKS</p>
                            <div className="flex flex-wrap gap-1">
                              {policy.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {policy.next_review && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            Próxima revisão: {formatDate(policy.next_review)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default PoliciesLibrary;
