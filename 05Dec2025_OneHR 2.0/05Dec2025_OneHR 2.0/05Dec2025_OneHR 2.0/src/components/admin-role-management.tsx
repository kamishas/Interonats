import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  Shield,
  Edit,
  Trash2,
  Save,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Settings,
  Users,
  UserPlus,
  Sparkles,
  Lock,
  Star,
  Copy,
  Check,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken, API_ENDPOINTS, PERMISSION_MAP } from '../lib/constants';
import { UserRole, getRoleDisplayName, ROLE_PERMISSIONS } from '../types/auth';
import { useAuth } from '../lib/auth-context';

interface CustomRole {
  id: string;
  roleName: string;
  displayName: string;
  description: string;
  permissions: RolePermissions;
  organizationId: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface RolePermissions {
  [key: string]: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  organizationId?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

// NOTE: Permission metadata comes from `PERMISSION_MAP` in constants
// System roles are loaded from the /roles API and stored in component state

export function AdminRoleManagement() {
  const { user: currentUser } = useAuth();
  const [selectedSystemRoles, setSelectedSystemRoles] = useState<UserRole[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [systemRoles, setSystemRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles');
  
  // Helper function to copy text with fallback
  const copyToClipboard = async (text: string) => {
    try {
      // Try modern Clipboard API first if available and in secure context
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Invite link copied to clipboard!');
      } else {
        throw new Error('Clipboard API unavailable or non-secure context');
      }
    } catch (err) {
      // Fallback for when Clipboard API is blocked or unavailable
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success('Invite link copied to clipboard!');
        } else {
          throw new Error('Copy command failed');
        }
      } catch (fallbackErr) {
        console.error('Failed to copy text: ', fallbackErr);
        toast.error('Failed to copy. Please manually copy the link.');
      }
    }
  };
  
  // Dialog state for add user
  const [showOnboardUser, setShowOnboardUser] = useState(false);
  
  // Users
  const [usersWithCustomRoles, setUsersWithCustomRoles] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Onboard user form (first/last name)
  const [onboardUserFirstName, setOnboardUserFirstName] = useState('');
  const [onboardUserLastName, setOnboardUserLastName] = useState('');
  const [onboardUserEmail, setOnboardUserEmail] = useState('');
  const [onboardUserRole, setOnboardUserRole] = useState<string>('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  
  // Invite link state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [createdUserName, setCreatedUserName] = useState('');
  
  // Delete user state
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Create/Edit dialogs
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  
  // New role form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<RolePermissions>({});
  
  // Edit role form
  const [editRoleDisplayName, setEditRoleDisplayName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editRolePermissions, setEditRolePermissions] = useState<RolePermissions>({});

  // Build permission categories dynamically from PERMISSION_MAP
  const PERMISSION_CATEGORIES_DYNAMIC: Record<string, string[]> = Object.entries(PERMISSION_MAP).reduce((acc, [key, meta]) => {
    const cat = meta.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(key);
    return acc;
  }, {} as Record<string, string[]>);

  useEffect(() => {
    loadRoles();
  }, []);

  // Helper to build a stable, unique key for role-like objects
  const roleKey = (role: any, prefix = 'role', idx?: number) => {
    const id = role?.role_id ?? role?.id ?? role?.role_name ?? role?.roleName ?? role?.role_display_name ?? role?.displayName;
    return `${prefix}-${String(id ?? idx ?? 'unknown')}`;
  };

  const loadRoles = async () => {
    console.log('=== LOADING ROLES ===');
    setLoading(true);
    try {
      console.log('xxxxxxxxxxxxxx This Should never be called');
      console.log('Current user:', currentUser);
      console.log('Current organizationId:', currentUser?.organizationId);
      
      // Fetch roles via ROLE_MGMT /roles endpoint (POST with organization_id)
      const response = await fetch(`${API_ENDPOINTS.ROLE_MGMT}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organization_id: currentUser?.organizationId }),
      });

      console.log('Fetch response status:', response.status);
      console.log('Fetch response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Raw data from API:', data);
        
        const roles = Array.isArray(data) ? data : data.roles || [];
        console.log('Parsed roles array:', roles);
        console.log('Total roles from API:', roles.length);
        
        // Filter to only show roles for current organization
        // If user has no organizationId (like admin), show all roles
        /*
        const orgRoles = currentUser?.organizationId 
          ? roles.filter((role: CustomRole) => {
              console.log(`Checking role "${role?.role_name ?? role?.roleName}": organizationId=${role.organizationId}, matches=${role.organizationId === currentUser?.organizationId}`);
              return role.organizationId === currentUser?.organizationId;
            })
          : roles; // Show all roles if no organizationId
        */
        const orgRoles = roles;
        
        console.log('Filtered org roles:', orgRoles);
        console.log('Number of roles for current org:', orgRoles.length);
        
        // Split system and custom roles
        const sys = orgRoles.filter((r: any) => !!r.is_system_role);
        const custom = orgRoles.filter((r: any) => !r.is_system_role);
        console.log('System roles:', sys);
        console.log('Custom roles:', custom);
        setSystemRoles(sys);
        setCustomRoles(custom);

        // Load users with custom roles
        // Fetch users for organization via ROLE_MGMT /users/all (POST)
        const usersResponse = await fetch(`${API_ENDPOINTS.ROLE_MGMT}/users/all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organization_id: currentUser?.organizationId }),
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const users = Array.isArray(usersData) ? usersData : usersData.users || [];
          
          console.log('All users:', users);
          
          // Filter users with custom roles from this org
          const customRoleNames = custom.map((r: CustomRole) => (r as any).role_name ?? (r as any).roleName);
          console.log('Custom role names:', customRoleNames);
          
          const usersWithCustom = users.filter((u: User) => 
            customRoleNames.includes(u.role) && u.organizationId === currentUser?.organizationId
          );
          
          console.log('Users with custom roles:', usersWithCustom);
          
          // Filter ALL users to only show those from current organization
          /*
          const orgUsers = currentUser?.organizationId
            ? users.filter((u: User) => u.organizationId === currentUser?.organizationId)
            : users;
          */
          const orgUsers = users;
          
          console.log('Users in current organization:', orgUsers);
          console.log('User IDs:', orgUsers.map((u: User) => ({ email: u.email, id: u.id })));
          
          setUsersWithCustomRoles(usersWithCustom);
          setAllUsers(orgUsers);
        }
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error loading custom roles:', error);
      toast.error('Failed to load custom roles');
    } finally {
      setLoading(false);
      console.log('=== LOADING ROLES COMPLETE ===');
    }
  };

