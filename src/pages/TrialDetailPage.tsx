import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { TrialManager } from "@/components/trials/TrialManager";
import { FlaskConical } from "lucide-react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { TrialDropdownBreadcrumb } from "@/components/common/breadcrumbs/TrialDropdownBreadcrumb";

const tabNames = {
  overview: "Overview",
  "document-hub": "Document Hub",
  team: "Team",
  patients: "Patients",
};

export default function TrialDetailPage() {
  const { trialId, tab } = useParams();
  const navigate = useNavigate();
  const { metrics, isUserAssignedToTrial } = useAppData();
  const trials = metrics?.trials || [];

  const currentTab =
    (tab as "overview" | "document-hub" | "team" | "patients") || "overview";

  // Validate trial exists and user has access
  const selectedTrial = trials.find((t) => t.id === trialId);

  // Base breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Trials",
      href: "/trials",
      icon: FlaskConical,
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
        basePath="/trials"
        className="px-2 py-1 -ml-2"
      />
    ),
  });

  if (!selectedTrial) {
    return (
      <AppLayout title="Trial Details" breadcrumbItems={breadcrumbItems}>
        <TrialError message="Trial not found" />
      </AppLayout>
    );
  }

  if (!isUserAssignedToTrial(trialId!)) {
    return (
      <AppLayout title="Trial Details" breadcrumbItems={breadcrumbItems}>
        <TrialError message="You don't have access to this trial" />
      </AppLayout>
    );
  }

  // Add current tab to breadcrumb
  if (currentTab && tabNames[currentTab]) {
    breadcrumbItems.push({
      label: tabNames[currentTab],
      isActive: true,
    });
  }

  const handleTabChange = (newTab: string) => {
    navigate(`/trials/${trialId}/${newTab}`);
  };

  return (
    <AppLayout title={selectedTrial.name} breadcrumbItems={breadcrumbItems}>
      <TrialManager
        trial={selectedTrial}
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />
    </AppLayout>
  );
}

function TrialError({ message }: { message: string }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>
      <Button onClick={() => navigate("/trials")} variant="outline">
        Back to Trials
      </Button>
    </div>
  );
}
