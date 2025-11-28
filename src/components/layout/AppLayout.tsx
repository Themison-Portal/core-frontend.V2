import React from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { AppSidebar } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbItems: BreadcrumbItem[];
}

export function AppLayout({
  children,
  title,
  breadcrumbItems,
}: AppLayoutProps) {
  return (
    <div className="h-screen flex bg-white">
      {/* Static sidebar for desktop */}
      <div className="flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <AppSidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-0">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                {breadcrumbItems.length > 0 ? (
                  <Breadcrumb
                    items={breadcrumbItems}
                    variant="header"
                    className="mr-8"
                  />
                ) : (
                  <h1 className="text-xl font-semibold text-gray-900 mr-8">
                    {title}
                  </h1>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area with scroll */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 sm:p-6 lg:p-8 pb-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
