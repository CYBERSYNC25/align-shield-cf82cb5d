# Manual do Usuário – APOC

**APOC** (Automated Platform for Online Compliance) é a plataforma de governança, riscos e compliance (GRC) da organização. Este manual explica como usar o sistema no dia a dia.

**Público:** equipe que utilizará o APOC (compliance, riscos, auditoria, operações).

---

## Índice

1. [Acesso ao sistema](#1-acesso-ao-sistema)
2. [Visão geral do menu e do Dashboard](#2-visão-geral-do-menu-e-do-dashboard)
3. [Controles e Frameworks](#3-controles-e-frameworks)
4. [Integrações](#4-integrações)
5. [Políticas e Treinamento](#5-políticas-e-treinamento)
6. [Revisões de Acesso](#6-revisões-de-acesso)
7. [Gestão de Riscos](#7-gestão-de-riscos)
8. [Portal de Auditoria](#8-portal-de-auditoria)
9. [Incidentes](#9-incidentes)
10. [Relatórios e Exportações](#10-relatórios-e-exportações)
11. [Analytics e Relatórios Avançados](#11-analytics-e-relatórios-avançados)
12. [Outras áreas](#12-outras-áreas)
13. [Configurações e perfil](#13-configurações-e-perfil)
14. [Onde buscar ajuda](#14-onde-buscar-ajuda)

---

## 1. Acesso ao sistema

- **URL:** a URL de acesso é fornecida pela equipe de TI ou pelo administrador do projeto (ex.: `https://apoc.com.br` ou o endereço do deploy).
- **Login:** acesse a página de login, informe **e-mail** e **senha** e clique em entrar.
- **Primeiro acesso:** se você recebeu um convite ou link de cadastro, use-o para definir sua senha.
- **Esqueci a senha:** na tela de login, use a opção **“Esqueci minha senha”** e informe o e-mail cadastrado para receber o link de redefinição.
- **Sessão:** o sistema mantém a sessão ativa; ao fechar o navegador ou após um tempo de inatividade, pode ser necessário fazer login novamente.

---

## 2. Visão geral do menu e do Dashboard

Após o login você verá o **menu lateral** e a área principal.

- **Dashboard (Início):** resumo do estado de compliance, riscos, tarefas pendentes e indicadores principais. Use como “home” do sistema.
- **Menu:** cada item leva a uma área específica (Controles, Integrações, Políticas, Riscos, Auditoria, Incidentes, Relatórios, etc.). Clique no item para abrir a tela correspondente.

As telas seguem um padrão: título no topo, filtros ou abas quando existirem, e listagem ou formulários no conteúdo principal. Use o menu para navegar entre as áreas.

---

## 3. Controles e Frameworks

**Caminho no menu:** Controles / Frameworks (ou equivalente no menu lateral).

- **O que é:** gestão de **frameworks de compliance** (ex.: ISO 27001, SOC 2, LGPD) e dos **controles** associados a cada framework.
- **O que você pode fazer:**
  - Visualizar frameworks cadastrados e seu status.
  - Ver e gerenciar controles por framework (implementado, não implementado, em progresso).
  - Acompanhar pontuação ou maturidade de conformidade por framework.
- **Alimentação:** os dados podem ser preenchidos manualmente na interface (criar/editar framework, criar/editar controles e status). Integrações podem alimentar evidências ligadas a controles quando configuradas.

---

## 4. Integrações

**Caminho no menu:** Integrações (Hub de Integrações / Marketplace).

- **O que é:** espaço para **conectar ferramentas externas** (AWS, Google Workspace, Azure AD, Jira, GitHub, Slack, Auth0, Okta, Cloudflare, etc.) e **alimentar o sistema** com dados de usuários, recursos e evidências.
- **O que você pode fazer:**
  - Ver integrações disponíveis e quais já estão conectadas.
  - Clicar em **“Conectar”** na integração desejada e preencher as credenciais no modal (token, domínio, chaves, etc.), conforme as instruções na tela.
  - Clicar em **“Testar e Conectar”** (ou equivalente) para validar e salvar a conexão.
  - Gerenciar integrações já conectadas (ver recursos coletados, status, logs).
  - Usar **“Entrada manual”** para cadastrar recursos (usuários, repositórios, servidores, etc.) sem conectar uma API.
- **Importante:** as credenciais são criptografadas e armazenadas de forma segura no servidor. Não compartilhe suas credenciais com terceiros.
- **Documentação detalhada:** para passos específicos por integração, consulte o arquivo **`docs/USER_GUIDE_INTEGRATIONS.md`** (se disponível no repositório da equipe).

---

## 5. Políticas e Treinamento

**Caminho no menu:** Políticas (ou Políticas e Treinamento).

- **O que é:** área de **políticas de segurança/compliance** e, quando disponível, **treinamentos** ou attestations ligadas a elas.
- **O que você pode fazer:**
  - Consultar políticas publicadas.
  - Anexar documentos, fazer upload de versões e manter histórico quando a tela permitir.
  - Registrar adesão/atestado ou conclusão de treinamento quando houver fluxo para isso na interface.

---

## 6. Revisões de Acesso

**Caminho no menu:** Revisões de Acesso (ou Access Reviews).

- **O que é:** campanhas de **revisão de acessos** (quem tem acesso a quê) e inventário de sistemas.
- **O que você pode fazer:**
  - Ver campanhas ativas ou agendadas.
  - Participar de revisões atribuídas a você (aprovar/revogar acessos conforme o fluxo da tela).
  - Consultar sistemas inventariados e status de conformidade quando disponível.

---

## 7. Gestão de Riscos

**Caminho no menu:** Riscos (ou Gestão de Riscos).

- **O que é:** cadastro e acompanhamento de **riscos** (titulo, descrição, probabilidade, impacto, proprietário, status, controles associados).
- **O que você pode fazer:**
  - Listar e filtrar riscos por status, nível, categoria.
  - **Cadastrar novo risco** pelos botões de “Novo risco” ou “Adicionar”.
  - Editar riscos existentes e atualizar status (ativo, mitigado, aceito, transferido).
  - Acompanhar matriz de riscos e indicadores na tela.

---

## 8. Portal de Auditoria

**Caminho no menu:** Auditoria (ou Portal de Auditoria).

- **O que é:** gestão de **auditorias** (planejamento, execução, revisão) e evidências ligadas a elas.
- **O que você pode fazer:**
  - Ver lista de auditorias e status (planejamento, em andamento, revisão, concluída).
  - Criar nova auditoria (título, framework, datas, responsável).
  - Associar evidências e achados às auditorias quando a tela oferecer essa opção.
  - Usar a visão de “portal do auditor” quando existir item de menu específico para isso.

---

## 9. Incidentes

**Caminho no menu:** Incidentes (ou Gestão de Incidentes).

- **O que é:** registro e acompanhamento de **incidentes de segurança ou compliance**.
- **O que você pode fazer:**
  - Listar incidentes e filtrar por severidade, status.
  - **Reportar novo incidente** pelo botão “Reportar incidente” (ou similar): preencher título, descrição, severidade, sistemas afetados, etc.
  - Acompanhar playbooks e planos de BCP vinculados quando disponíveis.
  - Atualizar status (em investigação, identificado, em resolução, resolvido).

---

## 10. Relatórios e Exportações

**Caminho no menu:** Relatórios (ou Relatórios e Exportações).

- **O que é:** geração de **relatórios** de compliance e exportação de dados.
- **O que você pode fazer:**
  - Ver relatórios disponíveis (por tipo, framework, período).
  - Gerar relatório conforme os filtros e formato oferecidos (PDF, planilha, etc.).
  - Agendar relatórios recorrentes quando a funcionalidade existir.

---

## 11. Analytics e Relatórios Avançados

**Caminho no menu:** Analytics e/ou Relatórios Avançados.

- **O que é:** dashboards e métricas avançadas de compliance, riscos e auditoria.
- **O que você pode fazer:**
  - Visualizar gráficos e indicadores (evolução de compliance, riscos, SLA, etc.).
  - Aplicar filtros de período, framework ou área quando disponíveis.

---

## 12. Outras áreas

- **Tarefas:** lista de tarefas pendentes ou atribuídas (compliance, auditoria, ações de risco).
- **Arquivos / Gestão de arquivos:** upload e organização de documentos e evidências (ex.: políticas, evidências de auditoria).
- **Notificações:** central de notificações do sistema (alertas, lembretes, atualizações).
- **Questionários:** preenchimento de questionários de compliance ou due diligence quando disponíveis.
- **Trust Center:** página pública ou restrita com informações de segurança e compliance da organização (para clientes ou parceiros).
- **Prontidão de Compliance (Compliance Readiness):** visão de maturidade ou checklist de preparação para auditorias/frameworks.
- **Inventário:** ativos, sistemas ou recursos inventariados para compliance.
- **Desenvolvedores:** documentação de API ou chaves para integrações técnicas (quando o perfil tiver acesso).
- **Jobs / Filas:** monitoramento de jobs em background (para perfis administrativos ou técnicos).

O nome exato dos itens pode variar conforme a versão da interface; use o menu lateral como referência.

---

## 13. Configurações e perfil

- **Configurações (Settings):** onde o administrador ou o usuário pode ajustar preferências da conta, da organização, notificações, temas (claro/escuro) e, quando existir, gestão de usuários e papéis.
- **Perfil / Sessão:** sair do sistema usando a opção de logout no menu do usuário (canto superior direito ou no menu lateral).

---

## 14. Onde buscar ajuda

- **Dúvidas de uso:** consulte este manual e a **documentação de integrações** (`docs/USER_GUIDE_INTEGRATIONS.md`) para fluxos detalhados de conexão de ferramentas.
- **Problemas de acesso ou erros na tela:** entre em contato com o administrador do APOC ou com a equipe de TI que gerencia o ambiente.
- **Documentação técnica (desenvolvedores/DevOps):** a pasta `docs/` do projeto contém documentação técnica (arquitetura, APIs, OAuth, testes). O **README.md** do repositório traz visão geral e requisitos do projeto.

---

**Versão do manual:** 1.0  
**Plataforma:** APOC – Automated Platform for Online Compliance
