import React from "react";
import { FileText, Upload, MessageSquare, Brain } from "lucide-react";

interface DocumentAssistantTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function DocumentAssistantTabs({
  currentTab,
  onTabChange,
}: DocumentAssistantTabsProps) {
  const tabs = [
    { id: "active-documents", label: "Active Documents", icon: Upload },
    { id: "document-ai", label: "Document AI", icon: FileText },
    { id: "qa-repository", label: "QA Repository", icon: MessageSquare },
    { id: "rag", label: "RAG", icon: Brain },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-200 bg-white rounded-t-2xl">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 transition-colors ${
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
