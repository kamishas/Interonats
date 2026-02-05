# HR Complete Workflow Guide
## End-to-End Employee Onboarding with Client & Vendor Integration

---

## 📋 Table of Contents
1. [Quick Reference](#quick-reference)
2. [Core Workflows](#core-workflows)
3. [Step-by-Step Processes](#step-by-step-processes)
4. [Integration Scenarios](#integration-scenarios)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### What HR Can Now Do
✅ **Full Employee Lifecycle Management**  
✅ **Client Account Management**  
✅ **Vendor Relationship Management**  
✅ **Subvendor Hierarchy Management**  
✅ **Contractor Assignment & Tracking**  
✅ **Project-Based Employee Assignments**  
✅ **Immigration Case Management**  
✅ **Document & Compliance Tracking**

### Navigation for HR Users
```
Dashboard → Employees → Clients → Vendors → Subvendors → Contractors → Projects
```

---

## Core Workflows

### Workflow 1: Standard Employee Onboarding (Direct Hire)
```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Create Employee Profile                             │
│ ↓                                                            │
│ Step 2: Select or Create Client Account                     │
│ ↓                                                            │
│ Step 3: Assign to Client Project                            │
│ ↓                                                            │
│ Step 4: Set Billing Rate & Allocation                       │
│ ↓                                                            │
│ Step 5: Complete Onboarding Workflow                        │
│ ↓                                                            │
│ Step 6: Grant Timesheet Access                              │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 2: Vendor Employee Onboarding
```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Verify/Create Vendor Account                        │
│ ↓                                                            │
│ Step 2: Create Employee Profile (Link to Vendor)            │
│ ↓                                                            │
│ Step 3: Identify Client Assignment                          │
│ ↓                                                            │
│ Step 4: Create Project Assignment                           │
│ ↓                                                            │
│ Step 5: Set Vendor-Specific Rates                           │
│ ↓                                                            │
│ Step 6: Track Vendor Relationship                           │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 3: Contractor Management
```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Create Contractor Profile                           │
│ ↓                                                            │
│ Step 2: Link to Vendor (if applicable)                      │
│ ↓                                                            │
│ Step 3: Assign to Client/Project                            │
│ ↓                                                            │
│ Step 4: Set Contract Terms & Rates                          │
│ ↓                                                            │
│ Step 5: Track Engagement Duration                           │
└─────────────────────────────────────────────────────────────┘
```

### Workflow 4: Multi-Client Employee
```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Create/Select Employee                              │
│ ↓                                                            │
│ Step 2: Create Primary Client Assignment                    │
│ ↓                                                            │
│ Step 3: Add Secondary Client(s)                             │
│ ↓                                                            │
│ Step 4: Set Different Billing Rates per Client              │
│ ↓                                                            │
│ Step 5: Define Allocation Percentages                       │
│ ↓                                                            │
│ Step 6: Monitor Time Distribution                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Processes

### 🎯 Process A: Onboarding a Direct-Hire Employee

#### **Step 1: Create Employee Profile**
1. Log in as **HR Manager**
2. Navigate to **Dashboard**
3. Click **"Add Employee"** quick action button
   - OR: Go to **Employees** → Click **"New Employee"**
4. Fill in employee details:
   ```
   Required Fields:
   ├── First Name
   ├── Last Name
   ├── Email Address
   ├── Phone Number
   ├── Position/Title
   ├── Department
   ├── Start Date
   ├── Home State
   └── Employment Type (Full-time/Part-time/Contract)
   ```
5. Click **"Create Employee"**
6. System creates employee with **7-stage workflow**

#### **Step 2: View Available Clients**
1. Navigate to **Clients** (in sidebar)
2. Search for existing client:
   - Use search bar to filter by company name
   - Review client details, status, contacts
3. **If client exists**: Note the client name
4. **If client doesn't exist**: Continue to Step 3

#### **Step 3: Create New Client (if needed)**
1. Click **"Add Client"** button
2. Fill in client information:
   ```
   Basic Information:
   ├── Company Name
   ├── Legal Name
   ├── Industry
   ├── Tax ID/EIN
   ├── Primary Contact Name
   ├── Primary Contact Email
   ├── Primary Contact Phone
   └── Address
   
   Additional Details:
   ├── Client Type (Direct/Vendor/Partner)
   ├── Status (Active/Inactive/Pending)
   ├── Contract Start Date
   ├── Contract End Date (optional)
   ├── Insurance Requirements
   └── Notes
   ```
3. Click **"Create Client"**
4. System generates **Client ID** and creates account

#### **Step 4: Link Employee to Client via Project**
1. Navigate to **Projects** (in sidebar)
2. Click **"Create Project Assignment"**
3. Select employee from dropdown
4. Select client from dropdown
5. Enter project details:
   ```
   Project Information:
   ├── Project Name
   ├── Project Code (auto-generated or manual)
   ├── Start Date
   ├── End Date (optional)
   ├── Billing Rate (per hour)
   ├── Allocation Percentage (1-100%)
   ├── Project Status (Active/Planned/On-Hold/Completed)
   └── Notes
   ```
6. Click **"Create Assignment"**

#### **Step 5: Complete Onboarding Workflow**
1. Navigate back to **Employees** → Select employee
2. Review **7-stage workflow progress**:
   ```
   Stage 1: Personal Information Collection ✓
   Stage 2: Employment Documentation ⏳
   Stage 3: Tax & Payroll Setup ⏳
   Stage 4: Benefits Enrollment ⏳
   Stage 5: Technology & Systems Access ⏳
   Stage 6: Training & Orientation ⏳
   Stage 7: Final Review & Approval ⏳
   ```
3. Click on each stage to complete tasks
4. Upload required documents
5. Obtain department approvals (5 departments)
6. Verify employee classification
7. Complete all 30+ automated tasks

#### **Step 6: Grant Timesheet Access**
1. Once workflow reaches **"Completed"** status
2. System automatically sets: `canAccessTimesheets: true`
3. Employee receives email notification
4. Employee can now submit timesheets for assigned client

---

### 🎯 Process B: Onboarding a Vendor Employee

#### **Step 1: Verify/Create Vendor**
1. Navigate to **Vendors** (in sidebar)
2. Search for existing vendor
3. **If vendor doesn't exist**:
   - Click **"Add Vendor"**
   - Fill in vendor details:
     ```
     Vendor Information:
     ├── Vendor Name
     ├── Legal Name
     ├── Vendor Type (Staffing Agency/MSP/Subcontractor)
     ├── Tax ID
     ├── Primary Contact
     ├── Email & Phone
     ├── Address
     ├── Contract Terms
     ├── Payment Terms
     └── Status
     ```
   - Click **"Create Vendor"**

#### **Step 2: Create Employee with Vendor Link**
1. Navigate to **Employees** → **"New Employee"**
2. Fill in employee basic information
3. In **"Employment Type"** section:
   - Select **"Vendor Employee"** or **"Contract"**
4. **Additional Field Appears**: "Select Vendor"
   - Choose vendor from dropdown
5. Complete employee creation

#### **Step 3: View Client for Assignment**
1. Navigate to **Clients**
2. Identify which client this vendor employee will work for
3. Note client details and project needs

#### **Step 4: Create Project Assignment**
1. Navigate to **Projects**
2. Click **"Create Project Assignment"**
3. Select the vendor employee
4. Select the client
5. Enter **vendor-specific billing rate**:
   ```
   Billing Configuration:
   ├── Client Bill Rate: $120/hr
   ├── Vendor Pay Rate: $85/hr
   ├── Margin: $35/hr (29.2%)
   ├── Allocation: 100%
   └── Project Duration: 6 months
   ```

#### **Step 5: Track Vendor Relationship**
1. Navigate to **Vendors** → Select vendor
2. View **"Linked Employees"** section
3. Monitor:
   - Number of active employees from this vendor
   - Total billing vs. vendor costs
   - Vendor performance metrics
   - Contract compliance

---

### 🎯 Process C: Managing Contractors

#### **Step 1: Create Contractor Profile**
1. Navigate to **Contractors** (in sidebar)
2. Click **"Add Contractor"**
3. Fill in contractor details:
   ```
   Contractor Information:
   ├── First Name & Last Name
   ├── Email & Phone
   ├── Contractor Type (1099/Corp-to-Corp/SOW)
   ├── Skills/Expertise
   ├── Hourly Rate
   ├── Tax ID or SSN
   ├── Business Name (if applicable)
   └── Status
   ```
4. Click **"Create Contractor"**

#### **Step 2: Link to Vendor (Optional)**
1. If contractor comes through a vendor:
   - Click **"Link to Vendor"**
   - Select vendor from dropdown
   - Specify relationship type
2. If direct contractor:
   - Leave vendor field blank

#### **Step 3: Assign to Client**
1. Click **"Assign to Project"** from contractor profile
2. Select client
3. Create project assignment:
   ```
   Assignment Details:
   ├── Client: Acme Corp
   ├── Project: Website Redesign
   ├── Bill Rate: $150/hr
   ├── Contractor Rate: $115/hr
   ├── Start Date: 2024-01-15
   ├── End Date: 2024-04-15
   ├── Estimated Hours: 480
   └── Total Value: $72,000
   ```

#### **Step 4: Track Engagement**
1. Monitor contractor timesheets (if using timesheet module)
2. Review hours worked vs. estimated
3. Track deliverables and milestones
4. Manage contract renewals or extensions

---

### 🎯 Process D: Multi-Client Employee Assignment

#### **Step 1: Create Primary Assignment**
1. Employee already exists in system
2. Navigate to **Projects**
3. Create **primary client assignment**:
   ```
   Primary Assignment:
   ├── Client: Tech Solutions Inc.
   ├── Project: Cloud Migration
   ├── Bill Rate: $110/hr
   ├── Allocation: 60%
   └── Status: Active
   ```

#### **Step 2: Add Secondary Client**
1. From **Projects** → Click **"Add Assignment"**
2. Select same employee
3. Select secondary client
4. Create second assignment:
   ```
   Secondary Assignment:
   ├── Client: StartupXYZ
   ├── Project: Mobile App Development
   ├── Bill Rate: $125/hr
   ├── Allocation: 40%
   └── Status: Active
   ```

#### **Step 3: Verify Total Allocation**
1. System validates: Total Allocation = 100%
   - Primary: 60% + Secondary: 40% = 100% ✓
2. If allocation exceeds 100%:
   - System shows warning
   - HR adjusts percentages

#### **Step 4: Monitor Time Distribution**
1. Navigate to **Employees** → Select employee
2. View **"Project Assignments"** tab
3. Review:
   ```
   Employee: John Smith
   
   ┌─────────────────────────────────────────────────┐
   │ Client A: Tech Solutions Inc.                   │
   │ ├── Allocation: 60%                             │
   │ ├── Rate: $110/hr                               │
   │ └── Expected Hours/Week: 24 hours               │
   ├─────────────────────────────────────────────────┤
   │ Client B: StartupXYZ                            │
   │ ├── Allocation: 40%                             │
   │ ├── Rate: $125/hr                               │
   │ └── Expected Hours/Week: 16 hours               │
   └─────────────────────────────────────────────────┘
   
   Total Revenue Potential: $5,640/week
   ```

---

## Integration Scenarios

### Scenario 1: Complete Employee Lifecycle (Direct Hire)

**Background**: Hiring a Software Developer for Client "Acme Corp"

```
┌─────────────────────────────────────────────────────────────┐
│ DAY 1: Pre-Onboarding                                       │
├─────────────────────────────────────────────────────────────┤
│ 1. HR receives job offer acceptance                         │
│ 2. HR verifies "Acme Corp" exists in Clients module         │
│ 3. HR creates employee profile in system                    │
│ 4. System initiates 7-stage onboarding workflow             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DAY 2-5: Stage 1 & 2 (Personal Info + Documentation)       │
├─────────────────────────────────────────────────────────────┤
│ 1. HR uploads offer letter, background check                │
│ 2. Employee portal: Employee completes I-9, W-4             │
│ 3. HR reviews immigration status (if applicable)            │
│ 4. Navigate to Immigration → Link to employee               │
│ 5. Create work authorization record                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DAY 6-7: Client & Project Assignment                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Navigate to Projects → Create Assignment                 │
│ 2. Link Employee to "Acme Corp"                             │
│ 3. Set billing rate: $95/hr, Allocation: 100%               │
│ 4. Project: "Cloud Infrastructure - Q1 2024"                │
│ 5. Start Date: Employee's first day                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DAY 8-14: Complete Remaining Stages                         │
├─────────────────────────────────────────────────────────────┤
│ Stage 3: Tax & Payroll Setup ✓                              │
│ Stage 4: Benefits Enrollment ✓                              │
│ Stage 5: Technology & Systems Access ✓                      │
│ Stage 6: Training & Orientation ✓                           │
│ Stage 7: Final Review & Approvals ✓                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DAY 15: First Day & Timesheet Access                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Employee starts work for Acme Corp                       │
│ 2. System grants timesheet access (workflow complete)       │
│ 3. Employee submits weekly timesheet                        │
│ 4. Timesheet auto-tagged: Client "Acme Corp"                │
│ 5. Billing rate: $95/hr applied automatically               │
└─────────────────────────────────────────────────────────────┘
```

---

### Scenario 2: Vendor Employee Placement

**Background**: Staffing agency "TechStaff Solutions" provides developer for "StartupXYZ"

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Vendor Setup                                        │
├─────────────────────────────────────────────────────────────┤
│ Action: Navigate to Vendors → Add Vendor                    │
│                                                              │
│ Vendor Details:                                              │
│ ├── Name: TechStaff Solutions                               │
│ ├── Type: Staffing Agency                                   │
│ ├── Contact: Jane Vendor, jane@techstaff.com                │
│ ├── Payment Terms: Net 30                                   │
│ ├── Contract: Master Service Agreement on file              │
│ └── Status: Active                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Client Verification                                 │
├─────────────────────────────────────────────────────────────┤
│ Action: Navigate to Clients → Search "StartupXYZ"           │
│                                                              │
│ Client Exists:                                               │
│ ├── Name: StartupXYZ Inc.                                   │
│ ├── Industry: Software/SaaS                                 │
│ ├── Active Projects: 3                                      │
│ ├── Current Employees: 8                                    │
│ └── Status: Active                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Employee Creation (Vendor-Linked)                   │
├─────────────────────────────────────────────────────────────┤
│ Action: Employees → New Employee                            │
│                                                              │
│ Employee Details:                                            │
│ ├── Name: Mike Developer                                    │
│ ├── Email: mike@techstaff.com (vendor email)                │
│ ├── Position: Senior React Developer                        │
│ ├── Employment Type: Vendor Employee                        │
│ ├── Linked Vendor: TechStaff Solutions                      │
│ ├── Start Date: 2024-02-01                                  │
│ └── Expected Duration: 6 months                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Project Assignment with Vendor Rates                │
├─────────────────────────────────────────────────────────────┤
│ Action: Projects → Create Assignment                        │
│                                                              │
│ Assignment Configuration:                                    │
│ ├── Employee: Mike Developer                                │
│ ├── Client: StartupXYZ Inc.                                 │
│ ├── Project: Mobile App v2.0                                │
│ ├── Client Bill Rate: $140/hr                               │
│ ├── Vendor Pay Rate: $100/hr                                │
│ ├── Markup: $40/hr (28.6%)                                  │
│ ├── Allocation: 100%                                         │
│ ├── Duration: Feb 1 - Jul 31, 2024                          │
│ └── Estimated Hours: 1,040 hours (26 weeks × 40 hrs)        │
│                                                              │
│ Financial Projection:                                        │
│ ├── Total Bill to Client: $145,600                          │
│ ├── Total Pay to Vendor: $104,000                           │
│ └── Gross Profit: $41,600                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Ongoing Relationship Management                     │
├─────────────────────────────────────────────────────────────┤
│ Weekly Tasks:                                                │
│ ├── Monitor timesheets (40 hrs/week)                        │
│ ├── Approve hours for billing                               │
│ ├── Track against estimate (1,040 hrs total)                │
│ └── Review client satisfaction                              │
│                                                              │
│ Monthly Tasks:                                               │
│ ├── Generate invoice to client ($24,267)                    │
│ ├── Process vendor payment ($17,333)                        │
│ ├── Track margin realization                                │
│ └── Review performance metrics                              │
│                                                              │
│ End of Engagement:                                           │
│ ├── Complete offboarding workflow                           │
│ ├── Collect feedback from client                            │
│ ├── Update vendor performance record                        │
│ └── Archive employee-client-vendor relationship             │
└─────────────────────────────────────────────────────────────┘
```

---

### Scenario 3: Multi-Client Consultant

**Background**: Senior consultant splitting time between 3 clients

```
┌─────────────────────────────────────────────────────────────┐
│ EMPLOYEE: Sarah Consultant                                  │
│ ROLE: Enterprise Architect                                  │
│ TOTAL AVAILABILITY: 40 hours/week                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLIENT ASSIGNMENT 1: Primary (50%)                          │
├─────────────────────────────────────────────────────────────┤
│ Navigate to: Projects → Create Assignment                   │
│                                                              │
│ Client: Fortune 500 Financial Services                      │
│ Project: Digital Transformation Initiative                  │
│ Bill Rate: $225/hr                                           │
│ Allocation: 50% (20 hours/week)                             │
│ Weekly Revenue: $4,500                                       │
│ Duration: Jan 2024 - Dec 2024 (ongoing)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLIENT ASSIGNMENT 2: Secondary (30%)                        │
├─────────────────────────────────────────────────────────────┤
│ Navigate to: Projects → Add Assignment                      │
│                                                              │
│ Client: Healthcare Tech Startup                             │
│ Project: HIPAA Compliance Architecture                      │
│ Bill Rate: $200/hr                                           │
│ Allocation: 30% (12 hours/week)                             │
│ Weekly Revenue: $2,400                                       │
│ Duration: Feb 2024 - May 2024 (4 months)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLIENT ASSIGNMENT 3: Tertiary (20%)                         │
├─────────────────────────────────────────────────────────────┤
│ Navigate to: Projects → Add Assignment                      │
│                                                              │
│ Client: Manufacturing Enterprise                            │
│ Project: Cloud Migration Strategy                           │
│ Bill Rate: $190/hr                                           │
│ Allocation: 20% (8 hours/week)                              │
│ Weekly Revenue: $1,520                                       │
│ Duration: Mar 2024 - Jun 2024 (4 months)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TOTAL ALLOCATION VALIDATION                                 │
├─────────────────────────────────────────────────────────────┤
│ Client 1: 50%                                                │
│ Client 2: 30%                                                │
│ Client 3: 20%                                                │
│ ─────────────                                                │
│ TOTAL:   100% ✓ (System validates)                          │
│                                                              │
│ Total Weekly Revenue: $8,420                                │
│ Blended Rate: $210.50/hr                                    │
│ Annual Revenue Potential: $437,840                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TIMESHEET WORKFLOW (Weekly)                                 │
├─────────────────────────────────────────────────────────────┤
│ Sarah logs time in Timesheet Module:                        │
│                                                              │
│ Monday:                                                      │
│ ├── Client 1: 4 hours @ $225/hr = $900                      │
│ ├── Client 2: 2.5 hours @ $200/hr = $500                    │
│ └── Client 3: 1.5 hours @ $190/hr = $285                    │
│                                                              │
│ Tuesday:                                                     │
│ ├── Client 1: 4 hours @ $225/hr = $900                      │
│ ├── Client 2: 2.5 hours @ $200/hr = $500                    │
│ └── Client 3: 1.5 hours @ $190/hr = $285                    │
│                                                              │
│ ... (continues for full week)                               │
│                                                              │
│ System Auto-Validates:                                       │
│ ├── Client 1: ~20 hrs ✓ (within 50% allocation)             │
│ ├── Client 2: ~12 hrs ✓ (within 30% allocation)             │
│ ├── Client 3: ~8 hrs ✓ (within 20% allocation)              │
│ └── Total: 40 hrs ✓                                          │
│                                                              │
│ HR Approves → Generates 3 separate invoices                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### 🎯 Data Entry Best Practices

#### **1. Client Data Accuracy**
✅ **DO:**
- Verify legal entity name matches contracts
- Include full address for licensing/tax purposes
- Store primary contact email for automated notifications
- Document insurance requirements upfront
- Set contract start/end dates for renewals

❌ **DON'T:**
- Use abbreviations or nicknames as primary name
- Leave contact information blank
- Skip industry classification
- Forget to update status when client becomes inactive

#### **2. Vendor Relationship Management**
✅ **DO:**
- Create vendor before creating vendor employees
- Document payment terms clearly (Net 30, Net 45, etc.)
- Store master service agreement reference
- Track vendor performance metrics
- Set up reminders for contract renewals

❌ **DON'T:**
- Create employees without linking to vendor
- Mix up vendor pay rate vs. client bill rate
- Forget to document margin expectations
- Skip vendor compliance checks

#### **3. Project Assignment Accuracy**
✅ **DO:**
- Use descriptive project names with dates
- Set realistic allocation percentages
- Document billing rate agreements in writing
- Include project end dates for fixed-term work
- Add notes for special billing arrangements

❌ **DON'T:**
- Exceed 100% total allocation per employee
- Set allocations without confirming with employee
- Forget to update rates when contracts change
- Leave projects active after completion

---

### 📊 Monitoring & Reporting

#### **Weekly HR Dashboard Review**
```
Every Monday Morning:
├── Review new employees added last week
├── Check project assignments for completeness
├── Verify all vendor employees linked correctly
├── Monitor onboarding workflow progress (all stages)
├── Review timesheet submission rates
└── Check for expiring client contracts
```

#### **Monthly Client Review**
```
First Week of Each Month:
├── Navigate to Clients → Run reports
├── Identify clients with no active employees
├── Review revenue per client
├── Check for upcoming contract expirations
├── Verify insurance requirements still met
└── Update client status as needed
```

#### **Quarterly Vendor Assessment**
```
End of Each Quarter:
├── Navigate to Vendors → Performance Tab
├── Review total spend per vendor
├── Calculate margin realization (planned vs. actual)
├── Assess employee quality/retention
├── Renegotiate rates if needed
└── Document vendor scorecard
```

---

### 🔐 Compliance & Security

#### **Data Privacy**
- Only share client information on need-to-know basis
- Don't email client billing rates to employees
- Protect vendor contract terms (confidential)
- Encrypt sensitive contractor tax information
- Follow data retention policies

#### **Immigration Compliance**
For employees requiring sponsorship:
1. Create employee profile first
2. Navigate to **Immigration** module
3. Link immigration case to employee
4. **Then** assign to client (after work authorization confirmed)
5. Document EAD dates in both modules
6. Set reminders for expiration (60 days prior)

#### **Licensing Compliance**
For employees working in multiple states:
1. Check employee's assigned clients
2. Identify states where clients are located
3. Navigate to **Licensing** → State Requirements
4. Verify company has required state licenses
5. Create licensing tasks if needed
6. Link to employee profile

---

## Troubleshooting

### Common Issues & Solutions

#### ❓ **Issue 1: Can't see Clients menu**
**Symptom**: HR user doesn't see Clients option in sidebar  
**Cause**: Permission not updated or browser cache  
**Solution**:
1. Log out completely
2. Clear browser cache
3. Log back in as HR
4. Verify with Admin that `canManageClients: true` is set
5. If still not visible, contact system administrator

#### ❓ **Issue 2: Can't create project assignment**
**Symptom**: "Create Assignment" button grayed out  
**Cause**: Employee or Client not properly created  
**Solution**:
1. Verify employee exists in Employees module
2. Verify client exists in Clients module
3. Check both are in "Active" status
4. Ensure employee has completed Stage 1 of onboarding
5. Try refreshing the page

#### ❓ **Issue 3: Total allocation exceeds 100%**
**Symptom**: Error message when creating multiple assignments  
**Cause**: Combined allocation percentages > 100%  
**Solution**:
1. Navigate to employee profile
2. View all current project assignments
3. Calculate total allocation
4. Adjust percentages:
   ```
   Example Fix:
   Before: Client A (60%) + Client B (50%) = 110% ❌
   After: Client A (55%) + Client B (45%) = 100% ✓
   ```
5. Update existing assignments before creating new ones

#### ❓ **Issue 4: Vendor employee not linked correctly**
**Symptom**: Employee created but vendor relationship not showing  
**Cause**: Vendor not selected during employee creation  
**Solution**:
1. Navigate to Employees → Select employee
2. Click "Edit" (pencil icon)
3. Find "Employment Type" or "Vendor" field
4. Select correct vendor from dropdown
5. Save changes
6. Verify link appears in both:
   - Employee profile → Vendor section
   - Vendor profile → Linked Employees

#### ❓ **Issue 5: Client billing rate not applying to timesheet**
**Symptom**: Timesheets showing $0 or wrong rate  
**Cause**: Project assignment missing or inactive  
**Solution**:
1. Navigate to Projects
2. Search for employee name
3. Verify assignment exists and is "Active"
4. Check billing rate is entered (not blank)
5. Verify project dates include current date
6. If needed, edit assignment and save
7. Have employee resubmit timesheet

---

## Quick Action Checklists

### ✅ New Employee Checklist (Direct Hire)
```
□ Create employee profile
□ Verify client exists in system
□ Create project assignment
□ Set billing rate and allocation
□ Start onboarding workflow
□ Upload offer letter & contracts
□ Complete I-9 and W-4 (employee portal)
□ Check immigration status (if applicable)
□ Assign to projects in Projects module
□ Complete all 7 workflow stages
□ Verify department approvals (5 departments)
□ Grant timesheet access
□ Send welcome email to employee
```

### ✅ Vendor Employee Checklist
```
□ Create or verify vendor in Vendors module
□ Create employee profile
□ Link employee to vendor
□ Identify client for assignment
□ Create project with vendor rates
□ Document margin (bill rate - pay rate)
□ Set contract duration
□ Complete onboarding workflow
□ Track vendor relationship
□ Monitor performance
```

### ✅ Multi-Client Assignment Checklist
```
□ Create employee profile (if new)
□ Create primary client assignment
□ Set primary allocation percentage
□ Create secondary client assignment(s)
□ Verify total allocation = 100%
□ Document different billing rates
□ Set up timesheet tracking per client
□ Communicate schedule to employee
□ Monitor time distribution weekly
```

### ✅ Contractor Checklist
```
□ Create contractor profile
□ Link to vendor (if applicable)
□ Verify 1099 vs. Corp-to-Corp status
□ Obtain W-9 form
□ Create client assignment
□ Set contract terms (hourly, fixed, SOW)
□ Document deliverables
□ Track engagement dates
□ Monitor invoice submissions
```

---

## Visual Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    HR COMPLETE WORKFLOW                         │
│                   (All Access Granted)                          │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  Dashboard   │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐
   │Employees│      │  Clients │      │  Vendors │
   └────┬────┘      └─────┬────┘      └─────┬────┘
        │                 │                  │
        │                 │                  │
        │         ┌───────┴────────┐         │
        │         ▼                ▼         │
        │   ┌──────────┐    ┌──────────┐    │
        └──►│ Projects │◄───│Subvendors│◄───┘
            └────┬─────┘    └──────────┘
                 │
                 ▼
         ┌───────────────┐
         │  Contractors  │
         └───────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  Immigration  │
         └───────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  Timesheets   │
         └───────────────┘
                 │
                 ▼
         ┌───────────────┐
         │   Invoices    │
         └───────────────┘

Legend:
├── Direct Access (Create/Edit/Delete)
└── Linking Relationships (Employee ↔ Client ↔ Vendor)
```

---

## Summary

### HR Role Now Has Complete Control Over:
1. ✅ **Employee Lifecycle** - Create, onboard, assign, track
2. ✅ **Client Relationships** - View, create, manage accounts
3. ✅ **Vendor Partnerships** - Track, manage, evaluate
4. ✅ **Project Assignments** - Link employees to clients with rates
5. ✅ **Contractor Management** - Onboard, track, invoice
6. ✅ **Immigration Cases** - Create, track, renew work authorization
7. ✅ **Timesheet Approval** - Review and approve employee time
8. ✅ **Document Management** - Upload, track, approve documents

### Key Benefits:
- 🚀 **Streamlined Workflow** - Complete tasks without switching roles
- 📊 **Better Visibility** - See full employee-client-vendor relationships
- ⚡ **Faster Onboarding** - All tools in one place
- 🔒 **Improved Compliance** - Track all relationships and requirements
- 💰 **Better Financial Tracking** - Monitor billing rates and margins

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-05  
**Maintained By**: HR Operations Team  
**Status**: ✅ Complete & Active
