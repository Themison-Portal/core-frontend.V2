import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";
import { SignupConfirmation } from "@/components/auth/SignupConfirmation";

export default function SignUp() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [searchParams] = useSearchParams();

  // Extract email and organizationname from query parameters
  const invitedEmail = searchParams.get("email") || "";
  const organizationName = searchParams.get("organizationname") || "";

  const handleSignupSuccess = (email: string) => {
    setUserEmail(email);
    setShowConfirmation(true);
  };

  const handleBackToSignup = () => {
    setShowConfirmation(false);
    setUserEmail("");
  };

  // Create organization message if organizationName is provided
  const organizationMessage = organizationName
    ? `You were invited to be part of ${organizationName}`
    : undefined;

  return (
    <AuthLayout
      title={showConfirmation ? "Check Your Email" : "Create Account"}
      subtitle={
        showConfirmation
          ? "We sent you a confirmation link"
          : invitedEmail
          ? "Complete your invitation to join THEMISON"
          : "Join THEMISON Clinical Trials"
      }
      organizationMessage={!showConfirmation ? organizationMessage : undefined}
    >
      {showConfirmation ? (
        <SignupConfirmation
          email={userEmail}
          onBackToSignup={handleBackToSignup}
        />
      ) : (
        <SignupForm
          onSignupSuccess={handleSignupSuccess}
          initialEmail={invitedEmail}
        />
      )}
    </AuthLayout>
  );
}
