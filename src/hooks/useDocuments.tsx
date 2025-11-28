import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  documentService,
  TrialDocument,
  DocumentListOptions,
} from "@/services/documentService";
import { useToast } from "@/hooks/use-toast";

// Query Keys
export const DOCUMENTS_QUERY_KEYS = {
  all: ["documents"] as const,
  lists: () => [...DOCUMENTS_QUERY_KEYS.all, "list"] as const,
  list: (filters: DocumentListOptions) =>
    [...DOCUMENTS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...DOCUMENTS_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...DOCUMENTS_QUERY_KEYS.details(), id] as const,
  trials: () => [...DOCUMENTS_QUERY_KEYS.all, "trials"] as const,
  trial: (trialId: string) =>
    [...DOCUMENTS_QUERY_KEYS.trials(), trialId] as const,
};

export function useDocuments(options: DocumentListOptions = {}) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.list(options),
    queryFn: () => documentService.getDocuments(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTrialDocuments(trialId: string) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.trial(trialId),
    queryFn: () => documentService.getTrialDocumentsWithMetadata(trialId),
    enabled: !!trialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: DOCUMENTS_QUERY_KEYS.detail(documentId),
    queryFn: () => documentService.getDocumentById(documentId),
    enabled: !!documentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: documentService.deleteDocument.bind(documentService),
    onSuccess: (_, documentId) => {
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEYS.all });

      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      documentId,
      updates,
    }: {
      documentId: string;
      updates: Partial<
        Pick<TrialDocument, "document_name" | "description" | "tags" | "status">
      >;
    }) => documentService.updateDocument(documentId, updates),
    onSuccess: (updatedDocument) => {
      // Update the cached document
      queryClient.setQueryData(
        DOCUMENTS_QUERY_KEYS.detail(updatedDocument.id),
        updatedDocument
      );

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEYS.lists() });

      toast({
        title: "Document updated",
        description: "The document has been successfully updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: "Failed to update document. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDownloadDocument() {
  const { toast } = useToast();

  return useMutation<string, Error, string>({
    mutationFn: documentService.getDownloadUrl.bind(documentService),
    onSuccess: (downloadUrl: string) => {
      // Open the download URL in a new tab
      window.open(downloadUrl, "_blank");
    },
    onError: (error: Error) => {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    },
  });
}

// Helper hooks for specific use cases
export function useTrialDocumentsByType(
  trialId: string,
  documentType?: string
) {
  return useDocuments({
    trialId,
    documentType: documentType as any,
    isLatest: true,
  });
}

export function useLatestDocuments(trialId: string) {
  return useDocuments({
    trialId,
    isLatest: true,
  });
}
