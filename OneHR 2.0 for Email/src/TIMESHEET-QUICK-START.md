# 📋 Timesheet Module - Quick Start Guide

## Overview

The Timesheet module provides comprehensive time tracking with **3 input methods**:
1. ✅ **Manual Entry** - Enter hours directly
2. ✅ **Invoice Upload** - AI-powered OCR extraction from client-approved documents
3. ✅ **API Import** - Auto-import from Fieldglass, Beeline, Workday

---

## Getting Started

### 1. Access Timesheets

Navigate to **Timesheets** in the sidebar (requires `canManageTimesheets` permission).

---

## Method 1: Manual Time Entry

### Steps:
1. Click **"Add Time Entry"** button
2. Select **Employee** from dropdown
3. Stay on **"Manual Entry"** tab
4. Fill in required fields:
   - **Date** (click to open calendar picker)
   - **Project** (project name)
   - **Client** (optional)
   - **Hours** (0-24, 0.5 increments)
   - **Description** (optional)
5. Click **"Add Entry"**

### Result:
- Entry created with `status: "draft"`
- Appears in table immediately
- Can be submitted for approval later

---

## Method 2: Invoice Upload (AI-Powered OCR)

### Steps:
1. Click **"Add Time Entry"** button
2. Select **Employee** from dropdown
3. Switch to **"Upload Invoice"** tab
4. Click **"Choose File"** and select:
   - PDF timesheet
   - PNG/JPG image of timesheet
   - Max size: 10MB
5. Click **"Upload & Process"**

### What Happens:
- ✅ File uploaded to system
- ✅ **AI OCR extracts**:
  - Employee Name
  - Client
  - Week Ending
  - Total Hours
  - Approver Name/Email (if present)
- ✅ **Auto-matches** to employee's active project
- ✅ Entry created with `status: "pending_review"`

### Review Workflow:
1. Yellow alert appears: **"You have N timesheets pending review"**
2. Entry shows **"Needs Review"** badge
3. Click **"Review"** button
4. Review dialog shows:
   - Source file name
   - OCR confidence % (e.g., 95%)
   - All extracted data
   - Auto-matched project (if applicable)
5. Choose action:
   - **"Save as Draft"** → Review later
   - **"Confirm & Submit"** → Submit for approval
   - **"Confirm & Auto-Approve"** → If client-signed ✅

### Client-Signed Auto-Approval:
- If OCR detects approver name/email → Document is **client-signed**
- Green alert shows: **"Client-Signed Document - No further approval required"**
- Upon confirmation → `status: "approved"` immediately
- Badge shows: **"Approved (Client-Signed)"**
- **No approval queue entry created** ✅

---

## Method 3: API Import (External Systems)

### Supported Systems:
- Fieldglass
- Beeline
- Workday
- Any client portal API

### Integration Setup:

#### Option A: Webhook (Real-time)
1. Configure webhook in external system
2. Point to: `POST /make-server-f8517b5b/timesheets/import`
3. Include API key in `Authorization` header
4. Send approved timesheets in this format:

```json
{
  "source": "Fieldglass",
  "data": [
    {
      "employeeId": "emp-123",
      "employeeName": "John Doe",
      "date": "2025-11-01",
      "project": "Project Alpha",
      "client": "Acme Corp",
      "hours": 8,
      "weekEnding": "2025-11-05",
      "id": "ext-ts-456"
    }
  ]
}
```

#### Option B: Scheduled Job (Batch)
1. Create cron job or scheduled function
2. Poll external API for approved timesheets
3. Transform to required format
4. POST to `/timesheets/import` endpoint

### Result:
- ✅ Entries auto-imported with `status: "approved"`
- ✅ Badge shows **"API Import"**
- ✅ External ID stored for reference
- ✅ Source tracked (Fieldglass, Beeline, etc.)
- ✅ **No approval required** (already approved externally)

---

## Understanding Statuses

| Status | Meaning | Actions Available |
|--------|---------|-------------------|
| **Draft** | Manually created, not submitted | Edit, Delete, Submit |
| **Pending Review** | OCR extracted, awaiting employee review | Review, Delete |
| **Submitted** | Submitted for approval | View only |
| **Approved** | Approved by manager or auto-approved | View, Export |
| **Rejected** | Rejected by manager | Edit, Resubmit |

---

## Understanding Entry Types

| Type | Badge | Description |
|------|-------|-------------|
| **Manual** | None | Entered directly by user |
| **Invoice** | 📄 Invoice (95%) | OCR extracted with confidence % |
| **API Import** | 📥 API Import | Imported from external system |

---

## Understanding Badges

| Badge | Meaning |
|-------|---------|
| **Needs Review** | OCR data needs employee confirmation |
| **Auto-matched** | System matched to active project |
| **Approved (Client-Signed)** | Auto-approved due to client signature |
| **Invoice (95%)** | OCR confidence score |
| **API Import** | Imported from external portal |

---

## Features

### ✅ OCR Extraction
- **Employee Name** - Matched to existing employee
- **Client** - Auto-populated
- **Week Ending** - Date parsing
- **Hours** - Total hours worked
- **Approver Info** - Name/Email (detects client-signed)

### ✅ Auto-Matching to Projects
- Searches employee's active projects
- Matches based on client name
- Sets project, client, billing rate automatically
- Shows "Auto-matched" badge

### ✅ Client-Signed Bypass
- If approver info found → Client-signed
- No approval needed ✅
- Auto-approved upon review
- Saves time and reduces overhead

### ✅ Review Workflow
- Employee verifies OCR data
- Can make corrections
- Confirms before submission
- Prevents errors from OCR misreads

### ✅ API Integration
- Ready for production integrations
- Supports batch imports
- Tracks external IDs
- Auto-approves external approvals

---

## Common Workflows

### Scenario 1: Regular Weekly Hours
1. Employee: Manual Entry → Fill date, project, 40 hours
2. Submit for approval
3. Manager: Review → Approve
4. Status: **Approved**

### Scenario 2: Client-Approved Timesheet
1. Admin: Upload Invoice → Select PDF from client
2. OCR extracts all data (including client approver)
3. System detects: **Client-Signed**
4. Employee: Review → Confirm
5. Status: **Approved** (auto) ✅
6. **No manager approval needed**

### Scenario 3: Fieldglass Integration
1. Fieldglass: Manager approves timesheet
2. Webhook triggers → Sends to our API
3. System imports with `status: "approved"`
4. Badge: **API Import**
5. **No further action needed** ✅

---

## Permissions

| Role | Can View | Can Add | Can Review | Can Approve |
|------|----------|---------|------------|-------------|
| Super Admin | ✅ All | ✅ | ✅ | ✅ |
| Admin | ✅ All | ✅ | ✅ | ✅ |
| HR | ✅ All | ✅ | ✅ | ✅ |
| Accounting | ✅ All | ✅ | ✅ | ✅ |
| Manager | ✅ Team | ✅ | ✅ | ✅ Team |
| Recruiter | ✅ Own | ✅ | ✅ | ❌ |
| Employee | ✅ Own | ✅ | ✅ | ❌ |

---

## Tips & Best Practices

### For Manual Entry:
- ✅ Enter hours daily to avoid forgetting
- ✅ Use consistent project names
- ✅ Add descriptions for clarity
- ✅ Submit weekly timesheets on time

### For Invoice Upload:
- ✅ Use high-quality scans (300+ DPI)
- ✅ Ensure text is readable
- ✅ Check OCR confidence % (>90% is good)
- ✅ Always review before confirming
- ✅ Correct any extraction errors

### For API Integration:
- ✅ Set up webhooks for real-time sync
- ✅ Monitor import logs for errors
- ✅ Validate data mapping before production
- ✅ Test with sample data first

---

## Troubleshooting

### Issue: OCR Not Extracting Correctly
**Solution:**
- Ensure image quality is high
- Use PDF format when possible
- Check if text is selectable in PDF
- Manually correct in review dialog

### Issue: No Projects Available for Auto-Match
**Solution:**
- Ensure employee has active projects assigned
- Check project status is "active"
- Manually enter project name if needed

### Issue: Client-Signed Not Detected
**Solution:**
- Ensure approver name AND email are visible on document
- Check OCR extracted approver info in review
- Manually mark as client-signed if needed (future feature)

### Issue: API Import Failing
**Solution:**
- Check API endpoint URL is correct
- Verify Authorization header has valid token
- Validate JSON format matches expected structure
- Check server logs for error details

---

## Next Steps

1. **Production OCR**: Integrate AWS Textract, Google Vision, or Azure Form Recognizer
2. **Client Portals**: Set up webhooks with Fieldglass, Beeline, Workday
3. **Approval Workflow**: Add manager approval queue and notifications
4. **Reporting**: Add timesheet reports and exports
5. **Mobile App**: Build mobile timesheet entry app

---

## Support

For issues or questions:
- **Technical**: Check `/TIMESHEET-REQUIREMENTS-COMPLETE.md`
- **API Docs**: See backend endpoint documentation
- **Integration**: Contact IT for API credentials

---

**Last Updated:** November 3, 2025
**Version:** 1.0 - Full Compliance
