import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { 
  Users, FileText, AlertCircle, CheckCircle2, Clock, 
  Building2, DollarSign, Shield, TrendingUp, Activity,
  FolderOpen, Calendar, UserX, Award, Trash2, ArrowUpRight, Sparkles, Zap
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Employee, DashboardPreferences } from '../types';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import { useAuth } from '../lib/auth-context';
import { getRolePermissions } from '../types/auth';
import { DashboardSettings } from './dashboard-settings';
import { HRApprovalWorkflow } from './hr-approval-workflow';

const API_URL = API_ENDPOINTS.USER;
const ONBOARDING_API_URL = API_ENDPOINTS.EMPL_ONBORDING;
const IMMIGRATION_API_URL = API_ENDPOINTS.IMMIGRATION;
const OFFBOARDING_API_URL = API_ENDPOINTS.OFFBOARDING;
const PERFORMANCE_API_URL = API_ENDPOINTS.PERFORMANCE;
const CLIENT_API_URL = API_ENDPOINTS.CLIENT;
const LICENSING_API_URL = API_ENDPOINTS.LICENSING;
const TIMESHEET_API_URL = API_ENDPOINTS.TIMESHEET;

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { user, userPermissions } = useAuth();
  const permissions = userPermissions;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [immigrationRecords, setImmigrationRecords] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [offboardingRecords, setOffboardingRecords] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [businessLicenses, setBusinessLicenses] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  
  // Dashboard preferences
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    userId: user?.id || 'default',
    sections: {
      quickActions: true,
      keyMetrics: true,
      additionalMetrics: true,
      workflowCharts: true,
    },
    keyMetrics: {
      totalEmployees: true,
      activeOnboarding: true,
      immigrationCases: true,
      criticalAlerts: true,
    },
    additionalMetrics: {
      activeClients: true,
      businessLicenses: true,
      pendingTimesheets: true,
      leaveRequests: true,
      activeOffboarding: true,
      pendingReviews: true,
      expiringDocuments: true,
      pendingSignatures: true,
    },
  });
  
  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    startDate: '',
    homeState: '',
    employmentType: 'full-time',
  });
  
  // New client form state
  const [newClient, setNewClient] = useState({
    companyName: '',
    legalName: '',
    email: '',
    phone: '',
    industry: '',
    address: '',
  });

  useEffect(() => {
    fetchData();
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/dashboard-preferences/${user.id}`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching dashboard preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: DashboardPreferences) => {
    try {
      const response = await fetch(`${API_URL}/dashboard-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() || ''}`
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      // Always fetch employees and immigration data
      const fetchPromises = [
        fetch(`${ONBOARDING_API_URL}/employee`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
        }),
        fetch(`${IMMIGRATION_API_URL}/records`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
        }),
      ];

      // Only fetch employee management data if user has permission
      if (permissions?.canAccessEmployeeManagement) {
        fetchPromises.push(
          fetch(`${ONBOARDING_API_URL}/documents`, {
            headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
          }),
          fetch(`${API_URL}/leave-requests`, {
            headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
          }),
          fetch(`${OFFBOARDING_API_URL}/offboarding`, {
            headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
          }),
          fetch(`${PERFORMANCE_API_URL}/performance-reviews`, {
            headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
          }),
          fetch(`${CLIENT_API_URL}/clients`, {
            headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
          }),
          fetch(`${LICENSING_API_URL}/business-licenses`, {
            headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
          }),
          fetch(`${TIMESHEET_API_URL}/timesheets`, {
            headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
          })
        );
      }

      const responses = await Promise.all(fetchPromises);
      const [employeesRes, immigrationRes, docsRes, leaveRes, offboardingRes, performanceRes, clientsRes, licensesRes, timesheetsRes] = responses;

      if (employeesRes && employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.employees || []);
      } else if (employeesRes) {
        console.error('Failed to fetch employees:', employeesRes.status, employeesRes.statusText);
      }

      if (immigrationRes && immigrationRes.ok) {
        const data = await immigrationRes.json();
        setImmigrationRecords(data.records || []);
      } else if (immigrationRes) {
        console.error('Failed to fetch immigration records:', immigrationRes.status, immigrationRes.statusText);
      }

      if (docsRes && docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      } else if (docsRes) {
        console.error('Failed to fetch documents:', docsRes.status, docsRes.statusText);
      }

      if (leaveRes && leaveRes.ok) {
        const data = await leaveRes.json();
        setLeaveRequests(data.leaveRequests || []);
      } else if (leaveRes) {
        console.error('Failed to fetch leave requests:', leaveRes.status, leaveRes.statusText);
      }

      if (offboardingRes && offboardingRes.ok) {
        const data = await offboardingRes.json();
        setOffboardingRecords(data.offboardingRecords || []);
      } else if (offboardingRes) {
        console.error('Failed to fetch offboarding records:', offboardingRes.status, offboardingRes.statusText);
      }

      if (performanceRes && performanceRes.ok) {
        const data = await performanceRes.json();
        setPerformanceReviews(data.performanceReviews || []);
      } else if (performanceRes) {
        console.error('Failed to fetch performance reviews:', performanceRes.status, performanceRes.statusText);
      }

      if (clientsRes && clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      } else if (clientsRes) {
        console.error('Failed to fetch clients:', clientsRes.status, clientsRes.statusText);
      }

      if (licensesRes && licensesRes.ok) {
        const data = await licensesRes.json();
        setBusinessLicenses(data.licenses || []);
      } else if (licensesRes) {
        console.error('Failed to fetch business licenses:', licensesRes.status, licensesRes.statusText);
      }

      if (timesheetsRes && timesheetsRes.ok) {
        const data = await timesheetsRes.json();
        setTimesheets(data.timesheets || []);
      } else if (timesheetsRes) {
        console.error('Failed to fetch timesheets:', timesheetsRes.status, timesheetsRes.statusText);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Some dashboard data failed to load. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    try {
      setIsResetting(true);
      const response = await fetch(`${API_URL}/reset-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAccessToken() || ''}` }
      });

      if (!response.ok) {
        throw new Error('Failed to reset data');
      }

      const result = await response.json();
      toast.success(`Data reset successful! Deleted ${result.deletedCount} records.`);
      
      // Refresh the dashboard data
      await fetchData();
    } catch (error) {
      console.error('Error resetting data:', error);
      toast.error('Failed to reset data');
    } finally {
      setIsResetting(false);
    }
  };

  const seedDemoData = async () => {
    try {
      toast.info('Seeding demo data...');
      const response = await fetch(`${API_URL}/seed-demo-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() || ''}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Demo data created: ${data.created.employees} employees, ${data.created.clients} clients, ${data.created.immigrationRecords} immigration records`);
        // Refresh the dashboard data
        await fetchData();
      } else {
        toast.error('Failed to seed demo data');
      }
    } catch (error) {
      console.error('Error seeding demo data:', error);
      toast.error('Failed to seed demo data');
    }
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email) {
      toast.error('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    try {
      const response = await fetch(`${ONBOARDING_API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() || ''}`
        },
        body: JSON.stringify(newEmployee)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Employee ${newEmployee.firstName} ${newEmployee.lastName} created successfully`);
        setShowAddEmployeeDialog(false);
        setNewEmployee({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          startDate: '',
          homeState: '',
          employmentType: 'full-time',
        });
        // Refresh dashboard data
        await fetchData();
      } else {
        toast.error('Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee');
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.companyName || !newClient.email) {
      toast.error('Please fill in required fields (Company Name, Email)');
      return;
    }

    try {
      const response = await fetch(`${CLIENT_API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() || ''}`
        },
        body: JSON.stringify(newClient)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Client ${newClient.companyName} created successfully`);
        setShowAddClientDialog(false);
        setNewClient({
          companyName: '',
          legalName: '',
          email: '',
          phone: '',
          industry: '',
          address: '',
        });
        // Refresh dashboard data
        await fetchData();
      } else {
        toast.error('Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };

  // Calculate metrics
  const totalEmployees = employees.length;
  const employeesInOnboarding = employees.filter(e => e.onboardingStatus === 'in-progress').length;
  const employeesCompleted = employees.filter(e => e.onboardingStatus === 'completed').length;
  const employeesWithTimesheetAccess = employees.filter(e => e.canAccessTimesheets).length;

  // Workflow stage breakdown
  const stageBreakdown = employees.reduce((acc, emp) => {
    if (emp.workflow) {
      const stage = emp.workflow.currentStage;
      acc[stage] = (acc[stage] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Classification breakdown
  const classificationBreakdown = employees.reduce((acc, emp) => {
    if (emp.classification) {
      acc[emp.classification] = (acc[emp.classification] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Pending approvals by department
  const pendingApprovalsByDept = employees.reduce((acc, emp) => {
    if (emp.workflow?.departmentApprovals) {
      emp.workflow.departmentApprovals.forEach(approval => {
        if (approval.status === 'pending') {
          acc[approval.department] = (acc[approval.department] || 0) + 1;
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  // Tasks requiring attention
  const tasksRequiringAttention = employees.reduce((acc, emp) => {
    if (emp.workflow?.tasks) {
      const pendingTasks = emp.workflow.tasks.filter(t => t.status === 'pending' || t.status === 'blocked');
      return acc + pendingTasks.length;
    }
    return acc;
  }, 0);

  // Expiring immigration documents (next 30 days)
  const expiringDocs = immigrationRecords.filter(record => {
    if (record.workAuthorizationExpiry) {
      const expiry = new Date(record.workAuthorizationExpiry);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }
    return false;
  });

  // Employees requiring licensing setup
  const requiresLicensing = employees.filter(e => 
    e.workflow?.requiresNewStateLicensing && 
    !e.workflow?.stateWithholdingAccountCreated
  ).length;

  // Document statistics
  const expiringDocuments = documents.filter(doc => 
    doc.expiryDate && 
    new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
    doc.status === 'active'
  ).length;

  const pendingSignatures = documents.filter(doc => 
    doc.requiresSignature && doc.signatureStatus === 'pending'
  ).length;

  // Leave statistics
  const pendingLeaveRequests = leaveRequests.filter(r => r.status === 'pending').length;

  // Offboarding statistics
  const activeOffboarding = offboardingRecords.filter(r => 
    r.status === 'initiated' || r.status === 'in-progress'
  ).length;

  // Performance review statistics
  const pendingReviews = performanceReviews.filter(r => 
    r.status === 'pending-employee' || r.status === 'pending-hr'
  ).length;

  // Client statistics
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active' || c.onboardingStatus === 'completed').length;

  // Business license statistics
  const totalBusinessLicenses = businessLicenses.length;
  const expiringLicenses = businessLicenses.filter(license => {
    if (license.expiryDate) {
      const expiry = new Date(license.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 60; // Within 60 days
    }
    return false;
  }).length;

  // Timesheet statistics
  const pendingTimesheets = timesheets.filter(t => t.status === 'pending' || t.status === 'draft').length;

  // Immigration case statistics
  const totalImmigrationCases = immigrationRecords.length;
  const pendingImmigrationCases = immigrationRecords.filter(r => 
    r.caseStatus === 'in-progress' || r.caseStatus === 'pending'
  ).length;

  // Prepare chart data
  const stageChartData = Object.entries(stageBreakdown).map(([stage, count]) => ({
    name: stage.replaceAll('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: count
  }));

  const classificationChartData = Object.entries(classificationBreakdown).map(([classification, count]) => ({
    name: classification,
    value: count,
    count: count
  }));

  // Premium color palette
  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-2xl p-4 shadow-2xl">
          <p className="text-gray-900 font-medium">{payload[0].name}</p>
          <p className="text-gray-600 text-sm mt-1">
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin mx-auto glow-teal"></div>
          <p className="text-gray-500 mt-6">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="max-w-[1600px] mx-auto px-8 py-12 space-y-10">
        {/* Glass Hero Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl p-12 glass-panel glow-teal interactive-lift">
          <div className="absolute inset-0 gradient-full opacity-30 gradient-animate"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl icon-glass-teal flex items-center justify-center glow-pulse">
                  <Sparkles className="w-7 h-7 text-cyan-500" />
                </div>
                <h1 className="text-white text-5xl font-semibold tracking-tight drop-shadow-lg">Dashboard</h1>
              </div>
              <p className="text-white/90 text-lg drop-shadow">Welcome back, {user?.name}</p>
            </div>
            
            {/* Glass Action Bar */}
            <div className="flex items-center gap-3">
              <div className="glass rounded-2xl p-1">
                <DashboardSettings 
                  preferences={preferences} 
                  onSave={savePreferences}
                />
              </div>
              
              {permissions?.canAccessEmployeeManagement && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={seedDemoData}
                    className="btn-glass text-gray-700 hover:text-gray-900 rounded-xl font-medium"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Seed Demo Data
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="btn-glass text-gray-700 hover:text-gray-900 rounded-xl font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reset Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl glass-strong">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset All System Data</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div>
                            <p>This will permanently delete ALL data from the system including:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                              <li>All employees and their onboarding workflows</li>
                              <li>All clients and business licenses</li>
                              <li>All immigration records, cases, and dependents</li>
                              <li>All documents and timesheets</li>
                              <li>All offboarding, leave requests, and performance reviews</li>
                            </ul>
                            <p className="mt-3 text-sm font-medium">This action cannot be undone.</p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl btn-glass">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleResetData} 
                          disabled={isResetting}
                          className="bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 rounded-xl glow-pink"
                        >
                          {isResetting ? 'Resetting...' : 'Reset All Data'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Glass Quick Actions */}
        {preferences.sections.quickActions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              className="group relative overflow-hidden glass-card rounded-2xl p-10 interactive-lift hover-glow-blue"
              onClick={() => setShowAddClientDialog(true)}
            >
              <div className="absolute inset-0 gradient-teal-blue opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl icon-glass-blue glow-blue flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 font-semibold text-xl">Add Client</p>
                    <p className="text-gray-500 text-sm mt-2">Create new account</p>
                  </div>
                </div>
                <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>
            </button>

            <button 
              className="group relative overflow-hidden glass-card rounded-2xl p-10 interactive-lift hover-glow-purple"
              onClick={() => setShowAlertsDialog(true)}
            >
              <div className="absolute inset-0 gradient-purple-pink opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl icon-glass-purple glow-purple flex items-center justify-center relative">
                    <AlertCircle className="h-8 w-8 text-purple-600" />
                    {expiringDocs.length > 0 && (
                      <span className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold flex items-center justify-center rounded-full shadow-lg glow-pulse">
                        {expiringDocs.length}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 font-semibold text-xl">View Alerts</p>
                    <p className="text-gray-500 text-sm mt-2">System notifications</p>
                  </div>
                </div>
                <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>
            </button>

            <button 
              className="group relative overflow-hidden glass-card rounded-2xl p-10 interactive-lift hover-glow-pink"
              onClick={() => setShowReportsDialog(true)}
            >
              <div className="absolute inset-0 gradient-amber-pink opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl icon-glass-pink glow-pink flex items-center justify-center">
                    <FileText className="h-8 w-8 text-pink-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 font-semibold text-xl">Reports</p>
                    <p className="text-gray-500 text-sm mt-2">Generate analytics</p>
                  </div>
                </div>
                <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>
            </button>
          </div>
        )}

        {/* HR Approval Workflow */}
        {permissions?.canAccessEmployeeManagement && (
          <HRApprovalWorkflow onRefresh={() => fetchData()} />
        )}

        {/* Glass Metrics Grid */}
        {preferences.sections.keyMetrics && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Key Metrics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {preferences.keyMetrics.totalEmployees && (
                <div className="group relative overflow-hidden metric-glass rounded-3xl p-10 interactive-lift hover-glow-teal">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-10">
                      <div className="w-14 h-14 rounded-2xl icon-glass-teal glow-teal flex items-center justify-center">
                        <Users className="h-7 w-7 text-cyan-600" />
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 glass rounded-full px-3 py-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-semibold">+12%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Employees</p>
                      <p className="text-gray-900 text-6xl font-bold mt-4 tracking-tight">{totalEmployees}</p>
                      {totalEmployees > 0 && (
                        <p className="text-gray-400 text-sm mt-6">{employeesCompleted} completed onboarding</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {preferences.keyMetrics.activeOnboarding && (
                <div className="group relative overflow-hidden metric-glass rounded-3xl p-10 interactive-lift hover-glow-blue">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-10">
                      <div className="w-14 h-14 rounded-2xl icon-glass-blue glow-blue flex items-center justify-center">
                        <Activity className="h-7 w-7 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 glass rounded-full px-3 py-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-semibold">+8%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Active Onboarding</p>
                      <p className="text-gray-900 text-6xl font-bold mt-4 tracking-tight">{employeesInOnboarding}</p>
                      {employeesInOnboarding > 0 && (
                        <p className="text-gray-400 text-sm mt-6">{tasksRequiringAttention} tasks pending</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {preferences.keyMetrics.immigrationCases && (
                <div className="group relative overflow-hidden metric-glass rounded-3xl p-10 interactive-lift hover-glow-purple">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-10">
                      <div className="w-14 h-14 rounded-2xl icon-glass-purple glow-purple flex items-center justify-center">
                        <FileText className="h-7 w-7 text-purple-600" />
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 glass rounded-full px-3 py-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-semibold">+5%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Immigration Cases</p>
                      <p className="text-gray-900 text-6xl font-bold mt-4 tracking-tight">{totalImmigrationCases}</p>
                      {pendingImmigrationCases > 0 && (
                        <p className="text-gray-400 text-sm mt-6">{pendingImmigrationCases} pending review</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {preferences.keyMetrics.criticalAlerts && (
                <div className="group relative overflow-hidden metric-glass rounded-3xl p-10 interactive-lift hover-glow-pink">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-10">
                      <div className="w-14 h-14 rounded-2xl icon-glass-pink glow-pink flex items-center justify-center">
                        <AlertCircle className="h-7 w-7 text-pink-600" />
                      </div>
                      {expiringDocs.length > 0 && (
                        <div className="flex items-center gap-1 text-red-600 glass rounded-full px-3 py-1 glow-pulse">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-semibold">Urgent</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Critical Alerts</p>
                      <p className="text-gray-900 text-6xl font-bold mt-4 tracking-tight">{expiringDocs.length}</p>
                      {expiringDocs.length > 0 && (
                        <p className="text-gray-400 text-sm mt-6">Requires immediate attention</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Metrics Grid */}
        {preferences.sections.additionalMetrics && (
          <div className="space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Additional Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {preferences.additionalMetrics.activeClients && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-teal">
                  <div className="w-12 h-12 rounded-xl icon-glass-teal glow-teal flex items-center justify-center mb-6">
                    <Building2 className="h-6 w-6 text-cyan-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Active Clients</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{activeClients}</p>
                  <p className="text-gray-400 text-xs mt-4">of {totalClients} total</p>
                </div>
              )}

              {preferences.additionalMetrics.businessLicenses && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-blue">
                  <div className="w-12 h-12 rounded-xl icon-glass-blue glow-blue flex items-center justify-center mb-6">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Business Licenses</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{totalBusinessLicenses}</p>
                  {expiringLicenses > 0 && (
                    <p className="text-gray-400 text-xs mt-4">{expiringLicenses} expiring soon</p>
                  )}
                </div>
              )}

              {preferences.additionalMetrics.pendingTimesheets && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-purple">
                  <div className="w-12 h-12 rounded-xl icon-glass-purple glow-purple flex items-center justify-center mb-6">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Pending Timesheets</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{pendingTimesheets}</p>
                  <p className="text-gray-400 text-xs mt-4">Awaiting review</p>
                </div>
              )}

              {preferences.additionalMetrics.leaveRequests && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-green">
                  <div className="w-12 h-12 rounded-xl icon-glass-green glow-green flex items-center justify-center mb-6">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Leave Requests</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{pendingLeaveRequests}</p>
                  <p className="text-gray-400 text-xs mt-4">Pending approval</p>
                </div>
              )}

              {preferences.additionalMetrics.activeOffboarding && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-blue">
                  <div className="w-12 h-12 rounded-xl icon-glass-blue glow-blue flex items-center justify-center mb-6">
                    <UserX className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Active Offboarding</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{activeOffboarding}</p>
                  <p className="text-gray-400 text-xs mt-4">In progress</p>
                </div>
              )}

              {preferences.additionalMetrics.pendingReviews && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-amber">
                  <div className="w-12 h-12 rounded-xl icon-glass-amber glow-green flex items-center justify-center mb-6">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Pending Reviews</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{pendingReviews}</p>
                  <p className="text-gray-400 text-xs mt-4">Performance</p>
                </div>
              )}

              {preferences.additionalMetrics.expiringDocuments && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-pink">
                  <div className="w-12 h-12 rounded-xl icon-glass-pink glow-pink flex items-center justify-center mb-6">
                    <FolderOpen className="h-6 w-6 text-pink-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Expiring Documents</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{expiringDocuments}</p>
                  <p className="text-gray-400 text-xs mt-4">Next 30 days</p>
                </div>
              )}

              {preferences.additionalMetrics.pendingSignatures && (
                <div className="glass-card rounded-2xl p-6 interactive-lift hover-glow-purple">
                  <div className="w-12 h-12 rounded-xl icon-glass-purple glow-purple flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Pending Signatures</p>
                  <p className="text-gray-900 text-4xl font-bold mt-3 tracking-tight">{pendingSignatures}</p>
                  <p className="text-gray-400 text-xs mt-4">Awaiting sign-off</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workflow Charts */}
        {preferences.sections.workflowCharts && stageChartData.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Workflow Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Stage Distribution */}
              <div className="glass-card rounded-3xl p-10 interactive-lift">
                <h3 className="text-gray-900 font-semibold text-xl mb-10">Employee Stages</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={stageChartData}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.5)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="url(#colorBar)" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Classification Breakdown */}
              {classificationChartData.length > 0 && (
                <div className="glass-card rounded-3xl p-10 interactive-lift">
                  <h3 className="text-gray-900 font-semibold text-xl mb-10">Classification</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        {COLORS.map((color, index) => (
                          <linearGradient key={index} id={`colorPie${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                            <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={classificationChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="rgba(255, 255, 255, 0.5)"
                        strokeWidth={3}
                      >
                        {classificationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#colorPie${index % COLORS.length})`} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Critical Alerts Section */}
        {expiringDocs.length > 0 && (
          <div className="relative overflow-hidden glass-panel rounded-3xl p-10 glow-pink interactive-lift">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 rounded-2xl icon-glass-pink glow-pink flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-semibold text-xl">Critical Alerts</h2>
                  <p className="text-gray-500 text-sm mt-1">Requires immediate attention</p>
                </div>
              </div>
              <div className="space-y-4">
                {expiringDocs.map((doc, index) => {
                  const employee = employees.find(e => e.id === doc.employeeId);
                  const daysLeft = Math.ceil((new Date(doc.workAuthorizationExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={index} className="flex items-center justify-between p-6 glass rounded-2xl interactive-scale">
                      <div>
                        <p className="text-gray-900 font-medium text-lg">
                          {employee?.firstName} {employee?.lastName}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Work authorization expires in <span className="font-semibold text-red-600">{daysLeft} days</span>
                        </p>
                      </div>
                      <div className="glass rounded-full px-4 py-2 bg-gradient-to-r from-red-500/20 to-rose-600/20">
                        <span className="text-red-600 font-semibold text-sm">Urgent</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Dialog */}
        <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
          <DialogContent className="rounded-3xl glass-strong max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl icon-glass-blue glow-blue flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                Add New Employee
              </DialogTitle>
              <DialogDescription>
                Enter employee details below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                  <Input 
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                    className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                  <Input 
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                    className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Email *</Label>
                <Input 
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Phone</Label>
                <Input 
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Position</Label>
                <Input 
                  value={newEmployee.position}
                  onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                  className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button 
                variant="outline" 
                onClick={() => setShowAddEmployeeDialog(false)}
                className="rounded-xl btn-glass"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateEmployee}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 hover-glow-teal"
              >
                Create Employee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Client Dialog */}
        <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
          <DialogContent className="rounded-3xl glass-strong max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl icon-glass-blue glow-blue flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                Add New Client
              </DialogTitle>
              <DialogDescription>
                Enter client details below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Company Name *</Label>
                  <Input 
                    value={newClient.companyName}
                    onChange={(e) => setNewClient({...newClient, companyName: e.target.value})}
                    className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Legal Name</Label>
                  <Input 
                    value={newClient.legalName}
                    onChange={(e) => setNewClient({...newClient, legalName: e.target.value})}
                    className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Email *</Label>
                <Input 
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Phone</Label>
                <Input 
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Industry</Label>
                <Input 
                  value={newClient.industry}
                  onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                  className="mt-2 rounded-xl glass border-0 focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button 
                variant="outline" 
                onClick={() => setShowAddClientDialog(false)}
                className="rounded-xl btn-glass"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateClient}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 hover-glow-teal"
              >
                Create Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alerts Dialog */}
        <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
          <DialogContent className="max-w-2xl rounded-3xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl icon-glass-purple glow-purple flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                </div>
                System Alerts
              </DialogTitle>
              <DialogDescription>
                View all system notifications and alerts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-8">
              {expiringDocs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full icon-glass-green glow-green flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <p className="text-gray-600 font-medium text-lg">No critical alerts</p>
                  <p className="text-gray-400 text-sm mt-2">All systems operating normally</p>
                </div>
              ) : (
                expiringDocs.map((doc, index) => {
                  const employee = employees.find(e => e.id === doc.employeeId);
                  const daysLeft = Math.ceil((new Date(doc.workAuthorizationExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={index} className="p-6 glass-card rounded-2xl interactive-scale">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl icon-glass-pink glow-pink flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-6 w-6 text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium text-lg">
                            {employee?.firstName} {employee?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Work authorization expires in <span className="font-semibold text-red-600">{daysLeft} days</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Reports Dialog */}
        <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
          <DialogContent className="rounded-3xl glass-strong">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl icon-glass-pink glow-pink flex items-center justify-center">
                  <FileText className="h-5 w-5 text-pink-600" />
                </div>
                Generate Reports
              </DialogTitle>
              <DialogDescription>
                Select a report to generate and download
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-8">
              <button className="w-full text-left p-6 glass-card rounded-2xl interactive-lift hover-glow-teal group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-lg">Employee Onboarding Report</p>
                    <p className="text-sm text-gray-500 mt-2">Detailed workflow status and analytics</p>
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                </div>
              </button>
              <button className="w-full text-left p-6 glass-card rounded-2xl interactive-lift hover-glow-blue group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-lg">Immigration Compliance Report</p>
                    <p className="text-sm text-gray-500 mt-2">Expiration tracking and compliance status</p>
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
              <button className="w-full text-left p-6 glass-card rounded-2xl interactive-lift hover-glow-purple group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-lg">Timesheet Summary</p>
                    <p className="text-sm text-gray-500 mt-2">Pending approvals and hours breakdown</p>
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </button>
              <button className="w-full text-left p-6 glass-card rounded-2xl interactive-lift hover-glow-pink group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-lg">Client Portfolio Report</p>
                    <p className="text-sm text-gray-500 mt-2">Active accounts and engagement metrics</p>
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-gray-400 group-hover:text-pink-600 transition-colors" />
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
