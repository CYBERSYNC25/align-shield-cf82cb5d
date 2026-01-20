/**
 * Manual Entry Modal
 * 
 * Allows users to manually add resources to compliance monitoring
 * without connecting external APIs
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, Plus } from 'lucide-react';

export type ManualResourceType = 
  | 'user'
  | 'repository'
  | 'server'
  | 'database'
  | 'application'
  | 'network_device'
  | 'bucket';

interface ResourceTypeConfig {
  label: string;
  icon: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'boolean' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
}

const RESOURCE_TYPES: Record<ManualResourceType, ResourceTypeConfig> = {
  user: {
    label: 'User Account',
    icon: '👤',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'mfaEnabled', label: 'MFA Enabled', type: 'boolean', defaultValue: false },
      { name: 'lastLoginDate', label: 'Last Login Date', type: 'date' },
      { 
        name: 'accountStatus', 
        label: 'Account Status', 
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
        defaultValue: 'active',
      },
    ],
  },
  repository: {
    label: 'Repository',
    icon: '📁',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { 
        name: 'visibility', 
        label: 'Visibility', 
        type: 'select',
        options: [
          { value: 'private', label: 'Private' },
          { value: 'public', label: 'Public' },
        ],
        defaultValue: 'private',
      },
      { name: 'branchProtection', label: 'Branch Protection', type: 'boolean', defaultValue: true },
      { name: 'languages', label: 'Languages', type: 'text' },
      { name: 'lastCommitDate', label: 'Last Commit Date', type: 'date' },
    ],
  },
  server: {
    label: 'Server/VM',
    icon: '🖥️',
    fields: [
      { name: 'hostname', label: 'Hostname', type: 'text', required: true },
      { name: 'ipAddress', label: 'IP Address', type: 'text' },
      { name: 'os', label: 'Operating System', type: 'text' },
      { name: 'encryptionEnabled', label: 'Encryption Enabled', type: 'boolean', defaultValue: true },
      { 
        name: 'backupStatus', 
        label: 'Backup Status', 
        type: 'select',
        options: [
          { value: 'enabled', label: 'Enabled' },
          { value: 'disabled', label: 'Disabled' },
        ],
        defaultValue: 'enabled',
      },
      { name: 'lastPatchedDate', label: 'Last Patched Date', type: 'date' },
    ],
  },
  database: {
    label: 'Database',
    icon: '🗄️',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { 
        name: 'type', 
        label: 'Database Type', 
        type: 'select',
        options: [
          { value: 'PostgreSQL', label: 'PostgreSQL' },
          { value: 'MySQL', label: 'MySQL' },
          { value: 'MongoDB', label: 'MongoDB' },
          { value: 'Oracle', label: 'Oracle' },
          { value: 'SQL Server', label: 'SQL Server' },
          { value: 'Other', label: 'Other' },
        ],
        defaultValue: 'PostgreSQL',
      },
      { name: 'encryptionAtRest', label: 'Encryption at Rest', type: 'boolean', defaultValue: true },
      { name: 'publicAccess', label: 'Public Access', type: 'boolean', defaultValue: false },
      { 
        name: 'backupFrequency', 
        label: 'Backup Frequency', 
        type: 'select',
        options: [
          { value: 'hourly', label: 'Hourly' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'none', label: 'None' },
        ],
        defaultValue: 'daily',
      },
    ],
  },
  application: {
    label: 'Application',
    icon: '📱',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { 
        name: 'type', 
        label: 'Application Type', 
        type: 'select',
        options: [
          { value: 'Web', label: 'Web' },
          { value: 'Mobile', label: 'Mobile' },
          { value: 'Desktop', label: 'Desktop' },
          { value: 'API', label: 'API' },
        ],
        defaultValue: 'Web',
      },
      { 
        name: 'environment', 
        label: 'Environment', 
        type: 'select',
        options: [
          { value: 'Production', label: 'Production' },
          { value: 'Staging', label: 'Staging' },
          { value: 'Development', label: 'Development' },
        ],
        defaultValue: 'Production',
      },
      { name: 'httpsEnabled', label: 'HTTPS Enabled', type: 'boolean', defaultValue: true },
      { name: 'lastSecurityScan', label: 'Last Security Scan', type: 'date' },
    ],
  },
  network_device: {
    label: 'Network Device',
    icon: '🌐',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { 
        name: 'type', 
        label: 'Device Type', 
        type: 'select',
        options: [
          { value: 'Router', label: 'Router' },
          { value: 'Firewall', label: 'Firewall' },
          { value: 'Switch', label: 'Switch' },
          { value: 'Load Balancer', label: 'Load Balancer' },
          { value: 'VPN', label: 'VPN Gateway' },
        ],
        defaultValue: 'Router',
      },
      { name: 'ipAddress', label: 'IP Address', type: 'text' },
      { name: 'firmwareVersion', label: 'Firmware Version', type: 'text' },
      { name: 'lastUpdated', label: 'Last Updated', type: 'date' },
    ],
  },
  bucket: {
    label: 'Storage/Bucket',
    icon: '📦',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { 
        name: 'provider', 
        label: 'Provider', 
        type: 'select',
        options: [
          { value: 'AWS S3', label: 'AWS S3' },
          { value: 'Azure Blob', label: 'Azure Blob' },
          { value: 'GCP Cloud Storage', label: 'GCP Cloud Storage' },
          { value: 'Other', label: 'Other' },
        ],
        defaultValue: 'AWS S3',
      },
      { name: 'region', label: 'Region', type: 'text' },
      { name: 'publicAccess', label: 'Public Access', type: 'boolean', defaultValue: false },
      { name: 'encryption', label: 'Encryption', type: 'boolean', defaultValue: true },
      { name: 'versioningEnabled', label: 'Versioning Enabled', type: 'boolean', defaultValue: false },
    ],
  },
};

interface ManualEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editResource?: {
    id: string;
    resource_type: ManualResourceType;
    resource_data: Record<string, unknown>;
  };
}

export function ManualEntryModal({
  open,
  onOpenChange,
  onSuccess,
  editResource,
}: ManualEntryModalProps) {
  const [resourceType, setResourceType] = useState<ManualResourceType>(
    editResource?.resource_type || 'user'
  );
  const [formData, setFormData] = useState<Record<string, string | boolean>>(
    editResource?.resource_data as Record<string, string | boolean> || {}
  );
  const [saving, setSaving] = useState(false);

  const isEditMode = !!editResource;
  const config = RESOURCE_TYPES[resourceType];

  // Initialize form with defaults when resource type changes
  const handleResourceTypeChange = (type: ManualResourceType) => {
    setResourceType(type);
    const defaults: Record<string, string | boolean> = {};
    RESOURCE_TYPES[type].fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
    setFormData(defaults);
  };

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    const missingFields = config.fields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast({
        title: 'Campos obrigatórios',
        description: `Preencha: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuário não autenticado');

      // Ensure "manual" integration exists
      const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('provider', 'manual')
        .maybeSingle();

      if (!existing) {
        await supabase.from('integrations').insert({
          user_id: userData.user.id,
          provider: 'manual',
          name: 'Manual Entry',
          status: 'connected',
        });
      }

      if (isEditMode && editResource) {
        // Update existing resource
        const { error } = await supabase
          .from('integration_collected_data')
          .update({
            resource_data: formData,
            collected_at: new Date().toISOString(),
          })
          .eq('id', editResource.id);

        if (error) throw error;

        toast({
          title: 'Recurso atualizado',
          description: 'O recurso foi atualizado com sucesso.',
        });
      } else {
        // Insert new resource
        const resourceId = `manual-${resourceType}-${Date.now()}`;

        const { error } = await supabase.from('integration_collected_data').insert({
          user_id: userData.user.id,
          integration_name: 'manual',
          resource_type: resourceType,
          resource_id: resourceId,
          resource_data: {
            ...formData,
            addedAt: new Date().toISOString(),
          },
          collected_at: new Date().toISOString(),
        });

        if (error) throw error;

        toast({
          title: 'Recurso adicionado',
          description: 'O recurso será avaliado pelo motor de compliance.',
        });
      }

      onSuccess?.();
      onOpenChange(false);
      setFormData({});
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.name} className="flex items-center justify-between py-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
            </Label>
            <Switch
              id={field.name}
              checked={value === true}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={value as string || ''}
              onValueChange={(v) => handleFieldChange(field.name, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="date"
              value={value as string || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              value={value as string || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {isEditMode ? 'Edit Resource' : 'Manual Entry'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the resource details below.'
              : 'Add resources manually to compliance monitoring without API integration.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resource Type Selector */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Select
                value={resourceType}
                onValueChange={(v) => handleResourceTypeChange(v as ManualResourceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESOURCE_TYPES).map(([key, conf]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dynamic Fields */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {config.icon} {config.label} Details
            </h4>
            {config.fields.map(renderField)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Resource' : 'Add Resource'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
