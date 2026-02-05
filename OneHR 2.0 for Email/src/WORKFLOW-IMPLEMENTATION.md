# Employee Onboarding Workflow Implementation

## Overview
This document describes the comprehensive employee onboarding workflow that ensures all pre-employment, compliance, and payroll setup steps are complete before employees can submit timesheets or generate invoices.

## Workflow Stages

The onboarding workflow consists of 7 sequential stages:

### 1. Initiation
**Responsible Departments:** Recruiter, HR

**Tasks:**
- Recruiter or Accounting confirms project rate
- HR sends client confirmation email
- HR receives confirmation from client

**Requirements:**
- Project rate must be confirmed
- Client confirmation must be received before proceeding

---

### 2. Data & Document Collection
**Responsible Department:** HR

**Tasks:**
- Send Congratulations Email to new employee
- Collect Home Address
- Collect Work Authorization proof (EAD, Green Card, Citizen, etc.)
- Collect Government-issued ID
- Issue Offer Letter
- Issue NDA for e-signature

**Requirements:**
- All documents must be collected
- NDA must be signed before proceeding to verification

---

### 3. Verification & Legal Compliance
**Responsible Departments:** HR, Immigration

**Tasks:**
- Initiate I-9 / E-Verify process
- Notify Immigration team if immigration action required
- Assign Employee Handbook
- Assign Company Policies
- Complete Client-Specific Requirements (training, forms, NDAs)
- Verify completion of all compliance tasks

**Requirements:**
- I-9/E-Verify must be completed
- Immigration team must be notified if employee requires sponsorship
- All compliance documents must be completed

---

### 4. Payroll Setup
**Responsible Departments:** HR, Accounting

**Tasks:**
- HR initiates ADP onboarding
- Notify Accounting team
- Accounting validates pay rate
- Accounting validates pay schedule
- Accounting validates deductions
- Accounting validates state compliance

**Requirements:**
- ADP onboarding must be completed
- All payroll parameters must be validated
- If employee is in a new state, triggers Licensing workflow

---

### 5. Licensing Dependencies
**Responsible Departments:** Licensing, Accounting

**Tasks:**
- Identify if employee resides in a new state
- Request Licensing Team to create:
  - State Withholding Account
  - Unemployment Insurance Account
  - Workers' Compensation policy
- Track completion before ADP activation

**Requirements:**
- Only required if employee is in a new state
- All three accounts/policies must be created before proceeding
- HR and Accounting must track completion

---

### 6. Employee Classification
**Responsible Departments:** HR, Accounting

**Classification Types:**

1. **Billable Employee**
   - Must be linked to active client
   - Must have valid PO number
   - Required for timesheet-to-invoice workflow

2. **Non-Billable Employee**
   - Assigned to internal project
   - Hours tracked but not directly billed

3. **Operational Staff**
   - Assigned to department-level reporting
   - Not tracked against specific projects

**Requirements:**
- Classification must be assigned
- Required links (client/PO or project/department) must be established
- System validates classification before allowing timesheet access

---

### 7. Finalization
**Responsible Departments:** HR, Immigration, Licensing, Accounting, Recruiter

**Tasks:**
- HR final sign-off
- Immigration final sign-off
- Licensing final sign-off
- Accounting final sign-off
- Recruiter final sign-off

**Requirements:**
- ALL departments must confirm readiness
- System automatically sets Employee Onboarding = Complete
- Grants employee access to Timesheets

---

## Access Control Rules

### Timesheet Access
Employees CANNOT submit timesheets until:

1. ✅ All workflow stages are completed
2. ✅ All department approvals are granted
3. ✅ Employee classification is verified
4. ✅ For billable employees: Client and PO must be linked
5. ✅ For non-billable employees: Internal project must be assigned
6. ✅ For operational staff: Department must be assigned

### Role-Based Access

**HR Manager**
- Can manage employee onboarding
- Can assign tasks and track progress
- Can grant HR approval

**Accounting Manager**
- Can validate payroll setup
- Can manage licensing triggers
- Can grant Accounting approval

**Immigration Manager**
- Can track immigration status
- Can manage visa/EAD dates
- Can grant Immigration approval

**Licensing Manager**
- Can manage state licensing requirements
- Can track account creation
- Can grant Licensing approval

**Recruiter**
- Can initiate onboarding
- Can confirm project rates
- Can grant Recruiter approval

---

## Immigration Integration

### EAD Tracking
When immigration status is entered for an employee:
- System automatically prompts for EAD beginning and end dates
- EAD expiry dates feed into "Expiring Soon" alerts
- Alerts trigger at 120, 90, 60, and 30 days before expiry

### Visa Types Tracked
- H-1B
- OPT / STEM OPT
- L-1
- TN
- O-1
- E-3
- Green Card
- U.S. Citizen

---

## Workflow Automation

### Task Dependencies
Tasks can have dependencies on other tasks. Blocked tasks show the reason and cannot be completed until dependencies are resolved.

### Stage Advancement
The system automatically advances to the next stage when all tasks in the current stage are completed.

### Completion Criteria
Onboarding is marked as "Completed" when:
- All 7 stages are finished
- All department approvals are granted
- Employee classification is verified
- All required links (client/PO/project) are established

---

## Dashboard & Reporting

The Dashboard provides:
- Real-time onboarding status for all employees
- Pending tasks count by department
- Expiring immigration documents alerts
- Licensing requirements by state
- Employee classification breakdown
- Workflow stage progress

---

## Email Notifications

The system triggers notifications at key points:
1. Client confirmation email (Stage 1)
2. Congratulations email (Stage 2)
3. Immigration team notification (Stage 3)
4. Accounting notification for ADP setup (Stage 4)
5. Licensing team notification for new state (Stage 5)

---

## Best Practices

1. **Start Early:** Begin onboarding process as soon as offer is accepted
2. **Regular Check-ins:** Review pending tasks weekly
3. **Immigration Priority:** Address immigration requirements early to avoid delays
4. **State Licensing:** Identify new states early and start licensing process immediately
5. **Classification:** Ensure classification is completed before employee start date
6. **Department Coordination:** All departments should communicate progress regularly

---

## Troubleshooting

### Employee Cannot Access Timesheets
Check:
1. Is onboarding status "Completed"?
2. Have all departments approved?
3. Is classification verified?
4. For billable: Is client and PO linked?
5. For non-billable: Is internal project assigned?
6. For operational: Is department assigned?

### Workflow Stuck
Check:
1. Are there blocked tasks?
2. Are task dependencies resolved?
3. Are all required documents collected?
4. Has department been notified of pending tasks?

---

## Future Enhancements

Potential additions to the workflow:
- Automated email sending
- Document upload and storage
- E-signature integration
- ADP API integration
- Client portal for PO management
- Mobile app for task tracking
- Analytics and reporting dashboard
