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

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === testEmail)

    let userId: string

    if (existing) {
      // Update password
      await supabase.auth.admin.updateUserById(existing.id, {
        password: testPassword,
        email_confirm: true
      })
      userId = existing.id
    } else {
      // Create user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          display_name: 'Admin Teste',
          organization: 'APOC Security'
        }
      })

      if (createError) throw createError
      userId = newUser.user.id
    }

    // Ensure admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!existingRole) {
      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
    }

    // Also ensure master_admin
    const { data: existingMaster } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'master_admin')
      .maybeSingle()

    if (!existingMaster) {
      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'master_admin' }, { onConflict: 'user_id,role' })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário admin de teste criado/atualizado com sucesso',
        credentials: {
          email: testEmail,
          password: testPassword
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
