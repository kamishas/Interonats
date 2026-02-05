# How to Approve Employee Documents - Complete Guide

## Overview
The system has a comprehensive document approval workflow where HR, Hiring Managers, and Admins can review, approve, or reject documents uploaded by employees.

## ✨ New Features Added
- ✅ **Approve/Reject buttons** added to **Document Management** page (main Documents view)
- 📊 **Pending Review stat card** - Click to instantly filter documents awaiting approval
- 🚨 **Alert banner** for pending documents - Shows count and quick filter link
- 🔍 **Verification Status filter** - Filter by Pending, Verified, or Rejected
- 📋 **Verification column** in table - See approval status at a glance
- ⚡ **Quick approve from table** - No need to open preview dialog
- 📝 **Rejection reason display** - Shows why document was rejected
- 👤 **Verification history** - See who approved/rejected and when

## Quick Steps to Approve Documents

### Method 1: From Employee Profile (Document Collection Panel)

1. **Navigate to Employee Profile**
   - Go to **Employees** from the main navigation
   - Click on the employee whose documents you want to review
   - Click on the **Documents** tab

2. **Review Required Documents**
   - You'll see sections for:
     - **Required Documents** (mandatory for onboarding)
     - **Optional Documents** (additional uploads)
   - Each document shows:
     - ✅ **Green checkmark** = Verified
     - 🕐 **Blue clock** = Pending review (uploaded but not approved)
     - 📄 **Gray icon** = Not uploaded yet

3. **View the Document**
   - Click the **eye icon (👁️)** to preview the document
   - You'll see:
     - **For Images**: Full image preview
     - **For PDFs**: PDF viewer
     - **For Other Files**: File information with download option

4. **Approve the Document**
   - Click the **green checkmark button** (✓) next to pending documents
   - A success toast will appear: "Document verified successfully"
   - The document status changes to **Verified**
   - The employee can now see their document is approved

5. **Reject the Document**
   - Click the **red X button** (✗) next to pending documents
   - A dialog will open asking for a rejection reason
   - Enter a clear reason (e.g., "Image is blurry, please re-upload", "Wrong document type", "Expired document")
   - Click **Reject Document**
   - The employee will see:
     - Document status: **Rejected**
     - Your rejection reason
     - Option to re-upload

---

### Method 2: From Document Management (HR View)

1. **Navigate to Document Management**
   - Go to **Documents** from the main navigation
   - You'll see all documents across all employees
   - **Top Stats Cards** show:
     - Total Documents
     - Active Documents
     - **Pending Review** (click this card to filter pending documents!)
     - Expiring Soon
     - Pending Signature

2. **Filter Documents**
   - Use the search bar to find specific documents
   - Filter by:
     - **Employee**: Select specific employee
     - **Document Type**: Filter by type (Resume, I-9, W-4, etc.)
     - **Verification Status**: Show Pending Review, Verified, or Rejected
     - **Status**: Active, Expired, or Archived

3. **Review Documents in Table**
   - The table shows:
     - Employee name
     - Document name and file name
     - Document type
     - Upload date
     - Expiry date (if applicable)
     - **Verification Status** badge (Pending Review, Verified, Rejected)
     - Status badge (Active, Expiring Soon, etc.)

4. **Quick Approve from Table**
   - For pending documents, you'll see action buttons:
   - Click **green checkmark (✓)** to approve immediately
   - Click **red X (✗)** to reject (opens rejection dialog)
   - No need to open the preview dialog!

5. **View and Approve from Preview Dialog**
   - Click the **eye icon** to open full preview
   - In the preview dialog, you'll see:
     - Full document preview (images/PDFs)
     - Document metadata
     - Verification status and history
     - For pending documents: Large "Verify Document" and "Reject Document" buttons

6. **Quick Actions in Preview**
   - **Approve**: Click "Verify Document" button
   - **Reject**: Click "Reject Document" button and provide reason
   - **Download**: Download the original file
   - **Copy Document ID**: Copy for reference
   - **Notify Employee**: Send email notification

