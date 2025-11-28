import React from "react";
import { Building2, Users, Settings, Shield, BarChart3, DollarSign } from "lucide-react";
import { OrganizationOverview } from "./OrganizationOverview";
import { MembersManagement } from "./MembersManagement";
import { OrganizationSettings } from "./OrganizationSettings";
import { ErrorBoundary } from "./ErrorBoundary";
import { PatientsManagement } from "./PatientsManagement.tsx";
import { FinancialsManagement } from "./FinancialsManagement";

type TabType = "overview" | "members" | "roles" | "settings" | "patients" | "financials";

interface TabItem {
  id: TabType;
  name: string;
  icon: React.ElementType;
  description: string;
}

const tabs: TabItem[] = [
  {
    id: "overview",
    name: "Overview",
    icon: BarChart3,
    description: "Organization dashboard and statistics",
  },
  {
    id: "members",
    name: "Members",
    icon: Users,
    description: "Manage members and invitations",
  },
  {
    id: "patients",
    name: "Patients",
    icon: Users,
    description: "Manage patients in your organization",
  },
  {
    id: "financials",
    name: "Financials",
    icon: DollarSign,
    description: "Budget overview and cost analysis",
  },
  {
    id: "roles",
    name: "Roles & Permissions",
    icon: Shield,
    description: "Configure custom roles and permissions",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    description: "Organization settings and preferences",
  },
];

function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <div className="border-b border-gray-200 bg-white rounded-t-2xl">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon
                className={`-ml-0.5 mr-2 h-5 w-5 transition-colors ${
                  isActive
                    ? "text-blue-500"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function RolesPlaceholder() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Roles & Permissions
          </h2>
          <p className="text-gray-600">
            Configure custom roles and access permissions for your team
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Role Management
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This feature will allow you to create custom roles with specific
              permissions for different team members.
            </p>
            <div className="text-sm text-gray-500">
              <p>Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function TabContent({ activeTab }: { activeTab: TabType }) {
  switch (activeTab) {
    case "overview":
      return <OrganizationOverview />;
    case "members":
      return <MembersManagement />;
    case "roles":
      return <RolesPlaceholder />;
    case "settings":
      return <OrganizationSettings />;
    case "patients":
      return <PatientsManagement />;
    case "financials":
      return <FinancialsManagement />;
    default:
      return <OrganizationOverview />;
  }
}

interface OrganizationManagerProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function OrganizationManager({
  activeTab,
  onTabChange,
}: OrganizationManagerProps) {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
          <div className="p-6">
            <TabContent activeTab={activeTab} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
