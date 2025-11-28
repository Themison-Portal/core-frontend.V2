import React, { createContext, useContext, useState, useCallback } from "react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";

interface BreadcrumbContextType {
  items: BreadcrumbItem[];
  setBreadcrumb: (items: BreadcrumbItem[]) => void;
  clearBreadcrumb: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  const setBreadcrumb = useCallback((newItems: BreadcrumbItem[]) => {
    setItems(newItems);
  }, []);

  const clearBreadcrumb = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ items, setBreadcrumb, clearBreadcrumb }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}
