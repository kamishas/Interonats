# 📍 Where HR Approves Documents - Visual Guide

## 🎯 Main Answer: The "Document Review" Tab

**Location:** Employee Onboarding Module → **Document Review Tab** (NEW!)

---

## 🖼️ Visual Layout

### Navigation Path:
```
OneHR Sidebar
    ↓
[📋 Employees] ← Click here
    ↓
Employee Onboarding Page
    ↓
Tabs: [All Employees] [In Progress] [Completed] → [📄 Document Review (3)] ← NEW TAB!
                                                          ↑
                                                   Badge shows pending count
```

---

## 📋 Document Review Tab Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  OneHR > Employees > Document Review                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  📄 Pending Document Reviews                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 John Doe                                                    │ │
│  │  ────────────────────────────────────────────────────────────  │ │
│  │                                                                  │ │
│  │  📄 EAD Document                                                │ │
│  │     • Uploaded: Nov 10, 2024 at 2:30 PM                        │ │
│  │     • Status: 🟠 Pending Review                                │ │
│  │     • File: john_doe_ead.pdf                                   │ │
│  │                                                                  │ │
│  │  [👁️ View Document]  [✅ Approve]  [❌ Reject]                │ │
│  │                                                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Jane Smith                                                  │ │
│  │  ────────────────────────────────────────────────────────────  │ │
│  │                                                                  │ │
│  │  📄 Signed Offer Letter                                        │ │
│  │     • Uploaded: Nov 10, 2024 at 1:15 PM                        │ │
│  │     • Status: 🟠 Pending Review                                │ │
│  │     • File: jane_smith_offer_signed.pdf                        │ │
│  │                                                                  │ │
│  │  [👁️ View Document]  [✅ Approve]  [❌ Reject]                │ │
│  │                                                                  │ │
│  │  📄 Signed NDA                                                 │ │
│  │     • Uploaded: Nov 10, 2024 at 1:16 PM                        │ │
│  │     • Status: 🟠 Pending Review                                │ │
│  │     • File: jane_smith_nda_signed.pdf                          │ │
│  │                                                                  │ │
│  │  [👁️ View Document]  [✅ Approve]  [❌ Reject]                │ │
│  │                                                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  👤 Mike Johnson                                                │ │
│  │  ────────────────────────────────────────────────────────────  │ │
│  │                                                                  │ │
│  │  📄 EAD Document                                                │ │
│  │     • Uploaded: Nov 9, 2024 at 11:45 AM                        │ │
│  │     • Status: 🟠 Pending Review                                │ │
│  │     • File: mike_j_work_authorization.pdf                      │ │
│  │                                                                  │ │
│  │  [👁️ View Document]  [✅ Approve]  [❌ Reject]                │ │
│  │                                                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎬 HR Actions in Document Review Tab

### Action 1: View Document
```
Click [👁️ View Document]
    ↓
Opens document in modal/new tab
    ↓
HR reviews the document
```

### Action 2: Approve Document
```
Click [✅ Approve]
    ↓
Confirmation dialog: "Approve this document?"
    ↓
Click "Confirm"
    ↓
✅ Document status → "Approved"
✅ Employee notified
✅ Document removed from pending list
✅ If all documents approved → Onboarding completed!
```

### Action 3: Reject Document
```
Click [❌ Reject]
    ↓
Modal appears: "Reason for rejection?"
    ↓
HR types: "Document expired" or "Unclear signature"
    ↓
Click "Reject"
    ↓
❌ Document status → "Rejected"
❌ Employee notified with rejection reason
❌ Employee must re-upload
```

---

## 🔔 Tab Badge Indicator

The Document Review tab shows a **badge** with the count of pending documents:

```
No pending documents:
[All Employees] [In Progress] [Completed] [Document Review]

With pending documents:
[All Employees] [In Progress] [Completed] [Document Review (3)]
                                                           ↑
                                                  Orange badge with count
```

---

## 📍 Alternative Location: Individual Employee View

HR can also review documents from an individual employee's detail page:

