import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Building, Plus, Search, Edit, Trash2, Users, DollarSign,
  FileText, CheckCircle, AlertCircle, TrendingUp, Building2,
  Mail, Phone, MapPin, Star, Award, Clock, X, Archive
} from 'lucide-react';
import { toast } from 'sonner';
import { getAccessToken, API_ENDPOINTS } from '../lib/constants';
import type { Vendor, VendorContact, VendorType, VendorStatus } from '../types';
import { VendorDetail } from './vendor-detail';

const API_URL = API_ENDPOINTS.CLIENT;
const USER_API_URL = API_ENDPOINTS.USER;

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [staffingFilter, setStaffingFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    legalName: '',
    companyName: '',
    taxId: '',
    vendorType: 'Staffing Agency' as VendorType,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    website: '',
    paymentTerms: 'Net 30',
    currency: 'USD' as 'USD' | 'EUR' | 'GBP',
    isStaffingAgency: true,
    providesContractors: true,
    clientIds: [] as string[],
    clientNames: [] as string[],
  });

  const [contacts, setContacts] = useState<Partial<VendorContact>[]>([{
    name: '',
    email: '',
    phone: '',
    contactType: 'Primary',
    isPrimary: true,
  }]);

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/vendors`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (!response.ok) throw new Error('Failed to fetch vendors');

      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch clients for assignment
  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (!response.ok) throw new Error('Failed to fetch clients');

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchClients();
  }, []);

  const resetForm = () => {
    setFormData({
      legalName: '',
      companyName: '',
      taxId: '',
      vendorType: 'Staffing Agency',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      website: '',
      paymentTerms: 'Net 30',
      currency: 'USD',
      isStaffingAgency: true,
      providesContractors: true,
      clientIds: [],
      clientNames: [],
    });
    setContacts([{
      name: '',
      email: '',
      phone: '',
      contactType: 'Primary',
      isPrimary: true,
    }]);
  };

  const handleAddContact = () => {
    setContacts([...contacts, {
      name: '',
      email: '',
      phone: '',
      contactType: 'Other',
      isPrimary: false,
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

  const handleSaveVendor = async () => {
    try {
      if (!formData.legalName || !formData.companyName || !formData.taxId) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!contacts[0]?.name || !contacts[0]?.email) {
        toast.error('At least one contact with name and email is required');
        return;
      }

      const vendorData = {
        ...formData,
        name: formData.companyName, // Vendor interface requires name
        contacts: contacts.filter(c => c.name && c.email).map(c => ({
          ...c,
          id: c.id || crypto.randomUUID(),
        })),
        compliance: {
          hasInsurance: false,
          hasW9: false,
          backgroundCheckRequired: false,
          hasMSA: false,
          complianceStatus: 'Pending Review' as const,
        },
        status: (isEditMode && selectedVendor?.status) || 'Active' as VendorStatus,
        documents: [],
        activeContractorCount: 0,
        activeProjects: 0,
        performanceRating: 0,
        isActive: true,
        hasComplianceIssues: false,
        hasExpiringDocs: false,
      };

      const url = isEditMode && selectedVendor 
        ? `${API_URL}/vendors/${selectedVendor.id}`
        : `${API_URL}/vendors`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save vendor');
      }

      const data = await response.json();
      
      if (isEditMode) {
        setVendors(vendors.map(v => v.id === selectedVendor!.id ? data.vendor : v));
        toast.success('Vendor updated successfully');
      } else {
        setVendors([...vendors, data.vendor]);
        toast.success('Vendor created successfully');
      }

      setShowVendorDialog(false);
      resetForm();
      setSelectedVendor(null);
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error(error.message || 'Failed to save vendor');
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditMode(true);
    setFormData({
      legalName: vendor.legalName,
      companyName: vendor.companyName,
      taxId: vendor.taxId,
      vendorType: vendor.vendorType,
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zipCode: vendor.zipCode || '',
      country: vendor.country || 'USA',
      website: vendor.website || '',
      paymentTerms: vendor.paymentTerms || 'Net 30',
      currency: (vendor.currency as 'USD' | 'EUR' | 'GBP') || 'USD',
      isStaffingAgency: vendor.isStaffingAgency ?? true,
      providesContractors: vendor.providesContractors ?? true,
      clientIds: vendor.clientIds || (vendor.clientId ? [vendor.clientId] : []),
      clientNames: vendor.clientNames || (vendor.clientName ? [vendor.clientName] : []),
    });
    setContacts(vendor.contacts.length > 0 ? vendor.contacts : [{
      name: '',
      email: '',
      phone: '',
      contactType: 'Primary',
      isPrimary: true,
    }]);
    setShowVendorDialog(true);
  };

  const handleArchiveVendor = async (vendor: Vendor) => {
    if (!confirm(`Archive vendor "${vendor.companyName}"? This will set the status to Inactive.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...vendor,
          status: 'Inactive',
          isActive: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive vendor');
      }

      const data = await response.json();
      setVendors(vendors.map(v => v.id === vendor.id ? data.vendor : v));
      toast.success('Vendor archived successfully');
    } catch (error: any) {
      console.error('Error archiving vendor:', error);
      toast.error(error.message || 'Failed to archive vendor');
    }
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to DELETE vendor "${vendor.companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/vendors/${vendor.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete vendor');
      }

      setVendors(vendors.filter(v => v.id !== vendor.id));
      toast.success('Vendor deleted successfully');
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast.error(error.message || 'Failed to delete vendor');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.taxId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesType = typeFilter === 'all' || vendor.vendorType === typeFilter;
    const matchesStaffing = staffingFilter === 'all' || (staffingFilter === 'true' ? vendor.isStaffingAgency : !vendor.isStaffingAgency);
    const matchesCompliance = complianceFilter === 'all' || (complianceFilter === 'true' ? vendor.hasComplianceIssues : !vendor.hasComplianceIssues);
    
    return matchesSearch && matchesStatus && matchesType && matchesStaffing && matchesCompliance;
  });

  const getStatusBadge = (status: VendorStatus) => {
    const variants: Record<VendorStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Active': 'default',
      'Inactive': 'secondary',
      'Suspended': 'destructive',
      'Under Review': 'outline',
      'Terminated': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendors...</p>
        </div>
      </div>
    );
  }

  // Show detail view if a vendor is selected
  if (viewMode === 'detail' && selectedVendorId) {
    return (
      <VendorDetail 
        vendorId={selectedVendorId}
        onBack={() => {
          setViewMode('list');
          setSelectedVendorId(null);
        }}
        onEdit={(vendor) => {
          setViewMode('list');
          setSelectedVendorId(null);
          handleEditVendor(vendor);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Vendor Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vendor relationships, compliance, and performance
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setSelectedVendor(null);
            setIsEditMode(false);
            setShowVendorDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">
              {vendors.filter(v => v.status === 'Active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staffing Agencies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.filter(v => v.isStaffingAgency).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Providing contractors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contractors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.reduce((sum, v) => sum + (v.activeContractorCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors.filter(v => v.hasComplianceIssues).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Search and manage vendor relationships</CardDescription>
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Staffing Agency">Staffing Agency</SelectItem>
                <SelectItem value="IT Services">IT Services</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Professional Services">Professional Services</SelectItem>
                <SelectItem value="Equipment/Hardware">Equipment/Hardware</SelectItem>
                <SelectItem value="Software/SaaS">Software/SaaS</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={staffingFilter} onValueChange={setStaffingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by staffing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Staffing Agencies</SelectItem>
                <SelectItem value="false">Non-Staffing Agencies</SelectItem>
              </SelectContent>
            </Select>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">With Compliance Issues</SelectItem>
                <SelectItem value="false">Without Compliance Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="gradient-teal-blue">
                  <TableHead className="text-white">Company Name</TableHead>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Tax ID</TableHead>
                  <TableHead className="text-white">Contractors</TableHead>
                  <TableHead className="text-white">Projects</TableHead>
                  <TableHead className="text-white">Rating</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No vendors found. Add your first vendor to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendors.map((vendor) => (
                    <TableRow 
                      key={vendor.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedVendorId(vendor.id);
                        setViewMode('detail');
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {vendor.companyName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {vendor.vendorType}
                      </TableCell>
                      <TableCell className="text-sm">
                        {vendor.taxId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {vendor.activeContractorCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <FileText className="h-3 w-3" />
                          {vendor.activeProjects || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vendor.performanceRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{vendor.performanceRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(vendor.status)}
                          {vendor.hasComplianceIssues && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVendor(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveVendor(vendor)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
            <DialogDescription id="vendor-dialog-description">
              Enter vendor details and primary contact information
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Legal Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="Official registered name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tax ID (EIN) <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vendor Type</Label>
                  <Select
                    value={formData.vendorType}
                    onValueChange={(value: VendorType) => 
                      setFormData({ ...formData, vendorType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staffing Agency">Staffing Agency</SelectItem>
                      <SelectItem value="IT Services">IT Services</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Professional Services">Professional Services</SelectItem>
                      <SelectItem value="Equipment/Hardware">Equipment/Hardware</SelectItem>
                      <SelectItem value="Software/SaaS">Software/SaaS</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Client Assignments</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.clientIds.length} client{formData.clientIds.length !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Select
                      value="add-client"
                      onValueChange={(value) => {
                        if (value !== 'add-client') {
                          const selectedClient = clients.find(c => c.id === value);
                          if (selectedClient && !formData.clientIds.includes(value)) {
                            setFormData({
                              ...formData,
                              clientIds: [...formData.clientIds, selectedClient.id],
                              clientNames: [...formData.clientNames, selectedClient.companyName]
                            });
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add-client" disabled>Select a client to add</SelectItem>
                        {clients
                          .filter(c => !formData.clientIds.includes(c.id))
                          .map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.companyName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {formData.clientIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
                        {formData.clientIds.map((clientId, index) => (
                          <Badge 
                            key={clientId} 
                            variant="secondary" 
                            className="px-3 py-1.5 flex items-center gap-2"
                          >
                            <Building2 className="h-3 w-3" />
                            {formData.clientNames[index]}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  clientIds: formData.clientIds.filter((_, i) => i !== index),
                                  clientNames: formData.clientNames.filter((_, i) => i !== index)
                                });
                              }}
                              className="ml-1 hover:bg-muted rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Vendor Contacts</h3>
                  <p className="text-sm text-muted-foreground">
                    Add contacts for different departments
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
                      {contact.isPrimary && <Badge variant="secondary" className="ml-2">Primary</Badge>}
                    </CardTitle>
                    {contacts.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveContact(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label>Name <span className="text-red-500">*</span></Label>
                        <Input
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                        />
                      </div>

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
                            <SelectItem value="Primary">Primary</SelectItem>
                            <SelectItem value="Billing">Billing</SelectItem>
                            <SelectItem value="Legal">Legal</SelectItem>
                            <SelectItem value="Account Manager">Account Manager</SelectItem>
                            <SelectItem value="Recruiter">Recruiter</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Email <span className="text-red-500">*</span></Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value: 'USD' | 'EUR' | 'GBP') => 
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Vendor Capabilities</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isStaffingAgency"
                    checked={formData.isStaffingAgency}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isStaffingAgency: e.target.checked,
                      providesContractors: e.target.checked ? formData.providesContractors : false 
                    })}
                    className="rounded"
                  />
                  <label htmlFor="isStaffingAgency" className="text-sm">
                    This is a staffing agency
                  </label>
                </div>

                {formData.isStaffingAgency && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="providesContractors"
                      checked={formData.providesContractors}
                      onChange={(e) => setFormData({ ...formData, providesContractors: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="providesContractors" className="text-sm">
                      Provides contractors for our projects
                    </label>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowVendorDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveVendor}>
              {isEditMode ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
