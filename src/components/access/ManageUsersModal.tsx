import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Filter,
  MoreVertical,
  Shield,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ManageUsersModalProps {
  system: any;
  isOpen: boolean;
  onClose: () => void;
}

const ManageUsersModal = ({ system, isOpen, onClose }: ManageUsersModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    lastAccess: string | null;
    permissions: string[];
    department: string;
  }>>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    department: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const user = {
        id: String(users.length + 1),
        ...newUser,
        status: 'pending',
        lastAccess: null,
        permissions: newUser.role === 'administrator' ? ['read', 'write', 'admin'] : ['read']
      };
      
      setUsers(prev => [...prev, user]);
      setNewUser({ name: '', email: '', role: 'user', department: '' });
      toast.success('Usuário adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success('Usuário removido com sucesso!');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    toast.success('Status do usuário atualizado!');
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      administrator: { label: 'Administrador', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      auditor: { label: 'Auditor', className: 'bg-info/10 text-info border-info/20' },
      user: { label: 'Usuário', className: 'bg-muted/20 text-muted-foreground' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', className: 'bg-success/10 text-success border-success/20' },
      inactive: { label: 'Inativo', className: 'bg-muted/20 text-muted-foreground' },
      pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (!system) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Usuários - {system.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Usuários ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="add">Adicionar Usuário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <div className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar usuários..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="administrator">Administrador</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{user.name}</p>
                              {getRoleBadge(user.role)}
                              {getStatusBadge(user.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{user.email}</span>
                              <span>•</span>
                              <span>{user.department}</span>
                              {user.lastAccess && (
                                <>
                                  <span>•</span>
                                  <span>Último acesso: {user.lastAccess}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.status === 'active'}
                            onCheckedChange={() => handleToggleUserStatus(user.id)}
                            disabled={user.status === 'pending'}
                          />
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar Usuário
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Shield className="h-4 w-4 mr-2" />
                                Gerenciar Permissões
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleRemoveUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover Usuário
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredUsers.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Adicionar Novo Usuário
                </CardTitle>
                <CardDescription>
                  Adicione um novo usuário ao sistema {system.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName">Nome Completo</Label>
                    <Input
                      id="userName"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userEmail">Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="usuario@empresa.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userRole">Função</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="administrator">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="userDepartment">Departamento</Label>
                    <Input
                      id="userDepartment"
                      value={newUser.department}
                      onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Ex: TI, RH, Financeiro"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleAddUser} disabled={loading}>
                    {loading ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2 animate-pulse" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Usuário
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageUsersModal;