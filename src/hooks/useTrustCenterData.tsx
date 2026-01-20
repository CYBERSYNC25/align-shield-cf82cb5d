import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrustCenterFramework {
  name: string;
  display_name: string | null;
  certification_date: string | null;
  certificate_url: string | null;
  compliance_score: number | null;
  passed_controls: number | null;
  total_controls: number | null;
}

export interface TrustCenterControlsSummary {
  total: number;
  passing: number;
  in_progress: number;
  not_started: number;
}

export interface TrustCenterLastAudit {
  framework: string;
  status: string;
  end_date: string | null;
  auditor: string | null;
}

export interface TrustCenterData {
  company_slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  custom_message: string | null;
  seo_title: string | null;
  seo_description: string | null;
  show_score: boolean | null;
  show_frameworks: boolean | null;
  show_controls: boolean | null;
  show_last_audit: boolean | null;
  compliance_score: number | null;
  public_frameworks: TrustCenterFramework[] | null;
  controls_summary: TrustCenterControlsSummary | null;
  last_audit: TrustCenterLastAudit | null;
  last_updated: string | null;
}

export const useTrustCenterData = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["trust-center", slug],
    queryFn: async (): Promise<TrustCenterData | null> => {
      if (!slug) return null;

      const { data, error } = await supabase.rpc("get_trust_center_by_slug", {
        p_slug: slug,
      });

      if (error) {
        console.error("Error fetching trust center data:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // The RPC returns an array, we want the first item
      const result = data[0];
      
      // Parse JSON fields if they're strings
      return {
        ...result,
        public_frameworks: typeof result.public_frameworks === 'string' 
          ? JSON.parse(result.public_frameworks) 
          : result.public_frameworks,
        controls_summary: typeof result.controls_summary === 'string'
          ? JSON.parse(result.controls_summary)
          : result.controls_summary,
        last_audit: typeof result.last_audit === 'string'
          ? JSON.parse(result.last_audit)
          : result.last_audit,
      } as TrustCenterData;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
