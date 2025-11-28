import React from "react";
import { ExternalLink, FileText, Quote, Search, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PDFSource {
  page: number;
  section?: string;
  exactText?: string;
  relevance?: 'high' | 'medium' | 'low';
  context?: string;
}

interface EnhancedPDFSourceLinkProps {
  source: PDFSource;
  documentUrl?: string;
  documentName?: string;
  className?: string;
}

export function EnhancedPDFSourceLink({
  source,
  documentUrl,
  documentName = "Document",
  className = ""
}: EnhancedPDFSourceLinkProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Enhanced PDF opening with text highlighting
  const handleOpenPDF = () => {
    if (documentUrl && source.exactText) {
      // Create search parameter for PDF highlighting
      const searchText = source.exactText.substring(0, 50).replace(/[^\w\s]/g, '').trim();

      // Try different PDF URL formats for highlighting
      const pdfUrl = `${documentUrl}#page=${source.page}&search=${encodeURIComponent(searchText)}`;

      window.open(pdfUrl, '_blank');
    } else if (documentUrl) {
      // Fallback to just page navigation
      const pdfUrl = `${documentUrl}#page=${source.page}`;
      window.open(pdfUrl, '_blank');
    }
  };

  const getRelevanceBadgeVariant = (relevance?: string) => {
    switch (relevance) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getRelevanceColor = (relevance?: string) => {
    switch (relevance) {
      case 'high': return 'text-emerald-800';
      case 'medium': return 'text-blue-800';
      case 'low': return 'text-slate-700';
      default: return 'text-slate-700';
    }
  };

  const getRelevanceBorderColor = (relevance?: string) => {
    switch (relevance) {
      case 'high': return 'border-emerald-200 bg-emerald-50';
      case 'medium': return 'border-blue-200 bg-blue-50';
      case 'low': return 'border-slate-200 bg-slate-50';
      default: return 'border-slate-200 bg-slate-50';
    }
  };

  return (
    <div className={`border-2 ${getRelevanceBorderColor(source.relevance)} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Enhanced Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 text-base">
                {source.section || `Page ${source.page}`}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Hash className="w-3 h-3" />
                <span>Page {source.page}</span>
              </div>
            </div>
            {source.relevance && (
              <Badge
                variant={getRelevanceBadgeVariant(source.relevance)}
                className="text-xs font-medium"
              >
                {source.relevance === 'high' && '🎯'}
                {source.relevance === 'medium' && '📍'}
                {source.relevance === 'low' && '📄'}
                {' '}{source.relevance} relevance
              </Badge>
            )}
          </div>
        </div>

        {documentUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPDF}
            className="h-9 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 font-medium"
          >
            {source.exactText ? (
              <>
                <Search className="w-3.5 h-3.5 mr-1.5" />
                View & Highlight
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View PDF
              </>
            )}
          </Button>
        )}
      </div>

      {/* Enhanced Quote Section */}
      {source.exactText && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Quote className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide bg-blue-100 px-2 py-1 rounded-full">
                    Direct Citation
                  </span>
                </div>
                <blockquote className={`text-sm leading-relaxed font-medium ${getRelevanceColor(source.relevance)} border-l-4 border-blue-300 pl-4 italic bg-gray-50 rounded-r-md py-2`}>
                  &ldquo;{isExpanded ? source.exactText : `${source.exactText.substring(0, 250)}${source.exactText.length > 250 ? '...' : ''}`}&rdquo;
                </blockquote>

                {source.exactText.length > 250 && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 mt-3 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-full border border-blue-200"
                    >
                      {isExpanded ? '⬆ Show less' : '⬇ Show full quote'}
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>
            </div>
          </div>

          <CollapsibleContent>
            {source.context && source.context !== source.exactText && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-xs text-slate-600 font-bold">···</span>
                  </div>
                  <span className="text-xs text-slate-700 font-semibold uppercase tracking-wide">
                    Document Context
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pl-7">
                  {source.context}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Basic page reference fallback */}
      {!source.exactText && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <FileText className="w-4 h-4" />
          <span>Referenced from page {source.page} of {documentName}</span>
        </div>
      )}
    </div>
  );
}

interface EnhancedPDFSourcesPanelProps {
  sources: PDFSource[];
  documentUrl?: string;
  documentName?: string;
  className?: string;
}

export function EnhancedPDFSourcesPanel({
  sources,
  documentUrl,
  documentName = "Document",
  className = ""
}: EnhancedPDFSourcesPanelProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const sortedSources = sources.sort((a, b) => {
    // Sort by relevance (high > medium > low) then by page number
    const relevanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    const aRelevance = relevanceOrder[a.relevance || 'medium'] || 2;
    const bRelevance = relevanceOrder[b.relevance || 'medium'] || 2;

    if (aRelevance !== bRelevance) {
      return bRelevance - aRelevance; // Higher relevance first
    }

    return a.page - b.page; // Then by page number
  });

  const highRelevanceCount = sources.filter(s => s.relevance === 'high').length;
  const mediumRelevanceCount = sources.filter(s => s.relevance === 'medium').length;

  return (
    <div className={`mt-6 p-5 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <span className="text-base font-semibold text-slate-800">
              Document Sources
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-600">
                {sources.length} citation{sources.length !== 1 ? 's' : ''} found
              </span>
              {highRelevanceCount > 0 && (
                <Badge variant="default" className="text-xs">
                  🎯 {highRelevanceCount} high relevance
                </Badge>
              )}
              {mediumRelevanceCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  📍 {mediumRelevanceCount} medium
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedSources.map((source, idx) => (
          <EnhancedPDFSourceLink
            key={`${source.page}-${idx}`}
            source={source}
            documentUrl={documentUrl}
            documentName={documentName}
          />
        ))}
      </div>
    </div>
  );
}

export default EnhancedPDFSourceLink;