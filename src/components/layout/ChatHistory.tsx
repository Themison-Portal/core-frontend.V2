import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { History, Clock, MessageSquare } from "lucide-react";
import { useDocumentChatHistory } from "@/hooks/useDocumentChatHistory";

interface ChatMessage {
  id: string;
  role: "user" | "llm";
  content: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
  trialId: string;
}

export const ChatHistory = () => {
  const location = useLocation();
  const { trialId } = useParams();

  // Only show on document-assistant routes
  const isDocumentAssistant = location.pathname.startsWith("/document-assistant");
  const isDocumentAI = location.pathname.includes("/document-ai");
  if (!isDocumentAssistant) return null;

  // Use the document chat history hook
  const { sessions, isLoadingSessions, refetchSessions } = useDocumentChatHistory(trialId);

  // Convert DB sessions to UI format
  const chatHistory: ChatHistoryItem[] = sessions.map((session) => ({
    id: session.id,
    title: session.title || "Untitled Chat",
    timestamp: session.updated_at ? new Date(session.updated_at) : new Date(),
    messages: session.messages || [],
    trialId: session.trial_id || trialId || "",
  }));

  useEffect(() => {
    // Refetch when trial changes
    if (trialId) {
      refetchSessions();
    }
  }, [trialId, refetchSessions]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'now';
  };

  const handleNewChat = () => {
    // Navigate to document-ai WITHOUT sessionId to start fresh
    window.location.href = `/document-assistant/${trialId}/document-ai`;
  };

  return (
    <div className="pt-4 border-t border-gray-200">
      {/* New Chat Button - only show on document-ai route */}
      {isDocumentAI && (
        <div className="px-3 mb-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="text-lg">+</span>
            New Chat
          </button>
        </div>
      )}
      
      <div className="px-3 mb-2 flex items-center gap-2">
        <History className="h-4 w-4 text-gray-500" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Recent Chats
        </p>
      </div>
      
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {chatHistory.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs text-gray-400">No chats yet</p>
          </div>
        ) : (
          chatHistory.map((item) => (
            <Link
              key={item.id}
              to={`/document-assistant/${trialId}/document-ai?sessionId=${item.id}`}
              className="block px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-md transition-colors group"
            >
              <div className="space-y-1">
                <div className="font-medium text-gray-800 line-clamp-2 group-hover:text-blue-600 text-xs leading-tight">
                  {item.title}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(item.timestamp)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};