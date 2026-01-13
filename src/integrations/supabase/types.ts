export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_anomalies: {
        Row: {
          anomaly_type: string
          assigned_to: string | null
          created_at: string
          description: string
          detected_at: string
          id: string
          severity: string
          status: string
          system_name: string
          updated_at: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          anomaly_type: string
          assigned_to?: string | null
          created_at?: string
          description: string
          detected_at?: string
          id?: string
          severity: string
          status?: string
          system_name: string
          updated_at?: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          anomaly_type?: string
          assigned_to?: string | null
          created_at?: string
          description?: string
          detected_at?: string
          id?: string
          severity?: string
          status?: string
          system_name?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audits: {
        Row: {
          auditor: string | null
          created_at: string
          end_date: string | null
          framework: string
          id: string
          name: string
          progress: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auditor?: string | null
          created_at?: string
          end_date?: string | null
          framework: string
          id?: string
          name: string
          progress?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auditor?: string | null
          created_at?: string
          end_date?: string | null
          framework?: string
          id?: string
          name?: string
          progress?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bcp_plans: {
        Row: {
          contact_person: string | null
          coverage: number | null
          created_at: string
          description: string | null
          id: string
          last_tested: string | null
          name: string
          next_test: string | null
          rpo: string | null
          rto: string | null
          status: string
          systems: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_person?: string | null
          coverage?: number | null
          created_at?: string
          description?: string | null
          id?: string
          last_tested?: string | null
          name: string
          next_test?: string | null
          rpo?: string | null
          rto?: string | null
          status: string
          systems?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_person?: string | null
          coverage?: number | null
          created_at?: string
          description?: string | null
          id?: string
          last_tested?: string | null
          name?: string
          next_test?: string | null
          rpo?: string | null
          rto?: string | null
          status?: string
          systems?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      control_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string
          control_id: string
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to: string
          control_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string
          control_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_assignments_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      control_tests: {
        Row: {
          control_id: string
          error_message: string | null
          id: string
          next_test_date: string | null
          result_data: Json | null
          status: string
          test_name: string
          test_type: string
          tested_at: string | null
        }
        Insert: {
          control_id: string
          error_message?: string | null
          id?: string
          next_test_date?: string | null
          result_data?: Json | null
          status: string
          test_name: string
          test_type: string
          tested_at?: string | null
        }
        Update: {
          control_id?: string
          error_message?: string | null
          id?: string
          next_test_date?: string | null
          result_data?: Json | null
          status?: string
          test_name?: string
          test_type?: string
          tested_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_tests_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      controls: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          evidence_count: number | null
          findings: string[] | null
          framework_id: string | null
          id: string
          last_verified: string | null
          next_review: string | null
          owner: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          evidence_count?: number | null
          findings?: string[] | null
          framework_id?: string | null
          id?: string
          last_verified?: string | null
          next_review?: string | null
          owner?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          evidence_count?: number | null
          findings?: string[] | null
          framework_id?: string | null
          id?: string
          last_verified?: string | null
          next_review?: string | null
          owner?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controls_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      device_logs: {
        Row: {
          cpu_usage: number
          created_at: string | null
          device_id: string
          id: string
          router_name: string
          user_id: string | null
          version: string
        }
        Insert: {
          cpu_usage: number
          created_at?: string | null
          device_id: string
          id?: string
          router_name: string
          user_id?: string | null
          version: string
        }
        Update: {
          cpu_usage?: number
          created_at?: string | null
          device_id?: string
          id?: string
          router_name?: string
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      evidence: {
        Row: {
          audit_id: string | null
          created_at: string
          file_url: string | null
          id: string
          name: string
          status: string
          type: string
          updated_at: string
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          audit_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          status?: string
          type: string
          updated_at?: string
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          audit_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      frameworks: {
        Row: {
          compliance_score: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          passed_controls: number | null
          status: string
          total_controls: number | null
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          compliance_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          passed_controls?: number | null
          status?: string
          total_controls?: number | null
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          compliance_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          passed_controls?: number | null
          status?: string
          total_controls?: number | null
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      incident_playbooks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          estimated_time: string | null
          id: string
          last_used: string | null
          name: string
          roles: string[] | null
          severity: string
          steps: number | null
          triggers: string[] | null
          updated_at: string
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          estimated_time?: string | null
          id?: string
          last_used?: string | null
          name: string
          roles?: string[] | null
          severity: string
          steps?: number | null
          triggers?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_time?: string | null
          id?: string
          last_used?: string | null
          name?: string
          roles?: string[] | null
          severity?: string
          steps?: number | null
          triggers?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          affected_systems: string[] | null
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          reported_by: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          affected_systems?: string[] | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          affected_systems?: string[] | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      integration_collected_data: {
        Row: {
          collected_at: string | null
          expires_at: string | null
          id: string
          integration_name: string
          resource_data: Json
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          collected_at?: string | null
          expires_at?: string | null
          id?: string
          integration_name: string
          resource_data: Json
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          collected_at?: string | null
          expires_at?: string | null
          id?: string
          integration_name?: string
          resource_data?: Json
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_evidence_mapping: {
        Row: {
          collection_frequency: string | null
          config: Json | null
          control_id: string | null
          created_at: string | null
          evidence_type: string
          id: string
          integration_name: string
          is_active: boolean | null
          last_collected: string | null
        }
        Insert: {
          collection_frequency?: string | null
          config?: Json | null
          control_id?: string | null
          created_at?: string | null
          evidence_type: string
          id?: string
          integration_name: string
          is_active?: boolean | null
          last_collected?: string | null
        }
        Update: {
          collection_frequency?: string | null
          config?: Json | null
          control_id?: string | null
          created_at?: string | null
          evidence_type?: string
          id?: string
          integration_name?: string
          is_active?: boolean | null
          last_collected?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_evidence_mapping_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          integration_name: string
          metadata: Json | null
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          integration_name: string
          metadata?: Json | null
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          integration_name?: string
          metadata?: Json | null
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_status: {
        Row: {
          created_at: string
          failed_webhooks: number | null
          health_score: number | null
          id: string
          integration_name: string
          last_sync_at: string | null
          last_webhook_at: string | null
          metadata: Json | null
          status: string
          total_webhooks: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          failed_webhooks?: number | null
          health_score?: number | null
          id?: string
          integration_name: string
          last_sync_at?: string | null
          last_webhook_at?: string | null
          metadata?: Json | null
          status?: string
          total_webhooks?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          failed_webhooks?: number | null
          health_score?: number | null
          id?: string
          integration_name?: string
          last_sync_at?: string | null
          last_webhook_at?: string | null
          metadata?: Json | null
          status?: string
          total_webhooks?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integration_webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          integration_name: string
          payload: Json
          processed_at: string | null
          retry_count: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          integration_name: string
          payload: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          integration_name?: string
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          configuration: Json | null
          created_at: string
          id: string
          last_sync_at: string | null
          name: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          name: string
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          name?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          read: boolean
          related_id: string | null
          related_table: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          related_id?: string | null
          related_table?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          approver: string | null
          category: string
          created_at: string
          description: string | null
          effective_date: string | null
          file_url: string | null
          id: string
          name: string
          next_review: string | null
          owner: string | null
          review_date: string | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
          version: string
          version_history: Json | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approver?: string | null
          category: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          file_url?: string | null
          id?: string
          name: string
          next_review?: string | null
          owner?: string | null
          review_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          version?: string
          version_history?: Json | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approver?: string | null
          category?: string
          created_at?: string
          description?: string | null
          effective_date?: string | null
          file_url?: string | null
          id?: string
          name?: string
          next_review?: string | null
          owner?: string | null
          review_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          version?: string
          version_history?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          organization: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_acceptances: {
        Row: {
          accepted_by: string
          created_at: string | null
          duration: string
          expires_at: string | null
          id: string
          integration_name: string
          justification: string
          resource_id: string | null
          resource_type: string
          rule_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_by: string
          created_at?: string | null
          duration: string
          expires_at?: string | null
          id?: string
          integration_name: string
          justification: string
          resource_id?: string | null
          resource_type: string
          rule_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_by?: string
          created_at?: string | null
          duration?: string
          expires_at?: string | null
          id?: string
          integration_name?: string
          justification?: string
          resource_id?: string | null
          resource_type?: string
          rule_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          completed_questions: number | null
          contact_email: string | null
          contact_person: string | null
          created_at: string
          due_date: string | null
          id: string
          progress: number | null
          risk_flags: number | null
          sent_date: string | null
          status: string
          template: string
          total_questions: number | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          completed_questions?: number | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          progress?: number | null
          risk_flags?: number | null
          sent_date?: string | null
          status?: string
          template: string
          total_questions?: number | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          completed_questions?: number | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          progress?: number | null
          risk_flags?: number | null
          sent_date?: string | null
          status?: string
          template?: string
          total_questions?: number | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          category: string
          controls: string[] | null
          created_at: string
          description: string | null
          id: string
          impact: string
          last_review: string | null
          level: string
          next_review: string | null
          owner: string
          owner_role: string | null
          probability: string
          risk_score: number | null
          status: string
          title: string
          trend: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          controls?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          impact: string
          last_review?: string | null
          level: string
          next_review?: string | null
          owner: string
          owner_role?: string | null
          probability: string
          risk_score?: number | null
          status?: string
          title: string
          trend?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          controls?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          impact?: string
          last_review?: string | null
          level?: string
          next_review?: string | null
          owner?: string
          owner_role?: string | null
          probability?: string
          risk_score?: number | null
          status?: string
          title?: string
          trend?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_deletion_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          master_admin_approved_at: string | null
          master_admin_approved_by: string | null
          master_governance_approved_at: string | null
          master_governance_approved_by: string | null
          master_ti_approved_at: string | null
          master_ti_approved_by: string | null
          notes: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_at: string
          requested_by: string
          status: string
          target_user_email: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          master_admin_approved_at?: string | null
          master_admin_approved_by?: string | null
          master_governance_approved_at?: string | null
          master_governance_approved_by?: string | null
          master_ti_approved_at?: string | null
          master_ti_approved_by?: string | null
          notes?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by: string
          status?: string
          target_user_email: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          master_admin_approved_at?: string | null
          master_admin_approved_by?: string | null
          master_governance_approved_at?: string | null
          master_governance_approved_by?: string | null
          master_ti_approved_at?: string | null
          master_ti_approved_by?: string | null
          notes?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string
          status?: string
          target_user_email?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_at: string | null
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          category: string
          certifications: string[] | null
          compliance_score: number | null
          contract_value: string | null
          created_at: string
          criticality: string
          id: string
          last_assessment: string | null
          name: string
          next_assessment: string | null
          pending_actions: number | null
          risk_level: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          certifications?: string[] | null
          compliance_score?: number | null
          contract_value?: string | null
          created_at?: string
          criticality: string
          id?: string
          last_assessment?: string | null
          name: string
          next_assessment?: string | null
          pending_actions?: number | null
          risk_level: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          certifications?: string[] | null
          compliance_score?: number | null
          contract_value?: string | null
          created_at?: string
          criticality?: string
          id?: string
          last_assessment?: string | null
          name?: string
          next_assessment?: string | null
          pending_actions?: number | null
          risk_level?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_expires_at?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_related_id?: string
          p_related_table?: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "auditor"
        | "compliance_officer"
        | "viewer"
        | "master_admin"
        | "master_ti"
        | "master_governance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "auditor",
        "compliance_officer",
        "viewer",
        "master_admin",
        "master_ti",
        "master_governance",
      ],
    },
  },
} as const
