import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  FileText, Plus, Calendar as CalendarIcon, AlertCircle, 
  CheckCircle2, Clock, XCircle, Trash2, User, FileWarning
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './ui/utils';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../lib/auth-context';
import type { DocumentRequest } from '../types';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

interface ImmigrationDocumentRequestsProps {
  onRequestCreated?: () => void;
}

export function ImmigrationDocumentRequests({ onRequestCreated }: ImmigrationDocumentRequestsProps) {
  const { user } = useAuth();
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();

  const [requestForm, setRequestForm] = useState({
    employeeId: '',
    documentType: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchDocumentRequests();
    fetchEmployees();
  }, []);

  const fetchDocumentRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/document-requests`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentRequests(data.documentRequests || []);
      }
    } catch (error) {
      console.error('Error fetching document requests:', error);
      toast.error('Failed to load document requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!requestForm.employeeId || !requestForm.documentType || !requestForm.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const requestData = {
        ...requestForm,
        dueDate: dueDate?.toISOString(),
        requestedBy: user?.email || '',
        requestedByName: user?.name || 'Immigration Team',
      };

      const response = await fetch(`${API_URL}/document-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to create document request');
      }

      const data = await response.json();
      setDocumentRequests([data.documentRequest, ...documentRequests]);
      
      toast.success('Document request sent to employee');
      setShowRequestDialog(false);
      resetForm();
      
      if (onRequestCreated) {
        onRequestCreated();
      }
    } catch (error: any) {
      console.error('Error creating document request:', error);
      toast.error(error.message || 'Failed to create document request');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${API_URL}/document-requests/${requestId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel request');
      }

      const data = await response.json();
      setDocumentRequests(documentRequests.map(r => 
        r.id === requestId ? data.documentRequest : r
      ));
      
      toast.success('Document request cancelled');
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error(error.message || 'Failed to cancel request');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${API_URL}/document-requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      setDocumentRequests(documentRequests.filter(r => r.id !== requestId));
      toast.success('Document request deleted');
    } catch (error: any) {
      console.error('Error deleting request:', error);
      toast.error(error.message || 'Failed to delete request');
    }
  };

  const resetForm = () => {
    setRequestForm({
      employeeId: '',
      documentType: '',
      description: '',
      notes: '',
    });
    setDueDate(undefined);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'uploaded':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Uploaded</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = documentRequests.filter(r => r.status === 'pending');
  const uploadedRequests = documentRequests.filter(r => r.status === 'uploaded');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Immigration Document Requests</h3>
          <p className="text-sm text-muted-foreground">
            Request specific documents from employees for immigration processing
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting employee upload</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploaded</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploadedRequests.length}</div>
            <p className="text-xs text-muted-foreground">Documents received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentRequests.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Requests</CardTitle>
          <CardDescription>
            Track all immigration document requests sent to employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : documentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No document requests yet</p>
              <p className="text-sm mt-1">Create your first request to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {request.documentType}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{request.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(request.requestedDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {request.dueDate ? (
                        <div className={cn(
                          "flex items-center gap-1",
                          new Date(request.dueDate) < new Date() && request.status === 'pending' 
                            ? "text-red-600" 
                            : ""
                        )}>
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(request.dueDate), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {request.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelRequest(request.id)}
                            title="Cancel request"
                          >
                            <XCircle className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRequest(request.id)}
                          title="Delete request"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Immigration Document</DialogTitle>
            <DialogDescription>
              Request a specific document from an employee for immigration processing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">
                Employee <span className="text-red-500">*</span>
              </Label>
              <Select
                value={requestForm.employeeId}
                onValueChange={(value) => setRequestForm({ ...requestForm, employeeId: value })}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={requestForm.documentType}
                onValueChange={(value) => setRequestForm({ ...requestForm, documentType: value })}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="I-94">I-94 Arrival/Departure Record</SelectItem>
                  <SelectItem value="EAD">Employment Authorization Document (EAD)</SelectItem>
                  <SelectItem value="I-797">I-797 Approval Notice</SelectItem>
                  <SelectItem value="Labor Condition Application (LCA)">Labor Condition Application (LCA)</SelectItem>
                  <SelectItem value="Birth Certificate">Birth Certificate</SelectItem>
                  <SelectItem value="Marriage Certificate">Marriage Certificate</SelectItem>
                  <SelectItem value="Educational Credentials">Educational Credentials</SelectItem>
                  <SelectItem value="Resume/CV">Resume/CV</SelectItem>
                  <SelectItem value="W-2">W-2 Tax Form</SelectItem>
                  <SelectItem value="Pay Stubs">Pay Stubs</SelectItem>
                  <SelectItem value="Offer Letter">Offer Letter</SelectItem>
                  <SelectItem value="Green Card">Green Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                placeholder="Explain why this document is needed and any specific requirements..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a due date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={requestForm.notes}
                onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                placeholder="Add any internal notes about this request..."
                rows={2}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">The employee will receive:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>An in-app notification</li>
                    <li>The request will appear on their employee portal</li>
                    <li>They can upload the document directly from their portal</li>
                    <li>You'll be notified when they upload it</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

