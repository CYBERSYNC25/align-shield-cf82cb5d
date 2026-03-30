import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Check } from 'lucide-react';

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
];

const AdminPermissions = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Permissões</h1>
          <p className="text-muted-foreground mt-1">Catálogo de permissões disponíveis para grupos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePermissions.map((perm) => (
            <Card key={perm.key}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{perm.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{perm.description}</p>
                    <Badge variant="outline" className="text-xs mt-2">{perm.key}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPermissions;
