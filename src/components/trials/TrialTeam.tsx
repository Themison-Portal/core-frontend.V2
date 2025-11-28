import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Users, UserCheck, Clock, UserPlus } from "lucide-react";
import { TeamMemberAssignment } from "@/components/onboarding/TeamMemberAssignment";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TrialTeamProps {
  trial: any;
}

export function TrialTeam({ trial }: TrialTeamProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [autoAssignAsPI, setAutoAssignAsPI] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const { organizationId, roles } = useAppData();
  const { user } = useAuth();
  const { canManageMembers } = usePermissions();

  // Get confirmed trial team members
  const { data: trialTeam = [], isLoading: teamLoading } = useQuery({
    queryKey: ["trial-team", trial.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trial_team", {
        trial_id_param: trial.id,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!trial.id,
  });

  // Get pending trial member assignments
  const { data: pendingMembers = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["trial-pending-members", trial.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_members_pending")
        .select(
          `
          id,
          invitation_id,
          role_id,
          invitations!inner(
            id,
            name,
            email,
            status
          ),
          roles!inner(
            id,
            name,
            permission_level
          )
        `
        )
        .eq("trial_id", trial.id)
        .eq("invitations.status", "pending");

      if (error) throw error;
      return data || [];
    },
    enabled: !!trial.id,
  });

  // Mutation to save team assignments
  const saveAssignmentsMutation = useMutation({
    mutationFn: async (assignments: any[]) => {
      // This would be the same logic used in onboarding to save trial assignments
      // For now, we'll implement a simplified version
      const results = [];

      for (const assignment of assignments) {
        if (assignment.type === "confirmed") {
          // Add confirmed member to trial
          const { error } = await supabase.from("trial_members").insert({
            trial_id: trial.id,
            member_id: assignment.memberId,
            role_id: assignment.roleId,
          });
          if (error) throw error;
        } else if (assignment.type === "pending") {
          // Add pending invitation to trial
          const { error } = await supabase
            .from("trial_members_pending")
            .insert({
              trial_id: trial.id,
              invitation_id: assignment.invitationId,
              role_id: assignment.roleId,
            });
          if (error) throw error;
        }
        results.push(assignment);
      }

      return results;
    },
    onSuccess: () => {
      // Refresh the trial team data
      queryClient.invalidateQueries({ queryKey: ["trial-team", trial.id] });
      queryClient.invalidateQueries({
        queryKey: ["trial-pending-members", trial.id],
      });
      handleCloseDialog();
      toast.success("Team assignments saved successfully");
    },
    onError: (error) => {
      console.error("Error saving assignments:", error);
      toast.error("Failed to save team assignments");
    },
  });

  const handleAssignmentsChange = (assignments: any[]) => {
    setPendingAssignments(assignments);
  };

  const handleSaveAssignments = () => {
    if (pendingAssignments.length > 0) {
      saveAssignmentsMutation.mutate(pendingAssignments);
    }
  };

  const handleCloseDialog = () => {
    setShowAssignmentDialog(false);
    setPendingAssignments([]);
    setAutoAssignAsPI(false);
  };

  const isLoading = teamLoading || pendingLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  const confirmedCount = trialTeam.length;
  const pendingCount = pendingMembers.length;
  const totalCount = confirmedCount + pendingCount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Team Members
          </h2>
          <p className="text-gray-600">
            Manage team members and role assignments for {trial.name}
          </p>
        </div>

        {canManageMembers && (
          <Dialog
            open={showAssignmentDialog}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseDialog();
              } else {
                setShowAssignmentDialog(true);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Members
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assign Team Members to {trial.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Add new team members to this trial. You can assign both
                    confirmed organization members and pending invitations.
                  </p>
                </div>

                <TeamMemberAssignment
                  organizationId={organizationId || ""}
                  onAssignmentsChange={handleAssignmentsChange}
                  currentUserId={user?.id}
                  autoAssignAsPI={autoAssignAsPI}
                  onAutoAssignPIChange={setAutoAssignAsPI}
                  existingAssignments={[
                    // Confirmed members already assigned to trial
                    ...trialTeam.map((member) => {
                      // Find role ID by role name since trialTeam doesn't include role_id
                      const role = roles.find(
                        (r) => r.name === member.role_name
                      );
                      return {
                        memberId: member.member_id,
                        roleId: role?.id || "",
                        type: "confirmed" as const,
                      };
                    }),
                    // Pending invitations already assigned to trial
                    ...pendingMembers.map((pending) => ({
                      invitationId: pending.invitation_id,
                      roleId: pending.roles.id,
                      type: "pending" as const,
                    })),
                  ]}
                />

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAssignments}
                    disabled={
                      saveAssignmentsMutation.isPending ||
                      pendingAssignments.length === 0
                    }
                  >
                    {saveAssignmentsMutation.isPending
                      ? "Saving..."
                      : "Save Assignments"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold">{confirmedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Invites</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmed Members */}
      {confirmedCount > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Active Members ({confirmedCount})
          </h3>
          <div className="space-y-3">
            {trialTeam.map((member) => (
              <div
                key={member.member_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.member_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {member.member_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {member.member_email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-800 border-blue-200"
                  >
                    {member.role_name}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {member.permission_level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Members */}
      {pendingCount > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Pending Invitations ({pendingCount})
          </h3>
          <div className="space-y-3">
            {pendingMembers.map((pending) => (
              <div
                key={pending.id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {pending.invitations.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {pending.invitations.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {pending.invitations.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-800 border-blue-200"
                  >
                    {pending.roles.name}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Invitation pending
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No team members assigned
          </h3>
          <p className="text-gray-600 mb-4">
            Team members will appear here once they are assigned to this trial.
          </p>
          {canManageMembers && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAssignmentDialog(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Your First Team Member
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
