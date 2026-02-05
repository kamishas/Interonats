export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise' | string;

export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'expired' | 'past_due';

export interface SubscriptionFeatures {
  maxEmployees: number;
  maxClients: number;
  immigrationManagement: boolean;
  licensingManagement: boolean;
  documentStorage: string; // e.g., "10GB", "100GB", "Unlimited"
  customWorkflows: boolean;
  apiAccess: boolean;
  dedicatedSupport: boolean;
  sla: string; // e.g., "Standard", "Priority", "24/7"
  ssoEnabled: boolean;
  customReports: boolean;
  auditLogs: boolean;
  advancedAnalytics: boolean;
  multiCompany: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  features: SubscriptionFeatures;
  billingCycle: 'monthly' | 'annual';
  price: number;
  currency: string;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  autoRenew: boolean;
  seats: number; // Number of user seats
  usedSeats: number;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  taxId?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanConfig {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: SubscriptionFeatures;
  popular?: boolean;
  cta: string;
  enabled?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  starter: {
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    monthlyPrice: 99,
    annualPrice: 990, // 2 months free
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
  },
  professional: {
    name: 'Professional',
    description: 'Ideal for growing companies with advanced needs',
    monthlyPrice: 299,
    annualPrice: 2990, // 2 months free
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
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large organizations with complex requirements',
    monthlyPrice: 999,
    annualPrice: 9990, // 2 months free
    features: {
      maxEmployees: 9999, // Unlimited
      maxClients: 9999, // Unlimited
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
  },
};
