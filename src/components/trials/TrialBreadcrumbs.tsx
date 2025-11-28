import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FlaskConical } from "lucide-react";

interface TrialBreadcrumbsProps {
  trial: any;
  currentTab: string;
}

export function TrialBreadcrumbs({ trial, currentTab }: TrialBreadcrumbsProps) {
  const tabNames = {
    overview: "Overview",
    "document-hub": "Document Hub",
    team: "Team",
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <FlaskConical className="h-4 w-4" />
      <Link to="/trials" className="hover:text-blue-600 transition-colors">
        Trials
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link
        to={`/trials/${trial.id}`}
        className="hover:text-blue-600 transition-colors"
      >
        {trial.name}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">
        {tabNames[currentTab] || currentTab}
      </span>
    </div>
  );
}
