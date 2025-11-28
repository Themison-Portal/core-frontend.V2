import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/hooks/useAppData";

interface TeamAssignment {
  memberId?: string; // For confirmed members
  invitationId?: string; // For pending invitations
  memberName: string;
  memberEmail: string;
  roleId: string;
  roleName: string;
  type: "confirmed" | "pending";
}

interface ExistingAssignment {
  memberId?: string;
  invitationId?: string;
  roleId: string;
  type: "confirmed" | "pending";
}

interface TeamMemberAssignmentProps {
  organizationId: string;
  onAssignmentsChange: (assignments: TeamAssignment[]) => void;
  currentUserId?: string;
  autoAssignAsPI: boolean;
  onAutoAssignPIChange: (checked: boolean) => void;
  existingAssignments?: ExistingAssignment[]; // Filter out already assigned members
}

export function TeamMemberAssignment({
  organizationId,
  onAssignmentsChange,
  currentUserId,
  autoAssignAsPI,
  onAutoAssignPIChange,
  existingAssignments = [],
}: TeamMemberAssignmentProps) {
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [autoAssignedPIId, setAutoAssignedPIId] = useState<string | null>(null); // Track auto-assigned PI

  // Use centralized data instead of duplicate queries
  const { members, roles } = useAppData();

  // Get pending invitations from members query (they should be available in useAppData)
  // Note: We'll use a simple query here since useAppData doesn't expose pending invitations with needed fields
  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ["pending-invitations", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("id, name, email")
        .eq("organization_id", organizationId)
        .eq("status", "pending");

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!organizationId,
  });

  // Find the Principal Investigator role
  const piRole = roles.find(
    (role) =>
      role.name.toLowerCase().includes("principal investigator") ||
      role.name.toLowerCase().includes("pi")
  );

  // Find current user member info
  const currentUserMember = members.find(
    (member) => member.profile_id === currentUserId
  );

  // Filter out members and invitations that are already assigned to the trial
  const availableMembers = members.filter((member) => {
    return !existingAssignments.some(
      (existing) =>
        existing.type === "confirmed" && existing.memberId === member.id
    );
  });

  const availablePendingInvitations = pendingInvitations.filter(
    (invitation) => {
      return !existingAssignments.some(
        (existing) =>
          existing.type === "pending" && existing.invitationId === invitation.id
      );
    }
  );

  // Combine filtered members and pending invitations into a single list
  const combinedAvailableUsers = [
    ...availableMembers.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      type: "confirmed" as const,
      profile_id: member.profile_id,
    })),
    ...availablePendingInvitations.map((invitation) => ({
      id: invitation.id,
      name: invitation.name,
      email: invitation.email,
      type: "pending" as const,
      profile_id: null,
    })),
  ];

  // Check if there's already a PI assigned in existing assignments OR current assignments
  const hasExistingPI = existingAssignments.some((existing) => {
    const role = roles.find((r) => r.id === existing.roleId);
    return (
      role &&
      (role.name.toLowerCase().includes("principal investigator") ||
        role.name.toLowerCase().includes("pi"))
    );
  });

  const hasPIAssigned =
    hasExistingPI ||
    assignments.some((assignment) => {
      const role = roles.find((r) => r.id === assignment.roleId);
      return (
        role &&
        (role.name.toLowerCase().includes("principal investigator") ||
          role.name.toLowerCase().includes("pi"))
      );
    });

  // Effect to handle auto-assign PI checkbox changes
  useEffect(() => {
    if (autoAssignAsPI && piRole && currentUserMember && !hasExistingPI) {
      // Check if current user is already assigned with any role
      const existingUserAssignmentIndex = assignments.findIndex(
        (assignment) => assignment.memberId === currentUserMember.id
      );

      // Only auto-assign if current user is not already assigned to the trial
      const isCurrentUserAlreadyAssigned = existingAssignments.some(
        (existing) =>
          existing.type === "confirmed" &&
          existing.memberId === currentUserMember.id
      );

      if (!isCurrentUserAlreadyAssigned) {
        const newPIAssignment: TeamAssignment = {
          memberId: currentUserMember.id,
          memberName: currentUserMember.name,
          memberEmail: currentUserMember.email,
          roleId: piRole.id,
          roleName: piRole.name,
          type: "confirmed",
        };

        let updatedAssignments;
        if (existingUserAssignmentIndex !== -1) {
          // Replace existing assignment with PI role
          updatedAssignments = [...assignments];
          updatedAssignments[existingUserAssignmentIndex] = newPIAssignment;
        } else {
          // Add new assignment for current user as PI
          updatedAssignments = [...assignments, newPIAssignment];
        }

        setAssignments(updatedAssignments);
        onAssignmentsChange(updatedAssignments);
        // Track this as auto-assigned
        setAutoAssignedPIId(currentUserMember.id);
      } else {
        // Current user is already assigned, can't auto-assign as PI
        onAutoAssignPIChange(false);
      }
    } else if (
      !autoAssignAsPI &&
      piRole &&
      currentUserMember &&
      autoAssignedPIId
    ) {
      // Only remove PI assignment if it was auto-assigned (not manually assigned)
      const updatedAssignments = assignments.filter(
        (assignment) =>
          !(
            assignment.memberId === autoAssignedPIId &&
            assignment.roleId === piRole.id
          )
      );

      if (updatedAssignments.length !== assignments.length) {
        setAssignments(updatedAssignments);
        onAssignmentsChange(updatedAssignments);
        setAutoAssignedPIId(null);
      }
    }
  }, [
    autoAssignAsPI,
    piRole,
    currentUserMember,
    assignments,
    onAssignmentsChange,
    autoAssignedPIId,
    hasExistingPI,
    existingAssignments,
  ]);

  const addAssignment = () => {
    const availableUsers = combinedAvailableUsers.filter(
      (user) =>
        !assignments.find(
          (a) =>
            (a.memberId === user.id && user.type === "confirmed") ||
            (a.invitationId === user.id && user.type === "pending")
        )
    );

    if (availableUsers.length === 0) return;

    const newAssignment: TeamAssignment = {
      memberId: "",
      invitationId: "",
      memberName: "",
      memberEmail: "",
      roleId: "",
      roleName: "",
      type: "confirmed",
    };

    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    onAssignmentsChange(updatedAssignments);
  };

  const removeAssignment = (index: number) => {
    const assignment = assignments[index];

    // If removing the current user's PI assignment, also uncheck the auto-assign checkbox and clear the auto-assigned ID
    if (
      piRole &&
      currentUserMember &&
      assignment.memberId === currentUserMember.id &&
      assignment.roleId === piRole.id
    ) {
      onAutoAssignPIChange(false);
      setAutoAssignedPIId(null);
    }

    const updatedAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(updatedAssignments);
    onAssignmentsChange(updatedAssignments);
  };

  const updateAssignment = (
    index: number,
    field: keyof TeamAssignment,
    value: string
  ) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      [field]: value,
    };

    // If updating user selection, determine if it's a member or invitation
    if (field === "memberId" || field === "invitationId") {
      const user = combinedAvailableUsers.find((u) => u.id === value);
      if (user) {
        if (user.type === "confirmed") {
          updatedAssignments[index].memberId = value;
          updatedAssignments[index].invitationId = "";
          updatedAssignments[index].type = "confirmed";
        } else {
          updatedAssignments[index].memberId = "";
          updatedAssignments[index].invitationId = value;
          updatedAssignments[index].type = "pending";
        }
        updatedAssignments[index].memberName = user.name;
        updatedAssignments[index].memberEmail = user.email;
      }
    }

    // If updating role, also update role name
    if (field === "roleId") {
      const role = roles.find((r) => r.id === value);
      if (role) {
        updatedAssignments[index].roleName = role.name;

        // Check if user is manually assigning themselves as PI
        const isPIRole = piRole && role.id === piRole.id;
        const assignment = updatedAssignments[index];
        const isCurrentUser =
          currentUserMember && assignment.memberId === currentUserMember.id;

        if (isPIRole && isCurrentUser && !autoAssignAsPI && !hasExistingPI) {
          // User manually assigned themselves as PI, auto-check the checkbox
          onAutoAssignPIChange(true);
          setAutoAssignedPIId(currentUserMember.id);

          // Remove any other assignment for the current user (avoid duplicates)
          const finalAssignments = updatedAssignments.filter(
            (_, i) =>
              i === index ||
              updatedAssignments[i].memberId !== currentUserMember.id
          );
          setAssignments(finalAssignments);
          onAssignmentsChange(finalAssignments);
          return; // Early return to avoid setting assignments twice
        }
      }
    }

    setAssignments(updatedAssignments);
    onAssignmentsChange(updatedAssignments);
  };

  // Get available users (members + invitations) for a specific assignment
  const getAvailableUsersForAssignment = (currentAssignmentIndex: number) => {
    return combinedAvailableUsers.filter((user) => {
      // Check if this user is already assigned in OTHER assignments (not the current one being edited)
      const isAlreadyAssigned = assignments.some((assignment, index) => {
        if (index === currentAssignmentIndex) return false;
        return (
          (assignment.memberId === user.id && user.type === "confirmed") ||
          (assignment.invitationId === user.id && user.type === "pending")
        );
      });
      return !isAlreadyAssigned;
    });
  };

  // Check if current user is assigned as PI in the assignments
  const currentUserAssignedAsPI = assignments.some((assignment) => {
    const member = members.find((m) => m.id === assignment.memberId);
    const role = roles.find((r) => r.id === assignment.roleId);
    return (
      member?.profile_id === currentUserId &&
      role &&
      (role.name.toLowerCase().includes("principal investigator") ||
        role.name.toLowerCase().includes("pi"))
    );
  });

  // Check if current user is available to be assigned as PI
  const currentUserAlreadyAssigned = existingAssignments.some((existing) => {
    const member = members.find((m) => m.id === existing.memberId);
    return member?.profile_id === currentUserId;
  });

  return (
    <div className="space-y-4">
      {/* PI Auto-assignment checkbox */}
      <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Checkbox
          id="autoAssignPI"
          checked={autoAssignAsPI}
          onCheckedChange={onAutoAssignPIChange}
          disabled={
            hasExistingPI ||
            currentUserAlreadyAssigned ||
            (hasPIAssigned && !currentUserAssignedAsPI)
          }
        />
        <Label htmlFor="autoAssignPI" className="text-sm font-medium">
          Auto-assign me as Principal Investigator for this trial
          {hasExistingPI && (
            <span className="text-gray-500 text-xs block">
              (Disabled: PI already assigned to this trial)
            </span>
          )}
          {currentUserAlreadyAssigned && (
            <span className="text-gray-500 text-xs block">
              (Disabled: You are already assigned to this trial)
            </span>
          )}
          {hasPIAssigned && !currentUserAssignedAsPI && !hasExistingPI && (
            <span className="text-gray-500 text-xs block">
              (Disabled: Another member is already assigned as PI)
            </span>
          )}
        </Label>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Assign Team Members</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAssignment}
          disabled={
            combinedAvailableUsers.length === 0 ||
            assignments.length >= combinedAvailableUsers.length
          }
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {combinedAvailableUsers.length === 0 ? (
        <Card className="p-4">
          <div className="text-center text-gray-500">
            <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No available team members to assign.</p>
            <p className="text-sm mt-1">
              All organization members are already assigned to this trial.
            </p>
          </div>
        </Card>
      ) : assignments.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-gray-600 text-center">
            No team members assigned yet. Click "Add Member" to assign roles to
            your team.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment, index) => {
            const availableUsersForThisAssignment =
              getAvailableUsersForAssignment(index);
            const isAutoAssignedPI =
              autoAssignAsPI &&
              piRole &&
              currentUserMember &&
              assignment.memberId === currentUserMember.id &&
              assignment.roleId === piRole.id;

            return (
              <Card
                key={index}
                className={`p-4 ${
                  isAutoAssignedPI ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`member-${index}`}>Team Member</Label>
                    <Select
                      value={
                        assignment.memberId || assignment.invitationId || ""
                      }
                      onValueChange={(value) =>
                        updateAssignment(index, "memberId", value)
                      }
                      disabled={isAutoAssignedPI}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show currently selected user even if not in available list */}
                        {(assignment.memberId || assignment.invitationId) &&
                          !availableUsersForThisAssignment.find(
                            (u) =>
                              u.id ===
                              (assignment.memberId || assignment.invitationId)
                          ) && (
                            <SelectItem
                              value={
                                assignment.memberId ||
                                assignment.invitationId ||
                                ""
                              }
                            >
                              {assignment.memberName} ({assignment.memberEmail})
                              -{" "}
                              {assignment.type === "confirmed"
                                ? "✅ Confirmed"
                                : "⏳ Pending"}
                            </SelectItem>
                          )}
                        {/* Show available users (members + invitations) */}
                        {availableUsersForThisAssignment.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email}) -{" "}
                            {user.type === "confirmed"
                              ? "✅ Confirmed"
                              : "⏳ Pending"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isAutoAssignedPI && (
                      <p className="text-xs text-blue-600 mt-1">
                        Auto-assigned via checkbox above
                      </p>
                    )}
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Label htmlFor={`role-${index}`}>Trial Role</Label>
                      <Select
                        value={assignment.roleId}
                        onValueChange={(value) =>
                          updateAssignment(index, "roleId", value)
                        }
                        disabled={isAutoAssignedPI}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => {
                            const isPIRole = piRole && role.id === piRole.id;
                            const isCurrentUserAssigning =
                              members.find((m) => m.id === assignment.memberId)
                                ?.profile_id === currentUserId;

                            // Disable PI role if:
                            // 1. Auto-assign is ON and this is the current user (because they're already auto-assigned)
                            // 2. Auto-assign is ON and this is NOT the current user (because PI is auto-assigned to current user)
                            // 3. There's already another PI assigned and this isn't that assignment
                            // 4. PI already exists in the trial
                            const isDisabled =
                              isPIRole &&
                              ((autoAssignAsPI && isCurrentUserAssigning) ||
                                (autoAssignAsPI && !isCurrentUserAssigning) ||
                                (hasPIAssigned &&
                                  assignment.roleId !== role.id) ||
                                hasExistingPI);

                            return (
                              <SelectItem
                                key={role.id}
                                value={role.id}
                                disabled={isDisabled}
                                className={
                                  isDisabled
                                    ? "text-gray-400 cursor-not-allowed"
                                    : ""
                                }
                              >
                                {role.name}
                                {isPIRole &&
                                  autoAssignAsPI &&
                                  isCurrentUserAssigning &&
                                  " (Auto-assigned to you)"}
                                {isPIRole &&
                                  autoAssignAsPI &&
                                  !isCurrentUserAssigning &&
                                  " (Auto-assigned to current user)"}
                                {isPIRole &&
                                  hasExistingPI &&
                                  " (Already assigned to trial)"}
                                {isPIRole &&
                                  hasPIAssigned &&
                                  assignment.roleId !== role.id &&
                                  !autoAssignAsPI &&
                                  !hasExistingPI &&
                                  " (Already assigned to another member)"}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {isAutoAssignedPI && (
                        <p className="text-xs text-blue-600 mt-1">
                          Auto-assigned via checkbox above
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAssignment(index)}
                      disabled={isAutoAssignedPI}
                      className={
                        isAutoAssignedPI ? "opacity-50 cursor-not-allowed" : ""
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
