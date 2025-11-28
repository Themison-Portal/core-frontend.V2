// AI Service Switcher
// Routes requests to the appropriate AI service based on environment configuration

import { getBackendFallbackService } from './backendFallbackService';
import { getClaudeCitationsService } from './claudeCitationsService';
import {
  UnifiedAIResponse,
  adaptBackendResponse,
  adaptChatPDFResponse,
  adaptAnthropicResponse,
  createMockAnthropicResponse
} from './aiResponseAdapter';

export type AIServiceType = 'backend' | 'chatpdf' | 'anthropic' | 'anthropic-mockup';

export interface DocumentInfo {
  id: string;
  document_name?: string;
  document_url?: string;
  file_url?: string;
}

export interface QueryParams {
  message: string;
  documentId: string;
  documentData: DocumentInfo;
  userId: string;
  limit?: number;
}

class AIServiceSwitcher {
  private getServiceType(): AIServiceType {
    const serviceType = import.meta.env.VITE_AI_SERVICE as AIServiceType;

    // Validate service type
    const validTypes: AIServiceType[] = ['backend', 'chatpdf', 'anthropic', 'anthropic-mockup'];
    if (!validTypes.includes(serviceType)) {
      console.warn(`Invalid VITE_AI_SERVICE: ${serviceType}. Defaulting to 'anthropic'`);
      return 'anthropic';
    }

    return serviceType;
  }

  async query(params: QueryParams, overrideService?: AIServiceType): Promise<UnifiedAIResponse> {
    const serviceType = overrideService || this.getServiceType();
    console.log(`🔄 Using AI Service: ${serviceType}`);

    try {
      switch (serviceType) {
        case 'backend':
          return await this.queryBackend(params);

        case 'chatpdf':
          return await this.queryChatPDF(params);

        case 'anthropic':
          return await this.queryAnthropic(params);

        case 'anthropic-mockup':
          return await this.queryAnthropicMockup(params);

        default:
          throw new Error(`Unsupported service type: ${serviceType}`);
      }
    } catch (error) {
      console.error(`❌ AI Service ${serviceType} failed:`, error);

      // Fallback strategy: try anthropic if not already using it
      if (serviceType !== 'anthropic') {
        console.log('🔄 Falling back to Anthropic service...');
        try {
          return await this.queryAnthropic(params);
        } catch (fallbackError) {
          console.error('❌ Anthropic fallback also failed:', fallbackError);
        }
      }

      // Final fallback: backend service
      if (serviceType !== 'backend') {
        console.log('🔄 Final fallback to backend service...');
        return await this.queryBackend(params);
      }

      throw error;
    }
  }

  private async queryBackend(params: QueryParams): Promise<UnifiedAIResponse> {
    console.log('🔄 Querying backend service...');
    const backendService = getBackendFallbackService();

    const result = await backendService.query({
      message: params.message,
      documentId: params.documentId,
      documentData: params.documentData,
      userId: params.userId,
      limit: params.limit || 5
    });

    return adaptBackendResponse(result);
  }

  private async queryChatPDF(params: QueryParams): Promise<UnifiedAIResponse> {
    console.log('🔄 Querying ChatPDF service...');
    const backendService = getBackendFallbackService();

    // Force ChatPDF usage
    const result = await backendService.query({
      message: params.message,
      documentId: params.documentId,
      documentData: params.documentData,
      userId: params.userId,
      limit: params.limit || 5,
      forceService: 'chatpdf'
    });

    const documentUrl = params.documentData.document_url || params.documentData.file_url || '';
    return adaptChatPDFResponse(result, documentUrl);
  }

  private async queryAnthropic(params: QueryParams): Promise<UnifiedAIResponse> {
    console.log('🔄 Querying Anthropic Claude service...');
    const claudeService = getClaudeCitationsService();

    if (!claudeService.isAvailable()) {
      throw new Error('Claude Citations service not available - API key missing');
    }

    const claudeResult = await claudeService.queryDocumentWithCitations(params.message, {
      id: params.documentId,
      name: params.documentData.document_name || 'Document',
      url: params.documentData.document_url,
      file_url: params.documentData.file_url
    });

    const documentUrl = params.documentData.document_url || params.documentData.file_url || '';
    return adaptAnthropicResponse(
      claudeResult,
      documentUrl,
      claudeResult.usage.input_tokens,
      claudeResult.usage.output_tokens
    );
  }

  private async queryAnthropicMockup(params: QueryParams): Promise<UnifiedAIResponse> {
    console.log('🔄 Querying Anthropic Claude service...');
    console.log('🚀 Claude Citations service initialized');
    console.log('🔄 Claude Citations: Starting query...');
    console.log('Question:', params.message);
    console.log('Document:', params.documentData.document_name || 'Document');

    const documentUrl = params.documentData.document_url || params.documentData.file_url || '';
    console.log('🔗 Using PDF URL directly:', documentUrl);

    // Simulate PDF conversion
    console.log('🔄 Fetching PDF for Claude analysis:', documentUrl);
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('✅ PDF converted to base64: 454804 characters');

    // Simulate Claude processing
    await new Promise(resolve => setTimeout(resolve, 700));
    console.log('✅ Claude Citations: Query successful');

    const documentName = params.documentData.document_name || 'Document';
    const mockResponse = createMockAnthropicResponse(params.message, documentName, documentUrl);

    // Simulate citation parsing logs
    console.log('📝 Parsing citations from Claude response...');
    console.log(`🔍 Found ${mockResponse.sources.length} citation matches in text`);

    mockResponse.sources.forEach((source, index) => {
      console.log(`📖 Citation ${index + 1}: Page ${source.page} - "${source.exactText.substring(0, 50)}..."`);
    });

    console.log('📄 Claude final result:', {
      content: mockResponse.response.substring(0, 50) + '...',
      citations: mockResponse.sources.length,
      model: mockResponse.model,
      usage: { input_tokens: 3210, output_tokens: 312 }
    });

    return mockResponse;
  }

  /**
   * Get current service type for debugging
   */
  getCurrentService(): AIServiceType {
    return this.getServiceType();
  }

  /**
   * Check if a specific service is available
   */
  isServiceAvailable(serviceType: AIServiceType): boolean {
    switch (serviceType) {
      case 'backend':
        return !!import.meta.env.VITE_API_BASE_URL;

      case 'chatpdf':
        return !!import.meta.env.VITE_CHATPDF_ACCESS_KEY;

      case 'anthropic':
        return !!import.meta.env.VITE_ANTHROPIC_API_KEY;

      case 'anthropic-mockup':
        return true; // Always available

      default:
        return false;
    }
  }
}

// Singleton instance
let aiServiceSwitcher: AIServiceSwitcher | null = null;

export function getAIServiceSwitcher(): AIServiceSwitcher {
  if (!aiServiceSwitcher) {
    aiServiceSwitcher = new AIServiceSwitcher();
  }
  return aiServiceSwitcher;
}

export default AIServiceSwitcher;