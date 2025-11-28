import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  Zap,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react";
import { useChatPDFFallback } from "@/hooks/useChatPDFFallback";
import { isChatPDFEnabled, shouldUseChatPDFAsPrimary } from "@/services/chatPDFService";

interface FallbackAttempt {
  timestamp: number;
  success: boolean;
  error?: string;
  question?: string;
  response?: string;
}

interface ChatPDFFallbackContextType {
  // State
  isEnabled: boolean;
  isPrimaryMode: boolean;
  lastFallbackAttempt: FallbackAttempt | null;
  fallbackHistory: FallbackAttempt[];
  
  // Functions
  attemptFallback: (documentId: string, question: string, documentData?: {
    document_name?: string;
    document_url?: string;
    file_url?: string;
    file_size?: number;
    mime_type?: string;
  }) => Promise<{
    success: boolean;
    response?: string;
    sources?: Array<{
      section: string;
      page?: number;
      content: string;
    }>;
    error?: string;
  }>;
  clearHistory: () => void;
  testConnection: () => Promise<boolean>;
}

const ChatPDFFallbackContext = createContext<ChatPDFFallbackContextType | null>(null);

interface ChatPDFFallbackProviderProps {
  children: React.ReactNode;
}

export function ChatPDFFallbackProvider({ children }: ChatPDFFallbackProviderProps) {
  const [fallbackHistory, setFallbackHistory] = useState<FallbackAttempt[]>([]);
  const [lastFallbackAttempt, setLastFallbackAttempt] = useState<FallbackAttempt | null>(null);

  const chatPDF = useChatPDFFallback({
    onSuccess: (result) => {
      console.log('✅ ChatPDF Fallback: Success callback triggered');
    },
    onError: (error) => {
      console.error('❌ ChatPDF Fallback: Error callback triggered:', error);
    },
  });

  const attemptFallback = useCallback(async (
    documentId: string, 
    question: string, 
    documentData?: {
      document_name?: string;
      document_url?: string;
      file_url?: string;
      file_size?: number;
      mime_type?: string;
    }
  ) => {
    console.log('🔄 ChatPDF Fallback Provider: Attempting fallback');

    const startTime = Date.now();
    
    try {
      const result = await chatPDF.queryWithChatPDF(documentId, question, documentData);
      
      const attempt: FallbackAttempt = {
        timestamp: startTime,
        success: result.success,
        error: result.error,
        question,
        response: result.response,
      };

      setLastFallbackAttempt(attempt);
      setFallbackHistory(prev => [attempt, ...prev].slice(0, 10)); // Keep last 10 attempts

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const attempt: FallbackAttempt = {
        timestamp: startTime,
        success: false,
        error: errorMessage,
        question,
      };

      setLastFallbackAttempt(attempt);
      setFallbackHistory(prev => [attempt, ...prev].slice(0, 10));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [chatPDF]);

  const clearHistory = useCallback(() => {
    setFallbackHistory([]);
    setLastFallbackAttempt(null);
  }, []);

  const testConnection = useCallback(async () => {
    return await chatPDF.testConnection();
  }, [chatPDF]);

  const contextValue: ChatPDFFallbackContextType = {
    isEnabled: chatPDF.isAvailable,
    isPrimaryMode: chatPDF.isPrimaryMode,
    lastFallbackAttempt,
    fallbackHistory,
    attemptFallback,
    clearHistory,
    testConnection,
  };

  return (
    <ChatPDFFallbackContext.Provider value={contextValue}>
      {children}
    </ChatPDFFallbackContext.Provider>
  );
}

export function useChatPDFFallbackContext() {
  const context = useContext(ChatPDFFallbackContext);
  if (!context) {
    throw new Error('useChatPDFFallbackContext must be used within a ChatPDFFallbackProvider');
  }
  return context;
}

/**
 * Status indicator component showing ChatPDF fallback status
 */
interface ChatPDFStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function ChatPDFStatusIndicator({ 
  className = "", 
  showDetails = false 
}: ChatPDFStatusIndicatorProps) {
  const { isEnabled, isPrimaryMode, lastFallbackAttempt, testConnection } = useChatPDFFallbackContext();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {isEnabled ? (
          <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200">
            <Shield className="w-3 h-3 mr-1" />
            ChatPDF {isPrimaryMode ? 'Primary' : 'Fallback'} Ready
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-orange-700 bg-orange-50 border-orange-200">
            <XCircle className="w-3 h-3 mr-1" />
            ChatPDF Unavailable
          </Badge>
        )}

        {isEnabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="h-6 px-2 text-xs"
          >
            {isTesting ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Settings className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>

      {showDetails && lastFallbackAttempt && (
        <div className="text-xs text-gray-600">
          Last attempt: {lastFallbackAttempt.success ? '✅' : '❌'} 
          {' '}{new Date(lastFallbackAttempt.timestamp).toLocaleTimeString()}
          {lastFallbackAttempt.error && (
            <div className="text-red-600 mt-1">{lastFallbackAttempt.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Alert component for when backend fails and fallback is available
 */
interface ChatPDFFallbackAlertProps {
  onUseFallback: () => void;
  isLoading?: boolean;
}

export function ChatPDFFallbackAlert({ onUseFallback, isLoading }: ChatPDFFallbackAlertProps) {
  const { isEnabled } = useChatPDFFallbackContext();

  if (!isEnabled) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-medium text-amber-800">Backend unavailable.</span>
          <span className="text-amber-700 ml-1">
            Would you like to try our ChatPDF fallback service?
          </span>
        </div>
        <Button
          onClick={onUseFallback}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Trying...' : 'Use Fallback'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}