/**
 * Evidence Control Mapping Library
 * Define regras de vinculação automática entre dados de integrações e controles de compliance
 */

export interface EvidenceControlRule {
  id: string;
  integrationId: string;
  resourceType: string;
  controlCodes: string[]; // Códigos de controles vinculados (ex: 'A.8.5', 'CC6.1', 'LGPD-46')
  complianceCheck: (resource: Record<string, any>) => boolean;
  evidenceLabel: string; // Ex: "MFA Ativo", "Criptografia Habilitada"
  description: string;
  resourceNameField: string; // Campo que identifica o nome do recurso (ex: 'email', 'name')
}

/**
 * Mapeamento de regras de evidência automática
 * Conecta recursos coletados das integrações aos controles de frameworks
 */
export const EVIDENCE_CONTROL_MAP: EvidenceControlRule[] = [
  // ==========================================
  // MFA / Autenticação Multifator
  // ISO 27001: A.8.5, SOC 2: CC6.1, LGPD: Art. 46
  // ==========================================
  {
    id: 'google-mfa',
    integrationId: 'google-workspace',
    resourceType: 'user',
    controlCodes: ['A.8.5', 'CC6.1', 'LGPD-46'],
    complianceCheck: (resource) => resource.isEnrolledIn2Sv === true,
    evidenceLabel: 'MFA Ativo (Google)',
    description: 'Verificação de autenticação em dois fatores no Google Workspace',
    resourceNameField: 'primaryEmail',
  },
  {
    id: 'slack-mfa',
    integrationId: 'slack',
    resourceType: 'user',
    controlCodes: ['A.8.5', 'CC6.1', 'LGPD-46'],
    complianceCheck: (resource) => resource.has_2fa === true,
    evidenceLabel: 'MFA Ativo (Slack)',
    description: 'Verificação de autenticação em dois fatores no Slack',
    resourceNameField: 'real_name',
  },
  {
    id: 'okta-mfa',
    integrationId: 'okta',
    resourceType: 'user',
    controlCodes: ['A.8.5', 'CC6.1', 'LGPD-46'],
    complianceCheck: (resource) => {
      // Okta: verifica se MFA está habilitado ou se tem fatores registrados
      const credentials = resource.credentials || {};
      const hasMfa = credentials.provider?.type === 'OKTA' && 
                     (resource.enrolledFactors?.length > 0 || credentials.recovery_question);
      return hasMfa;
    },
    evidenceLabel: 'MFA Ativo (Okta)',
    description: 'Verificação de autenticação multifator no Okta',
    resourceNameField: 'profile.email',
  },
  {
    id: 'auth0-mfa',
    integrationId: 'auth0',
    resourceType: 'user',
    controlCodes: ['A.8.5', 'CC6.1', 'LGPD-46'],
    complianceCheck: (resource) => {
      // Auth0: verifica se Guardian MFA está habilitado
      const mfaEnabled = resource.multifactor?.length > 0 || 
                         resource.user_metadata?.use_mfa === true;
      return mfaEnabled;
    },
    evidenceLabel: 'MFA Ativo (Auth0)',
    description: 'Verificação de autenticação multifator no Auth0',
    resourceNameField: 'email',
  },
  {
    id: 'azure-mfa',
    integrationId: 'azure-ad',
    resourceType: 'user',
    controlCodes: ['A.8.5', 'CC6.1', 'LGPD-46'],
    complianceCheck: (resource) => {
      // Azure AD: verifica status de MFA
      return resource.mfaEnabled === true || 
             resource.strongAuthenticationMethods?.length > 0;
    },
    evidenceLabel: 'MFA Ativo (Azure AD)',
    description: 'Verificação de autenticação multifator no Microsoft Entra ID',
    resourceNameField: 'userPrincipalName',
  },
  {
    id: 'azure-account-enabled',
    integrationId: 'azure-ad',
    resourceType: 'user',
    controlCodes: ['A.5.15', 'CC6.1'],
    complianceCheck: (resource) => {
      return resource.accountEnabled === true;
    },
    evidenceLabel: 'Conta Ativa',
    description: 'Conta de usuário habilitada no Microsoft Entra ID',
    resourceNameField: 'userPrincipalName',
  },
  {
    id: 'azure-conditional-access',
    integrationId: 'azure-ad',
    resourceType: 'conditional_access_policy',
    controlCodes: ['A.5.1', 'CC6.1', 'CC6.2'],
    complianceCheck: (resource) => {
      return resource.state === 'enabled' || resource.state === 'enabledForReportingButNotEnforced';
    },
    evidenceLabel: 'Política CA Ativa',
    description: 'Política de Acesso Condicional habilitada no Azure AD',
    resourceNameField: 'displayName',
  },
  {
    id: 'azure-guest-user',
    integrationId: 'azure-ad',
    resourceType: 'user',
    controlCodes: ['A.5.15', 'CC6.3'],
    complianceCheck: (resource) => {
      // Guests should be tracked - returns true if NOT a guest (compliant)
      return resource.userType !== 'Guest';
    },
    evidenceLabel: 'Usuário Interno',
    description: 'Usuário membro (não guest) no Microsoft Entra ID',
    resourceNameField: 'userPrincipalName',
  },
  {
    id: 'github-mfa',
    integrationId: 'github',
    resourceType: 'user',
    controlCodes: ['A.8.5', 'CC6.1', 'LGPD-46'],
    complianceCheck: (resource) => resource.two_factor_authentication === true,
    evidenceLabel: 'MFA Ativo (GitHub)',
    description: 'Verificação de autenticação em dois fatores no GitHub',
    resourceNameField: 'login',
  },

  // ==========================================
  // Segurança de Admin com MFA
  // ISO 27001: A.5.1, SOC 2: CC6.2
  // ==========================================
  {
    id: 'google-admin-mfa',
    integrationId: 'google-workspace',
    resourceType: 'user',
    controlCodes: ['A.5.1', 'CC6.2'],
    complianceCheck: (resource) => {
      const isAdmin = resource.isAdmin === true || resource.isDelegatedAdmin === true;
      const hasMfa = resource.isEnrolledIn2Sv === true;
      return !isAdmin || (isAdmin && hasMfa); // Passa se não é admin OU se é admin com MFA
    },
    evidenceLabel: 'Admin com MFA',
    description: 'Administradores devem ter MFA habilitado',
    resourceNameField: 'primaryEmail',
  },

  // ==========================================
  // Proteção de Código / Repositórios Privados
  // ISO 27001: A.8.24, SOC 2: CC6.1
  // ==========================================
  {
    id: 'github-private-repo',
    integrationId: 'github',
    resourceType: 'repository',
    controlCodes: ['A.8.24', 'CC6.1'],
    complianceCheck: (resource) => resource.private === true || resource.visibility === 'private',
    evidenceLabel: 'Repositório Privado',
    description: 'Repositórios devem ser privados para proteger código-fonte',
    resourceNameField: 'full_name',
  },
  {
    id: 'gitlab-private-repo',
    integrationId: 'gitlab',
    resourceType: 'project',
    controlCodes: ['A.8.24', 'CC6.1'],
    complianceCheck: (resource) => resource.visibility === 'private',
    evidenceLabel: 'Projeto Privado',
    description: 'Projetos GitLab devem ser privados',
    resourceNameField: 'path_with_namespace',
  },

  // ==========================================
  // Criptografia em Trânsito
  // ISO 27001: A.8.24, LGPD: Art. 46
  // ==========================================
  {
    id: 'cloudflare-https',
    integrationId: 'cloudflare',
    resourceType: 'zone',
    controlCodes: ['A.8.24', 'LGPD-46'],
    complianceCheck: (resource) => {
      const settings = resource.settings || {};
      return settings.always_use_https === 'on' || 
             settings.ssl === 'full' || 
             settings.ssl === 'strict';
    },
    evidenceLabel: 'HTTPS Forçado',
    description: 'Zona com HTTPS obrigatório habilitado',
    resourceNameField: 'name',
  },

  // ==========================================
  // Criptografia em Repouso
  // ISO 27001: A.8.24, SOC 2: CC6.1, LGPD: Art. 46
  // ==========================================
  {
    id: 'aws-s3-encryption',
    integrationId: 'aws',
    resourceType: 'bucket',
    controlCodes: ['A.8.24', 'CC6.1', 'LGPD-46'],
    complianceCheck: (resource) => {
      return resource.encryption === true || 
             resource.ServerSideEncryptionConfiguration != null;
    },
    evidenceLabel: 'Bucket Criptografado',
    description: 'Bucket S3 com criptografia server-side habilitada',
    resourceNameField: 'Name',
  },

  // ==========================================
  // Controle de Acesso Público
  // ISO 27001: A.8.3, SOC 2: CC6.1
  // ==========================================
  {
    id: 'aws-s3-public',
    integrationId: 'aws',
    resourceType: 'bucket',
    controlCodes: ['A.8.3', 'CC6.1'],
    complianceCheck: (resource) => {
      // Passa se o bucket NÃO é público
      return resource.public !== true && 
             resource.PublicAccessBlockConfiguration?.BlockPublicAcls === true;
    },
    evidenceLabel: 'Acesso Público Bloqueado',
    description: 'Bucket S3 não exposto publicamente',
    resourceNameField: 'Name',
  },

  // ==========================================
  // Segurança de Endpoint / Compliance de Dispositivos
  // ISO 27001: A.8.1, SOC 2: CC6.6
  // ==========================================
  {
    id: 'intune-compliance',
    integrationId: 'intune',
    resourceType: 'device',
    controlCodes: ['A.8.1', 'CC6.6'],
    complianceCheck: (resource) => {
      return resource.complianceState === 'compliant' || 
             resource.isCompliant === true;
    },
    evidenceLabel: 'Dispositivo Conforme',
    description: 'Dispositivo gerenciado em conformidade com políticas',
    resourceNameField: 'deviceName',
  },
  {
    id: 'crowdstrike-sensor',
    integrationId: 'crowdstrike',
    resourceType: 'device',
    controlCodes: ['A.8.1', 'CC6.6'],
    complianceCheck: (resource) => {
      return resource.status === 'contained' || 
             resource.status === 'normal' ||
             resource.sensor_version != null;
    },
    evidenceLabel: 'EDR Ativo',
    description: 'Dispositivo com sensor CrowdStrike ativo',
    resourceNameField: 'hostname',
  },

  // ==========================================
  // Gestão de Identidades / Usuários Ativos
  // ISO 27001: A.5.15, SOC 2: CC6.1
  // ==========================================
  {
    id: 'bamboohr-active-employee',
    integrationId: 'bamboohr',
    resourceType: 'employee',
    controlCodes: ['A.5.15', 'CC6.1'],
    complianceCheck: (resource) => {
      return resource.status === 'Active' || 
             resource.employmentHistoryStatus === 'Active';
    },
    evidenceLabel: 'Funcionário Ativo',
    description: 'Colaborador com status ativo no RH',
    resourceNameField: 'displayName',
  },

  // ==========================================
  // Datadog Monitors → A.12.4 (Logging and monitoring)
  // ==========================================
  {
    id: 'datadog-monitor-active',
    integrationId: 'datadog',
    resourceType: 'monitor',
    controlCodes: ['A.12.4.1', 'CC7.2'],
    complianceCheck: (resource) => {
      return resource.overall_state !== 'No Data' && 
             resource.options?.notify_no_data === true;
    },
    evidenceLabel: 'Monitor Ativo',
    description: 'Monitor configurado e gerando alertas',
    resourceNameField: 'name',
  },
  {
    id: 'datadog-security-monitor',
    integrationId: 'datadog',
    resourceType: 'monitor',
    controlCodes: ['A.12.4.1', 'A.16.1.2', 'CC7.2'],
    complianceCheck: (resource) => {
      return resource.is_security_monitor === true || resource.has_critical_tag === true;
    },
    evidenceLabel: 'Monitor de Segurança',
    description: 'Monitor configurado para eventos de segurança',
    resourceNameField: 'name',
  },

  // ==========================================
  // Datadog Security Signals → A.16.1 (Incident management)
  // ==========================================
  {
    id: 'datadog-security-signal-reviewed',
    integrationId: 'datadog',
    resourceType: 'security_signal',
    controlCodes: ['A.16.1.2', 'A.16.1.4', 'CC7.3'],
    complianceCheck: (resource) => {
      // Signals devem ser revisados (não 'open')
      return resource.status !== 'open' || resource.severity === 'info';
    },
    evidenceLabel: 'Incidente Revisado',
    description: 'Security Signal processado ou em revisão',
    resourceNameField: 'title',
  },

  // ==========================================
  // Datadog Log Pipelines → A.12.4.2 (Protection of log information)
  // ==========================================
  {
    id: 'datadog-log-pipeline-active',
    integrationId: 'datadog',
    resourceType: 'log_pipeline',
    controlCodes: ['A.12.4.2', 'A.12.4.3', 'CC7.2'],
    complianceCheck: (resource) => {
      return resource.is_enabled === true;
    },
    evidenceLabel: 'Pipeline de Logs Ativo',
    description: 'Pipeline de processamento de logs habilitado',
    resourceNameField: 'name',
  },
  {
    id: 'datadog-pii-protection',
    integrationId: 'datadog',
    resourceType: 'log_pipeline',
    controlCodes: ['A.12.4.2', 'LGPD-46'],
    complianceCheck: (resource) => {
      return resource.has_sensitive_data_processor === true;
    },
    evidenceLabel: 'Proteção de PII',
    description: 'Pipeline com mascaramento de dados sensíveis',
    resourceNameField: 'name',
  },

  // ==========================================
  // Datadog Synthetics → A.12.1.1 (Documented operating procedures)
  // ==========================================
  {
    id: 'datadog-synthetic-passing',
    integrationId: 'datadog',
    resourceType: 'synthetic',
    controlCodes: ['A.12.1.1', 'CC7.1'],
    complianceCheck: (resource) => {
      return resource.is_live === true && resource.is_passing === true;
    },
    evidenceLabel: 'Teste Sintético Ativo',
    description: 'Teste sintético ativo e passando',
    resourceNameField: 'name',
  },
];

