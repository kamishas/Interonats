import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
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
  Globe,
  Image,
  Eye,
  EyeOff
} from 'lucide-react';
import { SubscriptionPricing } from './subscription-pricing';
import { logAction } from '../utils/logAction';
import { SubscriptionPlan } from '../types/subscription';

interface SignupProps {
  onSignupComplete: () => void;
  onBackToLogin: () => void;
  signupMode?: 'free' | 'subscribe' | 'default'; // free = skip plan selection, subscribe = start with plans, default = normal flow
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
  organizationWebSiteUrl: string;
  organizationIconUrl: string;
  phone: string;
  industry: string;
  companySize: string;
  
  // Step 3: Subscription
  selectedPlan?: SubscriptionPlan;
  billingCycle?: 'monthly' | 'annual';
}

export function Signup({ onSignupComplete, onBackToLogin, signupMode = 'default', onBackToLanding }: SignupProps) {
  // Start at step 3 (plans) if signupMode is 'subscribe'
  console.log('Signup mode:', signupMode);
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
    organizationWebSiteUrl: '',
    organizationIconUrl: '',
    phone: '',
    industry: '',
    companySize: '',
    selectedPlan: signupMode === 'free' ? 'free' : undefined,
    billingCycle: signupMode === 'free' ? 'monthly' : undefined,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const totalSteps = signupMode === 'free' ? 3 : 4; // Skip plan selection for free mode
  
  // Calculate progress based on actual flow position, not step number
  const getProgress = () => {
    if (signupMode === 'subscribe') {
      // Subscribe mode flow: Plan (step 3) → Account (step 1) → Org (step 2) → Review (step 4)
      const flowPosition = {
        3: 1, // Plan is first in flow
        1: 2, // Account is second
        2: 3, // Organization is third
        4: 4, // Review is fourth
      }[step] || 1;
      return (flowPosition / totalSteps) * 100;
    } else if (signupMode === 'free') {
      // Free mode flow: Account (step 1) → Org (step 2) → Review (step 4)
      const flowPosition = {
        1: 1,
        2: 2,
        4: 3,
      }[step] || 1;
      return (flowPosition / totalSteps) * 100;
    } else {
      // Default flow: Account (1) → Org (2) → Plan (3) → Review (4)
      return (step / totalSteps) * 100;
    }
  };
  
  const progress = getProgress();

  const updateFormData = (field: keyof SignupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Wrap the parent back-to-login handler so we can log when it's invoked
  const handleBackToLogin = () => {
    try { logAction('signup.backToLogin.invoked', { step }); } catch (err) {}
    try { onBackToLogin(); } catch (err) {}
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

    // Name validation: Alphabets only
    const nameRegex = /^[a-zA-Z\s\-\']+$/;
    if (!nameRegex.test(formData.firstName)) {
      setError('First name should only contain alphabets');
      return false;
    }
    if (!nameRegex.test(formData.lastName)) {
      setError('Last name should only contain alphabets');
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

  const handleNextStep = () => {
    try { logAction('signup.next.clicked', { step }); } catch (err) {}
    setError('');
    
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    
    // For free mode, skip plan selection and go straight to review
    if (signupMode === 'free' && step === 2) {
      setStep(4); // Jump to review step
      return;
    }
    
    // For subscribe mode: After account (step 1), go to organization (step 2)
    // After organization (step 2), go to review (step 4) - skip plan since already selected
    if (signupMode === 'subscribe' && step === 2) {
      setStep(4); // Jump to review step
      return;
    }
    
    setStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    try { logAction('signup.back.clicked', { step }); } catch (err) {}
    setError('');
    
    // Subscribe mode flow: Plan (3) → Account (1) → Org (2) → Review (4)
    if (signupMode === 'subscribe') {
      if (step === 3) {
        // At plans view, go back to login
        handleBackToLogin();
      } else if (step === 1) {
        // At account creation, go back to plans
        setStep(3);
      } else if (step === 2) {
        // At organization, go back to account
        setStep(1);
      } else if (step === 4) {
        // At review, go back to organization
        setStep(2);
      }
      return;
    }
    
    // Default and free mode: normal backward flow
    if (step === 1) {
      handleBackToLogin();
    } else if (step === 4 && signupMode === 'free') {
      // In free mode, jump back to org (step 2) since plan selection is skipped
      setStep(2);
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan, billingCycle: 'monthly' | 'annual') => {
    try { logAction('signup.plan.selected', { plan, billingCycle }); } catch (err) {}
    updateFormData('selectedPlan', plan);
    updateFormData('billingCycle', billingCycle);
    // If in 'subscribe' mode, go to account creation (step 1) after selecting plan
    // Otherwise, go to review (step 4) as before
    setStep(signupMode === 'subscribe' ? 1 : 4);
  };

  const handleSignup = async (e: React.FormEvent) => {
    try { logAction('signup.submit', { email: formData.email }); } catch (err) {}
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = getAccessToken();

      console.log('Submitting form data:', JSON.stringify(formData));
      const response = await fetch(
        `${API_ENDPOINTS.SIGNUP}/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token ?? ''}`,
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
      try { logAction('signup.success', data); } catch (err) {}

      // Kunal: To be added to handle validation errors
      const errorMessage =
        (data && typeof data === 'object' && (
          (data as any).errorMessage ??
          (data as any).error ??
          (data as any).detail ??
          (Array.isArray((data as any).errors) ? (data as any).errors.join(', ') : undefined)
        )) || undefined;

      if (errorMessage) {
        // handle/throw/log
        throw new Error(String(errorMessage));
      }
      else {
        onSignupComplete();
      }
      // Kunal: End for To be added to handle validation errors
    } catch (err) {
      alert('Signup failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      try { logAction('signup.error', err); } catch (e) {}
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 relative">
      {/* Back to Landing Button - positioned absolutely within the page */}
      {onBackToLanding && (
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
               onBackToLanding?.();
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      )}
      
      {/* Centered signup form */}
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
              <p className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>You'll be the <strong>Admin</strong> of your organization and can add team members later</span>
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
                  <span className={step >= 4 ? 'text-primary' : ''}>Review</span>
                </>
              ) : (
                <>
                  <span className={step >= 1 ? 'text-primary' : ''}>Account</span>
                  <span className={step >= 2 ? 'text-primary' : ''}>Organization</span>
                  {signupMode !== 'free' && (
                    <span className={step >= 3 ? 'text-primary' : ''}>Plan</span>
                  )}
                  <span className={step >= 4 ? 'text-primary' : ''}>Review</span>
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
                  Create your admin account to get started - you'll have full control over your organization
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { try { logAction('signup.backToLogin.clicked', { step }); } catch (err) {} ; handleBackToLogin(); }}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
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
                    <Label htmlFor="organizationWebSiteUrl">Organization Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organizationWebSiteUrl"
                        type="url"
                        placeholder="https://www.example.com"
                        value={formData.organizationWebSiteUrl}
                        onChange={(e) => updateFormData('organizationWebSiteUrl', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationIcon">Organization Icon</Label>
                    <div className="relative">
                      <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="organizationIcon"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updateFormData('organizationIconUrl', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                    {formData.organizationIconUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img 
                          src={formData.organizationIconUrl} 
                          alt="Organization icon preview" 
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                        />
                        <span className="text-sm text-muted-foreground">Icon uploaded</span>
                      </div>
                    )}
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
                    <Select value={formData.industry} onValueChange={(value: string) => updateFormData('industry', value)}>
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
                    <Select value={formData.companySize} onValueChange={(value: string) => updateFormData('companySize', value)}>
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
                  onClick={() => { try { logAction('signup.back.clicked', { step }); } catch (err) {} ; handlePreviousStep(); }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {signupMode === 'subscribe' && (
                  <Button
                    variant="ghost"
                    onClick={() => { try { logAction('signup.backToLogin.clicked', { step }); } catch (err) {} ; handleBackToLogin(); }}
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

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
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
                      {formData.organizationWebSiteUrl && <p><span className="text-muted-foreground">Website:</span> <a href={formData.organizationWebSiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{formData.organizationWebSiteUrl}</a></p>}
                      <p><span className="text-muted-foreground">Industry:</span> {formData.industry}</p>
                      <p><span className="text-muted-foreground">Size:</span> {formData.companySize}</p>
                      {formData.phone && <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>}
                      {formData.organizationIconUrl && (
                        <div className="pt-2 border-t">
                          <p className="text-muted-foreground mb-2">Icon:</p>
                          <img 
                            src={formData.organizationIconUrl} 
                            alt="Organization icon" 
                            className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>

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
              onClick={() => { try { logAction('signup.footer.signin.clicked', { step }); } catch (err) {} ; handleBackToLogin(); }}
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