---

## Document Verification States

### Pending (Default)
- **Badge Color**: Gray/Secondary
- **Status**: "Under Review" or "Pending Review"
- **Actions Available**: Approve or Reject
- **Employee Can**: View, Edit, Delete
- **HR Can**: View, Approve, Reject, Delete

### Verified (Approved)
- **Badge Color**: Green
- **Status**: "Verified"
- **Actions Available**: View only
- **Employee Can**: View only (cannot edit or delete)
- **HR Can**: View, Delete
- **Notes**: Employee cannot modify verified documents

### Rejected
- **Badge Color**: Red
- **Status**: "Rejected"
- **Rejection Reason**: Displayed to employee
- **Actions Available**: View, Re-upload
- **Employee Can**: View, Delete, Re-upload
- **HR Can**: View, Delete
- **Notes**: Employee sees rejection reason and can upload a new version

---

## Document Types That Can Be Approved

### Required Documents (Mandatory)
1. **Government-issued ID** - Driver's License, State ID, Passport
2. **I-9 Form** - Employment eligibility verification
3. **W-4 Form** - Tax withholding information
4. **Direct Deposit Form** - Banking information
5. **Address Proof** - Utility bill, lease agreement
6. **Social Security Card** - SSN verification

### Optional Documents
1. **Resume/CV** - Professional background
2. **Background Check** - Pre-employment screening
3. **Offer Letter** - Job offer acceptance
4. **NDA** - Non-disclosure agreement
5. **Employment Agreement** - Contract terms
6. **Performance Reviews** - Past evaluations
7. **Certifications** - Professional credentials
8. **Other** - Miscellaneous documents

---

## Best Practices for Document Approval

### ✅ Do's

1. **Review Thoroughly**
   - Check document clarity and completeness
   - Verify information matches employee records
   - Ensure documents are current (not expired)

2. **Provide Clear Feedback**
   - If rejecting, explain exactly what's wrong
   - Be specific (e.g., "Expiration date not visible" vs "Bad quality")
   - Include what the employee needs to do

3. **Approve Promptly**
   - Review documents within 24-48 hours
   - Don't delay onboarding unnecessarily
   - Use filters to find pending documents quickly

4. **Check Expiration Dates**
   - System alerts for documents expiring within 30 days
   - Reject if document is already expired
   - Request renewal if expiring soon

### ❌ Don'ts

1. **Don't Approve Without Reviewing**
   - Always view the actual document
   - Don't approve based on file name alone

2. **Don't Reject Without Reason**
   - System requires a rejection reason
   - Generic reasons aren't helpful to employees

3. **Don't Delete Prematurely**
   - Give employees a chance to correct issues
   - Keep audit trail of document history

---

## Common Scenarios

### Scenario 1: Approve a Clear Document
1. Click eye icon to view
2. Verify document is clear, complete, and valid
3. Click green checkmark
4. Done! ✅

### Scenario 2: Reject a Blurry Image
1. Click eye icon to view
2. Notice image is too blurry to read
3. Click red X button
4. Enter reason: "Image is blurry and unreadable. Please take a clearer photo with good lighting."
5. Click Reject
6. Employee will see reason and can re-upload

### Scenario 3: Document is Expired
1. Click eye icon to view
2. Check expiration date on document
3. Notice it's expired
4. Click red X button
5. Enter reason: "This document expired on [date]. Please upload a current version."
6. Click Reject

