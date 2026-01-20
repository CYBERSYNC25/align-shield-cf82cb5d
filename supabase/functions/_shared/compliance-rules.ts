/**
 * Compliance Rules Engine
 * 
 * Shared compliance rules for webhook-triggered checks
 * 
 * @module compliance-rules
 */

import { createLogger } from './logger.ts';

const logger = createLogger('ComplianceRules');

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  provider: string;
  resourceType: string;
  slaHours: number;
  check: (resourceData: Record<string, unknown>) => boolean;
}

export interface ComplianceCheckResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  severity: string;
  details: string;
  resourceId: string;
  slaHours: number;
}

// ============================================================
// COMPLIANCE RULES DEFINITIONS
// ============================================================

export const COMPLIANCE_RULES: ComplianceRule[] = [
  // GitHub Rules
  {
    id: 'github-public-repo',
    name: 'Public Repository Detected',
    description: 'Repository is publicly accessible, potentially exposing sensitive code',
    severity: 'critical',
    provider: 'github',
    resourceType: 'repository',
    slaHours: 24,
    check: (data) => data.private === true || data.visibility === 'private',
  },
  {
    id: 'github-no-branch-protection',
    name: 'No Branch Protection',
    description: 'Main branch lacks protection rules, risking unreviewed code merges',
    severity: 'high',
    provider: 'github',
    resourceType: 'repository',
    slaHours: 168, // 7 days
    check: (data) => data.branch_protection === true || data.protected === true,
  },
  
  // Slack Rules
  {
    id: 'slack-admin-no-mfa',
    name: 'Slack Admin Without MFA',
    description: 'Admin user does not have two-factor authentication enabled',
    severity: 'critical',
    provider: 'slack',
    resourceType: 'user',
    slaHours: 24,
    check: (data) => {
      // If not admin, rule doesn't apply (passes)
      if (!data.is_admin && !data.is_owner) return true;
      // Admin must have 2FA
      return data.has_2fa === true || !!data.two_factor_type;
    },
  },
  {
    id: 'slack-inactive-user',
    name: 'Inactive Slack User',
    description: 'User has been inactive for more than 90 days',
    severity: 'medium',
    provider: 'slack',
    resourceType: 'user',
    slaHours: 720, // 30 days
    check: (data) => {
      if (!data.last_activity) return true;
      const lastActivity = new Date(data.last_activity as string);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity < 90;
    },
  },
  
  // AWS Rules
  {
    id: 'aws-public-bucket',
    name: 'Public S3 Bucket',
    description: 'S3 bucket has public access, risking data exposure',
    severity: 'critical',
    provider: 'aws',
    resourceType: 'bucket',
    slaHours: 24,
    check: (data) => {
      // Check various indicators of public access
      const policy = data.policy as Record<string, unknown> | undefined;
      
      // If policy was just changed, need to verify it's not public
      if (policy && typeof policy === 'object') {
        const statements = (policy as any).Statement || [];
        const hasPublicStatement = statements.some((s: any) => {
          const isPublicPrincipal = s.Principal === '*' || 
            s.Principal?.AWS === '*' ||
            (Array.isArray(s.Principal?.AWS) && s.Principal.AWS.includes('*'));
          return isPublicPrincipal && s.Effect === 'Allow';
        });
        if (hasPublicStatement) return false;
      }
      
      return data.public_access_block_enabled !== false;
    },
  },
  {
    id: 'aws-unencrypted-bucket',
    name: 'Unencrypted S3 Bucket',
    description: 'S3 bucket does not have encryption enabled',
    severity: 'high',
    provider: 'aws',
    resourceType: 'bucket',
    slaHours: 168, // 7 days
    check: (data) => data.encryption !== false && data.server_side_encryption !== false,
  },
  {
    id: 'aws-access-key-rotation',
    name: 'Access Key Rotation Required',
    description: 'IAM access key has not been rotated in 90 days',
    severity: 'medium',
    provider: 'aws',
    resourceType: 'access_key',
    slaHours: 720, // 30 days
    check: (data) => {
      if (!data.created_date) return true;
      const createdDate = new Date(data.created_date as string);
      const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation < 90;
    },
  },
  
  // Azure AD Rules
  {
    id: 'azure-user-no-mfa',
    name: 'Azure AD User Without MFA',
    description: 'User account does not have MFA configured',
    severity: 'high',
    provider: 'azure',
    resourceType: 'user',
    slaHours: 168, // 7 days
    check: (data) => {
      // Check MFA status
      return data.mfa_enabled === true || 
             data.strongAuthenticationMethods?.length > 0 ||
             data.authenticationMethods?.length > 0;
    },
  },
  {
    id: 'azure-guest-active',
    name: 'Active Guest User',
    description: 'External guest user has active access to Azure AD',
    severity: 'medium',
    provider: 'azure',
    resourceType: 'user',
    slaHours: 720, // 30 days
    check: (data) => {
      // If not a guest, rule passes
      if (data.userType !== 'Guest') return true;
      // If guest but disabled, passes
      if (data.accountEnabled === false) return true;
      // Active guest - fails (returns false)
      return false;
    },
  },
  {
    id: 'azure-no-conditional-access',
    name: 'No Conditional Access Policy',
    description: 'Azure AD lacks conditional access policies for secure authentication',
    severity: 'high',
    provider: 'azure',
    resourceType: 'conditional_access_policy',
    slaHours: 168, // 7 days
    check: (data) => {
      // If policy was deleted, this is a fail
      if (data.deleted === true) return false;
      // If policy exists and is enabled, passes
      return data.state === 'enabled' || data.state === 'enabledForReportingButNotEnforced';
    },
  },
];

/**
 * Run compliance check for a specific rule
 */
export function runComplianceCheck(
  ruleId: string,
  resourceId: string,
  resourceData: Record<string, unknown>
): ComplianceCheckResult | null {
  const rule = COMPLIANCE_RULES.find(r => r.id === ruleId);
  
  if (!rule) {
    logger.warn(`Unknown compliance rule: ${ruleId}`);
    return null;
  }
  
  try {
    const passed = rule.check(resourceData);
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed,
      severity: rule.severity,
      details: passed 
        ? `Resource ${resourceId} complies with ${rule.name}`
        : `Resource ${resourceId} violates ${rule.name}: ${rule.description}`,
      resourceId,
      slaHours: rule.slaHours,
    };
  } catch (error) {
    logger.error(`Error running compliance check ${ruleId}`, error);
    return null;
  }
}

/**
 * Run multiple compliance checks for a resource
 */
export function runComplianceChecks(
  ruleIds: string[],
  resourceId: string,
  resourceData: Record<string, unknown>
): ComplianceCheckResult[] {
  const results: ComplianceCheckResult[] = [];
  
  for (const ruleId of ruleIds) {
    const result = runComplianceCheck(ruleId, resourceId, resourceData);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Get all rules for a provider/resource type combination
 */
export function getRulesForResource(provider: string, resourceType: string): ComplianceRule[] {
  return COMPLIANCE_RULES.filter(
    r => r.provider === provider && r.resourceType === resourceType
  );
}

/**
 * Calculate SLA deadline based on severity
 */
export function calculateSlaDeadline(severity: string, triggeredAt: Date = new Date()): Date {
  const slaHours: Record<string, number> = {
    critical: 24,
    high: 168, // 7 days
    medium: 720, // 30 days
    low: 2160, // 90 days
  };
  
  const hours = slaHours[severity] || 720;
  return new Date(triggeredAt.getTime() + hours * 60 * 60 * 1000);
}
