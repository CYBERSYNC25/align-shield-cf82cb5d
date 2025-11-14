/**
 * Schemas de Validação de Formulários
 * 
 * @module form-schemas
 * @description
 * Define schemas Zod centralizados para validação de formulários em toda a aplicação.
 * Inclui validação para políticas, controles, auditorias, riscos, incidentes e treinamentos.
 * 
 * @example
 * ```typescript
 * import { policySchema } from '@/lib/form-schemas';
 * 
 * const result = policySchema.safeParse(formData);
 * if (!result.success) {
 *   console.error(result.error.flatten());
 * }
 * ```
 */

import { z } from 'zod';

/**
 * Validação de nome/título genérico
 * 
 * @example Valores válidos:
 * - "Política de Segurança da Informação"
 * - "Controle AC-001"
 * 
 * @example Valores inválidos:
 * - "" (vazio)
 * - "AB" (muito curto)
 */
export const nameSchema = z
  .string()
  .trim()
  .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
  .max(200, { message: "Nome deve ter no máximo 200 caracteres" });

/**
 * Validação de descrição
 * 
 * @example Valores válidos:
 * - "Esta política define as diretrizes..."
 * - "Controle para monitoramento de acessos administrativos"
 */
export const descriptionSchema = z
  .string()
  .trim()
  .min(10, { message: "Descrição deve ter no mínimo 10 caracteres" })
  .max(2000, { message: "Descrição deve ter no máximo 2000 caracteres" })
  .optional()
  .or(z.literal(''));

/**
 * Validação de código alfanumérico
 * 
 * @example Valores válidos:
 * - "AC-001"
 * - "POL-SEC-2024"
 * - "CTRL_001"
 * 
 * @example Valores inválidos:
 * - "ac 001" (contém espaço)
 * - "AC#001" (caractere especial inválido)
 */
export const codeSchema = z
  .string()
  .trim()
  .min(2, { message: "Código deve ter no mínimo 2 caracteres" })
  .max(50, { message: "Código deve ter no máximo 50 caracteres" })
  .regex(/^[A-Za-z0-9_-]+$/, { 
    message: "Código deve conter apenas letras, números, hífens e underscores" 
  });

/**
 * Validação de versão
 * 
 * @example Valores válidos:
 * - "1.0"
 * - "2.3.1"
 * - "v1.0.0"
 * 
 * @example Valores inválidos:
 * - "" (vazio)
 * - "versão 1" (formato incorreto)
 */
export const versionSchema = z
  .string()
  .trim()
  .min(1, { message: "Versão é obrigatória" })
  .max(20, { message: "Versão deve ter no máximo 20 caracteres" })
  .regex(/^[vV]?\d+(\.\d+)*$/, { 
    message: "Versão deve seguir o formato: 1.0, 2.3.1 ou v1.0.0" 
  });

/**
 * Validação de data futura
 * 
 * @example Valores válidos:
 * - new Date('2025-12-31')
 * - new Date(Date.now() + 86400000) // amanhã
 * 
 * @example Valores inválidos:
 * - new Date('2020-01-01') (data passada)
 */
export const futureDateSchema = z
  .date({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data inválida"
  })
  .refine((date) => date > new Date(), {
    message: "Data deve ser futura"
  });

/**
 * Validação de data (qualquer)
 */
export const dateSchema = z
  .date({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data inválida"
  });

/**
 * Validação de URL de arquivo
 * 
 * @example Valores válidos:
 * - "https://example.com/document.pdf"
 * - "https://storage.googleapis.com/bucket/file.docx"
 * 
 * @example Valores inválidos:
 * - "not-a-url"
 * - "ftp://example.com/file" (protocolo não suportado)
 */
export const fileUrlSchema = z
  .string()
  .url({ message: "URL de arquivo inválida. Use o formato: https://exemplo.com/arquivo.pdf" })
  .regex(/^https?:\/\//, { message: "URL deve começar com http:// ou https://" })
  .optional()
  .or(z.literal(''));

/**
 * Validação de categoria
 * 
 * @example Valores válidos:
 * - "Segurança"
 * - "Privacidade"
 * - "Operacional"
 */
export const categorySchema = z
  .string()
  .min(1, { message: "Categoria é obrigatória" });

/**
 * Validação de status
 * 
 * @example Valores válidos:
 * - "Ativo"
 * - "Rascunho"
 * - "Arquivado"
 */
export const statusSchema = z
  .string()
  .min(1, { message: "Status é obrigatório" });

/**
 * Validação de nome de pessoa/responsável
 * 
 * @example Valores válidos:
 * - "João Silva"
 * - "Maria O'Connor"
 * 
 * @example Valores inválidos:
 * - "João123" (contém números)
 * - "" (vazio)
 */
export const personNameSchema = z
  .string()
  .trim()
  .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
  .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { 
    message: "Nome deve conter apenas letras, espaços, hífens e apóstrofos" 
  })
  .optional()
  .or(z.literal(''));

