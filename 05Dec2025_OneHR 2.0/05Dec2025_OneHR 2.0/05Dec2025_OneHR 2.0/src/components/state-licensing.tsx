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
import { Switch } from './ui/switch';
import { 
  AlertCircle, Building2, CheckCircle2, Plus, Edit, Trash2, 
  MapPin, Shield, Search, ExternalLink, AlertTriangle, 
  Users, Star, ChevronDown, ChevronRight, Eye, EyeOff, FileText, Info, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { encrypt, decrypt, encryptFields, decryptFields } from '../utils/encryption';

const API_URL = API_ENDPOINTS.LICENSING;

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
  'Wisconsin', 'Wyoming'
];

interface WithholdingAccount {
  id: string;
  url?: string;
  accountNumber?: string;
  userName?: string;
  password?: string;
  uiRate?: number;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

interface UIAccount {
  id: string;
  url?: string;
  accountNumber?: string;
  uiRate?: number;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

interface WorkersComp {
  id: string;
  registered: boolean;
  filingService?: string; // e.g., "Incfile"
  companyName?: string;
  companyAddress?: string;
  policyNumber?: string;
  expiryDate?: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

interface CountyLocalLicense {
  id: string;
  city?: string;
  county?: string;
  localLicenseNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fee?: number;
  status: 'active' | 'expired' | 'pending';
  notes?: string;
}

interface StateLicensing {
  id: string;
  state: string;
  isPrimary: boolean; // Only one state can be primary
  stateId?: string;
  withholdingAccount?: WithholdingAccount;
  uiAccount?: UIAccount;
  workersComp?: WorkersComp;
  countyLocalLicenses: CountyLocalLicense[];
  activeEmployees: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export function StateLicensing() {
  const [stateLicenses, setStateLicenses] = useState<StateLicensing[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStateDialog, setShowAddStateDialog] = useState(false);
  const [showEditStateDialog, setShowEditStateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedState, setSelectedState] = useState<StateLicensing | null>(null);
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [showPortalPassword, setShowPortalPassword] = useState(false);

  const [stateFormData, setStateFormData] = useState<Partial<StateLicensing>>({
    isPrimary: false,
    countyLocalLicenses: [],
    activeEmployees: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both state licenses and employees
      const [licensesResponse, employeesResponse] = await Promise.all([
        fetch(`${API_URL}/state-licenses`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        }),
        fetch(`${API_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        })
      ]);

      if (!licensesResponse.ok) {
        const errorText = await licensesResponse.text();
        console.error('Failed to fetch state licenses. Status:', licensesResponse.status, 'Error:', errorText);
        throw new Error(`Failed to fetch state licenses: ${licensesResponse.status}`);
      }

      const licensesData = await licensesResponse.json();
      console.log('Fetched state licenses:', licensesData);
      setStateLicenses(Array.isArray(licensesData) ? licensesData : []);

      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.employees || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load state licensing data');
      setStateLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStateLicenses = fetchData; // Keep backward compatibility

  // Get employees for a specific state
  const getEmployeesByState = (stateName: string) => {
    return employees.filter(emp => {
      // Check if employee's primary work state matches
      if (emp.workState === stateName) return true;
      // Check if employee has this state in their additional work states
      if (emp.additionalWorkStates && Array.isArray(emp.additionalWorkStates)) {
        return emp.additionalWorkStates.includes(stateName);
      }
      return false;
    });
  };

  const handleAddState = async () => {
    try {
      if (!stateFormData.state) {
        toast.error('Please select a state');
        return;
      }

      // Check if state already exists
      if (stateLicenses.some(s => s.state === stateFormData.state)) {
        toast.error('This state is already added');
        return;
      }

      // If setting as primary, ensure no other state is primary
      if (stateFormData.isPrimary) {
        const hasPrimary = stateLicenses.some(s => s.isPrimary);
        if (hasPrimary) {
          toast.error('Only one state can be designated as Primary. Please unset the current primary state first.');
          return;
        }
      }

      // Encrypt sensitive fields in withholdingAccount
      let encryptedWithholding = stateFormData.withholdingAccount;
      if (encryptedWithholding) {
        encryptedWithholding = await encryptFields(encryptedWithholding, ['userName', 'password']);
      }

      const newState: StateLicensing = {
        id: crypto.randomUUID(),
        state: stateFormData.state,
        isPrimary: stateFormData.isPrimary || false,
        stateId: stateFormData.stateId,
        withholdingAccount: encryptedWithholding,
        uiAccount: stateFormData.uiAccount,
        workersComp: stateFormData.workersComp,
        countyLocalLicenses: stateFormData.countyLocalLicenses || [],
        activeEmployees: stateFormData.activeEmployees || 0,
        notes: stateFormData.notes,
        createdAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/state-licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify(newState)
      });

      if (!response.ok) throw new Error('Failed to add state');

      toast.success('State added successfully (credentials encrypted)');
      setShowAddStateDialog(false);
      resetForm();
      fetchStateLicenses();
    } catch (error) {
      console.error('Error adding state:', error);
      toast.error('Failed to add state');
    }
  };

  const handleUpdateState = async () => {
    if (!selectedState) return;

    try {
      // If setting as primary, ensure no other state is primary
      if (stateFormData.isPrimary && !selectedState.isPrimary) {
        const hasPrimary = stateLicenses.some(s => s.isPrimary && s.id !== selectedState.id);
        if (hasPrimary) {
          toast.error('Only one state can be designated as Primary. Please unset the current primary state first.');
          return;
        }
      }

      // Encrypt sensitive fields in withholdingAccount
      let encryptedWithholding = stateFormData.withholdingAccount;
      if (encryptedWithholding) {
        encryptedWithholding = await encryptFields(encryptedWithholding, ['userName', 'password']);
      }

      const updatedData = {
        ...selectedState,
        ...stateFormData,
        withholdingAccount: encryptedWithholding || selectedState.withholdingAccount,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/state-licenses/${selectedState.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Failed to update state');

      toast.success('State updated successfully (credentials encrypted)');
      setShowEditStateDialog(false);
      setSelectedState(null);
      resetForm();
      fetchStateLicenses();
    } catch (error) {
      console.error('Error updating state:', error);
      toast.error('Failed to update state');
    }
  };

  const handleDeleteState = async (id: string) => {
    if (!confirm('Are you sure you want to delete this state and all its associated licenses?')) return;

    try {
      const response = await fetch(`${API_URL}/state-licenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });

      if (!response.ok) throw new Error('Failed to delete state');

      toast.success('State deleted successfully');
      fetchStateLicenses();
    } catch (error) {
      console.error('Error deleting state:', error);
      toast.error('Failed to delete state');
    }
  };

  const handleSetPrimary = async (stateId: string) => {
    try {
      // First, unset all primary states
      await Promise.all(
        stateLicenses
          .filter(s => s.isPrimary)
          .map(s => 
            fetch(`${API_URL}/state-licenses/${s.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken() ?? ''}`
              },
              body: JSON.stringify({ ...s, isPrimary: false, updatedAt: new Date().toISOString() })
            })
          )
      );

      // Then set the new primary
      const state = stateLicenses.find(s => s.id === stateId);
      if (state) {
        const response = await fetch(`${API_URL}/state-licenses/${stateId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken() ?? ''}`
          },
          body: JSON.stringify({ ...state, isPrimary: true, updatedAt: new Date().toISOString() })
        });

