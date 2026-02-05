import { useState, useEffect, useMemo } from 'react';
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertCircle, Building2, CheckCircle2, Clock, Plus, Edit, Trash2, 
  FileText, MapPin, Shield, Search, Filter, Download, Upload, Calendar,
  ListTodo, History, FolderOpen, Settings, BellRing, CheckCheck, User,
  TrendingUp, DollarSign, Map, Activity, RefreshCw, Eye, ExternalLink,
  FileCheck, AlertTriangle, XCircle, Lightbulb, BarChart3, Users,
  Briefcase, Building, Globe, Zap, Link2, Database, ChevronRight,
  FileArchive, Award, ShieldCheck, Sparkles, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { format, parseISO, differenceInDays, addMonths, addDays } from 'date-fns';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

interface BusinessLicense {
  id: string;
  licenseName: string;
  licenseType: string;
  licenseNumber: string;
  jurisdictionLevel: 'federal' | 'state' | 'county' | 'local' | 'client-state';
  jurisdiction: string;
  issuingAuthority: string;
  portalLink?: string;
  issueDate: string;
  expiryDate: string;
  renewalDate?: string;
  renewalFrequency?: 'annual' | 'biannual' | 'quarterly' | 'biennial' | 'triennial' | 'other';
  status: 'active' | 'expired' | 'pending' | 'pending-renewal' | 'suspended' | 'not-required' | 'archived';
  complianceType: string;
  relatedTo: 'company' | 'employee-location' | 'client-location' | 'both';
  linkedStates?: string[];
  responsibleDepartment?: string;
  responsibleOwner?: string;
  fee?: number;
  renewalFee?: number;
  documentUrl?: string;
  uploadedFileName?: string;
  notes?: string;
  requiresAction: boolean;
  isAnnualReport?: boolean;
  annualReportDueDate?: string;
  annualReportFiledDate?: string;
  registeredAgent?: string;
  registeredAgentAddress?: string;
  goodStandingStatus?: 'compliant' | 'non-compliant' | 'pending';
  goodStandingVerifiedDate?: string;
  autoRenewal?: boolean;
  reminderDaysBefore?: number;
  createdAt: string;
  updatedAt?: string;
}

interface TaxAccount {
  id: string;
  accountType: 'federal-ein' | 'state-withholding' | 'state-unemployment' | 'county-tax' | 'local-tax';
  accountName: string;
  accountNumber: string;
  state?: string;
  county?: string;
  locality?: string;
  jurisdiction: string;
  registrationDate: string;
  filingFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'as-needed';
  nextFilingDate?: string;
  lastFilingDate?: string;
  status: 'active' | 'inactive' | 'pending' | 'closed';
  portalLink?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  reminderDaysBefore?: number;
  createdAt: string;
}

interface Filing {
  id: string;
  filingType: 'annual-report' | 'registered-agent' | 'good-standing' | 'tax-filing' | 'regulatory' | 'other';
  filingName: string;
  state?: string;
  jurisdiction: string;
  dueDate: string;
  filedDate?: string;
  status: 'pending' | 'filed' | 'overdue' | 'not-required';
  fee?: number;
  confirmationNumber?: string;
  documentUrl?: string;
  notes?: string;
  linkedLicenseId?: string;
  createdAt: string;
}

interface Recommendation {
  id: string;
  type: 'license' | 'tax-account' | 'filing' | 'registration';
  title: string;
  description: string;
  state?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'acknowledged' | 'completed' | 'dismissed';
  createdAt: string;
}

interface Reminder {
  id: string;
  itemType: 'license' | 'tax-account' | 'filing';
  itemId: string;
  itemName: string;
  dueDate: string;
  reminderDate: string;
  daysBefore: number;
  status: 'pending' | 'sent' | 'dismissed' | 'completed';
  priority: 'high' | 'medium' | 'low';
  notificationMethod?: 'email' | 'in-app' | 'both';
  sentDate?: string;
  dismissedDate?: string;
  notes?: string;
  createdAt: string;
}

interface ReminderSettings {
  enabled: boolean;
  defaultDaysBefore: number[];
  customReminders: {
    licenses: number[];
    taxAccounts: number[];
    filings: number[];
  };
  notificationMethod: 'email' | 'in-app' | 'both';
  emailRecipients?: string[];
  autoGenerate: boolean;
}

interface Integration {
  name: string;
  module: string;
  status: 'active' | 'inactive';
  lastSync?: string;
  data?: any;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama', x: 710, y: 380 },
  { code: 'AK', name: 'Alaska', x: 100, y: 520 },
  { code: 'AZ', name: 'Arizona', x: 250, y: 380 },
  { code: 'AR', name: 'Arkansas', x: 600, y: 360 },
  { code: 'CA', name: 'California', x: 150, y: 320 },
  { code: 'CO', name: 'Colorado', x: 350, y: 280 },
  { code: 'CT', name: 'Connecticut', x: 880, y: 200 },
  { code: 'DE', name: 'Delaware', x: 850, y: 260 },
  { code: 'FL', name: 'Florida', x: 800, y: 470 },
  { code: 'GA', name: 'Georgia', x: 750, y: 400 },
  { code: 'HI', name: 'Hawaii', x: 350, y: 520 },
  { code: 'ID', name: 'Idaho', x: 250, y: 180 },
  { code: 'IL', name: 'Illinois', x: 650, y: 260 },
  { code: 'IN', name: 'Indiana', x: 700, y: 260 },
  { code: 'IA', name: 'Iowa', x: 600, y: 240 },
  { code: 'KS', name: 'Kansas', x: 500, y: 300 },
  { code: 'KY', name: 'Kentucky', x: 720, y: 300 },
  { code: 'LA', name: 'Louisiana', x: 620, y: 430 },
  { code: 'ME', name: 'Maine', x: 900, y: 120 },
  { code: 'MD', name: 'Maryland', x: 830, y: 270 },
  { code: 'MA', name: 'Massachusetts', x: 890, y: 190 },
  { code: 'MI', name: 'Michigan', x: 720, y: 210 },
  { code: 'MN', name: 'Minnesota', x: 570, y: 160 },
  { code: 'MS', name: 'Mississippi', x: 650, y: 400 },
  { code: 'MO', name: 'Missouri', x: 600, y: 290 },
  { code: 'MT', name: 'Montana', x: 320, y: 140 },
  { code: 'NE', name: 'Nebraska', x: 500, y: 250 },
  { code: 'NV', name: 'Nevada', x: 200, y: 280 },
  { code: 'NH', name: 'New Hampshire', x: 890, y: 170 },
  { code: 'NJ', name: 'New Jersey', x: 860, y: 250 },
  { code: 'NM', name: 'New Mexico', x: 350, y: 380 },
  { code: 'NY', name: 'New York', x: 840, y: 200 },
  { code: 'NC', name: 'North Carolina', x: 800, y: 340 },
  { code: 'ND', name: 'North Dakota', x: 480, y: 140 },
  { code: 'OH', name: 'Ohio', x: 750, y: 260 },
  { code: 'OK', name: 'Oklahoma', x: 520, y: 360 },
  { code: 'OR', name: 'Oregon', x: 180, y: 180 },
  { code: 'PA', name: 'Pennsylvania', x: 800, y: 250 },
  { code: 'RI', name: 'Rhode Island', x: 900, y: 205 },
  { code: 'SC', name: 'South Carolina', x: 780, y: 370 },
  { code: 'SD', name: 'South Dakota', x: 480, y: 200 },
  { code: 'TN', name: 'Tennessee', x: 700, y: 340 },
  { code: 'TX', name: 'Texas', x: 480, y: 420 },
  { code: 'UT', name: 'Utah', x: 280, y: 270 },
  { code: 'VT', name: 'Vermont', x: 870, y: 155 },
  { code: 'VA', name: 'Virginia', x: 800, y: 300 },
  { code: 'WA', name: 'Washington', x: 200, y: 120 },
  { code: 'WV', name: 'West Virginia', x: 770, y: 290 },
  { code: 'WI', name: 'Wisconsin', x: 650, y: 200 },
  { code: 'WY', name: 'Wyoming', x: 350, y: 220 }
];

