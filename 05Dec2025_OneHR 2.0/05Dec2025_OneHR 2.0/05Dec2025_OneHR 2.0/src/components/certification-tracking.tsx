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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { 
  AlertCircle, Award, CheckCircle2, Clock, Plus, Edit, Trash2, 
  Search, Filter, Calendar, Bell, FileText, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';

const ONBOARDING_API_URL = API_ENDPOINTS.EMPL_ONBORDING;
const LICENSING_API_URL = API_ENDPOINTS.LICENSING;

interface Certification {
  id: string;
  employeeId?: string;
  employeeName?: string;
  certificationType: string;
  certificationName?: string;
  issuingOrganization?: string;
  certificationNumber?: string;
  startDate: string;
  expirationDate: string;
  certificationRenewalDate: string;
  status: 'active' | 'expired' | 'expiring-soon' | 'pending-renewal' | 'archived';
  
  // Reminder settings
  reminderDays: number[]; // Array of days before expiration to send reminders (90, 60, 30, 10, 5, 1)
  lastReminderSent?: string;
  remindersSent?: Array<{
    date: string;
    daysBeforeExpiry: number;
  }>;
  
  // Additional fields
  attachmentUrl?: string;
  uploadedFileName?: string;
  notes?: string;
  requiresAction?: boolean;
  
  // Archive fields
  isArchived?: boolean;
  archivedDate?: string;
  archivedReason?: string;
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
}

export function CertificationTracking() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showArchivedCertifications, setShowArchivedCertifications] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Certification>>({
    status: 'active',
    reminderDays: [90, 60, 30, 10, 5, 1], // Default reminder days
    requiresAction: false
  });

  // Reminder day options
  const reminderDayOptions = [90, 60, 30, 10, 5, 1];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certificationsRes, employeesRes] = await Promise.all([
        fetch(`${LICENSING_API_URL}/certifications`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${ONBOARDING_API_URL}/employee`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        })
      ]);

      if (certificationsRes.ok) {
        const data = await certificationsRes.json();
        setCertifications(data.certifications || []);
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast.error('Failed to load certification data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('bucket', 'make-f8517b5b-certifications');
      
      const response = await fetch(`${LICENSING_API_URL}/upload-certification-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: uploadFormData
      });

      if (!response.ok) throw new Error('Failed to upload document');

      const data = await response.json();
      toast.success('Document uploaded successfully');
      return data.url;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const calculateStatus = (expirationDate: string): Certification['status'] => {
    const expiry = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return 'expired';
    } else if (daysUntilExpiry <= 30) {
      return 'expiring-soon';
    } else if (daysUntilExpiry <= 90) {
      return 'pending-renewal';
    } else {
      return 'active';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.certificationType || !formData.startDate || !formData.expirationDate || !formData.certificationRenewalDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let attachmentUrl = formData.attachmentUrl;
      let uploadedFileName = formData.uploadedFileName;

      // Upload file if selected
      if (selectedFile) {
        const url = await handleFileUpload(selectedFile);
        if (url) {
          attachmentUrl = url;
          uploadedFileName = selectedFile.name;
        }
      }

      // Calculate status based on expiration date
      const status = calculateStatus(formData.expirationDate!);

      const endpoint = editingCertification ? `/certifications/${editingCertification.id}` : '/certifications';
      const method = editingCertification ? 'PUT' : 'POST';

      const response = await fetch(`${LICENSING_API_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          status,
          attachmentUrl,
          uploadedFileName
        })
      });

      if (!response.ok) throw new Error('Failed to save certification');

      toast.success(editingCertification ? 'Certification updated successfully' : 'Certification created successfully');
      setShowAddDialog(false);
      setEditingCertification(null);
      setSelectedFile(null);
      setFormData({
        status: 'active',
        reminderDays: [90, 60, 30, 10, 5, 1],
        requiresAction: false
      });
      fetchData();
    } catch (error) {
      console.error('Error saving certification:', error);
      toast.error('Failed to save certification');
    }
  };

  const handleEdit = (certification: Certification) => {
    setEditingCertification(certification);
    setFormData(certification);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certification? Consider archiving instead.')) return;

    try {
      const response = await fetch(`${LICENSING_API_URL}/certifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (!response.ok) throw new Error('Failed to delete certification');

      toast.success('Certification deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast.error('Failed to delete certification');
    }
  };

  const handleArchive = async (id: string) => {
    const reason = prompt('Reason for archiving this certification?');
    if (!reason) return;

    try {
      const certification = certifications.find(c => c.id === id);
      if (!certification) return;

      const response = await fetch(`${LICENSING_API_URL}/certifications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...certification,
          status: 'archived',
          isArchived: true,
          archivedDate: new Date().toISOString(),
          archivedReason: reason
        })
      });

      if (!response.ok) throw new Error('Failed to archive certification');

      toast.success('Certification archived successfully');
      fetchData();
    } catch (error) {
      console.error('Error archiving certification:', error);
      toast.error('Failed to archive certification');
    }
  };

  const handleReminderDayToggle = (day: number, checked: boolean) => {
    setFormData(prev => {
      const reminderDays = prev.reminderDays || [];
      if (checked) {
        return { ...prev, reminderDays: [...reminderDays, day].sort((a, b) => b - a) };
      } else {
        return { ...prev, reminderDays: reminderDays.filter(d => d !== day) };
      }
    });
  };

  // Filter certifications
  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = searchTerm === '' || 
      (cert.certificationType && cert.certificationType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cert.certificationName && cert.certificationName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cert.employeeName && cert.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cert.issuingOrganization && cert.issuingOrganization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    const matchesArchiveFilter = showArchivedCertifications || cert.status !== 'archived';
    
    return matchesSearch && matchesStatus && matchesArchiveFilter;
  });

  // Calculate statistics
  const activeLicensesOnly = certifications.filter(c => c.status !== 'archived');
  const archivedCertifications = certifications.filter(c => c.status === 'archived');
  const activeCertifications = activeLicensesOnly.filter(c => c.status === 'active').length;
  const expiringSoon = activeLicensesOnly.filter(c => c.status === 'expiring-soon').length;
  const expired = activeLicensesOnly.filter(c => c.status === 'expired').length;
  const pendingRenewal = activeLicensesOnly.filter(c => c.status === 'pending-renewal').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'expiring-soon': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'pending-renewal': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expirationDate: string) => {
    const expiry = new Date(expirationDate);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading certifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Certification Tracking</h1>
          <p className="text-gray-500">
            Manage employee certifications, track renewals, and set up automatic reminders
          </p>
        </div>
        <Button onClick={() => {
          setEditingCertification(null);
          setFormData({
            status: 'active',
            reminderDays: [90, 60, 30, 10, 5, 1],
            requiresAction: false
          });
          setShowAddDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </div>

      {/* Alerts */}
      {(expired > 0 || expiringSoon > 0) && (
        <div className="space-y-3">
          {expired > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Critical: Expired Certifications</AlertTitle>
              <AlertDescription className="text-red-700">
                {expired} certification(s) have expired and require immediate renewal
              </AlertDescription>
            </Alert>
          )}
          {expiringSoon > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Warning: Expiring Soon</AlertTitle>
              <AlertDescription className="text-orange-700">
                {expiringSoon} certification(s) expiring within 30 days
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="certifications">
            All Certifications ({activeLicensesOnly.length})
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Expiring Soon ({expiringSoon})
          </TabsTrigger>
          <TabsTrigger value="archive">
            Archive ({archivedCertifications.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Help Text */}
          <Alert className="bg-blue-50 border-blue-200">
            <Filter className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Quick Filters</AlertTitle>
            <AlertDescription className="text-blue-700">
              Click any status card below to filter certifications by that status
            </AlertDescription>
          </Alert>

          {/* Statistics Cards - Interactive Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className={`border cursor-pointer transition-all duration-200 hover:shadow-md ${
                filterStatus === 'active' 
                  ? 'border-green-500 shadow-sm ring-2 ring-green-200 bg-green-50/50' 
                  : 'border-border/40 hover:border-green-300'
              }`}
              onClick={() => {
                setFilterStatus(filterStatus === 'active' ? 'all' : 'active');
                setActiveTab('certifications');
                toast.info(filterStatus === 'active' ? 'Showing all certifications' : 'Filtered to Active certifications');
              }}
              title={filterStatus === 'active' ? 'Click to clear filter' : 'Click to filter Active certifications'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Active</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCertifications}</div>
                <p className="text-xs text-gray-500 mt-1">Current certifications</p>
                {filterStatus === 'active' && (
                  <Badge variant="outline" className="mt-2 text-xs bg-green-100 text-green-700 border-green-300">
                    Active Filter
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card 
              className={`border cursor-pointer transition-all duration-200 hover:shadow-md ${
                filterStatus === 'pending-renewal' 
                  ? 'border-amber-500 shadow-sm ring-2 ring-amber-200 bg-amber-50/50' 
                  : 'border-border/40 hover:border-amber-300'
              }`}
              onClick={() => {
                setFilterStatus(filterStatus === 'pending-renewal' ? 'all' : 'pending-renewal');
                setActiveTab('certifications');
                toast.info(filterStatus === 'pending-renewal' ? 'Showing all certifications' : 'Filtered to Pending Renewal certifications');
              }}
              title={filterStatus === 'pending-renewal' ? 'Click to clear filter' : 'Click to filter Pending Renewal certifications'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Pending Renewal</CardTitle>
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRenewal}</div>
                <p className="text-xs text-gray-500 mt-1">Within 90 days</p>
                {filterStatus === 'pending-renewal' && (
                  <Badge variant="outline" className="mt-2 text-xs bg-amber-100 text-amber-700 border-amber-300">
                    Active Filter
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card 
              className={`border cursor-pointer transition-all duration-200 hover:shadow-md ${
                filterStatus === 'expiring-soon' 
                  ? 'border-orange-500 shadow-sm ring-2 ring-orange-200 bg-orange-50/50' 
                  : 'border-border/40 hover:border-orange-300'
              }`}
              onClick={() => {
                setFilterStatus(filterStatus === 'expiring-soon' ? 'all' : 'expiring-soon');
                setActiveTab('certifications');
                toast.info(filterStatus === 'expiring-soon' ? 'Showing all certifications' : 'Filtered to Expiring Soon certifications');
              }}
              title={filterStatus === 'expiring-soon' ? 'Click to clear filter' : 'Click to filter Expiring Soon certifications'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Expiring Soon</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiringSoon}</div>
                <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
                {filterStatus === 'expiring-soon' && (
                  <Badge variant="outline" className="mt-2 text-xs bg-orange-100 text-orange-700 border-orange-300">
                    Active Filter
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card 
              className={`border cursor-pointer transition-all duration-200 hover:shadow-md ${
                filterStatus === 'expired' 
                  ? 'border-red-500 shadow-sm ring-2 ring-red-200 bg-red-50/50' 
                  : 'border-border/40 hover:border-red-300'
              }`}
              onClick={() => {
                setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired');
                setActiveTab('certifications');
                toast.info(filterStatus === 'expired' ? 'Showing all certifications' : 'Filtered to Expired certifications');
              }}
              title={filterStatus === 'expired' ? 'Click to clear filter' : 'Click to filter Expired certifications'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Expired</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expired}</div>
                <p className="text-xs text-gray-500 mt-1">Needs immediate action</p>
                {filterStatus === 'expired' && (
                  <Badge variant="outline" className="mt-2 text-xs bg-red-100 text-red-700 border-red-300">
                    Active Filter
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Certifications</CardTitle>
              <CardDescription>Latest certification records added to the system</CardDescription>
            </CardHeader>
            <CardContent>
              {activeLicensesOnly.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No certifications found</p>
                  <p className="text-sm">Click "Add Certification" to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Certification Type</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Days Until Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLicensesOnly.slice(0, 5).map((cert) => {
                      const daysUntil = getDaysUntilExpiry(cert.expirationDate);
                      return (
                        <TableRow key={cert.id}>
                          <TableCell>{cert.employeeName || 'General'}</TableCell>
                          <TableCell>{cert.certificationType}</TableCell>
                          <TableCell>{formatDate(cert.expirationDate)}</TableCell>
                          <TableCell>
                            <span className={daysUntil < 0 ? 'text-red-600' : daysUntil <= 30 ? 'text-orange-600' : 'text-gray-600'}>
                              {daysUntil < 0 ? `${Math.abs(daysUntil)} days ago` : `${daysUntil} days`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(cert.status)}>
                              {cert.status.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(cert)}
                                title="Edit certification"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(cert.id)}
                                title="Archive certification"
                              >
                                <FileText className="h-4 w-4 text-gray-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(cert.id)}
                                title="Delete certification"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          {/* Active Filter Indicator */}
          {filterStatus !== 'all' && (
            <Alert className="bg-blue-50 border-blue-200">
              <Filter className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Active Filter</AlertTitle>
              <AlertDescription className="text-blue-700 flex items-center justify-between">
                <span>
                  Showing only <strong>{filterStatus.replace('-', ' ')}</strong> certifications ({filteredCertifications.length} results)
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFilterStatus('all');
                    toast.success('Filter cleared - showing all certifications');
                  }}
                  className="ml-4 bg-white hover:bg-blue-100 text-blue-700 border-blue-300"
                >
                  Clear Filter
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search certifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className={`w-48 ${filterStatus !== 'all' ? 'border-blue-400 ring-2 ring-blue-200' : ''}`}>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending-renewal">Pending Renewal</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Certifications Table */}
          <Card>
            <CardContent className="pt-6">
              {filteredCertifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No certifications found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Certification Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Days Until Expiry</TableHead>
                      <TableHead>Reminders</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertifications.map((cert) => {
                      const daysUntil = getDaysUntilExpiry(cert.expirationDate);
                      return (
                        <TableRow key={cert.id}>
                          <TableCell>{cert.employeeName || 'General'}</TableCell>
                          <TableCell>
                            <div>
                              <div>{cert.certificationType}</div>
                              {cert.certificationName && (
                                <div className="text-xs text-gray-500">{cert.certificationName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(cert.startDate)}</TableCell>
                          <TableCell>{formatDate(cert.expirationDate)}</TableCell>
                          <TableCell>{formatDate(cert.certificationRenewalDate)}</TableCell>
                          <TableCell>
                            <span className={daysUntil < 0 ? 'text-red-600' : daysUntil <= 30 ? 'text-orange-600' : 'text-gray-600'}>
                              {daysUntil < 0 ? `${Math.abs(daysUntil)} days ago` : `${daysUntil} days`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Bell className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {cert.reminderDays?.length || 0} set
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(cert.status)}>
                              {cert.status.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(cert)}
                                title="Edit certification"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(cert.id)}
                                title="Archive certification"
                              >
                                <FileText className="h-4 w-4 text-gray-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(cert.id)}
                                title="Delete certification"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiring Soon Tab */}
        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certifications Expiring Soon</CardTitle>
              <CardDescription>Certifications that require attention within the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {activeLicensesOnly.filter(c => c.status === 'expiring-soon').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-300" />
                  <p>No certifications expiring soon</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Certification Type</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLicensesOnly
                      .filter(c => c.status === 'expiring-soon')
                      .sort((a, b) => getDaysUntilExpiry(a.expirationDate) - getDaysUntilExpiry(b.expirationDate))
                      .map((cert) => {
                        const daysUntil = getDaysUntilExpiry(cert.expirationDate);
                        return (
                          <TableRow key={cert.id}>
                            <TableCell>{cert.employeeName || 'General'}</TableCell>
                            <TableCell>
                              <div>
                                <div>{cert.certificationType}</div>
                                {cert.certificationName && (
                                  <div className="text-xs text-gray-500">{cert.certificationName}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(cert.expirationDate)}</TableCell>
                            <TableCell>
                              <span className="text-orange-600 font-medium">
                                {daysUntil} days
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(cert)}
                                  title="Edit certification"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchive(cert.id)}
                                  title="Archive certification"
                                >
                                  <FileText className="h-4 w-4 text-gray-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(cert.id)}
                                  title="Delete certification"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Archived Certifications</CardTitle>
              <CardDescription>Previously archived certification records</CardDescription>
            </CardHeader>
            <CardContent>
              {archivedCertifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No archived certifications</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Certification Type</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedCertifications.map((cert) => (
                      <TableRow key={cert.id} className="opacity-60">
                        <TableCell>{cert.employeeName || 'General'}</TableCell>
                        <TableCell>
                          <div>
                            <div>{cert.certificationType}</div>
                            {cert.certificationName && (
                              <div className="text-xs text-gray-500">{cert.certificationName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(cert.expirationDate)}</TableCell>
                        <TableCell>
                          {cert.archivedDate ? formatDate(cert.archivedDate) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {cert.archivedReason || 'No reason provided'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cert.id)}
                            title="Permanently delete certification"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCertification ? 'Edit Certification' : 'Add New Certification'}
            </DialogTitle>
            <DialogDescription>
              Track certification details, expiration dates, and set up automatic renewal reminders
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee (Optional)</Label>
              <Select
                value={formData.employeeId || 'general'}
                onValueChange={(value) => {
                  if (value === 'general') {
                    setFormData({ ...formData, employeeId: undefined, employeeName: undefined });
                  } else {
                    const employee = employees.find(e => e.id === value);
                    setFormData({ 
                      ...formData, 
                      employeeId: value,
                      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : undefined
                    });
                  }
                }}
              >
                <SelectTrigger id="employeeId">
                  <SelectValue placeholder="Select employee or leave as general" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (Not employee-specific)</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Certification Type */}
            <div className="space-y-2">
              <Label htmlFor="certificationType">Certification Type *</Label>
              <Input
                id="certificationType"
                value={formData.certificationType || ''}
                onChange={(e) => setFormData({ ...formData, certificationType: e.target.value })}
                placeholder="e.g., PMP, CPA, SHRM-CP, CPR"
                required
              />
            </div>

            {/* Certification Name */}
            <div className="space-y-2">
              <Label htmlFor="certificationName">Certification Name (Optional)</Label>
              <Input
                id="certificationName"
                value={formData.certificationName || ''}
                onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                placeholder="Full certification name"
              />
            </div>

            {/* Issuing Organization */}
            <div className="space-y-2">
              <Label htmlFor="issuingOrganization">Issuing Organization (Optional)</Label>
              <Input
                id="issuingOrganization"
                value={formData.issuingOrganization || ''}
                onChange={(e) => setFormData({ ...formData, issuingOrganization: e.target.value })}
                placeholder="e.g., PMI, AICPA, SHRM"
              />
            </div>

            {/* Certification Number */}
            <div className="space-y-2">
              <Label htmlFor="certificationNumber">Certification Number (Optional)</Label>
              <Input
                id="certificationNumber"
                value={formData.certificationNumber || ''}
                onChange={(e) => setFormData({ ...formData, certificationNumber: e.target.value })}
                placeholder="Certification ID or number"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date *</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate || ''}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificationRenewalDate">Certification Renewal Date *</Label>
                <Input
                  id="certificationRenewalDate"
                  type="date"
                  value={formData.certificationRenewalDate || ''}
                  onChange={(e) => setFormData({ ...formData, certificationRenewalDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="space-y-2">
              <Label>Reminder Settings</Label>
              <p className="text-xs text-gray-500 mb-2">
                Select when you want to receive reminders before the certification expires
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {reminderDayOptions.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`reminder-${day}`}
                      checked={formData.reminderDays?.includes(day) || false}
                      onCheckedChange={(checked) => handleReminderDayToggle(day, checked as boolean)}
                    />
                    <Label htmlFor={`reminder-${day}`} className="cursor-pointer">
                      {day} days before
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Certification Document (Optional)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {formData.uploadedFileName && (
                <p className="text-xs text-gray-500">
                  Current file: {formData.uploadedFileName}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this certification"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingCertification(null);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploadingFile}>
                {uploadingFile ? 'Uploading...' : editingCertification ? 'Update Certification' : 'Add Certification'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
