import { supabase } from "@/integrations/supabase/client";
import {
  TrialDocument,
  TrialDocumentInsert,
  DocumentTypeEnum,
} from "@/integrations/supabase/types";

// Re-export types for convenience
export type { TrialDocument, DocumentTypeEnum };

export interface DocumentUploadOptions {
  file: File;
  trialId: string;
  documentType: DocumentTypeEnum;
  description?: string;
  tags?: string[];
  amendmentNumber?: number;
}

export interface DocumentListOptions {
  trialId?: string;
  documentType?: DocumentTypeEnum;
  status?: string;
  isLatest?: boolean;
}

class DocumentService {
  private readonly BUCKET_NAME = "trial-documents";

  /**
   * Sanitize filename for storage
   */
  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .toLowerCase();
  }

  /**
   * Upload a document to Supabase Storage and create database record
   */
  async uploadDocument(options: DocumentUploadOptions): Promise<TrialDocument> {
    const { file, trialId, documentType, description, tags, amendmentNumber } =
      options;

    try {
      // 1. Upload file to Storage with sanitized filename
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const sanitizedName = this.sanitizeFileName(file.name);
      const fileName = `${trialId}/${Date.now()}-${sanitizedName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(
          `Failed to upload file to storage: ${uploadError.message}`
        );
      }

      // 2. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);

      // 3. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 4. Get member ID
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (memberError) {
        console.error("Member lookup error:", memberError);
        throw new Error(
          `Failed to find user member record: ${memberError.message}`
        );
      }

      // 5. Handle is_latest logic for protocols and amendments
      let shouldBeLatest = true;
      if (documentType === "protocol" || documentType === "amendment") {
        // First, check if there's already a latest document of this type for this trial
        const { data: existingLatest, error: existingError } = await supabase
          .from("trial_documents")
          .select("id")
          .eq("trial_id", trialId)
          .eq("document_type", documentType)
          .eq("is_latest", true)
          .limit(1);

        if (existingError) {
          console.warn(
            "Error checking existing latest documents:",
            existingError
          );
          // Continue with upload but don't mark as latest if we can't verify
          shouldBeLatest = false;
        } else if (existingLatest && existingLatest.length > 0) {
          // Mark existing latest documents as false
          const { error: updateError } = await supabase
            .from("trial_documents")
            .update({ is_latest: false })
            .eq("trial_id", trialId)
            .eq("document_type", documentType)
            .eq("is_latest", true);

          if (updateError) {
            console.warn(
              "Error updating existing latest documents:",
              updateError
            );
            // Continue with upload but don't mark as latest if update failed
            shouldBeLatest = false;
          }
        }
      }

      // 6. Create database record with proper types
      const documentInsert: TrialDocumentInsert = {
        document_name: file.name,
        document_type: documentType,
        document_url: publicUrl,
        trial_id: trialId,
        uploaded_by: memberData.id,
        status: "active",
        file_size: file.size,
        mime_type: file.type,
        version: 1,
        amendment_number: amendmentNumber,
        is_latest: shouldBeLatest,
        description,
        tags,
      };

      const { data: documentData, error: documentError } = await supabase
        .from("trial_documents")
        .insert(documentInsert)
        .select()
        .single();

      console.log(documentData, documentError);

      if (documentError) {
        console.error("Database insert error:", documentError);
        throw new Error(
          `Failed to create document record: ${documentError.message}`
        );
      }

      // Log the successful Supabase response for backend integration
      console.log("✅ SUPABASE UPLOAD SUCCESS - Document Response:", {
        documentData,
        uploadInfo: {
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          storageFileName: fileName,
          publicUrl: publicUrl,
        },
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/upload/upload-pdf`,
        {
          method: "POST",
          body: JSON.stringify({
            document_url: documentData?.document_url,
            document_id: documentData?.id,
            chunk_size: 1000,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      console.log(res);

      return documentData;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }

  /**
   * Get documents for a trial
   */
  async getDocuments(
    options: DocumentListOptions = {}
  ): Promise<TrialDocument[]> {
    try {
      let query = supabase
        .from("trial_documents")
        .select(
          `
          *,
          uploaded_by_member:members!trial_documents_uploaded_by_fkey(
            id,
            name,
            email
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (options.trialId) {
        query = query.eq("trial_id", options.trialId);
      }

      if (options.documentType) {
        query = query.eq("document_type", options.documentType);
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.isLatest !== undefined) {
        query = query.eq("is_latest", options.isLatest);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(documentId: string): Promise<TrialDocument | null> {
    try {
      const { data, error } = await supabase
        .from("trial_documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
  }

  /**
   * Delete a document (file + database record)
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // 1. Get document info
      const document = await this.getDocumentById(documentId);
      if (!document) throw new Error("Document not found");

      // 2. Extract file path from URL
      const url = new URL(document.document_url);
      const filePath = url.pathname.split("/").slice(-2).join("/"); // Get last 2 segments

      // 3. Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.warn("Error deleting file from storage:", storageError);
        // Continue with database deletion even if storage fails
      }

      // 4. Delete database record
      const { error: dbError } = await supabase
        .from("trial_documents")
        .delete()
        .eq("id", documentId);

      if (dbError) throw dbError;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    updates: Partial<
      Pick<TrialDocument, "document_name" | "description" | "tags" | "status">
    >
  ): Promise<TrialDocument> {
    try {
      const { data, error } = await supabase
        .from("trial_documents")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  }

  /**
   * Download document (get signed URL for private files)
   */
  async getDownloadUrl(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) throw new Error("Document not found");

      // For public files, return the public URL directly
      // For private files, you'd create a signed URL
      return document.document_url;
    } catch (error) {
      console.error("Error getting download URL:", error);
      throw error;
    }
  }

  /**
   * Get documents by trial with enhanced metadata
   */
  async getTrialDocumentsWithMetadata(
    trialId: string
  ): Promise<TrialDocument[]> {
    try {
      const { data, error } = await supabase
        .from("trial_documents")
        .select(
          `
          *,
          uploaded_by_member:members!trial_documents_uploaded_by_fkey(
            id,
            name,
            email
          ),
          trial:trials!trial_documents_trial_id_fkey(
            id,
            name,
            phase
          )
        `
        )
        .eq("trial_id", trialId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching trial documents with metadata:", error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();
