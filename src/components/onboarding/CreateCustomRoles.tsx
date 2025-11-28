import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permission_level: "read" | "edit" | "admin";
}

interface CreateCustomRolesProps {
  onContinue: (roles: CustomRole[]) => void;
}

const defaultRoles: CustomRole[] = [
  {
    id: "pi",
    name: "Principal Investigator (PI)",
    description:
      "Leads the clinical trial and has full responsibility for the study",
    permission_level: "admin",
  },
  {
    id: "crc",
    name: "Clinical Research Coordinator (CRC)",
    description: "Manages day-to-day trial operations and patient interactions",
    permission_level: "edit",
  },
  {
    id: "monitor",
    name: "Clinical Monitor",
    description: "Reviews and monitors trial data for quality and compliance",
    permission_level: "read",
  },
];

export function CreateCustomRoles({ onContinue }: CreateCustomRolesProps) {
  const { user } = useAuth();
  const [newRoles, setNewRoles] = useState<CustomRole[]>([]);

  // Get existing roles
  const { data: existingRoles, isLoading } = useQuery({
    queryKey: ["existing-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's organization
      const { data: member } = await supabase
        .from("members")
        .select("organization_id")
        .eq("profile_id", user.id)
        .single();

      if (!member?.organization_id) return [];

      const { data: roles, error } = await supabase
        .from("roles")
        .select("*")
        .eq("organization_id", member.organization_id);

      if (error) throw error;
      return roles || [];
    },
    enabled: !!user?.id,
  });

  const addNewRole = () => {
    setNewRoles([
      ...newRoles,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        permission_level: "read",
      },
    ]);
  };

  const removeNewRole = (id: string) => {
    setNewRoles(newRoles.filter((r) => r.id !== id));
  };

  const updateNewRole = (
    id: string,
    field: keyof CustomRole,
    value: string
  ) => {
    setNewRoles(
      newRoles.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleContinue = () => {
    // Get default roles that don't exist yet
    const missingDefaultRoles = defaultRoles.filter(
      (defaultRole) =>
        !existingRoles?.some((existing) => existing.name === defaultRole.name)
    );

    // Get new roles that have names
    const validNewRoles = newRoles.filter((r) => r.name.trim());

    // Send both default roles that need to be created AND new custom roles
    const allRolesToCreate = [...missingDefaultRoles, ...validNewRoles];

    // Ensure PI role is always included if it doesn't exist
    const hasPIRole =
      existingRoles?.some((r) =>
        r.name.toLowerCase().includes("principal investigator") ||
        r.name.toLowerCase().includes("pi")
      ) ||
      allRolesToCreate.some((r) =>
        r.name.toLowerCase().includes("principal investigator") ||
        r.name.toLowerCase().includes("pi")
      );

    if (!hasPIRole) {
      // Force add PI role if somehow missing
      const piRole = defaultRoles.find((r) => r.id === "pi");
      if (piRole) {
        allRolesToCreate.unshift(piRole);
      }
    }

    console.log("🔧 CreateCustomRoles - Sending roles to create:", {
      missingDefaultRoles,
      validNewRoles,
      allRolesToCreate,
      existingRoles,
      hasPIRole,
    });

    onContinue(allRolesToCreate);
  };

  const getPermissionDescription = (level: string) => {
    switch (level) {
      case "admin":
        return "Full control: can edit trial settings, manage team, and view all data";
      case "edit":
        return "Can edit trial data, manage patients, but cannot change trial settings";
      case "read":
        return "View-only access to trial data and reports";
      default:
        return "";
    }
  };

  const allRoles = [
    ...(existingRoles || []),
    ...defaultRoles.filter(
      (defaultRole) =>
        !existingRoles?.some((existing) => existing.name === defaultRole.name)
    ),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Trial-Specific Roles</h3>
            <p className="text-sm text-blue-700 mt-1">
              Create custom roles that can be assigned to team members within
              specific trials. These roles determine what permissions each
              member has within individual studies.
            </p>
          </div>
        </div>
      </div>

      {/* Existing Roles */}
      {allRoles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">Current Roles</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {allRoles.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allRoles.map((role) => (
              <Card key={role.id} className="p-4 bg-gray-50 border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{role.name}</h4>
                    <Badge
                      variant={
                        role.permission_level === "admin"
                          ? "destructive"
                          : role.permission_level === "edit"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {role.permission_level}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Roles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900">Add New Roles</h3>
          {newRoles.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800"
            >
              {newRoles.length}
            </Badge>
          )}
        </div>

        {newRoles.map((role, index) => (
          <Card key={role.id} className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${role.id}`}>Role Name</Label>
                  <Input
                    id={`name-${role.id}`}
                    placeholder="e.g., Study Coordinator"
                    value={role.name}
                    onChange={(e) =>
                      updateNewRole(role.id, "name", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`permission-${role.id}`}>
                    Permission Level
                  </Label>
                  <Select
                    value={role.permission_level}
                    onValueChange={(value: "read" | "edit" | "admin") =>
                      updateNewRole(role.id, "permission_level", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="read">Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getPermissionDescription(role.permission_level)}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor={`description-${role.id}`}>Description</Label>
                <Textarea
                  id={`description-${role.id}`}
                  placeholder="Describe the responsibilities and duties of this role..."
                  value={role.description}
                  onChange={(e) =>
                    updateNewRole(role.id, "description", e.target.value)
                  }
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeNewRole(role.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addNewRole}
          className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Role
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p>
              These roles will be available when creating trials and assigning
              team members to specific studies. You can always add more roles
              later from the organization settings.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {newRoles.length > 0 ? "Add New Roles & Continue" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
