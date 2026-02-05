import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle, 
  Plus, Eye, TrendingUp, History
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { LeaveRequest, LeaveType, PTOBalance, Employee } from '../types';
import { Progress } from './ui/progress';

const API_URL = API_ENDPOINTS.TIMESHEET;

interface EmployeeLeaveProps {
  employeeData: Employee;
}

export function EmployeeLeave({ employeeData }: EmployeeLeaveProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [ptoBalance, setPtoBalance] = useState<PTOBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const [requestForm, setRequestForm] = useState({
    leaveType: 'Vacation' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    if (employeeData.id) {
      fetchData();
    }
  }, [employeeData.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const [requestsRes, balancesRes] = await Promise.all([
        fetch(`${API_URL}/leave-requests`, {
          headers: { 'Authorization': `Bearer ${token ?? ''}` }
        }),
        fetch(`${API_URL}/pto-balances`, {
          headers: { 'Authorization': `Bearer ${token ?? ''}` }
        }),
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setLeaveRequests(data.leaveRequests || []);
      }

      if (balancesRes.ok) {
        const data = await balancesRes.json();
        // The API returns { balances: [...] }, find the balance for this employee
        const balances = data.balances || [];
        const myBalance = balances.find((b: any) => b.employeeId === employeeData.id);
        if (myBalance) {
          // Convert snake_case or whatever format to PTOBalance type
          setPtoBalance({
            employeeId: myBalance.employeeId,
            vacationDays: myBalance.vacationDays,
            vacationUsed: myBalance.vacationUsed,
            vacationRemaining: myBalance.vacationRemaining,
            sickDays: myBalance.sickDays,
            sickUsed: myBalance.sickUsed,
            sickRemaining: myBalance.sickRemaining,
            personalDays: myBalance.personalDays,
            personalUsed: myBalance.personalUsed,
            personalRemaining: myBalance.personalRemaining,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.startDate || !requestForm.endDate || !requestForm.reason) {
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

    try {
      const response = await fetch(`${API_URL}/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          employee_id: employeeData.id,
          leave_type: requestForm.leaveType,
          start_date: requestForm.startDate,
          end_date: requestForm.endDate,
          reason: requestForm.reason,
        }),
      });

      if (response.ok) {
        toast.success('Leave request submitted successfully');
        setShowRequestDialog(false);
        setRequestForm({
          leaveType: 'Vacation',
          startDate: '',
          endDate: '',
          reason: '',
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* PTO Balance Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vacation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold">{ptoBalance?.vacationRemaining || 0}</div>
                <p className="text-xs text-muted-foreground">Days remaining</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{ptoBalance?.vacationDays || 15}</div>
                <p className="text-xs text-muted-foreground">Total annual</p>
              </div>
            </div>
            <Progress 
              value={ptoBalance && ptoBalance.vacationDays > 0 ? (ptoBalance.vacationRemaining / ptoBalance.vacationDays) * 100 : 0} 
              className="mt-4"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Plus className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold">{ptoBalance?.sickRemaining || 0}</div>
                <p className="text-xs text-muted-foreground">Days remaining</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{ptoBalance?.sickDays || 5}</div>
                <p className="text-xs text-muted-foreground">Total annual</p>
              </div>
            </div>
            <Progress 
              value={ptoBalance && ptoBalance.sickDays > 0 ? (ptoBalance.sickRemaining / ptoBalance.sickDays) * 100 : 0} 
              className="mt-4"
              variant="warning"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold">{ptoBalance?.personalRemaining || 0}</div>
                <p className="text-xs text-muted-foreground">Days remaining</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{ptoBalance?.personalDays || 2}</div>
                <p className="text-xs text-muted-foreground">Total annual</p>
              </div>
            </div>
            <Progress 
              value={ptoBalance && ptoBalance.personalDays > 0 ? (ptoBalance.personalRemaining / ptoBalance.personalDays) * 100 : 0} 
              className="mt-4"
              variant="info"
            />
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Your Leave Requests
            </CardTitle>
            <CardDescription>View and track your time off requests</CardDescription>
          </div>
          <Button onClick={() => setShowRequestDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.leaveType}</TableCell>
                    <TableCell>
                      {format(new Date(request.startDate), 'MMM d, yyyy')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{request.totalDays}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Apply for Leave Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a new time off request for approval.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select 
                value={requestForm.leaveType} 
                onValueChange={(value) => setRequestForm({...requestForm, leaveType: value as LeaveType})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                  <SelectItem value="Bereavement">Bereavement</SelectItem>
                  <SelectItem value="Jury Duty">Jury Duty</SelectItem>
                  <SelectItem value="Parental Leave">Parental Leave</SelectItem>
                  <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  value={requestForm.startDate}
                  onChange={(e) => setRequestForm({...requestForm, startDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  value={requestForm.endDate}
                  onChange={(e) => setRequestForm({...requestForm, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea 
                id="reason" 
                placeholder="Brief description of your leave request" 
                value={requestForm.reason}
                onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="mt-1 font-medium">{selectedRequest.leaveType}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <div className="mt-1">{format(new Date(selectedRequest.startDate), 'PPP')}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <div className="mt-1">{format(new Date(selectedRequest.endDate), 'PPP')}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Days</Label>
                <div className="mt-1 font-semibold">{selectedRequest.totalDays} days</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm italic">
                  "{selectedRequest.reason}"
                </div>
              </div>
              {selectedRequest.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                  <Label className="text-red-800 font-semibold mb-1 block">Rejection Reason</Label>
                  <p className="text-sm text-red-700">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
