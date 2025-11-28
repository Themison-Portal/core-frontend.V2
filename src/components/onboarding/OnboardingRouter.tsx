import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { AdminSetupFlow } from "./AdminSetupFlow";
import { AdminOverview } from "./AdminOverview";
import { StaffOnboarding } from "./StaffOnboarding";

export function OnboardingRouter() {
  const navigate = useNavigate();

  // Use centralized data hook
  const { member, organization, isLoading } = useAppData();

  // Check if onboarding is completed and redirect
  useEffect(() => {
    if (!isLoading && member) {
      // For staff members, just check if their onboarding is completed
      if (member.default_role === "staff" && member.onboarding_completed) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // For admin members, check both member and organization onboarding
      if (
        member.default_role === "admin" &&
        member.onboarding_completed &&
        organization?.onboarding_completed
      ) {
        navigate("/dashboard", { replace: true });
        return;
      }
    }
  }, [member, organization, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no member record, something went wrong
  if (!member) {
    const handleClearStorage = () => {
      // Clear localStorage
      localStorage.clear();
      // Clear sessionStorage as well
      sessionStorage.clear();
      // Reload the page to start fresh
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setup Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please contact your administrator to set up your account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-3">
              If you're experiencing issues, try clearing your browser data:
            </p>
            <button
              onClick={handleClearStorage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear Browser Data & Refresh
            </button>
          </div>

          <p className="text-xs text-gray-500">
            This will clear your stored session data and reload the page.
          </p>
        </div>
      </div>
    );
  }

  // Staff onboarding - simple welcome
  if (member.default_role === "staff") {
    return <StaffOnboarding member={member} organization={organization} />;
  }

  // Admin onboarding logic
  if (member.default_role === "admin") {
    // If organization onboarding is not completed, show setup flow
    if (!organization?.onboarding_completed) {
      return <AdminSetupFlow member={member} organization={organization} />;
    }

    // If organization is set up but member hasn't completed onboarding, show overview
    if (!member.onboarding_completed) {
      return <AdminOverview member={member} organization={organization} />;
    }
  }

  // Fallback - show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
