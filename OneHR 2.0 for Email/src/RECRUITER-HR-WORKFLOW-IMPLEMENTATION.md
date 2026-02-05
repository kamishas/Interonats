# Recruiter-to-HR Workflow Implementation Guide

## 🎯 Overview

This document explains the complete implementation of the **Recruiter-Initiated Employee Onboarding with HR Approval Workflow**, which adds the missing features to create a compliant, role-based employee onboarding process.

---

## ✅ What Was Implemented

### **1. Recruiter Initiates Onboarding**
Recruiters can now create employee records with:
- ✅ Name (First & Last)
- ✅ Phone Number
- ✅ Email
- ✅ Job Title (Position)
- ✅ **NEW:** Visa Status field
- ✅ **NEW:** Resume upload
- ✅ **NEW:** Driver's License upload
- ✅ Start Date, Department, Home State

### **2. HR Approval Workflow**
- ✅ **NEW:** `needsHRApproval` flag set when recruiter creates employee
- ✅ **NEW:** Employee cannot log in until HR approves
- ✅ **NEW:** HR Approval Dashboard component (`/components/hr-approval-workflow.tsx`)
- ✅ **NEW:** HR can approve or reject with notes
- ✅ **NEW:** Tracks who created employee (`createdBy`, `createdByRole`)
- ✅ **NEW:** Tracks who approved (`hrApprovedBy`, `hrApprovedDate`)

### **3. Employee First Login Profile Completion**
Employees complete a **4-step wizard** on first login:

**Step 1: Confirm Name** ✅ (existing)
- First Name
- Last Name

**Step 2: Secure Information** ✅ (existing)
- Social Security Number (encrypted with AES-256-GCM)
- Date of Birth

**Step 3: Contact Information** ✅ (existing + enhanced)
- Address (with USPS validation)
- City, State, ZIP Code
- Phone Number

**Step 4: Emergency Contacts** ✅ **NEW**
- At least 1 emergency contact required
- Can add multiple contacts
- Fields: Name, Relationship, Phone, Email (optional)

### **4. SSN Privacy & HR-Only Visibility**
- ✅ SSN encrypted before storage (`ssnEncrypted` field)
- ✅ **NEW:** Permission check in components to show SSN only to HR role
- ✅ Never transmitted or displayed in plain text
- ✅ Separate field names: `ssn` (plain, temporary) vs `ssnEncrypted` (stored)

### **5. Data Model Updates**
New fields added to `Employee` type in `/types/index.ts`:
```typescript
// Visa tracking
visaStatus?: string;

// SSN encryption
ssnEncrypted?: string;

// HR Approval Workflow
createdBy?: string;
createdByRole?: string;
needsHRApproval?: boolean;
hrApproved?: boolean;
hrApprovedBy?: string;
hrApprovedDate?: string;
hrReviewNotes?: string;

// Profile completion
profileCompleted?: boolean;
profileCompletedAt?: string;
emergencyContacts?: EmergencyContact[];
```

---

## 📁 Files Created

### **1. `/components/hr-approval-workflow.tsx`**
**Purpose:** HR Dashboard to review and approve recruiter submissions

**Features:**
- Displays list of employees pending HR approval
- Shows recruiter-provided information summary
- HR can approve or reject with notes
- Approval grants employee portal access
- Rejection sends notification back to recruiter

**Usage:**
```tsx
import { HRApprovalWorkflow } from './components/hr-approval-workflow';

// In HR Dashboard
<HRApprovalWorkflow onRefresh={fetchEmployees} />
```

---

## 📝 Files Modified

### **1. `/types/index.ts`**
**Changes:**
- Added `EmergencyContact` interface
- Added new employee fields for workflow tracking
- Added SSN encryption fields
- Added visa status field

### **2. `/components/employee-onboarding.tsx`**
**Changes:**
- Added `visaStatus` field to new employee form
- Added document upload state for resume and driver's license
- Set `needsHRApproval: true` when recruiter creates employee
- Set `createdBy` and `createdByRole` tracking fields

**NEW Fields in Form:**
```typescript
newEmployee: {
  // ... existing fields
  visaStatus: '', // NEW
}

// NEW Document uploads
resumeFile: File | null;
driverLicenseFile: File | null;
```

### **3. `/components/employee-profile-completion.tsx`**
**Changes:**
- Changed from 3 steps to 4 steps
- Added emergency contacts state and management
- Added step 4 validation for emergency contacts
- Updated submission to include emergency contacts
- Changed `ssn` to `ssnEncrypted` in submission

**NEW Functions:**
```typescript
validateStep4(); // Validates emergency contact
addEmergencyContact(); // Adds additional contact
removeEmergencyContact(id); // Removes contact (min 1 required)
updateEmergencyContact(id, field, value); // Updates contact field
```

### **4. `/components/employee-portal.tsx`**
**Changes:**
- Blocks access if `needsHRApproval === true && hrApproved !== true`
- Shows "Pending HR Approval" message instead of portal
- Only allows profile completion after HR approval

### **5. `/supabase/functions/server/index.tsx`**
**Backend Changes:**
- Added `/employees?needsHRApproval=true` endpoint for HR dashboard
- Added `/employees/:id/hr-approve` endpoint for HR approval action
- Updated employee creation to set `needsHRApproval`, `createdBy`, `createdByRole`
- Updated employee update to handle new fields
- Added SSN encryption handling
- Added emergency contacts storage

---

## 🔄 Complete Workflow

