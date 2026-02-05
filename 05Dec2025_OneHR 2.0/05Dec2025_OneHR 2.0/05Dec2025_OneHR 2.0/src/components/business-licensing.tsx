import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  AlertCircle, Building2, CheckCircle2, Clock, Plus, Edit, Trash2, 
  FileText, MapPin, Shield, Search, Filter, Download, Upload, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';

const API_URL = API_ENDPOINTS.LICENSING;
const ONBOARDING_API_URL = API_ENDPOINTS.EMPL_ONBORDING;
const CLIENT_API_URL = API_ENDPOINTS.CLIENT;

interface BusinessLicense {
  id: string;
  licenseName: string;
  licenseType: string;
  licenseNumber: string;
  jurisdictionLevel: 'federal' | 'state' | 'county' | 'local' | 'client-state';
  jurisdiction: string; // e.g., "United States", "California", "Los Angeles County", "San Francisco"
  issuingAuthority: string;
  portalLink?: string; // Portal/website link for renewals and management
  issueDate: string;
  expiryDate: string;
  renewalDate?: string;
  renewalFrequency?: 'annual' | 'biannual' | 'quarterly' | 'biennial' | 'triennial' | 'other';
  lastRenewalDate?: string;
  nextRenewalDueDate?: string;
  status: 'active' | 'expired' | 'pending' | 'pending-renewal' | 'suspended' | 'not-required' | 'archived';
  complianceType: string; // e.g., "Tax Registration", "Professional License", "Business Permit"
  relatedTo: 'company' | 'employee-location' | 'client-location' | 'both';
  linkedStates?: string[]; // For employee/client states
  linkedCounties?: string[];
  linkedCities?: string[];
  linkedEmployees?: string[];
  linkedClients?: string[];
  responsibleDepartment?: string; // e.g., "HR", "Legal", "Finance", "Compliance"
  responsibleOwner?: string; // Person responsible for tracking/renewal
  fee?: number;
  renewalFee?: number;
  documentUrl?: string; // Secure storage URL for PDF certificates
  uploadedFileName?: string; // Original filename of uploaded document
  notes?: string;
  requiresAction: boolean;
  
  // Annual reports & corporate compliance
  isAnnualReport?: boolean;
  annualReportDueDate?: string;
  annualReportFiledDate?: string;
  registeredAgent?: string;
  registeredAgentAddress?: string;
  goodStandingStatus?: 'compliant' | 'non-compliant' | 'pending';
  goodStandingVerifiedDate?: string;
  
  // Renewal tracking
  autoRenewal?: boolean;
  renewalReminderSent?: boolean;
  renewalReminderDate?: string;
  renewalHistory?: Array<{
    date: string;
    renewalFee: number;
    notes: string;
  }>;
  
  // Archival
  isArchived?: boolean;
  archivedDate?: string;
  archivedReason?: string;
  replacedByLicenseId?: string;
  
  createdAt: string;
  updatedAt?: string;
}

interface LicenseRequirement {
  id: string;
  jurisdiction: string;
  jurisdictionLevel: string;
  requiredLicenseTypes: string[];
  reason: string;
  detectedDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  triggeredBy: 'employee' | 'client' | 'manual';
  triggeredById?: string;
  triggeredByName?: string;
}

interface JurisdictionSummary {
  level: string;
  name: string;
  totalLicenses: number;
  activeLicenses: number;
  expiringLicenses: number;
  expiredLicenses: number;
  complianceStatus: 'compliant' | 'warning' | 'critical';
}

