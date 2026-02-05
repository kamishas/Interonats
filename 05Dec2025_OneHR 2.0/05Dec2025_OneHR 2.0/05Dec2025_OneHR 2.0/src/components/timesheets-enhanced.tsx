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
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Separator } from "./ui/separator";
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
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import type { Employee } from "../types";

// Types matching backend models
interface TimesheetResponse {
  id: string;
  employee_id: string;
  employee_name?: string;
  client_id: string;
  client_name?: string;
  week_starting: string;
  week_ending: string;
  status: string;
  total_hours: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  entries: TimesheetEntry[];
}

interface TimesheetEntry {
  work_date: string;
  day_of_week?: string;
  regular_hours: number;
  overtime_hours: number;
  doubletime_hours: number;
  description?: string;
}

export function TimesheetsEnhanced() {
  const [timesheets, setTimesheets] = useState<TimesheetResponse[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingTimesheets, setIsLoadingTimesheets] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entryMode, setEntryMode] = useState<"manual" | "invoice">("manual");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    project: "",
    clientId: "", 
    hours: "",
    description: "",
  });

  // Fetch employees and timesheets on mount
  useEffect(() => {
    fetchEmployees();
    fetchTimesheets();
    fetchClients();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const token = getAccessToken();
      const response = await fetch(`${API_ENDPOINTS.EMPL_ONBORDING}/employee`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      // Filter for those who have access to timesheets
      const validEmployees = (data.requests || []).filter((r: any) => {
          if (typeof r.workflow === 'string') {
             try{ return JSON.parse(r.workflow).canAccessTimesheets } catch(e){ return false }
          }
          return r.workflow?.canAccessTimesheets === true
      });
      setEmployees(validEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      // toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchClients = async () => {
     try {
       setIsLoadingClients(true);
       const token = getAccessToken();
       const response = await fetch(`${API_ENDPOINTS.CLIENT}/clients`, {
         headers: {
           'Authorization': `Bearer ${token}`,
         },
       });
       if (!response.ok) throw new Error('Failed to fetch clients');
       const data = await response.json();
       setClients(Array.isArray(data) ? data : (data.clients || []));
     } catch (error) {
       console.error('Error fetching clients:', error);
       setClients([]);
     } finally {
       setIsLoadingClients(false);
     }
  };

  const fetchTimesheets = async () => {
    try {
      setIsLoadingTimesheets(true);
      const token = getAccessToken();
      // Assuming list all for now
      const response = await fetch(`${API_ENDPOINTS.TIMESHEET}/timesheets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch timesheets');
      }
      
      const data = await response.json();
      setTimesheets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to load timesheets');
      setTimesheets([]);
    } finally {
      setIsLoadingTimesheets(false);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      if (entryMode === 'manual') {
        if (!selectedDate || !newEntry.hours || !newEntry.clientId) {
          toast.error('Please select a client, date and hours');
          return;
        }

        // Calculate Week Start/End
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const hours = parseFloat(newEntry.hours);

        const payload = {
          employee_id: selectedEmployee,
          client_id: newEntry.clientId, 
          week_starting: format(weekStart, "yyyy-MM-dd"),
          week_ending: format(weekEnd, "yyyy-MM-dd"),
          billing_rate: 0, 
          entries: [
            {
               work_date: format(selectedDate, "yyyy-MM-dd"),
               regular_hours: hours,
               description: newEntry.description
            }
          ]
        };

        const token = getAccessToken();
        const response = await fetch(`${API_ENDPOINTS.TIMESHEET}/timesheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
           const err = await response.json();
           throw new Error(err.detail || 'Failed to create timesheet');
        }

        const createdEntry = await response.json();
        setTimesheets([createdEntry, ...timesheets]);
        toast.success('Timesheet created successfully');
      } else {
        toast.info("Invoice upload coming soon to this backend!");
      }

      // Reset form
      setShowAddDialog(false);
      setEntryMode("manual");
      setSelectedEmployee("");
      setNewEntry({ project: "", clientId: "", hours: "", description: "" });
      setSelectedDate(undefined);
    } catch (error: any) {
      console.error('Error adding entry:', error);
      toast.error(error.message || 'Failed to add timesheet entry');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'client_approved':
      case 'accounting_approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case 'rejected':
         return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Timesheets</h2>
          <p className="text-muted-foreground">
            Manage weekly timesheets and approvals
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Timesheet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
              <DialogDescription>
                Select an employee and enter time. This will create or update a weekly timesheet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* Employee Selection */}
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
                    {employees.map((employee: any) => (
                       <SelectItem key={employee.id} value={employee.id}> 
                         {employee.first_name} {employee.last_name} ({employee.email})
                       </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client-select">
                    Client <span className="text-red-500">*</span>
                </Label>
                <Select 
                   value={newEntry.clientId} 
                   onValueChange={(val) => setNewEntry({...newEntry, clientId: val})}
                >
                  <SelectTrigger id="client-select">
                    <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                       <SelectItem key={client.id} value={client.id}> 
                         {client.company_name}
                       </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Manual Entry Form */}
              <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-picker">Date <span className="text-red-500">*</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-picker"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          weekStartsOn={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours-input">Hours <span className="text-red-500">*</span></Label>
                    <Input
                      id="hours-input"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="8.0"
                      value={newEntry.hours}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, hours: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description-input">Description</Label>
                    <Textarea
                      id="description-input"
                      placeholder="What did you work on?"
                      value={newEntry.description}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleAddEntry}
                >
                  Save Entry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheets</CardTitle>
          <CardDescription>
            Weekly timesheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTimesheets ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading timesheets...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week Ending</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No timesheets found
                    </TableCell>
                  </TableRow>
                ) : (
                  timesheets.map((ts) => (
                    <TableRow key={ts.id}>
                      <TableCell>
                        {ts.week_ending}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{ts.employee_name || ts.employee_id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ts.client_name || ts.client_id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {ts.total_hours}h
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ts.status)}</TableCell>
                      <TableCell>
                         <Badge variant="secondary">{ts.entries.length} Entries</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
