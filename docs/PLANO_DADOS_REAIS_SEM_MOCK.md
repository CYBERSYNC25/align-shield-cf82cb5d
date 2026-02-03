# Plano: Usar Dados Reais e Retirar Mocks da Plataforma

Este documento descreve um **plano de execução** para passar a usar apenas dados reais no APOC e remover dados mockados. **Nenhuma linha de código é alterada neste documento**; o plano serve como guia para implementação futura.

---

## 1. Visão geral do que está mockado

| Área | Arquivo(s) | O que está mockado | Quando o mock é usado |
|------|------------|--------------------|------------------------|
| **Riscos e fornecedores** | `useRisks.tsx` | `mockRisks`, `mockVendors`, `mockAssessments` | Quando `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` são placeholders; em fallback de erro; e em `allRisks = risksData \|\| mockRisks` (mesmo com dados reais vazios). |
| **Relatórios** | `useReports.tsx` | `mockReports`, `mockScheduledReports` | Sempre (comentário: "as tabelas não existem ainda"); e em fallback de erro. |
| **Frameworks e controles** | `useFrameworks.tsx` | `getMockFrameworks()`, `getMockControls()` | Quando a query retorna 0 frameworks; e em catch de erro. |
| **Incidentes, playbooks, BCP** | `useIncidents.tsx` | `mockIncidents`, `mockPlaybooks`, `mockBcpPlans` | Quando "Supabase não está configurado"; e em catch. |
| **Auditorias e evidências** | `useAudits.tsx` | `getMockAudits()`, `getMockEvidence()` | Quando a query retorna 0 auditorias/0 evidências; e em catch. Também fallback ao criar auditoria (objeto "modo offline"). |
| **Revisões de acesso** | `useAccess.tsx` | `mockCampaigns`, `mockSystems`, `mockAnomalies` | Quando `isSupabaseConfigured()` é falso (NODE_ENV !== 'production' ou supabase inválido); em erro ao buscar campaigns; sistemas e anomalias usam mock quando `hasRealData` é falso (nenhuma integração com dados). |
| **Portal de auditoria** | `AuditPortal.tsx` | Objeto "Demo Audit" / "Demo Auditor" | Quando não há auditorias para o visualizador (primeira auditoria para exibição). |
| **Gestão de arquivos** | `FileManagement.tsx` | Comentário "simulated for demo" | Comportamento de listagem/upload pode ser simulado. |
| **Analytics avançado** | `useAdvancedAnalytics.tsx` | Período anterior sintético | "Mock previous period" para comparação período atual vs anterior (valores inventados para prev). |

Além disso, **quatro hooks** ainda importam o cliente Supabase de `@/lib/supabase` em vez de `@/integrations/supabase/client`: `useReports`, `useRisks`, `useIncidents`, `useAccess`. Para ambiente único e previsível, o ideal é todos usarem o mesmo cliente.

---

## 2. Pré-requisitos (antes de remover mocks)

### 2.1 Banco de dados (Supabase)

- **Tabelas que precisam existir e estar populáveis (ou vazias):**
  - `risks`, `vendors`, `risk_assessments` (já referenciadas no código e em migrations).
  - `frameworks`, `framework_controls` (ou equivalente no schema; já usadas).
  - `incidents`, `incident_playbooks`, `bcp_plans` (já usadas).
  - `audits`, `evidence` (já usadas).
  - `access_campaigns`, `system_inventory`, `access_anomalies` (migrations mencionam; useAccess faz select).
  - `reports`, `scheduled_reports`: o código em `useReports` comenta que "as tabelas não existem ainda". **Verificar no schema do projeto** se existem; se não, criar migrations para `reports` e `scheduled_reports` com colunas compatíveis com as interfaces `Report` e `ScheduledReport` usadas no front.

