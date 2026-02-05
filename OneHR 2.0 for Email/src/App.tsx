import { useState, useEffect } from 'react';
import { Login } from "./components/login";
import { Signup } from "./components/signup";
import { PasswordResetDialog } from "./components/password-reset-dialog";
import { EmailAgent } from "./components/email-agent";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "./components/ui/sidebar";
import {
  Mail,
  Users,
  BarChart3,
  LogOut
} from "lucide-react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { toast } from "sonner"; // Removed version suffix
import { ZohoCallback } from "./components/zoho-callback";
import { Toaster } from "./components/ui/sonner";

type ViewType = 'email-agent';

function AppContent() {
  // Handle OAuth Callback Route
  if (window.location.pathname === '/auth/callback') {
    return <ZohoCallback />;
  }

  // Basic auth state
  const { user, isLoading, logout, requiresPasswordReset, clearPasswordResetFlag } = useAuth();
  // We default to 'email-agent' since it's the only view
  const [activeView, setActiveView] = useState<ViewType>('email-agent');

  // Simple Signup State (kept for Auth flow completeness)
  const urlParams = new URLSearchParams(window.location.search);
  const signupParam = urlParams.get('signup');
  const showSignupParam = signupParam === 'true';
  const [showSignup, setShowSignup] = useState(showSignupParam);

  useEffect(() => {
    if (showSignupParam) {
      setShowSignup(true);
    }
  }, [showSignupParam]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showSignup) {
      return (
        <Signup
          signupMode="default"
          onSignupComplete={() => {
            setShowSignup(false);
            window.history.pushState({}, '', '/');
            alert('Account created successfully!');
          }}
          onBackToLogin={() => {
            setShowSignup(false);
            window.history.pushState({}, '', '/');
          }}
          // Landing page is removed, so back goes to login
          onBackToLanding={() => setShowSignup(false)}
        />
      );
    }
    // Landing page removed, defaulting to Login
    return (
      <Login
        onSignupClick={() => {
          setShowSignup(true);
          window.history.pushState({}, '', '/?signup=true');
        }}
        // No landing page
        onBackToLanding={() => { }}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative overflow-hidden">
        {/* Simple Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 -z-10"></div>

        <Sidebar className="border-r border-border/40 bg-white/80 backdrop-blur-xl shadow-lg">
          <SidebarHeader className="border-b border-border/40 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <div className="px-4 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Email Agent
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={true}>
                      <Mail className="h-4 w-4" />
                      <span>Email Agent</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => logout()}>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto relative">
          <div className="p-6">
            <EmailAgent />
          </div>
        </main>
      </div>

      {/* Password Reset Dialog */}
      {requiresPasswordReset && clearPasswordResetFlag && (
        <PasswordResetDialog
          open={true}
          userEmail={user.email}
          onSuccess={() => {
            clearPasswordResetFlag();
            toast.success('Password updated successfully!');
          }}
        />
      )}
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}