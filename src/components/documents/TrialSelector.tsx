import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import {
  FileText,
  Search,
  MapPin,
  User,
  Files,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrialSelectorProps {
  from: string;
}

export function TrialSelector({ from }: TrialSelectorProps) {
  const { metrics, isLoading } = useAppData();
  const trials = metrics?.trials || [];
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrials = trials.filter((trial) =>
    trial.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (trial: any) => {
    const status = trial.status?.toLowerCase();
    if (status === 'active') return { text: 'Active', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' };
    if (status === 'recruiting') return { text: 'Recruiting', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' };
    if (status === 'screening') return { text: 'Screening', variant: 'default' as const, className: 'bg-blue-100 text-blue-800' };
    return { text: status || 'Unknown', variant: 'secondary' as const, className: '' };
  };

  const getDocumentCount = (trial: any) => {
    // Mock document count - in real app this would come from API
    const counts = {
      'Opera': 12,
      'Diabetes': 8, 
      'Obesity': 5,
      'Arthritis': 15
    };
    return counts[trial.name as keyof typeof counts] || Math.floor(Math.random() * 20) + 1;
  };

  const getPrincipalInvestigator = (trial: any) => {
    // Mock principal investigators - in real app this would come from API
    const investigators = {
      'Opera': 'Facundo Themison',
      'Diabetes': 'Michael Pavlou',
      'Obesity': 'Facundo Themison',
      'Arthritis': 'Michael Pavlou'
    };
    return investigators[trial.name as keyof typeof investigators] || 'Facundo Themison';
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Select Trial to Analyze</h1>
          <p className="text-gray-600 text-sm">Choose which trial's documents you want to work with</p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by trial name, location, or investigator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        {/* Trials Grid */}
        <div className="grid gap-3 max-w-3xl mx-auto">
            {filteredTrials.map((trial) => {
              const statusBadge = getStatusBadge(trial);
              const docCount = getDocumentCount(trial);
              
              return (
                <div
                  key={trial.id}
                  className={cn(
                    "group border rounded-lg p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer",
                    "transition-all duration-200 bg-white"
                  )}
                  onClick={() =>
                    navigate(`/document-assistant/${trial.id}/active-documents`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {trial.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {trial.phase}
                        </Badge>
                        <Badge className={`text-xs ${statusBadge.className}`}>
                          {statusBadge.text}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{trial.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{getPrincipalInvestigator(trial)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Files className="h-3 w-3" />
                          <span>{docCount} docs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        {filteredTrials.length === 0 && (
          <div className="text-center py-8 max-w-3xl mx-auto">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No trials found</h3>
            <p className="text-xs text-gray-600">Try adjusting your search terms or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