        if (!response.ok) throw new Error('Failed to set primary state');

        toast.success(`${state.state} set as primary state`);
        fetchStateLicenses();
      }
    } catch (error) {
      console.error('Error setting primary state:', error);
      toast.error('Failed to set primary state');
    }
  };

  const resetForm = () => {
    setStateFormData({
      isPrimary: false,
      countyLocalLicenses: [],
      activeEmployees: 0
    });
  };

  const toggleStateExpansion = (stateId: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateId)) {
      newExpanded.delete(stateId);
    } else {
      newExpanded.add(stateId);
    }
    setExpandedStates(newExpanded);
  };

  const openEditDialog = async (state: StateLicensing) => {
    setSelectedState(state);
    
    // Decrypt sensitive fields for editing
    let decryptedWithholding = state.withholdingAccount;
    if (decryptedWithholding && (decryptedWithholding.userName || decryptedWithholding.password)) {
      try {
        decryptedWithholding = await decryptFields(decryptedWithholding, ['userName', 'password']);
      } catch (error) {
        console.error('Failed to decrypt credentials:', error);
        toast.error('Failed to decrypt credentials');
      }
    }
    
    setStateFormData({
      ...state,
      withholdingAccount: decryptedWithholding
    });
    setShowEditStateDialog(true);
  };

  const openDetailDialog = (state: StateLicensing) => {
    setSelectedState(state);
    setShowDetailDialog(true);
  };

  // Filter states
  const filteredStates = stateLicenses.filter(state => {
    return searchQuery === '' || 
      state.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.stateId?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort: Primary first, then alphabetically
  const sortedStates = [...filteredStates].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.state.localeCompare(b.state);
  });

  const primaryState = stateLicenses.find(s => s.isPrimary);
  const foreignStates = stateLicenses.filter(s => !s.isPrimary);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">State Licensing</h2>
          <p className="text-muted-foreground">
            Manage state-level licenses, withholding, UI, workers comp, and local licenses
          </p>
        </div>
        <Button onClick={() => setShowAddStateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add State
        </Button>
      </div>

      {/* Primary State Alert */}
      {!primaryState && stateLicenses.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Primary State Set</AlertTitle>
          <AlertDescription>
            Please designate one state as your primary (incorporation) state.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total States</CardDescription>
            <CardTitle className="text-2xl">{stateLicenses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Primary State</CardDescription>
            <CardTitle className="text-2xl">
              {primaryState ? (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg">{primaryState.state}</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-lg">Not Set</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Foreign States</CardDescription>
            <CardTitle className="text-2xl">{foreignStates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Active Employees</CardDescription>
            <CardTitle className="text-2xl">
              {stateLicenses.reduce((sum, s) => sum + s.activeEmployees, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* States List */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading states...</div>
      ) : sortedStates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p>No states added yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAddStateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First State
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedStates.map((state) => {
            const isExpanded = expandedStates.has(state.id);
            
            return (
              <Card key={state.id} className={state.isPrimary ? 'border-yellow-500 border-2' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStateExpansion(state.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{state.state}</CardTitle>
                          {state.isPrimary ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1 fill-yellow-800" />
                              Primary
                            </Badge>
                          ) : (
                            <Badge variant="outline">Foreign</Badge>
                          )}
                          {state.stateId && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {state.stateId}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {state.activeEmployees} Active Employees
                          </span>
                          {state.withholdingAccount && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Withholding
                            </span>
                          )}
                          {state.uiAccount && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              UI
                            </span>
                          )}
                          {state.workersComp && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              Workers Comp
                            </span>
                          )}
                          {state.countyLocalLicenses.length > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              {state.countyLocalLicenses.length} Local License{state.countyLocalLicenses.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!state.isPrimary && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetPrimary(state.id)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Set Primary
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailDialog(state)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(state)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteState(state.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      {/* Withholding Account */}
                      {state.withholdingAccount && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Withholding Account
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {state.withholdingAccount.url && (
                              <div>
                                <span className="text-muted-foreground">URL:</span>
                                <a href={state.withholdingAccount.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline flex items-center gap-1">
                                  Portal <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            {state.withholdingAccount.accountNumber && (
                              <div>
                                <span className="text-muted-foreground">Account #:</span>
                                <span className="ml-2 font-mono">{state.withholdingAccount.accountNumber}</span>
                              </div>
                            )}
                            {state.withholdingAccount.userName && (
                              <div>
                                <span className="text-muted-foreground">Username:</span>
                                <span className="ml-2">{state.withholdingAccount.userName}</span>
                              </div>
                            )}
                            {state.withholdingAccount.password && (
                              <div>
                                <span className="text-muted-foreground">Password:</span>
                                <span className="ml-2 font-mono">••••••••</span>
                              </div>
                            )}
                            {state.withholdingAccount.uiRate !== undefined && (
                              <div>
                                <span className="text-muted-foreground">UI Rate:</span>
                                <span className="ml-2">{state.withholdingAccount.uiRate}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* UI Account */}
                      {state.uiAccount && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            UI Account
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {state.uiAccount.url && (
                              <div>
                                <span className="text-muted-foreground">URL:</span>
                                <a href={state.uiAccount.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline flex items-center gap-1">
                                  Portal <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            {state.uiAccount.accountNumber && (
                              <div>
                                <span className="text-muted-foreground">Account #:</span>
                                <span className="ml-2 font-mono">{state.uiAccount.accountNumber}</span>
                              </div>
                            )}
                            {state.uiAccount.uiRate !== undefined && (
                              <div>
                                <span className="text-muted-foreground">UI Rate:</span>
                                <span className="ml-2">{state.uiAccount.uiRate}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Workers Comp */}
                      {state.workersComp && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Workers Compensation
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Registered:</span>
                              <Badge className={`ml-2 ${state.workersComp.registered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {state.workersComp.registered ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                            {state.workersComp.filingService && (
                              <div>
                                <span className="text-muted-foreground">Filing Service:</span>
                                <span className="ml-2">{state.workersComp.filingService}</span>
                              </div>
                            )}
                            {state.workersComp.companyName && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Company:</span>
                                <div className="ml-2 mt-1">{state.workersComp.companyName}</div>
                                {state.workersComp.companyAddress && (
                                  <div className="ml-2 text-xs text-muted-foreground">{state.workersComp.companyAddress}</div>
                                )}
                              </div>
                            )}
                            {state.workersComp.policyNumber && (
                              <div>
                                <span className="text-muted-foreground">Policy #:</span>
                                <span className="ml-2 font-mono">{state.workersComp.policyNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* County/Local Licenses */}
                      {state.countyLocalLicenses.length > 0 && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            County / Local Licensing
                          </h4>
                          <div className="space-y-3">
                            {state.countyLocalLicenses.map((license, idx) => (
                              <div key={idx} className="border-l-2 border-blue-500 pl-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {license.city && (
                                    <div>
                                      <span className="text-muted-foreground">City:</span>
                                      <span className="ml-2">{license.city}</span>
                                    </div>
                                  )}
                                  {license.county && (
                                    <div>
                                      <span className="text-muted-foreground">County:</span>
                                      <span className="ml-2">{license.county}</span>
                                    </div>
                                  )}
                                  {license.localLicenseNumber && (
                                    <div>
                                      <span className="text-muted-foreground">License #:</span>
                                      <span className="ml-2 font-mono">{license.localLicenseNumber}</span>
                                    </div>
                                  )}
                                  {license.expiryDate && (
                                    <div>
                                      <span className="text-muted-foreground">Expires:</span>
                                      <span className="ml-2">{format(parseISO(license.expiryDate), 'MMM d, yyyy')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Employees in this State */}
                      {(() => {
                        const stateEmployees = getEmployeesByState(state.state);
                        return stateEmployees.length > 0 && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Employees in {state.state} ({stateEmployees.length})
                            </h4>
                            <div className="space-y-2">
                              {stateEmployees.map((employee) => (
                                <div key={employee.id} className="flex items-center justify-between bg-white p-3 rounded border">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {employee.firstName} {employee.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{employee.email}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {employee.workState === state.state && (
                                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                        Primary
                                      </Badge>
                                    )}
                                    {employee.additionalWorkStates?.includes(state.state) && employee.workState !== state.state && (
                                      <Badge variant="outline" className="text-xs">
                                        Secondary
                                      </Badge>
                                    )}
                                    {employee.status && (
                                      <Badge variant="outline" className="text-xs">
                                        {employee.status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {state.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1 bg-muted p-3 rounded-md">{state.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add State Dialog */}
      <Dialog open={showAddStateDialog} onOpenChange={setShowAddStateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New State</DialogTitle>
            <DialogDescription>
              Add a new state with its licensing information
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="withholding">Withholding</TabsTrigger>
              <TabsTrigger value="ui">UI</TabsTrigger>
              <TabsTrigger value="workers">Workers Comp</TabsTrigger>
              <TabsTrigger value="local">County/Local</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label>State *</Label>
                <Select value={stateFormData.state} onValueChange={(v) => setStateFormData({ ...stateFormData, state: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Designate as Primary State</Label>
                <Switch
                  checked={stateFormData.isPrimary || false}
                  onCheckedChange={(checked) => setStateFormData({ ...stateFormData, isPrimary: checked })}
                />
              </div>

              <div>
                <Label>State ID</Label>
                <Input
                  value={stateFormData.stateId || ''}
                  onChange={(e) => setStateFormData({ ...stateFormData, stateId: e.target.value })}
                  placeholder="State identification number"
                />
              </div>

              <div>
                <Label>Active Employees</Label>
                <Input
                  type="number"
                  value={stateFormData.activeEmployees || 0}
                  onChange={(e) => setStateFormData({ ...stateFormData, activeEmployees: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={stateFormData.notes || ''}
                  onChange={(e) => setStateFormData({ ...stateFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="withholding" className="space-y-4 mt-4">
              <div>
                <Label>Portal URL</Label>
                <Input
                  type="url"
                  value={stateFormData.withholdingAccount?.url || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: stateFormData.withholdingAccount?.status || 'active',
                      url: e.target.value
                    }
                  })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={stateFormData.withholdingAccount?.accountNumber || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: stateFormData.withholdingAccount?.status || 'active',
                      accountNumber: e.target.value
                    }
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    Username
                    <Lock className="h-3 w-3 text-green-600" />
                  </Label>
                  <Input
                    value={stateFormData.withholdingAccount?.userName || ''}
                    onChange={(e) => setStateFormData({
                      ...stateFormData,
                      withholdingAccount: {
                        ...stateFormData.withholdingAccount,
                        id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                        status: stateFormData.withholdingAccount?.status || 'active',
                        userName: e.target.value
                      }
                    })}
                    placeholder="Portal username"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Encrypted for security
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    Password
                    <Lock className="h-3 w-3 text-green-600" />
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPortalPassword ? 'text' : 'password'}
                      value={stateFormData.withholdingAccount?.password || ''}
                      onChange={(e) => setStateFormData({
                        ...stateFormData,
                        withholdingAccount: {
                          ...stateFormData.withholdingAccount,
                          id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                          status: stateFormData.withholdingAccount?.status || 'active',
                          password: e.target.value
                        }
                      })}
                      className="pr-10"
                      placeholder="Portal password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPortalPassword(!showPortalPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPortalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Encrypted for security
                  </p>
                </div>
              </div>

              <div>
                <Label>UI Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stateFormData.withholdingAccount?.uiRate || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: stateFormData.withholdingAccount?.status || 'active',
                      uiRate: parseFloat(e.target.value)
                    }
                  })}
                  placeholder="1.34"
                />
              </div>
            </TabsContent>

            <TabsContent value="ui" className="space-y-4 mt-4">
              <div>
                <Label>Portal URL</Label>
                <Input
                  type="url"
                  value={stateFormData.uiAccount?.url || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: stateFormData.uiAccount?.status || 'active',
                      url: e.target.value
                    }
                  })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={stateFormData.uiAccount?.accountNumber || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: stateFormData.uiAccount?.status || 'active',
                      accountNumber: e.target.value
                    }
                  })}
                  placeholder="1234"
                />
              </div>

              <div>
                <Label>UI Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stateFormData.uiAccount?.uiRate || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: stateFormData.uiAccount?.status || 'active',
                      uiRate: parseFloat(e.target.value)
                    }
                  })}
                  placeholder="1.34"
                />
              </div>
            </TabsContent>

            <TabsContent value="workers" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Registered</Label>
                <Switch
                  checked={stateFormData.workersComp?.registered || false}
                  onCheckedChange={(checked) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: checked
                    }
                  })}
                />
              </div>

              <div>
                <Label>Filing Service</Label>
                <Input
                  value={stateFormData.workersComp?.filingService || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      filingService: e.target.value
                    }
                  })}
                  placeholder="e.g., Incfile"
                />
              </div>

              <div>
                <Label>Company Name</Label>
                <Input
                  value={stateFormData.workersComp?.companyName || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      companyName: e.target.value
                    }
                  })}
                  placeholder="Company name and address"
                />
              </div>

              <div>
                <Label>Company Address</Label>
                <Textarea
                  value={stateFormData.workersComp?.companyAddress || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      companyAddress: e.target.value
                    }
                  })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Policy Number</Label>
                <Input
                  value={stateFormData.workersComp?.policyNumber || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      policyNumber: e.target.value
                    }
                  })}
                />
              </div>
            </TabsContent>

            <TabsContent value="local" className="space-y-4 mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Add county and local licenses for this state. You can add multiple entries after creating the state.
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground">
                County/Local licenses can be managed after adding the state.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddState}>
              Add State
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit State Dialog - Similar structure */}
      <Dialog open={showEditStateDialog} onOpenChange={setShowEditStateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit State - {selectedState?.state}</DialogTitle>
            <DialogDescription>
              Update state licensing information
            </DialogDescription>
          </DialogHeader>

          {/* Same tabbed form as Add dialog */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="withholding">Withholding</TabsTrigger>
              <TabsTrigger value="ui">UI</TabsTrigger>
              <TabsTrigger value="workers">Workers Comp</TabsTrigger>
              <TabsTrigger value="local">County/Local</TabsTrigger>
            </TabsList>

            {/* Same tab content as Add dialog - reuse the same structure */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Designate as Primary State</Label>
                <Switch
                  checked={stateFormData.isPrimary || false}
                  onCheckedChange={(checked) => setStateFormData({ ...stateFormData, isPrimary: checked })}
                />
              </div>

              <div>
                <Label>State ID</Label>
                <Input
                  value={stateFormData.stateId || ''}
                  onChange={(e) => setStateFormData({ ...stateFormData, stateId: e.target.value })}
                />
              </div>

              <div>
                <Label>Active Employees</Label>
                <Input
                  type="number"
                  value={stateFormData.activeEmployees || 0}
                  onChange={(e) => setStateFormData({ ...stateFormData, activeEmployees: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={stateFormData.notes || ''}
                  onChange={(e) => setStateFormData({ ...stateFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="withholding" className="space-y-4 mt-4">
              <div>
                <Label>Portal URL</Label>
                <Input
                  type="url"
                  value={stateFormData.withholdingAccount?.url || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: stateFormData.withholdingAccount?.status || 'active',
                      url: e.target.value
                    }
                  })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={stateFormData.withholdingAccount?.accountNumber || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: stateFormData.withholdingAccount?.status || 'active',
                      accountNumber: e.target.value
                    }
                  })}
                  placeholder="Account number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    Username
                    <Lock className="h-3 w-3 text-green-600" />
                  </Label>
                  <Input
                    value={stateFormData.withholdingAccount?.userName || ''}
                    onChange={(e) => setStateFormData({
                      ...stateFormData,
                      withholdingAccount: {
                        ...stateFormData.withholdingAccount,
                        id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                        status: stateFormData.withholdingAccount?.status || 'active',
                        userName: e.target.value
                      }
                    })}
                    placeholder="Portal username"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Encrypted for security
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    Password
                    <Lock className="h-3 w-3 text-green-600" />
                  </Label>
                  <Input
                    type="password"
                    value={stateFormData.withholdingAccount?.password || ''}
                    onChange={(e) => setStateFormData({
                      ...stateFormData,
                      withholdingAccount: {
                        ...stateFormData.withholdingAccount,
                        id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                        status: stateFormData.withholdingAccount?.status || 'active',
                        password: e.target.value
                      }
                    })}
                    placeholder="Portal password"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Encrypted for security
                  </p>
                </div>
              </div>

              <div>
                <Label>UI Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stateFormData.withholdingAccount?.uiRate || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: stateFormData.withholdingAccount?.status || 'active',
                      uiRate: parseFloat(e.target.value)
                    }
                  })}
                  placeholder="1.34"
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={stateFormData.withholdingAccount?.status || 'active'}
                  onValueChange={(v: 'active' | 'inactive' | 'pending') => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: v
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={stateFormData.withholdingAccount?.notes || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    withholdingAccount: {
                      ...stateFormData.withholdingAccount,
                      id: stateFormData.withholdingAccount?.id || crypto.randomUUID(),
                      status: stateFormData.withholdingAccount?.status || 'active',
                      notes: e.target.value
                    }
                  })}
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
            </TabsContent>

            <TabsContent value="ui" className="space-y-4 mt-4">
              <div>
                <Label>Portal URL</Label>
                <Input
                  type="url"
                  value={stateFormData.uiAccount?.url || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: stateFormData.uiAccount?.status || 'active',
                      url: e.target.value
                    }
                  })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={stateFormData.uiAccount?.accountNumber || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: stateFormData.uiAccount?.status || 'active',
                      accountNumber: e.target.value
                    }
                  })}
                  placeholder="UI account number"
                />
              </div>

              <div>
                <Label>UI Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stateFormData.uiAccount?.uiRate || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: stateFormData.uiAccount?.status || 'active',
                      uiRate: parseFloat(e.target.value)
                    }
                  })}
                  placeholder="2.5"
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={stateFormData.uiAccount?.status || 'active'}
                  onValueChange={(v: 'active' | 'inactive' | 'pending') => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: v
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={stateFormData.uiAccount?.notes || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    uiAccount: {
                      ...stateFormData.uiAccount,
                      id: stateFormData.uiAccount?.id || crypto.randomUUID(),
                      status: stateFormData.uiAccount?.status || 'active',
                      notes: e.target.value
                    }
                  })}
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
            </TabsContent>

            <TabsContent value="workers" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Registered for Workers Compensation</Label>
                <Switch
                  checked={stateFormData.workersComp?.registered || false}
                  onCheckedChange={(checked) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: checked
                    }
                  })}
                />
              </div>

              <div>
                <Label>Filing Service</Label>
                <Input
                  value={stateFormData.workersComp?.filingService || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      filingService: e.target.value
                    }
                  })}
                  placeholder="e.g., Incfile, LegalZoom"
                />
              </div>

              <div>
                <Label>Company Name</Label>
                <Input
                  value={stateFormData.workersComp?.companyName || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      companyName: e.target.value
                    }
                  })}
                  placeholder="Workers comp company name"
                />
              </div>

              <div>
                <Label>Company Address</Label>
                <Textarea
                  value={stateFormData.workersComp?.companyAddress || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      companyAddress: e.target.value
                    }
                  })}
                  rows={2}
                  placeholder="Full company address"
                />
              </div>

              <div>
                <Label>Policy Number</Label>
                <Input
                  value={stateFormData.workersComp?.policyNumber || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      policyNumber: e.target.value
                    }
                  })}
                  placeholder="Policy number"
                />
              </div>

              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={stateFormData.workersComp?.expiryDate || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      expiryDate: e.target.value
                    }
                  })}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={stateFormData.workersComp?.status || 'active'}
                  onValueChange={(v: 'active' | 'inactive' | 'pending') => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      registered: stateFormData.workersComp?.registered || false,
                      status: v
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={stateFormData.workersComp?.notes || ''}
                  onChange={(e) => setStateFormData({
                    ...stateFormData,
                    workersComp: {
                      ...stateFormData.workersComp,
                      id: stateFormData.workersComp?.id || crypto.randomUUID(),
                      status: stateFormData.workersComp?.status || 'active',
                      registered: stateFormData.workersComp?.registered || false,
                      notes: e.target.value
                    }
                  })}
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
            </TabsContent>

            <TabsContent value="local" className="space-y-4 mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>County/Local Licenses</AlertTitle>
                <AlertDescription>
                  Add city or county-specific business licenses required in this state
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {(stateFormData.countyLocalLicenses || []).map((license, index) => (
                  <Card key={license.id} className="p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>City</Label>
                          <Input
                            value={license.city || ''}
                            onChange={(e) => {
                              const updated = [...(stateFormData.countyLocalLicenses || [])];
                              updated[index] = { ...license, city: e.target.value };
                              setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                            }}
                            placeholder="City name"
                          />
                        </div>
                        <div>
                          <Label>County</Label>
                          <Input
                            value={license.county || ''}
                            onChange={(e) => {
                              const updated = [...(stateFormData.countyLocalLicenses || [])];
                              updated[index] = { ...license, county: e.target.value };
                              setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                            }}
                            placeholder="County name"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>License Number</Label>
                        <Input
                          value={license.localLicenseNumber || ''}
                          onChange={(e) => {
                            const updated = [...(stateFormData.countyLocalLicenses || [])];
                            updated[index] = { ...license, localLicenseNumber: e.target.value };
                            setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                          }}
                          placeholder="Local license number"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Issue Date</Label>
                          <Input
                            type="date"
                            value={license.issueDate || ''}
                            onChange={(e) => {
                              const updated = [...(stateFormData.countyLocalLicenses || [])];
                              updated[index] = { ...license, issueDate: e.target.value };
                              setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Expiry Date</Label>
                          <Input
                            type="date"
                            value={license.expiryDate || ''}
                            onChange={(e) => {
                              const updated = [...(stateFormData.countyLocalLicenses || [])];
                              updated[index] = { ...license, expiryDate: e.target.value };
                              setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Fee ($)</Label>
                          <Input
                            type="number"
                            value={license.fee || ''}
                            onChange={(e) => {
                              const updated = [...(stateFormData.countyLocalLicenses || [])];
                              updated[index] = { ...license, fee: parseFloat(e.target.value) };
                              setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                            }}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={license.status}
                            onValueChange={(v: 'active' | 'expired' | 'pending') => {
                              const updated = [...(stateFormData.countyLocalLicenses || [])];
                              updated[index] = { ...license, status: v };
                              setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={license.notes || ''}
                          onChange={(e) => {
                            const updated = [...(stateFormData.countyLocalLicenses || [])];
                            updated[index] = { ...license, notes: e.target.value };
                            setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                          }}
                          rows={2}
                          placeholder="Additional notes"
                        />
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const updated = (stateFormData.countyLocalLicenses || []).filter((_, i) => i !== index);
                          setStateFormData({ ...stateFormData, countyLocalLicenses: updated });
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove License
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  const newLicense: CountyLocalLicense = {
                    id: crypto.randomUUID(),
                    status: 'active'
                  };
                  setStateFormData({
                    ...stateFormData,
                    countyLocalLicenses: [...(stateFormData.countyLocalLicenses || []), newLicense]
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add County/Local License
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateState}>
              Update State
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedState && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedState.state}
                {selectedState.isPrimary && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1 fill-yellow-800" />
                    Primary
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Complete state licensing information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Display all state information in read-only format */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedState.isPrimary ? 'Primary' : 'Foreign'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="font-medium">{selectedState.activeEmployees}</p>
                </div>
              </div>

              {/* Show all sections */}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowDetailDialog(false);
                openEditDialog(selectedState);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
