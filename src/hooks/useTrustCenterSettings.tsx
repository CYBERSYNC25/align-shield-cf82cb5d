import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TrustCenterSettingsData {
  id?: string;
  enabled: boolean;
  company_slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  show_score: boolean;
  show_frameworks: boolean;
  show_controls: boolean;
  show_last_audit: boolean;
  custom_message: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface TrustCenterFrameworkSelection {
  framework_id: string;
  framework_name: string;
  show_public: boolean;
  certification_date: string | null;
  certificate_url: string | null;
}

const defaultSettings: TrustCenterSettingsData = {
  enabled: false,
  company_slug: '',
  custom_domain: null,
  logo_url: null,
  primary_color: '#6366f1',
  show_score: true,
  show_frameworks: true,
  show_controls: true,
  show_last_audit: true,
  custom_message: null,
  seo_title: null,
  seo_description: null,
};

export const useTrustCenterSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['trust-center-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('trust_center_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching trust center settings:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch public frameworks selection
  const { data: publicFrameworks, isLoading: isLoadingFrameworks } = useQuery({
    queryKey: ['trust-center-frameworks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('trust_center_frameworks')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching trust center frameworks:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: TrustCenterSettingsData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const settingsPayload = {
        user_id: user.id,
        enabled: data.enabled,
        company_slug: data.company_slug,
        custom_domain: data.custom_domain,
        logo_url: data.logo_url,
        primary_color: data.primary_color,
        show_score: data.show_score,
        show_frameworks: data.show_frameworks,
        show_controls: data.show_controls,
        show_last_audit: data.show_last_audit,
        custom_message: data.custom_message,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('trust_center_settings')
        .upsert(settingsPayload, { onConflict: 'user_id' });

      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-center-settings'] });
      toast.success('Configurações do Trust Center salvas!');
    },
    onError: (error: Error) => {
      console.error('Error saving trust center settings:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  // Save public frameworks selection
  const saveFrameworksMutation = useMutation({
    mutationFn: async (frameworkIds: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Delete existing entries
      await supabase
        .from('trust_center_frameworks')
        .delete()
        .eq('user_id', user.id);

      // Insert new entries
      if (frameworkIds.length > 0) {
        const entries = frameworkIds.map(fwId => ({
          user_id: user.id,
          framework_id: fwId,
          show_public: true,
        }));

        const { error } = await supabase
          .from('trust_center_frameworks')
          .insert(entries);

        if (error) throw error;
      }

      return frameworkIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust-center-frameworks'] });
    },
    onError: (error: Error) => {
      console.error('Error saving trust center frameworks:', error);
      toast.error('Erro ao salvar frameworks públicos');
    },
  });

  // Upload logo
  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/trust-center-logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      toast.error('Erro ao fazer upload do logo');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // Validate slug
  const validateSlug = (slug: string): { isValid: boolean; error?: string } => {
    if (!slug) {
      return { isValid: false, error: 'Slug é obrigatório' };
    }
    if (slug.length < 3) {
      return { isValid: false, error: 'Mínimo 3 caracteres' };
    }
    if (slug.length > 50) {
      return { isValid: false, error: 'Máximo 50 caracteres' };
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { isValid: false, error: 'Apenas letras minúsculas, números e hífens' };
    }
    if (slug.startsWith('-') || slug.endsWith('-')) {
      return { isValid: false, error: 'Não pode começar ou terminar com hífen' };
    }
    return { isValid: true };
  };

  // Sanitize slug input
  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  // Get current settings with defaults
  const getCurrentSettings = (): TrustCenterSettingsData => {
    if (!settings) return defaultSettings;
    
    return {
      id: settings.id,
      enabled: settings.enabled ?? false,
      company_slug: settings.company_slug || '',
      custom_domain: settings.custom_domain,
      logo_url: settings.logo_url,
      primary_color: settings.primary_color || '#6366f1',
      show_score: settings.show_score ?? true,
      show_frameworks: settings.show_frameworks ?? true,
      show_controls: settings.show_controls ?? true,
      show_last_audit: settings.show_last_audit ?? true,
      custom_message: settings.custom_message,
      seo_title: settings.seo_title,
      seo_description: settings.seo_description,
    };
  };

  // Get selected framework IDs
  const getSelectedFrameworkIds = (): string[] => {
    if (!publicFrameworks) return [];
    return publicFrameworks.filter(f => f.show_public).map(f => f.framework_id);
  };

  return {
    settings: getCurrentSettings(),
    selectedFrameworkIds: getSelectedFrameworkIds(),
    isLoading: isLoadingSettings || isLoadingFrameworks,
    isSaving: saveSettingsMutation.isPending || saveFrameworksMutation.isPending,
    saveSettings: saveSettingsMutation.mutateAsync,
    saveFrameworks: saveFrameworksMutation.mutateAsync,
    uploadLogo,
    validateSlug,
    sanitizeSlug,
  };
};
