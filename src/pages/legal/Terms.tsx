import LegalPageLayout from '@/components/legal/LegalPageLayout';
import LegalSection from '@/components/legal/LegalSection';

const sections = [
  { id: 'definicoes', title: 'Definições' },
  { id: 'uso-permitido', title: 'Uso Permitido' },
  { id: 'responsabilidades-usuario', title: 'Responsabilidades do Usuário' },
  { id: 'responsabilidades-apoc', title: 'Responsabilidades da Compliance Sync' },
  { id: 'limitacao-responsabilidade', title: 'Limitação de Responsabilidade' },
  { id: 'rescisao', title: 'Rescisão' },
  { id: 'lei-aplicavel', title: 'Lei Aplicável' },
];

const otherDocs = [
  { href: '/legal/terms', label: 'Termos de Serviço', icon: 'terms' as const },
  { href: '/legal/privacy', label: 'Política de Privacidade', icon: 'privacy' as const },
  { href: '/legal/dpa', label: 'Acordo de Processamento', icon: 'dpa' as const },
];

const Terms = () => {
  return (
    <LegalPageLayout
      title="Termos de Serviço"
      subtitle="Condições gerais de uso da plataforma Compliance Sync"
      lastUpdated="23 de Janeiro de 2026"
      sections={sections}
      otherDocs={otherDocs}
    >
      <LegalSection id="definicoes" title="1. Definições">
        <p>
          Nestes Termos de Serviço, os seguintes termos têm os significados abaixo 
          atribuídos:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>"Compliance Sync"</strong> ou <strong>"Nós"</strong>: refere-se à Compliance Sync Systems Ltda., 
            empresa brasileira responsável pela operação da Plataforma, inscrita no CNPJ sob 
            o nº [CNPJ], com sede em [Endereço].
          </li>
          <li>
            <strong>"Plataforma"</strong>: o sistema de gestão de compliance Compliance Sync (Automated 
            Platform for Online Compliance), disponível através do domínio compliancesync.systems e 
            seus subdomínios.
          </li>
          <li>
            <strong>"Usuário"</strong> ou <strong>"Você"</strong>: qualquer pessoa física ou 
            jurídica que utilize a Plataforma, seja como administrador, operador ou visualizador.
          </li>
          <li>
            <strong>"Conta"</strong>: o perfil individual criado para acesso à Plataforma, 
            protegido por credenciais de autenticação.
          </li>
          <li>
            <strong>"Dados"</strong>: todas as informações inseridas, processadas ou geradas 
            na Plataforma pelo Usuário ou em seu nome.
          </li>
          <li>
            <strong>"Serviços"</strong>: as funcionalidades disponibilizadas pela Plataforma, 
            incluindo gestão de controles, auditorias, políticas, riscos e integrações.
          </li>
          <li>
            <strong>"Organização"</strong>: a entidade jurídica que contrata os Serviços e 
            sob a qual os Usuários são gerenciados.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="uso-permitido" title="2. Uso Permitido">
        <p>
          A Plataforma destina-se exclusivamente ao uso profissional para gestão de 
          compliance, segurança da informação e governança corporativa. Ao utilizar 
          nossos Serviços, você concorda em:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Utilizar a Plataforma apenas para finalidades lícitas e de acordo com estes Termos.</li>
          <li>Manter a confidencialidade de suas credenciais de acesso.</li>
          <li>Não compartilhar sua Conta com terceiros não autorizados.</li>
          <li>Fornecer informações verdadeiras, precisas e atualizadas.</li>
          <li>Respeitar os direitos de propriedade intelectual da Compliance Sync e de terceiros.</li>
        </ul>

        <p className="mt-4"><strong>É expressamente proibido:</strong></p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Utilizar a Plataforma para atividades ilegais ou fraudulentas.</li>
          <li>Tentar acessar sistemas ou dados não autorizados.</li>
          <li>Realizar engenharia reversa, descompilar ou modificar o software.</li>
          <li>Transmitir malware, vírus ou códigos maliciosos.</li>
          <li>Sobrecarregar intencionalmente os servidores ou infraestrutura.</li>
          <li>Revender ou sublicenciar os Serviços sem autorização expressa.</li>
          <li>Coletar dados de outros usuários sem consentimento.</li>
        </ul>
      </LegalSection>

      <LegalSection id="responsabilidades-usuario" title="3. Responsabilidades do Usuário">
        <p>Como Usuário da Plataforma, você é responsável por:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Segurança da Conta:</strong> Manter suas credenciais seguras e notificar 
            imediatamente a Compliance Sync sobre qualquer uso não autorizado ou suspeita de violação.
          </li>
          <li>
            <strong>Precisão dos Dados:</strong> Garantir que os dados inseridos na Plataforma 
            sejam precisos, completos e atualizados.
          </li>
          <li>
            <strong>Conformidade Legal:</strong> Assegurar que o uso da Plataforma esteja em 
            conformidade com as leis e regulamentos aplicáveis ao seu negócio.
          </li>
          <li>
            <strong>Gestão de Acessos:</strong> Controlar adequadamente os níveis de permissão 
            dos usuários sob sua Organização.
          </li>
          <li>
            <strong>Backup de Dados:</strong> Manter cópias de segurança dos dados críticos 
            inseridos na Plataforma.
          </li>
          <li>
            <strong>Uso Adequado:</strong> Utilizar os recursos da Plataforma de forma razoável 
            e dentro dos limites do plano contratado.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="responsabilidades-apoc" title="4. Responsabilidades da Compliance Sync">
        <p>A Compliance Sync compromete-se a:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Disponibilidade:</strong> Manter a Plataforma disponível 99,5% do tempo, 
            exceto durante manutenções programadas ou eventos de força maior.
          </li>
          <li>
            <strong>Segurança:</strong> Implementar e manter controles de segurança adequados 
            para proteger os dados dos Usuários contra acessos não autorizados.
          </li>
          <li>
            <strong>Atualizações:</strong> Fornecer atualizações e melhorias contínuas na 
            Plataforma sem custo adicional durante a vigência do contrato.
          </li>
          <li>
            <strong>Suporte:</strong> Disponibilizar canais de suporte técnico conforme o 
            plano contratado.
          </li>
          <li>
            <strong>Transparência:</strong> Comunicar previamente sobre mudanças significativas 
            nos Serviços ou nestes Termos.
          </li>
          <li>
            <strong>Privacidade:</strong> Tratar os dados pessoais em conformidade com a LGPD 
            e nossa Política de Privacidade.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="limitacao-responsabilidade" title="5. Limitação de Responsabilidade">
        <p>
          <strong>Isenção de Garantias:</strong> A Plataforma é fornecida "como está" e 
          "conforme disponível". A Compliance Sync não garante que os Serviços serão ininterruptos, 
          livres de erros ou completamente seguros.
        </p>

        <p className="mt-4">
          <strong>Limitação de Danos:</strong> Em nenhuma circunstância a Compliance Sync será 
          responsável por:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Danos indiretos, incidentais, especiais ou consequenciais.</li>
          <li>Perda de lucros, dados, negócios ou oportunidades.</li>
          <li>Custos de obtenção de produtos ou serviços substitutos.</li>
          <li>Danos decorrentes de uso indevido ou não autorizado da Conta.</li>
          <li>Falhas causadas por terceiros, incluindo provedores de infraestrutura.</li>
        </ul>

        <p className="mt-4">
          <strong>Limite Máximo:</strong> A responsabilidade total da Compliance Sync, por qualquer 
          causa, será limitada ao valor pago pelo Usuário nos últimos 12 (doze) meses 
          anteriores ao evento que deu origem à reclamação.
        </p>

        <p className="mt-4">
          <strong>Exceções:</strong> As limitações acima não se aplicam em casos de dolo, 
          fraude ou violação de direitos fundamentais, conforme a legislação aplicável.
        </p>
      </LegalSection>

      <LegalSection id="rescisao" title="6. Rescisão">
        <p>
          <strong>Pelo Usuário:</strong> Você pode encerrar sua Conta a qualquer momento 
          através das configurações da Plataforma ou mediante solicitação ao suporte. 
          Após a rescisão:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>O acesso à Plataforma será imediatamente revogado.</li>
          <li>Os dados serão retidos por 30 (trinta) dias para eventual recuperação.</li>
          <li>Após o período de retenção, os dados serão permanentemente excluídos.</li>
          <li>Valores já pagos não serão reembolsados, salvo disposição contratual em contrário.</li>
        </ul>

        <p className="mt-4">
          <strong>Pela Compliance Sync:</strong> Podemos suspender ou encerrar sua Conta, com ou sem 
          aviso prévio, nas seguintes situações:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Violação destes Termos ou das políticas da Plataforma.</li>
          <li>Atividade suspeita de fraude ou uso ilegal.</li>
          <li>Inadimplência por período superior a 30 (trinta) dias.</li>
          <li>Solicitação de autoridade competente.</li>
          <li>Descontinuação dos Serviços (com aviso mínimo de 90 dias).</li>
        </ul>

        <p className="mt-4">
          <strong>Efeitos da Rescisão:</strong> A rescisão não afeta as obrigações de 
          confidencialidade e proteção de dados, que permanecerão vigentes.
        </p>
      </LegalSection>

      <LegalSection id="lei-aplicavel" title="7. Lei Aplicável e Foro">
        <p>
          Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil.
        </p>

        <p className="mt-4">
          <strong>Resolução de Disputas:</strong> As partes envidarão esforços para resolver 
          amigavelmente quaisquer controvérsias decorrentes destes Termos. Caso não seja 
          possível uma solução consensual:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Mediação:</strong> As partes poderão submeter a disputa à mediação, 
            conforme a Lei nº 13.140/2015.
          </li>
          <li>
            <strong>Foro:</strong> Fica eleito o foro da Comarca de São Paulo, Estado de 
            São Paulo, como competente para dirimir quaisquer litígios, com exclusão de 
            qualquer outro, por mais privilegiado que seja.
          </li>
        </ul>

        <p className="mt-4">
          <strong>Legislação Aplicável:</strong> Estes Termos estão em conformidade com:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018</li>
          <li>Marco Civil da Internet - Lei nº 12.965/2014</li>
          <li>Código de Defesa do Consumidor - Lei nº 8.078/1990 (quando aplicável)</li>
          <li>Código Civil Brasileiro - Lei nº 10.406/2002</li>
        </ul>

        <p className="mt-4">
          <strong>Contato:</strong> Para dúvidas sobre estes Termos, entre em contato pelo 
          e-mail <a href="mailto:legal@compliancesync.systems" className="text-primary hover:underline">legal@compliancesync.systems</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};

export default Terms;
