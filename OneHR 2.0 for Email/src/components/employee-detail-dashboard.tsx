import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft, User, FileText, Briefcase, Calendar, Award, 
  Shield, Clock, MapPin, Mail, Phone, Building2, CheckCircle2,
  AlertCircle, Download, Eye, Edit, History, DollarSign,
  UserCheck, XCircle, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { Employee } from '../types';
import { DocumentCollectionPanel } from './document-collection-panel';
import { HRDocumentWorkflow } from './hr-document-workflow';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// Utility function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: string): string => {
  if (!dateString) return '';
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return format(date, 'MMM dd, yyyy');
};

interface EmployeeDetailDashboardProps {
  employeeId: string;
  onBack: () => void;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  category: 'personal' | 'immigration' | 'document' | 'workflow' | 'classification' | 'project' | 'leave' | 'performance';
}

export function EmployeeDetailDashboard({ employeeId, onBack }: EmployeeDetailDashboardProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [immigrationRecords, setImmigrationRecords] = useState<any[]>([]);
  const [immigrationFilings, setImmigrationFilings] = useState<any[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [ptoBalance, setPtoBalance] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState<any[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]); // NEW: Multiple client IDs
  const [showEmploymentInfoDialog, setShowEmploymentInfoDialog] = useState(false);
  const [employmentInfo, setEmploymentInfo] = useState({
    startDate: '',
    employmentType: '',
    classification: '',
    department: '',
    manager: '',
    salary: ''
  });

  useEffect(() => {
    fetchEmployeeData();
    fetchClients();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Store fetched data locally to use for audit log generation
      let fetchedEmployee: any = null;
      let fetchedDocs: any[] = [];
      let fetchedImmigration: any[] = [];
      let fetchedFilings: any[] = [];
      let fetchedProjects: any[] = [];
      let fetchedLeave: any[] = [];
      let fetchedReviews: any[] = [];

      // Fetch employee details
      try {
        const employeeRes = await fetch(`${API_URL}/employees/${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (employeeRes.ok) {
          const data = await employeeRes.json();
          fetchedEmployee = data.employee;
          setEmployee(data.employee);
        }
      } catch (err) {
        console.error('Error fetching employee:', err);
      }

      // Fetch documents
      try {
        const docsRes = await fetch(`${API_URL}/documents?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (docsRes.ok) {
          const data = await docsRes.json();
          fetchedDocs = data.documents || [];
          setDocuments(fetchedDocs);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      }

      // Fetch immigration records
      try {
        const immigrationRes = await fetch(`${API_URL}/immigration/records?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (immigrationRes.ok) {
          const data = await immigrationRes.json();
          fetchedImmigration = data.records || [];
          setImmigrationRecords(fetchedImmigration);
        }
      } catch (err) {
        console.error('Error fetching immigration records:', err);
      }

      // Fetch immigration filings
      try {
        const filingsRes = await fetch(`${API_URL}/immigration/filings?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (filingsRes.ok) {
          const data = await filingsRes.json();
          fetchedFilings = data.filings || [];
          setImmigrationFilings(fetchedFilings);
        }
      } catch (err) {
        console.error('Error fetching immigration filings:', err);
      }

      // Fetch project assignments
      try {
        const projectsRes = await fetch(`${API_URL}/project-assignments?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          fetchedProjects = data.assignments || [];
          setProjectAssignments(fetchedProjects);
        }
      } catch (err) {
        console.error('Error fetching project assignments:', err);
      }

      // Fetch leave requests
      try {
        const leaveRes = await fetch(`${API_URL}/leave-requests?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (leaveRes.ok) {
          const data = await leaveRes.json();
          fetchedLeave = data.leaveRequests || [];
          setLeaveRequests(fetchedLeave);
        }
      } catch (err) {
        console.error('Error fetching leave requests:', err);
      }

      // Fetch performance reviews
      try {
        const reviewsRes = await fetch(`${API_URL}/performance-reviews?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          fetchedReviews = data.performanceReviews || [];
        setPerformanceReviews(fetchedReviews);
        }
      } catch (err) {
        console.error('Error fetching performance reviews:', err);
      }

      // Fetch PTO balance
      try {
        const ptoRes = await fetch(`${API_URL}/leave-requests/pto-balance/${employeeId}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (ptoRes.ok) {
          const data = await ptoRes.json();
          setPtoBalance(data.balance);
        }
      } catch (err) {
        console.error('Error fetching PTO balance:', err);
      }

      // Generate comprehensive audit logs from fetched data
      generateAuditLogs(fetchedEmployee, fetchedDocs, fetchedImmigration, fetchedFilings, fetchedProjects, fetchedLeave, fetchedReviews);

    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const generateAuditLogs = (
    emp: any, 
    docs: any[], 
    immigration: any[], 
    filings: any[], 
    projects: any[], 
    leave: any[], 
    reviews: any[]
  ) => {
    const logs: AuditLog[] = [];
    
    if (emp) {
      // Add employee creation log
      logs.push({
        id: `create-${emp.id}`,
        timestamp: emp.createdAt || new Date().toISOString(),
        action: 'Employee Created',
        performedBy: 'System',
        details: `Employee ${emp.firstName} ${emp.lastName} was created in the system`,
        category: 'personal'
      });

      // Add workflow logs
      if (emp.workflow?.tasks) {
        emp.workflow.tasks.forEach((task: any, index: number) => {
          if (task.status === 'completed' && task.completedAt) {
            logs.push({
              id: `task-${task.id}-${index}`,
              timestamp: task.completedAt,
              action: 'Task Completed',
              performedBy: task.completedBy || 'System',
              details: `Workflow task "${task.name}" completed`,
              category: 'workflow'
            });
          }
        });
      }
      
      // Add department approval logs
      if (emp.workflow?.departmentApprovals) {
        emp.workflow.departmentApprovals.forEach((approval: any) => {
          if (approval.status !== 'pending' && approval.approvedAt) {
            logs.push({
              id: `approval-${approval.department}`,
              timestamp: approval.approvedAt,
              action: `${approval.department} Approval ${approval.status === 'approved' ? 'Granted' : 'Rejected'}`,
              performedBy: approval.approvedBy || 'System',
              details: `${approval.department} department ${approval.status} employee onboarding`,
              category: 'workflow'
            });
          }
        });
      }

      // Add classification log
      if (emp.classification) {
        logs.push({
          id: `classification-${emp.id}`,
          timestamp: emp.classificationDate || emp.createdAt || new Date().toISOString(),
          action: 'Classification Assigned',
          performedBy: emp.classifiedBy || 'System',
          details: `Employee classified as ${emp.classification}`,
          category: 'classification'
        });
      }

      // Add timesheet access log
      if (emp.canAccessTimesheets) {
        logs.push({
          id: `timesheet-${emp.id}`,
          timestamp: emp.timesheetAccessGrantedAt || new Date().toISOString(),
          action: 'Timesheet Access Granted',
          performedBy: 'System',
          details: 'Employee granted access to timesheet system',
          category: 'workflow'
        });
      }
    }
    
    // Add document logs
    docs.forEach((doc: any) => {
      logs.push({
        id: `doc-${doc.id}`,
        timestamp: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
        action: 'Document Uploaded',
        performedBy: doc.uploadedBy || 'Employee',
        details: `Document "${doc.documentType || doc.name}" uploaded`,
        category: 'document'
      });
    });
    
    // Add immigration logs
    immigration.forEach((record: any) => {
      logs.push({
        id: `immigration-${record.id}`,
        timestamp: record.createdAt || new Date().toISOString(),
        action: 'Immigration Record Added',
        performedBy: record.createdBy || 'HR',
        details: `Immigration status set to ${record.currentStatus}${record.visaType ? ` (${record.visaType})` : ''}`,
        category: 'immigration'
      });
    });
    
    // Add immigration filing logs
    filings.forEach((filing: any) => {
      logs.push({
        id: `filing-${filing.id}`,
        timestamp: filing.filedDate || filing.createdAt || new Date().toISOString(),
        action: `${filing.filingType} Filed`,
        performedBy: filing.filedBy || 'Immigration Team',
        details: `${filing.filingType} filed${filing.receiptNumber ? ` (Receipt: ${filing.receiptNumber})` : ''}`,
        category: 'immigration'
      });
      
      // Add approval log if approved
      if (filing.status === 'approved' && filing.approvalDate) {
        logs.push({
          id: `filing-approved-${filing.id}`,
          timestamp: filing.approvalDate,
          action: `${filing.filingType} Approved`,
          performedBy: 'USCIS',
          details: `${filing.filingType} approved${filing.validTo ? `, valid until ${new Date(filing.validTo).toLocaleDateString()}` : ''}`,
          category: 'immigration'
        });
      }
    });
    
    // Add project assignment logs
    projects.forEach((project: any) => {
      logs.push({
        id: `project-${project.id}`,
        timestamp: project.createdAt || new Date().toISOString(),
        action: 'Project Assignment',
        performedBy: project.assignedBy || 'Project Manager',
        details: `Assigned to project "${project.projectName}" for ${project.clientName} at $${project.billingRate}/hr`,
        category: 'project'
      });
    });
    
    // Add leave request logs
    leave.forEach((request: any) => {
      logs.push({
        id: `leave-${request.id}`,
        timestamp: request.requestedAt || request.createdAt || new Date().toISOString(),
        action: 'Leave Request Submitted',
        performedBy: 'Employee',
        details: `${request.leaveType} leave requested from ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()} (${request.numberOfDays || 1} days)`,
        category: 'leave'
      });
      
      // Add approval/rejection log
      if (request.status !== 'pending' && request.reviewedAt) {
        logs.push({
          id: `leave-reviewed-${request.id}`,
          timestamp: request.reviewedAt,
          action: `Leave Request ${request.status === 'approved' ? 'Approved' : 'Rejected'}`,
          performedBy: request.reviewedBy || 'Manager',
          details: `${request.leaveType} leave ${request.status}`,
          category: 'leave'
        });
      }
    });
    
    // Add performance review logs
    reviews.forEach((review: any) => {
      logs.push({
        id: `review-${review.id}`,
        timestamp: review.reviewDate || review.createdAt || new Date().toISOString(),
        action: 'Performance Review Completed',
        performedBy: review.reviewerName || 'Manager',
        details: `${review.reviewType} review for ${review.reviewPeriod} - Overall rating: ${review.overallRating || 'N/A'}/5`,
        category: 'performance'
      });
    });

    // Sort logs by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAuditLogs(logs);
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const handleUpdateClientAssignment = async () => {
    try {
      // Convert "none" to null for unassigning
      const actualClientId = selectedClientId === "none" ? null : selectedClientId;
      const selectedClient = clients.find(c => c.id === actualClientId);
      
      const response = await fetch(`${API_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          clientId: actualClientId,
          clientName: selectedClient?.companyName || selectedClient?.legalName || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update client assignment');
      }

      toast.success('Client assignment updated successfully');
      setShowClientDialog(false);
      fetchEmployeeData();
    } catch (error) {
      console.error('Error updating client assignment:', error);
      toast.error('Failed to update client assignment');
    }
  };

  const handleUpdateEmploymentInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          startDate: employmentInfo.startDate || null,
          employmentType: employmentInfo.employmentType || null,
          classification: employmentInfo.classification || null,
          department: employmentInfo.department || null,
          manager: employmentInfo.manager || null,
          salary: employmentInfo.salary ? parseFloat(employmentInfo.salary) : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update employment information');
      }

      toast.success('Employment information updated successfully');
      setShowEmploymentInfoDialog(false);
      fetchEmployeeData();
    } catch (error) {
      console.error('Error updating employment information:', error);
      toast.error('Failed to update employment information');
    }
  };

  const handleApproveChanges = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}/approve-changes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        toast.success("Changes approved successfully");
        fetchEmployeeData();
      } else {
        toast.error("Failed to approve changes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve changes");
    }
  };

  const handleRejectChanges = async () => {
    try {
      const response = await fetch(`${API_URL}/employees/${employeeId}/reject-changes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        toast.success("Changes rejected");
        fetchEmployeeData();
      } else {
        toast.error("Failed to reject changes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject changes");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Loading employee details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Employee not found</AlertDescription>
        </Alert>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </div>
    );
  }

  const workflowProgress = employee.workflow?.tasks 
    ? Math.round((employee.workflow.tasks.filter(t => t.status === 'completed').length / employee.workflow.tasks.length) * 100)
    : 0;

  // Function to determine next step in the onboarding process
  const getNextStep = () => {
    // If HR approval needed (created by recruiter)
    if (employee.needsHRApproval && !employee.hrApproved) {
      return { text: 'HR needs to approve this employee', color: 'text-orange-600', icon: '👤', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    }

    // Check if employee has rejected documents
    const hasRejectedDocs = employee.onboardingDocuments?.some((doc: any) => doc.status === 'rejected');
    if (hasRejectedDocs) {
      return { text: 'Employee needs to re-upload rejected documents', color: 'text-red-600', icon: '📄', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    }

    // Check if employee has documents not yet uploaded
    const hasNotUploadedDocs = employee.onboardingDocuments?.some((doc: any) => doc.status === 'not-uploaded');
    if (hasNotUploadedDocs) {
      const stage = employee.workflow?.currentStage;
      if (stage === 'employee-setup') {
        return { text: 'Employee needs to upload required documents', color: 'text-blue-600', icon: '📤', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      }
    }

    // If onboarding documents are pending review
    const hasPendingDocs = employee.onboardingDocuments?.some((doc: any) => doc.status === 'pending-review');
    if (hasPendingDocs) {
      return { text: 'HR needs to review uploaded documents', color: 'text-orange-600', icon: '👀', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    }

    // Check workflow stage for specific next steps
    if (employee.workflow) {
      const { currentStage, tasks } = employee.workflow;

      // Check for incomplete tasks in current stage
      const stageTasks = tasks?.filter((t: any) => 
        t.workflowStage === currentStage && t.status !== 'completed'
      ) || [];

      if (stageTasks.length > 0) {
        const nextTask = stageTasks[0];
        return { 
          text: `${nextTask.assignedDepartment || 'HR'} needs to: ${nextTask.taskName}`, 
          color: 'text-blue-600', 
          icon: '📋',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      }

      // Stage-specific next steps with clearer messaging
      if (currentStage === 'hr-setup' || currentStage === 'initiation') {
        return { text: 'HR needs to complete initial employee setup', color: 'text-orange-600', icon: '⚙️', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      } else if (currentStage === 'employee-setup') {
        return { text: 'Employee needs to complete their profile and upload documents', color: 'text-blue-600', icon: '👤', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      } else if (currentStage === 'hr-review') {
        return { text: 'HR needs to review and approve employee documents', color: 'text-orange-600', icon: '👀', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      }
    }

    // Completed
    if (employee.onboardingStatus === 'completed') {
      return { text: 'Onboarding Complete - Employee can access timesheets', color: 'text-green-600', icon: '✅', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    }

    // Default - still provide some guidance
    return { text: 'Continue onboarding workflow', color: 'text-gray-600', icon: '⏳', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl">{employee.firstName} {employee.lastName}</h1>
            <p className="text-sm text-muted-foreground">{employee.position || 'No position set'} • {employee.department || 'No department'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={employee.onboardingStatus === 'completed' ? 'default' : 'secondary'}>
            {employee.onboardingStatus || 'pending'}
          </Badge>
          {employee.classification && (
            <Badge variant="outline">{employee.classification}</Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Onboarding Progress</p>
                <p className="text-2xl font-semibold">{workflowProgress}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={workflowProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-semibold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-semibold">{projectAssignments.filter(p => p.status === 'active').length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PTO Remaining</p>
                <p className="text-2xl font-semibold">{ptoBalance?.remaining || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Changes Alert */}
      {(employee as any).pendingProfileChanges && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 font-medium">Pending Profile Updates</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-orange-800 mb-3">
              The employee has requested changes to their profile information. Review the changes below:
            </p>
            <div className="bg-white rounded-md border border-orange-200 p-4 mb-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium text-gray-500">Field</div>
                <div className="font-medium text-gray-500">Current Value</div>
                <div className="font-medium text-gray-500">New Value</div>
                
                {Object.entries((employee as any).pendingProfileChanges).map(([key, value]) => {
                  if (key === 'requestedAt') return null;
                  return (
                    <div key={key} className="contents border-b border-gray-100 last:border-0">
                      <div className="capitalize py-2">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="py-2 text-gray-600">{(employee as any)[key] || '-'}</div>
                      <div className="py-2 font-medium text-gray-900">{String(value)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApproveChanges} className="bg-orange-600 hover:bg-orange-700 text-white">
                Approve Changes
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectChanges} className="border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                Reject
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            <Upload className="h-4 w-4 mr-2" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="immigration">
            <Shield className="h-4 w-4 mr-2" />
            Immigration
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Briefcase className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="leave">
            <Calendar className="h-4 w-4 mr-2" />
            Leave/PTO
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Award className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4 mr-2" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2 break-all">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="break-all">{employee.email}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      {employee.phone || (employee as any).phoneNumber || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{employee.dateOfBirth ? (() => {
                      // Parse date without timezone conversion
                      const [year, month, day] = employee.dateOfBirth.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return format(date, 'MMM dd, yyyy');
                    })() : 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">SSN</p>
                    <p className="font-medium">
                      {employee.ssn 
                        ? (typeof employee.ssn === 'string' && employee.ssn.length >= 4
                            ? `***-**-${employee.ssn.slice(-4)}`
                            : '***-**-****')
                        : 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium flex items-center gap-2 break-words">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">{employee.address || 'Not provided'}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Home State</p>
                    <p className="font-medium">{employee.homeState || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Employment Information
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEmploymentInfo({
                        startDate: employee?.startDate || '',
                        employmentType: employee?.employmentType || '',
                        classification: employee?.classification || '',
                        department: employee?.department || '',
                        manager: employee?.manager || '',
                        salary: employee?.salary?.toString() || ''
                      });
                      setSelectedClientId(employee?.clientId || 'none');
                      setSelectedClientIds(employee?.clientIds || []);
                      setShowEmploymentInfoDialog(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{employee.employeeId || employee.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{employee.startDate ? formatDateWithoutTimezone(employee.startDate) : 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Employment Type</p>
                    <p className="font-medium">{employee.employmentType || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Classification</p>
                    <p className="font-medium">{employee.classification || 'Pending'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{employee.department || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Manager</p>
                    <p className="font-medium">{employee.manager || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Timesheet Access</p>
                    <p className="font-medium">
                      {employee.canAccessTimesheets ? (
                        <Badge variant="default">Granted</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Salary</p>
                    <p className="font-medium">{employee.salary ? `$${employee.salary.toLocaleString()}` : 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Assigned Clients</p>
                    {!employee.clientIds || employee.clientIds.length === 0 ? (
                      <p className="font-medium">Not assigned</p>
                    ) : (
                      <div className="space-y-1">
                        {employee.clientNames?.map((name: string, idx: number) => (
                          <p key={idx} className="font-medium flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {name}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Status */}
          {employee.workflow && (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Workflow Status</CardTitle>
                <CardDescription>Current stage: {employee.workflow.currentStage?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Next Step Alert */}
                  {(() => {
                    const nextStep = getNextStep();
                    return (
                      <Alert className={`${nextStep.bgColor} ${nextStep.borderColor}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{nextStep.icon}</span>
                          <div className="flex-1">
                            <h4 className={`font-semibold ${nextStep.color}`}>Next Step</h4>
                            <p className="text-sm mt-1">{nextStep.text}</p>
                          </div>
                        </div>
                      </Alert>
                    );
                  })()}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{workflowProgress}%</span>
                  </div>
                  <Progress value={workflowProgress} />
                  
                  {/* Simplified 3-Stage Workflow Progress */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {/* HR Setup Stage */}
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        employee.workflow.currentStage === 'hr-setup' ? 'bg-blue-100' :
                        employee.workflow.currentStage === 'employee-setup' || 
                        employee.workflow.currentStage === 'hr-review' || 
                        employee.workflow.currentStage === 'completed' ? 'bg-green-100' : 
                        'bg-gray-100'
                      }`}>
                        {employee.workflow.currentStage === 'employee-setup' || 
                         employee.workflow.currentStage === 'hr-review' || 
                         employee.workflow.currentStage === 'completed' ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : employee.workflow.currentStage === 'hr-setup' ? (
                          <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                        ) : (
                          <Clock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs mt-2 font-medium">HR Setup</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.workflow.currentStage === 'hr-setup' ? 'In Progress' :
                         employee.workflow.currentStage === 'employee-setup' || 
                         employee.workflow.currentStage === 'hr-review' || 
                         employee.workflow.currentStage === 'completed' ? 'Completed' : 
                         'Pending'}
                      </p>
                    </div>

                    {/* Employee Setup Stage */}
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        employee.workflow.currentStage === 'employee-setup' ? 'bg-blue-100' :
                        employee.workflow.currentStage === 'hr-review' || 
                        employee.workflow.currentStage === 'completed' ? 'bg-green-100' : 
                        'bg-gray-100'
                      }`}>
                        {employee.workflow.currentStage === 'hr-review' || 
                         employee.workflow.currentStage === 'completed' ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : employee.workflow.currentStage === 'employee-setup' ? (
                          <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                        ) : (
                          <Clock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs mt-2 font-medium">Employee Setup</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.workflow.currentStage === 'employee-setup' ? 'In Progress' :
                         employee.workflow.currentStage === 'hr-review' || 
                         employee.workflow.currentStage === 'completed' ? 'Completed' : 
                         'Pending'}
                      </p>
                    </div>

                    {/* HR Review Stage */}
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        employee.workflow.currentStage === 'hr-review' ? 'bg-blue-100' :
                        employee.workflow.currentStage === 'completed' ? 'bg-green-100' : 
                        'bg-gray-100'
                      }`}>
                        {employee.workflow.currentStage === 'completed' ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : employee.workflow.currentStage === 'hr-review' ? (
                          <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                        ) : (
                          <Clock className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs mt-2 font-medium">HR Review</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.workflow.currentStage === 'hr-review' ? 'In Progress' :
                         employee.workflow.currentStage === 'completed' ? 'Completed' : 
                         'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding">
          <HRDocumentWorkflow employee={employee} onUpdate={fetchEmployeeData} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentCollectionPanel employee={employee} />
        </TabsContent>

        {/* Immigration Tab */}
        <TabsContent value="immigration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Immigration Status</CardTitle>
              <CardDescription>Current immigration information and work authorization</CardDescription>
            </CardHeader>
            <CardContent>
              {immigrationRecords.length > 0 ? (
                <div className="space-y-4">
                  {immigrationRecords.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Status</p>
                          <p className="font-medium">{record.currentStatus}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Visa Type</p>
                          <p className="font-medium">{record.visaType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Work Authorization</p>
                          <p className="font-medium">
                            {record.workAuthorizationExpiry ? format(new Date(record.workAuthorizationExpiry), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">I-94 Expiry</p>
                          <p className="font-medium">
                            {record.i94Expiry ? format(new Date(record.i94Expiry), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No immigration records found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Immigration Filings</CardTitle>
              <CardDescription>H-1B, extensions, amendments, and other filings</CardDescription>
            </CardHeader>
            <CardContent>
              {immigrationFilings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filing Type</TableHead>
                      <TableHead>Filed Date</TableHead>
                      <TableHead>Receipt Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {immigrationFilings.map((filing) => (
                      <TableRow key={filing.id}>
                        <TableCell className="font-medium">{filing.filingType}</TableCell>
                        <TableCell>{filing.filedDate ? format(new Date(filing.filedDate), 'MMM dd, yyyy') : '-'}</TableCell>
                        <TableCell>{filing.receiptNumber || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={filing.status === 'approved' ? 'default' : 'secondary'}>
                            {filing.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{filing.validTo ? format(new Date(filing.validTo), 'MMM dd, yyyy') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No immigration filings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Assignments</CardTitle>
              <CardDescription>Client projects and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              {projectAssignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Billing Rate</TableHead>
                      <TableHead>Allocation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.projectName}</TableCell>
                        <TableCell>{assignment.clientName}</TableCell>
                        <TableCell>{assignment.role || '-'}</TableCell>
                        <TableCell>${assignment.billingRate || 0}/hr</TableCell>
                        <TableCell>{assignment.allocation || 100}%</TableCell>
                        <TableCell>
                          <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.startDate && format(new Date(assignment.startDate), 'MMM dd, yyyy')}
                          {assignment.endDate && ` - ${format(new Date(assignment.endDate), 'MMM dd, yyyy')}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No project assignments found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave/PTO Tab */}
        <TabsContent value="leave" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Allocated</p>
                  <p className="text-3xl font-semibold text-blue-600">{ptoBalance?.total || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Used</p>
                  <p className="text-3xl font-semibold text-amber-600">{ptoBalance?.used || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-3xl font-semibold text-green-600">{ptoBalance?.remaining || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>History of all leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              {leaveRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.leaveType}</TableCell>
                        <TableCell>{format(new Date(request.startDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(new Date(request.endDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{request.numberOfDays || 1}</TableCell>
                        <TableCell>
                          <Badge variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No leave requests found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
              <CardDescription>Performance evaluations and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceReviews.length > 0 ? (
                <div className="space-y-4">
                  {performanceReviews.map((review) => (
                    <Card key={review.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{review.reviewType} - {review.reviewPeriod}</CardTitle>
                          <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                            {review.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Overall Rating</p>
                            <p className="text-2xl font-semibold text-blue-600">{review.overallRating || 'N/A'}/5</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reviewer</p>
                            <p className="font-medium">{review.reviewerName || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Review Date</p>
                            <p className="font-medium">{review.reviewDate ? format(new Date(review.reviewDate), 'MMM dd, yyyy') : '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next Review</p>
                            <p className="font-medium">{review.nextReviewDate ? format(new Date(review.nextReviewDate), 'MMM dd, yyyy') : '-'}</p>
                          </div>
                        </div>
                        {review.strengths && (
                          <div>
                            <p className="text-sm font-medium mb-1">Strengths</p>
                            <p className="text-sm text-muted-foreground">{review.strengths}</p>
                          </div>
                        )}
                        {review.areasForImprovement && (
                          <div>
                            <p className="text-sm font-medium mb-1">Areas for Improvement</p>
                            <p className="text-sm text-muted-foreground">{review.areasForImprovement}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No performance reviews found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete history of all changes and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.category === 'personal' ? 'bg-blue-100' :
                          log.category === 'immigration' ? 'bg-teal-100' :
                          log.category === 'document' ? 'bg-purple-100' :
                          log.category === 'workflow' ? 'bg-green-100' :
                          log.category === 'classification' ? 'bg-amber-100' :
                          log.category === 'project' ? 'bg-indigo-100' :
                          log.category === 'leave' ? 'bg-pink-100' :
                          'bg-gray-100'
                        }`}>
                          {log.category === 'personal' && <User className="h-5 w-5 text-blue-600" />}
                          {log.category === 'immigration' && <Shield className="h-5 w-5 text-teal-600" />}
                          {log.category === 'document' && <FileText className="h-5 w-5 text-purple-600" />}
                          {log.category === 'workflow' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          {log.category === 'classification' && <UserCheck className="h-5 w-5 text-amber-600" />}
                          {log.category === 'project' && <Briefcase className="h-5 w-5 text-indigo-600" />}
                          {log.category === 'leave' && <Calendar className="h-5 w-5 text-pink-600" />}
                          {log.category === 'performance' && <Award className="h-5 w-5 text-violet-600" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{format(new Date(log.timestamp), 'MMM dd, yyyy')}</p>
                            <p>{format(new Date(log.timestamp), 'h:mm a')}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">By: {log.performedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client Assignment Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Client to Employee</DialogTitle>
            <DialogDescription>
              Select a client to assign to {employee.firstName} {employee.lastName}. This will allow them to submit timesheets for this client's projects.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClientId || "none"} onValueChange={setSelectedClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">No client (Unassign)</span>
                    </div>
                  </SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {client.companyName || client.legalName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClientAssignment}>
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employment Information Edit Dialog */}
      <Dialog open={showEmploymentInfoDialog} onOpenChange={setShowEmploymentInfoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employment Information</DialogTitle>
            <DialogDescription>
              Update employee's employment details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={employmentInfo.startDate}
                  onChange={(e) => setEmploymentInfo({ ...employmentInfo, startDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={employmentInfo.employmentType}
                  onValueChange={(value) => setEmploymentInfo({ ...employmentInfo, employmentType: value })}
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classification">Classification</Label>
                <Select
                  value={employmentInfo.classification}
                  onValueChange={(value) => setEmploymentInfo({ ...employmentInfo, classification: value })}
                >
                  <SelectTrigger id="classification">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="W-2">W-2</SelectItem>
                    <SelectItem value="1099">1099</SelectItem>
                    <SelectItem value="Corp-to-Corp">Corp-to-Corp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering, Sales"
                  value={employmentInfo.department}
                  onChange={(e) => setEmploymentInfo({ ...employmentInfo, department: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  placeholder="Manager name"
                  value={employmentInfo.manager}
                  onChange={(e) => setEmploymentInfo({ ...employmentInfo, manager: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="Annual salary"
                  value={employmentInfo.salary}
                  onChange={(e) => setEmploymentInfo({ ...employmentInfo, salary: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Assigned Clients (Multiple)</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                  {clients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No clients available</p>
                  ) : (
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`employment-client-${client.id}`}
                            checked={selectedClientIds.includes(client.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClientIds([...selectedClientIds, client.id]);
                              } else {
                                setSelectedClientIds(selectedClientIds.filter(id => id !== client.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`employment-client-${client.id}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            <Building2 className="h-3 w-3" />
                            {client.companyName || client.legalName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedClientIds.length === 0 
                    ? 'No clients selected' 
                    : `${selectedClientIds.length} client${selectedClientIds.length > 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmploymentInfoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              await handleUpdateEmploymentInfo();
              // Also update clients if they were changed
              const currentClientIds = employee?.clientIds || [];
              const hasChanged = selectedClientIds.length !== currentClientIds.length || 
                                 !selectedClientIds.every(id => currentClientIds.includes(id));
              
              if (hasChanged) {
                // Get client names for the selected IDs
                const clientNames = clients
                  .filter(c => selectedClientIds.includes(c.id))
                  .map(c => c.companyName || c.legalName);
                
                try {
                  const response = await fetch(`${API_URL}/employees/${employeeId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${publicAnonKey}`
                    },
                    body: JSON.stringify({
                      clientIds: selectedClientIds,
                      clientNames: clientNames,
                      // Update legacy fields for backward compatibility
                      clientId: selectedClientIds.length > 0 ? selectedClientIds[0] : '',
                      clientName: clientNames.length > 0 ? clientNames[0] : ''
                    })
                  });

                  if (response.ok) {
                    toast.success('Client assignments updated successfully');
                    fetchEmployeeData();
                  }
                } catch (error) {
                  console.error('Error updating client assignments:', error);
                  toast.error('Failed to update client assignments');
                }
              }
            }}>
              Update Information
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
