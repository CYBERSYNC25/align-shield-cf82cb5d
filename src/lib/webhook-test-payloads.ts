/**
 * Test Payloads for Webhook Testing
 * 
 * Example payloads to test webhook configuration for each provider
 */

export interface TestPayload {
  event_type: string;
  description: string;
  payload: Record<string, unknown>;
}

export const webhookTestPayloads: Record<string, TestPayload> = {
  github: {
    event_type: 'repository.publicized',
    description: 'Simula um repositório sendo tornado público',
    payload: {
      action: 'publicized',
      repository: {
        id: 123456789,
        name: 'test-repository',
        full_name: 'org/test-repository',
        private: false,
        visibility: 'public',
        owner: {
          login: 'test-org',
          type: 'Organization',
        },
      },
      sender: {
        login: 'test-user',
        id: 987654321,
      },
    },
  },
  slack: {
    event_type: 'user_change',
    description: 'Simula atualização de usuário (ex: 2FA desativado)',
    payload: {
      type: 'user_change',
      user: {
        id: 'U1234567890',
        name: 'testuser',
        real_name: 'Test User',
        is_admin: true,
        has_2fa: false,
        updated: Math.floor(Date.now() / 1000),
      },
      event_ts: String(Date.now() / 1000),
    },
  },
  aws: {
    event_type: 'PutBucketAcl',
    description: 'Simula bucket S3 sendo tornado público',
    payload: {
      eventVersion: '1.08',
      eventSource: 's3.amazonaws.com',
      eventName: 'PutBucketAcl',
      awsRegion: 'us-east-1',
      eventTime: new Date().toISOString(),
      requestParameters: {
        bucketName: 'test-bucket',
        'x-amz-acl': 'public-read',
      },
      responseElements: null,
      userIdentity: {
        type: 'IAMUser',
        principalId: 'AIDAEXAMPLE123',
        arn: 'arn:aws:iam::123456789012:user/testuser',
        accountId: '123456789012',
        userName: 'testuser',
      },
    },
  },
  azure: {
    event_type: 'user.updated',
    description: 'Simula atualização de usuário no Azure AD',
    payload: {
      value: [
        {
          subscriptionId: 'subscription-id-123',
          changeType: 'updated',
          resource: 'Users/user-id-123',
          resourceData: {
            '@odata.type': '#Microsoft.Graph.User',
            id: 'user-id-123',
            userPrincipalName: 'testuser@contoso.com',
            displayName: 'Test User',
            accountEnabled: true,
          },
          clientState: 'client-state-token',
          tenantId: 'tenant-id-123',
        },
      ],
    },
  },
  'google-workspace': {
    event_type: 'user.updated',
    description: 'Simula atualização de usuário no Google Workspace',
    payload: {
      kind: 'admin#reports#activity',
      id: {
        applicationName: 'admin',
        customerId: 'C01234567',
        time: new Date().toISOString(),
        uniqueQualifier: '12345678901234567890',
      },
      actor: {
        email: 'admin@company.com',
        profileId: '123456789012345678901',
      },
      events: [
        {
          type: 'USER_SETTINGS',
          name: 'CHANGE_TWO_STEP_VERIFICATION_ENROLLMENT',
          parameters: [
            { name: 'USER_EMAIL', value: 'testuser@company.com' },
            { name: 'NEW_VALUE', value: 'false' },
          ],
        },
      ],
    },
  },
  okta: {
    event_type: 'user.lifecycle.deactivate',
    description: 'Simula desativação de usuário no Okta',
    payload: {
      eventType: 'user.lifecycle.deactivate',
      published: new Date().toISOString(),
      actor: {
        id: '00u1234567890ABCDEFG',
        type: 'User',
        alternateId: 'admin@company.com',
        displayName: 'Admin User',
      },
      target: [
        {
          id: '00u0987654321HIJKLMN',
          type: 'User',
          alternateId: 'testuser@company.com',
          displayName: 'Test User',
        },
      ],
      outcome: {
        result: 'SUCCESS',
      },
    },
  },
  auth0: {
    event_type: 'ss',
    description: 'Simula login suspeito no Auth0',
    payload: {
      log_id: 'log_123456789',
      data: {
        date: new Date().toISOString(),
        type: 'ss',
        description: 'Successful silent authentication',
        client_id: 'client-id-123',
        client_name: 'Test App',
        ip: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        user_id: 'auth0|123456789',
        user_name: 'testuser@company.com',
      },
    },
  },
};

export const getTestPayload = (provider: string): TestPayload | null => {
  const normalizedProvider = provider.toLowerCase().replace(/\s+/g, '-');
  return webhookTestPayloads[normalizedProvider] || null;
};
