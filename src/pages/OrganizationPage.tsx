import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { OrganizationManager } from "@/components/organization/OrganizationManager";
import { Building2 } from "lucide-react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";

const tabs = [
  {
    id: "overview",
    name: "Overview",
  },
  {
    id: "members",
    name: "Members",
  },
  {
    id: "roles",
    name: "Roles & Permissions",
  },
  {
    id: "patients",
    name: "Patients",
  },
  {
    id: "financials",
    name: "Financials",
  },
  {
    id: "settings",
    name: "Settings",
  },
] as const;

type TabType = (typeof tabs)[number]["id"];

export function OrganizationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Read tab from URL parameters on mount and when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get("tab") as TabType;

    // Validate that the tab exists in our tabs array
    if (tabFromUrl && tabs.some((tab) => tab.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!params.get("tab")) {
      // If no tab parameter, default to overview
      setActiveTab("overview");
    }
  }, [location.search]);

  // Handle tab change and update URL
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(location.search);
    params.set("tab", newTab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Organization",
      href: "/organization",
      icon: Building2,
    },
  ];

  if (currentTab) {
    breadcrumbItems.push({
      label: currentTab.name,
    });
  }

  return (
    <AppLayout title="Organisation" breadcrumbItems={breadcrumbItems}>
      <OrganizationManager
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </AppLayout>
  );
}
