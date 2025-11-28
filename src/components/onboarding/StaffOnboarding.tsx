import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppData } from "@/hooks/useAppData";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle, FileText, UserCheck } from "lucide-react";

interface StaffOnboardingProps {
  member: any;
  organization: any;
}

export function StaffOnboarding({
  member,
  organization,
}: StaffOnboardingProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get trial assignments for current user
  const {
    metrics,
    userTrialAssignments,
    isUserAssignedToTrial,
    getUserRoleInTrial,
    isLoading: dataLoading,
  } = useAppData();

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from("members")
        .update({ onboarding_completed: true })
        .eq("profile_id", user?.id);
    },
    onSuccess: () => {
      toast.success("Welcome to the team!");
      // Invalidate queries to ensure state is updated
      queryClient.invalidateQueries({ queryKey: ["user-member-status"] });
      queryClient.invalidateQueries({ queryKey: ["member"] });
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to complete onboarding: " + error.message);
    },
  });

  const handleGoToDashboard = () => {
    completeOnboardingMutation.mutate();
  };

  // Get assigned trials
  const assignedTrials =
    metrics?.trials?.filter((trial) => isUserAssignedToTrial(trial.id)) || [];
  const hasAssignedTrials = assignedTrials.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Welcome to {organization.name}!
            </h1>
            <p className="text-gray-600">
              You've been invited to join the team as a Staff member.
            </p>
          </div>

          {/* Status Information */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span>Account created successfully</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span>Added to {organization.name}</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              {hasAssignedTrials ? (
                <>
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>
                    Assigned to {assignedTrials.length} trial
                    {assignedTrials.length > 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Waiting for trial assignment</span>
                </>
              )}
            </div>
          </div>

          {/* Assigned Trials Section */}
          {hasAssignedTrials && !dataLoading && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <FileText className="h-5 w-5" />
                Your Assigned Trials
              </h3>
              <div className="space-y-3">
                {assignedTrials.map((trial) => {
                  const userRole = getUserRoleInTrial(trial.id);
                  return (
                    <div
                      key={trial.id}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {trial.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-300"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Assigned
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            • {trial.sponsor}
                          </p>
                          {userRole && (
                            <p className="text-xs text-blue-700 mt-1">
                              Your role: {userRole.name} (
                              {userRole.permission_level})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{trial.phase}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Steps Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
                {hasAssignedTrials ? (
                  <div>
                    <p className="text-sm text-blue-700 mb-3">
                      Great! You're already assigned to {assignedTrials.length}{" "}
                      trial{assignedTrials.length > 1 ? "s" : ""}. You can now
                      access trial data and participate according to your
                      assigned role permissions.
                    </p>
                    <p className="text-sm text-blue-700">
                      Navigate to the dashboard to start working with your
                      assigned trials.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-blue-700 mb-3">
                      You'll be able to participate in clinical trials when an
                      administrator assigns you to specific studies.
                    </p>
                    <p className="text-sm text-blue-700">
                      Once assigned, you'll receive notifications and be able to
                      access trial data according to your assigned role
                      permissions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleGoToDashboard}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
            disabled={completeOnboardingMutation.isPending || dataLoading}
          >
            {completeOnboardingMutation.isPending
              ? "Setting up..."
              : dataLoading
              ? "Loading..."
              : "Go to Dashboard"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
