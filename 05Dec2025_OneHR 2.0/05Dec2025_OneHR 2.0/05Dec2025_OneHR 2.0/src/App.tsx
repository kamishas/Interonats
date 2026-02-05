import { useState, useEffect } from 'react';
import { HRCalendarUnified } from "./components/hr-calendar-unified";
import { LandingPage } from "./components/landing-page";
import { PayrollManagement } from "./components/payroll-management";
import { Dashboard } from "./components/dashboard";
import { ProductAdminDashboard } from "./components/product-admin-dashboard";
import { EmployeeOnboarding } from "./components/employee-onboarding";
import { ClientManagementAdvanced } from "./components/client-management-advanced";
import { ImmigrationManagement } from "./components/immigration-management";
import { LicensingUnified } from "./components/licensing-unified";
import { CertificationTracking } from "./components/certification-tracking";
import { TimesheetUnified } from "./components/timesheet-unified";
import { InvoiceManagement } from "./components/invoice-management";
import { ExpenseManagement } from "./components/expense-management";
import { TimesheetAnalytics } from "./components/timesheet-analytics";
import { NotificationCenter } from "./components/notification-center";
import { AccountSettingsPage } from "./components/account-settings-page";
import { DocumentManagement } from "./components/document-management";
import { LeaveManagement } from "./components/leave-management";
import { Offboarding } from "./components/offboarding";
import { PerformanceManagement } from "./components/performance-management";
import { ProjectAssignments } from "./components/project-assignments";
import { VendorManagement } from "./components/vendor-management";
import { SubvendorManagement } from "./components/subvendor-management";
import { ContractorManagement } from "./components/contractor-management";
import { EmailAgent } from "./components/email-agent";

import { SubscriptionConfig } from "./components/subscription-config";
import { SubscriptionManagement } from "./components/subscription-management";
import { ExternalIntegrationsConfig } from "./components/external-integrations-config";
import { UserRoleManagement } from "./components/user-role-management";
import { AdminRoleManagement } from "./components/admin-role-management";
import { EmployeePortal } from "./components/employee-portal";
import { Login } from "./components/login";
import { Signup } from "./components/signup";
import { UserMenu } from "./components/user-menu";
import { PasswordResetDialog } from "./components/password-reset-dialog";
import { InviteAcceptance } from "./components/invite-acceptance";
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
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  FileText,
  Clock,
  Award,
  DollarSign,
  FolderOpen,
  Calendar,
  UserX,
  BarChart3,
  CreditCard,
  UserPlus,
  Settings,
  Briefcase,
  Layers,
  Package,
  Receipt,
  Wallet,
  Mail,
} from "lucide-react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { getAccessToken } from './lib/constants';
import { getRolePermissions } from "./types/auth";
import { toast } from "sonner";


type ViewType = 'landing' | 'dashboard' | 'product-admin-dashboard' | 'employees' | 'clients' | 'immigration' | 'licensing' | 'certifications' | 'timesheets' | 'invoices' | 'expenses' | 'analytics' | 'payroll' | 'client-portal' | 'notifications' | 'documents' | 'leave' | 'offboarding' | 'performance' | 'projects' | 'vendors' | 'subvendors' | 'contractors' | 'subscription-config' | 'subscription-management' | 'external-integrations' | 'user-role-management' | 'role-management' | 'hr-calendar' | 'state-licensing' | 'settings' | 'api-test' | 'email-agent';

