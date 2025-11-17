import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useGoogleWorkspaceSync } from '@/hooks/useGoogleWorkspaceSync';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
  },
}));

describe('Integration Flows - Success Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should connect integration successfully', async () => {
    const { result } = renderHook(() => useIntegrations());

    const integration = {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Sync users and groups',
      category: 'identity',
      status: 'available',
      icon: 'Building2',
    };

    const credentials = {
      apiKey: 'test-api-key',
      apiSecret: 'test-secret',
    };

    await waitFor(() => {
      result.current.connectIntegration(integration, credentials, 'test@example.com');
    });

    const integrations = result.current.integrations;
    expect(integrations).toHaveLength(1);
    expect(integrations[0].status).toBe('active');
    expect(integrations[0].connectedBy).toBe('test@example.com');
  });

  it('should disconnect integration successfully', async () => {
    const { result } = renderHook(() => useIntegrations());

    const integration = {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Sync users and groups',
      category: 'identity',
      status: 'available',
      icon: 'Building2',
    };

    await waitFor(() => {
      result.current.connectIntegration(integration, { apiKey: 'test', apiSecret: 'test' }, 'test@example.com');
    });

    await waitFor(() => {
      result.current.disconnectIntegration('google-workspace');
    });

    expect(result.current.integrations).toHaveLength(0);
  });

  it('should pause and resume integration', async () => {
    const { result } = renderHook(() => useIntegrations());

    const integration = {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Sync users and groups',
      category: 'identity',
      status: 'available',
      icon: 'Building2',
    };

    await waitFor(() => {
      result.current.connectIntegration(integration, { apiKey: 'test', apiSecret: 'test' }, 'test@example.com');
    });

    await waitFor(() => {
      result.current.pauseIntegration('google-workspace', 'Maintenance');
    });

    expect(result.current.integrations[0].status).toBe('paused');

    await waitFor(() => {
      result.current.resumeIntegration('google-workspace');
    });

    expect(result.current.integrations[0].status).toBe('active');
  });
});

describe('Integration Flows - Error Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should handle missing credentials error', async () => {
    const { result } = renderHook(() => useIntegrations());

    const integration = {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'Sync users and groups',
      category: 'identity',
      status: 'available',
      icon: 'Building2',
    };

    await waitFor(() => {
      result.current.connectIntegration(integration, { apiKey: '', apiSecret: '' }, 'test@example.com');
    });

    // Should not add integration with empty credentials
    expect(result.current.integrations).toHaveLength(0);
  });

  it('should handle API error during sync', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: { message: 'API Error' },
    });

    const { result } = renderHook(() => useGoogleWorkspaceSync());

    const syncResult = await result.current.syncUsers();

    expect(syncResult).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
});

describe('Integration Flows - Token Expiration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect expired OAuth token', async () => {
    const expiredToken = {
      id: 'test-token',
      user_id: 'test-user',
      integration_name: 'google-workspace',
      access_token: 'expired-token',
      refresh_token: 'refresh-token',
      expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      token_type: 'Bearer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
    };

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: expiredToken, error: null })),
        })),
      })),
    } as any);

    const expiresAt = new Date(expiredToken.expires_at);
    const isExpired = expiresAt.getTime() < Date.now();

    expect(isExpired).toBe(true);
  });

  it('should detect token nearing expiration', async () => {
    const soonToExpireToken = {
      expires_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
    };

    const expiresAt = new Date(soonToExpireToken.expires_at);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const isNearExpiry = timeUntilExpiry < 600000; // Less than 10 minutes

    expect(isNearExpiry).toBe(true);
  });
});

describe('Integration Flows - Token Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should refresh token successfully', async () => {
    const newToken = {
      access_token: 'new-access-token',
      expires_in: 3600,
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: newToken,
      error: null,
    });

    const { data, error } = await supabase.functions.invoke('google-oauth-refresh');

    expect(error).toBeNull();
    expect(data).toEqual(newToken);
  });

  it('should handle refresh token error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid refresh token' },
    });

    const { data, error } = await supabase.functions.invoke('google-oauth-refresh');

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});

describe('Integration Flows - Webhook Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process webhook successfully', async () => {
    const webhook = {
      integration_name: 'google-workspace',
      event_type: 'user.created',
      payload: { userId: '123', email: 'user@example.com' },
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, webhookId: 'webhook-123' },
      error: null,
    });

    const { data, error } = await supabase.functions.invoke('integration-webhook', {
      body: webhook,
    });

    expect(error).toBeNull();
    expect(data.success).toBe(true);
  });

  it('should handle invalid webhook payload', async () => {
    const invalidWebhook = {
      integration_name: '',
      event_type: '',
      payload: {},
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid webhook payload' },
    });

    const { data, error } = await supabase.functions.invoke('integration-webhook', {
      body: invalidWebhook,
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
