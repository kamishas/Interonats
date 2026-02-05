# HR Role Permissions Update

## Overview
The HR role has been updated to include access to **Clients, Vendors, Subvendors, and Contractors** modules. This allows HR managers to have full visibility into the vendor ecosystem when managing employee onboarding and assignments.

---

## Changes Made

### **HR Role Permissions** (`/types/auth.ts`)

#### Updated Permission:
- ✅ `canManageClients: true` - **CHANGED** from `false` to `true`

This single permission grants HR access to:
1. **Clients** - View and manage client accounts
2. **Vendors** - View and manage vendor relationships
3. **Subvendors** - View and manage subvendor relationships
4. **Contractors** - View and manage contractor assignments (already had via `canManageEmployees`)

---

## What HR Can Now Access

### ✅ **NEW Access:**

#### 1. **Clients Module**
- View all client accounts
- Add new clients
- Edit client information
- Manage client contacts
- View client-employee relationships
- Access client portal settings
- View client purchase orders

#### 2. **Vendors Module**
- View all vendor accounts
- Add new vendors
- Edit vendor information
- Manage vendor contacts
- Track vendor relationships
- View vendor contracts and documents

#### 3. **Subvendors Module**
- View all subvendor accounts
- Add new subvendors
- Edit subvendor information
- Manage subvendor hierarchy
- Track subvendor relationships
- View linked employees

#### 4. **Projects Module**
- View project assignments
- Link employees to client projects
- Manage project allocations
- Track billing rates per project
- View project timelines

---

## Navigation Updates

### **Sidebar Menu - HR Role Now Sees:**

```
📊 Dashboard
🔔 Notifications

⏰ Timesheets & Invoicing
  ├── Timesheets
  ├── Invoices
  ├── Expenses
  └── Analytics

👥 Client Portal                    ← NEW!
  ├── Employees
  ├── Clients                       ← NEW!
  ├── Projects                      ← NEW!
  ├── Vendors                       ← NEW!
  ├── Subvendors                    ← NEW!
  └── Contractors

🔒 Compliance
  ├── Immigration
  ├── Licensing
  └── Certifications

📁 Employee Management
  ├── Documents
  ├── Leave Requests
  ├── Offboarding
  └── Performance Reviews
```

---

## Why This Makes Sense

### **HR Workflow Integration**

#### Employee Onboarding Requires Client Knowledge:
1. **Employee Classification** - HR needs to know which client the employee works for
2. **Project Assignments** - HR assigns employees to client projects with specific billing rates
3. **Vendor Relationships** - Some employees come through vendor/subvendor relationships
4. **Contractor Management** - HR manages contractors who may be linked to vendors

#### Real-World Scenarios:
- ✅ New employee joining → HR needs to link to client and project
- ✅ Employee role change → HR needs to reassign to different client/project
- ✅ Vendor employee → HR needs to see vendor relationship
- ✅ Multi-client employee → HR manages multiple project assignments

---

## Permission Comparison

| Module | Admin | HR Manager | Recruiter | Accounting Manager |
|--------|-------|------------|-----------|-------------------|
| **Dashboard** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Employees** | 👁️ View Only | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Clients** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Vendors** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Subvendors** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Contractors** | 👁️ View Only | ✅ Full Access | ✅ Full Access | 👁️ View Only |
| **Projects** | ✅ View | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Immigration** | ✅ Full Access | ✅ Full Access | ❌ No Access | ❌ No Access |
| **Licensing** | ✅ Full Access | ❌ No Access | ❌ No Access | ✅ Full Access |
| **Timesheets** | ✅ Full Access | ✅ Full Access | ❌ No Access | ✅ Full Access |
| **Users** | ✅ Full Access | ❌ No Access | ❌ No Access | ❌ No Access |

---

## Complete HR Permissions

```typescript
hr: {
  canAccessDashboard: true,           // ✅ View dashboard
  canViewEmployees: true,              // ✅ View employee list
  canManageEmployees: true,            // ✅ Add/edit/delete employees
  canManageClients: true,              // ✅ NEW: Clients, vendors, subvendors
  canManageImmigration: true,          // ✅ Immigration cases
  canManageLicensing: false,           // ❌ Business licensing
  canViewTimesheets: true,             // ✅ View timesheets
  canManageTimesheets: true,           // ✅ Approve timesheets
  canManageUsers: false,               // ❌ User management
  canAccessSettings: false,            // ❌ System settings
  canAccessEmployeeManagement: true,   // ✅ Documents, leave, performance
}
```

---

## Use Cases

### **Scenario 1: Onboarding New Employee**
1. HR creates employee profile
2. HR views available clients
3. HR creates project assignment with client
4. HR sets billing rate and allocation
5. HR completes onboarding workflow

