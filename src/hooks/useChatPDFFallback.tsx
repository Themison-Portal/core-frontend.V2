import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getChatPDFService, isChatPDFEnabled, shouldUseChatPDFAsPrimary } from "@/services/chatPDFService";
import type { ChatPDFQueryResponse, DocumentInfo } from "@/services/chatPDFService";
import { useDocument } from "@/hooks/useDocuments";

interface ChatPDFFallbackResult {
  success: boolean;
  response?: string;
  sources?: Array<{
    section: string;
    page?: number;
    content: string;
  }>;
  error?: string;
}

interface UseChatPDFFallbackOptions {
  enabled?: boolean;
  onSuccess?: (response: ChatPDFFallbackResult) => void;
  onError?: (error: string) => void;
}

export function useChatPDFFallback(options: UseChatPDFFallbackOptions = {}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const {
    enabled = true,
    onSuccess,
    onError,
  } = options;

  /**
   * Query document using ChatPDF as fallback
   */
  const queryWithChatPDF = useCallback(async (
    documentId: string,
    question: string,
    documentData?: {
      document_name?: string;
      document_url?: string;
      file_url?: string;
      file_size?: number;
      mime_type?: string;
    }
  ): Promise<ChatPDFFallbackResult> => {
    if (!enabled || !isChatPDFEnabled()) {
      const error = 'ChatPDF fallback is not enabled or configured';
      setLastError(error);
      return { success: false, error };
    }

    const chatPDFService = getChatPDFService();
    if (!chatPDFService) {
      const error = 'ChatPDF service is not available';
      setLastError(error);
      return { success: false, error };
    }

    setIsLoading(true);
    setLastError(null);

    try {
      console.log('🔄 ChatPDF Fallback: Starting query process');

      // Prepare document info for ChatPDF
      const documentInfo: DocumentInfo = {
        id: documentId,
        name: documentData?.document_name || `Document ${documentId}`,
        url: documentData?.document_url || documentData?.file_url,
        file_size: documentData?.file_size,
        mime_type: documentData?.mime_type,
      };

      if (!documentInfo.url) {
        throw new Error('Document URL is required for ChatPDF processing');
      }

      // Get or create source ID for the document
      const sourceId = await chatPDFService.getSourceId(documentInfo);

      // Query the document
      const chatPDFResponse: ChatPDFQueryResponse = await chatPDFService.queryDocument(
        sourceId,
        question,
        {
          referenceSources: true,
          temperature: 0.3,
          stream: false,
        }
      );

      // Transform ChatPDF response to our format
      const sources = chatPDFResponse.references?.map(ref => ({
        section: `Page ${ref.pageNumber}`,
        page: ref.pageNumber,
        content: `Reference from page ${ref.pageNumber}`,
      })) || [];

      const result: ChatPDFFallbackResult = {
        success: true,
        response: chatPDFResponse.content,
        sources,
      };

      console.log('✅ ChatPDF Fallback: Query successful');
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown ChatPDF error';
      console.error('❌ ChatPDF Fallback Error:', errorMessage);
      
      setLastError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [enabled, onSuccess, onError]);

  /**
   * Check if ChatPDF fallback is available
   */
  const isAvailable = useCallback((): boolean => {
    return isChatPDFEnabled() && !!getChatPDFService();
  }, []);

  /**
   * Test ChatPDF connection
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    const service = getChatPDFService();
    if (!service) return false;

    try {
      const isConnected = await service.testConnection();
      if (isConnected) {
        toast({
          title: "ChatPDF Connection Test",
          description: "Successfully connected to ChatPDF API",
        });
      } else {
        toast({
          title: "ChatPDF Connection Failed",
          description: "Could not connect to ChatPDF API",
          variant: "destructive",
        });
      }
      return isConnected;
    } catch (error) {
      console.error('ChatPDF connection test failed:', error);
      toast({
        title: "ChatPDF Connection Error",
        description: "Failed to test ChatPDF connection",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  /**
   * Clear ChatPDF cache
   */
  const clearCache = useCallback(() => {
    const service = getChatPDFService();
    if (service) {
      service.clearCache();
      toast({
        title: "ChatPDF Cache Cleared",
        description: "Document cache has been cleared",
      });
    }
  }, [toast]);

  return {
    // Main functions
    queryWithChatPDF,
    
    // Status
    isLoading,
    lastError,
    isAvailable: isAvailable(),
    isPrimaryMode: shouldUseChatPDFAsPrimary(),
    
    // Utility functions
    testConnection,
    clearCache,
  };
}

/**
 * Hook specifically for using ChatPDF with a document from useDocument
 */
export function useChatPDFWithDocument(documentId: string | null, options: UseChatPDFFallbackOptions = {}) {
  const { data: document, isLoading: docLoading, error: docError } = useDocument(documentId || "");
  const chatPDF = useChatPDFFallback(options);

  const queryDocument = useCallback(async (question: string): Promise<ChatPDFFallbackResult> => {
    if (!documentId) {
      return { success: false, error: 'No document ID provided' };
    }

    if (!document) {
      return { success: false, error: 'Document data not available' };
    }

    return chatPDF.queryWithChatPDF(documentId, question, document);
  }, [documentId, document, chatPDF]);

  return {
    ...chatPDF,
    queryDocument,
    document,
    isDocumentLoading: docLoading,
    documentError: docError,
    isReady: !docLoading && !docError && !!document && chatPDF.isAvailable,
  };
}