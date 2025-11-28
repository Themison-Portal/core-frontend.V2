import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/integrations/supabase/types";

export type Patient = Tables<"patients">;
export type PatientInsert = TablesInsert<"patients">;
export type PatientUpdate = TablesUpdate<"patients">;

interface UsePatientOptions {
  organizationId?: string;
}

export function usePatients({ organizationId }: UsePatientOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all patients for an organization
  const {
    data: patients,
    isLoading: patientsLoading,
    error: patientsError,
  } = useQuery({
    queryKey: ["patients", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Create a new patient
  const createPatientMutation = useMutation({
    mutationFn: async (patientData: PatientInsert) => {
      const { data, error } = await supabase
        .from("patients")
        .insert(patientData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients", organizationId] });
      toast({
        title: "Patient Created",
        description: `Patient ${data.patient_code} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Patient",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Update a patient
  const updatePatientMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: PatientUpdate;
    }) => {
      // First check if patient exists
      const { data: existingPatient, error: checkError } = await supabase
        .from("patients")
        .select("id, patient_code, organization_id")
        .eq("id", id)
        .single();

      if (checkError) {
        console.error("Error checking patient:", checkError);
        throw new Error("Patient not found");
      }

      // If updating patient_code, check for duplicates (excluding current patient)
      if (
        updates.patient_code &&
        updates.patient_code !== existingPatient.patient_code
      ) {
        const { data: duplicateCheck, error: duplicateError } = await supabase
          .from("patients")
          .select("id")
          .eq("patient_code", updates.patient_code)
          .eq(
            "organization_id",
            updates.organization_id || existingPatient.organization_id
          )
          .neq("id", id);

        if (duplicateError) {
          console.error("Error checking for duplicates:", duplicateError);
          throw new Error("Error checking patient code uniqueness");
        }

        if (duplicateCheck && duplicateCheck.length > 0) {
          throw new Error("Patient code already exists");
        }
      }

      // Perform the update
      const { data, error } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating patient:", error);
        throw new Error(error.message || "Failed to update patient");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients", organizationId] });
      toast({
        title: "Patient Updated",
        description: `Patient ${data.patient_code} has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      console.error("Update patient error:", error);
      toast({
        title: "Error Updating Patient",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Deactivate a patient (soft delete)
  const deactivatePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const { data, error } = await supabase
        .from("patients")
        .update({ is_active: false })
        .eq("id", patientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients", organizationId] });
      toast({
        title: "Patient Deactivated",
        description: `Patient ${data.patient_code} has been deactivated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deactivating Patient",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Generate unique patient code
  const generatePatientCode = async (
    organizationId: string
  ): Promise<string> => {
    const { data, error } = await supabase
      .from("patients")
      .select("patient_code")
      .eq("organization_id", organizationId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return "P-001";
    }

    // Filter valid codes and extract numbers
    const validCodes = data
      .map(p => {
        const match = p.patient_code.match(/^P-(\d+)$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(num => num !== null)
      .sort((a, b) => b - a); // Sort numbers descending

    if (validCodes.length > 0) {
      const highestNumber = validCodes[0];
      const nextNumber = highestNumber + 1;
      return `P-${nextNumber.toString().padStart(3, "0")}`;
    }

    return "P-001";
  };

  return {
    // Data
    patients: patients || [],

    // Loading states
    patientsLoading,
    createPatientLoading: createPatientMutation.isPending,
    updatePatientLoading: updatePatientMutation.isPending,
    deactivatePatientLoading: deactivatePatientMutation.isPending,

    // Errors
    patientsError,

    // Mutations
    createPatient: createPatientMutation.mutate,
    updatePatient: updatePatientMutation.mutate,
    deactivatePatient: deactivatePatientMutation.mutate,

    // Utils
    generatePatientCode,
  };
}
