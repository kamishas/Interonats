import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { 
  Check, 
  X, 
  Sparkles, 
  Users, 
  Building2, 
  Shield,
  Zap,
  Globe,
  BarChart3,
  FileCheck
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan, PlanConfig } from '../types/subscription';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';

interface SubscriptionPricingProps {
  onSelectPlan: (plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual') => void;
  selectedPlan?: SubscriptionPlan;
}

export function SubscriptionPricing({ onSelectPlan, selectedPlan }: SubscriptionPricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [planConfigs, setPlanConfigs] = useState<Record<SubscriptionPlan, PlanConfig>>(SUBSCRIPTION_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionConfig();
  }, []);

  const loadSubscriptionConfig = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SUBSCRIPTION}/config`,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Filter out disabled plans
          const enabledPlans = Object.entries(data.config).reduce((acc, [key, value]) => {
            const planValue = value as PlanConfig;
            if (planValue.enabled !== false) {
              acc[key as SubscriptionPlan] = planValue;
            }
            return acc;
          }, {} as Record<SubscriptionPlan, PlanConfig>);
          
          setPlanConfigs(enabledPlans);
        }
      }
    } catch (error) {
      console.error('Error loading subscription config:', error);
      // Fall back to default SUBSCRIPTION_PLANS
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' 
      ? planConfigs[plan].monthlyPrice 
      : planConfigs[plan].annualPrice;
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    return billingCycle === 'annual'
      ? (planConfigs[plan].annualPrice / 12).toFixed(0)
      : planConfigs[plan].monthlyPrice;
  };

  const getSavingsPercentage = () => {
    // Calculate average savings across all plans
    const plans = Object.keys(planConfigs) as SubscriptionPlan[];
    if (plans.length === 0) return 17;
    
    const totalSavings = plans.reduce((sum, planKey) => {
      const plan = planConfigs[planKey];
      const annualMonthly = plan.annualPrice / 12;
      const savings = ((1 - annualMonthly / plan.monthlyPrice) * 100);
      return sum + (isFinite(savings) ? savings : 0);
    }, 0);
    
    return Math.round(totalSavings / plans.length);
  };

  if (loading) {
    return (
      <div className="w-full space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Start with a 14-day free trial. No credit card required. Cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? '' : 'text-muted-foreground'}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === 'annual'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
          />
          <Label htmlFor="billing-toggle" className={billingCycle === 'annual' ? '' : 'text-muted-foreground'}>
            Annual
          </Label>
          {billingCycle === 'annual' && (
            <Badge className="bg-green-100 text-green-800">
              Save {getSavingsPercentage()}%
            </Badge>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {(Object.keys(planConfigs) as SubscriptionPlan[]).map((planKey) => {
          const plan = planConfigs[planKey];
          const isSelected = selectedPlan === planKey;
          const isPopular = plan.popular;

          return (
            <Card 
              key={planKey}
              className={`relative ${isPopular ? 'border-primary shadow-lg' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-6">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
                
                <div className="mt-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl">${getMonthlyEquivalent(planKey)}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed ${getPrice(planKey)} annually
                    </p>
                  )}
                </div>

                <Button 
                  onClick={() => onSelectPlan(planKey, billingCycle)}
                  className={`w-full mt-6 ${isPopular ? 'bg-primary' : ''}`}
                  variant={isPopular ? 'default' : 'outline'}
                >
                  {isSelected ? 'Selected' : plan.cta}
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <FeatureItem 
                    icon={<Users className="h-4 w-4" />}
                    text={`Up to ${plan.features.maxEmployees === 9999 ? 'Unlimited' : plan.features.maxEmployees} employees`}
                    included={true}
                  />
                  <FeatureItem 
                    icon={<Building2 className="h-4 w-4" />}
                    text={`Up to ${plan.features.maxClients === 9999 ? 'Unlimited' : plan.features.maxClients} clients`}
                    included={true}
                  />
                  <FeatureItem 
                    icon={<FileCheck className="h-4 w-4" />}
                    text={`${plan.features.documentStorage} storage`}
                    included={true}
                  />
                  <FeatureItem 
                    icon={<Globe className="h-4 w-4" />}
                    text="Immigration management"
                    included={plan.features.immigrationManagement}
                  />
                  <FeatureItem 
                    icon={<Shield className="h-4 w-4" />}
                    text="Licensing management"
                    included={plan.features.licensingManagement}
                  />
                  <FeatureItem 
                    icon={<Zap className="h-4 w-4" />}
                    text="Custom workflows"
                    included={plan.features.customWorkflows}
                  />
                  <FeatureItem 
                    icon={<BarChart3 className="h-4 w-4" />}
                    text="API access"
                    included={plan.features.apiAccess}
                  />
                  <FeatureItem 
                    icon={<Shield className="h-4 w-4" />}
                    text="SSO & SAML"
                    included={plan.features.ssoEnabled}
                  />
                  <FeatureItem 
                    icon={<BarChart3 className="h-4 w-4" />}
                    text="Custom reports"
                    included={plan.features.customReports}
                  />
                  <FeatureItem 
                    icon={<FileCheck className="h-4 w-4" />}
                    text="Audit logs"
                    included={plan.features.auditLogs}
                  />
                  {plan.features.advancedAnalytics && (
                    <FeatureItem 
                      icon={<BarChart3 className="h-4 w-4" />}
                      text="Advanced analytics"
                      included={true}
                    />
                  )}
                  {plan.features.multiCompany && (
                    <FeatureItem 
                      icon={<Building2 className="h-4 w-4" />}
                      text="Multi-company support"
                      included={true}
                    />
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm">
                    <span className="font-medium">Support:</span>{' '}
                    <span className="text-muted-foreground">{plan.features.sla}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust Indicators */}
      <div className="text-center space-y-2 pt-8">
        <p className="text-sm text-muted-foreground">
          ✓ 14-day free trial · No credit card required · Cancel anytime
        </p>
        <p className="text-sm text-muted-foreground">
          ✓ 99.9% uptime SLA · SOC 2 Type II compliant · GDPR & CCPA ready
        </p>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  text: string;
  included: boolean;
}

function FeatureItem({ icon, text, included }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-shrink-0 ${included ? 'text-green-600' : 'text-muted-foreground'}`}>
        {included ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-muted-foreground ${!included ? 'opacity-50' : ''}`}>
          {icon}
        </span>
        <span className={`text-sm ${!included ? 'text-muted-foreground line-through opacity-50' : ''}`}>
          {text}
        </span>
      </div>
    </div>
  );
}
