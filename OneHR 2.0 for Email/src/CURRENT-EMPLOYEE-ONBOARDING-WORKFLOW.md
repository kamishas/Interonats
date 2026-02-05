# Current Employee Onboarding Workflow
## Complete Process Overview

**Last Updated:** November 10, 2025  
**Status:** Fully Implemented ✅

---

## 📋 Table of Contents

1. [Quick Summary](#quick-summary)
2. [Workflow Stages](#workflow-stages)
3. [Role-Specific Actions](#role-specific-actions)
4. [Document Collection](#document-collection)
5. [Technical Implementation](#technical-implementation)
6. [Key Features](#key-features)

---

## Quick Summary

The employee onboarding workflow is a **4-stage sequential process** with role-based approval gates:

```
Recruiter Creates → HR Approves → Employee Completes Profile → Active Employee
    (Stage 1)         (Stage 2)           (Stage 3)              (Stage 4)
```

**Total Time:** Typically 24-48 hours  
**Roles Involved:** Recruiter, HR Manager, Employee  
**Automation Level:** High (automatic document requests, notifications, access control)

---

## Workflow Stages

### 🎯 **STAGE 1: Recruiter Initiates Employee Creation**

**Who:** Recruiter  
**Location:** Employees → "New Employee" button (top right)  
**Duration:** 10-15 minutes

#### Required Information:

**Basic Information:**
- ✅ First Name
- ✅ Last Name
- ✅ Email (used for login credentials)
- ✅ Phone Number
- ✅ Position/Job Title
- ✅ Department
- ✅ Employment Type (Full-time, Part-time, Contract, Consultant)
- ✅ Start Date

**Visa/Immigration Status (CRITICAL):**
- ✅ Select from 11 visa statuses:
  - US Citizen
  - Green Card Holder
  - H-1B Visa
  - L-1 Visa
  - E-3 Visa (Australian professionals)
  - TN Visa (NAFTA)
  - O-1 Visa (Extraordinary ability)
  - F-1 OPT (Optional Practical Training)
  - F-1 STEM OPT (24-month extension)
  - H-4 EAD (Spouse work authorization)
  - Other Work Authorization

**🔥 Automatic Triggers Based on Visa Status:**

| Visa Type | Auto-Requested Documents | Additional Prompts |
|-----------|--------------------------|-------------------|
| **H-1B, L-1, E-3, TN, O-1** | Visa Document, I-94, Passport, Work Auth Letter | I-94 Number |
| **F-1 OPT / STEM OPT** | EAD Card, I-20, OPT Approval Notice | EAD Begin/End Dates |
| **H-4 EAD** | EAD Card, I-94, H-4 Approval Notice | EAD Begin/End Dates |
| **US Citizen / Green Card** | Standard documents only | None |

**Required Document Uploads:**
- ✅ **Resume** (PDF, JPG, PNG - max 10MB)
- ✅ **Driver's License** (PDF, JPG, PNG - max 10MB)

#### What Happens After Submission:

```typescript
System automatically sets:
- needsHRApproval: true
- hrApproved: false
- onboardingStatus: "pending-review"
- createdBy: [recruiter_user_id]
- createdByRole: "recruiter"
- profileCompleted: false
- timesheetAccess: false (blocked until classification complete)
```

**Employee Status:** `Pending HR Approval` 🟠  
**Can Employee Log In?** ❌ No - access blocked until HR approves  
**Notification:** HR receives notification of pending approval

---

### ✅ **STAGE 2: HR Reviews & Approves**

**Who:** HR Manager or Admin  
**Location:** Dashboard → "Pending HR Approvals" widget  
**Duration:** 5-10 minutes per employee

#### HR Review Process:

**1. Notification:**
- Badge on dashboard shows count of pending approvals
- Example: "3 Pending HR Approvals"

**2. Review Screen Shows:**
```
Employee: John Smith
Email: john.smith@company.com
Phone: (555) 123-4567
Position: Software Developer
Department: Engineering
Visa Status: H-1B
Start Date: 2025-02-01

Documents Uploaded:
✓ Resume.pdf (2.3 MB) - [Download] [Preview]
✓ DriverLicense.jpg (1.1 MB) - [Download] [Preview]

Created by: Sarah Johnson (Recruiter)
Created on: Nov 10, 2025 at 10:30 AM
```

**3. HR Actions:**

**Option A: Approve ✅**
- Click "Review" button
- Optional: Add approval notes ("All documents verified, background check pending")
- Click "Approve & Grant Access"
- **Result:**
  - `needsHRApproval: false`
  - `hrApproved: true`
  - `hrApprovedBy: [hr_user_id]`
  - `hrApprovedDate: [timestamp]`
  - `onboardingStatus: "in-progress"`
  - Employee receives email: "Your account is ready!"

**Option B: Reject ❌**
- Click "Reject"
- **Required:** Enter rejection reason
- Examples:
  - "Missing background check"
  - "Incorrect visa documentation"
  - "Duplicate employee record"
- **Result:**
  - `hrApproved: false`
  - `hrRejectionReason: [reason]`
  - Recruiter notified
  - Employee does NOT receive login credentials

---

### 👤 **STAGE 3: Employee First Login - Profile Completion Wizard**

**Who:** Employee  
**Location:** Employee Portal (automatic redirect on first login)  
**Duration:** 15-20 minutes

**Trigger:** Employee receives email: "Welcome to [Company Name]! Your account is ready."

#### 4-Step Profile Completion Wizard:

```
Progress: [●○○○] Step 1 of 4
```

---

#### **Step 1/4: Confirm Your Name**

```
┌─────────────────────────────────────────┐
│ Step 1 of 4: Confirm Your Name         │
├─────────────────────────────────────────┤
│ First Name: [John          ] ✓         │
│ Last Name:  [Smith         ] ✓         │
│                                         │
│              [Next Step →]              │
└─────────────────────────────────────────┘
```

**Fields:**
- First Name (pre-filled from recruiter)
- Last Name (pre-filled from recruiter)

**Validation:** Both required, min 2 characters

---

#### **Step 2/4: Secure Information**

```
┌─────────────────────────────────────────┐
│ Step 2 of 4: Secure Information        │
├─────────────────────────────────────────┤
│ 🔒 This information is encrypted        │
│                                         │
│ Social Security Number:                 │
│ [___-__-____]                          │
│                                         │
│ Date of Birth:                          │
│ [MM/DD/YYYY]                           │
│                                         │
│ [← Back]  [Next Step →]                │
└─────────────────────────────────────────┘
```

**Fields:**
- SSN (encrypted with AES-256-GCM before storage)
- Date of Birth

**Security:**
- SSN entered in plain text by employee
- Encrypted client-side before transmission
- Stored as `ssnEncrypted` in database
- Never stored in plain text
- Only visible to HR role (shows "🔒 Protected")

**Validation:**
- SSN: Must be 9 digits, format XXX-XX-XXXX
- DOB: Cannot be future date, must be 18+ years old

---

#### **Step 3/4: Address & Contact Information**

```
┌─────────────────────────────────────────┐
│ Step 3 of 4: Address & Contact         │
├─────────────────────────────────────────┤
│ Street Address:                         │
│ [123 Main Street            ]          │
│                                         │
│ City:        [San Francisco  ]          │
│ State:       [CA ▼]                     │
│ ZIP Code:    [94102         ]          │
│                                         │
│ [Validate Address with USPS]           │
│ ✓ Address validated                    │
│                                         │
│ Phone:       [(555) 123-4567]          │
│                                         │
│ [← Back]  [Next Step →]                │
└─────────────────────────────────────────┘
```

**Features:**
- USPS Address Validation (if API configured)
- Auto-formats phone number
- Validates ZIP code format

**Validation:**
- All fields required
- ZIP must be valid US format (5 or 9 digits)
- Phone must be 10 digits

---

#### **Step 4/4: Emergency Contacts**

```
┌─────────────────────────────────────────┐
│ Step 4 of 4: Emergency Contacts        │
├─────────────────────────────────────────┤
│ Primary Contact (Required) ⚠️           │
│                                         │
│ Full Name:       [Jane Smith     ]     │
│ Relationship:    [Spouse ▼]            │
│ Phone Number:    [(555) 987-6543]     │
│ Email (Optional):[jane@email.com ]     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [+ Add Another Emergency Contact]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Secondary Contact (Optional)            │
│ Full Name:       [Bob Smith      ]     │
│ Relationship:    [Brother ▼]           │
│ Phone Number:    [(555) 111-2222]     │
│ Email (Optional):                       │
│                                         │
│ [Remove Contact]                        │
│                                         │
│ [← Back]  [✓ Complete Profile]         │
└─────────────────────────────────────────┘
```

**Requirements:**
- Minimum 1 emergency contact required
- Can add unlimited contacts
- Cannot remove last contact (must have at least 1)

**Validation:**
- Name: Required, min 2 characters
- Relationship: Dropdown (Spouse, Parent, Sibling, Child, Friend, Other)
- Phone: Required, 10 digits
- Email: Optional, must be valid format if provided

---

#### **Profile Submission:**

When employee clicks "Complete Profile":

```typescript
System saves:
- personalInfo: { firstName, lastName, dob }
- ssnEncrypted: "AES-256-GCM-encrypted-value"
- contactInfo: { address, city, state, zip, phone }
- emergencyContacts: [ {...}, {...} ]
- profileCompleted: true
- profileCompletedAt: [timestamp]

Redirects to: Employee Portal Dashboard
```

**Success Message:** "Profile completed successfully! Welcome to [Company Name]"

---

### 🎉 **STAGE 4: Active Employee - Full Portal Access**

**Status:** Employee is now fully onboarded  
**Can Access:**
- ✅ Employee Dashboard
- ✅ View personal information
- ✅ Upload documents
- ✅ View immigration status (if applicable)
- ✅ Submit leave requests
- ✅ View project assignments
- ⚠️ **Timesheets:** Only after classification verification complete

**Still Pending:**
- Document uploads (auto-requested based on visa status)
- Manager assignment (done by HR/Admin)
- Client/Project assignment (done by HR/Admin)
- Classification verification (W2, 1099, Corp-to-Corp)

---

## Document Collection

### Automatic Document Requests

Based on visa status selected in Stage 1, system automatically requests documents:

#### **All Employees (Mandatory):**
- ✅ Resume (uploaded by recruiter)
- ✅ Driver's License (uploaded by recruiter)
- ⏳ W-4 Tax Form
- ⏳ I-9 Employment Eligibility Form
- ⏳ Direct Deposit Authorization

#### **H-1B, L-1, E-3, TN, O-1 Visa Holders:**
- ⏳ Visa Document (stamp in passport)
- ⏳ I-94 Arrival/Departure Record
- ⏳ Passport Copy (biographical page + visa page)
- ⏳ Work Authorization Letter from USCIS

#### **F-1 OPT / STEM OPT:**
- ⏳ EAD Card (front + back)
- ⏳ I-20 Form (current)
- ⏳ OPT Approval Notice
- ⏳ DSO Signature (from school)

#### **H-4 EAD:**
- ⏳ EAD Card (front + back)
- ⏳ I-94 Record
- ⏳ H-4 Approval Notice (I-797)
- ⏳ Principal H-1B holder's documents

#### **Green Card Holders:**
- ⏳ Permanent Resident Card (front + back)
- ⏳ I-551 Stamp (if card in renewal)

### Document Upload Process:

**Employee Side:**
1. Navigate to Employee Portal → Documents tab
2. See list of required documents with status:
   - ✅ Green checkmark = Uploaded & Approved
   - 🟡 Yellow clock = Uploaded, Pending Approval
   - 🔴 Red X = Rejected, Re-upload Required
   - ⏳ Gray circle = Not Yet Uploaded
3. Click "Upload" next to document type
4. Drag-and-drop or select file
5. File validates:
   - Formats: PDF, JPG, PNG, DOCX
   - Max size: 10MB per file
   - Virus scan: Automatic
6. Upload completes → Status changes to "Pending Approval"
7. HR receives notification

**HR Side:**
1. Navigate to Documents module
2. Filter: "Pending Approval"
3. Click employee name to see all documents
4. Click "Preview" to view document in modal
5. Actions:
   - ✅ **Approve:** Document marked as approved
   - ❌ **Reject:** Enter rejection reason, employee notified
   - 🗑️ **Delete:** If document is incorrect/duplicate
6. Employee receives notification of approval/rejection

---

## Role-Specific Actions

### 👔 **Recruiter (Limited Access)**

**Can Do:**
- ✅ Create new employee records
- ✅ Upload resume and driver's license during creation
- ✅ Select visa status (triggers document automation)
- ✅ View list of employees they created
- ✅ See approval status (pending/approved/rejected)

**Cannot Do:**
- ❌ Approve employees
- ❌ Access employee portal
- ❌ View sensitive information (SSN)
- ❌ Approve documents
- ❌ Grant timesheet access

**Dashboard Widgets:**
- "Employees Created" count
- "Pending HR Approval" list
- "Recently Approved" list
- "Recently Rejected" list with reasons

---

### 💼 **HR Manager (Full Onboarding Access)**

**Can Do:**
- ✅ Review and approve recruiter-submitted employees
- ✅ Create employees directly (skips approval step)
- ✅ View all employee information (including encrypted SSN marker)
- ✅ Approve/reject uploaded documents
- ✅ Edit employee information
- ✅ Delete employees
- ✅ Assign employees to managers
- ✅ Assign employees to clients/projects
- ✅ Verify employee classification (W2/1099/Corp-to-Corp)
- ✅ Grant timesheet access after classification
- ✅ View emergency contacts
- ✅ Download all employee documents

**Dashboard Widgets:**
- "Pending HR Approvals" (urgent)
- "Documents Pending Review" (important)
- "Employees In Progress" (7-stage workflow)
- "Onboarding Completion Rate" (analytics)
- "Recent Hires" (last 30 days)

---

### 👨‍💼 **Admin (Full System Access)**

**Can Do:**
- ✅ Everything HR can do, plus:
- ✅ Manage subscription settings
- ✅ Configure external integrations
- ✅ Access all modules (Clients, Vendors, Projects, etc.)
- ✅ View platform analytics
- ✅ Manage business licenses

**Cannot See:**
- ❌ Plain-text SSN (even encrypted marker shown differently)

---

### 👤 **Employee (Self-Service Portal)**

**Can Do:**
- ✅ Complete profile wizard (one-time)
- ✅ View own information
- ✅ Upload required documents
- ✅ View upload status (pending/approved/rejected)
- ✅ Download own documents
- ✅ View immigration case status (if applicable)
- ✅ Submit timesheets (after classification verified)
- ✅ Request leave
- ✅ View project assignments

**Cannot Do:**
- ❌ Edit name (must request HR to change)
- ❌ Change email (login credential)
- ❌ See other employees
- ❌ Approve own documents
- ❌ Access admin functions

**First Login Experience:**
1. Receives email with temp password
2. Logs in → Redirected to profile wizard
3. Cannot skip wizard (required)
4. After completion → Access to portal dashboard
5. Sees checklist of required document uploads
6. Monitors onboarding progress: "3 of 7 stages complete"

---

## Technical Implementation

### Database Fields:

```typescript
Employee {
  // Basic Info (from Recruiter)
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'consultant';
  startDate: string;
  
  // Visa/Immigration (from Recruiter)
  visaStatus: string; // H-1B, L-1, etc.
  i94Number?: string; // Auto-requested for certain visas
  eadBeginDate?: string; // Auto-requested for OPT/EAD
  eadEndDate?: string; // Auto-requested for OPT/EAD
  
  // HR Approval Workflow
  needsHRApproval: boolean; // true if created by recruiter
  hrApproved: boolean; // false until HR approves
  hrApprovedBy?: string; // HR user ID
  hrApprovedDate?: string; // Timestamp
  hrReviewNotes?: string; // Optional notes from HR
  hrRejectionReason?: string; // If rejected
  createdBy: string; // Recruiter user ID
  createdByRole: string; // "recruiter"
  
  // Employee Profile (from Employee)
  dateOfBirth?: string;
  ssnEncrypted?: string; // AES-256-GCM encrypted
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContacts?: EmergencyContact[]; // Array of contacts
  profileCompleted: boolean; // false until wizard done
  profileCompletedAt?: string; // Timestamp
  
  // Onboarding Status
  onboardingStatus: 'pending-review' | 'in-progress' | 'completed';
  onboardingProgress: number; // 0-100 percentage
  
  // Access Control
  timesheetAccess: boolean; // false until classification verified
  classificationVerified: boolean; // W2/1099/Corp-to-Corp
  classification?: 'W2' | '1099' | 'Corp-to-Corp';
  
  // Assignments (from HR/Admin)
  managerId?: string;
  managerName?: string;
  clientId?: string;
  clientName?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}
```

### API Endpoints:

```bash
# Employee Creation (Recruiter)
POST /employees
Body: { firstName, lastName, email, visaStatus, ... }
Response: { employee: {...}, needsHRApproval: true }

# Get Pending Approvals (HR)
GET /employees?needsHRApproval=true
Response: { employees: [...] }

# HR Approve/Reject
POST /employees/{id}/hr-approve
Body: { approved: true, notes: "..." }
Response: { employee: {...}, hrApproved: true }

# Employee Profile Completion
PUT /employees/{id}/profile
Body: { ssnEncrypted, dob, address, emergencyContacts, ... }
Response: { employee: {...}, profileCompleted: true }

# Document Upload
POST /employees/{id}/documents
Body: FormData (file, type, employeeId)
Response: { document: {...}, status: "pending-approval" }

# Document Approval (HR)
PUT /documents/{id}/approve
Body: { approved: true }
Response: { document: {...}, status: "approved" }
```

### Access Control Logic:

```typescript
// Employee Portal Access Check
if (user.role === 'employee') {
  const employee = await getEmployee(user.id);
  
  // Check 1: HR Approval
  if (employee.needsHRApproval && !employee.hrApproved) {
    return <PendingHRApprovalScreen />;
  }
  
  // Check 2: Profile Completion
  if (!employee.profileCompleted) {
    return <ProfileCompletionWizard />;
  }
  
  // Check 3: Timesheet Access
  if (!employee.classificationVerified) {
    // Show portal but block timesheets
    return <EmployeePortal timesheetAccess={false} />;
  }
  
  // Full Access Granted
  return <EmployeePortal timesheetAccess={true} />;
}
```

---

## Key Features

### 🔥 **Automation Highlights:**

1. **Visa-Based Document Requests**
   - Select H-1B → Auto-requests 4 documents
   - Select F-1 OPT → Auto-requests EAD dates + 4 documents
   - No manual configuration needed

2. **Email Notifications**
   - Recruiter creates employee → HR notified
   - HR approves → Employee receives login email
   - Employee uploads document → HR notified
   - HR approves document → Employee notified
   - Document rejected → Employee notified with reason

3. **Progress Tracking**
   - Visual progress bar: "Step 2 of 4"
   - Onboarding stages: "3 of 7 complete"
   - Document checklist: "5 of 9 uploaded"

4. **Validation & Security**
   - USPS address validation
   - SSN encryption (AES-256-GCM)
   - File type validation
   - Virus scanning
   - Role-based access control

5. **Compliance**
   - Audit trail (who created, who approved, when)
   - Encryption for sensitive data
   - Emergency contact requirements
   - I-9 and work authorization tracking

---

## Workflow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         EMPLOYEE ONBOARDING                          │
└──────────────────────────────────────────────────────────────────────┘

STAGE 1: RECRUITER CREATES EMPLOYEE
┌─────────────────────────────────────────┐
│ Recruiter                               │
│ ├─ Enter basic info                     │
│ ├─ Select visa status                   │
│ ├─ Upload resume                         │
│ ├─ Upload driver's license               │
│ └─ Submit                                │
└─────────────┬───────────────────────────┘
              │
              │ Creates employee with:
              │ • needsHRApproval: true
              │ • hrApproved: false
              │ • onboardingStatus: "pending-review"
              ↓
┌─────────────────────────────────────────┐
│ System                                  │
│ ├─ Auto-generate document requests      │
│ │  (based on visa status)               │
│ ├─ Send notification to HR              │
│ └─ Block employee login                 │
└─────────────┬───────────────────────────┘
              │
              ↓
STAGE 2: HR REVIEWS & APPROVES
┌─────────────────────────────────────────┐
│ HR Manager                              │
│ ├─ View pending approval list           │
│ ├─ Review employee details              │
│ ├─ Preview uploaded documents           │
│ ├─ Decision:                             │
│ │  ├─ APPROVE ✅                         │
│ │  │  ├─ Optional: Add notes            │
│ │  │  └─ Grant access                   │
│ │  └─ REJECT ❌                          │
│ │     ├─ Required: Rejection reason     │
│ │     └─ Notify recruiter               │
│ └─ Submit decision                      │
└─────────────┬───────────────────────────┘
              │
              │ If APPROVED:
              │ • hrApproved: true
              │ • Send email to employee
              │ • Generate login credentials
              ↓
STAGE 3: EMPLOYEE COMPLETES PROFILE
┌─────────────────────────────────────────┐
│ Employee (First Login)                  │
│                                         │
│ Step 1/4: Confirm Name                  │
│ ├─ First Name                           │
│ └─ Last Name                            │
│                                         │
│ Step 2/4: Secure Information            │
│ ├─ SSN (encrypted)                      │
│ └─ Date of Birth                        │
│                                         │
│ Step 3/4: Address & Contact             │
│ ├─ Address (USPS validated)             │
│ ├─ City, State, ZIP                     │
│ └─ Phone                                │
│                                         │
│ Step 4/4: Emergency Contacts            │
│ ├─ Primary Contact (required)           │
│ │  ├─ Name                               │
│ │  ├─ Relationship                       │
│ │  ├─ Phone                              │
│ │  └─ Email (optional)                   │
│ └─ Additional Contacts (optional)       │
│                                         │
│ [✓ Complete Profile]                    │
└─────────────┬───────────────────────────┘
              │
              │ Saves:
              │ • profileCompleted: true
              │ • ssnEncrypted
              │ • emergencyContacts: [...]
              ↓
STAGE 4: ACTIVE EMPLOYEE
┌─────────────────────────────────────────┐
│ Employee Portal Dashboard               │
│                                         │
│ ✅ Personal Information                 │
│ ✅ Document Upload Center               │
│ ⏳ Document Status Tracking             │
│ ✅ Immigration Status (if applicable)   │
│ ✅ Leave Requests                        │
│ ✅ Project Assignments                   │
│ ⚠️  Timesheets (after classification)   │
│                                         │
│ Still Required:                         │
│ • Upload 5 more documents               │
│ • Wait for classification verification  │
│ • Complete onboarding stages (7 total)  │
└─────────────────────────────────────────┘

PARALLEL: DOCUMENT COLLECTION
┌─────────────────────────────────────────┐
│ Auto-Requested Documents                │
│ (based on visa status)                  │
│                                         │
│ Employee uploads → HR reviews →         │
│ Approve/Reject → Employee notified      │
│                                         │
│ Cycle continues until all docs approved │
└─────────────────────────────────────────┘
```

---

## Summary Statistics

**Average Onboarding Time:** 24-48 hours  
**Stages:** 4 (Recruiter → HR → Employee → Active)  
**Steps in Profile Wizard:** 4  
**Required Documents:** 4-9 (depending on visa status)  
**Roles Involved:** 3 (Recruiter, HR, Employee)  
**Approval Gates:** 2 (HR approval, Classification verification)  
**Automation Points:** 7 (Document requests, notifications, access control, etc.)

---

## Quick Reference

### For Recruiters:
1. Click "New Employee"
2. Fill all required fields + select visa status
3. Upload resume + driver's license
4. Submit
5. Monitor approval status on dashboard

### For HR:
1. Check "Pending HR Approvals" widget
2. Review employee details
3. Preview documents
4. Approve or Reject with notes
5. Employee receives email notification

### For Employees:
1. Receive email: "Your account is ready"
2. Log in with credentials
3. Complete 4-step profile wizard
4. Upload required documents
5. Monitor onboarding progress
6. Wait for timesheet access (after classification)

---

**Status:** ✅ Fully Operational  
**Compliance Level:** High  
**Security:** AES-256-GCM encryption for SSN  
**Accessibility:** WCAG 2.1 AA compliant
