import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import {
  Bell,
  Check,
  MoreHorizontal,
  Users,
  FileText,
  UserPlus,
  AlertTriangle,
  Info,
  Calendar,
  Settings,
  Trash2,
  Mail,
  BellRing,
  Heart,
  Activity,
  Home,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";

interface Notification {
  id: string;
  type:
    | "trial_update"
    | "patient_alert"
    | "team_invite"
    | "system"
    | "reminder"
    | "approval"
    | "milestone";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  actionUrl?: string;
  actionLabel?: string;
  avatar?: string;
  sender?: string;
  metadata?: {
    patientId?: string;
    trialName?: string;
    documentType?: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "patient_alert",
    title: "Patient Adverse Event Reported",
    message:
      "Patient P-003 in Diabetes trial has reported a Grade 2 adverse event. Immediate review required within 24 hours.",
    timestamp: "5 minutes ago",
    read: false,
    priority: "urgent",
    actionUrl: "/trials/diabetes/patients/P-003",
    actionLabel: "Review Patient",
    metadata: {
      patientId: "P-003",
      trialName: "Diabetes Phase I",
    },
  },
  {
    id: "2",
    type: "team_invite",
    title: "Team Invitation Received",
    message:
      "Dr. Michael Pavlou has invited you to join the Arthritis Phase II trial as Clinical Research Coordinator.",
    timestamp: "2 hours ago",
    read: false,
    priority: "high",
    sender: "Dr. Michael Pavlou",
    avatar: "MP",
    actionLabel: "Accept Invite",
    metadata: {
      trialName: "Arthritis Phase II",
    },
  },
  {
    id: "3",
    type: "approval",
    title: "Document Approval Required",
    message:
      "Protocol amendment for Opera trial requires your approval. Review deadline: January 15, 2025.",
    timestamp: "3 hours ago",
    read: false,
    priority: "high",
    actionUrl: "/trials/opera/documents",
    actionLabel: "Review & Approve",
    metadata: {
      trialName: "Opera Phase II",
      documentType: "Protocol Amendment",
    },
  },
  {
    id: "4",
    type: "trial_update",
    title: "Patient Enrollment Update",
    message:
      "Obesity Phase I trial has successfully enrolled 3 new patients this week. Total: 15/20 patients enrolled.",
    timestamp: "4 hours ago",
    read: false,
    priority: "medium",
    actionUrl: "/trials/obesity",
    actionLabel: "View Progress",
    metadata: {
      trialName: "Obesity Phase I",
    },
  },
  {
    id: "5",
    type: "milestone",
    title: "Trial Milestone Achieved! 🎉",
    message:
      "Congratulations! The Diabetes trial has reached 75% enrollment milestone (15/20 patients). Excellent progress!",
    timestamp: "1 day ago",
    read: true,
    priority: "medium",
    actionUrl: "/trials/diabetes",
    actionLabel: "View Celebration",
    metadata: {
      trialName: "Diabetes Phase I",
    },
  },
  {
    id: "6",
    type: "reminder",
    title: "Upcoming Visit Scheduled",
    message:
      "Patient P-001 has a screening visit scheduled for tomorrow at 10:00 AM. Please prepare required documentation.",
    timestamp: "1 day ago",
    read: true,
    priority: "medium",
    actionUrl: "/trials/diabetes/patients/P-001/visits",
    actionLabel: "Prepare Visit",
    metadata: {
      patientId: "P-001",
      trialName: "Diabetes Phase I",
    },
  },
  {
    id: "7",
    type: "system",
    title: "System Maintenance Notice",
    message:
      "Scheduled system maintenance on January 20-21. Some features may be temporarily unavailable during this time.",
    timestamp: "2 days ago",
    read: true,
    priority: "low",
  },
];

const notificationIcons = {
  trial_update: Activity,
  patient_alert: AlertTriangle,
  team_invite: UserPlus,
  system: Info,
  reminder: Calendar,
  approval: FileText,
  milestone: Heart,
};

const notificationColors = {
  urgent: "text-red-600",
  high: "text-blue-600",
  medium: "text-blue-600",
  low: "text-gray-600",
};

const priorityBadgeVariants = {
  urgent: "destructive" as const,
  high: "default" as const,
  medium: "secondary" as const,
  low: "outline" as const,
};

const notificationBorderColors = {
  urgent: "border-l-red-500",
  high: "border-l-blue-500",
  medium: "border-l-blue-500",
  low: "border-l-gray-300",
};

const iconBackgroundColors = {
  urgent: "bg-red-50 dark:bg-red-900/20",
  high: "bg-blue-50 dark:bg-blue-900/20",
  medium: "bg-blue-50 dark:bg-blue-900/20",
  low: "bg-gray-50 dark:bg-gray-900/20",
};

export function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState("all");
  const [notificationSettings, setNotificationSettings] = useState({
    desktop: true,
    email: true,
    push: false,
    sound: true,
    patientAlerts: true,
    trialUpdates: true,
    teamInvites: true,
    systemNotices: false,
  });

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      href: "/dashboard",
      label: "Home",
      icon: Home,
    },
    {
      label: "Notifications",
      icon: Bell,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter(
    (n) => n.priority === "urgent" && !n.read
  ).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success("Notification marked as read");
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    if (activeTab === "urgent") return notification.priority === "urgent";
    return notification.type === activeTab;
  });

  const getRelativeTime = (timestamp: string) => {
    return timestamp;
  };

  const renderNotificationItem = (notification: Notification) => {
    const Icon = notificationIcons[notification.type];

    return (
      <Card
        key={notification.id}
        className={`transition-all hover:shadow-md cursor-pointer group ${
          !notification.read
            ? `border-l-4 ${
                notificationBorderColors[notification.priority]
              } bg-gradient-to-r from-primary/5 to-transparent`
            : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon or Avatar */}
            <div className="shrink-0 mt-1">
              {notification.sender ? (
                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                  <AvatarImage src={notification.avatar} />
                  <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                    {notification.avatar}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className={`p-2.5 rounded-full ${
                    iconBackgroundColors[notification.priority]
                  } ring-1 ring-white/10`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      notificationColors[notification.priority]
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`font-semibold text-sm ${
                        !notification.read
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {notification.title}
                    </h4>
                    <Badge
                      variant={priorityBadgeVariants[notification.priority]}
                      className="text-xs font-medium"
                    >
                      {notification.priority}
                    </Badge>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Metadata */}
                  {notification.metadata && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {notification.metadata.trialName && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {notification.metadata.trialName}
                        </div>
                      )}
                      {notification.metadata.patientId && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {notification.metadata.patientId}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(notification.timestamp)}
                    </span>
                    {notification.actionLabel && (
                      <Button variant="outline" size="sm" className="h-7">
                        {notification.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!notification.read && (
                      <DropdownMenuItem
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => deleteNotification(notification.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout title="Notifications" breadcrumbItems={breadcrumbItems}>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-background to-muted/30 min-h-screen">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-primary/10 rounded-xl ring-1 ring-primary/20">
                  <BellRing className="h-7 w-7 text-primary" />
                </div>
                {urgentCount > 0 && (
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                    {urgentCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Notifications
                </h1>
                <p className="text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} unread ${
                        unreadCount === 1 ? "notification" : "notifications"
                      }`
                    : "All caught up! 🎉"}
                  {urgentCount > 0 && (
                    <span className="text-destructive font-medium ml-2">
                      • {urgentCount} urgent
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  className="shadow-sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
              <Button variant="outline" size="default" className="shadow-sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Notification Settings Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm mb-3 text-foreground">
                      Delivery Methods
                    </h4>
                    <div className="space-y-4">
                      {[
                        {
                          key: "desktop",
                          label: "Desktop",
                          desc: "Browser notifications",
                        },
                        { key: "email", label: "Email", desc: "Email alerts" },
                        {
                          key: "push",
                          label: "Push",
                          desc: "Mobile notifications",
                        },
                        { key: "sound", label: "Sound", desc: "Audio alerts" },
                      ].map((setting) => (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">
                              {setting.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {setting.desc}
                            </div>
                          </div>
                          <Switch
                            checked={
                              notificationSettings[
                                setting.key as keyof typeof notificationSettings
                              ]
                            }
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                [setting.key]: checked,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-3 text-foreground">
                      Categories
                    </h4>
                    <div className="space-y-4">
                      {[
                        {
                          key: "patientAlerts",
                          label: "Patient Alerts",
                          desc: "Adverse events, safety",
                        },
                        {
                          key: "trialUpdates",
                          label: "Trial Updates",
                          desc: "Progress, milestones",
                        },
                        {
                          key: "teamInvites",
                          label: "Team Invites",
                          desc: "Collaboration requests",
                        },
                        {
                          key: "systemNotices",
                          label: "System",
                          desc: "Maintenance, updates",
                        },
                      ].map((setting) => (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium">
                              {setting.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {setting.desc}
                            </div>
                          </div>
                          <Switch
                            checked={
                              notificationSettings[
                                setting.key as keyof typeof notificationSettings
                              ]
                            }
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({
                                ...prev,
                                [setting.key]: checked,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications List */}
            <div className="lg:col-span-3">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger
                    value="all"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    All
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {notifications.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="default" className="ml-1 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="urgent"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    Urgent
                    {urgentCount > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs">
                        {urgentCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="patient_alert"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    Alerts
                  </TabsTrigger>
                  <TabsTrigger
                    value="team_invite"
                    className="flex items-center gap-2 data-[state=active]:bg-background"
                  >
                    Invites
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {filteredNotifications.length === 0 ? (
                    <Card className="shadow-sm">
                      <CardContent className="p-12 text-center">
                        <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                          <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">
                          No notifications
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          {activeTab === "all"
                            ? "You're all caught up! No notifications to show."
                            : `No ${activeTab.replace(
                                "_",
                                " "
                              )} notifications found.`}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotifications.map(renderNotificationItem)}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
