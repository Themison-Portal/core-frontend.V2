
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';

interface SignupConfirmationProps {
  email: string;
  onBackToSignup: () => void;
}

export function SignupConfirmation({ email, onBackToSignup }: SignupConfirmationProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Account Created Successfully!
        </h3>
        <p className="text-gray-600">
          We've sent a confirmation email to:
        </p>
        <div className="flex items-center justify-center space-x-2 bg-gray-50 rounded-lg p-3">
          <Mail className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">{email}</span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Please check your email and click the confirmation link to activate your account.
        </p>
        
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>
          
          <Button 
            variant="outline" 
            onClick={onBackToSignup}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}
