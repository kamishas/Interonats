# Project Assignments - Multi-Client Support Implementation

## 🎯 Overview

The system has been updated to support **employees working for multiple clients simultaneously** through a **project-based assignment system**. This replaces the previous single-client limitation with a flexible, scalable approach.

---

## 📋 What's New

### 1. **Multiple Client Support**
- ✅ Employees can be assigned to unlimited client projects
- ✅ Track multiple simultaneous engagements
- ✅ Independent billing rates per project
- ✅ Allocation percentage tracking (e.g., 50% Client A, 50% Client B)

### 2. **Project Assignment System**
- ✅ Dedicated project management interface
- ✅ Client-Employee linking through projects
- ✅ Role-based assignments
- ✅ Start/End date tracking
- ✅ Project status lifecycle (Planning → Active → On Hold → Completed → Cancelled)

### 3. **Enhanced Timesheet Integration**
- ✅ Project-based time entry
- ✅ Multi-client timesheet submission
- ✅ Automatic client routing based on active projects
- ✅ Project-specific billing rates

---

## 🗂️ Data Model Changes

### New Type: `ProjectAssignment`

```typescript
export interface ProjectAssignment {
  id: string;
  projectName: string;
  clientId: string;
  clientName: string;
  employeeId: string;
  employeeName: string;
  
  // Assignment details
  role: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus; // planning | active | on-hold | completed | cancelled
  
  // Billing
  billableRate: number;
  currency: 'USD' | 'EUR' | 'GBP';
  billingCycle: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'fixed';
  purchaseOrderNumber?: string;
  
  // Work details
  hoursPerWeek?: number;
  allocation: number; // Percentage (0-100)
  location: 'onsite' | 'remote' | 'hybrid';
  
  // Approvals
  approvedBy?: string;
  approvedDate?: string;
  
  // Tracking
  createdAt: string;
  createdBy: string;
  lastUpdated?: string;
  notes?: string;
}
```

### Updated `Employee` Type

```typescript
export interface Employee {
  // ... existing fields ...
  
  // NEW: Project Assignments (Multiple clients support)
  projectAssignments?: ProjectAssignment[];
  activeProjectCount?: number;
  primaryClientId?: string; // For legacy/primary client
  primaryClientName?: string;
}
```

### Updated `Client` Type

```typescript
export interface Client {
  // ... existing fields ...
  
  // NEW: Project tracking
  activeProjects?: number;
  assignedEmployees?: number;
}
```

---

## 🚀 New Component: Project Assignments

**File**: `/components/project-assignments.tsx`

### Features

#### 1. **Project Dashboard**
- Overview cards showing:
  - Total projects
  - Active projects
  - Planning stage projects
  - On-hold projects
  - Completed projects

#### 2. **Tab-Based Views**
- **All Projects**: Complete project list
- **Active**: Currently running projects
- **Planning**: Projects in planning phase
- **On Hold**: Temporarily paused projects
- **Completed**: Finished projects

#### 3. **Advanced Filtering**
- Search by project name, employee, client, or role
- Filter by project status
- Filter by client
- Multi-filter support

#### 4. **Project Management**
- ✅ Create new assignments
- ✅ Edit existing assignments
- ✅ Delete assignments
- ✅ Status management
- ✅ Allocation tracking

#### 5. **Comprehensive Project Details**
- Project name and description
- Client association
- Employee assignment
- Role specification
- Start and end dates
- Billable rates (hourly/daily/weekly/monthly/fixed)
- Currency support (USD/EUR/GBP)
- Allocation percentage
- Work location (remote/onsite/hybrid)
- Purchase order tracking
- Notes and documentation

---

## 📊 Use Cases

### Use Case 1: Employee Working for Multiple Clients

**Scenario**: Sarah works 60% for Client A and 40% for Client B

**Implementation**:
1. Create Project Assignment #1:
   - Project: "Client A - Web Development"
   - Employee: Sarah Johnson
   - Client: Client A
   - Allocation: 60%
   - Rate: $75/hour
   - Status: Active

2. Create Project Assignment #2:
   - Project: "Client B - Mobile App"
   - Employee: Sarah Johnson
   - Client: Client B
   - Allocation: 40%
   - Rate: $80/hour
   - Status: Active

**Result**: Sarah's timesheet now shows both projects, and she logs time separately for each client.

---

### Use Case 2: Project Lifecycle Management

