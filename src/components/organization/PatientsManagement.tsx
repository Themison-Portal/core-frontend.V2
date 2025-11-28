import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Users,
  Eye,
  Plus,
  Edit,
  UserX,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Heart,
  Shield,
  FileText,
  File,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  usePatients,
  type PatientInsert,
  type Patient,
} from "@/hooks/usePatients";
import { useAppData } from "@/hooks/useAppData";
import { PatientDetailsDrawer } from "./PatientDetailsDrawer";
import { usePatientDocuments } from "@/hooks/usePatientDocuments";
import { supabase } from "@/integrations/supabase/client";

// Form validation and constants
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const BLOOD_TYPE_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "unknown", label: "Unknown" },
];

const INITIAL_FORM_STATE: PatientInsert = {
  patient_code: "",
  organization_id: "",
  first_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "prefer_not_to_say",
  phone_number: "",
  email: "",
  street_address: "",
  city: "",
  state_province: "",
  postal_code: "",
  country: "United States",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  height_cm: undefined,
  weight_kg: undefined,
  blood_type: "unknown",
  medical_history: "",
  current_medications: "",
  known_allergies: "",
  primary_physician_name: "",
  primary_physician_phone: "",
  insurance_provider: "",
  insurance_policy_number: "",
  consent_signed: false,
  consent_date: "",
  screening_notes: "",
  is_active: true,
};

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// Patient documents summary component
interface PatientDocumentsSummaryProps {
  patientId: string;
}

function PatientDocumentsSummary({ patientId }: PatientDocumentsSummaryProps) {
  const { documents, documentsLoading } = usePatientDocuments({ patientId });

  if (documentsLoading) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <File className="w-3 h-3" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  const totalDocs = documents.length;
  const pendingDocs = documents.filter(
    (doc) => doc.status === "pending"
  ).length;
  const approvedDocs = documents.filter(
    (doc) => doc.status === "approved" || doc.status === "active"
  ).length;

  if (totalDocs === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <File className="w-3 h-3" />
        <span className="text-xs">No documents</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <File className="w-3 h-3 text-blue-500" />
        <span className="text-xs font-medium">{totalDocs}</span>
      </div>
      {approvedDocs > 0 && (
        <Badge
          variant="outline"
          className="text-xs px-2 py-0 flex items-center w-fit"
        >
          {approvedDocs} approved
        </Badge>
      )}
      {pendingDocs > 0 && (
        <Badge variant="secondary" className="text-xs px-1 py-0">
          {pendingDocs} pending
        </Badge>
      )}
    </div>
  );
}

// Utility functions
const formatGender = (gender: string | null) => {
  if (!gender) return "Not specified";
  const genderMap: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
    prefer_not_to_say: "Prefer not to say",
  };
  return genderMap[gender] || gender;
};

const calculateAge = (dateOfBirth: string | null) => {
  if (!dateOfBirth) return "N/A";
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  return monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1
    : age;
};

