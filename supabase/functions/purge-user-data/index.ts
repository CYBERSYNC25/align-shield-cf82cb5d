import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from '../_shared/security-middleware.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PurgeRequest {
  categories: string[];
}

const CATEGORY_TABLES: Record<string, string[]> = {
  compliance: [
    'compliance_alerts',
    'compliance_check_history',
    'custom_test_results',
    'custom_compliance_tests',
    'control_tests',
    'control_assignments',
  ],
  risks: [
    'risk_assessments',
    'risks',
    'vendors',
  ],
  incidents: [
    'incidents',
    'incident_playbooks',
    'bcp_plans',
  ],
  tasks: ['tasks'],
  evidence: ['evidence'],
  controls: ['controls'],
  frameworks: ['frameworks'],
  policies: ['policies'],
  notifications: ['notifications'],
  audits: [
    'audit_logs',
    'audits',
  ],
  integrations: [
    'integration_webhooks',
    'integration_collected_data',
    'integration_evidence_mapping',
    'integration_status',
  ],
  reports: [],
  logs: ['system_logs'],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user's org_id
    const { data: profile } = await adminClient
      .from('profiles')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    const orgId = profile?.org_id;

    if (req.method === 'GET') {
      // Return counts per category
      const counts: Record<string, number> = {};

      for (const [category, tables] of Object.entries(CATEGORY_TABLES)) {
        let total = 0;
        for (const table of tables) {
          try {
            let query = adminClient.from(table).select('id', { count: 'exact', head: true });
            if (orgId) query = query.eq('org_id', orgId);
            else query = query.eq('user_id', user.id);
            const { count } = await query;
            total += count ?? 0;
          } catch {
            // Table may not exist
          }
        }
        counts[category] = total;
      }

      return new Response(JSON.stringify({ counts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body: PurgeRequest = await req.json();
      const { categories } = body;

      if (!categories?.length) {
        return new Response(JSON.stringify({ error: 'No categories selected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: Record<string, number> = {};

      // Delete controls before frameworks (FK dependency)
      const orderedCategories = [...categories].sort((a, b) => {
        const order = ['compliance', 'risks', 'incidents', 'tasks', 'evidence', 'integrations', 'reports', 'audits', 'logs', 'notifications', 'policies', 'controls', 'frameworks'];
        return order.indexOf(a) - order.indexOf(b);
      });

      for (const category of orderedCategories) {
        const tables = CATEGORY_TABLES[category];
        if (!tables) continue;

        let totalDeleted = 0;
        for (const table of tables) {
          try {
            let query = adminClient.from(table).delete();
            if (orgId) query = query.eq('org_id', orgId);
            else query = query.eq('user_id', user.id);
            const { data, error } = await query.select('id');
            if (!error && data) {
              totalDeleted += data.length;
            }
          } catch {
            // Table may not exist or have different schema
          }
        }
        results[category] = totalDeleted;
      }

      return new Response(JSON.stringify({ success: true, deleted: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Purge error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
