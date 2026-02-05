import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import type { CostType, PaymentStatus, ImmigrationRecord } from "../types";

interface CostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  employees: ImmigrationRecord[];
  preselectedEmployeeId?: string;
}

export function ImmigrationCostForm({ open, onOpenChange, onSubmit, employees, preselectedEmployeeId }: CostFormProps) {
  const [formData, setFormData] = useState({
    employeeId: preselectedEmployeeId || "",
    costType: "Government Fee" as CostType,
    vendor: "",
    invoiceNumber: "",
    invoiceDate: "",
    amount: "",
    paidBy: "Company" as "Company" | "Client" | "Employee",
    reimbursable: false,
    paymentStatus: "Pending" as PaymentStatus,
    clientProjectId: "",
    accountingCategory: "",
    notes: ""
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      employeeId: "",
      costType: "Government Fee",
      vendor: "",
      invoiceNumber: "",
      invoiceDate: "",
      amount: "",
      paidBy: "Company",
      reimbursable: false,
      paymentStatus: "Pending",
      clientProjectId: "",
      accountingCategory: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Immigration Cost</DialogTitle>
          <DialogDescription id="immigration-cost-form-description">
            Track immigration-related expenses with approval workflow
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
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
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.employeeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costType">Cost Type *</Label>
              <Select
                value={formData.costType}
                onValueChange={(value: CostType) => setFormData({ ...formData, costType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Government Fee">Government Fee</SelectItem>
                  <SelectItem value="Attorney Fee">Attorney Fee</SelectItem>
                  <SelectItem value="Courier Fee">Courier Fee</SelectItem>
                  <SelectItem value="Premium Processing">Premium Processing</SelectItem>
                  <SelectItem value="Translation">Translation</SelectItem>
                  <SelectItem value="Medical Exam">Medical Exam</SelectItem>
                  <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vendor">Vendor/Payee *</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., USCIS, Law Firm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="paidBy">Paid By *</Label>
              <Select
                value={formData.paidBy}
                onValueChange={(value: "Company" | "Client" | "Employee") => setFormData({ ...formData, paidBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-12345"
              />
            </div>

            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value: PaymentStatus) => setFormData({ ...formData, paymentStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Reimbursed">Reimbursed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accountingCategory">Accounting Category</Label>
              <Select
                value={formData.accountingCategory}
                onValueChange={(value) => setFormData({ ...formData, accountingCategory: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reimbursable">Reimbursable</Label>
              <p className="text-sm text-muted-foreground">
                Should this cost be reimbursed by client or employee?
              </p>
            </div>
            <Switch
              id="reimbursable"
              checked={formData.reimbursable}
              onCheckedChange={(checked) => setFormData({ ...formData, reimbursable: checked })}
            />
          </div>

          {formData.reimbursable && (
            <div>
              <Label htmlFor="clientProjectId">Client/Project ID</Label>
              <Input
                id="clientProjectId"
                value={formData.clientProjectId}
                onChange={(e) => setFormData({ ...formData, clientProjectId: e.target.value })}
                placeholder="Link to client project for invoicing"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this cost..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Cost</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
