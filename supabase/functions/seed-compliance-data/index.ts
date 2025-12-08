import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ISO 27001:2022 Annex A Controls
const iso27001Controls = [
  // A.5 - Organizational Controls
  { code: 'A.5.1', title: 'Políticas de Segurança da Informação', category: 'A.5 - Controles Organizacionais', description: 'Políticas de segurança da informação devem ser definidas, aprovadas pela direção, publicadas e comunicadas.' },
  { code: 'A.5.2', title: 'Papéis e Responsabilidades', category: 'A.5 - Controles Organizacionais', description: 'Papéis e responsabilidades de segurança da informação devem ser definidos e alocados.' },
  { code: 'A.5.3', title: 'Segregação de Funções', category: 'A.5 - Controles Organizacionais', description: 'Funções conflitantes e áreas de responsabilidade devem ser segregadas.' },
  { code: 'A.5.4', title: 'Responsabilidades da Direção', category: 'A.5 - Controles Organizacionais', description: 'A direção deve exigir que todos sigam as políticas de segurança.' },
  { code: 'A.5.5', title: 'Contato com Autoridades', category: 'A.5 - Controles Organizacionais', description: 'Contatos apropriados com autoridades relevantes devem ser mantidos.' },
  { code: 'A.5.6', title: 'Contato com Grupos Especiais', category: 'A.5 - Controles Organizacionais', description: 'Contatos com grupos de interesse especial devem ser mantidos.' },
  { code: 'A.5.7', title: 'Inteligência de Ameaças', category: 'A.5 - Controles Organizacionais', description: 'Informações sobre ameaças devem ser coletadas e analisadas.' },
  { code: 'A.5.8', title: 'Segurança em Projetos', category: 'A.5 - Controles Organizacionais', description: 'Segurança da informação deve ser integrada ao gerenciamento de projetos.' },
  
  // A.6 - People Controls
  { code: 'A.6.1', title: 'Seleção de Pessoal', category: 'A.6 - Controles de Pessoas', description: 'Verificações de antecedentes devem ser realizadas para candidatos.' },
  { code: 'A.6.2', title: 'Termos e Condições de Emprego', category: 'A.6 - Controles de Pessoas', description: 'Acordos contratuais devem estabelecer responsabilidades de segurança.' },
  { code: 'A.6.3', title: 'Conscientização e Treinamento', category: 'A.6 - Controles de Pessoas', description: 'Funcionários devem receber treinamento de segurança adequado.' },
  { code: 'A.6.4', title: 'Processo Disciplinar', category: 'A.6 - Controles de Pessoas', description: 'Processo disciplinar formal para violações de segurança.' },
  { code: 'A.6.5', title: 'Responsabilidades na Rescisão', category: 'A.6 - Controles de Pessoas', description: 'Responsabilidades de segurança válidas após término do contrato.' },
  { code: 'A.6.6', title: 'Acordos de Confidencialidade', category: 'A.6 - Controles de Pessoas', description: 'Acordos de confidencialidade devem ser identificados e assinados.' },
  { code: 'A.6.7', title: 'Trabalho Remoto', category: 'A.6 - Controles de Pessoas', description: 'Medidas de segurança para trabalho remoto devem ser implementadas.' },
  { code: 'A.6.8', title: 'Reporte de Eventos', category: 'A.6 - Controles de Pessoas', description: 'Mecanismo para reportar eventos de segurança observados.' },

  // A.7 - Physical Controls
  { code: 'A.7.1', title: 'Perímetros de Segurança Física', category: 'A.7 - Controles Físicos', description: 'Perímetros de segurança para proteger áreas sensíveis.' },
  { code: 'A.7.2', title: 'Controles de Entrada Física', category: 'A.7 - Controles Físicos', description: 'Áreas seguras devem ter controles de entrada apropriados.' },
  { code: 'A.7.3', title: 'Segurança de Escritórios e Instalações', category: 'A.7 - Controles Físicos', description: 'Segurança física para escritórios, salas e instalações.' },
  { code: 'A.7.4', title: 'Monitoramento de Segurança Física', category: 'A.7 - Controles Físicos', description: 'Monitoramento contínuo para acesso físico não autorizado.' },
  { code: 'A.7.5', title: 'Proteção contra Ameaças Ambientais', category: 'A.7 - Controles Físicos', description: 'Proteção contra desastres naturais e ambientais.' },
  { code: 'A.7.6', title: 'Trabalho em Áreas Seguras', category: 'A.7 - Controles Físicos', description: 'Medidas de segurança para trabalho em áreas seguras.' },
  { code: 'A.7.7', title: 'Mesa e Tela Limpas', category: 'A.7 - Controles Físicos', description: 'Política de mesa limpa e tela limpa.' },
  { code: 'A.7.8', title: 'Localização de Equipamentos', category: 'A.7 - Controles Físicos', description: 'Equipamentos posicionados para reduzir riscos.' },
  { code: 'A.7.9', title: 'Segurança de Ativos Externos', category: 'A.7 - Controles Físicos', description: 'Segurança para ativos fora das instalações.' },
  { code: 'A.7.10', title: 'Mídias de Armazenamento', category: 'A.7 - Controles Físicos', description: 'Gestão de mídias de armazenamento durante seu ciclo de vida.' },
  { code: 'A.7.11', title: 'Utilitários de Suporte', category: 'A.7 - Controles Físicos', description: 'Proteção contra falhas de energia e interrupções.' },
  { code: 'A.7.12', title: 'Segurança de Cabeamento', category: 'A.7 - Controles Físicos', description: 'Cabeamento de energia e telecomunicações protegido.' },
  { code: 'A.7.13', title: 'Manutenção de Equipamentos', category: 'A.7 - Controles Físicos', description: 'Equipamentos mantidos corretamente para disponibilidade.' },
  { code: 'A.7.14', title: 'Descarte Seguro de Equipamentos', category: 'A.7 - Controles Físicos', description: 'Descarte ou reutilização segura de equipamentos.' },

  // A.8 - Technological Controls
  { code: 'A.8.1', title: 'Dispositivos de Usuário Final', category: 'A.8 - Controles Tecnológicos', description: 'Informações armazenadas e processadas em dispositivos de usuário.' },
  { code: 'A.8.2', title: 'Direitos de Acesso Privilegiado', category: 'A.8 - Controles Tecnológicos', description: 'Alocação e uso de direitos de acesso privilegiado restritos.' },
  { code: 'A.8.3', title: 'Restrição de Acesso à Informação', category: 'A.8 - Controles Tecnológicos', description: 'Acesso à informação e funções de sistema restrito.' },
  { code: 'A.8.4', title: 'Acesso ao Código-Fonte', category: 'A.8 - Controles Tecnológicos', description: 'Acesso de leitura e escrita ao código-fonte controlado.' },
  { code: 'A.8.5', title: 'Autenticação Segura', category: 'A.8 - Controles Tecnológicos', description: 'Tecnologias e procedimentos de autenticação segura.' },
  { code: 'A.8.6', title: 'Gestão de Capacidade', category: 'A.8 - Controles Tecnológicos', description: 'Uso de recursos monitorado e ajustado conforme requisitos.' },
  { code: 'A.8.7', title: 'Proteção contra Malware', category: 'A.8 - Controles Tecnológicos', description: 'Proteção contra malware implementada e atualizada.' },
  { code: 'A.8.8', title: 'Gestão de Vulnerabilidades Técnicas', category: 'A.8 - Controles Tecnológicos', description: 'Informações sobre vulnerabilidades técnicas obtidas e tratadas.' },
  { code: 'A.8.9', title: 'Gestão de Configuração', category: 'A.8 - Controles Tecnológicos', description: 'Configurações de hardware, software e redes gerenciadas.' },
  { code: 'A.8.10', title: 'Exclusão de Informações', category: 'A.8 - Controles Tecnológicos', description: 'Informações excluídas quando não mais necessárias.' },
  { code: 'A.8.11', title: 'Mascaramento de Dados', category: 'A.8 - Controles Tecnológicos', description: 'Mascaramento de dados conforme políticas e requisitos.' },
  { code: 'A.8.12', title: 'Prevenção de Vazamento de Dados', category: 'A.8 - Controles Tecnológicos', description: 'Medidas de prevenção de vazamento de dados aplicadas.' },
  { code: 'A.8.13', title: 'Backup de Informações', category: 'A.8 - Controles Tecnológicos', description: 'Cópias de backup mantidas e testadas regularmente.' },
  { code: 'A.8.14', title: 'Redundância de Instalações', category: 'A.8 - Controles Tecnológicos', description: 'Instalações de processamento com redundância suficiente.' },
  { code: 'A.8.15', title: 'Registro de Logs', category: 'A.8 - Controles Tecnológicos', description: 'Logs de atividades, exceções e eventos produzidos e mantidos.' },
  { code: 'A.8.16', title: 'Atividades de Monitoramento', category: 'A.8 - Controles Tecnológicos', description: 'Redes, sistemas e aplicações monitorados para anomalias.' },
  { code: 'A.8.17', title: 'Sincronização de Relógios', category: 'A.8 - Controles Tecnológicos', description: 'Relógios sincronizados com fonte de tempo aprovada.' },
  { code: 'A.8.18', title: 'Uso de Programas Utilitários Privilegiados', category: 'A.8 - Controles Tecnológicos', description: 'Uso de programas utilitários privilegiados restrito e monitorado.' },
  { code: 'A.8.19', title: 'Instalação de Software em Sistemas Operacionais', category: 'A.8 - Controles Tecnológicos', description: 'Procedimentos para controle de instalação de software.' },
  { code: 'A.8.20', title: 'Segurança de Redes', category: 'A.8 - Controles Tecnológicos', description: 'Redes e dispositivos de rede protegidos e gerenciados.' },
  { code: 'A.8.21', title: 'Segurança de Serviços de Rede', category: 'A.8 - Controles Tecnológicos', description: 'Mecanismos de segurança e níveis de serviço identificados.' },
  { code: 'A.8.22', title: 'Segregação de Redes', category: 'A.8 - Controles Tecnológicos', description: 'Grupos de serviços e usuários segregados em redes.' },
  { code: 'A.8.23', title: 'Filtragem Web', category: 'A.8 - Controles Tecnológicos', description: 'Acesso a sites externos gerenciado para reduzir exposição.' },
  { code: 'A.8.24', title: 'Uso de Criptografia', category: 'A.8 - Controles Tecnológicos', description: 'Regras para uso efetivo de criptografia definidas.' },
  { code: 'A.8.25', title: 'Ciclo de Vida de Desenvolvimento Seguro', category: 'A.8 - Controles Tecnológicos', description: 'Regras para desenvolvimento seguro de software.' },
  { code: 'A.8.26', title: 'Requisitos de Segurança de Aplicações', category: 'A.8 - Controles Tecnológicos', description: 'Requisitos de segurança identificados e especificados.' },
  { code: 'A.8.27', title: 'Arquitetura de Sistemas Seguros', category: 'A.8 - Controles Tecnológicos', description: 'Princípios de engenharia de sistemas seguros.' },
  { code: 'A.8.28', title: 'Codificação Segura', category: 'A.8 - Controles Tecnológicos', description: 'Princípios de codificação segura aplicados.' },
  { code: 'A.8.29', title: 'Testes de Segurança em Desenvolvimento', category: 'A.8 - Controles Tecnológicos', description: 'Processos de teste de segurança definidos.' },
  { code: 'A.8.30', title: 'Desenvolvimento Terceirizado', category: 'A.8 - Controles Tecnológicos', description: 'Desenvolvimento terceirizado supervisionado e monitorado.' },
  { code: 'A.8.31', title: 'Separação de Ambientes', category: 'A.8 - Controles Tecnológicos', description: 'Ambientes de desenvolvimento, teste e produção separados.' },
  { code: 'A.8.32', title: 'Gestão de Mudanças', category: 'A.8 - Controles Tecnológicos', description: 'Mudanças em instalações e sistemas sujeitas a procedimentos.' },
  { code: 'A.8.33', title: 'Informações de Teste', category: 'A.8 - Controles Tecnológicos', description: 'Informações de teste selecionadas e protegidas adequadamente.' },
  { code: 'A.8.34', title: 'Proteção de Sistemas durante Auditoria', category: 'A.8 - Controles Tecnológicos', description: 'Testes de auditoria planejados para minimizar interrupções.' },
];

