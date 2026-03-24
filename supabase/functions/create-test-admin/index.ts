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
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('List users error:', listError)
      throw listError
    }

    const existing = existingUsers?.users?.find(u => u.email === testEmail)

    let userId: string

    if (existing) {
      console.log('User exists, updating password for:', existing.id)
      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: testPassword,
        email_confirm: true
      })
      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }
      userId = existing.id
    } else {
      console.log('Creating new user...')
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          display_name: 'Admin Teste',
          organization: 'APOC Security'
        }
      })

      if (createError) {
        console.error('Create error:', JSON.stringify(createError))
        throw createError
      }
      userId = newUser.user.id
      console.log('User created:', userId)
    }

    // Ensure admin + master_admin roles
    console.log('Setting roles for:', userId)
    
    const { error: roleError1 } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
    
    if (roleError1) console.error('Role admin error:', roleError1)

    const { error: roleError2 } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'master_admin' }, { onConflict: 'user_id,role' })
    
    if (roleError2) console.error('Role master_admin error:', roleError2)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário admin de teste criado/atualizado com sucesso',
        credentials: { email: testEmail, password: testPassword },
        userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Final error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
