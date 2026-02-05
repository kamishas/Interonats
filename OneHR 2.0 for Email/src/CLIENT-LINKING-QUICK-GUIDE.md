# 🚀 Quick Guide: Linking Employees to Clients

## How to Use the Client Assignment Feature

---

## 📋 **Option 1: Assign Existing Client**

### **Steps:**
1. Click **"New Employee"** button
2. Fill in employee basic info (name, email, etc.)
3. Scroll to **"Client Assignment"** section
4. Click the dropdown
5. Select a client from the list
6. Enter **PO Number** (if applicable)
7. Click **"Create & Start Workflow"**

### **Result:**
✅ Employee created and linked to selected client  
✅ PO number saved for billing  
✅ Ready for billable timesheet entry  

---

## ➕ **Option 2: Add New Client & Assign**

### **Steps:**
1. Click **"New Employee"** button
2. Fill in employee basic info
3. In **"Client Assignment"** section, click **"+ Add New Client"**
4. Quick dialog opens
5. Fill in **required fields** (marked with *):
   - **Company Name** *
   - **Contact Person** *
   - **Email** *
6. Fill in **optional fields**:
   - Phone
   - Industry
   - Payment Terms (defaults to Net 30)
7. Click **"Add Client & Assign"**
8. Client is created and **automatically selected**
9. Enter PO number
10. Click **"Create & Start Workflow"**

### **Result:**
✅ New client created in system  
✅ Client automatically assigned to employee  
✅ No need to go to Client Onboarding module  
✅ Employee ready for onboarding workflow  

---

## 🏢 **Option 3: Internal Employee (No Client)**

### **Steps:**
1. Click **"New Employee"** button
2. Fill in employee basic info
3. In **"Client Assignment"** dropdown
4. Select **"No client (Internal/Non-billable)"**
5. Click **"Create & Start Workflow"**

### **Result:**
✅ Employee created without client link  
✅ Marked as internal/non-billable  
✅ No PO number required  
✅ Suitable for operational staff  

---

## 🎯 **When to Use Each Option**

| Scenario | Use This Option |
|----------|----------------|
| Employee will work for existing client | **Option 1** - Select existing client |
| New client needs to be onboarded quickly | **Option 2** - Add new client |
| Employee is internal staff | **Option 3** - No client |
| Employee works on internal projects | **Option 3** - No client |
| Consultant on client project | **Option 1** or **Option 2** |
| Department head / Manager | **Option 3** - No client |

---

## ⚡ **Quick Tips**

### **Speed Tip:**
Use the **Quick Add Client** feature instead of:
1. Going to Client Onboarding
2. Creating client there
3. Coming back to Employee Onboarding
4. Finding the new client

**Saves 5+ clicks and 2+ minutes!**

### **Required Fields:**
Only **3 fields** required for quick client add:
- ✓ Company Name
- ✓ Contact Person
- ✓ Email

Everything else is optional!

### **Auto-Selection:**
When you create a client via quick-add, it's **automatically selected** for the employee. No need to search for it!

### **Validation:**
The system validates:
- ✓ All required fields filled
- ✓ Email format correct
- ✓ Prevents duplicate entries

---

## 🔍 **Visual Guide**

### **What You'll See:**

```
┌─────────────────────────────────────────────────┐
│ Client Assignment        [+ Add New Client]     │
│ ┌─────────────────────────────────────────────┐ │
│ │ Select a client (optional)              ▼  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ↓ Click dropdown to see:                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ ○ No client (Internal/Non-billable)        │ │
│ │ 🏢 Acme Corporation                         │ │
│ │ 🏢 TechCorp Inc                             │ │
│ │ 🏢 Global Industries                        │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

↓ After selecting client:

┌─────────────────────────────────────────────────┐
│ Selected: Acme Corporation                      │
│                                                 │
│ PO Number                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ PO-2024-001                                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 📞 **Common Questions**

### **Q: Can I change the client later?**
A: Yes! Edit the employee record and select a different client.

### **Q: What if I don't see my client in the dropdown?**
A: Click "+ Add New Client" to create it on-the-fly.

### **Q: Is the PO number required?**
A: Only if the employee is billable to a client. For internal employees, leave it blank.

### **Q: Can an employee work for multiple clients?**
A: Currently one client per employee. For multi-client consultants, create separate employee records or contact admin.

### **Q: What happens if I select "No client"?**
A: The employee will be marked as internal/non-billable. Best for operational staff, managers, and internal project teams.

### **Q: Can I add more client details later?**
A: Yes! Quick-add creates a basic client record. Go to Client Onboarding to add contracts, billing rates, and other details.

---

## ✅ **Best Practices**

1. **Always assign a client** for consultants and contractors
2. **Use "No client"** for internal staff only
3. **Add PO numbers** for billable employees upfront
4. **Fill in client details** in Client Onboarding after quick-add
5. **Verify client assignment** before starting workflow

---

## 🎉 **Benefits**

- ⚡ **Faster onboarding** - No module switching
- 🎯 **Better accuracy** - Client linked from day one
- 💰 **Billing ready** - PO numbers captured early
- 📊 **Better reporting** - Clean client-employee data
- ✨ **User-friendly** - Intuitive dropdown + quick-add

---

**Need Help?** Check the full documentation in `CLIENT-EMPLOYEE-LINKING.md`
