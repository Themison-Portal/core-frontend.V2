import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Trial {
  id: string;
  name: string;
  created_at: string;
  // Add other trial fields as needed
}

export function useTrials() {
  return useQuery({
    queryKey: ["trials"],
    queryFn: async (): Promise<Trial[]> => {
      const { data, error } = await supabase
        .from("trials")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
