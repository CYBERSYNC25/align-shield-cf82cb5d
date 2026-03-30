import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Building2, Mail, Phone, MapPin, FileText, Users } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const AdminClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: ['admin-client-detail', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', clientId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!clientId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['admin-client-members', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, role_in_org, avatar_url, created_at')
        .eq('org_id', clientId!);
      if (error) return [];
      return data as any[];
    },
    enabled: !!clientId,
  });

  const handleOpenTenant = () => {
    // Open the tenant app in a new tab
    window.open(`/dashboard?tenant=${clientId}`, '_blank');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      </AdminLayout>
    );
  }

  if (!client) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground">Cliente não encontrado</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
              <p className="text-muted-foreground mt-1">Detalhes do tenant</p>
            </div>
          </div>
          <Button onClick={handleOpenTenant} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir Tenant
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Informações Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Nome" value={client.name} />
              <InfoRow label="Slug" value={client.slug} />
              <InfoRow label="Plano" value={<Badge variant="outline" className="capitalize">{client.plan || 'free'}</Badge>} />
              <InfoRow label="Status" value={
                <Badge className={client.status === 'active' || !client.status 
                  ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                  : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                  {client.status === 'active' || !client.status ? 'Ativo' : client.status}
                </Badge>
              } />
              <InfoRow label="Criado em" value={new Date(client.created_at).toLocaleDateString('pt-BR')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Dados Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="CNPJ" value={client.cnpj || '—'} icon={<FileText className="h-4 w-4" />} />
              <InfoRow label="E-mail" value={client.contact_email || '—'} icon={<Mail className="h-4 w-4" />} />
              <InfoRow label="Telefone" value={client.contact_phone || '—'} icon={<Phone className="h-4 w-4" />} />
              <InfoRow label="Endereço" value={client.address || '—'} icon={<MapPin className="h-4 w-4" />} />
              <InfoRow label="Valor Mensal" value={
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(client.monthly_value) || 0)
              } />
            </CardContent>
          </Card>
        </div>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Membros do Tenant ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum membro encontrado</p>
            ) : (
              <div className="space-y-3">
                {members.map((member: any) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {(member.display_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.display_name || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">
                          Desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{member.role_in_org || 'member'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

const InfoRow = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground flex items-center gap-2">
      {icon}
      {label}
    </span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

export default AdminClientDetail;
