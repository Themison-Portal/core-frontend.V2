import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Puzzle, 
  Database, 
  Mail, 
  Calendar, 
  FileText, 
  BarChart3, 
  Shield, 
  Webhook,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Key,
  Zap,
  Users,
  Building,
  Cloud,
  MessageSquare,
  Folder,
  Video
} from "lucide-react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'communication' | 'analytics' | 'compliance' | 'productivity';
  icon: any;
  status: 'connected' | 'available' | 'coming_soon';
  connected: boolean;
  lastSync?: string;
  version?: string;
  config?: Record<string, any>;
  features: string[];
  pricing?: 'free' | 'paid' | 'contact';
}

const mockIntegrations: Integration[] = [
  {
    id: 'redcap',
    name: 'REDCap',
    description: 'Electronic Data Capture (EDC) platform for clinical research data collection.',
    category: 'data',
    icon: Database,
    status: 'connected',
    connected: true,
    lastSync: '2 hours ago',
    version: 'v12.5.2',
    features: ['Data capture', 'Form validation', 'Audit trails', 'Export capabilities'],
    pricing: 'free'
  },
  {
    id: 'salesforce',
    name: 'Salesforce Health Cloud',
    description: 'CRM platform designed for healthcare organizations and clinical trial management.',
    category: 'data',
    icon: Building,
    status: 'available',
    connected: false,
    features: ['Contact management', 'Patient tracking', 'Pipeline management', 'Custom workflows'],
    pricing: 'paid'
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Cloud storage and file sharing platform for secure document management.',
    category: 'productivity',
    icon: Cloud,
    status: 'connected',
    connected: true,
    lastSync: '5 minutes ago',
    features: ['File storage', 'Document sharing', 'Version control', 'Collaboration'],
    pricing: 'free'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration platform for real-time messaging.',
    category: 'communication',
    icon: MessageSquare,
    status: 'connected',
    connected: true,
    lastSync: '15 minutes ago',
    features: ['Team messaging', 'File sharing', 'Custom notifications', 'Workflow automation'],
    pricing: 'free'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Email and calendar integration for seamless communication.',
    category: 'communication',
    icon: Mail,
    status: 'available',
    connected: false,
    features: ['Email sync', 'Calendar integration', 'Meeting scheduling', 'Contact sync'],
    pricing: 'free'
  },
  {
    id: 'tableau',
    name: 'Tableau',
    description: 'Advanced data visualization and business intelligence platform.',
    category: 'analytics',
    icon: BarChart3,
    status: 'connected',
    connected: true,
    lastSync: '6 hours ago',
    features: ['Interactive dashboards', 'Advanced analytics', 'Custom reports', 'Data modeling'],
    pricing: 'paid'
  },
  {
    id: 'veeva',
    name: 'Veeva Vault',
    description: 'Cloud-based content management and collaboration for life sciences.',
    category: 'compliance',
    icon: Shield,
    status: 'available',
    connected: false,
    features: ['Document management', 'Regulatory compliance', 'Version control', 'Audit trails'],
    pricing: 'contact'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing platform for remote patient consultations and team meetings.',
    category: 'communication',
    icon: Video,
    status: 'available',
    connected: false,
    features: ['Video calls', 'Screen sharing', 'Recording', 'Virtual backgrounds'],
    pricing: 'free'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automation platform that connects your apps and automates workflows.',
    category: 'productivity',
    icon: Zap,
    status: 'available',
    connected: false,
    features: ['Workflow automation', '1000+ app connections', 'Custom triggers', 'Multi-step workflows'],
    pricing: 'free'
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Electronic signature platform for consent forms and regulatory documents.',
    category: 'compliance',
    icon: FileText,
    status: 'coming_soon',
    connected: false,
    features: ['E-signatures', 'Document workflows', 'Compliance tracking', 'Audit trails'],
    pricing: 'paid'
  }
];

const categories = [
  { id: 'all', name: 'All', icon: Puzzle },
  { id: 'data', name: 'Data & EDC', icon: Database },
  { id: 'communication', name: 'Communication', icon: Mail },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'compliance', name: 'Compliance', icon: Shield },
  { id: 'productivity', name: 'Productivity', icon: Zap }
];

