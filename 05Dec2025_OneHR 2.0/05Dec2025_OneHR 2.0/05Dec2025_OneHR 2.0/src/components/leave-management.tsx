import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle, 
  Plus, Eye, Search, TrendingUp, TrendingDown
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { LeaveRequest, LeaveType, LeaveStatus, PTOBalance, Employee } from '../types';
import { Progress } from './ui/progress';

const API_URL = API_ENDPOINTS.TIMESHEET;

export function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [ptoBalances, setPtoBalances] = useState<PTOBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [selectedBalance, setSelectedBalance] = useState<PTOBalance | null>(null);

  const [requestForm, setRequestForm] = useState({
    employeeId: '',
    leaveType: 'Vacation' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, balancesRes, empsRes] = await Promise.all([
        fetch(`${API_URL}/leave-requests`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/pto-balances`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setLeaveRequests(data.leaveRequests || []);
      }

      if (balancesRes.ok) {
        const data = await balancesRes.json();
        setPtoBalances(data.balances || []);
      }

      if (empsRes.ok) {
        const data = await empsRes.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.employeeId || !requestForm.startDate || !requestForm.endDate || !requestForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date(requestForm.startDate);
    const endDate = new Date(requestForm.endDate);
    const totalDays = differenceInDays(endDate, startDate) + 1;

    if (totalDays <= 0) {
      toast.error('End date must be after start date');
      return;
    }

    const employee = employees.find(e => e.id === requestForm.employeeId);

    try {
      const response = await fetch(`${API_URL}/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          ...requestForm,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : '',
          totalDays,
          status: 'pending',
          requestedDate: new Date().toISOString(),
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      const data = await response.json();
      setLeaveRequests([...leaveRequests, data.leaveRequest]);
      toast.success('Leave request submitted successfully');
      setShowRequestDialog(false);
      resetRequestForm();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit leave request');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`${API_URL}/leave-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          status: 'approved',
          approvedDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      const data = await response.json();
      setLeaveRequests(leaveRequests.map(r => r.id === requestId ? data.leaveRequest : r));
      toast.success('Leave request approved');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      const response = await fetch(`${API_URL}/leave-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      const data = await response.json();
      setLeaveRequests(leaveRequests.map(r => r.id === requestId ? data.leaveRequest : r));
      toast.success('Leave request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject leave request');
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      employeeId: '',
      leaveType: 'Vacation',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const variants = {
      pending: <Badge className="gap-1 bg-yellow-500"><Clock className="h-3 w-3" /> Pending</Badge>,
      approved: <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>,
      rejected: <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>,
      cancelled: <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Cancelled</Badge>,
    };
    return variants[status];
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Leave & PTO Management</h1>
          <p className="text-muted-foreground">Manage employee leave requests and PTO balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBalanceDialog(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            View PTO Balances
          </Button>
          <Button onClick={() => setShowRequestDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No leave requests found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employeeName}</TableCell>
                    <TableCell>{request.leaveType}</TableCell>
                    <TableCell>{format(new Date(request.startDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(request.endDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{request.totalDays}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowViewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) handleReject(request.id, reason);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
            <DialogDescription id="new-leave-request-dialog-description">
              Submit a new leave request for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select 
                value={requestForm.employeeId} 
                onValueChange={(value) => setRequestForm(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select 
                value={requestForm.leaveType} 
                onValueChange={(value: LeaveType) => setRequestForm(prev => ({ ...prev, leaveType: value }))}
              >
                <SelectTrigger id="leaveType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                  <SelectItem value="Bereavement">Bereavement</SelectItem>
                  <SelectItem value="Jury Duty">Jury Duty</SelectItem>
                  <SelectItem value="Parental Leave">Parental Leave</SelectItem>
                  <SelectItem value="Military Leave">Military Leave</SelectItem>
                  <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                  <SelectItem value="Compensatory Time">Compensatory Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={requestForm.startDate}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={requestForm.endDate}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={requestForm.reason}
                onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for leave..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowRequestDialog(false);
              resetRequestForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest}>
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription id="view-leave-request-dialog-description">
              View complete information about this leave request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Employee</Label>
                <p className="text-sm">{selectedRequest.employeeName}</p>
              </div>
              <div>
                <Label>Leave Type</Label>
                <p className="text-sm">{selectedRequest.leaveType}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p className="text-sm">{format(new Date(selectedRequest.startDate), 'PPP')}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="text-sm">{format(new Date(selectedRequest.endDate), 'PPP')}</p>
                </div>
              </div>
              <div>
                <Label>Total Days</Label>
                <p className="text-sm">{selectedRequest.totalDays}</p>
              </div>
              <div>
                <Label>Reason</Label>
                <p className="text-sm">{selectedRequest.reason}</p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="pt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              {selectedRequest.approvedBy && (
                <div>
                  <Label>Approved By</Label>
                  <p className="text-sm">{selectedRequest.approvedBy} on {format(new Date(selectedRequest.approvedDate!), 'PPP')}</p>
                </div>
              )}
              {selectedRequest.rejectionReason && (
                <div>
                  <Label>Rejection Reason</Label>
                  <p className="text-sm">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PTO Balances Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PTO Balances</DialogTitle>
            <DialogDescription id="pto-balances-dialog-description">View employee PTO balances and utilization</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {ptoBalances.map((balance) => {
              const employee = employees.find(e => e.id === balance.employeeId);
              return (
                <Card key={balance.employeeId}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Vacation Days</Label>
                        <span className="text-sm">
                          {balance.vacationRemaining} / {balance.vacationDays} remaining
                        </span>
                      </div>
                      <Progress value={(balance.vacationUsed / balance.vacationDays) * 100} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Sick Days</Label>
                        <span className="text-sm">
                          {balance.sickRemaining} / {balance.sickDays} remaining
                        </span>
                      </div>
                      <Progress value={(balance.sickUsed / balance.sickDays) * 100} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Personal Days</Label>
                        <span className="text-sm">
                          {balance.personalRemaining} / {balance.personalDays} remaining
                        </span>
                      </div>
                      <Progress value={(balance.personalUsed / balance.personalDays) * 100} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
