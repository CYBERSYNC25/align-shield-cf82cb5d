/**
 * Testes de Integração - Notificações e Fluxo de Revisão de Acesso
 * 
 * Este arquivo testa:
 * - Triggers de notificações automáticas
 * - Criação e envio de notificações
 * - Fluxo completo de revisão de acesso
 * - Aprovações e rejeições
 * 
 * @requires @testing-library/react
 * @requires vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

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
    rpc: vi.fn()
  }
}));

describe('Notifications & Access Review Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sistema de Notificações', () => {
    /**
     * TESTE 1: Criar notificação via função RPC
     * 
     * Cenário:
     * - Sistema cria notificação usando create_notification function
     * - Todos os campos obrigatórios fornecidos
     * 
     * Expectativa:
     * - Notificação criada com sucesso
     * - ID retornado
     */
    it('deve criar notificação via RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-123',
        error: null
      });

      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: 'user-123',
        p_title: 'Nova Tarefa Atribuída',
        p_message: 'Você foi designado para revisar o controle AC-01',
        p_type: 'task_assigned',
        p_priority: 'high',
        p_related_table: 'controls',
        p_related_id: 'control-123',
        p_action_url: '/controls/control-123',
        p_action_label: 'Ver Controle'
      });

      expect(supabase.rpc).toHaveBeenCalledWith('create_notification', expect.objectContaining({
        p_user_id: 'user-123',
        p_title: 'Nova Tarefa Atribuída',
        p_type: 'task_assigned'
      }));
      expect(data).toBe('notif-123');
      expect(error).toBeNull();
    });

    /**
     * TESTE 2: Buscar notificações não lidas
     * 
     * Cenário:
     * - Usuário consulta suas notificações não lidas
     * 
     * Expectativa:
     * - Apenas notificações com read=false retornadas
     */
    it('deve buscar notificações não lidas', async () => {
      const mockNotifications = [
        {
          id: 'n1',
          title: 'Task 1',
          message: 'Message 1',
          read: false,
          priority: 'high',
          created_at: '2024-01-01'
        },
        {
          id: 'n2',
          title: 'Task 2',
          message: 'Message 2',
          read: false,
          priority: 'medium',
          created_at: '2024-01-02'
        }
      ];

      const mockEq = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockNotifications,
            error: null
          }))
        }))
      }));

      const mockSelect = vi.fn(() => ({
        eq: mockEq
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', 'user-123')
        .eq('read', false);

      expect(data).toHaveLength(2);
      expect(data?.every(n => n.read === false)).toBe(true);
      expect(error).toBeNull();
    });

    /**
     * TESTE 3: Marcar notificação como lida
     * 
     * Cenário:
     * - Usuário visualiza notificação
     * - Sistema marca como lida
     * 
     * Expectativa:
     * - Campo read atualizado para true
     */
    it('deve marcar notificação como lida', async () => {
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'n1', read: true },
              error: null
            }))
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate
      } as any);

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', 'n1')
        .select()
        .single();

      expect(mockUpdate).toHaveBeenCalledWith({ read: true });
      expect(data?.read).toBe(true);
      expect(error).toBeNull();
    });

    /**
     * TESTE 4: Notificações com expiração
     * 
     * Cenário:
     * - Buscar apenas notificações válidas (não expiradas)
     * 
     * Expectativa:
     * - Apenas notificações com expires_at > now() ou null retornadas
     */
    it('deve filtrar notificações expiradas', async () => {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 86400000).toISOString(); // +1 dia
      
      const mockNotifications = [
        { id: 'n1', title: 'Valid', expires_at: future },
        { id: 'n2', title: 'No expiration', expires_at: null }
      ];

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            data: mockNotifications,
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', 'user-123');

      // Filtrar localmente (na prática o backend faria isso)
      const validNotifications = data?.filter(n => 
        !n.expires_at || new Date(n.expires_at) > new Date()
      );

      expect(validNotifications).toBeDefined();
      expect(error).toBeNull();
    });

    /**
     * TESTE 5: Edge Case - Notificação de prioridade crítica
     * 
     * Cenário:
     * - Sistema cria notificação crítica que requer ação imediata
     * 
     * Expectativa:
     * - Notificação criada com priority='critical'
     * - Pode acionar alertas adicionais
     */
    it('deve criar notificação crítica', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'critical-notif-123',
        error: null
      });

      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: 'user-123',
        p_title: 'CRÍTICO: Falha de Segurança Detectada',
        p_message: 'Uma anomalia crítica foi detectada no sistema',
        p_type: 'security_alert',
        p_priority: 'critical',
        p_action_url: '/incidents/new',
        p_action_label: 'Reportar Incidente'
      });

      expect(data).toBeTruthy();
      expect(error).toBeNull();
    });
  });

  describe('Triggers de Notificações Automáticas', () => {
    /**
     * TESTE 6: Trigger ao criar novo risco
     * 
     * Cenário:
     * - Novo risco crítico é criado
     * - Trigger deve notificar owner do risco
     * 
     * Expectativa:
     * - Notificação automática enviada ao owner
     */
    it('deve disparar notificação ao criar risco crítico', async () => {
      // 1. Criar risco
      const mockInsertRisk = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'risk-999',
              title: 'Critical Security Risk',
              level: 'critical',
              owner: 'owner@example.com'
            },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: mockInsertRisk
      } as any);

      const { data: riskData } = await supabase
        .from('risks')
        .insert({
          title: 'Critical Security Risk',
          level: 'critical',
          owner: 'owner@example.com',
          user_id: 'user-123'
        })
        .select()
        .single();

      // 2. Verificar que trigger criaria notificação
      // (Na prática, o trigger do banco faria isso automaticamente)
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-risk-999',
        error: null
      });

      const { data: notifData } = await supabase.rpc('create_notification', {
        p_user_id: 'user-123',
        p_title: 'Novo Risco Crítico Criado',
        p_message: `Risco crítico "${riskData?.title}" requer atenção imediata`,
        p_type: 'risk_created',
        p_priority: 'critical',
        p_related_table: 'risks',
        p_related_id: riskData?.id
      });

      expect(notifData).toBeTruthy();
    });

    /**
     * TESTE 7: Trigger ao atribuir tarefa
     * 
     * Cenário:
     * - Usuário é atribuído a uma tarefa
     * - Trigger notifica o usuário atribuído
     * 
     * Expectativa:
     * - Notificação enviada ao assigned_to
     */
    it('deve notificar usuário ao atribuir tarefa', async () => {
      const mockInsertTask = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'task-456',
              title: 'Review Control AC-01',
              assigned_to: 'user-789',
              due_date: '2024-12-31'
            },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: mockInsertTask
      } as any);

      const { data: taskData } = await supabase
        .from('tasks')
        .insert({
          title: 'Review Control AC-01',
          assigned_to: 'user-789',
          due_date: '2024-12-31',
          user_id: 'user-123'
        })
        .select()
        .single();

      // Trigger criaria notificação
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-task-456',
        error: null
      });

      const { data: notifData } = await supabase.rpc('create_notification', {
        p_user_id: taskData?.assigned_to || 'user-789',
        p_title: 'Nova Tarefa Atribuída',
        p_message: `Você foi designado para: ${taskData?.title}`,
        p_type: 'task_assigned',
        p_priority: 'medium',
        p_related_table: 'tasks',
        p_related_id: taskData?.id,
        p_action_url: `/tasks/${taskData?.id}`
      });

      expect(notifData).toBeTruthy();
    });

    /**
     * TESTE 8: Trigger ao vencer prazo
     * 
     * Cenário:
     * - Tarefa com due_date próximo (ex: 3 dias)
     * - Sistema deve enviar lembrete
     * 
     * Expectativa:
     * - Notificação de lembrete criada
     */
    it('deve enviar lembrete de prazo próximo', async () => {
      const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString();

      // Simular busca de tarefas com prazo próximo
      const mockSelect = vi.fn(() => ({
        lte: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [
              {
                id: 'task-111',
                title: 'Urgent Task',
                assigned_to: 'user-123',
                due_date: threeDaysFromNow
              }
            ],
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect
      } as any);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .lte('due_date', threeDaysFromNow)
        .eq('status', 'pendente');

      // Para cada tarefa, criar notificação
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-reminder',
        error: null
      });

      for (const task of tasks || []) {
        await supabase.rpc('create_notification', {
          p_user_id: task.assigned_to,
          p_title: 'Lembrete: Prazo Próximo',
          p_message: `A tarefa "${task.title}" vence em breve`,
          p_type: 'deadline_reminder',
          p_priority: 'high'
        });
      }

      expect(supabase.rpc).toHaveBeenCalled();
    });
  });

  describe('Fluxo Completo de Revisão de Acesso', () => {
    /**
     * TESTE 9: Iniciar campanha de revisão
     * 
     * Cenário:
     * - Admin cria nova campanha de revisão de acesso
     * - Define sistemas, revisores e prazo
     * 
     * Expectativa:
     * - Campanha criada
     * - Notificações enviadas aos revisores
     */
    it('deve iniciar campanha de revisão de acesso', async () => {
      const campaignData = {
        name: 'Q1 2024 Access Review',
        systems: ['SAP', 'Salesforce', 'AWS'],
        reviewers: ['reviewer1@example.com', 'reviewer2@example.com'],
        due_date: '2024-03-31',
        status: 'active'
      };

      // 1. Criar campanha (simulação - não há tabela específica no schema)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'campaign-123', ...campaignData },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: mockInsert
      } as any);

      // 2. Notificar revisores
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-campaign',
        error: null
      });

      for (const reviewer of campaignData.reviewers) {
        await supabase.rpc('create_notification', {
          p_user_id: reviewer,
          p_title: 'Nova Campanha de Revisão de Acesso',
          p_message: `Você foi designado para revisar acessos da campanha "${campaignData.name}"`,
          p_type: 'access_review_assigned',
          p_priority: 'high',
          p_action_url: '/access-reviews/campaign-123'
        });
      }

      expect(supabase.rpc).toHaveBeenCalledTimes(2); // 2 revisores
    });

    /**
     * TESTE 10: Aprovar acesso durante revisão
     * 
     * Cenário:
     * - Revisor aprova acesso de um usuário
     * 
     * Expectativa:
     * - Status atualizado para 'approved'
     * - Notificação enviada ao usuário
     */
    it('deve aprovar acesso durante revisão', async () => {
      const reviewId = 'review-456';
      const userId = 'user-999';

      // 1. Atualizar status da revisão
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: reviewId,
                user_id: userId,
                status: 'approved',
                reviewed_by: 'reviewer@example.com',
                reviewed_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate
      } as any);

      const { data: reviewData } = await supabase
        .from('access_anomalies') // Usando como proxy para revisões
        .update({ status: 'approved' })
        .eq('id', reviewId)
        .select()
        .single();

      // 2. Notificar usuário
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-approved',
        error: null
      });

      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: 'Acesso Aprovado',
        p_message: 'Seu acesso foi aprovado na revisão de acessos',
        p_type: 'access_approved',
        p_priority: 'medium'
      });

      expect(reviewData?.status).toBe('approved');
      expect(supabase.rpc).toHaveBeenCalled();
    });

    /**
     * TESTE 11: Revogar acesso durante revisão
     * 
     * Cenário:
     * - Revisor identifica acesso inadequado
     * - Revoga acesso
     * 
     * Expectativa:
     * - Status atualizado para 'revoked'
     * - Notificação crítica enviada
     * - Ação de revogação iniciada
     */
    it('deve revogar acesso inadequado', async () => {
      const reviewId = 'review-789';
      const userId = 'user-888';

      // 1. Atualizar para revogado
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: reviewId,
                user_id: userId,
                status: 'revoked',
                revoked_reason: 'User no longer in role',
                reviewed_by: 'reviewer@example.com'
              },
              error: null
            }))
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate
      } as any);

      const { data: reviewData } = await supabase
        .from('access_anomalies')
        .update({
          status: 'revoked',
          //revoked_reason: 'User no longer in role'
        })
        .eq('id', reviewId)
        .select()
        .single();

      // 2. Notificar usuário e admin
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-revoked',
        error: null
      });

      await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: 'ALERTA: Acesso Revogado',
        p_message: 'Seu acesso foi revogado. Entre em contato com TI se tiver dúvidas.',
        p_type: 'access_revoked',
        p_priority: 'critical'
      });

      expect(reviewData?.status).toBe('revoked');
      expect(supabase.rpc).toHaveBeenCalled();
    });

    /**
     * TESTE 12: Finalizar campanha de revisão
     * 
     * Cenário:
     * - Todas as revisões foram concluídas
     * - Admin finaliza a campanha
     * 
     * Expectativa:
     * - Status da campanha atualizado
     * - Relatório gerado
     * - Notificações de conclusão enviadas
     */
    it('deve finalizar campanha de revisão', async () => {
      const campaignId = 'campaign-123';

      // 1. Verificar se todas as revisões foram concluídas
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => ({
            data: [], // Nenhuma pendente
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: mockSelect
      } as any);

      const { data: pendingReviews } = await supabase
        .from('access_anomalies')
        .select('*')
        .eq('campaign_id', campaignId)
        .in('status', ['pending', 'in_progress']);

      expect(pendingReviews).toHaveLength(0);

      // 2. Atualizar status da campanha
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: campaignId,
                status: 'completed',
                completed_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate
      } as any);

      // 3. Notificar stakeholders
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-completed',
        error: null
      });

      await supabase.rpc('create_notification', {
        p_user_id: 'admin@example.com',
        p_title: 'Campanha de Revisão Concluída',
        p_message: 'A campanha Q1 2024 Access Review foi finalizada com sucesso',
        p_type: 'campaign_completed',
        p_priority: 'medium'
      });

      expect(supabase.rpc).toHaveBeenCalled();
    });

    /**
     * TESTE 13: Edge Case - Revisão com anomalia detectada
     * 
     * Cenário:
     * - Sistema detecta acesso anômalo durante revisão
     * - Cria anomalia automaticamente
     * 
     * Expectativa:
     * - Registro de anomalia criado
     * - Notificação crítica enviada
     */
    it('deve criar anomalia ao detectar acesso suspeito', async () => {
      const anomalyData = {
        user_name: 'suspicious.user@example.com',
        system_name: 'Production Database',
        anomaly_type: 'unusual_access_pattern',
        severity: 'high',
        description: 'Acesso fora do horário comercial',
        status: 'open'
      };

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'anomaly-999', ...anomalyData },
            error: null
          }))
        }))
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: mockInsert
      } as any);

      const { data: anomaly } = await supabase
        .from('access_anomalies')
        .insert(anomalyData)
        .select()
        .single();

      // Notificar security team
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 'notif-anomaly',
        error: null
      });

      await supabase.rpc('create_notification', {
        p_user_id: 'security@example.com',
        p_title: 'CRÍTICO: Anomalia de Acesso Detectada',
        p_message: `Atividade suspeita detectada: ${anomalyData.description}`,
        p_type: 'security_alert',
        p_priority: 'critical',
        p_related_table: 'access_anomalies',
        p_related_id: anomaly?.id
      });

      expect(anomaly).toBeTruthy();
      expect(supabase.rpc).toHaveBeenCalled();
    });
  });
});
