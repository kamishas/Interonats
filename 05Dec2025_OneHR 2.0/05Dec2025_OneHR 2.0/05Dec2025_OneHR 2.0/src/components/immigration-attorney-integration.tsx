import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Plus, 
  Building2, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Link, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import type { Attorney } from "../types";

interface AttorneyIntegrationSettings {
  enabled: boolean;
  syncMethod: 'api' | 'email' | 'manual';
  apiEndpoint?: string;
  apiKey?: string;
  emailAddress?: string;
  syncFrequency?: 'real-time' | 'daily' | 'weekly';
  lastSyncDate?: string;
}

export function ImmigrationAttorneyIntegration() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedAttorney, setSelectedAttorney] = useState<Attorney | null>(null);
  
  const [integrationSettings, setIntegrationSettings] = useState<AttorneyIntegrationSettings>({
    enabled: false,
    syncMethod: 'manual',
    syncFrequency: 'daily'
  });

  const [formData, setFormData] = useState({
    name: "",
    lawFirm: "",
    email: "",
    phone: "",
    address: "",
    specialization: ""
  });

  const handleAddAttorney = () => {
    if (!formData.name || !formData.lawFirm || !formData.email) {
      toast.error("Please fill in required fields");
      return;
    }

    const newAttorney: Attorney = {
      id: Date.now().toString(),
      name: formData.name,
      lawFirm: formData.lawFirm,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      specialization: formData.specialization
    };

    setAttorneys([...attorneys, newAttorney]);
    setShowAddDialog(false);
    setFormData({
      name: "",
      lawFirm: "",
      email: "",
      phone: "",
      address: "",
      specialization: ""
    });
    toast.success("Attorney added successfully");
  };

  const handleDeleteAttorney = (id: string) => {
    setAttorneys(attorneys.filter(a => a.id !== id));
    toast.success("Attorney removed");
  };

  const handleTestConnection = async () => {
    toast.info("Testing connection to external law firm system...");
    
    // Simulate API call
    setTimeout(() => {
      if (integrationSettings.apiEndpoint && integrationSettings.apiKey) {
        toast.success("Connection successful! Integration is working.");
      } else {
        toast.error("Connection failed. Please check your settings.");
      }
    }, 2000);
  };

  const handleSync = () => {
    toast.info("Syncing with law firm system...");
    
    setTimeout(() => {
      setIntegrationSettings({
        ...integrationSettings,
        lastSyncDate: new Date().toISOString()
      });
      toast.success("Sync completed successfully");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Attorney & Law Firm Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage immigration attorneys and configure external integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Integration Settings
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Attorney
          </Button>
        </div>
      </div>

      {/* Integration Status */}
      {integrationSettings.enabled ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Integration Active</AlertTitle>
          <AlertDescription className="text-green-700">
            <div className="flex items-center justify-between">
              <div>
                Connected via {integrationSettings.syncMethod.toUpperCase()} • 
                {integrationSettings.lastSyncDate && (
                  <span> Last sync: {new Date(integrationSettings.lastSyncDate).toLocaleString()}</span>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={handleSync} className="border-green-600 text-green-700">
                <RefreshCw className="h-3 w-3 mr-2" />
                Sync Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Manual Mode</AlertTitle>
          <AlertDescription>
            External integration is disabled. All attorney communications are managed manually. 
            Configure integration settings to enable automatic syncing with law firm systems.
          </AlertDescription>
        </Alert>
      )}

      {/* Attorneys List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Attorneys</CardTitle>
          <CardDescription>
            Immigration attorneys and law firms for case assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attorneys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No attorneys registered yet. Click "Add Attorney" to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Law Firm</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attorneys.map((attorney) => (
                  <TableRow key={attorney.id}>
                    <TableCell>{attorney.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {attorney.lawFirm}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {attorney.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {attorney.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {attorney.phone}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {attorney.specialization ? (
                        <Badge variant="outline">{attorney.specialization}</Badge>
                      ) : (
                        "General"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteAttorney(attorney.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Attorney Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Attorney</DialogTitle>
            <DialogDescription id="add-attorney-description">
              Register a new immigration attorney or law firm
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Attorney Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="lawFirm">Law Firm *</Label>
              <Input
                id="lawFirm"
                value={formData.lawFirm}
                onChange={(e) => setFormData({ ...formData, lawFirm: e.target.value })}
                placeholder="Smith & Associates Immigration Law"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@lawfirm.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., H-1B, Green Card, PERM"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, Suite 100, City, State ZIP"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAttorney}>Add Attorney</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>External Integration Settings</DialogTitle>
            <DialogDescription id="integration-settings-description">
              Configure integration with external law firm systems for automatic case updates
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="api">API Integration</TabsTrigger>
              <TabsTrigger value="email">Email Sync</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  API integration allows real-time synchronization with your law firm's case management system.
                  Contact your law firm for API credentials.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="apiEndpoint">API Endpoint URL</Label>
                <Input
                  id="apiEndpoint"
                  value={integrationSettings.apiEndpoint || ""}
                  onChange={(e) => setIntegrationSettings({ 
                    ...integrationSettings, 
                    apiEndpoint: e.target.value,
                    syncMethod: 'api'
                  })}
                  placeholder="https://api.lawfirm.com/v1/cases"
                />
              </div>

              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={integrationSettings.apiKey || ""}
                  onChange={(e) => setIntegrationSettings({ 
                    ...integrationSettings, 
                    apiKey: e.target.value 
                  })}
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <Label>Sync Frequency</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={integrationSettings.syncFrequency}
                  onChange={(e) => setIntegrationSettings({ 
                    ...integrationSettings, 
                    syncFrequency: e.target.value as any 
                  })}
                >
                  <option value="real-time">Real-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <Button onClick={handleTestConnection} className="w-full">
                <Link className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Email sync automatically imports case updates from designated email addresses.
                  Updates are parsed and added to case timelines.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="emailAddress">Law Firm Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={integrationSettings.emailAddress || ""}
                  onChange={(e) => setIntegrationSettings({ 
                    ...integrationSettings, 
                    emailAddress: e.target.value,
                    syncMethod: 'email'
                  })}
                  placeholder="updates@lawfirm.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Emails from this address will be automatically processed
                </p>
              </div>

              <Button className="w-full" onClick={() => toast.success("Email sync configured")}>
                Save Email Settings
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Manual mode requires you to manually enter all case updates and attorney communications.
                  No automatic synchronization will occur.
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  setIntegrationSettings({ 
                    ...integrationSettings, 
                    enabled: false,
                    syncMethod: 'manual'
                  });
                  toast.success("Switched to manual mode");
                }}
              >
                Use Manual Mode
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIntegrationSettings({ ...integrationSettings, enabled: true });
              setShowSettingsDialog(false);
              toast.success("Integration settings saved");
            }}>
              Enable Integration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
