/**
 * Schemas de Validação de Autenticação
 * 
 * @module auth-schemas
 * @description
 * Define todos os schemas Zod para validação de formulários de autenticação.
 * Inclui validação de:
 * - Email (formato RFC 5322)
 * - Senha (força, comprimento, caracteres especiais)
 * - Nome de exibição e organização
 * 
 * @example
 * ```typescript
 * import { loginSchema } from '@/lib/auth-schemas';
 * 
 * const result = loginSchema.safeParse({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!'
 * });
 * 
 * if (!result.success) {
 *   console.error(result.error.flatten());
 * }
 * ```
 */

import { z } from 'zod';

/**
 * Validação de email
 * 
 * @example Valores válidos:
 * - "usuario@exemplo.com.br"
 * - "nome.sobrenome@empresa.com"
 * - "teste+tag@dominio.org"
 * 
 * @example Valores inválidos:
 * - "usuario@" (domínio faltando)
 * - "@exemplo.com" (nome local faltando)
 * - "usuario@.com" (domínio inválido)
 * - "usuario exemplo@test.com" (espaço não permitido)
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email é obrigatório" })
  .email({ message: "Email inválido. Use o formato: usuario@dominio.com" })
  .max(255, { message: "Email deve ter no máximo 255 caracteres" })
  .toLowerCase();

/**
 * Validação de senha com requisitos de segurança
 * 
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 * 
 * @example Valores válidos:
 * - "SecurePass123!"
 * - "MyP@ssw0rd"
 * - "C0mpl3x!Pass"
 * 
 * @example Valores inválidos:
 * - "senha123" (sem maiúscula e caractere especial)
 * - "SENHA123!" (sem minúscula)
 * - "SenhaForte!" (sem número)
 * - "Curta1!" (menos de 8 caracteres)
 */
export const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  .max(100, { message: "Senha deve ter no máximo 100 caracteres" })
  .regex(/[a-z]/, { message: "Senha deve conter pelo menos uma letra minúscula" })
  .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
  .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" })
  .regex(/[^a-zA-Z0-9]/, { message: "Senha deve conter pelo menos um caractere especial (!@#$%^&*)" });

/**
 * Validação de nome de exibição
 * 
 * @example Valores válidos:
 * - "João Silva"
 * - "Maria O'Connor"
 * - "José da Silva"
 * 
 * @example Valores inválidos:
 * - "" (vazio)
 * - "Ab" (muito curto)
 * - "Nome123" (contém números)
 */
export const displayNameSchema = z
  .string()
  .trim()
  .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
  .max(100, { message: "Nome deve ter no máximo 100 caracteres" })
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { 
    message: "Nome deve conter apenas letras, espaços, hífens e apóstrofos" 
  });

/**
 * Validação de organização
 * 
 * @example Valores válidos:
 * - "Empresa XYZ Ltda"
 * - "Tech Solutions Inc."
 * - "Consultoria & Assessoria"
 * 
 * @example Valores inválidos:
 * - "" (vazio)
 * - "AB" (muito curto)
 */
export const organizationSchema = z
  .string()
  .trim()
  .min(3, { message: "Nome da organização deve ter no mínimo 3 caracteres" })
  .max(200, { message: "Nome da organização deve ter no máximo 200 caracteres" });

/**
 * Schema para login
 * 
 * @typedef {Object} LoginInput
 * @property {string} email - Email do usuário
 * @property {string} password - Senha do usuário
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "email": "usuario@exemplo.com",
 *   "password": "SecurePass123!"
 * }
 * ```
 * 
 * @example JSON inválido com erros:
 * ```json
 * {
 *   "email": "usuario@",
 *   "password": "123"
 * }
 * ```
 * Erros retornados:
 * - email: "Email inválido. Use o formato: usuario@dominio.com"
 * - password: "Senha deve ter no mínimo 8 caracteres"
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Senha é obrigatória" })
});

/**
 * Schema para cadastro
 * 
 * @typedef {Object} SignUpInput
 * @property {string} email - Email do novo usuário
 * @property {string} password - Senha com requisitos de segurança
 * @property {string} confirmPassword - Confirmação da senha (deve ser igual)
 * @property {string} displayName - Nome de exibição do usuário
 * @property {string} organization - Nome da organização
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "email": "novousuario@empresa.com",
 *   "password": "MySecure123!",
 *   "confirmPassword": "MySecure123!",
 *   "displayName": "João Silva",
 *   "organization": "Empresa ABC Ltda"
 * }
 * ```
 * 
 * @example JSON inválido com erros:
 * ```json
 * {
 *   "email": "novousuario@empresa.com",
 *   "password": "MySecure123!",
 *   "confirmPassword": "Different123!",
 *   "displayName": "Jo",
 *   "organization": "AB"
 * }
 * ```
 * Erros retornados:
 * - confirmPassword: "As senhas não coincidem"
 * - displayName: "Nome deve ter no mínimo 3 caracteres"
 * - organization: "Nome da organização deve ter no mínimo 3 caracteres"
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: displayNameSchema,
  organization: organizationSchema
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "As senhas não coincidem",
    path: ["confirmPassword"]
  }
);

/**
 * Schema para recuperação de senha
 * 
 * @typedef {Object} ForgotPasswordInput
 * @property {string} email - Email cadastrado
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "email": "usuario@exemplo.com"
 * }
 * ```
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema
});

/**
 * Schema para redefinição de senha
 * 
 * @typedef {Object} ResetPasswordInput
 * @property {string} password - Nova senha
 * @property {string} confirmPassword - Confirmação da nova senha
 * 
 * @example JSON válido:
 * ```json
 * {
 *   "password": "NewSecure123!",
 *   "confirmPassword": "NewSecure123!"
 * }
 * ```
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "As senhas não coincidem",
    path: ["confirmPassword"]
  }
);

/**
 * Tipos TypeScript inferidos dos schemas
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Função auxiliar para formatar erros de validação Zod
 * 
 * @param {z.ZodError} error - Erro do Zod
 * @returns {Record<string, string>} Objeto com campo como chave e mensagem como valor
 * 
 * @example
 * ```typescript
 * const result = loginSchema.safeParse({ email: '', password: '' });
 * if (!result.success) {
 *   const errors = formatZodErrors(result.error);
 *   // { email: "Email é obrigatório", password: "Senha é obrigatória" }
 * }
 * ```
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      formatted[err.path[0].toString()] = err.message;
    }
  });
  return formatted;
}
