# New Employee Onboarding Workflow Guide

## 📋 Overview

The employee onboarding process has been updated to a simplified, document-centric workflow focused on essential requirements.

## 🔄 New Workflow Steps

### Step 1: Employee Creation (Recruiter or HR)
**Location:** Employee Onboarding > New Employee Button

**Required Fields:**
- ✅ First Name
- ✅ Last Name  
- ✅ Email
- ✅ Visa Status

**Optional at Creation:**
- EAD Document (can be uploaded by recruiter or employee later)
- Other employment details (position, department, start date, etc.)

**What Happens:**
- System determines if EAD is required based on visa status
- If visa status = "US Citizen" or "Green Card Holder" → No EAD needed
- If visa status = H-1B, F-1 OPT, etc. → EAD required
- Employee record created with `onboardingStatus: "in-progress"`

---

### Step 2: Employee First Login
**Location:** Employee Portal (employee logs in with their email)

**What Employee Sees:**
1. Welcome screen
2. **IF EAD Required:** Prominent alert requesting EAD upload
   - "Your visa status requires an Employment Authorization Document (EAD)"
   - Upload button with file picker
   - Supported formats: PDF, JPG, PNG

**Employee Actions:**
- Upload EAD document
- Document status changes to `"pending-review"`
- HR is notified

**What Happens in Backend:**
- Document added to `employee.onboardingDocuments` array
- Document type: "EAD"
- Status: "pending-review"
- `employee.eadApproved = false`

---

### Step 3: HR Document Review & Approval
**Location:** Employee Onboarding > **Document Review Tab**

#### New "Document Review" Tab Features:

**Badge Indicator:**
- Shows number of pending documents
- Example: "Document Review (3)" with orange badge

**Document Review Interface:**

```
┌─────────────────────────────────────────────────────────────┐
│  Pending Document Reviews                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📄 John Doe - EAD Document                                  │
│     Uploaded: Nov 10, 2024 2:30 PM                          │
│     Status: Pending Review                                   │
│                                                               │
│     [👁️ View Document]  [✅ Approve]  [❌ Reject]           │
│                                                               │
│  ────────────────────────────────────────────────────────  │
│                                                               │
│  📄 Jane Smith - EAD Document                                │
│     Uploaded: Nov 10, 2024 1:15 PM                          │
│     Status: Pending Review                                   │
│                                                               │
│     [👁️ View Document]  [✅ Approve]  [❌ Reject]           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**HR Actions:**
1. **View Document:** Opens document in new tab/modal
2. **Approve:** 
   - Document status → "approved"
   - `employee.eadApproved = true`
   - Employee notified
3. **Reject:**
   - Document status → "rejected"  
   - HR adds rejection reason
   - Employee must re-upload

**API Endpoint Used:**
```
PUT /make-server-f8517b5b/employees/:employeeId/onboarding-document/:documentType/review
Body: { approved: true/false, reviewNotes: "..." }
```

---

### Step 4: HR Sends Offer Letter & NDA
**Location:** Employee Onboarding > Employee Detail View

**After EAD is Approved (or if not required):**

HR sees "Send Documents" section:

```
┌─────────────────────────────────────────────────────────────┐
│  Send Onboarding Documents                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📄 Offer Letter                                             │
│     Status: Not Sent                                         │
│     [📤 Upload & Send to Employee]                          │
│                                                               │
│  📄 Non-Disclosure Agreement (NDA)                           │
│     Status: Not Sent                                         │
│     [📤 Upload & Send to Employee]                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**HR Actions:**
1. Click "Upload & Send"
2. Select PDF file
3. System sends document to employee
4. Document status: "pending-review" (waiting for employee signature)
5. `employee.offerLetterSent = true` and `employee.ndaSent = true`

**API Endpoint Used:**
```
POST /make-server-f8517b5b/employees/:employeeId/send-document
Body: { documentType: "offer-letter", fileName: "...", fileUrl: "..." }
```

---

### Step 5: Employee Signs Documents
**Location:** Employee Portal > Documents Tab

**Employee Sees:**

```
┌─────────────────────────────────────────────────────────────┐
│  Action Required: Sign Documents                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📄 Offer Letter (from HR)                                   │
│     Received: Nov 10, 2024 3:00 PM                          │
│     [👁️ View]  [✍️ Sign & Upload]                           │
│                                                               │
│  📄 Non-Disclosure Agreement                                 │
│     Received: Nov 10, 2024 3:00 PM                          │
│     [👁️ View]  [✍️ Sign & Upload]                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Employee Actions:**
1. Download/View document
2. Sign document (physically or digitally)
3. Upload signed version
4. System updates document type to "offer-letter-signed" and "nda-signed"
5. Status: "pending-review"

**API Endpoint Used:**
```
POST /make-server-f8517b5b/employees/:employeeId/onboarding-document
Body: { documentType: "offer-letter-signed", fileName: "...", fileUrl: "..." }
```

---

### Step 6: HR Final Review
**Location:** Employee Onboarding > Document Review Tab

**HR Reviews Signed Documents:**

```
┌─────────────────────────────────────────────────────────────┐
│  📄 John Doe - Signed Offer Letter                          │
│     Uploaded: Nov 10, 2024 4:30 PM                          │
│     Status: Pending Review                                   │
│                                                               │
│     [👁️ View Document]  [✅ Approve]  [❌ Reject]           │
│                                                               │
│  ────────────────────────────────────────────────────────  │
│                                                               │
│  📄 John Doe - Signed NDA                                    │
│     Uploaded: Nov 10, 2024 4:31 PM                          │
│     Status: Pending Review                                   │
│                                                               │
│     [👁️ View Document]  [✅ Approve]  [❌ Reject]           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**HR Actions:**
- Approve both signed documents
- System checks if all required documents are approved
- If yes: `employee.onboardingStatus = "completed"`
- If yes: `employee.canAccessTimesheets = true`

