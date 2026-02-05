import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  AlertCircle,
  Upload,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import type { ImmigrationRecord, DocumentType } from "../types";
import { ImmigrationTimeline } from "./immigration-timeline";

interface EmployeeImmigrationPortalProps {
  employeeEmail: string;
}

export function EmployeeImmigrationPortal({ employeeEmail }: EmployeeImmigrationPortalProps) {
  const [record, setRecord] = useState<ImmigrationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    documentType: "" as DocumentType | "",
    documentName: "",
    expiryDate: "",
    notes: ""
  });

  useEffect(() => {
    fetchImmigrationRecord();
  }, [employeeEmail]);

  const fetchImmigrationRecord = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b/immigration/records`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const employeeRecord = data.records?.find((r: ImmigrationRecord) => r.email === employeeEmail);
        setRecord(employeeRecord || null);
      }
    } catch (error) {
      console.error("Error fetching immigration record:", error);
      toast.error("Failed to load immigration information");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadData.documentType || !uploadData.documentName) {
      toast.error("Please provide document type and name");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b/immigration/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            employeeId: record?.employeeId,
            documentType: uploadData.documentType,
            documentName: uploadData.documentName,
            expiryDate: uploadData.expiryDate || undefined,
            notes: uploadData.notes,
            uploadedBy: employeeEmail
          }),
        }
      );

      if (response.ok) {
        toast.success("Document uploaded successfully");
        setShowUploadDialog(false);
        setUploadData({
          documentType: "",
          documentName: "",
          expiryDate: "",
          notes: ""
        });
        fetchImmigrationRecord();
      } else {
        const error = await response.text();
        toast.error(`Upload failed: ${error}`);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    
    if (days < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-red-100 text-red-800">Expires in {days} days</Badge>;
    } else if (days <= 60) {
      return <Badge className="bg-orange-100 text-orange-800">Expires in {days} days</Badge>;
    } else if (days <= 90) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expires in {days} days</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "H-1B": "bg-blue-100 text-blue-800",
      "OPT": "bg-purple-100 text-purple-800",
      "STEM OPT": "bg-indigo-100 text-indigo-800",
      "Green Card": "bg-green-100 text-green-800",
      "Citizen": "bg-emerald-100 text-emerald-800",
      "L-1": "bg-cyan-100 text-cyan-800",
      "TN": "bg-teal-100 text-teal-800",
      "O-1": "bg-violet-100 text-violet-800"
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!record) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Immigration Record</AlertTitle>
        <AlertDescription>
          No immigration information found. Please contact HR if you believe this is an error.
        </AlertDescription>
      </Alert>
    );
  }

  const allCases = [...(record.cases || [])];
  const allDocuments = [...(record.documents || [])];
  const allTimeline = allCases.flatMap(c => c.timeline || []);

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Immigration Status</CardTitle>
          <CardDescription>Current immigration information and work authorization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-muted-foreground">Current Status</Label>
              <div className="mt-2">{getStatusBadge(record.currentStatus)}</div>
            </div>
            
            {record.workAuthorizationExpiry && (
              <div>
                <Label className="text-muted-foreground">Work Authorization Expiry</Label>
                <div className="mt-2 space-y-1">
                  <div className="text-sm">
                    {format(new Date(record.workAuthorizationExpiry), "MMMM dd, yyyy")}
                  </div>
                  {getExpiryBadge(record.workAuthorizationExpiry)}
                </div>
              </div>
            )}
            
            {record.eadExpiryDate && (
              <div>
                <Label className="text-muted-foreground">EAD Card Expiry</Label>
                <div className="mt-2 space-y-1">
                  <div className="text-sm">
                    {format(new Date(record.eadExpiryDate), "MMMM dd, yyyy")}
                  </div>
                  {getExpiryBadge(record.eadExpiryDate)}
                </div>
              </div>
            )}
          </div>

          {record.i94Number && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">I-94 Number</Label>
                  <div className="text-sm mt-1">{record.i94Number}</div>
                </div>
                {record.i94Expiry && (
                  <div>
                    <Label className="text-muted-foreground text-xs">I-94 Expiry</Label>
                    <div className="text-sm mt-1">
                      {format(new Date(record.i94Expiry), "MMM dd, yyyy")}
                    </div>
                  </div>
                )}
                {record.passportNumber && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Passport Number</Label>
                    <div className="text-sm mt-1">{record.passportNumber}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiration Alerts */}
      {(record.alerts && record.alerts.length > 0) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Action Required</AlertTitle>
          <AlertDescription className="text-orange-700">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {record.alerts.map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="cases">Active Cases</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Immigration Documents</CardTitle>
                  <CardDescription>View and upload your immigration documents</CardDescription>
                </div>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No documents uploaded yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.documentType}</TableCell>
                        <TableCell>{doc.documentName}</TableCell>
                        <TableCell>{format(new Date(doc.uploadDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {doc.expiryDate ? format(new Date(doc.expiryDate), "MMM dd, yyyy") : "N/A"}
                        </TableCell>
                        <TableCell>
                          {doc.expiryDate ? getExpiryBadge(doc.expiryDate) : (
                            <Badge variant="outline">No Expiry</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Immigration Cases</CardTitle>
              <CardDescription>Track your ongoing immigration petitions and applications</CardDescription>
            </CardHeader>
            <CardContent>
              {allCases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active cases
                </p>
              ) : (
                <div className="space-y-4">
                  {allCases.map((immigrationCase) => (
                    <Card key={immigrationCase.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{immigrationCase.caseType}</CardTitle>
                            <CardDescription>Case #{immigrationCase.caseNumber}</CardDescription>
                          </div>
                          <Badge>
                            {immigrationCase.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {immigrationCase.filedDate && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Filed Date</Label>
                              <div>{format(new Date(immigrationCase.filedDate), "MMM dd, yyyy")}</div>
                            </div>
                          )}
                          {immigrationCase.receiptNumber && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Receipt Number</Label>
                              <div>{immigrationCase.receiptNumber}</div>
                            </div>
                          )}
                          {immigrationCase.uscisCenter && (
                            <div>
                              <Label className="text-xs text-muted-foreground">USCIS Center</Label>
                              <div>{immigrationCase.uscisCenter}</div>
                            </div>
                          )}
                          {immigrationCase.assignedAttorney && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Attorney</Label>
                              <div>{immigrationCase.assignedAttorney}</div>
                            </div>
                          )}
                        </div>
                        {immigrationCase.notes && (
                          <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                            {immigrationCase.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <ImmigrationTimeline 
            events={allTimeline}
            title="Your Immigration Timeline"
          />
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Immigration Document</DialogTitle>
            <DialogDescription id="upload-immigration-doc-portal-description">
              Upload a new immigration document or update an existing one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="documentType">Document Type *</Label>
              <select
                id="documentType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                value={uploadData.documentType}
                onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value as DocumentType })}
              >
                <option value="">Select document type</option>
                <option value="I-797 Approval Notice">I-797 Approval Notice</option>
                <option value="I-94 Arrival/Departure">I-94 Arrival/Departure</option>
                <option value="Passport">Passport</option>
                <option value="Visa Stamp">Visa Stamp</option>
                <option value="EAD Card">EAD Card</option>
                <option value="I-20">I-20</option>
                <option value="DS-2019">DS-2019</option>
                <option value="I-983 Training Plan">I-983 Training Plan</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="documentName">Document Name *</Label>
              <Input
                id="documentName"
                value={uploadData.documentName}
                onChange={(e) => setUploadData({ ...uploadData, documentName: e.target.value })}
                placeholder="e.g., H-1B Approval Notice 2024"
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={uploadData.expiryDate}
                onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                placeholder="Additional notes about this document"
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-xs">
                Documents will be reviewed by the immigration team. You'll be notified once verified.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
