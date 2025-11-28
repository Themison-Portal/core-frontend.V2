// Backend Fallback Service - Handles primary backend failures and ChatPDF fallback
import { getChatPDFService, shouldUseChatPDFAsPrimary } from "./chatPDFService";

interface BackendResponse {
  response: string;
  sources?: Array<{
    section: string;
    page?: number;
    content: string;
    exactText?: string;
    relevance?: string;
    context?: string;
    highlightURL?: string;
  }>;
  source: 'primary' | 'chatpdf' | 'mock';
  timestamp: number;
}

interface BackendError {
  error: string;
  source: 'primary' | 'chatpdf';
  canRetry: boolean;
  suggestFallback: boolean;
}

interface QueryOptions {
  message: string;
  documentId: string;
  documentData?: {
    document_name?: string;
    document_url?: string;
    file_url?: string;
    file_size?: number;
    mime_type?: string;
  };
  userId: string;
  limit?: number;
  timeout?: number;
}

class BackendFallbackService {
  private primaryBackendUrl: string;
  private requestTimeout: number;
  private retryAttempts: number;

  constructor() {
    this.primaryBackendUrl = import.meta.env.VITE_API_BASE_URL || '';
    this.requestTimeout = 120000; // 120 seconds (2 minutes) - increased for Anthropic backend processing
    this.retryAttempts = 2;
  }

  /**
   * Main query method that handles primary backend with ChatPDF fallback
   */
  async query(options: QueryOptions): Promise<BackendResponse> {
    const { message, documentId, documentData, userId, limit = 5, timeout } = options;

    // Check if ChatPDF should be used as primary
    if (shouldUseChatPDFAsPrimary()) {
      console.log('🔄 Using ChatPDF as primary service');
      return this.queryWithChatPDF(message, documentId, documentData);
    }

    // Try primary backend first
    try {
      console.log('🔄 Attempting primary backend query');
      const response = await this.queryPrimaryBackend({
        message,
        documentId,
        userId,
        limit,
        timeout: timeout || this.requestTimeout,
      });

      return {
        ...response,
        source: 'primary' as const,
        timestamp: Date.now(),
      };
    } catch (primaryError) {
      console.warn('⚠️ Primary backend failed:', primaryError);
      
      // Check if we should try ChatPDF fallback
      const chatPDFService = getChatPDFService();
      if (chatPDFService && this.shouldUseFallback(primaryError)) {
        console.log('🔄 Attempting ChatPDF fallback');
        
        try {
          return await this.queryWithChatPDF(message, documentId, documentData);
        } catch (fallbackError) {
          console.error('❌ ChatPDF fallback also failed:', fallbackError);
          
          // Both services failed, throw a comprehensive error
          throw this.createFallbackError(primaryError, fallbackError);
        }
      }

      // No fallback available or not appropriate, throw original error
      throw this.createBackendError(primaryError, 'primary');
    }
  }