  const createCustomRole = async () => {
    console.log('=== CREATE CUSTOM ROLE FUNCTION CALLED ===');
    console.log('newRoleName:', newRoleName);
    console.log('newRoleDisplayName:', newRoleDisplayName);
    console.log('newRoleDescription:', newRoleDescription);
    console.log('newRolePermissions:', newRolePermissions);
    
    if (!newRoleName || !newRoleDisplayName) {
      console.log('❌ Validation failed: Missing role name or display name');
      toast.error('Please provide role name and display name');
      return;
    }

    // Validate role name format
    const roleNameRegex = /^[a-z0-9-]+$/;
    const formattedRoleName = newRoleName.toLowerCase().replace(/\s+/g, '-');
    
    console.log('Formatted role name:', formattedRoleName);
    
    if (!roleNameRegex.test(formattedRoleName)) {
      console.log('❌ Validation failed: Invalid role name format');
      toast.error('Role name must contain only lowercase letters, numbers, and hyphens');
      return;
    }

    // Check against system roles
    const systemRoles = [
      'product-admin', 'admin', 'hr', 'recruiter', 'accounting-manager',
      'immigration-team', 'licensing-team', 'accounting-team', 'client-admin',
      'employee'
    ];
    
    if (systemRoles.includes(formattedRoleName)) {
      console.log('❌ Validation failed: System role name conflict');
      toast.error(`Cannot use "${formattedRoleName}" - this is a reserved system role name. Try "${formattedRoleName}-custom" or "${formattedRoleName}-specialist" instead.`);
      return;
    }

    // Check for duplicate role names
    const existingCustomRoles = customRoles.map(r => (r as any).role_name ?? (r as any).roleName);
    console.log('Existing custom roles:', existingCustomRoles);
    console.log('Trying to create role with name:', formattedRoleName);
    
    if (customRoles.some(r => ((r as any).role_name ?? (r as any).roleName) === formattedRoleName)) {
      console.log('❌ Validation failed: Duplicate role name');
      toast.error(`A custom role with the name "${formattedRoleName}" already exists in your organization. Please choose a different name.`);
      return;
    }

    console.log('✅ All validations passed. Sending request to API...');

    try {
      const requestBody = {
        roleName: formattedRoleName,
        displayName: newRoleDisplayName,
        description: newRoleDescription,
        permissions: newRolePermissions,
        organizationId: currentUser?.organizationId,
        createdBy: currentUser?.id,
      };
      
      console.log('Request body:', requestBody);
      console.log('xxxxxxxxAPI URL:', `${API_ENDPOINTS.ROLE_MGMT}/create_role`);

      // Create role via ROLE_MGMT /roles (POST)
      const response = await fetch(`${API_ENDPOINTS.ROLE_MGMT}/create_role`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: currentUser?.organizationId,
          role_name: formattedRoleName,
          role_display_name: newRoleDisplayName,
          role_description: newRoleDescription,
          role_permissions: newRolePermissions,
          is_system_role: false,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('✅ Role created successfully!');
        toast.success(`Custom role "${newRoleDisplayName}" created successfully`);
        await loadRoles();
        setShowCreateRole(false);
        resetNewRoleForm();
      } else {
        console.log('❌ Server error:', responseData.error);
        throw new Error(responseData.error || 'Failed to create custom role');
      }
    } catch (error) {
      console.error('❌ Error creating custom role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create custom role');
    }
  };

