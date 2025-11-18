import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AzureTestResult {
  success: boolean;
  step: string;
  message?: string;
  error?: string;
  recommendation?: string;
  user_info?: {
    name: string;
    email: string;
    id: string;
  };
  token_status?: {
    valid: boolean;
    expires_at: string;
    scopes: string;
  };
  test_summary?: Record<string, string>;
  details?: any;
  status_code?: number;
}

export const useAzureConnection = () => {
  const [testing, setTesting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [testResult, setTestResult] = useState<AzureTestResult | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('azure-test-connection');

      if (error) throw error;

      setTestResult(data);

      if (data.success) {
        toast({
          title: 'Teste concluído com sucesso',
          description: 'A integração com Azure AD está funcionando corretamente',
        });
      } else {
        toast({
          title: 'Teste falhou',
          description: data.error || 'Erro ao testar conexão',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error testing Azure connection:', error);
      const errorResult: AzureTestResult = {
        success: false,
        step: 'request_failed',
        error: error.message || 'Erro ao executar teste',
        recommendation: 'Verifique sua conexão e tente novamente'
      };
      setTestResult(errorResult);
      toast({
        title: 'Erro no teste',
        description: error.message || 'Não foi possível executar o teste',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const revokeConnection = async () => {
    setRevoking(true);

    try {
      const { data, error } = await supabase.functions.invoke('azure-oauth-revoke');

      if (error) throw error;

      toast({
        title: 'Conexão revogada',
        description: 'A integração com Azure AD foi desconectada',
      });

      setTestResult(null);
      return true;
    } catch (error: any) {
      console.error('Error revoking Azure connection:', error);
      toast({
        title: 'Erro ao revogar',
        description: error.message || 'Não foi possível revogar a conexão',
        variant: 'destructive',
      });
      return false;
    } finally {
      setRevoking(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('integration_oauth_tokens')
        .select('id, expires_at, scope, created_at')
        .eq('user_id', user.id)
        .eq('integration_name', 'azure_ad')
        .single();

      if (error || !data) return null;

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const isExpired = expiresAt <= now;

      return {
        connected: true,
        expires_at: data.expires_at,
        scopes: data.scope,
        created_at: data.created_at,
        is_expired: isExpired
      };
    } catch (error) {
      console.error('Error checking connection status:', error);
      return null;
    }
  };

  return {
    testing,
    revoking,
    testResult,
    testConnection,
    revokeConnection,
    checkConnectionStatus,
  };
};
