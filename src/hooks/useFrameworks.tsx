import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Framework = Database['public']['Tables']['frameworks']['Row'];
type FrameworkInsert = Database['public']['Tables']['frameworks']['Insert'];
type FrameworkUpdate = Database['public']['Tables']['frameworks']['Update'];

// Tipo para controles de framework
export interface FrameworkControl {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  status: 'passed' | 'failed' | 'pending' | 'na';
  evidence_count: number;
  owner: string;
  last_verified: string;
  next_review: string;
  findings?: string[];
  framework_id: string;
  user_id: string;
}

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) {
      setFrameworks([]);
      setControls([]);
      setLoading(false);
      return;
    }

    try {
      // Buscar frameworks do Supabase
      const { data: frameworksData, error: frameworksError } = await supabase
        .from('frameworks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (frameworksError) throw frameworksError;

      // Buscar controls do Supabase
      const { data: controlsData, error: controlsError } = await supabase
        .from('controls')
        .select('*')
        .eq('user_id', user.id)
        .order('code', { ascending: true });

      if (controlsError) throw controlsError;
      
      setFrameworks(frameworksData ?? []);
      setControls((controlsData ?? []).map((c: Record<string, unknown>) => ({
        ...c,
        id: c.id as string,
        code: c.code as string,
        title: c.title as string,
        category: c.category as string,
        description: c.description as string,
        status: (c.status as FrameworkControl['status']) ?? 'pending',
        evidence_count: (c.evidence_count as number) ?? 0,
        owner: (c.owner as string) ?? '',
        last_verified: (c.last_verified as string) ?? '',
        next_review: (c.next_review as string) ?? '',
        findings: (c.findings as string[] | undefined) ?? [],
        framework_id: c.framework_id as string,
        user_id: c.user_id as string,
      })));
    } catch (error) {
      console.error('Erro ao buscar frameworks:', error);
      setFrameworks([]);
      setControls([]);
      toast({
        title: 'Erro ao carregar frameworks',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create framework
  const createFramework = async (frameworkData: Omit<FrameworkInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('frameworks')
        .insert({
          ...frameworkData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setFrameworks(prev => [data, ...prev]);
      toast({
        title: "Framework criado",
        description: "Novo framework foi criado com sucesso"
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao criar framework:', error);
      toast({
        title: 'Erro ao criar framework',
        description: 'Não foi possível criar o framework. Tente novamente.',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Update framework
  const updateFramework = async (id: string, updates: FrameworkUpdate) => {
    try {
      const { error } = await supabase
        .from('frameworks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFrameworks(prev => prev.map(framework => 
        framework.id === id ? { ...framework, ...updates } : framework
      ));

      toast({
        title: "Framework atualizado",
        description: "Framework foi atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar framework:', error);
      toast({
        title: 'Erro ao atualizar framework',
        description: 'Não foi possível atualizar. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Update control status
  const updateControlStatus = async (controlId: string, status: FrameworkControl['status']) => {
    setControls(prev => prev.map(control => 
      control.id === controlId ? { ...control, status } : control
    ));

    toast({
      title: "Status atualizado",
      description: "Status do controle foi atualizado"
    });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Calculate framework statistics
  const getFrameworkStats = (frameworkId: string) => {
    const frameworkControls = controls.filter(c => c.framework_id === frameworkId);
    const passed = frameworkControls.filter(c => c.status === 'passed').length;
    const failed = frameworkControls.filter(c => c.status === 'failed').length;
    const pending = frameworkControls.filter(c => c.status === 'pending').length;
    const total = frameworkControls.length;
    const progress = total > 0 ? Math.round((passed / total) * 100) : 0;

    return {
      total,
      passed,
      failed,
      pending,
      progress
    };
  };

  // Create control
  const createControl = async (controlData: Omit<FrameworkControl, 'id' | 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('controls')
        .insert({
          ...controlData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const mapped: FrameworkControl = {
        id: data.id,
        code: data.code,
        title: data.title,
        category: data.category,
        description: data.description ?? '',
        status: (data.status as FrameworkControl['status']) ?? 'pending',
        evidence_count: data.evidence_count ?? 0,
        owner: data.owner ?? '',
        last_verified: data.last_verified ?? '',
        next_review: data.next_review ?? '',
        findings: data.findings ?? [],
        framework_id: data.framework_id,
        user_id: data.user_id
      };
      setControls(prev => [mapped, ...prev]);
      toast({
        title: "Controle criado",
        description: `Controle "${mapped.title}" criado com sucesso`
      });
      return mapped;
    } catch (error) {
      console.error('Erro ao criar controle:', error);
      toast({
        title: 'Erro ao criar controle',
        description: 'Não foi possível criar o controle. Tente novamente.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const deleteFramework = async (id: string) => {
    try {
      if (!user) {
        setFrameworks(frameworks.filter(f => f.id !== id));
        return;
      }

      const { error } = await supabase.from('frameworks').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      setFrameworks(frameworks.filter(f => f.id !== id));
      toast({ title: 'Framework excluído com sucesso' });
    } catch (error) {
      console.error('Error deleting framework:', error);
      toast({ title: 'Erro ao excluir framework', variant: 'destructive' });
      throw error;
    }
  };

  const updateControl = async (id: string, updates: any) => {
    try {
      if (!user) {
        setControls(controls.map(c => c.id === id ? { ...c, ...updates } : c));
        return;
      }

      const { error } = await supabase.from('controls').update(updates).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      setControls(controls.map(c => c.id === id ? { ...c, ...updates } : c));
      toast({ title: 'Controle atualizado com sucesso' });
    } catch (error) {
      console.error('Error updating control:', error);
      toast({ title: 'Erro ao atualizar controle', variant: 'destructive' });
      throw error;
    }
  };

  return {
    frameworks,
    controls,
    loading,
    createFramework,
    createControl,
    updateFramework,
    deleteFramework,
    updateControl,
    updateControlStatus,
    getFrameworkStats,
    refetch: fetchData
  };
}