// Comprehensive Timesheet & Invoicing Types for Requirements 3.1-3.11

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  project: string;
  client: string;
  
  // 3.2 Multi-PO Support
  assignmentId?: string;
  clientPoId?: string;
  poNumber?: string;
  poLimit?: number;
  poUtilization?: number;
  workLocation?: "Remote" | "Onsite" | "Hybrid";
  billingType?: "Hourly" | "Fixed Fee" | "Milestone";
  billingRate?: number;
  
  // Basic hours
  regularHours: number;
  hours: number; // Total hours for backward compatibility
  
  // 3.4 Overtime
  overtimeHours?: number;
  overtimeRate?: number; // 1.5 or 2.0
  overtimeApprovalEmail?: string;
  
  // 3.8 Non-Billable Time
  billable: boolean;
  category?: "Project" | "Admin" | "Business Development" | "Training" | "Other";
  costCenter?: string;
  internalProject?: string;
  
  description: string;
  status: "draft" | "pending_review" | "submitted" | "pending_client_approval" | "pending_accounting_approval" | "approved" | "rejected";
  weekEnding: string;
  
  // Entry type
  entryType: "manual" | "invoice" | "api_import";
  invoiceFileName?: string;
  invoiceFileUrl?: string;
  clientSigned?: boolean;
  requiresApproval?: boolean;
  
  // OCR data
  extractedData?: any;
  ocrProcessed?: boolean;
  ocrConfidence?: number;
  reviewedByEmployee?: boolean;
  autoMatched?: boolean;
  matchedToProjectId?: string;
  
  // 3.4 Exceptions
  exceptions: TimesheetException[];
  hasExceptions: boolean;
  
  // 3.6 Compliance
  complianceValidation?: ComplianceValidation;
  complianceValid: boolean;
  
  // 3.3 Approval workflow
  currentApprovalStage?: "employee" | "client" | "accounting";
  approvalWorkflow?: ApprovalWorkflow;
  
  // 3.5 Invoicing
  invoiceId?: string;
  invoiced: boolean;
  invoicedAt?: string;
  
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

// 3.4 Exceptions
export interface TimesheetException {
  id: string;
  timesheetId: string;
  type: "missing_approval" | "po_exceeded" | "invalid_assignment" | "overtime_no_approval" | "compliance_failure" | "overlapping_hours";
  severity: "warning" | "error" | "critical";
  message: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: string;
}

// 3.6 Compliance Validation
export interface ComplianceValidation {
  timesheetId: string;
  validations: {
    immigrationStatus: {
      valid: boolean;
      message?: string;
      expiryDate?: string;
    };
    workLocation: {
      valid: boolean;
      message?: string;
      activeLicenses: string[];
    };
    poStatus: {
      valid: boolean;
      message?: string;
      poUtilization: number;
      poLimit: number;
    };
  };
  overallValid: boolean;
  blockedAt?: string;
  validatedAt: string;
}

// 3.3 Approval Workflow
export interface ApprovalWorkflow {
  id: string;
  timesheetId: string;
  currentStage: number;
  totalStages: number;
  stages: ApprovalStage[];
  history: ApprovalHistory[];
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface ApprovalStage {
  stage: number;
  name: "employee" | "client" | "accounting";
  approverRole: string;
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  status: "pending" | "approved" | "rejected" | "skipped";
  required: boolean;
  delegatedTo?: string;
  delegatedToName?: string;
}

export interface ApprovalHistory {
  id: string;
  timesheetId: string;
  workflowId: string;
  stage: number;
  stageName: string;
  action: "submitted" | "approved" | "rejected" | "delegated";
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  comments?: string;
  timestamp: string;
  ipAddress?: string;
}

// 3.2 Employee Assignment
export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  
  poNumber: string;
  poLimit: number;
  poUtilized: number;
  poRemaining: number;
  poStartDate: string;
  poEndDate: string;
  poStatus: "active" | "inactive" | "expired" | "exceeded";
  
  billingRate: number;
  billingType: "Hourly" | "Fixed Fee" | "Milestone";
  workLocation: "Remote" | "Onsite" | "Hybrid";
  
  approvalWorkflowTemplate: string;
  clientApproverId?: string;
  clientApproverEmail?: string;
  
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// 3.5 Invoicing
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  poId?: string;
  poNumber?: string;
  
  period: {
    startDate: string;
    endDate: string;
    type: "weekly" | "bi-weekly" | "semi-monthly" | "monthly";
  };
  
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  
  status: "draft" | "pending" | "sent" | "paid" | "overdue" | "cancelled";
  
  timesheetIds: string[];
  expenseIds: string[];
  
  generatedAt: string;
  generatedBy: string;
  sentAt?: string;
  paidAt?: string;
  dueDate: string;
  
  accountingExportedAt?: string;
  payrollLinkedAt?: string;
  
  notes?: string;
  terms?: string;
  
  pdfUrl?: string;
  excelUrl?: string;
  quickbooksId?: string;
  xeroId?: string;
  
