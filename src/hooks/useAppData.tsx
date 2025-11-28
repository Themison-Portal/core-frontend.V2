import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export function useAppData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's member information
  const {
    data: member,
    isLoading: memberLoading,
    error: memberError,
  } = useQuery({
    queryKey: ["member", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("members")
        .select(
          "id, name, email, onboarding_completed, default_role, organization_id"
        )
        .eq("profile_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get organization information
  const {
    data: organization,
    isLoading: organizationLoading,
    error: organizationError,
  } = useQuery({
    queryKey: ["organization", member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return null;

      const { data, error } = await supabase
        .from("organizations")
        .select("onboarding_completed, name, id")
        .eq("id", member.organization_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!member?.organization_id,
  });

  // Get trial assignments for current user
  const {
    data: userTrialAssignments = [],
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey: ["user-trial-assignments", member?.id],
    queryFn: async () => {
      if (!member?.id) return [];

      const { data, error } = await supabase
        .from("trial_members")
        .select("trial_id, role_id, is_active, roles(name, permission_level)")
        .eq("member_id", member.id)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!member?.id,
  });

  // Get organization metrics (for AdminOverview)
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["organization-metrics", organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        return {
          trials: [],
          members: [],
          roles: [],
        };
      }

      console.log("Fetching metrics for organization:", organization.id);

      const [trialsResult, membersResult, rolesResult] = await Promise.all([
        supabase
          .from("trials")
          .select(
            "id, name, status, phase, sponsor, location, description, created_at"
          )
          .eq("organization_id", organization.id),
        supabase
          .from("members")
          .select("id, name, email, default_role")
          .eq("organization_id", organization.id),
        supabase
          .from("roles")
          .select("*")
          .eq("organization_id", organization.id),
      ]);

      console.log("Metrics fetched:", {
        trialsResult,
        membersResult,
        rolesResult,
      });

      if (trialsResult.error)
        console.error("Trials error:", trialsResult.error);
      if (membersResult.error)
        console.error("Members error:", membersResult.error);
      if (rolesResult.error) console.error("Roles error:", rolesResult.error);

      return {
        trials: trialsResult.data || [],
        members: membersResult.data || [],
        roles: rolesResult.data || [],
      };
    },
    enabled: !!organization?.id,
  });

  // Get member data with organization (for OnboardingFlow compatibility)
  const {
    data: memberData,
    isLoading: memberDataLoading,
    error: memberDataError,
  } = useQuery({
    queryKey: ["user-organization", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("members")
        .select("id, organization_id, email, organizations(name)")
        .eq("profile_id", user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("User is not part of any organization");

      return data;
    },
    enabled: !!user?.id,
  });

  // Helper function to check if user is assigned to a trial
  const isUserAssignedToTrial = (trialId: string) => {
    return userTrialAssignments.some(
      (assignment) => assignment.trial_id === trialId
    );
  };

  // Helper function to get user's role in a trial
  const getUserRoleInTrial = (trialId: string) => {
    const assignment = userTrialAssignments.find(
      (assignment) => assignment.trial_id === trialId
    );
    return assignment?.roles || null;
  };

  // Get organization members (for MembersManagement)
  const {
    data: members = [],
    isLoading: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["organization-members", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("organization_id", organization.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Get organization roles (for RolesManagement)
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ["organization-roles", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("organization_id", organization.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Get pending invitations count
  const {
    data: pendingInvitationsCount = 0,
    isLoading: invitationsLoading,
    error: invitationsError,
  } = useQuery({
    queryKey: ["pending-invitations-count", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;

      const { count, error } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  // Get patients count
  const {
    data: patientsCount = 0,
    isLoading: patientsLoading,
    error: patientsError,
  } = useQuery({
    queryKey: ["patients-count", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;

      const { count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  // Calculate stats from data (compatible with useOrganization)
  const stats = {
    totalMembers: members.length,
    totalTrials: metrics?.trials?.length || 0,
    totalRoles: roles.length,
    totalInvitations: pendingInvitationsCount,
    totalPatients: patientsCount,
  };

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: Partial<Tables<"organizations">>) => {
      if (!organization?.id) throw new Error("No organization");

      const { error } = await supabase
        .from("organizations")
        .update(data)
        .eq("id", organization.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({
      email,
      name,
      role,
    }: {
      email: string;
      name: string;
      role: string;
    }) => {
      if (!organization?.id) throw new Error("No organization");

      const { error } = await supabase.from("invitations").insert({
        organization_id: organization.id,
        email,
        name,
        initial_role: role as "admin" | "staff",
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-invitations-count"],
      });
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      queryClient.invalidateQueries({ queryKey: ["organization-metrics"] });
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  // Update member role mutation - TODO: Fix role logic (default_role vs custom roles)
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      roleId,
    }: {
      memberId: string;
      roleId: string;
    }) => {
      // TODO: This needs to be fixed - roleId should map to default_role enum or custom role system
      const { error } = await supabase
        .from("members")
        .update({ default_role: roleId as "admin" | "staff" })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      permissionLevel,
    }: {
      name: string;
      description: string;
      permissionLevel: "read" | "edit" | "admin";
    }) => {
      if (!organization?.id) throw new Error("No organization");

      const { error } = await supabase.from("roles").insert({
        organization_id: organization.id,
        name,
        description,
        permission_level: permissionLevel,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-roles"] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-roles"] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  // Helper functions for mutations
  const updateOrganization = async (data: Partial<Tables<"organizations">>) => {
    try {
      await updateOrganizationMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  const inviteMember = async (email: string, name: string, role: string) => {
    try {
      await inviteMemberMutation.mutateAsync({ email, name, role });
      return true;
    } catch {
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId);
      return true;
    } catch {
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, roleId: string) => {
    try {
      await updateMemberRoleMutation.mutateAsync({ memberId, roleId });
      return true;
    } catch {
      return false;
    }
  };

  const createRole = async (
    name: string,
    description: string,
    permissionLevel: "read" | "edit" | "admin"
  ) => {
    try {
      await createRoleMutation.mutateAsync({
        name,
        description,
        permissionLevel,
      });
      return true;
    } catch {
      return false;
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      await deleteRoleMutation.mutateAsync(roleId);
      return true;
    } catch {
      return false;
    }
  };

  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["member"] });
    await queryClient.invalidateQueries({ queryKey: ["organization"] });
    await queryClient.invalidateQueries({ queryKey: ["organization-metrics"] });
    await queryClient.invalidateQueries({ queryKey: ["organization-members"] });
    await queryClient.invalidateQueries({ queryKey: ["organization-roles"] });
    await queryClient.invalidateQueries({
      queryKey: ["pending-invitations-count"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["patients-count"],
    });
  };

  const isLoading = memberLoading || organizationLoading;
  const hasError = memberError || organizationError;

  return {
    // Main data
    member,
    organization,
    metrics,
    userTrialAssignments,

    // Organization management data (compatible with useOrganization)
    members,
    roles,
    stats,
    loading: isLoading,
    error: hasError?.message || null,

    // Compatibility data for existing components
    memberData,

    // Helper functions
    isUserAssignedToTrial,
    getUserRoleInTrial,

    // Organization operations (compatible with useOrganization)
    updateOrganization,
    refreshData,
    inviteMember,
    removeMember,
    updateMemberRole,
    createRole,
    deleteRole,

    // Loading states
    isLoading,
    memberLoading,
    organizationLoading,
    metricsLoading,
    assignmentsLoading,
    memberDataLoading,
    membersLoading,
    rolesLoading,
    invitationsLoading,
    patientsLoading,

    // Error states
    hasError,
    memberError,
    organizationError,
    metricsError,
    assignmentsError,
    memberDataError,
    membersError,
    rolesError,
    invitationsError,
    patientsError,

    // Computed values
    organizationId: member?.organization_id || organization?.id,
    memberId: member?.id,
    currentMemberId: memberData?.id,
  };
}
