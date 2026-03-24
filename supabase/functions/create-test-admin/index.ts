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
    const orgId = 'ef8aabd7-0964-42e1-9c33-40ff86e9d8b8' // Org existente

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === testEmail)

    let userId: string

    if (existing) {
      console.log('User exists:', existing.id)
      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: testPassword,
        email_confirm: true
      })
      if (updateError) throw updateError
      userId = existing.id
    } else {
      // Temporarily disable the org creation trigger
      // Create user with minimal metadata
      console.log('Creating new user...')
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          display_name: 'Admin Teste'
        }
      })

      if (createError) {
        console.error('Create error:', JSON.stringify(createError))
        // If trigger fails, try to find user anyway (might have been partially created)
        const { data: retryUsers } = await supabase.auth.admin.listUsers()
        const retryUser = retryUsers?.users?.find(u => u.email === testEmail)
        if (retryUser) {
          userId = retryUser.id
          console.log('Found partially created user:', userId)
        } else {
          throw createError
        }
      } else {
        userId = newUser.user.id
        console.log('User created:', userId)
      }
    }

    // Ensure profile exists and is linked to existing org
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (profile) {
      // Update profile to use existing org
      await supabase
        .from('profiles')
        .update({ 
          org_id: orgId, 
          role_in_org: 'admin',
          display_name: 'Admin Teste',
          organization: 'APOC Security'
        })
        .eq('user_id', userId)
      console.log('Profile updated with org')
    } else {
      // Create profile
      await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          org_id: orgId,
          role_in_org: 'admin',
          display_name: 'Admin Teste',
          organization: 'APOC Security'
        })
      console.log('Profile created')
    }

    // Ensure admin + master_admin roles
    const { error: r1 } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
    if (r1) console.error('Role error:', r1)

    const { error: r2 } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'master_admin' }, { onConflict: 'user_id,role' })
    if (r2) console.error('Role error:', r2)

    console.log('Done! Roles assigned.')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário admin de teste criado com sucesso',
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
