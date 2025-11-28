import React, { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Search,
  Filter,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, name: string, role: string) => Promise<boolean>;
}

function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setLoading(true);
    const success = await onInvite(email.trim(), name.trim(), role);
    setLoading(false);

    if (success) {
      setEmail("");
      setName("");
      setRole("staff");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Invite Team Member
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MemberCardProps {
  member: ReturnType<typeof useAppData>["members"][0];
  onRemove: (memberId: string) => Promise<boolean>;
  onUpdateRole: (memberId: string, roleId: string) => Promise<boolean>;
}

function MemberCard({ member, onRemove, onUpdateRole }: MemberCardProps) {
  const { canManageMembers } = usePermissions();
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${member.name}?`)) return;

    setLoading(true);
    await onRemove(member.id);
    setLoading(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "staff":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{member.name}</h4>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
              member.default_role
            )}`}
          >
            {member.default_role}
          </span>

          {canManageMembers && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      // Handle edit role
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Role</span>
                  </button>
                  <button
                    onClick={handleRemove}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Member</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Joined {new Date(member.created_at!).toLocaleDateString()}</span>
        <div className="flex items-center space-x-1">
          <div
            className={`w-2 h-2 rounded-full ${
              member.onboarding_completed ? "bg-blue-500" : "bg-gray-500"
            }`}
          />
          <span>
            {member.onboarding_completed ? "Active" : "Pending Setup"}
          </span>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}

export function MembersManagement() {
  const {
    members,
    loading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    stats,
  } = useAppData();
  const { canInviteMembers, canViewStats } = usePermissions();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "all" || member.default_role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner message="Loading team members..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load members
        </h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Members</h2>
            <p className="text-gray-600">
              Manage your organization's members and their roles
            </p>
          </div>
          {canInviteMembers && (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>

        {/* Stats - Only visible to admin */}
        {canViewStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalMembers}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Members</p>
                  <p className="text-xl font-bold text-gray-900">
                    {members.filter((m) => m.onboarding_completed).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Invites</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.totalInvitations}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No members found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start by inviting team members to your organization"}
            </p>
            {!searchTerm && roleFilter === "all" && canInviteMembers && (
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onRemove={removeMember}
                onUpdateRole={updateMemberRole}
              />
            ))}
          </div>
        )}

        {/* Invite Modal */}
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={inviteMember}
        />
      </div>
    </ErrorBoundary>
  );
}
