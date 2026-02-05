import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Building2, Plus, Search, Edit, Trash2, FileText, CheckCircle2, XCircle, 
  Clock, AlertCircle, Users, DollarSign, FileCheck, Upload, Download,
  MoreVertical, ChevronRight, Calendar, TrendingUp, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { 
  Client, ClientContact, ClientEngagement, PurchaseOrder, ClientDocument,
  ClientContactType, ClientDocumentType, ClientDocumentStatus, VMSPortalType,
  TimesheetCadence, InvoiceMethod, DocumentExtraction
} from '../types';

const API_URL = API_ENDPOINTS.CLIENT;

export function ClientOnboardingEnhanced() {
    console.log('YYYYYYYYYYYYYYYYYYY=Fetching details for client ID:');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Client form data (Req 4.1)
  const [formData, setFormData] = useState({
    legalName: '',
    doingBusinessAs: '',
    companyName: '',
    taxId: '',
    industry: '',
    address: '',
    billingAddress: '',
    paymentTerms: 'Net 30',
    timesheetCadence: 'Weekly' as TimesheetCadence,
    invoiceMethod: 'Email' as InvoiceMethod,
    vmsPortalType: 'None' as VMSPortalType,
    vmsPortalUrl: '',
  });

  // Contacts management
  const [contacts, setContacts] = useState<Partial<ClientContact>[]>([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    contactType: 'General' as ClientContactType,
    name: '',
    title: '',
    email: '',
    phone: '',
    isPrimary: false,
  });

  // Engagements management
  const [engagements, setEngagements] = useState<ClientEngagement[]>([]);
  const [showEngagementDialog, setShowEngagementDialog] = useState(false);
  
  // Purchase Orders management
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [showPODialog, setShowPODialog] = useState(false);

  // Documents management
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/clients-enhanced`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.statusText}`);
      }

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
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
      paymentTerms: 'Net 30',
      timesheetCadence: 'Weekly',
      invoiceMethod: 'Email',
      vmsPortalType: 'None',
      vmsPortalUrl: '',
    });
    setContacts([]);
    setEngagements([]);
    setPurchaseOrders([]);
    setDocuments([]);
  };

  const handleAddContact = () => {
    if (!contactFormData.name || !contactFormData.email) {
      toast.error('Name and email are required');
      return;
    }

    setContacts([...contacts, {
      ...contactFormData,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }]);

    setContactFormData({
      contactType: 'General',
      name: '',
      title: '',
      email: '',
      phone: '',
      isPrimary: false,
    });
    setShowContactDialog(false);
    toast.success('Contact added');
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
    toast.success('Contact removed');
  };

  const handleSaveClient = async () => {
    try {
      // Validation
      if (!formData.legalName || !formData.companyName || !formData.taxId) {
        toast.error('Please fill in Legal Name, Company Name, and Tax ID');
        return;
      }

      if (contacts.length === 0) {
        toast.error('Please add at least one contact');
        return;
      }

      const clientData = {
        ...formData,
        contacts,
        engagements,
        hasActiveEngagements: engagements.some(e => e.status === 'Active'),
        onboardingStatus: 'in-progress',
        documentsComplete: false,
        contractSigned: false,
        canGenerateInvoices: false,
      };

      const url = isEditMode && selectedClient
        ? `${API_URL}/clients-enhanced/${selectedClient.id}`
        : `${API_URL}/clients-enhanced`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error('Failed to save client');
      }

      const data = await response.json();
      
      if (isEditMode) {
        setClients(clients.map(c => c.id === selectedClient?.id ? data.client : c));
        toast.success('Client updated successfully');
      } else {
        setClients([...clients, data.client]);
        toast.success('Client created successfully');
      }

      setShowClientDialog(false);
      setSelectedClient(null);
      setIsEditMode(false);
      resetForm();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to save client');
    }
  };

  const handleEditClient = (client: Client) => {
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
      paymentTerms: client.paymentTerms,
      timesheetCadence: client.timesheetCadence,
      invoiceMethod: client.invoiceMethod,
      vmsPortalType: client.vmsPortalType,
      vmsPortalUrl: client.vmsPortalUrl || '',
    });
    setContacts(client.contacts || []);
    setEngagements(client.engagements || []);
    setShowClientDialog(true);
  };

  const handleViewClientDetails = (client: Client) => {
    setSelectedClient(client);
    setContacts(client.contacts || []);
    setEngagements(client.engagements || []);
    // Load related data
    fetchClientDocuments(client.id);
    fetchClientPOs(client.id);
  };

  const fetchClientDocuments = async (clientId: string) => {
    try {
      const response = await fetch(`${API_URL}/clients-enhanced/${clientId}/documents`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchClientPOs = async (clientId: string) => {
    try {
      const response = await fetch(`${API_URL}/clients-enhanced/${clientId}/purchase-orders`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error fetching POs:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.taxId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'not-started': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'pending-review': 'bg-yellow-100 text-yellow-700',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-700'}>
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  const getContactTypeBadge = (type: ClientContactType) => {
    const colors: Record<ClientContactType, string> = {
      'Legal': 'bg-purple-100 text-purple-700',
      'AP/Billing': 'bg-green-100 text-green-700',
      'Program/PM': 'bg-blue-100 text-blue-700',
      'VMS Portal': 'bg-orange-100 text-orange-700',
      'Timesheet Approver': 'bg-indigo-100 text-indigo-700',
      'General': 'bg-gray-100 text-gray-700',
    };

    return (
      <Badge className={colors[type]}>
        {type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage client records, engagements, and contracts
          </p>
        </div>
        <Button onClick={() => {
          setIsEditMode(false);
          setSelectedClient(null);
          resetForm();
          setShowClientDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-semibold mt-1">{clients.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Engagements</p>
                <p className="text-2xl font-semibold mt-1">
                  {clients.filter(c => c.hasActiveEngagements).length}
                </p>
              </div>
              <FileCheck className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Onboarding</p>
                <p className="text-2xl font-semibold mt-1">
                  {clients.filter(c => c.onboardingStatus === 'in-progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold mt-1">
                  {clients.filter(c => c.onboardingStatus === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company name, legal name, or tax ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Legal Name</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Engagements</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No clients found. Add your first client to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.companyName}</div>
                        {client.doingBusinessAs && (
                          <div className="text-sm text-muted-foreground">
                            DBA: {client.doingBusinessAs}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.legalName}</TableCell>
                    <TableCell className="font-mono text-sm">{client.taxId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.contacts?.length || 0} contacts
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.hasActiveEngagements ? "default" : "secondary"}>
                        {client.engagements?.length || 0} engagements
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(client.onboardingStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClientDetails(client)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClient(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription id="client-form-description">
              {isEditMode 
                ? 'Update client information and contacts' 
                : 'Create a new client record with contacts and engagement details'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="commercial">Commercial Terms</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legalName">Legal Name *</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="ABC Corporation Inc."
                  />
                </div>

                <div>
                  <Label htmlFor="companyName">Company/Display Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="ABC Corp"
                  />
                </div>

                <div>
                  <Label htmlFor="doingBusinessAs">Doing Business As (DBA)</Label>
                  <Input
                    id="doingBusinessAs"
                    value={formData.doingBusinessAs}
                    onChange={(e) => setFormData({ ...formData, doingBusinessAs: e.target.value })}
                    placeholder="Optional DBA name"
                  />
                </div>

                <div>
                  <Label htmlFor="taxId">Tax ID / EIN *</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>

                <div>
                  <Label htmlFor="vmsPortalType">VMS Portal Type</Label>
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
                      <SelectItem value="IQNavigator">IQNavigator</SelectItem>
                      <SelectItem value="Workday">Workday</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Physical Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, City, State, ZIP"
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Textarea
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="Leave blank if same as physical address"
                    rows={2}
                  />
                </div>

                {formData.vmsPortalType !== 'None' && (
                  <div className="col-span-2">
                    <Label htmlFor="vmsPortalUrl">VMS Portal URL</Label>
                    <Input
                      id="vmsPortalUrl"
                      value={formData.vmsPortalUrl}
                      onChange={(e) => setFormData({ ...formData, vmsPortalUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Add multiple contacts for different purposes (Legal, AP/Billing, Program/PM, etc.)
                </p>
                <Button onClick={() => setShowContactDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {contacts.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No contacts added yet. Add at least one contact to continue.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.name}</span>
                          {getContactTypeBadge(contact.contactType!)}
                          {contact.isPrimary && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {contact.title && <span>{contact.title} • </span>}
                          {contact.email}
                          {contact.phone && <span> • {contact.phone}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContact(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Commercial Terms Tab */}
            <TabsContent value="commercial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
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
                      <SelectItem value="Net 90">Net 90</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timesheetCadence">Timesheet Cadence</Label>
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

                <div>
                  <Label htmlFor="invoiceMethod">Invoice Method</Label>
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
                      <SelectItem value="Portal">Portal</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="EDI">EDI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Commercial terms can be overridden per engagement or purchase order.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveClient}>
              {isEditMode ? 'Update Client' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription id="add-contact-description">
              Add a contact person for this client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="contactType">Contact Type *</Label>
              <Select
                value={contactFormData.contactType}
                onValueChange={(value: ClientContactType) => 
                  setContactFormData({ ...contactFormData, contactType: value })
                }
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

            <div>
              <Label htmlFor="contactName">Name *</Label>
              <Input
                id="contactName"
                value={contactFormData.name}
                onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="contactTitle">Title</Label>
              <Input
                id="contactTitle"
                value={contactFormData.title}
                onChange={(e) => setContactFormData({ ...contactFormData, title: e.target.value })}
                placeholder="Procurement Manager"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactFormData.email}
                onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                value={contactFormData.phone}
                onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={contactFormData.isPrimary}
                onChange={(e) => setContactFormData({ ...contactFormData, isPrimary: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Set as primary contact
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContact}>
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
