import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketRequest {
  alertId: string;
  ruleId: string;
  ruleTitle: string;
  severity: string;
  description?: string;
  externalSystem: 'jira' | 'linear';
  assignee?: string;
}

interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

interface LinearConfig {
  apiKey: string;
  teamId: string;
}

// Priority mapping
const SEVERITY_TO_JIRA_PRIORITY: Record<string, string> = {
  critical: 'Highest',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const SEVERITY_TO_LINEAR_PRIORITY: Record<string, number> = {
  critical: 1, // Urgent
  high: 2, // High
  medium: 3, // Medium
  low: 4, // Low
};

async function createJiraTicket(
  config: JiraConfig,
  request: TicketRequest
): Promise<{ ticketId: string; ticketUrl: string }> {
  const auth = btoa(`${config.email}:${config.apiToken}`);
  
  const response = await fetch(`https://${config.domain}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: { key: config.projectKey },
        summary: `[ComplianceSync] ${request.ruleTitle}`,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: request.description || `Alerta de compliance detectado pelo Compliance Sync.\n\nRegra: ${request.ruleId}\nSeveridade: ${request.severity}`,
                },
              ],
            },
          ],
        },
        issuetype: { name: 'Task' },
        priority: { name: SEVERITY_TO_JIRA_PRIORITY[request.severity] || 'Medium' },
        labels: ['compliance-sync', 'compliance', 'security'],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Jira API error:', errorText);
    throw new Error(`Failed to create Jira ticket: ${response.status}`);
  }

  const data = await response.json();
  return {
    ticketId: data.key,
    ticketUrl: `https://${config.domain}/browse/${data.key}`,
  };
}

async function createLinearTicket(
  config: LinearConfig,
  request: TicketRequest
): Promise<{ ticketId: string; ticketUrl: string }> {
  const query = `
    mutation CreateIssue($title: String!, $description: String!, $teamId: String!, $priority: Int!) {
      issueCreate(input: {
        title: $title
        description: $description
        teamId: $teamId
        priority: $priority
        labelIds: []
      }) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        title: `[ComplianceSync] ${request.ruleTitle}`,
        description: request.description || `Alerta de compliance detectado pelo Compliance Sync.\n\nRegra: ${request.ruleId}\nSeveridade: ${request.severity}`,
        teamId: config.teamId,
        priority: SEVERITY_TO_LINEAR_PRIORITY[request.severity] || 3,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Linear API error:', errorText);
    throw new Error(`Failed to create Linear ticket: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.data?.issueCreate?.success) {
    throw new Error('Linear issue creation failed');
  }

  return {
    ticketId: data.data.issueCreate.issue.identifier,
    ticketUrl: data.data.issueCreate.issue.url,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const body: TicketRequest = await req.json();
    const { alertId, ruleId, ruleTitle, severity, description, externalSystem, assignee } = body;

    if (!alertId || !ruleId || !externalSystem) {
      throw new Error('Missing required fields: alertId, ruleId, externalSystem');
    }

    // Check if integration credentials exist
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('configuration')
      .eq('user_id', user.id)
      .eq('provider', externalSystem)
      .eq('status', 'connected')
      .single();

    let ticketId: string;
    let ticketUrl: string;

    if (integration?.configuration) {
      // Real integration - create actual ticket
      const config = integration.configuration as any;
      
      if (externalSystem === 'jira' && config.domain && config.email && config.apiToken) {
        const result = await createJiraTicket(
          {
            domain: config.domain,
            email: config.email,
            apiToken: config.apiToken,
            projectKey: config.projectKey || 'Compliance Sync',
          },
          { alertId, ruleId, ruleTitle, severity: severity || 'medium', description, externalSystem, assignee }
        );
        ticketId = result.ticketId;
        ticketUrl = result.ticketUrl;
      } else if (externalSystem === 'linear' && config.apiKey && config.teamId) {
        const result = await createLinearTicket(
          {
            apiKey: config.apiKey,
            teamId: config.teamId,
          },
          { alertId, ruleId, ruleTitle, severity: severity || 'medium', description, externalSystem, assignee }
        );
        ticketId = result.ticketId;
        ticketUrl = result.ticketUrl;
      } else {
        // Missing config - fall back to simulation
        ticketId = `${externalSystem.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        ticketUrl = '';
      }
    } else {
      // No integration configured - simulate ticket creation
      ticketId = `${externalSystem.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      ticketUrl = '';
    }

    // Create remediation ticket record
    const { error: ticketError } = await supabase
      .from('remediation_tickets')
      .insert({
        user_id: user.id,
        alert_id: alertId,
        rule_id: ruleId,
        external_system: externalSystem,
        external_ticket_id: ticketId,
        external_ticket_url: ticketUrl || null,
        ticket_title: ruleTitle,
        ticket_status: 'open',
        assigned_to: assignee || null,
        metadata: {
          severity,
          created_via: 'compliance-sync',
          is_simulated: !ticketUrl,
        },
      });

    if (ticketError) {
      console.error('Error creating remediation ticket record:', ticketError);
      throw ticketError;
    }

    // Update compliance alert with ticket reference
    const { error: updateError } = await supabase
      .from('compliance_alerts')
      .update({
        external_ticket_id: ticketId,
        external_ticket_url: ticketUrl || null,
      })
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating compliance alert:', updateError);
      throw updateError;
    }

    // Log to audit
    await supabase.from('system_audit_logs').insert({
      user_id: user.id,
      action_type: 'remediation_ticket_created',
      action_category: 'remediation',
      resource_type: 'remediation_ticket',
      resource_id: alertId,
      description: `Ticket ${ticketId} criado para: ${ruleTitle}`,
      metadata: {
        rule_id: ruleId,
        external_system: externalSystem,
        ticket_id: ticketId,
        ticket_url: ticketUrl,
        is_simulated: !ticketUrl,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        ticketId,
        ticketUrl,
        isSimulated: !ticketUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-remediation-ticket:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('authorization') ? 401 : 500,
      }
    );
  }
});