---

## 📊 Document Status Flow

```
┌─────────────────┐
│  not-uploaded   │  ← Initial state
└────────┬────────┘
         │ Employee/HR uploads
         ↓
┌─────────────────┐
│ pending-review  │  ← Waiting for HR approval
└────────┬────────┘
         │ HR reviews
         ↓
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌──────────┐
│approved │ │ rejected │
└─────────┘ └──────────┘
              ↓ Employee re-uploads
         ┌────┘
         ↓
┌─────────────────┐
│ pending-review  │
└─────────────────┘
```

---

## 🎯 Where HR Approves Things

### Primary Location: **Document Review Tab**

**Path:** Employee Onboarding > Document Review Tab (New!)

This tab shows:
- All pending EAD documents
- All pending signed offer letters
- All pending signed NDAs
- Grouped by employee
- One-click approve/reject

### Secondary Location: **Employee Detail View**

**Path:** Employee Onboarding > Click Employee Name > Documents Section

Shows document history for individual employee

---

## 🔐 Onboarding Completion Criteria

Employee onboarding is marked **"completed"** when:

✅ **IF visa requires EAD:**
  - EAD uploaded by employee
  - EAD approved by HR

✅ **Offer letter:**
  - Sent by HR
  - Signed by employee  
  - Approved by HR

✅ **NDA:**
  - Sent by HR
  - Signed by employee
  - Approved by HR

**Result:** 
- `employee.onboardingStatus = "completed"`
- `employee.canAccessTimesheets = true`
- Employee can now submit timesheets

---

## 📝 Implementation Status

### ✅ Completed:
- [x] Updated employee creation to require only: name, email, visa status
- [x] Added `onboardingDocuments` array to employee record
- [x] Created document workflow types (EAD, offer-letter, nda, etc.)
- [x] Added backend endpoints for document upload/approval
- [x] Added "Document Review" tab with badge indicator

### 🚧 In Progress:
- [ ] Complete Document Review tab UI
- [ ] Add document upload modals for HR
- [ ] Add signed document upload for employees  
- [ ] Add document viewer/preview functionality
- [ ] Update employee portal to show required documents
- [ ] Add email notifications for document status changes

---

## 🚀 Quick Test Flow

### Test as HR:
1. Login as HR
2. Go to Employee Onboarding
3. Click "New Employee"
4. Fill in: John Doe, john@test.com, Visa Status: "H-1B"
5. Click Save
6. Go to "Document Review" tab
7. Wait for employee to upload EAD
8. Approve/Reject document

### Test as Employee:
1. Login as john@test.com
2. See alert: "EAD Required"
3. Upload EAD document
4. Wait for HR approval
5. After approval, receive offer letter & NDA
6. Sign and upload both
7. After HR approves, see "Onboarding Complete!" message

---

## 🎨 UI Components Needed

### For HR (Employee Onboarding Component):
```tsx
// Document Review Tab
<TabsContent value="documents">
  <DocumentReviewPanel employees={employees} />
</TabsContent>

// Document Review Panel Component
<Card>
  <CardHeader>
    <CardTitle>Pending Document Reviews</CardTitle>
  </CardHeader>
  <CardContent>
    {employeesWithPendingDocs.map(employee => (
      <DocumentReviewCard
        employee={employee}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    ))}
  </CardContent>
</Card>
```

### For Employee (Employee Portal Component):
```tsx
// Required Documents Alert
{employee.eadRequired && !employee.eadApproved && (
  <Alert className="border-orange-200 bg-orange-50">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>EAD Required</AlertTitle>
    <AlertDescription>
      Please upload your Employment Authorization Document
      <Button onClick={openEADUpload}>Upload EAD</Button>
    </AlertDescription>
  </Alert>
)}

// Pending Signatures Section
{employee.offerLetterSent && !employee.offerLetterSigned && (
  <Card>
    <CardHeader>
      <CardTitle>Action Required: Sign Offer Letter</CardTitle>
    </CardHeader>
    <CardContent>
      <Button onClick={viewDocument}>View Document</Button>
      <Button onClick={uploadSigned}>Upload Signed Copy</Button>
    </CardContent>
  </Card>
)}
```

---

## 📞 Support

If you have questions about the new onboarding workflow:
1. Check this guide
2. Look at the API endpoints in `/supabase/functions/server/index.tsx`
3. Review the types in `/types/index.ts`

---

**Last Updated:** November 10, 2024
**Version:** 1.0
