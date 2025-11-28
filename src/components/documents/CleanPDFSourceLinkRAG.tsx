import React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PDFSource {
  page: number;
  name?: string;
  section?: string;
  exactText?: string;
  relevance?: 'high' | 'medium' | 'low';
  context?: string;
  highlightURL?: string;
}

interface CleanPDFSourceLinkProps {
  source: PDFSource;
  documentUrl?: string;
  documentName?: string;
  className?: string;
  onNavigatePDF?: (page: number, searchText: string) => void;
}

export function CleanPDFSourceLinkRAG({
  source,
  documentUrl,
  documentName = "Document",
  className = "",
  onNavigatePDF
}: CleanPDFSourceLinkProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleOpenPDF = () => {
    if (onNavigatePDF) {
      // Use the callback to open PDF drawer with highlighting
      console.log('🔗 Opening PDF drawer for source:', { page: source.page, text: source.exactText?.substring(0, 50) });
      onNavigatePDF(source.page, source.exactText || '');
    } else {
      // Fallback to opening in new tab
      const targetUrl = source.highlightURL || (documentUrl ? `${documentUrl}#page=${source.page}` : null);
      if (targetUrl) {
        window.open(targetUrl, '_blank');
      }
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

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors ${className}`}>
      {/* Simple header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">
            {`${source.name ? `${source.name} - ` : ""}${source.section || `Page ${source.page}`}`}
          </span>
          {source.relevance && (
            <Badge variant={getRelevanceBadgeVariant(source.relevance)} className="text-xs">
              {source.relevance}
            </Badge>
          )}
        </div>

        {(source.highlightURL || documentUrl) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPDF}
            className="text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            {source.highlightURL ? 'Highlight & View' : 'View PDF'}
          </Button>
        )}
      </div>

      {/* Clean text display */}
      {source.exactText && (
        <div className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-500">
          <p className="text-sm text-gray-700 leading-relaxed">
            {isExpanded ? source.exactText : `${source.exactText.substring(0, 200)}${source.exactText.length > 200 ? '...' : ''}`}
          </p>

          {source.exactText.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2 underline"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface CleanPDFSourcesPanelProps {
  sources: any[]; // Use any[] to accept sources with highlightURL
  documentUrl?: string;
  documentName?: string;
  className?: string;
  onNavigatePDF?: (page: number, searchText: string) => void;
}

export function CleanPDFSourcesPanelRAG({
  sources,
  documentUrl,
  documentName = "Document",
  className = "",
  onNavigatePDF
}: CleanPDFSourcesPanelProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Remove duplicates based on page + exactText
  const uniqueSources = sources.filter((source, index, self) =>
    index === self.findIndex(s =>
      s.page === source.page &&
      s.exactText === source.exactText
    )
  );

  const sortedSources = uniqueSources.sort((a, b) => {
    const relevanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    const aRelevance = relevanceOrder[a.relevance || 'medium'] || 2;
    const bRelevance = relevanceOrder[b.relevance || 'medium'] || 2;

    if (aRelevance !== bRelevance) {
      return bRelevance - aRelevance;
    }

    return a.page - b.page;
  });

  return (
    <div className={`mt-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          Document Sources ({sortedSources.length})
        </span>
      </div>

      <div className="space-y-3">
        {sortedSources.map((source, idx) => (
          <CleanPDFSourceLinkRAG
            key={`${source.page}-${source.exactText?.substring(0, 50)}-${idx}`}
            source={{
              page: source.page,
              name: source.filename || '',
              section: source.section,
              exactText: source.exactText || source.content,
              relevance: source.relevance,
              context: source.context,
              highlightURL: source.highlightURL
            }}
            documentUrl={documentUrl}
            documentName={documentName}
            onNavigatePDF={onNavigatePDF}
          />
        ))}
      </div>
    </div>
  );
}

export default CleanPDFSourceLinkRAG;