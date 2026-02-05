export type WorkflowStage = 
  | 'hr-setup'        // HR creates employee record
  | 'employee-setup'  // Employee completes profile & uploads documents
  | 'hr-review'       // HR reviews employee submission
  | 'initiation'
  | 'data-collection'
  | 'verification'
  | 'payroll-setup'
  | 'licensing'
  | 'classification'
  | 'finalization'
  | 'completed';      // Onboarding complete

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export type EmployeeClassification = 'billable' | 'non-billable' | 'operational';

export interface WorkflowTask {
  id: string;
  taskName: string;
  workflowStage: WorkflowStage;
  department: 'HR' | 'Employee' | 'Recruiter' | 'Accounting' | 'Immigration' | 'Licensing';
  assignedDepartment: 'HR' | 'Employee'; // Kept for backward compatibility if used
  stage?: string;
  status: TaskStatus;
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  completedBy?: string;
  notes?: string;
  blockedReason?: string;
}

export interface DepartmentApproval {
  id: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  approvalDate?: string;
  notes?: string;
}

export interface OnboardingWorkflow {
  currentStage: WorkflowStage;
  tasks: WorkflowTask[];
  departmentApprovals: DepartmentApproval[];
  initiatedBy?: string;
  initiatedDate?: string;
  completedDate?: string;
  
  // HR Setup Stage
  hrSetupComplete?: boolean;
  hrSetupCompletedDate?: string;
  
  // Employee Setup Stage
  profileCompleted?: boolean;
  documentsUploaded?: boolean;
  employeeSetupCompleteDate?: string;
  
  // HR Review Stage
  hrReviewComplete?: boolean;
  hrReviewedBy?: string;
  hrReviewedDate?: string;
  hrReviewNotes?: string;
  
  // Classification (simplified)
  classificationVerified?: boolean;
  employeeClassification?: EmployeeClassification;

  // Additional workflow fields
  linkedClientId?: string;
  linkedClientName?: string;
  linkedPONumber?: string;
  internalProjectId?: string;
  departmentAssignment?: string;
  allMandatoryDocumentsCollected?: boolean;
  pendingDocumentRequests?: number;
  requiresNewStateLicensing?: boolean;
  stateWithholdingAccountCreated?: boolean;
}

// Immigration Document Request Types
export type DocumentRequestStatus = 'pending' | 'uploaded' | 'cancelled' | 'overdue' | 'verified' | 'requested' | 'requested_review';

export type OnboardingStatus = 'not-started' | 'in-progress' | 'pending-review' | 'completed';

export interface DocumentRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  documentType: string;
  description: string;
  requestedBy: string;
  requestedByName: string;
  requestedDate: string;
  dueDate?: string;
  status: DocumentRequestStatus;
  uploadedDate?: string;
  uploadedFileUrl?: string;
  notes?: string;
  module: 'immigration' | 'onboarding';
  mandatory?: boolean;
  priority?: 'low' | 'medium' | 'high';
  remindersSent?: number;
  blocksOnboarding?: boolean;
}
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  onboardingStatus: string;
  
  // Job Info
  position?: string;
  department?: string;
  startDate?: string;
  manager?: string;
  managerId?: string;
  employmentType?: string;
  classification?: string;
  eadRequired?: boolean;
  salary?: number;
  
  // Personal Info
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  homeState?: string;
  ssnEncrypted?: string;
  
  // Emergency Contacts
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>;
  
  // Documents & Compliance
  workAuthorizationDoc?: string;
  visaStatus?: string;
  profileCompleted?: boolean;
  onboardingDocuments?: any[]; // For onboarding-specific documents
  
  // Workflow
  needsHRApproval?: boolean;
  hrApproved?: boolean;
  workflow?: OnboardingWorkflow;
  
  // Additional Fields
  phone?: string;
  ssn?: string;
  clientId?: string;
  clientIds?: string[];
  clientNames?: string[];
  employeeId?: string;
  clientName?: string;
  purchaseOrder?: string;
  createdAt?: string;

  // Access Control
  canAccessTimesheets?: boolean;
  timesheetAccessGrantedAt?: string;
  classifiedBy?: string;
  classificationDate?: string;
  createdBy?: string;
  createdByRole?: string;
  eadFile?: any;
}

