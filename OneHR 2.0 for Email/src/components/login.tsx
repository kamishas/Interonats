import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../lib/auth-context';
import { Building2, Lock, Mail, AlertCircle, Crown, ArrowLeft } from 'lucide-react';
import { Badge } from './ui/badge';

interface LoginProps {
  onSignupClick?: (mode?: 'free' | 'subscribe' | 'default') => void;
  onBackToLanding?: () => void;
}

export function Login({ onSignupClick, onBackToLanding }: LoginProps = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const demoCredentials = [
    { role: 'Product Admin', email: 'productadmin@company.com', password: 'productadmin123', badge: 'Platform-wide' },
    { role: 'Admin', email: 'admin@company.com', password: 'admin123' },
    { role: 'HR Manager', email: 'hr@company.com', password: 'hr123' },
    { role: 'Recruiter', email: 'recruiter@company.com', password: 'recruiter123' },
    { role: 'Accounting Manager', email: 'accounting@company.com', password: 'accounting123' },
    { role: 'Immigration Team', email: 'immigration@company.com', password: 'immigration123' },
    { role: 'Licensing Team', email: 'licensing@company.com', password: 'licensing123' },
    { role: 'Employee', email: 'employee@company.com', password: 'employee123' },
    { role: 'Client Admin', email: 'client@company.com', password: 'client123' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 relative">
      {/* Back to Landing Button - positioned absolutely within the page */}
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
      
      {/* Centered login form */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold">Business Platform</h1>
            <p className="text-sm text-muted-foreground">
              Admin Portal
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCredentials(!showCredentials)}
                >
                  {showCredentials ? 'Hide' : 'Show'} Demo Credentials
                </Button>

                {showCredentials && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Demo accounts:</p>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {demoCredentials.map((cred, index) => (
                        <Card key={index} className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{cred.role}</p>
                              {(cred as any).badge && (
                                <Badge variant="secondary" className="text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  {(cred as any).badge}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col text-xs text-muted-foreground">
                              <span>Email: {cred.email}</span>
                              <span>Password: {cred.password}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => {
                                setEmail(cred.email);
                                setPassword(cred.password);
                              }}
                            >
                              Use These Credentials
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              Secure authentication powered by role-based access control
            </p>
            <p className="text-center text-xs text-muted-foreground">
              💡 Use demo credentials above to explore, or create your own account to get started
            </p>
          </div>

          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?
                </p>
                
                <div className="grid gap-3">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSignupClick) {
                        onSignupClick('free');
                      } else {
                        window.location.href = '/?signup=free';
                      }
                    }}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Start Free Trial
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    Free forever • No credit card required • Full access
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-50 px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSignupClick) {
                        onSignupClick('subscribe');
                      } else {
                        window.location.href = '/?signup=subscribe';
                      }
                    }}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    View Plans & Subscribe
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    14-day trial • Premium features • Cancel anytime
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}