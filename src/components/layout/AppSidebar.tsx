import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User,
  LogOut,
  Home,
  FileText,
  MessageSquare,
  Building2,
  Bell,
  Puzzle,
  HelpCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChatHistory } from "./ChatHistory";

export const AppSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      current: location.pathname === "/dashboard",
    },
    {
      name: "Trials",
      href: "/trials",
      icon: FileText,
      current: location.pathname.startsWith("/trials"),
    },
    {
      name: "Document Assistant",
      href: "/document-assistant/select-trial",
      icon: MessageSquare,
      current: location.pathname.startsWith("/document-assistant"),
    },
    {
      name: "Organization",
      href: "/organization",
      icon: Building2,
      current: location.pathname.startsWith("/organization"),
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      current: location.pathname.startsWith("/notifications"),
    },
    {
      name: "Integrations",
      href: "/integrations",
      icon: Puzzle,
      current: location.pathname.startsWith("/integrations"),
    },
    {
      name: "Settings",
      href: "/#",
      icon: SettingsIcon,
      current: location.pathname.startsWith("/settings"),
    },
  ];

  const otherItems = [
    {
      name: "Help",
      href: "/#",
      icon: HelpCircle,
      current: location.pathname.startsWith("/help"),
    },
    // {
    //   name: "Settings",
    //   href: "/#",
    //   icon: SettingsIcon,
    //   current: location.pathname.startsWith("/settings"),
    // },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    // Force redirect to home page after logout
    window.location.href = "/";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200 justify-center bg-white">
        <a href="/dashboard">
          <img className="h-4 w-auto " src="/assets/logo.svg" alt="THEMISON" />
        </a>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? "bg-blue-100 text-blue-600 "
                      : "text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Chat History Section */}
          <ChatHistory />

          {/* Others Section */}
          {/* <div className="pt-6">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Others
            </p>
            <div className="mt-2 space-y-1">
              {otherItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        item.current
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div> */}
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
