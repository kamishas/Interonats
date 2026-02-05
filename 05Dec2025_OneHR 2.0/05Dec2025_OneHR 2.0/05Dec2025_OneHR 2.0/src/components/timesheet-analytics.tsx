import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertCircle,
  DollarSign,
  Activity,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { API_ENDPOINTS, getAccessToken } from "../lib/constants";

const API_URL = API_ENDPOINTS.TIMESHEET;

export function TimesheetAnalytics() {
  const [summary, setSummary] = useState<any>(null);
  const [utilization, setUtilization] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any>(null);
  const [overtime, setOvertime] = useState<any>(null);
  const [aiAccuracy, setAiAccuracy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch all analytics in parallel
      const [summaryRes, utilizationRes, revenueRes, exceptionsRes, overtimeRes, aiAccuracyRes] = await Promise.all([
        fetch(`${API_URL}/analytics/timesheet-summary`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        }),
        fetch(`${API_URL}/analytics/utilization`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        }),
        fetch(`${API_URL}/analytics/revenue`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        }),
        fetch(`${API_URL}/analytics/exceptions`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        }),
        fetch(`${API_URL}/analytics/overtime`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        }),
        fetch(`${API_URL}/analytics/ai-accuracy`, {
          headers: { 'Authorization': `Bearer ${getAccessToken() ?? ''}` },
        }),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (utilizationRes.ok) setUtilization(await utilizationRes.json());
      if (revenueRes.ok) setRevenue(await revenueRes.json());
      if (exceptionsRes.ok) setExceptions(await exceptionsRes.json());
      if (overtimeRes.ok) setOvertime(await overtimeRes.json());
      if (aiAccuracyRes.ok) setAiAccuracy(await aiAccuracyRes.json());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Timesheet Analytics & Dashboards</h2>
        <p className="text-muted-foreground">
          Comprehensive analytics across timesheets, utilization, revenue, exceptions, overtime, and AI accuracy
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="utilization">
            <Clock className="h-4 w-4 mr-2" />
            Utilization
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="exceptions">
            <AlertCircle className="h-4 w-4 mr-2" />
            Exceptions
          </TabsTrigger>
          <TabsTrigger value="overtime">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overtime
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Activity className="h-4 w-4 mr-2" />
            AI Accuracy
          </TabsTrigger>
        </TabsList>

        {/* Timesheet Summary Dashboard */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Submitted</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{summary?.totalSubmitted || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Timesheets submitted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Approved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{summary?.totalApproved || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Approval rate: {summary?.approvalRate?.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{summary?.totalPending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{summary?.totalRejected || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Needs correction
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
              <CardDescription>
                Overall timesheet submission and approval metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Submission Rate</span>
                <Badge variant="outline">{summary?.submissionRate?.toFixed(1) || 0}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Approval Rate</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {summary?.approvalRate?.toFixed(1) || 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Delayed Entries</span>
                <Badge variant="outline">{summary?.delayedEntries || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Missing Timesheets</span>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                  {summary?.missingTimesheets || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Dashboard */}
        <TabsContent value="utilization" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{utilization?.totalHours?.toFixed(1) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All recorded hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Billable Hours</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{utilization?.billableHours?.toFixed(1) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Client-billable time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Non-Billable Hours</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{utilization?.nonBillableHours?.toFixed(1) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Internal time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Utilization Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{utilization?.billablePercentage?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Billable percentage
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hour Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of billable vs non-billable hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Regular Hours</span>
                <Badge variant="outline">{utilization?.regularHours?.toFixed(1) || 0}h</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Overtime Hours</span>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {utilization?.overtimeHours?.toFixed(1) || 0}h
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Billable vs Non-Billable</span>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    {utilization?.billableHours?.toFixed(1) || 0}h
                  </Badge>
                  <Badge variant="outline">
                    {utilization?.nonBillableHours?.toFixed(1) || 0}h
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Dashboard */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${revenue?.revenue?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total invoiced
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Paid Amount</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${revenue?.paidAmount?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Payments received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Outstanding</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${revenue?.outstandingAmount?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Invoiced</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${revenue?.invoicedAmount?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total billed
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exception Dashboard */}
        <TabsContent value="exceptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Exceptions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{exceptions?.totalExceptions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All flagged issues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Critical</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{exceptions?.criticalExceptions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate action
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Unresolved</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{exceptions?.unresolved || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Pending resolution
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{exceptions?.resolved || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully handled
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Exception Breakdown</CardTitle>
              <CardDescription>
                Exceptions by severity level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Critical Exceptions</span>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                  {exceptions?.criticalExceptions || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Error Exceptions</span>
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  {exceptions?.errorExceptions || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Warning Exceptions</span>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {exceptions?.warningExceptions || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overtime Analysis */}
        <TabsContent value="overtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total OT Hours</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{overtime?.totalOvertimeHours?.toFixed(1) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Overtime hours logged
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">OT Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${overtime?.totalOvertimeCost?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total OT expense
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Approved OT</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{overtime?.approvedOvertimeHours?.toFixed(1) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  With client approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Employees</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{overtime?.employeeCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  With overtime
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Accuracy Report */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Documents Processed</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{aiAccuracy?.totalDocumentsProcessed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  OCR extractions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Accuracy Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{aiAccuracy?.accuracyRate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Successful extractions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Avg Confidence</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{((aiAccuracy?.averageConfidence || 0) * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  OCR confidence score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Failed Extractions</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{aiAccuracy?.failedExtractions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Low confidence results
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Confidence Distribution</CardTitle>
              <CardDescription>
                OCR confidence score breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>High Confidence (90-100%)</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {aiAccuracy?.confidenceBuckets?.high || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Medium Confidence (70-89%)</span>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {aiAccuracy?.confidenceBuckets?.medium || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Low Confidence (&lt;70%)</span>
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                  {aiAccuracy?.confidenceBuckets?.low || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
