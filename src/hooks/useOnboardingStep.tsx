import { useState, useEffect } from "react";

const ONBOARDING_STEP_KEY = "onboarding_current_step";

export function useOnboardingStep(initialStep: number = 1) {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    // Try to get saved step from localStorage
    try {
      const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
      console.log("🔍 Reading from localStorage:", {
        savedStep,
        parsed: savedStep ? parseInt(savedStep, 10) : null,
      });
      return savedStep ? parseInt(savedStep, 10) : initialStep;
    } catch (error) {
      console.warn("Failed to read onboarding step from localStorage:", error);
      return initialStep;
    }
  });

  // Save step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
      console.log("💾 Saved to localStorage:", {
        currentStep,
        key: ONBOARDING_STEP_KEY,
      });
    } catch (error) {
      console.warn("Failed to save onboarding step to localStorage:", error);
    }
  }, [currentStep]);

  // Clear saved step (useful when onboarding is completed)
  const clearSavedStep = () => {
    try {
      localStorage.removeItem(ONBOARDING_STEP_KEY);
    } catch (error) {
      console.warn("Failed to clear onboarding step from localStorage:", error);
    }
  };

  // Navigate to specific step
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    goToStep,
    nextStep,
    prevStep,
    clearSavedStep,
  };
}
