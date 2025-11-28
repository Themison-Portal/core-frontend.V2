import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TeamMemberAssignment } from "./TeamMemberAssignment";
import { useAuth } from "@/hooks/useAuth";

interface TrialData {
  name: string;
  description: string;
  phase: string;
  sponsor: string;
  location: string;
  study_start: string;
  estimated_close_out: string;
  autoAssignAsPI: boolean;
  teamAssignments: Array<{
    memberId?: string; // For confirmed members
    invitationId?: string; // For pending invitations
    memberName: string;
    memberEmail: string;
    roleId: string;
    roleName: string;
    type: "confirmed" | "pending";
  }>;
}

interface CreateTrialProps {
  onComplete: (trialData: TrialData) => void;
  isFirstTrial?: boolean;
  organizationId: string;
}

export function CreateTrial({
  onComplete,
  isFirstTrial = true,
  organizationId,
}: CreateTrialProps) {
  const { user } = useAuth();
  const [trialData, setTrialData] = useState<TrialData>({
    name: "",
    description: "",
    phase: "",
    sponsor: "",
    location: "",
    study_start: "",
    estimated_close_out: "",
    autoAssignAsPI: false,
    teamAssignments: [],
  });

  const updateField = (
    field: keyof TrialData,
    value: string | boolean | any[]
  ) => {
    setTrialData((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    onComplete(trialData);
  };

  // Check if there's a PI assigned in the team
  const hasPIAssigned = trialData.teamAssignments.some((assignment) => {
    // Assuming PI role name contains "Principal Investigator" or "PI"
    return (
      assignment.roleName &&
      (assignment.roleName.toLowerCase().includes("principal investigator") ||
        assignment.roleName.toLowerCase().includes("pi"))
    );
  });

  const isValid =
    trialData.name.trim() &&
    trialData.phase &&
    trialData.sponsor.trim() &&
    trialData.location.trim() &&
    (hasPIAssigned || trialData.autoAssignAsPI); // Must have PI assigned or auto-assign checked

  const phases = ["Preclinical", "Phase I", "Phase II", "Phase III"];

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">
              {isFirstTrial ? "Create Your First Trial" : "Create New Trial"}
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              {isFirstTrial
                ? "Set up your first clinical trial to get started. You can add more trials later from the dashboard."
                : "Add a new clinical trial to your organization."}
            </p>
          </div>
        </div>
      </div>

      {/* Trial Details */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Trial Information</h4>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Trial Name *</Label>
              <Input
                id="name"
                placeholder="Enter the official trial name"
                value={trialData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phase">Phase *</Label>
              <Select
                value={trialData.phase}
                onValueChange={(value) => updateField("phase", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase} value={phase}>
                      {phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sponsor">Sponsor *</Label>
              <Input
                id="sponsor"
                placeholder="Trial sponsor organization"
                value={trialData.sponsor}
                onChange={(e) => updateField("sponsor", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="study_start">Study Start Date</Label>
              <Input
                id="study_start"
                type="date"
                value={trialData.study_start}
                onChange={(e) => updateField("study_start", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="estimated_close_out">Estimated Close Out</Label>
              <Input
                id="estimated_close_out"
                type="date"
                value={trialData.estimated_close_out}
                onChange={(e) =>
                  updateField("estimated_close_out", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="Study location/site"
                value={trialData.location}
                onChange={(e) => updateField("location", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the trial objectives and methodology..."
              value={trialData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Team Assignment */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Team Assignment</h4>
        <TeamMemberAssignment
          organizationId={organizationId}
          currentUserId={user?.id}
          autoAssignAsPI={trialData.autoAssignAsPI}
          onAutoAssignPIChange={(checked) =>
            updateField("autoAssignAsPI", checked)
          }
          onAssignmentsChange={(assignments) =>
            updateField("teamAssignments", assignments)
          }
        />
      </Card>

      <div className="flex flex-col items-end gap-2">
        {!isValid && (
          <p className="text-sm text-red-600">
            {!trialData.name.trim() && "Trial name is required. "}
            {!trialData.phase && "Phase is required. "}
            {!trialData.sponsor.trim() && "Sponsor is required. "}
            {!trialData.location.trim() && "Location is required. "}
            {!hasPIAssigned && !trialData.autoAssignAsPI && (
              <span className="font-semibold">
                ⚠️ A Principal Investigator must be assigned to the trial.
              </span>
            )}
          </p>
        )}
        <Button
          onClick={handleComplete}
          disabled={!isValid}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          {isFirstTrial ? "Complete Setup & Go to Dashboard" : "Create Trial"}
        </Button>
      </div>
    </div>
  );
}
