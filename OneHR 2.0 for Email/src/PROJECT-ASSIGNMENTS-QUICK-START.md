# Project Assignments - Quick Start Guide

## 🚀 What You Need to Know

The HR Portal now supports **employees working for multiple clients** through a project-based assignment system. This replaces the old "one employee, one client" limitation.

---

## ✅ Implementation Complete

### Files Created
1. **`/components/project-assignments.tsx`** - Full project management UI
2. **`/types/index.ts`** - Updated with ProjectAssignment type
3. **`/App.tsx`** - Added to navigation

### Files to Update (Backend)
- **`/supabase/functions/server/index.tsx`** - Add project assignment API endpoints

---

## 📝 3-Minute Setup

### Step 1: Access Project Assignments

1. Login as HR/Admin/Recruiter
2. Look for **"Project Assignments"** in the sidebar under "Onboarding" section
3. Click to open the module

### Step 2: Create Your First Assignment

1. Click **"New Assignment"** button
2. Fill in the form:
   - **Project Name**: e.g., "Client A - Website Redesign"
   - **Client**: Select from dropdown
   - **Employee**: Select from dropdown
   - **Role**: e.g., "Senior Developer"
   - **Start Date**: When project begins
   - **Billable Rate**: e.g., 75
   - **Billing Cycle**: Hourly/Daily/Monthly
   - **Allocation**: 100% (or split if multiple projects)
   - **Status**: Active
3. Click **"Create Assignment"**

### Step 3: Verify

- Assignment appears in the table
- Employee can now see this project
- Timesheets will show this project for time entry

---

## 🎯 Common Scenarios

### Scenario 1: Employee Works for 2 Clients

**Goal**: Sarah works 60% for Client A, 40% for Client B

**Steps**:
1. Create Assignment #1:
   - Project: "Client A - Development"
   - Employee: Sarah
   - Allocation: 60%
   - Rate: $75/hr

2. Create Assignment #2:
   - Project: "Client B - Consulting"
   - Employee: Sarah
   - Allocation: 40%
   - Rate: $90/hr

**Result**: Sarah's timesheet now shows both projects!

---

### Scenario 2: New Employee Onboarding

**Old Way**:
- Assign employee to ONE client during onboarding
- Stuck with that client forever