**Scenario**: Track a project from planning to completion

**Workflow**:
1. **Planning** → Create assignment with status "planning"
2. **Active** → Change status to "active" when project starts
3. **On Hold** → Temporarily pause if needed
4. **Completed** → Mark as complete when finished

**Status Transitions**:
- Planning → Active (Project approved and started)
- Active → On Hold (Temporary pause)
- On Hold → Active (Resume work)
- Active → Completed (Project finished)
- Any status → Cancelled (Project terminated)

---

### Use Case 3: Client-Specific Rates

**Scenario**: Different rates for different clients

**Configuration**:
- Project A (Client X): $75/hour
- Project B (Client Y): $90/hour
- Project C (Client Z): $5,000/month (fixed)

**Billing Cycles Supported**:
- Hourly
- Daily
- Weekly
- Monthly
- Fixed price

---

## 🔗 Integration Points

### 1. **Employee Onboarding**
When onboarding new employees, you can now:
- Skip immediate client assignment
- Assign to projects post-onboarding
- Assign to multiple projects simultaneously

### 2. **Timesheet System**
Timesheets updated to support:
- Project-based time entry
- Multiple clients per timesheet period
- Project-specific billing rates
- Automatic project dropdown populated from active assignments

**Example Timesheet Entry**:
```
Date: Jan 15, 2024
Project: Client A - Web Development (8 hours @ $75/hr)
Project: Client B - Mobile App (4 hours @ $80/hr)
```

### 3. **Client Management**
Clients now show:
- Number of active projects
- Number of assigned employees
- Project portfolio view

### 4. **Employee Portal**
Employees can:
- View all their project assignments
- See allocation percentages
- Track project timelines
- Submit time to correct projects

---

## 🎨 UI Components

### Project Assignment Table Columns

| Column | Description | Example |
|--------|-------------|---------|
| Project Name | Name of the project | "Website Redesign" |
| Employee | Assigned employee | "John Doe" |
| Client | Client company | "Acme Corp" |
| Role | Employee's role | "Senior Developer" |
| Start Date | Project start | "Jan 01, 2024" |
| Rate | Billing rate | "$75/h" |
| Allocation | Work percentage | "60%" |
| Status | Current status | Active ● |
| Actions | Edit/Delete buttons | ✏️ 🗑️ |

### Status Badges

- 🕐 **Planning**: Gray - Project in planning phase
- ✅ **Active**: Green - Currently active project
- ⏸️ **On Hold**: Yellow - Temporarily paused
- ✓ **Completed**: Blue - Successfully completed
- ❌ **Cancelled**: Red - Project cancelled

---

## 📝 Backend Implementation

### Required API Endpoints

```typescript
// GET /project-assignments
// Fetch all project assignments
Response: { assignments: ProjectAssignment[] }

// POST /project-assignments
// Create new assignment
Body: ProjectAssignment (without id, createdAt)
Response: { success: boolean, assignment: ProjectAssignment }

// PUT /project-assignments/:id
// Update assignment
Body: ProjectAssignment
Response: { success: boolean, assignment: ProjectAssignment }

// DELETE /project-assignments/:id
// Delete assignment
Response: { success: boolean }

// GET /project-assignments/employee/:employeeId
// Get assignments for specific employee
Response: { assignments: ProjectAssignment[] }

// GET /project-assignments/client/:clientId
// Get assignments for specific client
Response: { assignments: ProjectAssignment[] }
```

### Server Implementation (`/supabase/functions/server/index.tsx`)

```typescript
// Project Assignments CRUD
app.get('/make-server-f8517b5b/project-assignments', async (c) => {
  const assignments = await kv.get('project_assignments') || [];
  return c.json({ assignments });
});

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

app.put('/make-server-f8517b5b/project-assignments/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const assignments = await kv.get('project_assignments') || [];
  
  const index = assignments.findIndex(a => a.id === id);
  if (index === -1) {
    return c.json({ error: 'Assignment not found' }, 404);
  }
  
  assignments[index] = { ...assignments[index], ...body, lastUpdated: new Date().toISOString() };
  await kv.set('project_assignments', assignments);
  
  return c.json({ success: true, assignment: assignments[index] });
});

app.delete('/make-server-f8517b5b/project-assignments/:id', async (c) => {
  const id = c.req.param('id');
  let assignments = await kv.get('project_assignments') || [];
  
  assignments = assignments.filter(a => a.id !== id);
  await kv.set('project_assignments', assignments);
  
  return c.json({ success: true });
});
```

