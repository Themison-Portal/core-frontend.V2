import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PDFReader } from "./PDFReader";

interface DocumentPDFDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
  highlightedPage?: number;
  searchText?: string;
}

export function DocumentPDFDrawer({
  isOpen,
  onClose,
  documentUrl,
  documentName,
  highlightedPage,
  searchText,
}: DocumentPDFDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[50vw] !max-w-none p-0 flex flex-col"
      >
        <div className="flex-1 overflow-auto relative">
          {/* Close button floating */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-white/80 hover:bg-white shadow-sm"
          >
            <X className="h-3 w-3" />
          </Button>
          <PDFReader
            fileUrl={documentUrl}
            fileName={documentName}
            highlightedPage={highlightedPage}
            searchText={searchText}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