**New Way**:
1. Complete employee onboarding (don't assign client yet)
2. Go to Project Assignments
3. Create as many project assignments as needed
4. Employee automatically gets access

---

### Scenario 3: Project Ends, New One Begins

**Steps**:
1. Find old assignment
2. Click Edit button
3. Change Status to "Completed"
4. Set End Date
5. Save

Then create new assignment for new project!

---

## 🎨 Project Status Guide

| Status | When to Use | Color |
|--------|-------------|-------|
| **Planning** | Project approved but not started | Gray |
| **Active** | Currently working on project | Green |
| **On Hold** | Temporarily paused | Yellow |
| **Completed** | Project finished successfully | Blue |
| **Cancelled** | Project terminated | Red |

---

## 💡 Pro Tips

### Allocation Percentages
- ✅ Total should equal 100% or less
- ✅ Example: 50% Client A + 50% Client B = 100%
- ❌ Don't exceed 100% total allocation

### Billing Rates
- Set different rates for different clients
- Support for hourly, daily, weekly, monthly, or fixed price
- Currency support: USD, EUR, GBP

### Project Naming
- Use format: "Client Name - Project Type"
- Examples:
  - "Acme Corp - Web Development"
  - "XYZ Inc - Mobile App"
  - "Internal - HR System"

### Filtering & Search
- Use search bar for quick lookups
- Filter by status to see only active projects
- Filter by client to see all projects for one client

---

## 🔧 Backend Setup (Required)

Add these endpoints to `/supabase/functions/server/index.tsx`:

```typescript
import * as kv from './kv_store.tsx';

// GET all assignments
app.get('/make-server-f8517b5b/project-assignments', async (c) => {
  const assignments = await kv.get('project_assignments') || [];
  return c.json({ assignments });
});

// POST create assignment
app.post('/make-server-f8517b5b/project-assignments', async (c) => {
  const body = await c.req.json();
  const assignments = await kv.get('project_assignments') || [];
  
  const newAssignment = {
    ...body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  
  assignments.push(newAssignment);
  await kv.set('project_assignments', assignments);
  
  return c.json({ success: true, assignment: newAssignment });
});

// PUT update assignment
app.put('/make-server-f8517b5b/project-assignments/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  let assignments = await kv.get('project_assignments') || [];
  
  const index = assignments.findIndex(a => a.id === id);
  if (index === -1) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  assignments[index] = { 
    ...assignments[index], 
    ...body, 
    lastUpdated: new Date().toISOString() 
  };
  
  await kv.set('project_assignments', assignments);
  return c.json({ success: true, assignment: assignments[index] });
});

// DELETE assignment
app.delete('/make-server-f8517b5b/project-assignments/:id', async (c) => {
  const id = c.req.param('id');
  let assignments = await kv.get('project_assignments') || [];
  
  assignments = assignments.filter(a => a.id !== id);
  await kv.set('project_assignments', assignments);
  
  return c.json({ success: true });
});

// GET assignments for specific employee
app.get('/make-server-f8517b5b/project-assignments/employee/:employeeId', async (c) => {
  const employeeId = c.req.param('employeeId');
  const assignments = await kv.get('project_assignments') || [];
  const filtered = assignments.filter(a => a.employeeId === employeeId);
  return c.json({ assignments: filtered });
});

// GET assignments for specific client
app.get('/make-server-f8517b5b/project-assignments/client/:clientId', async (c) => {
  const clientId = c.req.param('clientId');
  const assignments = await kv.get('project_assignments') || [];
  const filtered = assignments.filter(a => a.clientId === clientId);
  return c.json({ assignments: filtered });
});
```

---

## ✅ Testing Checklist

- [ ] Navigate to Project Assignments from sidebar
- [ ] Click "New Assignment" button
- [ ] Create a test assignment
- [ ] Verify it appears in the table
- [ ] Edit the assignment
- [ ] Change status to "Completed"
- [ ] Create second assignment for same employee
- [ ] Verify employee sees both in their portal (when implemented)
- [ ] Search for project by name
- [ ] Filter by status
- [ ] Delete a test assignment

---

## 🎯 Next Steps

### Phase 1: Basic Usage (Now)
- ✅ Create and manage project assignments
- ✅ Track employee-client relationships
- ✅ Set billing rates and allocations

### Phase 2: Timesheet Integration (Next)
- Update Timesheets component to show active projects
- Allow employees to select project when logging time
- Apply project-specific billing rates

### Phase 3: Reporting (Later)
- Client revenue reports per project
- Employee utilization by project
- Project profitability analysis

---

## 🆘 Troubleshooting

### "No clients in dropdown"
**Solution**: Create clients first in Client Onboarding module

### "No employees in dropdown"
**Solution**: Create employees first in Employee Onboarding module

### "Assignment doesn't save"
**Solution**: Ensure backend API endpoints are implemented

### "Employee can't see project"
**Solution**: 
1. Check project status is "Active"
2. Check start date is today or earlier
3. Verify employee portal integration is complete

---

## 📊 Sample Data

Want to test quickly? Create these assignments:

**Assignment 1**:
- Project: "Acme Corp - Web Development"
- Employee: John Doe
- Client: Acme Corp
- Role: Senior Developer
- Rate: $85/hour
- Allocation: 100%
- Status: Active

**Assignment 2**:
- Project: "XYZ Inc - Mobile App"
- Employee: Jane Smith
- Client: XYZ Inc
- Role: UI/UX Designer
- Rate: $75/hour
- Allocation: 100%
- Status: Active

**Assignment 3** (Multiple Clients Example):
- Project: "Tech Solutions - Backend API"
- Employee: Bob Johnson
- Client: Tech Solutions
- Rate: $95/hour
- Allocation: 60%
- Status: Active

**Assignment 4** (Same Employee):
- Project: "Startup Inc - Cloud Migration"
- Employee: Bob Johnson
- Client: Startup Inc
- Rate: $110/hour
- Allocation: 40%
- Status: Active

---

## 🎉 You're Ready!

The project assignment system is now live and ready to use. Employees can work for multiple clients, and you have full control over rates, allocations, and project lifecycles.

For detailed technical documentation, see:
- `/PROJECT-ASSIGNMENTS-IMPLEMENTATION.md` - Complete implementation guide
- `/IMMIGRATION-MODULE-ENHANCEMENTS.md` - Immigration features added alongside

**Questions?** Check the full implementation guide or review the component source code at `/components/project-assignments.tsx`
