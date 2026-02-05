import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  User,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Users,
  History,
  Filter,
  Search,
  Send,
} from "lucide-react";
import { format, endOfWeek } from "date-fns";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import { useAuth } from "../lib/auth-context";
import type { Employee } from "../types";

const API_URL = API_ENDPOINTS.TIMESHEET;

interface TimesheetEntry {
  id: string;
  timesheetId?: string; // Added for parent tracking
  employeeId: string;
  employeeName: string;
  date: string;
  project: string;
  client: string;

  // Multi-PO Support
  assignmentId?: string;
  clientPoId?: string;
  poNumber?: string;
  workLocation?: "Remote" | "Onsite" | "Hybrid";
  billingType?: "Hourly" | "Fixed Fee" | "Milestone";
  billingRate?: number;

  // Hours
  regularHours: number;
  hours: number;
  overtimeHours?: number;
  overtimeRate?: number;
  overtimeApprovalEmail?: string;
  holidayHours?: number;
  timeOffHours?: number;

  // Non-billable
  billable: boolean;
  category?: string;
  costCenter?: string;

  description: string;
  status: string;
  weekEnding: string;
  entryType: "manual" | "invoice" | "api_import";

  rejectionComment?: string;
  rejectedAt?: string;

  invoiceFileName?: string;
  invoiceFileUrl?: string;
  clientTimesheetUrl?: string;
  clientSigned?: boolean;
  requiresApproval?: boolean;
  extractedData?: any;
  ocrProcessed?: boolean;
  ocrConfidence?: number;
  reviewedByEmployee?: boolean;
  autoMatched?: boolean;

  exceptions: any[];
  hasExceptions: boolean;
  complianceValid: boolean;
  complianceValidation?: any;

  approvalWorkflow?: any;
  currentApprovalStage?: string;

  invoiced: boolean;
  invoiceId?: string;

  createdAt?: string;
  updatedAt?: string;
}

interface Assignment {
  id: string;
  employeeId: string;
  employeeName: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  poNumber: string;
  poLimit: number;
  poUtilized: number;
  poRemaining: number;
  poStartDate: string;
  poEndDate: string;
  poStatus: string;
  billingRate: number;
  billingType: string;
  workLocation: string;
  active: boolean;
}

