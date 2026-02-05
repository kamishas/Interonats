-- ============================================
-- HR AUTOMATION PLATFORM - DATABASE SCHEMA
-- ============================================
-- Technology: Supabase (PostgreSQL)
-- Architecture: Key-Value Store + Auth + Storage
-- Version: 1.0
-- Last Updated: 2024-01-05
-- ============================================

-- ============================================
-- 1. KEY-VALUE STORE TABLE
-- ============================================
-- This is the primary data storage table
-- All entities are stored as JSON in a key-value format

CREATE TABLE IF NOT EXISTS kv_store_f8517b5b (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix ON kv_store_f8517b5b (key text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_kv_store_value_gin ON kv_store_f8517b5b USING GIN (value);
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at ON kv_store_f8517b5b (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kv_store_updated_at ON kv_store_f8517b5b (updated_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kv_store_updated_at 
    BEFORE UPDATE ON kv_store_f8517b5b 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE kv_store_f8517b5b IS 'Primary key-value storage for all application entities';
COMMENT ON COLUMN kv_store_f8517b5b.key IS 'Unique identifier in format: entity-type:entity-id';
COMMENT ON COLUMN kv_store_f8517b5b.value IS 'JSON object containing entity data';

-- ============================================
-- 2. KEY NAMING PATTERNS
-- ============================================
-- The 'key' column follows these patterns:

-- EMPLOYEES
-- Pattern: employee:{uuid}
-- Example: employee:550e8400-e29b-41d4-a716-446655440000

-- CLIENTS
-- Pattern: client:{uuid}
-- Example: client:c7f9a8b2-1234-5678-90ab-cdef12345678

-- IMMIGRATION CASES
-- Pattern: immigration-case:{uuid}
-- Example: immigration-case:i9876543-21ab-cdef-0123-456789abcdef

-- VISA FILINGS
-- Pattern: visa-filing:{uuid}
-- Example: visa-filing:vf123456-7890-abcd-ef01-234567890abc

-- EMPLOYEE DOCUMENTS
-- Pattern: employee-document:{uuid}
-- Example: employee-document:ed987654-3210-fedc-ba98-765432109876

-- CLIENT DOCUMENTS
-- Pattern: client-document:{uuid}
-- Example: client-document:cd111111-2222-3333-4444-555555555555

-- DOCUMENT REQUESTS
-- Pattern: document-request:{uuid}
-- Example: document-request:dr666666-7777-8888-9999-000000000000

-- TIMESHEETS
-- Pattern: timesheet:{uuid}
-- Example: timesheet:ts123456-7890-1234-5678-901234567890

-- INVOICES
-- Pattern: invoice:{uuid}
-- Example: invoice:inv12345-6789-0123-4567-890123456789

-- LEAVE REQUESTS
-- Pattern: leave-request:{uuid}
-- Example: leave-request:lr111111-2222-3333-4444-555555555555

-- PERFORMANCE REVIEWS
-- Pattern: performance-review:{uuid}
-- Example: performance-review:pr999999-8888-7777-6666-555555555555

-- BUSINESS LICENSES
-- Pattern: business-license:{uuid}
-- Example: business-license:bl777777-6666-5555-4444-333333333333

-- CERTIFICATIONS
-- Pattern: certification:{uuid}
-- Example: certification:cert1234-5678-9012-3456-789012345678

-- VENDORS
-- Pattern: vendor:{uuid}
-- Example: vendor:v0000000-1111-2222-3333-444444444444

-- CONTRACTORS
-- Pattern: contractor:{uuid}
-- Example: contractor:cn555555-6666-7777-8888-999999999999

-- PROJECT ASSIGNMENTS
-- Pattern: project-assignment:{uuid}
-- Example: project-assignment:pa123456-7890-abcd-ef12-345678901234

-- USERS
-- Pattern: user:{email}
-- Example: user:john.doe@company.com

-- DASHBOARD SETTINGS
-- Pattern: dashboard-settings:{userId}
-- Example: dashboard-settings:u1234567-890a-bcde-f012-3456789abcde

-- SUBSCRIPTION CONFIG
-- Pattern: subscription-config
-- Value: Single global configuration object

-- PURCHASE ORDERS
-- Pattern: purchase-order:{uuid}
-- Example: purchase-order:po123456-7890-1234-5678-901234567890

-- CLIENT CONTACTS
-- Pattern: client-contact:{uuid}
-- Example: client-contact:cc987654-3210-fedc-ba98-765432109876

-- ============================================
-- 3. SUPABASE AUTH SCHEMA (Built-in)
-- ============================================
-- Supabase provides these auth tables automatically
-- We only store user_id references and email in our KV store

-- auth.users (managed by Supabase)
-- ├── id (UUID) - Primary key
-- ├── email (TEXT) - User email
-- ├── encrypted_password (TEXT)
-- ├── email_confirmed_at (TIMESTAMP)
-- ├── created_at (TIMESTAMP)
-- ├── updated_at (TIMESTAMP)
-- └── raw_user_meta_data (JSONB) - Stores { firstName, lastName, role }

-- Our application stores additional user data in KV store:
-- Key: user:{email}
-- Value: {
--   "id": "uuid",
--   "email": "user@example.com",
--   "role": "HR Manager",
--   "firstName": "John",
--   "lastName": "Doe",
--   "isActive": true,
--   "createdAt": "2024-01-01T00:00:00Z",
--   "lastLogin": "2024-01-05T10:30:00Z"
-- }

-- ============================================
-- 4. SUPABASE STORAGE BUCKETS
-- ============================================
-- File storage is handled by Supabase Storage
-- We create these buckets programmatically:

-- Bucket: make-f8517b5b-employee-documents
-- Privacy: Private (requires authentication)
-- Path Structure:
--   /employee-{id}/
--     /government-id/
--       document-{timestamp}.pdf
--     /work-authorization/
--       ead-{timestamp}.pdf
--     /address-proof/
--       utility-bill-{timestamp}.pdf
--     /forms/
--       i9-{timestamp}.pdf
--       w4-{timestamp}.pdf
--     /other/
--       document-{timestamp}.pdf

-- Bucket: make-f8517b5b-client-documents
-- Privacy: Private
-- Path Structure:
--   /client-{id}/
--     /msa/
--       msa-v1-{timestamp}.pdf
--     /sow/
--       sow-{project}-{timestamp}.pdf
--     /po/
--       po-{number}-{timestamp}.pdf
--     /insurance/
--       coi-{timestamp}.pdf
--     /other/
--       document-{timestamp}.pdf

-- Bucket: make-f8517b5b-immigration-documents
-- Privacy: Private
-- Path Structure:
--   /case-{id}/
--     /filings/
--       h1b-petition-{timestamp}.pdf
--     /approvals/
--       approval-notice-{timestamp}.pdf
--     /correspondence/
--       rfe-{timestamp}.pdf
--     /evidence/
--       document-{timestamp}.pdf

-- ============================================
-- 5. JSON VALUE SCHEMAS
-- ============================================
-- Below are the JSON schemas for each entity type
-- stored in the 'value' column of kv_store_f8517b5b

-- ============================================
-- 5.1 EMPLOYEE
-- ============================================
-- Key: employee:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "firstName": "string",
  "lastName": "string",
  "email": "string (unique)",
  "phone": "string",
  "dateOfBirth": "string (ISO date)",
  "address": "string",
  "city": "string",
  "state": "string (2-letter code)",
  "zipCode": "string",
  "homeState": "string (2-letter code)",
  "position": "string",
  "department": "string",
  "startDate": "string (ISO date)",
  "salary": "string",
  "employmentType": "enum: full-time | part-time | W2 | 1099 | contractor",
  "immigrationStatus": "string",
  "visaType": "string?",
  "visaExpiry": "string (ISO date)?",
  "workPermitNumber": "string?",
  "bankAccount": "string",
  "taxId": "string (encrypted SSN)",
  "onboardingStatus": "enum: not-started | in-progress | completed | pending-review",
  "documentsUploaded": "boolean",
  "complianceComplete": "boolean",
  "canAccessTimesheets": "boolean",
  "profileCompleted": "boolean",
  "createdAt": "string (ISO timestamp)",
  
  "workflow": {
    "currentStage": "enum: initiation | data-collection | verification | payroll-setup | licensing | classification | finalization | completed",
    "tasks": [
      {
        "id": "string (uuid)",
        "taskName": "string",
        "department": "enum: HR | Recruiter | Accounting | Immigration | Licensing",
        "status": "enum: pending | in-progress | completed | blocked",
        "assignedTo": "string?",
        "dueDate": "string (ISO date)?",
        "completedDate": "string (ISO timestamp)?",
        "completedBy": "string?",
        "notes": "string?",
        "dependencies": ["string (task ids)"],
        "blockedReason": "string?"
      }
    ],
    "departmentApprovals": [
      {
        "department": "enum: HR | Recruiter | Accounting | Immigration | Licensing",
        "status": "enum: pending | approved | rejected",
        "approvedBy": "string?",
        "approvedDate": "string (ISO timestamp)?",
        "notes": "string?"
      }
    ],
    "initiatedBy": "string?",
    "initiatedDate": "string (ISO timestamp)?",
    "completedDate": "string (ISO timestamp)?",
    
    "projectRateConfirmed": "boolean?",
    "clientConfirmationSent": "boolean?",
    "confirmationReceivedDate": "string (ISO timestamp)?",
    "congratulationsEmailSent": "boolean?",
    "homeAddressReceived": "boolean?",
    "workAuthorizationReceived": "boolean?",
    "governmentIdReceived": "boolean?",
    "offerLetterIssued": "boolean?",
    "ndaSigned": "boolean?",
    "ndaSignedDate": "string (ISO timestamp)?",
    "bankAccountReceived": "boolean?",
    "emergencyContactReceived": "boolean?",
    "addressProofReceived": "boolean?",
    "certificationsReceived": "boolean?",
    "socialSecurityCardReceived": "boolean?",
    "allMandatoryDocumentsCollected": "boolean?",
    "documentCollectionCompleteDate": "string (ISO timestamp)?",
    "documentVerificationComplete": "boolean?",
    "pendingDocumentRequests": "number",
    "i9Initiated": "boolean?",
    "i9CompletedDate": "string (ISO timestamp)?",
    "eVerifyCompleted": "boolean?",
    "immigrationNotificationSent": "boolean?",
    "immigrationCaseCreated": "boolean?",
    "immigrationCaseId": "string (uuid)?",
    "immigrationCaseApproved": "boolean?",
    "immigrationApprovalDate": "string (ISO timestamp)?",
    "employeeHandbookAssigned": "boolean?",
    "policiesAssigned": "boolean?",
    "clientRequirementsCompleted": "boolean?",
    "adpOnboardingInitiated": "boolean?",
    "adpOnboardingCompleted": "boolean?",
    "payRateValidated": "boolean?",
    "payScheduleValidated": "boolean?",
    "deductionsValidated": "boolean?",
    "stateComplianceValidated": "boolean?",
    "requiresNewStateLicensing": "boolean?",
    "newStateIdentified": "string (2-letter code)?",
    "stateWithholdingAccountCreated": "boolean?",
    "unemploymentInsuranceAccountCreated": "boolean?",
    "workersCompPolicyCreated": "boolean?",
    "employeeClassification": "enum: billable | non-billable | operational",
    "linkedClientId": "string (uuid)?",
    "linkedClientName": "string?",
    "linkedPONumber": "string?",
    "internalProjectId": "string?",
    "departmentAssignment": "string?",
    "classificationVerified": "boolean?"
  },
  
  "classification": "enum: billable | non-billable | operational",
  "isBillable": "boolean?",
  "isOperational": "boolean?",
  
  "projectAssignments": [
    {
      "id": "string (uuid)",
      "clientId": "string (uuid)",
      "clientName": "string",
      "projectName": "string",
      "poNumber": "string",
      "startDate": "string (ISO date)",
      "endDate": "string (ISO date)?",
      "billingRate": "number",
      "allocation": "number (0-100)",
      "status": "enum: Planning | Active | On Hold | Completed | Cancelled",
      "isPrimary": "boolean"
    }
  ],
  "activeProjectCount": "number",
  "primaryClientId": "string (uuid)?",
  "primaryClientName": "string?",
  
  "payrollId": "string?",
  "payrollStatus": "enum: not-setup | pending | active | suspended",
  "adpEmployeeId": "string?",
  "employeeNumber": "string (e.g., EMP-2024-001)",
  "managerId": "string (uuid)?",
  "managerName": "string?",
  
  "requiresImmigrationCase": "boolean?",
  "immigrationCaseId": "string (uuid)?",
  "immigrationCaseStatus": "string?",
  "immigrationTeamNotified": "boolean?",
  "immigrationNotificationDate": "string (ISO timestamp)?",
  "immigrationApprovalRequired": "boolean?"
}

-- ============================================
-- 5.2 CLIENT
-- ============================================
-- Key: client:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "name": "string",
  "legalName": "string",
  "ein": "string",
  "industry": "string",
  "status": "enum: Lead | Active | Inactive | Suspended | Terminated",
  
  "billingAddress": {
    "street": "string",
    "street2": "string?",
    "city": "string",
    "state": "string (2-letter)",
    "zipCode": "string",
    "country": "string"
  },
  
  "shippingAddress": {
    "street": "string",
    "street2": "string?",
    "city": "string",
    "state": "string (2-letter)",
    "zipCode": "string",
    "country": "string"
  },
  
  "primaryContact": {
    "id": "string (uuid)",
    "contactType": "enum: Legal | AP/Billing | Program/PM | VMS Portal | Timesheet Approver | General",
    "name": "string",
    "email": "string",
    "phone": "string?",
    "title": "string?",
    "isPrimary": "boolean",
    "canApproveTimesheets": "boolean",
    "canApproveInvoices": "boolean",
    "notificationPreferences": {
      "timesheets": "boolean",
      "invoices": "boolean",
      "compliance": "boolean"
    }
  },
  
  "additionalContacts": [
    "...same structure as primaryContact"
  ],
  
  "paymentTerms": "string (e.g., Net 30)",
  "timesheetCadence": "enum: Weekly | Bi-Weekly | Monthly",
  "invoiceMethod": "enum: Portal | Email | EDI",
  "currency": "enum: USD | EUR | GBP",
  
  "vmsPortal": "enum: None | Fieldglass | Beeline | Ariba | VMS One | IQNavigator | Other",
  "vmsPortalUrl": "string?",
  "vmsCredentials": "string (encrypted)?",
  
  "insuranceRequirements": {
    "generalLiability": "string?",
    "professionalLiability": "string?",
    "cyberEO": "string?",
    "workersComp": "string?"
  },
  
  "backgroundCheckRequired": "boolean",
  "drugTestRequired": "boolean",
  "securityClearance": "string?",
  "requiredTraining": ["string"],
  
  "activeEmployees": "number",
  "totalEmployees": "number",
  "totalRevenue": "number",
  
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.3 IMMIGRATION CASE
-- ============================================
-- Key: immigration-case:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "caseNumber": "string (e.g., IC-2024-001)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "visaType": "enum: H-1B | L-1A | L-1B | O-1 | TN | E-3 | H-4 | L-2 | F-1 | OPT | STEM OPT | Green Card | Other",
  "currentStatus": "string",
  "sponsorshipRequired": "boolean",
  "filingStatus": "enum: Planning | Preparing | RFE Issued | RFE Response Submitted | Filed | Approved | Denied | Withdrawn | Appeal",
  "assignedAttorney": "string?",
  "priority": "enum: Low | Medium | High | Critical",
  
  "caseOpenedDate": "string (ISO date)",
  "estimatedFilingDate": "string (ISO date)?",
  "actualFilingDate": "string (ISO date)?",
  "approvalDate": "string (ISO date)?",
  "expiryDate": "string (ISO date)?",
  
  "filings": [
    {
      "id": "string (uuid)",
      "filingType": "string",
      "filingStatus": "enum: Planning | Preparing | Filed | Approved | Denied",
      "filedDate": "string (ISO date)?",
      "approvalDate": "string (ISO date)?",
      "expiryDate": "string (ISO date)?",
      "receiptNumber": "string?",
      "documents": ["string (document ids)"],
      "governmentFee": "number",
      "attorneyFee": "number",
      "otherFees": "number",
      "totalCost": "number"
    }
  ],
  
  "workflow": {
    "currentStage": "string",
    "tasks": ["...task objects"],
    "milestones": ["...milestone objects"]
  },
  
  "totalCost": "number",
  "paidCost": "number",
  "pendingCost": "number",
  
  "dependents": [
    {
      "id": "string (uuid)",
      "name": "string",
      "relationship": "string",
      "dateOfBirth": "string (ISO date)",
      "visaType": "string",
      "status": "string"
    }
  ],
  
  "approvalStatus": "enum: pending | approved | rejected",
  "approvedBy": "string?",
  "approvedDate": "string (ISO timestamp)?",
  
  "notes": "string?",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.4 EMPLOYEE DOCUMENT
-- ============================================
-- Key: employee-document:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "documentType": "enum: Government ID | Driver License | Passport | Address Proof | Work Authorization | EAD Card | Green Card | Visa | I-94 | I-9 Form | W-4 Form | Direct Deposit Form | Emergency Contact | Social Security Card | Background Check | Drug Test Results | Certifications | Training Records | NDA | Offer Letter | Employment Contract | Other",
  "fileName": "string",
  "fileUrl": "string (Supabase Storage path)",
  "fileSize": "number (bytes)",
  "mimeType": "string",
  "uploadedBy": "string",
  "uploadedByEmail": "string",
  "uploadedAt": "string (ISO timestamp)",
  "expiryDate": "string (ISO date)?",
  "notes": "string?",
  
  "verificationStatus": "enum: pending | verified | rejected",
  "verifiedBy": "string?",
  "verifiedDate": "string (ISO timestamp)?",
  "rejectionReason": "string?",
  
  "fulfilledRequestId": "string (uuid)?",
  
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.5 DOCUMENT REQUEST
-- ============================================
-- Key: document-request:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "employeeEmail": "string",
  "documentType": "string (same as employee document types)",
  "dueDate": "string (ISO date)",
  "priority": "enum: low | medium | high | critical",
  "status": "enum: pending | uploaded | verified | rejected | overdue",
  "instructions": "string?",
  "requestedBy": "string",
  "requestedDate": "string (ISO timestamp)",
  "uploadedDocumentId": "string (uuid)?",
  "uploadedDate": "string (ISO timestamp)?",
  "fulfilledDate": "string (ISO timestamp)?",
  "reminderCount": "number",
  "lastReminderDate": "string (ISO timestamp)?",
  "notes": "string?"
}

-- ============================================
-- 5.6 TIMESHEET
-- ============================================
-- Key: timesheet:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "clientId": "string (uuid)",
  "clientName": "string",
  "projectId": "string (uuid)?",
  "projectName": "string?",
  "poNumber": "string?",
  
  "weekEnding": "string (ISO date)",
  "weekStarting": "string (ISO date)",
  
  "entries": [
    {
      "date": "string (ISO date)",
      "dayOfWeek": "string",
      "regularHours": "number",
      "overtimeHours": "number",
      "doubleTimeHours": "number?",
      "totalHours": "number",
      "description": "string",
      "isHoliday": "boolean?",
      "isPTO": "boolean?",
      "notes": "string?"
    }
  ],
  
  "totalRegularHours": "number",
  "totalOvertimeHours": "number",
  "totalDoubleTimeHours": "number?",
  "totalHours": "number",
  
  "billingRate": "number",
  "overtimeRate": "number?",
  "doubleTimeRate": "number?",
  
  "regularAmount": "number",
  "overtimeAmount": "number",
  "doubleTimeAmount": "number?",
  "totalAmount": "number",
  
  "status": "enum: draft | submitted | pending_client_approval | client_approved | pending_accounting_approval | accounting_approved | approved | rejected | invoiced | paid",
  
  "approvalWorkflow": {
    "id": "string (uuid)",
    "currentStage": "number",
    "totalStages": "number",
    "stages": [
      {
        "stageNumber": "number",
        "stageName": "string",
        "approverRole": "string",
        "status": "enum: pending | approved | rejected",
        "approvedBy": "string?",
        "approvedDate": "string (ISO timestamp)?",
        "comments": "string?"
      }
    ],
    "history": [
      {
        "action": "string",
        "performedBy": "string",
        "performedAt": "string (ISO timestamp)",
        "fromStatus": "string",
        "toStatus": "string",
        "comments": "string?"
      }
    ]
  },
  
  "submittedDate": "string (ISO timestamp)?",
  "submittedBy": "string?",
  "clientApprovedBy": "string?",
  "clientApprovedDate": "string (ISO timestamp)?",
  "clientComments": "string?",
  "accountingApprovedBy": "string?",
  "accountingApprovedDate": "string (ISO timestamp)?",
  "accountingComments": "string?",
  "rejectedBy": "string?",
  "rejectedDate": "string (ISO timestamp)?",
  "rejectionReason": "string?",
  "invoiceId": "string (uuid)?",
  "invoiceDate": "string (ISO date)?",
  
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.7 INVOICE
-- ============================================
-- Key: invoice:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "invoiceNumber": "string (e.g., INV-2024-001)",
  "clientId": "string (uuid)",
  "clientName": "string",
  "invoiceDate": "string (ISO date)",
  "dueDate": "string (ISO date)",
  "status": "enum: draft | sent | viewed | approved | paid | overdue | cancelled",
  
  "lineItems": [
    {
      "id": "string (uuid)",
      "timesheetId": "string (uuid)?",
      "employeeId": "string (uuid)",
      "employeeName": "string",
      "description": "string",
      "weekEnding": "string (ISO date)",
      "regularHours": "number",
      "overtimeHours": "number",
      "totalHours": "number",
      "rate": "number",
      "amount": "number"
    }
  ],
  
  "subtotal": "number",
  "taxRate": "number",
  "taxAmount": "number",
  "totalAmount": "number",
  "currency": "enum: USD | EUR | GBP",
  
  "paymentTerms": "string",
  "paymentMethod": "string?",
  "paidDate": "string (ISO date)?",
  "paidAmount": "number?",
  
  "notes": "string?",
  "createdBy": "string",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.8 BUSINESS LICENSE
-- ============================================
-- Key: business-license:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "state": "string (2-letter code)",
  "stateName": "string",
  "category": "enum: Employment | Tax | Insurance | Professional | Business | Industry-Specific",
  "licenseType": "string",
  "accountNumber": "string?",
  
  "effectiveDate": "string (ISO date)",
  "expiryDate": "string (ISO date)?",
  "applicationDate": "string (ISO date)?",
  "approvalDate": "string (ISO date)?",
  
  "status": "enum: Active | Pending | Expired | Suspended | Cancelled",
  
  "renewalRequired": "boolean",
  "renewalDate": "string (ISO date)?",
  "renewalFrequency": "enum: Annual | Bi-Annual | Every 3 Years | Every 5 Years",
  "autoRenew": "boolean",
  
  "reminderEnabled": "boolean",
  "reminderFrequency": "enum: Weekly | Bi-Weekly | Monthly | Quarterly",
  "reminderDaysBefore": "number",
  "lastReminderDate": "string (ISO timestamp)?",
  "nextReminderDate": "string (ISO date)?",
  
  "applicationFee": "number?",
  "renewalFee": "number?",
  "annualFee": "number?",
  
  "documentUrl": "string?",
  "certificateUrl": "string?",
  
  "agencyName": "string?",
  "agencyContact": "string?",
  "agencyPhone": "string?",
  "agencyWebsite": "string?",
  
  "linkedEmployees": ["string (employee ids)"],
  
  "notes": "string?",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.9 PROJECT ASSIGNMENT
-- ============================================
-- Key: project-assignment:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "clientId": "string (uuid)",
  "clientName": "string",
  "projectName": "string",
  "projectCode": "string?",
  "poNumber": "string",
  
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)?",
  "actualEndDate": "string (ISO date)?",
  
  "billingRate": "number",
  "currency": "enum: USD | EUR | GBP",
  "rateType": "enum: Hourly | Daily | Fixed",
  
  "allocation": "number (0-100)",
  "hoursPerWeek": "number?",
  
  "status": "enum: Planning | Active | On Hold | Completed | Cancelled",
  "isPrimary": "boolean",
  
  "clientApprovalRequired": "boolean",
  "clientApprovedBy": "string?",
  "clientApprovedDate": "string (ISO timestamp)?",
  
  "totalHoursWorked": "number?",
  "totalInvoiced": "number?",
  "lastTimesheetDate": "string (ISO date)?",
  
  "notes": "string?",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.10 PURCHASE ORDER
-- ============================================
-- Key: purchase-order:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "clientId": "string (uuid)",
  "engagementId": "string (uuid)?",
  "poNumber": "string",
  "poType": "enum: Initial | Extension | Amendment | Incremental Funding",
  
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)",
  "totalAmount": "number",
  "spentAmount": "number",
  "remainingAmount": "number",
  "currency": "enum: USD | EUR | GBP",
  
  "status": "enum: Draft | Pending Approval | Active | Fully Utilized | Expired | Cancelled",
  
  "documentId": "string (uuid)?",
  "linkedSOWId": "string (uuid)?",
  "linkedMSAId": "string (uuid)?",
  "parentPOId": "string (uuid)?",
  "relatedPOIds": ["string (uuid)"],
  
  "allocatedEmployees": ["string (employee ids)"],
  
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.11 VENDOR
-- ============================================
-- Key: vendor:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "vendorNumber": "string (e.g., VEN-2024-001)",
  "name": "string",
  "legalName": "string",
  "ein": "string?",
  "status": "enum: Active | Inactive | Suspended | Terminated",
  
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  
  "primaryContact": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "title": "string?"
  },
  
  "category": "string",
  "servicesProvided": ["string"],
  
  "paymentTerms": "string",
  "preferredPaymentMethod": "string",
  
  "w9OnFile": "boolean",
  "coiOnFile": "boolean",
  "msaOnFile": "boolean",
  
  "subvendors": ["string (subvendor ids)"],
  "activeContractors": "number",
  "totalSpend": "number",
  
  "notes": "string?",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.12 CONTRACTOR
