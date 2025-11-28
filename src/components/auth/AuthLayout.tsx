import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  organizationMessage?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  organizationMessage,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-auto mb-6 flex items-center justify-center">
            <img
              src="/assets/logo.svg"
              alt="THEMISON Logo"
              className="h-6 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          {organizationMessage && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                {organizationMessage}
              </p>
            </div>
          )}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">{children}</div>
      </div>
    </div>
  );
}
