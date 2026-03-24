import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const testEmail = 'admin@apoc.com.br'
    const testPassword = 'Admin@Test2026!'
    const orgId = 'ef8aabd7-0964-42e1-9c33-40ff86e9d8b8'

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === testEmail)

    let userId: string

    if (existing) {
      console.log('User already exists:', existing.id)
      // Just update password and confirm email
      await supabase.auth.admin.updateUserById(existing.id, {
        password: testPassword,
        email_confirm: true
      })
      userId = existing.id
    } else {
      // Use GoTrue REST API directly to bypass triggers temporarily
      console.log('Creating user via REST API...')
      
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
          user_metadata: {
            display_name: 'Admin Teste',
            organization: 'APOC Security'
          },
          // auto_confirm bypasses email confirmation
          auto_confirm: true
        })
      })

      const result = await response.json()
      console.log('REST result status:', response.status)
      console.log('REST result:', JSON.stringify(result))
      
      if (!response.ok) {
        // If it's a trigger error, check if user was actually created
        const { data: retryUsers } = await supabase.auth.admin.listUsers()
        const retryUser = retryUsers?.users?.find(u => u.email === testEmail)
        
        if (retryUser) {
          console.log('User was created despite trigger error:', retryUser.id)
          userId = retryUser.id
        } else {
          throw new Error(result.message || result.msg || 'Failed to create user')
        }
      } else {
        userId = result.id
      }
    }

    // Ensure profile exists with correct org
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, org_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingProfile) {
      await supabase.from('profiles').update({
        org_id: orgId,
        role_in_org: 'admin',
        display_name: 'Admin Teste',
        organization: 'APOC Security'
      }).eq('user_id', userId)
      console.log('Profile updated')
    } else {
      await supabase.from('profiles').insert({
        user_id: userId,
        org_id: orgId,
        role_in_org: 'admin',
        display_name: 'Admin Teste',
        organization: 'APOC Security'
      })
      console.log('Profile created')
    }

    // Delete any extra orgs created by trigger (keep only the main one)
    // Don't delete the main org

    // Set roles
    await supabase.from('user_roles').upsert(
      { user_id: userId, role: 'admin' }, 
      { onConflict: 'user_id,role' }
    )
    await supabase.from('user_roles').upsert(
      { user_id: userId, role: 'master_admin' }, 
      { onConflict: 'user_id,role' }
    )
    console.log('Roles set: admin + master_admin')

    return new Response(
      JSON.stringify({
        success: true,
        credentials: { email: testEmail, password: testPassword },
        userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
