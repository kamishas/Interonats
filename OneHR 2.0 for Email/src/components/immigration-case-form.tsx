import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Clock, Info } from "lucide-react";
import type { CaseType, FilingStatus, ImmigrationRecord } from "../types";
import { getWorkflowTemplate } from "../lib/immigration-workflow-templates";

interface CaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  employees: ImmigrationRecord[];
  preselectedEmployeeId?: string;
}

export function ImmigrationCaseForm({ open, onOpenChange, onSubmit, employees, preselectedEmployeeId }: CaseFormProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    caseNumber: "",
    caseType: "H-1B Extension" as CaseType,
    petitionNumber: "",
    uscisCenter: "",
    receiptNumber: "",
    filedDate: "",
    approvalDate: "",
    validFrom: "",
    validTo: "",
    status: "Not Started" as FilingStatus,
    assignedAnalyst: "",
    assignedAttorney: "",
    rfeReceived: false,
    rfeDetails: "",
    rfeResponseDate: "",
    notes: "",
    useWorkflowTemplate: true
  });

  const [activeTab, setActiveTab] = useState("basic");
  const workflowTemplate = getWorkflowTemplate(formData.caseType);

  useEffect(() => {
    if (preselectedEmployeeId) {
      setFormData(prev => ({ ...prev, employeeId: preselectedEmployeeId }));
    }
  }, [preselectedEmployeeId]);

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      employeeId: "",
      caseNumber: "",
      caseType: "H-1B Extension",
      petitionNumber: "",
      uscisCenter: "",
      receiptNumber: "",
      filedDate: "",
      approvalDate: "",
      validFrom: "",
      validTo: "",
      status: "Not Started",
      assignedAnalyst: "",
      assignedAttorney: "",
      rfeReceived: false,
      rfeDetails: "",
      rfeResponseDate: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Immigration Case</DialogTitle>
          <DialogDescription id="immigration-case-form-description">
            Track H-1B transfers, amendments, extensions, OPT, STEM OPT, EAD renewals, and other immigration cases
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh]">
          <div className="space-y-4 pr-4">
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
                <Label htmlFor="caseType">Case Type *</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value: CaseType) => setFormData({ ...formData, caseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="H-1B Transfer">H-1B Transfer</SelectItem>
                    <SelectItem value="H-1B Amendment">H-1B Amendment</SelectItem>
                    <SelectItem value="H-1B Extension">H-1B Extension</SelectItem>
                    <SelectItem value="OPT Initial">OPT Initial</SelectItem>
                    <SelectItem value="OPT Extension">OPT Extension</SelectItem>
                    <SelectItem value="STEM OPT">STEM OPT</SelectItem>
                    <SelectItem value="EAD Renewal">EAD Renewal</SelectItem>
                    <SelectItem value="LCA Filing">LCA Filing</SelectItem>
                    <SelectItem value="I-983 Training Plan">I-983 Training Plan</SelectItem>
                    <SelectItem value="L-1 Transfer">L-1 Transfer</SelectItem>
                    <SelectItem value="L-1 Extension">L-1 Extension</SelectItem>
                    <SelectItem value="TN Initial">TN Initial</SelectItem>
                    <SelectItem value="TN Renewal">TN Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: FilingStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Preparation">In Preparation</SelectItem>
                    <SelectItem value="Filed">Filed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="RFE Received">RFE Received</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Denied">Denied</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="caseNumber">Case Number</Label>
                <Input
                  id="caseNumber"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  placeholder="Auto-generated if blank"
                />
              </div>

              <div>
                <Label htmlFor="petitionNumber">Petition Number</Label>
                <Input
                  id="petitionNumber"
                  value={formData.petitionNumber}
                  onChange={(e) => setFormData({ ...formData, petitionNumber: e.target.value })}
                  placeholder="e.g., EAC2290012345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uscisCenter">USCIS Center</Label>
                <Select
                  value={formData.uscisCenter}
                  onValueChange={(value) => setFormData({ ...formData, uscisCenter: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select USCIS center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="California Service Center">California Service Center (CSC)</SelectItem>
                    <SelectItem value="Nebraska Service Center">Nebraska Service Center (NSC)</SelectItem>
                    <SelectItem value="Texas Service Center">Texas Service Center (TSC)</SelectItem>
                    <SelectItem value="Vermont Service Center">Vermont Service Center (VSC)</SelectItem>
                    <SelectItem value="Potomac Service Center">Potomac Service Center (PSC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  placeholder="e.g., WAC2290012345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filedDate">Filed Date</Label>
                <Input
                  id="filedDate"
                  type="date"
                  value={formData.filedDate}
                  onChange={(e) => setFormData({ ...formData, filedDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="approvalDate">Approval Date</Label>
                <Input
                  id="approvalDate"
                  type="date"
                  value={formData.approvalDate}
                  onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="validTo">Valid To</Label>
                <Input
                  id="validTo"
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedAnalyst">Assigned Analyst</Label>
                <Input
                  id="assignedAnalyst"
                  value={formData.assignedAnalyst}
                  onChange={(e) => setFormData({ ...formData, assignedAnalyst: e.target.value })}
                  placeholder="Immigration analyst name"
                />
              </div>

              <div>
                <Label htmlFor="assignedAttorney">Assigned Attorney</Label>
                <Input
                  id="assignedAttorney"
                  value={formData.assignedAttorney}
                  onChange={(e) => setFormData({ ...formData, assignedAttorney: e.target.value })}
                  placeholder="Attorney name"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rfeReceived">RFE Received</Label>
                <p className="text-sm text-muted-foreground">
                  Has a Request for Evidence been received?
                </p>
              </div>
              <Switch
                id="rfeReceived"
                checked={formData.rfeReceived}
                onCheckedChange={(checked) => setFormData({ ...formData, rfeReceived: checked })}
              />
            </div>

            {formData.rfeReceived && (
              <>
                <div>
                  <Label htmlFor="rfeDetails">RFE Details</Label>
                  <Textarea
                    id="rfeDetails"
                    value={formData.rfeDetails}
                    onChange={(e) => setFormData({ ...formData, rfeDetails: e.target.value })}
                    placeholder="Describe the RFE request..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="rfeResponseDate">RFE Response Date</Label>
                  <Input
                    id="rfeResponseDate"
                    type="date"
                    value={formData.rfeResponseDate}
                    onChange={(e) => setFormData({ ...formData, rfeResponseDate: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional case notes..."
                rows={4}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Case</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}