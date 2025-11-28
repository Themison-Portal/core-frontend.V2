import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, Plus, X } from "lucide-react";

interface EmailShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  originalPrompt: string;
  trialId: string;
}

export function EmailShareModal({
  isOpen,
  onClose,
  messageContent,
  originalPrompt,
  trialId,
}: EmailShareModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [subject, setSubject] = useState(
    `Document AI Insights - Trial ${trialId}`
  );
  const [message, setMessage] = useState(
    `I wanted to share some insights from our Document AI analysis.\n\nOriginal Question:\n${originalPrompt}\n\nAI Response:\n${messageContent}\n\nBest regards`
  );

  const handleAddRecipient = () => {
    setRecipients([...recipients, ""]);
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length > 1) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
    }
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate recipients
      const validRecipients = recipients.filter(email => 
        email.trim() && isValidEmail(email.trim())
      );

      if (validRecipients.length === 0) {
        toast({
          title: "Invalid Recipients",
          description: "Please provide at least one valid email address",
          variant: "destructive",
        });
        return;
      }

      // For now, simulate API call (replace with actual email service)
      await simulateEmailSend(validRecipients, subject, message);

      toast({
        title: "Email Sent Successfully",
        description: `Shared with ${validRecipients.length} recipient(s)`,
      });

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: "There was an error sending the email",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRecipients([""]);
    setSubject(`Document AI Insights - Trial ${trialId}`);
    setMessage(
      `I wanted to share some insights from our Document AI analysis.\n\nOriginal Question:\n${originalPrompt}\n\nAI Response:\n${messageContent}\n\nBest regards`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Share Document AI Response
          </DialogTitle>
          <DialogDescription>
            Share this conversation and insights via email with your team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipients Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Recipients</Label>
            {recipients.map((recipient, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="colleague@hospital.com"
                  value={recipient}
                  onChange={(e) => handleRecipientChange(index, e.target.value)}
                  className="flex-1"
                />
                {recipients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRecipient(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRecipient}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Recipient
            </Button>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="resize-none"
              placeholder="Email message..."
            />
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>To:</strong> {recipients.filter(r => r.trim()).join(", ") || "No recipients"}</div>
              <div><strong>Subject:</strong> {subject}</div>
              <div><strong>Trial ID:</strong> {trialId}</div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function simulateEmailSend(
  recipients: string[],
  subject: string,
  message: string
): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // In a real implementation, this would call your email service
  // e.g., Supabase Edge Functions, SendGrid, etc.
  console.log('Email would be sent with:', {
    to: recipients,
    subject,
    message,
    timestamp: new Date().toISOString(),
  });

  // For demo purposes, randomly succeed or fail
  if (Math.random() > 0.1) {
    return Promise.resolve();
  } else {
    throw new Error('Simulated email sending failure');
  }
}