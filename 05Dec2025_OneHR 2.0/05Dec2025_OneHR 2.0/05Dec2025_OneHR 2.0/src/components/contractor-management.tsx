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
  User, Plus, Search, Edit, Briefcase, DollarSign,
  CheckCircle, AlertCircle, Building, Users, TrendingUp,
  FileText, Mail, Phone, MapPin, Award, X, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { 
  Contractor, Vendor, Client, ProjectAssignment,
  ContractorType, ContractorStatus, ImmigrationStatus
} from '../types';

const API_URL = API_ENDPOINTS.CLIENT;

export function ContractorManagement() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ProjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    contractorType: 'W2' as ContractorType,
    isIndependent: true,
    vendorId: '',
    subvendorId: '',
    workAuthorization: 'US Citizen' as ImmigrationStatus,
    availability: 'Full-Time' as 'Full-Time' | 'Part-Time' | 'Contract' | 'Unavailable',
    primarySkills: [] as string[],
    yearsOfExperience: 0,
    billRate: 0,
    payRate: 0,
    currency: 'USD' as 'USD' | 'EUR' | 'GBP',
  });

  // Fetch all data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch contractors
      const contractorsResponse = await fetch(`${API_URL}/contractors`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (contractorsResponse.ok) {
        const contractorsData = await contractorsResponse.json();
        setContractors(contractorsData.contractors || []);
      }
      
      // Fetch vendors
      const vendorsResponse = await fetch(`${API_URL}/vendors`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (vendorsResponse.ok) {
        const vendorsData = await vendorsResponse.json();
        setVendors(vendorsData.vendors || []);
      }
      
      // Fetch clients
      console.log('Fetching clients from:', `${API_URL}/clients/advanced`);
      const clientsResponse = await fetch(`${API_URL}/clients/advanced`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      console.log('Clients response status:', clientsResponse.status);
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        console.log('Received clients:', clientsData.clients?.length || 0);
        setClients(clientsData.clients || []);
      } else {
        const errorText = await clientsResponse.text();
        console.error('Error fetching clients:', clientsResponse.status, errorText);
        toast.error(`Failed to load clients: ${clientsResponse.status}`);
      }
      
      // Fetch projects
      const projectsResponse = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load contractors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      contractorType: 'W2',
      isIndependent: true,
      vendorId: '',
      subvendorId: '',
      workAuthorization: 'US Citizen',
      availability: 'Full-Time',
      primarySkills: [],
      yearsOfExperience: 0,
      billRate: 0,
      payRate: 0,
      currency: 'USD',
    });
  };

  const handleSaveContractor = async () => {
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!formData.isIndependent && !formData.vendorId) {
        toast.error('Please select a vendor for non-independent contractors');
        return;
      }

      const vendorInfo = formData.vendorId ? vendors.find(v => v.id === formData.vendorId) : null;

      const markup = formData.billRate && formData.payRate 
        ? ((formData.billRate - formData.payRate) / formData.payRate) * 100
        : 0;
      const markupAmount = formData.billRate - formData.payRate;

      const contractorData = {
        ...formData,
        vendorName: vendorInfo?.companyName,
        currentRate: {
          billRate: formData.billRate,
          payRate: formData.payRate,
          markup: parseFloat(markup.toFixed(2)),
          markupAmount: parseFloat(markupAmount.toFixed(2)),
          currency: formData.currency,
          rateType: 'Hourly',
          effectiveDate: new Date().toISOString().split('T')[0],
        },
        rateHistory: [],
        currentAssignments: [],
        assignmentHistory: [],
        activeClientCount: 0,
        activeProjectCount: 0,
        skills: formData.primarySkills.map((skill: string) => ({
          skillName: skill,
          level: 'Mid-Level',
          yearsOfExperience: formData.yearsOfExperience,
          isPrimary: true,
        })),
        documents: [],
        clientRatings: [],
        hasResume: false,
        hasW9: false,
        hasI9: false,
        hasContract: false,
        hasComplianceIssues: false,
        hasExpiringDocs: false,
        isActive: true,
        isAvailableForNewAssignments: formData.availability !== 'Unavailable',
        preferredForRehire: true,
        status: formData.availability === 'Unavailable' ? 'Inactive' : 'Available',
        requiresSponsorship: !['US Citizen', 'Green Card Holder'].includes(formData.workAuthorization),
      };

      const url = isEditMode && selectedContractor 
        ? `${API_URL}/contractors/${selectedContractor.id}`
        : `${API_URL}/contractors`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save contractor');
      }

      const data = await response.json();
      
      if (isEditMode) {
        setContractors(contractors.map(c => c.id === selectedContractor!.id ? data.contractor : c));
        toast.success('Contractor updated successfully');
      } else {
        setContractors([...contractors, data.contractor]);
        toast.success('Contractor created successfully');
      }

      setShowDialog(false);
      resetForm();
      setSelectedContractor(null);
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error saving contractor:', error);
      toast.error(error.message || 'Failed to save contractor');
    }
  };

  const handleEditContractor = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setIsEditMode(true);
    setFormData({
      firstName: contractor.firstName,
      lastName: contractor.lastName,
      email: contractor.email,
      phone: contractor.phone || '',
      jobTitle: contractor.jobTitle,
      contractorType: contractor.contractorType,
      isIndependent: contractor.isIndependent,
      vendorId: contractor.vendorId || '',
      subvendorId: contractor.subvendorId || '',
      workAuthorization: contractor.workAuthorization,
      availability: contractor.availability,
      primarySkills: contractor.primarySkills || [],
      yearsOfExperience: contractor.yearsOfExperience,
      billRate: contractor.currentRate?.billRate || 0,
      payRate: contractor.currentRate?.payRate || 0,
      currency: contractor.currentRate?.currency || 'USD',
    });
    setShowDialog(true);
  };

  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch = 
      contractor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractor.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contractor.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || 
      (vendorFilter === 'independent' && contractor.isIndependent) ||
      contractor.vendorId === vendorFilter;
    
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const getStatusBadge = (status: ContractorStatus) => {
    const variants: Record<ContractorStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Available': 'outline',
      'Active': 'default',
      'On Assignment': 'default',
      'Inactive': 'secondary',
      'Terminated': 'destructive',
      'Blacklisted': 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contractors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Contractor Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage contractor relationships, assignments, and performance
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setSelectedContractor(null);
            setIsEditMode(false);
            setShowDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Contractor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contractors</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractors.length}</div>
            <p className="text-xs text-muted-foreground">
              {contractors.filter(c => c.status === 'Active' || c.status === 'On Assignment').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Assignment</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contractors.filter(c => c.status === 'On Assignment').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contractors.filter(c => c.status === 'Available').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for new assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Independent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contractors.filter(c => c.isIndependent).length}
            </div>
            <p className="text-xs text-muted-foreground">
              No vendor affiliation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contractor Directory</CardTitle>
          <CardDescription>Search and manage contractor assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or job title..."
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
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="On Assignment">On Assignment</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                <SelectItem value="independent">Independent</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="gradient-teal-blue">
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Job Title</TableHead>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Vendor</TableHead>
                  <TableHead className="text-white">Bill Rate</TableHead>
                  <TableHead className="text-white">Clients</TableHead>
                  <TableHead className="text-white">Projects</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No contractors found. Add your first contractor to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {contractor.firstName} {contractor.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contractor.jobTitle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contractor.contractorType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contractor.isIndependent ? (
                          <span className="text-muted-foreground">Independent</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {contractor.vendorName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {contractor.currentRate?.billRate || 0}/hr
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contractor.activeClientCount || 0}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contractor.activeProjectCount || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(contractor.status)}
                          {contractor.hasComplianceIssues && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContractor(contractor)}
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Contractor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Contractor' : 'Add New Contractor'}
            </DialogTitle>
            <DialogDescription id="contractor-dialog-description">
              Enter contractor details and assignment information
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="rate">Rate & Status</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contractor Type</Label>
                  <Select
                    value={formData.contractorType}
                    onValueChange={(value: ContractorType) => 
                      setFormData({ ...formData, contractorType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="W2">W2</SelectItem>
                      <SelectItem value="1099">1099</SelectItem>
                      <SelectItem value="Corp-to-Corp">Corp-to-Corp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Work Authorization</Label>
                  <Select
                    value={formData.workAuthorization}
                    onValueChange={(value: ImmigrationStatus) => 
                      setFormData({ ...formData, workAuthorization: value })
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

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isIndependent"
                    checked={formData.isIndependent}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isIndependent: e.target.checked,
                      vendorId: e.target.checked ? '' : formData.vendorId
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="isIndependent">Independent Contractor (No vendor affiliation)</Label>
                </div>

                {!formData.isIndependent && (
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.filter(v => v.status === 'Active' && v.providesContractors).map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Primary Skills (comma-separated)</Label>
                  <Input
                    value={formData.primarySkills.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      primarySkills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="React, Node.js, AWS, Python"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value: 'Full-Time' | 'Part-Time' | 'Contract' | 'Unavailable') => 
                      setFormData({ ...formData, availability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-Time">Full-Time</SelectItem>
                      <SelectItem value="Part-Time">Part-Time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rate" className="space-y-4 mt-4">
              <div className="grid gap-4 grid-cols-3">
                <div className="space-y-2">
                  <Label>Bill Rate (per hour)</Label>
                  <Input
                    type="number"
                    value={formData.billRate}
                    onChange={(e) => setFormData({ ...formData, billRate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pay Rate (per hour)</Label>
                  <Input
                    type="number"
                    value={formData.payRate}
                    onChange={(e) => setFormData({ ...formData, payRate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
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

              {formData.billRate > 0 && formData.payRate > 0 && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        <strong>Markup:</strong> {(((formData.billRate - formData.payRate) / formData.payRate) * 100).toFixed(2)}%
                      </p>
                      <p>
                        <strong>Markup Amount:</strong> ${(formData.billRate - formData.payRate).toFixed(2)}/hr
                      </p>
                      <p>
                        <strong>Estimated Monthly Revenue:</strong> ${((formData.billRate - formData.payRate) * 160).toFixed(2)}
                        <span className="text-muted-foreground text-sm"> (based on 160 hours/month)</span>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
                setSelectedContractor(null);
                setIsEditMode(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveContractor}>
              {isEditMode ? 'Update Contractor' : 'Create Contractor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
