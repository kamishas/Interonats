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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
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
  hours: number;
  description: string;
  status: "draft" | "pending_review" | "submitted" | "approved" | "rejected";
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
  matchedToProjectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function TimesheetsEnhanced() {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingEntry, setReviewingEntry] = useState<TimesheetEntry | null>(null);
  const [entryMode, setEntryMode] = useState<"manual" | "invoice">("manual");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    project: "",
    client: "",
    hours: "",
    description: "",
  });

  // Fetch employees and timesheets on mount
  useEffect(() => {
    fetchEmployees();
    fetchTimesheets();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await fetch(`${API_URL}/employees`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
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
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch timesheets');
      }
      
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const selectedEmp = employees.find(emp => emp.id === selectedEmployee);

      if (entryMode === 'manual') {
        if (!selectedDate || !newEntry.project || !newEntry.hours) {
          toast.error('Please fill in all required fields');
          return;
        }

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
            client: newEntry.client,
            hours: parseFloat(newEntry.hours),
            description: newEntry.description,
            status: "draft",
            weekEnding: format(selectedDate, "yyyy-MM-dd"),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create timesheet');
        }

        const createdEntry = await response.json();
        setEntries([...entries, createdEntry]);
        toast.success('Time entry added successfully');
      } else {
        // Invoice mode
        if (!selectedFile) {
          toast.error('Please select an invoice file');
          return;
        }

        setIsUploading(true);

        // In production, this would upload to storage first
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
            fileUrl: '', // Would be actual URL after upload
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload invoice');
        }

        const uploadedEntry = await response.json();
        setEntries([...entries, uploadedEntry]);
        toast.success('Invoice uploaded and processed. Please review the extracted data.');
      }

      // Reset form
      setShowAddDialog(false);
      setEntryMode("manual");
      setSelectedEmployee("");
      setNewEntry({ project: "", client: "", hours: "", description: "" });
      setSelectedDate(undefined);
      setSelectedFile(null);
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

  const handleConfirmReview = async (approved: boolean, corrections: any = {}) => {
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
          corrections,
          reviewedBy: 'employee',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to review timesheet');
      }

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
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete timesheet');
      }

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

  const getEntryTypeBadge = (entry: TimesheetEntry) => {
    if (entry.entryType === "invoice") {
      return (
        <Badge variant="outline" className="mr-2">
          <FileText className="h-3 w-3 mr-1" />
          Invoice {entry.ocrProcessed && `(${Math.round((entry.ocrConfidence || 0) * 100)}%)`}
        </Badge>
      );
    }
    if (entry.entryType === "api_import") {
      return (
        <Badge variant="outline" className="mr-2">
          <Download className="h-3 w-3 mr-1" />
          API Import
        </Badge>
      );
    }
    return null;
  };

  const pendingReviewEntries = entries.filter(e => e.status === "pending_review");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Timesheets</h2>
          <p className="text-muted-foreground">
            Manage time entries, upload invoices, and track approvals
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
              <DialogDescription>
                Select an employee and enter time manually or upload an invoice.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="employee-select">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Employee <span className="text-red-500">*</span>
                  </div>
                </Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger id="employee-select">
                    <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(employees) && employees.length > 0 ? (
                      employees
                        .filter(emp => emp.onboardingStatus === 'completed' && emp.canAccessTimesheets)
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} - {employee.email}
                          </SelectItem>
                        ))
                    ) : (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        {isLoadingEmployees ? "Loading employees..." : "No employees found"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

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
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, project: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-input">Client</Label>
                    <Input
                      id="client-input"
                      type="text"
                      placeholder="Enter client name"
                      value={newEntry.client}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, client: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours-input">Hours <span className="text-red-500">*</span></Label>
                    <Input
                      id="hours-input"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="8.0"
                      value={newEntry.hours}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, hours: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description-input">Description</Label>
                    <Textarea
                      id="description-input"
                      placeholder="What did you work on?"
                      value={newEntry.description}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, description: e.target.value })
                      }
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
                      Upload a client-approved PDF or image timesheet. Our AI will automatically extract:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Employee Name & Client</li>
                        <li>Week Ending & Hours</li>
                        <li>Approver Name/Email</li>
                      </ul>
                      The system will match to PO/assignment and you'll review before submission.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="invoice-upload">Invoice File <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="invoice-upload"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      {selectedFile && (
                        <Badge variant="outline" className="whitespace-nowrap">
                          {selectedFile.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Accepted formats: PDF, PNG, JPG (Max 10MB)
                    </p>
                  </div>

                  {selectedFile && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Invoice selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                        <br />
                        <span className="text-xs">OCR processing will begin after upload</span>
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEntryMode("manual");
                    setSelectedEmployee("");
                    setSelectedFile(null);
                  }}
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

      {/* Pending Review Alert */}
      {pendingReviewEntries.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            You have {pendingReviewEntries.length} timesheet{pendingReviewEntries.length > 1 ? 's' : ''} pending review from uploaded invoices.
            Please review the OCR-extracted data before submission.
          </AlertDescription>
        </Alert>
      )}

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Timesheet Entries</CardTitle>
          <CardDescription>
            Manage all timesheet entries across employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTimesheets ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading timesheets...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        {entry.project}
                        {entry.autoMatched && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Auto-matched
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{entry.client}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {entry.hours}h
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEntryTypeBadge(entry)}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry)}</TableCell>
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
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review OCR-Extracted Timesheet</DialogTitle>
            <DialogDescription>
              Review and confirm the automatically extracted data. Make corrections if needed.
            </DialogDescription>
          </DialogHeader>

          {reviewingEntry && (
            <div className="space-y-4 pt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Source:</strong> {reviewingEntry.invoiceFileName}<br />
                  <strong>OCR Confidence:</strong> {Math.round((reviewingEntry.ocrConfidence || 0) * 100)}%
                  {reviewingEntry.autoMatched && (
                    <>
                      <br />
                      <strong>Auto-matched to project:</strong> {reviewingEntry.project}
                    </>
                  )}
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
                  <Label>Project</Label>
                  <Input value={reviewingEntry.project || ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Hours</Label>
                  <Input value={String(reviewingEntry.hours || '')} readOnly />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Week Ending</Label>
                  <Input value={format(new Date(reviewingEntry.weekEnding), "PPP")} readOnly />
                </div>
              </div>

              {reviewingEntry.clientSigned && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Client-Signed Document</AlertTitle>
                  <AlertDescription className="text-green-800">
                    This timesheet is client-signed and will be automatically approved upon confirmation.
                    No further approval required.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleConfirmReview(false)}
                >
                  Save as Draft
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleConfirmReview(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {reviewingEntry.clientSigned ? "Confirm & Auto-Approve" : "Confirm & Submit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

