/**
 * Event Mapper
 * 
 * Maps webhook events from various providers to:
 * - Compliance rules
 * - Resource types and IDs
 * - Severity levels
 * 
 * @module event-mapper
 */

import { createLogger } from './logger.ts';

const logger = createLogger('EventMapper');

export interface MappedEvent {
  provider: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  resourceData: Record<string, unknown>;
  complianceRules: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
}

export interface EventMappingConfig {
  eventPattern: string | RegExp;
  resourceType: string;
  complianceRules: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  extractResource: (payload: any) => { id: string; data: Record<string, unknown> };
  description: (payload: any) => string;
}

// ============================================================
// GITHUB EVENT MAPPINGS
// ============================================================
const GITHUB_MAPPINGS: EventMappingConfig[] = [
  {
    eventPattern: 'repository.publicized',
    resourceType: 'repository',
    complianceRules: ['github-public-repo'],
    severity: 'critical',
    extractResource: (p) => ({
      id: p.repository?.id?.toString() || p.repository?.full_name,
      data: {
        name: p.repository?.name,
        full_name: p.repository?.full_name,
        private: p.repository?.private,
        visibility: 'public',
        owner: p.repository?.owner?.login,
        html_url: p.repository?.html_url,
      }
    }),
    description: (p) => `Repository ${p.repository?.full_name} was made public`,
  },
  {
    eventPattern: 'repository.privatized',
    resourceType: 'repository',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => ({
      id: p.repository?.id?.toString() || p.repository?.full_name,
      data: {
        name: p.repository?.name,
        full_name: p.repository?.full_name,
        private: true,
        visibility: 'private',
        owner: p.repository?.owner?.login,
      }
    }),
    description: (p) => `Repository ${p.repository?.full_name} was made private`,
  },
  {
    eventPattern: 'branch_protection_rule.deleted',
    resourceType: 'repository',
    complianceRules: ['github-no-branch-protection'],
    severity: 'high',
    extractResource: (p) => ({
      id: p.repository?.id?.toString() || p.repository?.full_name,
      data: {
        name: p.repository?.name,
        full_name: p.repository?.full_name,
        branch_protection: false,
        deleted_rule: p.rule?.name,
      }
    }),
    description: (p) => `Branch protection rule deleted from ${p.repository?.full_name}`,
  },
  {
    eventPattern: 'member.added',
    resourceType: 'user',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => ({
      id: p.member?.id?.toString() || p.member?.login,
      data: {
        login: p.member?.login,
        role: p.changes?.permission?.to || 'member',
        repository: p.repository?.full_name,
      }
    }),
    description: (p) => `User ${p.member?.login} added to ${p.repository?.full_name}`,
  },
  {
    eventPattern: 'member.removed',
    resourceType: 'user',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => ({
      id: p.member?.id?.toString() || p.member?.login,
      data: {
        login: p.member?.login,
        removed_from: p.repository?.full_name,
      }
    }),
    description: (p) => `User ${p.member?.login} removed from ${p.repository?.full_name}`,
  },
  {
    eventPattern: 'organization.member_added',
    resourceType: 'user',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => ({
      id: p.membership?.user?.id?.toString() || p.membership?.user?.login,
      data: {
        login: p.membership?.user?.login,
        role: p.membership?.role,
        organization: p.organization?.login,
      }
    }),
    description: (p) => `User ${p.membership?.user?.login} joined organization`,
  },
];