// LGPD Controls
const lgpdControls = [
  // Art. 6 - Principles
  { code: 'LGPD-6.I', title: 'Finalidade', category: 'Art. 6 - Princípios', description: 'Tratamento para propósitos legítimos, específicos, explícitos e informados ao titular.' },
  { code: 'LGPD-6.II', title: 'Adequação', category: 'Art. 6 - Princípios', description: 'Compatibilidade do tratamento com as finalidades informadas ao titular.' },
  { code: 'LGPD-6.III', title: 'Necessidade', category: 'Art. 6 - Princípios', description: 'Limitação do tratamento ao mínimo necessário para realização das finalidades.' },
  { code: 'LGPD-6.IV', title: 'Livre Acesso', category: 'Art. 6 - Princípios', description: 'Garantia de consulta facilitada e gratuita sobre forma e duração do tratamento.' },
  { code: 'LGPD-6.V', title: 'Qualidade dos Dados', category: 'Art. 6 - Princípios', description: 'Garantia de exatidão, clareza, relevância e atualização dos dados.' },
  { code: 'LGPD-6.VI', title: 'Transparência', category: 'Art. 6 - Princípios', description: 'Garantia de informações claras, precisas e facilmente acessíveis.' },
  { code: 'LGPD-6.VII', title: 'Segurança', category: 'Art. 6 - Princípios', description: 'Utilização de medidas técnicas e administrativas para proteção dos dados.' },
  { code: 'LGPD-6.VIII', title: 'Prevenção', category: 'Art. 6 - Princípios', description: 'Adoção de medidas para prevenir danos em virtude do tratamento.' },
  { code: 'LGPD-6.IX', title: 'Não Discriminação', category: 'Art. 6 - Princípios', description: 'Impossibilidade de tratamento para fins discriminatórios ilícitos ou abusivos.' },
  { code: 'LGPD-6.X', title: 'Responsabilização e Prestação de Contas', category: 'Art. 6 - Princípios', description: 'Demonstração de adoção de medidas eficazes de compliance.' },

  // Art. 7 - Legal Basis
  { code: 'LGPD-7.I', title: 'Consentimento do Titular', category: 'Art. 7 - Bases Legais', description: 'Tratamento mediante fornecimento de consentimento pelo titular.' },
  { code: 'LGPD-7.II', title: 'Obrigação Legal', category: 'Art. 7 - Bases Legais', description: 'Cumprimento de obrigação legal ou regulatória pelo controlador.' },
  { code: 'LGPD-7.III', title: 'Políticas Públicas', category: 'Art. 7 - Bases Legais', description: 'Execução de políticas públicas pela administração pública.' },
  { code: 'LGPD-7.IV', title: 'Estudos e Pesquisa', category: 'Art. 7 - Bases Legais', description: 'Realização de estudos por órgão de pesquisa.' },
  { code: 'LGPD-7.V', title: 'Execução de Contrato', category: 'Art. 7 - Bases Legais', description: 'Execução de contrato ou procedimentos preliminares.' },
  { code: 'LGPD-7.VI', title: 'Exercício Regular de Direitos', category: 'Art. 7 - Bases Legais', description: 'Exercício regular de direitos em processo judicial, administrativo ou arbitral.' },
  { code: 'LGPD-7.VII', title: 'Proteção da Vida', category: 'Art. 7 - Bases Legais', description: 'Proteção da vida ou incolumidade física do titular ou terceiro.' },
  { code: 'LGPD-7.VIII', title: 'Tutela da Saúde', category: 'Art. 7 - Bases Legais', description: 'Tutela da saúde em procedimento realizado por profissionais de saúde.' },
  { code: 'LGPD-7.IX', title: 'Legítimo Interesse', category: 'Art. 7 - Bases Legais', description: 'Atender aos interesses legítimos do controlador ou terceiro.' },
  { code: 'LGPD-7.X', title: 'Proteção ao Crédito', category: 'Art. 7 - Bases Legais', description: 'Proteção do crédito conforme legislação pertinente.' },

  // Art. 18 - Data Subject Rights
  { code: 'LGPD-18.I', title: 'Confirmação de Existência', category: 'Art. 18 - Direitos do Titular', description: 'Confirmação da existência de tratamento de dados pessoais.' },
  { code: 'LGPD-18.II', title: 'Acesso aos Dados', category: 'Art. 18 - Direitos do Titular', description: 'Acesso aos dados pessoais tratados pelo controlador.' },
  { code: 'LGPD-18.III', title: 'Correção de Dados', category: 'Art. 18 - Direitos do Titular', description: 'Correção de dados incompletos, inexatos ou desatualizados.' },
  { code: 'LGPD-18.IV', title: 'Anonimização e Bloqueio', category: 'Art. 18 - Direitos do Titular', description: 'Anonimização, bloqueio ou eliminação de dados desnecessários.' },
  { code: 'LGPD-18.V', title: 'Portabilidade', category: 'Art. 18 - Direitos do Titular', description: 'Portabilidade dos dados a outro fornecedor de serviço.' },
  { code: 'LGPD-18.VI', title: 'Eliminação de Dados', category: 'Art. 18 - Direitos do Titular', description: 'Eliminação dos dados tratados com consentimento do titular.' },
  { code: 'LGPD-18.VII', title: 'Informação sobre Compartilhamento', category: 'Art. 18 - Direitos do Titular', description: 'Informação sobre entidades com as quais os dados foram compartilhados.' },
  { code: 'LGPD-18.VIII', title: 'Informação sobre Não Consentimento', category: 'Art. 18 - Direitos do Titular', description: 'Informação sobre a possibilidade de não fornecer consentimento.' },
  { code: 'LGPD-18.IX', title: 'Revogação do Consentimento', category: 'Art. 18 - Direitos do Titular', description: 'Revogação do consentimento mediante manifestação expressa.' },

  // Art. 37-49 - Governance
  { code: 'LGPD-37', title: 'Registro de Operações de Tratamento', category: 'Art. 37-49 - Governança', description: 'Manutenção de registro das operações de tratamento de dados.' },
  { code: 'LGPD-38', title: 'Relatório de Impacto (RIPD)', category: 'Art. 37-49 - Governança', description: 'Elaboração de relatório de impacto à proteção de dados pessoais.' },
  { code: 'LGPD-41', title: 'Encarregado de Dados (DPO)', category: 'Art. 37-49 - Governança', description: 'Indicação de encarregado pelo tratamento de dados pessoais.' },
  { code: 'LGPD-46', title: 'Medidas de Segurança', category: 'Art. 37-49 - Governança', description: 'Adoção de medidas de segurança, técnicas e administrativas.' },
  { code: 'LGPD-48', title: 'Comunicação de Incidentes', category: 'Art. 37-49 - Governança', description: 'Comunicação à ANPD e ao titular sobre incidente de segurança.' },
  { code: 'LGPD-50', title: 'Boas Práticas e Governança', category: 'Art. 37-49 - Governança', description: 'Implementação de programa de governança em privacidade.' },
];

