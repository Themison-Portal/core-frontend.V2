import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Users,
  UserCheck,
  FileText,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateTrial } from "@/components/onboarding/CreateTrial";
import { useOnboardingMutations } from "@/hooks/useOnboardingMutations";

export function TrialsPage() {
  const navigate = useNavigate();
  const [activePhase, setActivePhase] = useState("All phases");
  const [activeLocation, setActiveLocation] = useState("All places");
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "assigned",
  ]);
  const [showTrialDialog, setShowTrialDialog] = useState(false);

  // Use AppData context instead of duplicating logic
  const {
    metrics,
    isLoading,
    metricsLoading,
    isUserAssignedToTrial,
    getUserRoleInTrial,
    organizationId,
    memberId,
    refreshData,
  } = useAppData();
  const trials = metrics?.trials || [];

  const { createTrialMutation } = useOnboardingMutations({
    organizationId,
    memberId,
  });

  // Include metrics loading to prevent "No trials found" flash
  const isFullyLoading = isLoading || metricsLoading;

  // Get permissions for current user
  const { canCreateTrials, canViewAllTrials } = usePermissions();

  // Breadcrumb configuration
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Trials",
      href: "/trials",
      icon: FlaskConical,
      isActive: true,
    },
  ];

  // Get trial team members for all trials
  const { data: trialTeams = {} } = useQuery({
    queryKey: ["trial-teams", trials.map((t) => t.id)],
    queryFn: async () => {
      const teams: Record<string, any[]> = {};

      // Fetch team members for each trial
      for (const trial of trials) {
        try {
          const { data, error } = await supabase.rpc("get_trial_team", {
            trial_id_param: trial.id,
          });

          if (error) {
            console.error(`Error fetching team for trial ${trial.id}:`, error);
            teams[trial.id] = [];
          } else {
            teams[trial.id] = data || [];
          }
        } catch (err) {
          console.error(`Exception fetching team for trial ${trial.id}:`, err);
          teams[trial.id] = [];
        }
      }

      return teams;
    },
    enabled: trials.length > 0,
  });

  // Determine if this is the first trial
  const isFirstTrial = (metrics?.trials?.length || 0) === 0;

  const handleCreateTrial = (trialData: any) => {
    createTrialMutation.mutate(trialData, {
      onSuccess: async () => {
        setShowTrialDialog(false);
        if (refreshData) await refreshData();
      },
    });
  };

  const phases = [
    "All phases",
    "Phase I",
    "Phase II",
    "Phase III",
    "Phase IV",
    "Observational",
    "Registry",
  ];

  const headerColors = [
    "bg-blue-50",
    "bg-gray-50",
    "bg-blue-100",
    "bg-gray-100",
  ];

  // Dynamic locations from trials data
  const locations = [
    "All places",
    ...Array.from(new Set(trials.map((trial) => trial.location))),
  ];

  // Get assigned and other trials
  const assignedTrials = trials.filter((trial) =>
    isUserAssignedToTrial(trial.id)
  );
  const otherTrials = trials.filter(
    (trial) => !isUserAssignedToTrial(trial.id)
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // Get PI and member count for a trial
  const getTrialInfo = (trialId: string) => {
    const teamMembers = trialTeams[trialId] || [];

    // Find the PI (Principal Investigator)
    const pi = teamMembers.find(
      (member) =>
        member.role_name.toLowerCase().includes("principal investigator") ||
        member.role_name.toLowerCase().includes("pi")
    );

    // Count active members excluding the PI
    const otherMembers = teamMembers.filter(
      (member) =>
        member.is_active &&
        !member.role_name.toLowerCase().includes("principal investigator") &&
        !member.role_name.toLowerCase().includes("pi")
    );

    return {
      piName: pi ? `PI: ${pi.member_name}` : "No PI assigned",
      memberCount: otherMembers.length,
    };
  };

  const renderTrialCards = (trials: any[]) => {
    if (trials.length === 0) {
      return (
        <div className="col-span-full">
          <Card className="p-8 text-center">
            <p className="text-gray-500">No trials found in this section</p>
          </Card>
        </div>
      );
    }

    return trials.map((trial, index) => {
      const { piName, memberCount } = getTrialInfo(trial.id);
      const isAssigned = isUserAssignedToTrial(trial.id);
      const userRole = getUserRoleInTrial(trial.id);

      return (
        <Card
          key={trial.id}
          className={`w-full max-w-sm overflow-hidden hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 cursor-pointer ${
            isAssigned ? "ring-2 ring-blue-50" : ""
          }`}
          onClick={() => navigate(`/trials/${trial.id}`)}
        >
          {/* Card Image/Header */}
          <div
            className={`h-36 ${
              headerColors[index % headerColors.length]
            } relative`}
          >
            {/* Tags in top left */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1">
              <Badge className="bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200">
                {trial.phase}
              </Badge>
              {trial.location && (
                <Badge className="bg-gray-100 text-gray-800 text-xs rounded-full hover:bg-gray-200">
                  {trial.location}
                </Badge>
              )}
            </div>

            {/* Assignment indicator in top right */}
            {isAssigned && (
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-300"
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  Assigned
                </Badge>
              </div>
            )}
          </div>

          {/* Card Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {trial.name}
            </h3>

            {/* Show user's role if assigned */}
            {isAssigned && userRole && (
              <p className="text-xs text-blue-700 mb-2">
                Your role: {userRole.name} ({userRole.permission_level})
              </p>
            )}

            <p className="text-sm text-gray-500 mb-4 line-clamp-3">
              {trial.description || "No description available"}
            </p>

            {/* Trial Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600 font-medium">
                <User className="w-3 h-3 mr-2" />
                <span>{piName}</span>
              </div>
              {memberCount > 0 && (
                <div className="flex items-center text-gray-600">
                  <Users className="w-3 h-3 mr-2" />
                  <span>+{memberCount} members</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      );
    });
  };

  if (isFullyLoading) {
    return (
      <AppLayout title="Trials" breadcrumbItems={breadcrumbItems}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-80 animate-pulse">
              <div className="h-48 bg-gray-300 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Trials" breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        {/* Header with Create Trial Button */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col flex-wrap gap-2 items-start">
            {/* Location filters */}
            <div className="flex flex-wrap gap-1">
              {locations.map((location) => (
                <Button
                  key={location}
                  variant={activeLocation === location ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLocation(location)}
                  className={`h-7 px-2 text-xs rounded-full ${
                    activeLocation === location
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  }`}
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>

          {/* Create Trial Button */}
          {canCreateTrials && (
            <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowTrialDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Trial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Trial</DialogTitle>
                </DialogHeader>
                <CreateTrial
                  onComplete={handleCreateTrial}
                  isFirstTrial={isFirstTrial}
                  organizationId={organizationId || ""}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Assigned Section */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection("assigned")}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900"
          >
            <span>Assigned to me ({assignedTrials.length})</span>
            {expandedSections.includes("assigned") ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {expandedSections.includes("assigned") && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {renderTrialCards(
                assignedTrials.filter(
                  (trial) =>
                    (activePhase === "All phases" ||
                      trial.phase === activePhase) &&
                    (activeLocation === "All places" ||
                      trial.location === activeLocation)
                )
              )}
            </div>
          )}
        </div>

        {/* Others Section */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection("others")}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900"
          >
            <span>Others ({otherTrials.length})</span>
            {expandedSections.includes("others") ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {expandedSections.includes("others") && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {renderTrialCards(
                otherTrials.filter(
                  (trial) =>
                    (activePhase === "All phases" ||
                      trial.phase === activePhase) &&
                    (activeLocation === "All places" ||
                      trial.location === activeLocation)
                )
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