-- ============================================
-- Key: contractor:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "contractorNumber": "string (e.g., CON-2024-001)",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "ssn": "string (encrypted)?",
  "ein": "string?",
  
  "vendorId": "string (uuid)?",
  "vendorName": "string?",
  "subvendorId": "string (uuid)?",
  "subvendorName": "string?",
  
  "contractorType": "enum: 1099 | Corp-to-Corp | W2 via Vendor",
  "status": "enum: Active | Inactive | On Leave | Terminated",
  
  "skills": ["string"],
  "rate": "number",
  "rateType": "enum: Hourly | Daily | Project",
  
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)?",
  
  "clientId": "string (uuid)?",
  "clientName": "string?",
  
  "w9OnFile": "boolean",
  "backgroundCheckComplete": "boolean",
  "ndaSigned": "boolean",
  
  "notes": "string?",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.13 CERTIFICATION
-- ============================================
-- Key: certification:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "certificationName": "string",
  "issuingOrganization": "string",
  "certificationNumber": "string?",
  "dateObtained": "string (ISO date)",
  "expiryDate": "string (ISO date)?",
  "status": "enum: Active | Expiring Soon | Expired | Renewed",
  "renewalRequired": "boolean",
  "documentUrl": "string?",
  "notes": "string?",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.14 LEAVE REQUEST
