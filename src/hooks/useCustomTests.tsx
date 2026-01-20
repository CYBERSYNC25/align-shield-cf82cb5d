import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import type { CustomTestInput, TestLogic } from '@/lib/custom-test-schemas';
import { evaluateTestLogic } from '@/lib/custom-test-schemas';

export interface CustomTest {
  id: string;
  user_id: string;
  test_name: string;
  test_description: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  integration_name: string;
  resource_type: string;
  enabled: boolean;
  version: number;
  test_logic: TestLogic;
  sla_hours: number | null;
  created_by: string | null;
  last_run_at: string | null;
  execution_count: number | null;
  avg_execution_time_ms: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  id: string;
  test_id: string;
  user_id: string;
  status: 'passed' | 'failed' | 'error';
  affected_resources_count: number | null;
  execution_time_ms: number | null;
  error_message: string | null;
  result_details: Record<string, any> | null;
  triggered_by: string | null;
  executed_at: string;
}

export interface TestRunResult {
  passing: any[];
  failing: any[];
  errors: { resource: any; error: string }[];
  executionTimeMs: number;
}

export function useCustomTests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all custom tests
  const { data: tests = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.customTests,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('custom_compliance_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast JSON fields properly
      return (data || []).map(d => ({ ...d, test_logic: d.test_logic as unknown as TestLogic })) as CustomTest[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch single test by ID
  const getTestById = async (testId: string): Promise<CustomTest | null> => {
    const { data, error } = await supabase
      .from('custom_compliance_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (error) {
      console.error('Error fetching test:', error);
      return null;
    }
    return { ...data, test_logic: data.test_logic as unknown as TestLogic } as CustomTest;
  };

  // Create new test
  const createTest = useMutation({
    mutationFn: async (input: CustomTestInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('custom_compliance_tests')
        .insert([{
          user_id: user.id,
          test_name: input.test_name,
          test_description: input.test_description || null,
          severity: input.severity,
          integration_name: input.integration_name,
          resource_type: input.resource_type,
          test_logic: JSON.parse(JSON.stringify(input.test_logic)),
          sla_hours: input.sla_hours || null,
          enabled: input.enabled ?? false,
          created_by: user.email || user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...data, test_logic: data.test_logic as unknown as TestLogic } as CustomTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customTests });
      toast.success('Teste criado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating test:', error);
      toast.error('Erro ao criar teste');
    }
  });

  // Update existing test
  const updateTest = useMutation({
    mutationFn: async ({ id, ...input }: CustomTestInput & { id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current version for optimistic locking
      const { data: current } = await supabase
        .from('custom_compliance_tests')
        .select('version')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('custom_compliance_tests')
        .update({
          test_name: input.test_name,
          test_description: input.test_description || null,
          severity: input.severity,
          integration_name: input.integration_name,
          resource_type: input.resource_type,
          test_logic: input.test_logic as unknown as Record<string, unknown>,
          sla_hours: input.sla_hours || null,
          enabled: input.enabled ?? false,
          version: (current?.version || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customTests });
      toast.success('Teste atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating test:', error);
      toast.error('Erro ao atualizar teste');
    }
  });

  // Delete test
  const deleteTest = useMutation({
    mutationFn: async (testId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('custom_compliance_tests')
        .delete()
        .eq('id', testId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customTests });
      toast.success('Teste excluído com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting test:', error);
      toast.error('Erro ao excluir teste');
    }
  });

  // Toggle test enabled/disabled
  const toggleTestEnabled = useMutation({
    mutationFn: async ({ testId, enabled }: { testId: string; enabled: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('custom_compliance_tests')
        .update({ 
          enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomTest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customTests });
      toast.success(data.enabled ? 'Teste ativado' : 'Teste desativado');
    },
    onError: (error) => {
      console.error('Error toggling test:', error);
      toast.error('Erro ao alterar status do teste');
    }
  });

  // Run test against collected data
  const runTest = async (
    testLogic: TestLogic, 
    integrationName: string, 
    resourceType: string
  ): Promise<TestRunResult> => {
    if (!user?.id) throw new Error('User not authenticated');

    const startTime = performance.now();

    // Fetch collected data for this integration/resource
    const { data: resources, error } = await supabase
      .from('integration_collected_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_name', integrationName)
      .eq('resource_type', resourceType);

    if (error) throw error;

    const results: TestRunResult = {
      passing: [],
      failing: [],
      errors: [],
      executionTimeMs: 0
    };

    for (const resource of resources || []) {
      try {
        const resourceData = resource.resource_data as Record<string, any>;
        const passed = evaluateTestLogic(testLogic, resourceData);
        
        if (passed) {
          // Test passed means resource is compliant (no issue found)
          results.passing.push({
            id: resource.id,
            resource_id: resource.resource_id,
            data: resourceData
          });
        } else {
          // Test failed means resource has the issue we're checking for
          results.failing.push({
            id: resource.id,
            resource_id: resource.resource_id,
            data: resourceData
          });
        }
      } catch (err) {
        results.errors.push({
          resource: resource,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    results.executionTimeMs = performance.now() - startTime;

    return results;
  };

  // Save test run result
  const saveTestResult = useMutation({
    mutationFn: async ({ 
      testId, 
      result 
    }: { 
      testId: string; 
      result: TestRunResult 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const status = result.errors.length > 0 
        ? 'error' 
        : result.failing.length > 0 
          ? 'failed' 
          : 'passed';

      const { data, error } = await supabase
        .from('custom_test_results')
        .insert({
          test_id: testId,
          user_id: user.id,
          status,
          affected_resources_count: result.failing.length,
          execution_time_ms: Math.round(result.executionTimeMs),
          result_details: {
            passing_count: result.passing.length,
            failing_count: result.failing.length,
            error_count: result.errors.length,
            failing_resources: result.failing.slice(0, 100), // Limit to 100
            errors: result.errors.slice(0, 10)
          },
          triggered_by: 'manual',
          error_message: result.errors.length > 0 
            ? result.errors[0].error 
            : null
        })
        .select()
        .single();

      if (error) throw error;
      return data as TestResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customTests });
    }
  });

  // Get test results history
  const getTestResults = async (testId: string, limit = 10): Promise<TestResult[]> => {
    const { data, error } = await supabase
      .from('custom_test_results')
      .select('*')
      .eq('test_id', testId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as TestResult[];
  };

  return {
    tests,
    isLoading,
    refetch,
    getTestById,
    createTest: createTest.mutateAsync,
    updateTest: updateTest.mutateAsync,
    deleteTest: deleteTest.mutateAsync,
    toggleTestEnabled: toggleTestEnabled.mutateAsync,
    runTest,
    saveTestResult: saveTestResult.mutateAsync,
    getTestResults,
    isCreating: createTest.isPending,
    isUpdating: updateTest.isPending,
    isDeleting: deleteTest.isPending
  };
}
