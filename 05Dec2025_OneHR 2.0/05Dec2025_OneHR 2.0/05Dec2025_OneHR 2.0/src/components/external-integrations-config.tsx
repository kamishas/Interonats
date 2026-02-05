import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  ExternalLink, Clock, DollarSign, Settings, AlertCircle, CheckCircle2, 
  Link2, Save, RotateCcw, FileText, Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';

const API_URL = API_ENDPOINTS.INTEGRATION;

interface ExternalIntegration {
  id: string;
  module: 'timesheets' | 'invoices' | 'expenses';
  enabled: boolean;
  provider: 'quickbooks' | 'adp' | 'paychex' | 'gusto' | 'bamboohr' | 'custom';
  customUrl?: string;
  openInNewTab: boolean;
  showWarning: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Popular integration providers
const PROVIDERS = {
  timesheets: [
    { value: 'quickbooks', label: 'QuickBooks Time', url: 'https://quickbooks.intuit.com/time-tracking/', icon: '💼' },
    { value: 'adp', label: 'ADP Workforce Now', url: 'https://workforcenow.adp.com/', icon: '🏢' },
    { value: 'paychex', label: 'Paychex Flex', url: 'https://www.paychex.com/', icon: '📊' },
    { value: 'gusto', label: 'Gusto', url: 'https://app.gusto.com/', icon: '✨' },
    { value: 'bamboohr', label: 'BambooHR', url: 'https://www.bamboohr.com/', icon: '🎋' },
    { value: 'custom', label: 'Custom URL', url: '', icon: '🔗' }
  ],
  invoices: [
    { value: 'quickbooks', label: 'QuickBooks Online', url: 'https://quickbooks.intuit.com/', icon: '💼' },
    { value: 'freshbooks', label: 'FreshBooks', url: 'https://www.freshbooks.com/', icon: '📚' },
    { value: 'zoho', label: 'Zoho Invoice', url: 'https://www.zoho.com/invoice/', icon: '🔷' },
    { value: 'wave', label: 'Wave Accounting', url: 'https://www.waveapps.com/', icon: '🌊' },
    { value: 'custom', label: 'Custom URL', url: '', icon: '🔗' }
  ]
};

export function ExternalIntegrationsConfig() {
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for timesheets
  const [timesheetEnabled, setTimesheetEnabled] = useState(false);
  const [timesheetProvider, setTimesheetProvider] = useState<string>('quickbooks');
  const [timesheetCustomUrl, setTimesheetCustomUrl] = useState('');
  const [timesheetNewTab, setTimesheetNewTab] = useState(true);
  const [timesheetWarning, setTimesheetWarning] = useState(true);

  // Form state for invoices
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [invoiceProvider, setInvoiceProvider] = useState<string>('quickbooks');
  const [invoiceCustomUrl, setInvoiceCustomUrl] = useState('');
  const [invoiceNewTab, setInvoiceNewTab] = useState(true);
  const [invoiceWarning, setInvoiceWarning] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`${API_URL}/external-integrations`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
        
        // Load timesheet integration
        const timesheetInt = data.integrations?.find((i: ExternalIntegration) => i.module === 'timesheets');
        if (timesheetInt) {
          setTimesheetEnabled(timesheetInt.enabled);
          setTimesheetProvider(timesheetInt.provider);
          setTimesheetCustomUrl(timesheetInt.customUrl || '');
          setTimesheetNewTab(timesheetInt.openInNewTab);
          setTimesheetWarning(timesheetInt.showWarning);
        }

        // Load invoice integration
        const invoiceInt = data.integrations?.find((i: ExternalIntegration) => i.module === 'invoices');
        if (invoiceInt) {
          setInvoiceEnabled(invoiceInt.enabled);
          setInvoiceProvider(invoiceInt.provider);
          setInvoiceCustomUrl(invoiceInt.customUrl || '');
          setInvoiceNewTab(invoiceInt.openInNewTab);
          setInvoiceWarning(invoiceInt.showWarning);
        }
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveIntegration = async (module: 'timesheets' | 'invoices') => {
    setSaving(true);
    try {
      const isTimesheet = module === 'timesheets';
      const enabled = isTimesheet ? timesheetEnabled : invoiceEnabled;
      const provider = isTimesheet ? timesheetProvider : invoiceProvider;
      const customUrl = isTimesheet ? timesheetCustomUrl : invoiceCustomUrl;
      const openInNewTab = isTimesheet ? timesheetNewTab : invoiceNewTab;
      const showWarning = isTimesheet ? timesheetWarning : invoiceWarning;

      // Validate custom URL if provider is 'custom'
      if (enabled && provider === 'custom' && !customUrl) {
        toast.error('Please enter a custom URL');
        setSaving(false);
        return;
      }

      const existingInt = integrations.find(i => i.module === module);
      const integrationData: Partial<ExternalIntegration> = {
        module,
        enabled,
        provider: provider as any,
        customUrl,
        openInNewTab,
        showWarning,
        updatedAt: new Date().toISOString()
      };

      if (existingInt) {
        // Update existing
        const response = await fetch(`${API_URL}/external-integrations/${existingInt.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken() ?? ''}`
          },
          body: JSON.stringify({ ...existingInt, ...integrationData })
        });

        if (!response.ok) throw new Error('Failed to update integration');
      } else {
        // Create new
        const response = await fetch(`${API_URL}/external-integrations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken() ?? ''}`
          },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            ...integrationData,
            createdAt: new Date().toISOString()
          })
        });

        if (!response.ok) throw new Error('Failed to create integration');
      }

      toast.success(`${module === 'timesheets' ? 'Timesheet' : 'Invoice'} integration saved successfully`);
      fetchIntegrations();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast.error('Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const getProviderUrl = (provider: string, module: 'timesheets' | 'invoices') => {
    const providers = module === 'timesheets' ? PROVIDERS.timesheets : PROVIDERS.invoices;
    return providers.find(p => p.value === provider)?.url || '';
  };

  const testRedirect = (module: 'timesheets' | 'invoices') => {
    const isTimesheet = module === 'timesheets';
    const provider = isTimesheet ? timesheetProvider : invoiceProvider;
    const customUrl = isTimesheet ? timesheetCustomUrl : invoiceCustomUrl;
    const openInNewTab = isTimesheet ? timesheetNewTab : invoiceNewTab;

    const url = provider === 'custom' ? customUrl : getProviderUrl(provider, module);
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    if (openInNewTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
    
    toast.success('Redirecting to external tool...');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1>External Integrations</h1>
        <p className="text-gray-500">
          Configure redirects to external timesheet and invoicing software
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Link2 className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Integration Setup</AlertTitle>
        <AlertDescription className="text-blue-700">
          Enable external integrations to redirect users to your existing timesheet or invoicing software instead of using the built-in modules.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="timesheets">
        <TabsList>
          <TabsTrigger value="timesheets">
            <Clock className="h-4 w-4 mr-2" />
            Timesheets
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* Timesheets Configuration */}
        <TabsContent value="timesheets" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Timesheet Integration</CardTitle>
                  <CardDescription>Redirect to external timesheet management software</CardDescription>
                </div>
                {timesheetEnabled && (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base">Enable External Redirect</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, clicking Timesheets will redirect to your external tool
                  </p>
                </div>
                <Switch
                  checked={timesheetEnabled}
                  onCheckedChange={setTimesheetEnabled}
                />
              </div>

              {timesheetEnabled && (
                <>
                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <Label>Select Timesheet Provider</Label>
                    <Select value={timesheetProvider} onValueChange={setTimesheetProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.timesheets.map(provider => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <span className="flex items-center gap-2">
                              <span>{provider.icon}</span>
                              {provider.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom URL */}
                  {timesheetProvider === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom URL *</Label>
                      <Input
                        type="url"
                        placeholder="https://your-timesheet-tool.com"
                        value={timesheetCustomUrl}
                        onChange={(e) => setTimesheetCustomUrl(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Enter the full URL including https://</p>
                    </div>
                  )}

                  {/* Display default URL for selected provider */}
                  {timesheetProvider !== 'custom' && (
                    <Alert>
                      <ExternalLink className="h-4 w-4" />
                      <AlertTitle>Default URL</AlertTitle>
                      <AlertDescription className="break-all">
                        {getProviderUrl(timesheetProvider, 'timesheets')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Options */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Open in New Tab</Label>
                        <p className="text-sm text-gray-500">Opens the external tool in a new browser tab</p>
                      </div>
                      <Switch
                        checked={timesheetNewTab}
                        onCheckedChange={setTimesheetNewTab}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Warning Message</Label>
                        <p className="text-sm text-gray-500">Display a confirmation before redirecting</p>
                      </div>
                      <Switch
                        checked={timesheetWarning}
                        onCheckedChange={setTimesheetWarning}
                      />
                    </div>
                  </div>

                  {/* Test Button */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Test Redirect</p>
                      <p className="text-xs text-blue-700">Verify the redirect works correctly</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => testRedirect('timesheets')}
                      className="bg-white"
                    >
                      Test Now
                    </Button>
                  </div>
                </>
              )}

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  onClick={() => saveIntegration('timesheets')}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Timesheet Integration'}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchIntegrations}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Configuration */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice Integration</CardTitle>
                  <CardDescription>Redirect to external invoicing software</CardDescription>
                </div>
                {invoiceEnabled && (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base">Enable External Redirect</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, clicking Invoices will redirect to your external tool
                  </p>
                </div>
                <Switch
                  checked={invoiceEnabled}
                  onCheckedChange={setInvoiceEnabled}
                />
              </div>

              {invoiceEnabled && (
                <>
                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <Label>Select Invoice Provider</Label>
                    <Select value={invoiceProvider} onValueChange={setInvoiceProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.invoices.map(provider => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <span className="flex items-center gap-2">
                              <span>{provider.icon}</span>
                              {provider.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom URL */}
                  {invoiceProvider === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom URL *</Label>
                      <Input
                        type="url"
                        placeholder="https://your-invoice-tool.com"
                        value={invoiceCustomUrl}
                        onChange={(e) => setInvoiceCustomUrl(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Enter the full URL including https://</p>
                    </div>
                  )}

                  {/* Display default URL for selected provider */}
                  {invoiceProvider !== 'custom' && (
                    <Alert>
                      <ExternalLink className="h-4 w-4" />
                      <AlertTitle>Default URL</AlertTitle>
                      <AlertDescription className="break-all">
                        {getProviderUrl(invoiceProvider, 'invoices')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Options */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Open in New Tab</Label>
                        <p className="text-sm text-gray-500">Opens the external tool in a new browser tab</p>
                      </div>
                      <Switch
                        checked={invoiceNewTab}
                        onCheckedChange={setInvoiceNewTab}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Warning Message</Label>
                        <p className="text-sm text-gray-500">Display a confirmation before redirecting</p>
                      </div>
                      <Switch
                        checked={invoiceWarning}
                        onCheckedChange={setInvoiceWarning}
                      />
                    </div>
                  </div>

                  {/* Test Button */}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Test Redirect</p>
                      <p className="text-xs text-blue-700">Verify the redirect works correctly</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => testRedirect('invoices')}
                      className="bg-white"
                    >
                      Test Now
                    </Button>
                  </div>
                </>
              )}

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  onClick={() => saveIntegration('invoices')}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Invoice Integration'}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchIntegrations}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          Once enabled, users will be redirected to the external tool when accessing timesheets or invoices from the navigation menu. 
          The built-in modules will remain accessible through direct links if needed.
        </AlertDescription>
      </Alert>
    </div>
  );
}
