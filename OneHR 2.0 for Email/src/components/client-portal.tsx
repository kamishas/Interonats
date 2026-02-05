import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

// Simulated client ID - in production, get from auth context
const CLIENT_ID = "demo-client-id";

export function ClientPortal() {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setIsLoading(true);

      // Fetch timesheets for approval
      const timesheetsRes = await fetch(`${API_URL}/client-portal/timesheets?clientId=${CLIENT_ID}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (timesheetsRes.ok) {
        const data = await timesheetsRes.json();
        setTimesheets(Array.isArray(data) ? data : []);
      }

      // Fetch invoices
      const invoicesRes = await fetch(`${API_URL}/client-portal/invoices?clientId=${CLIENT_ID}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching client portal data:', error);
      toast.error('Failed to load client portal data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTimesheet = async (timesheetId: string, approved: boolean) => {
    try {
      const response = await fetch(`${API_URL}/timesheets/${timesheetId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          approved,
          approverId: CLIENT_ID,
          approverName: "Client User",
          role: "client",
          comments: approved ? "Approved via client portal" : "Rejected via client portal",
        }),
      });

      if (!response.ok) throw new Error('Failed to approve timesheet');

      toast.success(approved ? 'Timesheet approved' : 'Timesheet rejected');
      fetchClientData(); // Refresh data
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast.error('Failed to approve timesheet');
    }
  };

  const handleDownloadInvoice = (invoice: any) => {
    toast.info('Invoice download functionality would be implemented here');
    // In production: generate PDF or download from storage
  };

  const handleExportData = (format: string) => {
    toast.info(`Export to ${format} functionality would be implemented here`);
    // In production: generate CSV/Excel export
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading client portal...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Client Portal</h2>
        <p className="text-muted-foreground">
          View and approve timesheets, download invoices, and export data
        </p>
      </div>

      <Tabs defaultValue="timesheets" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="timesheets">
            <Clock className="h-4 w-4 mr-2" />
            Timesheets ({timesheets.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets">
          <Card>
            <CardHeader>
              <CardTitle>Timesheets Pending Approval</CardTitle>
              <CardDescription>
                Review and approve/reject submitted timesheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timesheets.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No timesheets pending approval
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="gradient-teal-blue">
                        <TableHead className="text-white">Employee</TableHead>
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Project</TableHead>
                        <TableHead className="text-white">Hours</TableHead>
                        <TableHead className="text-white">Amount</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timesheets.map((ts) => {
                        const amount = (ts.hours || 0) * (ts.billingRate || 0);
                        return (
                          <TableRow key={ts.id}>
                            <TableCell>{ts.employeeName}</TableCell>
                            <TableCell>{format(new Date(ts.date), "MMM d, yyyy")}</TableCell>
                            <TableCell>{ts.project}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {ts.hours}h
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                {amount.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                Pending Approval
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApproveTimesheet(ts.id, true)}
                                >
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleApproveTimesheet(ts.id, false)}
                                >
                                  <ThumbsDown className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportData("CSV")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export to CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData("Excel")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export to Excel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                View and download your invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No invoices found
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="gradient-teal-blue">
                        <TableHead className="text-white">Invoice #</TableHead>
                        <TableHead className="text-white">Period</TableHead>
                        <TableHead className="text-white">Amount</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white">Due Date</TableHead>
                        <TableHead className="text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {inv.invoiceNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(inv.period.startDate), "MMM d")} - {format(new Date(inv.period.endDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              {inv.total.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {inv.status === "paid" ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                {inv.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(inv.dueDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadInvoice(inv)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportData("CSV")}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All to CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData("PDF")}>
                      <Download className="h-4 w-4 mr-2" />
                      Download All PDFs
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

