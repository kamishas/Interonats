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
import { CheckCircle2, Clock, Info, DollarSign, Calendar } from "lucide-react";
import type { CaseType, FilingStatus, ImmigrationRecord } from "../types";
import { getWorkflowTemplate } from "../lib/immigration-workflow-templates";

interface CaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  employees: ImmigrationRecord[];
  preselectedEmployeeId?: string;
}

export function ImmigrationCaseFormEnhanced({ open, onOpenChange, onSubmit, employees, preselectedEmployeeId }: CaseFormProps) {
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
    onSubmit({
      ...formData,
      workflowTemplate: formData.useWorkflowTemplate ? workflowTemplate : undefined
    });
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
      notes: "",
      useWorkflowTemplate: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Immigration Case</DialogTitle>
          <DialogDescription id="immigration-case-enhanced-description">
            Track H-1B transfers, amendments, extensions, OPT, STEM OPT, EAD renewals, and other immigration cases
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="workflow">
              Workflow Template
              {workflowTemplate && <Badge className="ml-2 text-xs bg-green-600">Available</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <ScrollArea className="h-[60vh]">
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

                {workflowTemplate && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <div className="flex items-center justify-between">
                        <span>A workflow template is available for {formflowTemplate.displayName}. View in the Workflow Template tab.</span>
                        <Switch
                          checked={formData.useWorkflowTemplate}
                          onCheckedChange={(checked) => setFormData({ ...formData, useWorkflowTemplate: checked })}
                        />
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="workflow">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {workflowTemplate ? (
                  <>
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle>{workflowTemplate.displayName}</CardTitle>
                        <CardDescription>{workflowTemplate.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Estimated Duration</div>
                              <div className="text-sm font-medium">{workflowTemplate.estimatedTotalDays} days</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Government Fees</div>
                              <div className="text-sm font-medium">{workflowTemplate.governmentFeeRange}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Attorney Fees</div>
                              <div className="text-sm font-medium">{workflowTemplate.attorneyFeeRange}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Required Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid grid-cols-2 gap-2">
                          {workflowTemplate.requiredDocuments.map((doc, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Workflow Tasks ({workflowTemplate.tasks.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {workflowTemplate.tasks.map((task, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-white">
                                <span className="text-xs font-medium">{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-medium text-sm">{task.taskName}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{task.estimatedDays}d</Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Assigned to: {task.assignedTo}</span>
                                  {task.requiredDocuments.length > 0 && (
                                    <span>Docs: {task.requiredDocuments.length}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No workflow template available for this case type. Templates are available for H-1B, OPT, STEM OPT, EAD, and LCA cases.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

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
