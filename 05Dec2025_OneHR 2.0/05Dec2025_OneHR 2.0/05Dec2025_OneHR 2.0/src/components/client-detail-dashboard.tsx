import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "./ui/alert";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Hash,
  Briefcase,
  FileCheck,
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  Edit,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Building,
  UserCheck,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import type {
  Client,
  Employee,
  ClientDocument,
} from "../types";

// Local interfaces for Contracts & POs if not available in types
interface PurchaseOrder {
  id: string;
  engagementId: string;
  poNumber: string;
  amount: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Exhausted' | 'Expired';
  documentId?: string;
  fileName?: string;
}

interface ContractDocument {
  id: string;
  documentId: string;
  fileName: string;
  uploadedAt: string;
}

interface Engagement {
  id: string;
  clientId: string;
  title: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Closed' | 'Pending';
  type: 'Time & Materials' | 'Fixed Price' | 'Retainer';
  purchaseOrders?: PurchaseOrder[];
  additionalDocuments?: ContractDocument[];
  documentId?: string;
  fileName?: string;
}

interface Engagement {
  id: string;
  clientId: string;
  title: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Closed' | 'Pending';
  type: string;
  purchaseOrders: PurchaseOrder[];
  documentId?: string;
  fileName?: string;
}

const API_URL = (import.meta as any).env.VITE_CLIENT_API_URL || API_ENDPOINTS.CLIENT;

interface ClientDetailDashboardProps {
  clientId: string;
  onBack: () => void;
  onEdit?: (client: Client) => void;
}

