import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Client with user token to verify if they are admin
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Admin client to create invite
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.id)

    // Verify if user is admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      return new Response(JSON.stringify({ error: 'Erro ao verificar permissões' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const isAdmin = roles?.some(r => r.role === 'admin')
    
    if (!isAdmin) {
      console.error('User is not admin:', user.id)
      return new Response(JSON.stringify({ error: 'Apenas administradores podem convidar usuários' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, role } = await req.json()
    console.log('Invite request:', { email, role })

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email e role são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate role
    const validRoles = ['admin', 'viewer', 'auditor', 'compliance_officer']
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Role inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.some(u => u.email === email)
    
    if (userExists) {
      return new Response(JSON.stringify({ error: 'Este usuário já possui uma conta' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabaseAdmin
      .from('user_invites')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return new Response(JSON.stringify({ error: 'Já existe um convite pendente para este email' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create invite in database
    const { error: inviteDbError } = await supabaseAdmin
      .from('user_invites')
      .insert({
        email,
        role,
        invited_by: user.id
      })

    if (inviteDbError) {
      console.error('Error creating invite in database:', inviteDbError)
      return new Response(JSON.stringify({ error: 'Erro ao criar convite' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send invitation email via Supabase Auth
    const origin = req.headers.get('origin') || 'https://lovable.dev'
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth`
    })

    if (inviteError) {
      console.error('Error sending invite email:', inviteError)
      // Rollback invite in database
      await supabaseAdmin
        .from('user_invites')
        .delete()
        .eq('email', email)
        .eq('status', 'pending')
      
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Invite sent successfully to:', email)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Convite enviado com sucesso' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
