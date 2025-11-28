
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  showSkip?: boolean;
}

export function OnboardingLayout({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  nextLabel = "Continue",
  isNextDisabled = false,
  showSkip = false
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Setup Your Organization</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {children}

          <div className="flex justify-between items-center mt-8">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={onBack}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex space-x-3">
              {showSkip && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip for now
                </Button>
              )}
              {onNext && (
                <Button 
                  onClick={onNext} 
                  disabled={isNextDisabled}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {nextLabel}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