export function ClientDetailDashboard({
  clientId,
  onBack,
  onEdit,
}: ClientDetailDashboardProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadingDocument, setUploadingDocument] =
    useState(false);

  // Contracts & POs State
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [expandedEngagementId, setExpandedEngagementId] = useState<string | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isContractDocModalOpen, setIsContractDocModalOpen] = useState(false);
  const [contractDocFile, setContractDocFile] = useState<File | null>(null);
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);
  
  // New Contract Form
  const [newContract, setNewContract] = useState<Partial<Engagement>>({
    title: '',
    startDate: '',
    endDate: '', // Initialize to empty string to prevent uncontrolled input warning
    status: 'Active',
    type: 'Time & Materials',
    purchaseOrders: []
  });
  const [contractFile, setContractFile] = useState<File | null>(null);

  // New PO Form
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({
    poNumber: '',
    amount: 0,
    startDate: '',
    endDate: '',
    status: 'Active'
  });
  const [poFile, setPoFile] = useState<File | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSection, setUploadSection] = useState<'from' | 'to'>('from');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");

  const FROM_CLIENT_TYPES = ["MSA", "SOW", "PO", "Compliance", "Client Document"];
  const TO_CLIENT_TYPES = ["Invoice", "Proposal", "Quote", "Report"];

  const handleOpenUploadModal = (section: 'from' | 'to') => {
    setUploadSection(section);
    setSelectedUploadFile(null);
    setSelectedDocumentType("");
    setIsUploadModalOpen(true);
  };

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [assignRole, setAssignRole] = useState("");
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAvailableEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
         headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (response.ok) {
         const data = await response.json();
         const allEmployees = data.employees || [];
         // Filter out already assigned employees
         const currentEmployeeIds = employees.map(e => e.id);
         const available = allEmployees.filter((e: Employee) => !currentEmployeeIds.includes(e.id));
         setAvailableEmployees(available);
      }
    } catch (error) {
      console.error("Error fetching available employees", error);
    }
  };

  const handleAssignEmployee = async () => {
     if (!selectedEmployeeId) return;

     const selectedEmployee = availableEmployees.find(e => e.id === selectedEmployeeId);
     if (!selectedEmployee) return;

     const assignmentData = {
        employeeId: selectedEmployeeId,
        clientId: clientId,
        clientName: client?.companyName,
        projectName: "General Assignment",
        role: assignRole || selectedEmployee.position || "Team Member",
        startDate: assignStartDate,
        status: "Active"
     };

     try {
        const response = await fetch(`${API_URL}/project-assignments`, {
           method: 'POST',
           headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getAccessToken()}`
           },
           body: JSON.stringify(assignmentData)
        });

        if (response.ok) {
           toast.success("Employee assigned successfully");
           setIsAssignModalOpen(false);
           fetchClientEmployees(); // Refresh list
           // Clear form
           setSelectedEmployeeId("");
           setAssignRole("");
           setAssignStartDate(new Date().toISOString().split('T')[0]);
        } else {
           throw new Error("Failed to assign employee");
        }
     } catch (error) {
        console.error("Assignment error:", error);
        toast.error("Failed to assign employee");
     }
  };

  const handleUnassignEmployee = async (employeeId: string) => {
    if (!confirm("Are you sure you want to unassign this employee from this client?")) return;

    // Find assignment
    const assignment = projectAssignments.find(a => a.employeeId === employeeId && a.clientId === clientId);
    
    if (assignment) {
        try {
            const response = await fetch(`${API_URL}/project-assignments/${assignment.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getAccessToken()}` }
            });

            if (response.ok) {
                toast.success("Employee unassigned successfully");
                fetchClientEmployees(); // Refresh list
            } else {
                throw new Error("Failed to unassign");
            }
        } catch (error) {
            console.error("Error unassigning:", error);
            toast.error("Failed to unassign employee");
        }
    } else {
        toast.error("Could not find assignment record. This might be a legacy assignment.");
    }
  };

  const updateClientEngagements = async (updatedEngagements: Engagement[]) => {
    try {
      const response = await fetch(`${API_URL}/clients/advanced/${clientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engagements: updatedEngagements
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update client engagements');
      }
    } catch (error) {
      console.error('Error updating engagements:', error);
      toast.error('Failed to save changes to server');
    }
  };

  const handleSaveContract = async () => {
    if (!newContract.title || !newContract.startDate) {
      toast.error("Please fill in required fields");
      return;
    }

    let documentId = undefined;
    let fileName = undefined;

    if (contractFile) {
      try {
        const formData = new FormData();
        formData.append("file", contractFile);
        formData.append("documentType", "Contract");
        formData.append("clientId", clientId);

        const response = await fetch(
          `${API_URL}/clients/${clientId}/documents/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to upload contract document");
        }

        const data = await response.json();
        if (data.document) {
          documentId = data.document.id;
          fileName = data.document.fileName;
        }
      } catch (error) {
        console.error("Error uploading contract:", error);
        toast.error("Failed to upload contract document, saving contract without file.");
      }
    }

    const contract: Engagement = {
      id: crypto.randomUUID(),
      clientId: clientId,
      title: newContract.title!,
      startDate: newContract.startDate!,
      endDate: newContract.endDate,
      status: (newContract.status as any) || 'Active',
      type: (newContract.type as any) || 'Time & Materials',
      purchaseOrders: [],
      documentId,
      fileName
    };

    const updatedEngagements = [...engagements, contract];
    setEngagements(updatedEngagements);
    
    await updateClientEngagements(updatedEngagements);
    
    setIsContractModalOpen(false);
    setNewContract({
      title: '',
      startDate: '',
      endDate: '',
      status: 'Active',
      type: 'Time & Materials',
      purchaseOrders: []
    });
    setContractFile(null);
    toast.success("Contract created successfully");
  };

  const handleSavePO = async () => {
    if (!selectedEngagementId || !newPO.poNumber || !newPO.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    let documentId = undefined;
    let fileName = undefined;

    if (poFile) {
      try {
        const formData = new FormData();
        formData.append("file", poFile);
        formData.append("documentType", "PO");
        formData.append("clientId", clientId);

        const response = await fetch(
          `${API_URL}/clients/${clientId}/documents/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to upload PO document");
        }

        const data = await response.json();
        if (data.document) {
          documentId = data.document.id;
          fileName = data.document.fileName;
        }
      } catch (error) {
        console.error("Error uploading PO:", error);
        toast.error("Failed to upload PO document, saving PO without file.");
      }
    }

    const po: PurchaseOrder = {
      id: crypto.randomUUID(),
      engagementId: selectedEngagementId,
      poNumber: newPO.poNumber!,
      amount: Number(newPO.amount),
      remainingAmount: Number(newPO.amount),
      startDate: newPO.startDate || new Date().toISOString().split('T')[0],
      endDate: newPO.endDate || '',
      status: (newPO.status as any) || 'Active',
      documentId,
      fileName
    };

    const updatedEngagements = engagements.map(eng => {
      if (eng.id === selectedEngagementId) {
        return {
          ...eng,
          purchaseOrders: [...(eng.purchaseOrders || []), po]
        };
      }
      return eng;
    });

    setEngagements(updatedEngagements);
    await updateClientEngagements(updatedEngagements);
    
    setIsPOModalOpen(false);
    setNewPO({
      poNumber: '',
      amount: 0,
      startDate: '',
      endDate: '',
      status: 'Active'
    });
    setPoFile(null);
    toast.success("PO created successfully");
  };

  const handleAddContractDocument = async () => {
    if (!selectedEngagementId || !contractDocFile) return;

    try {
      const formData = new FormData();
      formData.append("file", contractDocFile);
      formData.append("documentType", "Contract Document");
      formData.append("clientId", clientId);

      const response = await fetch(
        `${API_URL}/clients/${clientId}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const data = await response.json();
      const doc = data.document;

      if (doc) {
        const newDoc: ContractDocument = {
          id: crypto.randomUUID(),
          documentId: doc.id,
          fileName: doc.fileName,
          uploadedAt: new Date().toISOString()
        };

        const updatedEngagements = engagements.map(eng => {
          if (eng.id === selectedEngagementId) {
            return {
              ...eng,
              additionalDocuments: [...(eng.additionalDocuments || []), newDoc]
            };
          }
          return eng;
        });

        setEngagements(updatedEngagements);
        await updateClientEngagements(updatedEngagements);
        toast.success("Document added to contract");
      }

      setIsContractDocModalOpen(false);
      setContractDocFile(null);
    } catch (error) {
      console.error("Error adding contract document:", error);
      toast.error("Failed to add document");
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedUploadFile || !selectedDocumentType) return;
    await handleDocumentUpload(selectedUploadFile, selectedDocumentType);
    setIsUploadModalOpen(false);
  };
  const [viewingDocument, setViewingDocument] = useState<
    string | null
  >(null);
  const [viewingDocumentName, setViewingDocumentName] =
    useState<string | null>(null);

  useEffect(() => {
    fetchClientDetails();
    fetchClientEmployees();
    fetchClientDocuments();
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      const response = await fetch(
        `${API_URL}/clients/advanced/${clientId}`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );

      if (!response.ok)
        throw new Error("Failed to fetch client details");

      const data = await response.json();
      setClient(data.client);
      
      if (data.client.engagements && data.client.engagements.length > 0) {
        setEngagements(data.client.engagements);
      } else {
        // Initialize with empty array or mock data
        setEngagements([]);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
      toast.error("Failed to load client details");
    }
  };

  const fetchClientEmployees = async () => {
    try {
      console.log(
        "[Client Detail] Fetching employees for client:",
        clientId,
      );

      // Fetch project assignments for this client
      const assignmentsResponse = await fetch(
        `${API_URL}/project-assignments/client/${clientId}`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );

      let employeeIds: string[] = [];

      if (assignmentsResponse.ok) {
        const assignmentsData =
          await assignmentsResponse.json();
        const assignments = assignmentsData.assignments || [];
        setProjectAssignments(assignments);
        console.log(
          "[Client Detail] Found project assignments:",
          assignments.length,
        );

        // Get unique employee IDs from assignments
        employeeIds = [
          ...new Set(assignments.map((a: any) => a.employeeId)),
        ];
        console.log(
          "[Client Detail] Employee IDs from assignments:",
          employeeIds,
        );
      } else {
        console.log(
          "[Client Detail] No project assignments found or error fetching",
        );
      }

      // Fetch all employees
      const employeesResponse = await fetch(
        `${API_URL}/employees`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );

      if (!employeesResponse.ok) {
        console.error(
          "[Client Detail] Failed to fetch employees",
        );
        setEmployees([]);
        return;
      }

      const employeesData = await employeesResponse.json();
      console.log(
        "[Client Detail] Total employees fetched:",
        employeesData.employees?.length || 0,
      );

      // Filter employees that are assigned to this client (via project assignments OR legacy clientId field)
      const clientEmployees = (
        employeesData.employees || []
      ).filter((emp: Employee) => {
        // Check if employee is in project assignments
        const hasAssignment = employeeIds.includes(emp.id);
        // Also check legacy clientId field for backward compatibility
        const hasLegacyClientId = emp.clientId === clientId;

        if (hasAssignment || hasLegacyClientId) {
          console.log(
            "[Client Detail] Employee matched:",
            emp.firstName,
            emp.lastName,
            {
              hasAssignment,
              hasLegacyClientId,
              employeeClientId: emp.clientId,
              targetClientId: clientId,
            },
          );
        }

        return hasAssignment || hasLegacyClientId;
      });

      console.log(
        "[Client Detail] Final filtered employees:",
        clientEmployees.length,
      );
      setEmployees(clientEmployees);
    } catch (error) {
      console.error(
        "[Client Detail] Error fetching client employees:",
        error,
      );
      toast.error("Failed to load client employees");
      setEmployees([]);
    }
  };

  const fetchClientDocuments = async () => {
    try {
      const response = await fetch(
        `${API_URL}/clients/${clientId}/documents`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error fetching client documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (
    file: File,
    documentType: string,
  ) => {
    try {
      setUploadingDocument(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("clientId", clientId);

      const response = await fetch(
        `${API_URL}/clients/${clientId}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: formData,
        },
      );

      if (!response.ok)
        throw new Error("Failed to upload document");

      toast.success(`${documentType} uploaded successfully`);
      fetchClientDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleViewDocument = async (
    documentId: string,
    documentName: string,
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/documents/${documentId}/download-file`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get document URL");
      }

      const data = await response.json();

      if (data.url) {
        setViewingDocument(data.url);
        setViewingDocumentName(documentName);
      } else if (data.metadataOnly) {
        toast.error(
          "This document has no file attached (metadata only)",
        );
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to view document");
    }
  };

  const handleDownloadDocument = async (
    documentId: string,
    fileName: string,
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/documents/${documentId}/download-file`,
        {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const data = await response.json();

      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = data.fileName || fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (data.metadataOnly) {
        toast.error(
          "This document has no file attached (metadata only)",
        );
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/clients/${clientId}/documents/${documentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        },
      );

      if (!response.ok)
        throw new Error("Failed to delete document");

      toast.success("Document deleted successfully");
      fetchClientDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading client details...
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Client not found
        </p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        );
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEmployeeProgress = (employee: Employee) => {
    if (!employee.workflow) return 0;
    const workflow = employee.workflow;
    const stages = [
      "personal-info",
      "classification",
      "documents",
      "it-setup",
      "compliance",
      "department-approvals",
      "final-review",
    ];
    const completedStages = stages.filter(
      (stage) =>
        workflow[stage as keyof typeof workflow]?.status ===
        "completed",
    ).length;
    return Math.round((completedStages / stages.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold">
                {client.companyName}
              </h1>
              <Badge 
                variant="outline"
                className={`
                  ${(client as any).status === 'New' || (client as any).status === 'Enrolled' ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800' : ''}
                  ${((client as any).status === 'Active' || (!(client as any).status && client.isActive)) ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800' : ''}
                  ${((client as any).status === 'Inactive' || (!(client as any).status && !client.isActive)) ? 'border-slate-400 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-700' : ''}
                `}
              >
                {(client as any).status || (client.isActive ? 'Active' : 'Inactive')}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {client.legalName}
            </p>
          </div>
        </div>
        {onEdit && (
          <Button
            onClick={() => onEdit(client)}
            variant="outline"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        )}
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                employees.filter(
                  (e) => e.onboardingStatus === "completed",
                ).length
              }{" "}
              fully onboarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Engagements
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.activeEngagements || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Current projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                documents.filter((d) => d.status === "approved")
                  .length
              }{" "}
              approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Payment Terms
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {client.paymentTerms}
            </div>
            <p className="text-xs text-muted-foreground">
              {client.invoiceMethod} invoicing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(client.hasComplianceIssues ||
        client.hasExpiringPOs ||
        client.hasExpiringDocuments) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">
            Attention Required
          </AlertTitle>
          <AlertDescription className="text-orange-700">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {client.hasComplianceIssues && (
                <li>Compliance issues detected</li>
              )}
              {client.hasExpiringPOs && (
                <li>Purchase orders expiring within 30 days</li>
              )}
              {client.hasExpiringDocuments && (
                <li>Documents require renewal</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">
            Employees ({employees.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Legal Name
                  </div>
                  <div className="text-sm">
                    {client.legalName}
                  </div>
                </div>
                {client.doingBusinessAs && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Doing Business As
                    </div>
                    <div className="text-sm">
                      {client.doingBusinessAs}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Tax ID (EIN)
                  </div>
                  <div className="text-sm flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {client.taxId}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Industry
                  </div>
                  <div className="text-sm">
                    {client.industry}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Business Address
                  </div>
                  <div className="text-sm whitespace-pre-line">
                    {client.address}
                  </div>
                </div>
                {client.billingAddress &&
                  client.billingAddress !== client.address && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Billing Address
                      </div>
                      <div className="text-sm whitespace-pre-line">
                        {client.billingAddress}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Payment & Invoicing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment & Invoicing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Payment Terms
                  </div>
                  <div className="text-sm">
                    {client.paymentTerms}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Timesheet Cadence
                  </div>
                  <div className="text-sm">
                    {client.timesheetCadence}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Invoice Method
                  </div>
                  <div className="text-sm">
                    {client.invoiceMethod}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VMS Portal */}
            {client.vmsPortalType &&
              client.vmsPortalType !== "None" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      VMS Portal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Portal Type
                      </div>
                      <div className="text-sm">
                        {client.vmsPortalType}
                      </div>
                    </div>
                    {client.vmsPortalUrl && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Portal URL
                        </div>
                        <a
                          href={client.vmsPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {client.vmsPortalUrl}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Employees Assigned to {client.companyName}
                  </CardTitle>
                  <CardDescription>
                    {employees.length}{" "}
                    {employees.length === 1
                      ? "employee"
                      : "employees"}{" "}
                    currently assigned to this client
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setIsAssignModalOpen(true);
                  fetchAvailableEmployees();
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No employees assigned to this client yet
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="gradient-teal-blue">
                        <TableHead className="font-semibold text-white">
                          Employee
                        </TableHead>
                        <TableHead className="font-semibold text-white">
                          Position
                        </TableHead>
                        <TableHead className="font-semibold text-white">
                          Department
                        </TableHead>
                        <TableHead className="font-semibold text-white">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-white">
                          Progress
                        </TableHead>
                        <TableHead className="font-semibold text-white">
                          Classification
                        </TableHead>
                        <TableHead className="font-semibold text-white text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow
                          key={employee.id}
                          className="hover:bg-white/50 transition-colors"
                        >
                          <TableCell>
                            <div className="font-medium">
                              {employee.firstName}{" "}
                              {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {employee.position || "Not set"}
                          </TableCell>
                          <TableCell>
                            {employee.department || "Not set"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                employee.onboardingStatus ===
                                "completed"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {employee.onboardingStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={getEmployeeProgress(
                                  employee,
                                )}
                                className="h-2 w-[100px]"
                              />
                              <span className="text-xs text-muted-foreground min-w-[35px]">
                                {getEmployeeProgress(employee)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {employee.workflow
                              ?.classificationVerified && (
                              <Badge className="bg-purple-100 text-purple-700">
                                {employee.classification}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassignEmployee(employee.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {[
            { 
              title: "Documents from Client", 
              description: "MSAs, SOWs, POs, and compliance documents", 
              docs: documents.filter(d => !["To Client", "Invoice", "Proposal", "Quote"].includes(d.documentType)), 
              uploadType: "Client Document",
              emptyMsg: "No documents from client yet"
            },
            { 
              title: "Documents to Client", 
              description: "Invoices, proposals, and reports sent to client", 
              docs: documents.filter(d => ["To Client", "Invoice", "Proposal", "Quote"].includes(d.documentType)), 
              uploadType: "To Client",
              emptyMsg: "No documents to client yet"
            }
          ].map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>
                      {section.description}
                    </CardDescription>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      disabled={uploadingDocument}
                      onClick={() => handleOpenUploadModal(index === 0 ? 'from' : 'to')}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingDocument
                        ? "Uploading..."
                        : "Upload Document"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {section.docs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {section.emptyMsg}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload documents to this section
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="gradient-teal-blue">
                          <TableHead className="font-semibold text-white">
                            Document Type
                          </TableHead>
                          <TableHead className="font-semibold text-white">
                            File Name
                          </TableHead>
                          <TableHead className="font-semibold text-white">
                            Uploaded
                          </TableHead>
                          <TableHead className="font-semibold text-white">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-white text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.docs.map((doc) => (
                          <TableRow
                            key={doc.id}
                            className="hover:bg-white/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {doc.documentType}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {doc.fileName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(
                                doc.uploadedAt,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(doc.status)}
                                <span className="text-sm capitalize">
                                  {doc.status}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleViewDocument(
                                      doc.id,
                                      doc.fileName,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleDownloadDocument(
                                      doc.id,
                                      doc.fileName,
                                    )
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleDeleteDocument(doc.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Contracts & POs</CardTitle>
                  <CardDescription>
                    Manage contracts and purchase orders for {client.companyName}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsContractModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contract
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {engagements.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No contracts found
                  </p>
                  <Button variant="link" onClick={() => setIsContractModalOpen(true)}>
                    Create your first contract
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {engagements.map((engagement) => (
                    <div key={engagement.id} className="border rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setExpandedEngagementId(expandedEngagementId === engagement.id ? null : engagement.id)}
                      >
                        <div className="flex items-center gap-4">
                          {expandedEngagementId === engagement.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {engagement.title}
                              <Badge variant={engagement.status === 'Active' ? 'default' : 'secondary'}>
                                {engagement.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {engagement.type} • {new Date(engagement.startDate).toLocaleDateString()}
                              {engagement.endDate && ` - ${new Date(engagement.endDate).toLocaleDateString()}`}
                            </div>
                            {engagement.fileName && (
                              <div className="text-xs text-blue-600 flex items-center gap-1 mt-1 cursor-pointer hover:underline" onClick={(e) => {
                                e.stopPropagation();
                                if (engagement.documentId) {
                                  handleViewDocument(engagement.documentId, engagement.fileName || 'Contract');
                                }
                              }}>
                                <FileText className="h-3 w-3" />
                                {engagement.fileName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {(engagement.purchaseOrders || []).length} POs
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEngagementId(engagement.id);
                              setIsPOModalOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add PO
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEngagementId(engagement.id);
                              setIsContractDocModalOpen(true);
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Add Doc
                          </Button>
                        </div>
                      </div>
                      
                      {expandedEngagementId === engagement.id && (
                        <div className="p-4 border-t bg-white space-y-6">
                          {/* Additional Documents Section */}
                          {(engagement.additionalDocuments || []).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Contract Documents
                              </h4>
                              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {engagement.additionalDocuments?.map((doc) => (
                                  <div 
                                    key={doc.id} 
                                    className="flex items-center justify-between p-3 border rounded-md bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                                    onClick={() => handleViewDocument(doc.documentId, doc.fileName)}
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                      <span className="text-sm truncate">{doc.fileName}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                      {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Purchase Orders
                            </h4>
                          {(engagement.purchaseOrders || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No purchase orders found for this contract.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>PO Number</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Remaining</TableHead>
                                  <TableHead>Dates</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Document</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {engagement.purchaseOrders?.map((po) => (
                                  <TableRow key={po.id}>
                                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                                    <TableCell>${po.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                      <span className={po.remainingAmount < po.amount * 0.2 ? "text-red-600 font-medium" : ""}>
                                        ${po.remainingAmount.toLocaleString()}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {new Date(po.startDate).toLocaleDateString()} - {po.endDate ? new Date(po.endDate).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{po.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {po.fileName && po.documentId && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleViewDocument(po.documentId!, po.fileName || 'PO')}
                                        >
                                          <FileText className="h-4 w-4 text-blue-600" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Contacts</CardTitle>
              <CardDescription>
                Primary and additional contacts for{" "}
                {client.companyName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!client.contacts ||
              client.contacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No contacts added yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.contacts.map((contact, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {contact.name}
                            </CardTitle>
                            {contact.isPrimary && (
                              <Badge variant="secondary">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline">
                            {contact.contactType}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        <Separator />
                        <div className="flex flex-wrap gap-2">
                          {contact.canApproveTimesheets && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Can Approve Timesheets
                            </Badge>
                          )}
                          {contact.canApproveInvoices && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Can Approve Invoices
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Document Viewer Modal */}
      <Dialog
        open={!!viewingDocument}
        onOpenChange={(open) =>
          !open && setViewingDocument(null)
        }
      >
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {viewingDocumentName || "Document Viewer"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-[60vh] bg-slate-100 rounded-md overflow-hidden">
            {viewingDocument && (
              <iframe
                src={viewingDocument}
                className="w-full h-full border-0"
                title="Document Viewer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document {uploadSection === 'from' ? 'from Client' : 'to Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(uploadSection === 'from' ? FROM_CLIENT_TYPES : TO_CLIENT_TYPES).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input 
                type="file" 
                onChange={(e) => setSelectedUploadFile(e.target.files?.[0] || null)} 
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUploadSubmit} disabled={!selectedUploadFile || !selectedDocumentType || uploadingDocument}>
                {uploadingDocument ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={(value) => {
                setSelectedEmployeeId(value);
                const emp = availableEmployees.find(e => e.id === value);
                if (emp && emp.position) setAssignRole(emp.position);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role / Position</Label>
              <Input 
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date"
                value={assignStartDate}
                onChange={(e) => setAssignStartDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignEmployee} disabled={!selectedEmployeeId}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contract Modal */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Contract Title / Description</Label>
              <Input 
                value={newContract.title} 
                onChange={(e) => setNewContract({...newContract, title: e.target.value})} 
                placeholder="e.g. Software Development Services"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input 
                value={newContract.type || ''} 
                onChange={(e) => setNewContract({...newContract, type: e.target.value})}
                placeholder="e.g. Time & Materials"
                list="contract-types"
              />
              <datalist id="contract-types">
                <option value="Time & Materials" />
                <option value="Fixed Price" />
                <option value="Retainer" />
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={newContract.startDate}
                  onChange={(e) => setNewContract({...newContract, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Input 
                  type="date"
                  value={newContract.endDate || ''}
                  onChange={(e) => setNewContract({...newContract, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contract Document (Optional)</Label>
              <Input 
                type="file" 
                onChange={(e) => setContractFile(e.target.files?.[0] || null)} 
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsContractModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveContract}>Create Contract</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add PO Modal */}
      <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input 
                value={newPO.poNumber} 
                onChange={(e) => setNewPO({...newPO, poNumber: e.target.value})} 
                placeholder="e.g. PO-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  className="pl-10"
                  value={newPO.amount}
                  onChange={(e) => setNewPO({...newPO, amount: parseFloat(e.target.value)})} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={newPO.startDate}
                  onChange={(e) => setNewPO({...newPO, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input 
                  type="date"
                  value={newPO.endDate || ''}
                  onChange={(e) => setNewPO({...newPO, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>PO Document (Optional)</Label>
              <Input 
                type="file" 
                onChange={(e) => setPoFile(e.target.files?.[0] || null)} 
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsPOModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePO}>Add PO</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contract Document Modal */}
      <Dialog open={isContractDocModalOpen} onOpenChange={setIsContractDocModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Contract Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document File</Label>
              <Input 
                type="file" 
                onChange={(e) => setContractDocFile(e.target.files?.[0] || null)} 
              />
              <p className="text-xs text-muted-foreground">
                Upload additional documents related to this contract (e.g. amendments, riders, appendices).
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsContractDocModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddContractDocument} disabled={!contractDocFile}>
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}