function AppContent() {
  const { user, isLoading, userPermissions, requiresPasswordReset, clearPasswordResetFlag, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('landing');
  const [externalIntegrations, setExternalIntegrations] = useState<any[]>([]);
  
  // Check URL parameters directly (not in state to avoid delay)
  const urlParams = new URLSearchParams(window.location.search);
  const signupParam = urlParams.get('signup');
  const showSignupParam = signupParam === 'true' || signupParam === 'free' || signupParam === 'subscribe';
  const loginParam = urlParams.get('login');
  const showLoginParam = loginParam === 'true';
  const onboardingId = urlParams.get('onboarding_id');
  
  // Robust token extraction to handle various URL formats:
  // 1. Query Param: ?token=... (Standard)
  // 2. Hash Param: #/accept-invite?token=... (HashRouter style)
  // 3. Path Param: /accept-invite/TOKEN or /accept-role-invite/TOKEN
  const getInviteToken = () => {
    // 1. Check standard query param
    const queryToken = urlParams.get('token');
    if (queryToken) return queryToken;

    // 2. Check hash params
    if (window.location.hash) {
      const hashString = window.location.hash.includes('?') 
        ? window.location.hash.split('?')[1] 
        : window.location.hash;
      const hashParams = new URLSearchParams(hashString);
      const hashToken = hashParams.get('token');
      if (hashToken) return hashToken;
    }

    // 3. Check path params (last segment if it looks like a token)
    const pathSegments = window.location.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    // Simple check if it looks like a UUID or token (min length 10)
    if (lastSegment && lastSegment.length > 10 && 
       (window.location.pathname.includes('accept-invite') || window.location.pathname.includes('accept-role-invite'))) {
      return lastSegment;
    }

    return null;
  };

  const inviteToken = getInviteToken();

  const getInviteType = () => {
    if (window.location.hash.includes('accept-role-invite') || window.location.pathname.includes('accept-role-invite')) {
        return 'role';
    }
    return 'onboarding';
  }
  const inviteType = getInviteType();

  const [showSignup, setShowSignup] = useState(showSignupParam);
  const [signupMode, setSignupMode] = useState<'free' | 'subscribe' | 'default'>(
    signupParam === 'free' ? 'free' : 
    signupParam === 'subscribe' ? 'subscribe' : 
    'default'
  );

  // If user is logged in but trying to accept an invite, log them out first
  useEffect(() => {
    if (user && inviteToken) {
      logout();
    }
  }, [user, inviteToken, logout]);

  // Set default view based on user role when user logs in
  useEffect(() => {
    if (user?.role === 'product-admin') {
      setActiveView('product-admin-dashboard');
    }
  }, [user?.role]);

  // Fetch external integrations


  // Check and handle external redirect
  const handleExternalRedirect = (module: 'timesheets' | 'invoices') => {
    const integration = externalIntegrations.find(i => i.module === module && i.enabled);
    
    if (!integration) {
      // No integration enabled, proceed normally
      return false;
    }

    // Get the URL based on provider
    let url = '';
    if (integration.provider === 'custom') {
      url = integration.customUrl || '';
    } else {
      // Default URLs for common providers
      const providerUrls: Record<string, string> = {
        'quickbooks': module === 'timesheets' ? 'https://quickbooks.intuit.com/time-tracking/' : 'https://quickbooks.intuit.com/',
        'adp': 'https://workforcenow.adp.com/',
        'paychex': 'https://www.paychex.com/',
        'gusto': 'https://app.gusto.com/',
        'bamboohr': 'https://www.bamboohr.com/',
        'freshbooks': 'https://www.freshbooks.com/',
        'zoho': 'https://www.zoho.com/invoice/',
        'wave': 'https://www.waveapps.com/'
      };
      url = providerUrls[integration.provider] || '';
    }

    if (!url) {
      console.error('No URL configured for external integration');
      return false;
    }

    // Show warning if enabled
    if (integration.showWarning) {
      const providerName = integration.provider === 'custom' ? 'external tool' : integration.provider.toUpperCase();
      const confirmed = confirm(`You will be redirected to ${providerName}. Continue?`);
      if (!confirmed) {
        return true; // Handled but cancelled
      }
    }

    // Redirect
    if (integration.openInNewTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }

    return true; // Handled
  };

  useEffect(() => {
    // Sync state with URL parameters
    if (showSignupParam) {
      setShowSignup(true);
    }
    // If URL explicitly requests the login screen, switch away from landing
    if (showLoginParam) {
      setActiveView('dashboard');
    }
  }, [showSignupParam]);

  // Set default view based on user role when user logs in
  useEffect(() => {
    if (user && user.role && userPermissions) {
      // Determine the default view based on role permissions
      let defaultView: ViewType = 'dashboard';
      
      // Role-specific defaults
      if (user.role === 'product-admin') {
        defaultView = 'product-admin-dashboard';
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        defaultView = 'dashboard';
      } else if (user.role === 'immigration') {
        defaultView = 'immigration';
      } else if (user.role === 'licensing') {
        defaultView = 'licensing';
      } else if (user.role === 'recruiter') {
        defaultView = 'employees';
      } else if (user.role === 'accounting') {
        defaultView = (userPermissions as any).canViewDashboard ? 'dashboard' : 'timesheets';
      } else if (!(userPermissions as any).canViewDashboard) {
        // For any other role without dashboard access, find their first available module
        if (userPermissions.canManageEmployees) defaultView = 'employees';
        else if (userPermissions.canManageClients) defaultView = 'clients';
        else if (userPermissions.canManageImmigration) defaultView = 'immigration';
        else if (userPermissions.canManageLicensing) defaultView = 'licensing';
        else if (userPermissions.canManageTimesheets) defaultView = 'timesheets';
        else if (userPermissions.canAccessEmployeeManagement) defaultView = 'documents';
      }
      
      setActiveView(defaultView);
    }
  }, [user, userPermissions]);

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

  // Prevent dashboard flash while logging out for invite
  if (user && inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Signing out to accept invite...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Handle Invite Acceptance
    if (inviteToken) {
      return (
        <InviteAcceptance 
          token={inviteToken}
          type={inviteType} 
          onboardingId={onboardingId || undefined}
          onComplete={() => {
            // Remove token from URL and show login
            window.history.pushState({}, '', '/?login=true');
            // Force a reload or logic update to show Login
            window.location.href = '/?login=true';
          }}
        />
      );
    }


    if (showSignup) {
      return (
        <Signup 
          signupMode={signupMode}
          onSignupComplete={() => {
            setShowSignup(false);
            setSignupMode('default');
            window.history.pushState({}, '', '/');
            // Optionally show a success message
            alert('Account created successfully! Please check your email to verify your account.');
          }}
          onBackToLogin={() => {
            setShowSignup(false);
            setSignupMode('default');
            window.history.pushState({}, '', '/');
          }}
          onBackToLanding={() => setActiveView('landing')}
        />
      );
    }
    
    // Show landing page by default when not logged in
    if (activeView === 'landing') {
      return (
        <LandingPage 
          onLoginClick={() => setActiveView('dashboard')}
          onSignupClick={() => {
            setShowSignup(true);
            setSignupMode('default');
            window.history.pushState({}, '', '/?signup=true');
          }}
        />
      );
    }
    
    return (
      <Login 
        onSignupClick={(mode = 'default') => {
          setShowSignup(true);
          setSignupMode(mode);
          const signupParam = mode === 'default' ? 'true' : mode;
          window.history.pushState({}, '', `/?signup=${signupParam}`);
        }}
        onBackToLanding={() => setActiveView('landing')}
      />
    );
  }

  // Use userPermissions if available, merged with default permissions for the role
  // This ensures new permissions added to roles are available to users with existing custom permissions
  const permissions = { ...getRolePermissions(user.role), ...(userPermissions || {}) };

  const renderContent = () => {
    if ((user.role === 'employee' || user.role === 'consultant') && activeView !== 'settings') {
      return <EmployeePortal />;
    }

    if (!userPermissions) {
      // Still loading permissions
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading permissions...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        // Product Admin should not see organization dashboard
        if (user.role === 'product-admin') {
          return <ProductAdminDashboard />;
        }
        return <Dashboard />;
      case 'product-admin-dashboard':
        return (permissions as any).canViewPlatformMetrics ? <ProductAdminDashboard /> : <div>Access Denied</div>;
      case 'employees':
        return permissions.canManageEmployees || permissions.canViewEmployees ? <EmployeeOnboarding /> : <div>Access Denied</div>;
      case 'clients':
        return permissions.canManageClients ? <ClientManagementAdvanced /> : <div>Access Denied</div>;
      case 'immigration':
        return permissions.canManageImmigration ? <ImmigrationManagement /> : <div>Access Denied</div>;
      case 'licensing':
        return permissions.canManageLicensing ? <LicensingUnified /> : <div>Access Denied</div>;
      case 'certifications':
        return permissions.canManageLicensing ? <CertificationTracking /> : <div>Access Denied</div>;
      case 'timesheets':
        return permissions.canManageTimesheets ? <TimesheetUnified /> : <div>Access Denied</div>;
      case 'invoices':
        return permissions.canManageTimesheets ? <InvoiceManagement /> : <div>Access Denied</div>;
      case 'expenses':
        return permissions.canManageTimesheets ? <ExpenseManagement /> : <div>Access Denied</div>;
      case 'analytics':
        return permissions.canManageTimesheets ? <TimesheetAnalytics /> : <div>Access Denied</div>;
      case 'email-agent':
        return permissions.canManageEmailAgent ? <EmailAgent /> : <div>Access Denied</div>;
      case 'notifications':
        return <NotificationCenter />;
      case 'settings':
        return <AccountSettingsPage onBack={() => setActiveView('dashboard')} />;
      case 'documents':
        return permissions.canAccessEmployeeManagement ? <DocumentManagement /> : <div>Access Denied</div>;
      case 'leave':
        return permissions.canAccessEmployeeManagement ? <LeaveManagement /> : <div>Access Denied</div>;
      case 'offboarding':
        return permissions.canAccessEmployeeManagement ? <Offboarding /> : <div>Access Denied</div>;
      case 'performance':
        return permissions.canAccessEmployeeManagement ? <PerformanceManagement /> : <div>Access Denied</div>;
      case 'projects':
        return permissions.canManageEmployees || permissions.canManageClients ? <ProjectAssignments /> : <div>Access Denied</div>;
      case 'vendors':
        return permissions.canManageClients ? <VendorManagement /> : <div>Access Denied</div>;
      case 'subvendors':
        return permissions.canManageClients ? <SubvendorManagement /> : <div>Access Denied</div>;
      case 'contractors':
        return permissions.canManageEmployees ? <ContractorManagement /> : <div>Access Denied</div>;

      case 'subscription-config':
        return user.role === 'product-admin' ? <SubscriptionConfig /> : <div>Access Denied</div>;
      case 'subscription-management':
        return user.role === 'admin' || user.role === 'super_admin' ? <SubscriptionManagement /> : <div>Access Denied</div>;
      case 'external-integrations':
        return user.role === 'admin' || user.role === 'super_admin' || user.role === 'product-admin' ? <ExternalIntegrationsConfig /> : <div>Access Denied</div>;
      case 'user-role-management':
        return user.role === 'product-admin' ? <UserRoleManagement /> : <div>Access Denied</div>;
      case 'role-management':
        return user.role === 'admin' || user.role === 'super_admin' ? <AdminRoleManagement /> : <div>Access Denied</div>;
      case 'hr-calendar':
        return permissions.canAccessEmployeeManagement ? <HRCalendarUnified /> : <div>Access Denied</div>;
      case 'payroll':
        return permissions.canManageTimesheets ? <PayrollManagement /> : <div>Access Denied</div>;
      default:
        // Product Admin should never see organization dashboard
        if (user.role === 'product-admin') {
          return <ProductAdminDashboard />;
        }
        return <Dashboard onNavigate={(view) => setActiveView(view as ViewType)} />;
    }
  };

  const isEmployeeView = user.role === 'employee' || user.role === 'consultant';

  if (isEmployeeView) {
    return (
      <div className="min-h-screen w-full">
        {/* Show password reset dialog if required */}
        {requiresPasswordReset && clearPasswordResetFlag && (
          <PasswordResetDialog 
            open={true}
            userEmail={user.email}
            onSuccess={() => {
              clearPasswordResetFlag();
              // Trigger refresh of employee data to update workflow
              window.dispatchEvent(new Event('refreshEmployeeData'));
              toast.success('Password updated successfully! Welcome to OneHR.');
            }}
          />
        )}
        {renderContent()}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 -z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.05),transparent_50%)] -z-10"></div>
        
        <Sidebar className="border-r border-border/40 bg-white/80 backdrop-blur-xl shadow-lg">
          <SidebarHeader className="border-b border-border/40 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <div className="px-4 py-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  user.role === 'product-admin' 
                    ? 'bg-gradient-to-br from-purple-500 to-blue-600 hover:shadow-purple-500/50 transition-all duration-300' 
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:shadow-blue-500/50 transition-all duration-300'
                }`}>
                  {user.role === 'product-admin' ? (
                    <BarChart3 className="h-5 w-5 text-white" />
                  ) : (
                    <Users className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {user.role === 'product-admin' ? 'Platform Control' : 'OneHR'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {user.role === 'product-admin' ? 'System Administration' : 'Enterprise Management'}
                  </p>
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {/* Product Admin users only see their own navigation */}
            {user.role !== 'product-admin' && (
              <SidebarGroup className="px-2 pt-2 pb-0">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'dashboard'}
                        onClick={() => setActiveView('dashboard')}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'hr-calendar'}
                        onClick={() => setActiveView('hr-calendar')}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Calendar & Notifications</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {user.role !== 'product-admin' && permissions.canManageTimesheets && (
              <SidebarGroup className="px-2">
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 py-2 mt-2">Timesheets & Invoicing</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'timesheets'}
                        onClick={() => {
                          if (!handleExternalRedirect('timesheets')) {
                            setActiveView('timesheets');
                          }
                        }}
                      >
                        <Clock className="h-4 w-4" />
                        <span>Timesheets</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'invoices'}
                        onClick={() => {
                          if (!handleExternalRedirect('invoices')) {
                            setActiveView('invoices');
                          }
                        }}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Invoices</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'expenses'}
                        onClick={() => setActiveView('expenses')}
                      >
                        <Receipt className="h-4 w-4" />
                        <span>Expenses</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'payroll'}
                        onClick={() => setActiveView('payroll')}
                      >
                        <Wallet className="h-4 w-4" />
                        <span>Payroll</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
           )}



            {user.role !== 'product-admin' && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 py-2 mt-2">Core Modules</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {(permissions.canManageEmployees || permissions.canViewEmployees) && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'employees'}
                        onClick={() => setActiveView('employees')}
                      >
                        <Users className="h-4 w-4" />
                        <span>Employees</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.canManageClients && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'clients'}
                        onClick={() => setActiveView('clients')}
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Clients</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {(permissions.canManageEmployees || permissions.canManageClients) && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'projects'}
                        onClick={() => setActiveView('projects')}
                      >
                        <Briefcase className="h-4 w-4" />
                        <span>Projects</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.canManageClients && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'vendors'}
                        onClick={() => setActiveView('vendors')}
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Vendors</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.canManageClients && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'subvendors'}
                        onClick={() => setActiveView('subvendors')}
                      >
                        <Layers className="h-4 w-4" />
                        <span>Subvendors</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.canManageEmployees && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'contractors'}
                        onClick={() => setActiveView('contractors')}
                      >
                        <Package className="h-4 w-4" />
                        <span>Contractors</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.canManageEmailAgent && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'email-agent'}
                        onClick={() => setActiveView('email-agent')}
                      >
                        <Mail className="h-4 w-4" />
                        <span>Email Agent</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {user.role !== 'product-admin' && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 py-2">Compliance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {permissions.canManageImmigration && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'immigration'}
                        onClick={() => setActiveView('immigration')}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Immigration</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {permissions.canManageLicensing && (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          isActive={activeView === 'licensing'}
                          onClick={() => setActiveView('licensing')}
                        >
                          <FileText className="h-4 w-4" />
                          <span>Licensing</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          isActive={activeView === 'certifications'}
                          onClick={() => setActiveView('certifications')}
                        >
                          <Award className="h-4 w-4" />
                          <span>Certifications</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {user.role !== 'product-admin' && permissions.canAccessEmployeeManagement && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 py-2">Employee Management</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'documents'}
                        onClick={() => setActiveView('documents')}
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>Documents</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'leave'}
                        onClick={() => setActiveView('leave')}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Leave & PTO</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'performance'}
                        onClick={() => setActiveView('performance')}
                      >
                        <Award className="h-4 w-4" />
                        <span>Performance</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'offboarding'}
                        onClick={() => setActiveView('offboarding')}
                      >
                        <UserX className="h-4 w-4" />
                        <span>Offboarding</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Product Admin Tools */}
            {user.role === 'product-admin' && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 py-2">Product Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'product-admin-dashboard'}
                        onClick={() => setActiveView('product-admin-dashboard')}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Platform Analytics</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'subscription-config'}
                        onClick={() => setActiveView('subscription-config')}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Subscription Config</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'user-role-management'}
                        onClick={() => setActiveView('user-role-management')}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>User & Role Management</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Admin Tools */}
            {(user.role === 'admin' || user.role === 'super_admin') && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 py-2">Admin Tools</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'subscription-management'}
                        onClick={() => setActiveView('subscription-management')}
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Subscription</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'external-integrations'}
                        onClick={() => setActiveView('external-integrations')}
                      >
                        <Settings className="h-4 w-4" />
                        <span>External Integrations</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'role-management'}
                        onClick={() => setActiveView('role-management')}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Role Management</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {user.role !== 'product-admin' && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-gray-400 px-3 py-2">Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={activeView === 'settings'}
                        onClick={() => setActiveView('settings')}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Account Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto relative">
          {/* Vibrant Top Header with Gradient */}
          <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-border/40 shadow-sm">
            <div className="px-6 lg:px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {activeView === 'dashboard' && 'Dashboard'}
                    {activeView === 'product-admin-dashboard' && 'Product Admin Dashboard'}
                    {activeView === 'employees' && 'Employees'}
                    {activeView === 'clients' && 'Clients'}
                    {activeView === 'projects' && 'Projects'}
                    {activeView === 'vendors' && 'Vendors'}
                    {activeView === 'subvendors' && 'Subvendors'}
                    {activeView === 'contractors' && 'Contractors'}
                    {activeView === 'immigration' && 'Immigration Management'}
                    {activeView === 'licensing' && 'Business Licensing'}
                    {activeView === 'state-licensing' && 'State Licensing'}
                    {activeView === 'certifications' && 'Certification Tracking'}
                    {activeView === 'timesheets' && 'Timesheets'}
                    {activeView === 'documents' && 'Document Management'}
                    {activeView === 'leave' && 'Leave & PTO'}
                    {activeView === 'offboarding' && 'Offboarding'}
                    {activeView === 'performance' && 'Performance Reviews'}
                    {activeView === 'subscription-management' && 'Subscription Management'}
                    {activeView === 'external-integrations' && 'External Integrations'}
                    {activeView === 'api-test' && 'API Endpoint Testing'}
                    {activeView === 'role-management' && 'Role Management'}
                    {activeView === 'user-role-management' && 'User & Role Management'}
                    {activeView === 'hr-calendar' && 'HR Calendar & Notifications'}
                    {activeView === 'payroll' && 'Payroll Management'}
                    {activeView === 'settings' && 'Account Settings'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Welcome back, {user.name || user.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Search would go here in future */}
                  <UserMenu variant="dropdown" onNavigate={setActiveView} />
                </div>
              </div>
            </div>
          </div>

          {/* Content Area with Enhanced Padding */}
          <div className="px-6 lg:px-8 py-10">
            <div className="slide-up-fade">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
