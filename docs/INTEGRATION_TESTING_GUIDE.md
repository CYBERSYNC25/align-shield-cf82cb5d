# Integration Testing & Audit Guide

## Overview

This guide documents the automated testing framework and audit trails for all integration functions in ComplianceSync. It covers success cases, error handling, token management, and detailed logging.

## Table of Contents

1. [Test Coverage](#test-coverage)
2. [Running Tests](#running-tests)
3. [Test Scenarios](#test-scenarios)
4. [Audit Logging](#audit-logging)
5. [Query Examples](#query-examples)
6. [Troubleshooting](#troubleshooting)

## Test Coverage

### Integration Types Tested

- **Google Workspace** (OAuth 2.0)
- **AWS** (IAM credentials)
- **Azure** (Service Principal)
- **Okta** (API tokens)

### Test Categories

1. **Success Cases**
   - Connection establishment
   - Data synchronization
   - Configuration updates
   - Disconnection

2. **Error Cases**
   - Invalid credentials
   - API errors
   - Network failures
   - Missing permissions

3. **Token Management**
   - Token expiration detection
   - Automatic token refresh
   - Token revocation
   - Refresh token errors

4. **Webhook Processing**
   - Valid payload processing
   - Invalid payload handling
   - Retry logic
   - Event routing

## Running Tests

### Prerequisites

```bash
npm install
```

### Execute All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test integration-flows
```

### Run with Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## Test Scenarios

### 1. Successful Integration Connection

**Test:** `should connect integration successfully`

**Flow:**
1. User provides valid credentials
2. System validates credentials
3. Integration is added to active list
4. Audit log created
5. Success notification sent

**Expected Result:**
- Integration status: `active`
- Audit log entry: `integration.connected`
- User notification: Success message

### 2. Invalid Credentials Error

**Test:** `should handle missing credentials error`

**Flow:**
1. User provides empty/invalid credentials
2. System validates input
3. Connection attempt rejected
4. Error logged
5. User notified of error

**Expected Result:**
- Integration not added
- Audit log entry: `integration.connection_failed`
- Error notification with details

### 3. Token Expiration Detection

**Test:** `should detect expired OAuth token`

**Flow:**
1. System checks token expiration time
2. Compares with current time
3. Identifies expired token
4. Triggers refresh workflow

**Expected Result:**
- `isExpired = true`
- Automatic refresh initiated
- Audit log entry: `token.expired`

### 4. Token Refresh Success

**Test:** `should refresh token successfully`

**Flow:**
1. System calls refresh endpoint
2. Receives new access token
3. Updates token in database
4. Logs refresh action

**Expected Result:**
- New access token stored
- Updated expiration time
- Audit log entry: `token.refreshed`

### 5. Webhook Processing

**Test:** `should process webhook successfully`

**Flow:**
1. Webhook received at endpoint
2. Payload validated
3. Event type identified
4. Processing logic executed
5. Status updated

**Expected Result:**
- Webhook status: `processed`
- Data synced to database
- Audit log entry: `webhook.processed`

## Audit Logging

### Automatic Logging

All integration actions automatically generate audit logs with:

- **Timestamp**: When the action occurred
- **User ID**: Who performed the action
- **Action Type**: What was done
- **Resource**: Which integration
- **Result**: Success or error details
- **Metadata**: Additional context

### Action Types Logged

| Action | Description | Severity |
|--------|-------------|----------|
| `integration.connected` | New integration added | Info |
| `integration.disconnected` | Integration removed | Warning |
| `integration.paused` | Integration paused | Info |
| `integration.resumed` | Integration resumed | Info |
| `integration.config_updated` | Configuration changed | Info |
| `integration.connection_failed` | Connection error | Error |
| `token.created` | OAuth token created | Info |
| `token.refreshed` | Token refreshed | Info |
| `token.expired` | Token expired | Warning |
| `token.revoked` | Token revoked | Warning |
| `token.refresh_failed` | Refresh failed | Error |
| `webhook.received` | Webhook received | Info |
| `webhook.processed` | Webhook processed | Info |
| `webhook.failed` | Processing failed | Error |
| `sync.started` | Data sync started | Info |
| `sync.completed` | Sync completed | Info |
| `sync.failed` | Sync failed | Error |

### Log Structure

```typescript
{
  id: string;
  user_id: string;
  action: string;
  resource_type: 'integration' | 'oauth_token' | 'webhook';
  resource_id: string;
  old_data: object | null;
  new_data: object | null;
  ip_address: string;
  user_agent: string;
  created_at: timestamp;
}
```

## Query Examples

### View All Integration Logs

```sql
SELECT 
  al.created_at,
  al.action,
  al.resource_id,
  p.display_name as user_name,
  al.new_data
FROM audit_logs al
LEFT JOIN profiles p ON p.user_id = al.user_id
WHERE al.resource_type = 'integration'
ORDER BY al.created_at DESC
LIMIT 100;
```

### Check Token Refresh History

```sql
SELECT 
  al.created_at,
  al.action,
  al.resource_id,
  (al.new_data->>'expires_at')::timestamp as new_expiry
FROM audit_logs al
WHERE al.action LIKE 'token.%'
  AND al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;
```

### Find Failed Integrations

```sql
SELECT 
  al.created_at,
  al.resource_id,
  al.action,
  al.new_data->>'error_message' as error
FROM audit_logs al
WHERE al.action IN (
  'integration.connection_failed',
  'sync.failed',
  'webhook.failed',
  'token.refresh_failed'
)
ORDER BY al.created_at DESC;
```

### Integration Health Report

```sql
SELECT 
  resource_id as integration_name,
  COUNT(*) FILTER (WHERE action LIKE '%.failed') as error_count,
  COUNT(*) FILTER (WHERE action LIKE '%.completed') as success_count,
  MAX(created_at) as last_activity
FROM audit_logs
WHERE resource_type = 'integration'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY resource_id
ORDER BY error_count DESC;
```

### Webhook Processing Stats

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE action = 'webhook.processed') as processed,
  COUNT(*) FILTER (WHERE action = 'webhook.failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE action = 'webhook.processed')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as success_rate
FROM audit_logs
WHERE resource_type = 'webhook'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Viewing Logs in Dashboard

### Access Audit Logs

1. Navigate to **Integrations Hub**
2. Click on **Audit Logs** tab
3. Use filters to narrow down results:
   - Date range
   - Action type
   - Integration name
   - Status (success/error)

### Real-Time Monitoring

The **Webhook Monitor** component provides:
- Live webhook events
- Processing status
- Error details
- Retry attempts

### Export Logs

Logs can be exported in multiple formats:
- CSV for Excel analysis
- JSON for programmatic processing
- PDF for audit reports

## Troubleshooting

### Common Issues

#### Test Failing: "Token refresh failed"

**Cause:** Refresh token may be invalid or expired

**Solution:**
1. Revoke current token
2. Re-authenticate with provider
3. Generate new tokens
4. Run test again

#### Test Failing: "Webhook timeout"

**Cause:** Edge function taking too long

**Solution:**
1. Check edge function logs
2. Verify database connectivity
3. Optimize processing logic
4. Increase timeout if necessary

#### Audit Logs Not Appearing

**Cause:** RLS policies or permission issues

**Solution:**
1. Verify user has audit viewer role
2. Check RLS policies on audit_logs table
3. Ensure audit logging is enabled
4. Review edge function logs

### Debug Mode

Enable verbose logging:

```typescript
// In edge function
const DEBUG = Deno.env.get('DEBUG') === 'true';

if (DEBUG) {
  console.log('Debug info:', { payload, metadata });
}
```

### Performance Optimization

If tests are slow:
1. Use database indexes on frequently queried columns
2. Batch webhook processing
3. Implement caching for token validation
4. Optimize SQL queries

## Best Practices

1. **Run tests before deployment**
   - Always execute full test suite
   - Review failing tests
   - Check audit logs

2. **Monitor token expiration**
   - Set up alerts for tokens expiring soon
   - Implement automatic refresh
   - Log all token operations

3. **Review audit logs regularly**
   - Weekly review of error rates
   - Monthly integration health checks
   - Quarterly security audits

4. **Document integration changes**
   - Update tests for new features
   - Document error codes
   - Maintain changelog

## Support

For additional help:
- Check [Integration API Reference](./INTEGRATION_API_REFERENCE.md)
- Review [Webhook Documentation](./WEBHOOK_DOCUMENTATION.md)
- Contact support team

## Appendix

### Test Data Cleanup

After running tests:

```sql
-- Clean up test data (be careful!)
DELETE FROM integration_oauth_tokens 
WHERE user_id = 'test-user-id';

DELETE FROM audit_logs 
WHERE user_id = 'test-user-id';
```

### Continuous Integration

Tests can be integrated into CI/CD:

```yaml
# .github/workflows/test.yml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```
