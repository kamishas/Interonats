import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import type { ImmigrationStatus } from "../types";

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

// Statuses that typically require EAD documentation
const statusesRequiringEAD: ImmigrationStatus[] = ['OPT', 'STEM OPT', 'H-4', 'L-2', 'F-1'];

export function ImmigrationEmployeeForm({ open, onOpenChange, onSubmit, initialData, mode = 'create' }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    // Basic Info
    employeeName: "",
    email: "",
    
    // Current Status
    currentStatus: "H-1B" as ImmigrationStatus,
    petitionNumber: "",
    workAuthorizationExpiry: "",
    
    // I-94 Information
    i94Number: "",
    i94Expiry: "",
    i94AdmissionDate: "",
    
    // Passport Information
    passportNumber: "",
    passportCountry: "",
    passportIssueDate: "",
    passportExpiryDate: "",
    
    // Visa Information
    visaType: "",
    visaNumber: "",
    visaIssueDate: "",
    visaExpiryDate: "",
    
    // EAD Document Information
    eadNumber: "",
    eadCategory: "",
    eadIssueDate: "",
    eadExpiryDate: "",
    uscisNumber: "",
    cardNumber: "",
    
    // Sponsorship
    requiresSponsorship: false,
    currentSponsor: "",
    
    // Attorney Information
    lawFirm: "",
    
    notes: ""
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        employeeName: initialData.employeeName || "",
        email: initialData.email || "",
        currentStatus: initialData.currentStatus || "H-1B",
        petitionNumber: initialData.petitionNumber || "",
        workAuthorizationExpiry: initialData.eadExpiryDate || initialData.workAuthorizationExpiry || "",
        i94Number: initialData.i94Number || "",
        i94Expiry: initialData.i94Expiry || "",
        i94AdmissionDate: initialData.i94AdmissionDate || "",
        passportNumber: initialData.passportNumber || "",
        passportCountry: initialData.passportCountry || "",
        passportIssueDate: initialData.passportIssueDate || "",
        passportExpiryDate: initialData.passportExpiryDate || "",
        visaType: initialData.visaType || "",
        visaNumber: initialData.visaNumber || "",
        visaIssueDate: initialData.visaIssueDate || "",
        visaExpiryDate: initialData.visaExpiryDate || "",
        eadNumber: initialData.eadNumber || "",
        eadCategory: initialData.eadCategory || "",
        eadIssueDate: initialData.eadIssueDate || "",
        eadExpiryDate: initialData.eadExpiryDate || "",
        uscisNumber: initialData.uscisNumber || "",
        cardNumber: initialData.cardNumber || "",
        requiresSponsorship: initialData.requiresSponsorship || false,
        hasActiveGCProcess: initialData.hasActiveGCProcess || false,
        currentSponsor: initialData.currentSponsor || "",
        lawFirm: initialData.lawFirm || "",
        notes: initialData.notes || ""
      });
    }
  }, [initialData, mode]);

  // Sync workAuthorizationExpiry with eadExpiryDate (they're the same thing)
  useEffect(() => {
    if (formData.eadExpiryDate) {
      setFormData(prev => ({ ...prev, workAuthorizationExpiry: prev.eadExpiryDate }));
    }
  }, [formData.eadExpiryDate]);

  const handleSubmit = () => {
    onSubmit(formData);
    // Reset form
    setFormData({
      employeeName: "",
      email: "",
      currentStatus: "H-1B",
      petitionNumber: "",
      workAuthorizationExpiry: "",
      i94Number: "",
      i94Expiry: "",
      i94AdmissionDate: "",
      passportNumber: "",
      passportCountry: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      visaType: "",
      visaNumber: "",
      visaIssueDate: "",
      visaExpiryDate: "",
      eadNumber: "",
      eadCategory: "",
      eadIssueDate: "",
      eadExpiryDate: "",
      uscisNumber: "",
      cardNumber: "",
      requiresSponsorship: false,
      currentSponsor: "",
      lawFirm: "",
      notes: ""
    });
  };

  const requiresEAD = statusesRequiringEAD.includes(formData.currentStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Employee Immigration Record' : 'Add Employee Immigration Record'}
          </DialogTitle>
          <DialogDescription id="immigration-employee-form-description">
            {mode === 'edit' 
              ? 'Update immigration record with visa, passport, and EAD details' 
              : 'Complete immigration record with visa, passport, and EAD details'
            }
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh]">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="i94">I-94</TabsTrigger>
              <TabsTrigger value="passport">Passport</TabsTrigger>
              <TabsTrigger value="visa">Visa</TabsTrigger>
              <TabsTrigger value="ead" className={requiresEAD ? "relative" : ""}>
                EAD
                {requiresEAD && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pr-4">
              <div>
                <Label htmlFor="employeeName">Employee Name *</Label>
                <Input
                  id="employeeName"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@company.com"
                />
              </div>
              <div>
                <Label htmlFor="currentStatus">Current Immigration Status *</Label>
                <Select
                  value={formData.currentStatus}
                  onValueChange={(value: ImmigrationStatus) => 
                    setFormData({ ...formData, currentStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US Citizen">US Citizen</SelectItem>
                    <SelectItem value="Green Card / Permanent Resident">Green Card / Permanent Resident</SelectItem>
                    <SelectItem value="H-1B">H-1B</SelectItem>
                    <SelectItem value="L-1">L-1</SelectItem>
                    <SelectItem value="E-3">E-3</SelectItem>
                    <SelectItem value="TN">TN</SelectItem>
                    <SelectItem value="F-1 OPT">F-1 OPT</SelectItem>
                    <SelectItem value="F-1 CPT">F-1 CPT</SelectItem>
                    <SelectItem value="H-4 - EAD">H-4 - EAD</SelectItem>
                    <SelectItem value="O-1">O-1</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* EAD Required Alert */}
              {requiresEAD && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900">EAD Information Required</AlertTitle>
                  <AlertDescription className="text-orange-800">
                    {formData.currentStatus} status typically requires a Work Authorization Document (EAD). 
                    Please navigate to the <span className="font-semibold">EAD tab</span> to enter the EAD number, category, 
                    issue date, and expiry date.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="petitionNumber">Petition Number</Label>
                <Input
                  id="petitionNumber"
                  value={formData.petitionNumber}
                  onChange={(e) => setFormData({ ...formData, petitionNumber: e.target.value })}
                  placeholder="e.g., EAC2290012345"
                />
              </div>
              
              {/* Display EAD Expiry for reference */}
              {formData.eadExpiryDate && (
                <div>
                  <Label>EAD Expiry (from EAD tab)</Label>
                  <Input
                    type="date"
                    value={formData.eadExpiryDate}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is automatically set from your EAD Expiry Date in the EAD tab
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="i94" className="space-y-4 pr-4">
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
                <Label htmlFor="i94AdmissionDate">I-94 Admission Date</Label>
                <Input
                  id="i94AdmissionDate"
                  type="date"
                  value={formData.i94AdmissionDate}
                  onChange={(e) => setFormData({ ...formData, i94AdmissionDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="i94Expiry">I-94 Expiry Date</Label>
                <Input
                  id="i94Expiry"
                  type="date"
                  value={formData.i94Expiry}
                  onChange={(e) => setFormData({ ...formData, i94Expiry: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="passport" className="space-y-4 pr-4">
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
                <Label htmlFor="passportCountry">Passport Country</Label>
                <Input
                  id="passportCountry"
                  value={formData.passportCountry}
                  onChange={(e) => setFormData({ ...formData, passportCountry: e.target.value })}
                  placeholder="e.g., India, China, Mexico"
                />
              </div>
              <div>
                <Label htmlFor="passportIssueDate">Passport Issue Date</Label>
                <Input
                  id="passportIssueDate"
                  type="date"
                  value={formData.passportIssueDate}
                  onChange={(e) => setFormData({ ...formData, passportIssueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="passportExpiryDate">Passport Expiry Date</Label>
                <Input
                  id="passportExpiryDate"
                  type="date"
                  value={formData.passportExpiryDate}
                  onChange={(e) => setFormData({ ...formData, passportExpiryDate: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="visa" className="space-y-4 pr-4">
              <h4 className="mb-2">Visa Information</h4>
              <div>
                <Label htmlFor="visaType">Visa Type</Label>
                <Input
                  id="visaType"
                  value={formData.visaType}
                  onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                  placeholder="e.g., H-1B, L-1, F-1"
                />
              </div>
              <div>
                <Label htmlFor="visaNumber">Visa Number</Label>
                <Input
                  id="visaNumber"
                  value={formData.visaNumber}
                  onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visaIssueDate">Visa Issue Date</Label>
                  <Input
                    id="visaIssueDate"
                    type="date"
                    value={formData.visaIssueDate}
                    onChange={(e) => setFormData({ ...formData, visaIssueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="visaExpiryDate">Visa Expiry Date</Label>
                  <Input
                    id="visaExpiryDate"
                    type="date"
                    value={formData.visaExpiryDate}
                    onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ead" className="space-y-4 pr-4">
              <div>
                <h4 className="mb-2">Work Authorization Document (EAD)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  EAD tracks employment authorization for specific visa categories. The EAD issue date (beginning) 
                  and expiry date (end) determine the period of employment authorization.
                </p>
              </div>

              {requiresEAD && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900">Required for {formData.currentStatus}</AlertTitle>
                  <AlertDescription className="text-orange-800">
                    Please provide the EAD beginning date (Issue Date) and end date (Expiry Date) below.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="eadNumber">EAD Number {requiresEAD && <span className="text-orange-600">*</span>}</Label>
                <Input
                  id="eadNumber"
                  value={formData.eadNumber}
                  onChange={(e) => setFormData({ ...formData, eadNumber: e.target.value })}
                  placeholder="e.g., C09 1234567890"
                  className={requiresEAD && !formData.eadNumber ? "border-orange-300" : ""}
                />
              </div>
              <div>
                <Label htmlFor="eadCategory">EAD Category {requiresEAD && <span className="text-orange-600">*</span>}</Label>
                <Input
                  id="eadCategory"
                  value={formData.eadCategory}
                  onChange={(e) => setFormData({ ...formData, eadCategory: e.target.value })}
                  placeholder="e.g., C09, C05, A05, C08"
                  className={requiresEAD && !formData.eadCategory ? "border-orange-300" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Common categories: C03p (H-4 EAD), C09 (I-485 pending), C05 (L-2 EAD), C03d (OPT)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="uscisNumber">USCIS #</Label>
                  <Input
                    id="uscisNumber"
                    value={formData.uscisNumber}
                    onChange={(e) => setFormData({ ...formData, uscisNumber: e.target.value })}
                    placeholder="e.g., 123-456-789"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    USCIS Account Number or Receipt Number
                  </p>
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card #</Label>
                  <Input
                    id="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    placeholder="e.g., SRC1234567890"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    EAD Card Number
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eadIssueDate">
                    EAD Beginning Date (Issue Date) {requiresEAD && <span className="text-orange-600">*</span>}
                  </Label>
                  <Input
                    id="eadIssueDate"
                    type="date"
                    value={formData.eadIssueDate}
                    onChange={(e) => setFormData({ ...formData, eadIssueDate: e.target.value })}
                    className={requiresEAD && !formData.eadIssueDate ? "border-orange-300" : ""}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    When employment authorization begins
                  </p>
                </div>
                <div>
                  <Label htmlFor="eadExpiryDate">
                    EAD End Date (Expiry Date) {requiresEAD && <span className="text-orange-600">*</span>}
                  </Label>
                  <Input
                    id="eadExpiryDate"
                    type="date"
                    value={formData.eadExpiryDate}
                    onChange={(e) => setFormData({ ...formData, eadExpiryDate: e.target.value })}
                    className={requiresEAD && !formData.eadExpiryDate ? "border-orange-300" : ""}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    When employment authorization ends
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4 pr-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requiresSponsorship">Requires Sponsorship</Label>
                  <p className="text-sm text-muted-foreground">
                    Does this employee require company sponsorship?
                  </p>
                </div>
                <Switch
                  id="requiresSponsorship"
                  checked={formData.requiresSponsorship}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresSponsorship: checked })}
                />
              </div>
              {formData.requiresSponsorship && (
                <div>
                  <Label htmlFor="currentSponsor">Current Sponsor</Label>
                  <Input
                    id="currentSponsor"
                    value={formData.currentSponsor}
                    onChange={(e) => setFormData({ ...formData, currentSponsor: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="lawFirm">Law Firm</Label>
                <Input
                  id="lawFirm"
                  value={formData.lawFirm}
                  onChange={(e) => setFormData({ ...formData, lawFirm: e.target.value })}
                  placeholder="Immigration law firm name"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4 px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'edit' ? 'Save Changes' : 'Create Record'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
