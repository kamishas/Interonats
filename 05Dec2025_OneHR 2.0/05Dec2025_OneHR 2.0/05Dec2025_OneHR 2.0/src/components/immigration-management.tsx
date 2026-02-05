import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { 
  AlertCircle, 
  Plus, 
  FileText, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  FileCheck,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "./ui/utils";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { 
  ImmigrationRecord, 
  ImmigrationFiling, 
  GreenCardProcess, 
  ImmigrationDocument,
  ImmigrationStatus,
  FilingType,
  FilingStatus,
  GreenCardStage
} from "../types";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { ImmigrationTimeline } from "./immigration-timeline";
import { ImmigrationCaseFormEnhanced } from "./immigration-case-form-enhanced";
import { ImmigrationAttorneyIntegration } from "./immigration-attorney-integration";
import { ImmigrationDocumentRequests } from "./immigration-document-requests";
import { ImmigrationDependentForm } from "./immigration-dependent-form";

// Utility function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: string): string => {
  if (!dateString) return '';
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
};

export function ImmigrationManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [records, setRecords] = useState<ImmigrationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ImmigrationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Filings search and filter states
  const [filingsSearchTerm, setFilingsSearchTerm] = useState("");
  const [filingsFilterFilingType, setFilingsFilterFilingType] = useState<string>("all");
  const [filingsFilterStatus, setFilingsFilterStatus] = useState<string>("all");
  const [filingsFilterFilingStatus, setFilingsFilterFilingStatus] = useState<string>("all");
  const [filingsFilterPerson, setFilingsFilterPerson] = useState<string>("all");
  
  const [showAddFilingDialog, setShowAddFilingDialog] = useState(false);
  const [showEditFilingDialog, setShowEditFilingDialog] = useState(false);
  const [editingFiling, setEditingFiling] = useState<any>(null);
  const [showAddGCProcessDialog, setShowAddGCProcessDialog] = useState(false);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [showAddDependentDialog, setShowAddDependentDialog] = useState(false);
  const [showEditGCProcessDialog, setShowEditGCProcessDialog] = useState(false);
  const [editingGCEmployeeId, setEditingGCEmployeeId] = useState<string>("");
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  
  // Delete confirmation states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'record' | 'case' | 'filing' | 'dependent' | 'cost' | 'document' | 'greencard' | null;
    id: string;
    name: string;
  }>({ open: false, type: null, id: '', name: '' });

  // Form states
  const [newFiling, setNewFiling] = useState({
    employeeId: "",
    dependentId: "",
    filingType: "Initial" as FilingType,
    immigrationStatus: "H-1B" as ImmigrationStatus,
    receiptNumber: "",
    filedDate: "",
    approvalDate: "",
    expiryDate: "",
    status: "Not Started" as FilingStatus,
    notes: "",
    costAmount: "",
    costAllocatedTo: ""
  });

  const [newGCProcess, setNewGCProcess] = useState({
    employeeId: "",
    currentStage: "PERM - Labor Certification" as GreenCardStage,
    permFiledDate: "",
    permApprovedDate: "",
    i140FiledDate: "",
    i140ApprovedDate: "",
    i485FiledDate: "",
    i485ApprovedDate: "",
    priorityDate: "",
    notes: ""
  });

  const [newDocument, setNewDocument] = useState({
    employeeId: "",
    filingId: "",
    documentType: "",
    documentName: "",
    expiryDate: "",
    notes: ""
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.IMMIGRATION}/records`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error("Error fetching immigration records:", error);
      toast.error("Failed to load immigration records");
    } finally {
      setIsLoading(false);
    }
  };

  const addFiling = async () => {
    if (!newFiling.employeeId || !newFiling.filingType) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      // Get dependent name if dependent is selected
      let dependentName = undefined;
      if (newFiling.dependentId) {
        const selectedEmployee = records.find(r => r.id === newFiling.employeeId);
        const dependent = selectedEmployee?.dependents?.find((d: any) => d.id === newFiling.dependentId);
        dependentName = dependent?.name;
      }

      const response = await fetch(
        `${API_ENDPOINTS.IMMIGRATION}/filings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify({
            ...newFiling,
            dependentName,
            costAmount: newFiling.costAmount ? parseFloat(newFiling.costAmount) : undefined
          }),
        }
      );

      if (response.ok) {
        toast.success("Filing record created");
        setShowAddFilingDialog(false);
        setNewFiling({
          employeeId: "",
          dependentId: "",
          filingType: "Initial",
          immigrationStatus: "H-1B",
          receiptNumber: "",
          filedDate: "",
          approvalDate: "",
          expiryDate: "",
          status: "Not Started",
          notes: "",
          costAmount: "",
          costAllocatedTo: ""
        });
        fetchRecords();
      } else {
        const error = await response.text();
        toast.error(`Failed to create filing: ${error}`);
      }
    } catch (error) {
      console.error("Error creating filing:", error);
      toast.error("Failed to create filing");
    }
  };

  const updateFiling = async () => {
    if (!editingFiling || !editingFiling.filingType) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.IMMIGRATION}/filings/${editingFiling.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify({
            ...editingFiling,
            costAmount: editingFiling.costAmount ? parseFloat(editingFiling.costAmount) : undefined
          }),
        }
      );

      if (response.ok) {
        toast.success("Filing record updated");
        setShowEditFilingDialog(false);
        setEditingFiling(null);
        fetchRecords();
      } else {
        const error = await response.text();
        toast.error(`Failed to update filing: ${error}`);
      }
    } catch (error) {
      console.error("Error updating filing:", error);
      toast.error("Failed to update filing");
    }
  };

  const addGCProcess = async () => {
    if (!newGCProcess.employeeId) {
      toast.error("Please select an employee");
      return;
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.IMMIGRATION}/green-card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify(newGCProcess),
        }
      );

      if (response.ok) {
        toast.success("Green Card process created");
        setShowAddGCProcessDialog(false);
        setNewGCProcess({
          employeeId: "",
          currentStage: "PERM - Labor Certification",
          permFiledDate: "",
          permApprovedDate: "",
          i140FiledDate: "",
          i140ApprovedDate: "",
          i485FiledDate: "",
          i485ApprovedDate: "",
          priorityDate: "",
          notes: ""
        });
        fetchRecords();
      } else {
        const error = await response.text();
        toast.error(`Failed to create GC process: ${error}`);
      }
    } catch (error) {
      console.error("Error creating GC process:", error);
      toast.error("Failed to create GC process");
    }
  };

  const confirmDelete = (type: 'record' | 'case' | 'filing' | 'dependent' | 'cost' | 'document' | 'greencard', id: string, name: string) => {
    console.log('[Immigration] confirmDelete called:', { type, id, name });
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleDelete = async () => {
    const { type, id } = deleteDialog;
    console.log('[Immigration] handleDelete called:', { type, id });
    
    try {
      let endpoint = '';
      let successMessage = '';
      
      switch (type) {
        case 'record':
          endpoint = `immigration/records/${id}`;
          successMessage = 'Employee immigration record deleted';
          break;
        case 'case':
          endpoint = `immigration/cases/${id}`;
          successMessage = 'Case deleted';
          break;
        case 'filing':
          endpoint = `immigration/filings/${id}`;
          successMessage = 'Filing deleted';
          break;
        case 'dependent':
          endpoint = `immigration/dependents/${id}`;
          successMessage = 'Dependent deleted';
          break;
        case 'cost':
          endpoint = `immigration/costs/${id}`;
          successMessage = 'Cost deleted';
          break;
        case 'document':
          endpoint = `immigration/documents/${id}`;
          successMessage = 'Document deleted';
          break;
        case 'greencard':
          endpoint = `immigration/green-card/${id}`;
          successMessage = 'Green Card process deleted';
          break;
        default:
          return;
      }

      console.log('[Immigration] Calling DELETE endpoint:', endpoint);
      const response = await fetch(
        `${API_ENDPOINTS.IMMIGRATION}/${endpoint}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
          },
        }
      );

      console.log('[Immigration] DELETE response:', response.status, response.statusText);
      if (response.ok) {
        toast.success(successMessage);
        setDeleteDialog({ open: false, type: null, id: '', name: '' });
        
        // Close detail dialog if we deleted the currently selected record
        if (type === 'record' && selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
        
        fetchRecords();
      } else {
        const error = await response.text();
        console.error('[Immigration] DELETE error response:', error);
        toast.error(`Failed to delete: ${error}`);
      }
    } catch (error) {
      console.error('[Immigration] Error deleting:', error);
      toast.error('Failed to delete item');
    }
  };

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleAddDependent = async (formData: any) => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.IMMIGRATION}/dependents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast.success("Dependent added successfully");
        setShowAddDependentDialog(false);
        fetchRecords();
      } else {
        const errorText = await response.text();
        console.error("Error adding dependent:", errorText);
        toast.error(`Failed to add dependent: ${errorText}`);
      }
    } catch (error) {
      console.error("Error adding dependent:", error);
      toast.error(`Failed to add dependent: ${error}`);
    }
  };

  const handleEditGCProcess = (employeeId: string) => {
    const record = records.find(r => r.id === employeeId);
    if (record && record.greenCardProcess) {
      setEditingGCEmployeeId(employeeId);
      setNewGCProcess({
        employeeId,
        currentStage: record.greenCardProcess.currentStage,
        permFiledDate: record.greenCardProcess.permFiledDate || "",
        permApprovedDate: record.greenCardProcess.permApprovedDate || "",
        i140FiledDate: record.greenCardProcess.i140FiledDate || "",
        i140ApprovedDate: record.greenCardProcess.i140ApprovedDate || "",
        i485FiledDate: record.greenCardProcess.i485FiledDate || "",
        i485ApprovedDate: record.greenCardProcess.i485ApprovedDate || "",
        priorityDate: record.greenCardProcess.priorityDate || "",
        notes: record.greenCardProcess.notes || ""
      });
      setShowEditGCProcessDialog(true);
    }
  };

  const handleUpdateGCProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(
        `${API_ENDPOINTS.IMMIGRATION}/green-card/${editingGCEmployeeId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken() ?? ''}`,
          },
          body: JSON.stringify(newGCProcess),
        }
      );

      if (response.ok) {
        toast.success("Green Card process updated successfully");
        setShowEditGCProcessDialog(false);
        setEditingGCEmployeeId("");
        setNewGCProcess({
          employeeId: "",
          currentStage: "PERM - Labor Certification",
          permFiledDate: "",
          permApprovedDate: "",
          i140FiledDate: "",
          i140ApprovedDate: "",
          i485FiledDate: "",
          i485ApprovedDate: "",
          priorityDate: "",
          notes: ""
        });
        fetchRecords();
      } else {
        const error = await response.text();
        toast.error(`Failed to update GC process: ${error}`);
      }
    } catch (error) {
      console.error("Error updating GC process:", error);
      toast.error("Failed to update GC process");
    }
  };

  const getStatusBadge = (status: ImmigrationStatus) => {
    const colors: Record<string, string> = {
      "H-1B": "bg-blue-100 text-blue-800",
      "OPT": "bg-purple-100 text-purple-800",
      "STEM OPT": "bg-indigo-100 text-indigo-800",
      "Green Card": "bg-green-100 text-green-800",
      "Citizen": "bg-gray-100 text-gray-800",
      "L-1": "bg-orange-100 text-orange-800",
      "TN": "bg-pink-100 text-pink-800",
      "O-1": "bg-teal-100 text-teal-800",
      "E-3": "bg-cyan-100 text-cyan-800",
      "H-4": "bg-blue-50 text-blue-700",
      "L-2": "bg-orange-50 text-orange-700",
      "F-1": "bg-purple-50 text-purple-700"
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  const getFilingStatusBadge = (status: FilingStatus) => {
    const icons: Record<FilingStatus, JSX.Element> = {
      "Not Started": <Clock className="h-3 w-3" />,
      "In Preparation": <Clock className="h-3 w-3" />,
      "Filed": <FileCheck className="h-3 w-3" />,
      "RFE Received": <AlertTriangle className="h-3 w-3" />,
      "Approved": <CheckCircle2 className="h-3 w-3" />,
      "Denied": <XCircle className="h-3 w-3" />,
      "Withdrawn": <XCircle className="h-3 w-3" />
    };

    const colors: Record<FilingStatus, string> = {
      "Not Started": "bg-gray-100 text-gray-800",
      "In Preparation": "bg-yellow-100 text-yellow-800",
      "Filed": "bg-blue-100 text-blue-800",
      "RFE Received": "bg-orange-100 text-orange-800",
      "Approved": "bg-green-100 text-green-800",
      "Denied": "bg-red-100 text-red-800",
      "Withdrawn": "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={cn("flex items-center gap-1", colors[status])}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryAlert = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const days = getDaysUntilExpiry(expiryDate);
    
    if (days < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-orange-100 text-orange-800">Expires in {days} days</Badge>;
    } else if (days <= 90) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expires in {days} days</Badge>;
    }
    return null;
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || record.currentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const expiringRecords = records.filter(record => {
    // Check EAD expiry
    const workAuthDays = record.workAuthorizationExpiry ? getDaysUntilExpiry(record.workAuthorizationExpiry) : null;
    const eadDays = record.eadExpiryDate ? getDaysUntilExpiry(record.eadExpiryDate) : null;
    
    const workAuthExpiring = workAuthDays !== null && workAuthDays >= 0 && workAuthDays <= 90;
    const eadExpiring = eadDays !== null && eadDays >= 0 && eadDays <= 90;
    
    return workAuthExpiring || eadExpiring;
  });

  const expiredRecords = records.filter(record => {
    // Check EAD expiry
    const workAuthDays = record.workAuthorizationExpiry ? getDaysUntilExpiry(record.workAuthorizationExpiry) : null;
    const eadDays = record.eadExpiryDate ? getDaysUntilExpiry(record.eadExpiryDate) : null;
    
    const workAuthExpired = workAuthDays !== null && workAuthDays < 0;
    const eadExpired = eadDays !== null && eadDays < 0;
    
    return workAuthExpired || eadExpired;
  });

  const activeGCProcesses = records.filter(record => record.hasActiveGCProcess).length;

  const totalCosts = records.reduce((sum, record) => {
    return sum + record.filings.reduce((filingSum, filing) => {
      return filingSum + (filing.costAmount || 0);
    }, 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading immigration records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Immigration Management</h1>
        <p className="text-muted-foreground">
          All onboarded employees appear here automatically. Track immigration status, filings, and compliance.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">All Employees</TabsTrigger>
          <TabsTrigger value="filings">Visa Filings & Actions</TabsTrigger>
          <TabsTrigger value="green-card">Green Card Tracking</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="costs">Cost Management</TabsTrigger>
          <TabsTrigger value="attorneys">Attorneys & Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{records.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Expiring Soon (90 days)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{expiringRecords.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Expired</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{expiredRecords.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Active GC Processes</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{activeGCProcesses}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          {records.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Immigration Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Immigration Status Distribution</CardTitle>
                  <CardDescription>Employees by visa type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          records.reduce((acc, record) => {
                            const status = record.currentStatus || 'Unknown';
                            acc[status] = (acc[status] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={75}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(
                          records.reduce((acc, record) => {
                            const status = record.currentStatus || 'Unknown';
                            acc[status] = (acc[status] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map((entry, index) => {
                          const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Case Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Immigration Case Status</CardTitle>
                  <CardDescription>Active cases by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart 
                      data={(() => {
                        const statusCounts: Record<string, number> = {};
                        records.forEach(record => {
                          record.cases?.forEach(c => {
                            statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
                          });
                        });
                        return Object.entries(statusCounts).map(([status, count]) => ({ 
                          status: status.length > 12 ? status.substring(0, 10) + '...' : status, 
                          fullStatus: status,
                          count 
                        }));
                      })()}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="status" 
                        fontSize={11}
                        stroke="#6b7280"
                        interval={0}
                      />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-medium">{payload[0].payload.fullStatus}</p>
                                <p className="text-sm text-gray-600">Count: {payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alerts Section */}
          {(expiringRecords.length > 0 || expiredRecords.length > 0) && (
            <div className="space-y-4">
              <h3>Alerts & Notifications</h3>
              
              {expiredRecords.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Critical: {expiredRecords.length} Expired Documents</AlertTitle>
                  <AlertDescription>
                    Immediate action required for employees with expired EAD documents.
                  </AlertDescription>
                </Alert>
              )}

              {expiringRecords.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning: {expiringRecords.length} Expiring Documents</AlertTitle>
                  <AlertDescription>
                    EAD documents expiring within 90 days. Start renewal process immediately.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Expiring EAD Documents Table */}
          {expiringRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expiring EAD Documents</CardTitle>
                <CardDescription>
                  Employees with EAD expiring within 90 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="gradient-teal-blue">
                      <TableHead className="text-white">Employee</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Document Type</TableHead>
                      <TableHead className="text-white">Expiry Date</TableHead>
                      <TableHead className="text-white">Days Until Expiry</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringRecords.map((record) => {
                      const workAuthDays = record.workAuthorizationExpiry ? getDaysUntilExpiry(record.workAuthorizationExpiry) : null;
                      const eadDays = record.eadExpiryDate ? getDaysUntilExpiry(record.eadExpiryDate) : null;
                      
                      const workAuthExpiring = workAuthDays !== null && workAuthDays >= 0 && workAuthDays <= 90;
                      const eadExpiring = eadDays !== null && eadDays >= 0 && eadDays <= 90;
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{record.employeeName}</TableCell>
                          <TableCell>{getStatusBadge(record.currentStatus)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {workAuthExpiring && <div className="text-sm">EAD</div>}
                              {eadExpiring && <div className="text-sm">EAD Card</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {workAuthExpiring && record.workAuthorizationExpiry && (
                                <div className="text-sm">
                                  {format(new Date(record.workAuthorizationExpiry), "MMM dd, yyyy")}
                                </div>
                              )}
                              {eadExpiring && record.eadExpiryDate && (
                                <div className="text-sm">
                                  {format(new Date(record.eadExpiryDate), "MMM dd, yyyy")}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {workAuthExpiring && record.workAuthorizationExpiry && (
                                <div>{getExpiryAlert(record.workAuthorizationExpiry)}</div>
                              )}
                              {eadExpiring && record.eadExpiryDate && (
                                <div>{getExpiryAlert(record.eadExpiryDate)}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedRecord(record);
                                setActiveTab("employees");
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Immigration Cost Summary</CardTitle>
              <CardDescription>Total immigration-related costs across all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-3xl">${totalCosts.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Immigration Costs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Auto-Synced Employee Data</AlertTitle>
            <AlertDescription className="text-blue-700">
              All onboarded employees automatically appear here. Click "View Details" to add immigration information, filings, and track green card processes.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
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

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="gradient-teal-blue">
                    <TableHead className="text-white">Employee</TableHead>
                    <TableHead className="text-white">Current Status</TableHead>
                    <TableHead className="text-white">EAD Expiry</TableHead>
                    <TableHead className="text-white">I-94 Expiry</TableHead>
                    <TableHead className="text-white">GC Process</TableHead>
                    <TableHead className="text-white">Filings</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm || filterStatus !== 'all' 
                          ? 'No employees match the current filters.' 
                          : 'No employees found. Employees will automatically appear here once they are onboarded.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => {
                      const hasDependents = record.dependents && record.dependents.length > 0;
                      const isExpanded = expandedEmployees.has(record.id);
                      
                      return (
                        <React.Fragment key={record.id}>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {hasDependents && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleEmployeeExpansion(record.id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                <span className={hasDependents ? "" : "ml-8"}>{record.employeeName}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(record.currentStatus)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {record.eadExpiryDate ? (
                                  <>
                                    <div>{format(new Date(record.eadExpiryDate), "MMM dd, yyyy")}</div>
                                    {getExpiryAlert(record.eadExpiryDate)}
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.i94Expiry ? format(new Date(record.i94Expiry), "MMM dd, yyyy") : "N/A"}
                            </TableCell>
                            <TableCell>
                              {record.hasActiveGCProcess ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="outline">None</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{record.filings.length} filings</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedRecord(record)}
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => confirmDelete('record', record.id, record.employeeName)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Dependent Rows */}
                          {isExpanded && hasDependents && record.dependents.map((dependent: any) => (
                            <TableRow key={`dep-${dependent.id}`} className="bg-muted/30">
                              <TableCell className="pl-16">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{dependent.name}</span>
                                  <Badge variant="secondary" className="text-xs">{dependent.relationship}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {dependent.visaType ? (
                                  <Badge variant="outline">{dependent.visaType}</Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {dependent.visaExpiry ? format(new Date(dependent.visaExpiry), "MMM dd, yyyy") : "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {dependent.i94Expiry ? format(new Date(dependent.i94Expiry), "MMM dd, yyyy") : "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">-</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">Dependent</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedRecord(record)}
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => confirmDelete('dependent', dependent.id, dependent.name)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Employee Detail Dialog */}
          {selectedRecord && (
            <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{selectedRecord.employeeName} - Immigration Profile</DialogTitle>
                  <DialogDescription id="employee-detail-dialog-description">
                    Complete immigration status and filing history
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-6 pr-4">
                    {/* Status Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Immigration Status</Label>
                            <div className="mt-1">{getStatusBadge(selectedRecord.currentStatus)}</div>
                          </div>
                          <div>
                            <Label>EAD Expiry</Label>
                            <div className="mt-1">
                              {selectedRecord.workAuthorizationExpiry ? (
                                <div className="space-y-1">
                                  <div>{format(new Date(selectedRecord.workAuthorizationExpiry), "MMM dd, yyyy")}</div>
                                  {getExpiryAlert(selectedRecord.workAuthorizationExpiry)}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </div>
                          </div>
                          <div>
                            <Label>EAD Expiry Date</Label>
                            <div className="mt-1">
                              {selectedRecord.eadExpiryDate ? (
                                <div className="space-y-1">
                                  <div>{format(new Date(selectedRecord.eadExpiryDate), "MMM dd, yyyy")}</div>
                                  {getExpiryAlert(selectedRecord.eadExpiryDate)}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </div>
                          </div>
                          <div>
                            <Label>I-94 Expiry</Label>
                            <div className="mt-1">
                              {selectedRecord.i94Expiry ? 
                                format(new Date(selectedRecord.i94Expiry), "MMM dd, yyyy") : 
                                "N/A"
                              }
                            </div>
                          </div>
                          <div>
                            <Label>EAD Number</Label>
                            <div className="mt-1 text-sm">
                              {selectedRecord.eadNumber || "N/A"}
                            </div>
                          </div>
                          <div>
                            <Label>EAD Category</Label>
                            <div className="mt-1 text-sm">
                              {selectedRecord.eadCategory || "N/A"}
                            </div>
                          </div>
                          <div>
                            <Label>Green Card Process</Label>
                            <div className="mt-1">
                              {selectedRecord.hasActiveGCProcess ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="outline">Not Started</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedRecord.notes && (
                          <div>
                            <Label>Notes</Label>
                            <p className="mt-1 text-sm text-muted-foreground">{selectedRecord.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Filings */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Filing History</CardTitle>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewFiling({ ...newFiling, employeeId: selectedRecord.id });
                              setShowAddFilingDialog(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Filing
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedRecord.filings.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No filings recorded yet
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {selectedRecord.filings.map((filing) => (
                              <div key={filing.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span>{filing.filingType}</span>
                                      {getStatusBadge(filing.immigrationStatus)}
                                      {filing.dependentName && (
                                        <Badge variant="outline" className="gap-1">
                                          <Users className="h-3 w-3" />
                                          {filing.dependentName}
                                        </Badge>
                                      )}
                                    </div>
                                    {filing.receiptNumber && (
                                      <p className="text-sm text-muted-foreground">
                                        Receipt: {filing.receiptNumber}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getFilingStatusBadge(filing.status)}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => confirmDelete('filing', filing.id, `${filing.filingType} filing`)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  {filing.filedDate && (
                                    <div>
                                      <Label>Filed Date</Label>
                                      <div>{format(new Date(filing.filedDate), "MMM dd, yyyy")}</div>
                                    </div>
                                  )}
                                  {filing.approvalDate && (
                                    <div>
                                      <Label>Approved Date</Label>
                                      <div>{format(new Date(filing.approvalDate), "MMM dd, yyyy")}</div>
                                    </div>
                                  )}
                                  {filing.expiryDate && (
                                    <div>
                                      <Label>Expiry Date</Label>
                                      <div>{format(new Date(filing.expiryDate), "MMM dd, yyyy")}</div>
                                    </div>
                                  )}
                                </div>
                                {filing.costAmount && (
                                  <div className="text-sm">
                                    <Label>Cost</Label>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-3 w-3" />
                                      {filing.costAmount.toLocaleString()}
                                      {filing.costAllocatedTo && (
                                        <span className="text-muted-foreground">
                                          • Allocated to: {filing.costAllocatedTo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {filing.notes && (
                                  <p className="text-sm text-muted-foreground">{filing.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Green Card Process */}
                    {selectedRecord.greenCardProcess && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Green Card Process Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Label>Current Stage:</Label>
                              <Badge className="bg-blue-100 text-blue-800">
                                {selectedRecord.greenCardProcess.currentStage}
                              </Badge>
                            </div>
                            {selectedRecord.greenCardProcess.priorityDate && (
                              <div>
                                <Label>Priority Date</Label>
                                <div>{format(new Date(selectedRecord.greenCardProcess.priorityDate), "MMM dd, yyyy")}</div>
                              </div>
                            )}
                            <Separator />
                            <div className="space-y-3">
                              {/* PERM */}
                              <div className="flex items-center gap-4">
                                <div className="w-32 text-sm">PERM</div>
                                <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Filed</Label>
                                    <div>
                                      {selectedRecord.greenCardProcess.permFiledDate ? 
                                        format(new Date(selectedRecord.greenCardProcess.permFiledDate), "MMM dd, yyyy") : 
                                        "Not filed"
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Approved</Label>
                                    <div>
                                      {selectedRecord.greenCardProcess.permApprovedDate ? 
                                        format(new Date(selectedRecord.greenCardProcess.permApprovedDate), "MMM dd, yyyy") : 
                                        "Pending"
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* I-140 */}
                              <div className="flex items-center gap-4">
                                <div className="w-32 text-sm">I-140</div>
                                <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Filed</Label>
                                    <div>
                                      {selectedRecord.greenCardProcess.i140FiledDate ? 
                                        format(new Date(selectedRecord.greenCardProcess.i140FiledDate), "MMM dd, yyyy") : 
                                        "Not filed"
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Approved</Label>
                                    <div>
                                      {selectedRecord.greenCardProcess.i140ApprovedDate ? 
                                        format(new Date(selectedRecord.greenCardProcess.i140ApprovedDate), "MMM dd, yyyy") : 
                                        "Pending"
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* I-485 */}
                              <div className="flex items-center gap-4">
                                <div className="w-32 text-sm">I-485</div>
                                <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label>Filed</Label>
                                    <div>
                                      {selectedRecord.greenCardProcess.i485FiledDate ? 
                                        format(new Date(selectedRecord.greenCardProcess.i485FiledDate), "MMM dd, yyyy") : 
                                        "Not filed"
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Approved</Label>
                                    <div>
                                      {selectedRecord.greenCardProcess.i485ApprovedDate ? 
                                        format(new Date(selectedRecord.greenCardProcess.i485ApprovedDate), "MMM dd, yyyy") : 
                                        "Pending"
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* GC Approval */}
                              {selectedRecord.greenCardProcess.gcApprovedDate && (
                                <div className="flex items-center gap-4">
                                  <div className="w-32 text-sm">Green Card</div>
                                  <div className="flex-1">
                                    <Label>Approved</Label>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      {format(new Date(selectedRecord.greenCardProcess.gcApprovedDate), "MMM dd, yyyy")}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {!selectedRecord.hasActiveGCProcess && (
                      <Button
                        onClick={() => {
                          setNewGCProcess({ ...newGCProcess, employeeId: selectedRecord.id });
                          setShowAddGCProcessDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start Green Card Process
                      </Button>
                    )}

                    {/* Dependents */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Dependents</CardTitle>
                          <Button
                            size="sm"
                            onClick={() => setShowAddDependentDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Dependent
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!selectedRecord.dependents || selectedRecord.dependents.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No dependents added yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {selectedRecord.dependents.map((dependent: any) => (
                              <div key={dependent.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{dependent.name}</span>
                                      <Badge variant="outline">{dependent.relationship}</Badge>
                                    </div>
                                    {dependent.currentStatus && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Status: {dependent.currentStatus}
                                      </p>
                                    )}
                                    {dependent.dateOfBirth && (
                                      <p className="text-sm text-muted-foreground">
                                        DOB: {(() => {
                                          const [year, month, day] = dependent.dateOfBirth.split('T')[0].split('-');
                                          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                          return format(date, "MMM dd, yyyy");
                                        })()}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => confirmDelete('dependent', dependent.id, dependent.name)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Documents</CardTitle>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewDocument({ ...newDocument, employeeId: selectedRecord.id });
                              setShowAddDocumentDialog(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Document
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedRecord.documents.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No documents uploaded yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {selectedRecord.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm">{doc.documentName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {doc.documentType} • Uploaded {format(new Date(doc.uploadDate), "MMM dd, yyyy")}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {doc.expiryDate && getExpiryAlert(doc.expiryDate)}
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => confirmDelete('document', doc.id, doc.documentName)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="filings" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2>All Visa Filings & Actions</h2>
            <Button onClick={() => setShowAddFilingDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Filing
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="md:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search employee, receipt #..."
                      value={filingsSearchTerm}
                      onChange={(e) => setFilingsSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Select value={filingsFilterPerson} onValueChange={setFilingsFilterPerson}>
                    <SelectTrigger>
                      <SelectValue placeholder="Person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All People</SelectItem>
                      <SelectItem value="employee">Employees Only</SelectItem>
                      <SelectItem value="dependent">Dependents Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={filingsFilterFilingType} onValueChange={setFilingsFilterFilingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filing Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Filing Types</SelectItem>
                      <SelectItem value="Initial">Initial</SelectItem>
                      <SelectItem value="Extension">Extension</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Amendment">Amendment</SelectItem>
                      <SelectItem value="Change of Status">Change of Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={filingsFilterStatus} onValueChange={setFilingsFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Visa Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visa Types</SelectItem>
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

                <div>
                  <Select value={filingsFilterFilingStatus} onValueChange={setFilingsFilterFilingStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filing Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="RFE Received">RFE Received</SelectItem>
                      <SelectItem value="RFE Responded">RFE Responded</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Denied">Denied</SelectItem>
                      <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filingsSearchTerm || filingsFilterPerson !== "all" || filingsFilterFilingType !== "all" || filingsFilterStatus !== "all" || filingsFilterFilingStatus !== "all") && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filingsSearchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {filingsSearchTerm}
                      <button onClick={() => setFilingsSearchTerm("")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">×</button>
                    </Badge>
                  )}
                  {filingsFilterPerson !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Person: {filingsFilterPerson === "employee" ? "Employees Only" : "Dependents Only"}
                      <button onClick={() => setFilingsFilterPerson("all")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">×</button>
                    </Badge>
                  )}
                  {filingsFilterFilingType !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Type: {filingsFilterFilingType}
                      <button onClick={() => setFilingsFilterFilingType("all")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">×</button>
                    </Badge>
                  )}
                  {filingsFilterStatus !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Visa: {filingsFilterStatus}
                      <button onClick={() => setFilingsFilterStatus("all")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">×</button>
                    </Badge>
                  )}
                  {filingsFilterFilingStatus !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {filingsFilterFilingStatus}
                      <button onClick={() => setFilingsFilterFilingStatus("all")} className="ml-1 hover:bg-muted-foreground/20 rounded-full">×</button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilingsSearchTerm("");
                      setFilingsFilterPerson("all");
                      setFilingsFilterFilingType("all");
                      setFilingsFilterStatus("all");
                      setFilingsFilterFilingStatus("all");
                    }}
                    className="ml-auto h-7"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Filing For</TableHead>
                    <TableHead>Filing Type</TableHead>
                    <TableHead>Status Type</TableHead>
                    <TableHead>Receipt Number</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Get all filings with employee names
                    const allFilings = records.flatMap(record => 
                      record.filings.map(filing => ({
                        ...filing,
                        employeeName: record.employeeName
                      }))
                    );

                    // Apply filters
                    const filteredFilings = allFilings.filter(filing => {
                      // Search filter
                      const searchLower = filingsSearchTerm.toLowerCase();
                      const matchesSearch = !filingsSearchTerm || 
                        filing.employeeName.toLowerCase().includes(searchLower) ||
                        (filing.receiptNumber && filing.receiptNumber.toLowerCase().includes(searchLower)) ||
                        filing.filingType.toLowerCase().includes(searchLower) ||
                        filing.immigrationStatus.toLowerCase().includes(searchLower) ||
                        (filing.dependentName && filing.dependentName.toLowerCase().includes(searchLower));

                      // Person filter (employee vs dependent)
                      const matchesPerson = filingsFilterPerson === "all" ||
                        (filingsFilterPerson === "employee" && !filing.dependentId) ||
                        (filingsFilterPerson === "dependent" && filing.dependentId);

                      // Filing type filter
                      const matchesFilingType = filingsFilterFilingType === "all" || 
                        filing.filingType === filingsFilterFilingType;

                      // Visa status filter
                      const matchesStatus = filingsFilterStatus === "all" || 
                        filing.immigrationStatus === filingsFilterStatus;

                      // Filing status filter
                      const matchesFilingStatus = filingsFilterFilingStatus === "all" || 
                        filing.status === filingsFilterFilingStatus;

                      return matchesSearch && matchesPerson && matchesFilingType && matchesStatus && matchesFilingStatus;
                    });

                    if (filteredFilings.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            {allFilings.length === 0 ? "No filings recorded yet" : "No filings match your filters"}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredFilings.map(filing => (
                      <TableRow key={filing.id}>
                        <TableCell>{filing.employeeName}</TableCell>
                        <TableCell>
                          {filing.dependentName ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span>{filing.dependentName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Primary Employee</span>
                          )}
                        </TableCell>
                        <TableCell>{filing.filingType}</TableCell>
                        <TableCell>{getStatusBadge(filing.immigrationStatus)}</TableCell>
                        <TableCell>{filing.receiptNumber || "N/A"}</TableCell>
                        <TableCell>
                          {filing.filedDate ? format(new Date(filing.filedDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>{getFilingStatusBadge(filing.status)}</TableCell>
                        <TableCell>
                          {filing.expiryDate ? (
                            <div className="space-y-1">
                              <div>{format(new Date(filing.expiryDate), "MMM dd, yyyy")}</div>
                              {getExpiryAlert(filing.expiryDate)}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Format dates for input fields (YYYY-MM-DD)
                              const formatDateForInput = (dateStr: string) => {
                                if (!dateStr) return "";
                                try {
                                  const date = new Date(dateStr);
                                  return format(date, "yyyy-MM-dd");
                                } catch {
                                  return "";
                                }
                              };

                              setEditingFiling({
                                ...filing,
                                filedDate: formatDateForInput(filing.filedDate),
                                approvalDate: formatDateForInput(filing.approvalDate),
                                expiryDate: formatDateForInput(filing.expiryDate),
                                costAmount: filing.costAmount?.toString() || "",
                              });
                              setShowEditFilingDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="green-card" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2>Green Card Process Tracking</h2>
            <Button onClick={() => setShowAddGCProcessDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start GC Process
            </Button>
          </div>

          <div className="grid gap-4">
            {records.filter(r => r.hasActiveGCProcess).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No active Green Card processes
                </CardContent>
              </Card>
            ) : (
              records.filter(r => r.hasActiveGCProcess).map(record => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{record.employeeName}</CardTitle>
                        <CardDescription>
                          Current Stage: {record.greenCardProcess?.currentStage}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditGCProcess(record.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => confirmDelete('greencard', record.id, `${record.employeeName}'s Green Card process`)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {record.greenCardProcess && (
                      <div className="space-y-4">
                        {record.greenCardProcess.priorityDate && (
                          <div>
                            <Label>Priority Date</Label>
                            <div>{format(new Date(record.greenCardProcess.priorityDate), "MMM dd, yyyy")}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>PERM</Label>
                            <div className="text-sm space-y-1">
                              {record.greenCardProcess.permFiledDate && (
                                <div>Filed: {format(new Date(record.greenCardProcess.permFiledDate), "MMM dd, yyyy")}</div>
                              )}
                              {record.greenCardProcess.permApprovedDate && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approved: {format(new Date(record.greenCardProcess.permApprovedDate), "MMM dd, yyyy")}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>I-140</Label>
                            <div className="text-sm space-y-1">
                              {record.greenCardProcess.i140FiledDate && (
                                <div>Filed: {format(new Date(record.greenCardProcess.i140FiledDate), "MMM dd, yyyy")}</div>
                              )}
                              {record.greenCardProcess.i140ApprovedDate && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approved: {format(new Date(record.greenCardProcess.i140ApprovedDate), "MMM dd, yyyy")}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>I-485</Label>
                            <div className="text-sm space-y-1">
                              {record.greenCardProcess.i485FiledDate && (
                                <div>Filed: {format(new Date(record.greenCardProcess.i485FiledDate), "MMM dd, yyyy")}</div>
                              )}
                              {record.greenCardProcess.i485ApprovedDate && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approved: {format(new Date(record.greenCardProcess.i485ApprovedDate), "MMM dd, yyyy")}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Green Card</Label>
                            <div className="text-sm">
                              {record.greenCardProcess.gcApprovedDate ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approved: {format(new Date(record.greenCardProcess.gcApprovedDate), "MMM dd, yyyy")}
                                </div>
                              ) : (
                                <div className="text-muted-foreground">Pending</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {/* Document Requests Section */}
          <ImmigrationDocumentRequests onRequestCreated={fetchRecords} />
          
          <div className="flex items-center justify-between">
            <h2>All Immigration Documents</h2>
            <Button onClick={() => setShowAddDocumentDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.flatMap(record => 
                    record.documents.map(doc => ({
                      ...doc,
                      employeeName: record.employeeName
                    }))
                  ).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No documents uploaded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.flatMap(record => 
                      record.documents.map(doc => (
                        <TableRow key={doc.id}>
                          <TableCell>{record.employeeName}</TableCell>
                          <TableCell>{doc.documentType}</TableCell>
                          <TableCell>{doc.documentName}</TableCell>
                          <TableCell>{format(new Date(doc.uploadDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            {doc.expiryDate ? (
                              <div className="space-y-1">
                                <div>{format(new Date(doc.expiryDate), "MMM dd, yyyy")}</div>
                                {getExpiryAlert(doc.expiryDate)}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => confirmDelete('document', doc.id, doc.documentName)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Immigration Cost Summary</CardTitle>
              <CardDescription>Track and manage immigration-related expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-12 w-12 text-green-500" />
                  <div>
                    <div className="text-4xl">${totalCosts.toLocaleString()}</div>
                    <p className="text-muted-foreground">Total Immigration Costs</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="mb-4">Cost Breakdown by Employee</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Number of Filings</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.filter(r => r.filings.some(f => f.costAmount)).map(record => {
                        const employeeTotalCost = record.filings.reduce((sum, filing) => 
                          sum + (filing.costAmount || 0), 0
                        );
                        return (
                          <TableRow key={record.id}>
                            <TableCell>{record.employeeName}</TableCell>
                            <TableCell>{record.filings.filter(f => f.costAmount).length}</TableCell>
                            <TableCell>${employeeTotalCost.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRecord(record)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {records.filter(r => r.filings.some(f => f.costAmount)).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No cost data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attorneys" className="space-y-4">
          <ImmigrationAttorneyIntegration />
        </TabsContent>
      </Tabs>

      {/* Add Filing Dialog */}
      <Dialog open={showAddFilingDialog} onOpenChange={setShowAddFilingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Immigration Filing</DialogTitle>
            <DialogDescription id="add-filing-dialog-description">
              Record a new immigration filing, amendment, or renewal
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div>
                <Label htmlFor="filingEmployee">Employee *</Label>
                <Select
                  value={newFiling.employeeId}
                  onValueChange={(value) => setNewFiling({ ...newFiling, employeeId: value, dependentId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {records.map(record => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.employeeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dependent Selection - shows only if employee is selected and has dependents */}
              {newFiling.employeeId && (() => {
                const selectedEmployee = records.find(r => r.id === newFiling.employeeId);
                const hasDependents = selectedEmployee?.dependents && selectedEmployee.dependents.length > 0;
                
                if (!hasDependents) return null;
                
                return (
                  <div>
                    <Label htmlFor="filingPerson">Filing For</Label>
                    <Select
                      value={newFiling.dependentId || "employee"}
                      onValueChange={(value) => setNewFiling({ 
                        ...newFiling, 
                        dependentId: value === "employee" ? "" : value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">
                          {selectedEmployee.employeeName} (Primary Employee)
                        </SelectItem>
                        {selectedEmployee.dependents.map((dep: any) => (
                          <SelectItem key={dep.id} value={dep.id}>
                            {dep.name} ({dep.relationship})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filingType">Filing Type *</Label>
                  <Select
                    value={newFiling.filingType}
                    onValueChange={(value: FilingType) => 
                      setNewFiling({ ...newFiling, filingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Initial">Initial</SelectItem>
                      <SelectItem value="Extension">Extension</SelectItem>
                      <SelectItem value="Amendment">Amendment</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="immigrationStatus">Immigration Status *</Label>
                  <Select
                    value={newFiling.immigrationStatus}
                    onValueChange={(value: ImmigrationStatus) => 
                      setNewFiling({ ...newFiling, immigrationStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              <div>
                <Label htmlFor="filingStatus">Filing Status</Label>
                <Select
                  value={newFiling.status}
                  onValueChange={(value: FilingStatus) => 
                    setNewFiling({ ...newFiling, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Preparation">In Preparation</SelectItem>
                    <SelectItem value="Filed">Filed</SelectItem>
                    <SelectItem value="RFE Received">RFE Received</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Denied">Denied</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  value={newFiling.receiptNumber}
                  onChange={(e) => setNewFiling({ ...newFiling, receiptNumber: e.target.value })}
                  placeholder="e.g., WAC2290012345"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="filedDate">Filed Date</Label>
                  <Input
                    id="filedDate"
                    type="date"
                    value={newFiling.filedDate}
                    onChange={(e) => setNewFiling({ ...newFiling, filedDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="approvalDate">Approval Date</Label>
                  <Input
                    id="approvalDate"
                    type="date"
                    value={newFiling.approvalDate}
                    onChange={(e) => setNewFiling({ ...newFiling, approvalDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newFiling.expiryDate}
                    onChange={(e) => setNewFiling({ ...newFiling, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costAmount">Cost Amount ($)</Label>
                  <Input
                    id="costAmount"
                    type="number"
                    value={newFiling.costAmount}
                    onChange={(e) => setNewFiling({ ...newFiling, costAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="costAllocatedTo">Allocated To</Label>
                  <Input
                    id="costAllocatedTo"
                    value={newFiling.costAllocatedTo}
                    onChange={(e) => setNewFiling({ ...newFiling, costAllocatedTo: e.target.value })}
                    placeholder="e.g., Company, Employee"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="filingNotes">Notes</Label>
                <Textarea
                  id="filingNotes"
                  value={newFiling.notes}
                  onChange={(e) => setNewFiling({ ...newFiling, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddFilingDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addFiling}>Add Filing</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Filing Dialog */}
      <Dialog open={showEditFilingDialog} onOpenChange={setShowEditFilingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Immigration Filing</DialogTitle>
            <DialogDescription id="edit-filing-dialog-description">
              Update immigration filing information
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Display who this filing is for */}
              {editingFiling?.dependentName && (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertTitle>Filing for Dependent</AlertTitle>
                  <AlertDescription>
                    This filing is for <strong>{editingFiling.dependentName}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFilingType">Filing Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={editingFiling?.filingType || ""}
                    onValueChange={(value) => setEditingFiling({ ...editingFiling, filingType: value })}
                  >
                    <SelectTrigger id="editFilingType">
                      <SelectValue placeholder="Select filing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Initial">Initial</SelectItem>
                      <SelectItem value="Extension">Extension</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Amendment">Amendment</SelectItem>
                      <SelectItem value="Change of Status">Change of Status</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editImmigrationStatus">Visa/Status Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={editingFiling?.immigrationStatus || ""}
                    onValueChange={(value) => setEditingFiling({ ...editingFiling, immigrationStatus: value })}
                  >
                    <SelectTrigger id="editImmigrationStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="H-1B">H-1B</SelectItem>
                      <SelectItem value="L-1">L-1</SelectItem>
                      <SelectItem value="TN">TN</SelectItem>
                      <SelectItem value="E-3">E-3</SelectItem>
                      <SelectItem value="O-1">O-1</SelectItem>
                      <SelectItem value="F-1">F-1</SelectItem>
                      <SelectItem value="OPT">OPT</SelectItem>
                      <SelectItem value="H-4">H-4</SelectItem>
                      <SelectItem value="L-2">L-2</SelectItem>
                      <SelectItem value="Green Card / Permanent Resident">Green Card / Permanent Resident</SelectItem>
                      <SelectItem value="US Citizen">US Citizen</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editStatus">Filing Status</Label>
                <Select
                  value={editingFiling?.status || ""}
                  onValueChange={(value) => setEditingFiling({ ...editingFiling, status: value })}
                >
                  <SelectTrigger id="editStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Filed">Filed</SelectItem>
                    <SelectItem value="RFE Received">RFE Received</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Denied">Denied</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editReceiptNumber">Receipt Number</Label>
                <Input
                  id="editReceiptNumber"
                  value={editingFiling?.receiptNumber || ""}
                  onChange={(e) => setEditingFiling({ ...editingFiling, receiptNumber: e.target.value })}
                  placeholder="e.g., WAC1234567890"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editFiledDate">Filed Date</Label>
                  <Input
                    id="editFiledDate"
                    type="date"
                    value={editingFiling?.filedDate || ""}
                    onChange={(e) => setEditingFiling({ ...editingFiling, filedDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editApprovalDate">Approval Date</Label>
                  <Input
                    id="editApprovalDate"
                    type="date"
                    value={editingFiling?.approvalDate || ""}
                    onChange={(e) => setEditingFiling({ ...editingFiling, approvalDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editExpiryDate">Expiry Date</Label>
                  <Input
                    id="editExpiryDate"
                    type="date"
                    value={editingFiling?.expiryDate || ""}
                    onChange={(e) => setEditingFiling({ ...editingFiling, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCostAmount">Cost Amount ($)</Label>
                  <Input
                    id="editCostAmount"
                    type="number"
                    value={editingFiling?.costAmount || ""}
                    onChange={(e) => setEditingFiling({ ...editingFiling, costAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="editCostAllocatedTo">Allocated To</Label>
                  <Input
                    id="editCostAllocatedTo"
                    value={editingFiling?.costAllocatedTo || ""}
                    onChange={(e) => setEditingFiling({ ...editingFiling, costAllocatedTo: e.target.value })}
                    placeholder="e.g., Company, Employee"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editFilingNotes">Notes</Label>
                <Textarea
                  id="editFilingNotes"
                  value={editingFiling?.notes || ""}
                  onChange={(e) => setEditingFiling({ ...editingFiling, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditFilingDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={updateFiling}>Update Filing</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Green Card Process Dialog */}
      <Dialog open={showAddGCProcessDialog} onOpenChange={setShowAddGCProcessDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start Green Card Process</DialogTitle>
            <DialogDescription id="add-gc-process-dialog-description">
              Track the complete Green Card lifecycle: PERM → I-140 → I-485 → GC
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div>
                <Label htmlFor="gcEmployee">Employee *</Label>
                <Select
                  value={newGCProcess.employeeId}
                  onValueChange={(value) => setNewGCProcess({ ...newGCProcess, employeeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {records.filter(r => !r.hasActiveGCProcess).map(record => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.employeeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currentStage">Current Stage</Label>
                <Select
                  value={newGCProcess.currentStage}
                  onValueChange={(value: GreenCardStage) => 
                    setNewGCProcess({ ...newGCProcess, currentStage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERM - Labor Certification">PERM - Labor Certification</SelectItem>
                    <SelectItem value="I-140 - Immigrant Petition">I-140 - Immigrant Petition</SelectItem>
                    <SelectItem value="I-485 - Adjustment of Status">I-485 - Adjustment of Status</SelectItem>
                    <SelectItem value="Green Card Approved">Green Card Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priorityDate">Priority Date</Label>
                <Input
                  id="priorityDate"
                  type="date"
                  value={newGCProcess.priorityDate}
                  onChange={(e) => setNewGCProcess({ ...newGCProcess, priorityDate: e.target.value })}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4>PERM - Labor Certification</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="permFiledDate">Filed Date</Label>
                    <Input
                      id="permFiledDate"
                      type="date"
                      value={newGCProcess.permFiledDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, permFiledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="permApprovedDate">Approved Date</Label>
                    <Input
                      id="permApprovedDate"
                      type="date"
                      value={newGCProcess.permApprovedDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, permApprovedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4>I-140 - Immigrant Petition</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="i140FiledDate">Filed Date</Label>
                    <Input
                      id="i140FiledDate"
                      type="date"
                      value={newGCProcess.i140FiledDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i140FiledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="i140ApprovedDate">Approved Date</Label>
                    <Input
                      id="i140ApprovedDate"
                      type="date"
                      value={newGCProcess.i140ApprovedDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i140ApprovedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4>I-485 - Adjustment of Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="i485FiledDate">Filed Date</Label>
                    <Input
                      id="i485FiledDate"
                      type="date"
                      value={newGCProcess.i485FiledDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i485FiledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="i485ApprovedDate">Approved Date</Label>
                    <Input
                      id="i485ApprovedDate"
                      type="date"
                      value={newGCProcess.i485ApprovedDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i485ApprovedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="gcNotes">Notes</Label>
                <Textarea
                  id="gcNotes"
                  value={newGCProcess.notes}
                  onChange={(e) => setNewGCProcess({ ...newGCProcess, notes: e.target.value })}
                  placeholder="Additional details about the GC process..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddGCProcessDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addGCProcess}>Create GC Process</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Green Card Process Dialog */}
      <Dialog open={showEditGCProcessDialog} onOpenChange={setShowEditGCProcessDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Green Card Process</DialogTitle>
            <DialogDescription id="edit-gc-process-dialog-description">
              Update the Green Card lifecycle: PERM → I-140 → I-485 → GC
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <form onSubmit={handleUpdateGCProcess} className="space-y-4 pr-4">
              <div>
                <Label htmlFor="editCurrentStage">Current Stage</Label>
                <Select
                  value={newGCProcess.currentStage}
                  onValueChange={(value: GreenCardStage) => 
                    setNewGCProcess({ ...newGCProcess, currentStage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERM - Labor Certification">PERM - Labor Certification</SelectItem>
                    <SelectItem value="I-140 - Immigrant Petition">I-140 - Immigrant Petition</SelectItem>
                    <SelectItem value="I-485 - Adjustment of Status">I-485 - Adjustment of Status</SelectItem>
                    <SelectItem value="Green Card Approved">Green Card Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editPriorityDate">Priority Date</Label>
                <Input
                  id="editPriorityDate"
                  type="date"
                  value={newGCProcess.priorityDate}
                  onChange={(e) => setNewGCProcess({ ...newGCProcess, priorityDate: e.target.value })}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4>PERM - Labor Certification</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editPermFiledDate">Filed Date</Label>
                    <Input
                      id="editPermFiledDate"
                      type="date"
                      value={newGCProcess.permFiledDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, permFiledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPermApprovedDate">Approved Date</Label>
                    <Input
                      id="editPermApprovedDate"
                      type="date"
                      value={newGCProcess.permApprovedDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, permApprovedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4>I-140 - Immigrant Petition</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editI140FiledDate">Filed Date</Label>
                    <Input
                      id="editI140FiledDate"
                      type="date"
                      value={newGCProcess.i140FiledDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i140FiledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editI140ApprovedDate">Approved Date</Label>
                    <Input
                      id="editI140ApprovedDate"
                      type="date"
                      value={newGCProcess.i140ApprovedDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i140ApprovedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4>I-485 - Adjustment of Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editI485FiledDate">Filed Date</Label>
                    <Input
                      id="editI485FiledDate"
                      type="date"
                      value={newGCProcess.i485FiledDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i485FiledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editI485ApprovedDate">Approved Date</Label>
                    <Input
                      id="editI485ApprovedDate"
                      type="date"
                      value={newGCProcess.i485ApprovedDate}
                      onChange={(e) => setNewGCProcess({ ...newGCProcess, i485ApprovedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="editGcNotes">Notes</Label>
                <Textarea
                  id="editGcNotes"
                  value={newGCProcess.notes}
                  onChange={(e) => setNewGCProcess({ ...newGCProcess, notes: e.target.value })}
                  placeholder="Additional details about the Green Card process..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditGCProcessDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Process</Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Immigration Document</DialogTitle>
            <DialogDescription id="add-document-dialog-description">
              Add a new document to an employee's immigration record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="docEmployee">Employee *</Label>
              <Select
                value={newDocument.employeeId}
                onValueChange={(value) => setNewDocument({ ...newDocument, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {records.map(record => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.employeeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="documentType">Document Type *</Label>
              <Input
                id="documentType"
                value={newDocument.documentType}
                onChange={(e) => setNewDocument({ ...newDocument, documentType: e.target.value })}
                placeholder="e.g., I-797, I-94, Passport"
              />
            </div>
            <div>
              <Label htmlFor="documentName">Document Name *</Label>
              <Input
                id="documentName"
                value={newDocument.documentName}
                onChange={(e) => setNewDocument({ ...newDocument, documentName: e.target.value })}
                placeholder="e.g., H-1B Approval Notice"
              />
            </div>
            <div>
              <Label htmlFor="docExpiryDate">Expiry Date (if applicable)</Label>
              <Input
                id="docExpiryDate"
                type="date"
                value={newDocument.expiryDate}
                onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="docNotes">Notes</Label>
              <Textarea
                id="docNotes"
                value={newDocument.notes}
                onChange={(e) => setNewDocument({ ...newDocument, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Document upload functionality requires file storage integration.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDocumentDialog(false)}>
                Cancel
              </Button>
              <Button disabled>Upload Document</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dependent Dialog */}
      <ImmigrationDependentForm
        open={showAddDependentDialog}
        onOpenChange={setShowAddDependentDialog}
        onSubmit={handleAddDependent}
        employees={records}
        preselectedEmployeeId={selectedRecord?.id}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteDialog.name}</strong>.
              {deleteDialog.type === 'record' && ' All associated cases, filings, documents, dependents, and costs will also be deleted.'}
              {' '}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
