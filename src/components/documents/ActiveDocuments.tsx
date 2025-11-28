import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrialDocuments } from "@/hooks/useDocuments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ArrowUpDown,
  Filter,
  MessageSquare,
  FileText,
  Download,
  Eye,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface ActiveDocumentsProps {
  trial: any;
}

export function ActiveDocuments({ trial }: ActiveDocumentsProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Actives");
  const { data: documents = [], isLoading } = useTrialDocuments(trial.id);

  const tabs = ["Actives", "Archived", "All Documents"];

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "signed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "submitted":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDocumentType = (type: string) => {
    switch (type) {
      case "protocol":
        return "Protocol";
      case "brochure":
        return "Brochure";
      case "consent_form":
        return "Consent Form";
      case "report":
        return "Report";
      case "manual":
        return "Manual";
      case "plan":
        return "Plan";
      default:
        return type;
    }
  };

  const isLatestDocument = (document: any) => {
    return document.is_latest;
  };

  // Find the protocol document for this trial
  const protocolDocument = documents.find(
    (doc) => doc.document_type === "protocol" && doc.is_latest
  );

  // Only show active documents
  const activeDocuments = documents.filter((doc) => doc.is_latest);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Assistant Header Section - Reduced visual weight */}
      <Card className="relative overflow-hidden border border-gray-200 shadow-sm">
        <div className="min-h-24 p-4 bg-gray-50 relative border-l-4 border-blue-500">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                if (protocolDocument) {
                  navigate(
                    `/document-assistant/${trial.id}/document-ai?documentId=${protocolDocument.id}`
                  );
                } else {
                  navigate(`/document-assistant/${trial.id}/document-ai`);
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
              onClick={() => navigate(`/trials/${trial.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Trial
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
              onClick={() => {
                if (protocolDocument) {
                  window.open(protocolDocument.document_url, "_blank");
                }
              }}
              disabled={!protocolDocument}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Protocol
            </Button>
          </div>
          <div className="space-y-2">
            {/* Trial Name */}
            <h2 className="text-xl font-bold text-gray-900">{trial.name}</h2>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              Document Assistant - Review active documents for AI analysis
            </p>
            {/* Protocol Info */}
            {protocolDocument && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Latest Protocol: </span>
                <button
                  className="text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                  onClick={() => {
                    navigate(
                      `/document-assistant/${trial.id}/document-ai?documentId=${protocolDocument.id}`
                    );
                  }}
                >
                  {protocolDocument.document_name}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
      {/* Documents Table - Read Only Actions */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeDocuments.map((document: any) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {document.document_name}
                    </span>
                    {isLatestDocument(document) && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {document.uploaded_by_member?.name || "Unknown"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Principal Investigator
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200"
                  >
                    {formatDocumentType(document.document_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusBadgeColor(
                      document.status || "pending"
                    )}
                  >
                    {document.status || "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(
                    new Date(document.updated_at || document.created_at),
                    "yyyy-MM-dd"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Ask AI about this document"
                      onClick={() =>
                        navigate(
                          `/document-assistant/${trial.id}/document-ai?documentId=${document.id}`
                        )
                      }
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
