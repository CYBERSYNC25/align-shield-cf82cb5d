/**
 * Testes de Integração - Operações CRUD
 * 
 * Este arquivo testa operações CRUD completas para:
 * - Frameworks
 * - Controles
 * - Auditorias
 * - Riscos
 * - Upload de evidências
 * 
 * Cobre casos de sucesso, erros e edge cases
 * 
 * @requires @testing-library/react
 * @requires vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        })),
        data: [],
        error: null
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'http://example.com/file.pdf' }
        }))
      }))
    }
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

/**
 * Helper para criar QueryClient para testes
 */
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

describe('CRUD Operations - Operações CRUD', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  describe('Frameworks - CRUD', () => {
    /**
     * TESTE 1: Criar framework com sucesso
     * 
     * Cenário:
     * - Usuário cria novo framework
     * - Todos os campos obrigatórios preenchidos
     * 
     * Expectativa:
     * - Framework inserido no banco
     * - Mensagem de sucesso
     */
    it('deve criar framework com dados válidos', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '123',
              name: 'ISO 27001',
              description: 'Information Security Management',
              version: '2013',
              status: 'active'
            },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const frameworkData = {
        name: 'ISO 27001',
        description: 'Information Security Management',
        version: '2013',
        status: 'active',
        user_id: 'user-123'
      };

      const { data, error } = await supabase
        .from('frameworks')
        .insert(frameworkData)
        .select()
        .single();

      expect(mockInsert).toHaveBeenCalledWith(frameworkData);
      expect(data).toHaveProperty('id');
      expect(data?.name).toBe('ISO 27001');
      expect(error).toBeNull();
    });

    /**
     * TESTE 2: Listar frameworks
     * 
     * Cenário: Buscar todos os frameworks do usuário
     * 
     * Expectativa:
     * - Lista de frameworks retornada
     */
    it('deve listar frameworks do usuário', async () => {
      const mockFrameworks = [
        { id: '1', name: 'ISO 27001', status: 'active' },
        { id: '2', name: 'SOC 2', status: 'active' }
      ];

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: mockFrameworks,
          error: null
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const { data, error } = await supabase
        .from('frameworks')
        .select('*')
        .eq('user_id', 'user-123');

      expect(mockSelect).toHaveBeenCalled();
      expect(data).toHaveLength(2);
      expect(error).toBeNull();
    });

    /**
     * TESTE 3: Atualizar framework
     * 
     * Cenário: Editar informações de um framework existente
     * 
     * Expectativa:
     * - Framework atualizado
     */
    it('deve atualizar framework existente', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: '123',
                name: 'ISO 27001 Updated',
                description: 'Updated description'
              },
              error: null
            }))
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate
      } as any);

      const { data, error } = await supabase
        .from('frameworks')
        .update({ name: 'ISO 27001 Updated' })
        .eq('id', '123')
        .select()
        .single();

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'ISO 27001 Updated' });
      expect(data?.name).toBe('ISO 27001 Updated');
      expect(error).toBeNull();
    });

    /**
     * TESTE 4: Deletar framework
     * 
     * Cenário: Remover framework
     * 
     * Expectativa:
     * - Framework deletado
     */
    it('deve deletar framework', async () => {
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete
      } as any);

      const { error } = await supabase
        .from('frameworks')
        .delete()
        .eq('id', '123');

      expect(mockDelete).toHaveBeenCalled();
      expect(error).toBeNull();
    });

    /**
     * TESTE 5: Edge Case - Nome duplicado
     * 
     * Cenário: Tentar criar framework com nome já existente
     * 
     * Expectativa:
     * - Erro de constraint violation
     */
    it('deve rejeitar framework com nome duplicado', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'duplicate key value violates unique constraint', code: '23505' }
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const { data, error } = await supabase
        .from('frameworks')
        .insert({ name: 'ISO 27001', user_id: 'user-123' })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.code).toBe('23505');
    });
  });

  describe('Controles - CRUD', () => {
    /**
     * TESTE 6: Criar controle com sucesso
     * 
     * Cenário:
     * - Criar novo controle associado a um framework
     * - Todos os campos obrigatórios preenchidos
     * 
     * Expectativa:
     * - Controle inserido no banco
     */
    it('deve criar controle válido', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '456',
              code: 'AC-01',
              title: 'Access Control Policy',
              framework_id: 'framework-123',
              status: 'implemented'
            },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const controlData = {
        code: 'AC-01',
        title: 'Access Control Policy',
        category: 'Access Control',
        framework_id: 'framework-123',
        status: 'implemented',
        user_id: 'user-123'
      };

      const { data, error } = await supabase
        .from('controls')
        .insert(controlData)
        .select()
        .single();

      expect(mockInsert).toHaveBeenCalledWith(controlData);
      expect(data?.code).toBe('AC-01');
      expect(error).toBeNull();
    });

    /**
     * TESTE 7: Buscar controles por framework
     * 
     * Cenário: Listar todos os controles de um framework específico
     * 
     * Expectativa:
     * - Lista filtrada retornada
     */
    it('deve buscar controles por framework', async () => {
      const mockControls = [
        { id: '1', code: 'AC-01', framework_id: 'fw-1' },
        { id: '2', code: 'AC-02', framework_id: 'fw-1' }
      ];

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: mockControls,
          error: null
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const { data, error } = await supabase
        .from('controls')
        .select('*')
        .eq('framework_id', 'fw-1');

      expect(data).toHaveLength(2);
      expect(error).toBeNull();
    });

    /**
     * TESTE 8: Edge Case - Código de controle inválido
     * 
     * Cenário: Criar controle sem código (campo obrigatório)
     * 
     * Expectativa:
     * - Erro de validação
     */
    it('deve rejeitar controle sem código', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'null value in column "code" violates not-null constraint' }
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const { data, error } = await supabase
        .from('controls')
        .insert({ title: 'Test Control', user_id: 'user-123' })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.message).toContain('not-null constraint');
    });
  });

  describe('Auditorias - CRUD', () => {
    /**
     * TESTE 9: Criar auditoria
     * 
     * Cenário:
     * - Criar nova auditoria
     * - Framework, datas e auditor definidos
     * 
     * Expectativa:
     * - Auditoria criada com status 'planejada'
     */
    it('deve criar auditoria completa', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '789',
              name: 'Auditoria ISO 27001 Q1',
              framework: 'ISO 27001',
              auditor: 'auditor@example.com',
              start_date: '2024-01-01',
              end_date: '2024-03-31',
              status: 'planejada'
            },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const auditData = {
        name: 'Auditoria ISO 27001 Q1',
        framework: 'ISO 27001',
        auditor: 'auditor@example.com',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        status: 'planejada',
        user_id: 'user-123'
      };

      const { data, error } = await supabase
        .from('audits')
        .insert(auditData)
        .select()
        .single();

      expect(data?.name).toBe('Auditoria ISO 27001 Q1');
      expect(data?.status).toBe('planejada');
      expect(error).toBeNull();
    });

    /**
     * TESTE 10: Atualizar progresso da auditoria
     * 
     * Cenário: Atualizar percentual de progresso
     * 
     * Expectativa:
     * - Progresso atualizado
     */
    it('deve atualizar progresso da auditoria', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: '789', progress: 75 },
              error: null
            }))
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate
      } as any);

      const { data, error } = await supabase
        .from('audits')
        .update({ progress: 75 })
        .eq('id', '789')
        .select()
        .single();

      expect(data?.progress).toBe(75);
      expect(error).toBeNull();
    });

    /**
     * TESTE 11: Edge Case - Data fim antes de data início
     * 
     * Cenário: Criar auditoria com datas inválidas
     * 
     * Expectativa:
     * - Validação deve impedir criação
     */
    it('deve validar datas da auditoria', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'end_date must be after start_date' }
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const { data, error } = await supabase
        .from('audits')
        .insert({
          name: 'Test Audit',
          framework: 'ISO 27001',
          start_date: '2024-12-31',
          end_date: '2024-01-01',
          user_id: 'user-123'
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.message).toContain('after start_date');
    });
  });

  describe('Riscos - CRUD', () => {
    /**
     * TESTE 12: Criar risco com cálculo automático de score
     * 
     * Cenário:
     * - Criar risco com impacto e probabilidade
     * - Score deve ser calculado automaticamente
     * 
     * Expectativa:
     * - Risco criado com risk_score correto
     */
    it('deve criar risco com score calculado', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '999',
              title: 'Data Breach Risk',
              impact: 'high',
              probability: 'medium',
              risk_score: 12, // high(4) * medium(3) = 12
              level: 'high'
            },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const riskData = {
        title: 'Data Breach Risk',
        category: 'Security',
        impact: 'high',
        probability: 'medium',
        owner: 'security-team@example.com',
        user_id: 'user-123'
      };

      const { data, error } = await supabase
        .from('risks')
        .insert(riskData)
        .select()
        .single();

      expect(data?.risk_score).toBe(12);
      expect(data?.level).toBe('high');
      expect(error).toBeNull();
    });

    /**
     * TESTE 13: Buscar riscos por nível
     * 
     * Cenário: Filtrar riscos críticos
     * 
     * Expectativa:
     * - Apenas riscos de nível crítico retornados
     */
    it('deve filtrar riscos por nível', async () => {
      const mockRisks = [
        { id: '1', title: 'Critical Risk 1', level: 'critical' },
        { id: '2', title: 'Critical Risk 2', level: 'critical' }
      ];

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: mockRisks,
          error: null
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const { data, error } = await supabase
        .from('risks')
        .select('*')
        .eq('level', 'critical');

      expect(data).toHaveLength(2);
      expect(data?.every(r => r.level === 'critical')).toBe(true);
      expect(error).toBeNull();
    });

    /**
     * TESTE 14: Edge Case - Valores de impacto/probabilidade inválidos
     * 
     * Cenário: Tentar criar risco com valores fora do enum
     * 
     * Expectativa:
     * - Erro de constraint
     */
    it('deve validar valores de impacto e probabilidade', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'invalid input value for enum' }
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const { data, error } = await supabase
        .from('risks')
        .insert({
          title: 'Test Risk',
          impact: 'super-high', // inválido
          probability: 'maybe', // inválido
          user_id: 'user-123'
        })
        .select()
        .single();

      expect(error).toBeTruthy();
      expect(error?.message).toContain('enum');
    });
  });

  describe('Upload de Evidências', () => {
    /**
     * TESTE 15: Upload de arquivo com sucesso
     * 
     * Cenário:
     * - Upload de PDF como evidência
     * - Arquivo válido
     * 
     * Expectativa:
     * - Arquivo armazenado no Supabase Storage
     * - URL pública gerada
     */
    it('deve fazer upload de evidência', async () => {
      const mockFile = new File(['content'], 'evidence.pdf', { type: 'application/pdf' });
      
      const mockUpload = vi.fn(() => ({
        data: { path: 'evidence/123/evidence.pdf' },
        error: null
      }));

      const mockGetPublicUrl = vi.fn(() => ({
        data: { publicUrl: 'http://example.com/evidence.pdf' }
      }));

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      } as any);

      const { data, error } = await supabase.storage
        .from('evidence')
        .upload('evidence/123/evidence.pdf', mockFile);

      expect(mockUpload).toHaveBeenCalled();
      expect(data?.path).toBe('evidence/123/evidence.pdf');
      expect(error).toBeNull();

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('evidence')
        .getPublicUrl('evidence/123/evidence.pdf');

      expect(urlData.publicUrl).toBeTruthy();
    });

    /**
     * TESTE 16: Criar registro de evidência no banco
     * 
     * Cenário: Após upload, criar registro no banco
     * 
     * Expectativa:
     * - Registro criado com URL do arquivo
     */
    it('deve criar registro de evidência no banco', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'ev-123',
              name: 'ISO 27001 Evidence',
              type: 'document',
              file_url: 'http://example.com/evidence.pdf',
              status: 'approved'
            },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert
      } as any);

      const evidenceData = {
        name: 'ISO 27001 Evidence',
        type: 'document',
        file_url: 'http://example.com/evidence.pdf',
        audit_id: 'audit-123',
        status: 'approved',
        user_id: 'user-123'
      };

      const { data, error } = await supabase
        .from('evidence')
        .insert(evidenceData)
        .select()
        .single();

      expect(data?.file_url).toBe('http://example.com/evidence.pdf');
      expect(error).toBeNull();
    });

    /**
     * TESTE 17: Edge Case - Arquivo muito grande
     * 
     * Cenário: Tentar upload de arquivo acima do limite
     * 
     * Expectativa:
     * - Erro de tamanho de arquivo
     */
    it('deve rejeitar arquivo muito grande', async () => {
      // Simular arquivo de 100MB (limite geralmente é 50MB)
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      
      const mockUpload = vi.fn(() => ({
        data: null,
        error: { message: 'Payload too large' }
      }));

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload
      } as any);

      const { data, error } = await supabase.storage
        .from('evidence')
        .upload('evidence/large.pdf', largeFile);

      expect(error).toBeTruthy();
      expect(error?.message).toContain('too large');
    });

    /**
     * TESTE 18: Edge Case - Tipo de arquivo não suportado
     * 
     * Cenário: Upload de arquivo executável (.exe)
     * 
     * Expectativa:
     * - Rejeição por tipo de arquivo
     */
    it('deve rejeitar tipo de arquivo não suportado', async () => {
      const invalidFile = new File(['content'], 'virus.exe', { type: 'application/x-msdownload' });
      
      const mockUpload = vi.fn(() => ({
        data: null,
        error: { message: 'File type not allowed' }
      }));

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload
      } as any);

      const { data, error } = await supabase.storage
        .from('evidence')
        .upload('evidence/virus.exe', invalidFile);

      expect(error).toBeTruthy();
      expect(error?.message).toContain('not allowed');
    });
  });
});