/**
 * Obtém todas as regras aplicáveis a um código de controle específico
 */
export function getRulesForControl(controlCode: string): EvidenceControlRule[] {
  return EVIDENCE_CONTROL_MAP.filter(rule => 
    rule.controlCodes.some(code => 
      controlCode.toLowerCase().includes(code.toLowerCase()) ||
      code.toLowerCase().includes(controlCode.toLowerCase())
    )
  );
}

/**
 * Obtém todas as regras de uma integração específica
 */
export function getRulesForIntegration(integrationId: string): EvidenceControlRule[] {
  return EVIDENCE_CONTROL_MAP.filter(rule => rule.integrationId === integrationId);
}

/**
 * Obtém o nome do recurso a partir dos dados usando o campo configurado
 */
export function getResourceName(rule: EvidenceControlRule, resourceData: Record<string, any>): string {
  const fieldPath = rule.resourceNameField.split('.');
  let value: any = resourceData;
  
  for (const field of fieldPath) {
    if (value && typeof value === 'object') {
      value = value[field];
    } else {
      break;
    }
  }
  
  return value || resourceData.name || resourceData.id || 'Recurso desconhecido';
}

/**
 * Lista de códigos de controle suportados por framework
 */
export const FRAMEWORK_CONTROL_CODES = {
  'ISO 27001': ['A.5.1', 'A.5.15', 'A.8.1', 'A.8.3', 'A.8.5', 'A.8.24', 'A.12.1.1', 'A.12.4.1', 'A.12.4.2', 'A.12.4.3', 'A.16.1.2', 'A.16.1.4'],
  'SOC 2': ['CC6.1', 'CC6.2', 'CC6.6', 'CC7.1', 'CC7.2', 'CC7.3'],
  'LGPD': ['LGPD-46'],
};
