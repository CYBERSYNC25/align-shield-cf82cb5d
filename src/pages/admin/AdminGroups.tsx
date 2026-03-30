import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FolderKanban, Plus, Pencil, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useAdminLog } from '@/hooks/useAdminLog';
import type { PlatformAdminGroup } from '@/types/platform-admin';

const availablePermissions = [
  { key: 'all', label: 'Acesso Total', description: 'Todas as permissões da plataforma' },
  { key: 'clients.view', label: 'Visualizar Clientes', description: 'Ver lista e detalhes de clientes' },
  { key: 'clients.edit', label: 'Editar Clientes', description: 'Alterar dados cadastrais de clientes' },
  { key: 'clients.tenant', label: 'Acessar Tenants', description: 'Abrir e visualizar tenants dos clientes' },
  { key: 'users.view', label: 'Visualizar Usuários', description: 'Ver lista de administradores' },
  { key: 'users.manage', label: 'Gerenciar Usuários', description: 'Criar, editar e desativar administradores' },
  { key: 'groups.manage', label: 'Gerenciar Grupos', description: 'Criar e editar grupos de permissões' },
  { key: 'financial.view', label: 'Visualizar Financeiro', description: 'Acessar dados financeiros' },
  { key: 'financial.manage', label: 'Gerenciar Financeiro', description: 'Alterar valores e planos' },
  { key: 'logs.view', label: 'Visualizar Logs', description: 'Acessar logs do sistema' },
];

const AdminGroups = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PlatformAdminGroup | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_admin_groups' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as PlatformAdminGroup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingGroup) {
        const { error } = await supabase
          .from('platform_admin_groups' as any)
          .update({ name, description, permissions: selectedPermissions } as any)
          .eq('id', editingGroup.id);
        if (error) throw error;
        await logAction('update', 'group', editingGroup.id, { name, permissions: selectedPermissions });
      } else {
        const { error } = await supabase
          .from('platform_admin_groups' as any)
          .insert({ name, description, permissions: selectedPermissions } as any);
        if (error) throw error;
        await logAction('create', 'group', undefined, { name, permissions: selectedPermissions });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      toast({ title: editingGroup ? 'Grupo atualizado' : 'Grupo criado com sucesso' });
      closeDialog();
    },
    onError: (e: any) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_admin_groups' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      await logAction('delete', 'group', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      toast({ title: 'Grupo excluído' });
    },
  });

  const openCreate = () => {
    setEditingGroup(null);
    setName('');
    setDescription('');
    setSelectedPermissions([]);
    setShowDialog(true);
  };

  const openEdit = (group: PlatformAdminGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setSelectedPermissions(group.permissions || []);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingGroup(null);
  };

  const togglePermission = (key: string) => {
    if (key === 'all') {
      if (selectedPermissions.includes('all')) {
        setSelectedPermissions([]);
      } else {
        setSelectedPermissions(availablePermissions.map(p => p.key));
      }
      return;
    }
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grupos & Permissões</h1>
            <p className="text-muted-foreground mt-1">Gerencie grupos e suas permissões de acesso</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          {group.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{group.description || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[300px]">
                          {(group.permissions || []).slice(0, 3).map((perm: string) => (
                            <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                          ))}
                          {(group.permissions || []).length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{group.permissions.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(group.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(group)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(group.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum grupo cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Administradores" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o grupo..." />
            </div>
            <div className="space-y-3">
              <Label>Permissões</Label>
              <div className="border rounded-lg p-3 space-y-3 max-h-[300px] overflow-y-auto">
                {availablePermissions.map((perm) => (
                  <div key={perm.key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={selectedPermissions.includes(perm.key)}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                    <div>
                      <p className="text-sm font-medium">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!name || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : editingGroup ? 'Salvar' : 'Criar Grupo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminGroups;