export function BusinessLicensing() {
  const [licenses, setLicenses] = useState<BusinessLicense[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<LicenseRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRequirementsDialog, setShowRequirementsDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<BusinessLicense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [showArchivedLicenses, setShowArchivedLicenses] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<BusinessLicense>>({
    jurisdictionLevel: 'federal',
    relatedTo: 'company',
    status: 'active',
    requiresAction: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [licensesRes, employeesRes, clientsRes, requirementsRes] = await Promise.all([
        fetch(`${API_URL}/business-licenses`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${ONBOARDING_API_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${CLIENT_API_URL}/clients`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/license-requirements`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        })
      ]);

      if (licensesRes.ok) {
        const data = await licensesRes.json();
        setLicenses(data.licenses || []);
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.employees || []);
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }

      if (requirementsRes.ok) {
        const data = await requirementsRes.json();
        setRequirements(data.requirements || []);
      }

      // Auto-detect new requirements after loading data
      detectNewRequirements();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load licensing data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect licensing requirements when expanding to new jurisdictions
  const detectNewRequirements = async () => {
    const newRequirements: LicenseRequirement[] = [];
    
    // Get unique jurisdictions from employees
    const employeeStates = [...new Set(employees.map(e => e.homeState).filter(Boolean))];
    const employeeCounties = [...new Set(employees.map(e => e.homeCounty).filter(Boolean))];
    const employeeCities = [...new Set(employees.map(e => e.homeCity).filter(Boolean))];
    
    // Get unique jurisdictions from clients
    const clientStates = [...new Set(clients.map(c => c.state).filter(Boolean))];
    const clientCounties = [...new Set(clients.map(c => c.county).filter(Boolean))];
    const clientCities = [...new Set(clients.map(c => c.city).filter(Boolean))];
    
    // Check employee states
    for (const state of employeeStates) {
      const hasStateLicenses = licenses.some(l => 
        l.jurisdiction.includes(state) && 
        l.jurisdictionLevel === 'state' &&
        l.status !== 'archived'
      );
      
      if (!hasStateLicenses) {
        const existingReq = requirements.find(r => 
          r.jurisdiction === state && r.status !== 'dismissed'
        );
        
        if (!existingReq) {
          newRequirements.push({
            id: crypto.randomUUID(),
            jurisdiction: state,
            jurisdictionLevel: 'state',
            requiredLicenseTypes: [
              'State Tax Withholding Account',
              'Unemployment Insurance Account',
              'Workers\' Compensation Policy',
              'State Business Registration'
            ],
            reason: `Employees detected in ${state}`,
            detectedDate: new Date().toISOString(),
            status: 'pending',
            triggeredBy: 'employee',
            triggeredByName: employees.find(e => e.homeState === state)?.firstName || 'Multiple employees'
          });
        }
      }
    }
    
    // Check client states
    for (const state of clientStates) {
      const hasClientStateLicenses = licenses.some(l => 
        l.jurisdiction.includes(state) && 
        (l.jurisdictionLevel === 'client-state' || l.jurisdictionLevel === 'state') &&
        l.status !== 'archived'
      );
      
      if (!hasClientStateLicenses) {
        const existingReq = requirements.find(r => 
          r.jurisdiction === state && r.status !== 'dismissed'
        );
        
        if (!existingReq) {
          newRequirements.push({
            id: crypto.randomUUID(),
            jurisdiction: state,
            jurisdictionLevel: 'client-state',
            requiredLicenseTypes: [
              'Foreign Qualification',
              'Sales Tax Registration',
              'Professional License (if applicable)'
            ],
            reason: `Client operations detected in ${state}`,
            detectedDate: new Date().toISOString(),
            status: 'pending',
            triggeredBy: 'client',
            triggeredByName: clients.find(c => c.state === state)?.companyName || 'Multiple clients'
          });
        }
      }
    }
    
    // Save new requirements to backend
    for (const req of newRequirements) {
      try {
        await fetch(`${API_URL}/license-requirements`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(req)
        });
      } catch (error) {
        console.error('Error creating license requirement:', error);
      }
    }
    
    if (newRequirements.length > 0) {
      setRequirements([...requirements, ...newRequirements]);
      toast.info(`${newRequirements.length} new licensing requirement(s) detected`);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true);
      
      // Create form data for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('bucket', 'make-f8517b5b-license-documents');
      
      const response = await fetch(`${API_URL}/upload-license-document`, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let documentUrl = formData.documentUrl;
      let uploadedFileName = formData.uploadedFileName;

      // Upload file if selected
      if (selectedFile) {
        const url = await handleFileUpload(selectedFile);
        if (url) {
          documentUrl = url;
          uploadedFileName = selectedFile.name;
        }
      }

      const endpoint = editingLicense ? `/business-licenses/${editingLicense.id}` : '/business-licenses';
      const method = editingLicense ? 'PUT' : 'POST';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          documentUrl,
          uploadedFileName
        })
      });

      if (!response.ok) throw new Error('Failed to save license');

      toast.success(editingLicense ? 'License updated successfully' : 'License created successfully');
      setShowAddDialog(false);
      setEditingLicense(null);
      setSelectedFile(null);
      setFormData({
        jurisdictionLevel: 'federal',
        relatedTo: 'company',
        status: 'active',
        requiresAction: false
      });
      fetchData();
    } catch (error) {
      console.error('Error saving license:', error);
      toast.error('Failed to save license');
    }
  };

  const handleEdit = (license: BusinessLicense) => {
    setEditingLicense(license);
    setFormData(license);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license? Consider archiving instead.')) return;

    try {
      console.log(`Deleting license: ${id}`);
      
      const response = await fetch(`${API_URL}/business-licenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.details || 'Failed to delete license');
      }

      toast.success('License and related records deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting license:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete license';
      toast.error(errorMessage);
    }
  };

  const handleArchive = async (id: string) => {
    const reason = prompt('Reason for archiving this license?');
    if (!reason) return;

    try {
      const license = licenses.find(l => l.id === id);
      if (!license) return;

      const response = await fetch(`${API_URL}/business-licenses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...license,
          status: 'archived',
          isArchived: true,
          archivedDate: new Date().toISOString(),
          archivedReason: reason
        })
      });

      if (!response.ok) throw new Error('Failed to archive license');

      toast.success('License archived successfully');
      fetchData();
    } catch (error) {
      console.error('Error archiving license:', error);
      toast.error('Failed to archive license');
    }
  };

  const handleRenew = async (id: string) => {
    try {
      const license = licenses.find(l => l.id === id);
      if (!license) return;

      const newExpiryDate = prompt('New expiry date (YYYY-MM-DD):', 
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      );
      
      if (!newExpiryDate) return;

      const renewalHistory = license.renewalHistory || [];
      renewalHistory.push({
        date: new Date().toISOString(),
        renewalFee: license.renewalFee || 0,
        notes: `Renewed until ${newExpiryDate}`
      });

      const response = await fetch(`${API_URL}/business-licenses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...license,
          status: 'active',
          lastRenewalDate: new Date().toISOString(),
          expiryDate: newExpiryDate,
          renewalHistory,
          renewalReminderSent: false
        })
      });

      if (!response.ok) throw new Error('Failed to renew license');

      toast.success('License renewed successfully');
      fetchData();
    } catch (error) {
      console.error('Error renewing license:', error);
      toast.error('Failed to renew license');
    }
  };

  const dismissRequirement = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/license-requirements/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'dismissed' })
      });

      if (!response.ok) throw new Error('Failed to dismiss requirement');

      toast.success('Requirement dismissed');
      fetchData();
    } catch (error) {
      console.error('Error dismissing requirement:', error);
      toast.error('Failed to dismiss requirement');
    }
  };

  // Calculate jurisdiction summaries
  const getJurisdictionSummaries = (): JurisdictionSummary[] => {
    const levels = ['federal', 'state', 'county', 'local', 'client-state'];
    return levels.map(level => {
      const levelLicenses = licenses.filter(l => l.jurisdictionLevel === level);
      const active = levelLicenses.filter(l => l.status === 'active').length;
      const expiring = levelLicenses.filter(l => {
        if (l.expiryDate) {
          const expiry = new Date(l.expiryDate);
          const today = new Date();
          const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil > 0 && daysUntil <= 90;
        }
        return false;
      }).length;
      const expired = levelLicenses.filter(l => l.status === 'expired').length;
      
      let complianceStatus: 'compliant' | 'warning' | 'critical' = 'compliant';
      if (expired > 0 || expiring > 3) complianceStatus = 'critical';
      else if (expiring > 0) complianceStatus = 'warning';

      return {
        level: level.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        name: level,
        totalLicenses: levelLicenses.length,
        activeLicenses: active,
        expiringLicenses: expiring,
        expiredLicenses: expired,
        complianceStatus
      };
    });
  };

  // Get unique jurisdictions across all levels
  const getUniqueJurisdictions = () => {
    const employeeStates = new Set(employees.map(e => e.homeState).filter(Boolean));
    const employeeCounties = new Set(employees.map(e => e.homeCounty).filter(Boolean));
    const employeeCities = new Set(employees.map(e => e.homeCity).filter(Boolean));
    
    const clientStates = new Set(clients.map(c => c.state).filter(Boolean));
    const clientCounties = new Set(clients.map(c => c.county).filter(Boolean));
    const clientCities = new Set(clients.map(c => c.city).filter(Boolean));

    return {
      states: Array.from(new Set([...employeeStates, ...clientStates])),
      counties: Array.from(new Set([...employeeCounties, ...clientCounties])),
      cities: Array.from(new Set([...employeeCities, ...clientCities]))
    };
  };

  // Filter licenses
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = searchTerm === '' || 
      (license.licenseName && license.licenseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (license.licenseNumber && license.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (license.jurisdiction && license.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (license.complianceType && license.complianceType.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = filterLevel === 'all' || license.jurisdictionLevel === filterLevel;
    const matchesStatus = filterStatus === 'all' || license.status === filterStatus;
    const matchesArchiveFilter = showArchivedLicenses || license.status !== 'archived';
    
    return matchesSearch && matchesLevel && matchesStatus && matchesArchiveFilter;
  });

  const pendingRequirements = requirements.filter(r => r.status === 'pending');
  const activeLicensesOnly = licenses.filter(l => l.status !== 'archived');
  const archivedLicenses = licenses.filter(l => l.status === 'archived');

  // Calculate alerts
  const expiringLicenses = licenses.filter(l => {
    if (l.expiryDate) {
      const expiry = new Date(l.expiryDate);
      const today = new Date();
      const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 90;
    }
    return false;
  });

  const expiredLicenses = licenses.filter(l => l.status === 'expired');
  const requiresActionCount = licenses.filter(l => l.requiresAction).length;

  const jurisdictionSummaries = getJurisdictionSummaries();
  const jurisdictions = getUniqueJurisdictions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending-renewal': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'suspended': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'not-required': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading licensing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Business Licensing & Compliance</h1>
          <p className="text-gray-500">
            Manage licenses, registrations, and compliance at Federal, State, County, Local, and Client State levels
          </p>
        </div>
        <Button onClick={() => {
          setEditingLicense(null);
          setFormData({
            jurisdictionLevel: 'federal',
            relatedTo: 'company',
            status: 'active',
            requiresAction: false
          });
          setShowAddDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add License
        </Button>
      </div>

      {/* Critical Alerts */}
      {(expiredLicenses.length > 0 || expiringLicenses.length > 0 || requiresActionCount > 0 || pendingRequirements.length > 0) && (
        <div className="space-y-3">
          {pendingRequirements.length > 0 && (
            <Alert className="border-purple-200 bg-purple-50">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-800">New Licensing Requirements Detected</AlertTitle>
              <AlertDescription className="text-purple-700">
                {pendingRequirements.length} new jurisdiction(s) require licensing setup
                <Button 
                  variant="link" 
                  className="ml-2 p-0 h-auto text-purple-800 underline"
                  onClick={() => setShowRequirementsDialog(true)}
                >
                  View Requirements
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {expiredLicenses.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Critical: Expired Licenses</AlertTitle>
              <AlertDescription className="text-red-700">
                {expiredLicenses.length} license(s) have expired and require immediate renewal
              </AlertDescription>
            </Alert>
          )}
          {expiringLicenses.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Warning: Expiring Soon</AlertTitle>
              <AlertDescription className="text-amber-700">
                {expiringLicenses.length} license(s) expiring within 90 days
              </AlertDescription>
            </Alert>
          )}
          {requiresActionCount > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Action Required</AlertTitle>
              <AlertDescription className="text-blue-700">
                {requiresActionCount} license(s) flagged for review or action
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="licenses">
            All Licenses ({activeLicensesOnly.length})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements ({pendingRequirements.length})
          </TabsTrigger>
          <TabsTrigger value="jurisdictions">By Jurisdiction</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="archive">
            Archive ({archivedLicenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Jurisdiction Level Summary */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-4">Licensing by Jurisdiction Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {jurisdictionSummaries.map((summary) => (
                <Card key={summary.name} className="border border-border/40">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{summary.level}</CardTitle>
                      <MapPin className={`h-4 w-4 ${getComplianceColor(summary.complianceStatus)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="font-medium">{summary.totalLicenses}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Active</span>
                        <span className="text-green-600 font-medium">{summary.activeLicenses}</span>
                      </div>
                      {summary.expiringLicenses > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Expiring</span>
                          <span className="text-amber-600 font-medium">{summary.expiringLicenses}</span>
                        </div>
                      )}
                      {summary.expiredLicenses > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Expired</span>
                          <span className="text-red-600 font-medium">{summary.expiredLicenses}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <Badge className={`${
                          summary.complianceStatus === 'compliant' ? 'bg-green-100 text-green-700' :
                          summary.complianceStatus === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        } w-full justify-center`}>
                          {summary.complianceStatus === 'compliant' ? 'Compliant' :
                           summary.complianceStatus === 'warning' ? 'Warning' : 'Critical'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Geographic Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">States Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900 mb-2">
                  {jurisdictions.states.length}
                </div>
                <p className="text-xs text-gray-500">
                  {jurisdictions.states.slice(0, 5).join(', ')}
                  {jurisdictions.states.length > 5 && ` +${jurisdictions.states.length - 5} more`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Counties Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900 mb-2">
                  {jurisdictions.counties.length}
                </div>
                <p className="text-xs text-gray-500">
                  {jurisdictions.counties.slice(0, 3).join(', ')}
                  {jurisdictions.counties.length > 3 && ` +${jurisdictions.counties.length - 3} more`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cities/Local Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-gray-900 mb-2">
                  {jurisdictions.cities.length}
                </div>
                <p className="text-xs text-gray-500">
                  {jurisdictions.cities.slice(0, 3).join(', ')}
                  {jurisdictions.cities.length > 3 && ` +${jurisdictions.cities.length - 3} more`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Licenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Licenses</CardTitle>
              <CardDescription>Latest licensing activities</CardDescription>
            </CardHeader>
            <CardContent>
              {licenses.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No licenses registered yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First License
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.slice(0, 5).map((license) => (
                      <TableRow key={license.id}>
                        <TableCell className="font-medium">{license.licenseName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {license.jurisdictionLevel ? license.jurisdictionLevel.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{license.jurisdiction || 'N/A'}</TableCell>
                        <TableCell>{license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(license.status)}>
                            {license.status ? license.status.replace('-', ' ') : 'Unknown'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Licenses Tab */}
        <TabsContent value="licenses" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search licenses, numbers, jurisdictions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="client-state">Client State</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pending-renewal">Pending Renewal</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="not-required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Licenses Table */}
          <Card>
            <CardHeader>
              <CardTitle>License Registry ({filteredLicenses.length})</CardTitle>
              <CardDescription>Complete list of all business licenses and registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLicenses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No licenses found matching your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>License #</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Jurisdiction</TableHead>
                        <TableHead>Dept/Owner</TableHead>
                        <TableHead>Renewal</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Docs</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLicenses.map((license) => {
                        const daysUntilExpiry = license.expiryDate ? Math.ceil(
                          (new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        ) : 0;
                        const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 90;

                        return (
                          <TableRow key={license.id}>
                            <TableCell className="font-medium">
                              {license.licenseName}
                              {license.requiresAction && (
                                <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700">
                                  Action Required
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">{license.complianceType}</TableCell>
                            <TableCell className="font-mono text-sm">{license.licenseNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {license.jurisdictionLevel ? license.jurisdictionLevel.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{license.jurisdiction || 'N/A'}</TableCell>
                            <TableCell className="text-sm">
                              {license.responsibleDepartment && (
                                <div className="text-gray-700">{license.responsibleDepartment}</div>
                              )}
                              {license.responsibleOwner && (
                                <div className="text-xs text-gray-500">{license.responsibleOwner}</div>
                              )}
                              {!license.responsibleDepartment && !license.responsibleOwner && (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {license.renewalFrequency ? (
                                <span className="capitalize">{license.renewalFrequency}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className={isExpiringSoon ? 'text-amber-600 font-medium' : ''}>
                                {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'N/A'}
                                {isExpiringSoon && (
                                  <span className="block text-xs">
                                    {daysUntilExpiry} days left
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(license.status)}>
                                {license.status ? license.status.replace('-', ' ') : 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {license.documentUrl && (
                                  <a
                                    href={license.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={license.uploadedFileName || 'View document'}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                )}
                                {license.portalLink && (
                                  <a
                                    href={license.portalLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open portal"
                                    className="text-purple-600 hover:text-purple-800"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                )}
                                {!license.documentUrl && !license.portalLink && (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(license)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchive(license.id)}
                                  title="Archive"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(license.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Jurisdiction Tab */}
        <TabsContent value="jurisdictions" className="space-y-6">
          {/* Federal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Federal Level
              </CardTitle>
              <CardDescription>National licenses and registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {licenses.filter(l => l.jurisdictionLevel === 'federal').length === 0 ? (
                <p className="text-gray-500 text-center py-4">No federal licenses registered</p>
              ) : (
                <div className="space-y-2">
                  {licenses.filter(l => l.jurisdictionLevel === 'federal').map(license => (
                    <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{license.licenseName}</p>
                        <p className="text-sm text-gray-500">{license.licenseNumber} • {license.complianceType}</p>
                      </div>
                      <Badge className={getStatusColor(license.status)}>{license.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* State Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                State Level
              </CardTitle>
              <CardDescription>State licenses across {jurisdictions.states.length} states</CardDescription>
            </CardHeader>
            <CardContent>
              {licenses.filter(l => l.jurisdictionLevel === 'state').length === 0 ? (
                <p className="text-gray-500 text-center py-4">No state licenses registered</p>
              ) : (
                <div className="space-y-4">
                  {jurisdictions.states.map(state => {
                    const stateLicenses = licenses.filter(l => 
                      l.jurisdictionLevel === 'state' && l.jurisdiction && l.jurisdiction.includes(state)
                    );
                    if (stateLicenses.length === 0) return null;
                    
                    return (
                      <div key={state}>
                        <h4 className="font-medium mb-2">{state}</h4>
                        <div className="space-y-2 ml-4">
                          {stateLicenses.map(license => (
                            <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{license.licenseName}</p>
                                <p className="text-sm text-gray-500">{license.licenseNumber} • {license.complianceType}</p>
                              </div>
                              <Badge className={getStatusColor(license.status)}>{license.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* County & Local */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  County Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                {licenses.filter(l => l.jurisdictionLevel === 'county').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No county licenses</p>
                ) : (
                  <div className="space-y-2">
                    {licenses.filter(l => l.jurisdictionLevel === 'county').map(license => (
                      <div key={license.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{license.licenseName}</p>
                        <p className="text-sm text-gray-500">{license.jurisdiction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-600" />
                  Local Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                {licenses.filter(l => l.jurisdictionLevel === 'local').length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No local licenses</p>
                ) : (
                  <div className="space-y-2">
                    {licenses.filter(l => l.jurisdictionLevel === 'local').map(license => (
                      <div key={license.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{license.licenseName}</p>
                        <p className="text-sm text-gray-500">{license.jurisdiction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Client State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-rose-600" />
                Client State Level
              </CardTitle>
              <CardDescription>Licenses required for client locations</CardDescription>
            </CardHeader>
            <CardContent>
              {licenses.filter(l => l.jurisdictionLevel === 'client-state').length === 0 ? (
                <p className="text-gray-500 text-center py-4">No client state licenses registered</p>
              ) : (
                <div className="space-y-2">
                  {licenses.filter(l => l.jurisdictionLevel === 'client-state').map(license => (
                    <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{license.licenseName}</p>
                        <p className="text-sm text-gray-500">{license.jurisdiction} • {license.complianceType}</p>
                      </div>
                      <Badge className={getStatusColor(license.status)}>{license.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Status Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Dashboard</CardTitle>
              <CardDescription>Overall compliance status across all jurisdictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jurisdictionSummaries.map(summary => (
                  <div key={summary.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{summary.level}</h4>
                      <Badge className={
                        summary.complianceStatus === 'compliant' ? 'bg-green-100 text-green-700' :
                        summary.complianceStatus === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {summary.complianceStatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="text-lg font-semibold">{summary.totalLicenses}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Active</p>
                        <p className="text-lg font-semibold text-green-600">{summary.activeLicenses}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expiring</p>
                        <p className="text-lg font-semibold text-amber-600">{summary.expiringLicenses}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expired</p>
                        <p className="text-lg font-semibold text-red-600">{summary.expiredLicenses}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>Required Actions</CardTitle>
              <CardDescription>Licenses requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {[...expiredLicenses, ...expiringLicenses].length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">All licenses are in good standing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...expiredLicenses, ...expiringLicenses].map(license => {
                    const daysUntilExpiry = Math.ceil(
                      (new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    const isExpired = daysUntilExpiry < 0;
                    
                    return (
                      <div key={license.id} className={`p-4 border rounded-lg ${
                        isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{license.licenseName}</h4>
                              <Badge variant="outline" className="text-xs">
                                {license.jurisdictionLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{license.jurisdiction}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              License #: {license.licenseNumber} • {license.complianceType}
                            </p>
                            <p className={`text-sm font-medium mt-2 ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                              {isExpired 
                                ? `Expired ${Math.abs(daysUntilExpiry)} days ago` 
                                : `Expires in ${daysUntilExpiry} days`
                              } • {new Date(license.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleRenew(license.id)}>
                            Renew Now
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Detected Licensing Requirements</CardTitle>
              <CardDescription>
                System-detected requirements when expanding into new jurisdictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequirements.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">All jurisdictions have appropriate licenses</p>
                  <p className="text-sm text-gray-400 mt-2">
                    New requirements will appear automatically when you add employees or clients in new states
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequirements.map((req) => (
                    <div key={req.id} className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{req.jurisdiction}</h4>
                            <Badge variant="outline" className="text-xs bg-white">
                              {req.jurisdictionLevel}
                            </Badge>
                            <Badge className="text-xs bg-purple-100 text-purple-700">
                              {req.triggeredBy === 'employee' ? 'Employee Location' : 'Client Location'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{req.reason}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Detected on {new Date(req.detectedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setFormData({
                                jurisdictionLevel: req.jurisdictionLevel as any,
                                jurisdiction: req.jurisdiction,
                                relatedTo: req.triggeredBy === 'employee' ? 'employee-location' : 'client-location',
                                status: 'active',
                                requiresAction: false
                              });
                              setShowAddDialog(true);
                            }}
                          >
                            Add License
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => dismissRequirement(req.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border border-purple-100 mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Recommended License Types:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {req.requiredLicenseTypes.map((type, idx) => (
                            <li key={idx}>{type}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>License verification across HR, Payroll, and Client modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Employee Onboarding Integration</p>
                    <p className="text-sm text-gray-500">Verifies state licenses before onboarding completion</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Client Onboarding Integration</p>
                    <p className="text-sm text-gray-500">Checks client-state compliance before engagement</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Payroll Integration</p>
                    <p className="text-sm text-gray-500">Validates tax registrations before payroll processing</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Accounting Integration</p>
                    <p className="text-sm text-gray-500">Tracks license fees and renewal costs</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical License Archive</CardTitle>
              <CardDescription>
                Archived and historical licenses maintained for compliance auditing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {archivedLicenses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No archived licenses</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Name</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedLicenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell className="font-medium">{license.licenseName}</TableCell>
                        <TableCell>{license.jurisdiction}</TableCell>
                        <TableCell className="font-mono text-sm">{license.licenseNumber}</TableCell>
                        <TableCell>
                          {license.archivedDate ? new Date(license.archivedDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {license.archivedReason || 'No reason provided'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const confirmed = confirm('Restore this license to active status?');
                              if (!confirmed) return;
                              
                              try {
                                await fetch(`${API_URL}/business-licenses/${license.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${getAccessToken() ?? ''}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    ...license,
                                    status: 'active',
                                    isArchived: false,
                                    archivedDate: undefined,
                                    archivedReason: undefined
                                  })
                                });
                                toast.success('License restored');
                                fetchData();
                              } catch (error) {
                                toast.error('Failed to restore license');
                              }
                            }}
                          >
                            Restore
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

      {/* Add/Edit License Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLicense ? 'Edit License' : 'Add New License'}</DialogTitle>
            <DialogDescription id="license-dialog-description">
              Register a new business license, registration, or compliance obligation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="licenseName">License Name *</Label>
                  <Input
                    id="licenseName"
                    required
                    value={formData.licenseName || ''}
                    onChange={(e) => setFormData({ ...formData, licenseName: e.target.value })}
                    placeholder="e.g., California State Tax Registration"
                  />
                </div>

                <div>
                  <Label htmlFor="licenseType">License Type *</Label>
                  <Input
                    id="licenseType"
                    required
                    value={formData.licenseType || ''}
                    onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                    placeholder="e.g., Business License"
                  />
                </div>

                <div>
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    required
                    value={formData.licenseNumber || ''}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="e.g., LIC-CA-123456"
                  />
                </div>
              </div>

              {/* Jurisdiction */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jurisdictionLevel">Jurisdiction Level *</Label>
                  <Select
                    value={formData.jurisdictionLevel}
                    onValueChange={(value: any) => setFormData({ ...formData, jurisdictionLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="federal">Federal</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="county">County</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="client-state">Client State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction Name *</Label>
                  <Input
                    id="jurisdiction"
                    required
                    value={formData.jurisdiction || ''}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                    placeholder="e.g., California, Los Angeles County"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complianceType">Compliance Type *</Label>
                  <Input
                    id="complianceType"
                    required
                    value={formData.complianceType || ''}
                    onChange={(e) => setFormData({ ...formData, complianceType: e.target.value })}
                    placeholder="e.g., Tax Registration, Professional License"
                  />
                </div>

                <div>
                  <Label htmlFor="issuingAuthority">Issuing Authority *</Label>
                  <Input
                    id="issuingAuthority"
                    required
                    value={formData.issuingAuthority || ''}
                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    placeholder="e.g., CA Dept of Revenue"
                  />
                </div>
              </div>

              {/* Portal Link */}
              <div>
                <Label htmlFor="portalLink">Portal/Website Link</Label>
                <Input
                  id="portalLink"
                  type="url"
                  value={formData.portalLink || ''}
                  onChange={(e) => setFormData({ ...formData, portalLink: e.target.value })}
                  placeholder="https://portal.example.gov/renewals"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    required
                    value={formData.issueDate || ''}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    required
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="renewalDate">Renewal Date</Label>
                  <Input
                    id="renewalDate"
                    type="date"
                    value={formData.renewalDate || ''}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Renewal Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="renewalFrequency">Renewal Frequency</Label>
                  <Select
                    value={formData.renewalFrequency}
                    onValueChange={(value: any) => setFormData({ ...formData, renewalFrequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual (Every Year)</SelectItem>
                      <SelectItem value="biannual">Biannual (Twice a Year)</SelectItem>
                      <SelectItem value="quarterly">Quarterly (Every 3 Months)</SelectItem>
                      <SelectItem value="biennial">Biennial (Every 2 Years)</SelectItem>
                      <SelectItem value="triennial">Triennial (Every 3 Years)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status and Related */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
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
                      <SelectItem value="not-required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="relatedTo">Related To *</Label>
                  <Select
                    value={formData.relatedTo}
                    onValueChange={(value: any) => setFormData({ ...formData, relatedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company-Wide</SelectItem>
                      <SelectItem value="employee-location">Employee Locations</SelectItem>
                      <SelectItem value="client-location">Client Locations</SelectItem>
                      <SelectItem value="both">Both Employee & Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Responsible Department and Owner */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsibleDepartment">Responsible Department</Label>
                  <Select
                    value={formData.responsibleDepartment}
                    onValueChange={(value: any) => setFormData({ ...formData, responsibleDepartment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="Accounting">Accounting</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="responsibleOwner">Responsible Owner</Label>
                  <Input
                    id="responsibleOwner"
                    value={formData.responsibleOwner || ''}
                    onChange={(e) => setFormData({ ...formData, responsibleOwner: e.target.value })}
                    placeholder="e.g., John Smith, jane.doe@company.com"
                  />
                </div>
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fee">License Fee</Label>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    value={formData.fee || ''}
                    onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="renewalFee">Renewal Fee</Label>
                  <Input
                    id="renewalFee"
                    type="number"
                    step="0.01"
                    value={formData.renewalFee || ''}
                    onChange={(e) => setFormData({ ...formData, renewalFee: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <Label htmlFor="documentUpload">Upload License Document (PDF)</Label>
                <div className="space-y-2">
                  <Input
                    id="documentUpload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File size must be less than 10MB');
                          e.target.value = '';
                          return;
                        }
                        setSelectedFile(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <FileText className="h-4 w-4" />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                  {formData.uploadedFileName && !selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <FileText className="h-4 w-4" />
                      <span>Current: {formData.uploadedFileName}</span>
                      {formData.documentUrl && (
                        <a 
                          href={formData.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          View
                        </a>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload license certificate, approval letter, or compliance document (PDF, max 10MB)
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information, renewal procedures, contact details..."
                  rows={3}
                />
              </div>

              {/* Flags */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresAction"
                  checked={formData.requiresAction || false}
                  onChange={(e) => setFormData({ ...formData, requiresAction: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="requiresAction" className="cursor-pointer">
                  Flag as requiring action/review
                </Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingLicense(null);
                setSelectedFile(null);
                setFormData({
                  jurisdictionLevel: 'federal',
                  relatedTo: 'company',
                  status: 'active',
                  requiresAction: false
                });
              }} disabled={uploadingFile}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadingFile}>
                {uploadingFile ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  editingLicense ? 'Update License' : 'Add License'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
