import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { Building2, Plus, Search, Edit, Trash2, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { Client, OnboardingStatus } from '../types';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

export function ClientOnboarding() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    clientId: string;
    clientName: string;
  }>({ open: false, clientId: '', clientName: '' });

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    billingAddress: '',
    // Address components for Add Client form
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    billingAddressStreet: '',
    billingAddressCity: '',
    billingAddressState: '',
    billingAddressZip: '',
    sameAsBusinessAddress: false,
    contractStartDate: '',
    contractEndDate: '',
    paymentTerms: 'Net 30',
    rate: '',
    onboardingStatus: 'not-started' as OnboardingStatus,
    documentsComplete: false,
    contractSigned: false,
    canGenerateInvoices: false,
  });

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
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
      companyName: '',
      industry: '',
      contactPerson: '',
      email: '',
      phone: '',
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
      contractStartDate: '',
      contractEndDate: '',
      paymentTerms: 'Net 30',
      rate: '',
      onboardingStatus: 'not-started',
      documentsComplete: false,
      contractSigned: false,
      canGenerateInvoices: false,
    });
  };

  const handleAddClient = async () => {
    try {
      if (!formData.companyName || !formData.contactPerson || !formData.email) {
        toast.error('Please fill in all required fields');
        return;
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

      const payload = {
        ...formData,
        address: businessAddress,
        billingAddress: billingAddr
      };

      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      const data = await response.json();
      setClients([...clients, data.client]);
      setShowAddDialog(false);
      resetForm();
      toast.success('Client added successfully');
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`${API_URL}/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      const data = await response.json();
      setClients(clients.map(c => c.id === selectedClient.id ? data.client : c));
      setShowEditDialog(false);
      setSelectedClient(null);
      resetForm();
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };

  const openEditDialog = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      companyName: client.companyName,
      industry: client.industry,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      address: client.address,
      billingAddress: client.billingAddress,
      // Reset detailed address fields as we use the main address field for editing
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZip: '',
      billingAddressStreet: '',
      billingAddressCity: '',
      billingAddressState: '',
      billingAddressZip: '',
      sameAsBusinessAddress: false,
      contractStartDate: client.contractStartDate,
      contractEndDate: client.contractEndDate,
      paymentTerms: client.paymentTerms,
      rate: client.rate,
      onboardingStatus: client.onboardingStatus,
      documentsComplete: client.documentsComplete,
      contractSigned: client.contractSigned,
      canGenerateInvoices: client.canGenerateInvoices,
    });
    setShowEditDialog(true);
  };

  const handleDeleteClient = async () => {
    try {
      const response = await fetch(`${API_URL}/clients/${deleteDialog.clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      setClients(clients.filter(c => c.id !== deleteDialog.clientId));
      setDeleteDialog({ open: false, clientId: '', clientName: '' });
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const getStatusBadge = (status: OnboardingStatus) => {
    const variants = {
      'not-started': <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Not Started</Badge>,
      'in-progress': <Badge className="gap-1 bg-blue-500"><Clock className="h-3 w-3" /> In Progress</Badge>,
      'pending-review': <Badge className="gap-1 bg-yellow-500"><AlertCircle className="h-3 w-3" /> Pending Review</Badge>,
      'completed': <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>,
    };
    return variants[status] || <Badge>{status}</Badge>;
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchTerm || 
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || client.onboardingStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    total: clients.length,
    completed: clients.filter(c => c.onboardingStatus === 'completed').length,
    inProgress: clients.filter(c => c.onboardingStatus === 'in-progress').length,
    contractSigned: clients.filter(c => c.contractSigned).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Client Onboarding</h1>
          <p className="text-muted-foreground">Manage client onboarding and contract setup</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Clients</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contracts Signed</CardDescription>
            <CardTitle className="text-3xl">{stats.contractSigned}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Section */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Onboarding Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Onboarding Status</CardTitle>
              <CardDescription>Client distribution by status</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: clients.filter(c => c.onboardingStatus === 'completed').length, color: '#5FA989' },
                        { name: 'In Progress', value: clients.filter(c => c.onboardingStatus === 'in-progress').length, color: '#6B7FBE' },
                        { name: 'Pending Review', value: clients.filter(c => c.onboardingStatus === 'pending-review').length, color: '#D9A865' },
                        { name: 'Not Started', value: clients.filter(c => c.onboardingStatus === 'not-started').length, color: '#9B88C4' },
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      innerRadius={60}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {[
                        { name: 'Completed', value: clients.filter(c => c.onboardingStatus === 'completed').length, color: '#5FA989' },
                        { name: 'In Progress', value: clients.filter(c => c.onboardingStatus === 'in-progress').length, color: '#6B7FBE' },
                        { name: 'Pending Review', value: clients.filter(c => c.onboardingStatus === 'pending-review').length, color: '#D9A865' },
                        { name: 'Not Started', value: clients.filter(c => c.onboardingStatus === 'not-started').length, color: '#9B88C4' },
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { name: 'Completed', value: clients.filter(c => c.onboardingStatus === 'completed').length, color: '#5FA989' },
                  { name: 'In Progress', value: clients.filter(c => c.onboardingStatus === 'in-progress').length, color: '#6B7FBE' },
                  { name: 'Pending Review', value: clients.filter(c => c.onboardingStatus === 'pending-review').length, color: '#D9A865' },
                  { name: 'Not Started', value: clients.filter(c => c.onboardingStatus === 'not-started').length, color: '#9B88C4' },
                ].filter(item => item.value > 0).map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm flex-shrink-0" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-gray-600 truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industry Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clients by Industry</CardTitle>
              <CardDescription>Industry breakdown</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Object.entries(
                      clients.reduce((acc, client) => {
                        const industry = client.industry || 'Unknown';
                        acc[industry] = (acc[industry] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([industry, count]) => ({ 
                      industry: industry.length > 12 ? industry.substring(0, 10) + '...' : industry,
                      fullIndustry: industry,
                      count 
                    }))}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="industry" 
                      fontSize={11}
                      tick={{ fill: '#6B7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg">
                              <p className="font-medium text-gray-900">{payload[0].payload.fullIndustry}</p>
                              <p className="text-sm text-gray-600 mt-1">Clients: <span className="font-semibold text-gray-900">{payload[0].value}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#9B88C4" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending-review">Pending Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading clients...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="gradient-teal-blue">
                  <TableHead className="text-white">Company Name</TableHead>
                  <TableHead className="text-white">Contact Person</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Industry</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Contract</TableHead>
                  <TableHead className="text-white">Created</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'No clients match your filters' 
                          : 'No clients yet. Add your first client to get started.'}
                      </p>
                      {!searchTerm && statusFilter === 'all' && (
                        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Client
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.companyName}</div>
                          {client.rate && <div className="text-sm text-muted-foreground">{client.rate}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{client.contactPerson}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.industry || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(client.onboardingStatus)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.contractSigned ? (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle2 className="h-3 w-3" />
                              Signed
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <XCircle className="h-3 w-3" />
                              Unsigned
                            </div>
                          )}
                          {client.canGenerateInvoices && (
                            <div className="flex items-center gap-1 text-blue-600 text-sm">
                              <FileText className="h-3 w-3" />
                              Can Invoice
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.createdAt ? format(new Date(client.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, clientId: client.id, clientName: client.companyName })}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription id="add-client-dialog-description">
              Enter the client information to begin the onboarding process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-companyName">Company Name *</Label>
                <Input
                  id="add-companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Acme Corporation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-industry">Industry</Label>
                <Input
                  id="add-industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="Technology"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-contactPerson">Contact Person *</Label>
                <Input
                  id="add-contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@acme.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-rate">Rate</Label>
                <Input
                  id="add-rate"
                  value={formData.rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                  placeholder="$150/hour"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Address</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Street Address"
                  value={formData.addressStreet}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressStreet: e.target.value }))}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={formData.addressCity}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressCity: e.target.value }))}
                  />
                  <Input
                    placeholder="State"
                    value={formData.addressState}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressState: e.target.value }))}
                  />
                  <Input
                    placeholder="ZIP Code"
                    value={formData.addressZip}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressZip: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Billing Address</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="same-as-business" 
                    checked={formData.sameAsBusinessAddress}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sameAsBusinessAddress: checked as boolean }))}
                  />
                  <label
                    htmlFor="same-as-business"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Same as business address
                  </label>
                </div>
              </div>
              
              {!formData.sameAsBusinessAddress && (
                <div className="space-y-2">
                  <Input
                    placeholder="Street Address"
                    value={formData.billingAddressStreet}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingAddressStreet: e.target.value }))}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="City"
                      value={formData.billingAddressCity}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingAddressCity: e.target.value }))}
                    />
                    <Input
                      placeholder="State"
                      value={formData.billingAddressState}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingAddressState: e.target.value }))}
                    />
                    <Input
                      placeholder="ZIP Code"
                      value={formData.billingAddressZip}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingAddressZip: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-contractStartDate">Contract Start Date</Label>
                <Input
                  id="add-contractStartDate"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-contractEndDate">Contract End Date</Label>
                <Input
                  id="add-contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}>
                  <SelectTrigger id="add-paymentTerms">
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
                <Label htmlFor="add-onboardingStatus">Onboarding Status</Label>
                <Select value={formData.onboardingStatus} onValueChange={(value: OnboardingStatus) => setFormData(prev => ({ ...prev, onboardingStatus: value }))}>
                  <SelectTrigger id="add-onboardingStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending-review">Pending Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add-documentsComplete"
                  checked={formData.documentsComplete}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentsComplete: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="add-documentsComplete" className="cursor-pointer">Documents Complete</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add-contractSigned"
                  checked={formData.contractSigned}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractSigned: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="add-contractSigned" className="cursor-pointer">Contract Signed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add-canGenerateInvoices"
                  checked={formData.canGenerateInvoices}
                  onChange={(e) => setFormData(prev => ({ ...prev, canGenerateInvoices: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="add-canGenerateInvoices" className="cursor-pointer">Can Generate Invoices</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddClient}>Add Client</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription id="edit-client-dialog-description">
              Update client information and onboarding status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-companyName">Company Name *</Label>
                <Input
                  id="edit-companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Acme Corporation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-industry">Industry</Label>
                <Input
                  id="edit-industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="Technology"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactPerson">Contact Person *</Label>
                <Input
                  id="edit-contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@acme.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rate">Rate</Label>
                <Input
                  id="edit-rate"
                  value={formData.rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                  placeholder="$150/hour"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main Street, Suite 100, San Francisco, CA 94102"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-billingAddress">Billing Address</Label>
              <Textarea
                id="edit-billingAddress"
                value={formData.billingAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                placeholder="Same as above or different billing address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contractStartDate">Contract Start Date</Label>
                <Input
                  id="edit-contractStartDate"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-contractEndDate">Contract End Date</Label>
                <Input
                  id="edit-contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-paymentTerms">Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}>
                  <SelectTrigger id="edit-paymentTerms">
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
                <Label htmlFor="edit-onboardingStatus">Onboarding Status</Label>
                <Select value={formData.onboardingStatus} onValueChange={(value: OnboardingStatus) => setFormData(prev => ({ ...prev, onboardingStatus: value }))}>
                  <SelectTrigger id="edit-onboardingStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending-review">Pending Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-documentsComplete"
                  checked={formData.documentsComplete}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentsComplete: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-documentsComplete" className="cursor-pointer">Documents Complete</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-contractSigned"
                  checked={formData.contractSigned}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractSigned: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-contractSigned" className="cursor-pointer">Contract Signed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-canGenerateInvoices"
                  checked={formData.canGenerateInvoices}
                  onChange={(e) => setFormData(prev => ({ ...prev, canGenerateInvoices: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-canGenerateInvoices" className="cursor-pointer">Can Generate Invoices</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditClient}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.clientName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
