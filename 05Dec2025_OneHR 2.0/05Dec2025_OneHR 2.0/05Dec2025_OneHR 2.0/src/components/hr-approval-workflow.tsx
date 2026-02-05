import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, Clock, User, FileText, Mail, Phone, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { Employee } from '../types';

const API_URL = API_ENDPOINTS.EMPL_ONBORDING;

interface HRApprovalWorkflowProps {
  onRefresh?: () => void;
}

export function HRApprovalWorkflow({ onRefresh }: HRApprovalWorkflowProps) {
  const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchPendingEmployees();
  }, []);

  const fetchPendingEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employee?needsHRApproval=true`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching pending employees:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowApprovalDialog(true);
    setReviewNotes('');
  };

  const handleApprove = async () => {
    if (!selectedEmployee) return;

    setApproving(true);
    try {
      const response = await fetch(`${API_URL}/employees/${selectedEmployee.id}/hr-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          approved: true,
          notes: reviewNotes
        })
      });

      if (response.ok) {
        toast.success(`${selectedEmployee.firstName} ${selectedEmployee.lastName} has been approved and can now access the employee portal`);
        setPendingEmployees(pendingEmployees.filter(e => e.id !== selectedEmployee.id));
        setShowApprovalDialog(false);
        setSelectedEmployee(null);
        setReviewNotes('');
        if (onRefresh) onRefresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to approve employee');
      }
    } catch (error) {
      console.error('Error approving employee:', error);
      toast.error('Failed to approve employee');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEmployee) return;
    if (!reviewNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    setApproving(true);
    try {
      const response = await fetch(`${API_URL}/employees/${selectedEmployee.id}/hr-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          approved: false,
          notes: reviewNotes
        })
      });

      if (response.ok) {
        toast.success(`Rejected: ${selectedEmployee.firstName} ${selectedEmployee.lastName}. Recruiter will be notified.`);
        setPendingEmployees(pendingEmployees.filter(e => e.id !== selectedEmployee.id));
        setShowApprovalDialog(false);
        setSelectedEmployee(null);
        setReviewNotes('');
        if (onRefresh) onRefresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to reject employee');
      }
    } catch (error) {
      console.error('Error rejecting employee:', error);
      toast.error('Failed to reject employee');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading pending approvals...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingEmployees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Pending HR Approvals
          </CardTitle>
          <CardDescription>All employee submissions have been reviewed</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              No employees pending HR approval at this time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Pending HR Approvals
            <Badge variant="destructive" className="ml-auto">{pendingEmployees.length}</Badge>
          </CardTitle>
          <CardDescription>
            Review and approve recruiter submissions before granting employee portal access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingEmployees.map((employee) => (
              <Card key={employee.id} className="border-orange-200 bg-orange-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                          {employee.position && (
                            <div className="text-sm text-gray-500">{employee.position}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 ml-8">
                        {employee.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{employee.email}</span>
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{employee.phone}</span>
                          </div>
                        )}
                        {employee.visaStatus && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Visa: {employee.visaStatus}</span>
                          </div>
                        )}
                        {employee.startDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Start: {employee.startDate}</span>
                          </div>
                        )}
                      </div>

                      {employee.createdBy && (
                        <div className="ml-8 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Submitted by: {employee.createdByRole || 'Recruiter'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Button onClick={() => openApprovalDialog(employee)} size="sm">
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>HR Review: {selectedEmployee?.firstName} {selectedEmployee?.lastName}</DialogTitle>
            <DialogDescription>
              Review employee information submitted by the recruiter
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Information Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-500">Full Name</Label>
                  <div>{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <div>{selectedEmployee.email}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <div>{selectedEmployee.phone || 'Not provided'}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Position</Label>
                  <div>{selectedEmployee.position || 'Not specified'}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Department</Label>
                  <div>{selectedEmployee.department || 'Not specified'}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Start Date</Label>
                  <div>{selectedEmployee.startDate || 'Not set'}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Visa Status</Label>
                  <div>{selectedEmployee.visaStatus || 'Not specified'}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Employment Type</Label>
                  <div>{selectedEmployee.employmentType || 'full-time'}</div>
                </div>
              </div>

              {/* Review Notes */}
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional for approval, Required for rejection)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Enter any notes about this employee... (e.g., 'All information verified', 'Need to update department', etc.)"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* What Happens Next */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>After Approval:</strong> Employee will receive an email invitation to complete their profile 
                  (SSN, Date of Birth, Address, Emergency Contacts) and gain access to the employee portal.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowApprovalDialog(false)}
              disabled={approving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={approving}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={approving}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve & Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
