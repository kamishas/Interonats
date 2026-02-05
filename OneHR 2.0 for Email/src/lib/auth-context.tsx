import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { AuthContextType, User, UserRole, RolePermissions, ROLE_PERMISSIONS } from '../types/auth';
import { emailAgentApi } from './email-agent-api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock permissions for now as the external API doesn't expose a permissions endpoint yet
const DEFAULT_PERMISSIONS: RolePermissions = {
  canAccessDashboard: true,
  canViewEmployees: true,
  canManageEmployees: true,
  canManageClients: true,
  canManageImmigration: true,
  canManageLicensing: true,
  canViewTimesheets: true,
  canManageTimesheets: true,
  canManageUsers: true,
  canAccessSettings: true,
  canAccessEmployeeManagement: true,
  canManageSubscriptions: true,
  canViewSystemAnalytics: true,
  canViewPlatformMetrics: true,
  canManageOrganizations: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<RolePermissions | null>(null);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);

  // Initialize auth from local storage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');

      if (storedUser && token && token !== 'undefined' && token !== 'null') {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Set permissions based on role or default
          if (parsedUser.role && parsedUser.role in ROLE_PERMISSIONS) {
            setUserPermissions(ROLE_PERMISSIONS[parsedUser.role as UserRole]);
          } else {
            setUserPermissions(DEFAULT_PERMISSIONS);
          }
        } catch (e) {
          console.error("Failed to parse stored user", e);
          emailAgentApi.auth.logout();
        }
      } else {
        // If token is invalid/missing but we have a user, clear it
        if (storedUser || token) {
          emailAgentApi.auth.logout();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await emailAgentApi.auth.login({ email, password });

      // Handle various token formats (Standard JWT, AWS Cognito, etc.)
      let token = response.token || response.access_token || response.accessToken;

      // Check for nested Cognito structure
      if (!token && response.AuthenticationResult) {
        token = response.AuthenticationResult.AccessToken;
      }

      // Store auth token if found
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        console.warn('Login successful but no token found in response:', response);
      }

      // Adapt response to User type
      const userData: User = {
        id: response.user?.id || 'temp-id',
        email: email,
        name: response.user?.name || email.split('@')[0],
        role: response.user?.role || 'admin', // Default to admin for now
        avatarUrl: response.user?.avatarUrl
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // Permissions logic
      if (userData.role in ROLE_PERMISSIONS) {
        setUserPermissions(ROLE_PERMISSIONS[userData.role as UserRole]);
      } else {
        setUserPermissions(DEFAULT_PERMISSIONS);
      }

      setRequiresPasswordReset(false);
    } catch (error: any) {
      console.error('Login failed:', error);

      // Display user friendly error
      let errorMessage = 'Invalid email or password';
      if (error.message) {
        // Clean up API error prefix if present
        errorMessage = error.message.replace(/^API Error: \d+ - /, '');
        try {
          // Try to parse if it's JSON
          const parsed = JSON.parse(errorMessage);
          if (parsed.detail) errorMessage = parsed.detail;
          else if (parsed.message) errorMessage = parsed.message;
        } catch (e) {
          // Use raw string if not JSON
        }
      }

      toast.error(errorMessage);

      // Ensure we don't leave partial state
      emailAgentApi.auth.logout();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearPasswordResetFlag = () => {
    setRequiresPasswordReset(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      emailAgentApi.auth.logout();
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, userPermissions, requiresPasswordReset, clearPasswordResetFlag }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
