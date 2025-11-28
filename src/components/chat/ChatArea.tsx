import React from "react";
import type { ChatMessage } from "./types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  ArtifactRenderer: React.ComponentType<{ content: string }>;
}

export function ChatArea({
  messages,
  isLoading,
  ArtifactRenderer,
}: ChatAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
      {messages.length === 0 ? (
        <div className="text-sm text-gray-500 text-center mt-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Welcome to AI Assistant
            </p>
            <p className="text-gray-500">
              Ask me anything about your clinical trials, budgets, patients, or
              team members.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-2xl mx-auto">
            <div className="p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-700">
                Financial Overview
              </p>
              <p className="text-xs text-gray-500 mt-1">
                "Show me a budget summary for all trials"
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-700">
                Trial Analytics
              </p>
              <p className="text-xs text-gray-500 mt-1">
                "Which trials have the highest patient enrollment?"
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-700">Team Insights</p>
              <p className="text-xs text-gray-500 mt-1">
                "How many team members are working on Phase II trials?"
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-700">Cost Analysis</p>
              <p className="text-xs text-gray-500 mt-1">
                "What's our burn rate across all active trials?"
              </p>
            </div>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] ${
                message.role === "user"
                  ? "bg-blue-400 text-white p-3 rounded-lg text-sm"
                  : message.hasArtifact
                  ? "bg-white border border-slate-200 rounded-lg p-3 text-sm"
                  : "bg-gray-100 text-gray-900 p-3 rounded-lg text-sm"
              }`}
            >
              {message.role === "assistant" && message.hasArtifact ? (
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Data Analysis
                    </span>
                  </div>
                  <ArtifactRenderer content={message.content} />
                </div>
              ) : (
                <div>
                  <div className="prose prose-sm max-w-none">
                    <MarkdownRenderer content={message.content} />
                  </div>
                  {message.timestamp && (
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-900 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <div className="animate-pulse">●</div>
              <div className="animate-pulse" style={{ animationDelay: "0.2s" }}>
                ●
              </div>
              <div className="animate-pulse" style={{ animationDelay: "0.4s" }}>
                ●
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
