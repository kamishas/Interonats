import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  AlertCircle, Building2, CheckCircle2, Plus, Edit, Trash2, 
  FileText, Shield, Search, Calendar, Globe, Map, 
  ExternalLink, AlertTriangle, Info, TrendingUp, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { format, parseISO, differenceInDays } from 'date-fns';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// License Categories based on the provided structure
const LICENSE_CATEGORIES = {
  federal: {
    name: 'Federal Licenses',
    description: 'Nationwide registrations for doing business and hiring.',
    examples: 'EIN, SAM.gov registration, E-Verify account.',
    icon: Shield,
    color: 'blue'
  },
  client_state: {
    name: 'Client State Licenses',
    description: "Registrations required to conduct business in a client's state.",
    examples: 'Vendor ID, MBE/SBE registrations, BEP certifications.',
    icon: FileText,
    color: 'teal'
  }
};

type LicenseCategory = keyof typeof LICENSE_CATEGORIES;

interface BusinessLicense {
  id: string;
  category: LicenseCategory;
  licenseName: string;
  licenseType: string;
  licenseNumber: string;
  jurisdiction: string;
  issuingAuthority: string;
  portalLink?: string;
  issueDate: string;
  expiryDate: string;
  renewalDate?: string;
  renewalFrequency?: 'annual' | 'biannual' | 'quarterly' | 'biennial' | 'triennial' | 'other';
  status: 'active' | 'expired' | 'pending' | 'pending-renewal' | 'suspended';
  fee?: number;
  renewalFee?: number;
  documentUrl?: string;
  notes?: string;
  requiresAction: boolean;
  reminderDaysBefore?: number;
  responsibleOwner?: string;
  createdAt: string;
  updatedAt?: string;
}

