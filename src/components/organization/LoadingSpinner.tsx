import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <Loader2
          className={`${sizeClasses[size]} text-blue-600 animate-spin`}
        />
        <div className="absolute inset-0 rounded-full bg-blue-100 animate-pulse opacity-20" />
      </div>
      {message && (
        <p className="text-sm text-gray-600 animate-pulse">{message}</p>
      )}
    </div>
  );
}