  const updateCustomRole = async () => {
    if (!selectedRole) return;

    try {
      // Update role via ROLE_MGMT /update_role/{role_id}
      const roleId = (selectedRole as any).role_id || (selectedRole as any).id;
      const response = await fetch(`${API_ENDPOINTS.ROLE_MGMT}/update_role/${roleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: currentUser?.organizationId,
          role_name: (selectedRole as any).role_name ?? (selectedRole as any).roleName,
          role_display_name: editRoleDisplayName,
          role_description: editRoleDescription,
          role_permissions: editRolePermissions,
          is_system_role: false,
        }),
      });

      if (response.ok) {
        toast.success(`Role "${editRoleDisplayName}" updated successfully`);
        await loadRoles();
        setShowEditRole(false);
        setSelectedRole(null);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Update role error:', err);
        throw new Error(err?.message || 'Failed to update custom role');
      }
    } catch (error) {
      console.error('Error updating custom role:', error);
      toast.error('Failed to update custom role');
    }
  };

  const deleteCustomRole = async (role: CustomRole) => {
    const usersWithRole = usersWithCustomRoles.filter(u => u.role === ((role as any).role_name ?? (role as any).roleName));
    const usersCount = usersWithRole.length;
    
    // If users have this role, show them a detailed warning
    if (usersCount > 0) {
      const userList = usersWithRole.slice(0, 3).map(u => u.name).join(', ');
      const moreUsers = usersCount > 3 ? ` and ${usersCount - 3} more` : '';
      
      toast.error(`Cannot delete "${(role as any).role_display_name ?? (role as any).displayName}"`, {
        description: `This role is assigned to ${usersCount} user(s): ${userList}${moreUsers}. Please reassign these users to a different role first.`,
        duration: 6000,
      });
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete the role "${(role as any).role_display_name ?? (role as any).displayName}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Delete role via ROLE_MGMT /delete_role/{role_id} (POST with organization_id)
      const roleId = (role as any).role_id || (role as any).id;
      const response = await fetch(`${API_ENDPOINTS.ROLE_MGMT}/delete_role/${roleId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organization_id: currentUser?.organizationId }),
      });

      if (response.ok) {
        toast.success(`Role "${(role as any).role_display_name ?? (role as any).displayName}" deleted successfully`);
        await loadRoles();
      } else {
        const errorData = await response.json().catch(() => ({}));
        // Show specific error message from server
        if (errorData.userCount && errorData.userCount > 0) {
          toast.error(`Cannot delete "${(role as any).role_display_name ?? (role as any).displayName}"`, {
            description: `${errorData.userCount} user(s) currently have this role. Please reassign them first.`,
            duration: 5000,
          });
        } else {
          const errorMessage = errorData.detail ? JSON.stringify(errorData.detail) : errorData.error || 'Failed to delete custom role';
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error deleting custom role:', error);
      toast.error('An unexpected error occurred while deleting the role');
    }
  };

  const openEditDialog = (role: CustomRole) => {
    setSelectedRole(role);
    setEditRoleDisplayName((role as any).role_display_name ?? (role as any).displayName ?? '');
    setEditRoleDescription((role as any).role_description ?? (role as any).description ?? '');
    setEditRolePermissions((role as any).role_permissions ?? (role as any).permissions ?? {});
    setShowEditRole(true);
  };

  const resetNewRoleForm = () => {
    setNewRoleName('');
    setNewRoleDisplayName('');
    setNewRoleDescription('');
    setNewRolePermissions({});
  };

