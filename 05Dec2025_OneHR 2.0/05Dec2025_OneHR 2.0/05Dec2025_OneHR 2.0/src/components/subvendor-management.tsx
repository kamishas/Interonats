import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Building2, Plus, Search, Edit, Users, TrendingUp, Network,
  AlertCircle, Building, ArrowRight, X, Trash2, Archive
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { Subvendor, Vendor } from '../types';

const API_URL = API_ENDPOINTS.CLIENT;

export function SubvendorManagement() {
  const [subvendors, setSubvendors] = useState<Subvendor[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [parentVendorFilter, setParentVendorFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSubvendor, setSelectedSubvendor] = useState<Subvendor | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    parentVendorId: '',
    legalName: '',
    companyName: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    tier: 1,
  });

  // Fetch vendors and subvendors
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch vendors
      const vendorsResponse = await fetch(`${API_URL}/vendors`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (!vendorsResponse.ok) throw new Error('Failed to fetch vendors');
      const vendorsData = await vendorsResponse.json();
      setVendors(vendorsData.vendors || []);
      
      // Fetch subvendors
      const subvendorsResponse = await fetch(`${API_URL}/subvendors`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (!subvendorsResponse.ok) throw new Error('Failed to fetch subvendors');
      const subvendorsData = await subvendorsResponse.json();
      setSubvendors(subvendorsData.subvendors || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load subvendors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      parentVendorId: '',
      legalName: '',
      companyName: '',
      taxId: '',
      address: '',
      phone: '',
      email: '',
      tier: 1,
    });
  };

  const handleSaveSubvendor = async () => {
    try {
      if (!formData.parentVendorId || !formData.legalName || !formData.companyName) {
        toast.error('Please fill in all required fields');
        return;
      }

      const parentVendor = vendors.find(v => v.id === formData.parentVendorId);
      if (!parentVendor) {
        toast.error('Parent vendor not found');
        return;
      }

      const subvendorData = {
        ...formData,
        parentVendorName: parentVendor.companyName,
        isSubvendor: true,
        isStaffingAgency: parentVendor.isStaffingAgency,
        providesContractors: parentVendor.providesContractors,
        vendorType: parentVendor.vendorType,
        status: 'Active',
        activeContractorCount: 0,
        activeProjects: 0,
        subvendorCount: 0,
      };

      const url = isEditMode && selectedSubvendor 
        ? `${API_URL}/subvendors/${selectedSubvendor.id}`
        : `${API_URL}/subvendors`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subvendorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save subvendor');
      }

      const data = await response.json();
      
      if (isEditMode) {
        setSubvendors(subvendors.map(s => s.id === selectedSubvendor!.id ? data.subvendor : s));
        toast.success('Subvendor updated successfully');
      } else {
        setSubvendors([...subvendors, data.subvendor]);
        toast.success('Subvendor created successfully');
      }

      setShowDialog(false);
      resetForm();
      setSelectedSubvendor(null);
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error saving subvendor:', error);
      toast.error(error.message || 'Failed to save subvendor');
    }
  };

  const handleEditSubvendor = (subvendor: Subvendor) => {
    setSelectedSubvendor(subvendor);
    setIsEditMode(true);
    setFormData({
      parentVendorId: subvendor.parentVendorId,
      legalName: subvendor.legalName,
      companyName: subvendor.companyName,
      taxId: subvendor.taxId,
      address: subvendor.address,
      phone: subvendor.contacts[0]?.phone || '',
      email: subvendor.contacts[0]?.email || '',
      tier: subvendor.tier,
    });
    setShowDialog(true);
  };

  const handleArchiveSubvendor = async (subvendor: Subvendor) => {
    if (!confirm(`Archive subvendor "${subvendor.companyName}"? This will set the status to Inactive.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/subvendors/${subvendor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subvendor,
          status: 'Inactive',
          isActive: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive subvendor');
      }

      const data = await response.json();
      setSubvendors(subvendors.map(s => s.id === subvendor.id ? data.subvendor : s));
      toast.success('Subvendor archived successfully');
    } catch (error: any) {
      console.error('Error archiving subvendor:', error);
      toast.error(error.message || 'Failed to archive subvendor');
    }
  };

  const handleDeleteSubvendor = async (subvendor: Subvendor) => {
    if (!confirm(`Are you sure you want to DELETE subvendor "${subvendor.companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/subvendors/${subvendor.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete subvendor');
      }

      setSubvendors(subvendors.filter(s => s.id !== subvendor.id));
      toast.success('Subvendor deleted successfully');
    } catch (error: any) {
      console.error('Error deleting subvendor:', error);
      toast.error(error.message || 'Failed to delete subvendor');
    }
  };

  const filteredSubvendors = subvendors.filter(subvendor => {
    const matchesSearch = 
      subvendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subvendor.parentVendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subvendor.taxId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesParentVendor = parentVendorFilter === 'all' || subvendor.parentVendorId === parentVendorFilter;
    const matchesTier = tierFilter === 'all' || subvendor.tier.toString() === tierFilter;
    const matchesStatus = statusFilter === 'all' || subvendor.status === statusFilter;
    const matchesCompliance = complianceFilter === 'all' || (complianceFilter === 'true' ? subvendor.hasComplianceIssues : !subvendor.hasComplianceIssues);
    
    return matchesSearch && matchesParentVendor && matchesTier && matchesStatus && matchesCompliance;
  });

  // Group by parent vendor
  const groupedSubvendors = filteredSubvendors.reduce((acc, subvendor) => {
    const parentId = subvendor.parentVendorId;
    if (!acc[parentId]) {
      acc[parentId] = {
        parentName: subvendor.parentVendorName,
        subvendors: []
      };
    }
    acc[parentId].subvendors.push(subvendor);
    return acc;
  }, {} as Record<string, { parentName: string; subvendors: Subvendor[] }>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subvendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Subvendor Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage subvendor relationships and hierarchies
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setSelectedSubvendor(null);
            setIsEditMode(false);
            setShowDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Subvendor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subvendors</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subvendors.length}</div>
            <p className="text-xs text-muted-foreground">
              Under {Object.keys(groupedSubvendors).length} parent vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contractors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subvendors.reduce((sum, s) => sum + (s.activeContractorCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all subvendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subvendors.reduce((sum, s) => sum + (s.activeProjects || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Subvendor engagements
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
              {subvendors.filter(s => s.hasComplianceIssues).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Subvendor Hierarchy</CardTitle>
          <CardDescription>
            View and manage subvendor relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subvendor name, parent vendor, or Tax ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={parentVendorFilter} onValueChange={setParentVendorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parent Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="1">Tier 1</SelectItem>
                <SelectItem value="2">Tier 2</SelectItem>
                <SelectItem value="3">Tier 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">With Compliance Issues</SelectItem>
                <SelectItem value="false">Without Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grouped Subvendors */}
          {Object.keys(groupedSubvendors).length === 0 ? (
            <Alert>
              <AlertDescription>
                No subvendors found. Add your first subvendor to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSubvendors).map(([parentId, { parentName, subvendors: subs }]) => (
                <div key={parentId} className="space-y-3">
                  {/* Parent Vendor Header */}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building className="h-4 w-4 text-primary" />
                    <span>{parentName}</span>
                    <Badge variant="secondary">{subs.length} subvendor{subs.length !== 1 ? 's' : ''}</Badge>
                  </div>

                  {/* Subvendors Table */}
                  <div className="rounded-md border ml-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subvendor Name</TableHead>
                          <TableHead>Tax ID</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Contractors</TableHead>
                          <TableHead>Projects</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subs.map((subvendor) => (
                          <TableRow key={subvendor.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {subvendor.companyName}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {subvendor.taxId}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Tier {subvendor.tier}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="h-3 w-3" />
                                {subvendor.activeContractorCount || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {subvendor.activeProjects || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={subvendor.status === 'Active' ? 'default' : 'secondary'}>
                                  {subvendor.status}
                                </Badge>
                                {subvendor.hasComplianceIssues && (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSubvendor(subvendor)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchiveSubvendor(subvendor)}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubvendor(subvendor)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subvendor Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Subvendor' : 'Add New Subvendor'}
            </DialogTitle>
            <DialogDescription id="subvendor-dialog-description">
              Enter subvendor details and link to parent vendor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>
                Parent Vendor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.parentVendorId}
                onValueChange={(value) => setFormData({ ...formData, parentVendorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.filter(v => v.status === 'Active').map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Legal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="Official registered name"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Display name"
                />
              </div>

              <div className="space-y-2">
                <Label>Tax ID (EIN)</Label>
                <Input
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label>Tier Level</Label>
                <Select
                  value={formData.tier.toString()}
                  onValueChange={(value) => setFormData({ ...formData, tier: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tier 1 (Direct)</SelectItem>
                    <SelectItem value="2">Tier 2</SelectItem>
                    <SelectItem value="3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@subvendor.com"
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
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
                setSelectedSubvendor(null);
                setIsEditMode(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSubvendor}>
              {isEditMode ? 'Update Subvendor' : 'Create Subvendor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
