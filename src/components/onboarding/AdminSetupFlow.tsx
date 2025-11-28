import React from "react";
import { useOnboardingMutations } from "@/hooks/useOnboardingMutations";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { OnboardingLayout } from "./OnboardingLayout";
import { InviteMembers } from "./InviteMembers";
import { CreateCustomRoles } from "./CreateCustomRoles";
import { CreateTrial } from "./CreateTrial";

interface AdminSetupFlowProps {
  member: any;
  organization: any;
}

export function AdminSetupFlow({ member, organization }: AdminSetupFlowProps) {
  // Use persistent step hook
  const { currentStep, nextStep, prevStep, clearSavedStep } =
    useOnboardingStep();

  // Use centralized mutations
  const { sendInvitationsMutation, createRolesMutation, createTrialMutation } =
    useOnboardingMutations({
      organizationId: organization?.id,
      memberId: member?.id,
    });

  // All mutations now handled by useOnboardingMutations hook

  const handleStep1Continue = (members: any[]) => {
    if (members.length > 0) {
      sendInvitationsMutation.mutate(members);
    }
    nextStep();
  };

  const handleStep2Continue = (roles: any[]) => {
    createRolesMutation.mutate(roles);
    nextStep();
  };

  const handleStep3Complete = (trialData: any) => {
    // Clear saved step since onboarding will be completed
    clearSavedStep();
    createTrialMutation.mutate(trialData);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingLayout
            title="Invite Team Members"
            subtitle="Build your organization team by inviting members and assigning organizational roles"
            currentStep={1}
            totalSteps={3}
          >
            <InviteMembers onContinue={handleStep1Continue} />
          </OnboardingLayout>
        );
      case 2:
        return (
          <OnboardingLayout
            title="Create Custom Roles"
            subtitle="Define trial-specific roles that can be assigned to team members within individual studies"
            currentStep={2}
            totalSteps={3}
            onBack={() => prevStep()}
          >
            <CreateCustomRoles onContinue={handleStep2Continue} />
          </OnboardingLayout>
        );
      case 3:
        return (
          <OnboardingLayout
            title="Create Your First Trial"
            subtitle="Set up your first clinical trial to get started with the platform"
            currentStep={3}
            totalSteps={3}
            onBack={() => prevStep()}
          >
            <CreateTrial
              onComplete={handleStep3Complete}
              isFirstTrial={true}
              organizationId={organization.id}
            />
          </OnboardingLayout>
        );
      default:
        return null;
    }
  };

  return renderCurrentStep();
}
