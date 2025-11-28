// ChatPDF API Service - Fallback for Document AI when backend fails
import { getSourceExtractionService } from "./sourceExtractionService";

interface ChatPDFUploadResponse {
  sourceId: string;
  status: string;
}

interface ChatPDFQueryResponse {
  content: string;
  references?: Array<{
    pageNumber: number;
  }>;
  sources?: Array<{
    page: number;
    section?: string;
    exactText: string;
    relevance: 'high' | 'medium' | 'low';
    context: string;
  }>;
}

interface ChatPDFError {
  error: string;
  message: string;
}

interface DocumentInfo {
  id: string;
  name: string;
  url?: string;
  file_size?: number;
  mime_type?: string;
}

class ChatPDFService {
  private apiKey: string;
  private baseUrl = 'https://api.chatpdf.com/v1';
  private sourceCache = new Map<string, string>(); // documentId -> sourceId mapping

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Upload a document to ChatPDF by URL
   */
  async uploadDocumentByUrl(documentUrl: string): Promise<string> {
    try {
      console.log('🔄 ChatPDF: Uploading document by URL:', documentUrl);

      const response = await fetch(`${this.baseUrl}/sources/add-url`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: documentUrl,
        }),
      });

      if (!response.ok) {
        const error: ChatPDFError = await response.json();
        throw new Error(`ChatPDF Upload Error: ${error.message || error.error}`);
      }

      const data: ChatPDFUploadResponse = await response.json();
      console.log('✅ ChatPDF: Document uploaded successfully:', data.sourceId);
      
      return data.sourceId;
    } catch (error) {
      console.error('❌ ChatPDF Upload Error:', error);
      throw error;
    }
  }

  /**
   * Upload a document to ChatPDF by file (for future use)
   */
  async uploadDocumentByFile(file: File): Promise<string> {
    try {
      console.log('🔄 ChatPDF: Uploading document by file:', file.name);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/sources/add-file`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error: ChatPDFError = await response.json();
        throw new Error(`ChatPDF Upload Error: ${error.message || error.error}`);
      }

      const data: ChatPDFUploadResponse = await response.json();
      console.log('✅ ChatPDF: Document uploaded successfully:', data.sourceId);
      
      return data.sourceId;
    } catch (error) {
      console.error('❌ ChatPDF Upload Error:', error);
      throw error;
    }
  }

  /**
   * Query a document using ChatPDF with enhanced source extraction
   */
  async queryDocument(
    sourceId: string,
    question: string,
    options?: {
      referenceSources?: boolean;
      temperature?: number;
      stream?: boolean;
      extractSources?: boolean;
      documentInfo?: {
        id: string;
        name: string;
        url?: string;
        file_url?: string;
      };
    }
  ): Promise<ChatPDFQueryResponse> {
    try {
      console.log('🔄 ChatPDF: Querying document:', { sourceId, question });

      const response = await fetch(`${this.baseUrl}/chats/message`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId,
          messages: [
            {
              role: 'user',
              content: `${question}. Please be thorough and reference all relevant pages and sections where this information appears.

Format your response using clear markdown structure:
- Use **bold** for important terms and section titles
- Use numbered lists (1. 2. 3.) or bullet points (•) for criteria and requirements
- Add proper spacing between different sections
- Use headings (## or ###) for major sections when appropriate`,
            },
          ],
          referenceSources: options?.referenceSources ?? true,
          temperature: options?.temperature ?? 0.3,
          stream: options?.stream ?? false,
        }),
      });

      if (!response.ok) {
        const error: ChatPDFError = await response.json();
        throw new Error(`ChatPDF Query Error: ${error.message || error.error}`);
      }

      const data = await response.json();
      console.log('✅ ChatPDF: Query successful');

      // Base response
      const baseResponse: ChatPDFQueryResponse = {
        content: data.content,
        references: data.references || [],
      };

      // Enhanced source extraction if requested
      if (options?.extractSources && options?.documentInfo) {
        try {
          console.log('🔍 Extracting enhanced sources with Groq');

          const sourceExtractor = getSourceExtractionService();
          const extractionResult = await sourceExtractor.extractSources(
            question,
            data.content,
            options.documentInfo,
            data.references
          );

          baseResponse.sources = extractionResult.sources;
          console.log(`✅ Enhanced sources extracted: ${extractionResult.sources.length} citations`);
          console.log('🔍 ChatPDF: Sources being returned:', JSON.stringify(baseResponse.sources, null, 2));
        } catch (extractError) {
          console.warn('⚠️ Source extraction failed, using basic references:', extractError);
          // Fallback to basic page references
          baseResponse.sources = (data.references || []).map((ref: any) => ({
            page: ref.pageNumber,
            section: `Page ${ref.pageNumber}`,
            exactText: `Content from page ${ref.pageNumber}`,
            relevance: 'medium' as const,
            context: 'Basic page reference from ChatPDF'
          }));
        }
      }

      return baseResponse;
    } catch (error) {
      console.error('❌ ChatPDF Query Error:', error);
      throw error;
    }
  }

  /**
   * Get or create sourceId for a document
   */
  async getSourceId(document: DocumentInfo): Promise<string> {
    // Check cache first
    if (this.sourceCache.has(document.id)) {
      const cachedSourceId = this.sourceCache.get(document.id)!;
      console.log('📋 ChatPDF: Using cached sourceId:', cachedSourceId);
      return cachedSourceId;
    }

    // Need to upload document to ChatPDF
    let sourceId: string;

    if (document.url) {
      sourceId = await this.uploadDocumentByUrl(document.url);
    } else {
      throw new Error('Document URL is required for ChatPDF upload');
    }

    // Cache the sourceId
    this.sourceCache.set(document.id, sourceId);
    console.log('💾 ChatPDF: Cached sourceId for document:', document.id);

    return sourceId;
  }

  /**
   * Clear cache (useful for testing or when documents are updated)
   */
  clearCache(): void {
    this.sourceCache.clear();
    console.log('🗑️ ChatPDF: Cache cleared');
  }

  /**
   * Check if ChatPDF is available and configured
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Test connection to ChatPDF API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to make a simple request to test the API key
      const response = await fetch(`${this.baseUrl}/sources/add-url`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://www.example.com/test.pdf', // This will fail but should return a valid error
        }),
      });

      // If we get a response (even an error), the API key is probably valid
      return response.status !== 401; // 401 means unauthorized (invalid API key)
    } catch (error) {
      console.error('ChatPDF connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let chatPDFService: ChatPDFService | null = null;

/**
 * Get ChatPDF service instance
 */
export function getChatPDFService(): ChatPDFService | null {
  const apiKey = import.meta.env.VITE_CHATPDF_ACCESS_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ ChatPDF API key not found in environment variables');
    return null;
  }

  if (!chatPDFService) {
    chatPDFService = new ChatPDFService(apiKey);
    console.log('🚀 ChatPDF service initialized');
  }

  return chatPDFService;
}

/**
 * Check if ChatPDF fallback is enabled
 */
export function isChatPDFEnabled(): boolean {
  const useChatPDF = import.meta.env.VITE_USE_CHATPDF === 'true';
  const hasApiKey = !!import.meta.env.VITE_CHATPDF_ACCESS_KEY;
  
  return useChatPDF && hasApiKey;
}

/**
 * Check if ChatPDF should be used as primary (for testing)
 */
export function shouldUseChatPDFAsPrimary(): boolean {
  return import.meta.env.VITE_USE_CHATPDF === 'true';
}

export default ChatPDFService;
export type { ChatPDFQueryResponse, DocumentInfo };