import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
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
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { Employee } from '../types';
import { DocumentCollectionPanel } from './document-collection-panel';
import { HRDocumentWorkflow } from './hr-document-workflow';
import { useAuth } from '../lib/auth-context';
import { Switch } from './ui/switch';

const API_URL = (import.meta as any).env.VITE_ONBOARDING_API_URL || API_ENDPOINTS.EMPL_ONBORDING;

// Utility function to safely format dates
const safeFormat = (date: string | number | Date | null | undefined, formatString: string): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return format(d, formatString);
  } catch (e) {
    console.error('Date formatting error:', e, date);
    return '-';
  }
};

// Utility function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: any): string => {
  if (!dateString) return '';
  try {
    // Check if it's already a Date object
    if (dateString && typeof dateString === 'object' && (dateString as any) instanceof Date) {
        return safeFormat(dateString, 'MMM dd, yyyy');
    }
    
    // Check if it matches expected format YYYY-MM-DD
    const parts = dateString.toString().split('T')[0].split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const date = new Date(year, month - 1, day);
        return format(date, 'MMM dd, yyyy');
      }
    }
    // Fallback to safeFormat if manual parsing fails
    return safeFormat(dateString, 'MMM dd, yyyy');
  } catch (e) {
    console.warn('Error formatting date without timezone:', e);
    return dateString?.toString() || '';
  }
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

  const { user } = useAuth();
  const permissions = user?.permissions;

  useEffect(() => {
    fetchEmployeeData();
    // fetchClients(); // Disabled as Client API is being handled by another team member
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
      const token = getAccessToken();
      try {
        const employeeRes = await fetch(`${API_URL}/employee/${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        const docsRes = await fetch(`${API_URL}/employee/${employeeId}/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (docsRes.ok) {
          const data = await docsRes.json();
          // Map backend documents to standardize status fields
          fetchedDocs = (data.documents || []).map((doc: any) => {
            const status = doc.status?.toLowerCase() || 'pending';
            const verificationStatus = doc.verification_status?.toLowerCase() || 
                                     (status === 'approved' || status === 'verified' ? 'verified' : 
                                      status === 'rejected' ? 'rejected' : 'pending');
                                      
            return {
              ...doc,
              status: status,
              verificationStatus: verificationStatus,
              // Map snake_case to camelCase for consistency if needed
              uploadDate: doc.created_at || doc.upload_date || doc.uploadDate,
              documentType: doc.doc_type || doc.document_type || doc.documentType,
              rejectionReason: status === 'rejected' ? doc.notes : undefined
            };
          });
          
          setDocuments(fetchedDocs);
          
          if (fetchedEmployee) {
            fetchedEmployee.onboardingDocuments = fetchedDocs;
            setEmployee({...fetchedEmployee});
          }
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      }

      // Fetch immigration records
      try {
        const immigrationRes = await fetch(`${API_URL}/onboarding/immigration/records?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        const filingsRes = await fetch(`${API_URL}/onboarding/immigration/filings?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        const projectsRes = await fetch(`${API_URL}/onboarding/project-assignments?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        const leaveRes = await fetch(`${API_URL}/onboarding/leave-requests?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        const reviewsRes = await fetch(`${API_URL}/onboarding/performance-reviews?employeeId=${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        const ptoRes = await fetch(`${API_URL}/onboarding/leave-requests/pto-balance/${employeeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
          details: `${filing.filingType} approved${filing.validTo ? `, valid until ${safeFormat(filing.validTo, 'MMM dd, yyyy')}` : ''}`,
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
        details: `${request.leaveType} leave requested from ${safeFormat(request.startDate, 'MMM dd, yyyy')} to ${safeFormat(request.endDate, 'MMM dd, yyyy')} (${request.numberOfDays || 1} days)`,
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

  const handleToggleTimesheetAccess = async (canAccess: boolean) => {
    try {
      if (!employee) return;
      
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/employees/${employee.id}/timesheet-access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ canAccessTimesheets: canAccess })
      });

      if (response.ok) {
        toast.success(canAccess ? 'Timesheet access granted' : 'Timesheet access revoked');
        await fetchEmployeeData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Failed to update timesheet access: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling timesheet access:', error);
      toast.error('Failed to update timesheet access');
    }
  };

  const fetchClients = async () => {
    const token = getAccessToken();
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      
      const token = getAccessToken();
      const actualClientName = selectedClient?.companyName || selectedClient?.legalName || null;
      
      const response = await fetch(`${API_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientId: actualClientId,
          clientName: actualClientName,
          clientIds: actualClientId ? [actualClientId] : [],
          clientNames: actualClientName ? [actualClientName] : []
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
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          start_date: employmentInfo.startDate || null,
          employment_type: employmentInfo.employmentType || null,
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

    const docs = employee.onboardingDocuments || [];

    // Check if employee has rejected documents that haven't been re-uploaded or verified
    const hasRejectedDocs = docs.some((doc: any) => 
      (doc.status === 'rejected' || doc.verificationStatus === 'rejected') && 
      !docs.some((d: any) => 
        (d.documentType === doc.documentType) && 
        (d.status !== 'rejected' && d.verificationStatus !== 'rejected')
      )
    );
    
    if (hasRejectedDocs) {
      return { text: 'Employee needs to re-upload rejected documents', color: 'text-red-600', icon: '📄', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    }

    // Check if employee has documents not yet uploaded
    const hasNotUploadedDocs = docs.some((doc: any) => 
      doc.status === 'not-uploaded' || doc.status === 'requested'
    );
    if (hasNotUploadedDocs) {
      const stage = employee.workflow?.currentStage;
      if (stage === 'employee-setup' || stage === 'data-collection') {
        return { text: 'Employee needs to upload required documents', color: 'text-blue-600', icon: '📤', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      }
    }

    // If onboarding documents are pending review
    const hasPendingDocs = docs.some((doc: any) => 
      doc.status === 'pending-review' || doc.status === 'pending_review' || doc.status === 'pending' || doc.verificationStatus === 'pending'
    );
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
      if (currentStage === 'initiation' || currentStage === 'hr-setup') {
        return { text: 'HR needs to complete initial employee setup', color: 'text-orange-600', icon: '⚙️', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      } else if (currentStage === 'data-collection' || currentStage === 'employee-setup') {
        return { text: 'Employee needs to complete their profile and upload documents', color: 'text-blue-600', icon: '👤', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      } else if (['hr-review', 'verification', 'payroll-setup', 'licensing', 'classification', 'finalization'].includes(currentStage)) {
        return { text: 'HR needs to review and approve employee documents and finalize setup', color: 'text-orange-600', icon: '👀', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
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
                      {employee.phone || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{employee.dateOfBirth ? formatDateWithoutTimezone(employee.dateOfBirth) : 'Not provided'}</p>
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
                    <div className="flex items-center gap-3">
                      <p className="font-medium">
                        {employee.canAccessTimesheets ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Granted</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                        )}
                      </p>
                      {permissions?.canManageEmployees && (
                        <Button 
                          size="sm" 
                          variant={employee.canAccessTimesheets ? "destructive" : "default"}
                          className={`h-7 text-xs ${employee.canAccessTimesheets ? '' : 'bg-green-600 hover:bg-green-700'}`}
                          onClick={() => handleToggleTimesheetAccess(!employee.canAccessTimesheets)}
                        >
                          {employee.canAccessTimesheets ? 'Revoke Access' : 'Grant Access'}
                        </Button>
                      )}
                    </div>
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

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!employee.emergencyContacts || employee.emergencyContacts.length === 0) ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    No emergency contacts provided
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employee.emergencyContacts.map((contact: any, index: number) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <span className="font-medium">{contact.name}</span>
                          <Badge variant="outline">{contact.relationship}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider">Phone</p>
                            <p>{contact.phone}</p>
                          </div>
                          {contact.email && (
                            <div className="space-y-1">
                              <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
                              <p className="break-all">{contact.email}</p>
                            </div>
                          )}
                          {!contact.email && (
                            <div className="space-y-1">
                              <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
                              <p className="text-muted-foreground italic">Not provided</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <span className="text-sm text-muted-foreground">
                      {employee.workflow?.currentStage === 'completed' ? 100 : Math.min(workflowProgress, 99)}%
                    </span>
                  </div>
                  <Progress value={employee.workflow?.currentStage === 'completed' ? 100 : Math.min(workflowProgress, 99)} />
                  
                  {/* Simplified 3-Stage Workflow Progress */}
                  {(() => {
                    const workflow = employee.workflow;
                    if (!workflow) return null;

                    const currentStage = workflow.currentStage || 'initiation';
                    const stageOrder = [
                      'initiation', 'hr-setup', 
                      'data-collection', 'employee-setup', 
                      'hr-review', 'verification', 'payroll-setup', 'licensing', 'classification', 'finalization', 
                      'completed'
                    ];
                    let currentIndex = stageOrder.indexOf(currentStage);
                    if (currentIndex === -1) currentIndex = 0; // Default to start
                    
                    const getStageStatus = (stageName: 'hr' | 'employee' | 'review') => {
                      if (currentStage === 'completed') return 'completed';
                      
                      const flags = workflow as any;
                      
                      if (stageName === 'hr') {
                        if (flags.hrSetupComplete || currentIndex > 1) return 'completed';
                        if (currentIndex <= 1) return 'in-progress';
                        return 'pending';
                      }
                      if (stageName === 'employee') {
                        // More reactive check: if backend hasn't updated the flag yet, check our local documents state
                        const allVerified = documents.length > 0 && documents.every(d => d.verificationStatus === 'verified');
                        if ((flags.profileCompleted && (flags.documentsUploaded || allVerified)) || currentIndex > 3) return 'completed';
                        if (currentIndex >= 2 && currentIndex <= 3) return 'in-progress';
                        return 'pending';
                      }
                      if (stageName === 'review') {
                        if (flags.hrReviewComplete || currentIndex > 9) return 'completed';
                        if (currentIndex >= 4 && currentIndex <= 9) return 'in-progress';
                        return 'pending';
                      }
                      return 'pending';
                    };

                    const stages = [
                      { id: 'hr', label: 'HR Setup', status: getStageStatus('hr') },
                      { id: 'employee', label: 'Employee Setup', status: getStageStatus('employee') },
                      { id: 'review', label: 'HR Review', status: getStageStatus('review') },
                    ];

                    return (
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        {stages.map((stage) => (
                          <div key={stage.id} className="text-center">
                            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                              stage.status === 'in-progress' ? 'bg-blue-100' :
                              stage.status === 'completed' ? 'bg-green-100' : 
                              'bg-gray-100'
                            }`}>
                              {stage.status === 'completed' ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                              ) : stage.status === 'in-progress' ? (
                                <Clock className="h-6 w-6 text-blue-600 animate-pulse" />
                              ) : (
                                <Clock className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <p className="text-xs mt-2 font-medium">{stage.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {stage.status === 'in-progress' ? 'In Progress' :
                               stage.status === 'completed' ? 'Completed' : 
                               'Pending'}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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
                            {safeFormat(record.workAuthorizationExpiry, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">I-94 Expiry</p>
                          <p className="font-medium">
                            {safeFormat(record.i94Expiry, 'MMM dd, yyyy')}
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
                        <TableCell>{safeFormat(filing.filedDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{filing.receiptNumber || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={filing.status === 'approved' ? 'default' : 'secondary'}>
                            {filing.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{safeFormat(filing.validTo, 'MMM dd, yyyy')}</TableCell>
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
                          {safeFormat(assignment.startDate, 'MMM dd, yyyy')}
                          {assignment.endDate ? ` - ${safeFormat(assignment.endDate, 'MMM dd, yyyy')}` : ''}
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
                        <TableCell>{safeFormat(request.startDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{safeFormat(request.endDate, 'MMM dd, yyyy')}</TableCell>
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
                            <p className="font-medium">{safeFormat(review.reviewDate, 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Next Review</p>
                            <p className="font-medium">{safeFormat(review.nextReviewDate, 'MMM dd, yyyy')}</p>
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
                            <p>{safeFormat(log.timestamp, 'MMM dd, yyyy')}</p>
                            <p>{safeFormat(log.timestamp, 'h:mm a')}</p>
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
                  onValueChange={(value: string) => setEmploymentInfo({ ...employmentInfo, employmentType: value })}
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
                  onValueChange={(value: string) => setEmploymentInfo({ ...employmentInfo, classification: value })}
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
                            onCheckedChange={(checked: boolean) => {
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
                  const token = getAccessToken();
                  const response = await fetch(`${API_URL}/employees/${employeeId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
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
