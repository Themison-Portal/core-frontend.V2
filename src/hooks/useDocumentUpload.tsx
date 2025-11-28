import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  documentService,
  DocumentUploadOptions,
  TrialDocument,
  DocumentTypeEnum,
} from "@/services/documentService";
import { useToast } from "@/hooks/use-toast";
import { DOCUMENTS_QUERY_KEYS } from "./useDocuments";

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  result?: TrialDocument;
}

export interface UseDocumentUploadReturn {
  uploadDocument: (options: DocumentUploadOptions) => Promise<TrialDocument>;
  uploadMultipleDocuments: (
    uploads: DocumentUploadOptions[]
  ) => Promise<TrialDocument[]>;
  isUploading: boolean;
  uploadProgress: UploadProgress[];
  clearProgress: () => void;
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const uploadMutation = useMutation({
    mutationFn: (options: DocumentUploadOptions) =>
      documentService.uploadDocument(options),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: DOCUMENTS_QUERY_KEYS.trial(variables.trialId),
      });
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEYS.lists() });

      toast({
        title: "Document uploaded",
        description: `${variables.file.name} has been uploaded successfully.`,
      });
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Upload failed",
        description: `Failed to upload ${variables.file.name}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const uploadDocument = useCallback(
    async (options: DocumentUploadOptions): Promise<TrialDocument> => {
      const progressId = `${options.file.name}-${Date.now()}`;

      // Add to progress tracking
      setUploadProgress((prev) => [
        ...prev,
        {
          file: options.file,
          progress: 0,
          status: "uploading",
        },
      ]);

      try {
        // Update progress to show start
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.file.name === options.file.name && p.status === "uploading"
              ? { ...p, progress: 10 }
              : p
          )
        );

        const result = await uploadMutation.mutateAsync(options);

        // Log the successful upload result for backend integration
        console.log("📁 UPLOAD COMPLETE - Final Result:", {
          fileName: options.file.name,
          result: result,
          uploadOptions: {
            trialId: options.trialId,
            documentType: options.documentType,
            description: options.description,
            tags: options.tags,
            amendmentNumber: options.amendmentNumber,
          },
        });

        // Update progress to completion
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.file.name === options.file.name && p.status === "uploading"
              ? { ...p, progress: 100, status: "success", result }
              : p
          )
        );

        return result;
      } catch (error) {
        // Update progress to error
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.file.name === options.file.name && p.status === "uploading"
              ? { ...p, status: "error", error: (error as Error).message }
              : p
          )
        );
        throw error;
      }
    },
    [uploadMutation]
  );

  const uploadMultipleDocuments = useCallback(
    async (uploads: DocumentUploadOptions[]): Promise<TrialDocument[]> => {
      // Initialize progress for all files
      const initialProgress: UploadProgress[] = uploads.map((upload) => ({
        file: upload.file,
        progress: 0,
        status: "pending" as const,
      }));

      setUploadProgress((prev) => [...prev, ...initialProgress]);

      const results: TrialDocument[] = [];
      const errors: { file: File; error: Error }[] = [];

      // Upload files sequentially to avoid overwhelming the server
      for (const uploadOptions of uploads) {
        try {
          setUploadProgress((prev) =>
            prev.map((p) =>
              p.file.name === uploadOptions.file.name && p.status === "pending"
                ? { ...p, status: "uploading", progress: 10 }
                : p
            )
          );

          const result = await uploadMutation.mutateAsync(uploadOptions);
          results.push(result);

          // Log each successful upload in batch
          console.log("📂 BATCH UPLOAD SUCCESS - Individual File:", {
            fileName: uploadOptions.file.name,
            result: result,
            batchPosition: results.length,
            totalFiles: uploads.length,
          });

          setUploadProgress((prev) =>
            prev.map((p) =>
              p.file.name === uploadOptions.file.name &&
              p.status === "uploading"
                ? { ...p, progress: 100, status: "success", result }
                : p
            )
          );
        } catch (error) {
          errors.push({ file: uploadOptions.file, error: error as Error });

          setUploadProgress((prev) =>
            prev.map((p) =>
              p.file.name === uploadOptions.file.name &&
              p.status === "uploading"
                ? { ...p, status: "error", error: (error as Error).message }
                : p
            )
          );
        }
      }

      // Log final batch results summary
      console.log("📊 BATCH UPLOAD COMPLETE - Final Summary:", {
        totalUploaded: results.length,
        totalErrors: errors.length,
        successfulUploads: results,
        errors: errors.map((e) => ({
          fileName: e.file.name,
          error: e.error.message,
        })),
      });

      // Show summary toast
      if (results.length > 0) {
        toast({
          title: "Upload completed",
          description: `${results.length} document(s) uploaded successfully${
            errors.length > 0 ? `, ${errors.length} failed` : ""
          }.`,
        });
      }

      if (errors.length > 0 && results.length === 0) {
        toast({
          title: "Upload failed",
          description: `All ${errors.length} document(s) failed to upload.`,
          variant: "destructive",
        });
      }

      return results;
    },
    [uploadMutation, toast]
  );

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    uploadDocument,
    uploadMultipleDocuments,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    clearProgress,
  };
}

// Validation helpers
export function validateFileSize(
  file: File,
  maxSizeInMB: number = 10
): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function getDocumentTypeFromMimeType(
  mimeType: string
): DocumentTypeEnum {
  const typeMap: Record<string, DocumentTypeEnum> = {
    "application/pdf": "protocol",
    "application/msword": "manual",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "manual",
    "text/plain": "other",
    "image/jpeg": "other",
    "image/png": "other",
  };

  return typeMap[mimeType] || "other";
}

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
];

export const MAX_FILE_SIZE_MB = 10;