-- ============================================
-- Key: leave-request:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "leaveType": "enum: PTO | Sick | Bereavement | Jury Duty | Parental | Military | FMLA | Other",
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)",
  "totalDays": "number",
  "status": "enum: pending | approved | rejected | cancelled",
  "reason": "string?",
  "approvedBy": "string?",
  "approvedDate": "string (ISO timestamp)?",
  "rejectionReason": "string?",
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.15 PERFORMANCE REVIEW
-- ============================================
-- Key: performance-review:{uuid}
-- Value Schema:
{
  "id": "string (uuid)",
  "employeeId": "string (uuid)",
  "employeeName": "string",
  "reviewerId": "string (uuid)",
  "reviewerName": "string",
  "reviewPeriod": "string",
  "reviewDate": "string (ISO date)",
  "status": "enum: draft | completed | acknowledged",
  
  "ratings": {
    "overallRating": "number (1-5)",
    "technicalSkills": "number (1-5)",
    "communication": "number (1-5)",
    "teamwork": "number (1-5)",
    "initiative": "number (1-5)",
    "reliability": "number (1-5)"
  },
  
  "strengths": "string",
  "areasForImprovement": "string",
  "goals": ["string"],
  "recommendations": "string",
  
  "employeeComments": "string?",
  "acknowledgedDate": "string (ISO timestamp)?",
  
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)?"
}