export function BusinessLicensingCategorized() {
  const [licenses, setLicenses] = useState<BusinessLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LicenseCategory>('federal');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<BusinessLicense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [licenseFormData, setLicenseFormData] = useState<Partial<BusinessLicense>>({
    category: 'federal',
    status: 'active',
    requiresAction: false,
    reminderDaysBefore: 30
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/licenses`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) throw new Error('Failed to fetch licenses');

      const data = await response.json();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast.error('Failed to load licenses');
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLicense = async () => {
    try {
      if (!licenseFormData.licenseName || !licenseFormData.licenseNumber || !licenseFormData.expiryDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newLicense = {
        ...licenseFormData,
        id: crypto.randomUUID(),
        category: selectedCategory,
        createdAt: new Date().toISOString(),
        requiresAction: false
      };

      const response = await fetch(`${API_URL}/licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(newLicense)
      });

      if (!response.ok) throw new Error('Failed to add license');

      toast.success('License added successfully');
      setShowAddDialog(false);
      resetForm();
      fetchLicenses();
    } catch (error) {
      console.error('Error adding license:', error);
      toast.error('Failed to add license');
    }
  };

  const handleUpdateLicense = async () => {
    if (!selectedLicense) return;

    try {
      const response = await fetch(`${API_URL}/licenses/${selectedLicense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ ...selectedLicense, ...licenseFormData })
      });

      if (!response.ok) throw new Error('Failed to update license');

      toast.success('License updated successfully');
      setShowEditDialog(false);
      setSelectedLicense(null);
      resetForm();
      fetchLicenses();
    } catch (error) {
      console.error('Error updating license:', error);
      toast.error('Failed to update license');
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license?')) return;

    try {
      const response = await fetch(`${API_URL}/licenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (!response.ok) throw new Error('Failed to delete license');

      toast.success('License deleted successfully');
      fetchLicenses();
    } catch (error) {
      console.error('Error deleting license:', error);
      toast.error('Failed to delete license');
    }
  };

  const resetForm = () => {
    setLicenseFormData({
      category: selectedCategory,
      status: 'active',
      requiresAction: false,
      reminderDaysBefore: 30
    });
  };

  const openAddDialog = (category: LicenseCategory) => {
    setSelectedCategory(category);
    setLicenseFormData({
      category,
      status: 'active',
      requiresAction: false,
      reminderDaysBefore: 30
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (license: BusinessLicense) => {
    setSelectedLicense(license);
    setLicenseFormData(license);
    setShowEditDialog(true);
  };

  const openDetailDialog = (license: BusinessLicense) => {
    setSelectedLicense(license);
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: "Active", className: "bg-green-100 text-green-800" },
      expired: { label: "Expired", className: "bg-red-100 text-red-800" },
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      'pending-renewal': { label: "Pending Renewal", className: "bg-orange-100 text-orange-800" },
      suspended: { label: "Suspended", className: "bg-gray-100 text-gray-800" }
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    return differenceInDays(parseISO(expiryDate), new Date());
  };

  const getExpiryAlert = (license: BusinessLicense) => {
    const daysUntil = getDaysUntilExpiry(license.expiryDate);
    
    if (daysUntil < 0) {
      return { color: 'red', message: `Expired ${Math.abs(daysUntil)} days ago`, urgent: true };
    } else if (daysUntil <= 30) {
      return { color: 'red', message: `Expires in ${daysUntil} days`, urgent: true };
    } else if (daysUntil <= 60) {
      return { color: 'orange', message: `Expires in ${daysUntil} days`, urgent: false };
    } else if (daysUntil <= 90) {
      return { color: 'yellow', message: `Expires in ${daysUntil} days`, urgent: false };
    }
    
    return null;
  };

  // Filter licenses by category and search
  const getFilteredLicenses = (category: LicenseCategory) => {
    return licenses.filter(license => {
      const matchesCategory = license.category === category;
      const matchesSearch = searchQuery === '' || 
        license.licenseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        license.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        license.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || license.status === statusFilter;
      
      return matchesCategory && matchesSearch && matchesStatus;
    });
  };

  // Get statistics for a category
  const getCategoryStats = (category: LicenseCategory) => {
    const categoryLicenses = licenses.filter(l => l.category === category);
    const active = categoryLicenses.filter(l => l.status === 'active').length;
    const expiringSoon = categoryLicenses.filter(l => {
      const days = getDaysUntilExpiry(l.expiryDate);
      return days >= 0 && days <= 60;
    }).length;
    const expired = categoryLicenses.filter(l => l.status === 'expired' || getDaysUntilExpiry(l.expiryDate) < 0).length;
    
    return { total: categoryLicenses.length, active, expiringSoon, expired };
  };

  // Get all expiring licenses across categories
  const getExpiringLicenses = () => {
    return licenses.filter(license => {
      const days = getDaysUntilExpiry(license.expiryDate);
      return days >= 0 && days <= 60;
    }).sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));
  };

  const expiringLicenses = getExpiringLicenses();

  const CategoryCard = ({ category }: { category: LicenseCategory }) => {
    const categoryInfo = LICENSE_CATEGORIES[category];
    const stats = getCategoryStats(category);
    const Icon = categoryInfo.icon;
    
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory(category)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${categoryInfo.color}-100`}>
                <Icon className={`h-5 w-5 text-${categoryInfo.color}-600`} />
              </div>
              <div>
                <CardTitle className="text-base">{categoryInfo.name}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {stats.total} license{stats.total !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            {(stats.expiringSoon > 0 || stats.expired > 0) && (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground mb-3">{categoryInfo.description}</div>
          <div className="text-xs text-muted-foreground mb-3 italic">
            <span className="font-medium">Examples:</span> {categoryInfo.examples}
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>{stats.active} Active</span>
            </div>
            {stats.expiringSoon > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-600" />
                <span>{stats.expiringSoon} Expiring Soon</span>
              </div>
            )}
            {stats.expired > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span>{stats.expired} Expired</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const LicenseTable = ({ category }: { category: LicenseCategory }) => {
    const filteredLicenses = getFilteredLicenses(category);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{LICENSE_CATEGORIES[category].name}</h3>
            <p className="text-sm text-muted-foreground">{filteredLicenses.length} licenses</p>
          </div>
          <Button onClick={() => openAddDialog(category)}>
            <Plus className="h-4 w-4 mr-2" />
            Add License
          </Button>
        </div>

        {filteredLicenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p>No licenses in this category yet</p>
              <Button variant="outline" className="mt-4" onClick={() => openAddDialog(category)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First License
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Name</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license) => {
                    const expiryAlert = getExpiryAlert(license);
                    
                    return (
                      <TableRow key={license.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{license.licenseName}</div>
                            {license.licenseType && (
                              <div className="text-xs text-muted-foreground">{license.licenseType}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{license.licenseNumber}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{license.jurisdiction}</div>
                            {license.issuingAuthority && (
                              <div className="text-xs text-muted-foreground">{license.issuingAuthority}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{format(parseISO(license.expiryDate), 'MMM d, yyyy')}</div>
                            {expiryAlert && (
                              <div className={`text-xs text-${expiryAlert.color}-600 flex items-center gap-1 mt-1`}>
                                {expiryAlert.urgent && <AlertCircle className="h-3 w-3" />}
                                {expiryAlert.message}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(license.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailDialog(license)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(license)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLicense(license.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Form fields JSX for reuse in dialogs
  const licenseFormFieldsJSX = (
    <div className="space-y-4">
      <div>
        <Label>License Name *</Label>
        <Input
          value={licenseFormData.licenseName || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseName: e.target.value })}
          placeholder="e.g., EIN Federal Tax ID"
        />
      </div>

      <div>
        <Label>License Type</Label>
        <Input
          value={licenseFormData.licenseType || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseType: e.target.value })}
          placeholder="e.g., Federal Tax Registration"
        />
      </div>

      <div>
        <Label>License Number *</Label>
        <Input
          value={licenseFormData.licenseNumber || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseNumber: e.target.value })}
          placeholder="e.g., 12-3456789"
        />
      </div>

      <div>
        <Label>Jurisdiction *</Label>
        <Input
          value={licenseFormData.jurisdiction || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, jurisdiction: e.target.value })}
          placeholder="e.g., United States, Virginia, Fairfax County"
        />
      </div>

      <div>
        <Label>Issuing Authority</Label>
        <Input
          value={licenseFormData.issuingAuthority || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, issuingAuthority: e.target.value })}
          placeholder="e.g., IRS, Virginia SCC"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Issue Date</Label>
          <Input
            type="date"
            value={licenseFormData.issueDate || ''}
            onChange={(e) => setLicenseFormData({ ...licenseFormData, issueDate: e.target.value })}
          />
        </div>
        <div>
          <Label>Expiry Date *</Label>
          <Input
            type="date"
            value={licenseFormData.expiryDate || ''}
            onChange={(e) => setLicenseFormData({ ...licenseFormData, expiryDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Renewal Frequency</Label>
        <Select
          value={licenseFormData.renewalFrequency || 'annual'}
          onValueChange={(v) => setLicenseFormData({ ...licenseFormData, renewalFrequency: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="biannual">Biannual</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="biennial">Biennial</SelectItem>
            <SelectItem value="triennial">Triennial</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Status</Label>
        <Select
          value={licenseFormData.status || 'active'}
          onValueChange={(v) => setLicenseFormData({ ...licenseFormData, status: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pending-renewal">Pending Renewal</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fee</Label>
          <Input
            type="number"
            step="0.01"
            value={licenseFormData.fee || ''}
            onChange={(e) => setLicenseFormData({ ...licenseFormData, fee: parseFloat(e.target.value) })}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>Renewal Fee</Label>
          <Input
            type="number"
            step="0.01"
            value={licenseFormData.renewalFee || ''}
            onChange={(e) => setLicenseFormData({ ...licenseFormData, renewalFee: parseFloat(e.target.value) })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <Label>Portal Link</Label>
        <Input
          type="url"
          value={licenseFormData.portalLink || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, portalLink: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div>
        <Label>Responsible Owner</Label>
        <Input
          value={licenseFormData.responsibleOwner || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, responsibleOwner: e.target.value })}
          placeholder="Enter name"
        />
      </div>

      <div>
        <Label>Reminder (Days Before Expiry)</Label>
        <Input
          type="number"
          value={licenseFormData.reminderDaysBefore || 30}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, reminderDaysBefore: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={licenseFormData.notes || ''}
          onChange={(e) => setLicenseFormData({ ...licenseFormData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl mb-1">Business Licensing & Compliance</h2>
        <p className="text-muted-foreground">
          Manage licenses and registrations organized by category
        </p>
      </div>

      {/* Alerts for Expiring Licenses */}
      {expiringLicenses.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            You have {expiringLicenses.length} license{expiringLicenses.length !== 1 ? 's' : ''} expiring within 60 days.
            <div className="mt-2 space-y-1">
              {expiringLicenses.slice(0, 3).map(license => {
                const days = getDaysUntilExpiry(license.expiryDate);
                return (
                  <div key={license.id} className="text-sm flex items-center justify-between">
                    <span>{license.licenseName} - {license.jurisdiction}</span>
                    <span className="font-medium">{days} days</span>
                  </div>
                );
              })}
              {expiringLicenses.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  And {expiringLicenses.length - 3} more...
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search licenses by name, number, or jurisdiction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending-renewal">Pending Renewal</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="federal">Federal</TabsTrigger>
          <TabsTrigger value="client_state">Client State</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(LICENSE_CATEGORIES) as LicenseCategory[]).map(category => (
              <CategoryCard key={category} category={category} />
            ))}
          </div>

          {/* Category Information Table */}
          <Card>
            <CardHeader>
              <CardTitle>License Categories</CardTitle>
              <CardDescription>Detailed information about each category</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Examples</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Object.entries(LICENSE_CATEGORIES) as [LicenseCategory, typeof LICENSE_CATEGORIES[LicenseCategory]][]).map(([key, category]) => {
                    const Icon = category.icon;
                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{category.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{category.examples}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category-specific tabs */}
        {(Object.keys(LICENSE_CATEGORIES) as LicenseCategory[]).map(category => (
          <TabsContent key={category} value={category}>
            <LicenseTable category={category} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Add License Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New License - {LICENSE_CATEGORIES[selectedCategory].name}</DialogTitle>
            <DialogDescription>
              {LICENSE_CATEGORIES[selectedCategory].description}
            </DialogDescription>
          </DialogHeader>
          {licenseFormFieldsJSX}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLicense}>
              Add License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit License Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
            <DialogDescription>
              Update license information
            </DialogDescription>
          </DialogHeader>
          {licenseFormFieldsJSX}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLicense}>
              Update License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Detail Dialog */}
      {selectedLicense && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedLicense.licenseName}</DialogTitle>
              <DialogDescription>
                {LICENSE_CATEGORIES[selectedLicense.category].name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p className="font-medium font-mono">{selectedLicense.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedLicense.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdiction</p>
                  <p className="font-medium">{selectedLicense.jurisdiction}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issuing Authority</p>
                  <p className="font-medium">{selectedLicense.issuingAuthority || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{format(parseISO(selectedLicense.issueDate), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">{format(parseISO(selectedLicense.expiryDate), 'MMM d, yyyy')}</p>
                </div>
                {selectedLicense.fee && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fee</p>
                    <p className="font-medium">${selectedLicense.fee.toFixed(2)}</p>
                  </div>
                )}
                {selectedLicense.responsibleOwner && (
                  <div>
                    <p className="text-sm text-muted-foreground">Responsible Owner</p>
                    <p className="font-medium">{selectedLicense.responsibleOwner}</p>
                  </div>
                )}
              </div>

              {selectedLicense.portalLink && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Portal Link</p>
                  <a
                    href={selectedLicense.portalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {selectedLicense.portalLink}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {selectedLicense.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedLicense.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowDetailDialog(false);
                openEditDialog(selectedLicense);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit License
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