// ============================================================
// SLACK EVENT MAPPINGS
// ============================================================
const SLACK_MAPPINGS: EventMappingConfig[] = [
  {
    eventPattern: 'user_change',
    resourceType: 'user',
    complianceRules: ['slack-admin-no-mfa'],
    severity: 'critical',
    extractResource: (p) => ({
      id: p.event?.user?.id || p.user?.id,
      data: {
        id: p.event?.user?.id || p.user?.id,
        name: p.event?.user?.name || p.user?.name,
        real_name: p.event?.user?.real_name || p.user?.real_name,
        is_admin: p.event?.user?.is_admin || p.user?.is_admin,
        is_owner: p.event?.user?.is_owner || p.user?.is_owner,
        two_factor_type: p.event?.user?.two_factor_type || p.user?.two_factor_type,
        has_2fa: !!(p.event?.user?.two_factor_type || p.user?.two_factor_type),
      }
    }),
    description: (p) => `User ${p.event?.user?.name || p.user?.name} profile changed`,
  },
  {
    eventPattern: 'team_join',
    resourceType: 'user',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => ({
      id: p.event?.user?.id || p.user?.id,
      data: {
        id: p.event?.user?.id || p.user?.id,
        name: p.event?.user?.name || p.user?.name,
        real_name: p.event?.user?.real_name || p.user?.real_name,
        email: p.event?.user?.profile?.email,
        is_admin: false,
        has_2fa: false,
      }
    }),
    description: (p) => `New user ${p.event?.user?.name || p.user?.name} joined workspace`,
  },
  {
    eventPattern: 'member_left_channel',
    resourceType: 'user',
    complianceRules: ['slack-inactive-user'],
    severity: 'low',
    extractResource: (p) => ({
      id: p.event?.user || p.user,
      data: {
        user_id: p.event?.user || p.user,
        channel: p.event?.channel,
        last_activity: new Date().toISOString(),
      }
    }),
    description: (p) => `User left channel`,
  },
  {
    eventPattern: 'channel_created',
    resourceType: 'channel',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => ({
      id: p.event?.channel?.id || p.channel?.id,
      data: {
        id: p.event?.channel?.id || p.channel?.id,
        name: p.event?.channel?.name || p.channel?.name,
        created_by: p.event?.channel?.creator,
        is_private: p.event?.channel?.is_private,
      }
    }),
    description: (p) => `Channel ${p.event?.channel?.name || p.channel?.name} created`,
  },
];

// ============================================================
// AWS CLOUDTRAIL EVENT MAPPINGS
// ============================================================
const AWS_MAPPINGS: EventMappingConfig[] = [
  {
    eventPattern: 'PutBucketPolicy',
    resourceType: 'bucket',
    complianceRules: ['aws-public-bucket'],
    severity: 'critical',
    extractResource: (p) => {
      const detail = p.detail || p;
      return {
        id: detail.requestParameters?.bucketName || detail.resources?.[0]?.ARN,
        data: {
          bucket_name: detail.requestParameters?.bucketName,
          event_name: detail.eventName,
          user_identity: detail.userIdentity?.arn,
          source_ip: detail.sourceIPAddress,
          event_time: detail.eventTime,
        }
      };
    },
    description: (p) => `Bucket policy changed for ${p.detail?.requestParameters?.bucketName || 'unknown bucket'}`,
  },
  {
    eventPattern: 'PutBucketAcl',
    resourceType: 'bucket',
    complianceRules: ['aws-public-bucket'],
    severity: 'critical',
    extractResource: (p) => {
      const detail = p.detail || p;
      return {
        id: detail.requestParameters?.bucketName,
        data: {
          bucket_name: detail.requestParameters?.bucketName,
          acl: detail.requestParameters?.AccessControlPolicy,
          user_identity: detail.userIdentity?.arn,
        }
      };
    },
    description: (p) => `Bucket ACL changed for ${p.detail?.requestParameters?.bucketName || 'unknown bucket'}`,
  },
  {
    eventPattern: 'DeleteBucketEncryption',
    resourceType: 'bucket',
    complianceRules: ['aws-unencrypted-bucket'],
    severity: 'high',
    extractResource: (p) => {
      const detail = p.detail || p;
      return {
        id: detail.requestParameters?.bucketName,
        data: {
          bucket_name: detail.requestParameters?.bucketName,
          encryption: false,
          user_identity: detail.userIdentity?.arn,
        }
      };
    },
    description: (p) => `Encryption disabled on bucket ${p.detail?.requestParameters?.bucketName || 'unknown bucket'}`,
  },
  {
    eventPattern: 'CreateUser',
    resourceType: 'user',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => {
      const detail = p.detail || p;
      return {
        id: detail.responseElements?.user?.userId || detail.requestParameters?.userName,
        data: {
          user_name: detail.requestParameters?.userName,
          user_id: detail.responseElements?.user?.userId,
          arn: detail.responseElements?.user?.arn,
          created_by: detail.userIdentity?.arn,
        }
      };
    },
    description: (p) => `IAM user ${p.detail?.requestParameters?.userName || 'unknown'} created`,
  },
  {
    eventPattern: 'CreateAccessKey',
    resourceType: 'access_key',
    complianceRules: ['aws-access-key-rotation'],
    severity: 'medium',
    extractResource: (p) => {
      const detail = p.detail || p;
      return {
        id: detail.responseElements?.accessKey?.accessKeyId,
        data: {
          access_key_id: detail.responseElements?.accessKey?.accessKeyId,
          user_name: detail.requestParameters?.userName,
          created_by: detail.userIdentity?.arn,
        }
      };
    },
    description: (p) => `Access key created for ${p.detail?.requestParameters?.userName || 'unknown user'}`,
  },
];

