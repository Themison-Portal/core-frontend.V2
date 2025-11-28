import { AppLayout } from "@/components/layout/AppLayout";
import { ThirdPartyIntegrations } from "@/components/organization/ThirdPartyIntegrations";
import { Puzzle } from "lucide-react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";

export function IntegrationsPage() {
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Integrations",
      href: "/integrations",
      icon: Puzzle,
      isActive: true,
    },
  ];

  return (
    <AppLayout title="Integrations" breadcrumbItems={breadcrumbItems}>
      <ThirdPartyIntegrations />
    </AppLayout>
  );
}