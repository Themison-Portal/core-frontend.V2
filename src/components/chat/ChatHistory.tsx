import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import type { ChatSession } from "./types";

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ChatHistory({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: ChatHistoryProps) {
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat session?")) {
      onDeleteSession(sessionId);
    }
  };

  const formatSessionTitle = (session: ChatSession) => {
    // Use first user message as title, truncated
    const firstUserMessage = session.messages.find((m) => m.role === "user");
    if (firstUserMessage && firstUserMessage.content.length > 0) {
      return firstUserMessage.content.length > 40
        ? firstUserMessage.content.substring(0, 40) + "..."
        : firstUserMessage.content;
    }
    return session.title || "New Chat";
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="h-full min-h-[500px] max-h-[700px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-md">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
          <Button
            onClick={onNewChat}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-sm mb-2">No chat history yet</p>
            <p className="text-gray-400 text-xs">
              Start a new conversation with the AI Assistant
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentSessionId === session.id
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {formatSessionTitle(session)}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {session.messages.length} messages
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(session.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Delete button - visible on hover */}
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded text-red-500 hover:bg-red-50"
                    title="Delete chat"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-md">
        <p className="text-xs text-gray-500 text-center">
          Chat history will be automatically saved
        </p>
      </div>
    </Card>
  );
}
