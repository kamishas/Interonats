import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Textarea } from "./ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import type { ProjectAssignment, ProjectStatus, Employee, Client } from "../types";

const API_URL = API_ENDPOINTS.CLIENT;

export function ProjectAssignments() {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ProjectAssignment | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    projectName: "",
    clientId: "",
    employeeId: "",
    vendorId: "",
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, employeesRes, clientsRes, vendorsRes] = await Promise.all([
        fetch(`${API_URL}/project-assignments`, {
          headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/employees`, {
          headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/clients`, {
          headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` }
        }),
        fetch(`${API_URL}/vendors`, {
          headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` }
        })
      ]);

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data.assignments || []);
      }
      
      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data.employees || []);
      }
      
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }
      
      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!formData.projectName || !formData.clientId || !formData.employeeId || !formData.role || !formData.startDate || !formData.billableRate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const employee = employees.find(e => e.id === formData.employeeId);
    const client = clients.find(c => c.id === formData.clientId);
    const vendor = vendors.find(v => v.id === formData.vendorId);

    const newAssignment: ProjectAssignment = {
      id: Date.now().toString(),
      projectName: formData.projectName,
      clientId: formData.clientId,
      clientName: client?.companyName || "",
      employeeId: formData.employeeId,
      employeeName: `${employee?.firstName} ${employee?.lastName}`,
      vendorId: (formData.vendorId && formData.vendorId !== "none") ? formData.vendorId : "",
      vendorName: vendor?.companyName || vendor?.legalName || "",
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
      createdBy: "Admin", // Replace with actual user
      notes: formData.notes || undefined
    };

    try {
      const response = await fetch(`${API_URL}/project-assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken() ?? ''}`
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

    const employee = employees.find(e => e.id === formData.employeeId);
    const client = clients.find(c => c.id === formData.clientId);
    const vendor = vendors.find(v => v.id === formData.vendorId);

    const updatedAssignment: ProjectAssignment = {
      ...editingAssignment,
      projectName: formData.projectName,
      clientId: formData.clientId,
      clientName: client?.companyName || "",
      employeeId: formData.employeeId,
      employeeName: `${employee?.firstName} ${employee?.lastName}`,
      vendorId: (formData.vendorId && formData.vendorId !== "none") ? formData.vendorId : "",
      vendorName: vendor?.companyName || vendor?.legalName || "",
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
          Authorization: `Bearer ${getAccessToken() ?? ''}`
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
    if (!confirm("Are you sure you want to delete this project assignment?")) return;

    try {
      const response = await fetch(`${API_URL}/project-assignments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` }
      });

      if (response.ok) {
        setAssignments(assignments.filter(a => a.id !== id));
        toast.success("Project assignment deleted");
      } else {
        throw new Error("Failed to delete assignment");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete project assignment");
    }
  };

  const openEditDialog = (assignment: ProjectAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      projectName: assignment.projectName,
      clientId: assignment.clientId,
      employeeId: assignment.employeeId,
      vendorId: assignment.vendorId || "",
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
      employeeId: "",
      vendorId: "",
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

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;
    const matchesClient = filterClient === "all" || assignment.clientId === filterClient;
    const matchesTab = activeTab === "all" || assignment.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesClient && matchesTab;
  });

  // Calculate stats
  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === "active").length,
    planning: assignments.filter(a => a.status === "planning").length,
    onHold: assignments.filter(a => a.status === "on-hold").length,
    completed: assignments.filter(a => a.status === "completed").length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Project Assignments</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee assignments to client projects
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Planning</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.planning}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">On Hold</CardTitle>
            <Pause className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.onHold}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="on-hold">On Hold</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects, employees, clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || filterStatus !== "all" || filterClient !== "all") && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredAssignments.length} result{filteredAssignments.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                      setFilterClient("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignments Table */}
          <Card>
            <CardContent className="p-0">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {assignments.length === 0 
                      ? "No project assignments yet. Create your first assignment to get started." 
                      : "No assignments match your filters."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Allocation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.projectName}</div>
                            {assignment.purchaseOrderNumber && (
                              <div className="text-xs text-muted-foreground">
                                PO: {assignment.purchaseOrderNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {assignment.employeeName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {assignment.clientName}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.role}</TableCell>
                        <TableCell>
                          {format(new Date(assignment.startDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {assignment.billableRate}/{assignment.billingCycle.charAt(0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignment.allocation}%</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Assignment Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setEditingAssignment(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? "Edit Project Assignment" : "New Project Assignment"}
            </DialogTitle>
            <DialogDescription id="project-assignment-description">
              {editingAssignment 
                ? "Update the project assignment details" 
                : "Assign an employee to a client project"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Website Redesign"
                />
              </div>

              <div>
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vendorId">Vendor (Optional)</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor (if applicable)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vendors
                      .filter(v => !formData.clientId || (v.clientIds && v.clientIds.includes(formData.clientId)))
                      .map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.companyName || vendor.legalName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Senior Developer"
                />
              </div>

              <div>
                <Label htmlFor="purchaseOrderNumber">Purchase Order Number</Label>
                <Input
                  id="purchaseOrderNumber"
                  value={formData.purchaseOrderNumber}
                  onChange={(e) => setFormData({ ...formData, purchaseOrderNumber: e.target.value })}
                  placeholder="PO-2024-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
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
                  onChange={(e) => setFormData({ ...formData, billableRate: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, allocation: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="hoursPerWeek">Hours/Week</Label>
                <Input
                  id="hoursPerWeek"
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional project details..."
                rows={3}
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-sm">
                This assignment will be visible in the employee's portal and used for timesheet tracking.
              </AlertDescription>
            </Alert>
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
    </div>
  );
}
