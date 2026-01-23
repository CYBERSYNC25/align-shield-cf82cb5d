import LegalPageLayout from '@/components/legal/LegalPageLayout';
import LegalSection from '@/components/legal/LegalSection';

const sections = [
  { id: 'dados-coletados', title: 'Dados Coletados' },
  { id: 'como-usamos', title: 'Como Usamos seus Dados' },
  { id: 'compartilhamento', title: 'Compartilhamento de Dados' },
  { id: 'seguranca', title: 'Segurança dos Dados' },
  { id: 'retencao', title: 'Retenção de Dados' },
  { id: 'seus-direitos', title: 'Seus Direitos (LGPD)' },
  { id: 'cookies', title: 'Cookies e Tecnologias' },
  { id: 'contato-dpo', title: 'Contato do DPO' },
];

const otherDocs = [
  { href: '/legal/terms', label: 'Termos de Serviço', icon: 'terms' as const },
  { href: '/legal/privacy', label: 'Política de Privacidade', icon: 'privacy' as const },
  { href: '/legal/dpa', label: 'Acordo de Processamento', icon: 'dpa' as const },
];

const Privacy = () => {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      subtitle="Como coletamos, usamos e protegemos seus dados pessoais"
      lastUpdated="23 de Janeiro de 2026"
      sections={sections}
      otherDocs={otherDocs}
    >
      <LegalSection id="dados-coletados" title="1. Dados Coletados">
        <p>
          A APOC coleta diferentes categorias de dados pessoais para fornecer e melhorar 
          nossos Serviços. As categorias de dados incluem:
        </p>

        <p className="mt-4"><strong>Dados de Cadastro:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nome completo</li>
          <li>Endereço de e-mail corporativo</li>
          <li>Nome da organização</li>
          <li>Cargo ou função</li>
          <li>Número de telefone (opcional)</li>
        </ul>

        <p className="mt-4"><strong>Dados de Uso:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Logs de acesso e navegação na Plataforma</li>
          <li>Ações realizadas (criação, edição, exclusão de registros)</li>
          <li>Preferências e configurações do usuário</li>
          <li>Dispositivos e navegadores utilizados</li>
          <li>Endereço IP e geolocalização aproximada</li>
        </ul>

        <p className="mt-4"><strong>Dados de Conteúdo:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Documentos e arquivos carregados</li>
          <li>Informações inseridas em formulários</li>
          <li>Comentários e anotações</li>
          <li>Evidências de compliance anexadas</li>
        </ul>

        <p className="mt-4"><strong>Dados de Terceiros:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Informações obtidas através de integrações autorizadas (AWS, Azure, Google, etc.)</li>
          <li>Dados importados de sistemas conectados</li>
        </ul>
      </LegalSection>

      <LegalSection id="como-usamos" title="2. Como Usamos seus Dados">
        <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>

        <p className="mt-4"><strong>Prestação dos Serviços:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Autenticar e gerenciar sua conta</li>
          <li>Fornecer acesso às funcionalidades da Plataforma</li>
          <li>Processar e armazenar dados de compliance</li>
          <li>Executar integrações com sistemas externos</li>
        </ul>

        <p className="mt-4"><strong>Comunicação:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Enviar notificações sobre sua conta e atividades</li>
          <li>Alertas de segurança e compliance</li>
          <li>Atualizações sobre mudanças nos Serviços ou políticas</li>
          <li>Suporte técnico e atendimento ao cliente</li>
        </ul>

        <p className="mt-4"><strong>Melhoria dos Serviços:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Análise de uso para aprimorar a experiência</li>
          <li>Identificação e correção de problemas técnicos</li>
          <li>Desenvolvimento de novas funcionalidades</li>
          <li>Pesquisas de satisfação (opcional)</li>
        </ul>

        <p className="mt-4"><strong>Segurança e Compliance:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Detecção e prevenção de fraudes</li>
          <li>Auditoria e logs de segurança</li>
          <li>Cumprimento de obrigações legais</li>
          <li>Resposta a solicitações de autoridades</li>
        </ul>

        <p className="mt-4">
          <strong>Base Legal:</strong> O tratamento de dados é realizado com base no 
          consentimento do titular, execução de contrato, cumprimento de obrigação legal 
          ou legítimo interesse, conforme aplicável a cada finalidade.
        </p>
      </LegalSection>

      <LegalSection id="compartilhamento" title="3. Compartilhamento de Dados">
        <p>
          A APOC não comercializa dados pessoais. Podemos compartilhar seus dados apenas 
          nas seguintes situações:
        </p>

        <p className="mt-4"><strong>Provedores de Serviço:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provedores de infraestrutura cloud (Supabase, AWS, Cloudflare)</li>
          <li>Serviços de e-mail transacional</li>
          <li>Ferramentas de análise e monitoramento</li>
          <li>Processadores de pagamento</li>
        </ul>

        <p className="mt-4"><strong>Obrigações Legais:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cumprimento de ordem judicial ou administrativa</li>
          <li>Solicitações de autoridades de proteção de dados</li>
          <li>Investigações de segurança quando legalmente requerido</li>
        </ul>

        <p className="mt-4"><strong>Transações Corporativas:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Em caso de fusão, aquisição ou venda de ativos</li>
          <li>Mediante notificação prévia aos titulares</li>
        </ul>

        <p className="mt-4"><strong>Com seu Consentimento:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Quando você autorizar expressamente o compartilhamento</li>
          <li>Integrações configuradas por você com sistemas terceiros</li>
        </ul>

        <p className="mt-4">
          <strong>Transferências Internacionais:</strong> Seus dados podem ser processados 
          em servidores localizados fora do Brasil. Garantimos que todas as transferências 
          são realizadas com salvaguardas adequadas (cláusulas contratuais padrão, 
          certificações de adequação).
        </p>
      </LegalSection>

      <LegalSection id="seguranca" title="4. Segurança dos Dados">
        <p>
          Implementamos medidas técnicas e organizacionais robustas para proteger seus 
          dados pessoais:
        </p>

        <p className="mt-4"><strong>Controles Técnicos:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Criptografia em trânsito (TLS 1.3) e em repouso (AES-256)</li>
          <li>Autenticação multifator (MFA) disponível</li>
          <li>Controle de acesso baseado em funções (RBAC)</li>
          <li>Monitoramento contínuo de segurança</li>
          <li>Firewalls e sistemas de detecção de intrusão</li>
          <li>Backups automáticos e redundância geográfica</li>
        </ul>

        <p className="mt-4"><strong>Controles Organizacionais:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Políticas de segurança da informação</li>
          <li>Treinamento regular de colaboradores</li>
          <li>Acordos de confidencialidade</li>
          <li>Gestão de incidentes de segurança</li>
          <li>Auditorias periódicas</li>
        </ul>

        <p className="mt-4"><strong>Certificações e Compliance:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Conformidade com ISO 27001 (em processo)</li>
          <li>Aderência aos princípios do SOC 2</li>
          <li>Compliance com LGPD e GDPR</li>
        </ul>

        <p className="mt-4">
          <strong>Notificação de Incidentes:</strong> Em caso de violação de dados que 
          possa resultar em risco aos titulares, notificaremos a ANPD e os afetados 
          dentro dos prazos legais.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="5. Retenção de Dados">
        <p>
          Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades 
          para as quais foram coletados:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Dados de Conta:</strong> Durante a vigência do contrato e por 5 anos 
            após o encerramento (para fins fiscais e legais).
          </li>
          <li>
            <strong>Logs de Auditoria:</strong> 5 anos, conforme requisitos de compliance.
          </li>
          <li>
            <strong>Dados de Uso:</strong> 2 anos para análise e melhoria dos serviços.
          </li>
          <li>
            <strong>Evidências e Documentos:</strong> Conforme período de retenção 
            definido pela Organização.
          </li>
          <li>
            <strong>Backups:</strong> Máximo de 90 dias em sistemas de recuperação.
          </li>
        </ul>

        <p className="mt-4">
          <strong>Após Exclusão:</strong> Quando os dados não forem mais necessários, 
          serão anonimizados ou excluídos de forma segura, exceto quando a retenção 
          for exigida por lei.
        </p>
      </LegalSection>

      <LegalSection id="seus-direitos" title="6. Seus Direitos (LGPD)">
        <p>
          Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os 
          seguintes direitos:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Confirmação e Acesso:</strong> Confirmar a existência de tratamento 
            e acessar seus dados pessoais.
          </li>
          <li>
            <strong>Correção:</strong> Solicitar a correção de dados incompletos, 
            inexatos ou desatualizados.
          </li>
          <li>
            <strong>Anonimização ou Eliminação:</strong> Requerer a anonimização, bloqueio 
            ou eliminação de dados desnecessários ou tratados em desconformidade.
          </li>
          <li>
            <strong>Portabilidade:</strong> Solicitar a transferência de seus dados a 
            outro fornecedor de serviço.
          </li>
          <li>
            <strong>Informação sobre Compartilhamento:</strong> Saber com quais entidades 
            públicas e privadas seus dados foram compartilhados.
          </li>
          <li>
            <strong>Revogação do Consentimento:</strong> Revogar o consentimento a 
            qualquer momento, quando aplicável.
          </li>
          <li>
            <strong>Oposição:</strong> Opor-se ao tratamento quando realizado com base 
            em hipóteses que não o consentimento.
          </li>
          <li>
            <strong>Revisão de Decisões Automatizadas:</strong> Solicitar revisão de 
            decisões tomadas unicamente com base em tratamento automatizado.
          </li>
        </ul>

        <p className="mt-4">
          <strong>Como Exercer seus Direitos:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Via configurações da conta na Plataforma</li>
          <li>Através do e-mail: <a href="mailto:privacidade@apoc.systems" className="text-primary hover:underline">privacidade@apoc.systems</a></li>
          <li>Portal de solicitações: <a href="https://apoc.systems/privacidade" className="text-primary hover:underline">apoc.systems/privacidade</a></li>
        </ul>

        <p className="mt-4">
          <strong>Prazo de Resposta:</strong> Responderemos às solicitações em até 15 
          (quinze) dias úteis, podendo ser prorrogado por igual período mediante 
          justificativa.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="7. Cookies e Tecnologias">
        <p>
          Utilizamos cookies e tecnologias similares para melhorar sua experiência:
        </p>

        <p className="mt-4"><strong>Cookies Essenciais:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Autenticação e manutenção da sessão</li>
          <li>Preferências de segurança</li>
          <li>Funcionamento básico da Plataforma</li>
        </ul>

        <p className="mt-4"><strong>Cookies de Desempenho:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Análise de uso e navegação</li>
          <li>Identificação de erros e problemas</li>
          <li>Métricas de performance</li>
        </ul>

        <p className="mt-4"><strong>Cookies Funcionais:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Preferências de idioma e tema</li>
          <li>Configurações personalizadas</li>
          <li>Histórico de navegação na Plataforma</li>
        </ul>

        <p className="mt-4">
          <strong>Gerenciamento:</strong> Você pode configurar seu navegador para bloquear 
          ou alertar sobre cookies. Note que isso pode afetar o funcionamento de algumas 
          funcionalidades.
        </p>

        <p className="mt-4">
          <strong>Tecnologias Similares:</strong> Também utilizamos local storage, 
          session storage e web beacons para funcionalidades específicas da Plataforma.
        </p>
      </LegalSection>

      <LegalSection id="contato-dpo" title="8. Contato do DPO">
        <p>
          Nomeamos um Encarregado de Proteção de Dados (DPO) para atender questões 
          relacionadas à privacidade:
        </p>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p><strong>Encarregado de Proteção de Dados (DPO)</strong></p>
          <ul className="mt-2 space-y-1">
            <li>Nome: [Nome do DPO]</li>
            <li>E-mail: <a href="mailto:dpo@apoc.systems" className="text-primary hover:underline">dpo@apoc.systems</a></li>
            <li>Telefone: +55 (11) XXXX-XXXX</li>
          </ul>
        </div>

        <p className="mt-4"><strong>Você pode contatar o DPO para:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Exercer seus direitos como titular de dados</li>
          <li>Esclarecer dúvidas sobre tratamento de dados</li>
          <li>Reportar incidentes de privacidade</li>
          <li>Solicitar informações sobre nossas práticas</li>
        </ul>

        <p className="mt-4">
          <strong>Autoridade Nacional:</strong> Caso não esteja satisfeito com nossa 
          resposta, você pode apresentar reclamação à Autoridade Nacional de Proteção 
          de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.gov.br/anpd</a>
        </p>

        <p className="mt-4">
          <strong>Atualizações:</strong> Esta Política pode ser atualizada periodicamente. 
          Notificaremos sobre mudanças significativas através da Plataforma ou por e-mail.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default Privacy;
