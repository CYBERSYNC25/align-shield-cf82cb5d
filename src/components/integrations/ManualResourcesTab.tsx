/**
 * Manual Resources Tab
 * 
 * Lists, edits, and deletes manually added resources
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  GitBranch,
  Server,
  Database,
  Smartphone,
  Wifi,
  HardDrive,
} from 'lucide-react';
import { ManualEntryModal, ManualResourceType } from './ManualEntryModal';
import { queryKeys } from '@/lib/query-keys';

interface ManualResource {
  id: string;
  resource_type: string;
  resource_id: string;
  resource_data: Record<string, unknown>;
  collected_at: string;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  repository: <GitBranch className="h-4 w-4" />,
  server: <Server className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  application: <Smartphone className="h-4 w-4" />,
  network_device: <Wifi className="h-4 w-4" />,
  bucket: <HardDrive className="h-4 w-4" />,
};

const RESOURCE_LABELS: Record<string, string> = {
  user: 'User Account',
  repository: 'Repository',
  server: 'Server/VM',
  database: 'Database',
  application: 'Application',
  network_device: 'Network Device',
  bucket: 'Storage/Bucket',
};

export function ManualResourcesTab() {
  const { user } = useAuthSafe();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editResource, setEditResource] = useState<ManualResource | null>(null);
  const [deleteResource, setDeleteResource] = useState<ManualResource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: resources = [], isLoading, refetch } = useQuery({
    queryKey: [...queryKeys.integrationData, 'manual'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('integration_collected_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'manual')
        .order('collected_at', { ascending: false });

      if (error) throw error;
      return data as ManualResource[];
    },
    enabled: !!user?.id,
  });

  // Filter resources
  const filteredResources = resources.filter(r => {
    // Type filter
    if (typeFilter !== 'all' && r.resource_type !== typeFilter) return false;
    
    // Search filter
    if (search) {
      const data = r.resource_data;
      const searchLower = search.toLowerCase();
      const name = (data?.name || data?.hostname || data?.email || '') as string;
      return name.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  // Get compliance status for a resource
  const getComplianceStatus = (resource: ManualResource): 'ok' | 'warning' | 'error' => {
    const data = resource.resource_data;
    
    switch (resource.resource_type) {
      case 'user':
        if (data?.mfaEnabled === false && data?.accountStatus === 'active') return 'warning';
        break;
      case 'repository':
        if (data?.visibility === 'public') return 'error';
        if (data?.branchProtection === false) return 'warning';
        break;
      case 'server':
        if (data?.encryptionEnabled === false) return 'warning';
        break;
      case 'database':
        if (data?.publicAccess === true) return 'error';
        if (data?.encryptionAtRest === false) return 'warning';
        break;
      case 'application':
        if (data?.httpsEnabled === false && data?.type === 'Web') return 'error';
        break;
      case 'bucket':
        if (data?.publicAccess === true) return 'error';
        if (data?.encryption === false) return 'warning';
        break;
    }
    
    return 'ok';
  };

  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">OK</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Critical</Badge>;
    }
  };

  const handleDelete = async () => {
    if (!deleteResource) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('integration_collected_data')
        .delete()
        .eq('id', deleteResource.id);

      if (error) throw error;

      toast({
        title: 'Recurso removido',
        description: 'O recurso foi removido com sucesso.',
      });

      refetch();
      queryClient.invalidateQueries({ queryKey: queryKeys.integrationData });
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteResource(null);
    }
  };

  const handleSuccess = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: queryKeys.integrationData });
  };

  const getResourceName = (resource: ManualResource): string => {
    const data = resource.resource_data;
    return (data?.name || data?.hostname || data?.email || 'Unnamed') as string;
  };

  const getResourceDetails = (resource: ManualResource): string => {
    const data = resource.resource_data;
    const parts: string[] = [];
    
    switch (resource.resource_type) {
      case 'user':
        if (data?.email) parts.push(data.email as string);
        if (data?.department) parts.push(data.department as string);
        if (data?.accountStatus) parts.push(data.accountStatus as string);
        break;
      case 'repository':
        if (data?.visibility) parts.push(data.visibility as string);
        if (data?.branchProtection) parts.push('Protected');
        break;
      case 'server':
        if (data?.os) parts.push(data.os as string);
        if (data?.ipAddress) parts.push(data.ipAddress as string);
        break;
      case 'database':
        if (data?.type) parts.push(data.type as string);
        if (data?.encryptionAtRest) parts.push('Encrypted');
        break;
      case 'application':
        if (data?.type) parts.push(data.type as string);
        if (data?.environment) parts.push(data.environment as string);
        break;
      case 'bucket':
        if (data?.provider) parts.push(data.provider as string);
        if (data?.region) parts.push(data.region as string);
        break;
    }
    
    return parts.join(' • ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Manual Resources ({resources.length})
        </h3>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resources List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {filteredResources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No manual resources</p>
              <p className="text-sm">Click "Add Resource" to add your first resource</p>
            </div>
          ) : (
            filteredResources.map((resource) => {
              const status = getComplianceStatus(resource);
              return (
                <Card key={resource.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-muted">
                          {RESOURCE_ICONS[resource.resource_type] || <Database className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{getResourceName(resource)}</span>
                            {getStatusBadge(status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {getResourceDetails(resource)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added: {new Date(resource.collected_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditResource(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteResource(resource)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Add/Edit Modal */}
      <ManualEntryModal
        open={showAddModal || !!editResource}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false);
            setEditResource(null);
          }
        }}
        onSuccess={handleSuccess}
        editResource={editResource ? {
          id: editResource.id,
          resource_type: editResource.resource_type as ManualResourceType,
          resource_data: editResource.resource_data,
        } : undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteResource} onOpenChange={(open) => !open && setDeleteResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteResource ? getResourceName(deleteResource) : ''}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
