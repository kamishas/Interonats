import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CreditCard, 
  CheckCircle2, 
  Star, 
  Building2, 
  Users, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';

interface OrganizationSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'suspended';
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  amount: number;
}

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanDetails {
  name: string;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
}

const PLAN_DETAILS: Record<string, PlanDetails> = {
  free: {
    name: 'free',
    displayName: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for getting started',
    features: [
      { name: 'Up to 10 employees', included: true },
      { name: 'Basic employee management', included: true },
      { name: 'Basic reporting', included: true },
      { name: 'Email support', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false },
      { name: 'Custom integrations', included: false },
    ],
  },
  starter: {
    name: 'starter',
    displayName: 'Starter',
    monthlyPrice: 99,
    annualPrice: 990,
    description: 'For growing teams',
    features: [
      { name: 'Up to 50 employees', included: true },
      { name: 'Full employee management', included: true },
      { name: 'Advanced reporting', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Immigration tracking', included: true },
      { name: 'License management', included: true },
      { name: 'Custom integrations', included: false },
    ],
  },
  professional: {
    name: 'professional',
    displayName: 'Professional',
    monthlyPrice: 249,
    annualPrice: 2490,
    description: 'For established businesses',
    popular: true,
    features: [
      { name: 'Up to 200 employees', included: true },
      { name: 'Full employee management', included: true },
      { name: 'Advanced analytics & reporting', included: true },
      { name: 'Priority support (24/7)', included: true },
      { name: 'Immigration tracking', included: true },
      { name: 'License management', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'API access', included: true },
    ],
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    monthlyPrice: 499,
    annualPrice: 4990,
    description: 'For large organizations',
    features: [
      { name: 'Unlimited employees', included: true },
      { name: 'Full employee management', included: true },
      { name: 'Advanced analytics & reporting', included: true },
      { name: 'Dedicated support manager', included: true },
      { name: 'Immigration tracking', included: true },
      { name: 'License management', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'API access', included: true },
      { name: 'White-label options', included: true },
      { name: 'SLA guarantees', included: true },
    ],
  },
};

export function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SUBSCRIPTION}/current`,
        {
          headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePlan = async (newPlan: string, billingCycle: 'monthly' | 'annual') => {
    setIsChangingPlan(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SUBSCRIPTION}/change`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: newPlan, billingCycle }),
        }
      );

      if (response.ok) {
        toast.success(`Successfully upgraded to ${newPlan.toUpperCase()} plan`);
        fetchSubscription();
      } else {
        // Try to parse error response, handle empty or non-JSON responses
        let errorMessage = 'Failed to change plan';
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || `Server error: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentPlanDetails = subscription ? PLAN_DETAILS[subscription.plan] : null;

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {subscription && currentPlanDetails && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your organization's subscription plan</CardDescription>
              </div>
              <Badge 
                variant={subscription.status === 'active' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {subscription.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-semibold">{currentPlanDetails.displayName}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Billing Cycle</p>
                <p className="text-xl font-medium capitalize">{subscription.billingCycle}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Cost
                </p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(subscription.amount)}
                  {subscription.billingCycle === 'monthly' && <span className="text-sm font-normal">/month</span>}
                  {subscription.billingCycle === 'annual' && <span className="text-sm font-normal">/year</span>}
                </p>
              </div>
            </div>

            {subscription.plan !== 'free' && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm">
                    Current period: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Next billing date: {formatDate(subscription.nextBillingDate)}
                  </p>
                </div>
              </div>
            )}

            {subscription.status === 'trial' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You are currently on a trial period. Your trial ends on {formatDate(subscription.currentPeriodEnd)}.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PLAN_DETAILS).map(([planKey, plan]) => {
            const isCurrentPlan = subscription?.plan === planKey;
            const isUpgrade = subscription && 
              ['free', 'starter', 'professional', 'enterprise'].indexOf(subscription.plan) <
              ['free', 'starter', 'professional', 'enterprise'].indexOf(planKey);

            return (
              <Card 
                key={planKey}
                className={`relative ${isCurrentPlan ? 'border-primary shadow-lg' : ''} ${plan.popular ? 'border-purple-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-500">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-semibold">
                      {formatCurrency(plan.monthlyPrice)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      per month
                    </p>
                    {plan.annualPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        or {formatCurrency(plan.annualPrice)}/year (save 17%)
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted mt-0.5 shrink-0" />
                        )}
                        <span className={`text-sm ${!feature.included ? 'text-muted-foreground' : ''}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {!isCurrentPlan && (
                    <div className="space-y-2 pt-4">
                      <Button
                        className="w-full"
                        variant={isUpgrade ? 'default' : 'outline'}
                        onClick={() => handleChangePlan(planKey, 'monthly')}
                        disabled={isChangingPlan}
                      >
                        {isUpgrade ? (
                          <>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade to Monthly
                          </>
                        ) : (
                          <>Switch to Monthly</>
                        )}
                      </Button>
                      {plan.annualPrice > 0 && (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleChangePlan(planKey, 'annual')}
                          disabled={isChangingPlan}
                        >
                          {isUpgrade ? 'Upgrade to Annual' : 'Switch to Annual'}
                        </Button>
                      )}
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="pt-4">
                      <Button className="w-full" variant="outline" disabled>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Current Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Need Help Choosing?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Contact our sales team for a personalized demo and to discuss which plan is right for your organization.
          </p>
          <div className="flex gap-4">
            <Button variant="outline">
              Contact Sales
            </Button>
            <Button variant="outline">
              Schedule Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
