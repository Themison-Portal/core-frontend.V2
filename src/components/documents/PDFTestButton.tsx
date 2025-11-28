import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PDFTestService } from '@/services/pdfTestService';

interface PDFTestButtonProps {
  documentUrl?: string;
  className?: string;
}

export function PDFTestButton({ documentUrl, className }: PDFTestButtonProps) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    if (!documentUrl) {
      alert('No document URL available to test');
      return;
    }

    setTesting(true);
    try {
      const testResults = await PDFTestService.runFullTest(documentUrl);
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
      setResults({
        corsTest: { canFetch: false, hasCorsProblem: true, error: error.message },
        pdfJsTest: { success: false, error: error.message },
        recommendation: 'Test execution failed'
      });
    }
    setTesting(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean, label: string) => {
    return (
      <Badge variant={success ? 'default' : 'destructive'} className="text-xs">
        {success ? '✅' : '❌'} {label}
      </Badge>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Button
        onClick={runTest}
        disabled={testing || !documentUrl}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <TestTube className="w-4 h-4" />
        {testing ? 'Testing PDF Access...' : 'Test PDF Processing'}
      </Button>

      {results && (
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            PDF Processing Test Results
          </h4>

          {/* CORS Test */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">CORS Access:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(results.corsTest.canFetch)}
              {getStatusBadge(results.corsTest.canFetch, results.corsTest.canFetch ? 'Accessible' : 'Blocked')}
            </div>
          </div>

          {/* PDF.js Test */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">PDF.js Extraction:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(results.pdfJsTest.success)}
              {getStatusBadge(results.pdfJsTest.success, results.pdfJsTest.success ? 'Working' : 'Failed')}
            </div>
          </div>

          {/* Sample Text */}
          {results.pdfJsTest.success && results.pdfJsTest.pageText && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
              <p className="text-xs text-green-800 font-medium mb-1">Sample extracted text:</p>
              <p className="text-xs text-green-700 leading-relaxed">
                "{results.pdfJsTest.pageText}"
              </p>
              {results.pdfJsTest.pageCount && (
                <p className="text-xs text-green-600 mt-1">
                  PDF has {results.pdfJsTest.pageCount} pages
                </p>
              )}
            </div>
          )}

          {/* Error Details */}
          {(!results.corsTest.canFetch || !results.pdfJsTest.success) && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-800 font-medium mb-1">Error details:</p>
              {results.corsTest.error && (
                <p className="text-xs text-red-700">CORS: {results.corsTest.error}</p>
              )}
              {results.pdfJsTest.error && (
                <p className="text-xs text-red-700">PDF.js: {results.pdfJsTest.error}</p>
              )}
            </div>
          )}

          {/* Recommendation */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-800 font-medium mb-1">Recommendation:</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  {results.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFTestButton;