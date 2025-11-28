import { useAppData } from "@/hooks/useAppData";

/**
 * Hook para manejar permisos basados en roles organizacionales
 * Reemplaza el hardcoding de verificaciones de default_role
 */
export function usePermissions() {
  const { member } = useAppData();

  const isAdmin = member?.default_role === "admin";
  const isStaff = member?.default_role === "staff";

  return {
    // Trials permissions
    canCreateTrials: isAdmin,
    canViewAllTrials: isAdmin,

    // Organization permissions
    canInviteMembers: isAdmin,
    canViewStats: isAdmin,
    canManageRoles: isAdmin,
    canViewInvitations: isAdmin,
    canManageMembers: isAdmin,

    // Helper properties
    userRole: member?.default_role,
    isAdmin,
    isStaff,

    // Loading state
    isLoading: !member,
  };
}
