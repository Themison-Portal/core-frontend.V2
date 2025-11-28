import React from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function SignIn() {
  return (
    <AuthLayout title="Sign In" subtitle="Access your THEMISON account">
      <LoginForm />
    </AuthLayout>
  );
}
