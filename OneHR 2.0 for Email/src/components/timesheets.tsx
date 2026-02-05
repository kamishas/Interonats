import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  User,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
  ChevronsUpDown,
  Send,
  DollarSign,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import type { Employee } from "../types";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// Helper function to parse date strings without timezone issues
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  project: string;
  client: string;
  clientId?: string;
  clientName?: string;
  projectName?: string;
  poNumber?: string;
  hours: number;
  regularHours?: number;
  overtimeHours?: number;
  holidayHours?: number;
  timeOffHours?: number;
  description: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  weekEnding: string;
  invoiceFile?: string;
  clientTimesheetUrl?: string;
  rejectionComment?: string;
  rejectedAt?: string;
}

interface TimesheetsProps {
  employeeEmail?: string; // When provided, auto-select this employee and hide selector
}

// Helper function to get the previous week's Monday-Sunday
const getPreviousWeek = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to go back to get to last week's Monday
  // If today is Sunday (0), go back 6 days to get to Monday
  // If today is Monday (1), go back 7 days to get to last Monday
  // If today is Tuesday (2), go back 8 days, etc.
  const daysToLastMonday = currentDay === 0 ? 6 : currentDay + 6;
  
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);
  
  // Get all 7 days of the week
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(lastMonday);
    day.setDate(lastMonday.getDate() + i);
    weekDays.push(day);
  }
  
  return weekDays;
};