const statusConfig = {
  connected: { 
    label: 'Connected', 
    variant: 'default' as const, 
    icon: CheckCircle, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  available: { 
    label: 'Available', 
    variant: 'secondary' as const, 
    icon: Clock, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  coming_soon: { 
    label: 'Coming Soon', 
    variant: 'outline' as const, 
    icon: AlertCircle, 
    color: 'text-gray-500',
    bgColor: 'bg-gray-50'
  }
};

export function ThirdPartyIntegrations() {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const filteredIntegrations = integrations.filter(integration => 
    activeCategory === 'all' || integration.category === activeCategory
  );

  const connectedCount = integrations.filter(i => i.connected).length;

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === id) {
        const newConnected = !integration.connected;
        toast.success(
          newConnected 
            ? `${integration.name} connected successfully` 
            : `${integration.name} disconnected`
        );
        return { 
          ...integration, 
          connected: newConnected,
          status: newConnected ? 'connected' : 'available',
          lastSync: newConnected ? 'Just now' : undefined
        };
      }
      return integration;
    }));
  };

  const openConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigDialogOpen(true);
  };

  const renderIntegrationCard = (integration: Integration) => {
    const statusInfo = statusConfig[integration.status];
    const Icon = integration.icon;
    const StatusIcon = statusInfo.icon;

    return (
      <Card key={integration.id} className="transition-all duration-200 hover:shadow-md hover:border-blue-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">{integration.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {integration.status === 'connected' && (
                    <Badge className="text-xs bg-gray-900 text-white">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  )}
                  {integration.status === 'available' && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  )}
                  {integration.pricing && (
                    <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                      {integration.pricing === 'free' ? 'Free' : 
                       integration.pricing === 'paid' ? 'Paid' : 'Contact Sales'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {integration.connected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openConfig(integration)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed text-gray-600">
            {integration.description}
          </CardDescription>

          {integration.connected && integration.lastSync && (
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Last sync: {integration.lastSync}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500">Features:</div>
            <div className="flex flex-wrap gap-1">
              {integration.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                  {feature}
                </Badge>
              ))}
              {integration.features.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                  +{integration.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {integration.status === 'connected' ? (
                <Switch
                  checked={integration.connected}
                  onCheckedChange={() => toggleIntegration(integration.id)}
                  className="data-[state=checked]:bg-blue-600"
                />
              ) : integration.status === 'available' ? (
                <Button 
                  size="sm" 
                  onClick={() => toggleIntegration(integration.id)}
                  className="bg-gray-900 hover:bg-gray-800 text-white h-8"
                  disabled={integration.status === 'coming_soon'}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Connect
                </Button>
              ) : (
                <Button size="sm" disabled className="h-8">
                  Coming Soon
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Puzzle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
            <p className="text-gray-600">
              Connect third-party services to enhance your clinical trial management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {connectedCount} of {integrations.length} connected
          </div>
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {categories.slice(1).map((category) => {
          const count = integrations.filter(i => i.category === category.id).length;
          const connectedInCategory = integrations.filter(i => i.category === category.id && i.connected).length;
          
          return (
            <Card key={category.id} className="transition-all hover:shadow-sm hover:border-blue-200 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <category.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{category.name}</div>
                    <div className="text-xs text-gray-500">
                      {connectedInCategory}/{count} connected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto bg-gray-100">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id} 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map(renderIntegrationCard)}
      </div>

      {filteredIntegrations.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-12 text-center">
            <Puzzle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No integrations found</h3>
            <p className="text-sm text-gray-600">
              No integrations available in this category.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration?.icon && (
                <selectedIntegration.icon className="h-5 w-5 text-blue-600" />
              )}
              {selectedIntegration?.name} Settings
            </DialogTitle>
            <DialogDescription>
              Configure your {selectedIntegration?.name} integration settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sync-frequency">Sync Frequency</Label>
              <Select defaultValue="hourly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input type="password" placeholder="Enter your API key" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setConfigDialogOpen(false);
                toast.success("Settings saved successfully");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}