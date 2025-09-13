import { createClient } from '@supabase/supabase-js'

// Use as configurações corretas do Supabase
const supabaseUrl = 'https://ofbyxnpprwwuieabwhdo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYnl4bnBwcnd3dWllYWJ3aGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDY4NTEsImV4cCI6MjA3MzE4Mjg1MX0.aHH2NWUQZnvV6FALdBIP5SB02YbrE8u12lXI1DtIbiw'

// Cliente Supabase
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
      incidents: {
        Row: {
          id: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'investigating' | 'identified' | 'resolving' | 'resolved'
          reported_at: string
          assigned_to: string
          assigned_role: string
          affected_systems: string[]
          impact_level: 'low' | 'medium' | 'high'
          estimated_resolution: string
          updates: number
          watchers: number
          playbook: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'investigating' | 'identified' | 'resolving' | 'resolved'
          reported_at: string
          assigned_to: string
          assigned_role: string
          affected_systems: string[]
          impact_level: 'low' | 'medium' | 'high'
          estimated_resolution: string
          updates: number
          watchers: number
          playbook: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'investigating' | 'identified' | 'resolving' | 'resolved'
          reported_at?: string
          assigned_to?: string
          assigned_role?: string
          affected_systems?: string[]
          impact_level?: 'low' | 'medium' | 'high'
          estimated_resolution?: string
          updates?: number
          watchers?: number
          playbook?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      incident_playbooks: {
        Row: {
          id: string
          name: string
          category: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          estimated_time: string
          last_used: string
          usage_count: number
          steps: number
          roles: string[]
          description: string
          triggers: string[]
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          estimated_time: string
          last_used: string
          usage_count: number
          steps: number
          roles: string[]
          description: string
          triggers: string[]
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          estimated_time?: string
          last_used?: string
          usage_count?: number
          steps?: number
          roles?: string[]
          description?: string
          triggers?: string[]
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      bcp_plans: {
        Row: {
          id: string
          name: string
          type: string
          status: 'tested' | 'updated' | 'scheduled' | 'expired'
          last_tested: string
          next_test: string
          rto: string
          rpo: string
          coverage: number
          critical_systems: string[]
          test_results: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          status: 'tested' | 'updated' | 'scheduled' | 'expired'
          last_tested: string
          next_test: string
          rto: string
          rpo: string
          coverage: number
          critical_systems: string[]
          test_results: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          status?: 'tested' | 'updated' | 'scheduled' | 'expired'
          last_tested?: string
          next_test?: string
          rto?: string
          rpo?: string
          coverage?: number
          critical_systems?: string[]
          test_results?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      risks: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          probability: 'low' | 'medium' | 'high'
          impact: 'low' | 'medium' | 'high' | 'critical'
          risk_score: number
          level: 'low' | 'medium' | 'high' | 'critical'
          owner: string
          owner_role: string
          status: 'active' | 'mitigated' | 'accepted' | 'transferred'
          trend: 'increasing' | 'stable' | 'decreasing'
          last_review: string
          next_review: string
          controls: string[]
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          probability: 'low' | 'medium' | 'high'
          impact: 'low' | 'medium' | 'high' | 'critical'
          risk_score: number
          level: 'low' | 'medium' | 'high' | 'critical'
          owner: string
          owner_role: string
          status: 'active' | 'mitigated' | 'accepted' | 'transferred'
          trend: 'increasing' | 'stable' | 'decreasing'
          last_review: string
          next_review: string
          controls: string[]
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          probability?: 'low' | 'medium' | 'high'
          impact?: 'low' | 'medium' | 'high' | 'critical'
          risk_score?: number
          level?: 'low' | 'medium' | 'high' | 'critical'
          owner?: string
          owner_role?: string
          status?: 'active' | 'mitigated' | 'accepted' | 'transferred'
          trend?: 'increasing' | 'stable' | 'decreasing'
          last_review?: string
          next_review?: string
          controls?: string[]
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          category: string
          criticality: 'low' | 'medium' | 'high' | 'critical'
          risk_level: 'low' | 'medium' | 'high'
          contract_value: string
          last_assessment: string
          next_assessment: string
          compliance_score: number
          status: 'active' | 'review' | 'expired'
          certifications: string[]
          pending_actions: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          criticality: 'low' | 'medium' | 'high' | 'critical'
          risk_level: 'low' | 'medium' | 'high'
          contract_value: string
          last_assessment: string
          next_assessment: string
          compliance_score: number
          status: 'active' | 'review' | 'expired'
          certifications: string[]
          pending_actions: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          criticality?: 'low' | 'medium' | 'high' | 'critical'
          risk_level?: 'low' | 'medium' | 'high'
          contract_value?: string
          last_assessment?: string
          next_assessment?: string
          compliance_score?: number
          status?: 'active' | 'review' | 'expired'
          certifications?: string[]
          pending_actions?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      risk_assessments: {
        Row: {
          id: string
          vendor: string
          template: string
          status: 'sent' | 'in_progress' | 'completed' | 'overdue'
          progress: number
          sent_date: string
          due_date: string
          completed_questions: number
          total_questions: number
          risk_flags: number
          contact_person: string
          contact_email: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          vendor: string
          template: string
          status: 'sent' | 'in_progress' | 'completed' | 'overdue'
          progress: number
          sent_date: string
          due_date: string
          completed_questions: number
          total_questions: number
          risk_flags: number
          contact_person: string
          contact_email: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          vendor?: string
          template?: string
          status?: 'sent' | 'in_progress' | 'completed' | 'overdue'
          progress?: number
          sent_date?: string
          due_date?: string
          completed_questions?: number
          total_questions?: number
          risk_flags?: number
          contact_person?: string
          contact_email?: string
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

-- Tabelas de Incidentes
CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  severity VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'investigating',
  reported_at VARCHAR,
  assigned_to VARCHAR,
  assigned_role VARCHAR,
  affected_systems TEXT[], -- Array de sistemas
  impact_level VARCHAR,
  estimated_resolution VARCHAR,
  updates INTEGER DEFAULT 0,
  watchers INTEGER DEFAULT 0,
  playbook VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE incident_playbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  severity VARCHAR NOT NULL,
  estimated_time VARCHAR,
  last_used VARCHAR,
  usage_count INTEGER DEFAULT 0,
  steps INTEGER DEFAULT 0,
  roles TEXT[], -- Array de roles
  description TEXT,
  triggers TEXT[], -- Array de triggers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bcp_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'scheduled',
  last_tested VARCHAR,
  next_test VARCHAR,
  rto VARCHAR,
  rpo VARCHAR,
  coverage INTEGER DEFAULT 0,
  critical_systems TEXT[], -- Array de sistemas críticos
  test_results TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para tabelas de incidentes
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bcp_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para incidentes
CREATE POLICY "Users can view incidents" ON incidents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert incidents" ON incidents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update incidents" ON incidents FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view incident_playbooks" ON incident_playbooks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert incident_playbooks" ON incident_playbooks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update incident_playbooks" ON incident_playbooks FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view bcp_plans" ON bcp_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert bcp_plans" ON bcp_plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update bcp_plans" ON bcp_plans FOR UPDATE USING (auth.role() = 'authenticated');

-- Tabelas de Riscos
CREATE TABLE risks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  probability VARCHAR NOT NULL,
  impact VARCHAR NOT NULL,
  risk_score INTEGER NOT NULL,
  level VARCHAR NOT NULL,
  owner VARCHAR NOT NULL,
  owner_role VARCHAR,
  status VARCHAR DEFAULT 'active',
  trend VARCHAR DEFAULT 'stable',
  last_review VARCHAR,
  next_review VARCHAR,
  controls TEXT[], -- Array de controles
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  criticality VARCHAR NOT NULL,
  risk_level VARCHAR NOT NULL,
  contract_value VARCHAR,
  last_assessment VARCHAR,
  next_assessment VARCHAR,
  compliance_score INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'active',
  certifications TEXT[], -- Array de certificações
  pending_actions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE risk_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor VARCHAR NOT NULL,
  template VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'sent',
  progress INTEGER DEFAULT 0,
  sent_date VARCHAR,
  due_date VARCHAR,
  completed_questions INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  risk_flags INTEGER DEFAULT 0,
  contact_person VARCHAR,
  contact_email VARCHAR,
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
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view risks" ON risks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert risks" ON risks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update risks" ON risks FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view vendors" ON vendors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert vendors" ON vendors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update vendors" ON vendors FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view risk_assessments" ON risk_assessments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert risk_assessments" ON risk_assessments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update risk_assessments" ON risk_assessments FOR UPDATE USING (auth.role() = 'authenticated');

-- Access Management Tables (Added for Access Reviews module)
CREATE TABLE IF NOT EXISTS access_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('draft', 'active', 'completed')) DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  systems TEXT[] DEFAULT ARRAY[]::TEXT[],
  reviewers TEXT[] DEFAULT ARRAY[]::TEXT[],
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_users INTEGER DEFAULT 0,
  certified_users INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  type VARCHAR NOT NULL CHECK (type IN ('saas', 'on-premise', 'cloud')),
  users_count INTEGER DEFAULT 0,
  last_review DATE,
  risk_level VARCHAR NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  compliance_status VARCHAR NOT NULL CHECK (compliance_status IN ('compliant', 'non-compliant', 'unknown')) DEFAULT 'unknown',
  integration_status VARCHAR NOT NULL CHECK (integration_status IN ('connected', 'disconnected', 'error')) DEFAULT 'disconnected',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_anomalies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  user_name VARCHAR NOT NULL,
  system_name VARCHAR NOT NULL,
  anomaly_type VARCHAR NOT NULL CHECK (anomaly_type IN ('excessive_privileges', 'unused_access', 'suspicious_activity', 'policy_violation')),
  severity VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')) DEFAULT 'open',
  assigned_to VARCHAR,
  resolution_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Access Management
CREATE INDEX IF NOT EXISTS idx_access_campaigns_status ON access_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_access_campaigns_dates ON access_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_system_inventory_type ON system_inventory(type);
CREATE INDEX IF NOT EXISTS idx_system_inventory_risk_level ON system_inventory(risk_level);
CREATE INDEX IF NOT EXISTS idx_access_anomalies_status ON access_anomalies(status);
CREATE INDEX IF NOT EXISTS idx_access_anomalies_severity ON access_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_access_anomalies_detected_at ON access_anomalies(detected_at);
*/