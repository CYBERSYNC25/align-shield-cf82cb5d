/**
 * Shared authentication utilities for Edge Functions
 * 
 * Uses supabase.auth.getUser() for token validation instead of getClaims()
 * which is not available in all versions of the SDK.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface AuthResult {
  success: true;
  userId: string;
  email: string | undefined;
  userClient: SupabaseClient;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

export type AuthValidationResult = AuthResult | AuthError;

/**
 * Validate authorization header and return user info
 * 
 * @param authHeader - The Authorization header value
 * @returns AuthResult with userId and userClient, or AuthError
 */
export async function validateAuth(authHeader: string | null): Promise<AuthValidationResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header',
      status: 401,
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      error: 'Server configuration error',
      status: 500,
    };
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Use getUser() to validate the token - this is the stable API
  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData?.user) {
    console.error('Auth validation failed:', userError?.message || 'No user data');
    return {
      success: false,
      error: 'Invalid or expired token',
      status: 401,
    };
  }

  return {
    success: true,
    userId: userData.user.id,
    email: userData.user.email,
    userClient,
  };
}

/**
 * Create an admin client with service role
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Build error response with CORS headers
 */
export function errorResponse(
  error: string, 
  status: number, 
  corsHeaders: Record<string, string>,
  code?: string
): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error,
      ...(code && { code }),
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
