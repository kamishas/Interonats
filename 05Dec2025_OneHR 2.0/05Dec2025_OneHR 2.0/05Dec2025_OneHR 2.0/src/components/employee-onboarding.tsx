import { getAccessToken, API_ENDPOINTS, PERMISSION_MAP, LoginUser, fileToBase64 } from '../lib/constants';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { 
  CheckCircle2, Circle, AlertCircle, Clock, ChevronRight, Plus, 
  FileText, Users, DollarSign, Shield, Building, Building2, UserCheck, Trash2, Pencil, Search, Filter, X, RefreshCw, Eye, User, XCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Employee, WorkflowStage, TaskStatus, EmployeeClassification, WorkflowTask, DepartmentApproval, OnboardingWorkflow } from '../types';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { EmployeeDetailDashboard } from './employee-detail-dashboard';
import { useAuth } from '../lib/auth-context';

const API_URL = (import.meta as any).env.VITE_ONBOARDING_API_URL || API_ENDPOINTS.EMPL_ONBORDING;

// Utility function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: string): string => {
  if (!dateString) return '';
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
};

export function EmployeeOnboarding() {
  const { user } = useAuth();
  console.log('Current user in EmployeeOnboarding:', user);
  const permissions = user.permissions;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showNewEmployeeDialog, setShowNewEmployeeDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'department'>('name');



  const [inviteLink, setInviteLink] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

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

  const [eadFile, setEadFile] = useState<File | null>(null); // NEW: EAD file state

  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    startDate: '',
    visaStatus: '', // NEW: Visa status
    eadFile: null as any,
  });

  // Edit employee form state
  const [editEmployee, setEditEmployee] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    startDate: '',
    visaStatus: '', // NEW: Visa status
    eadFile: null as any,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);
  
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        searchInput?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employee`, {
        method: "GET",
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out employees without complete names and invalid entries
        const validEmployees = (data.requests || []).filter(emp => 
          emp && typeof emp === 'object' && emp.firstName && emp.lastName && emp.email
        );
        setEmployees(validEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewEmployee = () => {
    console.log('Reviewing new employee:', newEmployee);
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !newEmployee.position || !newEmployee.startDate) {
      toast.error('Please fill in all required fields (First Name, Last Name, Email, Position, Start Date)');
      return;
    }

    // Name validation: Alphabets only
    const nameRegex = /^[a-zA-Z\s\-\']+$/;
    if (!nameRegex.test(newEmployee.firstName)) {
      toast.error('First name should only contain alphabets');
      return;
    }
    if (!nameRegex.test(newEmployee.lastName)) {
      toast.error('Last name should only contain alphabets');
      return;
    }

    if (!newEmployee.visaStatus) {
      toast.error('Please select a visa status');
      return;
    }
    console.log('Reviewing new employee done');
    setShowNewEmployeeDialog(false);
    setShowReviewDialog(true);
  };

  const createEmployee = async () => {
    try {
      // Prepare employee data with workflow fields
      let eadFileData = null;
      if (eadFile) {
        const base64Content = await fileToBase64(eadFile);
        eadFileData = {
          name: eadFile.name,
          type: eadFile.type,
          content: base64Content
        };
      }

      const sanitizeDate = (dateStr: string | undefined | null) => {
        if (!dateStr || dateStr.trim() === '') return null;
        return dateStr;
      };

      const employeeData = {
        ...newEmployee,
        startDate: sanitizeDate(newEmployee.startDate),
        eadFile: eadFileData,
        send_invite: true,
        createdBy: user?.id || 'unknown',
      };
      console.log('Creating employee with data: ' + JSON.stringify(employeeData));

      const response = await fetch(`${API_URL}/employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        const data = await response.json();

        
        if (data.invite_link) {
            setInviteLink(data.invite_link);
            setShowInviteDialog(true);
        }
        
        const successMessage = !permissions?.canAccessEmployeeManagement
          ? 'Employee submitted for HR approval' 
          : 'Employee created successfully';
        console.log('Employee created successfully:', data);
        toast.success(successMessage);
        console.log('New employee data:', data.employee);
        

        
        // Refresh the employee list
        await fetchEmployees();
        
        console.log('Employee list refreshed');
        setShowReviewDialog(false);
        console.log('New employee dialog closed');
        
        // Reset form including file uploads
        setEadFile(null);
        setNewEmployee({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          startDate: '',
          visaStatus: '',
          eadFile: null as any,
        });
        console.log('New employee form reset');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee');
    }
    console.log('Create employee process completed');
  };

  const openEditDialog = (employee: Employee) => {
    setEditEmployee({
      id: employee.id || '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      startDate: employee.startDate || '',
      visaStatus: employee.visaStatus || '',
      eadFile: employee.eadFile || null,
    });
    setShowEditEmployeeDialog(true);
  };

  const updateEmployee = async () => {
    if (!editEmployee.firstName || !editEmployee.lastName || !editEmployee.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Name validation: Alphabets only
    const nameRegex = /^[a-zA-Z\s\-\']+$/;
    if (!nameRegex.test(editEmployee.firstName)) {
      toast.error('First name should only contain alphabets');
      return;
    }
    if (!nameRegex.test(editEmployee.lastName)) {
      toast.error('Last name should only contain alphabets');
      return;
    }

    console.log('Updating employee with data:', editEmployee);
    try {
      const response = await fetch(`${API_URL}/employee/${editEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify(editEmployee)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Employee updated successfully');
        
        // Refresh the employee list
        await fetchEmployees();
        
        setShowEditEmployeeDialog(false);
        setEditEmployee({
          id: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          startDate: '',
          visaStatus: '',
          eadFile: null
        });
      } else {
        toast.error('Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  };

  const updateWorkflowTask = async (employeeId: string, taskId: string, updates: Partial<WorkflowTask>) => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}/workflow/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(employees.map(emp => emp.id === employeeId ? data.employee : emp));
        if (selectedEmployee?.id === employeeId) {
          setSelectedEmployee(data.employee);
        }
        toast.success('Task updated successfully');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const updateDepartmentApproval = async (employeeId: string, department: string, approved: boolean, notes?: string) => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}/workflow/approvals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({ department, approved, notes })
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(employees.map(emp => emp.id === employeeId ? data.employee : emp));
        if (selectedEmployee?.id === employeeId) {
          setSelectedEmployee(data.employee);
        }
        toast.success(`${department} approval ${approved ? 'granted' : 'rejected'}`);
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      toast.error('Failed to update approval');
    }
  };

  const updateEmployeeClassification = async (employeeId: string, classification: EmployeeClassification, details: any) => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}/classification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({ classification, ...details })
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(employees.map(emp => emp.id === employeeId ? data.employee : emp));
        if (selectedEmployee?.id === employeeId) {
          setSelectedEmployee(data.employee);
        }
        toast.success('Employee classification updated');
      }
    } catch (error) {
      console.error('Error updating classification:', error);
      toast.error('Failed to update classification');
    }
  };

  const deleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      const response = await fetch(`${API_URL}/employee/${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        }
      });

      if (response.ok) {
        toast.success('Employee deleted successfully');
        
        // Close dialog first
        setShowDeleteDialog(false);
        setEmployeeToDelete(null);
        
        // Clear selected employee if the deleted employee was selected
        if (selectedEmployee?.id === employeeToDelete.id) {
          setSelectedEmployee(null);
        }
        
        // Refresh the employee list
        await fetchEmployees();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to delete employee: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error(`Failed to delete employee: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const handleCompleteOnboarding = async (employee: Employee) => {
    try {
      const response = await fetch(`${API_URL}/employees/${employee.id}/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Onboarding marked as complete! Employee can now submit timesheets.');
        await fetchEmployees();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to complete onboarding: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const handleToggleTimesheetAccess = async (employeeId: string, canAccess: boolean) => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}/timesheet-access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({ canAccessTimesheets: canAccess })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(canAccess ? 'Timesheet access granted' : 'Timesheet access revoked');
        await fetchEmployees();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to update timesheet access: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling timesheet access:', error);
      toast.error(`Failed to update timesheet access: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const getStageIcon = (stage: WorkflowStage, currentStage: WorkflowStage) => {
    const stages: WorkflowStage[] = ['hr-setup', 'employee-setup', 'hr-review', 'completed'];
    const currentIndex = stages.indexOf(currentStage);
    const stageIndex = stages.indexOf(stage);
    
    if (stageIndex < currentIndex) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (stageIndex === currentIndex) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getTaskStatusBadge = (status: TaskStatus) => {
    const variants = {
      'pending': 'outline',
      'in-progress': 'default',
      'completed': 'default',
      'blocked': 'destructive'
    } as const;

    const colors = {
      'pending': 'text-gray-600',
      'in-progress': 'text-blue-600 bg-blue-100',
      'completed': 'text-green-600 bg-green-100',
      'blocked': 'text-red-600'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const calculateProgress = (onboardingStatus?: string): number => {
    if (onboardingStatus == 'invited') return 20;
    if (onboardingStatus == 'profile_submitted') return 40;
    if (onboardingStatus == 'pending_documents') return 60;
    if (onboardingStatus == 'awaiting_hr_review') return 80;
    if (onboardingStatus == 'completed') return 100;
    return 0;
  };

  // Function to determine next step in the onboarding process
  const getNextStep = (employee: Employee) => {
    // Completed - check this first
    if (employee.onboardingStatus === 'completed') {
      return { text: 'Ready', color: 'text-green-600', icon: '✅' };
    }

    // If HR approval needed (created by recruiter)
    if (employee.needsHRApproval && !employee.hrApproved) {
      return { text: 'Waiting on HR', color: 'text-orange-600', icon: '👤' };
    }

    // If onboarding documents are pending review
    const hasPendingDocs = employee.onboardingDocuments?.some((doc: any) => doc.status === 'pending-review') || 
                          (!employee.onboardingDocuments && employee.eadFile && !employee.eadFileApproved);
    if (hasPendingDocs) {
      return { text: 'Waiting on HR', color: 'text-orange-600', icon: '👤' };
    }

    // Based on onboardingStatus
    switch (employee.onboardingStatus) {
      case 'invited':
        return { text: 'Waiting on Employee', color: 'text-blue-600', icon: '👤' };
      case 'profile_submitted':
        return { text: 'Waiting on Employee', color: 'text-blue-600', icon: '👤' };
      case 'pending_documents':
        return { text: 'Waiting on Employee', color: 'text-blue-600', icon: '👤' };
      case 'awaiting_hr_review':
        return { text: 'Waiting on HR', color: 'text-orange-600', icon: '👤' };
      default:
        return { text: 'Waiting on HR', color: 'text-orange-600', icon: '⚙️' };
    }
  };

  const getFilteredEmployees = () => {
    let filtered = employees.filter(e => e && typeof e === 'object');
    
    // Tab filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(e => e.onboardingStatus !== 'completed');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(e => e.onboardingStatus === 'completed');
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        (e.position && e.position.toLowerCase().includes(query))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.onboardingStatus === statusFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'date') {
        return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
      }
      return 0;
    });
    
    return filtered;
  };
  
  // Highlight search matches
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim() || !text) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : part
    );
  };

  const canAccessTimesheets = (employee: Employee): boolean => {
    if (!employee.onboardingStatus) return false;
    
    // Simplified: Employee can access timesheets when HR review is complete
    return employee.onboardingStatus === 'completed';
  };

  const openNewEmployeeDialog = () => {
    setShowNewEmployeeDialog(true);
  };

  const handleEmployeeClick = (employeeId: string) => {
    // Allow users with view or manage permissions to see detailed dashboard
    if (user && (permissions?.canViewEmployees || permissions?.canManageEmployees)) {
      setSelectedEmployeeId(employeeId);
      setShowEmployeeDetail(true);
    }
  };

  const handleBackToList = () => {
    setShowEmployeeDetail(false);
    setSelectedEmployeeId(null);
    fetchEmployees(); // Refresh data when coming back
  };

  // Show employee detail dashboard if selected
  if (showEmployeeDetail && selectedEmployeeId) {
    return (
      <EmployeeDetailDashboard 
        employeeId={selectedEmployeeId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Employee Created & Invited</DialogTitle>
                    <DialogDescription>
                        The employee has been created. Share this invite link with them to complete their setup.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 mt-4">
                    <Input readOnly value={inviteLink} />
                    <Button 
                        onClick={() => copyToClipboard(inviteLink)}
                    >
                        Copy
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={() => setShowInviteDialog(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      <div className="flex justify-between items-center">
        <div>
          <h1>Employees</h1>
          <p className="text-gray-500">{permissions?.canManageEmployees ? 'Manage employee records, status, and information' : 'View employee records, status, and information'}</p>
        </div>
        {permissions?.canManageEmployees && (
          <Button onClick={openNewEmployeeDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Employee
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All Employees</TabsTrigger>
            <TabsTrigger value="pending">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            {permissions?.canAccessEmployeeManagement && (
              <TabsTrigger value="documents">
                Document Review
                {employees.filter((e: any) => 
                  e && typeof e === 'object' &&
                  ((e.onboardingDocuments?.some((d: any) => d.status === 'pending-review')) || 
                  (!e.onboardingDocuments && e.eadFile))
                ).length > 0 && (
                  <Badge className="ml-2 bg-orange-500 text-white px-1.5 py-0 text-xs h-5">
                    {employees.filter((e: any) => 
                      e && typeof e === 'object' &&
                      ((e.onboardingDocuments?.some((d: any) => d.status === 'pending-review')) || 
                      (!e.onboardingDocuments && e.eadFile))
                    ).length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search employees... (Press / to focus)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                fetchEmployees();
                toast.success('Refreshing employee list...');
              }}
              title="Refresh Employee List"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
                <div>
                  <Label className="mb-2">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="pending-review">Pending Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="mb-2">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: 'name' | 'date') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="date">Start Date (Newest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchQuery('');
                      setSortBy('name');
                    }}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
            </CardContent>
          </Card>
        )}

        {/* Alert for employees needing timesheet access */}
        {(() => {
          const needsAccessCount = employees.filter(e => 
            e && typeof e === 'object' && e.onboardingStatus === 'completed' && !e.canAccessTimesheets
          ).length;
          
          if (needsAccessCount > 0) {
            return (
              <Alert className="my-6 border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900">
                  Action Required: {needsAccessCount} employee{needsAccessCount > 1 ? 's' : ''} need{needsAccessCount === 1 ? 's' : ''} timesheet access
                </AlertTitle>
                <AlertDescription className="text-amber-800">
                  {needsAccessCount} employee{needsAccessCount > 1 ? 's have' : ' has'} completed onboarding but {needsAccessCount > 1 ? 'do' : 'does'} not have timesheet access. 
                  Click on each employee and go to the Workflow tab to grant access manually.
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Statistics Overview */}
        {employees.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
            {/* Onboarding Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Onboarding Status</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'In Progress', value: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus !== 'completed').length, color: '#6B7FBE' },
                          { name: 'Completed', value: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'completed').length, color: '#5FA989' },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={85}
                        innerRadius={55}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {[
                          { name: 'In Progress', value: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus !== 'completed').length, color: '#6B7FBE' },
                          { name: 'Completed', value: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'completed').length, color: '#5FA989' },
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="space-y-2 mt-2">
                  {[
                    { name: 'In Progress', value: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus !== 'completed').length, color: '#6B7FBE' },
                    { name: 'Completed', value: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'completed').length, color: '#5FA989' },
                  ].filter(item => item.value > 0).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm flex-shrink-0" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-gray-600">{entry.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Status Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Onboarding Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { stage: 'Invited', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'invited').length, fill: '#6B7FBE' },
                        { stage: 'Employee Setup', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'employee_setup').length, fill: '#9B88C4' },
                        { stage: 'HR Review', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'awaiting_hr_review').length, fill: '#e4d612ff' },
                        { stage: 'Awaiting Documents', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'pending_documents').length, fill: '#db9d15ff' },
                        { stage: 'Completed', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'completed').length, fill: '#5FA989' },
                      ]}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#E5E7EB"
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="stage" 
                        fontSize={11}
                        tick={{ fill: '#6B7280' }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fill: '#6B7280' }}
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
                        {[
                          { stage: 'Invited', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'invited').length, fill: '#6B7FBE' },
                          { stage: 'Employee Setup', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'employee_setup').length, fill: '#9B88C4' },
                          { stage: 'HR Review', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'awaiting_hr_review').length, fill: '#e4d612ff' },
                          { stage: 'Awaiting Documents', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'pending_documents').length, fill: '#db9d15ff' },
                          { stage: 'Completed', count: employees.filter(e => e && typeof e === 'object' && e.onboardingStatus === 'completed').length, fill: '#5FA989' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Loading employees...</p>
              </CardContent>
            </Card>
          ) : getFilteredEmployees().length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No employees match your search criteria'
                    : 'No employees found'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{getFilteredEmployees().length}</span> of <span className="font-medium">{employees.length}</span> employee{employees.length !== 1 ? 's' : ''}
                  {(searchQuery || statusFilter !== 'all') && (
                    <span className="ml-2 text-blue-600">(filtered)</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort:</span>
                  <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'department') => setSortBy(value)}>
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="date">Start Date</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="gradient-teal-blue">
                      <TableHead className="font-semibold text-white">Employee</TableHead>
                      <TableHead className="font-semibold text-white">Contact</TableHead>
                      <TableHead className="font-semibold text-white">Position</TableHead>
                      <TableHead className="font-semibold text-white">Status</TableHead>
                      <TableHead className="font-semibold text-white">Progress</TableHead>
                      <TableHead className="font-semibold text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredEmployees().map((employee) => (
                      <TableRow 
                        key={employee.email} 
                        className="hover:bg-white/50 cursor-pointer transition-colors"
                        onClick={() => handleEmployeeClick(employee.id)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {employee.firstName && employee.lastName 
                                ? highlightMatch(`${employee.firstName} ${employee.lastName}`)
                                : <span className="text-gray-400 italic">Name not set</span>
                              }
                            </span>
                            {employee.workflow?.classificationVerified && (
                              <Badge className="bg-purple-100 text-purple-700 w-fit mt-1 text-xs">
                                {employee.classification}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-[200px] truncate">
                            {highlightMatch(employee.email)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {highlightMatch(employee.position || 'Not set')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {employee.onboardingStatus === 'completed' ? (
                            <div className="flex flex-col gap-1">
                              <Badge className="w-fit text-xs bg-green-100 text-green-700 border-green-200">
                                Completed
                              </Badge>
                              {!employee.canAccessTimesheets && (
                                <Badge className="w-fit text-xs bg-amber-100 text-amber-700 border-amber-300">
                                  ⚠️ No Timesheet Access
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {(() => {
                                const nextStep = getNextStep(employee);
                                if (nextStep.text !== 'Ready') {
                                  return (
                                    <div className={`text-xs ${nextStep.color} font-medium flex items-center gap-1`}>
                                      <span>{nextStep.icon}</span>
                                      <span>{nextStep.text}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={
                                  employee.onboardingStatus === 'completed' 
                                    ? 100 
                                    : employee 
                                      ? calculateProgress(employee.onboardingStatus) 
                                      : 0
                                } 
                                className="h-2 flex-1" 
                              />
                              <span className="text-xs font-medium text-gray-600 min-w-[35px]">
                                {employee.onboardingStatus === 'completed' 
                                  ? '100' 
                                  : employee 
                                    ? calculateProgress(employee.onboardingStatus) 
                                    : '0'}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {permissions?.canManageEmployees ? (
                            <div className="flex gap-1 justify-end">
                              {employee.onboardingStatus !== 'completed' && (
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteOnboarding(employee);
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Mark Onboarding Complete"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(employee);
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEmployeeToDelete(employee);
                                  setShowDeleteDialog(true);
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">View only</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Document Review Tab - NEW! */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pending Document Reviews
              </CardTitle>
              <CardDescription>
                Review and approve employee-submitted documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const employeesWithPendingDocs = employees.filter((emp: any) => 
                  emp && typeof emp === 'object' &&
                  ((emp.onboardingDocuments?.some((doc: any) => doc.status === 'pending-review')) ||
                  (!emp.onboardingDocuments && emp.eadFile))
                );

                if (employeesWithPendingDocs.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="mb-2">All Caught Up!</h3>
                      <p className="text-muted-foreground">
                        No pending documents to review at this time.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {employeesWithPendingDocs.map((employee: any) => {
                      // Get pending documents from onboardingDocuments
                      const pendingDocsFromOnboarding = employee.onboardingDocuments?.filter(
                        (doc: any) => doc.status === 'pending-review'
                      ) || [];
                      
                      // If no onboardingDocuments but has eadFile, create a mock document entry
                      const eadFileDoc = (!employee.onboardingDocuments && employee.eadFile) ? [{
                        id: 'ead-file',
                        type: 'EAD',
                        fileName: employee.eadFile.name || 'EAD Document',
                        fileUrl: null, // EAD files are stored as base64 content
                        uploadedAt: new Date().toISOString(), // We don't have upload date for existing eadFiles
                        uploadedBy: 'System', // We don't have uploader info for existing eadFiles
                        status: 'pending-review'
                      }] : [];
                      
                      const allPendingDocs = [...pendingDocsFromOnboarding, ...eadFileDoc];

                      return (
                        <div key={employee.id} className="border rounded-lg p-6 space-y-4">
                          {/* Employee Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {employee.firstName} {employee.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                            </div>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              {allPendingDocs.length} pending
                            </Badge>
                          </div>

                          {/* Documents List */}
                          <div className="space-y-3">
                            {allPendingDocs.map((doc: any) => (
                              <div key={doc.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium">
                                        {doc.type === 'EAD' ? 'Work Authorization Document (EAD)' :
                                         doc.type === 'offer-letter-signed' ? 'Signed Offer Letter' :
                                         doc.type === 'nda-signed' ? 'Signed NDA' :
                                         doc.type === 'government-id' ? 'Government ID' :
                                         doc.type === 'proof-of-address' ? 'Proof of Address' :
                                         doc.type === 'social-security-card' ? 'Social Security Card' :
                                         doc.type === 'direct-deposit' ? 'Direct Deposit Form' :
                                         doc.type === 'w4' ? 'W-4 Tax Form' :
                                         doc.type === 'i9' ? 'I-9 Form' :
                                         doc.type === 'emergency-contact' ? 'Emergency Contact Form' :
                                         doc.type === 'background-check-consent' ? 'Background Check Consent' :
                                         doc.type === 'certifications' ? 'Professional Certifications' :
                                         doc.type === 'education-verification' ? 'Education Verification' :
                                         doc.type}
                                      </span>
                                    </div>
                                    
                                    {doc.fileName && (
                                      <button
                                        onClick={() => {
                                          if (doc.fileUrl) {
                                            window.open(doc.fileUrl, '_blank');
                                          } else {
                                            toast.info('Opening document preview...');
                                          }
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                      >
                                        📎 File: {doc.fileName}
                                      </button>
                                    )}
                                    {doc.uploadedAt && (
                                      <p className="text-xs text-muted-foreground">
                                        Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                                      </p>
                                    )}
                                    {doc.uploadedBy && (
                                      <p className="text-xs text-muted-foreground">
                                        Uploaded By: {doc.uploadedBy}
                                      </p>
                                    )}
                                  </div>
                                  <Badge className="bg-orange-100 text-orange-700">
                                    Pending Review
                                  </Badge>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (doc.id === 'ead-file') {
                                        // For EAD files, we can't preview directly since they're base64
                                        toast.info('EAD document preview not available. File is stored securely.');
                                      } else if (doc.fileUrl) {
                                        window.open(doc.fileUrl, '_blank');
                                      } else {
                                        toast.info('Document preview coming soon. File URL not available yet.');
                                      }
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Document
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={async () => {
                                      try {
                                        // Handle EAD file approval differently
                                        if (doc.id === 'ead-file') {
                                          const response = await fetch(`${API_URL}/employees/${employee.id}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Authorization': `Bearer ${getAccessToken()}`,
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                              eadFileApproved: true,
                                              eadFileReviewedBy: user?.email || 'HR',
                                              eadFileReviewNotes: 'Approved'
                                            })
                                          });
                                          
                                          if (response.ok) {
                                            toast.success('EAD document approved successfully!');
                                            fetchEmployees(); // Refresh list
                                          } else {
                                            const error = await response.json();
                                            toast.error(error.error || 'Failed to approve EAD document');
                                          }
                                        } else {
                                          // Handle regular onboarding documents
                                          const response = await fetch(
                                            `${API_URL}/employees/${employee.id}/onboarding-document/${doc.type}/review`,
                                            {
                                              method: 'PUT',
                                              headers: {
                                                'Authorization': `Bearer ${getAccessToken()}`,
                                                'Content-Type': 'application/json'
                                              },
                                              body: JSON.stringify({
                                                approved: true,
                                                reviewedBy: user?.email || 'HR',
                                                reviewNotes: 'Approved'
                                              })
                                            }
                                          );

                                          if (response.ok) {
                                            toast.success(`${doc.type} approved successfully!`);
                                            fetchEmployees(); // Refresh list
                                          } else {
                                            const error = await response.json();
                                            toast.error(error.error || 'Failed to approve document');
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error approving document:', error);
                                        toast.error('Failed to approve document');
                                      }
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                      const reason = prompt('Please provide a reason for rejection:');
                                      if (!reason) return;

                                      try {
                                        // Handle EAD file rejection differently
                                        if (doc.id === 'ead-file') {
                                          const response = await fetch(`${API_URL}/employees/${employee.id}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Authorization': `Bearer ${getAccessToken()}`,
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                              eadFileApproved: false,
                                              eadFileReviewedBy: user?.email || 'HR',
                                              eadFileReviewNotes: reason
                                            })
                                          });
                                          
                                          if (response.ok) {
                                            toast.success('EAD document rejected. Employee will be notified.');
                                            fetchEmployees(); // Refresh list
                                          } else {
                                            const error = await response.json();
                                            toast.error(error.error || 'Failed to reject EAD document');
                                          }
                                        } else {
                                          // Handle regular onboarding documents
                                          const response = await fetch(
                                            `${API_URL}/employees/${employee.id}/onboarding-document/${doc.type}/review`,
                                            {
                                              method: 'PUT',
                                              headers: {
                                                'Authorization': `Bearer ${getAccessToken()}`,
                                                'Content-Type': 'application/json'
                                              },
                                              body: JSON.stringify({
                                                approved: false,
                                                reviewedBy: user?.email || 'HR',
                                                reviewNotes: reason
                                              })
                                            }
                                          );

                                          if (response.ok) {
                                            toast.success(`${doc.type} rejected. Employee will be notified.`);
                                            fetchEmployees(); // Refresh list
                                          } else {
                                            const error = await response.json();
                                            toast.error(error.error || 'Failed to reject document');
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error rejecting document:', error);
                                        toast.error('Failed to reject document');
                                      }
                                    }}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription id="delete-dialog-description">
              Are you sure you want to delete this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {employeeToDelete && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div>
                  <span className="font-medium">Name:</span> {employeeToDelete.firstName} {employeeToDelete.lastName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {employeeToDelete.email}
                </div>
                <div>
                  <span className="font-medium">Position:</span> {employeeToDelete.position || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {employeeToDelete.onboardingStatus}
                </div>
              </div>
              
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Warning</AlertTitle>
                <AlertDescription className="text-red-700">
                  Deleting this employee will permanently remove all workflow data, tasks, and approvals.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setEmployeeToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={deleteEmployee}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Employee Dialog */}
      <Dialog open={showNewEmployeeDialog} onOpenChange={setShowNewEmployeeDialog}>
        <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription id="new-employee-dialog-description">
              Create a new employee record and initiate the onboarding workflow
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newEmployee.firstName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newEmployee.lastName}
                  onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              
              <div className="space-y-2">
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newEmployee.startDate}
                  onChange={(e) => setNewEmployee({ ...newEmployee, startDate: e.target.value })}
                />
              </div>
              
              
              
              {/* Visa Status Field */}
              <div className="space-y-2">
                <Label htmlFor="visaStatus">
                  Visa Status <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={newEmployee.visaStatus}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, visaStatus: value })}
                >
                  <SelectTrigger id="visaStatus">
                    <SelectValue placeholder="Select visa status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US Citizen">US Citizen</SelectItem>
                    <SelectItem value="Green Card / Permanent Resident">Green Card / Permanent Resident</SelectItem>
                    <SelectItem value="H-1B">H-1B</SelectItem>
                    <SelectItem value="L-1">L-1</SelectItem>
                    <SelectItem value="E-3">E-3</SelectItem>
                    <SelectItem value="TN">TN</SelectItem>
                    <SelectItem value="F-1 OPT">F-1 OPT</SelectItem>
                    <SelectItem value="F-1 CPT">F-1 CPT</SelectItem>
                    <SelectItem value="H-4 - EAD">H-4 - EAD</SelectItem>
                    <SelectItem value="O-1">O-1</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Document Uploads Section */}
              <div className="col-span-2 space-y-4 pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Optional Documents
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="eadUpload">
                    Work Authorization Document (EAD) <span className="text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="eadUpload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEadFile(e.target.files[0]);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {eadFile && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {eadFile.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload EAD if applicable for this employee's visa status
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEmployeeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewEmployee}>
              <ChevronRight className="mr-2 h-4 w-4" />
              Review Information
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Employee Information Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Review Employee Information</DialogTitle>
            <DialogDescription id="review-dialog-description">
              Please review all information before creating the employee record
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Personal Information Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-blue-700">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">First Name</p>
                    <p className="font-medium">{newEmployee.firstName || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Name</p>
                    <p className="font-medium">{newEmployee.lastName || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{newEmployee.email || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{newEmployee.phone || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-green-700">Employment Information</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium">{newEmployee.position || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                  <div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium">
                      {newEmployee.startDate ? formatDateWithoutTimezone(newEmployee.startDate) : <span className="text-gray-400">Not provided</span>}
                    </p>
                  </div>
                  <div>
                  </div>
                </div>
              </div>

              {/* Immigration Status Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-indigo-700">Immigration Status</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Visa Status</p>
                    <p className="font-medium">{newEmployee.visaStatus || <span className="text-gray-400">Not provided</span>}</p>
                  </div>
                </div>
              </div>

              {/* Optional Documents Section */}
              {eadFile && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-teal-700">Uploaded Documents</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Work Authorization Document (EAD)</p>
                      <p className="font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{eadFile.name}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ready to Create</AlertTitle>
                <AlertDescription>
                  Once you confirm, this employee will be added to the system and the onboarding workflow will be initiated.
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReviewDialog(false);
                setShowNewEmployeeDialog(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
            <Button onClick={createEmployee}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm & Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>Edit Employee Information</DialogTitle>
            <DialogDescription id="edit-employee-dialog-description">
              Update employee details and information
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name *</Label>
              <Input
                id="editFirstName"
                value={editEmployee.firstName}
                onChange={(e) => setEditEmployee({ ...editEmployee, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name *</Label>
              <Input
                id="editLastName"
                value={editEmployee.lastName}
                onChange={(e) => setEditEmployee({ ...editEmployee, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmployee.email}
                onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editEmployee.phone}
                onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPosition">Position</Label>
              <Input
                id="editPosition"
                value={editEmployee.position}
                onChange={(e) => setEditEmployee({ ...editEmployee, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStartDate">Start Date</Label>
              <Input
                id="editStartDate"
                type="date"
                value={editEmployee.startDate}
                onChange={(e) => setEditEmployee({ ...editEmployee, startDate: e.target.value })}
              />
            </div>
            
              {/* Visa Status Field */}
              <div className="space-y-2">
                <Label htmlFor="visaStatus">
                  Visa Status <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={editEmployee.visaStatus}
                  onValueChange={(value) => setEditEmployee({ ...editEmployee, visaStatus: value })}
                >
                  <SelectTrigger id="visaStatus">
                    <SelectValue placeholder="Select visa status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US Citizen">US Citizen</SelectItem>
                    <SelectItem value="Green Card / Permanent Resident">Green Card / Permanent Resident</SelectItem>
                    <SelectItem value="H-1B">H-1B</SelectItem>
                    <SelectItem value="L-1">L-1</SelectItem>
                    <SelectItem value="E-3">E-3</SelectItem>
                    <SelectItem value="TN">TN</SelectItem>
                    <SelectItem value="F-1 OPT">F-1 OPT</SelectItem>
                    <SelectItem value="F-1 CPT">F-1 CPT</SelectItem>
                    <SelectItem value="H-4 - EAD">H-4 - EAD</SelectItem>
                    <SelectItem value="O-1">O-1</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmployeeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateEmployee}>
              <Pencil className="mr-2 h-4 w-4" />
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Workflow Detail View Component
function WorkflowDetailView({ 
  employee, 
  onUpdateTask,
  onUpdateApproval,
  onUpdateClassification 
}: { 
  employee: Employee;
  onUpdateTask: (employeeId: string, taskId: string, updates: Partial<WorkflowTask>) => void;
  onUpdateApproval: (employeeId: string, department: string, approved: boolean, notes?: string) => void;
  onUpdateClassification: (employeeId: string, classification: EmployeeClassification, details: any) => void;
}) {
  const [classificationForm, setClassificationForm] = useState({
    classification: employee.classification || 'billable' as EmployeeClassification,
    linkedClientId: employee.workflow?.linkedClientId || '',
    linkedClientName: employee.workflow?.linkedClientName || '',
    linkedPONumber: employee.workflow?.linkedPONumber || '',
    internalProjectId: employee.workflow?.internalProjectId || '',
    departmentAssignment: employee.workflow?.departmentAssignment || '',
  });

  if (!employee.workflow) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No workflow data available</p>
      </div>
    );
  }

  const stages: { id: WorkflowStage; label: string; icon: any }[] = [
    { id: 'initiation', label: 'Initiation', icon: FileText },
    { id: 'data-collection', label: 'Data Collection', icon: Users },
    { id: 'verification', label: 'Verification', icon: Shield },
    { id: 'payroll-setup', label: 'Payroll Setup', icon: DollarSign },
    { id: 'licensing', label: 'Licensing', icon: Building2 },
    { id: 'classification', label: 'Classification', icon: UserCheck },
    { id: 'finalization', label: 'Finalization', icon: CheckCircle2 },
  ];

  const tasksByDepartment = employee.workflow.tasks.reduce((acc, task) => {
    if (!acc[task.department]) {
      acc[task.department] = [];
    }
    acc[task.department].push(task);
    return acc;
  }, {} as Record<string, WorkflowTask[]>);

  return (
    <Tabs defaultValue="workflow" className="w-full">
      <TabsList>
        <TabsTrigger value="workflow">Workflow & Tasks</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
        <TabsTrigger value="approvals">Approvals</TabsTrigger>
      </TabsList>

      <TabsContent value="workflow">
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
        {/* Stage Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isCurrentStage = stage.id === employee.workflow?.currentStage;
                const stageIndex = stages.findIndex(s => s.id === stage.id);
                const currentIndex = stages.findIndex(s => s.id === employee.workflow?.currentStage);
                const isCompleted = stageIndex < currentIndex;
                
                return (
                  <div 
                    key={stage.id} 
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      isCurrentStage ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isCompleted ? 'text-green-500' : isCurrentStage ? 'text-blue-500' : 'text-gray-300'}`} />
                    <span className={isCurrentStage ? 'font-medium' : 'text-gray-600'}>
                      {stage.label}
                    </span>
                    {isCurrentStage && <Badge>In Progress</Badge>}
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Department */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="HR" className="w-full">
              <TabsList>
                <TabsTrigger value="HR">HR</TabsTrigger>
                <TabsTrigger value="Recruiter">Recruiter</TabsTrigger>
                <TabsTrigger value="Accounting">Accounting</TabsTrigger>
                <TabsTrigger value="Immigration">Immigration</TabsTrigger>
                <TabsTrigger value="Licensing">Licensing</TabsTrigger>
              </TabsList>
              
              {Object.entries(tasksByDepartment).map(([dept, tasks]) => {
                // Filter out document collection tasks for Recruiter department
                const filteredTasks = dept === 'Recruiter' 
                  ? tasks.filter(task => 
                      !task.taskName.toLowerCase().includes('collect') &&
                      !task.taskName.toLowerCase().includes('document') &&
                      !task.taskName.toLowerCase().includes('upload')
                    )
                  : tasks;
                
                return (
                  <TabsContent key={dept} value={dept} className="space-y-3">
                    {filteredTasks.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No tasks assigned to this department yet</p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <Checkbox 
                            checked={task.status === 'completed'}
                            onCheckedChange={(checked) => {
                              onUpdateTask(employee.id, task.id, { 
                                status: checked ? 'completed' : 'pending',
                                completedDate: checked ? new Date().toISOString() : undefined
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{task.taskName}</span>
                              {getTaskStatusBadge(task.status)}
                            </div>
                            {task.notes && <p className="text-sm text-gray-600">{task.notes}</p>}
                            {task.completedDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Completed: {new Date(task.completedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Employee Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Classification</CardTitle>
            <CardDescription>
              Classify employee and link to client/project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Classification Type</Label>
                <Select 
                  value={classificationForm.classification}
                  onValueChange={(value) => setClassificationForm({ 
                    ...classificationForm, 
                    classification: value as EmployeeClassification 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billable">Billable (Client Project)</SelectItem>
                    <SelectItem value="non-billable">Non-Billable (Internal Project)</SelectItem>
                    <SelectItem value="operational">Operational (Department)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {classificationForm.classification === 'billable' && (
                <>
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input 
                      value={classificationForm.linkedClientName}
                      onChange={(e) => setClassificationForm({ 
                        ...classificationForm, 
                        linkedClientName: e.target.value 
                      })}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PO Number</Label>
                    <Input 
                      value={classificationForm.linkedPONumber}
                      onChange={(e) => setClassificationForm({ 
                        ...classificationForm, 
                        linkedPONumber: e.target.value 
                      })}
                      placeholder="Enter PO number"
                    />
                  </div>
                </>
              )}

              {classificationForm.classification === 'non-billable' && (
                <div className="space-y-2">
                  <Label>Internal Project</Label>
                  <Input 
                    value={classificationForm.internalProjectId}
                    onChange={(e) => setClassificationForm({ 
                      ...classificationForm, 
                      internalProjectId: e.target.value 
                    })}
                    placeholder="Enter internal project name"
                  />
                </div>
              )}

              {classificationForm.classification === 'operational' && (
                <div className="space-y-2">
                  <Label>Department Assignment</Label>
                  <Input 
                    value={classificationForm.departmentAssignment}
                    onChange={(e) => setClassificationForm({ 
                      ...classificationForm, 
                      departmentAssignment: e.target.value 
                    })}
                    placeholder="Enter department"
                  />
                </div>
              )}

              <Button 
                onClick={() => onUpdateClassification(employee.id, classificationForm.classification, classificationForm)}
                className="w-full"
              >
                Save Classification
              </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="documents">
        <DocumentCollectionPanel employee={employee} />
      </TabsContent>

      <TabsContent value="projects">
        <EmployeeProjectView 
          employeeId={employee.id} 
          employeeName={`${employee.firstName} ${employee.lastName}`}
        />
      </TabsContent>

      <TabsContent value="approvals">
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Department Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Department Sign-Offs</CardTitle>
                <CardDescription>
                  All departments must approve before employee can access timesheets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employee.workflow.departmentApprovals.map((approval) => (
                    <div key={approval.department} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{approval.department}</div>
                        {approval.approvedDate && (
                          <div className="text-sm text-gray-500">
                            Approved: {new Date(approval.approvedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {approval.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-700">Approved</Badge>
                        )}
                        {approval.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => onUpdateApproval(employee.id, approval.department, true)}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onUpdateApproval(employee.id, approval.department, false)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Access Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Timesheet Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className={employee.canAccessTimesheets ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                  <AlertDescription>
                    {employee.canAccessTimesheets 
                      ? '✅ Employee can access timesheets and submit entries'
                      : '⚠️ Employee cannot access timesheets - access must be manually granted'
                    }
                  </AlertDescription>
                </Alert>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Grant Timesheet Access</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.canAccessTimesheets 
                        ? "Access is currently enabled" 
                        : "Enable access to allow timesheet submissions"}
                    </div>
                  </div>
                  <Switch 
                    checked={employee.canAccessTimesheets || false}
                    onCheckedChange={(checked) => {
                      // Call the toggle function
                      handleToggleTimesheetAccess(employee.id, checked);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

function getTaskStatusBadge(status: TaskStatus) {
  const variants = {
    'pending': 'outline',
    'in-progress': 'default',
    'completed': 'default',
    'blocked': 'destructive'
  } as const;

  const colors = {
    'pending': 'text-gray-600',
    'in-progress': 'text-blue-600 bg-blue-100',
    'completed': 'text-green-600 bg-green-100',
    'blocked': 'text-red-600'
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status}
    </Badge>
  );
}
