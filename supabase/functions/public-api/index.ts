import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Hash API key using SHA-256
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Parse route from URL
function parseRoute(url: URL): { version: string; resource: string; id?: string; action?: string } {
  const path = url.pathname.replace(/^\/public-api/, "");
  const parts = path.split("/").filter(Boolean);
  
  // Expected: /v1/resource or /v1/resource/:id or /v1/resource/:id/action
  return {
    version: parts[0] || "v1",
    resource: parts[1] || "",
    id: parts[2],
    action: parts[3],
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const route = parseRoute(url);

  // Validate API version
  if (route.version !== "v1") {
    return new Response(
      JSON.stringify({ error: "Unsupported API version", supported: ["v1"] }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get API key from header
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing API key", message: "Include x-api-key header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate API key format (apoc_...)
  if (!apiKey.startsWith("apoc_")) {
    return new Response(
      JSON.stringify({ error: "Invalid API key format" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create Supabase client with service role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Hash the key and validate
  const keyHash = await hashApiKey(apiKey);
  const { data: validation, error: validationError } = await supabase.rpc("validate_api_key", {
    p_key_hash: keyHash,
  });

  if (validationError || !validation?.[0]?.is_valid) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired API key" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const keyData = validation[0];

  // Check rate limit
  if (keyData.rate_limit_exceeded) {
    const retryAfter = 60 - new Date().getSeconds();
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: `Limit: ${keyData.rate_limit_tier === "free" ? 100 : keyData.rate_limit_tier === "pro" ? 1000 : "unlimited"} requests/minute`,
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": keyData.rate_limit_tier === "free" ? "100" : keyData.rate_limit_tier === "pro" ? "1000" : "999999",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Add rate limit headers
  const rateLimitHeaders = {
    "X-RateLimit-Limit": keyData.rate_limit_tier === "free" ? "100" : keyData.rate_limit_tier === "pro" ? "1000" : "999999",
    "X-RateLimit-Remaining": keyData.requests_remaining.toString(),
  };

  // Check scope permissions
  const scopes = keyData.scopes || ["read"];
  const requiresWrite = req.method === "POST" || req.method === "PUT" || req.method === "DELETE";
  
  if (requiresWrite && !scopes.includes("write")) {
    return new Response(
      JSON.stringify({ error: "Insufficient permissions", required: "write scope" }),
      { status: 403, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = keyData.user_id;
  const orgId = keyData.org_id;

  try {
    let responseData: unknown;

    switch (route.resource) {
      // GET /v1/compliance/score
      case "compliance":
        if (route.id === "score" && req.method === "GET") {
          const { data: alerts } = await supabase
            .from("compliance_alerts")
            .select("severity, resolved")
            .eq("user_id", userId);

          const { data: resources } = await supabase
            .from("integration_collected_data")
            .select("id")
            .eq("user_id", userId);

          const totalAlerts = alerts?.length || 0;
          const resolvedAlerts = alerts?.filter((a) => a.resolved)?.length || 0;
          const criticalOpen = alerts?.filter((a) => !a.resolved && a.severity === "critical")?.length || 0;
          const highOpen = alerts?.filter((a) => !a.resolved && a.severity === "high")?.length || 0;

          const score = totalAlerts > 0 
            ? Math.round(((resolvedAlerts / totalAlerts) * 100) - (criticalOpen * 5) - (highOpen * 2))
            : 100;

          responseData = {
            score: Math.max(0, Math.min(100, score)),
            total_issues: totalAlerts,
            resolved_issues: resolvedAlerts,
            open_issues: totalAlerts - resolvedAlerts,
            by_severity: {
              critical: criticalOpen,
              high: highOpen,
              medium: alerts?.filter((a) => !a.resolved && a.severity === "medium")?.length || 0,
              low: alerts?.filter((a) => !a.resolved && a.severity === "low")?.length || 0,
            },
            total_resources: resources?.length || 0,
            calculated_at: new Date().toISOString(),
          };
        } 
        // GET /v1/compliance/issues
        else if (route.id === "issues" && req.method === "GET") {
          const severity = url.searchParams.get("severity");
          const resolved = url.searchParams.get("resolved");
          const integration = url.searchParams.get("integration");
          const limit = parseInt(url.searchParams.get("limit") || "50");
          const offset = parseInt(url.searchParams.get("offset") || "0");

          let query = supabase
            .from("compliance_alerts")
            .select("*", { count: "exact" })
            .eq("user_id", userId)
            .order("triggered_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (severity) query = query.eq("severity", severity);
          if (resolved !== null) query = query.eq("resolved", resolved === "true");
          if (integration) query = query.eq("integration_name", integration);

          const { data: issues, count, error } = await query;

          if (error) throw error;

          responseData = {
            issues: issues?.map((i) => ({
              id: i.id,
              rule_id: i.rule_id,
              rule_title: i.rule_title,
              severity: i.severity,
              integration: i.integration_name,
              status: i.resolved ? "resolved" : i.acknowledged ? "acknowledged" : "open",
              triggered_at: i.triggered_at,
              resolved_at: i.resolved_at,
              affected_resources: i.affected_resources,
            })),
            pagination: {
              total: count,
              limit,
              offset,
              has_more: (offset + limit) < (count || 0),
            },
          };
        } else {
          return new Response(
            JSON.stringify({ error: "Not found", path: `/v1/compliance/${route.id}` }),
            { status: 404, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
          );
        }
        break;

      // GET /v1/integrations
      case "integrations":
        if (req.method === "GET" && !route.id) {
          const { data: integrations, error } = await supabase
            .from("integration_status")
            .select("*")
            .eq("user_id", userId)
            .order("integration_name");

          if (error) throw error;

          responseData = {
            integrations: integrations?.map((i) => ({
              id: i.id,
              name: i.integration_name,
              status: i.status,
              health_score: i.health_score,
              last_sync_at: i.last_sync_at,
              total_webhooks: i.total_webhooks,
              failed_webhooks: i.failed_webhooks,
            })),
            count: integrations?.length || 0,
          };
        } 
        // POST /v1/integrations/:id/sync
        else if (route.id && route.action === "sync" && req.method === "POST") {
          // Check write permission
          if (!scopes.includes("write")) {
            return new Response(
              JSON.stringify({ error: "Write permission required for sync" }),
              { status: 403, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
            );
          }

          // Enqueue sync job
          const { data: job, error } = await supabase.rpc("enqueue_job", {
            p_job_type: "sync_integration",
            p_payload: { integration_id: route.id },
            p_priority: 2,
          });

          if (error) throw error;

          responseData = {
            success: true,
            message: "Sync job queued",
            job_id: job,
          };
        } else {
          return new Response(
            JSON.stringify({ error: "Not found" }),
            { status: 404, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
          );
        }
        break;

      // GET /v1/resources
      case "resources":
        if (req.method === "GET") {
          const integration = url.searchParams.get("integration");
          const resourceType = url.searchParams.get("type");
          const limit = parseInt(url.searchParams.get("limit") || "100");
          const offset = parseInt(url.searchParams.get("offset") || "0");

          let query = supabase
            .from("integration_collected_data")
            .select("*", { count: "exact" })
            .eq("user_id", userId)
            .order("collected_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (integration) query = query.eq("integration_name", integration);
          if (resourceType) query = query.eq("resource_type", resourceType);

          const { data: resources, count, error } = await query;

          if (error) throw error;

          responseData = {
            resources: resources?.map((r) => ({
              id: r.id,
              resource_id: r.resource_id,
              integration: r.integration_name,
              type: r.resource_type,
              data: r.resource_data,
              collected_at: r.collected_at,
            })),
            pagination: {
              total: count,
              limit,
              offset,
              has_more: (offset + limit) < (count || 0),
            },
          };
        } else {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
          );
        }
        break;

      // GET /v1/frameworks
      case "frameworks":
        if (req.method === "GET") {
          const { data: frameworks, error } = await supabase
            .from("frameworks")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .order("name");

          if (error) throw error;

          responseData = {
            frameworks: frameworks?.map((f) => ({
              id: f.id,
              name: f.name,
              version: f.version,
              description: f.description,
              compliance_score: f.compliance_score,
              total_controls: f.total_controls,
              passed_controls: f.passed_controls,
            })),
            count: frameworks?.length || 0,
          };
        } else {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
          );
        }
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "Not found",
            available_endpoints: [
              "GET /v1/compliance/score",
              "GET /v1/compliance/issues",
              "GET /v1/integrations",
              "POST /v1/integrations/:id/sync",
              "GET /v1/resources",
              "GET /v1/frameworks",
            ],
          }),
          { status: 404, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" } }
    );
  }
});
