# Comprehensive Workflow Guide
## HR Timesheets Automation Platform

**Last Updated:** November 6, 2025  
**Version:** Post Client Portal Removal

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Workflows](#core-workflows)
4. [Module-Specific Workflows](#module-specific-workflows)
5. [Integration Points](#integration-points)

---

## System Overview

### Platform Capabilities
- **Employee Lifecycle Management**: Onboarding → Active Employment → Offboarding
- **Immigration Management**: Visa tracking, EAD monitoring, case management
- **Business Licensing**: Multi-state compliance, renewal tracking
- **Timesheet & Billing**: Multi-client assignments, project-based billing
- **Vendor Ecosystem**: Vendors, subvendors, and contractors
- **Document Management**: Secure storage with AES-256-GCM encryption
- **Compliance Tracking**: Automated alerts and approval workflows

### Navigation Structure
```
├── Dashboard (Home)
├── HR Actions (HR/Recruiter only)
│   └── Pending Approvals
├── Core Modules
│   ├── Employees
│   ├── Clients
│   ├── Projects
│   ├── Vendors
│   ├── Subvendors
│   └── Contractors
├── Immigration Management
├── Business Licensing
├── Timesheets
│   ├── View Timesheets
│   ├── Invoices
│   ├── Expenses
│   └── Analytics
└── Additional Modules
    ├── Notifications
    ├── Documents
    ├── Leave Management
    ├── Offboarding
    └── Performance
```

---

## User Roles & Permissions

### 1. Super Admin
**Access Level:** Full system access  
**Key Responsibilities:**
- System configuration
- Subscription management
- User role assignment
- All module access

**Typical Workflows:**
1. Configure subscription settings
2. Set up external integrations (USPS, SmartyStreets)
3. Manage all employees, clients, vendors
4. Override approvals when needed

---

### 2. Admin
**Access Level:** Near-complete access (no subscription config)  
**Key Responsibilities:**
- Employee management
- Client and vendor management
- Approval workflows
- Business licensing oversight

**Typical Workflows:**
1. Approve recruiter-submitted employees
2. Manage client relationships
3. Oversee licensing compliance
4. Review timesheet analytics

---

### 3. HR Manager
**Access Level:** Full employee management + documents  
**Key Responsibilities:**
- Employee lifecycle management
- Document approval
- Immigration case tracking
- Performance reviews

**Typical Workflows:**
1. Review pending employee approvals
2. Approve/reject uploaded documents
3. Monitor immigration deadlines
4. Manage leave requests
5. Conduct offboarding

---

### 4. Recruiter
**Access Level:** Employee creation + view-only other modules  
**Key Responsibilities:**
- Initiate employee onboarding
- Upload initial documents
- Submit for HR approval

**Typical Workflows:**
1. Create new employee record
2. Select visa status (triggers document requirements)
3. Upload resume + driver's license
4. Submit to HR for approval
5. Monitor approval status on dashboard

---

### 5. Payroll
**Access Level:** Timesheet management + financial modules  
**Key Responsibilities:**
- Timesheet approval
- Invoice generation
- Expense processing
- Billing rate management

**Typical Workflows:**
1. Review submitted timesheets
2. Approve timesheets (5-department approval chain)
3. Generate invoices
4. Process expense reports
5. Monitor billing analytics

---

### 6. Manager
**Access Level:** Employee view + timesheet approval  
**Key Responsibilities:**
- Team timesheet approval
- Leave request approval
- Performance tracking

**Typical Workflows:**
1. Approve team member timesheets
2. Review team performance metrics
3. Approve/deny leave requests
4. View team project assignments

---

### 7. Employee
**Access Level:** Personal profile + timesheet submission  
**Key Responsibilities:**
- Complete profile information
- Submit timesheets
- Upload required documents
- View personal immigration status

**Typical Workflows:**
1. **First Login:** Complete profile (personal info, emergency contact, banking)
2. **Weekly:** Submit timesheets
3. **As Needed:** Upload requested documents
4. **Ongoing:** Monitor immigration status and deadlines

---

### 8. Client (Role Exists, Portal Removed)
**Access Level:** Previously had portal access  
**Current Status:** Portal removed from navigation  
**Note:** Client functionality moved to Admin/HR management

---

## Core Workflows

---

## WORKFLOW 1: Employee Onboarding (Recruiter-Initiated)

### Stage 1: Recruiter Creates Employee
**Location:** Employees → Add New Employee (top right)

1. **Basic Information**
   - First Name, Last Name
   - Email (auto-generates login)
   - Phone Number
   - Department, Position, Role

2. **Visa Status Selection** ⚠️ CRITICAL
   - Select from 11 visa statuses:
     - US Citizen
     - Green Card Holder
     - H-1B Visa
     - L-1 Visa
     - E-3 Visa
     - TN Visa
     - O-1 Visa
     - F-1 OPT
     - F-1 STEM OPT
     - H-4 EAD
     - Other Work Authorization
   
   **Automation Triggered:**
   - If H-1B, L-1, E-3, TN, O-1, H-4 EAD → Prompts for **I-94 Number**
   - If F-1 OPT or STEM OPT → Prompts for **EAD beginning/end dates**
   - Auto-generates document collection requirements

3. **Document Upload**
   - **Resume** (Required for all new hires)
   - **Driver's License** (Required for all new hires)
   - Both files validated (PDF, JPG, PNG, max 10MB)

4. **Submit for HR Approval**
   - Employee status: `Pending HR Approval`
   - Employee marked with `needsHRApproval: true`
   - Cannot access timesheets until approved

---

### Stage 2: HR Reviews & Approves
**Location:** Dashboard → Pending HR Approvals widget

**HR Actions:**
1. Click "Review" on pending employee
2. View submitted information:
   - Basic details
   - Visa status
   - Uploaded resume
   - Uploaded driver's license
3. Decision:
   - ✅ **Approve** → Employee moves to active, gains timesheet access
   - ❌ **Reject** → Employee flagged, recruiter notified

**Approval Triggers:**
- Employee status → `Active`
- Timesheet access → Enabled
- Document collection → Initiated (if visa status requires)
- Email notification → Sent to employee with login credentials

---

### Stage 3: Employee First Login
**Location:** Employee Portal (employee role login)

**First Login Checklist:**
1. ✅ Personal Information
   - Date of Birth
   - Social Security Number (encrypted)
   - Gender
   - Address (USPS validated)

2. ✅ Emergency Contact
   - Name, Relationship
   - Phone Number

3. ✅ Banking Information
   - Bank Name
   - Account Number (encrypted)
   - Routing Number (encrypted)

**Profile Completion Indicator:**
- Shows X/3 sections completed
- Prompts employee until 100% complete

---

### Stage 4: Document Collection (Automated)
**Location:** Employee Portal → Documents Tab

**Auto-Requested Documents Based on Visa Status:**

**All Employees:**
- Resume ✅ (uploaded by recruiter)
- Driver's License ✅ (uploaded by recruiter)
- W-4 Form
- I-9 Form

**H-1B, L-1, E-3, TN, O-1:**
- Visa Document
- I-94 Travel Record
- Passport Copy
- Work Authorization Letter

**F-1 OPT/STEM OPT:**
- EAD Card
- I-20 Document
- OPT Approval Notice

**H-4 EAD:**
- EAD Card
- I-94 Record
- H-4 Approval Notice

**Upload Process:**
1. Employee sees list of required documents
2. Uploads files (drag-and-drop or file picker)
3. Document status: `Pending Approval`
4. HR receives notification

---

### Stage 5: HR Document Approval
**Location:** Documents Module

**HR Workflow:**
1. View all uploaded documents
2. Preview document in modal
3. Actions:
   - ✅ Approve
   - ❌ Reject (with reason)
   - 🗑️ Delete (if necessary)

**Status Updates:**
- Approved → Green checkmark
- Rejected → Red X, employee notified to re-upload
- Pending → Yellow clock icon

---

## WORKFLOW 2: Immigration Management

### Overview
7-stage sequential workflow with 30+ automated tasks per employee.

### Stage 1: Initial Assessment
**Who:** HR Manager or Immigration Attorney  
**Location:** Immigration Management → New Case

**Steps:**
1. Click "New Immigration Case"
2. Select Employee
3. Enter Case Details:
   - Case Type (H-1B, PERM, I-140, Adjustment of Status, etc.)
   - Priority Date
   - Filing Status
   - Current Stage

4. **Automated Task Generation:**
   - Creates 30+ tasks based on case type
   - Assigns deadlines
   - Sets up reminder alerts

---

### Stage 2: Document Preparation
**Tasks Generated:**
- Collect employee passport
- Obtain labor condition application
- Prepare petition documents
- Gather supporting evidence

**Tracking:**
- Each task has status: Not Started → In Progress → Completed
- Deadlines visible on timeline
- Overdue tasks highlighted in red

---

### Stage 3: Filing Preparation
**Tasks:**
- Review all documents
- Prepare filing package
- Calculate filing fees
- Schedule attorney review

**Cost Tracking:**
- Government fees
- Attorney fees
- Premium processing (if applicable)
- Total cost estimation

---

### Stage 4: Submission
**Actions:**
- Mark filing date
- Record receipt number
- Upload receipt notice
- Set up case tracking

**Automated Alerts:**
- Receipt notice expected (30 days)
- RFE response deadline (if issued)
- Biometrics appointment reminder

---

### Stage 5: RFE Response (If Applicable)
**Workflow:**
1. RFE received notification
2. Deadline calculated (typically 87 days)
3. Tasks generated:
   - Analyze RFE requirements
   - Collect additional evidence
   - Draft response
   - Attorney review
   - Submit response

---

### Stage 6: Approval Processing
**Monitoring:**
- Case status checks (weekly)
- Approval notice tracking
- I-94 extension monitoring
- EAD card issuance (if applicable)

**EAD Tracking:**
- Beginning date recorded
- End date recorded
- 90-day renewal reminder
- 180-day extension eligibility check

---

### Stage 7: Case Closure
**Final Steps:**
- Upload approval notices
- Update employee visa status
- Record new validity dates
- Archive case documents
- Generate case summary report

---

## WORKFLOW 3: Business Licensing Compliance

### Multi-State Licensing Management

**Location:** Business Licensing → Licensing Unified

### Setup: Initial License Entry

**Categories:**
1. **Corporate Licenses**
   - Business Registration
   - Tax Registration
   - Professional Licenses

2. **Regulatory Compliance**
   - Industry-specific permits
   - Health & Safety certifications
   - Environmental permits

3. **State-Specific Requirements**
   - Per-state tracking
   - Hierarchical state selection
   - Multi-jurisdiction compliance

---

### License Configuration

**Required Fields:**
- License Name
- License Number
- Issuing Authority
- State (hierarchical dropdown)
- Category
- Issue Date
- Expiration Date
- Status (Active, Pending Renewal, Expired, Suspended)

**Optional Fields:**
- Associated Employee
- Cost
- Renewal Fee
- Notes

---

### Compliance Monitoring

**Automated Alerts:**
- 90 days before expiration → Warning
- 60 days before expiration → Urgent
- 30 days before expiration → Critical
- Expiration date → Expired status

**Reminder Frequency:**
- Weekly
- Bi-weekly
- Monthly
- Quarterly
- Custom intervals

---

### Renewal Workflow

**Process:**
1. Receive expiration alert
2. Click "Add Renewal Task"
3. System creates renewal record:
   - Task description
   - Deadline (expiration date)
   - Assigned to
   - Priority level

4. Track renewal progress:
   - Application submitted
   - Payment processed
   - Approval received
   - Update license dates

5. Delete completed renewal tasks

---

### Compliance Dashboard

**Metrics Displayed:**
- Total licenses managed
- Licenses by state
- Upcoming expirations (next 90 days)
- Expired licenses requiring action
- Renewal tasks pending

**Visual Indicators:**
- 🟢 Green: Active, 90+ days to expiration
- 🟡 Yellow: 30-90 days to expiration
- 🔴 Red: <30 days or expired

---

## WORKFLOW 4: Timesheet Management

### Multi-Client, Project-Based Timesheets

**Location:** Timesheets → View Timesheets

---

### Employee: Submit Timesheet

**Prerequisite:** Employee must be approved by HR (no longer pending)

**Process:**
1. Navigate to Employee Portal → Timesheets
2. Click "New Timesheet"
3. Select Week (Monday-Sunday)
4. For each day:
   - Select Client
   - Select Project (filtered by client)
   - Enter hours worked
   - Add notes (optional)

5. **Validation Rules:**
   - Cannot exceed 24 hours per day
   - Cannot submit for future dates
   - Must have active client assignment
   - Must have active project assignment

6. Click "Submit for Approval"
   - Status: `Submitted`
   - Enters 5-department approval chain

---

### Approval Workflow (5-Department Chain)

**Approval Sequence:**

**Level 1: Direct Manager**
- Reviews team member timesheets
- Verifies hours are reasonable
- Confirms project assignments
- ✅ Approve / ❌ Reject

**Level 2: Department Head**
- Reviews all department timesheets
- Validates against departmental budgets
- Checks for overtime patterns
- ✅ Approve / ❌ Reject

**Level 3: Payroll**
- Verifies billing rates
- Checks for payroll system compatibility
- Ensures compliance with wage laws
- ✅ Approve / ❌ Reject

**Level 4: Finance**
- Reviews billing accuracy
- Confirms client billing rates
- Validates against contracts
- ✅ Approve / ❌ Reject

**Level 5: Client Approval (Previously via Portal)**
**Current Process (Post Portal Removal):**
- Admin/HR manually reviews on behalf of client
- Confirms work completed
- Approves for invoicing
- ✅ Approve / ❌ Reject

**Final Status:** `Approved` → Ready for invoicing

**If Rejected at Any Level:**
- Status: `Rejected`
- Employee notified with rejection reason
- Can edit and resubmit

---

### Invoice Generation

**Location:** Timesheets → Invoices

**Process:**
1. Filter approved timesheets
2. Select timesheets to invoice
3. Click "Generate Invoice"
4. System calculates:
   - Total hours by project
   - Billing rate × hours
   - Subtotal by client
   - Tax (if applicable)
   - Total amount

5. Invoice created with:
   - Invoice number (auto-generated)
   - Date range
   - Line items (project breakdown)
   - Payment terms
   - Due date

6. Actions:
   - Download PDF
   - Send to client (email)
   - Mark as paid
   - Track payment status

---

### Analytics & Reporting

**Location:** Timesheets → Analytics

**Available Reports:**

**1. Billable Hours Report**
- Total hours by employee
- Billable vs. non-billable
- By client, by project
- Time period filtering

**2. Revenue Analytics**
- Total revenue by client
- Revenue by project
- Month-over-month trends
- Forecast projections

**3. Employee Utilization**
- Hours worked vs. capacity
- Utilization percentage
- Top performers
- Underutilized resources

**4. Client Profitability**
- Revenue per client
- Hours invested
- Profit margin analysis
- Top clients ranking

**Visual Displays:**
- Bar charts (monthly revenue)
- Line graphs (trends over time)
- Pie charts (client distribution)
- Data tables (detailed breakdowns)

---

## WORKFLOW 5: Multi-Client & Project Assignments

### Employee-Client-Project Relationships

**Key Concept:** One employee can work for multiple clients on multiple projects with different billing rates.

---

### Setup: Client Creation

**Location:** Core Modules → Clients

**Admin Creates Client:**
1. Click "Add Client"
2. Enter Client Information:
   - Company Name
   - Industry
   - Contact Person
   - Email, Phone
   - Address (USPS validated)
   - Billing Address (if different)
   - Payment Terms (Net 30, Net 60, etc.)
   - Status (Active, Inactive, Prospect)

3. Save Client

---

### Setup: Project Creation

**Location:** Core Modules → Projects

**Admin Creates Project:**
1. Click "Create Project"
2. Enter Project Details:
   - Project Name
   - Select Client (dropdown)
   - Project Code (auto-generated or custom)
   - Start Date
   - End Date (optional, for lifecycle management)
   - Budget
   - Status (Planning, Active, On Hold, Completed, Cancelled)
   - Description

3. Save Project

---

### Setup: Employee Assignment to Client & Project

**Location:** Employees → [Employee Name] → Clients & Projects Tab

**Admin Assigns Employee:**
1. Click "Link to Client"
2. Modal appears:
   - Select Client (dropdown)
   - Select Projects (multi-select, filtered by client)
   - Set Billing Rate ($ per hour, specific to this client)
   - Set Allocation (% of employee time, e.g., 50%)
   - Start Date
   - End Date (optional)
   - Status (Active, Inactive)

3. Click "Link Client"

**Result:**
- Employee now linked to client
- Can select this client when submitting timesheets
- Can select associated projects
- Billing rate automatically applied

**Employee Badge Display:**
- Employee list shows badge: "2 Clients" (e.g.)
- Click to expand and see all client assignments

---

### Multi-Client Workflow Example

**Scenario:** Sarah works for 3 clients

**Client A - Tech Startup**
- Project: Mobile App Development
- Billing Rate: $85/hour
- Allocation: 40%

**Client B - Healthcare Corp**
- Project: HIPAA Compliance Audit
- Billing Rate: $95/hour
- Allocation: 30%

**Client C - Finance Firm**
- Project: Data Migration
- Billing Rate: $100/hour
- Allocation: 30%

**Weekly Timesheet Submission:**
- Monday: 4 hours (Client A - Mobile App) + 4 hours (Client B - Audit)
- Tuesday: 8 hours (Client C - Data Migration)
- Wednesday: 6 hours (Client A - Mobile App) + 2 hours (Client B - Audit)
- Thursday: 8 hours (Client C - Data Migration)
- Friday: 4 hours (Client A - Mobile App) + 4 hours (Client B - Audit)

**Billing Calculation:**
- Client A: 14 hours × $85 = $1,190
- Client B: 10 hours × $95 = $950
- Client C: 16 hours × $100 = $1,600
- **Total Weekly Revenue:** $3,740

---

## WORKFLOW 6: Vendor, Subvendor & Contractor Management

### Vendor Ecosystem Structure

```
┌─────────────────────────────────────────────┐
│          PRIMARY VENDORS                     │
│  (Main service providers to company)         │
└─────────────────┬───────────────────────────┘
                  │
                  │ manages
                  ↓
┌─────────────────────────────────────────────┐
│          SUBVENDORS                          │
│  (Work under primary vendors)                │
└─────────────────┬───────────────────────────┘
                  │
                  │ can have
                  ↓
┌─────────────────────────────────────────────┐
│          CONTRACTORS                         │
│  (Individual contractors, independent)       │
└─────────────────────────────────────────────┘
```

---

### Workflow: Add Primary Vendor

**Location:** Core Modules → Vendors

**Process:**
1. Click "Add Vendor"
2. Enter Vendor Information:
   - Vendor Name
   - Type (Consulting, Staffing, Software, Hardware, etc.)
   - Contact Person
   - Email, Phone
   - Address
   - Tax ID / EIN
   - Payment Terms
   - Contract Start Date
   - Contract End Date
   - Status (Active, Inactive, Pending)

3. **Upload Documents:**
   - W-9 Form
   - Service Agreement
   - Insurance Certificate
   - Compliance Documents

4. **Set Financial Details:**
   - Payment method
   - Billing cycle
   - Default billing rate

5. Save Vendor

---

### Workflow: Add Subvendor

**Location:** Core Modules → Subvendors

**Process:**
1. Click "Add Subvendor"
2. **Select Parent Vendor** (dropdown of primary vendors)
3. Enter Subvendor Information:
   - Same fields as primary vendor
   - Plus: Relationship to parent vendor
   - Service scope under parent

4. **Link to Projects:**
   - Assign subvendor to specific projects
   - Set billing rate
   - Set allocation

---

### Workflow: Add Contractor

**Location:** Core Modules → Contractors

**Process:**
1. Click "Add Contractor"
2. Enter Contractor Information:
   - Similar to employee fields
   - Plus: Independent Contractor classification
   - 1099 tax status
   - Contract type (Fixed, Hourly, Project-based)

3. **Optional Vendor/Subvendor Link:**
   - Can be associated with a vendor
   - Or work independently

4. **Project Assignment:**
   - Assign to projects
   - Set billing rate
   - Define contract duration

---

### Contractor Timesheet & Payment

**Key Difference from Employees:**
- Contractors submit timesheets
- No payroll deductions
- 1099 issued at year-end
- Different approval workflow (usually simpler)

**Invoice Generation:**
- Contractors can generate own invoices
- Or system auto-generates based on approved timesheets
- Payment processed via accounts payable

---

## WORKFLOW 7: Leave Management

### Leave Request Process

**Location:** Employee Portal → Leave Management (Employees)  
**Location:** Additional Modules → Leave Management (Managers/HR)

---

### Employee: Submit Leave Request

**Process:**
1. Navigate to Leave Management
2. Click "Request Leave"
3. Enter Leave Details:
   - Leave Type (Vacation, Sick, Personal, Bereavement, FMLA, etc.)
   - Start Date
   - End Date
   - Total Days (auto-calculated)
   - Reason (optional for vacation, required for sick/FMLA)
   - Supporting Documents (if required, e.g., medical note)

4. Submit Request
   - Status: `Pending Manager Approval`

**Leave Balance:**
- System shows available balances:
  - Vacation: X days remaining
  - Sick: X days remaining
  - Personal: X days remaining
- Cannot request more than available (unless unpaid leave)

---

### Manager: Approve Leave Request

**Notification:**
- Manager receives notification
- Dashboard shows pending leave requests

**Process:**
1. View leave request details
2. Check team coverage
3. Review leave balance
4. Decision:
   - ✅ **Approve** → Status: `Approved`, employee notified
   - ❌ **Reject** → Status: `Rejected`, provide reason, employee notified

**Calendar Integration:**
- Approved leave marked on team calendar
- Prevents scheduling conflicts
- Visible to HR and other managers

---

## WORKFLOW 8: Performance Management

### Annual Performance Review Cycle

**Location:** Additional Modules → Performance Management

---

### Stage 1: Goal Setting (Beginning of Year)

**Manager & Employee Collaboration:**
1. Manager creates performance review period
2. Employee sets goals:
   - Professional development goals
   - Project-specific goals
   - Skill acquisition goals
3. Manager reviews and approves goals
4. Goals locked for the period

---

### Stage 2: Mid-Year Check-In

**Process:**
1. Manager schedules mid-year review
2. Employee self-assessment:
   - Progress on goals (0-100%)
   - Challenges faced
   - Support needed
3. Manager assessment:
   - Performance rating (1-5 scale)
   - Feedback
   - Adjust goals if needed

---

### Stage 3: Year-End Performance Review

**Comprehensive Evaluation:**
1. Employee completes self-assessment:
   - Goal achievement summary
   - Key accomplishments
   - Areas for improvement
   - Career aspirations

2. Manager completes evaluation:
   - Overall performance rating
   - Competency ratings (technical, leadership, teamwork, etc.)
   - Strengths
   - Development areas
   - Compensation recommendation

3. Review Meeting:
   - Manager and employee discuss review
   - Employee can add comments
   - Both sign electronically

4. HR Review:
   - HR reviews all performance reviews
   - Calibrates ratings across organization
   - Approves compensation changes

5. Archive:
   - Review stored in employee file
   - Accessible for future reference

---

## WORKFLOW 9: Offboarding

### Employee Exit Process

**Location:** Additional Modules → Offboarding

**Triggered By:**
- Resignation
- Termination
- Retirement
- End of contract

---

### Stage 1: Initiate Offboarding

**Who:** HR Manager or Admin  
**Process:**
1. Click "Initiate Offboarding"
2. Select Employee
3. Enter Exit Details:
   - Last Working Day
   - Reason for Leaving (Voluntary, Involuntary, Retirement, etc.)
   - Eligible for Rehire? (Yes/No)
   - Exit Interview Scheduled?

4. **Automated Checklist Generated:**
   - 20+ tasks created
   - Assigned to different departments
   - Deadlines set based on last working day

---

### Stage 2: IT Department Tasks

**Auto-Generated Tasks:**
- [ ] Disable system access on last day
- [ ] Retrieve company laptop
- [ ] Retrieve company phone
- [ ] Retrieve access badges
- [ ] Remove from email distribution lists
- [ ] Archive email account (30 days post-exit)
- [ ] Transfer files to manager

---

### Stage 3: HR Tasks

**Auto-Generated Tasks:**
- [ ] Conduct exit interview
- [ ] Collect signed resignation letter
- [ ] Process final paycheck
- [ ] Calculate PTO payout
- [ ] Provide COBRA information
- [ ] Provide 401(k) rollover information
- [ ] Collect company property
- [ ] Update HRIS system
- [ ] Archive personnel file

---

### Stage 4: Manager Tasks

**Auto-Generated Tasks:**
- [ ] Reassign projects
- [ ] Transfer knowledge
- [ ] Update team org chart
- [ ] Redistribute responsibilities
- [ ] Announce departure to team (with employee consent)

---

### Stage 5: Finance/Payroll Tasks

**Auto-Generated Tasks:**
- [ ] Process final paycheck
- [ ] Calculate severance (if applicable)
- [ ] Stop benefits deductions
- [ ] Issue final expense reimbursements
- [ ] Provide tax documents
- [ ] Close corporate credit card

---

### Stage 6: Compliance & Legal

**Auto-Generated Tasks:**
- [ ] Ensure all NDAs signed
- [ ] Provide reference letter (if requested)
- [ ] Document reason for termination
- [ ] Ensure compliance with labor laws
- [ ] Archive all documentation

---

### Stage 7: Exit Interview

**Conducted By:** HR Manager

**Questions Covered:**
- Reason for leaving
- Job satisfaction
- Manager relationship
- Work environment
- Compensation satisfaction
- Career development opportunities
- Suggestions for improvement
- Would you recommend company to others?

**Data Usage:**
- Identify trends in turnover
- Improve retention strategies
- Address systemic issues

---

### Stage 8: Post-Exit

**After Last Day:**
- Employee status → `Inactive`
- Timesheet access → Disabled
- Email forwarding → Set up (optional, 30 days)
- Alumni network → Invite (optional)
- Reference requests → Process via HR

**Rehire Eligibility:**
- If marked "Eligible for Rehire" → Can be rehired through normal hiring process
- Previous employee data retained but inactive

---

## WORKFLOW 10: Document Management

### Centralized Document Repository

**Location:** Additional Modules → Documents

**Security:** AES-256-GCM encryption for sensitive documents

---

### Document Categories

**1. Employee Documents**
- Personal ID (SSN, Passport, Driver's License)
- Immigration (Visa, EAD, I-94, I-20)
- Tax Forms (W-4, State W-4)
- Compliance (I-9, E-Verify)
- Banking (Direct Deposit Form)
- Contracts (Offer Letter, Employment Agreement, NDA)

**2. Company Documents**
- Business Licenses
- Insurance Policies
- Contracts & Agreements
- Compliance Certificates
- Tax Filings

**3. Client Documents**
- Service Agreements
- NDAs
- SOWs (Statement of Work)
- Invoices
- Payment Records

**4. Vendor/Contractor Documents**
- W-9 Forms
- Service Agreements
- Insurance Certificates
- Compliance Documents

---

### Document Upload Process

**By Employee (Self-Service):**
1. Navigate to Employee Portal → Documents
2. See list of required documents
3. Click "Upload" next to document type
4. Select file (PDF, JPG, PNG, max 10MB)
5. Click "Upload Document"
6. Status: `Pending HR Approval`

**By HR/Admin (On Behalf of Employee):**
1. Navigate to Documents Module
2. Filter by employee
3. Click "Upload Document"
4. Select document type
5. Upload file
6. Status: Can mark as `Approved` immediately or set to `Pending`

---

### Document Approval Workflow

**HR Reviews:**
1. Filter documents by status: `Pending Approval`
2. Click "Review" on document
3. Preview document in modal
4. Verify:
   - Document is legible
   - Information matches employee record
   - Document is valid (not expired)
   - Document type is correct

5. Actions:
   - ✅ **Approve** → Status: `Approved`, green checkmark
   - ❌ **Reject** → Status: `Rejected`, employee notified, can re-upload
   - 📝 **Request Clarification** → Comment added, employee notified

---

### Document Expiration Tracking

**Automated Monitoring:**
- Documents with expiration dates (Visa, License, Certification)
- 90-day alert: "Document expiring soon"
- 30-day alert: "Document expiration imminent"
- Expiration day: "Document expired"

**Renewal Request:**
- System auto-requests updated document
- Employee receives notification
- HR receives alert

---

### Document Download & Viewing

**Security Controls:**
- Only authorized users can view documents
- Audit trail: Who viewed, when
- Download tracking
- Encrypted storage

**Download Process:**
1. Click on document name
2. Preview in modal (if supported)
3. Click "Download"
4. File saved locally

---

### Document Deletion

**Who Can Delete:**
- HR Manager
- Admin
- Super Admin

**Process:**
1. Click "Delete" (trash icon)
2. Confirmation modal: "Are you sure?"
3. Optionally add reason for deletion
4. Click "Confirm Delete"

**Audit Trail:**
- Deletion logged
- Who deleted, when, why
- Cannot be undone (except from backups)

---

## Integration Points

### External Systems Connected

**1. USPS Address Validation**
- **Purpose:** Validate employee and client addresses
- **Integration:** API call on address entry
- **Benefit:** Ensures accurate addresses, reduces mail return

**2. SmartyStreets**
- **Purpose:** Advanced address verification
- **Integration:** Secondary validation layer
- **Benefit:** International address support

**3. Supabase Storage**
- **Purpose:** Secure file storage
- **Integration:** Backend storage for all uploaded documents
- **Benefit:** Scalable, secure, encrypted

**4. Supabase Auth**
- **Purpose:** User authentication
- **Integration:** Login, signup, password reset
- **Benefit:** Secure, role-based access control

**5. Email Notifications (Future)**
- **Purpose:** Automated email alerts
- **Integration:** SMTP or email service API
- **Benefit:** Timely notifications to users

**6. Immigration Attorney Portal (Future)**
- **Purpose:** Collaborate with external attorneys
- **Integration:** API or portal access
- **Benefit:** Streamlined case management

---

## Key System Features

### 1. Role-Based Access Control (RBAC)
- 8 distinct user roles
- Granular permissions
- View vs. Edit vs. Approve capabilities
- Prevents unauthorized access

### 2. Automated Compliance Alerts
- License expiration warnings
- Immigration deadline alerts
- Document renewal reminders
- Timesheet approval reminders

### 3. Audit Trail
- Every action logged
- Who, what, when
- Document views tracked
- Approval history preserved

### 4. Data Encryption
- AES-256-GCM encryption
- SSN, banking info, sensitive documents
- Encrypted at rest and in transit
- Compliance with data protection laws

### 5. Multi-Tenant Architecture
- Subscription-based access
- Feature toggles by plan
- Usage tracking
- Scalable for growth

### 6. Mobile-Responsive Design
- Works on desktop, tablet, mobile
- Touch-friendly interfaces
- Responsive layouts
- Accessible on the go

---

## Quick Reference: User Access Matrix

| Module | Super Admin | Admin | HR Manager | Recruiter | Payroll | Manager | Employee |
|--------|-------------|-------|------------|-----------|---------|---------|----------|
| Dashboard | Full | Full | Full | View | Full | View | Personal |
| Employees | Full | Full | Full | Create | View | View | Personal |
| Clients | Full | Full | Edit | View | View | View | - |
| Projects | Full | Full | Edit | View | View | View | Assigned |
| Immigration | Full | Full | Full | View | - | - | Personal |
| Licensing | Full | Full | Full | - | - | - | - |
| Timesheets | Full | Full | View | - | Approve | Approve | Submit |
| Invoices | Full | Full | View | - | Full | - | - |
| Documents | Full | Full | Full | Upload | - | - | Upload |
| Leave | Full | Full | Approve | - | - | Approve | Request |
| Performance | Full | Full | Full | - | - | Conduct | Self-Assess |
| Offboarding | Full | Full | Full | - | Tasks | Tasks | - |
| Vendors | Full | Full | Edit | - | - | - | - |
| Subscription | Full | - | - | - | - | - | - |

**Legend:**
- **Full** = Create, Read, Update, Delete
- **Edit** = Read, Update
- **View** = Read only
- **Approve** = Review and approve/reject
- **Personal** = Own data only
- **-** = No access

---

## Troubleshooting Common Workflows

### Issue: Employee Can't Access Timesheets
**Cause:** Employee status is `Pending HR Approval`  
**Solution:**
1. HR navigates to Dashboard → Pending HR Approvals
2. Reviews employee details
3. Clicks "Approve"
4. Employee gains timesheet access immediately

---

### Issue: Document Upload Fails
**Possible Causes:**
- File too large (>10MB)
- Unsupported file type
- Network error

**Solution:**
1. Check file size, compress if needed
2. Ensure file is PDF, JPG, or PNG
3. Retry upload
4. If persists, contact support

---

### Issue: Timesheet Stuck in Approval
**Cause:** Awaiting approval from one of 5 levels  
**Solution:**
1. Navigate to Timesheets → View Timesheets
2. Filter by status: `Submitted` or `Pending Approval`
3. Check approval history to see which level is pending
4. Contact approver to expedite

---

### Issue: License Expiration Alert Not Appearing
**Cause:** Expiration date not set or reminder frequency not configured  
**Solution:**
1. Navigate to Business Licensing
2. Click "Edit" on license
3. Verify expiration date is set
4. Set reminder frequency (e.g., Monthly)
5. Save changes
6. Alert should trigger based on frequency

---

## Best Practices

### For HR Teams
1. **Approve recruiters' employees promptly** to avoid delays in timesheet access
2. **Review documents within 48 hours** to maintain employee trust
3. **Set up license reminders proactively** to avoid compliance lapses
4. **Conduct regular data audits** to ensure accuracy
5. **Use dashboard widgets** to prioritize tasks

### For Recruiters
1. **Verify visa status carefully** before submission (it triggers automation)
2. **Upload high-quality documents** to avoid rejection
3. **Double-check employee info** before submitting for HR approval
4. **Follow up on pending approvals** via dashboard

### For Employees
1. **Complete profile on first login** to avoid reminder prompts
2. **Upload requested documents promptly** to maintain compliance
3. **Submit timesheets weekly** to ensure timely payment
4. **Monitor immigration deadlines** in Employee Portal
5. **Keep emergency contact updated** for safety

### For Admins
1. **Assign clients to projects** before assigning employees
2. **Set accurate billing rates** to ensure correct invoicing
3. **Review analytics monthly** to identify trends
4. **Maintain vendor relationships** by tracking contract renewals
5. **Configure subscription features** based on business needs

---

## System Limits & Quotas

### File Upload Limits
- **Max file size:** 10 MB per file
- **Accepted formats:** PDF, JPG, PNG
- **Max files per employee:** Unlimited

### User Limits
- **Based on subscription plan:** See Subscription Config
- **Free Trial:** Up to 5 employees
- **Starter Plan:** Up to 50 employees
- **Professional Plan:** Up to 250 employees
- **Enterprise Plan:** Unlimited employees

### Data Retention
- **Active employees:** Indefinite
- **Inactive employees:** 7 years (compliance requirement)
- **Deleted employees:** 90-day soft delete, then permanent
- **Documents:** Retained with employee record

---

## Conclusion

This comprehensive workflow guide covers all major processes in the HR Timesheets Automation Platform. Each workflow is designed to ensure compliance, efficiency, and user satisfaction.

For specific questions or advanced configurations, refer to the module-specific documentation or contact system administrator.

**Last Updated:** November 6, 2025  
**System Version:** Post Client Portal Removal  
**Document Version:** 1.0

---

## Related Documentation

- [QUICK-START.md](QUICK-START.md) - Getting started guide
- [RECRUITER-HR-WORKFLOW-IMPLEMENTATION.md](RECRUITER-HR-WORKFLOW-IMPLEMENTATION.md) - Detailed recruiter workflow
- [HR-COMPLETE-WORKFLOW-GUIDE.md](HR-COMPLETE-WORKFLOW-GUIDE.md) - HR-specific workflows
- [BUSINESS-LICENSING-FULL-COMPLIANCE.md](BUSINESS-LICENSING-FULL-COMPLIANCE.md) - Licensing compliance
- [TIMESHEET-SYSTEM-QUICK-START.md](TIMESHEET-SYSTEM-QUICK-START.md) - Timesheet module guide
- [MULTI-CLIENT-VISUAL-GUIDE.md](MULTI-CLIENT-VISUAL-GUIDE.md) - Multi-client setup
- [VENDOR-SYSTEM-SUMMARY.md](VENDOR-SYSTEM-SUMMARY.md) - Vendor ecosystem guide

---

*End of Comprehensive Workflow Guide*
