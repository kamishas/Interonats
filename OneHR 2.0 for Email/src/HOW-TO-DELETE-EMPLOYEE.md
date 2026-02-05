# How to Delete an Employee

## Quick Guide for Deleting Employees in the Onboarding Module

### Step-by-Step Instructions

1. **Navigate to Employee Onboarding**
   - Login with your user account (Recruiter, HR, Admin, etc.)
   - Click "Employee Onboarding" in the sidebar

2. **Locate the Employee**
   - Browse the employee list
   - Use the tabs to filter:
     - **All Employees** - Shows everyone
     - **In Progress** - Shows employees currently being onboarded
     - **Completed** - Shows fully onboarded employees

3. **Delete the Employee**
   - Find the employee card you want to delete
   - Click the **trash icon (🗑️)** button on the right side of the card
   - A confirmation dialog will appear

4. **Confirm Deletion**
   - Review the employee information displayed in the dialog
   - Read the warning about permanent deletion
   - Click **"Delete Employee"** to confirm
   - Or click **"Cancel"** to abort

5. **Deletion Complete**
   - You'll see a success message: "Employee deleted successfully"
   - The employee will be removed from the list
   - All associated workflow data, tasks, and approvals will be permanently deleted

---

## Important Notes

### ⚠️ Warning: This Action is Permanent

When you delete an employee:
- ✅ Employee record is permanently removed
- ✅ All workflow data is deleted
- ✅ All 30+ tasks are removed
- ✅ All department approvals are removed
- ✅ Classification and links are removed
- ❌ **This action CANNOT be undone**

### Who Can Delete Employees?

The following roles have permission to delete employees:
- ✅ **Admin** - Full access
- ✅ **HR Manager** - Can delete
- ✅ **Recruiter** - Can delete
- ✅ **Accounting Manager** - Can delete

Other roles (Immigration Team, Licensing Team, Employee, etc.) cannot delete employees.

---

## Visual Guide

### Employee Card with Delete Button

```
┌──────────────────────────────────────────────────────┐
│  John Doe                    [in-progress]           │
│  Email: john@company.com                             │
│  Position: Software Engineer                         │
│  Department: Engineering                             │
│                                                       │
│  Overall Progress: 45%                               │
│  ████████░░░░░░░░░░                                  │
│                                                       │
│  Current Stage: [data-collection]                    │
│                                                       │
│                    [View Workflow]  [🗑️]             │
└──────────────────────────────────────────────────────┘
```

### Delete Confirmation Dialog

```
┌──────────────────────────────────────────────────────┐
│  Delete Employee                                  ✕  │
│                                                       │
│  Are you sure you want to delete this employee?      │
│  This action cannot be undone.                       │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │ Name: John Doe                               │   │
│  │ Email: john@company.com                      │   │
│  │ Position: Software Engineer                  │   │
│  │ Status: in-progress                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ⚠️ Warning                                          │
│  Deleting this employee will permanently remove      │
│  all workflow data, tasks, and approvals.            │
│                                                       │
│                       [Cancel]  [Delete Employee]    │
└──────────────────────────────────────────────────────┘
```

---

## When to Delete an Employee

### Good Reasons to Delete:
- ✅ Employee declined the offer
- ✅ Onboarding was created by mistake
- ✅ Duplicate employee record
- ✅ Employee never started (withdrawn)
- ✅ Test/demo record that needs cleanup

### Think Twice Before Deleting:
- ⚠️ Employee has completed onboarding (keep for records)
- ⚠️ Employee has submitted timesheets (keep for payroll)
- ⚠️ Employee has immigration records in system
- ⚠️ Need to maintain audit trail

---

## Alternative to Deletion

If you need to keep records but mark an employee as inactive:
- Currently, there's no "inactive" status
- Consider adding notes to the employee record before proceeding
- Future enhancement: "Archive" feature to preserve data without deletion

---

## Troubleshooting

### "I don't see the delete button"
**Check:**
- Are you logged in with the correct role?
- Only Admin, HR, Recruiter, and Accounting Manager can delete
- Employees and other roles don't have delete permission

### "Delete button is grayed out"
**Possible reasons:**
- This feature is active - there should be no grayed out state
- If you see this, try refreshing the page

### "Error when trying to delete"
**Try:**
1. Refresh the page and try again
2. Check your internet connection
3. Verify the employee still exists (might have been deleted by another user)
4. Contact system administrator if error persists

---

## API Endpoint Used

For technical reference, the delete function calls:
```
DELETE /make-server-f8517b5b/employees/{employeeId}
Authorization: Bearer {publicAnonKey}
```

---

## Recent Updates

**What's New:**
- ✅ Delete button added to employee cards (trash icon)
- ✅ Confirmation dialog with employee details
- ✅ Warning message about permanent deletion
- ✅ Auto-closes workflow dialog if deleted employee was being viewed
- ✅ Success toast notification on deletion

---

## Related Documentation

- `WORKFLOW-QUICK-GUIDE.md` - General workflow guide
- `WORKFLOW-IMPLEMENTATION.md` - Technical documentation
- `WORKFLOW-FEATURES.md` - All features overview

---

**Need help?** Contact your system administrator or HR team.