### **Scenario 2: Vendor Employee Onboarding**
1. Recruiter identifies candidate from vendor
2. HR views vendor details
3. HR creates employee linked to vendor
4. HR assigns to client project
5. HR tracks vendor-client-employee relationship

### **Scenario 3: Multi-Client Employee**
1. HR views employee profile
2. HR accesses client list
3. HR creates multiple project assignments
4. HR sets different billing rates per client
5. HR manages allocation percentages

### **Scenario 4: Contractor Management**
1. HR views contractor list
2. HR creates new contractor
3. HR links contractor to vendor
4. HR assigns contractor to client
5. HR tracks contractor engagement

---

## Files Modified

1. **`/types/auth.ts`** 
   - Updated HR role: `canManageClients: false` → `true`

---

## Testing Checklist

### ✅ HR User Should Now:
- [x] See "Clients" menu item in sidebar
- [x] Access the Clients module
- [x] Add, edit, delete clients
- [x] See "Vendors" menu item in sidebar
- [x] Access the Vendors module
- [x] Add, edit, delete vendors
- [x] See "Subvendors" menu item in sidebar
- [x] Access the Subvendors module
- [x] Add, edit, delete subvendors
- [x] See "Projects" menu item in sidebar
- [x] Access the Projects module
- [x] Create project assignments
- [x] Link employees to clients
- [x] Manage contractor relationships

### ✅ HR User Should Still Have:
- [x] Full employee management access
- [x] Immigration case management
- [x] Timesheet approval capabilities
- [x] Document management access
- [x] Leave request management
- [x] Performance review access
- [x] Offboarding capabilities

### ❌ HR User Should NOT Have:
- [ ] Business licensing access (reserved for Licensing Team/Accounting)
- [ ] User management (reserved for Admin)
- [ ] System settings (reserved for Admin)

---

## Benefits

### **For HR Managers:**
✅ **Complete Workflow** - No need to switch roles or ask for information  
✅ **Better Context** - See full client-employee-vendor relationships  
✅ **Efficient Onboarding** - Complete employee setup including client linkage  
✅ **Data Accuracy** - Direct access prevents data entry errors  

### **For the Organization:**
✅ **Streamlined Process** - Single role handles full employee lifecycle  
✅ **Better Compliance** - HR can verify all relationships  
✅ **Reduced Bottlenecks** - HR doesn't wait for other departments  
✅ **Improved Reporting** - HR has visibility into all connections  

---

## Migration Notes

### **Immediate Changes:**
- HR users will immediately see new menu items
- No data migration required
- No action needed by existing HR users
- All existing permissions remain intact

### **Recommended Actions:**
1. ✅ Inform HR users of new capabilities
2. ✅ Provide training on client/vendor modules
3. ✅ Update onboarding workflows to include client linking
4. ✅ Review and update process documentation

---

## Related Modules

### **Client Management** (`/components/client-management-advanced.tsx`)
- Full client CRUD operations
- Contact management
- Purchase order tracking
- Insurance requirements

### **Vendor Management** (`/components/vendor-management.tsx`)
- Vendor profiles
- Subvendor relationships
- Contract tracking
- Spend analytics

### **Project Assignments** (`/components/project-assignments.tsx`)
- Employee-client linking
- Billing rate management
- Allocation tracking
- Project lifecycle

### **Contractor Management** (`/components/contractor-management.tsx`)
- Contractor profiles
- Vendor linkage
- Rate management
- Status tracking

---

## Support

### **Quick Reference:**
- **View permissions:** Check `/types/auth.ts`
- **Update permissions:** Modify `ROLE_PERMISSIONS` object
- **Test changes:** Log in as HR user and verify menu access
- **Rollback:** Set `canManageClients: false` if needed

---

## Comparison: Before vs After

### **BEFORE:**
```
HR Role Could:
✅ Manage employees
✅ Manage immigration
❌ View clients (had to ask Recruiter/Accounting)
❌ View vendors (had to ask Recruiter/Accounting)
❌ Link employees to clients (manual process)
```

### **AFTER:**
```
HR Role Can:
✅ Manage employees
✅ Manage immigration
✅ View and manage clients
✅ View and manage vendors
✅ View and manage subvendors
✅ Link employees to clients directly
✅ Create project assignments
✅ Complete full onboarding workflow
```

---

## Future Enhancements

### **Potential Additions:**
- [ ] Read-only mode for specific HR sub-roles
- [ ] Custom client assignment workflows
- [ ] Automated client-employee matching
- [ ] Client capacity planning tools
- [ ] Vendor performance tracking

---

**Last Updated:** 2024-01-05  
**Status:** ✅ Complete and Deployed  
**Impact:** HR role only  
**Breaking Changes:** None
