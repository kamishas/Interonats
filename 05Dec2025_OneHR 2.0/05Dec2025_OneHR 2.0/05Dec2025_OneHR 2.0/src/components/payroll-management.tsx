import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Download, 
  Filter, 
  Edit2,
  User,
  FileText,
  DollarSign,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import { format } from 'date-fns';

const API_URL = API_ENDPOINTS.PAYROLL;

interface PayrollEntry {
  id: string;
  employeeNumber: string;
  employeeName: string;
  clientProjectName: string;
  projectStatus: 'Billable' | 'Non-Billable';
  clientRate: number;
  totalBillableHours: number;
  payCheckAmount: number;
  adjustedAmount: number;
  comments?: string;
  selected?: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  adjustedAmount: number;
  status: string;
  comments?: string;
  timesheetIds?: string[];
}

export function PayrollManagement() {
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [payrollSchedule, setPayrollSchedule] = useState('Half Monthly');
  const [payrollCycle, setPayrollCycle] = useState('Mar 1 - Mar 15');
  const [filterText, setFilterText] = useState('');
  const [approvedTimesheetsCount, setApprovedTimesheetsCount] = useState(0);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // Fetch approved timesheets count and invoices on mount
  useEffect(() => {
    const fetchApprovedCount = async () => {
      try {
        const response = await fetch(`${API_URL}/timesheets`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        });
        if (response.ok) {
          const data = await response.json();
          const timesheets = data.timesheets || [];
          const approved = timesheets.filter((ts: any) => 
            ts.status === 'approved' || ts.status === 'paid'
          );
          setApprovedTimesheetsCount(approved.length);
        }
      } catch (error) {
        console.error('Error fetching timesheets:', error);
      }
    };
    fetchApprovedCount();
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const response = await fetch(`${API_URL}/invoices`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to show only submitted or sent invoices and initialize adjustedAmount
        const submittedInvoices = (Array.isArray(data) ? data : [])
          .filter((inv: Invoice) => 
            inv.status === 'submitted' || inv.status === 'sent' || inv.status === 'paid'
          )
          .map((inv: Invoice) => ({
            ...inv,
            adjustedAmount: inv.adjustedAmount ?? inv.total // Initialize with total if not set
          }));
        setInvoices(submittedInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setPayrollEntries(prev => 
      prev.map(entry => ({ ...entry, selected: checked }))
    );
  };

  const handleSelectEntry = (id: string, checked: boolean) => {
    setPayrollEntries(prev =>
      prev.map(entry => 
        entry.id === id ? { ...entry, selected: checked } : entry
      )
    );
  };

  const handleAdjustedAmountChange = (id: string, value: number) => {
    setPayrollEntries(prev =>
      prev.map(entry => 
        entry.id === id ? { ...entry, adjustedAmount: value } : entry
      )
    );
  };

  const handleInvoiceAdjustedAmountChange = (id: string, value: number) => {
    setInvoices(prev =>
      prev.map(invoice => 
        invoice.id === id ? { ...invoice, adjustedAmount: value } : invoice
      )
    );
    
    // Save to backend
    saveInvoiceUpdate(id, { adjustedAmount: value });
  };

  const handleInvoiceCommentChange = (id: string, value: string) => {
    setInvoices(prev =>
      prev.map(invoice => 
        invoice.id === id ? { ...invoice, comments: value } : invoice
      )
    );
    
    // Save to backend
    saveInvoiceUpdate(id, { comments: value });
  };

  const saveInvoiceUpdate = async (id: string, updates: Partial<Invoice>) => {
    try {
      const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...updates,
          editedBy: 'HR Manager'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save invoice update');
      }

      toast.success('Invoice updated successfully');
    } catch (error) {
      console.error('Error saving invoice update:', error);
      toast.error('Failed to save invoice update');
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setLoading(true);
      
      // Fetch approved timesheets for the selected period
      const response = await fetch(`${API_URL}/payroll/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          year: selectedYear,
          schedule: payrollSchedule,
          cycle: payrollCycle
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate payroll');
      }

      const data = await response.json();
      
      console.log('Payroll calculation response:', data);
      
      if (!data.entries || data.entries.length === 0) {
        toast.error('No approved timesheets found for the selected period');
        setPayrollEntries([]);
        return;
      }

      setPayrollEntries(data.entries.map((entry: any) => ({
        ...entry,
        selected: true // Auto-select all entries
      })));
      
      toast.success(`Payroll calculated for ${data.entries.length} employee(s)`);
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to calculate payroll');
      setPayrollEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Exporting payroll data...');
    // Export logic would go here
  };

  const handleClearTimesheets = async () => {
    if (!confirm('⚠️ This will delete ALL timesheet data. Are you sure?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/timesheets/clear/all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });

      if (!response.ok) {
        throw new Error('Failed to clear timesheets');
      }

      const data = await response.json();
      toast.success('All timesheets have been cleared');
      console.log('✅ Timesheets cleared:', data);
      
      // Clear the payroll entries too since there's no data
      setPayrollEntries([]);
    } catch (error) {
      console.error('Error clearing timesheets:', error);
      toast.error('Failed to clear timesheets');
    }
  };

  const selectedEntries = payrollEntries.filter(e => e.selected);

  const totalAmount = selectedEntries
    .reduce((sum, entry) => sum + entry.adjustedAmount, 0);

  const allSelected = payrollEntries.length > 0 && payrollEntries.every(e => e.selected);
  const someSelected = payrollEntries.some(e => e.selected);

  const filteredEntries = payrollEntries.filter(entry => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      entry.employeeName.toLowerCase().includes(searchLower) ||
      entry.employeeNumber.toLowerCase().includes(searchLower) ||
      entry.clientProjectName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Fast. Flexible. Payroll That Works.</h1>
          <p className="text-muted-foreground">
            Manage employee payroll, client invoices, and generate payroll runs
          </p>
          {approvedTimesheetsCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                {approvedTimesheetsCount} Approved Timesheet{approvedTimesheetsCount !== 1 ? 's' : ''} Ready
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Payroll and Invoices */}
      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="payroll">
            <User className="h-4 w-4 mr-2" />
            Employee Payroll
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Client Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <Label>Year:</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <Label>Payroll Schedule:</Label>
                  <Select value={payrollSchedule} onValueChange={setPayrollSchedule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="Half Monthly">Half Monthly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <Label>Payroll Cycle:</Label>
                  <Select value={payrollCycle} onValueChange={setPayrollCycle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mar 1 - Mar 15">Mar 1 - Mar 15</SelectItem>
                      <SelectItem value="Mar 16 - Mar 31">Mar 16 - Mar 31</SelectItem>
                      <SelectItem value="Apr 1 - Apr 15">Apr 1 - Apr 15</SelectItem>
                      <SelectItem value="Apr 16 - Apr 30">Apr 16 - Apr 30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleGeneratePayroll} 
                    size="lg"
                    className="gradient-teal-blue text-white hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Generate Payroll
                  </Button>
                  <Button 
                    onClick={async () => {
                      // Create a test approved timesheet
                      try {
                        // First, get an employee
                        const empResponse = await fetch(`${API_URL}/employees`, {
                          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
                        });
                        const empData = await empResponse.json();
                        const employees = empData.employees || [];
                        
                        if (employees.length === 0) {
                          toast.error('No employees found. Create an employee first.');
                          return;
                        }
                        
                        const testEmployee = employees[0];
                        
                        // Create test timesheet
                        const testTimesheet = {
                          employeeId: testEmployee.id,
                          employeeName: testEmployee.name,
                          clientName: 'Test Client Corp',
                          projectName: 'Test Project Alpha',
                          hours: 40,
                          regularHours: 40,
                          description: 'Test timesheet for payroll',
                          status: 'approved',
                          weekEnding: new Date().toISOString(),
                          entryType: 'manual',
                          createdBy: 'test'
                        };
                        
                        const response = await fetch(`${API_URL}/timesheets`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${getAccessToken() ?? ''}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(testTimesheet)
                        });
                        
                        if (response.ok) {
                          toast.success('Test approved timesheet created!');
                          // Refresh count
                          const countResp = await fetch(`${API_URL}/timesheets`, {
                            headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
                          });
                          const countData = await countResp.json();
                          const approved = (countData.timesheets || []).filter((t: any) => 
                            t.status === 'approved' || t.status === 'paid'
                          );
                          setApprovedTimesheetsCount(approved.length);
                        } else {
                          toast.error('Failed to create test timesheet');
                        }
                      } catch (error) {
                        console.error('Error creating test timesheet:', error);
                        toast.error('Error creating test timesheet');
                      }
                    }}
                    variant="outline" 
                    size="lg"
                    className="glass-card hover:glass-strong transition-all"
                  >
                    🧪 Create Test Timesheet
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-lg font-medium">
                  Total: ${totalAmount.toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <div className="relative">
                    <Input
                      placeholder="Filter..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="pl-8"
                    />
                    <Filter className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="gradient-teal-blue hover:gradient-teal-blue border-none">
                      <TableHead className="text-white w-12">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          className="border-white data-[state=checked]:bg-white data-[state=checked]:text-cyan-600"
                        />
                      </TableHead>
                      <TableHead className="text-white">Employee Number</TableHead>
                      <TableHead className="text-white">Employee Name</TableHead>
                      <TableHead className="text-white">Client Name</TableHead>
                      <TableHead className="text-white">Project Status</TableHead>
                      <TableHead className="text-white">Client Rate</TableHead>
                      <TableHead className="text-white">Total Hours</TableHead>
                      <TableHead className="text-white">Pay Check Amount</TableHead>
                      <TableHead className="text-white">Adjusted Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            <span>Loading payroll data...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No payroll entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntries.map((entry) => {
                        // Extract client name from "Client - Project" format
                        const clientName = entry.clientProjectName.split(' - ')[0];
                        // Get first letter of employee name for avatar
                        const initial = entry.employeeName?.charAt(0)?.toUpperCase() || 'E';
                        
                        return (
                          <TableRow key={entry.id} className="hover:bg-slate-50">
                            <TableCell>
                              <Checkbox
                                checked={entry.selected || false}
                                onCheckedChange={(checked) => handleSelectEntry(entry.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{entry.employeeNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full gradient-teal-blue flex items-center justify-center text-white font-medium shadow-md">
                                  {initial}
                                </div>
                                <span className="font-medium">{entry.employeeName || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{clientName}</TableCell>
                            <TableCell>
                              <Badge variant={entry.projectStatus === 'Billable' ? 'default' : 'secondary'}>
                                {entry.projectStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">${entry.clientRate}</TableCell>
                            <TableCell className="font-medium">{entry.totalBillableHours}</TableCell>
                            <TableCell className="font-medium">${entry.payCheckAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">${entry.adjustedAmount.toLocaleString()}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    const newAmount = prompt('Enter adjusted amount:', entry.adjustedAmount.toString());
                                    if (newAmount && !isNaN(Number(newAmount))) {
                                      handleAdjustedAmountChange(entry.id, Number(newAmount));
                                    }
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Client Invoices</CardTitle>
              <p className="text-sm text-muted-foreground">
                All submitted and sent invoices to clients for approved work
              </p>
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading invoices...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="gradient-teal-blue">
                      <TableHead className="text-white">Invoice #</TableHead>
                      <TableHead className="text-white">Client</TableHead>
                      <TableHead className="text-white">Invoice Date</TableHead>
                      <TableHead className="text-white">Due Date</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Adjusted Amount</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No submitted invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {invoice.invoiceNumber}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{invoice.clientName}</TableCell>
                          <TableCell>
                            {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{invoice.total.toFixed(2)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingInvoiceId === invoice.id ? (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  defaultValue={invoice.adjustedAmount}
                                  className="w-24 h-8"
                                  autoFocus
                                  onBlur={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value)) {
                                      handleInvoiceAdjustedAmountChange(invoice.id, value);
                                    }
                                    setEditingInvoiceId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const value = parseFloat(e.currentTarget.value);
                                      if (!isNaN(value)) {
                                        handleInvoiceAdjustedAmountChange(invoice.id, value);
                                      }
                                      setEditingInvoiceId(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingInvoiceId(null);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{invoice.adjustedAmount.toFixed(2)}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-slate-100"
                                  onClick={() => setEditingInvoiceId(invoice.id)}
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                invoice.status === 'paid' ? 'default' : 
                                invoice.status === 'sent' ? 'secondary' : 
                                'outline'
                              }
                              className={
                                invoice.status === 'paid' ? 'bg-green-600' :
                                invoice.status === 'sent' ? 'bg-blue-600' :
                                invoice.status === 'submitted' ? 'bg-purple-600' :
                                ''
                              }
                            >
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {editingCommentId === invoice.id ? (
                              <Input
                                type="text"
                                defaultValue={invoice.comments || ''}
                                className="w-48 h-8"
                                autoFocus
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  handleInvoiceCommentChange(invoice.id, value);
                                  setEditingCommentId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const value = e.currentTarget.value;
                                    handleInvoiceCommentChange(invoice.id, value);
                                    setEditingCommentId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingCommentId(null);
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{invoice.comments || 'N/A'}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-slate-100"
                                  onClick={() => setEditingCommentId(invoice.id)}
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
