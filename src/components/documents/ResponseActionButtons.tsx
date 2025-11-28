import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Mail, 
  BookOpen,
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Source {
  section: string;
  page?: number;
  content: string;
  exactText?: string;
  relevance?: 'high' | 'medium' | 'low';
  context?: string;
  highlightURL?: string;
}

interface ResponseActionButtonsProps {
  messageContent: string;
  messageId: string;
  originalPrompt: string;
  trialId: string;
  sources?: Source[];
  onEmailShare?: () => void;
  onQARepositoryAdd?: (prompt: string, response: string, sources?: Source[]) => void;
}

export function ResponseActionButtons({
  messageContent,
  messageId,
  originalPrompt,
  trialId,
  sources,
  onEmailShare,
  onQARepositoryAdd
}: ResponseActionButtonsProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isAddingToQA, setIsAddingToQA] = useState(false);

  const handleExportLocal = async () => {
    setIsExporting(true);
    try {
      // Generar contenido HTML para exportar
      const htmlContent = generateExportHTML(originalPrompt, messageContent, trialId);
      
      // Crear blob y descargar
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document-ai-conversation-${Date.now()}.html`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Completed",
        description: "Conversation exported successfully",
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the conversation",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailShare = () => {
    if (onEmailShare) {
      onEmailShare();
    }
  };

  const handleQARepositoryAdd = async () => {
    setIsAddingToQA(true);
    try {
      if (onQARepositoryAdd) {
        await onQARepositoryAdd(originalPrompt, messageContent, sources);
        toast({
          title: "Added to Q&A Repository",
          description: "Question, answer and sources saved for future reference",
        });
      }
    } catch (error) {
      console.error('Error adding to Q&A repository:', error);
      toast({
        title: "Failed to Add",
        description: "Could not add to Q&A repository",
        variant: "destructive",
      });
    } finally {
      setIsAddingToQA(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center">
          <Download className="w-3.5 h-3.5 text-slate-600" />
        </div>
        <span className="text-sm font-medium text-slate-800">
          Actions
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Exportar Local Button */}
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-blue-50 border-blue-200 text-blue-800 hover:text-blue-900 hover:border-blue-300 transition-colors"
          onClick={handleExportLocal}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 mr-2" />
          )}
          {isExporting ? "Exporting..." : "Export Local"}
        </Button>

        {/* Compartir Email Button */}
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-green-50 border-green-200 text-green-800 hover:text-green-900 hover:border-green-300 transition-colors"
          onClick={handleEmailShare}
        >
          <Mail className="w-3.5 h-3.5 mr-2" />
          Share Email
        </Button>

        {/* Q&A Repository Button */}
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-purple-50 border-purple-200 text-purple-800 hover:text-purple-900 hover:border-purple-300 transition-colors"
          onClick={handleQARepositoryAdd}
          disabled={isAddingToQA}
        >
          {isAddingToQA ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : (
            <BookOpen className="w-3.5 h-3.5 mr-2" />
          )}
          {isAddingToQA ? "Adding..." : "Q&A Repository"}
        </Button>
      </div>
    </div>
  );
}

// Helper function to generate HTML content for export
function generateExportHTML(prompt: string, response: string, trialId: string): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document AI Conversation - ${currentDate}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            color: #1e293b;
            font-size: 28px;
            font-weight: 700;
        }
        .header .meta {
            color: #64748b;
            font-size: 14px;
            margin-top: 8px;
        }
        .conversation {
            space-y: 24px;
        }
        .message {
            margin-bottom: 32px;
        }
        .message-user {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        .message-user h3 {
            margin: 0 0 12px 0;
            color: #1e40af;
            font-size: 16px;
            font-weight: 600;
        }
        .message-user .content {
            color: #1e293b;
            white-space: pre-line;
        }
        .message-assistant {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
        }
        .message-assistant h3 {
            margin: 0 0 16px 0;
            color: #059669;
            font-size: 16px;
            font-weight: 600;
        }
        .message-assistant .content {
            color: #1e293b;
            white-space: pre-line;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
        }
        .footer .logo {
            font-weight: 600;
            color: #3b82f6;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Document AI Conversation</h1>
            <div class="meta">
                <strong>Trial ID:</strong> ${trialId} <br>
                <strong>Exported:</strong> ${currentDate} <br>
                <strong>Generated by:</strong> Themison Document AI Assistant
            </div>
        </div>
        
        <div class="conversation">
            <div class="message">
                <div class="message-user">
                    <h3>🔍 User Question</h3>
                    <div class="content">${prompt}</div>
                </div>
                
                <div class="message-assistant">
                    <h3>🤖 AI Assistant Response</h3>
                    <div class="content">${response}</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="logo">Themison Clinical AI Assistant</div>
            <div>Powered by advanced RAG technology for clinical trials</div>
            <div style="margin-top: 8px;">Document ID: conversation_${Date.now()}</div>
        </div>
    </div>
</body>
</html>`;
}