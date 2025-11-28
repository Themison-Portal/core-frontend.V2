import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types based on the database schema - Fixed to match actual database response
export interface PatientDocument {
  id: string;
  patient_id: string;
  document_name: string;
  document_type:
    | "medical_record"
    | "lab_result"
    | "imaging"
    | "consent_form"
    | "assessment"
    | "questionnaire"
    | "adverse_event_report"
    | "medication_record"
    | "visit_note"
    | "discharge_summary"
    | "other";
  document_url: string;
  uploaded_by: string | null;
  status: string | null; // Changed to string to match database response
  file_size: number | null;
  mime_type: string | null;
  version: number | null;
  is_latest: boolean | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
  // Add the joined member data
  uploaded_by_member?: {
    id: string;
    name: string;
    email: string;
  };
}

export type PatientDocumentStatus =
  | "pending"
  | "approved"
  | "signed"
  | "submitted"
  | "active"
  | "rejected"
  | "archived";

export interface PatientDocumentInsert {
  patient_id: string;
  document_name: string;
  document_type: PatientDocument["document_type"];
  document_url: string;
  uploaded_by?: string | null;
  status?: PatientDocumentStatus | null;
  file_size?: number | null;
  mime_type?: string | null;
  version?: number | null;
  is_latest?: boolean | null;
  description?: string | null;
  tags?: string[] | null;
}

export interface PatientDocumentUpdate {
  document_name?: string;
  document_type?: PatientDocument["document_type"];
  status?: PatientDocumentStatus | null;
  description?: string | null;
  tags?: string[] | null;
}

// Document type options for UI
export const DOCUMENT_TYPE_OPTIONS = [
  { value: "medical_record", label: "Medical Record", icon: "📋" },
  { value: "lab_result", label: "Lab Result", icon: "🧪" },
  { value: "imaging", label: "Imaging", icon: "🔬" },
  { value: "consent_form", label: "Consent Form", icon: "📝" },
  { value: "assessment", label: "Assessment", icon: "📊" },
  { value: "questionnaire", label: "Questionnaire", icon: "❓" },
  { value: "adverse_event_report", label: "Adverse Event Report", icon: "⚠️" },
  { value: "medication_record", label: "Medication Record", icon: "💊" },
  { value: "visit_note", label: "Visit Note", icon: "📄" },
  { value: "discharge_summary", label: "Discharge Summary", icon: "🏥" },
  { value: "other", label: "Other", icon: "📁" },
] as const;

// Status options for UI
export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "approved", label: "Approved", color: "green" },
  { value: "signed", label: "Signed", color: "blue" },
  { value: "submitted", label: "Submitted", color: "purple" },
  { value: "active", label: "Active", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
  { value: "archived", label: "Archived", color: "gray" },
] as const;

interface UsePatientDocumentsOptions {
  patientId: string;
}

export function usePatientDocuments({ patientId }: UsePatientDocumentsOptions) {
  const queryClient = useQueryClient();

  // Fetch patient documents
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
  } = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_documents")
        .select(
          `
          *,
          uploaded_by_member:members!patient_documents_uploaded_by_fkey(
            id,
            name,
            email
          )
        `
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching patient documents:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!patientId,
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: PatientDocumentInsert) => {
      const { data, error } = await supabase
        .from("patient_documents")
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error("Error uploading document:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      console.error("Upload document error:", error);
      toast.error("Failed to upload document");
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: PatientDocumentUpdate;
    }) => {
      const { data, error } = await supabase
        .from("patient_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating document:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      });
      toast.success("Document updated successfully");
    },
    onError: (error) => {
      console.error("Update document error:", error);
      toast.error("Failed to update document");
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("patient_documents")
        .delete()
        .eq("id", documentId);

      if (error) {
        console.error("Error deleting document:", error);
        throw error;
      }

      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      console.error("Delete document error:", error);
      toast.error("Failed to delete document");
    },
  });

  // File upload to Supabase Storage
  const uploadFileMutation = useMutation({
    mutationFn: async ({
      file,
      folder = "patient-documents",
    }: {
      file: File;
      folder?: string;
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      return {
        filePath: uploadData.path,
        publicUrl: urlData.publicUrl,
        fileSize: file.size,
        mimeType: file.type,
      };
    },
    onError: (error) => {
      console.error("File upload error:", error);
      toast.error("Failed to upload file");
    },
  });

  // Combined upload function (file + document record)
  const uploadDocument = async (
    file: File,
    documentData: Omit<
      PatientDocumentInsert,
      "document_url" | "file_size" | "mime_type"
    >
  ) => {
    try {
      // First upload the file
      const fileResult = await uploadFileMutation.mutateAsync({ file });

      // Then create the document record
      const fullDocumentData: PatientDocumentInsert = {
        ...documentData,
        document_url: fileResult.publicUrl,
        file_size: fileResult.fileSize,
        mime_type: fileResult.mimeType,
      };

      return await uploadDocumentMutation.mutateAsync(fullDocumentData);
    } catch (error) {
      console.error("Combined upload error:", error);
      throw error;
    }
  };

  // Get documents by type
  const getDocumentsByType = (type: PatientDocument["document_type"]) => {
    return documents.filter((doc) => doc.document_type === type);
  };

  // Get documents by status - Fixed to handle string status
  const getDocumentsByStatus = (status: PatientDocumentStatus | string) => {
    return documents.filter((doc) => doc.status === status);
  };

  // Get latest documents only
  const getLatestDocuments = () => {
    return documents.filter((doc) => doc.is_latest);
  };

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown size";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Get document type info
  const getDocumentTypeInfo = (type: PatientDocument["document_type"]) => {
    return (
      DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type) || {
        value: type,
        label: type,
        icon: "📁",
      }
    );
  };

  // Get status info - Fixed to handle string status
  const getStatusInfo = (status: string | null) => {
    return (
      STATUS_OPTIONS.find((option) => option.value === status) || {
        value: status || "unknown",
        label: status || "Unknown",
        color: "gray",
      }
    );
  };

  return {
    // Data
    documents,
    documentsLoading,
    documentsError,

    // Mutations
    uploadDocument,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,

    // Loading states
    uploadingDocument:
      uploadDocumentMutation.isPending || uploadFileMutation.isPending,
    updatingDocument: updateDocumentMutation.isPending,
    deletingDocument: deleteDocumentMutation.isPending,

    // Utility functions
    getDocumentsByType,
    getDocumentsByStatus,
    getLatestDocuments,
    formatFileSize,
    getDocumentTypeInfo,
    getStatusInfo,

    // Constants
    DOCUMENT_TYPE_OPTIONS,
    STATUS_OPTIONS,
  };
}
