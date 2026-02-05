# Employee Login and Portal Guide

## How to View Your Onboarding Information as an Employee

### Quick Start

Once you've been added to the system through the Employee Onboarding process, you can login and view your own onboarding information, workflow progress, and access timesheets (when approved).

---

## Step 1: Login as an Employee

### Login Credentials

**Email:** Use the email address that was entered when you were onboarded  
**Password:** `employee123` or `password123` (default employee password)

### Example Login Flow

1. **Open the application**
2. **Enter your email** (e.g., `john.doe@company.com`)
3. **Enter password:** `employee123`
4. **Click "Sign In"**

---

## Step 2: View Your Employee Portal

After logging in, you'll see the **Employee Portal** with 5 main tabs:

### 📊 Overview Tab
Shows your complete employee profile including:
- **Personal Information**
  - Full name
  - Email
  - Position
  - Department
  - Start date
  - Home state
  - Onboarding status

- **Classification & Access**
  - Employee type (Billable/Non-Billable/Operational)
  - Client assignment (if billable)
  - Purchase order (if billable)
  - Timesheet access status
  - Classification verification status

- **Onboarding Progress**
  - Overall completion percentage
  - Current workflow stage
  - Stage-by-stage progress breakdown

### 🔄 Workflow Tab
View all your onboarding tasks organized by stage:
- ✅ Initiation
- ✅ Data Collection
- ✅ Verification
- ✅ Payroll Setup
- ✅ Licensing
- ✅ Classification
- ✅ Finalization

Each task shows:
- Task title and description
- Current status (Pending/In Progress/Completed/Blocked)
- Visual status indicators

### ✓ Approvals Tab
Track approvals from different departments:
- HR Department
- Accounting Department
- Immigration Team (if applicable)
- Licensing Team (if applicable)
- IT Department

For each approval, you'll see:
- Department name
- Approval status (Pending/Approved/Rejected)
- Who approved it
- Approval date
- Any notes from the approver

### 👤 Classification Tab
View your employment classification details:
- Classification type
- Verification status
- Client assignment (for billable employees)
- Purchase order details (for billable employees)
- Classification-specific information

### ⏰ Timesheets Tab
Submit and manage your timesheets.

**Important:** Timesheet access is **locked** until you meet all requirements:
1. ✅ All workflow stages completed
2. ✅ All department approvals granted
3. ✅ Classification verified

If requirements aren't met, you'll see a clear message explaining what's pending.

---

## Understanding Your Onboarding Status

### Status Badges

**Pending Review**
- Your onboarding workflow has been started
- Tasks are being processed
- Waiting for department actions

**In Progress**
- Actively moving through workflow stages
- Some tasks completed, others pending
- Multiple departments reviewing

**Completed**
- All 7 workflow stages finished
- All departments approved
- Classification verified
- Full system access granted

---

## Real-Time Information

### What You Can See

✅ **Your Real Data:** All information shown is your actual onboarding data from the system  
✅ **Live Progress:** Progress bars and percentages update in real-time  
✅ **Task Status:** See exactly which tasks are completed and which are pending  
✅ **Approval Status:** Know which departments have approved and which are pending  
✅ **Classification Details:** View your employee type and client assignments  

### Progress Tracking

**Overall Progress Bar**
- Shows completion percentage across all tasks
- Updates automatically as tasks are completed

**Stage Progress**
- Individual progress for each of the 7 stages
- Helps you understand which phase you're in

**Department Approvals**
- Clear status for each required approval
- View approval dates and approver names

---

## Timesheet Access

### When Can I Submit Timesheets?

You can access timesheets **ONLY** when:

1. **Workflow Complete:** All 7 stages finished (100% progress)
2. **All Approvals Granted:** Every department has approved
3. **Classification Verified:** Your employee type is confirmed and verified

### Why Is My Timesheet Access Locked?

If you see a locked timesheet tab, check the requirements section to see what's pending:

```
Requirements:
○ Complete all workflow stages          ← In Progress
○ Receive all department approvals      ← Pending
○ Complete classification verification  ← Pending
```

Green checkmarks (✓) = Complete  
Gray circles (○) = Still pending

---

## Common Scenarios

### Scenario 1: Just Onboarded
**Status:** Pending Review (0-30% progress)
- You'll see your basic information
- Most workflow tasks are pending
- No department approvals yet
- Timesheets are locked

**What to do:** Wait for HR and other departments to process your onboarding

### Scenario 2: Onboarding In Progress
**Status:** In Progress (30-90% progress)
- Many tasks completed
- Some department approvals received
- Classification may be assigned
- Timesheets still locked