### **Step-by-Step Process:**

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Recruiter Creates Employee                             │
├─────────────────────────────────────────────────────────────────┤
│ 1. Recruiter logs in with recruiter role                        │
│ 2. Goes to "Employees" → "New Employee"                        │
│ 3. Fills in form:                                               │
│    ├── Name: John Smith                                         │
│    ├── Email: john.smith@email.com                              │
│    ├── Phone: (555) 123-4567                                    │
│    ├── Position: Software Developer                             │
│    ├── Visa Status: H-1B                                        │
│    ├── Department: Engineering                                  │
│    ├── Start Date: 2024-02-01                                   │
│    ├── Upload Resume: resume.pdf                                │
│    └── Upload Driver's License: license.pdf                     │
│ 4. Clicks "Create Employee"                                     │
│ 5. System sets:                                                 │
│    ├── needsHRApproval: true                                    │
│    ├── createdBy: recruiter_user_id                             │
│    ├── createdByRole: "recruiter"                               │
│    └── onboardingStatus: "pending-review"                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: HR Reviews & Approves                                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. HR Manager logs in with hr role                              │
│ 2. Sees "Pending HR Approvals" badge notification (count: 1)    │
│ 3. Opens HR Approval Dashboard                                  │
│ 4. Reviews John Smith's information:                            │
│    ├── Name: John Smith ✓                                       │
│    ├── Email: john.smith@email.com ✓                            │
│    ├── Phone: (555) 123-4567 ✓                                  │
│    ├── Position: Software Developer ✓                           │
│    ├── Visa Status: H-1B ✓                                      │
│    ├── Resume: ✓ Downloaded and reviewed                        │
│    └── Driver's License: ✓ Downloaded and reviewed              │
│ 5. Clicks "Review" button                                       │
│ 6. Enters review notes (optional): "All documents verified"     │
│ 7. Clicks "Approve & Grant Access"                              │
│ 8. System sets:                                                 │
│    ├── needsHRApproval: false                                   │
│    ├── hrApproved: true                                         │
│    ├── hrApprovedBy: hr_user_id                                 │
│    ├── hrApprovedDate: "2024-01-15T10:30:00Z"                   │
│    ├── hrReviewNotes: "All documents verified"                  │
│    └── onboardingStatus: "in-progress"                          │
│ 9. Employee receives email: "Your account is ready!"            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Employee First Login - Profile Completion Wizard       │
├─────────────────────────────────────────────────────────────────┤
│ 1. John Smith receives email with login credentials             │
│ 2. Clicks "Login to Employee Portal"                            │
│ 3. Enters email & password                                      │
│ 4. System checks:                                               │
│    ├── hrApproved === true? ✓ Yes                               │
│    ├── profileCompleted === true? ✗ No                          │
│    └── Redirect to: Profile Completion Wizard                   │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Step 1 of 4: Confirm Your Name                           │  │
│ ├───────────────────────────────────────────────────────────┤  │
│ │ First Name: [John         ] ✓                            │  │
│ │ Last Name:  [Smith        ] ✓                            │  │
│ │ [Next →]                                                  │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Step 2 of 4: Secure Information                          │  │
│ ├───────────────────────────────────────────────────────────┤  │
│ │ SSN: [123-45-6789] 🔒 Encrypted                          │  │
│ │ Date of Birth: [MM/DD/YYYY]                              │  │
│ │ [← Back]  [Next →]                                        │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Step 3 of 4: Address & Contact                           │  │
│ ├───────────────────────────────────────────────────────────┤  │
│ │ Address: [123 Main St] [Validate Address ✓]              │  │
│ │ City: [San Francisco]  State: [CA]  ZIP: [94102]         │  │
│ │ Phone: [(555) 123-4567]                                   │  │
│ │ [← Back]  [Next →]                                        │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Step 4 of 4: Emergency Contacts (NEW!)                   │  │
│ ├───────────────────────────────────────────────────────────┤  │
│ │ Primary Contact (Required)                                │  │
│ │ Name: [Jane Smith]                                        │  │
│ │ Relationship: [Spouse]                                    │  │
│ │ Phone: [(555) 987-6543]                                   │  │
│ │ Email: [jane@email.com] (optional)                        │  │
│ │                                                            │  │
│ │ [+ Add Another Contact]                                   │  │
│ │ [← Back]  [✓ Complete Profile]                            │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ 5. Clicks "Complete Profile"                                    │
│ 6. System saves:                                                │
│    ├── ssnEncrypted: "AES-256-GCM-encrypted-value"              │
│    ├── dateOfBirth: "1990-05-15"                                │
│    ├── address: "123 Main St"                                   │
│    ├── city: "San Francisco"                                    │
│    ├── state: "CA"                                              │
│    ├── zipCode: "94102"                                         │
│    ├── phoneNumber: "(555) 123-4567"                            │
│    ├── emergencyContacts: [...]                                 │
│    ├── profileCompleted: true                                   │
│    └── profileCompletedAt: "2024-01-15T14:30:00Z"               │
│ 7. Redirect to: Employee Portal Dashboard                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Employee Portal Access Granted                         │
├─────────────────────────────────────────────────────────────────┤
│ John Smith now sees:                                            │
│ ├── Dashboard with onboarding progress                          │
│ ├── Document upload center                                      │
│ ├── Immigration status (if applicable)                          │
│ ├── Timesheet module (if classification complete)               │
│ ├── Leave requests                                              │
│ └── Profile management                                          │
│                                                                  │
│ HR can now see:                                                 │
│ ├── John Smith in employee list                                 │
│ ├── All information provided by John (EXCEPT SSN)               │
│ ├── SSN: Only HR role can view encrypted SSN                    │
│ ├── Emergency contacts                                          │
│ ├── Onboarding workflow progress                                │
│ └── Documents uploaded                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 SSN Privacy Implementation

### **How It Works:**

**Employee Side:**
1. Employee enters SSN in plain text: `123-45-6789`
2. Client-side encryption using AES-256-GCM
3. Encrypted value sent to server: `U2FsdGVkX1...` (base64)
4. Stored in database as `ssnEncrypted`
5. Original `ssn` never stored

**HR Side:**
```typescript
// In employee detail view
{user.role === 'hr' && employee.ssnEncrypted && (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>SSN (Encrypted)</Label>
      <Badge variant="outline">🔒 Protected</Badge>
    </div>
  </div>
)}

// Only HR can see that SSN exists
// Actual decryption would require server-side key management
```

**Other Roles:**
- Admin: Cannot see SSN
- Recruiter: Cannot see SSN
- Employee: Can see their own (if we add employee self-service view)

---

## 🚫 Blocking Employee Login Before HR Approval

### **Implementation:**

