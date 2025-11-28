import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  MapPin,
  Building2,
  User,
  FileText,
  MessageSquare,
  Eye,
  Users,
  Upload,
} from "lucide-react";
import { useTrialDocuments } from "@/hooks/useDocuments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TrialBreadcrumb } from "@/components/common/breadcrumbs/TrialBreadcrumb";

interface TrialOverviewProps {
  trial: any;
}

export function TrialOverview({ trial }: TrialOverviewProps) {
  const navigate = useNavigate();

  const handleUploadDocument = () => {
    // Navigate to the document-hub tab with upload parameter
    navigate(`/trials/${trial.id}/document-hub?upload=true`);
  };

  // Fetch team members to find PI
  const { data: trialTeam = [], isLoading: teamLoading } = useQuery({
    queryKey: ["trial-team", trial.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trial_team", {
        trial_id_param: trial.id,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!trial.id,
  });

  // Find the PI
  const pi = trialTeam.find(
    (member: any) =>
      member.role_name?.toLowerCase().includes("principal investigator") ||
      member.role_name?.toLowerCase().includes("pi")
  );

  // Fetch latest protocol document
  const { data: documents = [], isLoading: docsLoading } = useTrialDocuments(
    trial.id
  );
  const protocolDocument = documents.find(
    (doc: any) => doc.document_type === "protocol" && doc.is_latest
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            {trial.name}
            {/* <Badge variant="secondary" className="ml-2 text-base">
              {trial.status}
            </Badge> */}
          </h2>
          <p className="text-gray-600 max-w-2xl">
            {trial.description || "No description available"}
          </p>
        </div>
        <div className="flex flex-col gap-2 min-w-[220px]">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">Phase:</span>
            <span className="font-semibold">{trial.phase}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">Sponsor:</span>
            <span className="font-semibold">{trial.sponsor}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">Location:</span>
            <span className="font-semibold">{trial.location}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!protocolDocument}
          onClick={() => {
            if (protocolDocument) {
              navigate(
                `/document-assistant/${trial.id}/document-ai?documentId=${protocolDocument.id}`
              );
            }
          }}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Ask AI
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-gray-300 hover:bg-gray-100"
          disabled={!protocolDocument}
          onClick={() => {
            if (protocolDocument) {
              window.open(protocolDocument.document_url, "_blank");
            }
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Protocol
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-gray-300 hover:bg-gray-100"
          onClick={() => navigate(`/trials/${trial.id}/team`)}
        >
          <Users className="w-4 h-4 mr-2" />
          Manage Team
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-blue-300 hover:bg-blue-50 text-blue-600"
          onClick={handleUploadDocument}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PI and Protocol */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <User className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Principal Investigator
              </p>
              <p className="font-semibold text-gray-900">
                {pi ? pi.member_name : "No PI assigned"}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Latest Protocol</p>
              {protocolDocument ? (
                <span className="font-semibold text-gray-900">
                  {protocolDocument.document_name}
                </span>
              ) : (
                <span className="text-gray-500">No protocol uploaded</span>
              )}
            </div>
          </div>
        </div>
        {/* What can I do here? */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-100 p-6 flex flex-col justify-center shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            What can I do here?
          </h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
            <li>Review the latest protocol and trial details</li>
            <li>Ask the AI assistant about trial documents</li>
            <li>Manage the trial team and assignments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
