import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Save, 
  RefreshCw, 
  Settings, 
  DollarSign,
  Shield,
  Users,
  Building2,
  FileCheck,
  Globe,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { SubscriptionPlan, SubscriptionFeatures, PlanConfig } from '../types/subscription';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';

type PlanConfigs = Record<SubscriptionPlan, PlanConfig>;

export function SubscriptionConfig() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activePlan, setActivePlan] = useState<SubscriptionPlan>('starter');
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  
  const [planConfigs, setPlanConfigs] = useState<PlanConfigs>({
    starter: {
      name: 'Starter',
      description: 'Perfect for small businesses getting started',
      monthlyPrice: 99,
      annualPrice: 990,
      features: {
        maxEmployees: 25,
        maxClients: 10,
        immigrationManagement: false,
        licensingManagement: false,
        documentStorage: '10GB',
        customWorkflows: false,
        apiAccess: false,
        dedicatedSupport: false,
        sla: 'Standard (Business Hours)',
        ssoEnabled: false,
        customReports: false,
        auditLogs: false,
        advancedAnalytics: false,
        multiCompany: false,
      },
      cta: 'Start Free Trial',
      enabled: true,
    },
    professional: {
      name: 'Professional',
      description: 'Ideal for growing companies with advanced needs',
      monthlyPrice: 299,
      annualPrice: 2990,
      popular: true,
      features: {
        maxEmployees: 100,
        maxClients: 50,
        immigrationManagement: true,
        licensingManagement: true,
        documentStorage: '100GB',
        customWorkflows: true,
        apiAccess: true,
        dedicatedSupport: true,
        sla: 'Priority (24/5)',
        ssoEnabled: true,
        customReports: true,
        auditLogs: true,
        advancedAnalytics: false,
        multiCompany: false,
      },
      cta: 'Start Free Trial',
      enabled: true,
    },
    enterprise: {
      name: 'Enterprise',
      description: 'For large organizations with complex requirements',
      monthlyPrice: 999,
      annualPrice: 9990,
      features: {
        maxEmployees: 9999,
        maxClients: 9999,
        immigrationManagement: true,
        licensingManagement: true,
        documentStorage: 'Unlimited',
        customWorkflows: true,
        apiAccess: true,
        dedicatedSupport: true,
        sla: '24/7 with dedicated account manager',
        ssoEnabled: true,
        customReports: true,
        auditLogs: true,
        advancedAnalytics: true,
        multiCompany: true,
      },
      cta: 'Contact Sales',
      enabled: true,
    },
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SUBSCRIPTION}/subscription-config`,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setPlanConfigs(data.config);
        }
      }
    } catch (error) {
      console.error('Error loading subscription config:', error);
      toast.error('Failed to load subscription configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SUBSCRIPTION}/subscription-config`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ config: planConfigs }),
        }
      );

      if (response.ok) {
        toast.success('Subscription configuration saved successfully');
        setHasChanges(false);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving subscription config:', error);
      toast.error('Failed to save subscription configuration');
    } finally {
      setSaving(false);
    }
  };

  const updatePlanConfig = (plan: SubscriptionPlan, updates: Partial<PlanConfig>) => {
    setPlanConfigs(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  const updateFeature = (plan: SubscriptionPlan, feature: keyof SubscriptionFeatures, value: any) => {
    setPlanConfigs(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        features: {
          ...prev[plan].features,
          [feature]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all plans to default settings? This cannot be undone.')) {
      loadConfiguration();
      setHasChanges(false);
      toast.info('Configuration reset to defaults');
    }
  };

  const createCustomPlan = () => {
    if (!newPlanId || !newPlanName) {
      toast.error('Plan ID and name are required');
      return;
    }

    // Validate plan ID (lowercase, no spaces, alphanumeric with hyphens)
    const planIdRegex = /^[a-z0-9-]+$/;
    if (!planIdRegex.test(newPlanId)) {
      toast.error('Plan ID must be lowercase alphanumeric with hyphens only');
      return;
    }

    // Check if plan already exists
    if (planConfigs[newPlanId]) {
      toast.error('A plan with this ID already exists');
      return;
    }

    // Create new plan based on starter template
    const newPlan: PlanConfig = {
      name: newPlanName,
      description: 'Custom subscription plan',
      monthlyPrice: 0,
      annualPrice: 0,
      features: {
        maxEmployees: 10,
        maxClients: 5,
        immigrationManagement: false,
        licensingManagement: false,
        documentStorage: '5GB',
        customWorkflows: false,
        apiAccess: false,
        dedicatedSupport: false,
        sla: 'Standard',
        ssoEnabled: false,
        customReports: false,
        auditLogs: false,
        advancedAnalytics: false,
        multiCompany: false,
      },
      cta: 'Get Started',
      enabled: true,
    };

    setPlanConfigs(prev => ({
      ...prev,
      [newPlanId]: newPlan,
    }));

    setActivePlan(newPlanId);
    setShowCreatePlanDialog(false);
    setNewPlanId('');
    setNewPlanName('');
    setHasChanges(true);
    toast.success(`Custom plan "${newPlanName}" created successfully`);
  };

  const duplicatePlan = (sourcePlan: string) => {
    const planId = prompt('Enter a unique ID for the duplicated plan (lowercase, alphanumeric with hyphens):');
    if (!planId) return;

    // Validate plan ID
    const planIdRegex = /^[a-z0-9-]+$/;
    if (!planIdRegex.test(planId)) {
      toast.error('Plan ID must be lowercase alphanumeric with hyphens only');
      return;
    }

    if (planConfigs[planId]) {
      toast.error('A plan with this ID already exists');
      return;
    }

    const sourcePlanConfig = planConfigs[sourcePlan];
    const newPlan: PlanConfig = {
      ...sourcePlanConfig,
      name: `${sourcePlanConfig.name} (Copy)`,
    };

    setPlanConfigs(prev => ({
      ...prev,
      [planId]: newPlan,
    }));

    setActivePlan(planId);
    setHasChanges(true);
    toast.success(`Plan duplicated as "${planId}"`);
  };

  const deletePlan = (planId: string) => {
    // Prevent deleting base plans
    if (['starter', 'professional', 'enterprise'].includes(planId)) {
      toast.error('Cannot delete default plans');
      return;
    }

    if (!confirm(`Are you sure you want to delete the "${planConfigs[planId].name}" plan? This cannot be undone.`)) {
      return;
    }

    const newConfigs = { ...planConfigs };
    delete newConfigs[planId];
    setPlanConfigs(newConfigs);
    
    // Switch to a different plan
    setActivePlan('starter');
    setHasChanges(true);
    toast.success('Plan deleted successfully');
  };

  const currentPlan = planConfigs[activePlan];

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-400/20">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">Subscription Configuration</h1>
              <p className="text-muted-foreground">
                Manage subscription tiers, pricing, and feature access
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => setShowCreatePlanDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Plan
          </Button>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={saveConfiguration}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Plan Tabs */}
      <Tabs value={activePlan} onValueChange={(v) => setActivePlan(v as SubscriptionPlan)}>
        <div className="flex items-center gap-2 mb-4">
          <TabsList className="flex-1 overflow-x-auto">
            {Object.keys(planConfigs).map((planId) => {
              const plan = planConfigs[planId];
              const isBasePlan = ['starter', 'professional', 'enterprise'].includes(planId);
              
              return (
                <TabsTrigger key={planId} value={planId} className="gap-2">
                  {planId === 'starter' && <Shield className="h-4 w-4" />}
                  {planId === 'professional' && <Sparkles className="h-4 w-4" />}
                  {planId === 'enterprise' && <Building2 className="h-4 w-4" />}
                  {!isBasePlan && <Zap className="h-4 w-4" />}
                  {plan.name}
                  {plan.popular && (
                    <Badge variant="secondary" className="ml-1 text-xs">Popular</Badge>
                  )}
                  {!isBasePlan && (
                    <Badge variant="outline" className="ml-1 text-xs">Custom</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {Object.keys(planConfigs).map((plan) => {
          const isBasePlan = ['starter', 'professional', 'enterprise'].includes(plan);
          
          return (
          <TabsContent key={plan} value={plan} className="space-y-6">
            {/* Plan Actions */}
            {!isBasePlan && (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicatePlan(plan)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deletePlan(plan)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Plan
                </Button>
              </div>
            )}
            {isBasePlan && (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicatePlan(plan)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate as Custom Plan
                </Button>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Configure plan name, description, and availability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Plan Name</Label>
                    <Input
                      value={planConfigs[plan].name}
                      onChange={(e) => updatePlanConfig(plan, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={planConfigs[plan].description}
                      onChange={(e) => updatePlanConfig(plan, { description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Call to Action Button</Label>
                    <Input
                      value={planConfigs[plan].cta}
                      onChange={(e) => updatePlanConfig(plan, { cta: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mark as Popular</Label>
                      <p className="text-xs text-muted-foreground">
                        Highlight this plan with a badge
                      </p>
                    </div>
                    <Switch
                      checked={planConfigs[plan].popular || false}
                      onCheckedChange={(checked) => updatePlanConfig(plan, { popular: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Plan Enabled</Label>
                      <p className="text-xs text-muted-foreground">
                        Show this plan to customers
                      </p>
                    </div>
                    <Switch
                      checked={planConfigs[plan].enabled}
                      onCheckedChange={(checked) => updatePlanConfig(plan, { enabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                  <CardDescription>
                    Set monthly and annual pricing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monthly Price ($)</Label>
                    <Input
                      type="number"
                      value={planConfigs[plan].monthlyPrice}
                      onChange={(e) => updatePlanConfig(plan, { monthlyPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Price ($)</Label>
                    <Input
                      type="number"
                      value={planConfigs[plan].annualPrice}
                      onChange={(e) => updatePlanConfig(plan, { annualPrice: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Monthly equivalent: ${(planConfigs[plan].annualPrice / 12).toFixed(2)}
                      {planConfigs[plan].monthlyPrice > 0 && (
                        <span className="ml-2 text-green-600">
                          ({((1 - planConfigs[plan].annualPrice / 12 / planConfigs[plan].monthlyPrice) * 100).toFixed(0)}% savings)
                        </span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usage Limits
                  </CardTitle>
                  <CardDescription>
                    Configure resource limits for this plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Maximum Employees</Label>
                    <Input
                      type="number"
                      value={planConfigs[plan].features.maxEmployees}
                      onChange={(e) => updateFeature(plan, 'maxEmployees', Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use 9999 for unlimited
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Clients</Label>
                    <Input
                      type="number"
                      value={planConfigs[plan].features.maxClients}
                      onChange={(e) => updateFeature(plan, 'maxClients', Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use 9999 for unlimited
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Storage</Label>
                    <Input
                      value={planConfigs[plan].features.documentStorage}
                      onChange={(e) => updateFeature(plan, 'documentStorage', e.target.value)}
                      placeholder="e.g., 10GB, 100GB, Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Support SLA</Label>
                    <Input
                      value={planConfigs[plan].features.sla}
                      onChange={(e) => updateFeature(plan, 'sla', e.target.value)}
                      placeholder="e.g., Standard, Priority, 24/7"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Features & Capabilities
                  </CardTitle>
                  <CardDescription>
                    Enable or disable features for this plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FeatureToggle
                    icon={<Globe className="h-4 w-4" />}
                    label="Immigration Management"
                    description="Access to immigration tracking and compliance"
                    checked={planConfigs[plan].features.immigrationManagement}
                    onCheckedChange={(checked) => updateFeature(plan, 'immigrationManagement', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<Shield className="h-4 w-4" />}
                    label="Licensing Management"
                    description="Business license tracking and renewals"
                    checked={planConfigs[plan].features.licensingManagement}
                    onCheckedChange={(checked) => updateFeature(plan, 'licensingManagement', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<Zap className="h-4 w-4" />}
                    label="Custom Workflows"
                    description="Create and customize approval workflows"
                    checked={planConfigs[plan].features.customWorkflows}
                    onCheckedChange={(checked) => updateFeature(plan, 'customWorkflows', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="API Access"
                    description="Programmatic access to platform data"
                    checked={planConfigs[plan].features.apiAccess}
                    onCheckedChange={(checked) => updateFeature(plan, 'apiAccess', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<Shield className="h-4 w-4" />}
                    label="SSO & SAML"
                    description="Single sign-on integration"
                    checked={planConfigs[plan].features.ssoEnabled}
                    onCheckedChange={(checked) => updateFeature(plan, 'ssoEnabled', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<FileCheck className="h-4 w-4" />}
                    label="Custom Reports"
                    description="Build custom reports and analytics"
                    checked={planConfigs[plan].features.customReports}
                    onCheckedChange={(checked) => updateFeature(plan, 'customReports', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<FileCheck className="h-4 w-4" />}
                    label="Audit Logs"
                    description="Detailed activity and compliance logs"
                    checked={planConfigs[plan].features.auditLogs}
                    onCheckedChange={(checked) => updateFeature(plan, 'auditLogs', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Advanced Analytics"
                    description="In-depth analytics and insights"
                    checked={planConfigs[plan].features.advancedAnalytics}
                    onCheckedChange={(checked) => updateFeature(plan, 'advancedAnalytics', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<Building2 className="h-4 w-4" />}
                    label="Multi-Company Support"
                    description="Manage multiple organizations"
                    checked={planConfigs[plan].features.multiCompany}
                    onCheckedChange={(checked) => updateFeature(plan, 'multiCompany', checked)}
                  />
                  <Separator />
                  <FeatureToggle
                    icon={<Users className="h-4 w-4" />}
                    label="Dedicated Support"
                    description="Priority customer support"
                    checked={planConfigs[plan].features.dedicatedSupport}
                    onCheckedChange={(checked) => updateFeature(plan, 'dedicatedSupport', checked)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Preview Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Preview
                </CardTitle>
                <CardDescription>
                  This is how the plan will appear to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="text-center">
                    {planConfigs[plan].popular && (
                      <Badge className="mb-2">Most Popular</Badge>
                    )}
                    <h3 className="text-2xl mb-2">{planConfigs[plan].name}</h3>
                    <p className="text-muted-foreground">{planConfigs[plan].description}</p>
                    <div className="mt-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl">${planConfigs[plan].monthlyPrice}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4">{planConfigs[plan].cta}</Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm">
                      <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                      Up to {planConfigs[plan].features.maxEmployees === 9999 ? 'Unlimited' : planConfigs[plan].features.maxEmployees} employees
                    </p>
                    <p className="text-sm">
                      <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                      Up to {planConfigs[plan].features.maxClients === 9999 ? 'Unlimited' : planConfigs[plan].features.maxClients} clients
                    </p>
                    <p className="text-sm">
                      <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                      {planConfigs[plan].features.documentStorage} storage
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          );
        })}
      </Tabs>

      {/* Create Custom Plan Dialog */}
      <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Subscription Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan with custom pricing and features
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planId">Plan ID *</Label>
              <Input
                id="planId"
                value={newPlanId}
                onChange={(e) => setNewPlanId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="e.g., premium-plus, startup-tier"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, alphanumeric with hyphens). Cannot be changed later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name *</Label>
              <Input
                id="planName"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="e.g., Premium Plus, Startup Tier"
              />
              <p className="text-xs text-muted-foreground">
                Display name shown to customers
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 space-y-2">
              <p className="text-sm">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>A new plan will be created with default settings</li>
                <li>You can customize pricing, features, and limits</li>
                <li>The plan will be available for organizations to select</li>
                <li>You can duplicate existing plans as a starting point</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePlanDialog(false);
                setNewPlanId('');
                setNewPlanName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createCustomPlan}
              disabled={!newPlanId || !newPlanName}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FeatureToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function FeatureToggle({ icon, label, description, checked, onCheckedChange }: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5 text-muted-foreground">
          {icon}
        </div>
        <div className="space-y-0.5">
          <Label className="cursor-pointer">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
