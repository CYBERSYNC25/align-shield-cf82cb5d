/**
 * Zod validation schemas for custom compliance tests
 */
import { z } from 'zod';
import type { ConditionOperator } from './resource-schemas';

// Condition operator enum
export const conditionOperatorSchema = z.enum([
  'equals', 
  'not_equals', 
  'greater_than', 
  'less_than', 
  'greater_than_or_equals', 
  'less_than_or_equals',
  'contains', 
  'not_contains',
  'regex_match',
  'is_empty', 
  'is_not_empty',
  'in_array', 
  'not_in_array',
  'starts_with', 
  'ends_with'
]);

// Single condition
export const conditionSchema = z.object({
  id: z.string().optional(),
  field: z.string().min(1, 'Campo é obrigatório'),
  operator: conditionOperatorSchema,
  value: z.any().optional(),
  negate: z.boolean().optional()
}).refine((data) => {
  // Value is required for all operators except is_empty and is_not_empty
  if (data.operator === 'is_empty' || data.operator === 'is_not_empty') {
    return true;
  }
  return data.value !== undefined && data.value !== '';
}, {
  message: 'Valor é obrigatório para este operador',
  path: ['value']
});

// Test logic type
export interface Condition {
  id?: string;
  field: string;
  operator: ConditionOperator;
  value?: any;
  negate?: boolean;
}

export interface TestLogic {
  conditions: Condition[];
  logic: 'AND' | 'OR';
  nested?: TestLogic[];
}

// Recursive test logic schema (loose for validation, use interface for typing)
export const testLogicSchema = z.object({
  conditions: z.array(z.object({
    id: z.string().optional(),
    field: z.string().min(1),
    operator: conditionOperatorSchema,
    value: z.any().optional(),
    negate: z.boolean().optional()
  })).min(1, 'Adicione pelo menos uma condição'),
  logic: z.enum(['AND', 'OR']),
  nested: z.array(z.lazy(() => testLogicSchema)).optional()
});