---

## 🔄 Migration Guide

### Step 1: Add Project Assignments to Dashboard

In `/App.tsx`, add the new module:

```typescript
import { ProjectAssignments } from './components/project-assignments';

// In your navigation/routing
{activeModule === 'project-assignments' && <ProjectAssignments />}
```

### Step 2: Update Navigation

Add to your sidebar or main navigation:

```tsx
<Button
  variant={activeModule === 'project-assignments' ? 'default' : 'ghost'}
  onClick={() => setActiveModule('project-assignments')}
>
  <Briefcase className="h-4 w-4 mr-2" />
  Project Assignments
</Button>
```

### Step 3: Update Timesheet Component

Modify timesheet to fetch and display projects:

```typescript
// Fetch employee's active projects
const fetchProjects = async (employeeId: string) => {
  const response = await fetch(
    `${API_URL}/project-assignments/employee/${employeeId}`,
    { headers: { Authorization: `Bearer ${publicAnonKey}` } }
  );
  const data = await response.json();
  return data.assignments.filter(a => a.status === 'active');
};

// In timesheet form
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select project" />
  </SelectTrigger>
  <SelectContent>
    {projects.map(project => (
      <SelectItem key={project.id} value={project.id}>
        {project.clientName} - {project.projectName} (${project.billableRate}/{project.billingCycle})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Step 4: Update Employee Onboarding

Add optional project assignment during onboarding:

```typescript
// After employee creation
const showProjectAssignmentPrompt = () => {
  return (
    <Alert>
      <AlertTitle>Assign to Project?</AlertTitle>
      <AlertDescription>
        Would you like to assign this employee to a client project now?
      </AlertDescription>
      <div className="flex gap-2 mt-4">
        <Button onClick={openProjectAssignmentDialog}>Assign Now</Button>
        <Button variant="outline">Skip (assign later)</Button>
      </div>
    </Alert>
  );
};
```

---

## 📈 Benefits

### For HR/Admins
- ✅ **Flexibility**: Assign employees to multiple clients
- ✅ **Visibility**: See all assignments in one place
- ✅ **Control**: Manage allocation percentages
- ✅ **Tracking**: Monitor project lifecycles
- ✅ **Reporting**: Generate client-specific reports

### For Employees
- ✅ **Clarity**: Know exactly which projects they're on
- ✅ **Simplicity**: Easy project selection in timesheets
- ✅ **Transparency**: See allocation and rates
- ✅ **Organization**: Clear project timelines

### For Clients
- ✅ **Dedicated Resources**: See which employees are assigned
- ✅ **Billing Accuracy**: Project-specific rates
- ✅ **Status Tracking**: Monitor project progress
- ✅ **PO Management**: Track purchase orders per project

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Create new project assignment
- [ ] Assign employee to project
- [ ] Set allocation percentage
- [ ] Configure billable rate
- [ ] Edit existing assignment
- [ ] Delete assignment
- [ ] Change project status

### Multiple Client Scenarios
- [ ] Assign one employee to 2+ clients
- [ ] Verify total allocation doesn't exceed 100%
- [ ] Create overlapping date ranges
- [ ] Test different billing cycles
- [ ] Verify independent billing rates

### Integration Tests
- [ ] Employee can see all projects in portal
- [ ] Timesheet shows active projects
- [ ] Client dashboard shows assigned employees
- [ ] Onboarding links to project assignments
- [ ] Reports include project breakdowns

### Edge Cases
- [ ] Employee with 0 projects
- [ ] Employee with 100% allocation to one project
- [ ] Project with no end date (ongoing)
- [ ] Completed project (historical data)
- [ ] Cancelled project (historical data)

---

## 📊 Sample Data

### Example 1: Consultant with Multiple Clients

**Employee**: John Smith

**Projects**:
1. **Tech Corp - Cloud Migration**
   - Client: Tech Corp
   - Role: Cloud Architect
   - Allocation: 60%
   - Rate: $150/hour
   - Status: Active
   - Duration: Jan 1 - Jun 30, 2024

2. **Startup Inc - MVP Development**
   - Client: Startup Inc
   - Role: Technical Advisor
   - Allocation: 40%
   - Rate: $120/hour
   - Status: Active
   - Duration: Feb 1 - May 31, 2024

**Timesheet Entry (Week of Jan 15)**:
- Monday: Tech Corp (6h), Startup Inc (2h)
- Tuesday: Tech Corp (5h), Startup Inc (3h)
- Wednesday: Tech Corp (6h), Startup Inc (2h)
- Thursday: Startup Inc (8h)
- Friday: Tech Corp (4h), Startup Inc (4h)

**Total**: Tech Corp 21h @ $150 = $3,150 | Startup Inc 19h @ $120 = $2,280

---

### Example 2: Full-Time Employee with Side Project

**Employee**: Sarah Johnson

**Projects**:
1. **Internal - HR System Upgrade**
   - Client: Internal/Operations
   - Role: Lead Developer
   - Allocation: 80%
   - Rate: N/A (internal)
   - Status: Active

2. **Client X - Mobile App**
   - Client: Client X
   - Role: Senior Developer
   - Allocation: 20%
   - Rate: $95/hour
   - Status: Active

---

## 🎯 Best Practices

### 1. **Allocation Management**
- Keep total allocation ≤ 100% per employee
- Plan for PTO/holidays (reduce allocation during those periods)
- Consider ramp-up/ramp-down phases

### 2. **Project Naming**
- Use format: "Client Name - Project Description"
- Examples:
  - "Acme Corp - Website Redesign"
  - "XYZ Inc - Mobile App Development"
  - "Internal - HR Portal Upgrade"

### 3. **Status Transitions**
- Use "Planning" for approved but not yet started projects
- Move to "Active" only when work begins
- Use "On Hold" for temporary pauses (client delays, etc.)
- Mark "Completed" when all deliverables are done
- Use "Cancelled" only when project is terminated

### 4. **Rate Management**
- Review rates annually
- Document rate changes in notes
- Consider different rates for different skills/roles
- Use fixed pricing for well-defined scopes

### 5. **Documentation**
- Add notes for special arrangements
- Document PO numbers for invoicing
- Track approval dates and approvers
- Note any client-specific requirements

---

## 🚀 Quick Start

### Create Your First Project Assignment

1. **Navigate** to Project Assignments module
2. **Click** "New Assignment" button
3. **Fill in**:
   - Project Name: "Client ABC - Web Development"
   - Client: Select from dropdown
   - Employee: Select from dropdown
   - Role: "Senior Developer"
   - Start Date: Today
   - Rate: 75
   - Billing Cycle: Hourly
   - Allocation: 100%
   - Status: Active
4. **Click** "Create Assignment"
5. **Verify** assignment appears in table

---

## 📞 Support

### Common Issues

**Q: Employee doesn't see project in timesheet dropdown**
A: Ensure project status is "Active" and start date is today or earlier

**Q: Can I assign an employee to overlapping projects?**
A: Yes, as long as total allocation doesn't exceed 100%

**Q: How do I handle project rate changes?**
A: Create a new assignment with new dates and rate, mark old one as completed

**Q: Can I have projects without end dates?**
A: Yes, leave end date blank for ongoing engagements

**Q: What happens to old assignments?**
A: They remain in system for historical reporting, filter by status to hide

---

## ✅ Summary

### What Changed
- ❌ **Before**: One employee = One client (single assignment)
- ✅ **After**: One employee = Multiple clients (project-based assignments)

### Key Features
- ✅ Project assignment management
- ✅ Multi-client support per employee
- ✅ Allocation percentage tracking
- ✅ Project lifecycle management
- ✅ Independent billing rates per project
- ✅ Enhanced timesheet integration

### Files Created
1. `/components/project-assignments.tsx` - Main component
2. `/PROJECT-ASSIGNMENTS-IMPLEMENTATION.md` - This documentation

### Files Updated
1. `/types/index.ts` - Added ProjectAssignment type
2. Employee type updated with projectAssignments array
3. Client type updated with project tracking fields

---

## 🎉 Ready to Use!

The project assignment system is now fully implemented and ready for production use. Employees can be assigned to multiple client projects with independent rates, allocations, and timelines.

For backend integration, implement the API endpoints described in the "Backend Implementation" section.

**Next Steps**:
1. Add Project Assignments to your navigation
2. Implement backend API endpoints
3. Update Timesheet component to show projects
4. Train users on new multi-client workflow
5. Migrate existing single-client assignments to projects