-- ============================================
-- 5.16 USER (Auth)
-- ============================================
-- Key: user:{email}
-- Value Schema:
{
  "id": "string (uuid)",
  "email": "string (unique)",
  "role": "enum: Admin | HR Manager | Recruiter | Accounting Manager | Accounting Team | Immigration Manager | Immigration Team | Licensing Manager | Licensing Team | Client Contact | Employee/Consultant",
  "firstName": "string",
  "lastName": "string",
  "isActive": "boolean",
  "createdAt": "string (ISO timestamp)",
  "lastLogin": "string (ISO timestamp)?"
}

-- ============================================
-- 5.17 SUBSCRIPTION CONFIG
-- ============================================
-- Key: subscription-config
-- Value Schema:
{
  "isActive": "boolean",
  "planType": "enum: free | starter | professional | enterprise",
  "billingCycle": "enum: monthly | annual",
  "maxEmployees": "number",
  "maxClients": "number",
  "maxUsers": "number",
  "features": {
    "employeeOnboarding": "boolean",
    "clientManagement": "boolean",
    "immigration": "boolean",
    "businessLicensing": "boolean",
    "timesheets": "boolean",
    "invoices": "boolean",
    "advancedReporting": "boolean",
    "apiAccess": "boolean",
    "customBranding": "boolean"
  },
  "pricing": {
    "basePrice": "number",
    "perEmployeeCost": "number",
    "perClientCost": "number"
  },
  "currentUsage": {
    "employees": "number",
    "clients": "number",
    "users": "number"
  },
  "updatedAt": "string (ISO timestamp)"
}