// ============================================================
// AZURE AD EVENT MAPPINGS
// ============================================================
const AZURE_MAPPINGS: EventMappingConfig[] = [
  {
    eventPattern: /user\.(created|updated)/,
    resourceType: 'user',
    complianceRules: ['azure-user-no-mfa'],
    severity: 'high',
    extractResource: (p) => {
      const user = p.data || p.value?.[0] || p;
      return {
        id: user.id || user.objectId,
        data: {
          id: user.id || user.objectId,
          userPrincipalName: user.userPrincipalName,
          displayName: user.displayName,
          mail: user.mail,
          accountEnabled: user.accountEnabled,
          userType: user.userType,
          creationType: user.creationType,
        }
      };
    },
    description: (p) => `User ${p.data?.displayName || p.value?.[0]?.displayName || 'unknown'} created/updated`,
  },
  {
    eventPattern: 'user.deleted',
    resourceType: 'user',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => ({
      id: p.data?.id || p.resourceData?.id,
      data: {
        id: p.data?.id || p.resourceData?.id,
        deleted: true,
      }
    }),
    description: (p) => `User deleted`,
  },
  {
    eventPattern: /group\.(created|updated|memberAdded|memberRemoved)/,
    resourceType: 'group',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => {
      const group = p.data || p.value?.[0] || p;
      return {
        id: group.id || group.objectId,
        data: {
          id: group.id || group.objectId,
          displayName: group.displayName,
          securityEnabled: group.securityEnabled,
          membershipRule: group.membershipRule,
        }
      };
    },
    description: (p) => `Group ${p.data?.displayName || 'unknown'} changed`,
  },
  {
    eventPattern: 'conditionalAccessPolicy.deleted',
    resourceType: 'conditional_access_policy',
    complianceRules: ['azure-no-conditional-access'],
    severity: 'high',
    extractResource: (p) => ({
      id: p.data?.id || p.resourceData?.id,
      data: {
        id: p.data?.id || p.resourceData?.id,
        deleted: true,
        display_name: p.data?.displayName,
      }
    }),
    description: (p) => `Conditional Access Policy deleted`,
  },
  {
    eventPattern: 'conditionalAccessPolicy.created',
    resourceType: 'conditional_access_policy',
    complianceRules: [],
    severity: 'info',
    extractResource: (p) => {
      const policy = p.data || p;
      return {
        id: policy.id,
        data: {
          id: policy.id,
          displayName: policy.displayName,
          state: policy.state,
          conditions: policy.conditions,
        }
      };
    },
    description: (p) => `Conditional Access Policy ${p.data?.displayName || 'unknown'} created`,
  },
];