**What to do:** Monitor your progress; HR is working on remaining items

### Scenario 3: Onboarding Complete
**Status:** Completed (100% progress)
- All tasks completed ✓
- All approvals granted ✓
- Classification verified ✓
- Timesheets unlocked ✓

**What to do:** Start submitting timesheets!

---

## Billable vs Non-Billable vs Operational

### Billable Employee
- Assigned to a specific client
- Has a purchase order number
- Time billed to the client
- Can see client details in portal

### Non-Billable Employee
- Not assigned to clients
- Time tracked but not billed externally
- Internal company work

### Operational Employee
- Supports internal operations
- Administrative or support role
- Time tracked internally

---

## Example Employee Portal View

```
┌────────────────────────────────────────────────────────┐
│  Employee Portal                                       │
│  Welcome, John Doe!                    [75%] [Profile] │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  ℹ️ Onboarding In Progress                            │
│  Your onboarding is being processed. You will gain    │
│  access to timesheets once all workflow stages are    │
│  completed and approved.                              │
└────────────────────────────────────────────────────────┘

[Overview] [Workflow] [Approvals] [Classification] [Timesheets]

┌─────────────────────────┐  ┌──────────────────────────┐
│ Your Information        │  │ Classification & Access  │
│                         │  │                          │
│ Full Name: John Doe     │  │ Employee Type:           │
│ Email: john@company.com │  │ [Billable]               │
│ Position: Engineer      │  │                          │
│ Department: IT          │  │ Assigned Client:         │
│ Start Date: 10/24/2025  │  │ Acme Corp                │
│ Home State: CA          │  │                          │
│ Status: [in-progress]   │  │ Purchase Order: PO-12345 │
│                         │  │                          │
│                         │  │ Timesheet Access:        │
│                         │  │ ❌ Pending approval      │
└─────────────────────────┘  └──────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Onboarding Progress                                    │
│                                                        │
│ Overall Progress                              75%     │
│ ████████████████████░░░░░░                            │
│                                                        │
│ Current Stage: [payroll-setup]                        │
│                                                        │
│ Stage Completion:                                     │
│ Initiation: 100%     Data Collection: 100%            │
│ Verification: 100%   Payroll Setup: 75%               │
│ Licensing: 50%       Classification: 0%               │
└────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Profile Not Found"
**Problem:** Your email isn't in the onboarding system  
**Solution:** Contact HR to ensure you've been added to the system

### "Loading your employee profile..."
**Problem:** Data is being fetched  
**Solution:** Wait a few seconds; if it persists, refresh the page

### "Failed to load employee data"
**Problem:** Connection or server issue  
**Solution:** 
1. Check your internet connection
2. Refresh the page
3. Try logging out and back in
4. Contact IT if problem persists

### Can't Access Timesheets
**Problem:** Requirements not met  
**Solution:** Check the requirements list in the Timesheets tab to see what's pending

---

## Privacy & Security

### What Can You See?
✅ **Your own data only:** You can only view your personal information  
✅ **Your workflow:** Your onboarding tasks and progress  
✅ **Your approvals:** Departments that reviewed your onboarding  
✅ **Your classification:** Your employment type and assignments  

### What You Cannot See
❌ Other employees' information  
❌ Company-wide data  
❌ HR internal notes (unless shared)  
❌ Administrative functions  

---

## Getting Help

### Need Assistance?

**Onboarding Questions**
- Contact: HR Department
- Email: hr@company.com

**Technical Issues**
- Contact: IT Support
- Email: it@company.com

**Classification Questions**
- Contact: HR Manager or Accounting
- Email: hr@company.com

**Timesheet Access**
- Contact: Accounting Manager
- Email: accounting@company.com

---

## Test Accounts

For testing purposes, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| employee@company.com | employee123 | Employee (Demo) |
| hr@company.com | hr123 | HR Manager |
| admin@company.com | admin123 | Admin |

**For onboarded employees:** Use your actual email + `employee123` as password

---

## Quick Reference

### Login
- **Email:** Your onboarded email address
- **Password:** `employee123` or `password123`

### Portal Sections
1. **Overview** - Your info + progress
2. **Workflow** - All tasks by stage
3. **Approvals** - Department approvals
4. **Classification** - Employment type
5. **Timesheets** - Submit hours (when unlocked)

### Access Requirements
✓ All workflow stages complete  
✓ All department approvals granted  
✓ Classification verified  

### Support
- HR: hr@company.com
- IT: it@company.com

---

**Last Updated:** October 24, 2025  
**Version:** 1.0
