import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  AlertCircle,
  FileDown,
  ExternalLink,
  BookOpen,
  Zap,
  Settings,
  Bell,
  UserPlus,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDocument, useTrialDocuments } from "@/hooks/useDocuments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  getMockResponse,
  generateMockDocument,
} from "@/services/mockAIService";
import { PatientChecklistModal } from "./PatientChecklistModal";
import { DocumentPDFDrawer } from "./DocumentPDFDrawer";
import { ResponseActionButtons } from "./ResponseActionButtons";
import { EmailShareModal } from "./EmailShareModal";
import { useQARepository } from "@/hooks/useQARepository";
import { useDocumentChatHistory } from "@/hooks/useDocumentChatHistory";
import { ChatPDFFallbackAlert, useChatPDFFallbackContext } from "./ChatPDFFallbackProvider";
import { getBackendFallbackService } from "@/services/backendFallbackService";
import { getClaudeCitationsService } from "@/services/claudeCitationsService";
import { CleanPDFSourcesPanel } from "./CleanPDFSourceLink";
import { PDFTestButton } from "./PDFTestButton";

interface DocumentAIProps {
  trial: {
    id: string;
    name: string;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "llm";
  content: string;
  sources?: Array<{
    section: string;
    page?: number;
    content: string;
    exactText?: string;
    relevance?: 'high' | 'medium' | 'low';
    context?: string;
    highlightURL?: string;
  }>;
  downloadableTemplates?: Array<{
    title: string;
    type: "worksheet" | "checklist" | "report";
    filename: string;
  }>;
  quickActions?: Array<{
    title: string;
    icon: string;
    action: string;
    type: "download" | "generate" | "setup";
  }>;
  isStreaming?: boolean;
  streamedContent?: string;
}

export function DocumentAI({ trial }: DocumentAIProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Reading document...");

  // Checklist modal state
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<string>("");
  const [currentChecklistTitle, setCurrentChecklistTitle] =
    useState<string>("");

  // Email share modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentShareData, setCurrentShareData] = useState<{
    prompt: string;
    response: string;
    messageId: string;
  } | null>(null);

  // PDF reader drawer state
  const [showPDFDrawer, setShowPDFDrawer] = useState(false);
  const [pdfHighlightPage, setPdfHighlightPage] = useState<number | undefined>();
  const [pdfSearchText, setPdfSearchText] = useState<string | undefined>();

  // AI Service selector
  const [selectedAIService, setSelectedAIService] = useState<'backend' | 'chatpdf' | 'anthropic' | 'anthropic-mockup'>('backend');

  // QA Repository hook
  const { addQAItem } = useQARepository(trial.id);

  // Document Chat History hook
  const {
    createSessionWithMessage,
    addMessageAsync,
    getSessionMessages,
  } = useDocumentChatHistory(trial.id);

