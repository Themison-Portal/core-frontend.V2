import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, Clock } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateTrial } from "@/components/onboarding/CreateTrial";
import { useOnboardingMutations } from "@/hooks/useOnboardingMutations";
import { useState } from "react";
import { InviteMemberDialog } from "@/components/organization/InviteMemberDialog.tsx";
import { ChatContainer } from "@/components/chat/ChatContainer";

export function Dashboard() {
  const { canCreateTrials, canInviteMembers, canViewStats } = usePermissions();
  const {
    stats,
    organizationId,
    memberId,
    metrics,
    refreshData,
    inviteMember,
  } = useAppData();
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { createTrialMutation } = useOnboardingMutations({
    organizationId,
    memberId,
  });

  // Split stats into two rows for the left panel
  const dashboardStatsRows = [
    [
      {
        name: "Active Trials",
        value: stats?.totalTrials?.toString() || "0",
        icon: FileText,
        color: "text-blue-600",
        href: "/trials",
      },
      {
        name: "Total Patients",
        value: stats?.totalPatients?.toString() || "0",
        icon: Users,
        color: "text-blue-600",
        href: "/organization?tab=patients",
      },
    ],
    [
      {
        name: "Team Members",
        value: stats?.totalMembers?.toString() || "0",
        icon: Users,
        color: "text-blue-600",
        href: "/organization",
      },
      {
        name: "Pending Invitations",
        value: stats?.totalInvitations?.toString() || "0",
        icon: Clock,
        color: "text-blue-600",
        href: null,
      },
    ],
  ];

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

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Grid - Only visible to admin */}
      {canViewStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Quick Actions arriba a la derecha, ocupa todo el alto */}
          <div className="flex flex-col justify-start h-full">
            <Card className="p-6 h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {canCreateTrials && (
                  <Dialog
                    open={showTrialDialog}
                    onOpenChange={setShowTrialDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowTrialDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Trial
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader></DialogHeader>
                      <CreateTrial
                        onComplete={handleCreateTrial}
                        isFirstTrial={isFirstTrial}
                        organizationId={organizationId || ""}
                      />
                    </DialogContent>
                  </Dialog>
                )}

                {canInviteMembers && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Invite a Member to the Organization
                    </Button>
                    <InviteMemberDialog
                      open={showInviteDialog}
                      onOpenChange={setShowInviteDialog}
                      onInvite={async (members) => {
                        for (const member of members) {
                          await inviteMember(
                            member.email,
                            member.name,
                            member.role
                          );
                        }
                        setShowInviteDialog(false);
                      }}
                    />
                  </>
                )}
                {canInviteMembers && (
                  <Link
                    to="/organization?tab=patients&sign-patient"
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Sign a new patient
                    </Button>
                  </Link>
                )}

                {!canCreateTrials && !canInviteMembers && (
                  <div className="text-sm text-gray-500">
                    <p>Welcome to your dashboard!</p>
                    <p className="mt-2">
                      Access your assigned trials from the Trials section.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            {dashboardStatsRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {row.map((stat) => (
                  <Link
                    to={stat.href}
                    key={stat.name}
                    className={`${stat.href ? "" : "cursor-not-allowed"}`}
                  >
                    <Card className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              {stat.name}
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stat.value}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Assistant Chat with History */}
      <ChatContainer organizationId={organizationId} stats={stats} />
    </div>
  );
}