// Complete custom test schema
export const customTestSchema = z.object({
  test_name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  test_description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional().nullable(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  integration_name: z.string().min(1, 'Selecione uma integração'),
  resource_type: z.string().min(1, 'Selecione um tipo de recurso'),
  test_logic: testLogicSchema,
  sla_hours: z.number().int().min(1).max(8760).optional().nullable(),
  enabled: z.boolean().optional()
});

export type CustomTestInput = z.infer<typeof customTestSchema>;

// Template type
export interface CustomTestTemplate {
  id: string;
  name: string;
  description: string;
  integration_name: string;
  resource_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  test_logic: TestLogic;
  tags?: string[];
}

// Pre-configured templates for common compliance tests
export const CUSTOM_TEST_TEMPLATES: CustomTestTemplate[] = [
  {
    id: 'mfa-required-all-users',
    name: 'MFA Obrigatório para Todos os Usuários',
    description: 'Detecta usuários ativos sem autenticação multi-fator configurada',
    integration_name: 'azure-ad',
    resource_type: 'user',
    severity: 'critical',
    tags: ['security', 'mfa', 'authentication'],
    test_logic: {
      conditions: [
        { field: 'accountEnabled', operator: 'equals', value: true },
        { field: 'mfaEnabled', operator: 'equals', value: false }
      ],
      logic: 'AND'
    }
  },
  {
    id: 'mfa-required-admins',
    name: 'MFA para Administradores',
    description: 'Verifica se todos os usuários administrativos têm MFA habilitado',
    integration_name: 'google-workspace',
    resource_type: 'user',
    severity: 'critical',
    tags: ['security', 'mfa', 'admin'],
    test_logic: {
      conditions: [
        { field: 'isAdmin', operator: 'equals', value: true },
        { field: 'is2faEnrolled', operator: 'equals', value: false }
      ],
      logic: 'AND'
    }
  },
  {
    id: 'no-public-s3-buckets',
    name: 'Buckets S3 Não Públicos',
    description: 'Detecta buckets S3 com configurações de acesso público habilitadas',
    integration_name: 'aws',
    resource_type: 's3_buckets',
    severity: 'critical',
    tags: ['security', 'aws', 'storage'],
    test_logic: {
      conditions: [
        { field: 'publicAccess', operator: 'equals', value: true }
      ],
      logic: 'OR'
    }
  },
  {
    id: 's3-encryption-required',
    name: 'Criptografia S3 Obrigatória',
    description: 'Identifica buckets S3 sem criptografia server-side habilitada',
    integration_name: 'aws',
    resource_type: 's3_buckets',
    severity: 'high',
    tags: ['security', 'aws', 'encryption'],
    test_logic: {
      conditions: [
        { field: 'encryption', operator: 'equals', value: false }
      ],
      logic: 'OR'
    }
  },
  {
    id: 'inactive-users-90-days',
    name: 'Usuários Inativos (90 dias)',
    description: 'Identifica contas ativas sem login nos últimos 90 dias',
    integration_name: 'azure-ad',
    resource_type: 'user',
    severity: 'medium',
    tags: ['hygiene', 'access-review'],
    test_logic: {
      conditions: [
        { field: 'accountEnabled', operator: 'equals', value: true },
        { field: 'lastSignIn', operator: 'is_empty', value: null }
      ],
      logic: 'AND'
    }
  },
  {
    id: 'github-branch-protection',
    name: 'Repositórios sem Branch Protection',
    description: 'Detecta repositórios GitHub sem regras de proteção de branch',
    integration_name: 'github',
    resource_type: 'repository',
    severity: 'high',
    tags: ['security', 'github', 'code-review'],
    test_logic: {
      conditions: [
        { field: 'visibility', operator: 'not_equals', value: 'public' },
        { field: 'archived', operator: 'equals', value: false },
        { field: 'branchProtection', operator: 'equals', value: false }
      ],
      logic: 'AND'
    }
  },
  {
    id: 'github-secret-scanning',
    name: 'Secret Scanning Desabilitado',
    description: 'Detecta repositórios sem scanning de secrets habilitado',
    integration_name: 'github',
    resource_type: 'repository',
    severity: 'high',
    tags: ['security', 'github', 'secrets'],
    test_logic: {
      conditions: [
        { field: 'archived', operator: 'equals', value: false },
        { field: 'secretScanning', operator: 'equals', value: false }
      ],
      logic: 'AND'
    }
  },
  {
    id: 'github-members-no-2fa',
    name: 'Membros GitHub sem 2FA',
    description: 'Identifica membros da organização sem autenticação de dois fatores',
    integration_name: 'github',
    resource_type: 'member',
    severity: 'critical',
    tags: ['security', 'github', 'mfa'],
    test_logic: {
      conditions: [
        { field: 'twoFactorEnabled', operator: 'equals', value: false }
      ],
      logic: 'OR'
    }
  },
  {
    id: 'aws-access-key-rotation',
    name: 'Access Keys AWS Antigas',
    description: 'Detecta chaves de acesso IAM com mais de 90 dias',
    integration_name: 'aws',
    resource_type: 'iam_users',
    severity: 'high',
    tags: ['security', 'aws', 'credentials'],
    test_logic: {
      conditions: [
        { field: 'accessKeyAge', operator: 'greater_than', value: 90 }
      ],
      logic: 'OR'
    }
  },
  {
    id: 'okta-inactive-users',
    name: 'Usuários Okta Inativos',
    description: 'Identifica usuários Okta ativos sem login recente',
    integration_name: 'okta',
    resource_type: 'user',
    severity: 'medium',
    tags: ['hygiene', 'okta', 'access-review'],
    test_logic: {
      conditions: [
        { field: 'status', operator: 'equals', value: 'ACTIVE' },
        { field: 'lastLogin', operator: 'is_empty', value: null }
      ],
      logic: 'AND'
    }
  },
  {
    id: 'guest-users-no-mfa',
    name: 'Usuários Externos sem MFA',
    description: 'Detecta usuários convidados (guest) sem MFA configurado',
    integration_name: 'azure-ad',
    resource_type: 'user',
    severity: 'high',
    tags: ['security', 'guest', 'mfa'],
    test_logic: {
      conditions: [
        { field: 'userType', operator: 'equals', value: 'Guest' },
        { field: 'accountEnabled', operator: 'equals', value: true },
        { field: 'mfaEnabled', operator: 'equals', value: false }
      ],
      logic: 'AND'
    }
  },
  {
    id: 'slack-admins-no-2fa',
    name: 'Admins Slack sem 2FA',
    description: 'Identifica administradores do Slack sem autenticação de dois fatores',
    integration_name: 'slack',
    resource_type: 'user',
    severity: 'critical',
    tags: ['security', 'slack', 'mfa'],
    test_logic: {
      conditions: [
        { field: 'is_admin', operator: 'equals', value: true },
        { field: 'has_2fa', operator: 'equals', value: false },
        { field: 'deleted', operator: 'equals', value: false }
      ],
      logic: 'AND'
    }
  }
];

// Helper function to get nested value from object using dot notation
export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Evaluate a single condition against data
export function evaluateCondition(condition: Condition, data: Record<string, any>): boolean {
  const value = getNestedValue(data, condition.field);
  const result = evaluateOperator(condition.operator, value, condition.value);
  return condition.negate ? !result : result;
}

function evaluateOperator(operator: ConditionOperator, value: any, conditionValue: any): boolean {
  switch (operator) {
    case 'equals':
      return value === conditionValue;
    case 'not_equals':
      return value !== conditionValue;
    case 'greater_than':
      if (typeof value === 'string' && typeof conditionValue === 'string') {
        return new Date(value) > new Date(conditionValue);
      }
      return Number(value) > Number(conditionValue);
    case 'less_than':
      if (typeof value === 'string' && typeof conditionValue === 'string') {
        return new Date(value) < new Date(conditionValue);
      }
      return Number(value) < Number(conditionValue);
    case 'greater_than_or_equals':
      if (typeof value === 'string' && typeof conditionValue === 'string') {
        return new Date(value) >= new Date(conditionValue);
      }
      return Number(value) >= Number(conditionValue);
    case 'less_than_or_equals':
      if (typeof value === 'string' && typeof conditionValue === 'string') {
        return new Date(value) <= new Date(conditionValue);
      }
      return Number(value) <= Number(conditionValue);
    case 'contains':
      return String(value).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'not_contains':
      return !String(value).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'regex_match':
      try {
        return new RegExp(conditionValue, 'i').test(String(value));
      } catch {
        return false;
      }
    case 'is_empty':
      return value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0);
    case 'is_not_empty':
      return value !== null && value !== undefined && value !== '' && 
        !(Array.isArray(value) && value.length === 0);
    case 'in_array':
      const arrayValue = Array.isArray(conditionValue) 
        ? conditionValue 
        : String(conditionValue).split(',').map(s => s.trim());
      return arrayValue.includes(value);
    case 'not_in_array':
      const notArrayValue = Array.isArray(conditionValue) 
        ? conditionValue 
        : String(conditionValue).split(',').map(s => s.trim());
      return !notArrayValue.includes(value);
    case 'starts_with':
      return String(value).startsWith(String(conditionValue));
    case 'ends_with':
      return String(value).endsWith(String(conditionValue));
    default:
      return false;
  }
}

// Evaluate complete test logic recursively
export function evaluateTestLogic(logic: TestLogic, data: Record<string, any>): boolean {
  // Evaluate all conditions in this group
  const conditionResults = logic.conditions.map(condition => 
    evaluateCondition(condition, data)
  );

  // Evaluate nested groups
  const nestedResults = (logic.nested || []).map(nested => 
    evaluateTestLogic(nested, data)
  );

  const allResults = [...conditionResults, ...nestedResults];

  if (logic.logic === 'AND') {
    return allResults.every(Boolean);
  } else {
    return allResults.some(Boolean);
  }
}

// Generate unique ID for conditions
export function generateConditionId(): string {
  return `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create empty condition
export function createEmptyCondition(): Condition {
  return {
    id: generateConditionId(),
    field: '',
    operator: 'equals',
    value: undefined
  };
}

// Create empty test logic
export function createEmptyTestLogic(): TestLogic {
  return {
    conditions: [createEmptyCondition()],
    logic: 'AND',
    nested: []
  };
}