export function Timesheets({ employeeEmail }: TimesheetsProps = {}) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(true);
  
  // Clients and their engagements/POs for project selection
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [projectComboOpen, setProjectComboOpen] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entryMode, setEntryMode] = useState<"manual" | "invoice">("manual");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Weekly hours entry for manual mode
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<Record<string, string>>({});
  
  // Multiple projects per week
  const [weeklyProjects, setWeeklyProjects] = useState<Array<{
    projectId: string;
    clientName: string;
    projectName: string;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
    uploadedFile?: File;
    uploadedFileUrl?: string;
  }>>([]);
  
  // Project selection for adding entries
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [allAvailableProjects, setAllAvailableProjects] = useState<any[]>([]);
  const [employeeProjects, setEmployeeProjects] = useState<any[]>([]);
  const [selectedProjectForEntry, setSelectedProjectForEntry] = useState<string>("");
  const [selectedClientForNewEntry, setSelectedClientForNewEntry] = useState<string>(''); // NEW: Track selected client
  const [newProjectEntry, setNewProjectEntry] = useState({ 
    clientName: '', 
    projectName: '', 
    mon: 0, 
    tue: 0, 
    wed: 0, 
    thu: 0, 
    fri: 0, 
    sat: 0, 
    sun: 0,
    // Time Off hours
    monTimeOff: 0,
    tueTimeOff: 0,
    wedTimeOff: 0,
    thuTimeOff: 0,
    friTimeOff: 0,
    satTimeOff: 0,
    sunTimeOff: 0,
    // Holiday hours
    monHoliday: 0,
    tueHoliday: 0,
    wedHoliday: 0,
    thuHoliday: 0,
    friHoliday: 0,
    satHoliday: 0,
    sunHoliday: 0
  });
  const [currentWeek, setCurrentWeek] = useState<string>(() => {
    // Default to the most recent Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Calculate days since Monday (0=Sunday, 1=Monday, etc.)
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);
    return format(monday, 'yyyy-MM-dd');
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Approved client timesheet upload
  const [uploadedTimesheetFile, setUploadedTimesheetFile] = useState<File | null>(null);
  const [uploadedTimesheetUrl, setUploadedTimesheetUrl] = useState<string>('');
  
  // View details for previous weeks
  const [viewDetailsWeek, setViewDetailsWeek] = useState<string | null>(null);
  
  // Selected month for filtering timesheets (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Edit timesheet state
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Edit dialog specific states for client/project selection
  const [editSelectedClient, setEditSelectedClient] = useState("");
  const [editAvailableProjects, setEditAvailableProjects] = useState<any[]>([]);
  const [editProjectComboOpen, setEditProjectComboOpen] = useState(false);
  
  // Delete confirmation state
  const [deletingEntry, setDeletingEntry] = useState<TimesheetEntry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    project: "",
    client: "",
    hours: "",
    description: "",
  });

  // Initialize with previous week on mount
  useEffect(() => {
    const prevWeek = getPreviousWeek();
    setWeekDates(prevWeek);
    
    // Initialize weeklyHours with empty strings for each day
    const initialHours: Record<string, string> = {};
    prevWeek.forEach(date => {
      initialHours[format(date, 'yyyy-MM-dd')] = '';
    });
    setWeeklyHours(initialHours);
  }, []);

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
    fetchClients();
  }, []);

  // Fetch timesheets when component mounts (only for HR view, not employee portal)
  useEffect(() => {
    // Only fetch all timesheets if this is NOT an employee portal view
    if (!employeeEmail) {
      fetchTimesheets();
    }
  }, []);

  // Auto-select employee when employeeEmail is provided
  useEffect(() => {
    if (employeeEmail && employees.length > 0) {
      const employee = employees.find(emp => emp.email === employeeEmail);
      if (employee) {
        setSelectedEmployee(employee.id);
        // Fetch timesheets again when employee is selected
        fetchTimesheets(employee.id);
        // Fetch employee's projects - will be called again when clients load
        fetchEmployeeProjects(employee);
        
        // Auto-select client if employee has exactly one client assigned
        const assignedClientIds = employee.clientIds || [];
        if (assignedClientIds.length === 1 && clients.length > 0) {
          const clientId = assignedClientIds[0];
          const assignedClient = clients.find((c: any) => c.id === clientId);
          if (assignedClient) {
            setSelectedClientForNewEntry(clientId);
            setNewProjectEntry(prev => ({
              ...prev,
              clientName: assignedClient.companyName || assignedClient.legalName || ''
            }));
          }
        }
      }
    }
  }, [employeeEmail, employees, clients]);

  // Prefill project name if employee has exactly one project for the selected client
  useEffect(() => {
    console.log('[Prefill Project Name] employeeProjects:', employeeProjects);
    console.log('[Prefill Project Name] selectedEmployee:', selectedEmployee);
    console.log('[Prefill Project Name] selectedClientForNewEntry:', selectedClientForNewEntry);
    
    if (selectedClientForNewEntry && selectedEmployee) {
      const filteredProjects = employeeProjects.filter((p: any) => p.clientId === selectedClientForNewEntry);
      
      if (filteredProjects.length === 1) {
        const project = filteredProjects[0];
        console.log('[Prefill Project Name] Setting project name to:', project.projectName);
        setNewProjectEntry(prev => ({
          ...prev,
          projectName: project.projectName || ''
        }));
      } else if (filteredProjects.length === 0) {
        console.log('[Prefill Project Name] No projects found for selected client');
        setNewProjectEntry(prev => ({
          ...prev,
          projectName: ''
        }));
      } else if (filteredProjects.length > 1) {
        console.log('[Prefill Project Name] Multiple projects found for selected client, not prefilling');
      }
    }
  }, [employeeProjects, selectedEmployee, selectedClientForNewEntry]);

  // Initialize weeklyProjects with prefilled data when dialog opens
  useEffect(() => {
    if (showAddDialog && weeklyProjects.length === 0 && selectedEmployee) {
      const employee = employees.find((e: any) => e.id === selectedEmployee);
      const assignedClient = employee?.clientId ? clients.find((c: any) => c.id === employee.clientId) : null;
      
      if (assignedClient) {
        setWeeklyProjects([{
          id: `project-${Date.now()}`,
          clientId: employee.clientId,
          clientName: assignedClient.companyName || assignedClient.legalName,
          projectName: employeeProjects.length === 1 ? employeeProjects[0].projectName : '',
          weeklyHours: ''
        }]);
      }
    }
  }, [showAddDialog, selectedEmployee, employees, clients, employeeProjects]);

  // Update weeklyProjects projectName when employeeProjects loads
  useEffect(() => {
    if (showAddDialog && weeklyProjects.length === 1 && employeeProjects.length === 1) {
      // Only update if the project name is currently empty
      if (!weeklyProjects[0].projectName || weeklyProjects[0].projectName === '') {
        setWeeklyProjects([{
          ...weeklyProjects[0],
          projectName: employeeProjects[0].projectName
        }]);
      }
    }
  }, [employeeProjects, showAddDialog]);

  // Fetch employee's assigned projects
  const fetchEmployeeProjects = async (employee: any) => {
    console.log('[fetchEmployeeProjects] Called with employee:', employee);
    
    if (!employee || !employee.id) {
      console.log('[fetchEmployeeProjects] No employee or no employee ID, setting empty projects');
      setEmployeeProjects([]);
      return;
    }

    try {
      // Fetch project assignments from API
      const response = await fetch(`${API_URL}/project-assignments/employee/${employee.id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const assignments = data.assignments || [];
        
        console.log('[fetchEmployeeProjects] Fetched project assignments:', assignments);
        
        // Filter for active assignments and map to project format
        const activeProjects = assignments
          .filter((a: any) => a.status === 'active')
          .map((assignment: any) => {
            // Find the client details
            const assignedClient = clients.find((c: any) => c.id === assignment.clientId);
            
            return {
              id: assignment.id,
              name: assignment.projectName,
              projectName: assignment.projectName,
              clientName: assignedClient ? (assignedClient.companyName || assignedClient.legalName) : '',
              clientId: assignment.clientId,
              poNumber: assignment.purchaseOrderNumber || '',
              description: assignment.notes || '',
              role: assignment.role,
              billableRate: assignment.billableRate
            };
          });
        
        console.log('[fetchEmployeeProjects] Active projects:', activeProjects);
        setEmployeeProjects(activeProjects);
      } else {
        console.error('[fetchEmployeeProjects] Failed to fetch project assignments');
        setEmployeeProjects([]);
      }
    } catch (error) {
      console.error('[fetchEmployeeProjects] Error fetching project assignments:', error);
      setEmployeeProjects([]);
    }
  };

  // Update available projects when client is selected (for Add dialog)
  useEffect(() => {
    if (selectedClient && clients.length > 0) {
      const client = clients.find((c: any) => c.id === selectedClient);
      console.log('Selected client:', client);
      
      const projects: any[] = [];
      
      if (client && client.engagements) {
        console.log('Client engagements:', client.engagements);
        // Extract all POs from all engagements
        client.engagements.forEach((engagement: any) => {
          console.log('Processing engagement:', engagement);
          if (engagement.purchaseOrders && engagement.purchaseOrders.length > 0) {
            engagement.purchaseOrders.forEach((po: any) => {
              console.log('PO found:', po);
              // Include POs that are Active or don't have a status field yet
              if (!po.status || po.status === 'Active' || po.status === 'active') {
                projects.push({
                  id: po.poNumber,
                  name: `${po.poNumber} - ${engagement.projectName || 'Project'}`,
                  poNumber: po.poNumber,
                  projectName: engagement.projectName,
                  clientName: client.companyName || client.legalName,
                });
              }
            });
          }
        });
      } else {
        console.log('No engagements found for client');
      }
      
      // FALLBACK: Also add unique projects from existing timesheets for this client
      const clientTimesheets = entries.filter(entry => entry.clientId === selectedClient);
      console.log('Found existing timesheets for client:', clientTimesheets.length);
      
      clientTimesheets.forEach(entry => {
        // Only add if not already in projects list
        const exists = projects.some(p => p.projectName === entry.projectName);
        if (!exists && entry.projectName) {
          console.log('Adding project from timesheet:', entry.projectName);
          projects.push({
            id: entry.poNumber || entry.projectName,
            name: entry.poNumber ? `${entry.poNumber} - ${entry.projectName}` : entry.projectName,
            poNumber: entry.poNumber,
            projectName: entry.projectName,
            clientName: client?.companyName || client?.legalName || entry.clientName,
          });
        }
      });
      
      console.log('Final available projects:', projects);
      setAvailableProjects(projects);
    } else {
      setAvailableProjects([]);
    }
  }, [selectedClient, clients, entries]);

  // Update available projects when edit client is selected (for Edit dialog)
  useEffect(() => {
    if (editSelectedClient && clients.length > 0) {
      const client = clients.find((c: any) => c.id === editSelectedClient);
      
      const projects: any[] = [];
      
      if (client && client.engagements) {
        // Extract all POs from all engagements
        client.engagements.forEach((engagement: any) => {
          if (engagement.purchaseOrders && engagement.purchaseOrders.length > 0) {
            engagement.purchaseOrders.forEach((po: any) => {
              // Include POs that are Active or don't have a status field yet
              if (!po.status || po.status === 'Active' || po.status === 'active') {
                projects.push({
                  id: po.poNumber,
                  name: `${po.poNumber} - ${engagement.projectName || 'Project'}`,
                  poNumber: po.poNumber,
                  projectName: engagement.projectName,
                  clientName: client.companyName || client.legalName,
                });
              }
            });
          }
        });
      }
      
      // FALLBACK: Also add unique projects from existing timesheets for this client
      const clientTimesheets = entries.filter(entry => entry.clientId === editSelectedClient);
      
      clientTimesheets.forEach(entry => {
        // Only add if not already in projects list
        const exists = projects.some(p => p.projectName === entry.projectName);
        if (!exists && entry.projectName) {
          projects.push({
            id: entry.poNumber || entry.projectName,
            name: entry.poNumber ? `${entry.poNumber} - ${entry.projectName}` : entry.projectName,
            poNumber: entry.poNumber,
            projectName: entry.projectName,
            clientName: client?.companyName || client?.legalName || entry.clientName,
          });
        }
      });
      
      setEditAvailableProjects(projects);
    } else {
      setEditAvailableProjects([]);
    }
  }, [editSelectedClient, clients, entries]);

  // Initialize edit client when editing entry is set
  useEffect(() => {
    if (editingEntry && clients.length > 0) {
      // Find the client by ID if available
      if (editingEntry.clientId) {
        setEditSelectedClient(editingEntry.clientId);
      } else if (editingEntry.clientName) {
        // Try to find client by name as fallback
        const client = clients.find((c: any) => 
          c.companyName === editingEntry.clientName || c.legalName === editingEntry.clientName
        );
        if (client) {
          setEditSelectedClient(client.id);
        } else {
          setEditSelectedClient("");
        }
      } else {
        setEditSelectedClient("");
      }
    }
  }, [editingEntry, clients]);

  // Populate all available projects from all clients when clients are loaded
  useEffect(() => {
    if (clients.length > 0) {
      const allProjects: any[] = [];
      
      clients.forEach((client: any) => {
        if (client.engagements) {
          client.engagements.forEach((engagement: any) => {
            if (engagement.purchaseOrders && engagement.purchaseOrders.length > 0) {
              engagement.purchaseOrders.forEach((po: any) => {
                // Include POs that are Active or don't have a status field yet
                if (!po.status || po.status === 'Active' || po.status === 'active') {
                  allProjects.push({
                    id: `${client.id}-${po.poNumber}`,
                    clientId: client.id,
                    clientName: client.companyName || client.legalName,
                    poNumber: po.poNumber,
                    projectName: engagement.projectName || 'Project',
                    displayName: `${client.companyName || client.legalName} - ${po.poNumber} - ${engagement.projectName || 'Project'}`,
                  });
                }
              });
            }
          });
        }
      });
      
      // Also add unique projects from existing timesheets
      const uniqueProjects = new Map();
      entries.forEach(entry => {
        if (entry.clientId && entry.projectName) {
          const key = `${entry.clientId}-${entry.projectName}`;
          if (!uniqueProjects.has(key)) {
            const client = clients.find((c: any) => c.id === entry.clientId);
            if (client && !allProjects.some(p => p.clientId === entry.clientId && p.projectName === entry.projectName)) {
              uniqueProjects.set(key, {
                id: key,
                clientId: entry.clientId,
                clientName: client.companyName || client.legalName || entry.clientName,
                poNumber: entry.poNumber,
                projectName: entry.projectName,
                displayName: entry.poNumber 
                  ? `${client.companyName || client.legalName} - ${entry.poNumber} - ${entry.projectName}`
                  : `${client.companyName || client.legalName} - ${entry.projectName}`,
              });
            }
          }
        }
      });
      
      uniqueProjects.forEach(project => allProjects.push(project));
      
      setAllAvailableProjects(allProjects);
    }
  }, [clients, entries]);

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await fetch(`${API_URL}/employees`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      // Ensure we always set an array
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]); // Set empty array on error
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients/advanced`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      console.log('Fetched clients:', data.clients?.length || 0, 'clients');
      console.log('Clients data:', data.clients);
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const fetchTimesheets = async (employeeId?: string) => {
    console.log('=== fetchTimesheets CALLED ===');
    console.log('employeeId parameter:', employeeId);
    console.log('employeeEmail prop:', employeeEmail);
    console.log('selectedEmployee state:', selectedEmployee);
    
    try {
      setIsLoadingTimesheets(true);
      const response = await fetch(`${API_URL}/timesheets`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch timesheets');
      }
      
      const data = await response.json();
      console.log('=== Fetch Timesheets Debug ===');
      console.log('Raw timesheets data from API:', data);
      console.log('employeeId filter:', employeeId);
      
      // FIXED: Backend returns { timesheets: [...] }, not an array directly
      let timesheets = data.timesheets || [];
      console.log('Timesheets array:', timesheets.length, 'entries');
      console.log('First 3 timesheets:', timesheets.slice(0, 3));
      
      if (employeeId) {
        timesheets = timesheets.filter((entry: any) => entry.employeeId === employeeId);
        console.log('Filtered by employeeId:', employeeId, '- found', timesheets.length, 'entries');
      }
      
      // Map the API response to our local TimesheetEntry format
      const mappedEntries: TimesheetEntry[] = timesheets.map((entry: any) => ({
        id: entry.id,
        employeeId: entry.employeeId,
        employeeName: entry.employeeName,
        date: entry.date,
        project: entry.project,
        client: entry.client || '',
        clientId: entry.clientId || '',
        clientName: entry.clientName || entry.client || '',
        projectName: entry.projectName || entry.project || '',
        poNumber: entry.poNumber || '',
        hours: entry.hours || 0, // Use total hours from backend
        regularHours: entry.regularHours || 0,
        overtimeHours: entry.overtimeHours || 0,
        holidayHours: entry.holidayHours || 0,
        timeOffHours: entry.timeOffHours || 0,
        description: entry.description || '',
        status: entry.status as TimesheetEntry['status'],
        weekEnding: entry.weekEnding || entry.date, // Fallback to date if weekEnding not present
        invoiceFile: entry.invoiceFileName,
        clientTimesheetUrl: entry.clientTimesheetUrl,
        rejectionComment: entry.rejectionComment,
        rejectedAt: entry.rejectedAt,
      }));
      
      console.log('Mapped entries:', mappedEntries);
      console.log('Week endings in mapped entries:', mappedEntries.map(e => e.weekEnding));
      console.log('Statuses in mapped entries:', mappedEntries.map(e => ({ id: e.id, status: e.status })));
      setEntries(mappedEntries);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to load timesheets');
      setEntries([]); // Set empty array on error
    } finally {
      setIsLoadingTimesheets(false);
    }
  };

  const getStatusBadge = (status: TimesheetEntry["status"]) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const groupedByWeek = entries.reduce((acc, entry) => {
    const week = entry.weekEnding;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(entry);
    return acc;
  }, {} as Record<string, TimesheetEntry[]>);
  
  console.log('=== Grouped By Week Debug ===');
  console.log('Total entries:', entries.length);
  console.log('Week endings (keys):', Object.keys(groupedByWeek));
  console.log('Grouped by week object:', groupedByWeek);
  console.log('Employee Email Prop:', employeeEmail);
  console.log('Selected Employee ID:', selectedEmployee);
  
  // Additional debug for employee portal view
  if (employeeEmail) {
    console.log('=== Employee Portal Timesheet Debug ===');
    console.log('Entries count:', entries.length);
    console.log('Entries by status:', {
      draft: entries.filter(e => e.status === 'draft').length,
      submitted: entries.filter(e => e.status === 'submitted').length,
      approved: entries.filter(e => e.status === 'approved').length,
      rejected: entries.filter(e => e.status === 'rejected').length,
    });
    console.log('Week endings:', Object.keys(groupedByWeek));
    console.log('Current month:', format(new Date(), 'MMMM yyyy'));
  }

  const calculateWeekTotal = (entries: TimesheetEntry[]) => {
    return entries.reduce((sum, entry) => {
      // The hours field from backend already contains total (regularHours + overtimeHours + holidayHours + timeOffHours)
      // But we also sum individual fields as a fallback for better accuracy
      const totalFromFields = (entry.regularHours || 0) + (entry.overtimeHours || 0) + 
                              (entry.holidayHours || 0) + (entry.timeOffHours || 0);
      const totalFromHours = entry.hours || 0;
      
      // Use the hours field if it's greater (it should contain the correct total from backend)
      // Otherwise fall back to sum of individual fields
      return sum + (totalFromHours > 0 ? totalFromHours : totalFromFields);
    }, 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeek = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekDates[0]);
      day.setDate(weekDates[0].getDate() - 7 + i);
      newWeek.push(day);
    }
    setWeekDates(newWeek);
    
    // Reset hours for new week
    const newHours: Record<string, string> = {};
    newWeek.forEach(date => {
      newHours[format(date, 'yyyy-MM-dd')] = '';
    });
    setWeeklyHours(newHours);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeek = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekDates[0]);
      day.setDate(weekDates[0].getDate() + 7 + i);
      newWeek.push(day);
    }
    setWeekDates(newWeek);
    
    // Reset hours for new week
    const newHours: Record<string, string> = {};
    newWeek.forEach(date => {
      newHours[format(date, 'yyyy-MM-dd')] = '';
    });
    setWeeklyHours(newHours);
  };

  // Check if selected week is in the future
  const isFutureWeek = () => {
    if (weekDates.length === 0) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekDates[0] > today;
  };

  // Handle project selection from the project selection dialog
  const handleSelectProject = (project: any) => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }

    // Add the selected project to weeklyProjects
    const newProject = {
      id: `project-${Date.now()}`,
      clientId: project.clientId,
      clientName: project.clientName,
      projectName: project.projectName,
      poNumber: project.poNumber || '',
      weeklyHours: ''
    };
    
    setWeeklyProjects([...weeklyProjects, newProject]);
    setShowProjectSelection(false);
    setShowAddDialog(true);
  };

  const handleAddEntry = async () => {
    console.log('=== Submit Timesheet Debug ===');
    console.log('selectedEmployee:', selectedEmployee);
    console.log('employeeEmail:', employeeEmail);
    console.log('weeklyProjects:', weeklyProjects);
    console.log('currentWeek:', currentWeek);
    console.log('uploadedTimesheetFile:', uploadedTimesheetFile);
    console.log('uploadedTimesheetUrl:', uploadedTimesheetUrl);
    
    // Find the employee - either from selectedEmployee or employeeEmail
    let employeeId = selectedEmployee;
    let employee: Employee | undefined;
    
    if (!employeeId && employeeEmail) {
      // If employeeEmail is provided but selectedEmployee isn't set yet, find the employee
      employee = employees.find(emp => emp.email === employeeEmail);
      employeeId = employee?.id || '';
    } else if (employeeId) {
      employee = employees.find(emp => emp.id === employeeId);
    }
    
    if (!employeeId || !employee) {
      console.error('ERROR: No employee selected or found');
      toast.error('Please select an employee');
      return;
    }

    if (entryMode === 'manual') {
      // Validate weekly projects
      if (weeklyProjects.length === 0) {
        console.error('ERROR: No projects added');
        toast.error('Please add at least one project');
        return;
      }

      // Validate each project - updated for new structure
      for (let i = 0; i < weeklyProjects.length; i++) {
        const proj = weeklyProjects[i];
        if (!proj.clientName || !proj.clientName.trim()) {
          toast.error(`Project ${i + 1}: Please enter a client name`);
          return;
        }
        if (!proj.projectName || !proj.projectName.trim()) {
          toast.error(`Project ${i + 1}: Please enter a project name`);
          return;
        }
        const totalHours = (proj.mon || 0) + (proj.tue || 0) + (proj.wed || 0) + 
                          (proj.thu || 0) + (proj.fri || 0) + (proj.sat || 0) + (proj.sun || 0);
        if (totalHours <= 0) {
          toast.error(`Project ${i + 1}: Please enter hours for at least one day`);
          return;
        }
      }

      // Use the selected week for validation
      if (!currentWeek) {
        toast.error('Invalid week selection');
        return;
      }

      // currentWeek is now Monday, calculate Sunday (week ending)
      const weekStart = parseLocalDate(currentWeek); // Monday
      const weekEndingDate = parseLocalDate(currentWeek);
      
      // Ensure week ending is always Sunday, regardless of what day currentWeek is
      const dayOfWeek = weekEndingDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      weekEndingDate.setDate(weekEndingDate.getDate() + daysUntilSunday);
      
      const checkWeekEndingStr = format(weekEndingDate, 'yyyy-MM-dd');
      console.log('=== Week Ending Calculation ===');
      console.log('currentWeek (Monday):', currentWeek);
      console.log('weekStart:', weekStart);
      console.log('weekEndingDate (Sunday):', weekEndingDate);
      console.log('checkWeekEndingStr:', checkWeekEndingStr);
      
      // Check if there's already a submitted timesheet for any of these projects in this week
      const existingWeekEntries = groupedByWeek[checkWeekEndingStr] || [];
      const projectsToSubmit = weeklyProjects.map(p => p.projectName);
      const duplicateProjects = projectsToSubmit.filter(projectName => 
        existingWeekEntries.some((entry: TimesheetEntry) => entry.project === projectName)
      );
      
      if (duplicateProjects.length > 0) {
        toast.error(`Timesheet already exists for ${duplicateProjects.join(', ')} in the week ending ${format(parseISO(checkWeekEndingStr), 'MMM d, yyyy')}. Please delete the existing timesheet(s) before submitting new ones.`);
        return;
      }

      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';

      // Calculate total hours for the week from all projects
      const totalWeekHours = weeklyProjects.reduce((sum, proj) => {
        return sum + (proj.mon || 0) + (proj.tue || 0) + (proj.wed || 0) + 
               (proj.thu || 0) + (proj.fri || 0) + (proj.sat || 0) + (proj.sun || 0);
      }, 0);
      
      const totalRegularHours = Math.min(totalWeekHours, 40);
      const totalOvertimeHours = Math.max(totalWeekHours - 40, 0);

      // Create entries for each project - store as a single entry per project with weekly hours
      const newEntries: TimesheetEntry[] = [];
      let remainingRegular = totalRegularHours;

      // Upload files for each project that has one
      const uploadPromises = weeklyProjects.map(async (proj, index) => {
        let clientTimesheetUrl = '';
        
        if (proj.uploadedFile) {
          try {
            const formData = new FormData();
            formData.append('file', proj.uploadedFile);
            formData.append('employeeId', employeeId);
            formData.append('weekEnding', checkWeekEndingStr);
            
            const uploadResponse = await fetch(`${API_URL}/upload-client-timesheet`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: formData,
            });
            
            if (uploadResponse.ok) {
              const { url } = await uploadResponse.json();
              clientTimesheetUrl = url;
              console.log(`Client timesheet uploaded for project ${index + 1}`);
            } else {
              console.error(`Failed to upload client timesheet for project ${index + 1}`);
            }
          } catch (error) {
            console.error(`Error uploading client timesheet for project ${index + 1}:`, error);
          }
        }
        
        const projectHours = (proj.mon || 0) + (proj.tue || 0) + (proj.wed || 0) + 
                            (proj.thu || 0) + (proj.fri || 0) + (proj.sat || 0) + (proj.sun || 0);
        
        // Distribute regular and overtime hours proportionally
        const regularForProject = Math.min(projectHours, remainingRegular);
        const overtimeForProject = projectHours - regularForProject;
        
        remainingRegular -= regularForProject;
        
        const entry: TimesheetEntry = {
          id: `${Date.now()}-${index}-${Math.random()}`,
          employeeId: employeeId,
          employeeName,
          date: format(weekStart, 'yyyy-MM-dd'), // Store the week start date
          project: proj.projectName,
          client: proj.clientName,
          clientId: proj.projectId, // Use projectId as a temporary ID
          hours: projectHours,
          regularHours: regularForProject,
          overtimeHours: overtimeForProject,
          description: `Week of ${format(weekStart, 'MMM d')} to ${format(weekEndingDate, 'MMM d')}`,
          status: "submitted",
          weekEnding: checkWeekEndingStr,
          clientTimesheetUrl: clientTimesheetUrl || undefined,
        };
        
        return entry;
      });
      
      // Wait for all uploads to complete and get entries
      const entriesWithUploads = await Promise.all(uploadPromises);
      newEntries.push(...entriesWithUploads);
      
      // Show success message if any files were uploaded
      const uploadedCount = weeklyProjects.filter(p => p.uploadedFile).length;
      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} client timesheet${uploadedCount > 1 ? 's' : ''} uploaded successfully`);
      }

      // Save entries to backend
      saveTimesheetEntries(newEntries);
    } else {
      // Invoice mode
      if (!selectedFile) {
        toast.error('Please select an invoice file');
        return;
      }

      // In a real implementation, this would upload the file to storage
      const entry: TimesheetEntry = {
        id: Date.now().toString(),
        employeeId: employeeId,
        employeeName: employeeName,
        date: format(new Date(), "yyyy-MM-dd"),
        project: "Imported from Invoice",
        client: "TBD",
        hours: 0, // Would be extracted from invoice
        description: `Invoice: ${selectedFile.name}`,
        status: "submitted",
        weekEnding: "2025-10-25",
        invoiceFile: selectedFile.name,
      };

      // Save single entry to backend
      saveTimesheetEntries([entry]);
    }

    // Reset form
    setShowAddDialog(false);
    setEntryMode("manual");
    // Only clear selectedEmployee if employeeEmail is not provided
    if (!employeeEmail) {
      setSelectedEmployee("");
    }
    setSelectedClient("");
    setAvailableProjects([]);
    setNewEntry({ project: "", client: "", hours: "", description: "" });
    setSelectedDate(undefined);
    setSelectedFile(null);
    setWeeklyProjects([]);
    setUploadedTimesheetFile(null);
    setUploadedTimesheetUrl('');
  };

  // Save timesheet entries to backend
  const saveTimesheetEntries = async (newEntries: TimesheetEntry[]) => {
    try {
      // Create API payload for each entry
      const apiPromises = newEntries.map(entry => 
        fetch(`${API_URL}/timesheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            employeeId: entry.employeeId,
            employeeName: entry.employeeName,
            date: entry.date,
            project: entry.project,
            client: entry.client,
            regularHours: entry.regularHours || entry.hours,
            overtimeHours: entry.overtimeHours || 0,
            description: entry.description,
            billable: true,
            entryType: entry.invoiceFile ? "invoice" : "manual",
            status: "submitted",
            weekEnding: entry.weekEnding, // Include week ending
            clientTimesheetUrl: entry.clientTimesheetUrl || '', // Include client timesheet URL
          }),
        })
      );

      const responses = await Promise.all(apiPromises);
      const failedResponses = responses.filter(r => !r.ok);
      
      if (failedResponses.length > 0) {
        console.error('=== Failed Responses ===');
        for (const response of failedResponses) {
          const errorText = await response.text();
          console.error('Status:', response.status, 'Error:', errorText);
        }
        throw new Error(`Failed to save ${failedResponses.length} of ${responses.length} entries`);
      }

      console.log('=== All Responses Successful ===');
      const responseData = await Promise.all(responses.map(r => r.json()));
      console.log('Response data:', responseData);

      const entryCount = newEntries.length;
      const weekEndingFormatted = format(parseISO(newEntries[0].weekEnding), 'MMM d, yyyy');
      toast.success(`${entryCount} time ${entryCount === 1 ? 'entry' : 'entries'} submitted successfully for week ending ${weekEndingFormatted}. View in history below.`);
      
      console.log('=== Refreshing Timesheets After Submission ===');
      console.log('selectedEmployee:', selectedEmployee);
      console.log('employeeEmail:', employeeEmail);
      console.log('Submitted entries:', newEntries.map(e => ({ weekEnding: e.weekEnding, status: 'submitted' })));
      
      // Refresh timesheets from backend to get the latest data with IDs
      if (selectedEmployee) {
        await fetchTimesheets(selectedEmployee);
      } else {
        await fetchTimesheets();
      }
      
      console.log('=== Timesheets Refreshed - Should Now Appear in History ===');
      console.log('Total entries after refresh:', entries.length);
    } catch (error) {
      console.error('Error saving timesheet entries:', error);
      toast.error('Failed to submit timesheet entries. Please try again.');
    }
  };

  // Edit timesheet entry
  const handleEditEntry = async () => {
    if (!editingEntry) return;
    
    try {
      const response = await fetch(`${API_URL}/timesheets/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          project: editingEntry.project,
          client: editingEntry.client,
          hours: editingEntry.hours,
          description: editingEntry.description,
          date: editingEntry.date,
          weekEnding: editingEntry.weekEnding,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update timesheet');
      }
      
      toast.success('Timesheet updated successfully');
      setShowEditDialog(false);
      setEditingEntry(null);
      
      // Refresh timesheets
      if (selectedEmployee) {
        fetchTimesheets(selectedEmployee);
      } else {
        fetchTimesheets();
      }
    } catch (error) {
      console.error('Error updating timesheet:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update timesheet');
    }
  };

  // Delete timesheet entry
  const handleDeleteEntry = async () => {
    if (!deletingEntry) return;
    
    try {
      console.log('=== DELETE TIMESHEET DEBUG ===');
      console.log('Deleting entry:', deletingEntry);
      console.log('Entry ID:', deletingEntry.id);
      console.log('Is week deletion?', deletingEntry.id.startsWith('week-'));
      
      // Check if we're deleting a whole week (ID starts with "week-")
      const isWeekDeletion = deletingEntry.id.startsWith('week-');
      
      // Check if this is a temporary ID (not a proper UUID)
      // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 parts separated by dashes)
      // Temporary IDs have format: timestamp-index-random (3 parts) or project-timestamp
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deletingEntry.id);
      const isProjectTempId = deletingEntry.id.startsWith('project-');
      const isTempId = !isUUID && !isWeekDeletion;
      
      if (isTempId) {
        console.error('Cannot delete entry with temporary/invalid ID:', deletingEntry.id);
        toast.error('This entry is not properly saved. Please refresh the page and try again.');
        setShowDeleteDialog(false);
        setDeletingEntry(null);
        // Refresh timesheets to get the latest data
        if (selectedEmployee) {
          fetchTimesheets(selectedEmployee);
        } else {
          fetchTimesheets();
        }
        return;
      }
      
      // Check if we're deleting a whole week (ID starts with "week-")
      if (isWeekDeletion) {
        const weekEnding = deletingEntry.id.replace('week-', '');
        const weekEntries = groupedByWeek[weekEnding] || [];
        
        console.log('Week ending:', weekEnding);
        console.log('Week entries to delete:', weekEntries);
        console.log('Week entries IDs:', weekEntries.map(e => e.id));
        
        // Delete all entries for this week
        const deletePromises = weekEntries.map(entry => {
          console.log('Deleting individual entry:', entry.id);
          return fetch(`${API_URL}/timesheets/${entry.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          });
        });
        
        const responses = await Promise.all(deletePromises);
        const failedResponses = responses.filter(r => !r.ok);
        
        if (failedResponses.length > 0) {
          // Log detailed error information
          for (const response of failedResponses) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Delete failed:', response.status, errorData);
          }
          throw new Error(`Failed to delete ${failedResponses.length} of ${responses.length} entries`);
        }
        
        toast.success(`${weekEntries.length} time entries deleted successfully`);
      } else {
        // Delete single entry
        console.log('Deleting single entry with ID:', deletingEntry.id);
        console.log('Delete URL:', `${API_URL}/timesheets/${deletingEntry.id}`);
        
        const response = await fetch(`${API_URL}/timesheets/${deletingEntry.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });
        
        console.log('Delete response status:', response.status);
        console.log('Delete response ok:', response.ok);
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Delete error response:', error);
          throw new Error(error.error || 'Failed to delete timesheet');
        }
        
        toast.success('Timesheet deleted successfully');
      }
      
      setShowDeleteDialog(false);
      setDeletingEntry(null);
      
      // Refresh timesheets
      if (selectedEmployee) {
        fetchTimesheets(selectedEmployee);
      } else {
        fetchTimesheets();
      }
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete timesheet';
      
      // Check if this is a "not found" error
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        toast.error('Timesheet not found. It may have already been deleted. Refreshing...');
        // Refresh timesheets to sync with backend
        if (selectedEmployee) {
          fetchTimesheets(selectedEmployee);
        } else {
          fetchTimesheets();
        }
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Resubmit timesheet week
  const handleResubmitWeek = async (entries: TimesheetEntry[]) => {
    try {
      const updatePromises = entries.map(entry =>
        fetch(`${API_URL}/timesheets/${entry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            // Keep existing fields but update status
            project: entry.project,
            client: entry.client,
            hours: entry.hours,
            description: entry.description,
            date: entry.date,
            weekEnding: entry.weekEnding,
            status: 'submitted',
            rejectionComment: null, // Clear rejection
            rejectedAt: null
          }),
        })
      );

      const responses = await Promise.all(updatePromises);
      const failedResponses = responses.filter(r => !r.ok);

      if (failedResponses.length > 0) {
        throw new Error(`Failed to resubmit ${failedResponses.length} entries`);
      }

      toast.success('Timesheet resubmitted successfully');
      setViewDetailsWeek(null); // Close dialog if open
      
      // Refresh timesheets
      if (selectedEmployee) {
        fetchTimesheets(selectedEmployee);
      } else {
        fetchTimesheets();
      }
    } catch (error) {
      console.error('Error resubmitting timesheet:', error);
      toast.error('Failed to resubmit timesheet');
    }
  };

  // Calculate current week ending (Sunday of current week)
  const getCurrentWeekEnding = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);
    sunday.setHours(0, 0, 0, 0);
    return format(sunday, "yyyy-MM-dd");
  };

  const displayCurrentWeek = getCurrentWeekEnding();
  const currentWeekEntries = groupedByWeek[displayCurrentWeek] || [];
  const currentWeekTotal = calculateWeekTotal(currentWeekEntries);
  const hasUnsubmittedEntries = currentWeekEntries.some(e => e.status === "draft");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Timesheets</h2>
          <p className="text-muted-foreground">
            Track your hours and submit for approval
          </p>
        </div>
        {/* Only show Add Time Entry button for HR/Manager view */}
        {!employeeEmail && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
              <DialogDescription>
                {employeeEmail 
                  ? "Enter time manually or upload an invoice."
                  : "Select an employee and enter time manually or upload an invoice."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4 max-h-[65vh] overflow-y-auto pr-2">
              {/* Employee Selection - Hidden when employeeEmail is provided */}
              {!employeeEmail && (
                <div className="space-y-2">
                  <Label htmlFor="employee-select">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Employee <span className="text-red-500">*</span>
                    </div>
                  </Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger id="employee-select">
                      <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select an employee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(employees) && employees.length > 0 ? (
                        employees
                          .filter(emp => emp.onboardingStatus === 'completed' && emp.canAccessTimesheets)
                          .map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.firstName} {employee.lastName} - {employee.email}
                            </SelectItem>
                          ))
                      ) : (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          {isLoadingEmployees ? "Loading employees..." : "No employees found"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Entry Mode Tabs */}
              <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "manual" | "invoice")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">
                    <Clock className="h-4 w-4 mr-2" />
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger value="invoice">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Invoice
                  </TabsTrigger>
                </TabsList>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="space-y-4 mt-4">
                  {/* Week Selector with Navigation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={goToPreviousWeek}
                        className="h-8 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-2 text-blue-800">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-sm">
                          Week of {weekDates.length > 0 ? format(weekDates[0], "MMM d") : ''} - {weekDates.length > 0 ? format(weekDates[6], "MMM d, yyyy") : ''}
                        </span>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={goToNextWeek}
                        className="h-8 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    {isFutureWeek() && (
                      <div className="mt-2 pt-2 border-t border-blue-300">
                        <p className="text-xs text-blue-700 text-center">
                          ⚠️ This week is in the future
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Multiple Projects Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Projects for this Week <span className="text-red-500">*</span></Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newId = `project-${Date.now()}`;
                          // Get the current employee to prefill client/project
                          const employee = employees.find((e: any) => e.id === selectedEmployee);
                          const assignedClient = employee?.clientId ? clients.find((c: any) => c.id === employee.clientId) : null;
                          
                          setWeeklyProjects([...weeklyProjects, {
                            id: newId,
                            clientId: employee?.clientId || '',
                            clientName: assignedClient ? (assignedClient.companyName || assignedClient.legalName) : '',
                            projectName: employeeProjects.length === 1 ? employeeProjects[0].projectName : '',
                            weeklyHours: ''
                          }]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                      </Button>
                    </div>

                    {weeklyProjects.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-3">No projects added yet</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newId = `project-${Date.now()}`;
                            // Get the current employee to prefill client/project
                            const employee = employees.find((e: any) => e.id === selectedEmployee);
                            const assignedClient = employee?.clientId ? clients.find((c: any) => c.id === employee.clientId) : null;
                            
                            setWeeklyProjects([{
                              id: newId,
                              clientId: employee?.clientId || '',
                              clientName: assignedClient ? (assignedClient.companyName || assignedClient.legalName) : '',
                              projectName: employeeProjects.length === 1 ? employeeProjects[0].projectName : '',
                              weeklyHours: ''
                            }]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Project
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {weeklyProjects.map((proj, index) => (
                          <div key={proj.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <span className="text-sm text-gray-700">Project {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setWeeklyProjects(weeklyProjects.filter(p => p.id !== proj.id));
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`client-${proj.id}`}>Client <span className="text-red-500">*</span></Label>
                              <Select 
                                value={proj.clientId} 
                                onValueChange={(value) => {
                                  const client = clients.find((c: any) => c.id === value);
                                  setWeeklyProjects(weeklyProjects.map(p => 
                                    p.id === proj.id 
                                      ? { ...p, clientId: value, clientName: client?.companyName || client?.legalName || '' }
                                      : p
                                  ));
                                }}
                              >
                                <SelectTrigger id={`client-${proj.id}`}>
                                  <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                  {clients.map((client: any) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.companyName || client.legalName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`project-${proj.id}`}>Project / PO <span className="text-red-500">*</span></Label>
                              <Input
                                id={`project-${proj.id}`}
                                type="text"
                                placeholder="Enter project name"
                                value={proj.projectName}
                                onChange={(e) => {
                                  setWeeklyProjects(weeklyProjects.map(p => 
                                    p.id === proj.id 
                                      ? { ...p, projectName: e.target.value }
                                      : p
                                  ));
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`hours-${proj.id}`}>Weekly Hours <span className="text-red-500">*</span></Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`hours-${proj.id}`}
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="168"
                                  placeholder="0.0"
                                  value={proj.weeklyHours}
                                  onChange={(e) => {
                                    setWeeklyProjects(weeklyProjects.map(p => 
                                      p.id === proj.id 
                                        ? { ...p, weeklyHours: e.target.value }
                                        : p
                                    ));
                                  }}
                                  className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground">hours</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Weekly Total */}
                  {weeklyProjects.length > 0 && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-green-700" />
                          <span className="text-green-800">Total Hours for Week</span>
                        </div>
                        <div className="text-2xl text-green-700">
                          {(() => {
                            const totalHours = weeklyProjects.reduce((sum, proj) => {
                              const num = parseFloat(proj.weeklyHours || '0');
                              return sum + (isNaN(num) ? 0 : num);
                            }, 0);
                            return totalHours.toFixed(1);
                          })()}h
                        </div>
                      </div>
                      {(() => {
                        const totalHours = weeklyProjects.reduce((sum, proj) => {
                          const num = parseFloat(proj.weeklyHours || '0');
                          return sum + (isNaN(num) ? 0 : num);
                        }, 0);
                        const regularHours = Math.min(totalHours, 40);
                        const overtimeHours = Math.max(totalHours - 40, 0);
                        
                        if (overtimeHours > 0) {
                          return (
                            <div className="mt-3 pt-3 border-t border-green-300 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-green-800">Regular Hours (up to 40h)</span>
                                <span className="text-green-900">{regularHours.toFixed(1)}h</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-orange-800 font-medium">Overtime Hours (over 40h)</span>
                                <span className="text-orange-900 font-medium">{overtimeHours.toFixed(1)}h</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description-input">Description</Label>
                    <Textarea
                      id="description-input"
                      placeholder="What did you work on this week?"
                      value={newEntry.description}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Invoice Upload Tab */}
                <TabsContent value="invoice" className="space-y-4 mt-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Upload an invoice PDF or image. The system will extract time entry data automatically.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="invoice-upload">Invoice File <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="invoice-upload"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      {selectedFile && (
                        <Badge variant="outline" className="whitespace-nowrap">
                          {selectedFile.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Accepted formats: PDF, PNG, JPG (Max 10MB)
                    </p>
                  </div>

                  {selectedFile && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Invoice selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEntryMode("manual");
                    // Only clear selectedEmployee if employeeEmail is not provided
                    if (!employeeEmail) {
                      setSelectedEmployee("");
                    }
                    setSelectedFile(null);
                    setWeeklyProjects([]);
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddEntry}>
                  {entryMode === "manual" ? "Add Entry" : "Upload Invoice"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Projects for this Week Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              Timesheet Entry
              <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription>Add your project hours for the week</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week Selector */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <Label>Select Week Starting (Monday)</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentWeek && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentWeek ? format(parseLocalDate(currentWeek), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" sideOffset={5} style={{ zIndex: 9999 }}>
                  <Calendar
                    mode="single"
                    selected={currentWeek ? parseLocalDate(currentWeek) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        console.log('=== Calendar Date Selection Debug ===');
                        console.log('Raw selected date from calendar:', date);
                        console.log('Date toString():', date.toString());
                        console.log('Date toISOString():', date.toISOString());
                        console.log('Date getTimezoneOffset():', date.getTimezoneOffset());
                        
                        // Ensure we get the Monday of the selected week
                        const dayOfWeek = date.getDay();
                        console.log('Day of week (0=Sun, 1=Mon, ...):', dayOfWeek);
                        
                        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        console.log('Days since Monday:', daysSinceMonday);
                        
                        const monday = new Date(date);
                        monday.setDate(date.getDate() - daysSinceMonday);
                        monday.setHours(0, 0, 0, 0); // Reset time to avoid timezone issues
                        
                        console.log('Calculated Monday:', monday);
                        console.log('Monday toString():', monday.toString());
                        console.log('Monday toISOString():', monday.toISOString());
                        
                        const formattedMonday = format(monday, 'yyyy-MM-dd');
                        console.log('Formatted Monday string:', formattedMonday);
                        
                        setCurrentWeek(formattedMonday);
                        console.log('=== End Debug ===');
                        // Clear weekly projects when week changes
                        setWeeklyProjects([]);
                        // Clear uploaded timesheet file when week changes
                        setUploadedTimesheetFile(null);
                        setUploadedTimesheetUrl('');
                        // Reset newProjectEntry but keep client name and project name if employee has them assigned
                        const employee = employees.find(emp => emp.id === selectedEmployee);
                        const clientNameToKeep = employee && employee.clientId && clients.length > 0 
                          ? (clients.find((c: any) => c.id === employee.clientId)?.name || 
                             clients.find((c: any) => c.id === employee.clientId)?.companyName || '')
                          : '';
                        const projectNameToKeep = employeeProjects.length === 1 
                          ? (employeeProjects[0].projectName || '')
                          : '';
                        
                        setNewProjectEntry({
                          clientName: clientNameToKeep,
                          projectName: projectNameToKeep,
                          mon: 0,
                          tue: 0,
                          wed: 0,
                          thu: 0,
                          fri: 0,
                          sat: 0,
                          sun: 0,
                          monTimeOff: 0,
                          tueTimeOff: 0,
                          wedTimeOff: 0,
                          thuTimeOff: 0,
                          friTimeOff: 0,
                          satTimeOff: 0,
                          sunTimeOff: 0,
                          monHoliday: 0,
                          tueHoliday: 0,
                          wedHoliday: 0,
                          thuHoliday: 0,
                          friHoliday: 0,
                          satHoliday: 0,
                          sunHoliday: 0
                        });
                        // Close the popover after selection
                        setCalendarOpen(false);
                      }
                    }}
                    weekStartsOn={1}
                    initialFocus
                    modifiers={{
                      weekRange: currentWeek ? (() => {
                        const monday = parseLocalDate(currentWeek);
                        const days = [];
                        for (let i = 0; i < 7; i++) {
                          const day = new Date(monday);
                          day.setDate(monday.getDate() + i);
                          days.push(day);
                        }
                        return days;
                      })() : [],
                      today: new Date()
                    }}
                    modifiersClassNames={{
                      weekRange: 'bg-blue-100 text-blue-900',
                      today: 'bg-green-100 text-green-900 font-bold'
                    }}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Week: {format(parseLocalDate(currentWeek), "MMM d")} - {(() => {
                  const endDate = parseLocalDate(currentWeek);
                  endDate.setDate(endDate.getDate() + 6);
                  return format(endDate, "MMM d, yyyy");
                })()}
              </p>
            </div>
          </div>

          {/* Add New Project Form */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="space-y-2">
                <Label htmlFor="new-client">Client Name</Label>
                {(() => {
                  const employee = employees.find(emp => emp.id === selectedEmployee);
                  const assignedClientIds = employee?.clientIds || [];
                  const assignedClients = clients.filter((c: any) => assignedClientIds.includes(c.id));
                  
                  if (assignedClients.length === 0) {
                    return (
                      <Input
                        id="new-client"
                        type="text"
                        placeholder="No clients assigned"
                        value=""
                        disabled
                        className="bg-gray-100"
                      />
                    );
                  }
                  
                  return (
                    <Select
                      value={selectedClientForNewEntry}
                      onValueChange={(value) => {
                        setSelectedClientForNewEntry(value);
                        const client = clients.find((c: any) => c.id === value);
                        setNewProjectEntry({ 
                          ...newProjectEntry, 
                          clientName: client ? (client.companyName || client.legalName) : '',
                          projectName: '' // Reset project when client changes
                        });
                      }}
                    >
                      <SelectTrigger id="new-client">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedClients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.companyName || client.legalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-project">Project Name</Label>
                {(() => {
                  // Filter projects based on selected client
                  const filteredProjects = selectedClientForNewEntry 
                    ? employeeProjects.filter((p: any) => p.clientId === selectedClientForNewEntry)
                    : employeeProjects;
                  
                  if (!selectedClientForNewEntry) {
                    return (
                      <Input
                        id="new-project"
                        type="text"
                        placeholder="Select a client first"
                        value=""
                        disabled
                        className="bg-gray-100"
                      />
                    );
                  }
                  
                  if (filteredProjects.length > 0) {
                    return (
                      <Select
                        value={newProjectEntry.projectName}
                        onValueChange={(value) => setNewProjectEntry({ ...newProjectEntry, projectName: value })}
                      >
                        <SelectTrigger 
                          id="new-project"
                          className={filteredProjects.length === 1 ? 'bg-gray-100' : ''}
                          disabled={filteredProjects.length === 1}
                        >
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredProjects.map((project: any) => (
                            <SelectItem key={project.id} value={project.projectName}>
                              {project.projectName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }
                  
                  return (
                    <Input
                      id="new-project"
                      type="text"
                      placeholder="No projects for this client"
                      value=""
                      disabled
                      className="bg-gray-100"
                    />
                  );
                })()}
              </div>
            </div>
            
            {/* Upload Client Timesheet */}
            <div className="space-y-2 mb-3">
              <Label>Upload Approved Client Timesheet</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedTimesheetFile(file);
                      toast.success(`File "${file.name}" selected`);
                    }
                  }}
                  className="cursor-pointer"
                />
                {uploadedTimesheetFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{uploadedTimesheetFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedTimesheetFile(null);
                        setUploadedTimesheetUrl('');
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your client-approved timesheet for HR review
              </p>
            </div>
            
            {/* SECTION 1: Billable Hours */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <DollarSign className="h-4 w-4 text-green-600" />
                <Label className="text-sm font-semibold text-green-700">Billable Hours</Label>
              </div>
              <div className="grid grid-cols-7 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Mon ({format(parseLocalDate(currentWeek), 'MMM do')})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.mon || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, mon: parseFloat(e.target.value) || 0 })}
                    className="bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tue ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 1);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.tue || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, tue: parseFloat(e.target.value) || 0 })}
                    className="bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Wed ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 2);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.wed || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, wed: parseFloat(e.target.value) || 0 })}
                    className="bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Thu ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 3);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.thu || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, thu: parseFloat(e.target.value) || 0 })}
                    className="bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fri ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 4);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.fri || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, fri: parseFloat(e.target.value) || 0 })}
                    className="bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sat ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 5);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.sat || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, sat: parseFloat(e.target.value) || 0 })}
                    className="bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sun ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 6);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.sun || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, sun: parseFloat(e.target.value) || 0 })}
                    className="bg-green-50 border-green-200 focus:border-green-400"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Time Off Hours */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-semibold text-blue-700">Time Off</Label>
              </div>
              <div className="grid grid-cols-7 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Mon ({format(parseLocalDate(currentWeek), 'MMM do')})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.monTimeOff || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, monTimeOff: parseFloat(e.target.value) || 0 })}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tue ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 1);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.tueTimeOff || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, tueTimeOff: parseFloat(e.target.value) || 0 })}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Wed ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 2);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.wedTimeOff || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, wedTimeOff: parseFloat(e.target.value) || 0 })}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Thu ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 3);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.thuTimeOff || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, thuTimeOff: parseFloat(e.target.value) || 0 })}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fri ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 4);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.friTimeOff || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, friTimeOff: parseFloat(e.target.value) || 0 })}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sat ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 5);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.satTimeOff || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, satTimeOff: parseFloat(e.target.value) || 0 })}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sun ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 6);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.sunTimeOff || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, sunTimeOff: parseFloat(e.target.value) || 0 })}
                    className="bg-blue-50 border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Holiday Hours */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <CalendarIcon className="h-4 w-4 text-orange-600" />
                <Label className="text-sm font-semibold text-orange-700">Holiday</Label>
              </div>
              <div className="grid grid-cols-7 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Mon ({format(parseLocalDate(currentWeek), 'MMM do')})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.monHoliday || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, monHoliday: parseFloat(e.target.value) || 0 })}
                    className="bg-orange-50 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tue ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 1);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.tueHoliday || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, tueHoliday: parseFloat(e.target.value) || 0 })}
                    className="bg-orange-50 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Wed ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 2);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.wedHoliday || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, wedHoliday: parseFloat(e.target.value) || 0 })}
                    className="bg-orange-50 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Thu ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 3);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.thuHoliday || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, thuHoliday: parseFloat(e.target.value) || 0 })}
                    className="bg-orange-50 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fri ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 4);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.friHoliday || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, friHoliday: parseFloat(e.target.value) || 0 })}
                    className="bg-orange-50 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sat ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 5);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.satHoliday || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, satHoliday: parseFloat(e.target.value) || 0 })}
                    className="bg-orange-50 border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sun ({(() => {
                    const date = parseLocalDate(currentWeek);
                    date.setDate(date.getDate() + 6);
                    return format(date, 'MMM do');
                  })()})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newProjectEntry.sunHoliday || ''}
                    onChange={(e) => setNewProjectEntry({ ...newProjectEntry, sunHoliday: parseFloat(e.target.value) || 0 })}
                    className="bg-orange-50 border-orange-200 focus:border-orange-400"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                const totalBillableHours = newProjectEntry.mon + newProjectEntry.tue + newProjectEntry.wed + 
                                   newProjectEntry.thu + newProjectEntry.fri + newProjectEntry.sat + newProjectEntry.sun;
                const totalTimeOff = newProjectEntry.monTimeOff + newProjectEntry.tueTimeOff + newProjectEntry.wedTimeOff + 
                                   newProjectEntry.thuTimeOff + newProjectEntry.friTimeOff + newProjectEntry.satTimeOff + newProjectEntry.sunTimeOff;
                const totalHoliday = newProjectEntry.monHoliday + newProjectEntry.tueHoliday + newProjectEntry.wedHoliday + 
                                   newProjectEntry.thuHoliday + newProjectEntry.friHoliday + newProjectEntry.satHoliday + newProjectEntry.sunHoliday;
                const totalAllHours = totalBillableHours + totalTimeOff + totalHoliday;
                
                if (newProjectEntry.clientName && newProjectEntry.projectName && totalAllHours > 0) {
                  const newProject = {
                    projectId: `manual-${Date.now()}`,
                    clientName: newProjectEntry.clientName,
                    projectName: newProjectEntry.projectName,
                    mon: newProjectEntry.mon,
                    tue: newProjectEntry.tue,
                    wed: newProjectEntry.wed,
                    thu: newProjectEntry.thu,
                    fri: newProjectEntry.fri,
                    sat: newProjectEntry.sat,
                    sun: newProjectEntry.sun,
                    monTimeOff: newProjectEntry.monTimeOff,
                    tueTimeOff: newProjectEntry.tueTimeOff,
                    wedTimeOff: newProjectEntry.wedTimeOff,
                    thuTimeOff: newProjectEntry.thuTimeOff,
                    friTimeOff: newProjectEntry.friTimeOff,
                    satTimeOff: newProjectEntry.satTimeOff,
                    sunTimeOff: newProjectEntry.sunTimeOff,
                    monHoliday: newProjectEntry.monHoliday,
                    tueHoliday: newProjectEntry.tueHoliday,
                    wedHoliday: newProjectEntry.wedHoliday,
                    thuHoliday: newProjectEntry.thuHoliday,
                    friHoliday: newProjectEntry.friHoliday,
                    satHoliday: newProjectEntry.satHoliday,
                    sunHoliday: newProjectEntry.sunHoliday,
                    uploadedFile: uploadedTimesheetFile || undefined,
                    uploadedFileUrl: uploadedTimesheetUrl || undefined,
                  };
                  setWeeklyProjects([...weeklyProjects, newProject]);
                  
                  // Clear uploaded file after adding to project
                  setUploadedTimesheetFile(null);
                  setUploadedTimesheetUrl('');
                  
                  // Reset form but keep client name and project name if employee has them assigned
                  const employee = employees.find(emp => emp.id === selectedEmployee);
                  const clientNameToKeep = employee && employee.clientId && clients.length > 0 
                    ? (clients.find((c: any) => c.id === employee.clientId)?.name || 
                       clients.find((c: any) => c.id === employee.clientId)?.companyName || '')
                    : '';
                  const projectNameToKeep = employeeProjects.length === 1 
                    ? (employeeProjects[0].projectName || '')
                    : '';
                  
                  setNewProjectEntry({
                    clientName: clientNameToKeep,
                    projectName: projectNameToKeep,
                    mon: 0,
                    tue: 0,
                    wed: 0,
                    thu: 0,
                    fri: 0,
                    sat: 0,
                    sun: 0,
                    monTimeOff: 0,
                    tueTimeOff: 0,
                    wedTimeOff: 0,
                    thuTimeOff: 0,
                    friTimeOff: 0,
                    satTimeOff: 0,
                    sunTimeOff: 0,
                    monHoliday: 0,
                    tueHoliday: 0,
                    wedHoliday: 0,
                    thuHoliday: 0,
                    friHoliday: 0,
                    satHoliday: 0,
                    sunHoliday: 0
                  });
                }
              }}
              className="mt-3"
              disabled={!newProjectEntry.clientName || !newProjectEntry.projectName || 
                       (newProjectEntry.mon + newProjectEntry.tue + newProjectEntry.wed + 
                        newProjectEntry.thu + newProjectEntry.fri + newProjectEntry.sat + newProjectEntry.sun +
                        newProjectEntry.monTimeOff + newProjectEntry.tueTimeOff + newProjectEntry.wedTimeOff + 
                        newProjectEntry.thuTimeOff + newProjectEntry.friTimeOff + newProjectEntry.satTimeOff + newProjectEntry.sunTimeOff +
                        newProjectEntry.monHoliday + newProjectEntry.tueHoliday + newProjectEntry.wedHoliday + 
                        newProjectEntry.thuHoliday + newProjectEntry.friHoliday + newProjectEntry.satHoliday + newProjectEntry.sunHoliday) <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Timesheet
            </Button>
          </div>

          {/* Project List */}
          {weeklyProjects.length > 0 && (
            <div className="space-y-3">
              {weeklyProjects.map((wp) => {
                const billableTotal = (wp.mon || 0) + (wp.tue || 0) + (wp.wed || 0) + 
                                     (wp.thu || 0) + (wp.fri || 0) + (wp.sat || 0) + (wp.sun || 0);
                const timeOffTotal = (wp.monTimeOff || 0) + (wp.tueTimeOff || 0) + (wp.wedTimeOff || 0) + 
                                     (wp.thuTimeOff || 0) + (wp.friTimeOff || 0) + (wp.satTimeOff || 0) + (wp.sunTimeOff || 0);
                const holidayTotal = (wp.monHoliday || 0) + (wp.tueHoliday || 0) + (wp.wedHoliday || 0) + 
                                     (wp.thuHoliday || 0) + (wp.friHoliday || 0) + (wp.satHoliday || 0) + (wp.sunHoliday || 0);
                const projectTotal = billableTotal + timeOffTotal + holidayTotal;
                return (
                  <div
                    key={wp.projectId}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{wp.projectName}</h4>
                          {wp.uploadedFile && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                              <FileText className="h-3 w-3" />
                              <span>Timesheet attached</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{wp.clientName}</p>
                        {wp.uploadedFile && (
                          <p className="text-xs text-green-600 mt-1">{wp.uploadedFile.name}</p>
                        )}
                        {/* Hour breakdown */}
                        <div className="flex gap-4 mt-2 text-xs">
                          {billableTotal > 0 && (
                            <div className="flex items-center gap-1 text-green-700">
                              <DollarSign className="h-3 w-3" />
                              <span>{billableTotal}h billable</span>
                            </div>
                          )}
                          {timeOffTotal > 0 && (
                            <div className="flex items-center gap-1 text-blue-700">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{timeOffTotal}h time off</span>
                            </div>
                          )}
                          {holidayTotal > 0 && (
                            <div className="flex items-center gap-1 text-orange-700">
                              <CalendarIcon className="h-3 w-3" />
                              <span>{holidayTotal}h holiday</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-medium">{projectTotal}h</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setWeeklyProjects(weeklyProjects.filter((p) => p.projectId !== wp.projectId));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Daily Hours */}
                    <div className="grid grid-cols-7 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mon ({format(parseLocalDate(currentWeek), 'MMM do')})</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={wp.mon || ''}
                            onChange={(e) => {
                              const updatedProjects = weeklyProjects.map((p) =>
                                p.projectId === wp.projectId
                                  ? { ...p, mon: parseFloat(e.target.value) || 0 }
                                  : p
                              );
                              setWeeklyProjects(updatedProjects);
                            }}
                            className="text-center pb-5"
                          />
                          {(wp.monTimeOff > 0 || wp.monHoliday > 0) && (
                            <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-none">
                              {wp.monTimeOff > 0 && (
                                <div className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.monTimeOff}h
                                </div>
                              )}
                              {wp.monHoliday > 0 && (
                                <div className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.monHoliday}h
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tue ({(() => {
                          const date = parseLocalDate(currentWeek);
                          date.setDate(date.getDate() + 1);
                          return format(date, 'MMM do');
                        })()})</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={wp.tue || ''}
                            onChange={(e) => {
                              const updatedProjects = weeklyProjects.map((p) =>
                                p.projectId === wp.projectId
                                  ? { ...p, tue: parseFloat(e.target.value) || 0 }
                                  : p
                              );
                              setWeeklyProjects(updatedProjects);
                            }}
                            className="text-center pb-5"
                          />
                          {(wp.tueTimeOff > 0 || wp.tueHoliday > 0) && (
                            <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-none">
                              {wp.tueTimeOff > 0 && (
                                <div className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.tueTimeOff}h
                                </div>
                              )}
                              {wp.tueHoliday > 0 && (
                                <div className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.tueHoliday}h
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Wed ({(() => {
                          const date = parseLocalDate(currentWeek);
                          date.setDate(date.getDate() + 2);
                          return format(date, 'MMM do');
                        })()})</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={wp.wed || ''}
                            onChange={(e) => {
                              const updatedProjects = weeklyProjects.map((p) =>
                                p.projectId === wp.projectId
                                  ? { ...p, wed: parseFloat(e.target.value) || 0 }
                                  : p
                              );
                              setWeeklyProjects(updatedProjects);
                            }}
                            className="text-center pb-5"
                          />
                          {(wp.wedTimeOff > 0 || wp.wedHoliday > 0) && (
                            <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-none">
                              {wp.wedTimeOff > 0 && (
                                <div className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.wedTimeOff}h
                                </div>
                              )}
                              {wp.wedHoliday > 0 && (
                                <div className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.wedHoliday}h
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Thu ({(() => {
                          const date = parseLocalDate(currentWeek);
                          date.setDate(date.getDate() + 3);
                          return format(date, 'MMM do');
                        })()})</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={wp.thu || ''}
                            onChange={(e) => {
                              const updatedProjects = weeklyProjects.map((p) =>
                                p.projectId === wp.projectId
                                  ? { ...p, thu: parseFloat(e.target.value) || 0 }
                                  : p
                              );
                              setWeeklyProjects(updatedProjects);
                            }}
                            className="text-center pb-5"
                          />
                          {(wp.thuTimeOff > 0 || wp.thuHoliday > 0) && (
                            <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-none">
                              {wp.thuTimeOff > 0 && (
                                <div className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.thuTimeOff}h
                                </div>
                              )}
                              {wp.thuHoliday > 0 && (
                                <div className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.thuHoliday}h
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Fri ({(() => {
                          const date = parseLocalDate(currentWeek);
                          date.setDate(date.getDate() + 4);
                          return format(date, 'MMM do');
                        })()})</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={wp.fri || ''}
                            onChange={(e) => {
                              const updatedProjects = weeklyProjects.map((p) =>
                                p.projectId === wp.projectId
                                  ? { ...p, fri: parseFloat(e.target.value) || 0 }
                                  : p
                              );
                              setWeeklyProjects(updatedProjects);
                            }}
                            className="text-center pb-5"
                          />
                          {(wp.friTimeOff > 0 || wp.friHoliday > 0) && (
                            <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-none">
                              {wp.friTimeOff > 0 && (
                                <div className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.friTimeOff}h
                                </div>
                              )}
                              {wp.friHoliday > 0 && (
                                <div className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.friHoliday}h
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Sat ({(() => {
                          const date = parseLocalDate(currentWeek);
                          date.setDate(date.getDate() + 5);
                          return format(date, 'MMM do');
                        })()})</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={wp.sat || ''}
                            onChange={(e) => {
                              const updatedProjects = weeklyProjects.map((p) =>
                                p.projectId === wp.projectId
                                  ? { ...p, sat: parseFloat(e.target.value) || 0 }
                                  : p
                              );
                              setWeeklyProjects(updatedProjects);
                            }}
                            className="text-center pb-5"
                          />
                          {(wp.satTimeOff > 0 || wp.satHoliday > 0) && (
                            <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-none">
                              {wp.satTimeOff > 0 && (
                                <div className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.satTimeOff}h
                                </div>
                              )}
                              {wp.satHoliday > 0 && (
                                <div className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.satHoliday}h
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Sun ({(() => {
                          const date = parseLocalDate(currentWeek);
                          date.setDate(date.getDate() + 6);
                          return format(date, 'MMM do');
                        })()})</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={wp.sun || ''}
                            onChange={(e) => {
                              const updatedProjects = weeklyProjects.map((p) =>
                                p.projectId === wp.projectId
                                  ? { ...p, sun: parseFloat(e.target.value) || 0 }
                                  : p
                              );
                              setWeeklyProjects(updatedProjects);
                            }}
                            className="text-center pb-5"
                          />
                          {(wp.sunTimeOff > 0 || wp.sunHoliday > 0) && (
                            <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-none">
                              {wp.sunTimeOff > 0 && (
                                <div className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.sunTimeOff}h
                                </div>
                              )}
                              {wp.sunHoliday > 0 && (
                                <div className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded flex items-center gap-0.5">
                                  <CalendarIcon className="h-2 w-2" />
                                  {wp.sunHoliday}h
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Weekly Totals */}
              <div className="bg-gray-50 border-2 rounded-lg p-4 space-y-3">
                {(() => {
                  const billableHours = weeklyProjects.reduce((sum, p) => 
                    sum + (p.mon || 0) + (p.tue || 0) + (p.wed || 0) + 
                    (p.thu || 0) + (p.fri || 0) + (p.sat || 0) + (p.sun || 0), 0
                  );
                  const timeOffHours = weeklyProjects.reduce((sum, p) => 
                    sum + (p.monTimeOff || 0) + (p.tueTimeOff || 0) + (p.wedTimeOff || 0) + 
                    (p.thuTimeOff || 0) + (p.friTimeOff || 0) + (p.satTimeOff || 0) + (p.sunTimeOff || 0), 0
                  );
                  const holidayHours = weeklyProjects.reduce((sum, p) => 
                    sum + (p.monHoliday || 0) + (p.tueHoliday || 0) + (p.wedHoliday || 0) + 
                    (p.thuHoliday || 0) + (p.friHoliday || 0) + (p.satHoliday || 0) + (p.sunHoliday || 0), 0
                  );
                  const totalHours = billableHours + timeOffHours + holidayHours;
                  const regularHours = Math.min(billableHours, 40);
                  const overtimeHours = Math.max(billableHours - 40, 0);
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Hours for Week:</span>
                        <span className="text-2xl font-bold">{totalHours}h</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="text-xs text-muted-foreground">Billable</div>
                            <div className="font-semibold text-green-700">{billableHours}h</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <CalendarIcon className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="text-xs text-muted-foreground">Time Off</div>
                            <div className="font-semibold text-blue-700">{timeOffHours}h</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                          <CalendarIcon className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="text-xs text-muted-foreground">Holiday</div>
                            <div className="font-semibold text-orange-700">{holidayHours}h</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Regular Hours:</span>
                          <span className="font-medium">{regularHours}h</span>
                        </div>
                        {timeOffHours > 0 && (
                          <div className="flex items-center justify-between pl-4">
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Time Off
                            </span>
                            <span className="text-sm font-medium text-blue-700">{timeOffHours}h</span>
                          </div>
                        )}
                        {holidayHours > 0 && (
                          <div className="flex items-center justify-between pl-4">
                            <span className="text-xs text-orange-600 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Holiday
                            </span>
                            <span className="text-sm font-medium text-orange-700">{holidayHours}h</span>
                          </div>
                        )}
                        {overtimeHours > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Overtime:</span>
                            <span className="font-medium text-orange-600">{overtimeHours}h</span>
                          </div>
                        )}
                      </div>
                      
                      {uploadedTimesheetUrl && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                            <FileText className="h-4 w-4" />
                            <span>Client timesheet uploaded</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAddEntry}
              >
                Submit Timesheet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Week Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Week</CardTitle>
              <CardDescription>Week ending {format(parseISO(displayCurrentWeek), "MMM d, yyyy")}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl">{currentWeekTotal}h</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hasUnsubmittedEntries && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-sm">You have unsubmitted time entries</div>
                    <div className="text-xs text-muted-foreground">
                      Submit your timesheet to proceed with invoicing
                    </div>
                  </div>
                </div>
                <Button size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Timesheet
                </Button>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentWeekEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No time entries for this week
                    </TableCell>
                  </TableRow>
                ) : (
                  currentWeekEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{entry.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{entry.project}</TableCell>
                      <TableCell>{entry.client}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {((entry.regularHours || 0) + (entry.overtimeHours || 0) + (entry.holidayHours || 0) + (entry.timeOffHours || 0)) || entry.hours || 0}h
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.invoiceFile && (
                          <Badge variant="outline" className="mr-2">
                            <FileText className="h-3 w-3 mr-1" />
                            Invoice
                          </Badge>
                        )}
                        {(() => {
                          const weekEndDate = parseISO(entry.weekEnding);
                          const weekStartDate = new Date(weekEndDate);
                          weekStartDate.setDate(weekEndDate.getDate() - 6);
                          return `Week of ${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d, yyyy")}`;
                        })()}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        {entry.status !== "approved" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingEntry(entry);
                                setShowEditDialog(true);
                              }}
                              title="Edit entry"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setDeletingEntry(entry);
                                setShowDeleteDialog(true);
                              }}
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Previous Weeks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const prevMonth = new Date(selectedMonth);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setSelectedMonth(prevMonth);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>{format(selectedMonth, 'MMMM yyyy')} Timesheets</CardTitle>
                <CardDescription>View your submitted and approved timesheets</CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const nextMonth = new Date(selectedMonth);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setSelectedMonth(nextMonth);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-right">
              <div className="text-2xl">{(() => {
                // Calculate total hours from all timesheets in selected month
                const monthValue = selectedMonth.getMonth();
                const yearValue = selectedMonth.getFullYear();
                const monthWeeks = Object.keys(groupedByWeek).filter(week => {
                  const weekDate = parseISO(week);
                  return weekDate.getMonth() === monthValue && weekDate.getFullYear() === yearValue;
                });
                return monthWeeks.reduce((sum, week) => {
                  return sum + calculateWeekTotal(groupedByWeek[week]);
                }, 0);
              })()}h</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTimesheets ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading timesheets...
            </div>
          ) : (() => {
            const monthValue = selectedMonth.getMonth();
            const yearValue = selectedMonth.getFullYear();
            console.log('=== Month Filter Debug ===');
            console.log('Selected month:', format(selectedMonth, 'MMMM yyyy'));
            console.log('Month value:', monthValue, 'Year value:', yearValue);
            console.log('All week endings:', Object.keys(groupedByWeek));
            console.log('Total entries:', entries.length);
            const monthWeeks = Object.keys(groupedByWeek).filter(week => {
              const weekDate = parseISO(week);
              const matches = weekDate.getMonth() === monthValue && weekDate.getFullYear() === yearValue;
              console.log(`Week ${week}: weekDate month=${weekDate.getMonth()}, year=${weekDate.getFullYear()}, matches=${matches}`);
              return matches;
            });
            console.log('Matching weeks for current month:', monthWeeks);
            console.log('Entries in matching weeks:', monthWeeks.map(w => groupedByWeek[w].length));
            return monthWeeks.length === 0;
          })() ? (
            <div className="py-8 text-center text-muted-foreground">
              No timesheets found for {format(selectedMonth, 'MMMM yyyy')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week Ending</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedByWeek)
                  .filter(week => {
                    const weekDate = parseISO(week);
                    const monthValue = selectedMonth.getMonth();
                    const yearValue = selectedMonth.getFullYear();
                    return weekDate.getMonth() === monthValue && weekDate.getFullYear() === yearValue;
                  })
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort by most recent first
                  .map((week) => {
                    const weekEntries = groupedByWeek[week];
                    const total = calculateWeekTotal(weekEntries);
                    const allApproved = weekEntries.every(e => e.status === "approved");
                    const anyRejected = weekEntries.some(e => e.status === "rejected");
                    const hasEditableEntries = weekEntries.some(e => e.status !== "approved");
                    
                    return (
                      <TableRow key={week}>
                        <TableCell>{format(parseISO(week), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{total}h</span>
                            </div>
                            {total > 40 && (
                              <div className="text-xs text-orange-600 flex items-center gap-1">
                                <span>Regular: {Math.min(total, 40).toFixed(1)}h</span>
                                <span>•</span>
                                <span className="font-medium">OT: {(total - 40).toFixed(1)}h</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {anyRejected ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              Rejected
                            </Badge>
                          ) : allApproved ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              Submitted
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {anyRejected && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewDetailsWeek(week)}
                                >
                                  <Pencil className="h-3 w-3 mr-2" />
                                  Fix & Resubmit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setDeletingEntry({
                                      ...weekEntries[0],
                                      id: `week-${week}`,
                                      hours: total,
                                    });
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {!anyRejected && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setViewDetailsWeek(week)}
                              >
                                View Details
                              </Button>
                            )}

                            {!anyRejected && hasEditableEntries && (
                              <>
                                {weekEntries.length === 1 && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const editableEntry = weekEntries.find(e => e.status !== "approved");
                                        if (editableEntry) {
                                          setEditingEntry(editableEntry);
                                          setShowEditDialog(true);
                                        }
                                      }}
                                      title="Edit entry"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const editableEntry = weekEntries.find(e => e.status !== "approved");
                                        if (editableEntry) {
                                          setDeletingEntry(editableEntry);
                                          setShowDeleteDialog(true);
                                        }
                                      }}
                                      title="Delete entry"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                                {weekEntries.length > 1 && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setViewDetailsWeek(week)}
                                      title="Edit/Delete entries"
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Week
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setDeletingEntry({
                                          ...weekEntries[0],
                                          id: `week-${week}`,
                                          hours: total,
                                        });
                                        setShowDeleteDialog(true);
                                      }}
                                      title="Delete entire week"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                            {allApproved && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            )}
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

      {/* View Details Dialog */}
      <Dialog open={viewDetailsWeek !== null} onOpenChange={(open) => !open && setViewDetailsWeek(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Timesheet Details</DialogTitle>
            <DialogDescription>
              {viewDetailsWeek && `Week ending ${format(parseISO(viewDetailsWeek), "MMMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>
          
          {viewDetailsWeek && groupedByWeek[viewDetailsWeek] && (
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Rejection Alert */}
              {groupedByWeek[viewDetailsWeek].some(e => e.status === "rejected") && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-semibold block mb-1">Timesheet Rejected</span>
                    {(() => {
                      const rejectionComments = Array.from(new Set(
                        groupedByWeek[viewDetailsWeek]
                          .filter(e => e.rejectionComment)
                          .map(e => e.rejectionComment)
                      ));
                      return rejectionComments.length > 0 
                        ? rejectionComments.join('; ') 
                        : 'No specific reason provided.';
                    })()}
                    <div className="mt-2 text-xs opacity-90">
                      Please review and correct the entries below, then click "Resubmit Timesheet".
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Week Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-800">Total Hours</div>
                    <div className="text-2xl text-blue-900">
                      {(() => {
                        const total = calculateWeekTotal(groupedByWeek[viewDetailsWeek]);
                        return total;
                      })()}h
                    </div>
                    {(() => {
                      const total = calculateWeekTotal(groupedByWeek[viewDetailsWeek]);
                      if (total > 40) {
                        return (
                          <div className="text-xs mt-1 space-y-0.5">
                            <div className="text-blue-700">Regular: {Math.min(total, 40).toFixed(1)}h</div>
                            <div className="text-orange-700 font-medium">Overtime: {(total - 40).toFixed(1)}h</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div>
                    <div className="text-sm text-blue-800">Total Entries</div>
                    <div className="text-2xl text-blue-900">
                      {groupedByWeek[viewDetailsWeek].length}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(
                      groupedByWeek[viewDetailsWeek].every(e => e.status === "approved")
                        ? "approved"
                        : groupedByWeek[viewDetailsWeek].some(e => e.status === "rejected")
                        ? "rejected"
                        : "submitted"
                    )}
                  </div>
                </div>
              </div>

              {/* Client Timesheet Document */}
              {(() => {
                const clientTimesheetUrl = groupedByWeek[viewDetailsWeek][0]?.clientTimesheetUrl;
                if (clientTimesheetUrl) {
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <div className="font-medium text-green-900">Client Timesheet Attached</div>
                            <div className="text-sm text-green-700">Approved timesheet document</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(clientTimesheetUrl, '_blank')}
                          className="border-green-300 hover:bg-green-100"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Client Timesheet Document Preview */}
              {(() => {
                const entriesWithDocs = groupedByWeek[viewDetailsWeek].filter(e => e.clientTimesheetUrl);
                if (entriesWithDocs.length > 0) {
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <h3 className="font-medium">Document Preview</h3>
                      </div>
                      <div className="space-y-4">
                        {entriesWithDocs
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((entry) => (
                            <div key={entry.id} className="border rounded-lg overflow-hidden bg-white">
                              <div className="relative" style={{ height: '600px' }}>
                                <iframe
                                  src={entry.clientTimesheetUrl}
                                  className="w-full h-full"
                                  title={`Client Timesheet - ${entry.project}`}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Detailed Entries Table */}
              <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedByWeek[viewDetailsWeek]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.project}</TableCell>
                          <TableCell>{entry.client || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {((entry.regularHours || 0) + (entry.overtimeHours || 0) + (entry.holidayHours || 0) + (entry.timeOffHours || 0)) || entry.hours || 0}h
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            {entry.invoiceFile && (
                              <Badge variant="outline" className="mr-2 mb-1">
                                <FileText className="h-3 w-3 mr-1" />
                                Invoice
                              </Badge>
                            )}
                            {entry.clientTimesheetUrl && (
                              <Badge variant="outline" className="mr-2 mb-1 bg-green-50 text-green-700 border-green-300">
                                <FileText className="h-3 w-3 mr-1" />
                                Client Timesheet
                              </Badge>
                            )}
                            <div className="text-sm break-words whitespace-normal">{entry.description || "—"}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {entry.clientTimesheetUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(entry.clientTimesheetUrl, '_blank')}
                                  title="Download Client Timesheet"
                                >
                                  <Download className="h-3 w-3 text-green-600" />
                                </Button>
                              )}
                              {entry.status !== "approved" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingEntry(entry);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setDeletingEntry(entry);
                                      setShowDeleteDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewDetailsWeek(null)}>
                  Close
                </Button>
                {groupedByWeek[viewDetailsWeek].some(e => e.status === "rejected" || e.status === "draft") && (
                   <Button onClick={() => handleResubmitWeek(groupedByWeek[viewDetailsWeek])}>
                    <Send className="h-4 w-4 mr-2" />
                    Resubmit Timesheet
                  </Button>
                )}
                {groupedByWeek[viewDetailsWeek].every(e => e.status === "approved") && (
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Export Timesheet
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Timesheet Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timesheet Entry</DialogTitle>
            <DialogDescription>
              Update the details for this timesheet entry.
            </DialogDescription>
          </DialogHeader>
          
          {editingEntry && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="text"
                  value={format(new Date(editingEntry.date), "MMMM d, yyyy")}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-client-select">Client <span className="text-red-500">*</span></Label>
                <Select 
                  value={editSelectedClient} 
                  onValueChange={(value) => {
                    setEditSelectedClient(value);
                    const client = clients.find((c: any) => c.id === value);
                    setEditingEntry({ 
                      ...editingEntry, 
                      client: client?.companyName || client?.legalName || '',
                      clientId: value,
                      project: '' // Reset project when client changes
                    });
                  }}
                >
                  <SelectTrigger id="edit-client-select">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName || client.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project / PO <span className="text-red-500">*</span></Label>
                {editAvailableProjects.length > 0 ? (
                  <Popover open={editProjectComboOpen} onOpenChange={setEditProjectComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={editProjectComboOpen}
                        className="w-full justify-between"
                        disabled={!editSelectedClient}
                      >
                        {editingEntry.project || "Select or type project name..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search projects..." />
                        <CommandList>
                          <CommandEmpty>No projects found.</CommandEmpty>
                          <CommandGroup heading="Available Projects">
                            {editAvailableProjects.map((project: any) => (
                              <CommandItem
                                key={project.id}
                                value={project.name}
                                onSelect={(value) => {
                                  setEditingEntry({ ...editingEntry, project: value });
                                  setEditProjectComboOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editingEntry.project === project.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {project.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    type="text"
                    placeholder={!editSelectedClient ? "Select a client first" : "Enter project name"}
                    value={editingEntry.project}
                    onChange={(e) => setEditingEntry({ ...editingEntry, project: e.target.value })}
                    disabled={!editSelectedClient}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-hours">Hours <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={editingEntry.hours}
                  onChange={(e) => setEditingEntry({ ...editingEntry, hours: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  rows={3}
                  placeholder="Enter description"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingEntry(null);
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleEditEntry}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deletingEntry?.id.startsWith('week-') ? 'Delete Entire Week' : 'Delete Timesheet Entry'}
            </DialogTitle>
            <DialogDescription>
              {deletingEntry?.id.startsWith('week-') 
                ? 'Are you sure you want to delete all time entries for this week? This action cannot be undone.'
                : 'Are you sure you want to delete this timesheet entry? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          {deletingEntry && (
            <div className="space-y-4 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  {deletingEntry.id.startsWith('week-') ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-red-800">Week Ending:</span>
                        <span className="text-red-900">
                          {format(parseISO(deletingEntry.id.replace('week-', '')), "MMMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-800">Total Entries:</span>
                        <span className="text-red-900">
                          {groupedByWeek[deletingEntry.id.replace('week-', '')]?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-800">Total Hours:</span>
                        <span className="text-red-900">{deletingEntry.hours}h</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-red-800">Date:</span>
                        <span className="text-red-900">{format(new Date(deletingEntry.date), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-800">Project:</span>
                        <span className="text-red-900">{deletingEntry.project}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-800">Hours:</span>
                        <span className="text-red-900">{deletingEntry.hours}h</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeletingEntry(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={handleDeleteEntry}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deletingEntry.id.startsWith('week-') ? 'Delete Week' : 'Delete Entry'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