**In `/components/employee-portal.tsx`:**
```typescript
useEffect(() => {
  if (user && user.role === 'employee') {
    fetchEmployeeData();
  }
}, [user]);

const fetchEmployeeData = async () => {
  const response = await fetch(`${API_URL}/employees/${user.id}`);
  const employee = await response.json();
  
  // Block access if pending HR approval
  if (employee.needsHRApproval && !employee.hrApproved) {
    setShowPendingApprovalMessage(true);
    return;
  }
  
  // Check if profile completion needed
  if (!employee.profileCompleted) {
    setShowProfileCompletion(true);
    return;
  }
  
  // Grant full portal access
  setEmployeeData(employee);
};
```

**Pending Approval Screen:**
```tsx
{showPendingApprovalMessage && (
  <Card>
    <CardHeader>
      <CardTitle>Pending HR Review</CardTitle>
    </CardHeader>
    <CardContent>
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Your account is being reviewed</AlertTitle>
        <AlertDescription>
          Your information has been submitted and is pending HR approval. 
          You'll receive an email when your account is ready.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
)}
```

---

## 📊 Data Flow Diagram

```
Recruiter                HR Manager              Employee                Database
    |                        |                       |                       |
    |--[Create Employee]---->|                       |                       |
    |   (with visa status,   |                       |                       |
    |    resume, license)    |                       |                       |
    |                        |                       |                       |
    |------------------------|---[needsHRApproval]-->|                       |
    |                        |                       |                       |
    |                        |<--[Pending List]------|                       |
    |                        |                       |                       |
    |                        |--[Approve]----------->|                       |
    |                        |   (hrApproved=true)   |                       |
    |                        |                       |                       |
    |                        |                       |<--[Email Invite]------|
    |                        |                       |                       |
    |                        |                       |--[First Login]------->|
    |                        |                       |                       |
    |                        |                       |<--[Check Status]------|
    |                        |                       |   hrApproved? ✓       |
    |                        |                       |   profileComplete? ✗   |
    |                        |                       |                       |
    |                        |                       |--[Profile Wizard]---->|
    |                        |                       |   Step 1: Name        |
    |                        |                       |   Step 2: SSN (enc)   |
    |                        |                       |   Step 3: Address     |
    |                        |                       |   Step 4: Emergency   |
    |                        |                       |                       |
    |                        |                       |--[Submit Profile]---->|
    |                        |                       |   (encrypted SSN,     |
    |                        |                       |    emergency contacts)|
    |                        |                       |                       |
    |                        |                       |<--[Portal Access]-----|
    |                        |                       |   ✓ Full Access       |
    |                        |                       |                       |
    |                        |<--[View Employee]-----|                       |
    |                        |   (all data except    |                       |
    |                        |    plain SSN)         |                       |
```

---

## 🧪 Testing Checklist

### **Recruiter Tests:**
- [ ] Log in as Recruiter
- [ ] Create new employee with all fields including visa status
- [ ] Upload resume PDF
- [ ] Upload driver's license image
- [ ] Verify employee appears in list with "Pending HR Approval" badge
- [ ] Verify recruiter cannot approve their own submissions

### **HR Tests:**
- [ ] Log in as HR Manager
- [ ] See "Pending HR Approvals" notification badge
- [ ] Open HR Approval Workflow dashboard
- [ ] Review employee details
- [ ] Verify resume download works
- [ ] Verify driver's license download works
- [ ] Test rejection flow with notes
- [ ] Test approval flow
- [ ] Verify employee receives email after approval

### **Employee Tests:**
- [ ] Try to log in before HR approval → See "Pending Review" message
- [ ] After HR approval, receive email invite
- [ ] Log in for first time
- [ ] Complete Step 1: Confirm name
- [ ] Complete Step 2: Enter SSN and DOB
- [ ] Complete Step 3: Enter address with USPS validation
- [ ] Complete Step 4: Add emergency contact (required)
- [ ] Add second emergency contact (optional)
- [ ] Remove second contact (verify min 1 required)
- [ ] Submit profile
- [ ] Verify access to employee portal
- [ ] Verify SSN not visible in own profile view

### **HR Visibility Tests:**
- [ ] Log in as HR
- [ ] View employee detail
- [ ] Verify can see emergency contacts
- [ ] Verify SSN field shows "🔒 Protected" (encrypted)
- [ ] Verify all other employee information is visible