  // Track current session ID
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // ChatPDF Fallback context
  const fallbackContext = useChatPDFFallbackContext();
  const [showFallbackAlert, setShowFallbackAlert] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<{
    message: string;
    messageId: string;
  } | null>(null);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);

  // Get all documents and filter for active ones
  const { data: documents = [], isLoading: docsLoading } = useTrialDocuments(
    trial.id
  );
  const activeDocuments = documents.filter((doc) => doc.is_latest);

  // Get latest protocol as default
  const latestProtocol = activeDocuments.find(
    (doc) => doc.document_type === "protocol"
  );

  // Parse documentId from URL or use latest protocol as default
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get("documentId");
    setDocumentId(docId || latestProtocol?.id || null);
  }, [location.search, latestProtocol]);

  // Fetch document data
  const {
    data: document,
    isLoading: docLoading,
    error,
  } = useDocument(documentId || "");

  // Auto-scroll to bottom when chat changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Restore session from URL on mount
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get('sessionId');
    if (sessionIdFromUrl && sessionIdFromUrl !== currentSessionId) {
      loadChatFromHistory(sessionIdFromUrl);
    }
  }, [searchParams]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && query.trim() && documentId) {
        await handleSend(e as any);
      }
    }
  };

  // Rotate loading messages
  useEffect(() => {
    if (!isLoading) return;

    const messages = [
      "Reading document...",
      "Analyzing content...",
      "Processing information...",
      "Extracting citations...",
      "Thinking...",
      "Crafting response...",
    ];

    let currentIndex = 0;
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex]);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !documentId) return;

    const userMessage = query.trim();
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: userMessage,
    };

    setChat((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);
    setLoadingMessage("Reading document..."); // Reset to first message

    // Create session if this is the first message
    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const { sessionId: newSessionId } = await createSessionWithMessage(
          trial.id,
          documentId,
          userMessage
        );
        sessionId = newSessionId;
        setCurrentSessionId(newSessionId);

        // Update URL with new sessionId
        navigate(`/document-assistant/${trial.id}/document-ai?sessionId=${newSessionId}`, {
          replace: true
        });
      } catch (error) {
        console.error("Failed to create session:", error);
        // Continue anyway - don't block the user
      }
    } else {
      // Save user message to existing session
      try {
        await addMessageAsync({
          sessionId,
          role: "user",
          content: userMessage,
        });
      } catch (error) {
        console.error("Failed to save user message:", error);
        // Continue anyway
      }
    }

    try {
      const useMockAI = import.meta.env.VITE_USE_MOCK_AI === "true";

      if (useMockAI) {
        // Use mock AI service for demo
        console.log("🤖 Using Mock AI Service for demo");

        // Simulate API delay for realism
        await new Promise((resolve) =>
          setTimeout(resolve, 1500 + Math.random() * 1000)
        );

        const mockResponse = getMockResponse(userMessage, documentId);
        const responseId = `${Date.now()}-llm`;

        // Add initial streaming message WITHOUT sources/actions
        setChat((prev) => [
          ...prev,
          {
            id: responseId,
            role: "llm",
            content: "",
            streamedContent: "",
            isStreaming: true,
          },
        ]);

        // Start streaming the response
        setStreamingMessageId(responseId);
        await streamResponse(mockResponse.response, responseId, mockResponse);
      } else {
        // Use backend with ChatPDF fallback (with selected service)
        await handleBackendWithFallback(userMessage, documentId, selectedAIService, sessionId);
      }
    } catch (error) {
      console.error("Error with query:", error);
      setChat((prev) => [
        ...prev,
        {
          id: `${Date.now()}-llm`,
          role: "llm",
          content:
            "Sorry, I'm having trouble connecting to the AI service right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Stream response function for typing effect
  const streamResponse = async (
    fullText: string,
    messageId: string,
    mockResponse?: any
  ) => {
    const words = fullText.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + " ";

      setChat((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, streamedContent: currentText } : msg
        )
      );

      // Randomized delay for realistic typing effect
      await new Promise((resolve) =>
        setTimeout(resolve, 30 + Math.random() * 50)
      );
    }

    // Finish streaming and ADD sources/templates/actions
    setChat((prev) => {
      const updatedChat = prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              content: fullText,
              isStreaming: false,
              streamedContent: undefined,
              // Add sources/templates/actions AFTER streaming completes
              sources: mockResponse?.sources,
              downloadableTemplates: mockResponse?.downloadableTemplates,
              quickActions: mockResponse?.quickActions,
            }
          : msg
      );

      // Auto-save conversation after response completes
      saveCurrentChatToHistory(updatedChat);

      return updatedChat;
    });

    setStreamingMessageId(null);
  };

  // Load chat from history (when selecting from sidebar)
  const loadChatFromHistory = async (sessionId: string) => {
    try {
      const messages = await getSessionMessages(sessionId);
      setChat(messages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error("Failed to load chat from history:", error);
    }
  };

  const startNewChat = () => {
    // Reset session ID to create new session on next message
    setCurrentSessionId(null);
    setChat([]);

    // Clear sessionId from URL
    navigate(`/document-assistant/${trial.id}/document-ai`, { replace: true });
  };

  // Handle template download
  const handleDownloadTemplate = (template: {
    title: string;
    type: string;
    filename: string;
  }) => {
    try {
      const mockDoc = generateMockDocument(template);
      const url = URL.createObjectURL(mockDoc);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = template.filename;
      link.style.display = "none";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      // Fallback: just show success message
      alert(`Template "${template.title}" would be downloaded in production`);
    }
  };

  // Handle email share
  const handleEmailShare = (prompt: string, response: string, messageId: string) => {
    setCurrentShareData({ prompt, response, messageId });
    setShowEmailModal(true);
  };

  // Handle QA Repository add
  const handleQARepositoryAdd = async (
    prompt: string,
    response: string,
    sources?: Array<{
      section: string;
      page?: number;
      content: string;
      exactText?: string;
      relevance?: 'high' | 'medium' | 'low';
      context?: string;
      highlightURL?: string;
    }>
  ) => {
    try {
      await addQAItem(prompt, response, trial.id, [], sources);
    } catch (error) {
      console.error('Error adding to QA repository:', error);
      throw error; // Let ResponseActionButtons handle the error display
    }
  };

  // Handle backend with ChatPDF fallback
  const handleBackendWithFallback = async (
    userMessage: string,
    documentId: string,
    serviceType: 'backend' | 'chatpdf' | 'anthropic' | 'anthropic-mockup',
    sessionId: string | null
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error("No authentication token available");
    }

    try {
      // 🚀 Use AI Service Switcher (with user-selected service)
      const { getAIServiceSwitcher } = await import('../../services/aiServiceSwitcher');
      const aiService = getAIServiceSwitcher();

      console.log('🔧 Selected AI Service:', serviceType);

      const result = await aiService.query({
        message: userMessage,
        documentId,
        documentData: document,
        userId: token,
        limit: 5
      }, serviceType);

      console.log(`✅ Query successful via ${result.source}:`, result);
      if (result.cost) {
        console.log(`💰 Cost: $${result.cost.toFixed(4)} (${result.model})`);
      }

      // Sources are already in unified format from the adapter
      const formattedSources = result.sources;

      // Add the response to chat
      const responseId = `${Date.now()}-llm`;
      setChat((prev) => [
        ...prev,
        {
          id: responseId,
          role: "llm",
          content: result.response,
          sources: formattedSources,
        },
      ]);

      // Save assistant's response to DB
      if (sessionId) {
        try {
          await addMessageAsync({
            sessionId,
            role: "llm",
            content: result.response,
          });
        } catch (error) {
          console.error("Failed to save assistant response:", error);
        }
      }

      // Hide fallback alert if it was showing
      setShowFallbackAlert(false);
      setLastFailedQuery(null);
      
    } catch (error: unknown) {
      console.error('❌ Backend query failed:', error);
      
      // Check if this is a structured backend error that suggests fallback
      if (error.suggestFallback && fallbackContext.isEnabled) {
        console.log('💡 Suggesting ChatPDF fallback to user');
        setLastFailedQuery({
          message: userMessage,
          messageId: `${Date.now()}-llm`,
        });
        setShowFallbackAlert(true);
      } else {
        // Show regular error message
        throw error;
      }
    }
  };

  // Handle manual fallback attempt
  const handleFallbackAttempt = async () => {
    if (!lastFailedQuery || !fallbackContext.isEnabled) return;

    setIsFallbackLoading(true);
    setShowFallbackAlert(false);

    try {
      const result = await fallbackContext.attemptFallback(
        documentId!,
        lastFailedQuery.message,
        document
      );

      if (result.success) {
        console.log('✅ ChatPDF fallback successful');
        
        // Add the response to chat
        setChat((prev) => [
          ...prev,
          {
            id: lastFailedQuery.messageId,
            role: "llm",
            content: result.response || 'No response received',
            sources: result.sources?.map((source: any) => ({
              section: source.section,
              page: source.page,
              content: source.content,
              exactText: source.exactText || source.content,
              relevance: source.relevance || 'medium',
              context: source.context,
              highlightURL: source.highlightURL,
            })),
          },
        ]);
        
        setLastFailedQuery(null);
      } else {
        throw new Error(result.error || 'ChatPDF fallback failed');
      }
    } catch (error) {
      console.error('❌ ChatPDF fallback failed:', error);
      throw error;
    } finally {
      setIsFallbackLoading(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = (
    action: {
      title: string;
      icon: string;
      action: string;
      type: "download" | "generate" | "setup";
    },
    messageContent?: string
  ) => {
    if (action.action === "add_checklist_to_patient") {
      // Extract checklist from the current message content
      const checklistContent = messageContent || currentChecklist;
      setCurrentChecklist(checklistContent);
      setCurrentChecklistTitle("Medical Test Checklist");
      setShowChecklistModal(true);
    } else if (action.type === "download" || action.type === "generate") {
      // Generate and download the suggested template
      const template = {
        title: action.title,
        type: action.type === "generate" ? "worksheet" : "checklist",
        filename: action.action,
      };
      handleDownloadTemplate(template);
    } else {
      // Show setup/action confirmation
      alert(`${action.title} would be configured in production`);
    }
  };

  const formatDocumentType = (type: string) => {
    switch (type) {
      case "protocol":
        return "Protocol";
      case "brochure":
        return "Brochure";
      case "consent_form":
        return "Consent Form";
      case "report":
        return "Report";
      case "manual":
        return "Manual";
      case "plan":
        return "Plan";
      default:
        return type;
    }
  };

  // Document selector component
  let documentSelector = null;
  if (docsLoading || docLoading) {
    documentSelector = (
      <span className="text-gray-500 animate-pulse">Loading document...</span>
    );
  } else if (activeDocuments.length === 0) {
    documentSelector = (
      <span className="text-gray-500">(No active documents available)</span>
    );
  } else if (error) {
    documentSelector = (
      <span className="text-red-500">Error loading document</span>
    );
  } else {
    documentSelector = (
      <Select
        value={documentId || ""}
        onValueChange={(value) => setDocumentId(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a document..." />
        </SelectTrigger>
        <SelectContent>
          {activeDocuments.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              <div className="flex flex-col text-left">
                <span className="font-medium">{doc.document_name}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {formatDocumentType(doc.document_type)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="relative h-full">
      {/* Alert when no active documents are available */}
      {!docsLoading && activeDocuments.length === 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No active documents are available for this trial. Please upload
            documents first.
          </AlertDescription>
        </Alert>
      )}

      {/* ChatPDF Fallback Alert */}
      {showFallbackAlert && lastFailedQuery && (
        <div className="mb-4">
          <ChatPDFFallbackAlert
            onUseFallback={handleFallbackAttempt}
            isLoading={isFallbackLoading}
          />
        </div>
      )}

      {/* Messages container - scrolls above the fixed input */}
      <div className="h-full  pb-8 relative ">
        <div className="px-4 py-2 space-y-4 max-h-[56vh] min-h-[56vh] overflow-y-auto">
          {chat.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4">
              <div className="text-center space-y-6 max-w-2xl mx-auto">
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                    Document AI Assistant
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Ask questions about your protocol documents and get
                    intelligent responses with actionable insights.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 w-full max-w-lg">
                  <button
                    onClick={() => setQuery("Give me the inclusion/exclusion criteria for male patients 50-65 yo")}
                    className="group cursor-pointer p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all duration-200 text-left"
                  >
                    <p className="text-sm text-slate-700 group-hover:text-slate-800 leading-relaxed">
                      &ldquo;Give me the inclusion/exclusion criteria for male
                      patients 50-65 yo&rdquo;
                    </p>
                  </button>
                  <button
                    onClick={() => setQuery("What are the required medical test checklist")}
                    className="group cursor-pointer p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all duration-200 text-left"
                  >
                    <p className="text-sm text-slate-700 group-hover:text-slate-800 leading-relaxed">
                      &ldquo;What are the required medical test checklist&rdquo;
                    </p>
                  </button>
                  <button
                    onClick={() => setQuery("Generate a worksheet template for the schedule of activities")}
                    className="group cursor-pointer p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all duration-200 text-left"
                  >
                    <p className="text-sm text-slate-700 group-hover:text-slate-800 leading-relaxed">
                      &ldquo;Generate a worksheet template for the schedule of
                      activities&rdquo;
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
          {chat.map((msg) => (
            <div
              key={msg.id}
              className={`w-full flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`max-w-[80%] lg:max-w-[75%] ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-white border border-gray-200 text-gray-900 mr-auto"
                } rounded-lg px-5 py-4 shadow-sm`}
              >
                {msg.role === "user" ? (
                  <div className="text-sm leading-relaxed whitespace-pre-line font-medium">
                    {msg.content}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Main Response */}
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown>
                        {msg.isStreaming
                          ? msg.streamedContent || ""
                          : msg.content}
                      </ReactMarkdown>
                      {msg.isStreaming && (
                        <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-1 rounded-full"></span>
                      )}
                    </div>

                    {/* Enhanced Document Sources Panel - only show after streaming */}
                    {msg.sources &&
                      msg.sources.length > 0 &&
                      !msg.isStreaming && (
                        <>
                          <CleanPDFSourcesPanel
                            sources={msg.sources}
                            documentUrl={document?.document_url || document?.file_url}
                            documentName={document?.document_name || 'Protocol Document'}
                            onNavigatePDF={(page, searchText) => {
                              setPdfHighlightPage(page);
                              setPdfSearchText(searchText);
                              setShowPDFDrawer(true);
                            }}
                          />
                        </>
                      )}

                    {/* Downloadable Templates - only show after streaming */}
                    {msg.downloadableTemplates &&
                      msg.downloadableTemplates.length > 0 &&
                      !msg.isStreaming && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
                              <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <span className="text-sm font-medium text-emerald-900">
                              Ready to Download
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.downloadableTemplates.map((template, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-800 hover:text-emerald-900 hover:border-emerald-300 transition-colors"
                                onClick={() => handleDownloadTemplate(template)}
                              >
                                <FileDown className="w-3.5 h-3.5 mr-2" />
                                {template.title}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Quick Actions Panel */}
                    {msg.quickActions &&
                      msg.quickActions.length > 0 &&
                      !msg.isStreaming && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                              <Zap className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-indigo-900">
                              Suggested Actions
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.quickActions.map((action, idx) => {
                              const IconComponent =
                                action.icon === "FileDown"
                                  ? FileDown
                                  : action.icon === "Settings"
                                  ? Settings
                                  : action.icon === "Bell"
                                  ? Bell
                                  : action.icon === "UserPlus"
                                  ? UserPlus
                                  : Zap;
                              return (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-800 hover:text-indigo-900 hover:border-indigo-300 transition-colors"
                                  onClick={() =>
                                    handleQuickAction(action, msg.content)
                                  }
                                >
                                  <IconComponent className="w-3.5 h-3.5 mr-2" />
                                  {action.title}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Response Action Buttons - only show after streaming completes */}
                    {!msg.isStreaming && (
                      <ResponseActionButtons
                        messageContent={msg.content}
                        messageId={msg.id}
                        originalPrompt={
                          // Find the corresponding user message
                          chat.find(chatMsg =>
                            chatMsg.role === "user" &&
                            chat.indexOf(chatMsg) < chat.indexOf(msg)
                          )?.content || ""
                        }
                        trialId={trial.id}
                        sources={msg.sources}
                        onEmailShare={() => {
                          const userMessage = chat.find(chatMsg =>
                            chatMsg.role === "user" &&
                            chat.indexOf(chatMsg) < chat.indexOf(msg)
                          );
                          if (userMessage) {
                            handleEmailShare(userMessage.content, msg.content, msg.id);
                          }
                        }}
                        onQARepositoryAdd={async (prompt: string, response: string, sources) => {
                          await handleQARepositoryAdd(prompt, response, sources);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="w-full flex justify-start mb-4">
              <div className="max-w-[80%] lg:max-w-[75%] mr-auto bg-white border border-gray-200 rounded-lg px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-slate-600 transition-opacity duration-300">
                    {loadingMessage}
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Invisible div for auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input container - fixed at the bottom of this component */}
      <div className="bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-50 rounded-b-md z-10 ">
        {/* Document selector */}
        <div className="px-4 pt-3 pb-2 text-xs text-gray-600 flex items-center gap-3">
          <span className="font-medium text-gray-700 flex-shrink-0">
            Querying document:
          </span>
          <div className="flex-1 max-w-md">{documentSelector}</div>

          {/* AI Service Selector */}
          <Select value={selectedAIService} onValueChange={(value: any) => setSelectedAIService(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="chatpdf">ChatPDF</SelectItem>
              <SelectItem value="anthropic">Anthropic Claude</SelectItem>
              <SelectItem value="anthropic-mockup">Claude (Mockup)</SelectItem>
            </SelectContent>
          </Select>

          {/* PDF Reader Button */}
          {document && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPDFDrawer(true)}
              className="ml-2 flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">View PDF</span>
            </Button>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSend} className="p-4">
          <div className="flex gap-3 items-start">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-[44px] resize-none border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white overflow-y-auto"
                placeholder={
                  documentId
                    ? "Ask about eligibility criteria, medical tests, visit checklists, safety monitoring, or generate templates..."
                    : "Please select a document first"
                }
                disabled={isLoading || !documentId}
                rows={1}
              />

              {/* Character count */}
              {query.length > 0 && (
                <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                  {query.length}
                </div>
              )}
            </div>

            {/* Send button */}
            <Button
              type="submit"
              disabled={isLoading || !query.trim() || !documentId}
              className="bg-blue-600 hover:bg-blue-700 text-sm h-[44px] px-4 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </Button>
          </div>

          {/* Helper text */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </form>
      </div>

      {/* Patient Checklist Modal */}
      <PatientChecklistModal
        isOpen={showChecklistModal}
        onClose={() => {
          setShowChecklistModal(false);
          setCurrentChecklist("");
          setCurrentChecklistTitle("");
        }}
        checklistContent={currentChecklist}
        checklistTitle={currentChecklistTitle}
      />

      {/* Email Share Modal */}
      {currentShareData && (
        <EmailShareModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setCurrentShareData(null);
          }}
          messageContent={currentShareData.response}
          originalPrompt={currentShareData.prompt}
          trialId={trial.id}
        />
      )}

      {/* PDF Reader Drawer */}
      {document && (
        <DocumentPDFDrawer
          isOpen={showPDFDrawer}
          onClose={() => setShowPDFDrawer(false)}
          documentUrl={document.document_url || document.file_url || ''}
          documentName={document.document_name || 'Document'}
          highlightedPage={pdfHighlightPage}
          searchText={pdfSearchText}
        />
      )}
    </div>
  );
}
