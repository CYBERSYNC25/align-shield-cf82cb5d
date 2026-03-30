import LegalPageLayout from '@/components/legal/LegalPageLayout';
import LegalSection from '@/components/legal/LegalSection';

const sections = [
  { id: 'objeto', title: 'Objeto do Acordo' },
  { id: 'definicoes', title: 'Definições' },
  { id: 'obrigacoes-controlador', title: 'Obrigações do Controlador' },
  { id: 'obrigacoes-operador', title: 'Obrigações do Operador' },
  { id: 'subprocessadores', title: 'Subprocessadores' },
  { id: 'transferencias', title: 'Transferências Internacionais' },
  { id: 'seguranca', title: 'Medidas de Segurança' },
  { id: 'incidentes', title: 'Notificação de Incidentes' },
  { id: 'auditorias', title: 'Auditorias' },
  { id: 'termino', title: 'Término e Devolução' },
];

const otherDocs = [
  { href: '/legal/terms', label: 'Termos de Serviço', icon: 'terms' as const },
  { href: '/legal/privacy', label: 'Política de Privacidade', icon: 'privacy' as const },
  { href: '/legal/dpa', label: 'Acordo de Processamento', icon: 'dpa' as const },
];

const DPA = () => {
  return (
    <LegalPageLayout
      title="Acordo de Processamento de Dados (DPA)"
      subtitle="Data Processing Agreement para clientes enterprise"
      lastUpdated="23 de Janeiro de 2026"
      sections={sections}
      otherDocs={otherDocs}
    >
      <LegalSection id="objeto" title="1. Objeto do Acordo">
        <p>
          Este Acordo de Processamento de Dados ("DPA") é celebrado entre o Cliente 
          ("Controlador") e a Compliance Sync Systems Ltda. ("Operador") e estabelece as obrigações 
          das partes em relação ao tratamento de dados pessoais no âmbito da prestação 
          dos Serviços da Plataforma Compliance Sync.
        </p>

        <p className="mt-4">
          <strong>Escopo do Processamento:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Armazenamento e processamento de dados de compliance</li>
          <li>Gestão de identidades e controles de acesso</li>
          <li>Coleta de evidências de auditoria</li>
          <li>Integração com sistemas do Controlador</li>
          <li>Geração de relatórios e análises</li>
        </ul>

        <p className="mt-4">
          <strong>Tipos de Dados Processados:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados de identificação de colaboradores</li>
          <li>Dados de acesso e autenticação</li>
          <li>Logs e registros de atividade</li>
          <li>Documentos e evidências de compliance</li>
          <li>Metadados de sistemas integrados</li>
        </ul>

        <p className="mt-4">
          <strong>Titulares de Dados:</strong> Colaboradores, prestadores de serviço, 
          auditores e demais usuários autorizados pelo Controlador.
        </p>
      </LegalSection>

      <LegalSection id="definicoes" title="2. Definições">
        <p>
          Para fins deste DPA, aplicam-se as seguintes definições, em complemento 
          àquelas previstas na LGPD:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>"Controlador":</strong> O Cliente que determina as finalidades 
            e meios do tratamento de dados pessoais.
          </li>
          <li>
            <strong>"Operador":</strong> A Compliance Sync, que trata dados pessoais em nome 
            do Controlador, conforme suas instruções.
          </li>
          <li>
            <strong>"Subprocessador":</strong> Terceiro contratado pelo Operador 
            para auxiliar no tratamento de dados.
          </li>
          <li>
            <strong>"Dados Pessoais":</strong> Informação relacionada a pessoa natural 
            identificada ou identificável.
          </li>
          <li>
            <strong>"Dados Sensíveis":</strong> Dados pessoais sobre origem racial, 
            convicção religiosa, opinião política, saúde, vida sexual, dado genético 
            ou biométrico.
          </li>
          <li>
            <strong>"Violação de Dados":</strong> Incidente de segurança que resulte 
            em acesso não autorizado, destruição, perda, alteração ou divulgação de 
            dados pessoais.
          </li>
          <li>
            <strong>"Instruções Documentadas":</strong> Diretrizes escritas do 
            Controlador sobre o tratamento de dados.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="obrigacoes-controlador" title="3. Obrigações do Controlador">
        <p>O Controlador compromete-se a:</p>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Legalidade:</strong> Garantir que possui base legal adequada para 
            o tratamento de dados pessoais e sua transferência ao Operador.
          </li>
          <li>
            <strong>Instruções:</strong> Fornecer instruções claras e documentadas 
            sobre o tratamento de dados, em conformidade com a legislação aplicável.
          </li>
          <li>
            <strong>Direitos dos Titulares:</strong> Gerenciar e responder às 
            solicitações de titulares de dados, com suporte do Operador quando 
            necessário.
          </li>
          <li>
            <strong>Notificação:</strong> Informar prontamente o Operador sobre 
            quaisquer alterações nas instruções de processamento.
          </li>
          <li>
            <strong>Avaliação de Impacto:</strong> Conduzir Relatórios de Impacto 
            à Proteção de Dados (RIPD) quando exigido pela legislação.
          </li>
          <li>
            <strong>Minimização:</strong> Garantir que apenas dados necessários 
            para as finalidades sejam transferidos ao Operador.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="obrigacoes-operador" title="4. Obrigações do Operador">
        <p>O Operador (APOC) compromete-se a:</p>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Conformidade:</strong> Tratar dados pessoais apenas conforme as 
            instruções documentadas do Controlador, exceto quando exigido por lei.
          </li>
          <li>
            <strong>Confidencialidade:</strong> Garantir que pessoas autorizadas a 
            tratar dados pessoais assumam compromisso de confidencialidade.
          </li>
          <li>
            <strong>Segurança:</strong> Implementar medidas técnicas e organizacionais 
            adequadas para garantir a segurança do tratamento.
          </li>
          <li>
            <strong>Subprocessamento:</strong> Não subcontratar tratamento sem 
            autorização prévia do Controlador.
          </li>
          <li>
            <strong>Cooperação:</strong> Auxiliar o Controlador no atendimento a 
            solicitações de titulares e autoridades.
          </li>
          <li>
            <strong>Exclusão:</strong> Ao término do contrato, excluir ou devolver 
            dados pessoais, conforme instruído.
          </li>
          <li>
            <strong>Auditoria:</strong> Disponibilizar informações necessárias para 
            demonstrar conformidade e permitir auditorias.
          </li>
          <li>
            <strong>Notificação:</strong> Informar imediatamente o Controlador sobre 
            qualquer violação de dados.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="subprocessadores" title="5. Subprocessadores">
        <p>
          <strong>Autorização:</strong> O Controlador autoriza o Operador a utilizar 
          os subprocessadores listados abaixo para auxiliar na prestação dos Serviços:
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border border-border/50 rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Subprocessador</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Finalidade</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr>
                <td className="px-4 py-2 text-sm">Supabase Inc.</td>
                <td className="px-4 py-2 text-sm">Infraestrutura e banco de dados</td>
                <td className="px-4 py-2 text-sm">EUA (AWS)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">Cloudflare Inc.</td>
                <td className="px-4 py-2 text-sm">CDN e segurança</td>
                <td className="px-4 py-2 text-sm">Global</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">Resend</td>
                <td className="px-4 py-2 text-sm">Envio de e-mails transacionais</td>
                <td className="px-4 py-2 text-sm">EUA</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          <strong>Novos Subprocessadores:</strong> O Operador notificará o Controlador 
          com antecedência mínima de 30 (trinta) dias antes de adicionar novos 
          subprocessadores. O Controlador pode opor-se por escrito dentro deste prazo.
        </p>

        <p className="mt-4">
          <strong>Responsabilidade:</strong> O Operador permanece responsável pelos 
          atos de seus subprocessadores e garantirá que estes cumpram obrigações 
          equivalentes às deste DPA.
        </p>
      </LegalSection>

      <LegalSection id="transferencias" title="6. Transferências Internacionais">
        <p>
          Dados pessoais podem ser transferidos para países fora do Brasil. O Operador 
          garante que todas as transferências são realizadas com salvaguardas adequadas:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Cláusulas Contratuais Padrão:</strong> Contratos com subprocessadores 
            incluem cláusulas contratuais padrão aprovadas para transferências internacionais.
          </li>
          <li>
            <strong>Avaliação de Adequação:</strong> Verificação do nível de proteção 
            de dados no país de destino.
          </li>
          <li>
            <strong>Medidas Suplementares:</strong> Implementação de criptografia e 
            controles adicionais quando necessário.
          </li>
        </ul>

        <p className="mt-4">
          <strong>Países de Destino:</strong> Atualmente, dados podem ser processados 
          nos Estados Unidos (AWS us-east-1) e em edge locations globais (Cloudflare).
        </p>

        <p className="mt-4">
          <strong>Direitos do Titular:</strong> Os direitos dos titulares previstos 
          na LGPD são garantidos independentemente da localização do processamento.
        </p>
      </LegalSection>

      <LegalSection id="seguranca" title="7. Medidas de Segurança">
        <p>
          O Operador implementa as seguintes medidas de segurança, alinhadas com 
          padrões internacionais (ISO 27001, SOC 2):
        </p>

        <p className="mt-4"><strong>Controles de Acesso:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Autenticação multifator (MFA) obrigatória para administradores</li>
          <li>Controle de acesso baseado em funções (RBAC)</li>
          <li>Princípio do menor privilégio</li>
          <li>Revisão periódica de acessos</li>
          <li>Logs de autenticação e auditoria</li>
        </ul>

        <p className="mt-4"><strong>Criptografia:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>TLS 1.3 para dados em trânsito</li>
          <li>AES-256 para dados em repouso</li>
          <li>Gestão segura de chaves criptográficas</li>
          <li>Hashing de senhas com algoritmos seguros (bcrypt)</li>
        </ul>

        <p className="mt-4"><strong>Infraestrutura:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Datacenters com certificação SOC 2 Tipo II</li>
          <li>Redundância geográfica</li>
          <li>Backups automáticos diários</li>
          <li>Monitoramento 24/7</li>
          <li>Proteção contra DDoS</li>
        </ul>

        <p className="mt-4"><strong>Processos:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Política de segurança da informação documentada</li>
          <li>Treinamento de segurança para colaboradores</li>
          <li>Gestão de vulnerabilidades</li>
          <li>Testes de penetração anuais</li>
          <li>Plano de resposta a incidentes</li>
        </ul>
      </LegalSection>

      <LegalSection id="incidentes" title="8. Notificação de Incidentes">
        <p>
          Em caso de violação de dados pessoais, o Operador seguirá o seguinte 
          procedimento:
        </p>

        <p className="mt-4"><strong>Notificação Inicial:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Prazo: até 48 (quarenta e oito) horas após a confirmação do incidente</li>
          <li>Canal: e-mail para o contato designado pelo Controlador</li>
          <li>Seguido de contato telefônico para incidentes críticos</li>
        </ul>

        <p className="mt-4"><strong>Conteúdo da Notificação:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Descrição da natureza da violação</li>
          <li>Categorias e quantidade aproximada de titulares afetados</li>
          <li>Categorias e quantidade de registros afetados</li>
          <li>Consequências prováveis da violação</li>
          <li>Medidas adotadas ou propostas para mitigar os efeitos</li>
          <li>Dados de contato do DPO</li>
        </ul>

        <p className="mt-4"><strong>Cooperação:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Auxílio na investigação do incidente</li>
          <li>Fornecimento de informações adicionais quando disponíveis</li>
          <li>Suporte na comunicação com autoridades e titulares</li>
          <li>Implementação de medidas corretivas</li>
        </ul>

        <p className="mt-4">
          <strong>Documentação:</strong> O Operador manterá registro de todos os 
          incidentes de segurança, incluindo circunstâncias, efeitos e medidas adotadas.
        </p>
      </LegalSection>

      <LegalSection id="auditorias" title="9. Auditorias">
        <p>
          O Controlador tem direito de verificar a conformidade do Operador com 
          este DPA:
        </p>

        <p className="mt-4"><strong>Documentação Disponível:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Relatórios de auditoria SOC 2 (mediante NDA)</li>
          <li>Certificados de segurança e compliance</li>
          <li>Políticas e procedimentos documentados</li>
          <li>Resultados de testes de penetração (resumo)</li>
        </ul>

        <p className="mt-4"><strong>Auditorias Presenciais:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Agendamento com antecedência mínima de 30 dias</li>
          <li>Escopo definido previamente</li>
          <li>Conduzidas por auditor independente acordado entre as partes</li>
          <li>Custos arcados pelo Controlador (exceto se identificada não-conformidade significativa)</li>
          <li>Limitadas a uma auditoria por ano, salvo em caso de incidente</li>
        </ul>

        <p className="mt-4"><strong>Confidencialidade:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Informações obtidas em auditoria são confidenciais</li>
          <li>Auditores devem assinar NDA antes do acesso</li>
          <li>Resultados não podem ser compartilhados com terceiros</li>
        </ul>
      </LegalSection>

      <LegalSection id="termino" title="10. Término e Devolução de Dados">
        <p>
          Ao término da relação contratual, aplicam-se as seguintes disposições:
        </p>

        <p className="mt-4"><strong>Opções do Controlador:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Exportação:</strong> Solicitar exportação completa dos dados em 
            formato estruturado (JSON, CSV) dentro de 30 dias.
          </li>
          <li>
            <strong>Exclusão:</strong> Solicitar exclusão definitiva de todos os dados.
          </li>
          <li>
            <strong>Silêncio:</strong> Na ausência de instrução, dados serão excluídos 
            após 90 dias do término.
          </li>
        </ul>

        <p className="mt-4"><strong>Processo de Exclusão:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Exclusão de dados de produção: até 30 dias</li>
          <li>Exclusão de backups: até 90 dias</li>
          <li>Certificado de destruição disponível mediante solicitação</li>
        </ul>

        <p className="mt-4"><strong>Retenção Legal:</strong></p>
        <p>
          O Operador pode reter dados pessoais quando exigido por lei ou para defesa 
          em processos legais, informando o Controlador sobre a retenção e sua base legal.
        </p>

        <p className="mt-4"><strong>Obrigações Sobreviventes:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Confidencialidade: permanece vigente por 5 anos</li>
          <li>Cooperação em auditorias: até a exclusão completa dos dados</li>
          <li>Responsabilidade por violações anteriores: conforme legislação aplicável</li>
        </ul>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p><strong>Contato para Questões sobre este DPA:</strong></p>
          <ul className="mt-2 space-y-1">
            <li>E-mail: <a href="mailto:legal@compliancesync.systems" className="text-primary hover:underline">legal@compliancesync.systems</a></li>
            <li>DPO: <a href="mailto:dpo@compliancesync.systems" className="text-primary hover:underline">dpo@compliancesync.systems</a></li>
          </ul>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default DPA;
