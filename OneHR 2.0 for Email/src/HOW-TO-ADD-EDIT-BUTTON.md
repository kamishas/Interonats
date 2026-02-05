# How to Add Edit Button to Immigration Profile Dialog

The Immigration Management system currently displays employee profiles in a read-only dialog. To enable editing, follow these steps:

## Quick Fix (Recommended)

The easiest way to add edit functionality is to use the pre-built `ImmigrationEditWrapper` component.

### Step 1: Add Import
In `/components/immigration-management.tsx`, add this import at the top (around line 52):

```typescript
import { ImmigrationEditWrapper } from "./immigration-edit-wrapper";
```

### Step 2: Add the Button
Find the dialog where employee details are shown (around line 933 in the `DialogHeader`). Add the wrapper component:

```typescript
<DialogHeader>
  <div className="flex items-center justify-between">
    <div>
      <DialogTitle>{selectedRecord.employeeName} - Immigration Profile</DialogTitle>
      <DialogDescription>
        Complete immigration status and filing history
      </DialogDescription>
    </div>
    <ImmigrationEditWrapper 
      employee={selectedRecord} 
      onUpdate={fetchRecords} 
    />
  </div>
</DialogHeader>
```

That's it! The Edit button will now appear and work correctly.

## What the Edit Button Does

- Opens the ImmigrationEmployeeForm in edit mode
- Pre-fills all existing data
- Allows updating:
  - Current immigration status
  - EAD dates (beginning and end)
  - I-94 information
  - Passport details
  - Visa information
  - Sponsorship details
  - Attorney information
- Saves changes via PUT endpoint
- Shows success/error messages
- Refreshes the table after save

## Technical Details

The `ImmigrationEditWrapper` component handles:
- State management for the edit dialog
- API call to PUT `/immigration/employees/:id`
- Error handling and toast notifications
- Automatic refresh after successful update

The backend PUT endpoint was already created and is working correctly.