/**
 * Schema para criação/edição de políticas
 * 
 * @typedef {Object} PolicyInput
 * @property {string} name - Nome da política
 * @property {string} description - Descrição detalhada
 * @property {string} category - Categoria (Segurança, Privacidade, etc.)
 * @property {string} version - Versão da política (ex: 1.0)
 * @property {string} status - Status (Ativo, Rascunho, Arquivado)
 * @property {string} owner - Responsável pela política
 * @property {string} approver - Aprovador da política
 * @property {Date} effectiveDate - Data de vigência
 * @property {Date} reviewDate - Data de revisão
 * @property {string} fileUrl - URL do documento
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "name": "Política de Segurança da Informação",
 *   "description": "Esta política define as diretrizes de segurança...",
 *   "category": "Segurança",
 *   "version": "1.0",
 *   "status": "Ativo",
 *   "owner": "João Silva",
 *   "approver": "Maria Santos",
 *   "effectiveDate": "2024-01-01T00:00:00.000Z",
 *   "reviewDate": "2024-12-31T00:00:00.000Z",
 *   "fileUrl": "https://example.com/policy.pdf"
 * }
 * ```
 */
export const policySchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  category: categorySchema,
  version: versionSchema,
  status: statusSchema,
  owner: personNameSchema,
  approver: personNameSchema,
  effectiveDate: dateSchema.optional(),
  reviewDate: dateSchema.optional(),
  fileUrl: fileUrlSchema
}).refine(
  (data) => {
    // Se ambas as datas estão presentes, reviewDate deve ser após effectiveDate
    if (data.effectiveDate && data.reviewDate) {
      return data.reviewDate > data.effectiveDate;
    }
    return true;
  },
  {
    message: "Data de revisão deve ser posterior à data de vigência",
    path: ["reviewDate"]
  }
);

/**
 * Schema para criação/edição de controles
 * 
 * @typedef {Object} ControlInput
 * @property {string} code - Código do controle (ex: AC-001)
 * @property {string} title - Título do controle
 * @property {string} description - Descrição detalhada
 * @property {string} category - Categoria do controle
 * @property {string} status - Status (Implementado, Pendente, etc.)
 * @property {string} owner - Responsável pelo controle
 * @property {Date} nextReview - Data da próxima revisão
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "code": "AC-001",
 *   "title": "Controle de Acesso Administrativo",
 *   "description": "Monitoramento de acessos privilegiados...",
 *   "category": "Acesso",
 *   "status": "Implementado",
 *   "owner": "Equipe de TI",
 *   "nextReview": "2024-12-31T00:00:00.000Z"
 * }
 * ```
 */
export const controlSchema = z.object({
  code: codeSchema,
  title: nameSchema,
  description: descriptionSchema,
  category: categorySchema,
  status: statusSchema,
  owner: personNameSchema,
  nextReview: dateSchema.optional()
});

/**
 * Schema para criação/edição de auditorias
 * 
 * @typedef {Object} AuditInput
 * @property {string} name - Nome da auditoria
 * @property {string} framework - Framework de compliance
 * @property {string} auditor - Nome do auditor
 * @property {Date} startDate - Data de início
 * @property {Date} endDate - Data de término
 * @property {string} status - Status da auditoria
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "name": "Auditoria ISO 27001 Q1 2024",
 *   "framework": "ISO 27001",
 *   "auditor": "Carlos Ferreira",
 *   "startDate": "2024-01-01T00:00:00.000Z",
 *   "endDate": "2024-03-31T00:00:00.000Z",
 *   "status": "Em Andamento"
 * }
 * ```
 */
export const auditSchema = z.object({
  name: nameSchema,
  framework: z.string().min(1, { message: "Framework é obrigatório" }),
  auditor: personNameSchema,
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  status: statusSchema
}).refine(
  (data) => {
    // Se ambas as datas estão presentes, endDate deve ser após startDate
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: "Data de término deve ser posterior à data de início",
    path: ["endDate"]
  }
);

/**
 * Schema para criação/edição de riscos
 * 
 * @typedef {Object} RiskInput
 * @property {string} title - Título do risco
 * @property {string} description - Descrição detalhada
 * @property {string} category - Categoria do risco
 * @property {string} probability - Probabilidade (Baixa, Média, Alta)
 * @property {string} impact - Impacto (Baixo, Médio, Alto)
 * @property {string} owner - Responsável pelo risco
 * @property {string} status - Status (Ativo, Mitigado, etc.)
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "title": "Vazamento de dados sensíveis",
 *   "description": "Risco de exposição de informações confidenciais...",
 *   "category": "Segurança",
 *   "probability": "Média",
 *   "impact": "Alto",
 *   "owner": "CISO",
 *   "status": "Ativo"
 * }
 * ```
 */
export const riskSchema = z.object({
  title: nameSchema,
  description: descriptionSchema,
  category: categorySchema,
  probability: z.enum(['Baixa', 'Média', 'Alta'], {
    errorMap: () => ({ message: "Probabilidade deve ser: Baixa, Média ou Alta" })
  }),
  impact: z.enum(['Baixo', 'Médio', 'Alto'], {
    errorMap: () => ({ message: "Impacto deve ser: Baixo, Médio ou Alto" })
  }),
  owner: personNameSchema,
  status: statusSchema
});

