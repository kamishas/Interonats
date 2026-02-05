import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { 
  UserX, Plus, Eye, Search, CheckCircle2, Clock, AlertCircle,
  Package, Key, CreditCard, FileText, Shield, Pencil, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { API_ENDPOINTS, getAccessToken } from '../lib/constants';
import type { OffboardingRecord, OffboardingReason, OffboardingStatus, OffboardingTask, AssetReturnItem, Employee } from '../types';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const API_URL = API_ENDPOINTS.OFFBOARDING;

export function Offboarding() {
  const [offboardingRecords, setOffboardingRecords] = useState<OffboardingRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OffboardingRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<OffboardingRecord | null>(null);

  const [createForm, setCreateForm] = useState({
    employeeId: '',
    lastWorkingDate: '',
    offboardingReason: 'Resignation' as OffboardingReason,
    reasonDetails: '',
    initiatedBy: '',
  });

  const [editForm, setEditForm] = useState({
    lastWorkingDate: '',
    offboardingReason: 'Resignation' as OffboardingReason,
    reasonDetails: '',
    status: 'initiated' as OffboardingStatus,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, empsRes] = await Promise.all([
        fetch(`${API_URL}/offboarding`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` }
        })
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setOffboardingRecords(data.offboardingRecords || []);
      }

      if (empsRes.ok) {
        const data = await empsRes.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load offboarding data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.employeeId || !createForm.lastWorkingDate || !createForm.initiatedBy) {
      toast.error('Please fill in all required fields');
      return;
    }

    const employee = employees.find(e => e.id === createForm.employeeId);
    if (!employee) {
      toast.error('Employee not found');
      return;
    }

    try {
      const defaultTasks: OffboardingTask[] = [
        { id: crypto.randomUUID(), taskName: 'Schedule exit interview', department: 'HR', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Collect company equipment', department: 'IT', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Revoke system access', department: 'IT', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Collect badge and keys', department: 'HR', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Process final paycheck', department: 'Accounting', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Calculate unused PTO payout', department: 'Accounting', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Benefits termination', department: 'HR', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Update organizational chart', department: 'HR', status: 'pending' },
        { id: crypto.randomUUID(), taskName: 'Final approval', department: 'Manager', status: 'pending' },
      ];

      const defaultAssets: AssetReturnItem[] = [
        { id: crypto.randomUUID(), assetName: 'Laptop', assetType: 'Equipment', assignedDate: employee.startDate, notes: '' },
        { id: crypto.randomUUID(), assetName: 'Mobile Phone', assetType: 'Equipment', assignedDate: employee.startDate, notes: '' },
        { id: crypto.randomUUID(), assetName: 'Badge', assetType: 'Access', assignedDate: employee.startDate, notes: '' },
        { id: crypto.randomUUID(), assetName: 'Office Keys', assetType: 'Access', assignedDate: employee.startDate, notes: '' },
      ];

      const response = await fetch(`${API_URL}/offboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          ...createForm,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          position: employee.position,
          tasks: defaultTasks,
          assetsToReturn: defaultAssets,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create offboarding record');
      }

      const data = await response.json();
      setOffboardingRecords([...offboardingRecords, data.offboardingRecord]);
      toast.success('Offboarding initiated successfully');
      setShowCreateDialog(false);
      resetCreateForm();
    } catch (error) {
      console.error('Error creating offboarding record:', error);
      toast.error('Failed to initiate offboarding');
    }
  };

  const handleUpdateTask = async (recordId: string, taskId: string, status: 'pending' | 'in-progress' | 'completed' | 'blocked') => {
    const record = offboardingRecords.find(r => r.id === recordId);
    if (!record) return;

    const updatedTasks = record.tasks.map(task => 
      task.id === taskId 
        ? { ...task, status, completedDate: status === 'completed' ? new Date().toISOString() : task.completedDate }
        : task
    );

    try {
      const response = await fetch(`${API_URL}/offboarding/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify({
          tasks: updatedTasks,
          status: updatedTasks.every(t => t.status === 'completed') ? 'completed' : 'in-progress'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const data = await response.json();
      setOffboardingRecords(offboardingRecords.map(r => r.id === recordId ? data.offboardingRecord : r));
      toast.success('Task updated');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleUpdateApproval = async (recordId: string, approvalType: 'hr' | 'manager' | 'it', approved: boolean) => {
    const record = offboardingRecords.find(r => r.id === recordId);
    if (!record) return;

    const updates: any = {};
    const now = new Date().toISOString();

    if (approvalType === 'hr') {
      updates.hrApproval = approved;
      updates.hrApprovedDate = approved ? now : undefined;
      updates.hrApprovedBy = approved ? 'HR Manager' : undefined;
    } else if (approvalType === 'manager') {
      updates.managerApproval = approved;
      updates.managerApprovedDate = approved ? now : undefined;
      updates.managerApprovedBy = approved ? 'Manager' : undefined;
    } else if (approvalType === 'it') {
      updates.itApproval = approved;
      updates.itApprovedDate = approved ? now : undefined;
      updates.itApprovedBy = approved ? 'IT Admin' : undefined;
    }

    try {
      const response = await fetch(`${API_URL}/offboarding/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update approval');
      }

      const data = await response.json();
      setOffboardingRecords(offboardingRecords.map(r => r.id === recordId ? data.offboardingRecord : r));
      toast.success('Approval updated');
    } catch (error) {
      console.error('Error updating approval:', error);
      toast.error('Failed to update approval');
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      employeeId: '',
      lastWorkingDate: '',
      offboardingReason: 'Resignation',
      reasonDetails: '',
      initiatedBy: '',
    });
  };

  const handleEdit = async () => {
    if (!selectedRecord) return;

    try {
      const response = await fetch(`${API_URL}/offboarding/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update offboarding record');
      }

      const data = await response.json();
      setOffboardingRecords(offboardingRecords.map(r => r.id === selectedRecord.id ? data.offboardingRecord : r));
      toast.success('Offboarding record updated successfully');
      setShowEditDialog(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error updating offboarding record:', error);
      toast.error('Failed to update offboarding record');
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;

    try {
      const response = await fetch(`${API_URL}/offboarding/${recordToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessToken() ?? ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete offboarding record');
      }

      setOffboardingRecords(offboardingRecords.filter(r => r.id !== recordToDelete.id));
      toast.success('Offboarding record deleted successfully');
      setShowDeleteDialog(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting offboarding record:', error);
      toast.error('Failed to delete offboarding record');
    }
  };

  const openEditDialog = (record: OffboardingRecord) => {
    setSelectedRecord(record);
    setEditForm({
      lastWorkingDate: record.lastWorkingDate,
      offboardingReason: record.offboardingReason,
      reasonDetails: record.reasonDetails || '',
      status: record.status,
    });
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: OffboardingStatus) => {
    const variants = {
      initiated: <Badge className="gap-1 bg-blue-500"><Clock className="h-3 w-3" /> Initiated</Badge>,
      'in-progress': <Badge className="gap-1 bg-yellow-500"><AlertCircle className="h-3 w-3" /> In Progress</Badge>,
      completed: <Badge className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>,
      cancelled: <Badge variant="secondary"><AlertCircle className="h-3 w-3" /> Cancelled</Badge>,
    };
    return variants[status];
  };

  const calculateProgress = (record: OffboardingRecord): number => {
    const completedTasks = record.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / record.tasks.length) * 100);
  };

  const filteredRecords = offboardingRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: offboardingRecords.length,
    initiated: offboardingRecords.filter(r => r.status === 'initiated').length,
    inProgress: offboardingRecords.filter(r => r.status === 'in-progress').length,
    completed: offboardingRecords.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Employee Offboarding</h1>
          <p className="text-muted-foreground">Manage employee exit process and asset returns</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Initiate Offboarding
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Offboarding</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Initiated</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.initiated}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
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
                placeholder="Search offboarding records..."
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
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offboarding Records Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Last Working Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Progress</TableHead>
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
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No offboarding records found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{record.position}</div>
                      </div>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{format(new Date(record.lastWorkingDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{record.offboardingReason}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={calculateProgress(record)} className="h-2" />
                        <span className="text-xs text-muted-foreground">{calculateProgress(record)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(record)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Record</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRecordToDelete(record);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Record</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Offboarding Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Offboarding</DialogTitle>
            <DialogDescription id="create-offboarding-dialog-description">Start the offboarding process for an employee</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select 
                value={createForm.employeeId} 
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastWorkingDate">Last Working Date *</Label>
              <Input
                id="lastWorkingDate"
                type="date"
                value={createForm.lastWorkingDate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, lastWorkingDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Offboarding Reason *</Label>
              <Select 
                value={createForm.offboardingReason} 
                onValueChange={(value: OffboardingReason) => setCreateForm(prev => ({ ...prev, offboardingReason: value }))}
              >
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resignation">Resignation</SelectItem>
                  <SelectItem value="Termination">Termination</SelectItem>
                  <SelectItem value="Retirement">Retirement</SelectItem>
                  <SelectItem value="End of Contract">End of Contract</SelectItem>
                  <SelectItem value="Layoff">Layoff</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasonDetails">Additional Details</Label>
              <Textarea
                id="reasonDetails"
                value={createForm.reasonDetails}
                onChange={(e) => setCreateForm(prev => ({ ...prev, reasonDetails: e.target.value }))}
                placeholder="Provide additional context..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initiatedBy">Initiated By *</Label>
              <Input
                id="initiatedBy"
                value={createForm.initiatedBy}
                onChange={(e) => setCreateForm(prev => ({ ...prev, initiatedBy: e.target.value }))}
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetCreateForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Initiate Offboarding
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offboarding Details - {selectedRecord?.employeeName}</DialogTitle>
            <DialogDescription id="offboarding-detail-dialog-description">
              Track offboarding progress and complete required tasks
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* Employee Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employee Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm">{selectedRecord.employeeName}</p>
                  </div>
                  <div>
                    <Label>Position</Label>
                    <p className="text-sm">{selectedRecord.position}</p>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <p className="text-sm">{selectedRecord.department}</p>
                  </div>
                  <div>
                    <Label>Last Working Date</Label>
                    <p className="text-sm">{format(new Date(selectedRecord.lastWorkingDate), 'PPP')}</p>
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <p className="text-sm">{selectedRecord.offboardingReason}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="pt-1">{getStatusBadge(selectedRecord.status)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasks ({selectedRecord.tasks.filter(t => t.status === 'completed').length}/{selectedRecord.tasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedRecord.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={(checked) => {
                              handleUpdateTask(selectedRecord.id, task.id, checked ? 'completed' : 'pending');
                            }}
                          />
                          <div>
                            <p className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                              {task.taskName}
                            </p>
                            <p className="text-xs text-muted-foreground">{task.department}</p>
                          </div>
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Asset Returns */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assets to Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedRecord.assetsToReturn.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{asset.assetName}</p>
                            <p className="text-xs text-muted-foreground">{asset.assetType}</p>
                          </div>
                        </div>
                        <Badge variant={asset.returnedDate ? 'default' : 'secondary'}>
                          {asset.returnedDate ? 'Returned' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Approvals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Department Approvals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span>HR Approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRecord.hrApproval ? (
                        <Badge className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateApproval(selectedRecord.id, 'hr', true)}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span>Manager Approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRecord.managerApproval ? (
                        <Badge className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateApproval(selectedRecord.id, 'manager', true)}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span>IT Approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRecord.itApproval ? (
                        <Badge className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateApproval(selectedRecord.id, 'it', true)}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Offboarding Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Offboarding Record</DialogTitle>
            <DialogDescription id="edit-offboarding-dialog-description">
              Update offboarding details for {selectedRecord?.employeeName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-lastWorkingDate">Last Working Date *</Label>
              <Input
                id="edit-lastWorkingDate"
                type="date"
                value={editForm.lastWorkingDate}
                onChange={(e) => setEditForm(prev => ({ ...prev, lastWorkingDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reason">Offboarding Reason *</Label>
              <Select 
                value={editForm.offboardingReason} 
                onValueChange={(value: OffboardingReason) => setEditForm(prev => ({ ...prev, offboardingReason: value }))}
              >
                <SelectTrigger id="edit-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resignation">Resignation</SelectItem>
                  <SelectItem value="Termination">Termination</SelectItem>
                  <SelectItem value="Retirement">Retirement</SelectItem>
                  <SelectItem value="End of Contract">End of Contract</SelectItem>
                  <SelectItem value="Layoff">Layoff</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editForm.status} 
                onValueChange={(value: OffboardingStatus) => setEditForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initiated">Initiated</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reasonDetails">Additional Details</Label>
              <Textarea
                id="edit-reasonDetails"
                value={editForm.reasonDetails}
                onChange={(e) => setEditForm(prev => ({ ...prev, reasonDetails: e.target.value }))}
                placeholder="Provide additional context..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setSelectedRecord(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offboarding Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the offboarding record for <span className="font-medium">{recordToDelete?.employeeName}</span>? This action cannot be undone and will permanently remove all associated tasks, asset returns, and approval records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
