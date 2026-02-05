import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  AlertCircle,
  Calendar,
  User,
  Building2,
  FilePen,
  Circle,
  XCircle,
  ShieldCheck,
  Briefcase,
  Users,
  CheckCircle,
} from "lucide-react";
import { Timesheets } from "./timesheets";
import { UserMenu } from "./user-menu";
import { EmployeeDocumentUpload } from "./employee-document-upload";
import { EmployeeImmigrationPortal } from "./employee-immigration-portal";
import { EmployeeProfileCompletion } from "./employee-profile-completion";
import { EmployeeLeave } from "./employee-leave";
import { PasswordResetDialog } from "./password-reset-dialog";
import { useAuth } from "../lib/auth-context";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import { toast } from "sonner";
import type { Employee, WorkflowTask, TaskStatus, DepartmentApproval } from "../types";

const API_URL = (import.meta as any).env.VITE_ONBOARDING_API_URL || API_ENDPOINTS.EMPL_ONBORDING;

// Utility function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: string): string => {
  if (!dateString) return '';
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
};

export function EmployeePortal() {
  const { user, logout, userPermissions: permissions } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  
  useEffect(() => {
    if (user?.email) {
      fetchEmployeeData();
    }
    
    // Listen for document upload events to refresh employee data
    const handleRefresh = () => {
      if (user?.email) {
        fetchEmployeeData();
      }
    };
    
    window.addEventListener('refreshEmployeeData', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshEmployeeData', handleRefresh);
    };
  }, [user]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/employee`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      }).catch((fetchError) => {
        console.error('Network error fetching employee data:', fetchError);
        throw new Error('Unable to connect to server');
      });
      
      if (response.ok) {
        const data = await response.json();
        // The API returns { requests: [...] }
        const requests = data.requests || [];
        const employee = requests.find((emp: any) => emp.email === user?.email);
        
        console.log('[Employee Portal] Fetched employee data:', {
          email: employee?.email,
          status: employee?.status,
          workflow: employee?.workflow
        });
        
        if (employee) {
          // Fetch detailed employee data to get documents and other fields not in list view
          try {
            const detailResponse = await fetch(`${API_URL}/employee/${employee.id}`, {
              headers: { 
                'Authorization': `Bearer ${token}` 
              }
            });
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              console.log('[Employee Portal] Fetched detailed employee data:', detailData.employee);
              setEmployeeData(detailData.employee);
              
              // Check if profile needs completion
              if (detailData.employee.profileCompleted === false || 
                  detailData.employee.status === 'invited' || 
                  detailData.employee.status === 'awaiting_hr_review') {
                setShowProfileCompletion(true);
              }
            } else {
              setEmployeeData(employee);
              if (employee.profileCompleted === false || employee.status === 'invited') {
                setShowProfileCompletion(true);
              }
            }
          } catch (detailErr) {
            console.error('Error fetching detailed employee data:', detailErr);
            setEmployeeData(employee);
          }
        } else {
          toast.error('Employee profile not found. Please contact HR.');
        }
      } else {
        // Handle HTTP error responses
        let errorMessage = 'Failed to load employee data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch (e) {
          // Response wasn't JSON, use default message
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load employee data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileCompletion(false);
    fetchEmployeeData(); // Refresh employee data
    toast.success('Welcome! Your profile has been completed.');
  };

  const handleGrantTimesheetAccess = async () => {
    if (!employeeData?.id) return;
    
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/employee/${employeeData.id}/timesheet-access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ canAccessTimesheets: true })
      });

      if (response.ok) {
        toast.success('Timesheet access granted successfully!');
        await fetchEmployeeData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to grant access: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error granting timesheet access:', error);
      toast.error('Failed to grant timesheet access');
    }
  };

  const calculateProgress = (): number => {
    // If onboarding status is completed, show 100%
    if (employeeData?.onboardingStatus === 'completed') return 100;
    
    if (!employeeData?.workflow) return 0;
    
    const completedTasks = employeeData.workflow.tasks.filter(t => t.status === 'completed').length;
    const totalTasks = employeeData.workflow.tasks.length;
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTaskStatusBadge = (status: TaskStatus) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'blocked': 'bg-red-100 text-red-700'
    };

    return (
      <Badge className={colors[status]}>
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  const getApprovalBadge = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'}>
        {status}
      </Badge>
    );
  };

  const canAccessTimesheets = (): boolean => {
    // First check if the employee has been explicitly granted timesheet access
    if (employeeData?.canAccessTimesheets === true) {
      return true;
    }
    
    // Otherwise, check if all workflow conditions are met
    if (!employeeData?.workflow) return false;
    
    const allApprovalsGranted = (employeeData.workflow.departmentApprovals || []).every(
      approval => approval.status === 'approved'
    );
    
    const classificationComplete = employeeData.workflow.classificationVerified === true;
    
    return allApprovalsGranted && classificationComplete && employeeData.workflow.currentStage === 'completed';
  };

  const getTasksByStage = (stage: string): WorkflowTask[] => {
    if (!employeeData?.workflow || !employeeData.workflow.tasks) return [];
    
    // Filter tasks that have the stage property
    const tasksWithStage = employeeData.workflow.tasks.filter(task => task.stage === stage);
    
    // If no tasks have stages defined, fall back to filtering by task name/department
    // This handles legacy data that doesn't have the stage property
    if (employeeData.workflow.tasks.length > 0 && employeeData.workflow.tasks.every(t => !t.stage)) {
      // Legacy fallback: infer stage from task name/department
      const stageKeywords: Record<string, string[]> = {
        'initiation': ['confirm project rate', 'client confirmation', 'congratulations'],
        'data-collection': ['collect home address', 'collect work authorization', 'collect government', 'issue offer', 'issue nda'],
        'verification': ['i-9', 'e-verify', 'immigration', 'handbook', 'policies', 'client-specific'],
        'payroll-setup': ['adp', 'pay rate', 'pay schedule', 'deductions', 'state compliance'],
        'licensing': ['state withholding', 'unemployment', 'workers'],
        'classification': ['classify employee', 'link to client', 'verify classification'],
        'finalization': ['final sign-off']
      };
      
      const keywords = stageKeywords[stage] || [];
      return employeeData.workflow.tasks.filter(task => 
        keywords.some(keyword => task.taskName?.toLowerCase().includes(keyword.toLowerCase()))
      );
    }
    
    return tasksWithStage;
  };

  const getStageProgress = (stage: string): number => {
    const tasks = getTasksByStage(stage);
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Show profile completion flow if needed
  if (showProfileCompletion && employeeData) {
    return (
      <EmployeeProfileCompletion 
        employee={employeeData}
        onComplete={handleProfileComplete}
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your employee profile...</p>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card className="max-w-md shadow-xl border-none">
          <CardContent className="p-12 text-center space-y-6">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
              <p className="text-gray-600">
                Your employee profile has not been created yet. Please contact HR to complete your onboarding.
              </p>
            </div>
            
            <div className="pt-4 space-y-3">
              <Button 
                onClick={() => fetchEmployeeData()} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Retry Loading Profile
              </Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'} 
                  className="flex-1"
                >
                  Return to Login
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => logout()} 
                  className="flex-1"
                >
                  Logout
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 font-medium">
                Logged in as
              </p>
              <p className="text-sm text-blue-600 font-semibold break-all">
                {user?.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = calculateProgress();
  const workflow = employeeData.workflow;

  return (
    <div className="h-screen overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">Employee Portal</h1>
            <p className="text-muted-foreground">
              Welcome, {employeeData.firstName} {employeeData.lastName}!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Onboarding Progress</div>
              <div>{progressPercentage}%</div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-green-600 flex items-center justify-center">
              <span className="text-sm">{progressPercentage}%</span>
            </div>
            <UserMenu />
          </div>
        </div>

        {/* Onboarding Status Alert */}
        {!canAccessTimesheets() && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Onboarding In Progress</AlertTitle>
            <AlertDescription className="text-blue-700">
              Your onboarding is being processed. You will gain access to timesheets once all workflow stages are completed and approved.
            </AlertDescription>
          </Alert>
        )}

        {canAccessTimesheets() && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Onboarding Complete!</AlertTitle>
            <AlertDescription className="text-green-700">
              Congratulations! Your onboarding is complete. You now have full access to submit timesheets.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {workflow && !workflow.allMandatoryDocumentsCollected && (
                <Badge className="ml-2 bg-orange-500 text-white px-1.5 py-0 text-xs h-5">
                  {workflow.pendingDocumentRequests || 0}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="immigration">Immigration</TabsTrigger>
            <TabsTrigger value="timesheets">
              Timesheets
              {!canAccessTimesheets() && (
                <Badge className="ml-2 bg-red-500 text-white px-1.5 py-0 text-xs h-5">
                  Locked
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leave">
              Leave & PTO
              {!canAccessTimesheets() && (
                <Badge className="ml-2 bg-red-500 text-white px-1.5 py-0 text-xs h-5">
                  Locked
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <EmployeeDocumentUpload employee={employeeData} user={user} />
          </TabsContent>

          {/* Immigration Tab */}
          <TabsContent value="immigration" className="space-y-6">
            <EmployeeImmigrationPortal employeeEmail={employeeData.email} />
          </TabsContent>

          {/* Leave & PTO Tab */}
          <TabsContent value="leave" className="space-y-6">
            <EmployeeLeave employeeData={employeeData} />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Full Name</div>
                    <div>{employeeData.firstName} {employeeData.lastName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div>{employeeData.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date of Birth</div>
                    <div>{employeeData.dateOfBirth ? formatDateWithoutTimezone(employeeData.dateOfBirth) : 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone Number</div>
                    <div>{employeeData.phoneNumber || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div>
                      {employeeData.address ? (
                        <>
                          {employeeData.address}<br />
                          {employeeData.city && employeeData.state && employeeData.zipCode 
                            ? `${employeeData.city}, ${employeeData.state} ${employeeData.zipCode}`
                            : 'Not set'}
                        </>
                      ) : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Position</div>
                    <div>{employeeData.position || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Department</div>
                    <div>{employeeData.department || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Start Date</div>
                    <div>{employeeData.startDate ? formatDateWithoutTimezone(employeeData.startDate) : 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Home State</div>
                    <div>{employeeData.homeState || 'Not set'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge className="bg-green-100 text-green-800">{employeeData.onboardingStatus}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Classification & Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Classification & Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Employee Type</div>
                    <Badge className="bg-purple-100 text-purple-800">
                      {employeeData.classification || 'Not yet classified'}
                    </Badge>
                  </div>
                  {employeeData.classification === 'billable' && (
                    <>
                      <div>
                        <div className="text-sm text-muted-foreground">Assigned Client</div>
                        <div>{employeeData.clientName || 'Not assigned'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Purchase Order</div>
                        <div>{employeeData.purchaseOrder || 'Not assigned'}</div>
                      </div>
                    </>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Timesheet Access</div>
                    {canAccessTimesheets() ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Pending approval</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Classification Verified</div>
                    {workflow?.classificationVerified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        <span>Pending verification</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Documents Alert */}
            {workflow && !workflow.allMandatoryDocumentsCollected && workflow.pendingDocumentRequests > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <Upload className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Documents Required</AlertTitle>
                <AlertDescription className="text-orange-700">
                  You have {workflow.pendingDocumentRequests} pending document{workflow.pendingDocumentRequests > 1 ? 's' : ''} to upload. 
                  <Button 
                    variant="link" 
                    className="text-orange-800 underline p-0 h-auto ml-1"
                    onClick={() => setActiveTab('documents')}
                  >
                    Upload documents now →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Workflow Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Progress</CardTitle>
                <CardDescription>
                  Track your onboarding workflow stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Overall Progress</span>
                    <span className="text-sm">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {workflow && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Current Stage</div>
                      <Badge variant="outline" className="mt-1">
                        {workflow.currentStage.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Stage Completion</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Initiation</span>
                          <span className="font-medium">{getStageProgress('initiation')}%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Data Collection</span>
                          <span className="font-medium">{getStageProgress('data-collection')}%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Verification</span>
                          <span className="font-medium">{getStageProgress('verification')}%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Payroll Setup</span>
                          <span className="font-medium">{getStageProgress('payroll-setup')}%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Licensing</span>
                          <span className="font-medium">{getStageProgress('licensing')}%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>Classification</span>
                          <span className="font-medium">{getStageProgress('classification')}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timesheets Tab */}
          <TabsContent value="timesheets">
            {canAccessTimesheets() ? (
              <Timesheets employeeEmail={employeeData.email} employeeData={employeeData} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  {/* HR Admin Override Panel - Show at top */}
                  {permissions?.canManageEmployees && employeeData && (
                    <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="h-5 w-5 text-blue-700" />
                        <h3 className="font-semibold text-blue-900">HR Admin Controls</h3>
                      </div>
                      
                      <div className="text-left space-y-2 mb-4 bg-white p-4 rounded border border-blue-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">📊 Diagnostic Information:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Onboarding Status:</span>
                            <Badge variant={employeeData.onboardingStatus === 'completed' ? 'default' : 'outline'}>
                              {employeeData.onboardingStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Timesheet Access:</span>
                            <span className={employeeData.canAccessTimesheets ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {employeeData.canAccessTimesheets ? '✅ Enabled' : '🔒 Locked'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Workflow Stage:</span>
                            <span className="font-medium capitalize">{workflow?.currentStage?.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Classification:</span>
                            <span className={workflow?.classificationVerified ? 'text-green-600' : 'text-gray-500'}>
                              {workflow?.classificationVerified ? '✅ Verified' : '⏳ Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Approvals:</span>
                            <span className={(workflow?.departmentApprovals || []).every(a => a.status === 'approved') ? 'text-green-600' : 'text-gray-500'}>
                              {(workflow?.departmentApprovals || []).filter(a => a.status === 'approved').length}/{(workflow?.departmentApprovals || []).length}
                            </span>
                          </div>
                          {employeeData.onboardingDocuments && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Documents:</span>
                              <span className={employeeData.onboardingDocuments.every((d: any) => !d.required || d.status === 'approved') ? 'text-green-600' : 'text-gray-500'}>
                                {employeeData.onboardingDocuments.filter((d: any) => d.status === 'approved').length}/{employeeData.onboardingDocuments.filter((d: any) => d.required).length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleGrantTimesheetAccess}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          🔓 Force Enable Timesheet Access
                        </Button>
                        <Button
                          onClick={() => window.location.href = '#/employees'}
                          variant="outline"
                          size="lg"
                        >
                          Go to Employee Onboarding
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-3">
                        💡 You can also enable access in Employee Onboarding → Workflow tab
                      </p>
                    </div>
                  )}

                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="mb-2">Timesheet Access Restricted</h2>
                  <p className="text-muted-foreground mb-4">
                    You don't have access to timesheets yet. Please complete your onboarding process first.
                  </p>
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Requirements:</p>
                    <ul className="text-left inline-block">
                      <li className="flex items-center gap-2">
                        {workflow?.currentStage === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        Complete all workflow stages
                      </li>
                      <li className="flex items-center gap-2">
                        {(workflow?.departmentApprovals || []).every(a => a.status === 'approved') ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        Receive all department approvals
                      </li>
                      <li className="flex items-center gap-2">
                        {workflow?.classificationVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        Complete classification verification
                      </li>
                    </ul>
                  </div>

                  {/* Debug info for HR/Admin */}
                  {permissions?.canManageEmployees && employeeData && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="font-medium text-sm mb-3">🔧 HR Admin Diagnostic Info:</p>
                      <div className="text-xs text-left inline-block space-y-1 bg-gray-50 p-3 rounded">
                        <p><strong>Onboarding Status:</strong> {employeeData.onboardingStatus}</p>
                        <p><strong>Can Access Timesheets:</strong> {employeeData.canAccessTimesheets ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Workflow Stage:</strong> {workflow?.currentStage}</p>
                        <p><strong>Classification Verified:</strong> {workflow?.classificationVerified ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>All Approvals:</strong> {(workflow?.departmentApprovals || []).every(a => a.status === 'approved') ? '✅ Yes' : '❌ No'}</p>
                        {employeeData.onboardingDocuments && (
                          <p><strong>All Docs Approved:</strong> {employeeData.onboardingDocuments.every((d: any) => !d.required || d.status === 'approved') ? '✅ Yes' : '❌ No'}</p>
                        )}
                      </div>
                      {employeeData.onboardingStatus === 'completed' && !employeeData.canAccessTimesheets && (
                        <Button
                          onClick={handleGrantTimesheetAccess}
                          className="mt-3"
                          size="sm"
                        >
                          🔓 Manually Grant Timesheet Access
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