  /**
   * Query primary backend
   */
  private async queryPrimaryBackend(options: {
    message: string;
    documentId: string;
    userId: string;
    limit: number;
    timeout: number;
  }): Promise<{ response: string; sources?: any[] }> {
    const { message, documentId, userId, limit, timeout } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestPayload = {
        message: `${message}. Please be thorough and provide references to all relevant sections of the document, including page numbers and section titles where this information appears.`,
        user_id: userId,
        limit,
        document_ids: documentId ? [documentId] : undefined,
      };

      console.log('🔍 Primary Backend Request:', {
        documentId,
        requestPayload,
        apiUrl: `${this.primaryBackendUrl}/query`,
      });

      const response = await fetch(`${this.primaryBackendUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`,
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Primary backend error: ${response.status} ${response.statusText}`);
      }

      const responseJson = await response.json();
      console.log('✅ Primary Backend Success');

      return {
        response: responseJson.response || 'No response received',
        sources: responseJson.sources || [],
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Query using ChatPDF fallback
   */
  private async queryWithChatPDF(
    message: string, 
    documentId: string, 
    documentData?: any
  ): Promise<BackendResponse> {
    const chatPDFService = getChatPDFService();
    if (!chatPDFService) {
      throw new Error('ChatPDF service is not available');
    }

    try {
      // Prepare document info
      const documentInfo = {
        id: documentId,
        name: documentData?.document_name || `Document ${documentId}`,
        url: documentData?.document_url || documentData?.file_url,
        file_size: documentData?.file_size,
        mime_type: documentData?.mime_type,
      };

      if (!documentInfo.url) {
        throw new Error('Document URL is required for ChatPDF processing');
      }

      // Get source ID and query with enhanced sources
      const sourceId = await chatPDFService.getSourceId(documentInfo);
      const chatPDFResponse = await chatPDFService.queryDocument(sourceId, message, {
        referenceSources: true,
        temperature: 0.3,
        extractSources: true,
        documentInfo: documentInfo,
      });

      // Transform response format - prefer enhanced sources over basic references
      const sources = chatPDFResponse.sources?.map(source => ({
        section: source.section || `Page ${source.page}`,
        page: source.page,
        content: source.exactText,
        exactText: source.exactText,
        context: source.context,
        relevance: source.relevance,
        highlightURL: source.highlightURL
      })) || chatPDFResponse.references?.map(ref => {
        // Generate highlighting URL for basic references when enhanced sources fail
        const highlightURL = documentInfo?.url
          ? `${documentInfo.url}#page=${ref.pageNumber}`
          : undefined;

        return {
          section: `Page ${ref.pageNumber}`,
          page: ref.pageNumber,
          content: `Content from page ${ref.pageNumber}`,
          highlightURL
        };
      }) || [];

      return {
        response: chatPDFResponse.content,
        sources,
        source: 'chatpdf' as const,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('❌ ChatPDF fallback error:', error);
      throw error;
    }
  }

  /**
   * Determine if fallback should be used based on the error
   */
  private shouldUseFallback(error: unknown): boolean {
    // Network errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return true;
    }

    // HTTP errors that suggest server issues
    if (error.message && typeof error.message === 'string') {
      const message = error.message.toLowerCase();
      if (
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection')
      ) {
        return true;
      }
    }

    // Fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    return false;
  }

  /**
   * Create a structured error for backend failures
   */
  private createBackendError(error: unknown, source: 'primary' | 'chatpdf'): BackendError {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      error: errorMessage,
      source,
      canRetry: this.shouldUseFallback(error),
      suggestFallback: source === 'primary' && !!getChatPDFService(),
    };
  }

  /**
   * Create error when both primary and fallback fail
   */
  private createFallbackError(primaryError: unknown, fallbackError: unknown): BackendError {
    const primaryMsg = primaryError instanceof Error ? primaryError.message : 'Primary backend failed';
    const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'ChatPDF fallback failed';
    
    return {
      error: `Both services failed. Primary: ${primaryMsg}. Fallback: ${fallbackMsg}`,
      source: 'primary' as const,
      canRetry: false,
      suggestFallback: false,
    };
  }

  /**
   * Test both primary backend and ChatPDF connectivity
   */
  async testConnectivity(): Promise<{
    primary: { available: boolean; error?: string };
    chatpdf: { available: boolean; error?: string };
  }> {
    const results = {
      primary: { available: false, error: undefined as string | undefined },
      chatpdf: { available: false, error: undefined as string | undefined },
    };

    // Test primary backend
    try {
      const response = await fetch(`${this.primaryBackendUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      results.primary.available = response.ok;
      if (!response.ok) {
        results.primary.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.primary.error = error instanceof Error ? error.message : 'Connection failed';
    }

    // Test ChatPDF
    try {
      const chatPDFService = getChatPDFService();
      if (chatPDFService) {
        results.chatpdf.available = await chatPDFService.testConnection();
      } else {
        results.chatpdf.error = 'Service not configured';
      }
    } catch (error) {
      results.chatpdf.error = error instanceof Error ? error.message : 'Connection failed';
    }

    return results;
  }
}

// Singleton instance
let backendFallbackService: BackendFallbackService | null = null;

export function getBackendFallbackService(): BackendFallbackService {
  if (!backendFallbackService) {
    backendFallbackService = new BackendFallbackService();
  }
  return backendFallbackService;
}

export default BackendFallbackService;
export type { BackendResponse, BackendError, QueryOptions };