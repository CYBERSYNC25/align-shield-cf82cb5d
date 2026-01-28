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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          severity?: string
          status?: string
          system_name?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_anomalies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          org_id: string | null
          properties: Json | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          org_id?: string | null
          properties?: Json | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          org_id?: string | null
          properties?: Json | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_library: {
        Row: {
          applies_to_frameworks: string[] | null
          created_at: string
          id: string
          is_approved: boolean | null
          last_used: string | null
          org_id: string | null
          question_keywords: string[]
          question_pattern: string | null
          standard_answer: string
          tags: string[] | null
          updated_at: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          applies_to_frameworks?: string[] | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          last_used?: string | null
          org_id?: string | null
          question_keywords: string[]
          question_pattern?: string | null
          standard_answer: string
          tags?: string[] | null
          updated_at?: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          applies_to_frameworks?: string[] | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          last_used?: string | null
          org_id?: string | null
          question_keywords?: string[]
          question_pattern?: string | null
          standard_answer?: string
          tags?: string[] | null
          updated_at?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_library_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_revoked: boolean | null
          key_hash: string
          key_prefix: string
          last_minute_reset: string | null
          last_request_at: string | null
          name: string
          org_id: string | null
          rate_limit_tier: string | null
          requests_this_minute: number | null
          requests_today: number | null
          revoked_at: string | null
          scopes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean | null
          key_hash: string
          key_prefix: string
          last_minute_reset?: string | null
          last_request_at?: string | null
          name: string
          org_id?: string | null
          rate_limit_tier?: string | null
          requests_this_minute?: number | null
          requests_today?: number | null
          revoked_at?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_minute_reset?: string | null
          last_request_at?: string | null
          name?: string
          org_id?: string | null
          rate_limit_tier?: string | null
          requests_this_minute?: number | null
          requests_today?: number | null
          revoked_at?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auditor_access_tokens: {
        Row: {
          access_count: number | null
          audit_type: string | null
          auditor_email: string | null
          auditor_name: string | null
          company_name: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_revoked: boolean | null
          last_accessed_at: string | null
          org_id: string | null
          permissions: Json | null
          token: string | null
          token_hash: string | null
          user_id: string
        }
        Insert: {
          access_count?: number | null
          audit_type?: string | null
          auditor_email?: string | null
          auditor_name?: string | null
          company_name?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_revoked?: boolean | null
          last_accessed_at?: string | null
          org_id?: string | null
          permissions?: Json | null
          token?: string | null
          token_hash?: string | null
          user_id: string
        }
        Update: {
          access_count?: number | null
          audit_type?: string | null
          auditor_email?: string | null
          auditor_name?: string | null
          company_name?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_revoked?: boolean | null
          last_accessed_at?: string | null
          org_id?: string | null
          permissions?: Json | null
          token?: string | null
          token_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditor_access_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          auditor: string | null
          created_at: string
          end_date: string | null
          framework: string
          id: string
          name: string
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          rpo?: string | null
          rto?: string | null
          status?: string
          systems?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bcp_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          expires_at: string | null
          id: string
          ip_address: string
          is_permanent: boolean
          metadata: Json | null
          reason: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          is_permanent?: boolean
          metadata?: Json | null
          reason: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_permanent?: boolean
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      cache_store: {
        Row: {
          created_at: string | null
          expires_at: string
          key: string
          org_id: string | null
          user_id: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          key: string
          org_id?: string | null
          user_id?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          key?: string
          org_id?: string | null
          user_id?: string | null
          value?: Json
        }
        Relationships: []
      }
      compliance_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_items: Json | null
          affected_resources: number | null
          created_at: string | null
          external_ticket_id: string | null
          external_ticket_url: string | null
          id: string
          integration_name: string
          is_overdue: boolean | null
          metadata: Json | null
          new_status: string
          org_id: string | null
          overdue_notified_at: string | null
          previous_status: string
          remediation_deadline: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          rule_id: string
          rule_title: string
          severity: string
          sla_hours: number | null
          time_to_resolve_hours: number | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_items?: Json | null
          affected_resources?: number | null
          created_at?: string | null
          external_ticket_id?: string | null
          external_ticket_url?: string | null
          id?: string
          integration_name: string
          is_overdue?: boolean | null
          metadata?: Json | null
          new_status: string
          org_id?: string | null
          overdue_notified_at?: string | null
          previous_status: string
          remediation_deadline?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id: string
          rule_title: string
          severity: string
          sla_hours?: number | null
          time_to_resolve_hours?: number | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_items?: Json | null
          affected_resources?: number | null
          created_at?: string | null
          external_ticket_id?: string | null
          external_ticket_url?: string | null
          id?: string
          integration_name?: string
          is_overdue?: boolean | null
          metadata?: Json | null
          new_status?: string
          org_id?: string | null
          overdue_notified_at?: string | null
          previous_status?: string
          remediation_deadline?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string
          rule_title?: string
          severity?: string
          sla_hours?: number | null
          time_to_resolve_hours?: number | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_check_history: {
        Row: {
          check_type: string
          created_at: string | null
          drift_details: Json | null
          drift_detected: boolean | null
          failing_count: number | null
          id: string
          integrations_checked: Json | null
          org_id: string | null
          passing_count: number | null
          risk_accepted_count: number | null
          rules_results: Json | null
          score: number | null
          total_rules_checked: number | null
          triggered_by: string | null
          user_id: string
        }
        Insert: {
          check_type?: string
          created_at?: string | null
          drift_details?: Json | null
          drift_detected?: boolean | null
          failing_count?: number | null
          id?: string
          integrations_checked?: Json | null
          org_id?: string | null
          passing_count?: number | null
          risk_accepted_count?: number | null
          rules_results?: Json | null
          score?: number | null
          total_rules_checked?: number | null
          triggered_by?: string | null
          user_id: string
        }
        Update: {
          check_type?: string
          created_at?: string | null
          drift_details?: Json | null
          drift_detected?: boolean | null
          failing_count?: number | null
          id?: string
          integrations_checked?: Json | null
          org_id?: string | null
          passing_count?: number | null
          risk_accepted_count?: number | null
          rules_results?: Json | null
          score?: number | null
          total_rules_checked?: number | null
          triggered_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_check_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
          {
            foreignKeyName: "control_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
          {
            foreignKeyName: "control_tests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
          {
            foreignKeyName: "controls_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_compliance_tests: {
        Row: {
          avg_execution_time_ms: number | null
          created_at: string
          created_by: string | null
          enabled: boolean
          execution_count: number | null
          id: string
          integration_name: string
          last_error: string | null
          last_run_at: string | null
          org_id: string | null
          resource_type: string
          severity: string
          sla_hours: number | null
          test_description: string | null
          test_logic: Json
          test_name: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          avg_execution_time_ms?: number | null
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          execution_count?: number | null
          id?: string
          integration_name: string
          last_error?: string | null
          last_run_at?: string | null
          org_id?: string | null
          resource_type: string
          severity?: string
          sla_hours?: number | null
          test_description?: string | null
          test_logic?: Json
          test_name: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          avg_execution_time_ms?: number | null
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          execution_count?: number | null
          id?: string
          integration_name?: string
          last_error?: string | null
          last_run_at?: string | null
          org_id?: string | null
          resource_type?: string
          severity?: string
          sla_hours?: number | null
          test_description?: string | null
          test_logic?: Json
          test_name?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_compliance_tests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_test_results: {
        Row: {
          affected_resources_count: number | null
          error_message: string | null
          executed_at: string
          execution_time_ms: number | null
          id: string
          org_id: string | null
          result_details: Json | null
          status: string
          test_id: string
          triggered_by: string | null
          user_id: string
        }
        Insert: {
          affected_resources_count?: number | null
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          id?: string
          org_id?: string | null
          result_details?: Json | null
          status: string
          test_id: string
          triggered_by?: string | null
          user_id: string
        }
        Update: {
          affected_resources_count?: number | null
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          id?: string
          org_id?: string | null
          result_details?: Json | null
          status?: string
          test_id?: string
          triggered_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_test_results_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "custom_compliance_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      data_classification: {
        Row: {
          classification_level: Database["public"]["Enums"]["data_classification_level"]
          column_name: string
          created_at: string
          description: string | null
          id: string
          mask_pattern: string | null
          pii_type: string | null
          requires_audit: boolean
          retention_days: number | null
          table_name: string
          updated_at: string
        }
        Insert: {
          classification_level: Database["public"]["Enums"]["data_classification_level"]
          column_name: string
          created_at?: string
          description?: string | null
          id?: string
          mask_pattern?: string | null
          pii_type?: string | null
          requires_audit?: boolean
          retention_days?: number | null
          table_name: string
          updated_at?: string
        }
        Update: {
          classification_level?: Database["public"]["Enums"]["data_classification_level"]
          column_name?: string
          created_at?: string
          description?: string | null
          id?: string
          mask_pattern?: string | null
          pii_type?: string | null
          requires_audit?: boolean
          retention_days?: number | null
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          request_type: string
          requested_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          request_type: string
          requested_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          request_type?: string
          requested_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string | null
          router_name: string
          user_id: string | null
          version: string
        }
        Insert: {
          cpu_usage: number
          created_at?: string | null
          device_id: string
          id?: string
          org_id?: string | null
          router_name: string
          user_id?: string | null
          version: string
        }
        Update: {
          cpu_usage?: number
          created_at?: string | null
          device_id?: string
          id?: string
          org_id?: string | null
          router_name?: string
          user_id?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_key_history: {
        Row: {
          algorithm: string
          created_at: string
          deprecated_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_version: number
          rotated_at: string | null
        }
        Insert: {
          algorithm?: string
          created_at?: string
          deprecated_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_version: number
          rotated_at?: string | null
        }
        Update: {
          algorithm?: string
          created_at?: string
          deprecated_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_version?: number
          rotated_at?: string | null
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
          {
            foreignKeyName: "evidence_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          bucket: string
          created_at: string
          detected_type: string
          exif_stripped: boolean | null
          expires_at: string | null
          file_hash: string
          id: string
          mime_type: string
          org_id: string | null
          original_name: string
          size_bytes: number
          storage_path: string
          user_id: string
          validated_at: string
        }
        Insert: {
          bucket: string
          created_at?: string
          detected_type: string
          exif_stripped?: boolean | null
          expires_at?: string | null
          file_hash: string
          id?: string
          mime_type: string
          org_id?: string | null
          original_name: string
          size_bytes: number
          storage_path: string
          user_id: string
          validated_at?: string
        }
        Update: {
          bucket?: string
          created_at?: string
          detected_type?: string
          exif_stripped?: boolean | null
          expires_at?: string | null
          file_hash?: string
          id?: string
          mime_type?: string
          org_id?: string | null
          original_name?: string
          size_bytes?: number
          storage_path?: string
          user_id?: string
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          passed_controls?: number | null
          status?: string
          total_controls?: number | null
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frameworks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          roles?: string[] | null
          severity?: string
          steps?: number | null
          triggers?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_playbooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          affected_systems: string[] | null
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_collected_data: {
        Row: {
          collected_at: string | null
          expires_at: string | null
          id: string
          integration_name: string
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          resource_data?: Json
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_collected_data_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_evidence_mapping_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_evidence_mapping_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          last_used_at: string | null
          metadata: Json | null
          org_id: string | null
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
          last_used_at?: string | null
          metadata?: Json | null
          org_id?: string | null
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
          last_used_at?: string | null
          metadata?: Json | null
          org_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_oauth_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          status?: string
          total_webhooks?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_status_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhooks: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          integration_name: string
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          configuration: Json | null
          created_at: string
          id: string
          last_sync_at: string | null
          last_used_at: string | null
          name: string
          org_id: string | null
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
          last_used_at?: string | null
          name: string
          org_id?: string | null
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
          last_used_at?: string | null
          name?: string
          org_id?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          last_error_at: string | null
          max_attempts: number
          metadata: Json | null
          org_id: string | null
          payload: Json
          priority: number
          result: Json | null
          scheduled_for: string
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          last_error_at?: string | null
          max_attempts?: number
          metadata?: Json | null
          org_id?: string | null
          payload?: Json
          priority?: number
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          last_error_at?: string | null
          max_attempts?: number
          metadata?: Json | null
          org_id?: string | null
          payload?: Json
          priority?: number
          result?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_queue_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          alert_critical_issue: Json | null
          alert_new_user: Json | null
          alert_score_drop: Json | null
          alert_score_drop_threshold: number | null
          alert_sla_expiring: Json | null
          alert_sync_failed: Json | null
          alert_weekly_report: Json | null
          created_at: string | null
          digest_daily_enabled: boolean | null
          digest_day_of_week: number | null
          digest_time: string | null
          digest_weekly_enabled: boolean | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          org_id: string
          slack_enabled: boolean | null
          slack_webhook_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_critical_issue?: Json | null
          alert_new_user?: Json | null
          alert_score_drop?: Json | null
          alert_score_drop_threshold?: number | null
          alert_sla_expiring?: Json | null
          alert_sync_failed?: Json | null
          alert_weekly_report?: Json | null
          created_at?: string | null
          digest_daily_enabled?: boolean | null
          digest_day_of_week?: number | null
          digest_time?: string | null
          digest_weekly_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          org_id: string
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_critical_issue?: Json | null
          alert_new_user?: Json | null
          alert_score_drop?: Json | null
          alert_score_drop_threshold?: number | null
          alert_sla_expiring?: Json | null
          alert_sync_failed?: Json | null
          alert_weekly_report?: Json | null
          created_at?: string | null
          digest_daily_enabled?: boolean | null
          digest_day_of_week?: number | null
          digest_time?: string | null
          digest_weekly_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          org_id?: string
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          priority?: string
          read?: boolean
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      object_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          object_id: string
          object_type: string
          org_id: string | null
          permission_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          object_id: string
          object_type: string
          org_id?: string | null
          permission_level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          object_id?: string
          object_type?: string
          org_id?: string | null
          permission_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      outbound_webhook_logs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          status: string
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          status?: string
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          status?: string
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "outbound_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_webhooks: {
        Row: {
          created_at: string | null
          custom_headers: Json | null
          enabled: boolean | null
          events: string[] | null
          failure_count: number | null
          id: string
          last_triggered_at: string | null
          name: string
          org_id: string
          secret: string | null
          success_count: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          custom_headers?: Json | null
          enabled?: boolean | null
          events?: string[] | null
          failure_count?: number | null
          id?: string
          last_triggered_at?: string | null
          name: string
          org_id: string
          secret?: string | null
          success_count?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          custom_headers?: Json | null
          enabled?: boolean | null
          events?: string[] | null
          failure_count?: number | null
          id?: string
          last_triggered_at?: string | null
          name?: string
          org_id?: string
          secret?: string | null
          success_count?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_webhooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_access_audit: {
        Row: {
          access_context: Json | null
          access_reason: string | null
          action: string
          created_at: string
          id: string
          ip_address: string | null
          org_id: string | null
          pii_fields: string[]
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_context?: Json | null
          access_reason?: string | null
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          org_id?: string | null
          pii_fields: string[]
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_context?: Json | null
          access_reason?: string | null
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          org_id?: string | null
          pii_fields?: string[]
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pii_access_audit_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          owner?: string | null
          review_date?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          version?: string
          version_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          deletion_scheduled_for: string | null
          display_name: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_data: Json | null
          onboarding_skipped: boolean | null
          onboarding_step: number | null
          org_id: string | null
          organization: string | null
          role: string | null
          role_in_org: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_scheduled_for?: string | null
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_data?: Json | null
          onboarding_skipped?: boolean | null
          onboarding_step?: number | null
          org_id?: string | null
          organization?: string | null
          role?: string | null
          role_in_org?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_scheduled_for?: string | null
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_data?: Json | null
          onboarding_skipped?: boolean | null
          onboarding_step?: number | null
          org_id?: string | null
          organization?: string | null
          role?: string | null
          role_in_org?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_questions: {
        Row: {
          ai_reasoning: string | null
          answer_status: string | null
          answer_text: string | null
          category: string | null
          confidence_score: number | null
          created_at: string
          evidence_links: string[] | null
          id: string
          question_number: string
          question_text: string
          question_type: string | null
          questionnaire_id: string
          related_controls: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          answer_status?: string | null
          answer_text?: string | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          evidence_links?: string[] | null
          id?: string
          question_number: string
          question_text: string
          question_type?: string | null
          questionnaire_id: string
          related_controls?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          answer_status?: string | null
          answer_text?: string | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          evidence_links?: string[] | null
          id?: string
          question_number?: string
          question_text?: string
          question_type?: string | null
          questionnaire_id?: string
          related_controls?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_questions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "security_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          org_id: string | null
          questions_data: Json
          template_type: string
          total_questions: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          org_id?: string | null
          questions_data?: Json
          template_type: string
          total_questions?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          org_id?: string | null
          questions_data?: Json
          template_type?: string
          total_questions?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      remediation_tickets: {
        Row: {
          alert_id: string | null
          assigned_to: string | null
          created_at: string | null
          external_system: string
          external_ticket_id: string
          external_ticket_url: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          resolved_at: string | null
          rule_id: string
          ticket_status: string | null
          ticket_title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          external_system: string
          external_ticket_id: string
          external_ticket_url?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          resolved_at?: string | null
          rule_id: string
          ticket_status?: string | null
          ticket_title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          external_system?: string
          external_ticket_id?: string
          external_ticket_url?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          resolved_at?: string | null
          rule_id?: string
          ticket_status?: string | null
          ticket_title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remediation_tickets_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "compliance_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remediation_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_acceptances: {
        Row: {
          accepted_by: string
          approval_status: string | null
          approved_at: string | null
          approver_id: string | null
          created_at: string | null
          duration: string
          expires_at: string | null
          id: string
          integration_name: string
          justification: string
          org_id: string | null
          rejection_reason: string | null
          requires_approval: boolean | null
          resource_id: string | null
          resource_type: string
          rule_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_by: string
          approval_status?: string | null
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string | null
          duration: string
          expires_at?: string | null
          id?: string
          integration_name: string
          justification: string
          org_id?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          resource_id?: string | null
          resource_type: string
          rule_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_by?: string
          approval_status?: string | null
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string | null
          duration?: string
          expires_at?: string | null
          id?: string
          integration_name?: string
          justification?: string
          org_id?: string | null
          rejection_reason?: string | null
          requires_approval?: boolean | null
          resource_id?: string | null
          resource_type?: string
          rule_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_acceptances_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_approval_policies: {
        Row: {
          approver_roles: string[] | null
          created_at: string | null
          id: string
          max_auto_approve_duration: string | null
          min_severity: string
          org_id: string | null
          require_approval_for_permanent: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approver_roles?: string[] | null
          created_at?: string | null
          id?: string
          max_auto_approve_duration?: string | null
          min_severity?: string
          org_id?: string | null
          require_approval_for_permanent?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approver_roles?: string[] | null
          created_at?: string | null
          id?: string
          max_auto_approve_duration?: string | null
          min_severity?: string
          org_id?: string | null
          require_approval_for_permanent?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_approval_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          completed_questions: number | null
          contact_email: string | null
          contact_person: string | null
          created_at: string
          due_date: string | null
          id: string
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
            foreignKeyName: "risk_assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "risks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_questionnaires: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          name: string
          notes: string | null
          org_id: string | null
          questions_count: number | null
          requester_email: string | null
          requester_name: string | null
          shared_with: string[] | null
          source: string
          status: string
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id?: string | null
          questions_count?: number | null
          requester_email?: string | null
          requester_name?: string | null
          shared_with?: string[] | null
          source: string
          status?: string
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string | null
          questions_count?: number | null
          requester_email?: string | null
          requester_name?: string | null
          shared_with?: string[] | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_questionnaires_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suspicious_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          details: Json | null
          endpoint: string | null
          id: string
          ip_address: string
          request_count: number | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          id?: string
          ip_address: string
          request_count?: number | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          id?: string
          ip_address?: string
          request_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action_category: string
          action_type: string
          created_at: string | null
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          org_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_category: string
          action_type: string
          created_at?: string | null
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_category?: string
          action_type?: string
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          component_name: string | null
          created_at: string
          function_name: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          org_id: string | null
          request_id: string | null
          source: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          function_name?: string | null
          id?: string
          level: string
          message: string
          metadata?: Json | null
          org_id?: string | null
          request_id?: string | null
          source: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          function_name?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          org_id?: string | null
          request_id?: string | null
          source?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_center_frameworks: {
        Row: {
          certificate_url: string | null
          certification_date: string | null
          created_at: string | null
          display_name: string | null
          framework_id: string
          id: string
          org_id: string | null
          show_public: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          certification_date?: string | null
          created_at?: string | null
          display_name?: string | null
          framework_id: string
          id?: string
          org_id?: string | null
          show_public?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          certification_date?: string | null
          created_at?: string | null
          display_name?: string | null
          framework_id?: string
          id?: string
          org_id?: string | null
          show_public?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_center_frameworks_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_center_frameworks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_center_settings: {
        Row: {
          company_slug: string
          created_at: string | null
          custom_domain: string | null
          custom_message: string | null
          enabled: boolean
          id: string
          logo_url: string | null
          org_id: string | null
          primary_color: string | null
          seo_description: string | null
          seo_title: string | null
          show_controls: boolean
          show_frameworks: boolean
          show_last_audit: boolean
          show_score: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_slug: string
          created_at?: string | null
          custom_domain?: string | null
          custom_message?: string | null
          enabled?: boolean
          id?: string
          logo_url?: string | null
          org_id?: string | null
          primary_color?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_controls?: boolean
          show_frameworks?: boolean
          show_last_audit?: boolean
          show_score?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_slug?: string
          created_at?: string | null
          custom_domain?: string | null
          custom_message?: string | null
          enabled?: boolean
          id?: string
          logo_url?: string | null
          org_id?: string | null
          primary_color?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_controls?: boolean
          show_frameworks?: boolean
          show_last_audit?: boolean
          show_score?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_center_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes_encrypted: string | null
          backup_codes_used: number | null
          created_at: string
          enabled_at: string | null
          id: string
          last_used_at: string | null
          recovery_email: string | null
          secret_encrypted: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes_encrypted?: string | null
          backup_codes_used?: number | null
          created_at?: string
          enabled_at?: string | null
          id?: string
          last_used_at?: string | null
          recovery_email?: string | null
          secret_encrypted: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes_encrypted?: string | null
          backup_codes_used?: number | null
          created_at?: string
          enabled_at?: string | null
          id?: string
          last_used_at?: string | null
          recovery_email?: string | null
          secret_encrypted?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_info: string
          device_type: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_active_at: string
          org_id: string | null
          os: string | null
          os_version: string | null
          revoked: boolean | null
          revoked_at: string | null
          revoked_reason: string | null
          session_token_hash: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_info?: string
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string
          org_id?: string | null
          os?: string | null
          os_version?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_reason?: string | null
          session_token_hash?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_info?: string
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string
          org_id?: string | null
          os?: string | null
          os_version?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_reason?: string | null
          session_token_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          pending_actions?: number | null
          risk_level?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      integration_oauth_tokens_safe: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string | null
          integration_name: string | null
          last_used_at: string | null
          org_id: string | null
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          integration_name?: string | null
          last_used_at?: string | null
          org_id?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          integration_name?: string | null
          last_used_at?: string | null
          org_id?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_oauth_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_safe: {
        Row: {
          created_at: string | null
          id: string | null
          last_sync_at: string | null
          last_used_at: string | null
          name: string | null
          org_id: string | null
          provider: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          last_used_at?: string | null
          name?: string | null
          org_id?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          last_used_at?: string | null
          name?: string | null
          org_id?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_center_public_data: {
        Row: {
          company_slug: string | null
          compliance_score: number | null
          controls_summary: Json | null
          custom_domain: string | null
          custom_message: string | null
          last_audit: Json | null
          last_updated: string | null
          logo_url: string | null
          primary_color: string | null
          public_frameworks: Json | null
          seo_description: string | null
          seo_title: string | null
          show_controls: boolean | null
          show_frameworks: boolean | null
          show_last_audit: boolean | null
          show_score: boolean | null
        }
        Insert: {
          company_slug?: string | null
          compliance_score?: never
          controls_summary?: never
          custom_domain?: string | null
          custom_message?: string | null
          last_audit?: never
          last_updated?: string | null
          logo_url?: string | null
          primary_color?: string | null
          public_frameworks?: never
          seo_description?: string | null
          seo_title?: string | null
          show_controls?: boolean | null
          show_frameworks?: boolean | null
          show_last_audit?: boolean | null
          show_score?: boolean | null
        }
        Update: {
          company_slug?: string | null
          compliance_score?: never
          controls_summary?: never
          custom_domain?: string | null
          custom_message?: string | null
          last_audit?: never
          last_updated?: string | null
          logo_url?: string | null
          primary_color?: string | null
          public_frameworks?: never
          seo_description?: string | null
          seo_title?: string | null
          show_controls?: boolean | null
          show_frameworks?: boolean | null
          show_last_audit?: boolean | null
          show_score?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_block_suspicious_ip: {
        Args: {
          p_duration_hours?: number
          p_ip_address: string
          p_reason: string
        }
        Returns: string
      }
      calculate_next_retry: {
        Args: { p_attempts: number; p_max_attempts?: number }
        Returns: string
      }
      can_attempt_login: {
        Args: { p_email: string }
        Returns: {
          allowed: boolean
          attempts_remaining: number
          locked_until: string
        }[]
      }
      check_object_permission: {
        Args: {
          _object_id: string
          _object_type: string
          _required_level?: string
          _user_id: string
        }
        Returns: boolean
      }
      check_org_total_quota: {
        Args: { _org_id: string }
        Returns: {
          can_upload: boolean
          limit_bytes: number
          remaining_bytes: number
          used_bytes: number
        }[]
      }
      check_user_daily_quota: {
        Args: { _user_id: string }
        Returns: {
          can_upload: boolean
          limit_bytes: number
          remaining_bytes: number
          used_bytes: number
        }[]
      }
      claim_pending_jobs: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          last_error_at: string | null
          max_attempts: number
          metadata: Json | null
          org_id: string | null
          payload: Json
          priority: number
          result: Json | null
          scheduled_for: string
          started_at: string | null
          status: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "job_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_expired_blocked_ips: { Args: never; Returns: number }
      cleanup_expired_cache: { Args: never; Returns: number }
      cleanup_expired_sessions: { Args: never; Returns: number }
      cleanup_old_login_attempts: {
        Args: { p_days_to_keep?: number }
        Returns: number
      }
      cleanup_old_suspicious_logs: {
        Args: { p_days_to_keep?: number }
        Returns: number
      }
      cleanup_old_system_logs: {
        Args: { p_days_to_keep?: number }
        Returns: number
      }
      complete_job: {
        Args: { p_job_id: string; p_result?: Json }
        Returns: boolean
      }
      count_user_active_sessions: {
        Args: { p_user_id?: string }
        Returns: number
      }
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
      create_user_session: {
        Args: {
          p_browser?: string
          p_browser_version?: string
          p_city?: string
          p_country?: string
          p_country_code?: string
          p_device_info?: string
          p_device_type?: string
          p_ip_address?: string
          p_os?: string
          p_os_version?: string
          p_session_token_hash?: string
          p_user_id: string
        }
        Returns: {
          is_new_country: boolean
          is_new_device: boolean
          revoked_session_id: string
          session_id: string
        }[]
      }
      enqueue_job: {
        Args: {
          p_job_type: string
          p_metadata?: Json
          p_payload?: Json
          p_priority?: number
          p_scheduled_for?: string
        }
        Returns: string
      }
      fail_job: {
        Args: { p_error_message: string; p_job_id: string }
        Returns: boolean
      }
      field_requires_audit: {
        Args: { p_column_name: string; p_table_name: string }
        Returns: boolean
      }
      find_duplicate_file: {
        Args: { _file_hash: string; _org_id: string }
        Returns: {
          id: string
          original_name: string
          storage_path: string
        }[]
      }
      get_active_users_metrics: {
        Args: { p_org_id: string }
        Returns: {
          dau: number
          mau: number
          wau: number
        }[]
      }
      get_cache: { Args: { p_key: string }; Returns: Json }
      get_field_classification: {
        Args: { p_column_name: string; p_table_name: string }
        Returns: Database["public"]["Enums"]["data_classification_level"]
      }
      get_log_statistics: {
        Args: { p_hours?: number; p_org_id?: string }
        Returns: {
          count: number
          latest_at: string
          level: string
        }[]
      }
      get_remediation_rate: {
        Args: { p_org_id: string }
        Returns: {
          avg_time_to_remediate_hours: number
          remediated_issues: number
          remediation_rate: number
          total_issues: number
        }[]
      }
      get_time_to_first_scan: {
        Args: { p_org_id: string }
        Returns: {
          avg_hours: number
          median_hours: number
          users_scanned: number
          users_total: number
        }[]
      }
      get_top_integrations: {
        Args: { p_limit?: number; p_org_id: string }
        Returns: {
          connection_count: number
          integration_type: string
        }[]
      }
      get_trust_center_by_slug: {
        Args: { p_slug: string }
        Returns: {
          company_slug: string
          compliance_score: number
          controls_summary: Json
          custom_domain: string
          custom_message: string
          last_audit: Json
          last_updated: string
          logo_url: string
          primary_color: string
          public_frameworks: Json
          seo_description: string
          seo_title: string
          show_controls: boolean
          show_frameworks: boolean
          show_last_audit: boolean
          show_score: boolean
        }[]
      }
      get_user_active_sessions: {
        Args: { p_user_id?: string }
        Returns: {
          browser: string
          browser_version: string
          city: string
          country: string
          country_code: string
          created_at: string
          device_info: string
          device_type: string
          id: string
          ip_address: string
          is_current: boolean
          last_active_at: string
          os: string
        }[]
      }
      get_user_object_permissions: {
        Args: { _user_id: string }
        Returns: {
          expires_at: string
          id: string
          object_id: string
          object_type: string
          permission_level: string
        }[]
      }
      get_user_org_id: { Args: { _user_id?: string }; Returns: string }
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
      invalidate_cache: { Args: { p_key_pattern: string }; Returns: number }
      is_ip_blocked: { Args: { p_ip_address: string }; Returns: boolean }
      is_object_owner: {
        Args: { _object_id: string; _object_type: string; _user_id: string }
        Returns: boolean
      }
      is_session_active: { Args: { p_session_id: string }; Returns: boolean }
      log_pii_access: {
        Args: {
          p_access_reason?: string
          p_action: string
          p_context?: Json
          p_ip_address?: string
          p_org_id: string
          p_pii_fields: string[]
          p_resource_id: string
          p_resource_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      record_login_attempt: {
        Args: {
          p_email: string
          p_failure_reason?: string
          p_ip_address?: string
          p_success: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
      reset_stuck_jobs: { Args: never; Returns: number }
      revoke_all_other_sessions: {
        Args: { p_current_session_id: string }
        Returns: number
      }
      revoke_session: {
        Args: { p_reason?: string; p_session_id: string }
        Returns: boolean
      }
      role_requires_mfa: { Args: { _user_id: string }; Returns: boolean }
      search_answer_library: {
        Args: { p_limit?: number; p_search_text: string; p_user_id: string }
        Returns: {
          applies_to_frameworks: string[]
          id: string
          question_keywords: string[]
          similarity_score: number
          standard_answer: string
        }[]
      }
      set_cache: {
        Args: {
          p_key: string
          p_org_id?: string
          p_ttl_seconds: number
          p_user_id?: string
          p_value: Json
        }
        Returns: undefined
      }
      test_rls_bypass: {
        Args: { test_org_id: string }
        Returns: {
          rows_visible: number
          status: string
          table_name: string
        }[]
      }
      update_session_activity: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      user_has_mfa_enabled: { Args: { _user_id: string }; Returns: boolean }
      validate_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          api_key_id: string
          is_valid: boolean
          org_id: string
          rate_limit_exceeded: boolean
          rate_limit_tier: string
          requests_remaining: number
          scopes: string[]
          user_id: string
        }[]
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
        | "editor"
        | "view_only_admin"
      condition_operator:
        | "equals"
        | "not_equals"
        | "greater_than"
        | "less_than"
        | "greater_than_or_equals"
        | "less_than_or_equals"
        | "contains"
        | "not_contains"
        | "regex_match"
        | "is_empty"
        | "is_not_empty"
        | "in_array"
        | "not_in_array"
        | "starts_with"
        | "ends_with"
      data_classification_level:
        | "public"
        | "internal"
        | "confidential"
        | "restricted"
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
        "editor",
        "view_only_admin",
      ],
      condition_operator: [
        "equals",
        "not_equals",
        "greater_than",
        "less_than",
        "greater_than_or_equals",
        "less_than_or_equals",
        "contains",
        "not_contains",
        "regex_match",
        "is_empty",
        "is_not_empty",
        "in_array",
        "not_in_array",
        "starts_with",
        "ends_with",
      ],
      data_classification_level: [
        "public",
        "internal",
        "confidential",
        "restricted",
      ],
    },
  },
} as const
