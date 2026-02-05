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
    | 'employee';

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
    avatar?: string;
    avatarUrl?: string; // Signed URL for avatar
    organizationId?: string;
    subscriptionPlan?: string;
    customPermissions?: RolePermissions; // Store custom role permissions
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
        canManageSubscriptions: true,
        canViewSystemAnalytics: true,
        canViewPlatformMetrics: true,
        canManageOrganizations: true,
        canManageUsers: true,
    },
    admin: {
        canAccessDashboard: true,
        canViewEmployees: true,
        canManageEmployees: false,
        canManageClients: true,
        canManageImmigration: true,
        canManageLicensing: true,
        canViewTimesheets: true,
        canManageTimesheets: true,
        canManageUsers: true,
        canAccessSettings: true,
        canAccessEmployeeManagement: true,
        canManageSubscriptions: false,
        canViewSystemAnalytics: false,
        canViewPlatformMetrics: false,
        canManageOrganizations: false,
    },
    hr: {
        canAccessDashboard: true,
        canViewEmployees: true,
        canManageEmployees: true,
        canManageClients: true,
        canManageImmigration: true,
        canManageLicensing: true,
        canViewTimesheets: true,
        canManageTimesheets: true,
        canManageUsers: false,
        canAccessSettings: false,
        canAccessEmployeeManagement: true,
        canManageSubscriptions: false,
        canViewSystemAnalytics: false,
        canViewPlatformMetrics: false,
        canManageOrganizations: false,
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
        canAccessEmployeeManagement: false,
        canManageSubscriptions: false,
        canViewSystemAnalytics: false,
        canViewPlatformMetrics: false,
        canManageOrganizations: false,
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
        canAccessEmployeeManagement: true,
        canManageSubscriptions: false,
        canViewSystemAnalytics: false,
        canViewPlatformMetrics: false,
        canManageOrganizations: false,
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
    },
};

export function getRolePermissions(role: UserRole | string): RolePermissions {
    if (role in ROLE_PERMISSIONS) {
        return ROLE_PERMISSIONS[role as UserRole];
    }
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
    };
}
