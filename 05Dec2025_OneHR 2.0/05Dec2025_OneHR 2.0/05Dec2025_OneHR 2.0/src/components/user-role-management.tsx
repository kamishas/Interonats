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
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  Users,
  Shield,
  Edit,
  Trash2,
  Save,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserCog,
  Settings,
  Building2,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import { UserRole, getRoleDisplayName, ROLE_PERMISSIONS } from '../types/auth';
import { useAuth } from '../lib/auth-context';

const API_URL = API_ENDPOINTS.ROLE_MGMT;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin?: string;
}

interface Organization {
  id: string;
  name: string;
  subscriptionPlan: string;
  status: string;
  userCount: number;
}

interface RolePermissions {
  [key: string]: boolean;
}

interface CustomRole {
  id: string;
  roleName: string;
  displayName: string;
  description: string;
  permissions: RolePermissions;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

const ALL_ROLES: UserRole[] = [
  'product-admin',
  'admin',
  'hr',
  'recruiter',
  'accounting-manager',
  'immigration-team',
  'licensing-team',
  'accounting-team',
  'client-admin',
  'employee',
  'consultant',
];

const PERMISSION_CATEGORIES = {
  'Dashboard & Analytics': [
    'canAccessDashboard',
    'canViewSystemAnalytics',
    'canViewPlatformMetrics',
  ],
  'Employee Management': [
    'canViewEmployees',
    'canManageEmployees',
    'canAccessEmployeeManagement',
  ],
  'Client Management': [
    'canManageClients',
  ],
  'Immigration': [
    'canManageImmigration',
  ],
  'Licensing & Certifications': [
    'canManageLicensing',
  ],
  'Timesheets & Invoicing': [
    'canViewTimesheets',
    'canManageTimesheets',
  ],
  'System Administration': [
    'canManageUsers',
    'canAccessSettings',
    'canManageSubscriptions',
    'canManageOrganizations',
    'canManageWorkflowTemplates',
  ],
};

const PERMISSION_LABELS: Record<string, string> = {
  canAccessDashboard: 'Access Dashboard',
  canViewEmployees: 'View Employees',
  canManageEmployees: 'Manage Employees (Add/Edit/Delete)',
  canManageClients: 'Manage Clients',
  canManageImmigration: 'Manage Immigration Cases',
  canManageLicensing: 'Manage Business Licensing',
  canViewTimesheets: 'View Timesheets',
  canManageTimesheets: 'Manage Timesheets & Invoices',
  canManageUsers: 'Manage Users',
  canAccessSettings: 'Access Organization Settings',
  canAccessEmployeeManagement: 'Access Employee Modules (Docs, Leave, Performance)',
  canManageSubscriptions: 'Manage Subscriptions',
  canViewSystemAnalytics: 'View System Analytics',
  canViewPlatformMetrics: 'View Platform Metrics',
  canManageOrganizations: 'Manage Organizations',
  canManageWorkflowTemplates: 'Manage Workflow Templates',
};

export function UserRoleManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRoleConfig, setShowRoleConfig] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | string | null>(null);
  const [selectedCustomRole, setSelectedCustomRole] = useState<CustomRole | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('users');
  
  // New role creation form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<RolePermissions>({});

  // Onboard user form
  const [onboardUserName, setOnboardUserName] = useState('');
  const [onboardUserEmail, setOnboardUserEmail] = useState('');
  const [onboardUserRole, setOnboardUserRole] = useState<string>('');
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Delete organization flow
  const [showDeleteOrgDialog, setShowDeleteOrgDialog] = useState(false);
  const [deleteOrgStep, setDeleteOrgStep] = useState(1);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [deleteOrgConfirmation, setDeleteOrgConfirmation] = useState('');
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      const usersResponse = await fetch(`${API_URL}/users/all`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      }

      // Load organizations
      const orgsResponse = await fetch(`${API_URL}/organizations`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(Array.isArray(orgsData) ? orgsData : orgsData.organizations || []);
      }
      
      // Load custom roles
      const rolesResponse = await fetch(`${API_URL}/custom-roles`, {
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setCustomRoles(Array.isArray(rolesData) ? rolesData : rolesData.roles || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const editUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success('User role updated successfully');
        await loadData();
        setShowEditDialog(false);
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`User ${status === 'active' ? 'activated' : 'suspended'} successfully`);
        await loadData();
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        await loadData();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const configureRolePermissions = (role: UserRole) => {
    setSelectedRole(role);
    const currentPermissions = ROLE_PERMISSIONS[role] || {};
    setRolePermissions(currentPermissions);
    setShowRoleConfig(true);
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      // If it's a custom role, update it
      if (selectedCustomRole) {
        const response = await fetch(`${API_URL}/custom-roles/${selectedCustomRole.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permissions: rolePermissions }),
        });

        if (response.ok) {
          toast.success('Custom role updated successfully');
          await loadData();
          setShowRoleConfig(false);
          setSelectedCustomRole(null);
        } else {
          throw new Error('Failed to update custom role');
        }
      } else {
        // System role - save configuration override
        const response = await fetch(`${API_URL}/roles/${selectedRole}/permissions`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permissions: rolePermissions }),
        });

        if (response.ok) {
          toast.success('Role permissions updated successfully');
          setShowRoleConfig(false);
        } else {
          throw new Error('Failed to update role permissions');
        }
      }
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast.error('Failed to update role permissions');
    }
  };
  
  const createCustomRole = async () => {
    if (!newRoleName || !newRoleDisplayName) {
      toast.error('Please provide role name and display name');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/custom-roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: newRoleName.toLowerCase().replace(/\s+/g, '-'),
          displayName: newRoleDisplayName,
          description: newRoleDescription,
          permissions: newRolePermissions,
        }),
      });

      if (response.ok) {
        toast.success('Custom role created successfully');
        await loadData();
        setShowCreateRole(false);
        // Reset form
        setNewRoleName('');
        setNewRoleDisplayName('');
        setNewRoleDescription('');
        setNewRolePermissions({});
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create custom role');
      }
    } catch (error) {
      console.error('Error creating custom role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create custom role');
    }
  };
  
  const deleteCustomRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this custom role? Users with this role will need to be reassigned.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/custom-roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (response.ok) {
        toast.success('Custom role deleted successfully');
        await loadData();
      } else {
        const errorData = await response.json();
        console.error('Error deleting custom role - response:', errorData);
        
        // Show specific error message from server
        const errorMessage = errorData.details || errorData.error || 'Failed to delete custom role';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting custom role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete custom role');
    }
  };
  
  const configureCustomRole = (role: CustomRole) => {
    setSelectedCustomRole(role);
    setSelectedRole(role.roleName);
    setRolePermissions(role.permissions);
    setShowRoleConfig(true);
  };

  const onboardUser = async () => {
    if (!onboardUserName || !onboardUserEmail || !onboardUserRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Name validation: Alphabets and spaces only
    const nameRegex = /^[a-zA-Z\s\-\']+$/;
    if (!nameRegex.test(onboardUserName)) {
      toast.error('Name should only contain alphabets');
      return;
    }

    setIsOnboarding(true);
    try {
      const response = await fetch(`${API_URL}/users/onboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: onboardUserName,
          email: onboardUserEmail,
          role: onboardUserRole,
          organizationId: currentUser?.organizationId,
        }),
      });

      if (response.ok) {
        toast.success(`User "${onboardUserName}" onboarded successfully`);
        await loadData();
        // Reset form
        setOnboardUserName('');
        setOnboardUserEmail('');
        setOnboardUserRole('');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to onboard user');
      }
    } catch (error) {
      console.error('Error onboarding user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to onboard user');
    } finally {
      setIsOnboarding(false);
    }
  };

  const initiateDeleteOrg = (org: Organization) => {
    setOrgToDelete(org);
    setDeleteOrgStep(1);
    setDeleteOrgConfirmation('');
    setShowDeleteOrgDialog(true);
  };

  const deleteOrganization = async () => {
    if (!orgToDelete) return;

    setIsDeletingOrg(true);
    try {
      const response = await fetch(`${API_URL}/organizations/${orgToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (response.ok) {
        toast.success(`Organization "${orgToDelete.name}" has been permanently deleted`);
        await loadData();
        setShowDeleteOrgDialog(false);
        setOrgToDelete(null);
        setDeleteOrgConfirmation('');
        setDeleteOrgStep(1);
      } else {
        // Try to parse error response, handle empty or non-JSON responses
        let errorMessage = 'Failed to delete organization';
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || `Server error: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
    } finally {
      setIsDeletingOrg(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesOrg = filterOrg === 'all' || user.organizationId === filterOrg;
    return matchesSearch && matchesRole && matchesOrg;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading user management...</p>
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-400/20">
              <UserCog className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">User & Role Management</h1>
              <p className="text-muted-foreground">
                Manage users, roles, and permissions across all organizations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {users.filter((u) => u.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organizations</CardDescription>
            <CardTitle className="text-3xl">{organizations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Custom Roles</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {customRoles.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Suspended</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {users.filter((u) => u.status === 'suspended').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Product Admin View */}
        {currentUser?.role === 'product-admin' && (
          <>
            {/* Product Admin Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Product Admin Access</AlertTitle>
              <AlertDescription className="text-blue-800">
                As a Product Admin, you can only modify the permissions of the Administrator role for each organization. 
                Only Admins can create and manage custom roles for their own organization.
              </AlertDescription>
            </Alert>

            {/* Organizations Table */}
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>
                  Select an organization to edit its Administrator role permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Subscription Plan</TableHead>
                        <TableHead>Admins</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No organizations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        organizations.map((org) => {
                          const adminCount = users.filter(
                            u => u.organizationId === org.id && u.role === 'admin'
                          ).length;
                          
                          return (
                            <TableRow key={org.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{org.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{org.subscriptionPlan}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{adminCount} admin{adminCount !== 1 ? 's' : ''}</span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    org.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : org.status === 'trial'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }
                                >
                                  {org.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedRole('admin');
                                      setRolePermissions(ROLE_PERMISSIONS['admin'] || {});
                                      setShowRoleConfig(true);
                                      setFilterOrg(org.id);
                                    }}
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configure Admin Role
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => initiateDeleteOrg(org)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
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
          </>
        )}

        {/* Admin View */}
        {currentUser?.role === 'admin' && (
          <>
            {/* Tabs for Admin */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="users">Users & Roles</TabsTrigger>
                <TabsTrigger value="onboard">Onboard Users</TabsTrigger>
              </TabsList>

              {/* Users & Roles Tab */}
              <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <Separator className="my-1" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      System Roles
                    </div>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </SelectItem>
                    ))}
                    {customRoles.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Custom Roles
                        </div>
                        {customRoles.map((role) => (
                          <SelectItem key={role.id} value={role.roleName}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Select value={filterOrg} onValueChange={setFilterOrg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p>{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{user.organizationName || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const isCustomRole = customRoles.some(r => r.roleName === user.role);
                              const displayName = isCustomRole 
                                ? customRoles.find(r => r.roleName === user.role)?.displayName || user.role
                                : getRoleDisplayName(user.role);
                              
                              return (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{displayName}</Badge>
                                  {isCustomRole && (
                                    <Badge variant="secondary" className="text-xs">Custom</Badge>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => editUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {user.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserStatus(user.id, 'suspended')}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserStatus(user.id, 'active')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

                {/* System Roles - For Admins */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>System Roles</CardTitle>
                        <CardDescription>
                          Built-in roles with predefined permissions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ALL_ROLES.map((role) => {
                        const permissions = ROLE_PERMISSIONS[role] || {};
                        const permissionCount = Object.values(permissions).filter(Boolean).length;

                        return (
                          <Card key={role} className="border-2">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base">
                                    {getRoleDisplayName(role)}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {permissionCount} permission{permissionCount !== 1 ? 's' : ''} enabled
                                  </CardDescription>
                                </div>
                                <Shield className="h-5 w-5 text-blue-500" />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">
                                  Key Permissions:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(permissions)
                                    .filter(([_, value]) => value)
                                    .slice(0, 3)
                                    .map(([key]) => (
                                      <Badge key={key} variant="secondary" className="text-xs">
                                        {PERMISSION_LABELS[key]?.split(' ')[0] || key}
                                      </Badge>
                                    ))}
                                  {permissionCount > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{permissionCount - 3} more
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full mt-3"
                                  onClick={() => configureRolePermissions(role)}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Configure
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
          
                {/* Custom Roles */}
                <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Custom Roles</CardTitle>
                    <CardDescription>
                      {customRoles.length} custom role{customRoles.length !== 1 ? 's' : ''} created for your organization
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateRole(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {customRoles.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No custom roles created yet
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateRole(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Custom Role
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customRoles.map((role) => {
                      const permissionCount = Object.values(role.permissions).filter(Boolean).length;

                      return (
                        <Card key={role.id} className="border-2 border-purple-200">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">
                                    {role.displayName}
                                  </CardTitle>
                                  <Badge variant="outline" className="text-xs">
                                    Custom
                                  </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                  {permissionCount} permission{permissionCount !== 1 ? 's' : ''} enabled
                                </CardDescription>
                              </div>
                              <Shield className="h-5 w-5 text-purple-500" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {role.description && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {role.description}
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Key Permissions:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(role.permissions)
                                  .filter(([_, value]) => value)
                                  .slice(0, 3)
                                  .map(([key]) => (
                                    <Badge key={key} variant="secondary" className="text-xs">
                                      {PERMISSION_LABELS[key]?.split(' ')[0] || key}
                                    </Badge>
                                  ))}
                                {permissionCount > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{permissionCount - 3} more
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => configureCustomRole(role)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteCustomRole(role.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        {/* Onboard Users Tab - Only visible to Admins */}
          <TabsContent value="onboard" className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Onboard New Users</AlertTitle>
              <AlertDescription className="text-green-800">
                Add new users to your organization and assign them to system roles or custom roles you've created.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
                <CardDescription>
                  Onboard a new user and assign them to a role in your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="onboard-name">Full Name *</Label>
                      <Input
                        id="onboard-name"
                        placeholder="Enter user's full name"
                        value={onboardUserName}
                        onChange={(e) => setOnboardUserName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="onboard-email">Email Address *</Label>
                      <Input
                        id="onboard-email"
                        type="email"
                        placeholder="Enter user's email address"
                        value={onboardUserEmail}
                        onChange={(e) => setOnboardUserEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="onboard-role">Assign Role *</Label>
                      <Select
                        value={onboardUserRole}
                        onValueChange={setOnboardUserRole}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role for this user" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            System Roles
                          </div>
                          {ALL_ROLES.filter(r => r !== 'product-admin').map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleDisplayName(role)}
                            </SelectItem>
                          ))}
                          {customRoles.length > 0 && (
                            <>
                              <Separator className="my-1" />
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Custom Roles
                              </div>
                              {customRoles.map((role) => (
                                <SelectItem key={role.id} value={role.roleName}>
                                  {role.displayName} <span className="text-xs text-muted-foreground">(Custom)</span>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select from system roles or custom roles you've created
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOnboardUserName('');
                        setOnboardUserEmail('');
                        setOnboardUserRole('');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Form
                    </Button>
                    <Button
                      onClick={onboardUser}
                      disabled={isOnboarding || !onboardUserName || !onboardUserEmail || !onboardUserRole}
                    >
                      {isOnboarding ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Onboarding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Onboard User
                        </>
                      )}
                    </Button>
                  </div>

                  {customRoles.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Custom Roles Yet</AlertTitle>
                      <AlertDescription>
                        You haven't created any custom roles yet. Go to the "Role Permissions" tab to create custom roles with specific permissions for your organization.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recently Onboarded Users */}
            <Card>
              <CardHeader>
                <CardTitle>Recently Onboarded Users</CardTitle>
                <CardDescription>
                  Users who have been added in the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter((u) => {
                          const createdDate = new Date(u.createdAt);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return createdDate >= thirtyDaysAgo && u.organizationId === currentUser?.organizationId;
                        })
                        .slice(0, 10)
                        .map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const isCustomRole = customRoles.some(r => r.roleName === user.role);
                                const displayName = isCustomRole
                                  ? customRoles.find(r => r.roleName === user.role)?.displayName || user.role
                                  : getRoleDisplayName(user.role);

                                return (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{displayName}</Badge>
                                    {isCustomRole && (
                                      <Badge variant="secondary" className="text-xs">Custom</Badge>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      {users.filter((u) => {
                        const createdDate = new Date(u.createdAt);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return createdDate >= thirtyDaysAgo && u.organizationId === currentUser?.organizationId;
                      }).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No users onboarded in the last 30 days
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Change the user's role and configuration
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User Information</Label>
                <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                  <p className="text-sm">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Organization: {selectedUser.organizationName || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, role: value as UserRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      System Roles
                    </div>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </SelectItem>
                    ))}
                    {customRoles.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Custom Roles
                        </div>
                        {customRoles.map((role) => (
                          <SelectItem key={role.id} value={role.roleName}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Changing a user's role will immediately affect their access to the system.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser && updateUserRole(selectedUser.id, selectedUser.role)
              }
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Permissions Configuration Dialog */}
      <Dialog open={showRoleConfig} onOpenChange={setShowRoleConfig}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Configure Permissions: {selectedRole && getRoleDisplayName(selectedRole)}
            </DialogTitle>
            <DialogDescription>
              Enable or disable specific permissions for this role
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-6 pr-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-medium">{category}</h3>
                  <div className="space-y-2 pl-4 border-l-2">
                    {permissions.map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex-1">
                          <Label
                            htmlFor={permission}
                            className="text-sm cursor-pointer"
                          >
                            {PERMISSION_LABELS[permission] || permission}
                          </Label>
                        </div>
                        <Switch
                          id={permission}
                          checked={rolePermissions[permission] || false}
                          onCheckedChange={(checked) =>
                            setRolePermissions({
                              ...rolePermissions,
                              [permission]: checked,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleConfig(false)}>
              Cancel
            </Button>
            <Button onClick={saveRolePermissions}>
              <Save className="h-4 w-4 mr-2" />
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Custom Role Dialog */}
      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Create a new role with custom permissions for your organization
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-6 pr-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name (Internal) *</Label>
                  <Input
                    id="roleName"
                    placeholder="e.g., project-manager"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase, no spaces (use hyphens). This is the internal identifier.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., Project Manager"
                    value={newRoleDisplayName}
                    onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Human-readable name shown in the UI
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this role"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Permissions</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Select what this role can access and manage
                  </p>
                </div>

                {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-medium">{category}</h3>
                    <div className="space-y-2 pl-4 border-l-2">
                      {permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex-1">
                            <Label
                              htmlFor={`new-${permission}`}
                              className="text-sm cursor-pointer"
                            >
                              {PERMISSION_LABELS[permission] || permission}
                            </Label>
                          </div>
                          <Switch
                            id={`new-${permission}`}
                            checked={newRolePermissions[permission] || false}
                            onCheckedChange={(checked) =>
                              setNewRolePermissions({
                                ...newRolePermissions,
                                [permission]: checked,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateRole(false);
                setNewRoleName('');
                setNewRoleDisplayName('');
                setNewRoleDescription('');
                setNewRolePermissions({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={createCustomRole}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog - Multi-Step */}
      <AlertDialog open={showDeleteOrgDialog} onOpenChange={setShowDeleteOrgDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {deleteOrgStep === 1 && 'Delete Organization - Warning'}
              {deleteOrgStep === 2 && 'Delete Organization - Review Impact'}
              {deleteOrgStep === 3 && 'Delete Organization - Final Confirmation'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {/* Step 1: Initial Warning */}
                {deleteOrgStep === 1 && orgToDelete && (
                  <div className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-900">Critical Action</AlertTitle>
                      <AlertDescription className="text-red-800">
                        You are about to permanently delete the organization <strong>"{orgToDelete.name}"</strong>.
                        This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                      <p className="font-medium text-yellow-900">The following will be permanently deleted:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                        <li>All users belonging to this organization ({users.filter(u => u.organizationId === orgToDelete.id).length} users)</li>
                        <li>All custom roles created for this organization</li>
                        <li>All organization data, settings, and configurations</li>
                        <li>All associated records (employees, clients, immigration cases, etc.)</li>
                        <li>All uploaded documents and files</li>
                        <li>All timesheets, invoices, and financial records</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Recommendation:</strong> Consider suspending the organization instead of deleting it 
                        if you may need to recover this data in the future.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Review Impact */}
                {deleteOrgStep === 2 && orgToDelete && (
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-900">Review Deletion Impact</AlertTitle>
                      <AlertDescription className="text-orange-800">
                        Please review the scope of this deletion before proceeding.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Organization Details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{orgToDelete.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subscription:</span>
                            <span className="font-medium">{orgToDelete.subscriptionPlan}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge className={
                              orgToDelete.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }>
                              {orgToDelete.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Data to be Deleted</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Users:</span>
                            <span className="font-medium text-red-600">
                              {users.filter(u => u.organizationId === orgToDelete.id).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Custom Roles:</span>
                            <span className="font-medium text-red-600">
                              {customRoles.filter(r => r.id.includes(orgToDelete.id)).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Records:</span>
                            <span className="font-medium text-red-600">All</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>WARNING:</strong> All users will immediately lose access to the system. 
                        All data associated with this organization will be permanently deleted from the database.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 3: Final Confirmation */}
                {deleteOrgStep === 3 && orgToDelete && (
                  <div className="space-y-4">
                    <Alert className="border-red-300 bg-red-100">
                      <AlertTriangle className="h-4 w-4 text-red-700" />
                      <AlertTitle className="text-red-900">Final Confirmation Required</AlertTitle>
                      <AlertDescription className="text-red-800">
                        This is your last chance to cancel. Once confirmed, the deletion process cannot be stopped or reversed.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 border-2 border-red-300 rounded-lg p-6 space-y-4">
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">
                          To confirm deletion, please type the exact organization name:
                        </p>
                        <p className="text-lg font-bold text-red-600 bg-white px-3 py-2 rounded border border-red-200">
                          {orgToDelete.name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delete-confirmation" className="text-sm font-medium">
                          Type organization name to confirm:
                        </Label>
                        <Input
                          id="delete-confirmation"
                          value={deleteOrgConfirmation}
                          onChange={(e) => setDeleteOrgConfirmation(e.target.value)}
                          placeholder={`Type "${orgToDelete.name}" to confirm`}
                          className="border-red-300 focus:border-red-500 focus:ring-red-500"
                        />
                      </div>

                      {deleteOrgConfirmation && deleteOrgConfirmation !== orgToDelete.name && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800 text-sm">
                            The name does not match. Please type exactly: <strong>{orgToDelete.name}</strong>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                      <CheckCircle2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 text-sm text-red-900">
                        <p className="font-medium">I understand that:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>This action is permanent and irreversible</li>
                          <li>All {users.filter(u => u.organizationId === orgToDelete.id).length} users will lose access immediately</li>
                          <li>All organization data will be permanently deleted</li>
                          <li>No backup or recovery will be possible</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteOrgDialog(false);
                setDeleteOrgStep(1);
                setOrgToDelete(null);
                setDeleteOrgConfirmation('');
              }}
            >
              Cancel
            </AlertDialogCancel>

            {deleteOrgStep < 3 && (
              <Button
                variant="outline"
                onClick={() => setDeleteOrgStep(deleteOrgStep + 1)}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                Continue to {deleteOrgStep === 1 ? 'Review Impact' : 'Final Confirmation'}
              </Button>
            )}

            {deleteOrgStep === 3 && (
              <Button
                variant="destructive"
                onClick={deleteOrganization}
                disabled={!orgToDelete || deleteOrgConfirmation !== orgToDelete.name || isDeletingOrg}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeletingOrg ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Permanently Delete Organization
                  </>
                )}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
