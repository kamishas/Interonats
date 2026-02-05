import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Users,
  History,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getAccessToken, API_ENDPOINTS } from '../lib/constants';

const API_URL = API_ENDPOINTS.TIMESHEET;

interface ApprovalItem {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  project: string;
  client: string;
  hours: number;
  regularHours: number;
  overtimeHours?: number;
  status: string;
  weekEnding: string;
  approvalWorkflow?: {
    id: string;
    currentStage: number;
    totalStages: number;
    stages: any[];
    history: any[];
  };
  poNumber?: string;
  billingRate?: number;
  description: string;
}

export function ApprovalWorkflow() {
  const [clientApprovals, setClientApprovals] = useState<ApprovalItem[]>([]);
  const [accountingApprovals, setAccountingApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      
      // Fetch client approvals
      const clientRes = await fetch(`${API_URL}/approvals/queue?role=client`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (clientRes.ok) {
        const data = await clientRes.json();
        setClientApprovals(Array.isArray(data) ? data : []);
      }

      // Fetch accounting approvals
      const accountingRes = await fetch(`${API_URL}/approvals/queue?role=accounting`, {
        headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
      });
      if (accountingRes.ok) {
        const data = await accountingRes.json();
        setAccountingApprovals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load approval queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem, approved: boolean) => {
    try {
      setIsProcessing(true);

      const response = await fetch(`${API_URL}/timesheets/${item.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify({
          approved,
          approverId: 'current-user-id', // In production, get from auth context
          approverName: 'Current User', // In production, get from auth context
          approverEmail: 'user@example.com', // In production, get from auth context
          role: item.status === 'pending_client_approval' ? 'client' : 'accounting',
          comments,
        }),
      });

      if (!response.ok) throw new Error('Failed to process approval');

      const result = await response.json();
      
      toast.success(approved ? 'Timesheet approved successfully' : 'Timesheet rejected');
      
      setShowApprovalDialog(false);
      setSelectedItem(null);
      setComments("");
      
      // Refresh approvals
      fetchApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const openApprovalDialog = (item: ApprovalItem) => {
    setSelectedItem(item);
    setShowApprovalDialog(true);
  };

  const ApprovalTable = ({ items, title, emptyMessage }: { items: ApprovalItem[]; title: string; emptyMessage: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {items.length} item{items.length !== 1 ? 's' : ''} pending your approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="gradient-teal-blue">
                <TableHead className="text-white">Employee</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Project / Client</TableHead>
                <TableHead className="text-white">Hours</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const amount = ((item.regularHours || item.hours) * (item.billingRate || 0)) +
                  ((item.overtimeHours || 0) * (item.billingRate || 0) * 1.5);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{item.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(item.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div>
                        <div>{item.project}</div>
                        <div className="text-xs text-muted-foreground">{item.client}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {item.regularHours || item.hours}h
                        </div>
                        {item.overtimeHours && item.overtimeHours > 0 && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            +{item.overtimeHours}h OT
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      ${amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Pending Approval
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openApprovalDialog(item)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Approval Workflow</h2>
        <p className="text-muted-foreground">
          Review and approve/reject timesheets with multi-stage workflow and audit trail
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading approval queue...
        </div>
      ) : (
        <Tabs defaultValue="client">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="client">
              <Users className="h-4 w-4 mr-2" />
              Client Approvals ({clientApprovals.length})
            </TabsTrigger>
            <TabsTrigger value="accounting">
              <FileText className="h-4 w-4 mr-2" />
              Accounting Approvals ({accountingApprovals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="mt-6">
            <ApprovalTable
              items={clientApprovals}
              title="Client Approvals"
              emptyMessage="No timesheets pending client approval"
            />
          </TabsContent>

          <TabsContent value="accounting" className="mt-6">
            <ApprovalTable
              items={accountingApprovals}
              title="Accounting Approvals"
              emptyMessage="No timesheets pending accounting approval"
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Timesheet</DialogTitle>
            <DialogDescription>
              Review the timesheet details and approve or reject
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 pt-4">
              {/* Timesheet Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Input value={selectedItem.employeeName || ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input value={format(new Date(selectedItem.date), "MMM d, yyyy")} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Project</Label>
                  <Input value={selectedItem.project || ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input value={selectedItem.client || ''} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Regular Hours</Label>
                  <Input value={String(selectedItem.regularHours || selectedItem.hours || '')} readOnly />
                </div>

                {selectedItem.overtimeHours && selectedItem.overtimeHours > 0 && (
                  <div className="space-y-2">
                    <Label>Overtime Hours</Label>
                    <Input value={String(selectedItem.overtimeHours)} readOnly />
                  </div>
                )}

                {selectedItem.poNumber && (
                  <div className="space-y-2">
                    <Label>PO Number</Label>
                    <Input value={selectedItem.poNumber} readOnly />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Billing Rate</Label>
                  <Input value={`$${(selectedItem.billingRate || 0).toFixed(2)}/hr`} readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={selectedItem.description || "No description provided"} readOnly rows={3} />
              </div>

              {/* Approval Workflow History */}
              {selectedItem.approvalWorkflow && selectedItem.approvalWorkflow.history && selectedItem.approvalWorkflow.history.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Approval History
                  </Label>
                  <div className="border rounded-lg p-4 space-y-2">
                    {selectedItem.approvalWorkflow.history.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        {h.action === "approved" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        )}
                        <div>
                          <div>
                            <strong>{h.performedByName}</strong> {h.action} at stage {h.stage} ({h.stageName})
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(h.timestamp), "MMM d, yyyy h:mm a")}
                          </div>
                          {h.comments && (
                            <div className="text-xs mt-1 italic">"{h.comments}"</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="approval-comments">Comments (optional)</Label>
                <Textarea
                  id="approval-comments"
                  placeholder="Add any comments or notes..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowApprovalDialog(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleApprove(selectedItem, false)}
                  disabled={isProcessing}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Reject"}
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedItem, true)}
                  disabled={isProcessing}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Approve"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