-- ============================================
-- 6. SAMPLE QUERIES
-- ============================================

-- Get all employees
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'employee:%';

-- Get all employees in onboarding
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'employee:%' 
  AND value->>'onboardingStatus' = 'in-progress';

-- Get all active clients
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'client:%' 
  AND value->>'status' = 'Active';

-- Get all pending timesheets
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'timesheet:%' 
  AND value->>'status' IN ('submitted', 'pending_client_approval', 'pending_accounting_approval');

-- Get all immigration cases expiring soon
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'immigration-case:%' 
  AND (value->>'expiryDate')::date <= CURRENT_DATE + INTERVAL '90 days';

-- Get all business licenses expiring soon
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'business-license:%' 
  AND (value->>'expiryDate')::date <= CURRENT_DATE + INTERVAL '30 days';

-- Get all pending document requests
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'document-request:%' 
  AND value->>'status' = 'pending';

-- Get employee by email
SELECT * FROM kv_store_f8517b5b 
WHERE key LIKE 'employee:%' 
  AND value->>'email' = 'john@example.com';

-- Count employees by classification
SELECT 
  value->>'classification' as classification,
  COUNT(*) as count
FROM kv_store_f8517b5b 
WHERE key LIKE 'employee:%'
  AND value->>'classification' IS NOT NULL