export function PatientsManagement() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PatientInsert>(INITIAL_FORM_STATE);
  const [currentStep, setCurrentStep] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  // Details drawer state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const { organization } = useAppData();
  const {
    patients,
    patientsLoading,
    createPatient,
    updatePatient,
    createPatientLoading,
    updatePatientLoading,
    generatePatientCode,
  } = usePatients({ organizationId: organization?.id });

  // Check URL parameters to auto-open dialog
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has('sign-patient')) {
      handleCreateNew();
    }
  }, [location.search]);

  // Generate patient code when dialog opens for new patient
  useEffect(() => {
    if (open && !isEditing && organization?.id) {
      generatePatientCode(organization.id).then((code) => {
        setForm((prev) => ({
          ...prev,
          patient_code: code,
          organization_id: organization.id,
        }));
      });
    }
  }, [open, isEditing, organization?.id, generatePatientCode]);

  const handleInputChange = (field: keyof PatientInsert, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!form.patient_code || !form.organization_id) {
      return;
    }

    // Email validation - check for duplicates if email is provided
    if (form.email && form.email.trim()) {
      // Real-time validation with Supabase - exact match on email and organization
      const { data: existingEmail, error: emailError } = await supabase
        .from("patients")
        .select("patient_code, first_name, last_name, email")
        .eq("organization_id", form.organization_id)
        .eq("email", form.email.trim()) // Use exact match instead of ilike
        .neq("id", editingPatientId || ""); // Exclude current patient if editing
      
      if (emailError) {
        console.error("Email validation error:", emailError);
        alert("Error validating email. Please try again.");
        return;
      }
      
      if (existingEmail && existingEmail.length > 0) {
        const existing = existingEmail[0];
        alert(`Email ${form.email} is already in use by patient ${existing.patient_code} (${existing.first_name} ${existing.last_name})`);
        return;
      }
    }

    // Convert numeric strings to numbers
    const submitData = {
      ...form,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      consent_date: form.consent_date || null,
    };

    if (isEditing && editingPatientId) {
      updatePatient(
        { id: editingPatientId, updates: submitData },
        {
          onSuccess: () => {
            setOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createPatient(submitData, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM_STATE);
    setCurrentStep("basic");
    setIsEditing(false);
    setEditingPatientId(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    // Populate form with patient data
    setForm({
      patient_code: patient.patient_code,
      organization_id: patient.organization_id,
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      date_of_birth: patient.date_of_birth || "",
      gender: patient.gender || "prefer_not_to_say",
      phone_number: patient.phone_number || "",
      email: patient.email || "",
      street_address: patient.street_address || "",
      city: patient.city || "",
      state_province: patient.state_province || "",
      postal_code: patient.postal_code || "",
      country: patient.country || "United States",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      emergency_contact_relationship:
        patient.emergency_contact_relationship || "",
      height_cm: patient.height_cm || undefined,
      weight_kg: patient.weight_kg || undefined,
      blood_type: patient.blood_type || "unknown",
      medical_history: patient.medical_history || "",
      current_medications: patient.current_medications || "",
      known_allergies: patient.known_allergies || "",
      primary_physician_name: patient.primary_physician_name || "",
      primary_physician_phone: patient.primary_physician_phone || "",
      insurance_provider: patient.insurance_provider || "",
      insurance_policy_number: patient.insurance_policy_number || "",
      consent_signed: patient.consent_signed || false,
      consent_date: patient.consent_date || "",
      screening_notes: patient.screening_notes || "",
      is_active: patient.is_active || true,
    });

    setIsEditing(true);
    setEditingPatientId(patient.id);
    setCurrentStep("basic");
    setOpen(true);
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
        <p className="text-gray-600">Manage patients in your organization</p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-2">
        <Button
          className="flex items-center gap-2"
          variant="default"
          onClick={handleCreateNew}
        >
          <Plus className="w-4 h-4" />
          Sign a new patient
        </Button>
      </div>

      {/* Create/Edit Patient Dialog */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}
      >
        <DialogOverlay className="bg-black/10" />
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Patient" : "Sign New Patient"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the patient information below."
                : "Fill in the patient details below. Fields marked with * are required."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={currentStep} onValueChange={setCurrentStep}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="admin">Administrative</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <FormSection
                  title="Basic Information"
                  icon={<Users className="w-4 h-4" />}
                >
                  <div>
                    <Label htmlFor="patient_code">Patient Code *</Label>
                    <Input
                      id="patient_code"
                      value={form.patient_code}
                      onChange={(e) =>
                        handleInputChange("patient_code", e.target.value)
                      }
                      required
                      disabled={isEditing}
                      className={isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div className="md:col-span-2"></div>

                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={form.first_name || ""}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={form.last_name || ""}
                      onChange={(e) =>
                        handleInputChange("last_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={form.date_of_birth || ""}
                      onChange={(e) =>
                        handleInputChange("date_of_birth", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={form.gender || "prefer_not_to_say"}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                <FormSection
                  title="Contact Information"
                  icon={<Phone className="w-4 h-4" />}
                >
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={form.phone_number || ""}
                      onChange={(e) =>
                        handleInputChange("phone_number", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="street_address">Street Address</Label>
                    <Input
                      id="street_address"
                      value={form.street_address || ""}
                      onChange={(e) =>
                        handleInputChange("street_address", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city || ""}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="state_province">State/Province</Label>
                    <Input
                      id="state_province"
                      value={form.state_province || ""}
                      onChange={(e) =>
                        handleInputChange("state_province", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={form.postal_code || ""}
                      onChange={(e) =>
                        handleInputChange("postal_code", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={form.country || "United States"}
                      onChange={(e) =>
                        handleInputChange("country", e.target.value)
                      }
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Emergency Contact"
                  icon={<Shield className="w-4 h-4" />}
                >
                  <div>
                    <Label htmlFor="emergency_contact_name">Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={form.emergency_contact_name || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_name",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergency_contact_phone">
                      Contact Phone
                    </Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={form.emergency_contact_phone || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_phone",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="emergency_contact_relationship">
                      Relationship
                    </Label>
                    <Input
                      id="emergency_contact_relationship"
                      value={form.emergency_contact_relationship || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_relationship",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="medical" className="space-y-6">
                <FormSection
                  title="Physical Information"
                  icon={<Heart className="w-4 h-4" />}
                >
                  <div>
                    <Label htmlFor="height_cm">Height (cm)</Label>
                    <Input
                      id="height_cm"
                      type="number"
                      value={form.height_cm || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "height_cm",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="170"
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      value={form.weight_kg || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "weight_kg",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="70.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="blood_type">Blood Type</Label>
                    <Select
                      value={form.blood_type || "unknown"}
                      onValueChange={(value) =>
                        handleInputChange("blood_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="medical_history">Medical History</Label>
                    <Textarea
                      id="medical_history"
                      value={form.medical_history || ""}
                      onChange={(e) =>
                        handleInputChange("medical_history", e.target.value)
                      }
                      placeholder="Previous surgeries, chronic conditions, etc."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="current_medications">
                      Current Medications
                    </Label>
                    <Textarea
                      id="current_medications"
                      value={form.current_medications || ""}
                      onChange={(e) =>
                        handleInputChange("current_medications", e.target.value)
                      }
                      placeholder="List current medications and dosages"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="known_allergies">Known Allergies</Label>
                    <Textarea
                      id="known_allergies"
                      value={form.known_allergies || ""}
                      onChange={(e) =>
                        handleInputChange("known_allergies", e.target.value)
                      }
                      placeholder="Drug allergies, food allergies, environmental allergies"
                      className="min-h-[60px]"
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Primary Physician"
                  icon={<FileText className="w-4 h-4" />}
                >
                  <div>
                    <Label htmlFor="primary_physician_name">
                      Physician Name
                    </Label>
                    <Input
                      id="primary_physician_name"
                      value={form.primary_physician_name || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "primary_physician_name",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="primary_physician_phone">
                      Physician Phone
                    </Label>
                    <Input
                      id="primary_physician_phone"
                      type="tel"
                      value={form.primary_physician_phone || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "primary_physician_phone",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="admin" className="space-y-6">
                <FormSection
                  title="Insurance Information"
                  icon={<Shield className="w-4 h-4" />}
                >
                  <div>
                    <Label htmlFor="insurance_provider">
                      Insurance Provider
                    </Label>
                    <Input
                      id="insurance_provider"
                      value={form.insurance_provider || ""}
                      onChange={(e) =>
                        handleInputChange("insurance_provider", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="insurance_policy_number">
                      Policy Number
                    </Label>
                    <Input
                      id="insurance_policy_number"
                      value={form.insurance_policy_number || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "insurance_policy_number",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Consent & Screening"
                  icon={<FileText className="w-4 h-4" />}
                >
                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id="consent_signed"
                      checked={form.consent_signed || false}
                      onCheckedChange={(checked) =>
                        handleInputChange("consent_signed", !!checked)
                      }
                    />
                    <Label htmlFor="consent_signed">
                      Informed Consent Signed
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="consent_date">Consent Date</Label>
                    <Input
                      id="consent_date"
                      type="date"
                      value={form.consent_date || ""}
                      onChange={(e) =>
                        handleInputChange("consent_date", e.target.value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="screening_notes">Screening Notes</Label>
                    <Textarea
                      id="screening_notes"
                      value={form.screening_notes || ""}
                      onChange={(e) =>
                        handleInputChange("screening_notes", e.target.value)
                      }
                      placeholder="Initial screening notes, eligibility assessment, etc."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={form.is_active || false}
                      onCheckedChange={(checked) =>
                        handleInputChange("is_active", !!checked)
                      }
                    />
                    <Label htmlFor="is_active">Patient Active</Label>
                  </div>
                </FormSection>
              </TabsContent>
            </Tabs>
          </form>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={createPatientLoading || updatePatientLoading}
            >
              {createPatientLoading || updatePatientLoading
                ? isEditing
                  ? "Updating..."
                  : "Signing..."
                : isEditing
                ? "Update Patient"
                : "Sign Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Details Drawer */}
      <PatientDetailsDrawer
        patient={selectedPatient}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Patients Table */}
      <Card>
        <div className="p-4">
          {patientsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-gray-500"
                    >
                      No patients found. Create your first patient to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.patient_code}
                      </TableCell>
                      <TableCell>
                        {patient.first_name && patient.last_name
                          ? `${patient.first_name} ${patient.last_name}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {calculateAge(patient.date_of_birth)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {formatGender(patient.gender)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {patient.phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[120px]">
                                {patient.phone_number}
                              </span>
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[120px]">
                                {patient.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PatientDocumentsSummary patientId={patient.id} />
                      </TableCell>
                      <TableCell>
                        {patient.consent_signed ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            ✓ Signed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={patient.is_active ? "default" : "secondary"}
                        >
                          {patient.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View details"
                            onClick={() => handleViewDetails(patient)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit patient"
                            onClick={() => handleEdit(patient)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