export type EmployeeDocumentType = 
  | 'Government-issued ID'
  | 'Drivers License'
  | 'State ID'
  | 'Passport Copy'
  | 'Address Proof'
  | 'Utility Bill'
  | 'Lease Agreement'
  | 'Bank Statement'
  | 'Work Authorization'
  | 'EAD Card'
  | 'Visa Documentation'
  | 'Green Card Copy'
  | 'I-94 Copy'
  | 'Direct Deposit Form'
  | 'Emergency Contact'
  | 'I-9'
  | 'W-4'
  | 'Social Security Card'
  | 'Professional Certification'
  | 'Resume'
  | 'Other';

export interface Client {
  id: string;
  name: string;
  legalName?: string;
  companyName: string; // Used in onboarding
  industry?: string;
  status: string;
  email?: string;
  phone?: string;
  address?: string;
  billingAddress?: any;
  shippingAddress?: any;
  contactPerson?: string;
  primaryContact?: any;
  additionalContacts?: any[];
  paymentTerms?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  rate?: string;
  onboardingStatus: OnboardingStatus;
  documentsComplete?: boolean;
  contractSigned?: boolean;
  canGenerateInvoices?: boolean;
  ein?: string;
  timesheetCadence?: string;
  invoiceMethod?: string;
  currency?: string;
  vmsPortal?: string;
  vmsPortalUrl?: string;
  activeEmployees?: number;
  totalEmployees?: number;
  totalRevenue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type VendorType = 'Staffing Agency' | 'IT Services' | 'Consulting' | 'Professional Services' | 'Equipment/Hardware' | 'Software/SaaS' | 'Other';
export type VendorStatus = 'Active' | 'Inactive' | 'Suspended' | 'Under Review' | 'Terminated';

export interface VendorContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactType: string;
  isPrimary: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  companyName: string;
  legalName: string;
  taxId: string;
  status: VendorStatus;
  vendorType: VendorType;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  currency?: 'USD' | 'EUR' | 'GBP';
  isStaffingAgency?: boolean;
  providesContractors?: boolean;
  clientId?: string;
  clientName?: string;
  rating?: number;
  performanceRating?: number;
  hasComplianceIssues?: boolean;
  hasExpiringDocs?: boolean;
  activeContractorCount?: number;
  activeProjects?: number;
  contacts: VendorContact[];
  clientIds?: string[];
  clientNames?: string[];
  isActive?: boolean;
  notes?: string;
}

export interface Subvendor extends Vendor {
  parentVendorId: string;
  parentVendorName: string;
  tier: number;
  activeContractorCount?: number;
  activeProjects?: number;
  isActive?: boolean;
}

export interface ImmigrationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  visaType: string;
  currentStatus: string;
  filingStatus: string;
  caseNumber?: string;
  expiryDate?: string;
  filings?: any[];
  dependents?: any[];
  notes?: string;
  createdAt: string;
}

export interface ProjectAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  clientId: string;
  clientName: string;
  projectName: string;
  poNumber: string;
  startDate: string;
  endDate?: string;
  billingRate: number;
  status: string;
}

export interface BusinessLicense {
  id: string;
  state: string;
  category: string;
  licenseType: string;
  status: string;
  expiryDate?: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  project: string;
  client: string;
  regularHours?: number;
  overtimeHours?: number;
  holidayHours?: number;
  hours: number;
  status: string;
  billable: boolean;
  category?: string;
  costCenter?: string;
  description?: string;
  weekEnding?: string;
  assignmentId?: string;
  poNumber?: string;
}

export interface EmployeeDocument {
  id: string;
  onboardingId?: string;
  documentType: string;
  documentName: string;
  fileName: string;
  fileSize?: number;
  uploadDate: string;
  expiryDate?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'pending_review' | 'pending-review';
  status: 'active' | 'deleted' | 'pending' | 'pending_review' | 'pending-review';
  notes?: string;
  uploadedBy?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  rejectionReason?: string;
  storageUrl?: string;
  isWorkAuthDocument?: boolean;
}

// Leave Management Types
export type LeaveType = 
  | 'Vacation' 
  | 'Sick Leave' 
  | 'Personal Leave' 
  | 'Bereavement' 
  | 'Jury Duty' 
  | 'Parental Leave' 
  | 'Military Leave' 
  | 'Unpaid Leave' 
  | 'Compensatory Time';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

export interface PTOBalance {
  employeeId: string;
  vacationDays: number;
  vacationUsed: number;
  vacationRemaining: number;
  sickDays: number;
  sickUsed: number;
  sickRemaining: number;
  personalDays: number;
  personalUsed: number;
  personalRemaining: number;
}