GROUP BY value->>'classification';

-- Get all employees for a specific client
SELECT e.* FROM kv_store_f8517b5b e
WHERE e.key LIKE 'employee:%'
  AND e.value->'projectAssignments' @> '[{"clientId": "client-uuid-here"}]'::jsonb;

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- Index for efficient key prefix searching
CREATE INDEX IF NOT EXISTS idx_kv_employee_keys 
ON kv_store_f8517b5b (key) 
WHERE key LIKE 'employee:%';

CREATE INDEX IF NOT EXISTS idx_kv_client_keys 
ON kv_store_f8517b5b (key) 
WHERE key LIKE 'client:%';

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_employee_status 
ON kv_store_f8517b5b ((value->>'onboardingStatus')) 
WHERE key LIKE 'employee:%';

CREATE INDEX IF NOT EXISTS idx_timesheet_status 
ON kv_store_f8517b5b ((value->>'status')) 
WHERE key LIKE 'timesheet:%';

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_immigration_expiry 
ON kv_store_f8517b5b (((value->>'expiryDate')::date)) 
WHERE key LIKE 'immigration-case:%';

CREATE INDEX IF NOT EXISTS idx_license_expiry 
ON kv_store_f8517b5b (((value->>'expiryDate')::date)) 
WHERE key LIKE 'business-license:%';

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on kv_store table
ALTER TABLE kv_store_f8517b5b ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Authenticated users can read all data" 
ON kv_store_f8517b5b 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy for service role (full access)
CREATE POLICY "Service role has full access" 
ON kv_store_f8517b5b 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 9. BACKUP & MAINTENANCE
-- ============================================

-- Vacuum table periodically for performance
VACUUM ANALYZE kv_store_f8517b5b;

-- Reindex if needed
REINDEX TABLE kv_store_f8517b5b;

-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('kv_store_f8517b5b')) as total_size,
  pg_size_pretty(pg_relation_size('kv_store_f8517b5b')) as table_size,
  pg_size_pretty(pg_indexes_size('kv_store_f8517b5b')) as indexes_size;

-- Count records by entity type
SELECT 
  CASE 
    WHEN key LIKE 'employee:%' THEN 'employees'
    WHEN key LIKE 'client:%' THEN 'clients'
    WHEN key LIKE 'timesheet:%' THEN 'timesheets'
    WHEN key LIKE 'immigration-case:%' THEN 'immigration_cases'
    WHEN key LIKE 'business-license:%' THEN 'business_licenses'
    WHEN key LIKE 'document-request:%' THEN 'document_requests'
    WHEN key LIKE 'employee-document:%' THEN 'employee_documents'
    ELSE 'other'
  END as entity_type,
  COUNT(*) as count
FROM kv_store_f8517b5b
GROUP BY entity_type
ORDER BY count DESC;

-- ============================================
-- END OF SCHEMA
-- ============================================
