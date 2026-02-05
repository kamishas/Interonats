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
import { Checkbox } from "./ui/checkbox";
import {
  Plus,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Download,
  Send,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import { InvoiceDetail } from "./invoice-detail";

const API_URL = API_ENDPOINTS.INVOICE;

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  poNumber?: string;
  period?: {
    startDate: string;
    endDate: string;
    type: string;
  };
  lineItems: any[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  status: string;
  generatedAt: string;
  sentAt?: string;
  paidAt?: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  manuallyEdited: boolean;
}

interface Client {
  id: string;
  companyName: string;
}

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Navigation state
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [detailInvoiceId, setDetailInvoiceId] = useState<string | undefined>();
  const [detailTimesheetIds, setDetailTimesheetIds] = useState<string[]>([]);
  
  // Timesheet selection state
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState<string[]>([]);

  // Missing assignment dialog state
  const [showMissingRateDialog, setShowMissingRateDialog] = useState(false);
  const [missingRateTimesheet, setMissingRateTimesheet] = useState<any>(null);
  const [newAssignmentRate, setNewAssignmentRate] = useState('');
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  const [generateForm, setGenerateForm] = useState({
    clientId: "",
    invoiceNumber: "",
    periodType: "monthly",
    startDate: "",
    endDate: "",
    taxRate: "0",
    notes: "",
    terms: "Net 30",
  });

  const [approvedTimesheets, setApprovedTimesheets] = useState<any[]>([]);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(false);

  const [allApprovedTimesheets, setAllApprovedTimesheets] = useState<any[]>([]);
  const [isLoadingAllTimesheets, setIsLoadingAllTimesheets] = useState(true);

  const [projectAssignments, setProjectAssignments] = useState<any[]>([]);

  const [editForm, setEditForm] = useState({
    clientId: "",
    clientName: "",
    periodType: "monthly",
    startDate: "",
    endDate: "",
    taxRate: "0",
    notes: "",
    terms: "Net 30",
    lineItems: [] as any[],
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchAllApprovedTimesheets();
    fetchProjectAssignments();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/invoices`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchInvoices] HTTP error:', response.status, errorText);
        throw new Error(`Failed to fetch invoices: ${response.status}`);
      }
      const data = await response.json();
      console.log('[fetchInvoices] Successfully loaded invoices:', data);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[fetchInvoices] Error fetching invoices:', error);
      // Don't show error toast on initial load to avoid red popup
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchClients] HTTP error:', response.status, errorText);
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }
      const data = await response.json();
      console.log('[fetchClients] Successfully loaded clients:', data);
      // Server returns { clients: [...] }
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (error) {
      console.error('[fetchClients] Error fetching clients:', error);
      // Don't show error toast on initial load to avoid red popup
    }
  };

  const fetchAllApprovedTimesheets = async () => {
    try {
      setIsLoadingAllTimesheets(true);
      const response = await fetch(`${API_URL}/timesheets`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchAllApprovedTimesheets] HTTP error:', response.status, errorText);
        throw new Error(`Failed to fetch timesheets: ${response.status}`);
      }
      const data = await response.json();
      console.log('[fetchAllApprovedTimesheets] Successfully loaded timesheets:', data);
      const timesheets = data.timesheets || data || [];
      setAllApprovedTimesheets(Array.isArray(timesheets) ? timesheets : []);
    } catch (error) {
      console.error('[fetchAllApprovedTimesheets] Error fetching timesheets:', error);
      // Don't show error toast on initial load to avoid red popup
      setAllApprovedTimesheets([]);
    } finally {
      setIsLoadingAllTimesheets(false);
    }
  };

  const fetchProjectAssignments = async () => {
    try {
      const response = await fetch(`${API_URL}/project-assignments`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[fetchProjectAssignments] HTTP error:', response.status, errorText);
        throw new Error(`Failed to fetch project assignments: ${response.status}`);
      }
      const data = await response.json();
      const assignments = Array.isArray(data.assignments) ? data.assignments : [];
      console.log('[fetchProjectAssignments] All project assignments loaded:', assignments);
      setProjectAssignments(assignments);
    } catch (error) {
      console.error('[fetchProjectAssignments] Error fetching project assignments:', error);
      // Don't show error toast on initial load to avoid red popup
      setProjectAssignments([]);
    }
  };

  // Fetch next invoice number
  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await fetch(`${API_URL}/invoices/generate-number`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) {
        console.error('[fetchNextInvoiceNumber] Failed to fetch invoice number');
        return '';
      }
      const data = await response.json();
      console.log('[fetchNextInvoiceNumber] Generated invoice number:', data.invoiceNumber);
      return data.invoiceNumber || '';
    } catch (error) {
      console.error('[fetchNextInvoiceNumber] Error:', error);
      return '';
    }
  };

  // Helper function to get billing rate from project assignment
  const getBillingRate = (timesheet: any): number => {
    // If timesheet already has a billing rate, use it
    if (timesheet.billingRate && timesheet.billingRate > 0) {
      console.log(`[getBillingRate] Using pre-calculated rate from timesheet: $${timesheet.billingRate}/hr`);
      return timesheet.billingRate;
    }

    // Otherwise, look it up from project assignments
    const projectName = timesheet.projectName || timesheet.project;
    console.log(`[getBillingRate] Looking up rate for:`, {
      employeeId: timesheet.employeeId,
      employeeName: timesheet.employeeName,
      projectName: projectName,
      totalAssignments: projectAssignments.length,
      timesheetKeys: Object.keys(timesheet)
    });

    // Try to find matching assignment with flexible project name matching
    const assignment = projectAssignments.find((a: any) => {
      const employeeMatch = a.employeeId === timesheet.employeeId;
      
      // Debug each assignment for this employee
      if (employeeMatch) {
        console.log(`[getBillingRate] Checking assignment:`, {
          assignmentId: a.id,
          employeeId: a.employeeId,
          clientName: a.clientName,
          projectName: a.projectName,
          projectId: a.projectId,
          hasProjectName: !!a.projectName,
          hasProjectId: !!a.projectId,
          billableRate: a.billableRate,
          status: a.status,
          allKeys: Object.keys(a)
        });
      }
      
      if (!employeeMatch) return false;
      
      // Check if assignment has a project field
      const assignmentProjectName = a.projectName || a.project;
      
      // If assignment doesn't have a project name, skip it (can't match)
      if (!assignmentProjectName) {
        console.log(`[getBillingRate] ⚠️ Assignment ${a.id} has NO project name field!`);
        return false;
      }
      
      // Exact match
      if (assignmentProjectName === projectName) {
        console.log(`[getBillingRate] ✅ Exact project name match: "${assignmentProjectName}"`);
        return true;
      }
      
      // Case-insensitive match
      if (assignmentProjectName.toLowerCase() === projectName.toLowerCase()) {
        console.log(`[getBillingRate] ✅ Case-insensitive match: "${assignmentProjectName}" ≈ "${projectName}"`);
        return true;
      }
      
      // Partial match
      if (assignmentProjectName.toLowerCase().includes(projectName.toLowerCase()) ||
          projectName.toLowerCase().includes(assignmentProjectName.toLowerCase())) {
        console.log(`[getBillingRate] ✅ Partial match: "${assignmentProjectName}" ~ "${projectName}"`);
        return true;
      }
      
      return false;
    });
    
    // Show all assignments for this employee for debugging
    const employeeAssignments = projectAssignments.filter((a: any) => a.employeeId === timesheet.employeeId);
    console.log(`[getBillingRate] All assignments for ${timesheet.employeeName}:`, employeeAssignments);
    
    if (assignment) {
      const rate = assignment.billingRate || assignment.billableRate || assignment.rate || 0;
      if (rate > 0) {
        console.log(`[getBillingRate] ✅ Found matching assignment with rate: $${rate}/hr`);
        return rate;
      }
    }
    
    console.info(`[getBillingRate] No billing rate found for ${timesheet.employeeName} on project "${projectName}" - defaulting to $0/hr (can be auto-fixed in UI)`);
    return 0;
  };

  // Function to create a missing project assignment
  const createMissingAssignment = async () => {
    if (!missingRateTimesheet || !newAssignmentRate) {
      toast.error('Please enter a billing rate');
      return;
    }

    setIsCreatingAssignment(true);
    try {
      const projectName = missingRateTimesheet.projectName || missingRateTimesheet.project;
      
      const assignmentData = {
        employeeId: missingRateTimesheet.employeeId,
        employeeName: missingRateTimesheet.employeeName,
        clientId: missingRateTimesheet.clientId,
        clientName: missingRateTimesheet.clientName,
        projectName: projectName,
        projectId: missingRateTimesheet.projectId || crypto.randomUUID(),
        billableRate: parseFloat(newAssignmentRate),
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
      };

      console.log('[createMissingAssignment] Creating assignment:', assignmentData);

      const response = await fetch(`${API_URL}/project-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) throw new Error('Failed to create project assignment');

      toast.success(`Project assignment created for ${missingRateTimesheet.employeeName} on ${projectName}`);
      
      // Refresh project assignments
      await fetchProjectAssignments();
      
      // Close dialog and reset
      setShowMissingRateDialog(false);
      setMissingRateTimesheet(null);
      setNewAssignmentRate('');
    } catch (error) {
      console.error('Error creating project assignment:', error);
      toast.error('Failed to create project assignment');
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  // Auto-fix all missing project assignments
  const autoFixMissingAssignments = async () => {
    setIsAutoFixing(true);
    try {
      console.log('[Auto-Fix] Calling auto-fix endpoint...');
      
      const response = await fetch(`${API_URL}/project-assignments/auto-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to auto-fix project assignments');

      const result = await response.json();
      
      if (result.created > 0) {
        toast.success(
          `Created ${result.created} project assignment(s) with $0 billing rate. ` +
          `Now use the "Fix Rate" button next to each timesheet to set the correct billing rate, ` +
          `or go to Vendor Management → Project Assignments to bulk edit.`,
          { duration: 10000 }
        );
        
        // Refresh project assignments and timesheets
        await fetchProjectAssignments();
        await fetchAllApprovedTimesheets();
      } else {
        toast.info('All timesheets already have project assignments');
      }
    } catch (error) {
      console.error('Error auto-fixing project assignments:', error);
      toast.error('Failed to auto-fix project assignments');
    } finally {
      setIsAutoFixing(false);
    }
  };

  const fetchApprovedTimesheets = async () => {
    if (!generateForm.clientId || !generateForm.startDate || !generateForm.endDate) {
      setApprovedTimesheets([]);
      return;
    }

    try {
      setIsLoadingTimesheets(true);
      const response = await fetch(`${API_URL}/timesheets`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) throw new Error('Failed to fetch timesheets');
      const data = await response.json();
      
      // Filter for approved timesheets for selected client and date range
      const filtered = (Array.isArray(data) ? data : []).filter((t: any) => 
        t.clientId === generateForm.clientId &&
        t.status === "approved" &&
        !t.invoiced &&
        new Date(t.date) >= new Date(generateForm.startDate) &&
        new Date(t.date) <= new Date(generateForm.endDate)
      );
      
      setApprovedTimesheets(filtered);
      
      // Silently load - don't show info/success toasts for normal data loading
      console.log(`[fetchApprovedTimesheets] Found ${filtered.length} approved timesheet(s) for invoice generation`);
    } catch (error) {
      console.error('[fetchApprovedTimesheets] Error fetching approved timesheets:', error);
      // Don't show error toast - let user continue with invoice generation UI
      setApprovedTimesheets([]);
    } finally {
      setIsLoadingTimesheets(false);
    }
  };

  // Fetch approved timesheets when client or dates change
  useEffect(() => {
    if (showGenerateDialog) {
      fetchApprovedTimesheets();
    }
  }, [generateForm.clientId, generateForm.startDate, generateForm.endDate, showGenerateDialog]);

  // Auto-generate invoice number when dialog opens
  useEffect(() => {
    if (showGenerateDialog && !generateForm.invoiceNumber) {
      fetchNextInvoiceNumber().then((invoiceNumber) => {
        if (invoiceNumber) {
          setGenerateForm(prev => ({ ...prev, invoiceNumber }));
        }
      });
    }
  }, [showGenerateDialog]);

  const handleGenerateInvoice = async () => {
    if (!generateForm.clientId || !generateForm.startDate || !generateForm.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!generateForm.invoiceNumber) {
      toast.error('Invoice number is required');
      return;
    }

    try {
      setIsGenerating(true);
      
      const client = clients.find(c => c.id === generateForm.clientId);
      
      const response = await fetch(`${API_URL}/invoices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify({
          clientId: generateForm.clientId,
          clientName: client?.companyName || "Unknown Client",
          invoiceNumber: generateForm.invoiceNumber,
          period: {
            startDate: generateForm.startDate,
            endDate: generateForm.endDate,
            type: generateForm.periodType,
          },
          taxRate: parseFloat(generateForm.taxRate) / 100,
          notes: generateForm.notes,
          terms: generateForm.terms,
          generatedBy: "Current User", // In production, get from auth context
        }),
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      const invoice = await response.json();
      setInvoices([invoice, ...invoices]);
      toast.success(`Invoice ${invoice.invoiceNumber} generated successfully`);
      
      // Refresh approved timesheets list
      fetchAllApprovedTimesheets();
      
      setShowGenerateDialog(false);
      setGenerateForm({
        clientId: "",
        invoiceNumber: "",
        periodType: "monthly",
        startDate: "",
        endDate: "",
        taxRate: "0",
        notes: "",
        terms: "Net 30",
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickGenerateForClient = (clientId: string) => {
    setGenerateForm({
      ...generateForm,
      clientId,
      invoiceNumber: "", // Will be auto-generated when dialog opens
    });
    setShowGenerateDialog(true);
  };

  // Group approved timesheets by client
  const groupedTimesheets = allApprovedTimesheets
    .filter((ts: any) => ts.status === "approved" && !ts.invoiced)
    .reduce((acc: any, ts: any) => {
      const clientKey = ts.clientId || "unknown";
      if (!acc[clientKey]) {
        acc[clientKey] = {
          clientId: ts.clientId,
          clientName: ts.clientName || "Unknown Client",
          timesheets: [],
          totalAmount: 0,
        };
      }
      
      const rate = getBillingRate(ts);
      const regularAmount = (ts.regularHours || ts.hours || 0) * rate;
      const overtimeAmount = (ts.overtimeHours || 0) * rate * 1.5;
      const totalAmount = regularAmount + overtimeAmount;
      
      acc[clientKey].timesheets.push(ts);
      acc[clientKey].totalAmount += totalAmount;
      
      return acc;
    }, {});

  const clientGroups = Object.values(groupedTimesheets);

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to send invoice');

      const updated = await response.json();
      setInvoices(invoices.map(inv => inv.id === updated.invoice.id ? updated.invoice : inv));
      toast.success(`Invoice ${invoice.invoiceNumber} sent successfully`);
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  const handleFinalizeInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch(`${API_URL}/invoices/${invoice.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to finalize invoice');

      const finalized = await response.json();
      setInvoices(invoices.map(inv => inv.id === finalized.id ? finalized : inv));
      toast.success(`Invoice ${invoice.invoiceNumber} finalized with ${finalized.lineItems.length} line items`);
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      toast.error('Failed to finalize invoice');
    }
  };

  const viewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const editInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditForm({
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      periodType: invoice.period?.type || 'monthly',
      startDate: invoice.period?.startDate || '',
      endDate: invoice.period?.endDate || '',
      taxRate: String(invoice.taxRate * 100),
      notes: invoice.notes || "",
      terms: invoice.terms || "Net 30",
      lineItems: [...invoice.lineItems],
    });
    setShowEditDialog(true);
  };

  const handleSaveInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      setIsSaving(true);

      // Recalculate totals
      const subtotal = editForm.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = parseFloat(editForm.taxRate) / 100;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      const updatedInvoice = {
        ...selectedInvoice,
        clientId: editForm.clientId,
        clientName: editForm.clientName,
        period: {
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          type: editForm.periodType,
        },
        lineItems: editForm.lineItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes: editForm.notes,
        terms: editForm.terms,
        manuallyEdited: true,
      };

      const response = await fetch(`${API_URL}/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify(updatedInvoice),
      });

      if (!response.ok) throw new Error('Failed to update invoice');

      const saved = await response.json();
      setInvoices(invoices.map(inv => inv.id === saved.id ? saved : inv));
      toast.success(`Invoice ${selectedInvoice.invoiceNumber} updated successfully`);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete invoice');

      setInvoices(invoices.filter(inv => inv.id !== invoice.id));
      toast.success(`Invoice ${invoice.invoiceNumber} deleted successfully`);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...editForm.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    
    // Recalculate amount if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : newLineItems[index].quantity;
      const rate = field === 'rate' ? parseFloat(value) || 0 : newLineItems[index].rate;
      newLineItems[index].amount = qty * rate;
    }
    
    setEditForm({ ...editForm, lineItems: newLineItems });
  };

  const addLineItem = () => {
    setEditForm({
      ...editForm,
      lineItems: [
        ...editForm.lineItems,
        {
          id: `new-${Date.now()}`,
          description: '',
          quantity: 0,
          rate: 0,
          amount: 0,
        }
      ]
    });
  };

  const removeLineItem = (index: number) => {
    setEditForm({
      ...editForm,
      lineItems: editForm.lineItems.filter((_, i) => i !== index)
    });
  };

  const getStatusBadge = (invoice: Invoice) => {
    switch (invoice.status) {
      case "auto-draft":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Clock className="h-3 w-3 mr-1" />
            Auto-Draft
          </Badge>
        );
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Sent</Badge>;
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{invoice.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {viewMode === 'detail' ? (
        <InvoiceDetail
          invoiceId={detailInvoiceId}
          timesheetIds={detailTimesheetIds}
          onBack={() => {
            setViewMode('list');
            setDetailInvoiceId(undefined);
            setDetailTimesheetIds([]);
            fetchInvoices();
            fetchAllApprovedTimesheets();
          }}
        />
      ) : (
        <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Invoice Management</h2>
          <p className="text-muted-foreground">
            Auto-generate invoices from approved timesheets and expenses
          </p>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button className="gradient-teal-blue text-white shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
              <DialogDescription>
                Generate invoice from approved timesheets and expenses for a client and period
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="client-select">
                  Client <span className="text-red-500">*</span>
                </Label>
                <Select value={generateForm.clientId} onValueChange={(v) => setGenerateForm({ ...generateForm, clientId: v })}>
                  <SelectTrigger id="client-select">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-number">
                  Invoice Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoice-number"
                  placeholder="INV-202412-0001"
                  value={generateForm.invoiceNumber}
                  onChange={(e) => setGenerateForm({ ...generateForm, invoiceNumber: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated but can be edited
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">
                    Period Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={generateForm.startDate}
                    onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">
                    Period End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={generateForm.endDate}
                    onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period-type">Period Type</Label>
                  <Select value={generateForm.periodType} onValueChange={(v) => setGenerateForm({ ...generateForm, periodType: v })}>
                    <SelectTrigger id="period-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={generateForm.taxRate}
                    onChange={(e) => setGenerateForm({ ...generateForm, taxRate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Payment Terms</Label>
                <Select value={generateForm.terms} onValueChange={(v) => setGenerateForm({ ...generateForm, terms: v })}>
                  <SelectTrigger id="terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes for this invoice..."
                  value={generateForm.notes}
                  onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Approved Timesheets Preview */}
              {generateForm.clientId && generateForm.startDate && generateForm.endDate && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Approved Timesheets ({approvedTimesheets.length})</Label>
                  {isLoadingTimesheets ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Loading approved timesheets...
                    </div>
                  ) : approvedTimesheets.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No approved timesheets found for this period
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedTimesheets.map((ts: any) => {
                            const rate = getBillingRate(ts);
                            const regularAmount = (ts.regularHours || ts.hours || 0) * rate;
                            const overtimeAmount = (ts.overtimeHours || 0) * rate * 1.5;
                            const totalAmount = regularAmount + overtimeAmount;
                            
                            return (
                              <TableRow key={ts.id}>
                                <TableCell className="text-sm">{ts.employeeName}</TableCell>
                                <TableCell className="text-sm">{format(new Date(ts.date), "MMM d, yyyy")}</TableCell>
                                <TableCell className="text-sm">{ts.project}</TableCell>
                                <TableCell className="text-sm">
                                  <div>
                                    <div>{ts.regularHours || ts.hours}h</div>
                                    {ts.overtimeHours > 0 && (
                                      <div className="text-xs text-orange-600">+{ts.overtimeHours}h OT</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">${totalAmount.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="font-medium bg-gray-50">
                            <TableCell colSpan={4} className="text-right">Subtotal:</TableCell>
                            <TableCell>
                              ${approvedTimesheets.reduce((sum: number, ts: any) => {
                                const rate = getBillingRate(ts);
                                const regularAmount = (ts.regularHours || ts.hours || 0) * rate;
                                const overtimeAmount = (ts.overtimeHours || 0) * rate * 1.5;
                                return sum + regularAmount + overtimeAmount;
                              }, 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowGenerateDialog(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleGenerateInvoice}
                  disabled={isGenerating || approvedTimesheets.length === 0}
                >
                  {isGenerating ? "Generating..." : `Generate Invoice (${approvedTimesheets.length} entries)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Approved Timesheets Ready for Invoicing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approved Timesheets Ready for Invoicing</CardTitle>
              <CardDescription>
                Select timesheets to generate an invoice
              </CardDescription>
            </div>
            {selectedTimesheetIds.length > 0 && (
              <Button
                onClick={() => {
                  setDetailTimesheetIds(selectedTimesheetIds);
                  setViewMode('detail');
                }}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Generate Invoice ({selectedTimesheetIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAllTimesheets ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading approved timesheets...
            </div>
          ) : clientGroups.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No approved timesheets awaiting invoicing
            </div>
          ) : (
            <div className="space-y-4">
              {/* Missing Rates Warning Banner */}
              {(() => {
                const timesheetsWithMissingRates = allApprovedTimesheets.filter((ts: any) => getBillingRate(ts) === 0);
                if (timesheetsWithMissingRates.length > 0) {
                  return (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-red-900">
                                Missing Billing Rates ({timesheetsWithMissingRates.length} timesheet{timesheetsWithMissingRates.length === 1 ? '' : 's'})
                              </div>
                              <Button
                                size="sm"
                                onClick={autoFixMissingAssignments}
                                disabled={isAutoFixing}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isAutoFixing ? 'Creating...' : 'Auto-Fix All'}
                              </Button>
                            </div>
                            <div className="text-sm text-red-700 mb-3">
                              The following employees don't have project assignments with billing rates. Click "Auto-Fix All" to create placeholder assignments (with $0 rate), then set the billing rates.
                            </div>
                            <div className="space-y-1">
                              {timesheetsWithMissingRates.slice(0, 5).map((ts: any) => (
                                <div key={ts.id} className="text-sm text-red-800 flex items-center gap-2">
                                  <span className="font-medium">{ts.employeeName}</span>
                                  <span className="text-red-600">→</span>
                                  <span>{ts.projectName || ts.project}</span>
                                  <span className="text-red-600">→</span>
                                  <span>{ts.clientName}</span>
                                </div>
                              ))}
                              {timesheetsWithMissingRates.length > 5 && (
                                <div className="text-sm text-red-600 italic">
                                  ...and {timesheetsWithMissingRates.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}
              
              {clientGroups.map((group: any) => (
                <Card key={group.clientId} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.clientName}</CardTitle>
                        <CardDescription>
                          {group.timesheets.length} timesheet(s) • Total: ${group.totalAmount.toFixed(2)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Select all timesheets for this client
                            const clientTimesheetIds = group.timesheets.map((ts: any) => ts.id);
                            const allSelected = clientTimesheetIds.every((id: string) => 
                              selectedTimesheetIds.includes(id)
                            );
                            
                            if (allSelected) {
                              // Deselect all
                              setSelectedTimesheetIds(prev => 
                                prev.filter((id: string) => !clientTimesheetIds.includes(id))
                              );
                            } else {
                              // Select all
                              setSelectedTimesheetIds(prev => [
                                ...prev.filter((id: string) => !clientTimesheetIds.includes(id)),
                                ...clientTimesheetIds
                              ]);
                            }
                          }}
                        >
                          {group.timesheets.every((ts: any) => selectedTimesheetIds.includes(ts.id))
                            ? 'Deselect All'
                            : 'Select All'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => quickGenerateForClient(group.clientId)}
                          className="gradient-teal-blue text-white shadow-md hover:shadow-lg transition-shadow"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Quick Generate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={group.timesheets.every((ts: any) => selectedTimesheetIds.includes(ts.id))}
                                onCheckedChange={(checked) => {
                                  const clientTimesheetIds = group.timesheets.map((ts: any) => ts.id);
                                  if (checked) {
                                    setSelectedTimesheetIds(prev => [
                                      ...prev.filter((id: string) => !clientTimesheetIds.includes(id)),
                                      ...clientTimesheetIds
                                    ]);
                                  } else {
                                    setSelectedTimesheetIds(prev => 
                                      prev.filter((id: string) => !clientTimesheetIds.includes(id))
                                    );
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.timesheets.map((ts: any) => {
                            const rate = getBillingRate(ts);
                            const regularAmount = (ts.regularHours || ts.hours || 0) * rate;
                            const overtimeAmount = (ts.overtimeHours || 0) * rate * 1.5;
                            const totalAmount = regularAmount + overtimeAmount;
                            
                            // Find all assignments for this employee to help debug
                            const employeeAssignments = projectAssignments.filter((a: any) => a.employeeId === ts.employeeId);
                            
                            return (
                              <TableRow key={ts.id} className={rate === 0 ? "bg-red-50" : ""}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedTimesheetIds.includes(ts.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedTimesheetIds(prev => [...prev, ts.id]);
                                      } else {
                                        setSelectedTimesheetIds(prev => prev.filter(id => id !== ts.id));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{ts.employeeName}</TableCell>
                                <TableCell>{format(new Date(ts.date), "MMM d, yyyy")}</TableCell>
                                <TableCell>
                                  <div>
                                    <div>{ts.project}</div>
                                    {rate === 0 && employeeAssignments.length > 0 && (
                                      <div className="text-xs text-red-600 mt-1">
                                        ⚠️ No match. Available: {employeeAssignments.map((a: any) => a.projectName).join(", ")}
                                      </div>
                                    )}
                                    {rate === 0 && employeeAssignments.length === 0 && (
                                      <div className="text-xs text-red-600 mt-1">
                                        ⚠️ No project assignments found for {ts.employeeName}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div>{ts.regularHours || ts.hours}h</div>
                                    {ts.overtimeHours > 0 && (
                                      <div className="text-xs text-orange-600">+{ts.overtimeHours}h OT</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {rate === 0 ? (
                                    <span className="text-red-600 font-medium">$0.00/hr ⚠️</span>
                                  ) : (
                                    <span>${rate.toFixed(2)}/hr</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">${totalAmount.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            Manage and track invoices generated from timesheets and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading invoices...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="gradient-teal-blue">
                  <TableHead className="text-white">Invoice #</TableHead>
                  <TableHead className="text-white">Client</TableHead>
                  <TableHead className="text-white">Period</TableHead>
                  <TableHead className="text-white">Amount</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Due Date</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices found. Generate your first invoice.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {invoice.invoiceNumber}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>
                        {invoice.period && invoice.period.startDate && invoice.period.endDate 
                          ? `${format(new Date(invoice.period.startDate), "MMM d")} - ${format(new Date(invoice.period.endDate), "MMM d, yyyy")}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {invoice.total.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice)}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewInvoice(invoice)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {invoice.status === "auto-draft" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleFinalizeInvoice(invoice)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Finalize
                            </Button>
                          )}
                          {invoice.status === "draft" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSendInvoice(invoice)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {invoice.status === "draft" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => editInvoice(invoice)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteInvoice(invoice)}
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
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

      {/* View Invoice Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <div className="mt-1">{selectedInvoice.clientName}</div>
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <div className="mt-1">{selectedInvoice.invoiceNumber}</div>
                </div>
                <div>
                  <Label>Period</Label>
                  <div className="mt-1">
                    {selectedInvoice.period && selectedInvoice.period.startDate && selectedInvoice.period.endDate
                      ? `${format(new Date(selectedInvoice.period.startDate), "MMM d")} - ${format(new Date(selectedInvoice.period.endDate), "MMM d, yyyy")}`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice)}</div>
                </div>
              </div>

              <div>
                <Label>Line Items</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.lineItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.rate.toFixed(2)}</TableCell>
                          <TableCell>${item.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end space-y-2">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({(selectedInvoice.taxRate * 100).toFixed(1)}%):</span>
                      <span>${selectedInvoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total:</span>
                      <span>${selectedInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="mt-1 text-sm text-muted-foreground">{selectedInvoice.notes}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <div className="mt-1">{selectedInvoice.clientName}</div>
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <div className="mt-1">{selectedInvoice.invoiceNumber}</div>
                </div>
                <div>
                  <Label>Period</Label>
                  <div className="mt-1">
                    {selectedInvoice.period && selectedInvoice.period.startDate && selectedInvoice.period.endDate
                      ? `${format(new Date(selectedInvoice.period.startDate), "MMM d")} - ${format(new Date(selectedInvoice.period.endDate), "MMM d, yyyy")}`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice)}</div>
                </div>
              </div>

              <div>
                <Label>Line Items</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editForm.lineItems.map((item: any, index: number) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeLineItem(index)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addLineItem}
                          >
                            Add Line Item
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end space-y-2">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${editForm.lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({editForm.taxRate}%):</span>
                      <span>${(editForm.lineItems.reduce((sum, item) => sum + item.amount, 0) * (parseFloat(editForm.taxRate) / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total:</span>
                      <span>${(editForm.lineItems.reduce((sum, item) => sum + item.amount, 0) + (editForm.lineItems.reduce((sum, item) => sum + item.amount, 0) * (parseFloat(editForm.taxRate) / 100))).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {editForm.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="mt-1 text-sm text-muted-foreground">{editForm.notes}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowEditDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveInvoice}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing Rate Dialog */}
      <Dialog open={showMissingRateDialog} onOpenChange={setShowMissingRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project Assignment</DialogTitle>
            <DialogDescription>
              This employee doesn't have a project assignment for this project. Create one to set the billing rate.
            </DialogDescription>
          </DialogHeader>
          
          {missingRateTimesheet && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Employee:</span>
                  <span className="font-medium">{missingRateTimesheet.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Project:</span>
                  <span className="font-medium">{missingRateTimesheet.projectName || missingRateTimesheet.project}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client:</span>
                  <span className="font-medium">{missingRateTimesheet.clientName}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="billingRate">Billing Rate ($/hour)</Label>
                <Input
                  id="billingRate"
                  type="number"
                  placeholder="Enter billing rate"
                  value={newAssignmentRate}
                  onChange={(e) => setNewAssignmentRate(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This rate will be used for all future timesheets for this employee on this project.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMissingRateDialog(false);
                setMissingRateTimesheet(null);
                setNewAssignmentRate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createMissingAssignment}
              disabled={isCreatingAssignment || !newAssignmentRate}
            >
              {isCreatingAssignment ? 'Creating...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
