import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Plus,
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import type { ProjectAssignment, ProjectStatus, Client } from "../types";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

interface EmployeeProjectViewProps {
  employeeId: string;
  employeeName: string;
}

export function EmployeeProjectView({ employeeId, employeeName }: EmployeeProjectViewProps) {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ProjectAssignment | null>(null);

  const [formData, setFormData] = useState({
    projectName: "",
    clientId: "",
    role: "",
    startDate: "",
    endDate: "",
    status: "active" as ProjectStatus,
    billableRate: "",
    currency: "USD" as "USD" | "EUR" | "GBP",
    billingCycle: "hourly" as "hourly" | "daily" | "weekly" | "monthly" | "fixed",
    purchaseOrderNumber: "",
    hoursPerWeek: "",
    allocation: "100",
    location: "remote" as "onsite" | "remote" | "hybrid",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/project-assignments/employee/${employeeId}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` }
        }),
        fetch(`${API_URL}/clients`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` }
        })
      ]);

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data.assignments || []);
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load project assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!formData.projectName || !formData.clientId || !formData.role || !formData.startDate || !formData.billableRate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const client = clients.find(c => c.id === formData.clientId);

    const newAssignment: ProjectAssignment = {
      id: Date.now().toString(),
      projectName: formData.projectName,
      clientId: formData.clientId,
      clientName: client?.companyName || "",
      employeeId: employeeId,
      employeeName: employeeName,
      role: formData.role,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      status: formData.status,
      billableRate: parseFloat(formData.billableRate),
      currency: formData.currency,
      billingCycle: formData.billingCycle,
      purchaseOrderNumber: formData.purchaseOrderNumber || undefined,
      hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek) : undefined,
      allocation: parseInt(formData.allocation),
      location: formData.location,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
      notes: formData.notes || undefined
    };

    try {
      const response = await fetch(`${API_URL}/project-assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(newAssignment)
      });

      if (response.ok) {
        setAssignments([...assignments, newAssignment]);
        setShowAddDialog(false);
        resetForm();
        toast.success("Project assignment created successfully");
      } else {
        throw new Error("Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create project assignment");
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    const client = clients.find(c => c.id === formData.clientId);

    const updatedAssignment: ProjectAssignment = {
      ...editingAssignment,
      projectName: formData.projectName,
      clientId: formData.clientId,
      clientName: client?.companyName || "",
      role: formData.role,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      status: formData.status,
      billableRate: parseFloat(formData.billableRate),
      currency: formData.currency,
      billingCycle: formData.billingCycle,
      purchaseOrderNumber: formData.purchaseOrderNumber || undefined,
      hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek) : undefined,
      allocation: parseInt(formData.allocation),
      location: formData.location,
      lastUpdated: new Date().toISOString(),
      notes: formData.notes || undefined
    };

    try {
      const response = await fetch(`${API_URL}/project-assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(updatedAssignment)
      });

      if (response.ok) {
        setAssignments(assignments.map(a => a.id === editingAssignment.id ? updatedAssignment : a));
        setShowEditDialog(false);
        setEditingAssignment(null);
        resetForm();
        toast.success("Project assignment updated successfully");
      } else {
        throw new Error("Failed to update assignment");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update project assignment");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to remove this project assignment?")) return;

    try {
      const response = await fetch(`${API_URL}/project-assignments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== id));
        toast.success("Project assignment removed");
      } else {
        throw new Error("Failed to delete assignment");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to remove project assignment");
    }
  };

  const openEditDialog = (assignment: ProjectAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      projectName: assignment.projectName,
      clientId: assignment.clientId,
      role: assignment.role,
      startDate: assignment.startDate,
      endDate: assignment.endDate || "",
      status: assignment.status,
      billableRate: assignment.billableRate.toString(),
      currency: assignment.currency,
      billingCycle: assignment.billingCycle,
      purchaseOrderNumber: assignment.purchaseOrderNumber || "",
      hoursPerWeek: assignment.hoursPerWeek?.toString() || "",
      allocation: assignment.allocation.toString(),
      location: assignment.location,
      notes: assignment.notes || ""
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      projectName: "",
      clientId: "",
      role: "",
      startDate: "",
      endDate: "",
      status: "active",
      billableRate: "",
      currency: "USD",
      billingCycle: "hourly",
      purchaseOrderNumber: "",
      hoursPerWeek: "",
      allocation: "100",
      location: "remote",
      notes: ""
    });
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const colors: Record<ProjectStatus, string> = {
      planning: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      "on-hold": "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800"
    };

    const icons: Record<ProjectStatus, any> = {
      planning: Clock,
      active: CheckCircle2,
      "on-hold": Pause,
      completed: CheckCircle2,
      cancelled: XCircle
    };

    const Icon = icons[status];

    return (
      <Badge className={colors[status]}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const activeAssignments = assignments.filter(a => a.status === "active");
  const totalAllocation = activeAssignments.reduce((sum, a) => sum + a.allocation, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Project Assignments
            </CardTitle>
            <CardDescription className="mt-1">
              Client projects and allocations for {employeeName}
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {totalAllocation > 100 && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Warning: Total active allocation is {totalAllocation}% (exceeds 100%)
            </AlertDescription>
          </Alert>
        )}

        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground mb-4">No project assignments yet</p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Assign First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Projects */}
            {activeAssignments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Active Projects ({activeAssignments.length})</h4>
                <div className="space-y-2">
                  {activeAssignments.map(assignment => (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{assignment.projectName}</span>
                            {getStatusBadge(assignment.status)}
                            <Badge variant="outline">{assignment.allocation}%</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {assignment.clientName}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {assignment.billableRate}/{assignment.billingCycle.charAt(0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(assignment.startDate), "MMM dd, yyyy")}
                              </span>
                            </div>
                            <div>{assignment.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Projects */}
            {assignments.filter(a => a.status !== "active").length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Other Projects ({assignments.filter(a => a.status !== "active").length})
                </h4>
                <div className="space-y-2">
                  {assignments
                    .filter(a => a.status !== "active")
                    .map(assignment => (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-3 hover:bg-slate-50 transition-colors opacity-60"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{assignment.projectName}</span>
                              {getStatusBadge(assignment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {assignment.clientName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(assignment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={open => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setEditingAssignment(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? "Edit Project Assignment" : "Add Project Assignment"}
            </DialogTitle>
            <DialogDescription id="employee-project-description">
              {editingAssignment
                ? "Update the project assignment details"
                : `Assign ${employeeName} to a client project`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Website Redesign"
                />
              </div>

              <div>
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={value => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                placeholder="Senior Developer"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProjectStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="billableRate">Billable Rate *</Label>
                <Input
                  id="billableRate"
                  type="number"
                  value={formData.billableRate}
                  onChange={e => setFormData({ ...formData, billableRate: e.target.value })}
                  placeholder="75"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value: any) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value: any) => setFormData({ ...formData, billingCycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="allocation">Allocation % *</Label>
                <Input
                  id="allocation"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.allocation}
                  onChange={e => setFormData({ ...formData, allocation: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="hoursPerWeek">Hours/Week</Label>
                <Input
                  id="hoursPerWeek"
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={e => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                  placeholder="40"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value: any) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="purchaseOrderNumber">Purchase Order Number</Label>
              <Input
                id="purchaseOrderNumber"
                value={formData.purchaseOrderNumber}
                onChange={e =>
                  setFormData({ ...formData, purchaseOrderNumber: e.target.value })
                }
                placeholder="PO-2024-001"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional project details..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                setEditingAssignment(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingAssignment ? handleUpdateAssignment : handleAddAssignment}>
              {editingAssignment ? "Update Assignment" : "Create Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