### Navigation:
```
Employee Onboarding
    ↓
Click on Employee Name (e.g., "John Doe")
    ↓
Employee Detail Dashboard
    ↓
Scroll to "Documents" Section
    ↓
See list of all documents with status
    ↓
Click Approve/Reject for each
```

### Visual:
```
┌──────────────────────────────────────────────────────────┐
│  John Doe - Employee Details                             │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  [Overview] [Workflow] [Documents] ← Click this tab      │
│                                                            │
│  📄 Documents                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                            │
│  EAD Document                                             │
│  Status: 🟠 Pending Review                                │
│  [View] [Approve] [Reject]                                │
│                                                            │
│  Offer Letter (Sent by HR)                                │
│  Status: ✅ Sent - Awaiting Signature                     │
│                                                            │
│  NDA (Sent by HR)                                         │
│  Status: ✅ Sent - Awaiting Signature                     │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference: Approval Workflow

### Step-by-Step for HR:

1. **Navigate to Document Review Tab**
   ```
   Sidebar → Employees → Document Review tab
   ```

2. **See Pending Documents**
   - All employees with pending documents are listed
   - Grouped by employee
   - Shows document type, upload date, filename

3. **Review Each Document**
   ```
   Click [View Document] → Opens PDF/image
   ```

4. **Make Decision**
   - ✅ Approve: Document is valid → Click "Approve"
   - ❌ Reject: Document has issues → Click "Reject" + add reason

5. **Check Onboarding Status**
   - If all required documents approved → Employee onboarding completes automatically
   - Employee gains timesheet access

---

## 🔄 What Happens After Approval?

### After HR Approves EAD:
```
✅ EAD status → "Approved"
✅ employee.eadApproved = true
✅ System checks: Are offer letter & NDA sent?
    ↓ If not yet sent
    HR sees: "Ready to send offer documents"
```

### After HR Approves Signed Documents:
```
✅ Offer Letter status → "Approved"
✅ NDA status → "Approved"
✅ System checks: All required documents approved?
    ↓ Yes
    ✅ employee.onboardingStatus = "completed"
    ✅ employee.canAccessTimesheets = true
    🎉 Employee notified: "Onboarding Complete!"
```

---

## 📧 Notifications (Future Enhancement)

When HR approves/rejects:
- Employee receives email notification
- Shows document name and status
- For rejections: includes HR's reason
- Provides link to re-upload (if rejected)

---

## 🎨 Color Coding

- 🟠 **Orange**: Pending Review (needs HR action)
- ✅ **Green**: Approved
- ❌ **Red**: Rejected
- 🔵 **Blue**: Sent (waiting for employee)
- ⚪ **Gray**: Not uploaded yet

---

## 💡 Pro Tips for HR Users

### Tip 1: Bulk Review
Process all documents for one employee before moving to the next for efficiency.

### Tip 2: Use Badge as To-Do List
The badge number tells you how many approvals are waiting.

### Tip 3: Check Individual Employee
For complex cases, go to individual employee view for full context.

### Tip 4: Document Quality
Check for:
- Clear, legible text
- Valid dates (not expired)
- Proper signatures
- Correct employee name

---

## 🆘 Common Questions

**Q: Where do I approve EAD documents?**
A: Employee Onboarding → Document Review tab

**Q: How do I know if documents are pending?**
A: Check the orange badge on Document Review tab

**Q: Can I approve from mobile?**
A: Yes, the interface is responsive

**Q: What if I accidentally reject?**
A: Employee can re-upload, and you can approve the new version

**Q: When does onboarding complete?**
A: Automatically when all required documents are approved

---

## 🔗 Related Documentation

- [New Onboarding Workflow Guide](./NEW-ONBOARDING-WORKFLOW-GUIDE.md)
- [Employee Onboarding Component](./components/employee-onboarding.tsx)
- [API Endpoints Documentation](./supabase/functions/server/index.tsx)

---

**Quick Answer:** HR approves documents in the **"Document Review" tab** of the Employee Onboarding module!

**Last Updated:** November 10, 2024
