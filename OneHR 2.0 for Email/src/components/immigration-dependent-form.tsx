import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import type { DependentRelationship, ImmigrationRecord } from "../types";

interface DependentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  employees: ImmigrationRecord[];
  preselectedEmployeeId?: string;
}

export function ImmigrationDependentForm({ open, onOpenChange, onSubmit, employees, preselectedEmployeeId }: DependentFormProps) {
  const [formData, setFormData] = useState({
    employeeId: preselectedEmployeeId || "",
    name: "",
    relationship: "Spouse" as DependentRelationship,
    dateOfBirth: "",
    passportNumber: "",
    passportExpiry: "",
    visaType: "",
    visaExpiry: "",
    i94Number: "",
    i94Expiry: "",
    notes: ""
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      employeeId: "",
      name: "",
      relationship: "Spouse",
      dateOfBirth: "",
      passportNumber: "",
      passportExpiry: "",
      visaType: "",
      visaExpiry: "",
      i94Number: "",
      i94Expiry: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Dependent</DialogTitle>
          <DialogDescription id="immigration-dependent-form-description">
            Track dependent immigration information (spouse, children)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="employeeId">Primary Employee *</Label>
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
              <Label htmlFor="name">Dependent Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship *</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value: DependentRelationship) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={formData.passportNumber}
                onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                placeholder="A12345678"
              />
            </div>

            <div>
              <Label htmlFor="passportExpiry">Passport Expiry</Label>
              <Input
                id="passportExpiry"
                type="date"
                value={formData.passportExpiry}
                onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visaType">Visa Type</Label>
              <Input
                id="visaType"
                value={formData.visaType}
                onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                placeholder="e.g., H-4, L-2, F-2"
              />
            </div>

            <div>
              <Label htmlFor="visaExpiry">Visa Expiry</Label>
              <Input
                id="visaExpiry"
                type="date"
                value={formData.visaExpiry}
                onChange={(e) => setFormData({ ...formData, visaExpiry: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="i94Number">I-94 Number</Label>
              <Input
                id="i94Number"
                value={formData.i94Number}
                onChange={(e) => setFormData({ ...formData, i94Number: e.target.value })}
                placeholder="12345678901"
              />
            </div>

            <div>
              <Label htmlFor="i94Expiry">I-94 Expiry</Label>
              <Input
                id="i94Expiry"
                type="date"
                value={formData.i94Expiry}
                onChange={(e) => setFormData({ ...formData, i94Expiry: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about dependent..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Dependent</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}