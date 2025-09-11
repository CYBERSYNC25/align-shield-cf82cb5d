import { createClient } from '@supabase/supabase-js'

// Configuração temporária para desenvolvimento
// IMPORTANTE: Configure suas variáveis de ambiente reais no Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Cliente Supabase com fallback
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Database types
export type Database = {
  public: {
    Tables: {
      frameworks: {
        Row: {
          id: string
          name: string
          description: string
          version: string
          compliance_score: number
          status: string
          total_controls: number
          passed_controls: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          version: string
          compliance_score: number
          status: string
          total_controls: number
          passed_controls: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          version?: string
          compliance_score?: number
          status?: string
          total_controls?: number
          passed_controls?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: 'pending' | 'in_progress' | 'completed' | 'overdue'
          priority: 'low' | 'medium' | 'high' | 'critical'
          due_date: string
          assigned_to: string
          framework: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status: 'pending' | 'in_progress' | 'completed' | 'overdue'
          priority: 'low' | 'medium' | 'high' | 'critical'
          due_date: string
          assigned_to: string
          framework: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          due_date?: string
          assigned_to?: string
          framework?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      audits: {
        Row: {
          id: string
          title: string
          description: string
          framework: string
          status: 'planning' | 'in_progress' | 'review' | 'completed'
          auditor_name: string
          auditor_email: string
          start_date: string
          end_date: string
          evidence_count: number
          findings_count: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          framework: string
          status: 'planning' | 'in_progress' | 'review' | 'completed'
          auditor_name: string
          auditor_email: string
          start_date: string
          end_date: string
          evidence_count: number
          findings_count: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          framework?: string
          status?: 'planning' | 'in_progress' | 'review' | 'completed'
          auditor_name?: string
          auditor_email?: string
          start_date?: string
          end_date?: string
          evidence_count?: number
          findings_count?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      evidence: {
        Row: {
          id: string
          title: string
          source: string
          file_type: string
          file_size: number
          file_path: string
          integrity_hash: string
          collection_date: string
          controls_mapped: string[]
          framework: string
          status: 'collected' | 'verified' | 'archived'
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          source: string
          file_type: string
          file_size: number
          file_path: string
          integrity_hash: string
          collection_date: string
          controls_mapped: string[]
          framework: string
          status: 'collected' | 'verified' | 'archived'
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          source?: string
          file_type?: string
          file_size?: number
          file_path?: string
          integrity_hash?: string
          collection_date?: string
          controls_mapped?: string[]
          framework?: string
          status?: 'collected' | 'verified' | 'archived'
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}