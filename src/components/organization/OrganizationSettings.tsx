import React, { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  Users,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";

interface SettingsFormData {
  name: string;
}

export function OrganizationSettings() {
  const { organization, loading, error, updateOrganization } = useAppData();
  const [formData, setFormData] = useState<SettingsFormData>({
    name: organization?.name || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Update form data when organization loads
  React.useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
      });
    }
  }, [organization]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Organization name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Organization name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Organization name must be less than 100 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof SettingsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Reset save status when user makes changes
    if (saveStatus !== "idle") {
      setSaveStatus("idle");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const success = await updateOrganization({
        name: formData.name.trim(),
      });

      if (success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Error saving organization settings:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner message="Loading organization settings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load settings
        </h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Organization Found
        </h3>
        <p className="text-gray-600">
          You don't seem to belong to any organization yet.
        </p>
      </div>
    );
  }

  const hasChanges = formData.name !== organization.name;

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Organization Settings
          </h2>
          <p className="text-gray-600">
            Manage your organization's basic information and preferences
          </p>
        </div>

        {/*  */}

        {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="orgName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Organization Name *
              </label>
              <Input
                id="orgName"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter organization name"
                className={
                  validationErrors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
              />
              {validationErrors.name && (
                <div className="flex items-center space-x-1 mt-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600">
                    {validationErrors.name}
                  </p>
                </div>
              )}
            </div>

            {/* Save Status Messages */}
            {saveStatus === "success" && (
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Settings saved successfully!
                </p>
              </div>
            )}

            {saveStatus === "error" && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800">
                  Failed to save settings. Please try again.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({ name: organization.name });
                  setValidationErrors({});
                  setSaveStatus("idle");
                }}
                disabled={!hasChanges || isSaving}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="border-l-4 border-red-500 pl-4 mb-6">
            <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
            <p className="text-sm text-red-700">
              These actions are irreversible. Please be certain before
              proceeding.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h4 className="font-medium text-red-900">
                  Delete Organization
                </h4>
                <p className="text-sm text-red-700">
                  Permanently delete this organization and all associated data.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                onClick={() => {
                  // TODO: Implement delete organization functionality
                  alert(
                    "Delete organization functionality would be implemented here"
                  );
                }}
              >
                Delete Organization
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
