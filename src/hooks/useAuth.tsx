import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Se não há configuração real do Supabase, usar mock user
    if (!import.meta.env.VITE_SUPABASE_URL) {
      const mockUser = {
        id: 'mock-user-id',
        email: 'usuario@exemplo.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any;
      
      setUser(mockUser);
      setSession({ user: mockUser, access_token: 'mock-token' } as any);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Se não há configuração real do Supabase, simular login
    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast({
        title: "Login simulado",
        description: "Configure o Supabase para autenticação real"
      });
      return { error: null };
    }

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
        description: "Bem-vindo ao ComplianceSync"
      })
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    // Se não há configuração real do Supabase, simular cadastro
    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast({
        title: "Cadastro simulado",
        description: "Configure o Supabase para autenticação real"
      });
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
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
    if (!import.meta.env.VITE_SUPABASE_URL) {
      // Reset mock user
      setUser(null);
      setSession(null);
      toast({
        title: "Logout realizado",
        description: "Até mais!"
      });
      return;
    }

    await supabase.auth.signOut()
    toast({
      title: "Logout realizado",
      description: "Até mais!"
    })
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
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