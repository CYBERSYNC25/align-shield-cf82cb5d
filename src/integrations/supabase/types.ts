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
      policies: {
        Row: {
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
        }
        Insert: {
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
        }
        Update: {
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