/**
 * Schema para reporte de incidentes
 * 
 * @typedef {Object} IncidentInput
 * @property {string} title - Título do incidente
 * @property {string} description - Descrição detalhada
 * @property {string} severity - Severidade (Baixa, Média, Alta, Crítica)
 * @property {string} impact - Impacto do incidente
 * @property {string[]} affectedSystems - Sistemas afetados
 * @property {string} assignee - Responsável pela resolução
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "title": "Falha no sistema de autenticação",
 *   "description": "Usuários não conseguem fazer login...",
 *   "severity": "Crítica",
 *   "impact": "Indisponibilidade total do sistema",
 *   "affectedSystems": ["Auth Server", "Portal Web"],
 *   "assignee": "Equipe de Infraestrutura"
 * }
 * ```
 */
export const incidentSchema = z.object({
  title: nameSchema,
  description: descriptionSchema,
  severity: z.enum(['Baixa', 'Média', 'Alta', 'Crítica'], {
    errorMap: () => ({ message: "Severidade deve ser: Baixa, Média, Alta ou Crítica" })
  }),
  impact: z.string().min(1, { message: "Impacto é obrigatório" }),
  affectedSystems: z.array(z.string()).min(1, { message: "Selecione pelo menos um sistema afetado" }),
  assignee: personNameSchema
});

/**
 * Schema para criação de treinamentos
 * 
 * @typedef {Object} TrainingInput
 * @property {string} title - Título do treinamento
 * @property {string} description - Descrição do conteúdo
 * @property {string} category - Categoria do treinamento
 * @property {number} duration - Duração em horas
 * @property {Date} dueDate - Data limite para conclusão
 * @property {number} modules - Número de módulos
 * @property {string[]} frameworks - Frameworks relacionados
 * @property {boolean} mandatory - Se o treinamento é obrigatório
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "title": "Segurança da Informação Básica",
 *   "description": "Treinamento introdutório sobre práticas de segurança...",
 *   "category": "Segurança",
 *   "duration": 4,
 *   "dueDate": "2024-12-31T00:00:00.000Z",
 *   "modules": 5,
 *   "frameworks": ["ISO 27001", "LGPD"],
 *   "mandatory": true
 * }
 * ```
 */
export const trainingSchema = z.object({
  title: nameSchema,
  description: descriptionSchema,
  category: categorySchema,
  duration: z.number().min(0.5, { message: "Duração deve ser no mínimo 0.5 horas" }).max(1000, { message: "Duração deve ser no máximo 1000 horas" }),
  dueDate: futureDateSchema.optional(),
  modules: z.number().int().min(1, { message: "Deve haver pelo menos 1 módulo" }).max(100, { message: "Máximo de 100 módulos" }),
  frameworks: z.array(z.string()).optional(),
  mandatory: z.boolean()
});

/**
 * Schema para alteração de senha
 * 
 * @typedef {Object} ChangePasswordInput
 * @property {string} currentPassword - Senha atual
 * @property {string} newPassword - Nova senha
 * @property {string} confirmPassword - Confirmação da nova senha
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewSecure456!",
 *   "confirmPassword": "NewSecure456!"
 * }
 * ```
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z
    .string()
    .min(8, { message: "Nova senha deve ter no mínimo 8 caracteres" })
    .max(100, { message: "Nova senha deve ter no máximo 100 caracteres" })
    .regex(/[a-z]/, { message: "Nova senha deve conter pelo menos uma letra minúscula" })
    .regex(/[A-Z]/, { message: "Nova senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "Nova senha deve conter pelo menos um número" })
    .regex(/[^a-zA-Z0-9]/, { message: "Nova senha deve conter pelo menos um caractere especial (!@#$%^&*)" }),
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "As senhas não coincidem",
    path: ["confirmPassword"]
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: "Nova senha deve ser diferente da senha atual",
    path: ["newPassword"]
  }
);

/**
 * Tipos TypeScript inferidos dos schemas
 */
export type PolicyInput = z.infer<typeof policySchema>;
export type ControlInput = z.infer<typeof controlSchema>;
export type AuditInput = z.infer<typeof auditSchema>;
export type RiskInput = z.infer<typeof riskSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
export type TrainingInput = z.infer<typeof trainingSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Função auxiliar para formatar erros de validação Zod
 * 
 * @param {z.ZodError} error - Erro do Zod
 * @returns {Record<string, string>} Objeto com campo como chave e mensagem como valor
 * 
 * @example
 * ```typescript
 * const result = policySchema.safeParse(formData);
 * if (!result.success) {
 *   const errors = formatValidationErrors(result.error);
 *   // { name: "Nome deve ter no mínimo 3 caracteres", ... }
 * }
 * ```
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      formatted[err.path[0].toString()] = err.message;
    }
  });
  return formatted;
}
