import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UseOnboardingMutationsProps {
  organizationId?: string;
  memberId?: string;
}

export function useOnboardingMutations({
  organizationId,
  memberId,
}: UseOnboardingMutationsProps = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Send invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (members: any[]) => {
      if (!organizationId || !memberId) {
        throw new Error("No organization or member ID available");
      }

      const invitations = members.map((member) => ({
        name: member.name,
        email: member.email,
        organization_id: organizationId,
        initial_role: member.role,
        invited_by: memberId,
        status: "pending",
      }));

      const { error } = await supabase.from("invitations").insert(invitations);

      if (error) throw error;
      return invitations;
    },
    onSuccess: () => {
      toast.success("Invitations sent successfully!");
      queryClient.invalidateQueries({
        queryKey: ["pending-invitations-count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending-invitations", organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization-metrics"],
      });
    },
    onError: (error) => {
      toast.error("Failed to send invitations: " + error.message);
    },
  });

  // Create roles mutation
  const createRolesMutation = useMutation({
    mutationFn: async (roles: any[]) => {
      if (!organizationId || !user?.id) {
        throw new Error("No organization ID available");
      }

      const rolesToCreate = roles.map((role) => ({
        name: role.name,
        description: role.description,
        permission_level: role.permission_level,
        organization_id: organizationId,
        created_by: user.id,
      }));

      const { error } = await supabase.from("roles").insert(rolesToCreate);

      if (error) throw error;
      return rolesToCreate;
    },
    onSuccess: () => {
      toast.success("Custom roles created successfully!");
      queryClient.invalidateQueries({
        queryKey: ["organization-metrics"],
      });
    },
    onError: (error) => {
      toast.error("Failed to create roles: " + error.message);
    },
  });

  // Create trial mutation
  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      if (!organizationId || !memberId) {
        throw new Error("No organization or member ID available");
      }

      // Validate that a PI is assigned
      const hasPIInAssignments = (trialData.teamAssignments || []).some(
        (assignment: any) => {
          return (
            assignment.roleName &&
            (assignment.roleName.toLowerCase().includes("principal investigator") ||
              assignment.roleName.toLowerCase().includes("pi"))
          );
        }
      );

      if (!hasPIInAssignments && !trialData.autoAssignAsPI) {
        throw new Error(
          "A Principal Investigator must be assigned to the trial. Please assign a PI or enable auto-assign."
        );
      }

      // Transform team assignments to the format expected by the SQL function
      let teamAssignments = (trialData.teamAssignments || [])
        .map((assignment: any) => {
          if (assignment.type === "confirmed" && assignment.memberId) {
            return {
              member_id: assignment.memberId,
              role_id: assignment.roleId,
              is_active: true,
              start_date: new Date().toISOString().split("T")[0],
            };
          } else if (assignment.type === "pending" && assignment.invitationId) {
            return {
              invitation_id: assignment.invitationId,
              role_id: assignment.roleId,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Add PI assignment if requested (only if not already assigned)
      if (trialData.autoAssignAsPI) {
        const { data: piRole } = await supabase
          .from("roles")
          .select("id")
          .eq("organization_id", organizationId)
          .or("name.ilike.%PI%,name.ilike.%Principal Investigator%")
          .limit(1)
          .single();

        if (piRole) {
          // Check if current user is already assigned with any role
          const isCurrentUserAlreadyAssigned = teamAssignments.some(
            (assignment) => assignment.member_id === memberId
          );

          // Only add PI assignment if current user is not already assigned
          if (!isCurrentUserAlreadyAssigned) {
            teamAssignments.push({
              member_id: memberId,
              role_id: piRole.id,
              is_active: true,
              start_date: new Date().toISOString().split("T")[0],
            });
          }
        }
      }

      console.log("🚀 CREATING TRIAL - Full payload sent to database:", {
        trial_data: {
          name: trialData.name,
          description: trialData.description,
          phase: trialData.phase,
          sponsor: trialData.sponsor,
          location: trialData.location,
          study_start: trialData.study_start,
          estimated_close_out: trialData.estimated_close_out,
        },
        team_assignments: teamAssignments,
        organization_id: organizationId,
        current_member_id: memberId,
        current_user_id: user?.id,
        auto_assign_pi: trialData.autoAssignAsPI,
      });

      // Use the new stored procedure that handles both confirmed and pending members
      const { data: trialId, error: trialError } = await supabase.rpc(
        "create_trial_with_mixed_assignments",
        {
          trial_data: {
            name: trialData.name,
            description: trialData.description,
            phase: trialData.phase,
            sponsor: trialData.sponsor,
            location: trialData.location,
            study_start: trialData.study_start || null,
            estimated_close_out: trialData.estimated_close_out || null,
          },
          team_assignments: teamAssignments,
        }
      );

      if (trialError) throw trialError;

      // Mark onboarding as completed for member and organization
      await supabase
        .from("members")
        .update({ onboarding_completed: true })
        .eq("profile_id", user?.id);

      // Complete organization onboarding if this is the setup flow
      if (organizationId) {
        await supabase
          .from("organizations")
          .update({ onboarding_completed: true })
          .eq("id", organizationId);
      }

      return trialId;
    },
    onSuccess: () => {
      toast.success("Trial created successfully! Welcome to THEMISON!");
      // Invalidate queries to ensure state is updated
      queryClient.invalidateQueries({ queryKey: ["user-member-status"] });
      queryClient.invalidateQueries({ queryKey: ["member"] });
      queryClient.invalidateQueries({ queryKey: ["organization-metrics"] });
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to create trial: " + error.message);
    },
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async (
      options: {
        completeOrganization?: boolean;
      } = {}
    ) => {
      // Update member onboarding status
      await supabase
        .from("members")
        .update({ onboarding_completed: true })
        .eq("profile_id", user?.id);

      // Update organization onboarding status if needed
      if (options.completeOrganization && organizationId) {
        await supabase
          .from("organizations")
          .update({ onboarding_completed: true })
          .eq("id", organizationId);
      }
    },
    onSuccess: (_, variables) => {
      const message = variables.completeOrganization
        ? "Setup completed! Welcome to THEMISON!"
        : "Welcome to the team!";

      toast.success(message);

      // Invalidate queries to ensure state is updated
      queryClient.invalidateQueries({ queryKey: ["user-member-status"] });
      queryClient.invalidateQueries({ queryKey: ["member"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });

      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to complete onboarding: " + error.message);
    },
  });

  return {
    sendInvitationsMutation,
    createRolesMutation,
    createTrialMutation,
    completeOnboardingMutation,
  };
}
