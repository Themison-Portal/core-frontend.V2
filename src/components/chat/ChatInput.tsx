import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  message: string;
  isLoading: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({
  message,
  isLoading,
  onMessageChange,
  onSubmit,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && message.trim()) {
        onSubmit(e as any);
      }
    }
  };

  const handleFileUpload = () => {
    // TODO: Implement file upload functionality
    console.log("File upload clicked");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-md"
    >
      <div className="flex gap-3 items-start">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[44px] max-h-[120px] resize-none border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            placeholder="Ask Assistant about your trials..."
            disabled={isLoading}
            rows={1}
          />

          {/* Character count */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">
              {message.length}
            </div>
          )}
        </div>

        <div className="flex gap-2 items-start">
          {/* File upload button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileUpload}
            disabled={isLoading}
            className="h-[44px] w-[44px] p-0 flex items-center justify-center"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Send button */}
          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-sm h-[44px] px-4 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
        <div className="text-right">
          <span>Powered by Groq AI</span>
        </div>
      </div>
    </form>
  );
}
