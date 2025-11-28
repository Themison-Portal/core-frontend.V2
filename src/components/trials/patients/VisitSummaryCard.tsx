import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  CheckCircle,
  User,
  Plus,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VisitSummaryCardProps {
  trialPatient: any;
  trial: any;
  onScheduleClick: () => void;
}

export function VisitSummaryCard({
  trialPatient,
  trial,
  onScheduleClick,
}: VisitSummaryCardProps) {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextVisit, setNextVisit] = useState<any>(null);

  useEffect(() => {
    if (trialPatient?.patient_id && trialPatient?.trial_id) {
      loadVisits();
    }
  }, [trialPatient?.patient_id, trialPatient?.trial_id]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("patient_visits")
        .select("*, members:doctor_id(name)")
        .eq("patient_id", trialPatient.patient_id)
        .eq("trial_id", trialPatient.trial_id)
        .order("visit_date", { ascending: true });

      setVisits(data || []);

      // Find next upcoming visit
      const today = new Date().toISOString().split("T")[0];
      const upcomingVisits = (data || []).filter(
        (visit: any) => visit.visit_date >= today && visit.status === "scheduled"
      );
      setNextVisit(upcomingVisits[0] || null);
    } catch (error) {
      console.error("Error loading visits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simple calculations
  const visitStats = {
    completed: visits.filter((v) => v.status === "completed").length,
    scheduled: visits.filter((v) => v.status === "scheduled").length,
    total: visits.length,
  };

  const targetVisits = trialPatient.cost_data?.target_visits || 8;
  const progressPercentage =
    targetVisits > 0 ? (visitStats.completed / targetVisits) * 100 : 0;
  const remainingVisits = Math.max(0, targetVisits - visitStats.completed);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header - Clean and Simple */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Visit Progress
          </h3>
          <Button
            size="sm"
            onClick={onScheduleClick}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>

        {/* Progress Overview - Visual but Simple */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {visitStats.completed} of {targetVisits} completed
            </span>
          </div>

          <Progress value={progressPercentage} className="h-3" />

          {/* Simple 3-metric grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-xl font-bold text-green-600">
                {visitStats.completed}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-blue-600">
                {visitStats.scheduled}
              </div>
              <div className="text-xs text-gray-500">Scheduled</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-gray-600">
                {remainingVisits}
              </div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
          </div>
        </div>

        {/* Next Visit - Clean Card */}
        {nextVisit ? (
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Next Visit</span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium capitalize">
                      {nextVisit.visit_type.replace("_", " ")}
                    </span>
                    <span>•</span>
                    <span>{formatDate(nextVisit.visit_date)}</span>
                  </div>

                  {nextVisit.members?.name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-3 w-3" />
                      <span>Dr. {nextVisit.members.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-4 text-center">
            <div className="space-y-3">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto" />
              <div className="text-sm text-gray-600">
                No upcoming visits scheduled
              </div>
              <Button
                size="sm"
                onClick={onScheduleClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Schedule Next Visit
              </Button>
            </div>
          </div>
        )}

        {/* Simple Alert - Only One */}
        {visitStats.scheduled === 0 && remainingVisits > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Calendar className="h-4 w-4 text-amber-600" />
            <div className="text-sm text-amber-800">
              No visits scheduled. Consider scheduling to maintain timeline.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}