  const togglePermission = (permission: string, isNewRole: boolean = true) => {
    if (isNewRole) {
      setNewRolePermissions(prev => ({
        ...prev,
        [permission]: !prev[permission],
      }));
    } else {
      setEditRolePermissions(prev => ({
        ...prev,
        [permission]: !prev[permission],
      }));
    }
  };

  const getPermissionCount = (permissions?: RolePermissions | null) => {
    if (!permissions) return 0;
    try {
      const obj = typeof permissions === 'object' && permissions !== null ? permissions : {};
      return Object.values(obj).filter(Boolean).length;
    } catch (err) {
      console.warn('Invalid permissions object:', permissions, err);
      return 0;
    }
  };

  const onboardUser = async () => {
    if (!onboardUserFirstName || !onboardUserLastName || !onboardUserEmail || !onboardUserRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsOnboarding(true);
    try {
      const firstName = onboardUserFirstName.trim();
      const lastName = onboardUserLastName.trim();

      // If admin doesn't have organizationId, try to get an existing one
      let organizationId = currentUser?.organizationId;
      
      if (!organizationId) {
        console.log('xxxxxxxxxxxxxx This Should never be called');
        console.log('Admin has no organizationId, fetching existing organizations...');
        
        // Try to fetch existing organizations
        try {
          const orgsResponse = await fetch(`${API_ENDPOINTS.ROLE_MGMT}/organizations`, {
            headers: {
              'Authorization': `Bearer ${getAccessToken() ?? ''}`,
            },
          });
          
          if (orgsResponse.ok) {
            const orgsData = await orgsResponse.json();
            const organizations = Array.isArray(orgsData) ? orgsData : orgsData.organizations || [];
            
            console.log('Fetched organizations:', organizations);
            
            if (organizations.length > 0) {
              // Use the first organization
              organizationId = organizations[0].id;
              console.log('Using existing organization:', organizationId);
            } else {
              // Create a new organization with proper structure
              console.log('No organizations found, creating new one...');
              
              const newOrgResponse = await fetch(`${API_ENDPOINTS.SIGNUP}/signup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  firstName: 'Demo',
                  lastName: 'Admin',
                  email: `demo-admin-${Date.now()}@example.com`,
                  password: 'demo-password-123',
                  organizationName: 'Demo Organization',
                  selectedPlan: 'free',
                }),
              });
              
              if (newOrgResponse.ok) {
                const newOrgData = await newOrgResponse.json();
                organizationId = newOrgData.organization.id;
                console.log('Created new organization:', organizationId);
              } else {
                const errorData = await newOrgResponse.json();
                console.error('Failed to create organization:', errorData);
                throw new Error('Unable to create organization for testing');
              }
            }
          }
        } catch (error) {
          console.error('Error handling organization:', error);
          toast.error('Unable to onboard user: Could not find or create an organization. Please contact support.');
          setIsOnboarding(false);
          return;
        }
      }

      const requestBody = {
        email: onboardUserEmail,
        role: onboardUserRole,
        first_name: firstName,
        last_name: lastName,
        organization_name: currentUser?.organizationName || currentUser?.organizationId || '',
      };

      console.log('Onboarding user with data:', requestBody);

      // Use ROLE_INVITE /invite to invite a user
      const inviteResponse = await fetch(`${API_ENDPOINTS.ROLE_INVITE}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Invite response status:', inviteResponse.status);
      const responseData = await inviteResponse.json();
      console.log('Invite response data:', responseData);

      if (inviteResponse.ok) {
        const fullName = `${firstName} ${lastName}`.trim();
        toast.success(`User "${fullName}" invited successfully`);
        await loadRoles();

        // Use invite link from API if provided
        const generatedInviteLink = responseData.invite_link || `${window.location.origin}`;

        setCreatedUserName(fullName);
        setInviteLink(generatedInviteLink);
        setShowInviteDialog(true);

        // Reset form
        setOnboardUserFirstName('');
        setOnboardUserLastName('');
        setOnboardUserEmail('');
        setOnboardUserRole('');
      } else {
        throw new Error(responseData.error || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error onboarding user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to onboard user');
    } finally {
      setIsOnboarding(false);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    console.log('Deleting user:', userToDelete);
    console.log('User ID:', userToDelete.id);
    console.log('Delete URL:', `${API_ENDPOINTS.ROLE_MGMT}/users/${userToDelete.id}`);
    
    setIsDeletingUser(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.ROLE_MGMT}/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);
      
      const responseData = await response.json();
      console.log('Delete response data:', responseData);

      if (response.ok) {
        toast.success(`User "${userToDelete.name}" deleted successfully`);
        await loadRoles(); // Reload all users
        setShowDeleteUserDialog(false);
        setUserToDelete(null);
      } else {
        throw new Error(responseData.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading role management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-400/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">Role & Permission Management</h1>
              <p className="text-muted-foreground">
                Create and manage custom roles with specific permissions for your organization
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {customRoles.length > 0 && (
            <Button 
              onClick={async () => {
                console.log('xxxxxxxxxxxxxx This Should never be called');

                if (!confirm(`Are you sure you want to delete all ${customRoles.length} custom role(s)? This action cannot be undone.`)) {
                  return;
                }
                try {
                  for (const role of customRoles) {
                    const roleId = (role as any).role_id || (role as any).id;
                    await fetch(`${API_ENDPOINTS.ROLE_MGMT}/delete_role/${roleId}`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${getAccessToken() ?? ''}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ organization_id: currentUser?.organizationId }),
                    });
                  }
                  toast.success('All custom roles deleted successfully');
                  await loadRoles();
                } catch (error) {
                  console.error('Error deleting roles:', error);
                  toast.error('Failed to delete some roles');
                }
              }}
              variant="outline"
              size="lg"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
              Clear All Roles
            </Button>
          )}
          <Button onClick={() => setShowCreateRole(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Custom Role
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none backdrop-blur-xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-700">Custom Roles</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{customRoles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-purple-600/70">Roles created for your organization</p>
          </CardContent>
        </Card>
        <Card className="border-none backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700">System Roles</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{systemRoles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-600/70">Built-in roles available</p>
          </CardContent>
        </Card>
        <Card className="border-none backdrop-blur-xl bg-gradient-to-br from-teal-50/80 to-cyan-50/80 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="text-teal-700">Users with Custom Roles</CardDescription>
            <CardTitle className="text-3xl text-teal-600">{usersWithCustomRoles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-teal-600/70">Active assignments</p>
          </CardContent>
        </Card>
        <Card className="border-none backdrop-blur-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
            <CardDescription className="text-indigo-700">Total Permissions</CardDescription>
            <CardTitle className="text-3xl text-indigo-600">
              {Object.keys(PERMISSION_MAP).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-indigo-600/70">Available to configure</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Info Alert with glassmorphism */}
          <Alert className="border-none backdrop-blur-xl bg-white/40 shadow-lg shadow-blue-500/10">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-gray-900">Role Management</AlertTitle>
            <AlertDescription className="text-gray-700">
              Create custom roles tailored to your organization's needs and view built-in system roles. 
              Each role has specific permissions that determine what users can access and manage.
            </AlertDescription>
          </Alert>

          {/* Custom Roles Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg">Custom Roles</h3>
                <p className="text-sm text-muted-foreground">Roles tailored to your organization's workflow</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 px-3 py-1">
                  {customRoles.length} Custom
                </Badge>
                <Button 
                  onClick={() => setShowCreateRole(true)} 
                  className="gradient-teal-blue text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Role
                </Button>
              </div>
            </div>

          {/* Custom Roles Grid */}
          {customRoles.length === 0 ? (
            <Card className="border-none backdrop-blur-xl bg-white/40 shadow-lg">
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg mb-2">No Custom Roles Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Get started by creating your first custom role with specific permissions tailored to your organization's workflow.
                  </p>
                  <Button onClick={() => setShowCreateRole(true)} size="lg" className="gradient-teal-blue text-white">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Role
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customRoles.map((role) => {
                const permissionCount = getPermissionCount((role as any).role_permissions ?? (role as any).permissions ?? {});
                const usersCount = usersWithCustomRoles.filter(u => u.role === ((role as any).role_name ?? (role as any).roleName)).length;

                return (
                  <Card key={roleKey(role, 'custom')} className="border-none backdrop-blur-xl bg-white/50 hover:bg-white/70 transition-all shadow-lg hover:shadow-xl hover:shadow-purple-500/20">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base truncate">{(role as any).role_display_name ?? role.displayName}</CardTitle>
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 shrink-0">
                              <Star className="h-3 w-3 mr-1" />
                              Custom
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {permissionCount} permission{permissionCount !== 1 ? 's' : ''} • {usersCount} user{usersCount !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {((role as any).role_description ?? role.description) && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {(role as any).role_description ?? role.description}
                        </p>
                      )}

                      {/* Key Permissions Preview */}
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Key Permissions:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(role.role_permissions)
                            .filter(([_, value]) => value)
                            .slice(0, 3)
                            .map(([key]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {PERMISSION_MAP[key]?.display?.split(' (')[0] || key}
                              </Badge>
                            ))}
                          {permissionCount > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{permissionCount - 3} more
                            </Badge>
                          )}
                          {permissionCount === 0 && (
                            <span className="text-xs text-muted-foreground italic">No permissions set</span>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openEditDialog(role)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCustomRole(role)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Users with Custom Roles */}
          {usersWithCustomRoles.length > 0 && (
            <Card className="border-none backdrop-blur-xl bg-white/60 shadow-lg">
              <CardHeader>
                <CardTitle>Users with Custom Roles</CardTitle>
                <CardDescription>
                  {usersWithCustomRoles.length} user{usersWithCustomRoles.length !== 1 ? 's' : ''} assigned to custom roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow key="header-custom-roles" className="gradient-teal-blue">
                        <TableHead className="text-white">User</TableHead>
                        <TableHead className="text-white">Custom Role</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Assigned On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersWithCustomRoles.map((user, index) => {
                        const role = customRoles.find(r => ((r as any).role_name ?? (r as any).roleName) === user.role);
                        return (
                          <TableRow key={user.id || `user-custom-${index}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                                {(role as any)?.role_display_name ?? role?.displayName ?? user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : user.status === 'suspended'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          </div>

          <Separator className="my-8" />

          {/* System Roles Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg">System Roles</h3>
                <p className="text-sm text-muted-foreground">Built-in roles with predefined permissions (Read-Only)</p>
              </div>
              <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 px-3 py-1">
                <Lock className="h-3 w-3 mr-1" />
                {systemRoles.length} System
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemRoles.map((roleObj) => {
                const permissions = roleObj.role_permissions || {};
                const permissionCount = getPermissionCount(permissions);
                const displayName = (roleObj as any).role_display_name ?? (roleObj as any).displayName ?? (roleObj as any).role_name ?? (roleObj as any).roleName;

                return (
                  <Card key={roleKey(roleObj, 'system')} className="border-none backdrop-blur-xl bg-white/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{displayName}</CardTitle>
                            <Lock className="h-3 w-3 text-gray-500" />
                          </div>
                          <CardDescription className="text-xs">
                            {permissionCount} permission{permissionCount !== 1 ? 's' : ''} enabled
                          </CardDescription>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Permissions List */}
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Permissions:</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {Object.entries(permissions)
                            .filter(([_, value]) => value)
                            .map(([key]) => (
                              <div key={key} className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                <span>{PERMISSION_MAP[key]?.display || key}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Info Alert with glassmorphism */}
          <Alert className="border-none backdrop-blur-xl bg-white/40 shadow-lg shadow-teal-500/10">
            <Users className="h-4 w-4 text-teal-600" />
            <AlertTitle className="text-gray-900">User Management</AlertTitle>
            <AlertDescription className="text-gray-700">
              View and manage all users in your organization. Add new users and assign them roles with specific permissions.
            </AlertDescription>
          </Alert>

          <Card className="border-none backdrop-blur-xl bg-white/60 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} in your organization
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowOnboardUser(true)} 
                className="gradient-teal-blue text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow key="header-all-users" className="gradient-teal-blue">
                      <TableHead className="text-white">User</TableHead>
                      <TableHead className="text-white">Role</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Joined On</TableHead>
                      <TableHead className="text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                              <Users className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg mb-2">No Users Yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                              Get started by adding your first user to the organization.
                            </p>
                            <Button onClick={() => setShowOnboardUser(true)} className="gradient-teal-blue text-white">
                              <UserPlus className="h-5 w-5 mr-2" />
                              Add Your First User
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allUsers.map((user, index) => {
                        console.log('*****User:', user);
                        const role = customRoles.find(r => ((r as any).role_name ?? (r as any).role_name) === user.role_name);
                        return (
                          <TableRow key={user.id || `user-all-${index}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {role ? (
                                <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                                  <Star className="h-3 w-3 mr-1" />
                                <div>
                                  <p className="font-medium">{role.role_display_name}</p>
                                  <p className="text-xs text-muted-foreground">{role.role_name}</p>
                                </div>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                                <div>
                                  <p className="font-medium">{user.role_display_name}</p>
                                  <p className="text-xs text-muted-foreground">{user.role_name}</p>
                                </div>
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : user.status === 'suspended'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if ((user as any).role_name === 'admin') return;
                                  setUserToDelete(user);
                                  setShowDeleteUserDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={user.id === currentUser?.id || (user as any).role_name === 'admin'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Roles Reference Tab */}
        <TabsContent value="system-roles" className="space-y-6">
          <Alert className="border-gray-200 bg-gray-50">
            <Lock className="h-4 w-4 text-gray-600" />
            <AlertTitle className="text-gray-900">System Roles (Read-Only)</AlertTitle>
            <AlertDescription className="text-gray-700">
              These are built-in roles with predefined permissions. You cannot modify these roles, 
              but you can use them as a reference when creating custom roles.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemRoles.map((roleObj) => {
              const permissions = roleObj.role_permissions || {};
              const permissionCount = getPermissionCount(permissions);
              const displayName = (roleObj as any).role_display_name ?? (roleObj as any).displayName ?? (roleObj as any).role_name ?? (roleObj as any).roleName;

              return (
                <Card key={roleKey(roleObj, 'system-ref')} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-base">{displayName}</CardTitle>
                        <CardDescription className="text-xs">
                          {permissionCount} permission{permissionCount !== 1 ? 's' : ''} enabled
                        </CardDescription>
                      </div>
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Permissions List */}
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Permissions:</div>
                      <div className="space-y-1">
                        {Object.entries(permissions)
                          .filter(([_, value]) => value)
                          .map(([key]) => (
                            <div key={key} className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span>{PERMISSION_MAP[key]?.display || key}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Custom Role Dialog */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Create Custom Role
            </DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions tailored to your organization's needs
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Basic Information</h3>
                  <div className="space-y-4 pl-4 border-l-2 border-purple-200">
                    <div className="space-y-2">
                      <Label htmlFor="roleName">
                        Role Name (Internal) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="roleName"
                        placeholder="e.g., project-manager"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Lowercase letters, numbers, and hyphens only. Used as the internal identifier.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayName">
                        Display Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="displayName"
                        placeholder="e.g., Project Manager"
                        value={newRoleDisplayName}
                        onChange={(e) => setNewRoleDisplayName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Human-readable name shown throughout the application
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        placeholder="Brief description of this role's purpose"
                        value={newRoleDescription}
                        onChange={(e) => setNewRoleDescription(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Help others understand when to assign this role
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Permissions</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Select the actions and features users with this role can access
                  </p>
                </div>

                {Object.entries(PERMISSION_CATEGORIES_DYNAMIC).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-3 pl-4">
                      {permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-start justify-between gap-4 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={`new-${permission}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {PERMISSION_MAP[permission]?.display || permission}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {PERMISSION_MAP[permission]?.description || 'No description available'}
                            </p>
                          </div>
                          <Switch
                            id={`new-${permission}`}
                            checked={newRolePermissions[permission] || false}
                            onCheckedChange={() => togglePermission(permission, true)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <Alert className="border-purple-200 bg-purple-50">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-900">Summary</AlertTitle>
                <AlertDescription className="text-purple-800">
                  {getPermissionCount(newRolePermissions)} permission{getPermissionCount(newRolePermissions) !== 1 ? 's' : ''} selected
                  {newRoleDisplayName && ` for "${newRoleDisplayName}"`}
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRole(false);
                resetNewRoleForm();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={createCustomRole}
              disabled={!newRoleName || !newRoleDisplayName}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Custom Role Dialog */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-purple-600" />
              Edit Role: {selectedRole?.displayName}
            </DialogTitle>
            <DialogDescription>
              Modify permissions and settings for this custom role
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Basic Information</h3>
                  <div className="space-y-4 pl-4 border-l-2 border-purple-200">
                    <div className="space-y-2">
                      <Label>Role Name (Internal)</Label>
                        <Input
                        value={(selectedRole as any)?.role_name ?? selectedRole?.roleName ?? ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Role name cannot be changed after creation
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editDisplayName">Display Name</Label>
                      <Input
                        id="editDisplayName"
                        value={editRoleDisplayName}
                        onChange={(e) => setEditRoleDisplayName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editDescription">Description</Label>
                      <Input
                        id="editDescription"
                        value={editRoleDescription}
                        onChange={(e) => setEditRoleDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Permissions</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Adjust the permissions for this role
                  </p>
                </div>

                {Object.entries(PERMISSION_CATEGORIES_DYNAMIC).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-3 pl-4">
                      {permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-start justify-between gap-4 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={`edit-${permission}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {PERMISSION_MAP[permission]?.display || permission}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {PERMISSION_MAP[permission]?.description || 'No description available'}
                            </p>
                          </div>
                          <Switch
                            id={`edit-${permission}`}
                            checked={editRolePermissions[permission] || false}
                            onCheckedChange={() => togglePermission(permission, false)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <Alert className="border-purple-200 bg-purple-50">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-900">Summary</AlertTitle>
                <AlertDescription className="text-purple-800">
                  {getPermissionCount(editRolePermissions)} permission{getPermissionCount(editRolePermissions) !== 1 ? 's' : ''} enabled for "{editRoleDisplayName}"
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditRole(false);
                setSelectedRole(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={updateCustomRole}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showOnboardUser} onOpenChange={setShowOnboardUser}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account and assign them a role in your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="onboardUserFirstName">First Name *</Label>
                <Input
                  id="onboardUserFirstName"
                  placeholder="e.g., John"
                  value={onboardUserFirstName}
                  onChange={(e) => setOnboardUserFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboardUserLastName">Last Name *</Label>
                <Input
                  id="onboardUserLastName"
                  placeholder="e.g., Doe"
                  value={onboardUserLastName}
                  onChange={(e) => setOnboardUserLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboardUserEmail">Email *</Label>
              <Input
                id="onboardUserEmail"
                type="email"
                placeholder="e.g., john.doe@example.com"
                value={onboardUserEmail}
                onChange={(e) => setOnboardUserEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="onboardUserRole">Role *</Label>
              <Select
                value={onboardUserRole}
                onValueChange={(value) => setOnboardUserRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Custom Roles</div>
                  {customRoles.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground italic">
                      No custom roles available
                    </div>
                  ) : (
                    customRoles.map((role, idx) => (
                      <SelectItem
                        key={roleKey(role, 'custom-select', idx)}
                        value={String((role as any).role_name ?? (role as any).roleName ?? role.id ?? `custom-${idx}`)}
                      >
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-purple-600" />
                          {(role as any).role_display_name ?? role.displayName}
                        </div>
                      </SelectItem>
                    ))
                  )}
                  <Separator className="my-1" />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">System Roles</div>
                  {systemRoles.map((role, idx) => (
                    <SelectItem
                      key={roleKey(role, 'system-select', idx)}
                      value={String((role as any).role_name ?? (role as any).roleName ?? (role as any).id ?? `system-${idx}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-blue-600" />
                        <span>{(role as any).role_display_name ?? (role as any).displayName ?? (role as any).roleName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                New users will receive an email with instructions to set up their account.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOnboardUser(false);
                setOnboardUserFirstName('');
                setOnboardUserLastName('');
                setOnboardUserEmail('');
                setOnboardUserRole('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await onboardUser();
                setShowOnboardUser(false);
              }}
              disabled={!onboardUserFirstName || !onboardUserLastName || !onboardUserEmail || !onboardUserRole || isOnboarding}
              className="gradient-teal-blue text-white"
            >
              {isOnboarding ? (
                <>
                  <span className="mr-2">Adding...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              User Created Successfully!
            </DialogTitle>
            <DialogDescription>
              {createdUserName} has been added to your organization. Share the invite link below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                The user can use this link to accept the invite and set up their account.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Invite Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm bg-gray-50"
                />
                <Button
                  onClick={() => copyToClipboard(inviteLink)}
                  className="gradient-teal-blue text-white shrink-0"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link contains the invite token/link. Share it securely.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                What happens next?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1.5 ml-6 list-disc">
                <li>Share this invite link with {createdUserName}</li>
                <li>They can use the link to accept the invitation and set up their account</li>
                <li>After accepting, they'll set their password and complete account setup</li>
                <li>Once completed, they can access the platform normally</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowInviteDialog(false);
                setInviteLink('');
                setCreatedUserName('');
              }}
              className="gradient-teal-blue text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this user?
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="py-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium mb-1">You are about to delete:</div>
                  <div className="text-sm">
                    <div><strong>Name:</strong> {userToDelete.name}</div>
                    <div><strong>Email:</strong> {userToDelete.email}</div>
                    <div><strong>Role:</strong> {getRoleDisplayName(userToDelete.role as UserRole)}</div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteUserDialog(false);
                setUserToDelete(null);
              }}
              disabled={isDeletingUser}
            >
              Cancel
            </Button>
            <Button
              onClick={deleteUser}
              disabled={isDeletingUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingUser ? (
                <>
                  <span className="mr-2">Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
