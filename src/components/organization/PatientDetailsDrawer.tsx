import React from "react";
import {
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Heart,
  Shield,
  FileText,
  Activity,
  Users,
  X,
  File,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Patient } from "@/hooks/usePatients";
import { PatientDocuments } from "./PatientDocuments";

interface PatientDetailsDrawerProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetailSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function DetailSection({ title, icon, children }: DetailSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="pl-6 space-y-2">{children}</div>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;
}

function DetailItem({
  label,
  value,
  fallback = "Not provided",
}: DetailItemProps) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-500 min-w-0 flex-1">{label}:</span>
      <span className="text-sm font-medium text-gray-900 ml-2 text-right">
        {value || fallback}
      </span>
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

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not provided";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const calculateAge = (dateOfBirth: string | null) => {
  if (!dateOfBirth) return "Unknown";
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  return monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1
    : age;
};

const formatBloodType = (bloodType: string | null) => {
  if (!bloodType || bloodType === "unknown") return "Unknown";
  return bloodType;
};

export function PatientDetailsDrawer({
  patient,
  open,
  onOpenChange,
}: PatientDetailsDrawerProps) {
  const isMobile = useIsMobile();

  if (!patient) return null;

  const patientName =
    patient.first_name && patient.last_name
      ? `${patient.first_name} ${patient.last_name}`
      : patient.patient_code;

  const age = calculateAge(patient.date_of_birth);
  const fullAddress = [
    patient.street_address,
    patient.city,
    patient.state_province,
    patient.postal_code,
    patient.country,
  ]
    .filter(Boolean)
    .join(", ");

  const patientInfoContent = (
    <div className="space-y-6 pb-6">
      {/* Patient Header */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {patientName}
          </h2>
          <p className="text-gray-600">{patient.patient_code}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{age} years old</Badge>
            <Badge variant="outline">{formatGender(patient.gender)}</Badge>
            {patient.consent_signed && (
              <Badge className="bg-blue-100 text-blue-800">
                Consent Signed
              </Badge>
            )}
            <Badge variant={patient.is_active ? "default" : "secondary"}>
              {patient.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <DetailSection
        title="Basic Information"
        icon={<Users className="w-4 h-4" />}
      >
        <DetailItem
          label="Date of Birth"
          value={formatDate(patient.date_of_birth)}
        />
        <DetailItem label="Gender" value={formatGender(patient.gender)} />
        <DetailItem
          label="Blood Type"
          value={formatBloodType(patient.blood_type)}
        />
      </DetailSection>

      <Separator />

      {/* Contact Information */}
      <DetailSection
        title="Contact Information"
        icon={<Phone className="w-4 h-4" />}
      >
        <DetailItem label="Phone" value={patient.phone_number} />
        <DetailItem label="Email" value={patient.email} />
        {fullAddress && (
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 min-w-0 flex-1">
              Address:
            </span>
            <span className="text-sm font-medium text-gray-900 ml-2 text-right max-w-xs">
              {fullAddress}
            </span>
          </div>
        )}
      </DetailSection>

      <Separator />

      {/* Emergency Contact */}
      {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
        <>
          <DetailSection
            title="Emergency Contact"
            icon={<Shield className="w-4 h-4" />}
          >
            <DetailItem label="Name" value={patient.emergency_contact_name} />
            <DetailItem label="Phone" value={patient.emergency_contact_phone} />
            <DetailItem
              label="Relationship"
              value={patient.emergency_contact_relationship}
            />
          </DetailSection>
          <Separator />
        </>
      )}

      {/* Physical Information */}
      {(patient.height_cm || patient.weight_kg) && (
        <>
          <DetailSection
            title="Physical Information"
            icon={<Heart className="w-4 h-4" />}
          >
            <DetailItem
              label="Height"
              value={patient.height_cm ? `${patient.height_cm} cm` : null}
            />
            <DetailItem
              label="Weight"
              value={patient.weight_kg ? `${patient.weight_kg} kg` : null}
            />
          </DetailSection>
          <Separator />
        </>
      )}

      {/* Medical Information */}
      {(patient.medical_history ||
        patient.current_medications ||
        patient.known_allergies) && (
        <>
          <DetailSection
            title="Medical Information"
            icon={<Activity className="w-4 h-4" />}
          >
            {patient.medical_history && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Medical History:</span>
                <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                  {patient.medical_history}
                </p>
              </div>
            )}
            {patient.current_medications && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">
                  Current Medications:
                </span>
                <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                  {patient.current_medications}
                </p>
              </div>
            )}
            {patient.known_allergies && (
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Known Allergies:</span>
                <p className="text-sm font-medium whitespace-pre-wrap text-red-700">
                  {patient.known_allergies}
                </p>
              </div>
            )}
          </DetailSection>
          <Separator />
        </>
      )}

      {/* Primary Physician */}
      {(patient.primary_physician_name || patient.primary_physician_phone) && (
        <>
          <DetailSection
            title="Primary Physician"
            icon={<FileText className="w-4 h-4" />}
          >
            <DetailItem label="Name" value={patient.primary_physician_name} />
            <DetailItem label="Phone" value={patient.primary_physician_phone} />
          </DetailSection>
          <Separator />
        </>
      )}

      {/* Insurance */}
      {(patient.insurance_provider || patient.insurance_policy_number) && (
        <>
          <DetailSection
            title="Insurance"
            icon={<Shield className="w-4 h-4" />}
          >
            <DetailItem label="Provider" value={patient.insurance_provider} />
            <DetailItem
              label="Policy Number"
              value={patient.insurance_policy_number}
            />
          </DetailSection>
          <Separator />
        </>
      )}

      {/* Administrative */}
      <DetailSection
        title="Administrative"
        icon={<FileText className="w-4 h-4" />}
      >
        <DetailItem
          label="Consent Status"
          value={patient.consent_signed ? "Signed" : "Pending"}
        />
        {patient.consent_date && (
          <DetailItem
            label="Consent Date"
            value={formatDate(patient.consent_date)}
          />
        )}
        {patient.screening_notes && (
          <div className="space-y-1">
            <span className="text-sm text-gray-500">Screening Notes:</span>
            <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
              {patient.screening_notes}
            </p>
          </div>
        )}
        <DetailItem label="Created" value={formatDate(patient.created_at)} />
        <DetailItem
          label="Last Updated"
          value={formatDate(patient.updated_at)}
        />
      </DetailSection>
    </div>
  );

  const content = (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <File className="w-4 h-4" />
          Documents
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {patientInfoContent}
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <PatientDocuments patientId={patient.id} patientName={patientName} />
      </TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Patient Details</DrawerTitle>
            <DrawerDescription>
              Complete information for {patientName}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Patient Details</SheetTitle>
          <SheetDescription>
            Complete information for {patientName}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">{content}</div>
      </SheetContent>
    </Sheet>
  );
}
