// PDF Extraction Service - Professional PDF text extraction
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker properly for Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';
}

export interface PDFPage {
  pageNumber: number;
  text: string;
  textItems: Array<{
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export class PDFExtractionService {
  /**
   * Extract text from specific PDF pages
   */
  static async extractPages(pdfUrl: string, pageNumbers: number[]): Promise<PDFPage[]> {
    try {
      console.log('🔄 Loading PDF:', pdfUrl);

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        disableWorker: false,
        isEvalSupported: false,
      });

      const pdf = await loadingTask.promise;
      console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

      // Extract requested pages
      const results: PDFPage[] = [];

      for (const pageNum of pageNumbers) {
        if (pageNum < 1 || pageNum > pdf.numPages) {
          console.warn(`⚠️ Page ${pageNum} out of range (1-${pdf.numPages})`);
          continue;
        }

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Extract text with positioning
        const textItems = textContent.items.map((item: any) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
        }));

        // Combine text in reading order
        const pageText = textItems
          .sort((a, b) => {
            // Sort by Y position (top to bottom), then X (left to right)
            const yDiff = Math.abs(a.y - b.y);
            if (yDiff > 5) { // Different lines
              return b.y - a.y; // Top to bottom
            }
            return a.x - b.x; // Left to right on same line
          })
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        results.push({
          pageNumber: pageNum,
          text: pageText,
          textItems,
        });

        console.log(`✅ Page ${pageNum} extracted: ${pageText.length} chars`);
      }

      return results;

    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }


  /**
   * Find text that matches a query within extracted pages
   */
  static findMatchingText(
    pages: PDFPage[],
    searchQuery: string,
    contextLength: number = 200
  ): Array<{
    pageNumber: number;
    matchedText: string;
    context: string;
    confidence: number;
  }> {
    const results: Array<{
      pageNumber: number;
      matchedText: string;
      context: string;
      confidence: number;
    }> = [];

    for (const page of pages) {
      // Simple text matching - in production, use more sophisticated algorithms
      const lowerText = page.text.toLowerCase();
      const lowerQuery = searchQuery.toLowerCase();

      // Find all potential matches
      const words = lowerQuery.split(' ').filter(w => w.length > 2);
      let totalMatches = 0;
      let bestMatch = '';
      let bestContext = '';

      for (const word of words) {
        const index = lowerText.indexOf(word);
        if (index !== -1) {
          totalMatches++;

          // Extract context around the match
          const start = Math.max(0, index - contextLength / 2);
          const end = Math.min(page.text.length, index + word.length + contextLength / 2);
          const context = page.text.substring(start, end);

          if (context.length > bestContext.length) {
            bestMatch = page.text.substring(index, index + word.length);
            bestContext = context;
          }
        }
      }

      if (totalMatches > 0) {
        const confidence = totalMatches / words.length;
        results.push({
          pageNumber: page.pageNumber,
          matchedText: bestMatch,
          context: bestContext,
          confidence,
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate URL for opening PDF with simple search highlighting
   */
  static generateHighlightURL(pdfUrl: string, page: number, searchText: string): string {
    // Extract only the most important 2-3 words for highlighting
    const words = searchText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3)
      .join(' ');

    return `${pdfUrl}#page=${page}&search=${encodeURIComponent(words)}`;
  }
}

export default PDFExtractionService;