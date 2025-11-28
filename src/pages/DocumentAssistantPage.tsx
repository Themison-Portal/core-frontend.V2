import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { TrialSelector } from "@/components/documents/TrialSelector.tsx";
import { DocumentAssistantTabs } from "@/components/documents/DocumentAssistantTabs";
import { ActiveDocuments } from "@/components/documents/ActiveDocuments";
import { DocumentAI } from "@/components/documents/DocumentAI";
import { QARepository } from "@/components/documents/QARepository";
import { ChatPDFFallbackProvider } from "@/components/documents/ChatPDFFallbackProvider";
import { MessageSquare } from "lucide-react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { TrialDropdownBreadcrumb } from "@/components/common/breadcrumbs/TrialDropdownBreadcrumb";
import { DocumentRag } from "@/components/documents/DocumentRag";

const tabNames: Record<string, string> = {
  "document-ai": "Document AI",
  "active-documents": "Active Documents",
  "qa-repository": "QA Repository",
  "select-trial": "Select Trial",
  "rag": "RAG",
};

export default function DocumentAssistantPage() {
  const { trialId, tab } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { metrics, isUserAssignedToTrial } = useAppData();
  const trials = metrics?.trials || [];

  const from = searchParams.get("from") || "other";
  const currentTab = tab || "active-documents";
  console.log("DocumentAssistantPage - currentTab:", currentTab);
  // Validar que el trial existe y el usuario tiene acceso
  const selectedTrial = trialId ? trials.find((t) => t.id === trialId) : null;

  // Breadcrumb base
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Document Assistant",
      href: "/document-assistant/select-trial",
      icon: MessageSquare,
    },
  ];

  // Siempre agregamos el selector de trial
  breadcrumbItems.push({
    customContent: (
      <TrialDropdownBreadcrumb
        currentTrial={
          selectedTrial || {
            id: "",
            name: "Select Trial",
          }
        }
        basePath="/document-assistant"
        className="px-2 py-1 -ml-2"
      />
    ),
  });

  // Si no hay trialId, mostrar selector de trial
  if (!trialId) {
    return (
      <AppLayout title="Document Assistant" breadcrumbItems={breadcrumbItems}>
        <TrialSelector from={from} />
      </AppLayout>
    );
  }

  // Validar acceso al trial
  if (!selectedTrial) {
    return (
      <AppLayout title="Document Assistant" breadcrumbItems={breadcrumbItems}>
        <TrialError message="Trial not found" />
      </AppLayout>
    );
  }

  if (!isUserAssignedToTrial(trialId)) {
    return (
      <AppLayout title="Document Assistant" breadcrumbItems={breadcrumbItems}>
        <TrialError message="You don't have access to this trial" />
      </AppLayout>
    );
  }

  // Agregar tab actual al breadcrumb
  if (currentTab && tabNames[currentTab]) {
    breadcrumbItems.push({
      label: tabNames[currentTab],
      isActive: true,
    });
  }

  return (
    <AppLayout title="Document Assistant" breadcrumbItems={breadcrumbItems}>
      <div className="flex-1 flex flex-col h-full">
        <DocumentAssistantTabs
          currentTab={currentTab}
          onTabChange={(newTab) =>
            navigate(`/document-assistant/${trialId}/${newTab}`)
          }
        />

        <div className="flex-1 h-0 relative">
          <ChatPDFFallbackProvider>
            <DocumentAssistantContent
              trial={selectedTrial}
              currentTab={currentTab}
            />
          </ChatPDFFallbackProvider>
        </div>
      </div>
    </AppLayout>
  );
}

// Error component
function TrialError({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-red-600">{message}</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}

// Content router component
function DocumentAssistantContent({
  trial,
  currentTab,
}: {
  trial: {
    id: string;
    name: string;
  };
  currentTab: string;
}) {
  switch (currentTab) {
    case "document-ai":
      return <DocumentAI trial={trial} />;
    case "active-documents":
      return <ActiveDocuments trial={trial} />;
    case "qa-repository":
      return <QARepository trial={trial} />;
    case "rag":
      return <DocumentRag trial={trial} />;
    default:
      return <ActiveDocuments trial={trial} />;
  }
}
