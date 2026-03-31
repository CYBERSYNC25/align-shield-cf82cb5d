import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminTenantBanner = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tenantId = searchParams.get('admin_tenant');

  const { data: tenantName } = useQuery({
    queryKey: ['admin-tenant-name', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', tenantId!)
        .single();
      return data?.name || 'Cliente';
    },
    enabled: !!tenantId,
    staleTime: Infinity,
  });

  if (!tenantId) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground h-10 flex items-center justify-between px-4 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        <span className="font-medium">Modo Administrador</span>
        <span className="opacity-80">—</span>
        <span>{tenantName || 'Carregando...'}</span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => navigate('/admin/clients')}
      >
        <ArrowLeft className="h-3 w-3" />
        Voltar ao Admin
      </Button>
    </div>
  );
};

export default AdminTenantBanner;
