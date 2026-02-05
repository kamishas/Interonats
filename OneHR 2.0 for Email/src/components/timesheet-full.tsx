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
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import type { Employee } from "../types";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  project: string;
  client: string;
  
  // 3.2 Multi-PO Support
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
  
  // Non-billable
  billable: boolean;
  category?: string;
  costCenter?: string;
  
  description: string;
  status: string;
  weekEnding: string;
  entryType: "manual" | "invoice" | "api_import";
  
  invoiceFileName?: string;
  invoiceFileUrl?: string;
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

export function TimesheetFull() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingEntry, setReviewingEntry] = useState<TimesheetEntry | null>(null);
  const [entryMode, setEntryMode] = useState<"manual" | "invoice">("manual");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBillable, setIsBillable] = useState(true);
  
  const [newEntry, setNewEntry] = useState({
    project: "",
    client: "",
    regularHours: "",
    overtimeHours: "",
    overtimeApprovalEmail: "",
    description: "",
    category: "Project",
    costCenter: "",
  });

  useEffect(() => {
    fetchEmployees();
    fetchTimesheets();
    fetchAssignments();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
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
      const response = await fetch(`${API_URL}/timesheets`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (!response.ok) throw new Error('Failed to fetch timesheets');
      const data = await response.json();
      const timesheets = data.timesheets || data || [];
      setEntries(Array.isArray(timesheets) ? timesheets : []);
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
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      const data = await response.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const validateAndSubmit = async (timesheetId: string) => {
    try {
      const response = await fetch(`${API_URL}/timesheets/${timesheetId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) throw new Error('Validation failed');
      const validation = await response.json();
      
      if (!validation.overallValid) {
        toast.error('Compliance validation failed. Please review exceptions.');
        return false;
      }
      
      toast.success('Compliance validation passed');
      return true;
    } catch (error) {
      console.error('Error validating timesheet:', error);
      toast.error('Failed to validate timesheet');
      return false;
    }
  };

  const handleAddEntry = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const selectedEmp = employees.find(emp => emp.id === selectedEmployee);
      const assignment = assignments.find(a => a.id === selectedAssignment);

      if (entryMode === 'manual') {
        if (!selectedDate || !newEntry.project || !newEntry.regularHours) {
          toast.error('Please fill in all required fields');
          return;
        }

        const totalHours = parseFloat(newEntry.regularHours) + parseFloat(newEntry.overtimeHours || "0");

        const response = await fetch(`${API_URL}/timesheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            employeeId: selectedEmployee,
            employeeName: selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : 'Unknown',
            date: format(selectedDate, "yyyy-MM-dd"),
            project: newEntry.project,
            client: newEntry.client || assignment?.clientName || "",
            regularHours: parseFloat(newEntry.regularHours),
            hours: totalHours,
            overtimeHours: parseFloat(newEntry.overtimeHours || "0"),
            overtimeRate: newEntry.overtimeHours ? 1.5 : 0,
            overtimeApprovalEmail: newEntry.overtimeApprovalEmail,
            description: newEntry.description,
            status: "draft",
            weekEnding: format(selectedDate, "yyyy-MM-dd"),
            billable: isBillable,
            category: newEntry.category,
            costCenter: newEntry.costCenter,
            assignmentId: selectedAssignment || undefined,
            clientPoId: assignment?.id,
            poNumber: assignment?.poNumber,
            workLocation: assignment?.workLocation || "Remote",
            billingType: assignment?.billingType || "Hourly",
            billingRate: assignment?.billingRate || 0,
            exceptions: [],
            hasExceptions: false,
            complianceValid: false,
            invoiced: false,
          }),
        });

        if (!response.ok) throw new Error('Failed to create timesheet');

        const createdEntry = await response.json();
        
        // Validate compliance
        await validateAndSubmit(createdEntry.id);
        
        setEntries([...entries, createdEntry]);
        toast.success('Time entry added successfully');
      } else {
        // Invoice mode
        if (!selectedFile) {
          toast.error('Please select an invoice file');
          return;
        }

        setIsUploading(true);

        const response = await fetch(`${API_URL}/timesheets/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            employeeId: selectedEmployee,
            employeeName: selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : 'Unknown',
            fileName: selectedFile.name,
            fileUrl: '',
          }),
        });

        if (!response.ok) throw new Error('Failed to upload invoice');

        const uploadedEntry = await response.json();
        setEntries([...entries, uploadedEntry]);
        toast.success('Invoice uploaded and processed. Please review the extracted data.');
      }

      // Reset form
      setShowAddDialog(false);
      setEntryMode("manual");
      setSelectedEmployee("");
      setSelectedAssignment("");
      setNewEntry({
        project: "",
        client: "",
        regularHours: "",
        overtimeHours: "",
        overtimeApprovalEmail: "",
        description: "",
        category: "Project",
        costCenter: "",
      });
      setSelectedDate(undefined);
      setSelectedFile(null);
      setIsBillable(true);
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('Failed to add timesheet entry');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewEntry = (entry: TimesheetEntry) => {
    setReviewingEntry(entry);
    setShowReviewDialog(true);
  };

  const handleConfirmReview = async (approved: boolean) => {
    if (!reviewingEntry) return;

    try {
      const response = await fetch(`${API_URL}/timesheets/${reviewingEntry.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          approved,
          reviewedBy: 'employee',
        }),
      });

      if (!response.ok) throw new Error('Failed to review timesheet');

      const updatedEntry = await response.json();
      setEntries(entries.map(e => e.id === updatedEntry.id ? updatedEntry : e));
      
      if (approved) {
        if (updatedEntry.clientSigned) {
          toast.success('Timesheet approved automatically (client-signed)');
        } else {
          toast.success('Timesheet submitted for approval');
        }
      } else {
        toast.success('Timesheet saved as draft');
      }

      setShowReviewDialog(false);
      setReviewingEntry(null);
    } catch (error) {
      console.error('Error reviewing timesheet:', error);
      toast.error('Failed to review timesheet');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timesheet entry?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/timesheets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) throw new Error('Failed to delete timesheet');

      setEntries(entries.filter(e => e.id !== id));
      toast.success('Timesheet entry deleted');
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast.error('Failed to delete timesheet entry');
    }
  };

  const getStatusBadge = (entry: TimesheetEntry) => {
    if (entry.status === "approved") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved {entry.clientSigned && "(Client-Signed)"}
        </Badge>
      );
    }
    if (entry.status === "pending_review") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Eye className="h-3 w-3 mr-1" />
          Needs Review
        </Badge>
      );
    }
    if (entry.status === "pending_client_approval") {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending Client</Badge>;
    }
    if (entry.status === "pending_accounting_approval") {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Pending Accounting</Badge>;
    }
    if (entry.status === "submitted") {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>;
    }
    if (entry.status === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const employeeAssignments = assignments.filter(a => a.employeeId === selectedEmployee && a.active);

  const pendingReviewEntries = entries.filter(e => e.status === "pending_review");
  const exceptionEntries = entries.filter(e => e.hasExceptions && !e.complianceValid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Timesheets - Full System</h2>
          <p className="text-muted-foreground">
            Complete timesheet management with PO tracking, overtime, compliance validation, and invoicing
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
              <DialogDescription>
                Complete timesheet entry with PO tracking, overtime, and compliance validation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="employee-select">
                  Employee <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger id="employee-select">
                    <SelectValue placeholder={isLoadingEmployees ? "Loading..." : "Select employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(emp => emp.onboardingStatus === 'completed' && emp.canAccessTimesheets)
                      .map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment / PO Selection */}
              {selectedEmployee && employeeAssignments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="assignment-select">Assignment / PO</Label>
                  <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
                    <SelectTrigger id="assignment-select">
                      <SelectValue placeholder="Select assignment (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeAssignments.map((assignment) => (
                        <SelectItem key={assignment.id} value={assignment.id}>
                          {assignment.clientName} - {assignment.poNumber} 
                          (${assignment.poRemaining.toFixed(2)} remaining)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Entry Mode Tabs */}
              <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "manual" | "invoice")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">
                    <Clock className="h-4 w-4 mr-2" />
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger value="invoice">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Invoice
                  </TabsTrigger>
                </TabsList>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date-picker">Date <span className="text-red-500">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date-picker"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            weekStartsOn={1}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-input">Project <span className="text-red-500">*</span></Label>
                      <Input
                        id="project-input"
                        type="text"
                        placeholder="Enter project name"
                        value={newEntry.project}
                        onChange={(e) => setNewEntry({ ...newEntry, project: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regular-hours">Regular Hours <span className="text-red-500">*</span></Label>
                      <Input
                        id="regular-hours"
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="8.0"
                        value={newEntry.regularHours}
                        onChange={(e) => setNewEntry({ ...newEntry, regularHours: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overtime-hours">Overtime Hours</Label>
                      <Input
                        id="overtime-hours"
                        type="number"
                        step="0.5"
                        min="0"
                        max="12"
                        placeholder="0.0"
                        value={newEntry.overtimeHours}
                        onChange={(e) => setNewEntry({ ...newEntry, overtimeHours: e.target.value })}
                      />
                    </div>
                  </div>

                  {newEntry.overtimeHours && parseFloat(newEntry.overtimeHours) > 0 && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <div className="space-y-2">
                          <p>Overtime requires client manager email approval</p>
                          <Input
                            placeholder="Client manager approval email"
                            value={newEntry.overtimeApprovalEmail}
                            onChange={(e) => setNewEntry({ ...newEntry, overtimeApprovalEmail: e.target.value })}
                          />
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="billable-toggle"
                      checked={isBillable}
                      onCheckedChange={setIsBillable}
                    />
                    <Label htmlFor="billable-toggle">Billable Time</Label>
                  </div>

                  {!isBillable && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
                          <SelectTrigger id="category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Project">Project Work</SelectItem>
                            <SelectItem value="Admin">Admin Tasks</SelectItem>
                            <SelectItem value="Business Development">Business Development</SelectItem>
                            <SelectItem value="Training">Training</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cost-center">Cost Center</Label>
                        <Input
                          id="cost-center"
                          placeholder="CC-001"
                          value={newEntry.costCenter}
                          onChange={(e) => setNewEntry({ ...newEntry, costCenter: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description-input">Description</Label>
                    <Textarea
                      id="description-input"
                      placeholder="What did you work on?"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Invoice Upload Tab */}
                <TabsContent value="invoice" className="space-y-4 mt-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>AI-Powered OCR Extraction</AlertTitle>
                    <AlertDescription>
                      Upload a client-approved PDF or image timesheet. Our AI will automatically extract data and validate compliance.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="invoice-upload">Invoice File <span className="text-red-500">*</span></Label>
                    <Input
                      id="invoice-upload"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleAddEntry}
                  disabled={isUploading}
                >
                  {isUploading ? "Processing..." : (entryMode === "manual" ? "Add Entry" : "Upload & Process")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {pendingReviewEntries.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            {pendingReviewEntries.length} timesheet{pendingReviewEntries.length > 1 ? 's' : ''} pending review from uploaded invoices.
          </AlertDescription>
        </Alert>
      )}

      {exceptionEntries.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle>Compliance Issues</AlertTitle>
          <AlertDescription>
            {exceptionEntries.length} timesheet{exceptionEntries.length > 1 ? 's have' : ' has'} compliance validation failures.
          </AlertDescription>
        </Alert>
      )}

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Timesheet Entries</CardTitle>
          <CardDescription>
            Complete timesheet management with PO tracking, overtime, compliance, and invoicing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTimesheets ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading timesheets...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>PO</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No timesheet entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{entry.employeeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(entry.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div>
                            {entry.project}
                            {entry.overtimeHours && entry.overtimeHours > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                +{entry.overtimeHours}h OT
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {entry.hours}h
                            {!entry.billable && (
                              <Badge variant="outline" className="ml-1 text-xs">NB</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.poNumber && (
                            <Badge variant="outline" className="text-xs">
                              {entry.poNumber}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.entryType === "invoice" && (
                            <Badge variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              Invoice
                            </Badge>
                          )}
                          {entry.entryType === "api_import" && (
                            <Badge variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              API
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(entry)}</TableCell>
                        <TableCell>
                          {entry.complianceValid ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Issues
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {entry.status === "pending_review" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewEntry(entry)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            )}
                            {(entry.status === "draft" || entry.status === "pending_review") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review OCR-Extracted Timesheet</DialogTitle>
            <DialogDescription>
              Review the automatically extracted data and compliance validation
            </DialogDescription>
          </DialogHeader>

          {reviewingEntry && (
            <div className="space-y-4 pt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Source:</strong> {reviewingEntry.invoiceFileName}<br />
                  <strong>OCR Confidence:</strong> {Math.round((reviewingEntry.ocrConfidence || 0) * 100)}%
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee Name</Label>
                  <Input value={reviewingEntry.employeeName || ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input value={reviewingEntry.client || ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Hours</Label>
                  <Input value={String(reviewingEntry.hours || '')} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Week Ending</Label>
                  <Input value={reviewingEntry.weekEnding || ''} readOnly />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleConfirmReview(false)}>
                  Save as Draft
                </Button>
                <Button className="flex-1" onClick={() => handleConfirmReview(true)}>
                  Confirm & Submit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