// SOC 2 Controls
const soc2Controls = [
  // CC1 - Control Environment
  { code: 'CC1.1', title: 'Comprometimento com Integridade e Valores Éticos', category: 'CC1 - Ambiente de Controle', description: 'A organização demonstra compromisso com integridade e valores éticos.' },
  { code: 'CC1.2', title: 'Supervisão pelo Conselho', category: 'CC1 - Ambiente de Controle', description: 'O conselho demonstra independência e supervisão do sistema de controle interno.' },
  { code: 'CC1.3', title: 'Estrutura Organizacional', category: 'CC1 - Ambiente de Controle', description: 'A gestão estabelece estrutura, linhas de reporte e autoridades.' },
  { code: 'CC1.4', title: 'Competência de Pessoal', category: 'CC1 - Ambiente de Controle', description: 'A organização demonstra compromisso em atrair e reter pessoas competentes.' },
  { code: 'CC1.5', title: 'Responsabilização', category: 'CC1 - Ambiente de Controle', description: 'A organização mantém indivíduos responsáveis por suas funções de controle interno.' },

  // CC2 - Communication and Information
  { code: 'CC2.1', title: 'Informações de Qualidade', category: 'CC2 - Comunicação e Informação', description: 'A organização obtém e gera informações relevantes e de qualidade.' },
  { code: 'CC2.2', title: 'Comunicação Interna', category: 'CC2 - Comunicação e Informação', description: 'A organização comunica internamente informações necessárias.' },
  { code: 'CC2.3', title: 'Comunicação Externa', category: 'CC2 - Comunicação e Informação', description: 'A organização comunica externamente questões que afetam o funcionamento do controle interno.' },

  // CC3 - Risk Assessment
  { code: 'CC3.1', title: 'Objetivos Claros', category: 'CC3 - Avaliação de Riscos', description: 'A organização especifica objetivos com clareza suficiente.' },
  { code: 'CC3.2', title: 'Identificação de Riscos', category: 'CC3 - Avaliação de Riscos', description: 'A organização identifica riscos para a realização de seus objetivos.' },
  { code: 'CC3.3', title: 'Consideração de Fraude', category: 'CC3 - Avaliação de Riscos', description: 'A organização considera o potencial de fraude na avaliação de riscos.' },
  { code: 'CC3.4', title: 'Mudanças Significativas', category: 'CC3 - Avaliação de Riscos', description: 'A organização identifica e avalia mudanças que podem impactar o sistema.' },

  // CC4 - Monitoring Activities
  { code: 'CC4.1', title: 'Avaliações Contínuas', category: 'CC4 - Atividades de Monitoramento', description: 'A organização seleciona, desenvolve e realiza avaliações contínuas.' },
  { code: 'CC4.2', title: 'Comunicação de Deficiências', category: 'CC4 - Atividades de Monitoramento', description: 'A organização avalia e comunica deficiências de controle interno.' },

  // CC5 - Control Activities
  { code: 'CC5.1', title: 'Seleção de Atividades de Controle', category: 'CC5 - Atividades de Controle', description: 'A organização seleciona e desenvolve atividades de controle que mitigam riscos.' },
  { code: 'CC5.2', title: 'Controles de Tecnologia', category: 'CC5 - Atividades de Controle', description: 'A organização seleciona e desenvolve controles gerais de tecnologia.' },
  { code: 'CC5.3', title: 'Políticas e Procedimentos', category: 'CC5 - Atividades de Controle', description: 'A organização implementa atividades de controle através de políticas e procedimentos.' },

  // CC6 - Logical and Physical Access Controls
  { code: 'CC6.1', title: 'Controle de Acesso Lógico', category: 'CC6 - Controles de Acesso', description: 'Implementação de software de segurança de acesso lógico e arquitetura.' },
  { code: 'CC6.2', title: 'Registro e Autenticação', category: 'CC6 - Controles de Acesso', description: 'Credenciais de autenticação são gerenciadas e controladas.' },
  { code: 'CC6.3', title: 'Autorização de Acesso', category: 'CC6 - Controles de Acesso', description: 'Acesso autorizado com base em funções e segregação de funções.' },
  { code: 'CC6.4', title: 'Restrição de Acesso Físico', category: 'CC6 - Controles de Acesso', description: 'Acesso físico a instalações e ativos protegidos é restrito.' },
  { code: 'CC6.5', title: 'Descarte de Ativos', category: 'CC6 - Controles de Acesso', description: 'Ativos de informação são protegidos durante descarte, remoção ou transferência.' },
  { code: 'CC6.6', title: 'Proteção contra Ameaças Externas', category: 'CC6 - Controles de Acesso', description: 'Medidas contra ameaças de fontes externas.' },
  { code: 'CC6.7', title: 'Transmissão de Dados', category: 'CC6 - Controles de Acesso', description: 'Dados transmitidos entre entidades são protegidos.' },
  { code: 'CC6.8', title: 'Proteção contra Malware', category: 'CC6 - Controles de Acesso', description: 'Controles contra introdução de software não autorizado ou malicioso.' },

  // CC7 - System Operations
  { code: 'CC7.1', title: 'Detecção de Eventos', category: 'CC7 - Operações do Sistema', description: 'Procedimentos de detecção para identificar eventos de segurança.' },
  { code: 'CC7.2', title: 'Monitoramento de Componentes', category: 'CC7 - Operações do Sistema', description: 'Componentes do sistema monitorados para anomalias indicativas de atos maliciosos.' },
  { code: 'CC7.3', title: 'Avaliação de Eventos', category: 'CC7 - Operações do Sistema', description: 'Avaliação de eventos de segurança detectados para determinar potencial impacto.' },
  { code: 'CC7.4', title: 'Resposta a Incidentes', category: 'CC7 - Operações do Sistema', description: 'Resposta a incidentes de segurança identificados conforme programa definido.' },
  { code: 'CC7.5', title: 'Recuperação de Incidentes', category: 'CC7 - Operações do Sistema', description: 'Recuperação de incidentes de segurança identificados.' },

  // CC8 - Change Management
  { code: 'CC8.1', title: 'Gestão de Mudanças de Infraestrutura', category: 'CC8 - Gestão de Mudanças', description: 'Mudanças em infraestrutura, dados e software são autorizadas e testadas.' },

  // CC9 - Risk Mitigation
  { code: 'CC9.1', title: 'Mitigação de Riscos de Interrupção', category: 'CC9 - Mitigação de Riscos', description: 'Identificação e mitigação de riscos de interrupção de negócios.' },
  { code: 'CC9.2', title: 'Gestão de Riscos de Fornecedores', category: 'CC9 - Mitigação de Riscos', description: 'Avaliação e gestão de riscos associados a fornecedores e parceiros.' },

  // A1 - Availability
  { code: 'A1.1', title: 'Capacidade de Processamento', category: 'A1 - Disponibilidade', description: 'Manutenção, monitoramento e avaliação de capacidade de processamento atual.' },
  { code: 'A1.2', title: 'Proteção Ambiental', category: 'A1 - Disponibilidade', description: 'Proteção contra eventos ambientais que podem resultar em falhas.' },
  { code: 'A1.3', title: 'Recuperação de Infraestrutura', category: 'A1 - Disponibilidade', description: 'Procedimentos de recuperação testados para suportar disponibilidade.' },

  // C1 - Confidentiality
  { code: 'C1.1', title: 'Identificação de Informações Confidenciais', category: 'C1 - Confidencialidade', description: 'Procedimentos para identificar e designar informações confidenciais.' },
  { code: 'C1.2', title: 'Descarte de Informações Confidenciais', category: 'C1 - Confidencialidade', description: 'Descarte seguro de informações confidenciais.' },

  // PI1 - Processing Integrity
  { code: 'PI1.1', title: 'Definição de Processamento', category: 'PI1 - Integridade de Processamento', description: 'Definição clara de especificações de processamento de dados.' },
  { code: 'PI1.2', title: 'Validação de Entradas', category: 'PI1 - Integridade de Processamento', description: 'Entradas do sistema validadas para completude e precisão.' },
  { code: 'PI1.3', title: 'Detecção de Erros', category: 'PI1 - Integridade de Processamento', description: 'Erros de processamento detectados e corrigidos oportunamente.' },
  { code: 'PI1.4', title: 'Validação de Saídas', category: 'PI1 - Integridade de Processamento', description: 'Saídas do sistema completas, precisas e distribuídas conforme especificado.' },
  { code: 'PI1.5', title: 'Armazenamento de Dados', category: 'PI1 - Integridade de Processamento', description: 'Dados armazenados permanecem completos, precisos e válidos.' },

  // P1 - Privacy
  { code: 'P1.1', title: 'Aviso de Privacidade', category: 'P1 - Privacidade', description: 'Aviso de privacidade fornecido sobre coleta, uso e retenção de dados pessoais.' },
  { code: 'P2.1', title: 'Escolha e Consentimento', category: 'P2 - Privacidade', description: 'Comunicação de escolhas e consentimento obtido para coleta de dados pessoais.' },
  { code: 'P3.1', title: 'Coleta de Dados Pessoais', category: 'P3 - Privacidade', description: 'Dados pessoais coletados conforme objetivos de privacidade.' },
  { code: 'P4.1', title: 'Uso e Retenção', category: 'P4 - Privacidade', description: 'Dados pessoais usados e retidos conforme objetivos de privacidade.' },
  { code: 'P5.1', title: 'Acesso aos Dados', category: 'P5 - Privacidade', description: 'Titulares podem acessar seus dados pessoais para revisão e correção.' },
  { code: 'P6.1', title: 'Divulgação a Terceiros', category: 'P6 - Privacidade', description: 'Dados pessoais divulgados a terceiros somente conforme objetivos de privacidade.' },
  { code: 'P7.1', title: 'Qualidade de Dados Pessoais', category: 'P7 - Privacidade', description: 'Dados pessoais completos, precisos, relevantes e com segurança.' },
  { code: 'P8.1', title: 'Gerenciamento de Reclamações', category: 'P8 - Privacidade', description: 'Processo de gerenciamento de reclamações de privacidade.' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Starting seed for user: ${user.id}`);

    // Check if user already has frameworks
    const { data: existingFrameworks } = await supabase
      .from('frameworks')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingFrameworks && existingFrameworks.length > 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Frameworks already exist for this user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create frameworks
    const frameworksToInsert = [
      {
        user_id: user.id,
        name: 'ISO 27001:2022',
        description: 'Sistema de Gestão de Segurança da Informação - Anexo A com 93 controles organizados em 4 temas.',
        version: '2022',
        status: 'active',
        total_controls: iso27001Controls.length,
        passed_controls: 0,
        compliance_score: 0,
      },
      {
        user_id: user.id,
        name: 'LGPD',
        description: 'Lei Geral de Proteção de Dados - Lei 13.709/2018 com requisitos de privacidade e proteção de dados.',
        version: '2018',
        status: 'active',
        total_controls: lgpdControls.length,
        passed_controls: 0,
        compliance_score: 0,
      },
      {
        user_id: user.id,
        name: 'SOC 2 Type II',
        description: 'Trust Service Criteria - Critérios de Segurança, Disponibilidade, Integridade, Confidencialidade e Privacidade.',
        version: '2017',
        status: 'active',
        total_controls: soc2Controls.length,
        passed_controls: 0,
        compliance_score: 0,
      },
    ];

    const { data: frameworks, error: frameworksError } = await supabase
      .from('frameworks')
      .insert(frameworksToInsert)
      .select();

    if (frameworksError) {
      console.error('Error inserting frameworks:', frameworksError);
      throw frameworksError;
    }

    console.log(`Created ${frameworks.length} frameworks`);

    const iso27001Framework = frameworks.find(f => f.name === 'ISO 27001:2022');
    const lgpdFramework = frameworks.find(f => f.name === 'LGPD');
    const soc2Framework = frameworks.find(f => f.name === 'SOC 2 Type II');

    // Create controls for each framework
    const allControls = [
      ...iso27001Controls.map(c => ({
        user_id: user.id,
        framework_id: iso27001Framework?.id,
        code: c.code,
        title: c.title,
        category: c.category,
        description: c.description,
        status: 'pending',
        evidence_count: 0,
      })),
      ...lgpdControls.map(c => ({
        user_id: user.id,
        framework_id: lgpdFramework?.id,
        code: c.code,
        title: c.title,
        category: c.category,
        description: c.description,
        status: 'pending',
        evidence_count: 0,
      })),
      ...soc2Controls.map(c => ({
        user_id: user.id,
        framework_id: soc2Framework?.id,
        code: c.code,
        title: c.title,
        category: c.category,
        description: c.description,
        status: 'pending',
        evidence_count: 0,
      })),
    ];

    const { data: controls, error: controlsError } = await supabase
      .from('controls')
      .insert(allControls)
      .select();

    if (controlsError) {
      console.error('Error inserting controls:', controlsError);
      throw controlsError;
    }

    console.log(`Created ${controls.length} controls`);

    // Create default evidence mappings
    const evidenceMappings = [
      { integration_name: 'azure_ad', evidence_type: 'mfa_status', config: { description: 'Status de MFA dos usuários' } },
      { integration_name: 'azure_ad', evidence_type: 'user_access_list', config: { description: 'Lista de acessos de usuários' } },
      { integration_name: 'azure_ad', evidence_type: 'conditional_access', config: { description: 'Políticas de acesso condicional' } },
      { integration_name: 'google_workspace', evidence_type: 'user_directory', config: { description: 'Diretório de usuários' } },
      { integration_name: 'google_workspace', evidence_type: 'drive_sharing', config: { description: 'Configurações de compartilhamento do Drive' } },
      { integration_name: 'google_workspace', evidence_type: 'security_alerts', config: { description: 'Alertas de segurança' } },
      { integration_name: 'aws', evidence_type: 'iam_users', config: { description: 'Usuários IAM e suas políticas' } },
      { integration_name: 'aws', evidence_type: 's3_bucket_policies', config: { description: 'Políticas de buckets S3' } },
      { integration_name: 'aws', evidence_type: 'cloudtrail_logs', config: { description: 'Logs de auditoria CloudTrail' } },
    ];

    const { error: mappingError } = await supabase
      .from('integration_evidence_mapping')
      .insert(evidenceMappings);

    if (mappingError) {
      console.error('Error inserting evidence mappings:', mappingError);
      // Don't throw, this is non-critical
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        data: {
          frameworks: frameworks.length,
          controls: controls.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
