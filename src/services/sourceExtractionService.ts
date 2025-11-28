// Source Extraction Service - Extracts exact text from PDF pages for precise citations
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import PDFExtractionService from './pdfExtractionService';

interface PageReference {
  page: number;
  section?: string;
  exactText: string;
  relevance: 'high' | 'medium' | 'low';
  context: string;
  highlightURL?: string;
}

interface ExtractionResult {
  sources: PageReference[];
  confidence: number;
}

interface DocumentInfo {
  id: string;
  name: string;
  url?: string;
  file_url?: string;
}

class SourceExtractionService {
  private groq: Groq | null;
  private openai: OpenAI | null;
  private textCache = new Map<string, string[]>(); // documentId -> pages text array

  constructor() {
    // Initialize Groq
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqApiKey) {
      this.groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
    } else {
      console.warn('⚠️ Groq API key not found');
      this.groq = null;
    }

    // Initialize OpenAI
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true
      });
    } else {
      console.warn('⚠️ OpenAI API key not found');
      this.openai = null;
    }
  }

  /**
   * Parse page references from ChatPDF response
   */
  parsePageReferences(response: string): number[] {
    const pageRegex = /\[P(\d+)\]/g;
    const matches = Array.from(response.matchAll(pageRegex));
    return matches.map(match => parseInt(match[1], 10)).filter(Boolean);
  }

  /**
   * Extract text from specific PDF pages using multiple strategies
   */
  async extractTextFromPages(
    document: DocumentInfo,
    pageNumbers: number[]
  ): Promise<{ page: number; content: string }[]> {
    try {
      console.log(`🔄 Extracting text from pages: ${pageNumbers.join(', ')}`);

      // Check cache first
      const cachedText = this.textCache.get(document.id);
      if (cachedText) {
        console.log('📋 Using cached PDF text');
        return pageNumbers.map(pageNum => ({
          page: pageNum,
          content: cachedText[pageNum - 1] || ''
        }));
      }

      // Strategy 1: Try PDF.js extraction (now that it works!)
      try {
        const pdfPages = await this.extractViaPDFjs(document, pageNumbers);
        if (pdfPages.length > 0) {
          console.log('✅ PDF.js extraction successful');
          return pdfPages;
        }
      } catch (error) {
        console.warn('⚠️ PDF.js extraction failed:', error);
      }

      // Strategy 2: Fallback to basic pdf-parse (if available)
      const pdfUrl = document.url || document.file_url;
      if (pdfUrl) {
        try {
          const extractedPages = await this.extractRealPDFText(pdfUrl, pageNumbers);
          return extractedPages;
        } catch (error) {
          console.warn('⚠️ pdf-parse fallback failed:', error);
        }
      }

      // Strategy 3: Final fallback
      return this.fallbackPDFExtraction('', pageNumbers);

    } catch (error) {
      console.error('❌ All PDF text extraction strategies failed:', error);
      return this.fallbackPDFExtraction('', pageNumbers);
    }
  }

  /**
   * Use AI (OpenAI preferred, Groq fallback) to find exact text that matches the query context
   */
  async findExactSources(
    originalQuery: string,
    chatPDFResponse: string,
    pageTexts: { page: number; content: string }[]
  ): Promise<ExtractionResult> {
    // Try OpenAI first (higher quality)
    if (this.openai) {
      try {
        return await this.findSourcesWithOpenAI(originalQuery, chatPDFResponse, pageTexts);
      } catch (error) {
        console.warn('⚠️ OpenAI extraction failed, trying Groq fallback:', error);
      }
    }

    // Fallback to Groq
    if (this.groq) {
      try {
        return await this.findSourcesWithGroq(originalQuery, chatPDFResponse, pageTexts);
      } catch (error) {
        console.warn('⚠️ Groq extraction failed:', error);
      }
    }

    // Final fallback to intelligent matching
    console.log('📋 No AI services available, using intelligent matching fallback');
    return this.createIntelligentFallback(originalQuery, chatPDFResponse, pageTexts);
  }

  /**
   * Use OpenAI to find exact sources (premium quality)
   */
  async findSourcesWithOpenAI(
    originalQuery: string,
    chatPDFResponse: string,
    pageTexts: { page: number; content: string }[]
  ): Promise<ExtractionResult> {
    console.log('🤖 Using OpenAI GPT-4o-mini for source extraction');

    const prompt = `You are a precise medical document analyst for a clinical trial management system. Your analysis will be used for regulatory compliance and patient safety decisions.

USER QUERY: "${originalQuery}"

CHATPDF AI RESPONSE: "${chatPDFResponse}"

ACTUAL PDF PAGE CONTENT:
${pageTexts.map(pt => `=== PAGE ${pt.page} ===\n${pt.content}`).join('\n\n')}

CRITICAL TASK: Find ALL mentions and complete information about the user's query across these PDF pages. This is for clinical trial documentation where completeness and accuracy are essential.

REQUIREMENTS:
1. Extract ALL relevant text sections, not just the "best" ones
2. Text must be LITERAL word-for-word quotes from the PDF
3. Include sections that START on one page and CONTINUE on others
4. Verify each quote actually exists in the provided content
5. Infer section names from document structure (headings, numbering)
6. If information spans multiple pages, include all relevant excerpts
7. Use EXACT page numbers from the content above (${pageTexts.map(pt => pt.page).join(', ')})
8. Extract complete sentences and detailed explanations, not section headings or navigation text
9. Skip structural content like "3.3.1 Title ... 3.3.2 Other Title" - these are table of contents
10. Choose content that provides actual information, procedures, requirements, or data about the topic

Respond with valid JSON only:
{
  "sources": [
    {
      "page": ${pageTexts[0]?.page || 1},
      "section": "Inferred section name or Page X",
      "exactText": "Complete literal text from PDF with full context...",
      "relevance": "high",
      "context": "Detailed context about document location and surrounding content"
    }
  ],
  "confidence": 0.95
}

VERIFICATION: Before including any text, confirm it appears exactly as written in the PDF content above. Be thorough and exhaustive in your search.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a precise document analyst. Always respond with valid JSON only. Never include explanations or markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('🔍 OpenAI raw response:', content.substring(0, 200));

    // Parse JSON response
    const result = JSON.parse(content) as ExtractionResult;

    console.log('✅ OpenAI source extraction successful:', result.sources.length, 'sources found');
    return result;
  }

  /**
   * Use Groq as fallback
   */
  async findSourcesWithGroq(
    originalQuery: string,
    chatPDFResponse: string,
    pageTexts: { page: number; content: string }[]
  ): Promise<ExtractionResult> {
    console.log('🤖 Using Groq as fallback for source extraction');

    const prompt = `Extract exact citations from PDF content. Respond ONLY with valid JSON.

QUERY: "${originalQuery}"
CHATPDF RESPONSE: "${chatPDFResponse}"

PDF PAGE CONTENT:
${pageTexts.map(pt => `PAGE ${pt.page}: ${pt.content.substring(0, 800)}`).join('\n\n')}

Find the most relevant exact text from the PDF that answers the query.

Return ONLY this JSON format:
{
  "sources": [
    {
      "page": 3,
      "section": "Section Name",
      "exactText": "exact literal text from PDF",
      "relevance": "high",
      "context": "surrounding context"
    }
  ],
  "confidence": 0.9
}

CRITICAL: Response must be valid JSON only. No explanations, no markdown, no other text.`;

    const completion = await this.groq!.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Groq');
    }

    // Clean JSON response (remove markdown formatting if present)
    let cleanContent = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();

    // Try to extract JSON if wrapped in other text
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }

    console.log('🔍 Groq raw response:', content.substring(0, 200));
    console.log('🧹 Cleaned content:', cleanContent.substring(0, 200));

    // Parse JSON response
    const result = JSON.parse(cleanContent) as ExtractionResult;

    console.log('✅ Groq source extraction successful:', result.sources.length, 'sources found');
    return result;
  }

  /**
   * Main method: Extract sources from ChatPDF response
   */
  async extractSources(
    originalQuery: string,
    chatPDFResponse: string,
    document: DocumentInfo,
    chatPDFReferences?: Array<{ pageNumber: number }>
  ): Promise<ExtractionResult> {
    try {
      console.log('🔍 Starting source extraction...');
      console.log('Query:', originalQuery);
      console.log('ChatPDF Response:', chatPDFResponse.substring(0, 200) + '...');

      // 1. Get page references from ChatPDF (prefer direct references over parsing)
      console.log('🔍 chatPDFReferences received:', chatPDFReferences);

      const pageNumbers = chatPDFReferences && chatPDFReferences.length > 0
        ? chatPDFReferences.map(ref => ref.pageNumber)
        : this.parsePageReferences(chatPDFResponse);
      console.log('📋 Found page references:', pageNumbers);

      if (pageNumbers.length === 0) {
        console.log('⚠️ No page references found in response');
        return { sources: [], confidence: 0 };
      }

      // 2. Expand page range for better context (min-1 to max+1)
      const minPage = Math.max(1, Math.min(...pageNumbers) - 1);
      const maxPage = Math.max(...pageNumbers) + 1;
      const expandedPages: number[] = [];

      for (let i = minPage; i <= maxPage; i++) {
        expandedPages.push(i);
      }

      console.log('📄 Original references:', pageNumbers);
      console.log('📄 Expanded range for context:', `${minPage}-${maxPage}`, expandedPages);

      // Extract text from expanded page range
      const pageTexts = await this.extractTextFromPages(document, expandedPages);

      // Debug: Log what we extracted
      pageTexts.forEach((pt, idx) => {
        console.log(`📄 Page ${pt.page} content preview:`, pt.content.substring(0, 200) + '...');
      });

      // 3. Use AI to find exact citations
      const result = await this.findExactSources(originalQuery, chatPDFResponse, pageTexts);

      // 4. Add simple highlighting URLs
      const pdfUrl = document.url || document.file_url;
      if (pdfUrl) {
        result.sources = result.sources.map(source => {
          const highlightURL = PDFExtractionService.generateHighlightURL(pdfUrl, source.page, source.exactText);
          return {
            ...source,
            highlightURL
          };
        });
      }

      console.log(`✅ Final result: ${result.sources.length} sources, confidence: ${result.confidence}`);
      result.sources.forEach((source, idx) => {
        console.log(`Source ${idx + 1}:`, {
          page: source.page,
          section: source.section,
          relevance: source.relevance,
          textPreview: source.exactText.substring(0, 100) + '...',
          highlightURL: source.highlightURL
        });
      });

      return result;

    } catch (error) {
      console.error('❌ Source extraction pipeline failed:', error);
      return { sources: [], confidence: 0 };
    }
  }

  /**
   * Intelligent fallback when Groq is not available
   */
  private createIntelligentFallback(
    originalQuery: string,
    chatPDFResponse: string,
    pageTexts: { page: number; content: string }[]
  ): ExtractionResult {
    console.log('🧠 Creating intelligent fallback sources');

    const sources: PageReference[] = [];

    for (const pt of pageTexts) {
      // Try to find relevant sections based on query keywords
      const queryWords = originalQuery.toLowerCase().split(' ').filter(w => w.length > 3);
      const pageText = pt.content.toLowerCase();

      let bestMatch = '';
      let bestContext = '';
      let matchScore = 0;

      // Look for keyword matches
      for (const word of queryWords) {
        const index = pageText.indexOf(word);
        if (index !== -1) {
          matchScore++;

          // Extract a good chunk around the match
          const start = Math.max(0, index - 100);
          const end = Math.min(pt.content.length, index + 300);
          const chunk = pt.content.substring(start, end);

          if (chunk.length > bestMatch.length) {
            bestMatch = chunk;
            bestContext = pt.content.substring(Math.max(0, index - 200), Math.min(pt.content.length, index + 400));
          }
        }
      }

      // If no keyword matches, use beginning of page
      if (matchScore === 0) {
        bestMatch = pt.content.substring(0, 300);
        bestContext = pt.content.substring(0, 500);
      }

      // Determine relevance based on matches
      let relevance: 'high' | 'medium' | 'low' = 'low';
      if (matchScore >= queryWords.length * 0.7) relevance = 'high';
      else if (matchScore >= queryWords.length * 0.3) relevance = 'medium';

      // Try to infer section name from content
      let section = `Page ${pt.page}`;
      const headingMatch = pt.content.match(/^([A-Z][^.]{10,60})\n/);
      if (headingMatch) {
        section = headingMatch[1].trim();
      }

      sources.push({
        page: pt.page,
        section,
        exactText: bestMatch.trim(),
        relevance,
        context: bestContext.trim()
      });
    }

    const confidence = sources.length > 0 ? Math.min(0.8, sources.reduce((acc, s) => acc + (s.relevance === 'high' ? 0.3 : s.relevance === 'medium' ? 0.2 : 0.1), 0)) : 0.3;

    return { sources, confidence };
  }

  /**
   * Extract real text from PDF using pdf-parse
   */
  private async extractRealPDFText(
    pdfUrl: string,
    pageNumbers: number[]
  ): Promise<{ page: number; content: string }[]> {
    console.log('🔄 Extracting real PDF text for:', pdfUrl);

    try {
      // Dynamic import since pdf-parse needs to be imported this way in browser
      const pdfParse = await import('pdf-parse/lib/pdf-parse.js');

      // Fetch PDF content
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const pdfBuffer = await response.arrayBuffer();

      // Parse entire PDF
      const pdfData = await pdfParse.default(new Uint8Array(pdfBuffer));

      console.log(`📄 PDF parsed successfully: ${pdfData.numpages} pages`);

      // Split text by pages (approximation based on page breaks)
      const pages = this.splitTextIntoPages(pdfData.text, pdfData.numpages);

      // Return requested pages
      return pageNumbers.map(pageNum => ({
        page: pageNum,
        content: pages[pageNum - 1] || `Page ${pageNum} content not available`
      }));

    } catch (error) {
      console.warn('⚠️ PDF parsing failed, using fallback extraction:', error);
      return this.fallbackPDFExtraction(pdfUrl, pageNumbers);
    }
  }

  /**
   * Split text into approximate pages
   */
  private splitTextIntoPages(text: string, totalPages: number): string[] {
    // Simple approach: split text into roughly equal chunks
    const textLength = text.length;
    const avgPageLength = Math.floor(textLength / totalPages);

    const pages: string[] = [];
    let currentPos = 0;

    for (let i = 0; i < totalPages; i++) {
      const start = currentPos;
      const end = Math.min(currentPos + avgPageLength, textLength);

      // Try to break at sentence boundaries
      let actualEnd = end;
      if (end < textLength) {
        const nextSentenceEnd = text.indexOf('.', end);
        if (nextSentenceEnd !== -1 && nextSentenceEnd - end < avgPageLength * 0.3) {
          actualEnd = nextSentenceEnd + 1;
        }
      }

      pages.push(text.substring(start, actualEnd).trim());
      currentPos = actualEnd;
    }

    return pages;
  }

  /**
   * Extract page content using PDF.js with highlighting support
   */
  private async extractViaPDFjs(
    document: DocumentInfo,
    pageNumbers: number[]
  ): Promise<{ page: number; content: string }[]> {
    console.log('🔄 Extracting via PDF.js (professional approach)');

    const pdfUrl = document.url || document.file_url;
    if (!pdfUrl) {
      throw new Error('Document URL not available');
    }

    try {
      // Extract pages using professional PDF.js service
      const extractedPages = await PDFExtractionService.extractPages(pdfUrl, pageNumbers);


      return extractedPages.map(page => ({
        page: page.pageNumber,
        content: page.text
      }));

    } catch (error) {
      console.error('❌ PDF.js extraction failed:', error);
      throw error;
    }
  }

  /**
   * Fallback extraction when all other methods fail
   */
  private async fallbackPDFExtraction(
    pdfUrl: string,
    pageNumbers: number[]
  ): Promise<{ page: number; content: string }[]> {
    console.log('🔄 Using final fallback for PDF extraction');

    return pageNumbers.map(page => ({
      page,
      content: `Unable to extract specific content from page ${page}.

      This document may have complex formatting or access restrictions.
      The AI response above is based on the document content, but exact page text extraction failed.`
    }));
  }

  /**
   * Check if AI services are available
   */
  isAvailable(): boolean {
    return !!(this.openai || this.groq);
  }

  /**
   * Get available AI services
   */
  getAvailableServices(): string[] {
    const services: string[] = [];
    if (this.openai) services.push('OpenAI GPT-4o-mini');
    if (this.groq) services.push('Groq Llama-3.1-8b');
    return services;
  }

  /**
   * Clear text cache
   */
  clearCache(): void {
    this.textCache.clear();
    console.log('🗑️ Source extraction cache cleared');
  }
}

// Singleton instance
let sourceExtractionService: SourceExtractionService | null = null;

export function getSourceExtractionService(): SourceExtractionService {
  if (!sourceExtractionService) {
    sourceExtractionService = new SourceExtractionService();
    console.log('🚀 Source extraction service initialized');
  }
  return sourceExtractionService;
}

export default SourceExtractionService;
export type { PageReference, ExtractionResult, DocumentInfo };