// Claude Citations API Service - Testing parallel to existing system
import Anthropic from '@anthropic-ai/sdk';

interface ClaudeSource {
  content: string;
  source: {
    chunk_index: number;
    document_index: number;
  };
}

interface ClaudeCitationsResponse {
  content: string;
  citations: ClaudeSource[];
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface DocumentInfo {
  id: string;
  name: string;
  url?: string;
  file_url?: string;
}

class ClaudeCitationsService {
  private anthropic: Anthropic | null;

  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      console.log('🚀 Claude Citations service initialized');
    } else {
      console.warn('⚠️ Anthropic API key not found in environment variables');
      this.anthropic = null;
    }
  }

  /**
   * Convert PDF URL to base64 for Claude API (proper method for browsers)
   */
  private async pdfUrlToBase64(pdfUrl: string): Promise<string> {
    try {
      console.log('🔄 Fetching PDF for Claude analysis:', pdfUrl);
      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Use FileReader for proper base64 conversion in browser
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]; // Remove data:application/pdf;base64,
          console.log('✅ PDF converted to base64:', base64.length, 'characters');
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(new Blob([arrayBuffer], { type: 'application/pdf' }));
      });
    } catch (error) {
      console.error('❌ PDF to base64 conversion failed:', error);
      throw error;
    }
  }

  /**
   * Query document using Claude Citations API
   */
  async queryDocumentWithCitations(
    question: string,
    document: DocumentInfo
  ): Promise<ClaudeCitationsResponse> {
    if (!this.anthropic) {
      throw new Error('Claude Citations service not available - API key missing');
    }

    try {
      console.log('🔄 Claude Citations: Starting query...');
      console.log('Question:', question);
      console.log('Document:', document.name);

      // Get PDF URL
      const pdfUrl = document.url || document.file_url;
      if (!pdfUrl) {
        throw new Error('Document URL is required for Claude processing');
      }

      console.log('🔗 Using PDF URL directly:', pdfUrl);

      // Convert PDF to base64 for proper citations
      const base64Pdf = await this.pdfUrlToBase64(pdfUrl);

      // Query Claude with document and FORCE page identification
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        system: "You are a document analyzer. You MUST identify the page number where each quote appears. Look at the page headers, footers, or page indicators in the PDF. Every quote MUST include its page number using the format [Page X: 'exact quote'].",
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf
              }
            },
            {
              type: "text",
              text: `${question}

MANDATORY CITATION FORMAT:
1. You MUST provide page numbers for every quote
2. Look carefully at the document for page numbers (usually in headers/footers)
3. Use the exact format: [Page X: 'exact quote from the document']
4. If you see "Page X of Y" or similar indicators, use that page number
5. Every citation must have a page number - this is not optional

Find the relevant quotes in the document and identify their exact page locations.`
            }
          ]
        }]
      });

      console.log('✅ Claude Citations: Query successful');
      console.log('🔍 Claude Response:', response);
      console.log('📄 Claude Raw Content:', response.content[0]?.text);

      // Extract content and citations
      const content = response.content[0]?.text || '';

      // Extract citations from response metadata
      const citations: ClaudeSource[] = [];

      // Check if response has citations in metadata
      if (response.content[0]?.type === 'text' && (response as any).citations) {
        const responseCitations = (response as any).citations || [];
        console.log('📚 Found citations in response:', responseCitations);

        citations.push(...responseCitations.map((citation: any) => ({
          content: citation.content || citation.text || '',
          source: {
            chunk_index: citation.chunk_index || 0,
            document_index: citation.document_index || 0
          }
        })));
      }

      // Parse citations with improved accuracy handling
      if (citations.length === 0) {
        console.log('📝 Parsing citations from Claude response...');

        // Try to extract page-specific citations (handle both single and double quotes)
        const pageRegex = /\[Page (\d+): ["']([^"']+)["']\]/g;
        const pageMatches = [...content.matchAll(pageRegex)];

        console.log(`🔍 Looking for pattern [Page X: 'quote'] in content...`);
        console.log(`📝 Content preview: ${content.substring(0, 500)}...`);
        console.log(`🎯 Page regex matches found: ${pageMatches.length}`);

        pageMatches.forEach((match, index) => {
          const page = parseInt(match[1]);
          const quote = match[2];

          console.log(`🕵️ Raw match ${index + 1}: "${match[0]}"`);
          console.log(`📄 Extracted page: ${page}, quote: "${quote.substring(0, 100)}..."`);

          citations.push({
            content: quote,
            source: {
              chunk_index: page,
              document_index: 0
            }
          });

          console.log(`📖 Citation ${index + 1}: Page ${page} - "${quote.substring(0, 50)}..."`);
        });

        // Also look for general quoted text without page numbers
        if (pageMatches.length === 0) {
          console.log('📝 No page-specific citations found, parsing general quotes...');
          const quoteRegex = /'([^']{20,})'/g;
          const quoteMatches = [...content.matchAll(quoteRegex)];

          quoteMatches.slice(0, 3).forEach((match, index) => { // Limit to 3 to avoid noise
            citations.push({
              content: match[1],
              source: {
                chunk_index: 0, // Unknown page
                document_index: 0
              }
            });

            console.log(`📖 Citation ${index + 1}: Page unknown - "${match[1].substring(0, 50)}..."`);
          });
        }

        console.log(`🔍 Found ${citations.length} total citations`);
      }

      const result: ClaudeCitationsResponse = {
        content: content,
        citations: citations,
        model: response.model,
        usage: response.usage
      };

      console.log('📄 Claude final result:', result);
      return result;

    } catch (error) {
      console.error('❌ Claude Citations query failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.anthropic;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.anthropic) {
      return false;
    }

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: "Hello"
        }]
      });

      return !!response.content;
    } catch (error) {
      console.error('Claude connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let claudeCitationsService: ClaudeCitationsService | null = null;

export function getClaudeCitationsService(): ClaudeCitationsService {
  if (!claudeCitationsService) {
    claudeCitationsService = new ClaudeCitationsService();
  }
  return claudeCitationsService;
}

export default ClaudeCitationsService;
export type { ClaudeCitationsResponse, ClaudeSource };