export function BusinessLicensingEnhanced() {
  const [licenses, setLicenses] = useState<BusinessLicense[]>([]);
  const [taxAccounts, setTaxAccounts] = useState<TaxAccount[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: true,
    defaultDaysBefore: [30, 60, 90],
    customReminders: {
      licenses: [30, 60, 90],
      taxAccounts: [15, 30],
      filings: [7, 14, 30]
    },
    notificationMethod: 'both',
    autoGenerate: true
  });
  
  const [selectedLicense, setSelectedLicense] = useState<BusinessLicense | null>(null);
  const [selectedTaxAccount, setSelectedTaxAccount] = useState<TaxAccount | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showAddLicenseDialog, setShowAddLicenseDialog] = useState(false);
  const [showEditLicenseDialog, setShowEditLicenseDialog] = useState(false);
  const [showAddTaxDialog, setShowAddTaxDialog] = useState(false);
  const [showEditTaxDialog, setShowEditTaxDialog] = useState(false);
  const [showAddFilingDialog, setShowAddFilingDialog] = useState(false);
  const [showStateDetailSheet, setShowStateDetailSheet] = useState(false);
  const [showReminderSettingsDialog, setShowReminderSettingsDialog] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [licenseFormData, setLicenseFormData] = useState<Partial<BusinessLicense>>({
    jurisdictionLevel: 'state',
    relatedTo: 'company',
    status: 'active',
    requiresAction: false
  });
  
  const [taxFormData, setTaxFormData] = useState<Partial<TaxAccount>>({
    accountType: 'state-withholding',
    filingFrequency: 'quarterly',
    status: 'active'
  });
  
  const [filingFormData, setFilingFormData] = useState<Partial<Filing>>({
    filingType: 'annual-report',
    status: 'pending'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const licensesRes = await fetch(`${API_URL}/business-licenses`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (licensesRes.ok) {
        const data = await licensesRes.json();
        setLicenses(data.licenses || []);
      }

      const employeesRes = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.employees || []);
      }

      await loadTaxAccounts();
      await loadFilings();
      await loadRecommendations();
      await loadReminders();
      await loadReminderSettings();
      generateIntegrations();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const loadTaxAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/kv/tax-accounts`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTaxAccounts(data.value || []);
      }
    } catch (error) {
      console.error('Error loading tax accounts:', error);
    }
  };

  const loadFilings = async () => {
    try {
      const response = await fetch(`${API_URL}/kv/compliance-filings`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFilings(data.value || []);
      }
    } catch (error) {
      console.error('Error loading filings:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`${API_URL}/kv/compliance-recommendations`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.value || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const saveTaxAccounts = async (accounts: TaxAccount[]) => {
    try {
      const response = await fetch(`${API_URL}/kv/tax-accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: accounts })
      });
      if (!response.ok) throw new Error('Failed to save tax accounts');
    } catch (error) {
      console.error('Error saving tax accounts:', error);
      throw error;
    }
  };

  const saveFilings = async (filingsData: Filing[]) => {
    try {
      const response = await fetch(`${API_URL}/kv/compliance-filings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: filingsData })
      });
      if (!response.ok) throw new Error('Failed to save filings');
    } catch (error) {
      console.error('Error saving filings:', error);
      throw error;
    }
  };

  const saveRecommendations = async (recs: Recommendation[]) => {
    try {
      const response = await fetch(`${API_URL}/kv/compliance-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: recs })
      });
      if (!response.ok) throw new Error('Failed to save recommendations');
    } catch (error) {
      console.error('Error saving recommendations:', error);
      throw error;
    }
  };

  const loadReminders = async () => {
    try {
      const response = await fetch(`${API_URL}/kv/compliance-reminders`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReminders(data.value || []);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const saveReminders = async (remindersData: Reminder[]) => {
    try {
      const response = await fetch(`${API_URL}/kv/compliance-reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: remindersData })
      });
      if (!response.ok) throw new Error('Failed to save reminders');
    } catch (error) {
      console.error('Error saving reminders:', error);
      throw error;
    }
  };

  const loadReminderSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/kv/reminder-settings`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          // Ensure customReminders is properly initialized
          const loadedSettings = {
            ...data.value,
            customReminders: {
              licenses: data.value.customReminders?.licenses || [30, 60, 90],
              taxAccounts: data.value.customReminders?.taxAccounts || [15, 30],
              filings: data.value.customReminders?.filings || [7, 14, 30]
            }
          };
          setReminderSettings(loadedSettings);
        }
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const saveReminderSettings = async (settings: ReminderSettings) => {
    try {
      const response = await fetch(`${API_URL}/kv/reminder-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: settings })
      });
      if (!response.ok) throw new Error('Failed to save reminder settings');
      setReminderSettings(settings);
      toast.success('Reminder settings saved successfully');
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      toast.error('Failed to save reminder settings');
      throw error;
    }
  };

  const generateIntegrations = () => {
    const integrationsData: Integration[] = [
      {
        name: 'HR Module',
        module: 'employee-management',
        status: 'active',
        lastSync: new Date().toISOString(),
        data: {
          totalEmployees: employees.length,
          statesWithEmployees: [...new Set(employees.map(e => e.state).filter(Boolean))].length
        }
      },
      {
        name: 'Payroll (ADP)',
        module: 'payroll',
        status: 'inactive',
        data: { note: 'Configure ADP integration' }
      },
      {
        name: 'Accounting (QuickBooks)',
        module: 'accounting',
        status: 'inactive',
        data: { note: 'Configure QuickBooks integration' }
      },
      {
        name: 'Client Onboarding',
        module: 'client-management',
        status: 'active',
        lastSync: new Date().toISOString(),
        data: { note: 'Synced with client locations' }
      }
    ];
    setIntegrations(integrationsData);
  };

  // Auto-generate reminders based on expiry dates and settings
  const generateAutomaticReminders = async () => {
    if (!reminderSettings.enabled || !reminderSettings.autoGenerate) return;
    if (!reminderSettings.customReminders) return;

    const newReminders: Reminder[] = [];
    const today = new Date();
    const existingReminderKeys = new Set(
      reminders.map(r => `${r.itemType}_${r.itemId}_${r.daysBefore}`)
    );

    // Generate reminders for licenses
    licenses.forEach(license => {
      if (license.status !== 'active' || !license.expiryDate) return;
      
      (reminderSettings.customReminders?.licenses || [30, 60, 90]).forEach(daysBefore => {
        const reminderKey = `license_${license.id}_${daysBefore}`;
        if (existingReminderKeys.has(reminderKey)) return;

        const expiryDate = parseISO(license.expiryDate);
        const reminderDate = addDays(expiryDate, -daysBefore);
        const daysUntilReminder = differenceInDays(reminderDate, today);

        // Only create reminders for future dates and items expiring within 120 days
        if (daysUntilReminder >= 0 && daysUntilReminder <= 120) {
          newReminders.push({
            id: `reminder_${Date.now()}_${Math.random()}`,
            itemType: 'license',
            itemId: license.id,
            itemName: license.licenseName,
            dueDate: license.expiryDate,
            reminderDate: reminderDate.toISOString().split('T')[0],
            daysBefore,
            status: 'pending',
            priority: daysBefore <= 30 ? 'high' : daysBefore <= 60 ? 'medium' : 'low',
            notificationMethod: reminderSettings.notificationMethod,
            createdAt: new Date().toISOString()
          });
        }
      });
    });

    // Generate reminders for filings
    filings.forEach(filing => {
      if (filing.status === 'filed' || !filing.dueDate) return;
      
      (reminderSettings.customReminders?.filings || [7, 14, 30]).forEach(daysBefore => {
        const reminderKey = `filing_${filing.id}_${daysBefore}`;
        if (existingReminderKeys.has(reminderKey)) return;

        const dueDate = parseISO(filing.dueDate);
        const reminderDate = addDays(dueDate, -daysBefore);
        const daysUntilReminder = differenceInDays(reminderDate, today);

        if (daysUntilReminder >= 0 && daysUntilReminder <= 120) {
          newReminders.push({
            id: `reminder_${Date.now()}_${Math.random()}`,
            itemType: 'filing',
            itemId: filing.id,
            itemName: filing.filingName,
            dueDate: filing.dueDate,
            reminderDate: reminderDate.toISOString().split('T')[0],
            daysBefore,
            status: 'pending',
            priority: daysBefore <= 7 ? 'high' : daysBefore <= 14 ? 'medium' : 'low',
            notificationMethod: reminderSettings.notificationMethod,
            createdAt: new Date().toISOString()
          });
        }
      });
    });

    // Generate reminders for tax account filings
    taxAccounts.forEach(account => {
      if (account.status !== 'active' || !account.nextFilingDate) return;
      
      (reminderSettings.customReminders?.taxAccounts || [15, 30]).forEach(daysBefore => {
        const reminderKey = `tax-account_${account.id}_${daysBefore}`;
        if (existingReminderKeys.has(reminderKey)) return;

        const filingDate = parseISO(account.nextFilingDate!);
        const reminderDate = addDays(filingDate, -daysBefore);
        const daysUntilReminder = differenceInDays(reminderDate, today);

        if (daysUntilReminder >= 0 && daysUntilReminder <= 120) {
          newReminders.push({
            id: `reminder_${Date.now()}_${Math.random()}`,
            itemType: 'tax-account',
            itemId: account.id,
            itemName: `${account.accountName} Filing`,
            dueDate: account.nextFilingDate!,
            reminderDate: reminderDate.toISOString().split('T')[0],
            daysBefore,
            status: 'pending',
            priority: daysBefore <= 15 ? 'high' : 'medium',
            notificationMethod: reminderSettings.notificationMethod,
            createdAt: new Date().toISOString()
          });
        }
      });
    });

    if (newReminders.length > 0) {
      const updatedReminders = [...reminders, ...newReminders];
      await saveReminders(updatedReminders);
      setReminders(updatedReminders);
    }
  };

  // Run automatic reminder generation when data changes
  useEffect(() => {
    if (!loading && reminderSettings.enabled && reminderSettings.autoGenerate) {
      generateAutomaticReminders();
    }
  }, [licenses, taxAccounts, filings, reminderSettings.enabled, reminderSettings.autoGenerate]);

  const handleDismissReminder = async (reminderId: string) => {
    try {
      const updated = reminders.map(r =>
        r.id === reminderId
          ? { ...r, status: 'dismissed' as const, dismissedDate: new Date().toISOString() }
          : r
      );
      await saveReminders(updated);
      setReminders(updated);
      toast.success('Reminder dismissed');
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      toast.error('Failed to dismiss reminder');
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const updated = reminders.map(r =>
        r.id === reminderId ? { ...r, status: 'completed' as const } : r
      );
      await saveReminders(updated);
      setReminders(updated);
      toast.success('Reminder marked as completed');
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast.error('Failed to complete reminder');
    }
  };

  const metrics = useMemo(() => {
    const today = new Date();
    
    const activeLicenses = licenses.filter(l => l.status === 'active').length;
    
    const expiring30 = licenses.filter(l => {
      if (!l.expiryDate) return false;
      const days = differenceInDays(parseISO(l.expiryDate), today);
      return days >= 0 && days <= 30;
    }).length;
    
    const expiring60 = licenses.filter(l => {
      if (!l.expiryDate) return false;
      const days = differenceInDays(parseISO(l.expiryDate), today);
      return days >= 31 && days <= 60;
    }).length;
    
    const expiring90 = licenses.filter(l => {
      if (!l.expiryDate) return false;
      const days = differenceInDays(parseISO(l.expiryDate), today);
      return days >= 61 && days <= 90;
    }).length;
    
    const pendingFilings = filings.filter(f => f.status === 'pending' || f.status === 'overdue').length;
    
    const statesCovered = new Set<string>();
    licenses.forEach(l => {
      if (l.jurisdiction && l.jurisdictionLevel === 'state') statesCovered.add(l.jurisdiction);
      if (l.linkedStates) l.linkedStates.forEach(s => statesCovered.add(s));
    });
    taxAccounts.forEach(t => {
      if (t.state) statesCovered.add(t.state);
    });
    filings.forEach(f => {
      if (f.state) statesCovered.add(f.state);
    });
    
    const goodStandingCompliant = licenses.filter(l => l.goodStandingStatus === 'compliant').length;
    const goodStandingTotal = licenses.filter(l => l.goodStandingStatus).length;
    const goodStandingPercentage = goodStandingTotal > 0 
      ? Math.round((goodStandingCompliant / goodStandingTotal) * 100) 
      : 100;
    
    return {
      activeLicenses,
      expiring30,
      expiring60,
      expiring90,
      pendingFilings,
      statesCovered: statesCovered.size,
      goodStandingPercentage,
      totalTaxAccounts: taxAccounts.length,
      activeTaxAccounts: taxAccounts.filter(t => t.status === 'active').length
    };
  }, [licenses, taxAccounts, filings]);

  const stateCompliance = useMemo(() => {
    const stateData: Record<string, { 
      status: 'compliant' | 'expiring-soon' | 'non-compliant';
      licenses: number;
      taxAccounts: number;
      filings: number;
      issues: number;
    }> = {};
    
    US_STATES.forEach(state => {
      const stateLicenses = licenses.filter(l => 
        l.jurisdiction === state.code || 
        l.linkedStates?.includes(state.code)
      );
      const stateTaxAccounts = taxAccounts.filter(t => t.state === state.code);
      const stateFilings = filings.filter(f => f.state === state.code);
      
      if (stateLicenses.length === 0 && stateTaxAccounts.length === 0 && stateFilings.length === 0) {
        return;
      }
      
      const issues = [
        ...stateLicenses.filter(l => l.requiresAction || l.status === 'expired'),
        ...stateFilings.filter(f => f.status === 'overdue')
      ].length;
      
      const today = new Date();
      const expiringSoon = stateLicenses.filter(l => {
        if (!l.expiryDate) return false;
        const days = differenceInDays(parseISO(l.expiryDate), today);
        return days >= 0 && days <= 30;
      }).length;
      
      let status: 'compliant' | 'expiring-soon' | 'non-compliant' = 'compliant';
      if (issues > 0) {
        status = 'non-compliant';
      } else if (expiringSoon > 0) {
        status = 'expiring-soon';
      }
      
      stateData[state.code] = {
        status,
        licenses: stateLicenses.length,
        taxAccounts: stateTaxAccounts.length,
        filings: stateFilings.length,
        issues: issues + expiringSoon
      };
    });
    
    return stateData;
  }, [licenses, taxAccounts, filings]);

  useEffect(() => {
    const generateRecommendations = async () => {
      if (employees.length === 0) return;
      
      const newRecommendations: Recommendation[] = [];
      
      const employeeStates = new Set(employees.map(e => e.state).filter(Boolean));
      const licensedStates = new Set(
        licenses
          .filter(l => l.jurisdictionLevel === 'state')
          .map(l => l.jurisdiction)
      );
      const taxAccountStates = new Set(taxAccounts.map(t => t.state).filter(Boolean));
      
      employeeStates.forEach(state => {
        if (!taxAccountStates.has(state)) {
          newRecommendations.push({
            id: `rec_tax_${state}_${Date.now()}`,
            type: 'tax-account',
            title: `Register for ${state} payroll taxes`,
            description: `You have employees in ${state} but no payroll tax accounts registered.`,
            state,
            reason: 'Employees detected in this state',
            priority: 'high',
            status: 'new',
            createdAt: new Date().toISOString()
          });
        }
        
        if (!licensedStates.has(state)) {
          newRecommendations.push({
            id: `rec_license_${state}_${Date.now()}`,
            type: 'license',
            title: `Check ${state} business license requirements`,
            description: `Review if a business license is required in ${state} for your operations.`,
            state,
            reason: 'New state expansion detected',
            priority: 'medium',
            status: 'new',
            createdAt: new Date().toISOString()
          });
        }
      });
      
      const existingIds = new Set(recommendations.map(r => `${r.type}_${r.state}`));
      const filteredNew = newRecommendations.filter(
        r => !existingIds.has(`${r.type}_${r.state}`)
      );
      
      if (filteredNew.length > 0) {
        const updated = [...recommendations, ...filteredNew];
        setRecommendations(updated);
        await saveRecommendations(updated);
      }
    };
    
    if (employees.length > 0 && !loading) {
      generateRecommendations();
    }
  }, [employees, licenses, taxAccounts]);

  const handleAddLicense = async () => {
    try {
      if (!licenseFormData.licenseName || !licenseFormData.jurisdiction || !licenseFormData.expiryDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newLicense: Partial<BusinessLicense> = {
        ...licenseFormData,
        id: `license_${Date.now()}`,
        createdAt: new Date().toISOString(),
        requiresAction: false,
      };

      const response = await fetch(`${API_URL}/business-licenses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLicense)
      });

      if (!response.ok) throw new Error('Failed to add license');

      await fetchAllData();
      setShowAddLicenseDialog(false);
      setLicenseFormData({
        jurisdictionLevel: 'state',
        relatedTo: 'company',
        status: 'active',
        requiresAction: false
      });
      toast.success('License added successfully');
    } catch (error) {
      console.error('Error adding license:', error);
      toast.error('Failed to add license');
    }
  };

  const handleEditLicense = async () => {
    try {
      if (!licenseFormData.licenseName || !licenseFormData.jurisdiction || !licenseFormData.expiryDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!selectedLicense) {
        toast.error('No license selected');
        return;
      }

      const updatedLicense: BusinessLicense = {
        ...selectedLicense,
        ...licenseFormData,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/business-licenses/${selectedLicense.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedLicense)
      });

      if (!response.ok) throw new Error('Failed to update license');

      await fetchAllData();
      setShowEditLicenseDialog(false);
      setSelectedLicense(null);
      setLicenseFormData({
        jurisdictionLevel: 'state',
        relatedTo: 'company',
        status: 'active',
        requiresAction: false
      });
      toast.success('License updated successfully');
    } catch (error) {
      console.error('Error updating license:', error);
      toast.error('Failed to update license');
    }
  };

  const handleDeleteLicense = async (licenseId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this license?')) {
        return;
      }

      const response = await fetch(`${API_URL}/business-licenses/${licenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete license');

      await fetchAllData();
      toast.success('License deleted successfully');
    } catch (error) {
      console.error('Error deleting license:', error);
      toast.error('Failed to delete license');
    }
  };

  const handleAddTaxAccount = async () => {
    try {
      if (!taxFormData.accountName || !taxFormData.accountNumber || !taxFormData.jurisdiction) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newAccount: TaxAccount = {
        id: `tax_${Date.now()}`,
        accountType: taxFormData.accountType!,
        accountName: taxFormData.accountName!,
        accountNumber: taxFormData.accountNumber!,
        state: taxFormData.state,
        county: taxFormData.county,
        locality: taxFormData.locality,
        jurisdiction: taxFormData.jurisdiction!,
        registrationDate: taxFormData.registrationDate!,
        filingFrequency: taxFormData.filingFrequency!,
        nextFilingDate: taxFormData.nextFilingDate,
        lastFilingDate: taxFormData.lastFilingDate,
        status: taxFormData.status!,
        portalLink: taxFormData.portalLink,
        contactPerson: taxFormData.contactPerson,
        contactPhone: taxFormData.contactPhone,
        notes: taxFormData.notes,
        reminderDaysBefore: taxFormData.reminderDaysBefore,
        createdAt: new Date().toISOString()
      };

      const updatedAccounts = [...taxAccounts, newAccount];
      await saveTaxAccounts(updatedAccounts);
      setTaxAccounts(updatedAccounts);
      setShowAddTaxDialog(false);
      setTaxFormData({
        accountType: 'state-withholding',
        filingFrequency: 'quarterly',
        status: 'active'
      });
      toast.success('Tax account added successfully');
    } catch (error) {
      console.error('Error adding tax account:', error);
      toast.error('Failed to add tax account');
    }
  };

  const handleEditTaxAccount = async () => {
    try {
      if (!taxFormData.accountName || !taxFormData.accountNumber || !taxFormData.jurisdiction) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!selectedTaxAccount) {
        toast.error('No tax account selected');
        return;
      }

      const updatedAccount: TaxAccount = {
        ...selectedTaxAccount,
        accountType: taxFormData.accountType!,
        accountName: taxFormData.accountName!,
        accountNumber: taxFormData.accountNumber!,
        state: taxFormData.state,
        county: taxFormData.county,
        locality: taxFormData.locality,
        jurisdiction: taxFormData.jurisdiction!,
        registrationDate: taxFormData.registrationDate!,
        filingFrequency: taxFormData.filingFrequency!,
        nextFilingDate: taxFormData.nextFilingDate,
        lastFilingDate: taxFormData.lastFilingDate,
        status: taxFormData.status!,
        portalLink: taxFormData.portalLink,
        contactPerson: taxFormData.contactPerson,
        contactPhone: taxFormData.contactPhone,
        notes: taxFormData.notes,
        reminderDaysBefore: taxFormData.reminderDaysBefore
      };

      const updatedAccounts = taxAccounts.map(acc => 
        acc.id === selectedTaxAccount.id ? updatedAccount : acc
      );
      
      await saveTaxAccounts(updatedAccounts);
      setTaxAccounts(updatedAccounts);
      setShowEditTaxDialog(false);
      setSelectedTaxAccount(null);
      setTaxFormData({
        accountType: 'state-withholding',
        filingFrequency: 'quarterly',
        status: 'active'
      });
      toast.success('Tax account updated successfully');
    } catch (error) {
      console.error('Error updating tax account:', error);
      toast.error('Failed to update tax account');
    }
  };

  const handleDeleteTaxAccount = async (accountId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this tax account?')) {
        return;
      }

      const updatedAccounts = taxAccounts.filter(acc => acc.id !== accountId);
      await saveTaxAccounts(updatedAccounts);
      setTaxAccounts(updatedAccounts);
      toast.success('Tax account deleted successfully');
    } catch (error) {
      console.error('Error deleting tax account:', error);
      toast.error('Failed to delete tax account');
    }
  };

  const handleAddFiling = async () => {
    try {
      if (!filingFormData.filingName || !filingFormData.jurisdiction || !filingFormData.dueDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newFiling: Filing = {
        id: `filing_${Date.now()}`,
        filingType: filingFormData.filingType!,
        filingName: filingFormData.filingName!,
        state: filingFormData.state,
        jurisdiction: filingFormData.jurisdiction!,
        dueDate: filingFormData.dueDate!,
        filedDate: filingFormData.filedDate,
        status: filingFormData.status!,
        fee: filingFormData.fee,
        confirmationNumber: filingFormData.confirmationNumber,
        documentUrl: filingFormData.documentUrl,
        notes: filingFormData.notes,
        linkedLicenseId: filingFormData.linkedLicenseId,
        createdAt: new Date().toISOString()
      };

      const updatedFilings = [...filings, newFiling];
      await saveFilings(updatedFilings);
      setFilings(updatedFilings);
      setShowAddFilingDialog(false);
      setFilingFormData({
        filingType: 'annual-report',
        status: 'pending'
      });
      toast.success('Filing added successfully');
    } catch (error) {
      console.error('Error adding filing:', error);
      toast.error('Failed to add filing');
    }
  };

  const handleDismissRecommendation = async (recId: string) => {
    try {
      const updated = recommendations.map(r => 
        r.id === recId ? { ...r, status: 'dismissed' as const } : r
      );
      await saveRecommendations(updated);
      setRecommendations(updated);
      toast.success('Recommendation dismissed');
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      toast.error('Failed to dismiss recommendation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'active':
      case 'filed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'expiring-soon':
      case 'pending':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'overdue':
      case 'expired':
      case 'non-compliant':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getStateColor = (stateCode: string): string => {
    const compliance = stateCompliance[stateCode];
    if (!compliance) return '#E5E7EB';
    switch (compliance.status) {
      case 'compliant':
        return '#10B981';
      case 'expiring-soon':
        return '#F59E0B';
      case 'non-compliant':
        return '#EF4444';
      default:
        return '#E5E7EB';
    }
  };

  const handleStateClick = (stateCode: string) => {
    if (stateCompliance[stateCode]) {
      setSelectedState(stateCode);
      setShowStateDetailSheet(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-8">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg mb-1">Overview</h2>
                <p className="text-sm text-muted-foreground">
                  Comprehensive compliance tracking and management
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search compliance items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-80"
                  />
                </div>
                <Button variant="outline" onClick={() => fetchAllData()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-muted-foreground">Active<br/>Licenses</p>
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-3xl mb-1">{metrics.activeLicenses}</p>
                  <p className="text-xs text-muted-foreground">Total active</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-muted-foreground">Expiring<br/>Soon</p>
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-3xl mb-1">{metrics.expiring30}</p>
                  <p className="text-xs text-muted-foreground">Within 30 days</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{metrics.expiring60} in 60d</span>
                    <span>{metrics.expiring90} in 90d</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-muted-foreground">Pending<br/>Filings</p>
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-3xl mb-1">{metrics.pendingFilings}</p>
                  <p className="text-xs text-muted-foreground">Require attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-muted-foreground">States<br/>Covered</p>
                    <Map className="h-5 w-5 text-teal-600" />
                  </div>
                  <p className="text-3xl mb-1">{metrics.statesCovered}</p>
                  <p className="text-xs text-muted-foreground">Jurisdictions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-muted-foreground">Good<br/>Standing</p>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-3xl mb-1">{metrics.goodStandingPercentage}%</p>
                  <p className="text-xs text-muted-foreground">Compliant</p>
                </CardContent>
              </Card>
            </div>

            {/* State Compliance Overview - Grid of Circles */}
            <Card>
              <CardHeader>
                <CardTitle>State-by-State Compliance Overview</CardTitle>
                <CardDescription>
                  Click any state to view detailed compliance information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div className="flex-1">
                    <div className="grid grid-cols-10 gap-3">
                      {US_STATES.map((state) => {
                        const compliance = stateCompliance[state.code];
                        const color = getStateColor(state.code);
                        const isHovered = hoveredState === state.code;
                        
                        return (
                          <div
                            key={state.code}
                            className="relative group"
                            onMouseEnter={() => setHoveredState(state.code)}
                            onMouseLeave={() => setHoveredState(null)}
                            onClick={() => handleStateClick(state.code)}
                          >
                            <div
                              className={`
                                w-16 h-16 rounded-full flex items-center justify-center
                                transition-all duration-200 cursor-pointer
                                ${isHovered ? 'scale-110 shadow-lg' : 'shadow'}
                              `}
                              style={{ 
                                backgroundColor: color,
                                opacity: compliance ? 1 : 0.4,
                                border: isHovered ? '3px solid #2563EB' : '2px solid white'
                              }}
                            >
                              <span className="text-white text-xs font-bold">
                                {state.code}
                              </span>
                            </div>
                            
                            {/* Tooltip on hover */}
                            {isHovered && compliance && (
                              <div className="absolute z-10 left-1/2 transform -translate-x-1/2 -top-20 w-48 bg-white border rounded-lg shadow-lg p-3">
                                <p className="text-sm mb-1">{state.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {compliance.licenses} licenses • {compliance.taxAccounts} tax accounts
                                </p>
                                {compliance.issues > 0 && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {compliance.issues} issue(s)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="w-48">
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="text-sm mb-3">Legend</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#10B981]" />
                          <span className="text-xs">Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#F59E0B]" />
                          <span className="text-xs">Expiring Soon</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#EF4444]" />
                          <span className="text-xs">Non-Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#E5E7EB]" />
                          <span className="text-xs">No Activity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('licenses')}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-base">Licenses & Registrations</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Manage all business and professional licenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{licenses.length} total</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('tax-accounts')}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-base">Tax Accounts</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Federal, state, county, and local tax registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{taxAccounts.length} accounts</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('filings')}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-base">Filings & Reports</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Annual reports and compliance filings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{filings.length} filings</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('reminders')}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BellRing className="h-5 w-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-base">Reminders</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Automated renewal and filing reminders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {reminders.filter(r => r.status === 'pending').length} pending
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('recommendations')}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                    </div>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    AI-driven compliance insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {recommendations.filter(r => r.status === 'new').length} new
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('integrations')}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Link2 className="h-5 w-5 text-teal-600" />
                    </div>
                    <CardTitle className="text-base">Integrations</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Connected systems and data sync
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {integrations.filter(i => i.status === 'active').length} active
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('reports')}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <CardTitle className="text-base">Reports</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Generate compliance and audit reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">6 available</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Licenses View */}
        {activeView === 'licenses' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h2 className="text-lg">Licenses & Registrations</h2>
                <p className="text-sm text-muted-foreground">
                  Manage all business and professional licenses
                </p>
              </div>
              <Button onClick={() => setShowAddLicenseDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add License
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Issuing Authority</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground mb-3">No licenses found</p>
                          <Button onClick={() => setShowAddLicenseDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First License
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      licenses.map(license => {
                        const daysToExpiry = differenceInDays(parseISO(license.expiryDate), new Date());
                        return (
                          <TableRow key={license.id}>
                            <TableCell>
                              <div>
                                <p className="text-sm">{license.licenseName}</p>
                                {license.licenseNumber && (
                                  <p className="text-xs text-muted-foreground">#{license.licenseNumber}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{license.licenseType}</TableCell>
                            <TableCell className="text-sm">{license.jurisdiction}</TableCell>
                            <TableCell className="text-sm">{license.issuingAuthority}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{format(parseISO(license.expiryDate), 'MMM d, yyyy')}</p>
                                <div className="flex items-center gap-2">
                                  <p className={`text-xs ${
                                    daysToExpiry < 0 ? 'text-red-600' :
                                    daysToExpiry <= 30 ? 'text-amber-600' :
                                    'text-muted-foreground'
                                  }`}>
                                    {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry} days`}
                                  </p>
                                  {license.reminderDaysBefore && (
                                    <Badge variant="outline" className="text-xs">
                                      <BellRing className="h-3 w-3 mr-1" />
                                      {license.reminderDaysBefore}d
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(license.status)}>
                                {license.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedLicense(license);
                                    setLicenseFormData(license);
                                    setShowEditLicenseDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedLicense(license);
                                    setShowDetailSheet(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {license.portalLink && (
                                  <Button size="sm" variant="ghost" asChild>
                                    <a href={license.portalLink} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeleteLicense(license.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tax Accounts View */}
        {activeView === 'tax-accounts' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h2 className="text-lg">Tax Accounts</h2>
                <p className="text-sm text-muted-foreground">
                  Federal, state, county, and local tax registrations
                </p>
              </div>
              <Button onClick={() => setShowAddTaxDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Account
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Filing Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground mb-3">No tax accounts found</p>
                          <Button onClick={() => setShowAddTaxDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Tax Account
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      taxAccounts.map(account => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {account.accountType.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{account.accountName}</TableCell>
                          <TableCell className="font-mono text-xs">{account.accountNumber}</TableCell>
                          <TableCell className="text-sm">{account.jurisdiction}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="capitalize text-xs">{account.filingFrequency}</span>
                              {account.reminderDaysBefore && (
                                <Badge variant="outline" className="text-xs">
                                  <BellRing className="h-3 w-3 mr-1" />
                                  {account.reminderDaysBefore}d
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(account.status)}>
                              {account.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTaxAccount(account);
                                  setTaxFormData(account);
                                  setShowEditTaxDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {account.portalLink && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={account.portalLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteTaxAccount(account.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
          </div>
        )}

        {/* Filings View */}
        {activeView === 'filings' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h2 className="text-lg">Filings & Reports</h2>
                <p className="text-sm text-muted-foreground">
                  Annual reports and compliance filings
                </p>
              </div>
              <Button onClick={() => setShowAddFilingDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Filing
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filing Type</TableHead>
                      <TableHead>Filing Name</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground mb-3">No filings found</p>
                          <Button onClick={() => setShowAddFilingDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Filing
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filings.map(filing => (
                        <TableRow key={filing.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {filing.filingType.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{filing.filingName}</TableCell>
                          <TableCell className="text-sm">{filing.jurisdiction}</TableCell>
                          <TableCell className="text-sm">{format(parseISO(filing.dueDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(filing.status)}>
                              {filing.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {filing.documentUrl && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={filing.documentUrl} target="_blank" rel="noopener noreferrer">
                                  <FileCheck className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations View */}
        {activeView === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h2 className="text-lg">Recommendations</h2>
                <p className="text-sm text-muted-foreground">
                  AI-driven compliance insights
                </p>
              </div>
            </div>

            {recommendations.filter(r => r.status !== 'dismissed').length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600 opacity-50" />
                  <p className="text-lg mb-2">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    No new recommendations at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recommendations.filter(r => r.status !== 'dismissed').map(rec => (
                  <Card key={rec.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm mb-1">{rec.title}</p>
                            <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {rec.type.replace('-', ' ')}
                              </Badge>
                              {rec.state && (
                                <Badge variant="outline" className="text-xs">
                                  {rec.state}
                                </Badge>
                              )}
                              <Badge 
                                className={`text-xs ${
                                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  rec.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {rec.priority} priority
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (rec.type === 'license') setShowAddLicenseDialog(true);
                              else if (rec.type === 'tax-account') setShowAddTaxDialog(true);
                              else if (rec.type === 'filing') setShowAddFilingDialog(true);
                            }}
                          >
                            Take Action
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDismissRecommendation(rec.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Integrations View */}
        {activeView === 'integrations' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h2 className="text-lg">Integrations</h2>
                <p className="text-sm text-muted-foreground">
                  Connected systems and data sync
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {integrations.map(integration => (
                <Card key={integration.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          integration.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Link2 className={`h-5 w-5 ${
                            integration.status === 'active' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <CardDescription className="mt-1 capitalize text-xs">
                            {integration.module.replace('-', ' ')}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {integration.lastSync && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Last synced: {format(parseISO(integration.lastSync), 'MMM d, h:mm a')}
                      </p>
                    )}
                    {integration.data && (
                      <div className="space-y-1 text-xs">
                        {Object.entries(integration.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reminders View */}
        {activeView === 'reminders' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h2 className="text-lg">Automated Reminders</h2>
                <p className="text-sm text-muted-foreground">
                  Manage renewal and filing reminders
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowReminderSettingsDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button onClick={() => generateAutomaticReminders()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Reminders
              </Button>
            </div>

            {/* Reminders Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <BellRing className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-2xl">{reminders.filter(r => r.status === 'pending').length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl">
                    {reminders.filter(r => r.status === 'pending' && r.priority === 'high').length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl">
                    {reminders.filter(r => {
                      if (r.status !== 'pending') return false;
                      const days = differenceInDays(parseISO(r.reminderDate), new Date());
                      return days >= 0 && days <= 7;
                    }).length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Auto-Generate</p>
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={reminderSettings.autoGenerate ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {reminderSettings.autoGenerate ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reminders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Active Reminders</CardTitle>
                <CardDescription>
                  Upcoming license renewals and filing deadlines
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Reminder Date</TableHead>
                      <TableHead>Days Before</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders
                      .filter(r => r.status === 'pending')
                      .sort((a, b) => parseISO(a.reminderDate).getTime() - parseISO(b.reminderDate).getTime())
                      .map(reminder => {
                        const daysUntilReminder = differenceInDays(parseISO(reminder.reminderDate), new Date());
                        return (
                          <TableRow key={reminder.id}>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">
                                {reminder.itemType.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{reminder.itemName}</TableCell>
                            <TableCell className="text-sm">
                              {format(parseISO(reminder.dueDate), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{format(parseISO(reminder.reminderDate), 'MMM d, yyyy')}</p>
                                <p className={`text-xs ${
                                  daysUntilReminder < 0 ? 'text-red-600' :
                                  daysUntilReminder === 0 ? 'text-amber-600' :
                                  daysUntilReminder <= 7 ? 'text-orange-600' :
                                  'text-muted-foreground'
                                }`}>
                                  {daysUntilReminder < 0 ? 'Overdue' :
                                   daysUntilReminder === 0 ? 'Today' :
                                   `in ${daysUntilReminder} days`}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{reminder.daysBefore} days</TableCell>
                            <TableCell>
                              <Badge className={
                                reminder.priority === 'high' ? 'bg-red-100 text-red-800' :
                                reminder.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }>
                                {reminder.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(reminder.status)}>
                                {reminder.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleCompleteReminder(reminder.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDismissReminder(reminder.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {reminders.filter(r => r.status === 'pending').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <BellRing className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground mb-3">No pending reminders</p>
                          <Button onClick={() => generateAutomaticReminders()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate Reminders
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Completed/Dismissed Reminders */}
            {reminders.filter(r => r.status !== 'pending').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Reminder History</CardTitle>
                  <CardDescription>
                    Completed and dismissed reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reminders
                        .filter(r => r.status !== 'pending')
                        .slice(0, 10)
                        .map(reminder => (
                          <TableRow key={reminder.id}>
                            <TableCell className="text-sm">{reminder.itemName}</TableCell>
                            <TableCell className="text-sm">
                              {format(parseISO(reminder.dueDate), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(reminder.status)}>
                                {reminder.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {reminder.dismissedDate
                                ? format(parseISO(reminder.dismissedDate), 'MMM d, yyyy')
                                : reminder.sentDate
                                ? format(parseISO(reminder.sentDate), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Reports View */}
        {activeView === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView('overview')}>
                ← Back to Overview
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-1">
                <h2 className="text-lg">Reports</h2>
                <p className="text-sm text-muted-foreground">
                  Generate compliance and audit reports
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-base">Compliance Summary</CardTitle>
                  <CardDescription className="text-xs">
                    Overview of all licenses and filings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-3 w-3 mr-2" />
                    Generate
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <Map className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-base">State-by-State</CardTitle>
                  <CardDescription className="text-xs">
                    Compliance by jurisdiction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-3 w-3 mr-2" />
                    Generate
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <Clock className="h-8 w-8 text-amber-600 mb-2" />
                  <CardTitle className="text-base">Renewal Calendar</CardTitle>
                  <CardDescription className="text-xs">
                    Upcoming deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-3 w-3 mr-2" />
                    Generate
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      
      {/* Add License Dialog */}
      <Dialog open={showAddLicenseDialog} onOpenChange={setShowAddLicenseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New License</DialogTitle>
            <DialogDescription id="add-license-dialog-description">
              Enter the license details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>License Name *</Label>
              <Input
                value={licenseFormData.licenseName || ''}
                onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseName: e.target.value })}
                placeholder="e.g., Business Operating License"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Type</Label>
                <Input
                  value={licenseFormData.licenseType || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseType: e.target.value })}
                  placeholder="e.g., Business"
                />
              </div>
              
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={licenseFormData.licenseNumber || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jurisdiction Level *</Label>
                <Select
                  value={licenseFormData.jurisdictionLevel}
                  onValueChange={(value: any) => setLicenseFormData({ ...licenseFormData, jurisdictionLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Jurisdiction *</Label>
                <Select
                  value={licenseFormData.jurisdiction || ''}
                  onValueChange={(value) => setLicenseFormData({ ...licenseFormData, jurisdiction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issuing Authority *</Label>
              <Input
                value={licenseFormData.issuingAuthority || ''}
                onChange={(e) => setLicenseFormData({ ...licenseFormData, issuingAuthority: e.target.value })}
                placeholder="e.g., Department of Revenue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input
                  type="date"
                  value={licenseFormData.issueDate || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, issueDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  value={licenseFormData.expiryDate || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Portal Link</Label>
                <Input
                  value={licenseFormData.portalLink || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, portalLink: e.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label>Reminder (Days Before Expiry)</Label>
                <Select
                  value={licenseFormData.reminderDaysBefore?.toString() || '30'}
                  onValueChange={(value) => setLicenseFormData({ ...licenseFormData, reminderDaysBefore: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days before</SelectItem>
                    <SelectItem value="14">14 days before</SelectItem>
                    <SelectItem value="30">30 days before</SelectItem>
                    <SelectItem value="60">60 days before</SelectItem>
                    <SelectItem value="90">90 days before</SelectItem>
                    <SelectItem value="120">120 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={licenseFormData.notes || ''}
                onChange={(e) => setLicenseFormData({ ...licenseFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLicenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLicense}>
              Add License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit License Dialog */}
      <Dialog open={showEditLicenseDialog} onOpenChange={setShowEditLicenseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
            <DialogDescription id="edit-license-dialog-description">
              Update the license details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>License Name *</Label>
              <Input
                value={licenseFormData.licenseName || ''}
                onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseName: e.target.value })}
                placeholder="e.g., Business Operating License"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Type</Label>
                <Input
                  value={licenseFormData.licenseType || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseType: e.target.value })}
                  placeholder="e.g., Business"
                />
              </div>
              
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={licenseFormData.licenseNumber || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, licenseNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jurisdiction Level *</Label>
                <Select
                  value={licenseFormData.jurisdictionLevel}
                  onValueChange={(value: any) => setLicenseFormData({ ...licenseFormData, jurisdictionLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Jurisdiction *</Label>
                <Select
                  value={licenseFormData.jurisdiction || ''}
                  onValueChange={(value) => setLicenseFormData({ ...licenseFormData, jurisdiction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issuing Authority *</Label>
              <Input
                value={licenseFormData.issuingAuthority || ''}
                onChange={(e) => setLicenseFormData({ ...licenseFormData, issuingAuthority: e.target.value })}
                placeholder="e.g., Department of Revenue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input
                  type="date"
                  value={licenseFormData.issueDate || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, issueDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  value={licenseFormData.expiryDate || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={licenseFormData.status}
                onValueChange={(value: any) => setLicenseFormData({ ...licenseFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pending-renewal">Pending Renewal</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="not-required">Not Required</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Portal Link</Label>
                <Input
                  value={licenseFormData.portalLink || ''}
                  onChange={(e) => setLicenseFormData({ ...licenseFormData, portalLink: e.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label>Reminder (Days Before Expiry)</Label>
                <Select
                  value={licenseFormData.reminderDaysBefore?.toString() || '30'}
                  onValueChange={(value) => setLicenseFormData({ ...licenseFormData, reminderDaysBefore: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days before</SelectItem>
                    <SelectItem value="14">14 days before</SelectItem>
                    <SelectItem value="30">30 days before</SelectItem>
                    <SelectItem value="60">60 days before</SelectItem>
                    <SelectItem value="90">90 days before</SelectItem>
                    <SelectItem value="120">120 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={licenseFormData.notes || ''}
                onChange={(e) => setLicenseFormData({ ...licenseFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditLicenseDialog(false);
              setSelectedLicense(null);
              setLicenseFormData({
                jurisdictionLevel: 'state',
                relatedTo: 'company',
                status: 'active',
                requiresAction: false
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditLicense}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tax Account Dialog */}
      <Dialog open={showAddTaxDialog} onOpenChange={setShowAddTaxDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Tax Account</DialogTitle>
            <DialogDescription id="add-tax-dialog-description">
              Register a new tax account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select
                value={taxFormData.accountType}
                onValueChange={(value: any) => setTaxFormData({ ...taxFormData, accountType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="federal-ein">Federal EIN</SelectItem>
                  <SelectItem value="state-withholding">State Withholding</SelectItem>
                  <SelectItem value="state-unemployment">State Unemployment</SelectItem>
                  <SelectItem value="county-tax">County Tax</SelectItem>
                  <SelectItem value="local-tax">Local Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  value={taxFormData.accountName || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, accountName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input
                  value={taxFormData.accountNumber || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, accountNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={taxFormData.state || ''}
                  onValueChange={(value) => setTaxFormData({ ...taxFormData, state: value, jurisdiction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Jurisdiction *</Label>
                <Input
                  value={taxFormData.jurisdiction || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, jurisdiction: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Date *</Label>
                <Input
                  type="date"
                  value={taxFormData.registrationDate || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, registrationDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Filing Frequency *</Label>
                <Select
                  value={taxFormData.filingFrequency}
                  onValueChange={(value: any) => setTaxFormData({ ...taxFormData, filingFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Next Filing Date</Label>
                <Input
                  type="date"
                  value={taxFormData.nextFilingDate || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, nextFilingDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Reminder (Days Before Filing)</Label>
                <Select
                  value={taxFormData.reminderDaysBefore?.toString() || '15'}
                  onValueChange={(value) => setTaxFormData({ ...taxFormData, reminderDaysBefore: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days before</SelectItem>
                    <SelectItem value="15">15 days before</SelectItem>
                    <SelectItem value="30">30 days before</SelectItem>
                    <SelectItem value="45">45 days before</SelectItem>
                    <SelectItem value="60">60 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Portal Link</Label>
              <Input
                value={taxFormData.portalLink || ''}
                onChange={(e) => setTaxFormData({ ...taxFormData, portalLink: e.target.value })}
                placeholder="https://"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={taxFormData.contactPerson || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, contactPerson: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={taxFormData.contactPhone || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={taxFormData.notes || ''}
                onChange={(e) => setTaxFormData({ ...taxFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTaxDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTaxAccount}>
              Add Tax Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tax Account Dialog */}
      <Dialog open={showEditTaxDialog} onOpenChange={setShowEditTaxDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tax Account</DialogTitle>
            <DialogDescription id="edit-tax-dialog-description">
              Update tax account information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select
                value={taxFormData.accountType}
                onValueChange={(value: any) => setTaxFormData({ ...taxFormData, accountType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="federal-ein">Federal EIN</SelectItem>
                  <SelectItem value="state-withholding">State Withholding</SelectItem>
                  <SelectItem value="state-unemployment">State Unemployment</SelectItem>
                  <SelectItem value="county-tax">County Tax</SelectItem>
                  <SelectItem value="local-tax">Local Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  value={taxFormData.accountName || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, accountName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Account Number *</Label>
                <Input
                  value={taxFormData.accountNumber || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, accountNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={taxFormData.state || ''}
                  onValueChange={(value) => setTaxFormData({ ...taxFormData, state: value, jurisdiction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Jurisdiction *</Label>
                <Input
                  value={taxFormData.jurisdiction || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, jurisdiction: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registration Date *</Label>
                <Input
                  type="date"
                  value={taxFormData.registrationDate || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, registrationDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Filing Frequency *</Label>
                <Select
                  value={taxFormData.filingFrequency}
                  onValueChange={(value: any) => setTaxFormData({ ...taxFormData, filingFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Next Filing Date</Label>
                <Input
                  type="date"
                  value={taxFormData.nextFilingDate || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, nextFilingDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={taxFormData.status}
                  onValueChange={(value: any) => setTaxFormData({ ...taxFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Portal Link</Label>
                <Input
                  value={taxFormData.portalLink || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, portalLink: e.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label>Reminder (Days Before Filing)</Label>
                <Select
                  value={taxFormData.reminderDaysBefore?.toString() || '15'}
                  onValueChange={(value) => setTaxFormData({ ...taxFormData, reminderDaysBefore: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days before</SelectItem>
                    <SelectItem value="15">15 days before</SelectItem>
                    <SelectItem value="30">30 days before</SelectItem>
                    <SelectItem value="45">45 days before</SelectItem>
                    <SelectItem value="60">60 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={taxFormData.contactPerson || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, contactPerson: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={taxFormData.contactPhone || ''}
                  onChange={(e) => setTaxFormData({ ...taxFormData, contactPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={taxFormData.notes || ''}
                onChange={(e) => setTaxFormData({ ...taxFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditTaxDialog(false);
              setSelectedTaxAccount(null);
              setTaxFormData({
                accountType: 'state-withholding',
                filingFrequency: 'quarterly',
                status: 'active'
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditTaxAccount}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Filing Dialog */}
      <Dialog open={showAddFilingDialog} onOpenChange={setShowAddFilingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Filing</DialogTitle>
            <DialogDescription id="add-filing-dialog-description">
              Track a new compliance filing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Filing Type *</Label>
              <Select
                value={filingFormData.filingType}
                onValueChange={(value: any) => setFilingFormData({ ...filingFormData, filingType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual-report">Annual Report</SelectItem>
                  <SelectItem value="registered-agent">Registered Agent</SelectItem>
                  <SelectItem value="good-standing">Good Standing</SelectItem>
                  <SelectItem value="tax-filing">Tax Filing</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filing Name *</Label>
                <Input
                  value={filingFormData.filingName || ''}
                  onChange={(e) => setFilingFormData({ ...filingFormData, filingName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={filingFormData.state || ''}
                  onValueChange={(value) => setFilingFormData({ ...filingFormData, state: value, jurisdiction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jurisdiction *</Label>
              <Input
                value={filingFormData.jurisdiction || ''}
                onChange={(e) => setFilingFormData({ ...filingFormData, jurisdiction: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={filingFormData.dueDate || ''}
                  onChange={(e) => setFilingFormData({ ...filingFormData, dueDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Filed Date</Label>
                <Input
                  type="date"
                  value={filingFormData.filedDate || ''}
                  onChange={(e) => setFilingFormData({ ...filingFormData, filedDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFilingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFiling}>
              Add Filing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedLicense?.licenseName}</SheetTitle>
            <SheetDescription>
              License details and compliance information
            </SheetDescription>
          </SheetHeader>
          {selectedLicense && (
            <div className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">License Number</Label>
                  <p className="text-sm mt-1">{selectedLicense.licenseNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="text-sm mt-1">{selectedLicense.licenseType}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-xs text-muted-foreground">Jurisdiction</Label>
                <p className="text-sm mt-1">
                  {selectedLicense.jurisdiction} ({selectedLicense.jurisdictionLevel})
                </p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Issuing Authority</Label>
                <p className="text-sm mt-1">{selectedLicense.issuingAuthority}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Issue Date</Label>
                  <p className="text-sm mt-1">{format(parseISO(selectedLicense.issueDate), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                  <p className="text-sm mt-1">{format(parseISO(selectedLicense.expiryDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(selectedLicense.status)}>
                    {selectedLicense.status}
                  </Badge>
                </div>
              </div>
              
              {selectedLicense.portalLink && (
                <>
                  <Separator />
                  <Button variant="outline" className="w-full" asChild>
                    <a href={selectedLicense.portalLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Portal
                    </a>
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* State Detail Sheet */}
      <Sheet open={showStateDetailSheet} onOpenChange={setShowStateDetailSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedState && US_STATES.find(s => s.code === selectedState)?.name}
            </SheetTitle>
            <SheetDescription>
              State compliance details
            </SheetDescription>
          </SheetHeader>
          {selectedState && stateCompliance[selectedState] && (
            <div className="space-y-6 pt-6">
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-xl mb-1">{stateCompliance[selectedState].licenses}</div>
                    <div className="text-xs text-muted-foreground">Licenses</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-xl mb-1">{stateCompliance[selectedState].taxAccounts}</div>
                    <div className="text-xs text-muted-foreground">Tax Accounts</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <div className="text-xl mb-1">{stateCompliance[selectedState].filings}</div>
                    <div className="text-xs text-muted-foreground">Filings</div>
                  </CardContent>
                </Card>
              </div>

              {stateCompliance[selectedState].issues > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Action Required</AlertTitle>
                  <AlertDescription>
                    {stateCompliance[selectedState].issues} items need attention
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reminder Settings Dialog */}
      <Dialog open={showReminderSettingsDialog} onOpenChange={setShowReminderSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reminder Settings</DialogTitle>
            <DialogDescription id="reminder-settings-dialog-description">
              Configure automated reminder notifications for license renewals and filings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Enable/Disable Reminders */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm">Enable Reminders</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Turn on automated reminder notifications
                </p>
              </div>
              <Button
                variant={reminderSettings.enabled ? "default" : "outline"}
                onClick={() => setReminderSettings({ ...reminderSettings, enabled: !reminderSettings.enabled })}
              >
                {reminderSettings.enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Auto-Generate Reminders */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm">Auto-Generate Reminders</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically create reminders for new licenses and filings
                </p>
              </div>
              <Button
                variant={reminderSettings.autoGenerate ? "default" : "outline"}
                onClick={() => setReminderSettings({ ...reminderSettings, autoGenerate: !reminderSettings.autoGenerate })}
                disabled={!reminderSettings.enabled}
              >
                {reminderSettings.autoGenerate ? 'On' : 'Off'}
              </Button>
            </div>

            <Separator />

            {/* Notification Method */}
            <div className="space-y-2">
              <Label>Notification Method</Label>
              <Select
                value={reminderSettings.notificationMethod}
                onValueChange={(value: any) => setReminderSettings({ ...reminderSettings, notificationMethod: value })}
                disabled={!reminderSettings.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="in-app">In-App Only</SelectItem>
                  <SelectItem value="both">Email & In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* License Reminders */}
            <div className="space-y-3">
              <div>
                <Label>License Renewal Reminders</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Days before expiry to send reminders (comma-separated)
                </p>
              </div>
              <Input
                value={reminderSettings.customReminders?.licenses?.join(', ') || '30, 60, 90'}
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                  setReminderSettings({
                    ...reminderSettings,
                    customReminders: { 
                      ...reminderSettings.customReminders, 
                      licenses: values,
                      taxAccounts: reminderSettings.customReminders?.taxAccounts || [15, 30],
                      filings: reminderSettings.customReminders?.filings || [7, 14, 30]
                    }
                  });
                }}
                placeholder="e.g., 30, 60, 90"
                disabled={!reminderSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Current: {reminderSettings.customReminders?.licenses?.join(', ') || '30, 60, 90'} days
              </p>
            </div>

            {/* Tax Account Reminders */}
            <div className="space-y-3">
              <div>
                <Label>Tax Filing Reminders</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Days before filing date to send reminders
                </p>
              </div>
              <Input
                value={reminderSettings.customReminders?.taxAccounts?.join(', ') || '15, 30'}
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                  setReminderSettings({
                    ...reminderSettings,
                    customReminders: { 
                      ...reminderSettings.customReminders,
                      licenses: reminderSettings.customReminders?.licenses || [30, 60, 90],
                      taxAccounts: values,
                      filings: reminderSettings.customReminders?.filings || [7, 14, 30]
                    }
                  });
                }}
                placeholder="e.g., 15, 30"
                disabled={!reminderSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Current: {reminderSettings.customReminders?.taxAccounts?.join(', ') || '15, 30'} days
              </p>
            </div>

            {/* Filing Reminders */}
            <div className="space-y-3">
              <div>
                <Label>Corporate Filing Reminders</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Days before due date to send reminders
                </p>
              </div>
              <Input
                value={reminderSettings.customReminders?.filings?.join(', ') || '7, 14, 30'}
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                  setReminderSettings({
                    ...reminderSettings,
                    customReminders: { 
                      ...reminderSettings.customReminders,
                      licenses: reminderSettings.customReminders?.licenses || [30, 60, 90],
                      taxAccounts: reminderSettings.customReminders?.taxAccounts || [15, 30],
                      filings: values
                    }
                  });
                }}
                placeholder="e.g., 7, 14, 30"
                disabled={!reminderSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Current: {reminderSettings.customReminders?.filings?.join(', ') || '7, 14, 30'} days
              </p>
            </div>

            <Separator />

            {/* Email Recipients */}
            <div className="space-y-2">
              <Label>Email Recipients (Optional)</Label>
              <Textarea
                value={reminderSettings.emailRecipients?.join(', ') || ''}
                onChange={(e) => {
                  const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                  setReminderSettings({ ...reminderSettings, emailRecipients: emails });
                }}
                placeholder="email1@example.com, email2@example.com"
                rows={3}
                disabled={!reminderSettings.enabled || reminderSettings.notificationMethod === 'in-app'}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple email addresses with commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              saveReminderSettings(reminderSettings);
              setShowReminderSettingsDialog(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

