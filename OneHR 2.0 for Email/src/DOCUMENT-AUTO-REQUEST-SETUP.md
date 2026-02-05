# Auto-Create Document Requests - Quick Setup Guide

## Overview
When a new employee is created in the onboarding system, automatically create all mandatory document requests so the employee immediately sees what documents they need to upload.

## Implementation

### Option 1: Add to Employee Creation Flow (Recommended)

In `/components/employee-onboarding.tsx`, find where employees are created and add this code:

```typescript
const createEmployee = async () => {
  try {
    // Existing employee creation code
    const newEmployeeData = {
      // ... employee fields
    };
    
    // Create the employee (your existing code)
    const employee = await kv.set(`employee:${employeeId}`, newEmployeeData);
    
    // NEW: Auto-create document requests
    const response = await fetch(`${API_URL}/document-requests/auto-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeEmail: employee.email,
        startDate: employee.startDate,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Created ${data.pendingCount} document requests for new employee`);
      toast.success(`Employee created! ${data.pendingCount} document requests sent.`);
    }
    
  } catch (error) {
    console.error('Error creating employee:', error);
  }
};
```

### Option 2: Manual Creation from HR Panel

HR staff can manually trigger document requests from the Document Collection Panel:

1. Go to Employee Onboarding
2. Click "View Workflow" on the employee
3. Click "Documents" tab
4. Click "Request Document" button
5. Select each mandatory document type and send

### Option 3: Batch Creation Script

Create all document requests for existing employees:

```typescript
const createDocumentRequestsForAllEmployees = async () => {
  const employees = await fetch(`${API_URL}/employees`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  
  const employeeList = await employees.json();
  
  for (const employee of employeeList.employees) {
    // Skip if already has requests
    const existingRequests = await fetch(
      `${API_URL}/document-requests?employeeId=${employee.id}`,
      { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
    );
    const requests = await existingRequests.json();
    
    if (requests.requests.length === 0) {
      // Create requests for this employee
      await fetch(`${API_URL}/document-requests/auto-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeEmail: employee.email,
          startDate: employee.startDate,
        }),
      });
      console.log(`Created requests for ${employee.firstName} ${employee.lastName}`);
    }
  }
};
```

## What Gets Created

When you call the auto-create endpoint, it creates 7 mandatory document requests:

1. **Government-issued ID** - Driver's License, State ID, or Passport
2. **Address Proof** - Utility Bill, Lease Agreement, or Bank Statement  
3. **Work Authorization** - EAD, Visa, Green Card, or I-94
4. **Direct Deposit Form** - Bank account/direct deposit authorization
5. **Emergency Contact** - Emergency contact information
6. **I-9 Form** - Employment Eligibility Verification
7. **W-4 Form** - Employee's Withholding Certificate

Each request includes:
- ✅ High priority
- ✅ Due date (employee start date or 7 days from creation)
- ✅ Detailed instructions for the employee
- ✅ Marked as mandatory and blocking onboarding
- ✅ Status tracking (pending → uploaded → verified)

## Employee Experience

Once requests are created:

1. Employee logs into Employee Portal
2. Sees "Documents" tab with badge showing pending count
3. Sees alert: "You have 7 pending documents to upload"
4. Clicks "Documents" tab
5. Sees list of requested documents with:
   - Document type
   - Due date
   - Instructions
   - "Upload This Document" button
6. Uploads each document
7. Sees verification status change from "Under Review" → "Verified"
8. Gets access to timesheets once all documents verified

## HR Experience

HR staff can:

1. View all pending requests in Document Collection Panel
2. See which employees have missing documents
3. Verify uploaded documents
4. Reject documents with reasons
5. Track completion percentage
6. Send reminder emails (manual or via cron)

## Verification Workflow

When HR verifies a document:

1. Document status changes to "verified"
2. Corresponding workflow flag is updated:
   - Government ID → `governmentIdReceived = true`
   - Address Proof → `addressProofReceived = true`
   - Work Authorization → `workAuthorizationReceived = true`
   - Direct Deposit → `bankAccountReceived = true`
   - Emergency Contact → `emergencyContactReceived = true`
3. Pending request count decremented
4. When all mandatory docs verified:
   - `allMandatoryDocumentsCollected = true`
   - `documentCollectionCompleteDate` set
   - Workflow can progress to next stage

## Testing the Flow

### Test as HR:
```
1. Create a new employee
2. Verify auto-requests were created (check logs)
3. Go to Employee Onboarding → View Workflow → Documents tab
4. See 7 pending requests
5. Upload a document on behalf of employee
6. Verify the document
7. See progress update
```

### Test as Employee:
```
1. Log in as employee
2. Go to Documents tab
3. See 7 pending document requests
4. Upload a document
5. Wait for HR to verify
6. See status change to "Verified"
7. See completion percentage increase
```

## Customization

### Change Due Date Logic:
In the auto-create endpoint, modify the due date calculation:

```typescript
// Current: 7 days from now or start date
const dueDate = startDate ? new Date(startDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

// Change to 3 days before start date:
const dueDate = new Date(new Date(startDate).getTime() - 3 * 24 * 60 * 60 * 1000);

// Change to fixed date:
const dueDate = new Date('2025-11-15');
```

### Add/Remove Mandatory Documents:
In `/supabase/functions/server/index.tsx`, modify the `mandatoryDocuments` array:

```typescript
const mandatoryDocuments = [
  { type: 'Government-issued ID', notes: '...' },
  { type: 'Address Proof', notes: '...' },
  // Add new:
  { type: 'Background Check', notes: 'Complete background check authorization' },
  // Remove by commenting out or deleting
];
```

### Change Priority:
Change from `high` to `critical` for urgent requests:

```typescript
priority: "critical",  // was "high"
```

## Error Handling

The auto-create endpoint validates:
- ✅ Required fields (employeeId, employeeName, employeeEmail)
- ✅ Returns 400 if missing
- ✅ Returns created request count
- ✅ Logs errors to console

```typescript
if (!employeeId || !employeeName || !employeeEmail) {
  return c.text("Missing required fields", 400);
}
```

## Monitoring

To see how many requests are pending:

```typescript
const checkPendingRequests = async () => {
  const response = await fetch(`${API_URL}/document-requests`, {
    headers: { 'Authorization': `Bearer ${publicAnonKey}` }
  });
  const data = await response.json();
  
  const pending = data.requests.filter(r => 
    r.status === 'pending' || r.status === 'overdue'
  );
  
  console.log(`${pending.length} pending document requests across all employees`);
};
```

## Summary

The auto-create system ensures every new employee immediately knows what documents they need to upload, streamlines the onboarding process, and ensures compliance with document collection requirements. 

Simply call the auto-create endpoint when creating a new employee, and the rest is handled automatically!
