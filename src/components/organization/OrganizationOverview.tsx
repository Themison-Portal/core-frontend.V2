import React from "react";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Building2,
  Users,
  FileText,
  Shield,
  Mail,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "./LoadingSpinner.tsx";
import { ErrorBoundary } from "./ErrorBoundary.tsx";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-300 group">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {trend && (
            <div
              className={`flex items-center space-x-1 ${
                trend.isPositive ? "text-blue-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`h-4 w-4 ${trend.isPositive ? "" : "rotate-180"}`}
              />
              <span className="text-sm font-medium">{trend.value}%</span>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

interface OrganizationHeaderProps {
  organization: NonNullable<ReturnType<typeof useAppData>["organization"]>;
}

function OrganizationHeader({ organization }: OrganizationHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {organization.name}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              {/* TODO: Add created_at back to organization query */}
              {/* <div className="flex items-center space-x-1 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Created{" "}
                  {format(new Date(organization.created_at!), "MMM dd, yyyy")}
                </span>
              </div> */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  organization.onboarding_completed
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {organization.onboarding_completed ? "Active" : "Setup Pending"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const { canInviteMembers, canManageRoles, canViewInvitations } =
    usePermissions();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {canInviteMembers && (
          <button className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all group">
            <Users className="h-5 w-5 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              Invite Members
            </span>
          </button>
        )}
        {canManageRoles && (
          <button className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all group">
            <Shield className="h-5 w-5 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              Manage Roles
            </span>
          </button>
        )}
        <button className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all group">
          <FileText className="h-5 w-5 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            View Trials
          </span>
        </button>
        {canViewInvitations && (
          <button className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all group">
            <Mail className="h-5 w-5 text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              Invitations
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export function OrganizationOverview() {
  const { organization, stats, loading, error } = useAppData();
  const { canViewStats } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Organization Found
          </h3>
          <p className="text-gray-600">
            You don't seem to belong to any organization yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Organization Header */}
        <OrganizationHeader organization={organization} />

        {/* Stats Grid - Only visible to admin */}
        {canViewStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Team Members"
              value={stats.totalMembers}
              icon={Users}
              description="Active members in organization"
              color="bg-blue-500"
            />
            <StatCard
              title="Active Trials"
              value={stats.totalTrials}
              icon={FileText}
              description="Currently running trials"
              color="bg-blue-500"
            />
            <StatCard
              title="Custom Roles"
              value={stats.totalRoles}
              icon={Shield}
              description="Defined access roles"
              color="bg-blue-500"
            />
            {/* stat card only visible if stats.totalInvitations is diff than 0 */}
            {stats.totalInvitations > 0 && (
              <StatCard
                title="Pending Invites"
                value={stats.totalInvitations}
                icon={Mail}
                description="Outstanding invitations"
                color="bg-blue-500"
              />
            )}
          </div>
        )}

        {/* Recent Activity Placeholder - Only visible to admin
        {canViewStats && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Activity placeholder {i}
                    </p>
                    <p className="text-xs text-gray-500">
                      This is where recent activity would appear
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">2h ago</span>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </ErrorBoundary>
  );
}
