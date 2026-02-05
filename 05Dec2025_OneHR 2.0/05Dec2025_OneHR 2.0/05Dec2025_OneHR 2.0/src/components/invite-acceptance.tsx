
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { API_ENDPOINTS } from '../lib/constants';
import { Lock, User, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface InviteAcceptanceProps {
  token: string;
  type?: 'onboarding' | 'role';
  onboardingId?: string; // Optional as backend might only need token
  onComplete: () => void;
}

interface InviteInfo {
  first_name: string;
  last_name: string;
  email: string;
  organization_name: string;
}

export function InviteAcceptance({ token, type = 'onboarding', onComplete }: InviteAcceptanceProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      const url = type === 'role' 
        ? `${API_ENDPOINTS.ROLE_INVITE}/invite/${token}`
        : `${API_ENDPOINTS.EMPL_ONBORDING}/onboarding/invite/${token}`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Invalid or expired invite link');
      }
      
      const data = await response.json();
      setInviteInfo(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to validate invite');
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordError('');
    setSubmitting(true);
    
    try {
      let url = '';
      let payload: any = { password };

      if (type === 'role') {
        url = `${API_ENDPOINTS.ROLE_INVITE}/accept`;
        // Role invite service expects token in body
        payload.token = token;
      } else {
        url = `${API_ENDPOINTS.EMPL_ONBORDING}/onboarding/invite/${token}/complete-profile`;
        // Onboarding service has token in URL
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to set password');
      }

      setSuccess(true);
      toast.success('Account created successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create account');
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Invite Error</CardTitle>
            <CardDescription>
              We couldn't validate your invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="w-full mt-6" onClick={onComplete}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Welcome to {inviteInfo?.organization_name || 'OneHR'}!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your account has been successfully created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              You can now log in with your email and the password you just set.
            </p>
            <Button className="w-full h-11 text-lg" onClick={onComplete}>
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-8 border-b bg-gray-50/50 rounded-t-xl">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome, {inviteInfo?.first_name}!</CardTitle>
          <CardDescription className="text-base">
            You've been invited to join <span className="font-semibold text-foreground">{inviteInfo?.organization_name}</span> using OneHR.
            <br />
            Please set a password to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={inviteInfo?.email} 
                disabled 
                className="bg-gray-50 text-gray-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={passwordError ? "border-red-500 pr-20" : "pr-20"}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={passwordError ? "border-red-500 pr-20" : "pr-20"}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-lg" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
