import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/hooks/useAppData";
import { useOnboardingMutations } from "@/hooks/useOnboardingMutations";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Users,
  Shield,
  Eye,
  Plus,
  UserPlus,
  Settings,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react";
import { InviteMembers } from "./InviteMembers";
import { CreateCustomRoles } from "./CreateCustomRoles";
import { CreateTrial } from "./CreateTrial";

interface AdminOverviewProps {
  member: any;
  organization: any;
}

export function AdminOverview({ member, organization }: AdminOverviewProps) {
  const { toast } = useToast();

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [showTrialDialog, setShowTrialDialog] = useState(false);

  // Show more states
  const [showAllTrials, setShowAllTrials] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const INITIAL_DISPLAY_LIMIT = 5;

  // Use centralized hooks with new trial assignment functions
  const {
    metrics,
    isLoading: metricsLoading,
    isUserAssignedToTrial,
    getUserRoleInTrial,
  } = useAppData();

  // Fetch pending invitations separately for display
  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ["pending-invitations", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("invitations")
        .select("id, name, email, initial_role, invited_at")
        .eq("organization_id", organization.id)
        .eq("status", "pending")
        .order("invited_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const {
    sendInvitationsMutation,
    createRolesMutation,
    createTrialMutation,
    completeOnboardingMutation,
  } = useOnboardingMutations({
    organizationId: organization?.id,
    memberId: member?.id,
  });

  console.log("AdminOverview props:", { member, organization });

  // Use metrics from centralized hook
  const isLoading = metricsLoading;

  // All mutations now handled by useOnboardingMutations hook

  const handleGoToDashboard = () => {
    console.log("Go to dashboard clicked");
    completeOnboardingMutation.mutate({});
  };

  const handleInviteMembers = (members: any[]) => {
    if (members.length > 0) {
      sendInvitationsMutation.mutate(members, {
        onSuccess: () => {
          setShowInviteDialog(false);
        },
      });
    } else {
      setShowInviteDialog(false);
    }
  };

  const handleCreateRoles = (roles: any[]) => {
    if (roles.length > 0) {
      createRolesMutation.mutate(roles, {
        onSuccess: () => {
          setShowRolesDialog(false);
        },
      });
    } else {
      setShowRolesDialog(false);
    }
  };

  const handleCreateTrial = (trialData: any) => {
    console.log("handleCreateTrial called with:", trialData);
    console.log("Available data:", { organization, member });

    // Check if we have all required data before proceeding
    if (!organization?.id) {
      toast({
        title: "Error",
        description:
          "Organization information is missing. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!member?.id) {
      toast({
        title: "Error",
        description: "Member information is missing. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    createTrialMutation.mutate(trialData, {
      onSuccess: () => {
        setShowTrialDialog(false);
      },
    });
  };

  // Show loading if metrics are still loading or if we don't have organization data
  if (isLoading || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const trialsCount = metrics?.trials?.length || 0;
  const membersCount = metrics?.members?.length || 0;
  const pendingCount = pendingInvitations?.length || 0;
  const totalTeamCount = membersCount + pendingCount;
  const rolesCount = metrics?.roles?.length || 0;

  // Combine confirmed members and pending invitations
  const combinedTeamMembers = [
    ...(metrics?.members || []).map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      type: "confirmed" as const,
      role: member.default_role,
      date: new Date().toISOString(), // Use current date as fallback
    })),
    ...(pendingInvitations || []).map((invitation) => ({
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      type: "pending" as const,
      role: invitation.initial_role,
      date: invitation.invited_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedTrials = showAllTrials
    ? metrics?.trials
    : metrics?.trials?.slice(0, INITIAL_DISPLAY_LIMIT);
  const displayedMembers = showAllMembers
    ? combinedTeamMembers
    : combinedTeamMembers?.slice(0, INITIAL_DISPLAY_LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {organization?.name || "your organization"}!
          </h1>
          <p className="text-gray-600">
            Your organization is already set up. Here's an overview of what's
            available.
          </p>
        </div>

        {/* Team Members Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Members
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-800 font-medium px-2 py-1 rounded-full"
                >
                  {totalTeamCount}
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(true)}
                className="border-gray-500 text-gray hover:bg-blue-100"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Team Members
              </Button>
            </div>

            {totalTeamCount > 0 ? (
              <div className="space-y-3">
                {displayedMembers?.map((teamMember) => (
                  <div
                    key={teamMember.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {teamMember.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {teamMember.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          teamMember.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {teamMember.role}
                      </Badge>
                      {teamMember.type === "pending" && (
                        <Badge
                          variant="outline"
                          className="border-red-200 text-red-500 bg-red-50"
                        >
                          pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {totalTeamCount > INITIAL_DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllMembers(!showAllMembers)}
                    className="w-full mt-4"
                  >
                    {showAllMembers ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show {totalTeamCount - INITIAL_DISPLAY_LIMIT} More Team
                        Members
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No team members yet. Invite members to start collaborating!
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Clinical Trials Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Clinical Trials
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded-full"
                >
                  {trialsCount}
                </Badge>
              </div>
              <Button
                onClick={() => setShowTrialDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Trial
              </Button>
            </div>

            {trialsCount > 0 ? (
              <div className="space-y-3">
                {displayedTrials?.map((trial) => {
                  const isAssigned = isUserAssignedToTrial(trial.id);
                  const userRole = getUserRoleInTrial(trial.id);

                  return (
                    <div
                      key={trial.id}
                      className={`border rounded-lg p-4 ${
                        isAssigned ? "bg-blue-50 border-blue-200" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {trial.name}
                            </h3>
                            {isAssigned && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800 border-blue-300"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Assigned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            • {trial.sponsor}
                          </p>
                          {isAssigned && userRole && (
                            <p className="text-xs text-blue-700 mt-1">
                              Your role: {userRole.name} (
                              {userRole.permission_level})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={"secondary"}>{trial.phase}</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Created:{" "}
                            {new Date(trial.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {trialsCount > INITIAL_DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllTrials(!showAllTrials)}
                    className="w-full mt-4"
                  >
                    {showAllTrials ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show {trialsCount - INITIAL_DISPLAY_LIMIT} More Trials
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No trials created yet. Create your first trial to get started!
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Available Roles Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Trial Roles
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-800 font-medium px-2 py-1 rounded-full"
                >
                  {rolesCount}
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowRolesDialog(true)}
                className="border-gray-500 text-gray hover:bg-blue-100"
              >
                <Settings className="h-4 w-4 mr-2" />
                Add Custom Roles
              </Button>
            </div>

            {rolesCount > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics?.roles?.map((role) => (
                  <div
                    key={role.id}
                    className="border rounded-lg p-4 flex flex-col justify-between"
                  >
                    <div className="mb-4 h-auto">
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {role.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-2 ">
                      <small className=" text-gray-500">Permission of</small>
                      <Badge variant={"outline"} className="bg-blue-50">
                        {role.permission_level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No custom roles created yet. Define roles to organize your
                  team!
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button
            onClick={handleGoToDashboard}
            disabled={completeOnboardingMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            <Eye className="h-4 w-4 mr-2" />
            {completeOnboardingMutation.isPending
              ? "Loading..."
              : "Go to Dashboard"}
          </Button>
        </div>

        {/* Dialog Modals */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite Team Members</DialogTitle>
            </DialogHeader>
            <InviteMembers onContinue={handleInviteMembers} />
          </DialogContent>
        </Dialog>

        <Dialog open={showRolesDialog} onOpenChange={setShowRolesDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Custom Roles</DialogTitle>
            </DialogHeader>
            <CreateCustomRoles onContinue={handleCreateRoles} />
          </DialogContent>
        </Dialog>

        <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trial</DialogTitle>
            </DialogHeader>
            <CreateTrial
              onComplete={handleCreateTrial}
              isFirstTrial={trialsCount === 0}
              organizationId={organization?.id || ""}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