export function TimesheetUnified() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [clientApprovals, setClientApprovals] = useState<TimesheetEntry[]>([]);
  const [accountingApprovals, setAccountingApprovals] = useState<TimesheetEntry[]>([]);

  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [reviewingEntry, setReviewingEntry] = useState<TimesheetEntry | null>(null);
  const [selectedApprovalItem, setSelectedApprovalItem] = useState<TimesheetEntry | null>(null);
  const [showWeekApprovalDialog, setShowWeekApprovalDialog] = useState(false);
  const [showWeekRejectionDialog, setShowWeekRejectionDialog] = useState(false);
  const [showWeeklyReviewDialog, setShowWeeklyReviewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedWeekForApproval, setSelectedWeekForApproval] = useState<{ weekEnding: string, entries: TimesheetEntry[], employeeId: string, employeeName: string } | null>(null);
  const [reviewingWeekEntries, setReviewingWeekEntries] = useState<{ weekEnding: string, entries: TimesheetEntry[], employeeId: string, employeeName: string } | null>(null);

  // Single Entry Action State
  const [selectedEntryForAction, setSelectedEntryForAction] = useState<any>(null);
  const [showEntryRejectionDialog, setShowEntryRejectionDialog] = useState(false);
  const [entryRejectionReason, setEntryRejectionReason] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");

  const [entryMode, setEntryMode] = useState<"manual" | "invoice">("manual");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBillable, setIsBillable] = useState(true);
  const [approvalComments, setApprovalComments] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Track hours per date for multi-date entries
  const [hoursPerDate, setHoursPerDate] = useState<Record<string, { regular: string; overtime: string }>>({});

  const [newEntry, setNewEntry] = useState({
    project: "",
    client: "",
    regularHours: "",
    overtimeHours: "",
    holidayHours: "",
    overtimeApprovalEmail: "",
    description: "",
    category: "Project",
    costCenter: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchTimesheets();
    fetchAssignments();
    fetchApprovals();
  }, []);

  // Refresh employees when the add dialog opens to get latest onboarding status
  useEffect(() => {
    if (showAddDialog) {
      fetchEmployees();
    }
  }, [showAddDialog]);

  // Initialize hours for newly selected dates
  useEffect(() => {
    setHoursPerDate(prev => {
      const newHoursPerDate = { ...prev };
      selectedDates.forEach(date => {
        const dateKey = format(date, "yyyy-MM-dd");
        if (!newHoursPerDate[dateKey]) {
          newHoursPerDate[dateKey] = { regular: "", overtime: "" };
        }
      });
      // Remove entries for unselected dates
      Object.keys(newHoursPerDate).forEach(dateKey => {
        if (!selectedDates.some(d => format(d, "yyyy-MM-dd") === dateKey)) {
          delete newHoursPerDate[dateKey];
        }
      });
      return newHoursPerDate;
    });
  }, [selectedDates]);

  // Sync entries with approval queues
  // This ensures that any timesheets fetched via the main timesheets endpoint 
  // that require approval are correctly displayed in the Approvals tab
  useEffect(() => {
    if (entries.length > 0) {
      // 1. Identify items for Client Approval
      const clientPending = entries.filter(e =>
        e.status === 'pending_client_approval'
      );

      if (clientPending.length > 0) {
        setClientApprovals(prev => {
          const map = new Map(prev.map(item => [item.id, item]));
          clientPending.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });
      }

      // 2. Identify items for Accounting/HR Approval
      // 'submitted' and 'pending_review' items typically need initial HR/Accounting review
      const accountingPending = entries.filter(e =>
        e.status === 'pending_accounting_approval' ||
        e.status === 'submitted' ||
        e.status === 'pending_review'
      );

      if (accountingPending.length > 0) {
        setAccountingApprovals(prev => {
          const map = new Map(prev.map(item => [item.id, item]));
          accountingPending.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });
      }
    }
  }, [entries]);

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchTimesheets = async () => {
    try {
      setIsLoadingTimesheets(true);

      let url = `${API_URL}/timesheets`;
      // Use organization endpoint if user has an org ID (HR/Admin view)
      if (user?.organizationId) {
        url = `${API_URL}/timesheets/organization/${user.organizationId}`;
      }

      console.log('Fetching Timesheets from URL:', url);
      console.log('User Org ID:', user?.organizationId);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) throw new Error('Failed to fetch timesheets');
      const data = await response.json();

      console.log('Raw Timesheets Data:', data);

      // Handle the nested structure from organization endpoint (Array of Weekly Objects)
      let allEntries: TimesheetEntry[] = [];

      if (Array.isArray(data)) {
        // Check if this is the organization response format (has entries array inside objects)
        const isOrgResponse = data.length > 0 && ('entries' in data[0] || 'week_ending_date' in data[0]);

        if (isOrgResponse) {
          allEntries = data.flatMap((week: any) => {
            // Debug log for first week structure
            if (week === data[0]) console.log('First Week Structure:', week);

            return (week.entries || []).map((entry: any) => {
              // Ensure date exists
              const entryDate = entry.date || week.week_ending_date || new Date().toISOString();

              // Construct proper employee name from the week object if available
              const empName = week.employee
                ? `${week.employee.first_name || ''} ${week.employee.last_name || ''}`.trim()
                : (entry.employeeName || entry.employee_name || '');

              const total = Number(entry.total_hours) || 0;
              const type = entry.time_type || 'Billable';

              return {
                ...entry,
                employeeId: week.employee_id,
                timesheetId: week.id || week.timesheet_id, // Capture parent timesheet ID
                // Map snake_case to camelCase and ensure status flows down - prioritize ENTRY status
                status: (entry.status || week.status || 'draft').toLowerCase(),
                weekEnding: week.week_ending_date,
                weekStarting: week.week_starting_date, // Add weekStarting
                id: entry.id || `${week.id}-${entryDate}`, // Ensure unique ID
                employeeName: empName,
                date: entryDate,

                // Correctly bucketize hours
                hours: total,
                regularHours: type === 'Billable' ? total : 0,
                holidayHours: type === 'Holiday' ? total : 0,
                timeOffHours: type === 'Time Off' ? total : 0,
                overtimeHours: Number(entry.overtime_hours) || 0,
              };
            });
          });
        } else {
          // Standard response (already flat)
          allEntries = data.map((entry: any) => ({
            ...entry,
            timesheetId: entry.timesheetId || entry.timesheet_id
          }));
        }
      } else if (data.timesheets) {
        allEntries = data.timesheets.map((entry: any) => ({
          ...entry,
          timesheetId: entry.timesheetId || entry.timesheet_id
        }));
      }

      console.log('Processed Entries:', allEntries);
      setEntries(allEntries);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to load timesheets');
      setEntries([]);
    } finally {
      setIsLoadingTimesheets(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setIsLoadingAssignments(true);
      const response = await fetch(`${API_URL}/assignments`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      const data = await response.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
      setAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      setIsLoadingApprovals(true);

      // Fetch client approvals
      const clientRes = await fetch(`${API_URL}/approvals/queue?role=client`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (clientRes.ok) {
        const data = await clientRes.json();
        setClientApprovals(Array.isArray(data) ? data : []);
      }

      // Fetch accounting approvals
      const accountingRes = await fetch(`${API_URL}/approvals/queue?role=accounting`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (accountingRes.ok) {
        const data = await accountingRes.json();
        setAccountingApprovals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load approval queue');
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const updateEntryStatus = async (entryId: string, status: string, rejectionReason?: string) => {
    try {
      const response = await fetch(`${API_URL}/timesheets/entries/${entryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify({
          entry_id: entryId,
          status: status,
          rejection_reason: rejectionReason
        }),
      });

      if (!response.ok) throw new Error('Failed to update entry status');

      toast.success(`Entry ${status.toLowerCase()} successfully`);

      // Update local state to reflect change immediately within the modal
      if (reviewingWeekEntries) {
        const updatedEntries = reviewingWeekEntries.entries.map(e =>
          e.id === entryId ? { ...e, status: status.toLowerCase() } : e
        );
        setReviewingWeekEntries({ ...reviewingWeekEntries, entries: updatedEntries });
      }

      // Refresh global list
      fetchTimesheets();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleEntryAction = (entry: any, action: 'APPROVED' | 'REJECTED') => {
    if (action === 'APPROVED') {
      updateEntryStatus(entry.id, 'APPROVED');
    } else {
      setSelectedEntryForAction(entry);
      setEntryRejectionReason("");
      setShowEntryRejectionDialog(true);
    }
  };

  const submitEntryRejection = () => {
    if (selectedEntryForAction && entryRejectionReason) {
      updateEntryStatus(selectedEntryForAction.id, 'REJECTED', entryRejectionReason);
      setShowEntryRejectionDialog(false);
      setSelectedEntryForAction(null);
    }
  };

  const handleApprove = async (item: TimesheetEntry, approved: boolean) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_URL}/timesheets/${item.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify({
          approved,
          approverId: 'current-user-id',
          approverName: 'Current User',
          approverEmail: 'user@example.com',
          role: item.status === 'pending_client_approval' ? 'client' : 'accounting',
          comments: approvalComments,
        }),
      });

      if (!response.ok) throw new Error('Failed to process approval');

      toast.success(approved ? 'Timesheet approved successfully' : 'Timesheet rejected');

      setShowApprovalDialog(false);
      setSelectedApprovalItem(null);
      setApprovalComments("");

      // Refresh data
      fetchTimesheets();
      fetchApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedEmployee) {
      toast.error('Please select an employee and file');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('employeeId', selectedEmployee);

      const response = await fetch(`${API_URL}/timesheets/upload-invoice`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload invoice');

      const result = await response.json();
      toast.success('Invoice uploaded and processed successfully');

      setShowAddDialog(false);
      resetForm();
      fetchTimesheets();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Failed to upload invoice');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddManualEntry = async () => {
    if (!selectedEmployee || selectedDates.length === 0) {
      toast.error('Please select an employee and at least one date');
      return;
    }

    // Check if employee has completed onboarding
    const selectedEmp = employees.find(emp => emp.id === selectedEmployee);
    if (selectedEmp && selectedEmp.onboardingStatus !== 'completed') {
      toast.error('This employee must complete onboarding before submitting timesheets. Please contact HR.');
      return;
    }

    if (!selectedEmp?.canAccessTimesheets) {
      toast.error('Timesheet access is locked for this employee. An HR administrator needs to grant access in the Employee Onboarding module under the Workflow tab.');
      return;
    }

    if (isBillable && !selectedAssignment) {
      toast.error('Please select a client assignment for billable time');
      return;
    }

    // Validate hours for each date
    if (selectedDates.length === 1) {
      if (!newEntry.regularHours) {
        toast.error('Please enter regular hours');
        return;
      }
    } else {
      // Multiple dates - check hoursPerDate
      const missingHours = selectedDates.some(date => {
        const dateKey = format(date, "yyyy-MM-dd");
        return !hoursPerDate[dateKey]?.regular || parseFloat(hoursPerDate[dateKey].regular) === 0;
      });
      if (missingHours) {
        toast.error('Please enter regular hours for all selected dates');
        return;
      }
    }

    // Check if any selected date belongs to a submitted week
    for (const date of selectedDates) {
      const weekEnding = format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const existingWeekEntry = entries.find(e =>
        e.employeeId === selectedEmployee &&
        e.weekEnding === weekEnding
      );

      if (existingWeekEntry && existingWeekEntry.status !== 'draft' && existingWeekEntry.status !== 'rejected') {
        toast.error(`Cannot add entries for week ending ${format(new Date(weekEnding), "MMM d")} as it has already been submitted. Wait for rejection to edit.`);
        return;
      }
    }

    try {
      const assignment = isBillable ? assignments.find(a => a.id === selectedAssignment) : null;

      // Create an entry for each selected date
      const entryPromises = selectedDates.map(date => {
        const dateKey = format(date, "yyyy-MM-dd");
        const dateHours = selectedDates.length === 1
          ? { regular: newEntry.regularHours, overtime: newEntry.overtimeHours }
          : hoursPerDate[dateKey] || { regular: "", overtime: "" };

        const entry = {
          employeeId: selectedEmployee,
          employeeName: selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : 'Unknown',
          date: dateKey,
          project: isBillable ? (assignment?.projectName || newEntry.project) : newEntry.project,
          client: isBillable ? (assignment?.clientName || newEntry.client) : newEntry.client,
          regularHours: parseFloat(dateHours.regular),
          overtimeHours: dateHours.overtime ? parseFloat(dateHours.overtime) : 0,
          overtimeApprovalEmail: newEntry.overtimeApprovalEmail,
          description: newEntry.description,
          billable: isBillable,
          category: newEntry.category,
          costCenter: newEntry.costCenter,
          assignmentId: assignment?.id,
          clientPoId: assignment?.id,
          poNumber: assignment?.poNumber,
          workLocation: assignment?.workLocation,
          billingType: assignment?.billingType,
          billingRate: assignment?.billingRate,
          entryType: "manual" as const,
        };

        return fetch(`${API_URL}/timesheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify(entry),
        });
      });

      const responses = await Promise.all(entryPromises);
      const failedResponses = responses.filter(r => !r.ok);

      if (failedResponses.length > 0) {
        throw new Error(`Failed to create ${failedResponses.length} of ${responses.length} entries`);
      }

      const entryCount = selectedDates.length;
      toast.success(`${entryCount} time ${entryCount === 1 ? 'entry' : 'entries'} added successfully`);
      setShowAddDialog(false);
      resetForm();
      fetchTimesheets();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Failed to add time entries');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const entryToDelete = entries.find(e => e.id === id);
    if (entryToDelete && entryToDelete.status !== 'draft' && entryToDelete.status !== 'rejected') {
      toast.error("Cannot delete entry from a submitted timesheet. Wait for rejection to edit.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/timesheets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });

      if (!response.ok) throw new Error('Failed to delete entry');

      toast.success('Time entry deleted');
      fetchTimesheets();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleEditEntry = (entry: TimesheetEntry) => {
    setEditingEntryId(entry.id);
    setSelectedEmployee(entry.employeeId);
    setSelectedDates([new Date(entry.date)]);
    setIsBillable(entry.billable);

    if (entry.assignmentId) {
      setSelectedAssignment(entry.assignmentId);
    }

    setNewEntry({
      project: entry.project,
      client: entry.client,
      regularHours: (entry.regularHours || entry.hours || 0).toString(),
      overtimeHours: (entry.overtimeHours || 0).toString(),
      holidayHours: (entry.holidayHours || 0).toString(),
      overtimeApprovalEmail: entry.overtimeApprovalEmail || "",
      description: entry.description || "",
      category: entry.category || "Project",
      costCenter: entry.costCenter || "",
    });

    setShowEditDialog(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntryId) return;

    // Validate inputs
    if (!newEntry.regularHours) {
      toast.error('Please enter regular hours');
      return;
    }

    try {
      const assignment = isBillable ? assignments.find(a => a.id === selectedAssignment) : null;

      // Prepare update payload
      const updatedData = {
        employeeId: selectedEmployee, // Should match existing
        date: format(selectedDates[0], "yyyy-MM-dd"),
        project: isBillable ? (assignment?.projectName || newEntry.project) : newEntry.project,
        client: isBillable ? (assignment?.clientName || newEntry.client) : newEntry.client,
        regularHours: parseFloat(newEntry.regularHours),
        overtimeHours: newEntry.overtimeHours ? parseFloat(newEntry.overtimeHours) : 0,
        holidayHours: newEntry.holidayHours ? parseFloat(newEntry.holidayHours) : 0,
        overtimeApprovalEmail: newEntry.overtimeApprovalEmail,
        description: newEntry.description,
        billable: isBillable,
        category: newEntry.category,
        costCenter: newEntry.costCenter,
        assignmentId: assignment?.id,
        clientPoId: assignment?.id,
        poNumber: assignment?.poNumber,
        workLocation: assignment?.workLocation,
        billingType: assignment?.billingType,
        billingRate: assignment?.billingRate,
        // Reset status to draft if it was rejected, or keep as is? 
        // Usually editing a rejected entry resubmits it or puts it back to draft. 
        // Let's set it to 'draft' so it can be resubmitted.
        status: 'draft',
      };

      const response = await fetch(`${API_URL}/timesheets/${editingEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update entry');

      toast.success('Time entry updated successfully');
      setShowEditDialog(false);
      setEditingEntryId(null);
      resetForm();

      // Refresh data
      fetchTimesheets();

      // Also update the local reviewingWeekEntries state if it's open
      if (reviewingWeekEntries) {
        // We need to fetch the updated entries for this week to update the dialog view
        // Since we don't have a handy function for that, we rely on fetchTimesheets updating 'entries'
        // and then we can update reviewingWeekEntries based on the new 'entries' list.
        // But 'entries' state update is async. 
        // A workaround is to manually update reviewingWeekEntries.entries
        setReviewingWeekEntries(prev => {
          if (!prev) return null;
          return {
            ...prev,
            entries: prev.entries.map(e =>
              e.id === editingEntryId
                ? { ...e, ...updatedData, status: 'draft' } as any // partial update for UI
                : e
            )
          };
        });
      }

    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update time entry');
    }
  };

  const handleWeekApproval = async () => {
    if (!selectedWeekForApproval) return;

    try {
      // Approve all entries in the week
      for (const entry of selectedWeekForApproval.entries) {
        const response = await fetch(`${API_URL}/timesheets/${entry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify({ ...entry, status: 'approved' }),
        });

        if (!response.ok) throw new Error('Failed to approve timesheet');
      }

      toast.success(`Timesheet for ${selectedWeekForApproval.employeeName} (Week ending ${format(new Date(selectedWeekForApproval.weekEnding), "MMM d, yyyy")}) approved`);
      setShowWeekApprovalDialog(false);
      setSelectedWeekForApproval(null);
      fetchTimesheets();
    } catch (error) {
      console.error('Error approving week:', error);
      toast.error('Failed to approve timesheet');
    }
  };

  const handleWeekRejection = async () => {
    if (!selectedWeekForApproval || !rejectionComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      // Reject all entries in the week with the comment
      for (const entry of selectedWeekForApproval.entries) {
        const response = await fetch(`${API_URL}/timesheets/${entry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify({
            ...entry,
            status: 'rejected',
            rejectionComment: rejectionComment,
            rejectedAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) throw new Error('Failed to reject timesheet');
      }

      toast.success(`Timesheet for ${selectedWeekForApproval.employeeName} (Week ending ${format(new Date(selectedWeekForApproval.weekEnding), "MMM d, yyyy")}) rejected`);
      setShowWeekRejectionDialog(false);
      setSelectedWeekForApproval(null);
      setRejectionComment("");
      fetchTimesheets();
    } catch (error) {
      console.error('Error rejecting week:', error);
      toast.error('Failed to reject timesheet');
    }
  };

  const handleResubmitWeek = async (entries: TimesheetEntry[]) => {
    try {
      // Update all entries to 'submitted'
      const updatePromises = entries.map(entry =>
        fetch(`${API_URL}/timesheets/${entry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          },
          // Reset rejection info as well
          body: JSON.stringify({
            ...entry,
            status: 'submitted',
            rejectionComment: null,
            rejectedAt: null
          }),
        })
      );

      await Promise.all(updatePromises);
      toast.success('Timesheet resubmitted successfully');
      fetchTimesheets();
    } catch (error) {
      console.error('Error resubmitting week:', error);
      toast.error('Failed to resubmit timesheet');
    }
  };

  const handleDeleteWeek = async (entries: TimesheetEntry[]) => {
    if (!window.confirm("Are you sure you want to delete this entire timesheet week? This cannot be undone.")) return;

    try {
      const deletePromises = entries.map(entry =>
        fetch(`${API_URL}/timesheets/${entry.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        })
      );

      await Promise.all(deletePromises);
      toast.success('Timesheet week deleted');
      fetchTimesheets();
    } catch (error) {
      console.error('Error deleting week:', error);
      toast.error('Failed to delete timesheet');
    }
  };

  const resetForm = () => {
    setEntryMode("manual");
    setSelectedEmployee("");
    setSelectedAssignment("");
    setSelectedDates([]);
    setHoursPerDate({});
    setSelectedFile(null);
    setIsBillable(true);
    setNewEntry({
      project: "",
      client: "",
      regularHours: "",
      overtimeHours: "",
      holidayHours: "",
      overtimeApprovalEmail: "",
      description: "",
      category: "Project",
      costCenter: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
      submitted: { label: "Submitted", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      pending_review: { label: "Pending Review", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      pending_client_approval: { label: "Pending Client", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
      pending_accounting_approval: { label: "Pending Accounting", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
      approved: { label: "Approved", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800 hover:bg-red-100" },
      invoiced: { label: "Invoiced", className: "bg-teal-100 text-teal-800 hover:bg-teal-100" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === "" ||
      entry.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.client.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get employee assignments when employee is selected
  const employeeAssignments = selectedEmployee
    ? assignments.filter(a => a.employeeId === selectedEmployee && a.active)
    : [];

  // Exception entries
  const exceptionEntries = entries.filter(e => e.hasExceptions || !e.complianceValid);

  // Group timesheets by ID (preferred) or fall back to employee+week
  const groupedByTimesheet = () => {
    const grouped: Record<string, TimesheetEntry[]> = {};

    filteredEntries.forEach(entry => {
      // Use timesheetId if available, otherwise fallback to a composite key
      const key = entry.timesheetId || `${entry.employeeId}-${entry.weekEnding}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    });

    return grouped;
  };

  const timesheetGroups = groupedByTimesheet();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl mb-1">Timesheets & Invoicing</h2>
        <p className="text-muted-foreground">
          Comprehensive timesheet management with PO tracking, approvals, overtime, compliance validation, and invoicing
        </p>
      </div>

      <Tabs defaultValue="timesheets" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="timesheets">
            <Clock className="h-4 w-4 mr-2" />
            Timesheets
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approvals ({clientApprovals.length + accountingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="exceptions">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Exceptions ({exceptionEntries.length})
          </TabsTrigger>
        </TabsList>

        {/* TIMESHEETS TAB */}
        <TabsContent value="timesheets" className="space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee, project, or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/80 border-gray-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white/80 border-gray-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gradient-teal-blue text-white shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Entries</CardDescription>
                <CardTitle className="text-2xl">{entries.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Approval</CardDescription>
                <CardTitle className="text-2xl">
                  {entries.filter(e => e.status.includes('pending')).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Approved</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {entries.filter(e => e.status === 'approved').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Exceptions</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {exceptionEntries.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Timesheets Table - Grouped by Timesheet ID */}
          <Card>
            <CardHeader>
              <CardTitle>All Timesheets</CardTitle>
              <CardDescription>
                {Object.keys(timesheetGroups).length} weekly timesheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTimesheets ? (
                <div className="py-12 text-center text-muted-foreground">
                  Loading timesheets...
                </div>
              ) : Object.keys(timesheetGroups).length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No timesheet entries found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Week (Start - End)</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(timesheetGroups)
                      .sort((a, b) => {
                        const dateA = new Date(a[0].weekEnding || a[0].date).getTime();
                        const dateB = new Date(b[0].weekEnding || b[0].date).getTime();
                        return dateB - dateA;
                      })
                      .map((groupEntries) => {
                        const weekEntries = groupEntries;
                        const firstEntry = weekEntries[0];
                        const employeeName = firstEntry.employeeName || 'Unknown Employee';
                        const weekEnding = firstEntry.weekEnding;
                        const weekStarting = (firstEntry as any).weekStarting;
                        const employeeId = firstEntry.employeeId;

                        const regularHours = weekEntries.reduce((sum, e) =>
                          sum + (e.regularHours || 0), 0
                        );
                        const overtimeHours = weekEntries.reduce((sum, e) =>
                          sum + (e.overtimeHours || 0), 0
                        );
                        const holidayHours = weekEntries.reduce((sum, e) =>
                          sum + (e.holidayHours || 0), 0
                        );
                        const timeOffHours = weekEntries.reduce((sum, e) =>
                          sum + (e.timeOffHours || 0), 0
                        );
                        const totalHours = regularHours + overtimeHours + holidayHours + timeOffHours;

                        // Determine status
                        const allApproved = weekEntries.every(e => e.status === 'approved');
                        const anyRejected = weekEntries.some(e => e.status === 'rejected');
                        const allSubmitted = weekEntries.every(e => e.status === 'submitted' || e.status === 'approved');

                        let status = 'draft';
                        if (anyRejected) status = 'rejected';
                        else if (allApproved) status = 'approved';
                        else if (allSubmitted) status = 'submitted';

                        return (
                          <TableRow key={firstEntry.timesheetId || `${employeeId}-${weekEnding}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{employeeName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {weekStarting ? (
                                <span>
                                  {format(new Date(weekStarting), "MMM d")} - {format(new Date(weekEnding), "MMM d, yyyy")}
                                </span>
                              ) : (
                                format(new Date(weekEnding), "MMM d, yyyy")
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{totalHours}h</span>
                                </div>
                                {(overtimeHours > 0 || holidayHours > 0 || timeOffHours > 0) && (
                                  <div className="text-xs flex items-center gap-1 mt-1">
                                    <span className="text-muted-foreground">Billable: {regularHours}h</span>
                                    {overtimeHours > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="text-orange-600 font-medium">OT: {overtimeHours}h</span>
                                      </>
                                    )}
                                    {timeOffHours > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="text-blue-600 font-medium">Time Off: {timeOffHours}h</span>
                                      </>
                                    )}
                                    {holidayHours > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="text-purple-600 font-medium">Holiday: {holidayHours}h</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(status)}</TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="View Details"
                                  onClick={() => {
                                    setReviewingWeekEntries({
                                      weekEnding,
                                      entries: weekEntries,
                                      employeeId,
                                      employeeName,
                                    });
                                    setShowWeeklyReviewDialog(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Dialog */}
        <Dialog open={showWeekApprovalDialog} onOpenChange={setShowWeekApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Timesheet</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this timesheet?
              </DialogDescription>
            </DialogHeader>
            {selectedWeekForApproval && (
              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{selectedWeekForApproval.employeeName}</div>
                    <div className="text-sm text-muted-foreground">
                      Week ending {format(new Date(selectedWeekForApproval.weekEnding), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">
                      {selectedWeekForApproval.entries.reduce((sum, e) =>
                        sum + (e.regularHours || e.hours || 0) + (e.overtimeHours || 0), 0
                      )}h
                    </div>
                    <div className="text-xs text-muted-foreground">Total Hours</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedWeekForApproval.entries.length} {selectedWeekForApproval.entries.length === 1 ? 'entry' : 'entries'} will be approved
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWeekApprovalDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleWeekApproval} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Timesheet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showWeekRejectionDialog} onOpenChange={setShowWeekRejectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Timesheet</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this timesheet
              </DialogDescription>
            </DialogHeader>
            {selectedWeekForApproval && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{selectedWeekForApproval.employeeName}</div>
                    <div className="text-sm text-muted-foreground">
                      Week ending {format(new Date(selectedWeekForApproval.weekEnding), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">
                      {selectedWeekForApproval.entries.reduce((sum, e) =>
                        sum + (e.regularHours || e.hours || 0) + (e.overtimeHours || 0), 0
                      )}h
                    </div>
                    <div className="text-xs text-muted-foreground">Total Hours</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rejection-comment">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejection-comment"
                    placeholder="Please explain why this timesheet is being rejected..."
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowWeekRejectionDialog(false);
                setRejectionComment("");
              }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleWeekRejection}
                disabled={!rejectionComment.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Timesheet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Weekly Review Dialog */}
        {reviewingWeekEntries && (
          <Dialog open={showWeeklyReviewDialog} onOpenChange={setShowWeeklyReviewDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Weekly Timesheet Details</DialogTitle>
                <DialogDescription>
                  Review all entries for {reviewingWeekEntries.employeeName} - Week ending {format(new Date(reviewingWeekEntries.weekEnding), "MMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Summary Card */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                        <p className="text-2xl font-medium">
                          {reviewingWeekEntries.entries.reduce((sum, e) =>
                            sum + (e.regularHours || 0) + (e.overtimeHours || 0) + (e.holidayHours || 0) + (e.timeOffHours || 0), 0
                          )}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Billable Hours</p>
                        <p className="text-2xl font-medium">
                          {reviewingWeekEntries.entries.reduce((sum, e) =>
                            sum + (e.regularHours || 0), 0
                          )}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time Off Hours</p>
                        <p className="text-2xl font-medium text-blue-600">
                          {reviewingWeekEntries.entries.reduce((sum, e) =>
                            sum + (e.timeOffHours || 0), 0
                          )}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Holiday Hours</p>
                        <p className="text-2xl font-medium text-purple-600">
                          {reviewingWeekEntries.entries.reduce((sum, e) =>
                            sum + (e.holidayHours || 0), 0
                          )}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Projects Logged</p>
                        <p className="text-2xl font-medium">
                          {new Set(reviewingWeekEntries.entries.map((e: any) => e.client_project_id || e.project)).size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Timesheet Attached Banner */}
                {reviewingWeekEntries.entries.some(e => e.clientTimesheetUrl) && (
                  <Alert className="bg-green-50 border-green-200">
                    <FileText className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-900">Client Timesheet Attached</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-green-700">Approved timesheet document</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-4"
                        onClick={() => {
                          const entryWithDoc = reviewingWeekEntries.entries.find(e => e.clientTimesheetUrl);
                          if (entryWithDoc?.clientTimesheetUrl) {
                            window.open(entryWithDoc.clientTimesheetUrl, '_blank');
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Client Timesheet Document Preview */}
                {reviewingWeekEntries.entries.some(e => e.clientTimesheetUrl) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h3 className="font-medium">Document Preview</h3>
                    </div>
                    <div className="space-y-4">
                      {reviewingWeekEntries.entries
                        .filter(e => e.clientTimesheetUrl)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((entry) => (
                          <div key={entry.id} className="border rounded-lg overflow-hidden bg-white">
                            <div className="relative" style={{ height: '600px' }}>
                              <iframe
                                src={entry.clientTimesheetUrl}
                                className="w-full h-full"
                                title={`Client Timesheet - ${entry.project}`}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Daily Breakdown */}
                <div>
                  <h3 className="font-medium mb-3">Weekly Entry Details</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center w-12">Mon</TableHead>
                          <TableHead className="text-center w-12">Tue</TableHead>
                          <TableHead className="text-center w-12">Wed</TableHead>
                          <TableHead className="text-center w-12">Thu</TableHead>
                          <TableHead className="text-center w-12">Fri</TableHead>
                          <TableHead className="text-center w-12">Sat</TableHead>
                          <TableHead className="text-center w-12">Sun</TableHead>
                          <TableHead className="text-right font-bold w-16">Total</TableHead>
                          <TableHead className="text-right w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(reviewingWeekEntries.entries.reduce((acc: any, entry: any) => {
                          // Group by Timesheet ID + Client + Project to keep separate timesheets distinct
                          // Use timesheetId (camelCase) as populated in fetchTimesheets
                          const tsId = entry.timesheetId || entry.timesheet_id || 'unknown';
                          const key = `${tsId}-${entry.client}-${entry.project}`;
                          if (!acc[key]) {
                            acc[key] = {
                              ...entry,
                              mon_hours: 0, tue_hours: 0, wed_hours: 0, thu_hours: 0, fri_hours: 0, sat_hours: 0, sun_hours: 0, total_hours: 0,
                              breakdownMap: {}
                            };
                          }
                          // Aggregate totals
                          acc[key].mon_hours += (Number(entry.mon_hours) || 0);
                          acc[key].tue_hours += (Number(entry.tue_hours) || 0);
                          acc[key].wed_hours += (Number(entry.wed_hours) || 0);
                          acc[key].thu_hours += (Number(entry.thu_hours) || 0);
                          acc[key].fri_hours += (Number(entry.fri_hours) || 0);
                          acc[key].sat_hours += (Number(entry.sat_hours) || 0);
                          acc[key].sun_hours += (Number(entry.sun_hours) || 0);
                          acc[key].total_hours += (Number(entry.total_hours) || Number(entry.hours) || 0);

                          // Aggregate breakdown by time_type
                          const type = entry.time_type || 'Billable';
                          if (!acc[key].breakdownMap[type]) {
                            acc[key].breakdownMap[type] = {
                              ...entry,
                              time_type: type,
                              mon_hours: 0, tue_hours: 0, wed_hours: 0, thu_hours: 0, fri_hours: 0, sat_hours: 0, sun_hours: 0, total_hours: 0
                            };
                          }
                          const bdEntry = acc[key].breakdownMap[type];
                          bdEntry.mon_hours += (Number(entry.mon_hours) || 0);
                          bdEntry.tue_hours += (Number(entry.tue_hours) || 0);
                          bdEntry.wed_hours += (Number(entry.wed_hours) || 0);
                          bdEntry.thu_hours += (Number(entry.thu_hours) || 0);
                          bdEntry.fri_hours += (Number(entry.fri_hours) || 0);
                          bdEntry.sat_hours += (Number(entry.sat_hours) || 0);
                          bdEntry.sun_hours += (Number(entry.sun_hours) || 0);
                          bdEntry.total_hours += (Number(entry.total_hours) || Number(entry.hours) || 0);

                          // Preserve latest status info if needed, or maybe check if any are rejected
                          if (entry.status) bdEntry.status = entry.status;

                          return acc;
                        }, {})).flatMap((group: any, groupIndex: number) => [
                          // 1. Project Summary Row
                          <TableRow key={`group-${groupIndex}`} className="bg-gray-50 font-medium">
                            <TableCell className="font-medium">
                              {group.project_name || group.project || 'Unspecified Project'}
                            </TableCell>
                            <TableCell>
                              {group.client_name || group.client || 'Unspecified Client'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal bg-white">
                                Total
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">{group.mon_hours || '-'}</TableCell>
                            <TableCell className="text-center text-sm">{group.tue_hours || '-'}</TableCell>
                            <TableCell className="text-center text-sm">{group.wed_hours || '-'}</TableCell>
                            <TableCell className="text-center text-sm">{group.thu_hours || '-'}</TableCell>
                            <TableCell className="text-center text-sm">{group.fri_hours || '-'}</TableCell>
                            <TableCell className="text-center text-sm">{group.sat_hours || '-'}</TableCell>
                            <TableCell className="text-center text-sm">{group.sun_hours || '-'}</TableCell>
                            <TableCell className="text-right font-bold">{group.total_hours}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>,

                          // 2. Breakdown Rows (Iterate over map values)
                          ...Object.values(group.breakdownMap).map((entry: any, entryIndex: number) => (
                            <TableRow key={entry.id || `${groupIndex}-${entryIndex}`} className="hover:bg-transparent">
                              <TableCell className="border-0 py-2"></TableCell>
                              <TableCell className="border-0 py-2 text-right text-muted-foreground text-xs uppercase tracking-wider pr-4">
                                Type:
                              </TableCell>
                              <TableCell className="border-0 py-2">
                                <Badge variant="outline" className={`text-xs font-normal ${(entry.time_type || 'Billable') === 'Billable' ? 'bg-green-50 text-green-700 border-green-200' :
                                  (entry.time_type || 'Billable') === 'Time Off' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    (entry.time_type || 'Billable') === 'Holiday' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''
                                  }`}>
                                  {entry.time_type || 'Billable'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm border-0 py-2 text-muted-foreground">
                                {Number(entry.mon_hours) > 0 ? entry.mon_hours : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm border-0 py-2 text-muted-foreground">
                                {Number(entry.tue_hours) > 0 ? entry.tue_hours : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm border-0 py-2 text-muted-foreground">
                                {Number(entry.wed_hours) > 0 ? entry.wed_hours : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm border-0 py-2 text-muted-foreground">
                                {Number(entry.thu_hours) > 0 ? entry.thu_hours : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm border-0 py-2 text-muted-foreground">
                                {Number(entry.fri_hours) > 0 ? entry.fri_hours : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm border-0 py-2 text-muted-foreground">
                                {Number(entry.sat_hours) > 0 ? entry.sat_hours : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm border-0 py-2 text-muted-foreground">
                                {Number(entry.sun_hours) > 0 ? entry.sun_hours : '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium text-muted-foreground border-0 py-2">
                                {Number(entry.total_hours) || Number(entry.hours) || 0}
                              </TableCell>
                              <TableCell className="border-0 py-2">
                                {['approved', 'rejected'].includes((entry.status || '').toLowerCase()) ? (
                                  <div className="flex justify-end">
                                    <Badge variant="outline" className={`text-xs ${(entry.status || '').toLowerCase() === 'approved'
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : 'bg-red-100 text-red-800 border-red-200'
                                      }`}>
                                      {(entry.status || '').charAt(0).toUpperCase() + (entry.status || '').slice(1).toLowerCase()}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title="Approve Entry"
                                      onClick={() => handleEntryAction(entry, 'APPROVED')}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Reject Entry"
                                      onClick={() => handleEntryAction(entry, 'REJECTED')}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ])}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Descriptions */}
                {reviewingWeekEntries.entries.some(e => e.description) && (
                  <div>
                    <h3 className="font-medium mb-3">Work Descriptions</h3>
                    <div className="space-y-3">
                      {reviewingWeekEntries.entries
                        .filter(e => e.description)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((entry) => (
                          <Card key={entry.id}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium">
                                  {format(new Date(entry.date), "EEEE, MMM d")}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {(entry.regularHours || entry.hours || 0) + (entry.overtimeHours || 0)}h
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{entry.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Rejection Comments if any */}
                {reviewingWeekEntries.entries.some(e => e.status === 'rejected' && e.rejectionComment) && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Rejection Reason</AlertTitle>
                    <AlertDescription>
                      {reviewingWeekEntries.entries
                        .filter(e => e.status === 'rejected' && e.rejectionComment)
                        .map((entry, idx) => (
                          <div key={idx} className="mt-2">
                            <p className="text-sm">{entry.rejectionComment}</p>
                            {entry.rejectedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Rejected on {format(new Date(entry.rejectedAt), "PPP 'at' p")}
                              </p>
                            )}
                          </div>
                        ))[0]
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWeeklyReviewDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Single Entry Rejection Dialog */}
        <Dialog open={showEntryRejectionDialog} onOpenChange={setShowEntryRejectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Time Entry</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this specific time entry.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedEntryForAction && (
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <span className="font-medium">{selectedEntryForAction.project}</span> - {selectedEntryForAction.total_hours || 0}h
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="entry-rejection-reason">Reason <span className="text-red-500">*</span></Label>
                <Textarea
                  id="entry-rejection-reason"
                  placeholder="E.g. Hours exceed budget"
                  value={entryRejectionReason}
                  onChange={(e) => setEntryRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEntryRejectionDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={submitEntryRejection} disabled={!entryRejectionReason.trim()}>
                Reject Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* APPROVALS TAB */}
        <TabsContent value="approvals" className="space-y-4">
          <Tabs defaultValue="client">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="client">
                <Users className="h-4 w-4 mr-2" />
                Client Approvals ({clientApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="accounting">
                <FileText className="h-4 w-4 mr-2" />
                Accounting ({accountingApprovals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Approvals</CardTitle>
                  <CardDescription>
                    {clientApprovals.length} item{clientApprovals.length !== 1 ? 's' : ''} pending client approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientApprovals.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>No timesheets pending client approval</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Project / Client</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientApprovals.map((item) => {
                          const amount = ((item.regularHours || item.hours) * (item.billingRate || 0)) +
                            ((item.overtimeHours || 0) * (item.billingRate || 0) * 1.5);

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{item.employeeName}</span>
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(item.date), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                <div>
                                  <div>{item.project}</div>
                                  <div className="text-xs text-muted-foreground">{item.client}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    {item.regularHours || item.hours}h
                                  </div>
                                  {item.overtimeHours && item.overtimeHours > 0 && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      +{item.overtimeHours}h OT
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>${amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApprovalItem(item);
                                    setShowApprovalDialog(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accounting" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Accounting Approvals</CardTitle>
                  <CardDescription>
                    {accountingApprovals.length} item{accountingApprovals.length !== 1 ? 's' : ''} pending accounting approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accountingApprovals.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>No timesheets pending accounting approval</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Project / Client</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accountingApprovals.map((item) => {
                          const amount = ((item.regularHours || item.hours) * (item.billingRate || 0)) +
                            ((item.overtimeHours || 0) * (item.billingRate || 0) * 1.5);

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{item.employeeName}</span>
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(item.date), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                <div>
                                  <div>{item.project}</div>
                                  <div className="text-xs text-muted-foreground">{item.client}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    {item.regularHours || item.hours}h
                                  </div>
                                  {item.overtimeHours && item.overtimeHours > 0 && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      +{item.overtimeHours}h OT
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>${amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApprovalItem(item);
                                    setShowApprovalDialog(true);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* EXCEPTIONS TAB */}
        <TabsContent value="exceptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Exceptions</CardTitle>
              <CardDescription>
                {exceptionEntries.length} timesheet{exceptionEntries.length !== 1 ? 's have' : ' has'} compliance validation issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exceptionEntries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No compliance exceptions</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exceptionEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.employeeName}</TableCell>
                        <TableCell>{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{entry.project}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            {entry.exceptions?.length || 0} issue{entry.exceptions?.length !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingEntry(entry);
                              setShowReviewDialog(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Time Entry</DialogTitle>
            <DialogDescription>
              Create a new timesheet entry manually or upload an invoice for processing
            </DialogDescription>
          </DialogHeader>

          <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "manual" | "invoice")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="invoice">Upload Invoice</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(emp => emp.onboardingStatus === 'completed' && emp.canAccessTimesheets)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Billable Time</Label>
                  <Switch checked={isBillable} onCheckedChange={setIsBillable} />
                </div>

                {isBillable && employeeAssignments.length > 0 && (
                  <div>
                    <Label>Client Assignment / PO</Label>
                    <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeAssignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment.clientName} - {assignment.poNumber} (${assignment.billingRate}/hr)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!isBillable && (
                  <>
                    <div>
                      <Label>Category</Label>
                      <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Project">Project</SelectItem>
                          <SelectItem value="Training">Training</SelectItem>
                          <SelectItem value="Administrative">Administrative</SelectItem>
                          <SelectItem value="PTO">PTO</SelectItem>
                          <SelectItem value="Holiday">Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Project/Description</Label>
                      <Input
                        value={newEntry.project}
                        onChange={(e) => setNewEntry({ ...newEntry, project: e.target.value })}
                        placeholder="Enter project or activity"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>Date(s)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", selectedDates.length === 0 && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDates.length > 0
                          ? selectedDates.length === 1
                            ? format(selectedDates[0], "PPP")
                            : `${selectedDates.length} dates selected`
                          : "Pick date(s)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="multiple" selected={selectedDates} onSelect={(dates) => setSelectedDates(dates || [])} weekStartsOn={1} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {selectedDates.length > 1 && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2">Selected Dates:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {format(date, "MMM dd, yyyy")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hours input - single date vs multiple dates */}
                {selectedDates.length <= 1 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Regular Hours</Label>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          value={newEntry.regularHours}
                          onChange={(e) => setNewEntry({ ...newEntry, regularHours: e.target.value })}
                          placeholder="8.0"
                        />
                      </div>
                      <div>
                        <Label>Overtime Hours (Optional)</Label>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          value={newEntry.overtimeHours}
                          onChange={(e) => setNewEntry({ ...newEntry, overtimeHours: e.target.value })}
                          placeholder="0.0"
                        />
                      </div>
                    </div>

                    {newEntry.overtimeHours && parseFloat(newEntry.overtimeHours) > 0 && (
                      <div>
                        <Label>OT Approval Email</Label>
                        <Input
                          type="email"
                          value={newEntry.overtimeApprovalEmail}
                          onChange={(e) => setNewEntry({ ...newEntry, overtimeApprovalEmail: e.target.value })}
                          placeholder="manager@company.com"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Required for overtime entries</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <Label>Hours per Date</Label>
                    <div className="space-y-3 max-h-60 overflow-y-auto p-3 border rounded-md">
                      {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date) => {
                        const dateKey = format(date, "yyyy-MM-dd");
                        return (
                          <div key={dateKey} className="grid grid-cols-3 gap-3 items-start pb-3 border-b last:border-b-0">
                            <div className="flex items-center pt-2">
                              <span className="text-sm font-medium">{format(date, "MMM dd, yyyy")}</span>
                            </div>
                            <div>
                              <Label className="text-xs">Regular</Label>
                              <Input
                                type="number"
                                step="0.25"
                                min="0"
                                max="24"
                                value={hoursPerDate[dateKey]?.regular || ""}
                                onChange={(e) => setHoursPerDate(prev => ({
                                  ...prev,
                                  [dateKey]: { ...prev[dateKey], regular: e.target.value }
                                }))}
                                placeholder="8.0"
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">OT (Optional)</Label>
                              <Input
                                type="number"
                                step="0.25"
                                min="0"
                                value={hoursPerDate[dateKey]?.overtime || ""}
                                onChange={(e) => setHoursPerDate(prev => ({
                                  ...prev,
                                  [dateKey]: { ...prev[dateKey], overtime: e.target.value }
                                }))}
                                placeholder="0.0"
                                className="h-9"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {Object.values(hoursPerDate).some((h: any) => h.overtime && parseFloat(h.overtime) > 0) && (
                      <div>
                        <Label>OT Approval Email</Label>
                        <Input
                          type="email"
                          value={newEntry.overtimeApprovalEmail}
                          onChange={(e) => setNewEntry({ ...newEntry, overtimeApprovalEmail: e.target.value })}
                          placeholder="manager@company.com"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Required for overtime entries</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="Describe the work performed..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddManualEntry}>
                  Add Entry
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="invoice" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(emp => emp.onboardingStatus === 'completed' && emp.canAccessTimesheets)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Upload Invoice</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>AI-Powered Processing</AlertTitle>
                  <AlertDescription>
                    The system will automatically extract timesheet data from the invoice using OCR and match it to the employee's assignments.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFileUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>
              Update entry details. Status will be reset to Draft.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Employee</Label>
              <Input
                value={employees.find(e => e.id === selectedEmployee) ? `${employees.find(e => e.id === selectedEmployee)?.firstName} ${employees.find(e => e.id === selectedEmployee)?.lastName}` : ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Billable Time</Label>
              <Switch checked={isBillable} onCheckedChange={setIsBillable} />
            </div>

            {isBillable && employeeAssignments.length > 0 && (
              <div>
                <Label>Client Assignment / PO</Label>
                <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeAssignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.clientName} - {assignment.poNumber} (${assignment.billingRate}/hr)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isBillable && (
              <>
                <div>
                  <Label>Category</Label>
                  <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Project">Project</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Administrative">Administrative</SelectItem>
                      <SelectItem value="PTO">PTO</SelectItem>
                      <SelectItem value="Holiday">Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Project/Description</Label>
                  <Input
                    value={newEntry.project}
                    onChange={(e) => setNewEntry({ ...newEntry, project: e.target.value })}
                    placeholder="Enter project or activity"
                  />
                </div>
              </>
            )}

            <div>
              <Label>Date</Label>
              <Input
                value={selectedDates.length > 0 ? format(selectedDates[0], "PPP") : ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Billable Hours</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={newEntry.regularHours}
                  onChange={(e) => setNewEntry({ ...newEntry, regularHours: e.target.value })}
                  placeholder="8.0"
                />
              </div>
              <div>
                <Label>Overtime Hours</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={newEntry.overtimeHours}
                  onChange={(e) => setNewEntry({ ...newEntry, overtimeHours: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label>Holiday Hours</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={newEntry.holidayHours}
                  onChange={(e) => setNewEntry({ ...newEntry, holidayHours: e.target.value })}
                  placeholder="0.0"
                />
                <p className="text-xs text-purple-600 mt-1">Non-billable</p>
              </div>
            </div>

            {newEntry.overtimeHours && parseFloat(newEntry.overtimeHours) > 0 && (
              <div>
                <Label>OT Approval Email</Label>
                <Input
                  type="email"
                  value={newEntry.overtimeApprovalEmail}
                  onChange={(e) => setNewEntry({ ...newEntry, overtimeApprovalEmail: e.target.value })}
                  placeholder="manager@company.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Required for overtime entries</p>
              </div>
            )}

            <div>
              <Label>Description</Label>
              <Textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Describe the work performed..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEntry}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Entry Dialog */}
      {
        reviewingEntry && (
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Timesheet Entry Details</DialogTitle>
                <DialogDescription>
                  Review complete entry information and compliance status
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee</p>
                    <p className="font-medium">{reviewingEntry.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(reviewingEntry.date), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="font-medium">{reviewingEntry.project}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{reviewingEntry.client}</p>
                  </div>
                  {reviewingEntry.poNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">PO Number</p>
                      <p className="font-medium">{reviewingEntry.poNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(reviewingEntry.status)}</div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Regular Hours</p>
                    <p className="font-medium">{reviewingEntry.regularHours || reviewingEntry.hours}h</p>
                  </div>
                  {reviewingEntry.overtimeHours && reviewingEntry.overtimeHours > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Overtime Hours</p>
                      <p className="font-medium">{reviewingEntry.overtimeHours}h</p>
                    </div>
                  )}
                  {reviewingEntry.billingRate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Billing Rate</p>
                      <p className="font-medium">${reviewingEntry.billingRate}/hr</p>
                    </div>
                  )}
                </div>

                {reviewingEntry.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{reviewingEntry.description}</p>
                    </div>
                  </>
                )}

                {reviewingEntry.hasExceptions && reviewingEntry.exceptions && reviewingEntry.exceptions.length > 0 && (
                  <>
                    <Separator />
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Compliance Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {reviewingEntry.exceptions.map((exception: any, idx: number) => (
                            <li key={idx} className="text-sm">{exception.message || exception}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {reviewingEntry.status === 'rejected' && reviewingEntry.rejectionComment && (
                  <>
                    <Separator />
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Rejection Reason</AlertTitle>
                      <AlertDescription>
                        <p className="text-sm mt-2">{reviewingEntry.rejectionComment}</p>
                        {reviewingEntry.rejectedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Rejected on {format(new Date(reviewingEntry.rejectedAt), "PPP 'at' p")}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Approval Dialog */}
      {
        selectedApprovalItem && (
          <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review & Approve Timesheet</DialogTitle>
                <DialogDescription>
                  Review the timesheet entry and approve or reject
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee</p>
                    <p className="font-medium">{selectedApprovalItem.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedApprovalItem.date), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="font-medium">{selectedApprovalItem.project}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedApprovalItem.client}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hours</p>
                    <p className="font-medium">
                      {selectedApprovalItem.regularHours || selectedApprovalItem.hours}h
                      {selectedApprovalItem.overtimeHours && selectedApprovalItem.overtimeHours > 0 &&
                        ` + ${selectedApprovalItem.overtimeHours}h OT`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      ${(((selectedApprovalItem.regularHours || selectedApprovalItem.hours) * (selectedApprovalItem.billingRate || 0)) +
                        ((selectedApprovalItem.overtimeHours || 0) * (selectedApprovalItem.billingRate || 0) * 1.5)).toFixed(2)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Comments (Optional)</Label>
                  <Textarea
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Add any comments or notes..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleApprove(selectedApprovalItem, false)}
                  disabled={isProcessing}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedApprovalItem, true)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    </div >
  );
}
