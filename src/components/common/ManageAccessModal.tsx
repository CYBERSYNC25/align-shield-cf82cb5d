import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  Eye, 
  Edit3,
  Crown,
  Loader2
} from 'lucide-react';
import { 
  useObjectPermissions, 
  ObjectType, 
  PermissionLevel 
} from '@/hooks/useObjectPermissions';
import { useProfiles } from '@/hooks/useProfiles';
import { useUserRoles } from '@/hooks/useUserRoles';

interface ManageAccessModalProps {
  objectType: ObjectType;
  objectId: string;
  objectTitle: string;
  trigger?: React.ReactNode;
}

const permissionLevelLabels: Record<PermissionLevel, string> = {
  owner: 'Proprietário',
  reviewer: 'Revisor',
  viewer: 'Visualizador'
};

const permissionLevelIcons: Record<PermissionLevel, React.ReactNode> = {
  owner: <Crown className="w-3 h-3" />,
  reviewer: <Edit3 className="w-3 h-3" />,
  viewer: <Eye className="w-3 h-3" />
};

const permissionLevelColors: Record<PermissionLevel, 'destructive' | 'default' | 'secondary'> = {
  owner: 'destructive',
  reviewer: 'default',
  viewer: 'secondary'
};

const objectTypeLabels: Record<ObjectType, string> = {
  control: 'Controle',
  risk: 'Risco',
  policy: 'Política',
  framework: 'Framework',
  audit: 'Auditoria'
};

export function ManageAccessModal({
  objectType,
  objectId,
  objectTitle,
  trigger
}: ManageAccessModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<PermissionLevel>('viewer');
  const [notes, setNotes] = useState('');

  const { 
    permissions, 
    isLoading, 
    addPermission, 
    removePermission 
  } = useObjectPermissions(objectType, objectId);
  
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const { isAdmin, isMasterAdmin, canManageUsers } = useUserRoles();

  // Apenas admins podem gerenciar permissões
  if (!isAdmin() && !isMasterAdmin() && !canManageUsers()) {
    return null;
  }

  const handleAddPermission = async () => {
    if (!selectedUser || !selectedLevel) return;

    await addPermission.mutateAsync({
      userId: selectedUser,
      level: selectedLevel,
      notes: notes || undefined
    });

    // Reset form
    setSelectedUser('');
    setSelectedLevel('viewer');
    setNotes('');
  };

  const handleRemovePermission = async (permissionId: string) => {
    await removePermission.mutateAsync(permissionId);
  };

  // Filtrar usuários que já têm permissão
  const availableUsers = profiles?.filter(
    profile => !permissions.some(p => p.user_id === profile.user_id)
  ) ?? [];

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Acesso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Gerenciar Acesso
          </DialogTitle>
          <DialogDescription>
            Defina quem pode visualizar, revisar ou gerenciar este {objectTypeLabels[objectType].toLowerCase()}: <strong>{objectTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Permissions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Permissões Atuais</Label>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma permissão específica configurada. Apenas administradores têm acesso.
              </p>
            ) : (
              <ScrollArea className="h-[180px] rounded-md border p-2">
                <div className="space-y-2">
                  {permissions.map((permission) => (
                    <div 
                      key={permission.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={permission.profiles?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(permission.profiles?.display_name ?? null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {permission.profiles?.display_name ?? 'Usuário'}
                          </span>
                          {permission.notes && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {permission.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={permissionLevelColors[permission.permission_level]}>
                          <span className="flex items-center gap-1">
                            {permissionLevelIcons[permission.permission_level]}
                            {permissionLevelLabels[permission.permission_level]}
                          </span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePermission(permission.id)}
                          disabled={removePermission.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <Separator />

          {/* Add New Permission */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Adicionar Permissão</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Usuário</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProfiles ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">
                        Todos os usuários já têm permissão
                      </div>
                    ) : (
                      availableUsers.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.display_name ?? profile.user_id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nível de Acesso</Label>
                <Select 
                  value={selectedLevel} 
                  onValueChange={(v) => setSelectedLevel(v as PermissionLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <span className="flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        Visualizador
                      </span>
                    </SelectItem>
                    <SelectItem value="reviewer">
                      <span className="flex items-center gap-2">
                        <Edit3 className="w-3 h-3" />
                        Revisor
                      </span>
                    </SelectItem>
                    <SelectItem value="owner">
                      <span className="flex items-center gap-2">
                        <Crown className="w-3 h-3" />
                        Proprietário
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
              <Textarea
                placeholder="Ex: Responsável pela revisão trimestral..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-16 resize-none"
              />
            </div>

            <Button
              onClick={handleAddPermission}
              disabled={!selectedUser || addPermission.isPending}
              className="w-full"
            >
              {addPermission.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Adicionar Permissão
            </Button>
          </div>

          {/* Permission Levels Legend */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium mb-2">Níveis de Permissão:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><Crown className="w-3 h-3 inline mr-1" /><strong>Proprietário:</strong> Pode editar e gerenciar permissões</p>
              <p><Edit3 className="w-3 h-3 inline mr-1" /><strong>Revisor:</strong> Pode revisar e aprovar</p>
              <p><Eye className="w-3 h-3 inline mr-1" /><strong>Visualizador:</strong> Apenas visualização</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManageAccessModal;
