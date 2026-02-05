import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../../lib/auth-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Mail, FileText, Loader2, Sparkles, Shield, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpFullName, setSignUpFullName] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(signInEmail, signInPassword);

      if (error) {
        toast.error('Sign in failed', {
          description: error.message || 'Please check your credentials and try again.',
        });
      } else {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(signUpEmail, signUpPassword, signUpFullName);

      if (error) {
        toast.error('Sign up failed', {
          description: error.message || 'Please try again.',
        });
      } else {
        toast.success('Account created successfully!', {
          description: 'Please check your email to verify your account.',
        });
        setActiveTab('signin');
      }
    } catch (error) {
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-blue-100">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Enterprise HR Platform</span>
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent leading-tight">
              Streamline Your Hiring Process
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Manage resumes, send compliant emails, and automate your recruitment workflow—all in one professional platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Resume Management</h3>
                <p className="text-sm text-gray-600">
                  Organize and track candidate resumes with advanced filtering and status management.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-indigo-100">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email Agent</h3>
                <p className="text-sm text-gray-600">
                  Send bulk emails with AI-powered content generation and real-time delivery tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-purple-100">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">EEOC Compliance</h3>
                <p className="text-sm text-gray-600">
                  Automatic compliance checking ensures all communications meet legal standards.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-2xl border-white/60 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Welcome
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your HR management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-10 text-gray-500 hover:bg-transparent hover:text-gray-700"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                      >
                        {showSignInPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showSignInPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="bg-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-10 text-gray-500 hover:bg-transparent hover:text-gray-700"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showSignUpPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={async () => {
                  toast.info('Logging in as Product Admin...');
                  try {
                    const { error } = await signIn('productadmin@company.com', 'productadmin123');
                    if (error) {
                      toast.error('Auto-login failed', { description: error.message });
                    } else {
                      toast.success('Login Successful', { description: 'Accessing real data environment' });
                      navigate('/');
                    }
                  } catch (e) {
                    toast.error('Connection Error', { description: 'Could not connect to authentication server' });
                  }
                }}
              >
                Auto-Login (Product Admin) - View Real Data
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
