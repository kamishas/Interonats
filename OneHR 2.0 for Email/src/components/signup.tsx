import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Building2,
  Lock,
  Mail,
  AlertCircle,
  User,
  Phone,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Shield,
  CreditCard,

  MapPin,
  Loader2,
  Check,
  ChevronsUpDown
} from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { cn } from "./ui/utils"


import { SubscriptionPricing } from './subscription-pricing';
import { SubscriptionPlan } from '../types/subscription';

interface SignupProps {
  onSignupComplete: () => void;
  onBackToLogin: () => void;
  signupMode?: 'free' | 'subscribe' | 'default';
  onBackToLanding?: () => void;
}

interface SignupFormData {
  // Step 1: Account Info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2: Organization Info
  organizationName: string;
  phone: string;
  industry: string;
  companySize: string;

  // Step 3: Billing Info
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;

  // Step 4: Subscription
  selectedPlan?: SubscriptionPlan;
  billingCycle?: 'monthly' | 'annual';
}

export function Signup({ onSignupComplete, onBackToLogin, signupMode = 'default', onBackToLanding }: SignupProps) {
  // Start at appropriate step based on mode
  const [step, setStep] = useState(signupMode === 'subscribe' ? 3 : 1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    phone: '',
    industry: '',
    companySize: '',
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'United States',
    selectedPlan: signupMode === 'free' ? 'free' : undefined,
    billingCycle: signupMode === 'free' ? 'monthly' : undefined,
  });

  const [isAddressVerified, setIsAddressVerified] = useState(false);

  // Autocomplete State
  const [openCombobox, setOpenCombobox] = useState(false);
  const [streetQuery, setStreetQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<number[] | null>(null);
  const [isVerifyingDetails, setIsVerifyingDetails] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
          console.log("Location detected for optimization");
        },
        (error) => console.log("Geo error:", error)
      );
    }
  }, []);

  // Helper to determine if billing step should be shown
  const shouldShowBillingStep = () => {
    if (signupMode === 'free') return false;
    if (formData.selectedPlan === 'free') return false;
    return true;
  };

  // Calculate total steps for progress bar
  const getTotalSteps = () => {
    if (signupMode === 'free') return 3; // Account, Org, Review
    if (formData.selectedPlan === 'free') return 4; // Account, Org, Plan, Review
    return 5; // Account, Org, Billing, Plan, Review
  };

  // Calculate progress based on current step
  const getProgress = () => {
    const totalSteps = getTotalSteps();

    if (signupMode === 'subscribe') {
      // Subscribe mode: Plan (3) → Account (1) → Org (2) → [Billing (4)] → Review (5)
      const stepOrder = formData.selectedPlan === 'free'
        ? { 3: 1, 1: 2, 2: 3, 5: 4 }
        : { 3: 1, 1: 2, 2: 3, 4: 4, 5: 5 };
      return ((stepOrder[step] || 1) / totalSteps) * 100;
    } else if (signupMode === 'free') {
      // Free mode: Account (1) → Org (2) → Review (5)
      const stepOrder = { 1: 1, 2: 2, 5: 3 };
      return ((stepOrder[step] || 1) / totalSteps) * 100;
    } else {
      // Default mode: Account (1) → Org (2) → Plan (3) → [Billing (4)] → Review (5)
      const stepOrder = formData.selectedPlan === 'free'
        ? { 1: 1, 2: 2, 3: 3, 5: 4 }
        : { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
      return ((stepOrder[step] || 1) / totalSteps) * 100;
    }
  };

  const progress = getProgress();

  const updateFormData = (field: keyof SignupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Debounced Autocomplete Fetcher
  const fetchAddressSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setFetchingSuggestions(true);
    try {
      const payload: any = { action: 'autocomplete', query };
      if (userLocation) {
        payload.biasPosition = userLocation;
      }

      // AWS HTTP API Gateway (Public)
      const response = await fetch('https://7a8in913p9.execute-api.us-east-1.amazonaws.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingSuggestions(false);
    }
  };

  // Trigger search when user types
  const handleStreetSearch = (value: string) => {
    setStreetQuery(value);
    // Debounce manual implementation
    const handler = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 200);
    return () => clearTimeout(handler);
  };

  const handleSelectAddress = async (suggestion: any) => {
    // We selected a suggestion. Now we must fetch the full details for it.
    // The previous logic set form data immediately. GitHub suggestion: fetch details first.
    setIsVerifyingDetails(true);
    setOpenCombobox(false);
    setStreetQuery(suggestion.label); // Show label while loading

    try {
      const payload: any = { action: 'verify' };
      if (suggestion.value) {
        payload.place_id = suggestion.value;
      } else {
        // Fallback
        payload.street = suggestion.label;
      }

      const response = await fetch('https://7a8in913p9.execute-api.us-east-1.amazonaws.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.standardized && data.isValid) {
        setFormData(prev => ({
          ...prev,
          billingStreet: data.standardized.street,
          billingCity: data.standardized.city,
          billingState: data.standardized.state,
          billingZip: data.standardized.zip5 + (data.standardized.zip4 ? '-' + data.standardized.zip4 : ''),
          billingCountry: "United States"
        }));
        setIsAddressVerified(true);
      } else {
        console.error("Validation failed", data);
        setError(data.message || 'Address validation failed. Please select a specific building.');
        setIsAddressVerified(false);

        setFormData(prev => ({
          ...prev,
          billingStreet: suggestion.label, // Leave partial input but mark invalid
          billingCountry: "United States"
        }));
      }

    } catch (e) {
      console.error("Error fetching details", e);
      setError("Network error validating address.");
    } finally {
      setIsVerifyingDetails(false);
    }
  };

  // Old function removed/replaced
  const _verifyAddressPlaceholder = async () => {
    if (!formData.billingStreet || !formData.billingZip) {
      setError('Please enter Street and ZIP Code first');
      return;
    }

    setIsVerifyingAddress(true);
    setError('');

    try {
      // AWS HTTP API Gateway (Public)
      const response = await fetch('https://7a8in913p9.execute-api.us-east-1.amazonaws.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'verify',
          street: formData.billingStreet,
          city: formData.billingCity,
          state: formData.billingState,
          zip: formData.billingZip
        })
      });

      if (!response.ok) throw new Error('Verification failed');

      const data = await response.json();

      if (data.isValid) {
        setIsAddressVerified(true);
        // Auto-update with standardized data
        setFormData(prev => ({
          ...prev,
          billingStreet: data.standardized.street,
          billingCity: data.standardized.city,
          billingState: data.standardized.state,
          billingZip: data.standardized.zip5 + (data.standardized.zip4 ? '-' + data.standardized.zip4 : '')
        }));
      } else {
        setError(data.message || 'Address could not be verified');
        setIsAddressVerified(false);
      }
    } catch (err) {
      console.error(err);
      // Soft fail - allow user to proceed but show error
      setError('Could not verify address. Please check details.');
    } finally {
      setIsVerifyingAddress(false);
    }
  };


  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.organizationName || !formData.industry || !formData.companySize) {
      setError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.cardHolderName || !formData.cardNumber || !formData.expiryDate || !formData.cvv) {
      setError('Please fill in all billing fields');
      return false;
    }
    if (!formData.billingStreet || !formData.billingCity || !formData.billingState || !formData.billingZip || !formData.billingCountry) {
      setError('Please fill in complete billing address');
      return false;
    }
    // Basic card number validation (remove spaces and check length)
    const cardNumberClean = formData.cardNumber.replace(/\s/g, '');
    if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
      setError('Please enter a valid card number');
      return false;
    }
    // Basic expiry date validation (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      setError('Please enter expiry date in MM/YY format');
      return false;
    }
    // CVV validation
    if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      setError('Please enter a valid CVV');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');

    // Validate current step
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 4 && !validateStep3()) return; // Step 4 is now billing

    // Navigate to next step based on flow
    if (step === 1) {
      setStep(2); // Always go to organization after account
    } else if (step === 2) {
      // After organization
      if (signupMode === 'free') {
        setStep(5); // Skip to review
      } else if (signupMode === 'subscribe') {
        // In subscribe mode, plan is already selected
        if (shouldShowBillingStep()) {
          setStep(4); // Go to billing
        } else {
          setStep(5); // Go to review
        }
      } else {
        // Default mode: go to plan selection
        setStep(3); // Go to plan selection
      }
    } else if (step === 3) {
      // After plan selection, navigation is handled by handleSelectPlan
      // This shouldn't be reached
      setStep(5);
    } else if (step === 4) {
      // After billing, go to review
      setStep(5);
    }
  };

  const handlePreviousStep = () => {
    setError('');

    if (step === 1) {
      if (signupMode === 'subscribe') {
        setStep(3); // Go back to plan selection
      } else {
        onBackToLogin();
      }
    } else if (step === 2) {
      setStep(1); // Go back to account
    } else if (step === 3) {
      // From plan selection, go back to organization
      if (signupMode === 'subscribe') {
        onBackToLogin();
      } else {
        setStep(2); // Go back to organization
      }
    } else if (step === 4) {
      // From billing, go back to plan
      setStep(3);
    } else if (step === 5) {
      // From review, go back based on flow
      if (signupMode === 'free') {
        setStep(2); // Go back to organization
      } else if (shouldShowBillingStep()) {
        setStep(4); // Go back to billing
      } else if (signupMode === 'subscribe') {
        setStep(2); // Go back to organization (no billing for free plan)
      } else {
        setStep(3); // Go back to plan
      }
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual') => {
    updateFormData('selectedPlan', plan);
    updateFormData('billingCycle', billingCycle);

    if (signupMode === 'subscribe') {
      // In subscribe mode, after selecting plan, go to account creation
      setStep(1);
    } else {
      // In default mode, after selecting plan, check if billing is needed
      if (plan !== 'free') {
        setStep(4); // Go to billing (step 4)
      } else {
        setStep(5); // Go to review
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const data = await response.json();
      console.log('Signup successful:', data);

      onSignupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 relative">
      {onBackToLanding && (
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onBackToLanding}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl">
              {signupMode === 'free' ? 'Start Your Free Trial' :
                signupMode === 'subscribe' ? 'Choose Your Plan' :
                  'Create Your Account'}
            </h1>
            <p className="text-muted-foreground">
              {signupMode === 'free' ? 'Get full access - free forever, no credit card required' :
                signupMode === 'subscribe' ? 'Select a plan and create your account' :
                  'Get started with Workforce Management Platform'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 mt-2">
              <p className="flex items-center gap-2 justify-center">
                <Shield className="h-4 w-4" />
                <span>You&apos;ll be the <strong>Admin</strong> of your organization and can add team members later</span>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {signupMode === 'subscribe' ? (
                <>
                  <span className={step >= 3 ? 'text-primary' : ''}>Plan</span>
                  <span className={step >= 1 ? 'text-primary' : ''}>Account</span>
                  <span className={step >= 2 ? 'text-primary' : ''}>Organization</span>
                  {shouldShowBillingStep() && <span className={step >= 4 ? 'text-primary' : ''}>Billing</span>}
                  <span className={step >= 5 ? 'text-primary' : ''}>Review</span>
                </>
              ) : (
                <>
                  <span className={step >= 1 ? 'text-primary' : ''}>Account</span>
                  <span className={step >= 2 ? 'text-primary' : ''}>Organization</span>
                  {signupMode !== 'free' && (
                    <span className={step >= 3 ? 'text-primary' : ''}>Plan</span>
                  )}
                  {signupMode !== 'free' && shouldShowBillingStep() && (
                    <span className={step >= 4 ? 'text-primary' : ''}>Billing</span>
                  )}
                  <span className={step >= 5 ? 'text-primary' : ''}>Review</span>
                </>
              )}
            </div>
          </div>

          {/* Step 1: Account Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Create your admin account to get started - you&apos;ll have full control over your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {signupMode === 'subscribe' && formData.selectedPlan && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Selected Plan: <strong className="text-primary">{formData.selectedPlan.toUpperCase()}</strong>
                        {formData.billingCycle && formData.selectedPlan !== 'free' && (
                          <span> • {formData.billingCycle === 'annual' ? 'Annual (Save 17%)' : 'Monthly'}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Organization Information */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  Tell us about your company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {signupMode === 'subscribe' && formData.selectedPlan && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Selected Plan: <strong className="text-primary">{formData.selectedPlan.toUpperCase()}</strong>
                        {formData.billingCycle && formData.selectedPlan !== 'free' && (
                          <span> • {formData.billingCycle === 'annual' ? 'Annual (Save 17%)' : 'Monthly'}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organizationName"
                        placeholder="Acme Corporation"
                        value={formData.organizationName}
                        onChange={(e) => updateFormData('organizationName', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry *</Label>
                    <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size *</Label>
                    <Select value={formData.companySize} onValueChange={(value) => updateFormData('companySize', value)}>
                      <SelectTrigger id="companySize">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1,000 employees</SelectItem>
                        <SelectItem value="1000+">1,000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Choose Plan */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {signupMode === 'subscribe' && (
                  <Button
                    variant="ghost"
                    onClick={onBackToLogin}
                    size="sm"
                  >
                    Back to Login
                  </Button>
                )}
              </div>
              <SubscriptionPricing
                onSelectPlan={handleSelectPlan}
                selectedPlan={formData.selectedPlan}
              />
            </div>
          )}

          {/* Step 4: Billing Information */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Enter your payment details for subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {formData.selectedPlan && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Selected Plan: <strong className="text-primary">{formData.selectedPlan.toUpperCase()}</strong>
                        {formData.billingCycle && (
                          <span> • {formData.billingCycle === 'annual' ? 'Annual (Save 17%)' : 'Monthly'}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card Information
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="cardHolderName">Cardholder Name *</Label>
                      <Input
                        id="cardHolderName"
                        placeholder="John Doe"
                        value={formData.cardHolderName}
                        onChange={(e) => updateFormData('cardHolderName', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16));
                            updateFormData('cardNumber', formatted);
                          }}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date *</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) => {
                            const formatted = formatExpiryDate(e.target.value);
                            updateFormData('expiryDate', formatted);
                          }}
                          maxLength={5}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          value={formData.cvv}
                          onChange={(e) => updateFormData('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Billing Address
                      {isAddressVerified && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="billingStreet">Street Address *</Label>
                      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className={cn("w-full justify-between font-normal text-left", !formData.billingStreet && "text-muted-foreground")}
                          >
                            {formData.billingStreet || "Enter address..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search address (e.g. 123 Main)..."
                              value={streetQuery}
                              onValueChange={handleStreetSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {fetchingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : "No address found."}
                              </CommandEmpty>
                              <CommandGroup>
                                {suggestions.map((suggestion, idx) => (
                                  <CommandItem
                                    key={idx}
                                    value={suggestion.value}
                                    onSelect={() => handleSelectAddress(suggestion)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.billingStreet === suggestion.data.street ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{suggestion.data.street}</span>
                                      <span className="text-xs text-muted-foreground">{suggestion.data.city}, {suggestion.data.state} {suggestion.data.zip}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">City *</Label>
                        <Input
                          id="billingCity"
                          placeholder="San Francisco"
                          value={formData.billingCity}
                          onChange={(e) => updateFormData('billingCity', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingState">State / Province *</Label>
                        <Input
                          id="billingState"
                          placeholder="CA"
                          value={formData.billingState}
                          onChange={(e) => updateFormData('billingState', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="billingZip">ZIP / Postal Code *</Label>
                        <div className="relative">
                          <Input
                            id="billingZip"
                            placeholder="94105"
                            value={formData.billingZip}
                            onChange={(e) => {
                              updateFormData('billingZip', e.target.value);
                              setIsAddressVerified(false);
                            }}
                            className={isAddressVerified ? "border-green-500 bg-green-50/30" : ""}
                            required
                          />


                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingCountry">Country *</Label>
                        <Select value={formData.billingCountry} onValueChange={(value) => updateFormData('billingCountry', value)}>
                          <SelectTrigger id="billingCountry">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                            <SelectItem value="Japan">Japan</SelectItem>
                            <SelectItem value="India">India</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your payment information is encrypted and secure. You won&apos;t be charged until after your 14-day free trial.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Confirm */}
          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Confirm</CardTitle>
                <CardDescription>
                  Review your information before creating your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Account Details */}
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Account Details
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {formData.firstName} {formData.lastName}</p>
                      <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                      <div className="pt-2 mt-2 border-t">
                        <p className="text-blue-600 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Administrator Role - Full Access</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Organization Details */}
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Details
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Company:</span> {formData.organizationName}</p>
                      <p><span className="text-muted-foreground">Industry:</span> {formData.industry}</p>
                      <p><span className="text-muted-foreground">Size:</span> {formData.companySize}</p>
                      {formData.phone && <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>}
                    </div>
                  </div>

                  {/* Billing Details */}
                  {shouldShowBillingStep() && formData.cardNumber && (
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Billing Information
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Cardholder:</span> {formData.cardHolderName}</p>
                        <p><span className="text-muted-foreground">Card:</span> •••• •••• •••• {formData.cardNumber.slice(-4)}</p>
                        <p><span className="text-muted-foreground">Address:</span> {formData.billingStreet}, {formData.billingCity}, {formData.billingState} {formData.billingZip}, {formData.billingCountry}</p>
                      </div>
                    </div>
                  )}

                  {/* Subscription Details */}
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Subscription Plan
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Plan:</span> {formData.selectedPlan?.toUpperCase()}</p>
                      {formData.selectedPlan !== 'free' && (
                        <p><span className="text-muted-foreground">Billing:</span> {formData.billingCycle === 'annual' ? 'Annual (Save 17%)' : 'Monthly'}</p>
                      )}
                      <div className="pt-2 mt-2 border-t">
                        <p className="text-green-600 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          {formData.selectedPlan === 'free'
                            ? 'Free forever - No credit card required'
                            : '14-day free trial included'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                      {formData.selectedPlan === 'free'
                        ? ' Your free account will be activated immediately with full access to all features.'
                        : ' Your trial will start immediately and you won\'t be charged until after 14 days.'}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' :
                        formData.selectedPlan === 'free' ? 'Create Free Account' :
                          'Create Account & Start Trial'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={onBackToLogin}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}