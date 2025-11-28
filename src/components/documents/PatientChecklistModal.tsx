import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle,
  Clock,
  User,
  FileText,
  Calendar,
  Filter,
} from "lucide-react";

interface PatientChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklistContent: string;
  checklistTitle?: string;
}

interface Patient {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
}

interface TrialPatient {
  id: string;
  trial_id: string;
  patient_id: string;
  enrollment_date: string;
  status: string;
  patient_data?: any;
  patient: Patient;
}

interface Trial {
  id: string;
  name: string;
  phase: string;
  status: string;
}

export function PatientChecklistModal({
  isOpen,
  onClose,
  checklistContent,
  checklistTitle = "Medical Test Checklist",
}: PatientChecklistModalProps) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<string>("");
  const [eligiblePatients, setEligiblePatients] = useState<TrialPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Load trials on mount
  useEffect(() => {
    if (isOpen) {
      loadTrials();
    }
  }, [isOpen]);

  // Load patients when trial is selected
  useEffect(() => {
    if (selectedTrialId) {
      loadEligiblePatients(selectedTrialId);
    } else {
      setEligiblePatients([]);
      setSelectedPatientId("");
    }
  }, [selectedTrialId]);

  const loadTrials = async () => {
    try {
      setLoading(true);
      const { data: trialsData, error } = await supabase
        .from("trials")
        .select("id, name, phase, status")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setTrials(trialsData || []);
    } catch (error) {
      console.error("Error loading trials:", error);
      toast({
        title: "Error",
        description: "Failed to load trials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEligiblePatients = async (trialId: string) => {
    try {
      setLoading(true);
      
      // Get trial patients with their visit history
      const { data: trialPatients, error } = await supabase
        .from("trial_patients")
        .select(`
          id,
          trial_id,
          patient_id,
          enrollment_date,
          status,
          patient_data,
          patient:patients(*)
        `)
        .eq("trial_id", trialId)
        .eq("status", "enrolled");

      if (error) throw error;

      // Filter patients that have screening visits or are in screening phase
      const eligible = (trialPatients || []).filter((tp) => {
        const patientData = tp.patient_data || {};
        const visitHistory = patientData.visitHistory || [];
        
        // Check if patient has screening visits scheduled or completed
        const hasScreeningVisit = visitHistory.some((visit: any) => 
          visit.type?.toLowerCase().includes("screening") ||
          visit.status === "scheduled"
        );
        
        // Also include patients in screening status or recently enrolled
        const isEligibleStatus = tp.status === "screening" || tp.status === "enrolled";
        
        return hasScreeningVisit || isEligibleStatus;
      });

      setEligiblePatients(eligible);
      setSelectedPatientId("");
    } catch (error) {
      console.error("Error loading eligible patients:", error);
      toast({
        title: "Error",
        description: "Failed to load eligible patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignChecklist = async () => {
    if (!selectedPatientId || !checklistContent.trim()) return;

    try {
      setSubmitting(true);

      const selectedPatient = eligiblePatients.find(p => p.id === selectedPatientId);
      if (!selectedPatient) throw new Error("Patient not found");

      // Get current patient data
      const currentPatientData = selectedPatient.patient_data || {};
      const existingChecklists = currentPatientData.assignedChecklists || [];

      // Create new checklist entry
      const newChecklist = {
        id: `checklist_${Date.now()}`,
        title: checklistTitle,
        content: checklistContent,
        assignedAt: new Date().toISOString(),
        status: "assigned",
        notes: notes.trim() || null,
        type: "medical_tests"
      };

      // Update patient data with new checklist
      const updatedPatientData = {
        ...currentPatientData,
        assignedChecklists: [...existingChecklists, newChecklist]
      };

      const { error } = await supabase
        .from("trial_patients")
        .update({
          patient_data: updatedPatientData
        })
        .eq("id", selectedPatientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Checklist assigned to ${selectedPatient.patient.first_name} ${selectedPatient.patient.last_name}`,
      });

      // Reset and close
      handleClose();
    } catch (error) {
      console.error("Error assigning checklist:", error);
      toast({
        title: "Error",
        description: "Failed to assign checklist to patient",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTrialId("");
    setSelectedPatientId("");
    setNotes("");
    onClose();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPatientVisitInfo = (patient: TrialPatient) => {
    const patientData = patient.patient_data || {};
    const visitHistory = patientData.visitHistory || [];
    
    const screeningVisits = visitHistory.filter((visit: any) => 
      visit.type?.toLowerCase().includes("screening")
    );
    
    const upcomingVisits = visitHistory.filter((visit: any) => 
      visit.status === "scheduled"
    );

    return {
      screeningVisits: screeningVisits.length,
      upcomingVisits: upcomingVisits.length,
      totalVisits: visitHistory.length
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assign Checklist to Patient
          </DialogTitle>
          <DialogDescription>
            Assign the medical test checklist to a patient with upcoming screening visits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Checklist Preview */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">{checklistTitle}</h4>
            <div className="text-sm text-blue-800 max-h-32 overflow-y-auto">
              {checklistContent.split('\n').slice(0, 5).map((line, idx) => (
                <div key={idx} className="truncate">{line}</div>
              ))}
              {checklistContent.split('\n').length > 5 && (
                <div className="text-blue-600 italic">... and more</div>
              )}
            </div>
          </div>

          {/* Trial Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Trial
            </label>
            <Select value={selectedTrialId} onValueChange={setSelectedTrialId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a trial..." />
              </SelectTrigger>
              <SelectContent>
                {trials.map((trial) => (
                  <SelectItem key={trial.id} value={trial.id}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{trial.name}</span>
                      <span className="text-xs text-gray-500">
                        Phase {trial.phase} • {trial.status}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Patient Selection */}
          {selectedTrialId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Eligible Patients
                </label>
                <Badge variant="outline" className="text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  Screening/Enrolled only
                </Badge>
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : eligiblePatients.length === 0 ? (
                <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
                  <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No eligible patients found</p>
                  <p className="text-xs text-gray-400">
                    Patients need screening visits or enrolled status
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {eligiblePatients.map((trialPatient) => {
                    const visitInfo = getPatientVisitInfo(trialPatient);
                    const isSelected = selectedPatientId === trialPatient.id;
                    
                    return (
                      <div
                        key={trialPatient.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedPatientId(trialPatient.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {trialPatient.patient.first_name.charAt(0)}
                                {trialPatient.patient.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {trialPatient.patient.first_name} {trialPatient.patient.last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {trialPatient.patient.patient_code} • 
                                Age {calculateAge(trialPatient.patient.date_of_birth)} • 
                                {trialPatient.patient.gender}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={trialPatient.status === "enrolled" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {trialPatient.status}
                            </Badge>
                            {visitInfo.upcomingVisits > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {visitInfo.upcomingVisits} upcoming
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {selectedPatientId && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Assignment Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any specific instructions or notes for this checklist assignment..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignChecklist}
            disabled={!selectedPatientId || !checklistContent.trim() || submitting}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assign Checklist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}