  manuallyEdited: boolean;
  editedBy?: string;
  editedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  type: "timesheet" | "expense" | "reimbursement" | "tax" | "discount" | "other";
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  
  timesheetId?: string;
  expenseId?: string;
  
  taxable: boolean;
  billable: boolean;
}

// 3.7 Expense & Reimbursement
export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  timesheetId?: string;
  invoiceId?: string;
  assignmentId?: string;
  
  category: "Travel" | "Meals" | "Lodging" | "Supplies" | "Equipment" | "Other";
  description: string;
  amount: number;
  date: string;
  
  receiptUrl?: string;
  receiptUploaded: boolean;
  receiptFileName?: string;
  
  status: "draft" | "submitted" | "approved" | "rejected" | "reimbursed";
  
  billableToClient: boolean;
  clientId?: string;
  
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  reimbursedAt?: string;
  reimbursedAmount?: number;
  
  auditTagged: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// 3.11 Notifications
export interface Notification {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  
  type: "reminder" | "alert" | "confirmation" | "approval" | "warning" | "info";
  category: "timesheet" | "invoice" | "expense" | "approval" | "exception" | "compliance" | "po_limit";
  
  title: string;
  message: string;
  
  actionUrl?: string;
  actionLabel?: string;
  
  priority: "low" | "medium" | "high" | "urgent";
  
  channels: ("email" | "sms" | "in_app")[];
  emailSent: boolean;
  emailSentAt?: string;
  smsSent: boolean;
  smsSentAt?: string;
  
  read: boolean;
  readAt?: string;
  
  relatedEntityId?: string;
  relatedEntityType?: string;
  
  metadata?: Record<string, any>;
  
  createdAt: string;
  expiresAt?: string;
}

// Dashboard Analytics Types
export interface TimesheetSummaryMetrics {
  totalSubmitted: number;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
  submissionRate: number;
  approvalRate: number;
  delayedEntries: number;
  missingTimesheets: number;
  averageApprovalTime: number; // in hours
}

export interface UtilizationMetrics {
  employeeId?: string;
  employeeName?: string;
  departmentId?: string;
  departmentName?: string;
  clientId?: string;
  clientName?: string;
  
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePercentage: number;
  
  regularHours: number;
  overtimeHours: number;
  
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface RevenueMetrics {
  clientId?: string;
  clientName?: string;
  poId?: string;
  poNumber?: string;
  
  period: {
    month: number;
    year: number;
    quarter?: number;
  };
  
  revenue: number;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  
  totalHours: number;
  averageRate: number;
  
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}

export interface ExceptionMetrics {
  totalExceptions: number;
  criticalExceptions: number;
  errorExceptions: number;
  warningExceptions: number;
  
  exceptionsByType: Record<string, number>;
  
  unresolved: number;
  resolved: number;
  
  averageResolutionTime: number; // in hours
}

export interface OvertimeMetrics {
  totalOvertimeHours: number;
  totalOvertimeCost: number;
  employeeCount: number;
  
  approvedOvertimeHours: number;
  unapprovedOvertimeHours: number;
  
  byEmployee: {
    employeeId: string;
    employeeName: string;
    overtimeHours: number;
    overtimeCost: number;
  }[];
  
  byClient: {
    clientId: string;
    clientName: string;
    overtimeHours: number;
    overtimeCost: number;
  }[];
  
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface AIAccuracyMetrics {
  totalDocumentsProcessed: number;
  successfulExtractions: number;
  failedExtractions: number;
  
  averageConfidence: number;
  medianConfidence: number;
  
  accuracyRate: number;
  errorRate: number;
  
  confidenceBuckets: {
    high: number; // 90-100%
    medium: number; // 70-89%
    low: number; // <70%
  };
  
  fieldAccuracy: {
    employeeName: number;
    client: number;
    weekEnding: number;
    hours: number;
    approverEmail: number;
  };
  
  period: {
    startDate: string;
    endDate: string;
  };
}

// Client Portal Types
export interface ClientPortalUser {
  id: string;
  clientId: string;
  email: string;
  name: string;
  role: "approver" | "viewer" | "admin";
  
  canApprove: boolean;
  canDownloadInvoices: boolean;
  canExportData: boolean;
  canViewReports: boolean;
  
  active: boolean;
  
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPortalSettings {
  clientId: string;
  
  // White-label settings
  whiteLabelEnabled: boolean;
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  
  // Notification preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  
  // Export preferences
  defaultExportFormat: "csv" | "excel" | "pdf";
  
  // Integration settings
  fieldglassEnabled: boolean;
  beelineEnabled: boolean;
  workdayEnabled: boolean;
  
  fieldglassApiKey?: string;
  beelineApiKey?: string;
  workdayApiKey?: string;
  
  // Approval workflow settings
  autoApproveClientSigned: boolean;
  requireDualApproval: boolean;
  approvalTimeoutDays: number;
  
  updatedAt: string;
}
