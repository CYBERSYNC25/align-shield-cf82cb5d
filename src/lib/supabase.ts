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
      reports: {
        Row: {
          id: string
          name: string
          description: string
          type: 'dashboard' | 'detailed' | 'executive'
          format: 'PDF' | 'Excel' | 'PowerPoint' | 'CSV' | 'ZIP Archive'
          framework: string
          readiness: number
          status: 'ready' | 'updating' | 'generating'
          last_generated: string
          size: string
          pages: number
          sections: string[]
          audience: string
          metrics: string[]
          filters: any
          recipients: string[]
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          type: 'dashboard' | 'detailed' | 'executive'
          format: 'PDF' | 'Excel' | 'PowerPoint' | 'CSV' | 'ZIP Archive'
          framework: string
          readiness: number
          status: 'ready' | 'updating' | 'generating'
          last_generated: string
          size: string
          pages: number
          sections: string[]
          audience: string
          metrics: string[]
          filters: any
          recipients: string[]
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: 'dashboard' | 'detailed' | 'executive'
          format?: 'PDF' | 'Excel' | 'PowerPoint' | 'CSV' | 'ZIP Archive'
          framework?: string
          readiness?: number
          status?: 'ready' | 'updating' | 'generating'
          last_generated?: string
          size?: string
          pages?: number
          sections?: string[]
          audience?: string
          metrics?: string[]
          filters?: any
          recipients?: string[]
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      scheduled_reports: {
        Row: {
          id: string
          name: string
          description: string
          schedule: string
          next_run: string
          last_run: string
          status: 'active' | 'paused'
          format: string
          recipients: Array<{
            name: string
            email: string
          }>
          delivery_method: 'email' | 'secure_link'
          success_rate: number
          last_status: 'success' | 'warning' | 'error'
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          schedule: string
          next_run: string
          last_run: string
          status: 'active' | 'paused'
          format: string
          recipients: Array<{
            name: string
            email: string
          }>
          delivery_method: 'email' | 'secure_link'
          success_rate: number
          last_status: 'success' | 'warning' | 'error'
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          schedule?: string
          next_run?: string
          last_run?: string
          status?: 'active' | 'paused'
          format?: string
          recipients?: Array<{
            name: string
            email: string
          }>
          delivery_method?: 'email' | 'secure_link'
          success_rate?: number
          last_status?: 'success' | 'warning' | 'error'
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

/* 
IMPORTANTE: Execute este SQL no editor do Supabase para criar as tabelas:

-- Tabelas de Auditoria
CREATE TABLE audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  framework VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  auditor_name VARCHAR,
  auditor_email VARCHAR,
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  size VARCHAR,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR DEFAULT 'pending',
  category VARCHAR,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas de Frameworks
CREATE TABLE frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  version VARCHAR,
  total_controls INTEGER DEFAULT 0,
  implemented_controls INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE framework_controls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
  control_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  status VARCHAR DEFAULT 'not_implemented',
  implementation_date DATE,
  evidence_count INTEGER DEFAULT 0,
  responsible VARCHAR,
  priority VARCHAR DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas de Relatórios
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,
  format VARCHAR NOT NULL,
  framework VARCHAR,
  readiness INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'ready',
  last_generated VARCHAR,
  size VARCHAR,
  pages INTEGER DEFAULT 0,
  sections TEXT[], -- Array de strings
  audience VARCHAR,
  metrics TEXT[], -- Array de strings
  filters JSONB,
  recipients TEXT[], -- Array de strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scheduled_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  schedule VARCHAR NOT NULL,
  next_run VARCHAR,
  last_run VARCHAR,
  status VARCHAR DEFAULT 'active',
  format VARCHAR NOT NULL,
  recipients JSONB, -- Array de objetos {name, email}
  delivery_method VARCHAR DEFAULT 'email',
  success_rate INTEGER DEFAULT 100,
  last_status VARCHAR DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acesso a usuários autenticados)
CREATE POLICY "Users can view audits" ON audits FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert audits" ON audits FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update audits" ON audits FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view audit_evidence" ON audit_evidence FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert audit_evidence" ON audit_evidence FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update audit_evidence" ON audit_evidence FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view frameworks" ON frameworks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view framework_controls" ON framework_controls FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view reports" ON reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert reports" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update reports" ON reports FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view scheduled_reports" ON scheduled_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert scheduled_reports" ON scheduled_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update scheduled_reports" ON scheduled_reports FOR UPDATE USING (auth.role() = 'authenticated');
*/