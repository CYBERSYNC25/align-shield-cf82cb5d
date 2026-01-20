import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Save, 
  ExternalLink, 
  Copy, 
  Loader2, 
  Palette, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Upload
} from 'lucide-react';
import { useTrustCenterSettings, TrustCenterSettingsData } from '@/hooks/useTrustCenterSettings';
import { useFrameworks } from '@/hooks/useFrameworks';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const TrustCenterSettings = () => {
  const {
    settings: initialSettings,
    selectedFrameworkIds: initialSelectedFrameworks,
    isLoading,
    isSaving,
    saveSettings,
    saveFrameworks,
    uploadLogo,
    validateSlug,
    sanitizeSlug,
  } = useTrustCenterSettings();

  const { frameworks, loading: loadingFrameworks } = useFrameworks();

  const [formData, setFormData] = useState<TrustCenterSettingsData>(initialSettings);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(initialSelectedFrameworks);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sync initial data when loaded
  useEffect(() => {
    if (!isLoading) {
      setFormData(initialSettings);
      setSelectedFrameworks(initialSelectedFrameworks);
    }
  }, [isLoading, initialSettings, initialSelectedFrameworks]);

  const handleFieldChange = <K extends keyof TrustCenterSettingsData>(
    field: K,
    value: TrustCenterSettingsData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSlugChange = (value: string) => {
    const sanitized = sanitizeSlug(value);
    setFormData(prev => ({ ...prev, company_slug: sanitized }));
    
    if (sanitized) {
      const validation = validateSlug(sanitized);
      setSlugError(validation.isValid ? null : validation.error || null);
    } else {
      setSlugError(null);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPG ou SVG.');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    const url = await uploadLogo(file);
    setIsUploadingLogo(false);

    if (url) {
      setFormData(prev => ({ ...prev, logo_url: url }));
      toast.success('Logo enviado com sucesso!');
    }
  };

  const handleFrameworkToggle = (frameworkId: string, checked: boolean) => {
    if (checked) {
      setSelectedFrameworks(prev => [...prev, frameworkId]);
    } else {
      setSelectedFrameworks(prev => prev.filter(id => id !== frameworkId));
    }
  };

  const handleSave = async () => {
    // Validate slug before saving
    if (formData.enabled) {
      const validation = validateSlug(formData.company_slug);
      if (!validation.isValid) {
        setSlugError(validation.error || 'Slug inválido');
        toast.error('Por favor, corrija o slug antes de salvar.');
        return;
      }
    }

    try {
      await saveSettings(formData);
      await saveFrameworks(selectedFrameworks);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/trust/${formData.company_slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  const handlePreview = () => {
    if (formData.company_slug) {
      window.open(`/trust/${formData.company_slug}`, '_blank');
    }
  };

  const visibilityOptions = [
    { key: 'show_score' as const, label: 'Mostrar Compliance Score', desc: 'Exibe o score geral de compliance' },
    { key: 'show_frameworks' as const, label: 'Mostrar Frameworks Certificados', desc: 'Lista de frameworks selecionados abaixo' },
    { key: 'show_controls' as const, label: 'Mostrar Lista de Controles', desc: 'Resumo de controles implementados' },
    { key: 'show_last_audit' as const, label: 'Mostrar Última Auditoria', desc: 'Data e tipo da última auditoria realizada' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Trust Center Público</CardTitle>
              <CardDescription>
                Configure uma página pública para compartilhar seu status de compliance com clientes e parceiros.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.enabled ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Habilitar Trust Center Público</p>
                <p className="text-sm text-muted-foreground">
                  {formData.enabled 
                    ? 'Sua página está visível publicamente' 
                    : 'Sua página não está acessível ao público'}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => handleFieldChange('enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* URL Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração da URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Company Slug</Label>
            <div className="relative">
              <Input
                id="slug"
                value={formData.company_slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="minha-empresa"
                className={slugError ? 'border-destructive' : ''}
              />
              {formData.company_slug && !slugError && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {slugError && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Apenas letras minúsculas, números e hífens. Ex: minha-empresa
            </p>
          </div>

          {formData.company_slug && !slugError && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Sua página estará disponível em:</p>
              <p className="font-mono text-sm mt-1">
                {window.location.origin}/trust/
                <span className="font-bold text-primary">{formData.company_slug}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branding</CardTitle>
          <CardDescription>Personalize a aparência da sua página</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={isUploadingLogo}
                      asChild
                    >
                      <span>
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {formData.logo_url ? 'Alterar Logo' : 'Enviar Logo'}
                      </span>
                    </Button>
                  </div>
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG ou SVG. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cor Primária
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  type="color"
                  value={formData.primary_color || '#6366f1'}
                  onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer border-2"
                />
              </div>
              <Input
                type="text"
                value={formData.primary_color || '#6366f1'}
                onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                className="w-32 font-mono"
                placeholder="#6366f1"
              />
              <div 
                className="h-10 flex-1 rounded-md border"
                style={{ backgroundColor: formData.primary_color || '#6366f1' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visibilidade</CardTitle>
          <CardDescription>Escolha quais informações mostrar publicamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibilityOptions.map(opt => (
            <div 
              key={opt.key} 
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
              <Checkbox
                checked={formData[opt.key]}
                onCheckedChange={(checked) => handleFieldChange(opt.key, !!checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mensagem Customizada</CardTitle>
          <CardDescription>Adicione uma mensagem de boas-vindas para visitantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={formData.custom_message || ''}
              onChange={(e) => handleFieldChange('custom_message', e.target.value)}
              placeholder="Bem-vindo ao nosso Trust Center. Aqui você encontra informações atualizadas sobre nossos programas de compliance e segurança da informação..."
              className="min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {(formData.custom_message?.length || 0)}/1000 caracteres
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO</CardTitle>
          <CardDescription>Otimize sua página para mecanismos de busca</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo-title">Título da Página</Label>
            <Input
              id="seo-title"
              value={formData.seo_title || ''}
              onChange={(e) => handleFieldChange('seo_title', e.target.value)}
              placeholder="Trust Center | Minha Empresa"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.seo_title?.length || 0)}/60 caracteres
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-desc">Meta Descrição</Label>
            <Textarea
              id="seo-desc"
              value={formData.seo_description || ''}
              onChange={(e) => handleFieldChange('seo_description', e.target.value)}
              placeholder="Conheça nossos programas de compliance e certificações de segurança. Transparência e confiança para nossos clientes."
              className="min-h-[80px]"
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.seo_description?.length || 0)}/160 caracteres
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Framework Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frameworks Públicos</CardTitle>
          <CardDescription>Selecione quais frameworks exibir na página pública</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingFrameworks ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : frameworks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum framework cadastrado.</p>
              <p className="text-sm">Adicione frameworks na página de Controles & Frameworks.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {frameworks.map(fw => (
                <div 
                  key={fw.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`fw-${fw.id}`}
                    checked={selectedFrameworks.includes(fw.id)}
                    onCheckedChange={(checked) => handleFrameworkToggle(fw.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`fw-${fw.id}`} className="cursor-pointer font-medium">
                      {fw.name}
                    </Label>
                    {fw.version && (
                      <p className="text-xs text-muted-foreground">{fw.version}</p>
                    )}
                  </div>
                  <Badge 
                    variant={
                      (fw.compliance_score || 0) >= 80 ? 'default' : 
                      (fw.compliance_score || 0) >= 50 ? 'secondary' : 'outline'
                    }
                  >
                    {fw.compliance_score || 0}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSave}
              disabled={isSaving || (formData.enabled && !!slugError)}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
            
            <Button 
              variant="outline"
              onClick={handlePreview}
              disabled={!formData.company_slug || !formData.enabled}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleCopyLink}
              disabled={!formData.company_slug}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
          </div>

          {!formData.enabled && formData.company_slug && (
            <p className="text-sm text-muted-foreground mt-3">
              ⚠️ O Trust Center está desabilitado. Habilite-o para que visitantes possam acessar a página.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrustCenterSettings;
