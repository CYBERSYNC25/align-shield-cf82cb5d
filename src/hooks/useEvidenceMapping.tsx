import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type EvidenceMapping = Tables<'integration_evidence_mapping'>;

export function useEvidenceMapping() {
  const [mappings, setMappings] = useState<EvidenceMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMappings = async () => {
    if (!user) {
      setMappings([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('integration_evidence_mapping')
        .select('*')
        .order('integration_name');

      if (error) throw error;

      setMappings(data || []);
    } catch (error) {
      console.error('Error fetching evidence mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkControlToEvidence = async (mappingId: string, controlId: string | null) => {
    try {
      const { error } = await supabase
        .from('integration_evidence_mapping')
        .update({ control_id: controlId })
        .eq('id', mappingId);

      if (error) throw error;

      setMappings(prev =>
        prev.map(m => m.id === mappingId ? { ...m, control_id: controlId } : m)
      );

      toast({
        title: 'Vinculação atualizada',
        description: controlId
          ? 'Controle vinculado à evidência automática.'
          : 'Vinculação removida.',
      });

      return true;
    } catch (error) {
      console.error('Error linking control to evidence:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a vinculação.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getMappingsForControl = (controlId: string) => {
    return mappings.filter(m => m.control_id === controlId);
  };

  const getAvailableMappings = () => {
    return mappings.filter(m => !m.control_id);
  };

  useEffect(() => {
    fetchMappings();
  }, [user]);

  return {
    mappings,
    loading,
    linkControlToEvidence,
    getMappingsForControl,
    getAvailableMappings,
    refetch: fetchMappings,
  };
}
