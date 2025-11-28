// PDF Test Service - Check CORS and PDF.js capabilities
export class PDFTestService {

  /**
   * Test if we can fetch PDF from Supabase Storage
   */
  static async testPDFAccess(pdfUrl: string): Promise<{
    canFetch: boolean;
    hasCorsProblem: boolean;
    error?: string;
  }> {
    try {
      console.log('🧪 Testing PDF access:', pdfUrl);

      const response = await fetch(pdfUrl, {
        method: 'HEAD', // Just test headers first
      });

      if (response.ok) {
        console.log('✅ PDF is accessible');
        return { canFetch: true, hasCorsProblem: false };
      } else {
        console.log('❌ PDF fetch failed:', response.status);
        return {
          canFetch: false,
          hasCorsProblem: response.status === 0,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ PDF access test failed:', error);

      // Check if it's a CORS error
      const isCorsError = error.message && (
        error.message.includes('CORS') ||
        error.message.includes('Access-Control') ||
        error.message.includes('fetch')
      );

      return {
        canFetch: false,
        hasCorsProblem: isCorsError,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Test PDF.js text extraction
   */
  static async testPDFJsExtraction(pdfUrl: string, pageNumber: number = 1): Promise<{
    success: boolean;
    pageText?: string;
    error?: string;
    pageCount?: number;
  }> {
    try {
      console.log('🧪 Testing PDF.js extraction:', pdfUrl);

      // Dynamic import PDF.js
      const pdfjsLib = await import('pdfjs-dist');

      // Set worker source properly for Vite
      if (typeof window !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';
      }

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

      // Extract text from specific page
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();

      console.log(`✅ Page ${pageNumber} extracted: ${pageText.length} characters`);

      return {
        success: true,
        pageText: pageText.substring(0, 500) + (pageText.length > 500 ? '...' : ''),
        pageCount: pdf.numPages
      };

    } catch (error) {
      console.error('❌ PDF.js extraction failed:', error);
      return {
        success: false,
        error: error.message || 'PDF.js extraction failed'
      };
    }
  }

  /**
   * Full test: CORS + PDF.js extraction
   */
  static async runFullTest(pdfUrl: string): Promise<{
    corsTest: any;
    pdfJsTest: any;
    recommendation: string;
  }> {
    console.log('🚀 Running full PDF processing test...');

    // Test 1: CORS
    const corsTest = await this.testPDFAccess(pdfUrl);

    // Test 2: PDF.js (only if CORS passes)
    let pdfJsTest;
    if (corsTest.canFetch) {
      pdfJsTest = await this.testPDFJsExtraction(pdfUrl, 1);
    } else {
      pdfJsTest = { success: false, error: 'Skipped due to CORS issues' };
    }

    // Recommendation
    let recommendation;
    if (corsTest.canFetch && pdfJsTest.success) {
      recommendation = '✅ Direct PDF.js extraction will work perfectly';
    } else if (corsTest.hasCorsProblem) {
      recommendation = '🔧 Need to configure Supabase CORS or create a proxy endpoint';
    } else {
      recommendation = '❌ Need alternative approach or backend processing';
    }

    const results = { corsTest, pdfJsTest, recommendation };
    console.log('📊 Test results:', results);

    return results;
  }
}