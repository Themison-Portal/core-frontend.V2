import React from "react";
import { ExternalLink, FileText, Quote } from "lucide-react";
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

interface PDFSourceLinkProps {
  source: PDFSource;
  documentUrl?: string;
  documentName?: string;
  className?: string;
  onNavigatePDF?: (page: number, searchText: string) => void;
}

export function PDFSourceLink({
  source,
  documentUrl,
  documentName = "Document",
  className = "",
  onNavigatePDF
}: PDFSourceLinkProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleOpenPDF = () => {
    if (onNavigatePDF) {
      // Use the callback to open PDF drawer with highlighting
      console.log('🔗 Opening PDF drawer for source:', { page: source.page, text: source.exactText?.substring(0, 50) });
      onNavigatePDF(source.page, source.exactText || '');
    } else if (documentUrl) {
      // Fallback to opening in new tab
      const pdfUrl = documentUrl.includes('#page=')
        ? documentUrl
        : `${documentUrl}#page=${source.page}`;
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
      case 'high': return 'text-emerald-700';
      case 'medium': return 'text-blue-700';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white ${className}`}>
      {/* Header with page info and relevance */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">
              {source.section || `Page ${source.page}`}
            </span>
          </div>

          {source.relevance && (
            <Badge
              variant={getRelevanceBadgeVariant(source.relevance)}
              className="text-xs"
            >
              {source.relevance} relevance
            </Badge>
          )}
        </div>

        {documentUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenPDF}
            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            View PDF
          </Button>
        )}
      </div>

      {/* Exact text excerpt if available */}
      {source.exactText && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
            <div className="flex items-start gap-2">
              <Quote className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${getRelevanceColor(source.relevance)}`}>
                  {isExpanded ? source.exactText : `${source.exactText.substring(0, 150)}...`}
                </p>

                {source.exactText.length > 150 && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-0 mt-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>
            </div>
          </div>

          <CollapsibleContent>
            {source.context && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800 font-medium mb-1">Context:</p>
                <p className="text-xs text-blue-700 leading-relaxed">{source.context}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Basic page reference fallback */}
      {!source.exactText && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Referenced from page {source.page} of {documentName}</span>
        </div>
      )}
    </div>
  );
}

interface PDFSourcesPanelProps {
  sources: PDFSource[];
  documentUrl?: string;
  documentName?: string;
  className?: string;
  onNavigatePDF?: (page: number, searchText: string) => void;
}

export function PDFSourcesPanel({
  sources,
  documentUrl,
  documentName = "Document",
  className = "",
  onNavigatePDF
}: PDFSourcesPanelProps) {
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

  return (
    <div className={`mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <span className="text-sm font-medium text-slate-800">
          Document Sources ({sources.length})
        </span>
      </div>

      <div className="space-y-3">
        {sortedSources.map((source, idx) => (
          <PDFSourceLink
            key={`${source.page}-${idx}`}
            source={source}
            documentUrl={documentUrl}
            documentName={documentName}
            onNavigatePDF={onNavigatePDF}
          />
        ))}
      </div>
    </div>
  );
}

export default PDFSourceLink;