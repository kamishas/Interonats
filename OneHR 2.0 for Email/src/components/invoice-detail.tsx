import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Edit2, Send, Save, Search, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

interface InvoiceLineItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  type?: 'charge' | 'credit'; // charge adds to total, credit subtracts from total
}

interface InvoiceDetailProps {
  invoiceId?: string;
  timesheetIds?: string[];
  onBack: () => void;
}

export function InvoiceDetail({ invoiceId, timesheetIds, onBack }: InvoiceDetailProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Company Information
  const [companyName, setCompanyName] = useState('Interon IT');
  const [companyAddress, setCompanyAddress] = useState('1234 Business Avenue,\nSuite 500, New York,\nNY 10001, USA');
  const [companyPhone, setCompanyPhone] = useState('+1 (555) 123-4567');
  const [companyEmail, setCompanyEmail] = useState('billing@interonit.com');
  const [companyWebsite, setCompanyWebsite] = useState('www.interonit.com');
  const [editingCompany, setEditingCompany] = useState(false);
  
  // Client Information
  const [searchClient, setSearchClient] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [billTo, setBillTo] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  // Invoice Information
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [poNumber, setPoNumber] = useState('');
  
  // Line Items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('Payment is due within 30 days of invoice date.');
  
  // Calculated fields
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 0; // Can be made configurable
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  useEffect(() => {
    fetchClients();
    if (invoiceId) {
      loadExistingInvoice();
    } else if (timesheetIds && timesheetIds.length > 0) {
      generateInvoiceFromTimesheets();
    } else {
      generateInvoiceNumber();
    }
  }, []);

  const fetchClients = async () => {
    try {
      console.log('[InvoiceDetail] Starting to fetch clients from:', `${API_URL}/clients/advanced`);
      const response = await fetch(`${API_URL}/clients/advanced`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      console.log('[InvoiceDetail] Fetch response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[InvoiceDetail] Fetched clients data:', data);
        console.log('[InvoiceDetail] Number of clients:', data.clients?.length || 0);
        console.log('[InvoiceDetail] Client names:', data.clients?.map((c: any) => c.companyName || c.name) || []);
        
        // Map companyName to name for consistency
        const mappedClients = (data.clients || []).map((c: any) => ({
          ...c,
          name: c.companyName || c.name
        }));
        
        setClients(mappedClients);
        
        // If no clients exist, show a helpful message
        if (!mappedClients || mappedClients.length === 0) {
          console.warn('[InvoiceDetail] ⚠️ NO CLIENTS FOUND IN DATABASE');
          toast.error('No clients found. Please add clients in the Client Management section first.');
        }
      } else {
        console.error('[InvoiceDetail] Failed to fetch clients. Status:', response.status);
        const errorText = await response.text();
        console.error('[InvoiceDetail] Error response:', errorText);
      }
    } catch (error) {
      console.error('[InvoiceDetail] Error fetching clients:', error);
    }
  };
  
  const createTestClient = async () => {
    try {
      const testClient = {
        name: 'Test Client Company',
        email: 'test@testclient.com',
        address: '123 Test Street, Test City, TC 12345',
        billingAddress: 'Test Client Company\n123 Test Street\nTest City, TC 12345',
        phone: '555-TEST-CLIENT',
        status: 'active'
      };
      
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(testClient)
      });
      
      if (response.ok) {
        toast.success('Test client created! Refreshing list...');
        await fetchClients();
      } else {
        const errorText = await response.text();
        toast.error(`Failed to create test client: ${errorText}`);
      }
    } catch (error) {
      console.error('[InvoiceDetail] Error creating test client:', error);
      toast.error('Failed to create test client');
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      console.log('[InvoiceDetail] Generating invoice number...');
      const response = await fetch(`${API_URL}/invoices/generate-number`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[InvoiceDetail] Generated invoice number:', data.invoiceNumber);
        setInvoiceNumber(data.invoiceNumber);
        toast.success(`Invoice number generated: ${data.invoiceNumber}`);
      } else {
        console.error('[InvoiceDetail] Failed to generate invoice number, status:', response.status);
        // Fallback to date-based number
        const fallbackNumber = `INV-${Date.now()}`;
        setInvoiceNumber(fallbackNumber);
        toast.info(`Using fallback invoice number: ${fallbackNumber}`);
      }
    } catch (error) {
      console.error('[InvoiceDetail] Error generating invoice number:', error);
      // Fallback to date-based number
      const fallbackNumber = `INV-${Date.now()}`;
      setInvoiceNumber(fallbackNumber);
      toast.info(`Using fallback invoice number: ${fallbackNumber}`);
    }
  };

  const loadExistingInvoice = async () => {
    if (!invoiceId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const invoice = data.invoice;
        
        // Populate all fields
        setInvoiceNumber(invoice.invoiceNumber);
        setInvoiceDate(invoice.invoiceDate?.split('T')[0] || invoiceDate);
        setDueDate(invoice.dueDate?.split('T')[0] || dueDate);
        setPoNumber(invoice.poNumber || '');
        setSearchClient(invoice.clientName || '');
        setClientEmail(invoice.clientEmail || '');
        setBillTo(invoice.billTo || '');
        setLineItems(invoice.lineItems || []);
        setNotes(invoice.notes || notes);
        setTerms(invoice.terms || terms);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceFromTimesheets = async () => {
    if (!timesheetIds || timesheetIds.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/timesheets`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch timesheets');
      
      const data = await response.json();
      const timesheets = data.timesheets || [];
      const selectedTimesheets = timesheets.filter((ts: any) => 
        timesheetIds.includes(ts.id)
      );
      
      if (selectedTimesheets.length === 0) {
        toast.error('No timesheets found');
        return;
      }

      // Fetch project assignments to get billing rates
      const assignmentsResponse = await fetch(`${API_URL}/assignments`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      let projectAssignments: any[] = [];
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        projectAssignments = assignmentsData.assignments || assignmentsData || [];
        console.log('[InvoiceDetail] Loaded project assignments:', projectAssignments.length);
      } else {
        console.warn('[InvoiceDetail] Failed to fetch project assignments');
      }

      // Get client info from first timesheet
      const firstTimesheet = selectedTimesheets[0];
      setSearchClient(firstTimesheet.clientName || '');
      
      // Find client to get email and billing address
      const client = clients.find((c: any) => 
        c.name === firstTimesheet.clientName || c.id === firstTimesheet.clientId
      );
      
      if (client) {
        setClientEmail(client.email || '');
        setBillTo(client.billingAddress || `${client.name}\n${client.address || ''}`);
      }

      // Generate line items from timesheets
      const items: InvoiceLineItem[] = [];
      let missingRates = 0;
      
      for (const ts of selectedTimesheets) {
        // Handle both old and new timesheet formats
        if (ts.projects && Array.isArray(ts.projects)) {
          // New format with projects array
          for (const project of ts.projects) {
            // Try to get billing rate from: 1) timesheet 2) project assignment 3) default to 0
            let rate = ts.billingRate || 0;
            
            // If no rate on timesheet, look up from project assignment
            if (rate === 0) {
              const assignment = projectAssignments.find((a: any) => 
                a.employeeId === ts.employeeId && 
                a.projectName === project.projectName
              );
              
              if (assignment) {
                rate = assignment.billingRate || assignment.billableRate || assignment.rate || 0;
                console.log(`[InvoiceDetail] Found billing rate from assignment for ${ts.employeeName} on ${project.projectName}: $${rate}/hr`);
              }
            }
            
            if (rate === 0) {
              missingRates++;
              console.info(`[InvoiceDetail] No billing rate found for ${ts.employeeName} on project ${project.projectName} - defaulting to $0/hr`);
              console.info(`[InvoiceDetail] Solution: Use Auto-Fix All button or add project assignment in Vendor Management for ${ts.employeeName} on ${project.projectName}`);
            }
            
            items.push({
              id: crypto.randomUUID(),
              description: `${project.projectName} - ${ts.employeeName} - Week ending ${new Date(ts.weekEnding).toLocaleDateString()}`,
              hours: project.hours || 0,
              rate: rate,
              amount: (project.hours || 0) * rate,
              type: 'charge' // default to charge
            });
          }
        } else {
          // Old format
          const projectName = ts.projectName || ts.project || 'Project';
          const hours = ts.hours || ts.regularHours || 0;
          
          // Try to get billing rate from: 1) timesheet 2) project assignment 3) default to 0
          let rate = ts.billingRate || 0;
          
          // If no rate on timesheet, look up from project assignment
          if (rate === 0) {
            const assignment = projectAssignments.find((a: any) => 
              a.employeeId === ts.employeeId && 
              a.projectName === projectName
            );
            
            if (assignment) {
              rate = assignment.billingRate || assignment.billableRate || assignment.rate || 0;
              console.log(`[InvoiceDetail] Found billing rate from assignment for ${ts.employeeName} on ${projectName}: $${rate}/hr`);
            }
          }
          
          if (rate === 0) {
            missingRates++;
            console.info(`[InvoiceDetail] No billing rate found for ${ts.employeeName} on project ${projectName} - defaulting to $0/hr`);
            console.info(`[InvoiceDetail] Solution: Use Auto-Fix All button or add project assignment in Vendor Management for ${ts.employeeName} on ${projectName}`);
          }
          
          items.push({
            id: crypto.randomUUID(),
            description: `${projectName} - ${ts.employeeName} - Week ending ${new Date(ts.weekEnding).toLocaleDateString()}`,
            hours,
            rate,
            amount: hours * rate,
            type: 'charge' // default to charge
          });
        }
      }
      
      setLineItems(items);
      setPoNumber(firstTimesheet.poNumber || '');
      
      if (missingRates > 0) {
        toast.error(`⚠️ Warning: ${missingRates} timesheet(s) are missing billing rates. Please update the rates before sending.`, {
          duration: 5000
        });
      } else {
        toast.success(`Invoice generated from ${selectedTimesheets.length} timesheet(s)`);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice from timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: any) => {
    setSearchClient(client.name);
    setClientEmail(client.email || '');
    setBillTo(client.billingAddress || `${client.name}\n${client.address || ''}`);
    setShowClientDropdown(false);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: crypto.randomUUID(),
      description: '',
      hours: 0,
      rate: 0,
      amount: 0,
      type: 'charge' // default to charge
    }]);
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'hours' || field === 'rate' || field === 'type') {
          const baseAmount = updated.hours * updated.rate;
          // If it's a credit/deduction, make the amount negative
          updated.amount = updated.type === 'credit' ? -baseAmount : baseAmount;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(item => item.id !== id));
  };

  const handleSave = async (): Promise<string | undefined> => {
    setLoading(true);
    try {
      const invoiceData = {
        id: invoiceId || crypto.randomUUID(),
        invoiceNumber,
        invoiceDate,
        dueDate,
        clientName: searchClient,
        clientEmail,
        billTo,
        poNumber,
        lineItems,
        subtotal,
        taxAmount,
        total,
        notes,
        terms,
        status: 'draft',
        companyInfo: {
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
          website: companyWebsite
        },
        timesheetIds: timesheetIds || []
      };

      const url = invoiceId 
        ? `${API_URL}/invoices/${invoiceId}`
        : `${API_URL}/invoices`;
      
      const method = invoiceId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) throw new Error('Failed to save invoice');

      const savedInvoice = await response.json();
      toast.success('Invoice saved successfully');
      
      // Return the invoice ID for use by handleSend
      return savedInvoice.id || invoiceData.id;
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!clientEmail) {
      toast.error('Please enter client email address');
      return;
    }

    setSending(true);
    try {
      // First save the invoice
      const savedInvoiceId = await handleSave();
      const idToUse = savedInvoiceId || invoiceId;

      if (!idToUse) {
        throw new Error('Invoice ID not found after saving');
      }

      // Then send it using the correct endpoint with invoice ID
      const response = await fetch(`${API_URL}/invoices/${idToUse}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          clientEmail,
          clientName: searchClient
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invoice');
      }

      toast.success(`Invoice sent to ${clientEmail}`);
      setTimeout(() => onBack(), 1500);
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invoice. Invoice has been saved as draft.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const invoiceData = {
        id: invoiceId || crypto.randomUUID(),
        invoiceNumber,
        invoiceDate,
        dueDate,
        clientName: searchClient,
        clientEmail,
        billTo,
        poNumber,
        lineItems,
        subtotal,
        taxAmount,
        total,
        notes,
        terms,
        status: 'submitted',
        companyInfo: {
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
          website: companyWebsite
        },
        timesheetIds: timesheetIds || []
      };

      const url = invoiceId 
        ? `${API_URL}/invoices/${invoiceId}`
        : `${API_URL}/invoices`;
      
      const method = invoiceId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) throw new Error('Failed to submit invoice');

      toast.success('Invoice submitted successfully');
      
      // Refresh the invoice list by going back
      setTimeout(() => onBack(), 800);
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast.error('Failed to submit invoice');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client?.name?.toLowerCase().includes(searchClient?.toLowerCase() || '')
  );

  // Debug logging
  console.log('[InvoiceDetail] Dropdown state:', {
    showClientDropdown,
    totalClients: clients.length,
    filteredClients: filteredClients.length,
    searchClient
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSend} disabled={loading || sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send to Client'}
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gradient-teal-blue text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Submit Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-8">
            {/* Invoice Title */}
            <div className="flex items-start justify-between">
              <h1 className="text-blue-600">Invoice</h1>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-blue-600 font-medium text-2xl">Interon IT</div>
                </div>
              </div>
            </div>

            {/* From Section */}
            <div>
              <h3 className="mb-3">From</h3>
              {editingCompany ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <Label>Company Name</Label>
                    <Input 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea 
                      value={companyAddress} 
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        value={companyPhone} 
                        onChange={(e) => setCompanyPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        value={companyEmail} 
                        onChange={(e) => setCompanyEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input 
                      value={companyWebsite} 
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setEditingCompany(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{companyName}</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                        {companyAddress}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        <div>Phone: {companyPhone}</div>
                        <div>Email: {companyEmail}</div>
                        <div>Website: {companyWebsite}</div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setEditingCompany(true)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Edit Company
                  </Button>
                </div>
              )}
            </div>

            {/* To Section */}
            <div>
              <h3 className="mb-3">Bill To</h3>
              <div className="space-y-4">
                {/* Enhanced Client Search */}
                <div className="relative">
                  <Label className="text-blue-600 font-medium">Search Client</Label>
                  <div className="relative mt-2">
                    <Input
                      placeholder="Search client name or click to view all"
                      value={searchClient}
                      onChange={(e) => {
                        console.log('[InvoiceDetail] Search changed:', e.target.value);
                        setSearchClient(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => {
                        console.log('[InvoiceDetail] Input focused, showing dropdown');
                        setShowClientDropdown(true);
                      }}
                      onBlur={() => {
                        console.log('[InvoiceDetail] Input blurred, hiding dropdown after delay');
                        setTimeout(() => setShowClientDropdown(false), 200);
                      }}
                      className="pr-10 border-2 border-blue-200 focus:border-blue-500 h-12 text-base"
                    />
                    <Search className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  
                  {/* Always show dropdown when showClientDropdown is true */}
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-xl max-h-64 overflow-auto">
                      {/* Loading state */}
                      {clients.length === 0 && (
                        <div className="px-4 py-6 text-center text-slate-500">
                          <div className="font-medium">No clients found</div>
                          <div className="text-sm mt-1">Add clients in the Client Management section</div>
                        </div>
                      )}
                      
                      {/* No results for search */}
                      {clients.length > 0 && filteredClients.length === 0 && searchClient && (
                        <div className="px-4 py-6 text-center text-slate-500">
                          <div className="font-medium">No clients matching "{searchClient}"</div>
                          <div className="text-sm mt-1">Try a different search term</div>
                        </div>
                      )}
                      
                      {/* Show filtered clients */}
                      {filteredClients.length > 0 && filteredClients.map(client => (
                        <div
                          key={client.id}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                          onClick={() => {
                            console.log('[InvoiceDetail] Client selected:', client.name);
                            handleClientSelect(client);
                          }}
                          onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                        >
                          <div className="font-medium text-slate-900">{client.name}</div>
                          {client.email && (
                            <div className="text-sm text-slate-500 mt-0.5">{client.email}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Client Details - shown after selection */}
                {searchClient && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                    <div>
                      <Label>Client Email</Label>
                      <Input
                        type="email"
                        placeholder="client@email.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Bill To Address</Label>
                      <Textarea
                        placeholder="Client billing address"
                        value={billTo}
                        onChange={(e) => setBillTo(e.target.value)}
                        rows={1}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Invoice Details */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>PO Number</Label>
                  <Input
                    placeholder="Optional"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                  />
                </div>
              </div>
              
              {/* DEBUG BUTTON - Remove after testing */}
              {clients.length === 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 ml-2 bg-yellow-50 border-yellow-300"
                  onClick={createTestClient}
                >
                  🔧 Create Test Client (Debug)
                </Button>
              )}
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3>Line Items</h3>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {/* Warning for missing rates */}
              {lineItems.some(item => item.rate === 0) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-red-600 mt-0.5">⚠️</div>
                    <div className="flex-1">
                      <div className="font-medium text-red-900 mb-1">Missing Billing Rates</div>
                      <div className="text-sm text-red-700">
                        Some line items have a rate of $0.00. This likely means the employee doesn't have a project assignment with a billing rate configured. 
                        Please update the rates manually before sending this invoice, or go to Vendor Management to set up the project assignment.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%]">Type</TableHead>
                    <TableHead className="w-[35%]">Description</TableHead>
                    <TableHead className="w-[12%]">Hours</TableHead>
                    <TableHead className="w-[12%]">Rate</TableHead>
                    <TableHead className="w-[18%]">Amount</TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id} className={item.rate === 0 ? "bg-red-50" : item.type === 'credit' ? "bg-green-50" : ""}>
                      <TableCell>
                        <Select 
                          value={item.type || 'charge'} 
                          onValueChange={(value) => updateLineItem(item.id, 'type', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="charge">Charge</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.hours}
                          onChange={(e) => updateLineItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className={item.rate === 0 ? "border-red-300 focus:border-red-500" : ""}
                        />
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${item.type === 'credit' ? 'text-green-600' : ''}`}>
                          {item.type === 'credit' ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                        >
                          ×
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {lineItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No line items. Click "Add Item" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Total:</span>
                  <span className="font-medium text-xl">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Thank you for your business!"
                />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  placeholder="Payment terms..."
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
