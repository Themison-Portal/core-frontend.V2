import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, FlaskConical, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/hooks/useAppData";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TrialDropdownBreadcrumbProps {
  currentTrial: {
    id: string;
    name: string;
  };
  className?: string;
  basePath?: string;
}

export function TrialDropdownBreadcrumb({
  currentTrial,
  className,
  basePath,
}: TrialDropdownBreadcrumbProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { metrics } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const trials = metrics?.trials || [];
  const filteredTrials = trials.filter((trial) =>
    trial.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBasePath = () => {
    if (basePath) return basePath;

    const pathSegments = location.pathname.split("/");
    return `/${pathSegments[1]}`;
  };

  const handleTrialSelect = (trialId: string) => {
    setIsOpen(false);
    const base = getBasePath();

    let defaultRoute = "";
    switch (base) {
      case "/document-assistant":
        defaultRoute = "active-documents";
        break;
      case "/trials":
        defaultRoute = "overview";
        break;
      default:
        defaultRoute = "";
    }

    navigate(`${base}/${trialId}${defaultRoute ? `/${defaultRoute}` : ""}`);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 hover:bg-gray-100 -ml-2 h-8",
            className
          )}
        >
          <FlaskConical className="h-4 w-4" />
          <span className="truncate max-w-[200px]">{currentTrial.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <div className="p-2">
          <div className="flex items-center px-2 pb-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search trials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[280px] overflow-y-auto">
          <div className="p-1">
            {filteredTrials.length > 0 ? (
              filteredTrials.map((trial) => (
                <DropdownMenuItem
                  key={trial.id}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 cursor-pointer h-11 focus:bg-gray-100",
                    trial.id === currentTrial.id && "bg-gray-100"
                  )}
                  onClick={() => handleTrialSelect(trial.id)}
                >
                  <FlaskConical className="h-4 w-4 shrink-0" />
                  <span className="truncate">{trial.name}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No trials found
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
