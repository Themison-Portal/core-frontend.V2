import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, HelpCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
}

interface InviteMembersProps {
  onContinue: (members: Member[]) => void;
}

export function InviteMembers({ onContinue }: InviteMembersProps) {
  const [members, setMembers] = useState<Member[]>([
    { id: "1", name: "", email: "", role: "staff" },
  ]);

  const addMember = () => {
    setMembers([
      ...members,
      {
        id: Date.now().toString(),
        name: "",
        email: "",
        role: "staff",
      },
    ]);
  };

  const removeMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  const updateMember = (id: string, field: keyof Member, value: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleContinue = () => {
    const validMembers = members.filter((m) => m.name.trim() && m.email.trim());
    onContinue(validMembers);
  };

  const isValid = members.some((m) => m.name.trim() && m.email.trim());

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">
              Organization Members Setup
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Invite members to your organization. This affects the entire
              organization and helps you build your complete staff roster.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {members.map((member, index) => (
          <Card
            key={member.id}
            className="p-0 shadow-none pb-4 border-0 border-b-2 rounded-none"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <Label htmlFor={`name-${member.id}`}>Full Name</Label>
                <Input
                  id={`name-${member.id}`}
                  placeholder="Enter full name"
                  value={member.name}
                  onChange={(e) =>
                    updateMember(member.id, "name", e.target.value)
                  }
                />
              </div>

              <div className="md:col-span-4">
                <Label htmlFor={`email-${member.id}`}>Email Address</Label>
                <Input
                  id={`email-${member.id}`}
                  type="email"
                  placeholder="Enter email address"
                  value={member.email}
                  onChange={(e) =>
                    updateMember(member.id, "email", e.target.value)
                  }
                />
              </div>

              <div className="md:col-span-3">
                <Label htmlFor={`role-${member.id}`}>
                  <div className="flex items-center space-x-1 mb-1">
                    <span>Organization Role</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <p className="font-medium">Admin:</p>
                            <p className="text-sm mb-2">
                              Full control over the organization, can manage all
                              trials and team members
                            </p>
                            <p className="font-medium">Staff:</p>
                            <p className="text-sm">
                              Can participate in trials with specific
                              permissions assigned per trial
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </Label>
                <Select
                  value={member.role}
                  onValueChange={(value: "admin" | "staff") =>
                    updateMember(member.id, "role", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                {members.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                    className="w-full md:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={addMember}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Team Member
      </Button>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue to Custom Roles
        </Button>
      </div>
    </div>
  );
}
