import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";

export function DashboardPage() {
  return (
    <AppLayout title="Dashboard" breadcrumbItems={[]}>
      <Dashboard />
    </AppLayout>
  );
}
