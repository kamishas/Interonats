# Role Creation Interface for Admins - Complete Guide

## Overview

The Role Creation Interface allows **Admin users** to define custom roles with specific permissions tailored to their organization's needs. This is a core feature of the OneHR platform's role-based access control system.

## Key Features

### 1. **Role Management Dashboard**
- View all custom roles created for your organization
- See system roles as reference
- Track users assigned to custom roles
- Quick statistics showing total roles and assignments

### 2. **Create Custom Roles**
Admin users can create custom roles by:
- **Role Name (Internal)**: A unique identifier (lowercase, hyphens only)
- **Display Name**: Human-readable name shown in the UI
- **Description**: Optional description of the role's purpose
- **Permissions**: Granular permission selection across all modules

### 3. **Permission Categories**
Permissions are organized into logical categories:

#### **Dashboard & Analytics**
- Access Dashboard
- View System Analytics

#### **Employee Management**
- View Employees (read-only)
- Manage Employees (full CRUD access)
- Access Employee Modules (Documents, Leave, Performance)

#### **Client Management**
- Manage Clients, Vendors, and Subvendors

#### **Immigration**
- Manage Immigration Cases and Visa Filings

#### **Licensing & Certifications**
- Manage Business Licensing and Certifications

#### **Timesheets & Invoicing**
- View Timesheets
- Manage Timesheets, Invoices, and Expenses

#### **System Administration**
- Manage Users & Roles
- Access Organization Settings

### 4. **Edit Custom Roles**
- Modify role display name and description
- Update permissions at any time
- Changes apply immediately to all users with that role

### 5. **Delete Custom Roles**
- Remove roles that are no longer needed
- System warns if users are currently assigned to the role
- Requires confirmation before deletion

## How to Access

### For Admin Users:
1. Log in to your OneHR account as an **Admin**
2. Navigate to **Admin Tools** in the sidebar
3. Click on **Role Management**

### Access Requirements:
- Only users with the `admin` or `super_admin` role can access this interface
- Product Admins have a separate interface for managing admin role permissions across organizations

## User Flow

### Creating a Custom Role

1. **Navigate to Role Management**
   - Click "Role Management" in the Admin Tools section

2. **Click "Create Custom Role"**
   - Large button at the top right of the page
   - Opens a comprehensive role creation dialog

3. **Fill in Basic Information**
   ```
   Role Name: project-manager
   Display Name: Project Manager
   Description: Manages client projects and assignments
   ```

4. **Select Permissions**
   - Browse through permission categories
   - Toggle switches to enable/disable each permission
   - See real-time summary of selected permissions
   - Hover over permissions to see descriptions

5. **Review and Create**
   - Check the summary showing total permissions selected
   - Click "Create Role" to save
   - New role is immediately available for user assignment

### Assigning Users to Custom Roles

After creating a custom role, you can assign users to it via:
1. **User Onboarding** (when adding new users)
2. **User Management** (editing existing users)

Custom roles appear in role selection dropdowns alongside system roles, marked with a "Custom" badge.

## Technical Details

### Backend Integration
- **Endpoint**: `POST /make-server-f8517b5b/custom-roles`
- **Storage**: Custom roles are stored in the KV store with `custom-role:` prefix
- **Organization Isolation**: Each role is scoped to the creating organization via `organizationId`

### Data Structure
```typescript
{
  id: string;
  roleName: string;              // Unique identifier
  displayName: string;           // UI display name
  description: string;           // Optional description
  permissions: {                 // Permission flags
    canAccessDashboard: boolean;
    canManageEmployees: boolean;
    // ... etc
  };
  organizationId: string;        // Scoped to organization
  createdBy: string;            // Admin user who created it
  isCustom: true;               // Always true for custom roles
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}
```

### Permission System
- Permissions are boolean flags checked throughout the application
- Each module checks specific permissions before rendering
- Access denied screens shown when permissions are insufficient

## Best Practices

### 1. **Role Naming**
- Use descriptive, lowercase names with hyphens: `project-manager`, `team-lead`
- Keep display names clear and professional: "Project Manager", "Team Lead"
- Add descriptions to help future admins understand the role's purpose

### 2. **Permission Assignment**
- Follow the **principle of least privilege**: only grant necessary permissions
- Start minimal and add permissions as needed
- Document custom roles and their purposes

### 3. **Role Organization**
- Create roles based on job functions, not individuals
- Reuse roles across multiple users when possible
- Review and update permissions regularly

### 4. **Testing New Roles**
- Create a test user account with the new role
- Verify access to intended modules
- Check that restricted areas properly deny access

## Examples of Common Custom Roles

### 1. **Project Manager**
```
Permissions:
✓ Access Dashboard
✓ View Employees
✓ Manage Clients
✓ Manage Projects
✗ Manage Immigration
✗ Manage Licensing
```

### 2. **Team Lead**
```
Permissions:
✓ Access Dashboard
✓ View Employees
✓ View Timesheets
✓ Access Employee Management
✗ Manage Employees
✗ Manage Users
```

### 3. **Payroll Specialist**
```
Permissions:
✓ Access Dashboard
✓ View Employees
✓ Manage Timesheets
✓ Manage Invoices & Expenses
✗ Manage Immigration
✗ Manage Licensing
```

### 4. **Compliance Officer**
```
Permissions:
✓ Access Dashboard
✓ View Employees
✓ Manage Immigration
✓ Manage Licensing
✓ Access Employee Documents
✗ Manage Employees
✗ Manage Timesheets
```

## Troubleshooting

### Issue: Custom role not appearing in user assignment
**Solution**: Refresh the page or reload custom roles. Ensure the role was successfully created.

### Issue: Users with custom role can't access expected modules
**Solution**: Edit the custom role and verify the correct permissions are enabled. Save changes.

### Issue: Can't delete a custom role
**Solution**: First reassign all users with that role to a different role, then delete.

### Issue: Permission changes not taking effect
**Solution**: Users may need to log out and log back in for permission changes to apply.

## Integration with Onboarding Flow

As described in the background:
1. **Admin creates account** → becomes admin user
2. **Admin creates custom roles** → defines organization's role structure  
3. **Admin onboards users** → assigns users to custom or system roles

This ensures every organization can tailor the role hierarchy to their specific needs before adding users.

## Security Considerations

- **Organization Isolation**: Custom roles are scoped to the organization that created them
- **Role Validation**: System prevents creation of roles with duplicate names
- **Permission Checks**: Every module verifies permissions before granting access
- **Audit Trail**: Creation and modification timestamps tracked for all roles

## Future Enhancements

Planned improvements to the role creation interface:
- Role templates for common use cases
- Bulk permission assignment
- Role cloning functionality
- Permission comparison between roles
- Usage analytics for each custom role

---

## Summary

The Role Creation Interface empowers admin users to build a flexible, secure access control system tailored to their organization's unique structure. By creating custom roles with specific permissions, admins can ensure users have exactly the access they need—no more, no less.

For questions or assistance, contact your OneHR support team.
