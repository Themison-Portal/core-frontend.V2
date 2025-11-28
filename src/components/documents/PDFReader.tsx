import React, { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Ensure proper types
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Setup PDF.js worker - use exact same version as the installed package
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  fileUrl: string;
  fileName?: string;
  highlightedPage?: number; // Page to scroll to and highlight
  searchText?: string; // Text to search and highlight
}

export function PDFReader({
  fileUrl,
  fileName = "Document",
  highlightedPage,
  searchText,
}: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Improved highlighting with fuzzy matching and retry logic
  const highlightSearchText = useCallback(() => {
    if (!searchText) {
      console.log('❌ No search text provided');
      return;
    }

    console.log('🎯 Starting highlight for:', searchText.substring(0, 50));
    console.log('🎯 Current page number:', pageNumber);

    // Normalize text: remove extra whitespace, normalize quotes
    const normalizeText = (text: string) => {
      return text
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .replace(/[""]/g, '"') // Normalize quotes
        .replace(/['']/g, "'")
        .trim()
        .toLowerCase();
    };

    const attemptHighlight = (attempt: number = 1, maxAttempts: number = 5) => {
      const pdfSpans = document.querySelectorAll('.react-pdf__Page__textContent span');

      if (pdfSpans.length === 0) {
        if (attempt < maxAttempts) {
          console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Waiting for PDF text layer...`);
          setTimeout(() => attemptHighlight(attempt + 1, maxAttempts), 100 * attempt);
        } else {
          console.log('❌ No PDF spans found after multiple attempts');
        }
        return;
      }

      console.log(`📊 Found ${pdfSpans.length} PDF spans on attempt ${attempt}`);

      // Clear any existing highlights first
      pdfSpans.forEach(span => {
        (span as HTMLElement).style.backgroundColor = '';
      });

      // Get normalized full page text
      const allText = Array.from(pdfSpans).map(span => span.textContent || '').join(' ');
      const normalizedPageText = normalizeText(allText);
      const normalizedSearchText = normalizeText(searchText);

      console.log('📖 Page text length:', normalizedPageText.length);

      // Strategy 1: Try exact normalized match
      if (normalizedPageText.includes(normalizedSearchText)) {
        console.log('✅ Found exact normalized match!');
        highlightExactMatch(pdfSpans, normalizedPageText, normalizedSearchText);
        return;
      }

      // Strategy 2: Try first 10, 9, 8... down to 5 words
      const searchWords = normalizedSearchText.split(' ');
      for (let wordCount = Math.min(10, searchWords.length); wordCount >= 5; wordCount--) {
        const partialSearch = searchWords.slice(0, wordCount).join(' ');
        if (normalizedPageText.includes(partialSearch)) {
          console.log(`✅ Found ${wordCount}-word match!`);
          highlightPartialMatch(pdfSpans, partialSearch);
          return;
        }
      }

      // Strategy 3: Highlight individual significant words (fallback)
      const significantWords = searchWords.filter(w => w.length > 4); // Words longer than 4 chars
      if (significantWords.length > 0) {
        console.log(`🔍 Highlighting ${significantWords.length} significant words as fallback`);
        highlightSignificantWords(pdfSpans, significantWords);
      } else {
        console.log('❌ No matches found with any strategy');
      }
    };

    const highlightExactMatch = (
      pdfSpans: NodeListOf<Element>,
      normalizedPageText: string,
      normalizedSearchText: string
    ) => {
      const matchStart = normalizedPageText.indexOf(normalizedSearchText);
      const matchEnd = matchStart + normalizedSearchText.length;

      let currentPos = 0;
      let foundMatches = 0;

      pdfSpans.forEach((span) => {
        const spanText = span.textContent || '';
        const normalizedSpanText = normalizeText(spanText);
        const spanStart = currentPos;
        const spanEnd = currentPos + normalizedSpanText.length + 1; // +1 for space

        if (spanStart < matchEnd && spanEnd > matchStart) {
          (span as HTMLElement).style.backgroundColor = '#ffeb3b';
          (span as HTMLElement).style.color = '#000';
          (span as HTMLElement).style.padding = '2px';
          foundMatches++;
        }

        currentPos = spanEnd;
      });

      console.log(`🎯 Highlighted ${foundMatches} spans with exact match`);
    };

    const highlightPartialMatch = (pdfSpans: NodeListOf<Element>, partialSearch: string) => {
      let foundMatches = 0;
      pdfSpans.forEach((span) => {
        const spanText = span.textContent || '';
        const normalizedSpanText = normalizeText(spanText);

        if (normalizedSpanText.includes(partialSearch) || partialSearch.includes(normalizedSpanText)) {
          (span as HTMLElement).style.backgroundColor = '#ffeb3b';
          (span as HTMLElement).style.color = '#000';
          (span as HTMLElement).style.padding = '2px';
          foundMatches++;
        }
      });
      console.log(`🎯 Highlighted ${foundMatches} spans with partial match`);
    };

    const highlightSignificantWords = (pdfSpans: NodeListOf<Element>, significantWords: string[]) => {
      let foundMatches = 0;
      pdfSpans.forEach((span) => {
        const spanText = span.textContent || '';
        const normalizedSpanText = normalizeText(spanText);

        for (const word of significantWords) {
          if (normalizedSpanText.includes(word)) {
            (span as HTMLElement).style.backgroundColor = '#ffe57f'; // Lighter yellow for fallback
            (span as HTMLElement).style.color = '#000';
            (span as HTMLElement).style.padding = '2px';
            foundMatches++;
            break;
          }
        }
      });
      console.log(`🎯 Highlighted ${foundMatches} spans with significant words (fallback)`);
    };

    // Start highlighting with retry logic
    attemptHighlight();
  }, [searchText, pageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log("📄 PDF loaded successfully:", { numPages, fileName, fileUrl });
    setNumPages(numPages);
    setLoading(false);
    setError(null);

    // Auto-navigate to highlighted page if provided
    if (highlightedPage && highlightedPage <= numPages) {
      console.log("📍 Navigating to highlighted page:", highlightedPage);
      setPageNumber(highlightedPage);

      // Apply highlighting after page loads
      setTimeout(highlightSearchText, 100);
    }
  }

  function onDocumentLoadError(error: Error) {
    console.error("❌ PDF load error:", error);
    console.error("❌ Failed URL:", fileUrl);
    setError(`Failed to load PDF: ${error.message}`);
    setLoading(false);
  }

  // Debug initial load
  React.useEffect(() => {
    console.log("🔍 PDFReader initialized with:", {
      fileUrl,
      fileName,
      highlightedPage,
      searchText,
    });
    setLoading(true);
    setError(null);
  }, [fileUrl]);

  function changePage(offset: number) {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);

      // Scroll to the new page
      const pageElement = document.getElementById(`page-${newPage}`);
      if (pageElement) {
        pageElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }

  function changeScale(scaleOffset: number) {
    const newScale = Math.max(0.5, Math.min(3.0, scale + scaleOffset));
    setScale(newScale);
  }

  // Navigate to highlighted page only once when it changes
  React.useEffect(() => {
    if (highlightedPage && highlightedPage <= numPages) {
      console.log("📍 Setting highlighted page:", highlightedPage);
      setPageNumber(highlightedPage);
    }
  }, [highlightedPage, numPages]);

  // Apply highlighting when searchText changes
  React.useEffect(() => {
    if (searchText && numPages > 0) {
      // Quick delay to ensure text layers are rendered
      const timeoutId = setTimeout(highlightSearchText, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [searchText, numPages, highlightSearchText]);

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-red-600">PDF Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border">
      <div className="flex-none border-b p-2">
        {/* Compact single row with all controls */}
        <div className="flex items-center justify-between gap-2 pr-10">
          {/* Left: Page Navigation */}
          {!loading && numPages > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-xs text-gray-600 min-w-16 text-center">
                {pageNumber}/{numPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Center: Document name (shortened) */}
          <div className="text-xs font-medium truncate flex-1 text-center">
            {fileName.replace('.pdf', '')}
          </div>

          {/* Right: Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeScale(-0.2)}
              disabled={scale <= 0.5}
              className="h-6 w-6 p-0"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs text-gray-500 min-w-8 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeScale(0.2)}
              disabled={scale >= 3.0}
              className="h-6 w-6 p-0"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Search indicator - only if searching */}
        {searchText && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
            🔍 "{searchText.substring(0, 30)}..."
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="w-full">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="w-full"
            loading={
              <div className="flex items-center justify-center h-full py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Loading PDF...
                </span>
              </div>
            }
          >
            {/* Show single page with navigation - simpler approach */}
            {numPages > 0 && (
              <div className="flex justify-center">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  width={Math.min(750, window.innerWidth - 200)} // Wider for drawer
                  loading={
                    <div className="flex items-center justify-center py-8 w-full min-h-[600px] bg-gray-100">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  }
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  onRenderSuccess={() => {
                    console.log('📄 Page rendered:', pageNumber);
                    // Apply highlighting immediately after page renders
                    setTimeout(highlightSearchText, 50);
                  }}
                />
              </div>
            )}
          </Document>
        </div>
      </div>
    </div>
  );
}