### **Admin Tests:**
- [ ] Log in as Admin
- [ ] View employees (view-only mode)
- [ ] Verify cannot see SSN
- [ ] Verify cannot approve/reject pending employees

---

## 🎨 UI/UX Enhancements

### **Visual Indicators:**
- 🟠 Orange badge: "Pending HR Approval"
- 🟢 Green badge: "HR Approved"
- 🔴 Red badge: "Rejected by HR"
- 🔒 Lock icon: Encrypted/Secure field
- ✅ Checkmark: Step completed
- 🕐 Clock icon: Pending/In Progress

### **Color Coding:**
- Pending approval cards: `bg-orange-50 border-orange-200`
- Approved items: `bg-green-50 border-green-200`
- Rejected items: `bg-red-50 border-red-200`
- Secure fields: `bg-blue-50` with lock icon

---

## 📚 API Endpoints

### **New Endpoints:**

**1. Get Pending Approvals:**
```
GET /employees?needsHRApproval=true
Authorization: Bearer {publicAnonKey}

Response:
{
  employees: [
    {
      id: "emp-123",
      firstName: "John",
      lastName: "Smith",
      visaStatus: "H-1B",
      createdBy: "recruiter-456",
      createdByRole: "recruiter",
      needsHRApproval: true,
      hrApproved: false
    }
  ]
}
```

**2. HR Approve/Reject:**
```
POST /employees/{id}/hr-approve
Authorization: Bearer {publicAnonKey}
Content-Type: application/json

Body:
{
  approved: true,
  notes: "All documents verified"
}

Response:
{
  success: true,
  employee: {
    id: "emp-123",
    needsHRApproval: false,
    hrApproved: true,
    hrApprovedBy: "hr-789",
    hrApprovedDate: "2024-01-15T10:30:00Z",
    hrReviewNotes: "All documents verified"
  }
}
```

---

## 🔐 Security Considerations

### **1. SSN Encryption:**
- Client-side encryption using AES-256-GCM
- Encryption key stored securely (environment variable)
- Never log or display plain SSN in server logs
- Encrypted SSN stored in separate field

### **2. Role-Based Access:**
- Only HR role can approve employees
- Only HR role can view SSN (encrypted)
- Recruiters cannot approve their own submissions
- Employees blocked from portal until HR approval

### **3. Audit Trail:**
- Track who created employee (`createdBy`, `createdByRole`)
- Track who approved (`hrApprovedBy`, `hrApprovedDate`)
- Store HR review notes
- Log all approval/rejection actions

---

## 🚀 Deployment Notes

### **Database Migration:**
No formal migration needed (using KV store), but ensure:
1. All existing employees have `needsHRApproval: false` (grandfathered)
2. All existing employees have `hrApproved: true` (grandfathered)
3. New employees created by recruiters get `needsHRApproval: true`

### **Gradual Rollout:**
1. Deploy backend changes first
2. Deploy HR Approval component
3. Deploy updated employee onboarding with visa status
4. Deploy employee profile completion with emergency contacts
5. Test thoroughly before announcing to users

---

## 📞 Support

### **For Recruiters:**
- **Question:** "Why can't the employee log in?"
- **Answer:** "HR needs to approve the employee first. Check the HR Approval Dashboard."

### **For HR:**
- **Question:** "Where do I approve employees?"
- **Answer:** "Dashboard → Pending HR Approvals section at the top"

### **For Employees:**
- **Question:** "I can't log in yet"
- **Answer:** "Your account is pending HR review. You'll receive an email when ready."

---

## ✅ Success Metrics

After implementation, you should see:
- ✅ 100% of recruiter-created employees require HR approval
- ✅ 0% employee logins before HR approval
- ✅ 100% employees complete profile wizard on first login
- ✅ 100% employees have at least 1 emergency contact
- ✅ 0% plain-text SSN stored in database
- ✅ HR-only visibility for sensitive information

---

**Status:** ✅ Ready for Implementation  
**Last Updated:** 2024-01-15  
**Version:** 1.0.0
