import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
      incidents: {
        Row: {
          id: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'investigating' | 'resolved' | 'closed'
          affected_systems: string[]
          reported_by: string
          assigned_to: string
          created_at: string
          updated_at: string
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'investigating' | 'resolved' | 'closed'
          affected_systems: string[]
          reported_by: string
          assigned_to: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'investigating' | 'resolved' | 'closed'
          affected_systems?: string[]
          reported_by?: string
          assigned_to?: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
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