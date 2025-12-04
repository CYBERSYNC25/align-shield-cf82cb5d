/**
 * Hook de Autenticação - useAuth
 * 
 * Responsável por gerenciar todo o estado de autenticação da aplicação.
 * 
 * @module useAuth
 * @description
 * - Gerencia login, signup, logout e recuperação de senha
 * - Mantém estado global da sessão e usuário autenticado
 * - Integra com Supabase Auth (JWT-based)
 * - Persiste sessão em localStorage
 * - Auto-refresh de tokens
 * 
 * @example
 * ```typescript
 * function LoginPage() {
 *   const { signIn, user, loading } = useAuth();
 *   
 *   const handleLogin = async () => {
 *     const { error } = await signIn('user@example.com', 'password');
 *     if (error) console.error('Login failed:', error);
 *   };
 * }
 * ```
 * 
 * @returns {AuthContextType} Contexto de autenticação com funções e estados
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

/**
 * Interface do contexto de autenticação
 * 
 * @interface AuthContextType
 * @property {User | null} user - Usuário autenticado atual (null se não autenticado)
 * @property {Session | null} session - Sessão ativa com tokens JWT
 * @property {boolean} loading - Estado de carregamento da autenticação
 * @property {Function} signIn - Função de login
 * @property {Function} signUp - Função de cadastro
 * @property {Function} signOut - Função de logout
 * @property {Function} resetPassword - Função de recuperação de senha
 */
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Função para verificar e atribuir role viewer se necessário
  const ensureUserHasRole = async (userId: string) => {
    try {
      const { data: existingRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao verificar roles:', error);
        return;
      }

      // Se não tem nenhuma role, atribui viewer
      if (!existingRoles || existingRoles.length === 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'viewer' });

        if (insertError) {
          console.error('Erro ao atribuir role viewer:', insertError);
        } else {
          console.log('Role viewer atribuída automaticamente');
        }
      }
    } catch (err) {
      console.error('Erro ao verificar/atribuir role:', err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Verifica role após carregar sessão
      if (session?.user) {
        setTimeout(() => ensureUserHasRole(session.user.id), 0);
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Verifica role no login
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => ensureUserHasRole(session.user.id), 0);
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Realiza login do usuário
   * 
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<{error: AuthError | null}>} Objeto com erro (se houver)
   * 
   * @example
   * const { error } = await signIn('user@example.com', 'senha123');
   * 
   * @sideEffects
   * - Cria sessão no localStorage
   * - Atualiza estados user e session
   * - Exibe toast de sucesso/erro
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao APOC"
      })
    }
    
    return { error }
  }

  /**
   * Realiza cadastro de novo usuário
   * 
   * @param {string} email - Email do novo usuário
   * @param {string} password - Senha do novo usuário
   * @param {any} metadata - Metadados adicionais (opcional)
   * @returns {Promise<{error: AuthError | null}>} Objeto com erro (se houver)
   * 
   * @example
   * const { error } = await signUp('novousuario@example.com', 'senha123', {
   *   display_name: 'Novo Usuário'
   * });
   * 
   * @sideEffects
   * - Envia email de confirmação
   * - Trigger handle_new_user() cria perfil automaticamente
   * - Primeiro usuário recebe role 'admin'
   */
  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    })
    
    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta"
      })
    }
    
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: "Logout realizado",
      description: "Até mais!"
    })
  }

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    })
    
    if (error) {
      toast({
        title: "Erro ao recuperar senha",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Email enviado!",
        description: "Verifique seu email para redefinir a senha"
      })
    }
    
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}