- **RLS e políticas:** garantir que usuários autenticados (e, se aplicável, org_id) tenham permissão de SELECT/INSERT/UPDATE/DELETE nas tabelas acima, conforme regra de negócio (por exemplo, filtrar por `user_id` ou `org_id`).

- **Dados iniciais (opcional):** se quiser evitar telas vazias no início, planejar seeds ou carga inicial (ex.: um framework, uma campanha de acesso). Isso não é obrigatório para “remover mock”: pode-se exibir listas vazias e mensagens do tipo "Nenhum item cadastrado".

### 2.2 Ambiente e cliente Supabase

- **Variáveis de ambiente:** em produção/build, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` devem apontar para o projeto real (não placeholders como `https://placeholder.supabase.co` ou `placeholder-key`). Caso contrário, alguns hooks (ex.: useRisks) continuarão entrando no “modo mock”.
- **Cliente único:** padronizar todos os hooks para importar de `@/integrations/supabase/client` (incluindo useReports, useRisks, useIncidents, useAccess), para evitar comportamentos diferentes entre ambientes.

### 2.3 Integrações (para Revisões de Acesso)

- Em **useAccess**, sistemas e anomalias usam dados reais quando `hasRealData` é true (dados vindos de integrações). Para “dados reais” em Revisões de Acesso, é necessário ter integrações conectadas que alimentem sistemas/anomalias, ou passar a buscar campanhas/sistemas/anomalias apenas do Supabase (tabelas `access_campaigns`, `system_inventory`, `access_anomalies`) e remover o fallback para mock quando houver erro ou tabelas vazias.

---

## 3. Ordem sugerida de trabalho (por área)

A ordem abaixo permite ir removendo mocks por módulo e testar sem quebrar o resto.

1. **Riscos (useRisks)**  
   - Garantir que `risks`, `vendors`, `risk_assessments` existem e que o hook usa `@/integrations/supabase/client`.  
   - Remover uso de `mockRisks`, `mockVendors`, `mockAssessments`: em caso de query vazia, usar `[]` e calcular estatísticas em cima de listas vazias; em caso de erro, não preencher com mock (manter estado vazio ou mensagem de erro).  
   - Ajustar qualquer lógica que hoje faça `allRisks = risksData || mockRisks` para usar apenas `risksData ?? []` (ou equivalente).

2. **Incidentes (useIncidents)**  
   - Garantir tabelas `incidents`, `incident_playbooks`, `bcp_plans` e cliente Supabase único.  
   - Remover modo mock: se Supabase não estiver configurado ou der erro, não preencher com mock; manter listas vazias e/ou mensagem de erro.

3. **Frameworks e controles (useFrameworks)**  
   - Garantir que `frameworks` e a tabela de controles existem e que o hook não usa `user_id: 'mock-user'` em inserts reais.  
   - Remover `getMockFrameworks()` e `getMockControls()`: quando a query retornar vazio, usar `[]`; em catch, não preencher com mock (estado vazio ou erro).  
   - Remover toasts que digam "(mock)" ao excluir/atualizar.

4. **Auditorias (useAudits)**  
   - Remover `getMockAudits()` e `getMockEvidence()`: se a query retornar vazio, usar `[]`; em catch, não preencher com mock.  
   - Decidir se cria auditoria "offline" em memória quando o insert falhar ou se apenas mostra erro e não adiciona à lista (recomendado: não adicionar mock).

5. **Portal de auditoria (AuditPortal)**  
   - Quando não houver auditorias, não usar objeto "Demo Audit" / "Demo Auditor". Exibir mensagem do tipo "Nenhuma auditoria cadastrada" ou esconder o visualizador até existir pelo menos uma auditoria real.

6. **Revisões de acesso (useAccess)**  
   - Garantir que `access_campaigns` (e, se usado, `system_inventory`, `access_anomalies`) existem e que o hook usa o cliente único.  
   - Remover `mockCampaigns`: em ambiente configurado, buscar só do Supabase; se der erro ou vazio, manter listas vazias.  
   - Para sistemas e anomalias: ou sempre buscar do Supabase (se houver tabelas), ou sempre usar apenas o que vier das integrações (`useIntegratedSystems`), sem fallback para `mockSystems`/`mockAnomalies`.

