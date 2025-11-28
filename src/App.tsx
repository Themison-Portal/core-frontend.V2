import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { useAppData } from "@/hooks/useAppData";
import Index from "./pages/Index";
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import { DashboardPage } from "./pages/DashboardPage";
import { TrialsPage } from "./pages/TrialsPage";
import TrialDetailPage from "./pages/TrialDetailPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { Notifications } from "./pages/Notifications";
import OnboardingPage from "./pages/OnboardingPage";
import DocumentAssistantPage from "./pages/DocumentAssistantPage";
import NotFound from "./pages/NotFound";
import { LoadingSpinner } from "./components/organization";
import { BreadcrumbProvider } from "@/hooks/useBreadcrumb";

const queryClient = new QueryClient();

function OnboardingRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { member, memberLoading } = useAppData();

  if (loading || memberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If user exists but no member record or onboarding not completed, redirect to onboarding
  if (user && (!member || !member.onboarding_completed)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Index />}
      />
      <Route
        path="/auth/sign-up"
        element={user ? <Navigate to="/dashboard" replace /> : <SignUp />}
      />
      <Route
        path="/auth/sign-in"
        element={user ? <Navigate to="/dashboard" replace /> : <SignIn />}
      />
      {/* Redirect /auth to sign-in as default */}
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/auth/sign-in" replace />
          )
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <DashboardPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trials"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <TrialsPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trials/:trialId"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <TrialDetailPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trials/:trialId/:tab"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <TrialDetailPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <OrganizationPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <IntegrationsPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <Notifications />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-assistant/select-trial"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <DocumentAssistantPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-assistant/:trialId"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <DocumentAssistantPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-assistant/:trialId/:tab"
        element={
          <ProtectedRoute>
            <OnboardingRedirect>
              <DocumentAssistantPage />
            </OnboardingRedirect>
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BreadcrumbProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BreadcrumbProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
