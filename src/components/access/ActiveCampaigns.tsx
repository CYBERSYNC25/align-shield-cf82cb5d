import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock,
  Users,
  Calendar,
  MoreVertical,
  Plus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAccess } from '@/hooks/useAccess';
import { toast } from 'sonner';
import CreateCampaignModal from './CreateCampaignModal';
import EditCampaignModal from './EditCampaignModal';

const ActiveCampaigns = () => {
  const { campaigns, loading, updateCampaign } = useAccess();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const handlePauseCampaign = async (id: string) => {
    try {
      await updateCampaign(id, { status: 'draft' });
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await updateCampaign(id, { status: 'active' });
    } catch (error) {
      console.error('Error resuming campaign:', error);
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
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-24 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">
            Campanhas Ativas
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {campaigns.slice(0, 6).map((campaign) => (
              <div key={campaign.id} className="p-4 border border-card-border rounded-lg bg-surface hover:bg-surface-elevated transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground">{campaign.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        campaign.status === 'active' ? 'default' : 
                        campaign.status === 'completed' ? 'secondary' : 'outline'
                      }
                      className="capitalize"
                    >
                      {campaign.status === 'active' ? 'Ativa' : 
                       campaign.status === 'completed' ? 'Concluída' : 'Pausada'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                          Editar Campanha
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`Campanha "${campaign.name}" duplicada`)}>
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success(`Campanha "${campaign.name}" excluída`)} className="text-destructive">
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium text-foreground">{campaign.progress}%</span>
                  </div>
                  <Progress value={campaign.progress} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{campaign.certified_users}/{campaign.total_users} usuários</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {campaign.systems.slice(0, 3).map((system) => (
                      <Badge key={system} variant="outline" className="text-xs">
                        {system}
                      </Badge>
                    ))}
                    {campaign.systems.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{campaign.systems.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex space-x-2">
                      {campaign.status === 'active' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePauseCampaign(campaign.id)}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                      ) : campaign.status === 'completed' ? (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Concluída
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResumeCampaign(campaign.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Retomar
                        </Button>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toast.success(`Visualizando detalhes da campanha: ${campaign.name}`)}>
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {campaigns.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira campanha
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      <CreateCampaignModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          isOpen={!!editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSave={updateCampaign}
        />
      )}
    </Card>
  );
};

export default ActiveCampaigns;