import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SignupFormProps {
  onSignupSuccess: (email: string) => void;
  initialEmail?: string;
}

export function SignupForm({
  onSignupSuccess,
  initialEmail = "",
}: SignupFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Pre-fill email if provided via query parameter
  useEffect(() => {
    if (initialEmail) {
      setFormData((prev) => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      first_name: formData.firstName,
      last_name: formData.lastName,
    });

    if (error) {
      toast({
        title: "Registration Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSignupSuccess(formData.email);
    }

    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
            placeholder="First Name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
            placeholder="Last Name"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        {initialEmail && (
          <p className="text-xs text-blue-600 mb-1">
            Email provided from invitation
          </p>
        )}
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
          placeholder="your.email@example.com"
          className="mt-1"
          readOnly={!!initialEmail}
          disabled={!!initialEmail}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          required
          placeholder="••••••••"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          required
          placeholder="••••••••"
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Create Account"}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/auth/sign-in")}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </form>
  );
}
