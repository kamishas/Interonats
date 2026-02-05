# Dependent Visa Filings Tracking Feature

## Overview
Added comprehensive tracking of visa filings for both employees and their dependents in the Immigration Management module. Users can now create separate filings for dependents and filter/view them across the system.

---

## What Was Added

### 1. Backend Updates (`/supabase/functions/server/index.tsx`)

**Filing Creation Endpoint** - Added dependent support:
- Added `dependentId` field (optional) to link filing to a dependent
- Added `dependentName` field for easy display without lookups
- Added validation to verify dependent exists before creating filing
- Dependents are stored in `record.dependents` array with their own data

**Filing Update Endpoint** - Added dependent support:
- Updated to preserve `dependentId` and `dependentName` when editing filings
- Maintains relationship between filing and dependent/employee

### 2. Frontend Updates (`/components/immigration-management.tsx`)

#### State Management
- Added `dependentId` field to `newFiling` state
- Added `filingsFilterPerson` state for filtering by employee/dependent

#### Add Filing Dialog
**New "Filing For" Dropdown** appears when:
- An employee is selected
- That employee has dependents in the system

The dropdown shows:
- Primary Employee option (default)
- Each dependent with their name and relationship (e.g., "John Doe (Spouse)")

When you select a dependent:
- The system automatically captures their name
- Creates the filing linked to that specific dependent

#### Visa Filings & Actions Table
**New "Filing For" Column** shows:
- "Primary Employee" (in muted text) for employee filings
- Dependent name with a Users icon for dependent filings

**New Person Filter** allows filtering by:
- All People (default - shows everything)
- Employees Only (shows only primary employee filings)
- Dependents Only (shows only dependent filings)

The filter integrates with existing filters:
- Search now includes dependent names
- Person filter works alongside Filing Type, Visa Type, and Status filters
- Shows in active filters display with clear button

#### Employee Detail View
When viewing an individual employee's record:
- Filings for dependents show a badge with the dependent's name
- Badge includes Users icon for easy visual identification
- Clearly distinguishes between employee and dependent filings

#### Edit Filing Dialog
- Shows an alert/notice when editing a dependent's filing
- Displays: "This filing is for [Dependent Name]"
- Dependent assignment is read-only (can't be changed after creation)

---

## How to Use

### Creating a Filing for a Dependent

1. **Go to Immigration Management** → "Visa Filings & Actions" tab
2. **Click "Add Filing"** button
3. **Select the employee** from the dropdown
4. **If the employee has dependents**, a new "Filing For" dropdown appears
5. **Select the dependent** (or leave as "Primary Employee")
6. **Fill in filing details** (type, status, dates, etc.)
7. **Save** - The filing is now linked to that dependent

### Viewing Dependent Filings

**In the Visa Filings & Actions table:**
- Look for the "Filing For" column
- Dependents show with a 👥 icon and their name
- Primary employees show as "Primary Employee"

**Filter to see only dependent filings:**
- Use the "Person" filter dropdown
- Select "Dependents Only"
- Table shows only filings for dependents

**In Employee Detail View:**
- Open any employee record
- Scroll to "Filings" section
- Dependent filings show a badge: `👥 [Dependent Name]`

### Searching for Dependent Filings

The search box now searches:
- Employee names
- Dependent names
- Receipt numbers
- Filing types
- Immigration status

Example: Search for "John" finds filings for:
- Employees named John
- Dependents named John

---

## Data Structure

### Filing Object (with dependent support)
```javascript
{
  id: "filing-uuid",
  employeeId: "employee-uuid",           // Always the primary employee's ID
  dependentId: "dependent-uuid",         // Optional - null for employee filings
  dependentName: "Jane Doe",             // Optional - stored for quick display
  filingType: "Extension",
  immigrationStatus: "H-4",
  receiptNumber: "WAC1234567890",
  filedDate: "2024-01-15",
  approvalDate: null,
  expiryDate: "2026-01-15",
  status: "Approved",
  notes: "H-4 extension for spouse",
  costAmount: 370,
  costAllocatedTo: "Company"
}
```

### Dependent Object (for reference)
```javascript
{
  id: "dependent-uuid",
  employeeId: "employee-uuid",
  name: "Jane Doe",
  relationship: "Spouse",               // Spouse, Child, etc.
  dateOfBirth: "1990-05-20",
  currentStatus: "H-4",
  passportNumber: "P12345678",
  passportCountry: "Canada"
}
```

---

## Use Cases

### Use Case 1: Track H-4 Spouse Extension
**Scenario:** Employee has H-1B, spouse needs H-4 extension

1. Add dependent to employee record (if not already added)
2. Create new filing
3. Select employee
4. Select spouse from "Filing For" dropdown
5. Set Filing Type: "Extension"
6. Set Immigration Status: "H-4"
7. Add dates and receipt number
8. Filing now tracks separately from employee's H-1B

### Use Case 2: Track Child's F-2 to H-4 Change of Status
**Scenario:** Child aging out of F-2, needs H-4

1. Select employee
2. Select child from "Filing For" dropdown
3. Set Filing Type: "Change of Status"
4. Set Immigration Status: "H-4"
5. Track separately from other family members

### Use Case 3: Bulk Review of All Dependent Filings
**Scenario:** Attorney needs to review all pending dependent cases

1. Go to Visa Filings & Actions
2. Set Person filter to "Dependents Only"
3. Set Status filter to "In Progress"
4. See all pending dependent filings across all employees

### Use Case 4: Family Immigration Planning
**Scenario:** Entire family needs renewals

1. View employee detail page
2. See all filings (employee + dependents) in one place
3. Dependent filings show badges for easy identification
4. Plan filing strategy based on expiry dates

---

## Benefits

✅ **Comprehensive Tracking** - Track visa actions for entire families, not just employees

✅ **Clear Visibility** - Visual indicators (icons, badges) make it obvious who each filing is for

✅ **Powerful Filtering** - Quickly find employee or dependent filings

✅ **Family View** - See all filings for an employee and their family in one place

✅ **Compliance** - Don't miss dependent visa expirations or renewals

✅ **Attorney Coordination** - Easier to manage cases when dependents are tracked separately

✅ **Cost Tracking** - Track filing costs for dependents separately from primary employees

✅ **Historical Record** - Complete immigration history for entire family unit

---

## Technical Notes

- Filings always link to the primary employee's record (`employeeId`)
- `dependentId` is optional - null/undefined means filing is for primary employee
- `dependentName` is stored denormalized for performance (avoids lookups on every display)
- Dependent validation ensures dependent exists before creating filing
- Backend returns dependent info with filings for easy frontend display
- Search is optimized to include dependent names without performance impact

---

## Feature Status

✅ **COMPLETE** - Backend API endpoints updated
✅ **COMPLETE** - Add Filing dialog with dependent selection
✅ **COMPLETE** - Edit Filing dialog with dependent display
✅ **COMPLETE** - Visa Filings table with "Filing For" column
✅ **COMPLETE** - Person filter (All/Employees/Dependents)
✅ **COMPLETE** - Search includes dependent names
✅ **COMPLETE** - Employee detail view shows dependent badges
✅ **COMPLETE** - Active filters display includes person filter
✅ **COMPLETE** - Full integration with existing filing workflow

**Ready for immediate use!** 🎉
