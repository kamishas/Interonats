
export type UserRole = 
  | 'product-admin'
  | 'admin'
  | 'hr'
  | 'recruiter'
  | 'accounting-manager'
  | 'immigration-team'
  | 'licensing-team'
  | 'accounting-team'
  | 'client-admin'
  | 'employee'
  | 'consultant';

export interface RolePermissions {
  [key: string]: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole | string; // Allow custom roles
  avatarUrl?: string;
  organizationId?: string;
  organizationName?: string;
  organizationIcon?: string;
  subscriptionPlan?: string;
  roleDisplayName?: string;
  customPermissions?: RolePermissions; // Store custom role permissions
  permissions?: RolePermissions; // Store effective permissions
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  userPermissions: RolePermissions | null; // Expose computed permissions
  requiresPasswordReset?: boolean; // Flag to indicate if password reset is needed
  clearPasswordResetFlag?: () => void; // Function to clear the password reset flag
}

// Role permissions configuration
export const ROLE_PERMISSIONS = {
  'product-admin': {
    canAccessDashboard: true,
    canViewEmployees: false,           // Product Admin does NOT see employee info
    canManageEmployees: false,         // Product Admin does NOT manage employees
    canManageClients: false,           // Product Admin does NOT manage clients
    canManageImmigration: false,       // Product Admin does NOT see immigration info
    canManageLicensing: false,         // Product Admin does NOT manage licensing
    canViewTimesheets: false,          // Product Admin does NOT view timesheets
    canManageTimesheets: false,        // Product Admin does NOT manage timesheets

    canAccessSettings: false,          // Product Admin does NOT access org settings
    canAccessEmployeeManagement: false,// Product Admin does NOT access employee modules
    canManageSubscriptions: true,      // Product Admin ONLY manages subscriptions
    canViewSystemAnalytics: true,      // Product Admin ONLY views platform analytics
    canViewPlatformMetrics: true,      // Product Admin ONLY views platform metrics
    canManageOrganizations: true,      // Product Admin ONLY manages organizations
    canManageUsers: true,              // Product Admin can manage all users and roles
    canManageEmailAgent: false,
  },
  admin: {
    canAccessDashboard: true,
    canViewEmployees: true,        // Admins can VIEW employees
    canManageEmployees: false,     // Admins CANNOT add/edit/delete employees
    canManageClients: true,
    canManageImmigration: true,
    canManageLicensing: true,
    canViewTimesheets: true,
    canManageTimesheets: true,
    canManageUsers: true,
    canAccessSettings: true,
    canAccessEmployeeManagement: true, // Documents, Leave, Performance, Offboarding (view only)
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: true,
  },
  hr: {
    canAccessDashboard: true,
    canViewEmployees: true,
    canManageEmployees: true,
    canManageClients: true,  // HR can now view and manage clients, vendors, subvendors
    canManageImmigration: true,
    canManageLicensing: true,  // HR can now manage business licensing and certifications
    canViewTimesheets: true,
    canManageTimesheets: true,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: true, // Documents, Leave, Performance, Offboarding
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: true,
  },
  recruiter: {
    canAccessDashboard: true,
    canViewEmployees: true,
    canManageEmployees: true,
    canManageClients: true,
    canManageImmigration: false,
    canManageLicensing: false,
    canViewTimesheets: false,
    canManageTimesheets: false,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: false, // Recruiters do NOT manage these modules
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: true,
  },
  'accounting-manager': {
    canAccessDashboard: true,
    canViewEmployees: true,
    canManageEmployees: true,
    canManageClients: true,
    canManageImmigration: false,
    canManageLicensing: true,
    canViewTimesheets: true,
    canManageTimesheets: true,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: true, // Has access to employee management modules
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: false,
  },
  'immigration-team': {
    canAccessDashboard: true,
    canViewEmployees: true,
    canManageEmployees: false,
    canManageClients: false,
    canManageImmigration: true,
    canManageLicensing: false,
    canViewTimesheets: false,
    canManageTimesheets: false,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: false,
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: false,
  },
  'licensing-team': {
    canAccessDashboard: true,
    canViewEmployees: true,
    canManageEmployees: false,
    canManageClients: false,
    canManageImmigration: false,
    canManageLicensing: true,
    canViewTimesheets: false,
    canManageTimesheets: false,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: false,
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: false,
  },
  'accounting-team': {
    canAccessDashboard: true,
    canViewEmployees: true,
    canManageEmployees: false,
    canManageClients: true,
    canManageImmigration: false,
    canManageLicensing: false,
    canViewTimesheets: true,
    canManageTimesheets: true,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: false,
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: false,
  },
  'client-admin': {
    canAccessDashboard: false,
    canManageEmployees: false,
    canManageClients: false,
    canManageImmigration: false,
    canManageLicensing: false,
    canViewTimesheets: true,
    canManageTimesheets: false,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: false,
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: false,
  },
  employee: {
    canAccessDashboard: false,
    canManageEmployees: false,
    canManageClients: false,
    canManageImmigration: false,
    canManageLicensing: false,
    canViewTimesheets: true,
    canManageTimesheets: false,
    canCompleteOnboarding: true,
    canSignDocuments: true,
    canSubmitTimesheets: true,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: false,
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: false,
  },
};

export function getRolePermissions(role: UserRole | string): RolePermissions {
  // If it's a system role, return its permissions
  if (role in ROLE_PERMISSIONS) {
    return ROLE_PERMISSIONS[role as UserRole];
  }
  
  // For custom roles, return empty permissions (they should be loaded from the backend)
  // This prevents errors when custom roles are encountered
  return {
    canAccessDashboard: false,
    canViewEmployees: false,
    canManageEmployees: false,
    canManageClients: false,
    canManageImmigration: false,
    canManageLicensing: false,
    canViewTimesheets: false,
    canManageTimesheets: false,
    canManageUsers: false,
    canAccessSettings: false,
    canAccessEmployeeManagement: false,
    canManageSubscriptions: false,
    canViewSystemAnalytics: false,
    canViewPlatformMetrics: false,
    canManageOrganizations: false,
    canManageEmailAgent: false,
  };
}

export function getRoleDisplayName(role: UserRole | string): string {
  const displayNames: Record<string, string> = {
    'product-admin': 'Product Administrator',
    admin: 'Administrator',
    hr: 'HR Manager',
    recruiter: 'Recruiter',
    'accounting-manager': 'Accounting Manager',
    'immigration-team': 'Immigration Team',
    'licensing-team': 'Licensing Team',
    'accounting-team': 'Accounting Team',
    'client-admin': 'Client Administrator',
    employee: 'Employee',
  };
  return displayNames[role] || role; // Return role as-is if not found (for custom roles)
}