### Scenario 4: Wrong Document Type
1. Click eye icon to view
2. Notice employee uploaded wrong document (e.g., passport instead of driver's license)
3. Click red X button
4. Enter reason: "Please upload your Driver's License instead of Passport for this requirement."
5. Click Reject

### Scenario 5: Bulk Review Multiple Documents
1. Go to Employee Profile → Documents tab
2. See all pending documents at once
3. Click eye icon on first document
4. Review and approve/reject
5. Dialog closes automatically
6. Click eye icon on next document
7. Repeat until all documents reviewed

---

## Technical Details

### API Endpoint
```
PUT /documents/{documentId}/verify
```

### Request Body
```json
{
  "verificationStatus": "verified" | "rejected",
  "rejectionReason": "Optional reason if rejected"
}
```

### Response
```json
{
  "document": {
    "id": "...",
    "verificationStatus": "verified",
    "verifiedBy": "HR Admin",
    "verifiedDate": "2025-11-05T10:30:00Z",
    ...
  }
}
```

### Automatic Updates
When a document is verified:
- Document status → "verified"
- `verifiedBy` is set to current user
- `verifiedDate` is set to current time
- Matching document requests are marked as fulfilled
- Employee sees updated status immediately
- Workflow progression may continue

When a document is rejected:
- Document status → "rejected"
- `rejectionReason` is stored
- `verifiedBy` and `verifiedDate` are still set (for audit)
- Employee can edit or delete the document
- Employee can re-upload a corrected version

---

## Access Control

### Who Can Approve Documents?

**✅ Can Approve:**
- HR Admin
- HR Manager
- Department Manager (for their department's employees)
- Admin (full system access)

**❌ Cannot Approve:**
- Employee (can only upload, edit, delete their own)
- Recruiter (can request but not approve)
- Client (view only their linked employees)

---

## Notifications & Alerts

### System Alerts
- 🟡 **Yellow Alert**: Documents expiring within 30 days
- 🔴 **Red Alert**: Expired documents
- 🔵 **Blue Alert**: Pending signature required

### Employee Notifications
When you approve a document:
- Employee sees "Verified" badge
- Green checkmark icon appears
- Document becomes read-only for employee

When you reject a document:
- Employee sees "Rejected" badge
- Red X icon appears
- Rejection reason is displayed
- "Re-upload" button appears

---

## Workflow Integration

### Document Approval in Onboarding
The 7-stage employee onboarding workflow includes document verification:

**Stage 2: Documentation Collection**
- System automatically requests required documents
- Employee uploads documents
- HR reviews and approves
- **Workflow cannot progress to Stage 3 until mandatory documents are verified**

### Progress Tracking
- Overall completion percentage shown
- Required vs Optional document counts
- Pending review count
- Verified document count

---

## Troubleshooting

### Issue: Can't See Approve/Reject Buttons
**Cause**: Document is already verified or you don't have permission
**Solution**: 
- Check if document status is "Verified" (no actions needed)
- Verify your user role has approval permissions
- Only pending documents show approve/reject buttons

### Issue: Rejection Dialog Doesn't Open
**Cause**: Browser popup blocker or JavaScript error
**Solution**:
- Check browser console for errors
- Refresh the page
- Try again

### Issue: Employee Doesn't See Rejection Reason
**Cause**: Reason wasn't entered or saved
**Solution**:
- When rejecting, always fill in the rejection reason field
- Verify reason is saved by viewing the document again

### Issue: Approved Document Still Shows as Pending
**Cause**: Page hasn't refreshed or network delay
**Solution**:
- Refresh the page
- Check network connection
- Verify in Document Management view

---

## Quick Reference Chart

| Action | Button | Color | Result |
|--------|--------|-------|--------|
| **View** | 👁️ | Gray | Opens preview dialog |
| **Approve** | ✓ | Green | Status → Verified |
| **Reject** | ✗ | Red | Opens rejection dialog |
| **Delete** | 🗑️ | Red | Removes document (with confirmation) |
| **Download** | ⬇️ | Blue | Downloads original file |

---

## Related Documentation
- `/DOCUMENT-COLLECTION-COMPLETE.md` - Document collection system overview
- `/DOCUMENT-PREVIEW-FIX.md` - Document preview functionality
- `/EMPLOYEE-DOCUMENT-EDIT-DELETE.md` - Employee document management
- `/WORKFLOW-IMPLEMENTATION-COMPLETE.md` - Full onboarding workflow

---

**Status**: ✅ Ready to Use

The document approval system is fully functional and integrated with the employee onboarding workflow. Follow this guide to efficiently review and approve employee documents.
