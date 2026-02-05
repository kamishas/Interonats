import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Switch } from "./ui/switch";
import {
  Plus,
  DollarSign,
  Receipt,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";
import type { Employee } from "../types";

const API_URL = API_ENDPOINTS.EXPENSE;

interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receiptUploaded: boolean;
  receiptFileName?: string;
  status: string;
  billableToClient: boolean;
  clientId?: string;
  approvedBy?: string;
  approvedByName?: string;
  createdAt: string;
}

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newExpense, setNewExpense] = useState({
    employeeId: "",
    category: "Travel",
    description: "",
    amount: "",
    date: "",
    billableToClient: true,
  });

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/expenses`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      // Backend returns { employees: [...] }, so extract the employees array
      const employeesList = data.employees || data;
      setEmployees(Array.isArray(employeesList) ? employeesList : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.employeeId || !newExpense.category || !newExpense.description || !newExpense.amount || !newExpense.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const employee = employees.find(e => e.id === newExpense.employeeId);
      
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify({
          employeeId: newExpense.employeeId,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
          category: newExpense.category,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          date: newExpense.date,
          billableToClient: newExpense.billableToClient,
        }),
      });

      if (!response.ok) throw new Error('Failed to create expense');

      const expense = await response.json();
      setExpenses([expense, ...expenses]);
      toast.success('Expense added successfully');
      
      setShowAddDialog(false);
      setNewExpense({
        employeeId: "",
        category: "Travel",
        description: "",
        amount: "",
        date: "",
        billableToClient: true,
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (expenseId: string, approved: boolean) => {
    try {
      const response = await fetch(`${API_URL}/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify({
          approved,
          approverId: "current-user-id",
          approverName: "Current User",
          reason: approved ? undefined : "Please provide reason",
        }),
      });

      if (!response.ok) throw new Error('Failed to approve expense');

      const updated = await response.json();
      setExpenses(expenses.map(e => e.id === updated.id ? updated : e));
      toast.success(approved ? 'Expense approved' : 'Expense rejected');
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    }
  };

  const getStatusBadge = (expense: Expense) => {
    switch (expense.status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>;
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "reimbursed":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <DollarSign className="h-3 w-3 mr-1" />
            Reimbursed
          </Badge>
        );
      default:
        return <Badge variant="outline">{expense.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Expense & Reimbursement Management</h2>
          <p className="text-muted-foreground">
            Track and manage employee expenses linked to timesheets and invoices
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gradient-teal-blue text-white shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>
                Add a new expense with receipt upload and client billing option
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="employee-select">
                  Employee <span className="text-red-500">*</span>
                </Label>
                <Select value={newExpense.employeeId} onValueChange={(v) => setNewExpense({ ...newExpense, employeeId: v })}>
                  <SelectTrigger id="employee-select">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Meals">Meals</SelectItem>
                      <SelectItem value="Lodging">Lodging</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the expense..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="billable-toggle"
                  checked={newExpense.billableToClient}
                  onCheckedChange={(v) => setNewExpense({ ...newExpense, billableToClient: v })}
                />
                <Label htmlFor="billable-toggle">Billable to Client</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddExpense}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            Manage and approve employee expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading expenses...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="gradient-teal-blue">
                  <TableHead className="text-white">Employee</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Category</TableHead>
                  <TableHead className="text-white">Description</TableHead>
                  <TableHead className="text-white">Amount</TableHead>
                  <TableHead className="text-white">Billable</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.employeeName}</TableCell>
                      <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {expense.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.billableToClient ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense)}</TableCell>
                      <TableCell>
                        {expense.status === "submitted" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(expense.id, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApprove(expense.id, false)}
                            >
                              Reject
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
    </div>
  );
}
