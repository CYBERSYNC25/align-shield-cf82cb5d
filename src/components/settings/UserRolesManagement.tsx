import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Shield, UserPlus, Trash2 } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';

interface UserWithRoles {
  id: string;
  email: string;
  roles: string[];
}

const roleLabels = {
  admin: 'Administrador',
  auditor: 'Auditor',
  compliance_officer: 'Oficial de Compliance',
  viewer: 'Visualizador'
};

const roleColors = {
  admin: 'destructive',
  auditor: 'secondary',
  compliance_officer: 'default',
  viewer: 'outline'
} as const;

export default function UserRolesManagement() {
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();
  const { logAction } = useAuditLogs();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    if (isAdmin()) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      // Load profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles.map(profile => {
        const userRoles = roles
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role);

        return {
          id: profile.user_id,
          email: profile.display_name || profile.user_id,
          roles: userRoles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: 'Seleção incompleta',
        description: 'Selecione um usuário e uma função',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: selectedUser,
          role: selectedRole as any
        }]);

      if (error) throw error;

      await logAction('assign_role', 'user_roles', selectedUser, null, { role: selectedRole });

      toast({
        title: 'Função atribuída',
        description: 'A função foi atribuída com sucesso'
      });

      loadUsers();
      setSelectedUser('');
      setSelectedRole('');
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Erro ao atribuir função',
        description: error.message || 'Não foi possível atribuir a função',
        variant: 'destructive'
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;

      await logAction('remove_role', 'user_roles', userId, { role }, null);

      toast({
        title: 'Função removida',
        description: 'A função foi removida com sucesso'
      });

      loadUsers();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Erro ao remover função',
        description: error.message || 'Não foi possível remover a função',
        variant: 'destructive'
      });
    }
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestão de Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta área.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Gestão de Permissões
        </CardTitle>
        <CardDescription>
          Gerencie funções e permissões dos usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assign Role Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Atribuir Função</h3>
          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar função" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={assignRole}>
              <UserPlus className="w-4 h-4 mr-2" />
              Atribuir
            </Button>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Usuários e Funções</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline">Nenhuma função</Badge>
                      ) : (
                        user.roles.map(role => (
                          <Badge
                            key={role}
                            variant={roleColors[role as keyof typeof roleColors]}
                            className="flex items-center gap-1"
                          >
                            {roleLabels[role as keyof typeof roleLabels]}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeRole(user.id, role)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
