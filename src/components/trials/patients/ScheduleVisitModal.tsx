import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle,
  Stethoscope,
  FileText,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialPatient: any;
  trial: any;
  onVisitScheduled: () => void;
}

export function ScheduleVisitModal({
  isOpen,
  onClose,
  trialPatient,
  trial,
  onVisitScheduled,
}: ScheduleVisitModalProps) {
  const [visitType, setVisitType] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);

  const { toast } = useToast();

  // Simple visit types with nice visuals but minimal data
  const visitTypes = [
    {
      value: "screening",
      label: "Screening",
      icon: CheckCircle,
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "baseline",
      label: "Baseline",
      icon: Calendar,
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "follow_up",
      label: "Follow-up",
      icon: Stethoscope,
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "treatment",
      label: "Treatment",
      icon: FileText,
      color: "bg-blue-100 text-blue-800",
    },
  ];

  useEffect(() => {
    if (isOpen && trial?.id) {
      loadDoctors();
      // Set default date to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setVisitDate(nextWeek.toISOString().split("T")[0]);
    }
  }, [isOpen, trial?.id]);

  const loadDoctors = async () => {
    try {
      const { data: trialMembers } = await supabase
        .from("trial_members")
        .select("members(id, name)")
        .eq("trial_id", trial.id)
        .eq("is_active", true);

      setDoctors(trialMembers?.map((tm) => tm.members) || []);
    } catch (error) {
      console.error("Error loading doctors:", error);
    }
  };

  const handleScheduleVisit = async () => {
    if (!visitType || !visitDate || !selectedDoctor) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      await supabase.from("patient_visits").insert({
        patient_id: trialPatient.patient_id,
        trial_id: trialPatient.trial_id,
        doctor_id: selectedDoctor,
        visit_date: visitDate,
        visit_type: visitType,
        status: "scheduled",
      });

      toast({
        title: "Visit Scheduled",
        description: `Visit scheduled for ${new Date(
          visitDate
        ).toLocaleDateString()}`,
      });

      resetForm();
      onClose();
      onVisitScheduled();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule visit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVisitType("");
    setVisitDate("");
    setSelectedDoctor("");
  };

  if (!trialPatient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Visit - {trialPatient.patient.first_name}{" "}
            {trialPatient.patient.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visit Type Selection - Visual but Simple */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Visit Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {visitTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = visitType === type.value;

                return (
                  <Card
                    key={type.value}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:shadow-md hover:bg-gray-50"
                    }`}
                    onClick={() => setVisitType(type.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="font-medium text-sm">{type.label}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Simple Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visit Date</Label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{doctor.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Simple Patient Info */}
          <Card className="p-4 bg-gray-50">
            <div className="text-sm space-y-1">
              <div className="font-medium">
                Patient: {trialPatient.patient.patient_code}
              </div>
              <div className="text-gray-600">
                {trialPatient.patient.city}, {trialPatient.patient.country}
              </div>
              {trialPatient.cost_data?.reimbursement_rate && (
                <Badge variant="outline" className="text-xs">
                  Reimbursement: $
                  {trialPatient.cost_data.reimbursement_rate}
                </Badge>
              )}
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleScheduleVisit}
            disabled={loading || !visitType || !visitDate || !selectedDoctor}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Scheduling..." : "Schedule Visit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}