7. **Relatórios (useReports)**  
   - **Criar tabelas** `reports` e `scheduled_reports` no Supabase (se ainda não existirem), com colunas alinhadas às interfaces do front.  
   - Trocar para `@/integrations/supabase/client` e implementar fetch real (select em `reports` e `scheduled_reports`).  
   - Remover `mockReports` e `mockScheduledReports`: listas vazias quando não houver dados; em erro, não preencher com mock.  
   - Ações "gerar relatório" e "toggle agendado" devem persistir no banco (insert/update) em vez de só atualizar estado local com dados fictícios.

8. **Gestão de arquivos (FileManagement)**  
   - Revisar a lógica marcada como "simulated for demo": se houver listagem/upload real (Supabase Storage ou tabelas de metadados), remover simulação e usar apenas chamadas reais; caso contrário, planejar implementação de upload/listagem real antes de remover o comentário.

9. **Analytics avançado (useAdvancedAnalytics)**  
   - "Mock previous period": substituir por query real ao período anterior (mesma fonte de dados, intervalo de datas anterior) ou por indicadores já persistidos (ex.: tabela de métricas por período). Remover uso de valores sintéticos (random) para período anterior.

---

## 4. Comportamento desejado após remoção dos mocks

- **Listas vazias:** quando não houver dados no banco, exibir listas vazias e, quando fizer sentido, uma mensagem amigável (ex.: "Nenhum risco cadastrado", "Conecte integrações ou cadastre recursos manualmente").  
- **Erros:** em falha de rede ou Supabase, não preencher com mock; mostrar estado de erro (toast/mensagem na tela) e, se possível, opção de tentar novamente.  
- **Criação/edição:** todas as criações e edições devem ir para o Supabase (ou fonte real definida); não manter caminhos que só atualizam estado local com objetos "mock" ou "offline" sem persistência.

---

## 5. Checklist de verificação (resumo)

- [ ] Supabase: tabelas `risks`, `vendors`, `risk_assessments`, `frameworks` (e controles), `incidents`, `incident_playbooks`, `bcp_plans`, `audits`, `evidence`, `access_campaigns`, `system_inventory`, `access_anomalies` existem e com RLS adequado.  
- [ ] Supabase: tabelas `reports` e `scheduled_reports` existem (ou criadas); schemas compatíveis com o front.  
- [ ] Ambiente: `VITE_SUPABASE_*` configurados com valores reais (não placeholder).  
- [ ] Código: todos os hooks que usam Supabase importam de `@/integrations/supabase/client`.  
- [ ] useRisks: sem mock; listas vazias e estatísticas em cima delas quando não houver dados.  
- [ ] useIncidents: sem mock; listas vazias em caso de erro ou sem config.  
- [ ] useFrameworks: sem mock; listas vazias em vazio/erro.  
- [ ] useAudits: sem mock; sem auditoria "offline" fictícia.  
- [ ] AuditPortal: sem "Demo Audit" quando não houver auditorias.  
- [ ] useAccess: sem mock de campanhas/sistemas/anomalias quando houver Supabase/integrações configurados.  
- [ ] useReports: fetch real em `reports` e `scheduled_reports`; sem mock.  
- [ ] FileManagement: sem simulação onde já houver API real; ou implementar API real antes.  
- [ ] useAdvancedAnalytics: período anterior vindo de dados reais ou métricas persistidas, sem valores sintéticos.

---

## 6. Observação

Este plano não altera nenhuma linha de código; serve como guia para as mudanças a serem feitas em código, banco e ambiente. A implementação pode ser feita por etapas (uma área por vez), testando cada etapa antes de seguir para a próxima.
