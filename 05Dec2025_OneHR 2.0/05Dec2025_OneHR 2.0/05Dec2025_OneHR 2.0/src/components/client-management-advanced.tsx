import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  Building2, Plus, Search, Edit, Trash2, FileText, CheckCircle2,  
  AlertCircle, Users, DollarSign, FileCheck, Upload,
  Mail, Phone, MapPin, CreditCard, Sparkles, 
  UserCheck, Shield, Building, Hash, Briefcase, FileWarning, X
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { 
  Client, ClientContact, ClientEngagement, PurchaseOrder, ClientDocument,
  ClientContactType, TimesheetCadence, InvoiceMethod, VMSPortalType
} from '../types';
import { ClientDetailDashboard } from './client-detail-dashboard';
import { useAuth } from '../lib/auth-context';

const API_URL = (import.meta as any).env.VITE_CLIENT_API_URL || API_ENDPOINTS.CLIENT;

export function ClientManagementAdvanced() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // View mode state
  const [showClientDetail, setShowClientDetail] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Document upload state
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Add Client Method Dialog state
  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pendingMSAFile, setPendingMSAFile] = useState<File | null>(null);
  
  // Client form data (Req 4.1 - Extended fields)
  const [formData, setFormData] = useState({
    legalName: '',
    doingBusinessAs: '',
    companyName: '',
    taxId: '',
    industry: '',
    address: '',
    billingAddress: '',
    // Address components
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    billingAddressStreet: '',
    billingAddressCity: '',
    billingAddressState: '',
    billingAddressZip: '',
    sameAsBusinessAddress: false,
    paymentTerms: 'Net 30',
    timesheetCadence: 'Weekly' as TimesheetCadence,
    invoiceMethod: 'Email' as InvoiceMethod,
    vmsPortalType: 'None' as VMSPortalType,
    vmsPortalUrl: '',
    status: 'New', // Default status
  });
  
  // Contact management
  const [contacts, setContacts] = useState<Partial<ClientContact>[]>([{
    contactType: 'General',
    name: '',
    email: '',
    phone: '',
    isPrimary: true,
    canApproveTimesheets: false,
    canApproveInvoices: false,
  }]);
  
  // Engagement management
  const [showEngagementDialog, setShowEngagementDialog] = useState(false);
  const [currentEngagement, setCurrentEngagement] = useState<Partial<ClientEngagement> | null>(null);
  
  // PO management
  const [showPODialog, setShowPODialog] = useState(false);
  const [currentPO, setCurrentPO] = useState<Partial<PurchaseOrder> | null>(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  // MSA Required Dialog state
  const [showMSARequiredDialog, setShowMSARequiredDialog] = useState(false);
  
  // MSA Preview URL state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pendingMSAFile) {
      const url = URL.createObjectURL(pendingMSAFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [pendingMSAFile]);

  // Fetch clients
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching clients from:', `${API_URL}/clients/advanced`);
      
      const response = await fetch(`${API_URL}/clients/advanced`, {
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Received clients:', data.clients?.length || 0);
      setClients(data.clients || []);
      toast.success(`Loaded ${data.clients?.length || 0} clients`);
    } catch (error) {
      console.error('Error fetching clients - Full details:', error);
      console.error('API URL:', API_URL);
      console.error('Project ID:', projectId);
      toast.error(`Failed to load clients: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const resetForm = () => {
    setFormData({
      legalName: '',
      doingBusinessAs: '',
      companyName: '',
      taxId: '',
      industry: '',
      address: '',
      billingAddress: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZip: '',
      billingAddressStreet: '',
      billingAddressCity: '',
      billingAddressState: '',
      billingAddressZip: '',
      sameAsBusinessAddress: false,
      paymentTerms: 'Net 30',
      timesheetCadence: 'Weekly',
      invoiceMethod: 'Email',
      vmsPortalType: 'None',
      vmsPortalUrl: '',
      status: 'New',
    });
    setContacts([{
      contactType: 'General',
      name: '',
      email: '',
      phone: '',
      isPrimary: true,
      canApproveTimesheets: false,
      canApproveInvoices: false,
    }]);
    setPendingMSAFile(null);
  };

  const handleAddContact = () => {
    setContacts([...contacts, {
      contactType: 'General',
      name: '',
      email: '',
      phone: '',
      isPrimary: false,
      canApproveTimesheets: false,
      canApproveInvoices: false,
    }]);
  };

  const handleRemoveContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleContactChange = (index: number, field: string, value: any) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleMSAExtraction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingMSAFile(file);
    setIsExtracting(true);
    try {
      // Simulate API call/processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data
      const mockExtractedData = {
        legalName: "Acme Corp International Ltd.",
        doingBusinessAs: "Acme Corp",
        companyName: "Acme Corp",
        taxId: "12-3456789",
        industry: "Technology",
        address: "123 Innovation Drive, Tech Valley, CA 94000",
        billingAddress: "456 Finance Way, Tech Valley, CA 94000",
        paymentTerms: "Net 45",
        timesheetCadence: "Weekly" as TimesheetCadence,
        invoiceMethod: "Portal" as InvoiceMethod,
        vmsPortalType: "Fieldglass" as VMSPortalType,
        vmsPortalUrl: "https://acme.fieldglass.net",
      };
      
      setFormData(prev => ({
        ...prev,
        ...mockExtractedData
      }));

      // Mock extracted contact
      setContacts([{
        contactType: 'Billing',
        name: 'Jane Doe',
        email: 'jane.doe@acme.com',
        phone: '555-0123',
        isPrimary: true,
        canApproveTimesheets: true,
        canApproveInvoices: true,
      }]);
      
      toast.success("MSA data extracted successfully!");
      setShowAddMethodDialog(false);
      setShowClientDialog(true);
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Failed to extract data from MSA. Please try manual entry.");
    } finally {
      setIsExtracting(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleSaveClient = async () => {
    try {
      // Validation
      if (!formData.legalName || !formData.companyName || !formData.taxId) {
        toast.error('Please fill in all required fields (Legal Name, Company Name, Tax ID)');
        return;
      }

      if (contacts.length === 0 || !contacts[0].name || !contacts[0].email) {
        toast.error('At least one contact with name and email is required');
        return;
      }

      // Check for MSA requirement if status is Active
      if (formData.status === 'Active') {
        let hasMSA = false;
        if (isEditMode && selectedClient) {
          // Check latest client data from state in case document was just uploaded
          const currentClient = clients.find(c => c.id === selectedClient.id) || selectedClient;
          hasMSA = (currentClient as any).documents?.some((d: any) => d.documentType === 'MSA') || !!pendingMSAFile;
        } else {
          // New client: check if MSA file is pending upload
          hasMSA = !!pendingMSAFile;
        }

        if (!hasMSA) {
          setShowMSARequiredDialog(true);
          return;
        }
      }

      // Construct addresses
      const businessAddress = formData.addressStreet 
        ? `${formData.addressStreet}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`
        : formData.address;

      const billingAddr = formData.sameAsBusinessAddress 
        ? businessAddress
        : (formData.billingAddressStreet 
            ? `${formData.billingAddressStreet}, ${formData.billingAddressCity}, ${formData.billingAddressState} ${formData.billingAddressZip}`
            : formData.billingAddress);

      const clientData = {
        ...formData,
        address: businessAddress,
        billingAddress: billingAddr,
        contacts: contacts.filter(c => c.name && c.email), // Only include valid contacts
        isExistingClient: false,
        requiresFullOnboarding: true,
        engagements: [],
        documents: [],
        activeEngagements: 0,
        totalEngagementValue: 0,
        documentsComplete: false,
        contractSigned: false,
        canGenerateInvoices: false,
        onboardingStatus: 'not-started' as const,
        isActive: formData.status === 'Active' || formData.status === 'New',
        status: formData.status,
        hasComplianceIssues: false,
        hasExpiringPOs: false,
        hasExpiringDocuments: false,
      };

      const url = isEditMode && selectedClient 
        ? `${API_URL}/clients/advanced/${selectedClient.id}`
        : `${API_URL}/clients/advanced`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save client');
      }

      const data = await response.json();
      const savedClient = data.client;
      
      // Upload pending MSA if exists
      if (pendingMSAFile) {
        try {
          const formData = new FormData();
          formData.append('file', pendingMSAFile);
          formData.append('documentType', 'MSA');
          formData.append('clientId', savedClient.id);
          
          const uploadResponse = await fetch(`${API_URL}/clients/${savedClient.id}/documents/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            toast.success('MSA document uploaded successfully');
          } else {
            console.error('Failed to upload pending MSA');
            // Don't throw error here as client is already saved
            toast.error('Client saved but failed to upload MSA document');
          }
        } catch (error) {
          console.error('Error uploading pending MSA:', error);
          toast.error('Client saved but failed to upload MSA document');
        }
      }
      
      if (isEditMode && selectedClient) {
        setClients(clients.map(c => c.id === selectedClient.id ? savedClient : c));
        toast.success('Client updated successfully');
      } else {
        setClients([...clients, savedClient]);
        toast.success('Client created successfully');
      }

      setShowClientDialog(false);
      setSelectedClient(null);
      setIsEditMode(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast.error(error.message || 'Failed to save client');
    }
  };

  const handleEditClient = (client: Client) => {
    setPendingMSAFile(null);
    setSelectedClient(client);
    setIsEditMode(true);
    setFormData({
      legalName: client.legalName,
      doingBusinessAs: client.doingBusinessAs || '',
      companyName: client.companyName,
      taxId: client.taxId,
      industry: client.industry,
      address: client.address,
      billingAddress: client.billingAddress,
      // Reset detailed address fields
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZip: '',
      billingAddressStreet: '',
      billingAddressCity: '',
      billingAddressState: '',
      billingAddressZip: '',
      sameAsBusinessAddress: false,
      paymentTerms: client.paymentTerms,
      timesheetCadence: client.timesheetCadence,
      invoiceMethod: client.invoiceMethod,
      status: (client as any).status || (client.isActive ? 'Active' : 'Inactive'),
    });
    setContacts(client.contacts && client.contacts.length > 0 ? client.contacts : [{
      contactType: 'General',
      name: '',
      email: '',
      phone: '',
      isPrimary: true,
      canApproveTimesheets: false,
      canApproveInvoices: false,
    }]);
    setShowClientDialog(true);
  };

  const handleDocumentUpload = async (file: File, documentType: string) => {
    if (!selectedClient) return;
    
    try {
      setUploadingDocument(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('clientId', selectedClient.id);
      
      const response = await fetch(`${API_URL}/clients/${selectedClient.id}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const data = await response.json();
      
      toast.success(`${documentType} uploaded successfully`);
      
      // If AI extraction is available, trigger it
      if (data.document && (documentType === 'MSA' || documentType === 'SOW' || documentType === 'PO')) {
        toast.info('AI extraction in progress... Please review extracted data');
      }
      
      fetchClients(); // Refresh to get updated documents
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploadingDocument(false);
      setSelectedFile(null);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const response = await fetch(`${API_URL}/clients/advanced/${clientToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      const data = await response.json();
      
      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        toast.info(`Deleted client with: ${data.warnings.join(', ')}`);
      } else {
        toast.success('Client deleted successfully');
      }

      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setShowDeleteDialog(false);
      setClientToDelete(null);
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error(error.message || 'Failed to delete client');
    }
  };

  const handleStatusChange = async (client: Client, newStatus: string) => {
    // Check for MSA if status is changing to Active
    if (newStatus === 'Active') {
      const hasMSA = (client as any).documents?.some((d: any) => d.documentType === 'MSA');
      if (!hasMSA) {
        setShowMSARequiredDialog(true);
        return;
      }
    }

    try {
      // Calculate isActive based on status
      const isActive = newStatus === 'Active' || newStatus === 'New';
      
      const response = await fetch(`${API_URL}/clients/advanced/${client.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          isActive: isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update client status');
      }

      const data = await response.json();
      
      // Update local state
      setClients(clients.map(c => 
        c.id === client.id ? { ...c, status: newStatus, isActive: isActive } : c
      ));
      
      toast.success(`Client status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update client status');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.taxId && client.taxId.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const clientStatus = (client as any).status || (client.isActive ? 'Active' : 'Inactive');
    const matchesStatus = statusFilter === 'All' || clientStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Active': 'default',
      'Completed': 'secondary',
      'not-started': 'outline',
      'in-progress': 'secondary',
      'completed': 'default',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  // Show client detail dashboard if a client is selected
  if (showClientDetail && selectedClientId) {
    return (
      <ClientDetailDashboard
        clientId={selectedClientId}
        onBack={() => {
          setShowClientDetail(false);
          setSelectedClientId(null);
        }}
        onEdit={(client) => {
          setShowClientDetail(false);
          handleEditClient(client);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Client Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive client records with engagement and document tracking
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedClient(null);
            setIsEditMode(false);
            resetForm();
            setShowAddMethodDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter(c => c.isActive).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Engagements</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((sum, c) => sum + (c.activeEngagements || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring POs</CardTitle>
            <FileWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.hasExpiringPOs).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.hasComplianceIssues).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>
            Search and manage all client records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name, legal name, or Tax ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="gradient-teal-blue">
                  <TableHead className="text-white">Company Name</TableHead>
                  <TableHead className="text-white">Legal Name</TableHead>
                  <TableHead className="text-white">Tax ID</TableHead>
                  <TableHead className="text-white">Contacts</TableHead>
                  <TableHead className="text-white">Engagements</TableHead>
                  <TableHead className="text-white">Payment Terms</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No clients found. Add your first client to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setShowClientDetail(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {client.companyName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.legalName}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          {client.taxId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {client.contacts?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Briefcase className="h-3 w-3" />
                          {client.activeEngagements || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {client.paymentTerms}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div 
                                className="cursor-pointer outline-none inline-block"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(client, 'New'); }}>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                  New
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(client, 'Active'); }}>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  Active
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(client, 'Inactive'); }}>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                                  Inactive
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {client.hasExpiringPOs && (
                            <FileWarning className="h-4 w-4 text-orange-500" />
                          )}
                          {client.hasComplianceIssues && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientToDelete(client);
                            setShowDeleteDialog(true);
                          }}
                          title="Delete client"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MSA Required Dialog */}
      <AlertDialog open={showMSARequiredDialog} onOpenChange={setShowMSARequiredDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>MSA Required</AlertDialogTitle>
            <AlertDialogDescription>
              There is no MSA attached to this client therefore the status cannot be changed from new to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowMSARequiredDialog(false)}>
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Client Method Dialog */}
      <Dialog open={showAddMethodDialog} onOpenChange={setShowAddMethodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Choose how you would like to add the new client.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div 
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => document.getElementById('msa-upload-input')?.click()}
            >
              <input 
                id="msa-upload-input"
                type="file" 
                accept=".pdf,.doc,.docx" 
                className="hidden"
                onChange={handleMSAExtraction}
              />
              {isExtracting ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-3 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              )}
              <h3 className="font-medium text-center">Upload MSA</h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {isExtracting ? 'Extracting data...' : 'Auto-fill from contract'}
              </p>
            </div>

            <div 
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all"
              onClick={() => {
                setShowAddMethodDialog(false);
                setShowClientDialog(true);
              }}
            >
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-600">
                <Edit className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-center">Manual Entry</h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Enter details manually
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription id="client-dialog-description">
              {isEditMode ? 'Update client information and engagement details' : 'Create a new client account with contact and engagement information'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Basic Info</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalName">
                    Legal Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="Legal entity name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doingBusinessAs">
                    Doing Business As (DBA)
                  </Label>
                  <Input
                    id="doingBusinessAs"
                    value={formData.doingBusinessAs}
                    onChange={(e) => setFormData({ ...formData, doingBusinessAs: e.target.value })}
                    placeholder="Trade name (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">
                    Tax ID (EIN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="status">Client Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => {
                      if (value === 'Active') {
                        let hasMSA = false;
                        if (isEditMode && selectedClient) {
                          const currentClient = clients.find(c => c.id === selectedClient.id) || selectedClient;
                          hasMSA = (currentClient as any).documents?.some((d: any) => d.documentType === 'MSA') || !!pendingMSAFile;
                        } else {
                          hasMSA = !!pendingMSAFile;
                        }

                        if (!hasMSA) {
                          setShowMSARequiredDialog(true);
                          return;
                        }
                      }
                      setFormData({ ...formData, status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2 col-span-2">
                  <Label>Business Address</Label>
                  {isEditMode ? (
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street, City, State, ZIP"
                      rows={3}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Street Address"
                        value={formData.addressStreet}
                        onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="City"
                          value={formData.addressCity}
                          onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                        />
                        <Input
                          placeholder="State"
                          value={formData.addressState}
                          onChange={(e) => setFormData({ ...formData, addressState: e.target.value })}
                        />
                        <Input
                          placeholder="ZIP Code"
                          value={formData.addressZip}
                          onChange={(e) => setFormData({ ...formData, addressZip: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Billing Address</Label>
                    {!isEditMode && (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="adv-same-as-business" 
                          checked={formData.sameAsBusinessAddress}
                          onCheckedChange={(checked) => setFormData({ ...formData, sameAsBusinessAddress: checked as boolean })}
                        />
                        <label
                          htmlFor="adv-same-as-business"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Same as business address
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {isEditMode ? (
                    <Textarea
                      id="billingAddress"
                      value={formData.billingAddress}
                      onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                      placeholder="Leave blank if same as business address"
                      rows={3}
                    />
                  ) : (
                    !formData.sameAsBusinessAddress && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Street Address"
                          value={formData.billingAddressStreet}
                          onChange={(e) => setFormData({ ...formData, billingAddressStreet: e.target.value })}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="City"
                            value={formData.billingAddressCity}
                            onChange={(e) => setFormData({ ...formData, billingAddressCity: e.target.value })}
                          />
                          <Input
                            placeholder="State"
                            value={formData.billingAddressState}
                            onChange={(e) => setFormData({ ...formData, billingAddressState: e.target.value })}
                          />
                          <Input
                            placeholder="ZIP Code"
                            value={formData.billingAddressZip}
                            onChange={(e) => setFormData({ ...formData, billingAddressZip: e.target.value })}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Contact Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Add multiple contacts for different purposes
                  </p>
                </div>
                <Button onClick={handleAddContact} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {contacts.map((contact, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contact {index + 1}
                      {contact.isPrimary && (
                        <Badge variant="secondary" className="ml-2">Primary</Badge>
                      )}
                    </CardTitle>
                    {contacts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContact(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label>Contact Type</Label>
                        <Select
                          value={contact.contactType}
                          onValueChange={(value) => handleContactChange(index, 'contactType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Legal">Legal</SelectItem>
                            <SelectItem value="AP/Billing">AP/Billing</SelectItem>
                            <SelectItem value="Program/PM">Program/PM</SelectItem>
                            <SelectItem value="VMS Portal">VMS Portal</SelectItem>
                            <SelectItem value="Timesheet Approver">Timesheet Approver</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Name <span className="text-red-500">*</span></Label>
                        <Input
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          placeholder="Full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Email <span className="text-red-500">*</span></Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={contact.canApproveTimesheets}
                          onChange={(e) => handleContactChange(index, 'canApproveTimesheets', e.target.checked)}
                          className="rounded"
                        />
                        Can Approve Timesheets
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={contact.canApproveInvoices}
                          onChange={(e) => handleContactChange(index, 'canApproveInvoices', e.target.checked)}
                          className="rounded"
                        />
                        Can Approve Invoices
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Timesheet Cadence</Label>
                  <Select
                    value={formData.timesheetCadence}
                    onValueChange={(value: TimesheetCadence) => 
                      setFormData({ ...formData, timesheetCadence: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Invoice Method</Label>
                  <Select
                    value={formData.invoiceMethod}
                    onValueChange={(value: InvoiceMethod) => 
                      setFormData({ ...formData, invoiceMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Portal">Portal</SelectItem>
                      <SelectItem value="EDI">EDI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>VMS Portal Type</Label>
                  <Select
                    value={formData.vmsPortalType}
                    onValueChange={(value: VMSPortalType) => 
                      setFormData({ ...formData, vmsPortalType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Fieldglass">Fieldglass</SelectItem>
                      <SelectItem value="Beeline">Beeline</SelectItem>
                      <SelectItem value="Ariba">Ariba</SelectItem>
                      <SelectItem value="VMS One">VMS One</SelectItem>
                      <SelectItem value="IQNavigator">IQNavigator</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>VMS Portal URL</Label>
                  <Input
                    value={formData.vmsPortalUrl}
                    onChange={(e) => setFormData({ ...formData, vmsPortalUrl: e.target.value })}
                    placeholder="https://portal.example.com"
                    disabled={formData.vmsPortalType === 'None'}
                  />
                </div>
              </div>

            </TabsContent>

            {/* Documents Tab - New 4th Tab */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Master Services Agreement (MSA)</h3>
                  <p className="text-sm text-muted-foreground">
                    View or upload the Master Services Agreement for this client.
                  </p>
                </div>

                {pendingMSAFile ? (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{pendingMSAFile.name}</span>
                        <Badge variant="outline">{(pendingMSAFile.size / 1024 / 1024).toFixed(2)} MB</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setPendingMSAFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Preview Frame */}
                    <div className="aspect-[4/5] w-full bg-gray-100 rounded-md border overflow-hidden">
                      {pendingMSAFile.type === 'application/pdf' ? (
                        <iframe 
                          src={previewUrl || ''} 
                          className="w-full h-full"
                          title="MSA Preview"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                          <FileText className="h-12 w-12 mb-2" />
                          <p className="mb-2">Preview not available for this file type</p>
                          <p className="text-xs">{pendingMSAFile.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Upload Area (if no pending file) */
                  <div 
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all"
                    onClick={() => document.getElementById('tab-msa-upload')?.click()}
                  >
                    <input 
                      id="tab-msa-upload"
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setPendingMSAFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium text-lg">Upload MSA Document</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Drag and drop or click to upload
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowClientDialog(false);
                setSelectedClient(null);
                setIsEditMode(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            {isEditMode ? (
              <Button onClick={handleSaveClient}>
                Update Client
              </Button>
            ) : (
              <>
                {activeTab !== 'documents' && (
                  <Button 
                    onClick={() => {
                      if (activeTab === 'overview') {
                        if (!formData.legalName || !formData.companyName || !formData.taxId) {
                          toast.error('Please fill in all required fields (Legal Name, Company Name, Tax ID)');
                          return;
                        }
                      }
                      if (activeTab === 'contacts') {
                        if (contacts.length === 0 || !contacts[0].name || !contacts[0].email) {
                          toast.error('At least one contact with name and email is required');
                          return;
                        }
                      }
                      const tabs = ['overview', 'contacts', 'settings', 'documents'];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                  >
                    Next
                  </Button>
                )}
                {activeTab === 'documents' && (
                  <Button onClick={handleSaveClient}>
                    Create Client
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Client - Warning
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to permanently delete <strong>{clientToDelete?.companyName}</strong>.
                </p>
                
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    <strong>This action cannot be undone!</strong> All associated data will be permanently removed:
                  </AlertDescription>
                </Alert>

                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>{clientToDelete?.contacts?.length || 0}</strong> contact(s)</li>
                  <li><strong>{clientToDelete?.activeEngagements || 0}</strong> engagement(s)</li>
                  <li>All purchase orders</li>
                  <li>All documents and files</li>
                  <li>Complete activity history</li>
                </ul>

              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}