// ============================================================
// PROVIDER MAPPING REGISTRY
// ============================================================
const PROVIDER_MAPPINGS: Record<string, EventMappingConfig[]> = {
  github: GITHUB_MAPPINGS,
  slack: SLACK_MAPPINGS,
  aws: AWS_MAPPINGS,
  azure: AZURE_MAPPINGS,
};

/**
 * Extract event type from payload based on provider
 */
export function extractEventType(provider: string, payload: any, headers?: Headers): string {
  switch (provider) {
    case 'github': {
      const event = headers?.get('x-github-event') || payload.action || 'unknown';
      const action = payload.action;
      return action ? `${event}.${action}` : event;
    }
    
    case 'slack': {
      if (payload.type === 'event_callback') {
        return payload.event?.type || 'unknown';
      }
      return payload.type || 'unknown';
    }
    
    case 'aws': {
      // CloudTrail event
      const detail = payload.detail || payload;
      return detail.eventName || payload['detail-type'] || 'unknown';
    }
    
    case 'azure': {
      // Microsoft Graph change notification
      return payload.changeType 
        ? `${payload.resource?.split('/')[0] || 'resource'}.${payload.changeType}`
        : payload.value?.[0]?.changeType || 'unknown';
    }
    
    default:
      return payload.event_type || payload.type || payload.action || 'unknown';
  }
}

/**
 * Map a webhook event to compliance rules and resource data
 */
export function mapEventToCompliance(
  provider: string,
  eventType: string,
  payload: any
): MappedEvent | null {
  const mappings = PROVIDER_MAPPINGS[provider];
  
  if (!mappings) {
    logger.warn(`No mappings configured for provider: ${provider}`);
    return null;
  }
  
  // Find matching mapping
  const mapping = mappings.find(m => {
    if (typeof m.eventPattern === 'string') {
      return m.eventPattern === eventType || eventType.includes(m.eventPattern);
    }
    return m.eventPattern.test(eventType);
  });
  
  if (!mapping) {
    logger.info(`No mapping found for event: ${provider}/${eventType}`);
    return null;
  }
  
  try {
    const { id, data } = mapping.extractResource(payload);
    
    return {
      provider,
      eventType,
      resourceType: mapping.resourceType,
      resourceId: id,
      resourceData: data,
      complianceRules: mapping.complianceRules,
      severity: mapping.severity,
      description: mapping.description(payload),
    };
  } catch (error) {
    logger.error('Error extracting resource data', error, { provider, eventType });
    return null;
  }
}

/**
 * Get all compliance rules affected by a resource type change
 */
export function getAffectedRules(provider: string, resourceType: string): string[] {
  const mappings = PROVIDER_MAPPINGS[provider] || [];
  
  const rules = new Set<string>();
  
  mappings
    .filter(m => m.resourceType === resourceType)
    .forEach(m => m.complianceRules.forEach(r => rules.add(r)));
  
  return Array.from(rules);
}

/**
 * Get severity level for a set of compliance rules
 */
export function getHighestSeverity(
  rules: string[]
): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'] as const;
  
  // Mapping of rules to severity
  const ruleSeverity: Record<string, typeof severityOrder[number]> = {
    'github-public-repo': 'critical',
    'github-no-branch-protection': 'high',
    'slack-admin-no-mfa': 'critical',
    'slack-inactive-user': 'medium',
    'aws-public-bucket': 'critical',
    'aws-unencrypted-bucket': 'high',
    'aws-access-key-rotation': 'medium',
    'azure-user-no-mfa': 'high',
    'azure-no-conditional-access': 'high',
    'azure-guest-active': 'medium',
  };
  
  let highest: typeof severityOrder[number] = 'info';
  
  for (const rule of rules) {
    const severity = ruleSeverity[rule] || 'medium';
    if (severityOrder.indexOf(severity) < severityOrder.indexOf(highest)) {
      highest = severity;
    }
  }
  
  return highest;
}
