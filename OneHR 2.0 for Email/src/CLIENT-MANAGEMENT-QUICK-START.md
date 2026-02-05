# Client Management Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Overview

The advanced client management system now supports:
- ✅ Multiple contacts per client
- ✅ Multiple engagements per client  
- ✅ Multiple POs per engagement
- ✅ Automatic expiry warnings
- ✅ Budget tracking
- ✅ Existing client detection

---

## 📍 Access Client Management

**Navigate to:**
```
Sidebar → Core Modules → Clients
```

**What You'll See:**
- Stats dashboard (Total Clients, Active Engagements, Expiring POs, Compliance Issues)
- Client directory table
- Search functionality
- "Add New Client" button

---

## ➕ Add Your First Client

### Step 1: Click "Add New Client"

### Step 2: Fill Basic Info Tab

**Required Fields (marked with *):**
- Legal Name: "Acme Inc."
- Company Name: "Acme Corp" (display name)
- Tax ID: "12-3456789"

**Optional Fields:**
- Doing Business As (DBA): "Acme"
- Industry: "Technology"
- Payment Terms: Net 30 (dropdown)
- Business Address
- Billing Address

**Tip:** If billing address same as business address, leave it blank!

---

### Step 3: Add Contacts

**Switch to "Contacts" tab**

**Contact 1 (Auto-created as Primary):**
```
Contact Type: [Legal ▼]
Name: Jane Smith *
Email: jane.smith@acme.com *
Phone: (555) 123-4567
☐ Can Approve Timesheets
☐ Can Approve Invoices
```

**Add More Contacts:**

Click "+ Add Contact" to add:
- AP/Billing contact (for invoices)
- Program Manager (for project coordination)
- Timesheet Approver (can approve timesheets)

**Example:**
```
Contact 2:
  Type: AP/Billing
  Name: Bob Johnson
  Email: bob.johnson@acme.com
  ☐ Can Approve Timesheets
  ☑ Can Approve Invoices
  
Contact 3:
  Type: Timesheet Approver
  Name: Alice Williams
  Email: alice.williams@acme.com
  ☑ Can Approve Timesheets
  ☐ Can Approve Invoices
```

**Tip:** At least ONE contact is required with name and email!

---

### Step 4: Configure Settings

**Switch to "Settings" tab**

**Timesheet & Invoice Settings:**
```
Timesheet Cadence: [Weekly ▼]
  Options: Weekly, Bi-Weekly, Monthly
  
Invoice Method: [Email ▼]
  Options: Email, Portal, EDI
```

**VMS Portal (Optional):**
```
VMS Portal Type: [Fieldglass ▼]
  Options: None, Fieldglass, Beeline, Ariba, VMS One, IQNavigator, Other
  
VMS Portal URL: https://acme.fieldglass.com
  (Only if VMS Portal Type ≠ None)
```

**AI Extraction Notice:**
```
✨ AI Document Extraction will be available after saving the client.
Upload MSA, SOW, or PO documents to automatically extract contact
information, payment terms, compliance requirements, and more.
```

---

### Step 5: Save Client

Click **"Create Client"** button

**Result:**
- Client created with unique ID
- All contacts saved
- Ready for engagements and POs
- Shows in client directory

---

## 🔍 Check if Client Already Exists

**Before creating a client, system can check if they exist:**

**How It Works:**
1. When adding new consultant, system checks Tax ID
2. If client exists → Skip MSA, add PO only
3. If new client → Full onboarding (MSA + PO + compliance)

**Manual Check:**

Not in UI yet, but available via API:
```javascript
GET /clients/check-existing?taxId=12-3456789
GET /clients/check-existing?companyName=Acme%20Corp
```

**Response if exists:**
```json
{
  "exists": true,
  "client": { ... },
  "requiresFullOnboarding": false,
  "message": "Existing client found. Skip MSA, add PO only."
}
```

**Response if new:**
```json
{
  "exists": false,
  "client": null,
  "requiresFullOnboarding": true,
  "message": "New client. Full onboarding required: MSA + PO + compliance docs."
}
```

---

## ✏️ Edit Existing Client

### Step 1: Find Client

Use search box to find client:
```
[Search by company name, legal name, or Tax ID...]
```

### Step 2: Click Edit

Click the **Edit** button (pencil icon) in the Actions column

### Step 3: Make Changes

- All three tabs available (Basic Info, Contacts, Settings)
- Add/remove contacts
- Update addresses
- Change payment terms
- Modify VMS settings

### Step 4: Save Changes

Click **"Update Client"** button

**Result:**
- Client updated
- Table refreshes
- Toast notification shows success

---

## 📊 Understanding the Client Table

### Columns Explained

| Column | Description |
|--------|-------------|
| **Company Name** | Display name with building icon |
| **Legal Name** | Official registered name (gray text) |
| **Tax ID** | EIN with hash icon |
| **Contacts** | Number of contacts (with user icon) |
| **Engagements** | Number of active engagements |
| **Payment Terms** | Net 30, Net 45, etc. |
| **Status** | Active/Inactive badge + warning icons |
| **Actions** | Edit button |

### Status Indicators

**Badges:**
- 🟢 **Active** - Green badge, client is active
- ⚪ **Inactive** - Gray badge, client is inactive

**Warning Icons:**
- ⚠️ **Orange Warning** - Has POs expiring within 30 days
- 🔴 **Red Alert** - Has compliance issues

**Example Row:**
```
Acme Corp | Acme Inc. | 12-3456789 | 3 | 2 | Net 30 | Active ⚠️ | [Edit]
```
This shows: Client with 3 contacts, 2 engagements, and expiring POs

---

## 📈 Dashboard Stats

### What the Numbers Mean

**Total Clients:**
```
25
22 active
```
- 25 total clients in system
- 22 are marked as active

**Active Engagements:**
```
42
Across all clients
```
- 42 total active engagements
- Sum of all clients' active engagements

**Expiring POs:**
```
3
Within 30 days
```
- 3 POs expiring in next 30 days
- Requires attention/renewal

**Compliance Issues:**
```
1
Requires attention
```
- 1 client has compliance flag set
- Need to review and resolve

---

## 🎯 Common Tasks

### Task 1: Add Client with Multiple Contacts

```
1. Click "Add New Client"
2. Basic Info tab:
   - Legal Name: "TechCorp Inc."
   - Company Name: "TechCorp"
   - Tax ID: "98-7654321"
3. Contacts tab:
   - Add Legal contact
   - Add AP/Billing contact  
   - Add PM contact
   - Add Timesheet Approver
4. Settings tab:
   - Timesheet: Weekly
   - Invoice: Email
5. Click "Create Client"
```

**Result:** Client with 4 contacts created

---

### Task 2: Find Client and Edit

```
1. Type company name in search: "Acme"
2. Table filters to show Acme Corp
3. Click Edit button
4. Update payment terms to "Net 45"
5. Add new contact (VMS Portal)
6. Click "Update Client"
```

**Result:** Client updated with new payment terms and contact

---

### Task 3: Remove a Contact

```
1. Edit client
2. Go to Contacts tab
3. Click [×] button on contact you want to remove
4. Contact removed from list
5. Click "Update Client"
```

**Note:** You must have at least 1 contact!

---

### Task 4: Configure VMS Portal

```
1. Edit client
2. Go to Settings tab
3. VMS Portal Type: Select "Fieldglass"
4. VMS Portal URL: Enter "https://client.fieldglass.com"
5. Click "Update Client"
```

**Result:** VMS portal configured for client

---

## 🔔 Tips & Tricks

### Tip 1: Required Fields
**Always fill in:**
- Legal Name (official company name)
- Company Name (display name)
- Tax ID (for unique identification)
- At least 1 contact with name and email

### Tip 2: Primary Contact
- First contact is automatically marked as Primary
- You can change this by marking another contact as Primary
- Only one contact can be Primary at a time

### Tip 3: Billing Address
- If same as business address, leave blank
- System uses business address if billing address is empty

### Tip 4: Contact Types
Choose appropriate type for each contact:
- **Legal** - Legal department, contracts
- **AP/Billing** - Accounts payable, invoice questions
- **Program/PM** - Day-to-day project management
- **VMS Portal** - VMS system administrator
- **Timesheet Approver** - Can approve timesheets
- **General** - Default, all-purpose contact

### Tip 5: Search
Search works on:
- Company name
- Legal name
- Tax ID

Search is case-insensitive and updates in real-time!

---

## ⚠️ Common Issues

### Issue: "Missing required fields" error

**Cause:** Didn't fill in Legal Name, Company Name, or Tax ID

**Fix:**
1. Go to Basic Info tab
2. Fill in all fields marked with red asterisk (*)
3. Try saving again

---

### Issue: "At least one contact required" error

**Cause:** All contacts were removed or none have name/email

**Fix:**
1. Go to Contacts tab
2. Ensure at least one contact exists
3. Ensure contact has both Name and Email filled
4. Try saving again

---

### Issue: Can't remove last contact

**Cause:** System requires minimum 1 contact

**Fix:** This is intentional - every client must have at least one contact. Add a new contact before removing the last one.

---

### Issue: VMS Portal URL field disabled

**Cause:** VMS Portal Type is set to "None"

**Fix:**
1. Go to Settings tab
2. Change VMS Portal Type to something other than "None"
3. URL field will become enabled

---

## 🎨 UI Overview

### Client Directory Screen

```
┌─────────────────────────────────────────────────────────┐
│ Client Management                    [+ Add New Client] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌────────────┬────────────┬────────────┬────────────┐  │
│ │ Total      │ Active     │ Expiring   │ Compliance │  │
│ │ Clients    │ Engagements│ POs        │ Issues     │  │
│ │ 25         │ 42         │ 3          │ 1          │  │
│ └────────────┴────────────┴────────────┴────────────┘  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Client Directory                                    │ │
│ │                                                     │ │
│ │ [Search by company name, legal name, or Tax ID...] │ │
│ │                                                     │ │
│ │ ┌──────────┬──────────┬────────┬─────┬──────┬────┐ │ │
│ │ │ Company  │ Legal    │ Tax ID │ ... │ Stat │ ... │ │
│ │ │ Name     │ Name     │        │     │ us   │     │ │
│ │ ├──────────┼──────────┼────────┼─────┼──────┼────┤ │ │
│ │ │ Acme     │ Acme Inc │ 12-... │ 3   │ Act  │[E] │ │ │
│ │ │ Corp     │          │        │     │ ive  │    │ │ │
│ │ └──────────┴──────────┴────────┴─────┴──────┴────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Add/Edit Client Dialog

```
┌─────────────────────────────────────────┐
│ Add New Client                     [×]  │
├─────────────────────────────────────────┤
│                                         │
│ [Basic Info] [Contacts] [Settings]      │
│ ═══════════                             │
│                                         │
│ Legal Name *                            │
│ [_________________________________]     │
│                                         │
│ Doing Business As (DBA)                 │
│ [_________________________________]     │
│                                         │
│ Company Name *   │ Tax ID (EIN) *       │
│ [______________] │ [______________]     │
│                                         │
│ Industry         │ Payment Terms        │
│ [______________] │ [Net 30 ▼]           │
│                                         │
│ Business Address                        │
│ [_________________________________]     │
│                                         │
│ Billing Address                         │
│ [_________________________________]     │
│                                         │
│                    [Cancel] [Create Client] │
└─────────────────────────────────────────┘
```

---

## 📱 Next Steps

### After Creating Client

**You can now:**
1. ✅ **Add Engagements** - Create MSA/SOW agreements
2. ✅ **Add Purchase Orders** - Track PO budgets
3. ✅ **Upload Documents** - Store MSA, SOW, PO files
4. ✅ **Assign Employees** - Link consultants to client projects
5. ✅ **Track Compliance** - Monitor insurance, certifications

### Future Features (Coming Soon)

1. **Engagement Management UI** - Visual engagement cards
2. **PO Management UI** - Add/edit POs directly from client view
3. **Document Upload** - Drag-and-drop file upload
4. **AI Extraction** - Auto-extract data from MSA/SOW/PO
5. **Compliance Dashboard** - Track all compliance requirements
6. **Expiry Alerts** - Email notifications for expiring POs/docs
7. **Reporting** - Client revenue reports, utilization tracking

---

## 🆘 Need Help?

### For Detailed Information

See: `/REQUIREMENTS-4.1-4.2-IMPLEMENTATION.md`

### For API Documentation

**Endpoints:**
- GET `/clients/advanced` - Get all clients
- POST `/clients/advanced` - Create client
- PUT `/clients/advanced/:id` - Update client
- GET `/clients/check-existing` - Check if client exists
- POST `/clients/:id/engagements` - Add engagement
- POST `/clients/:id/engagements/:engId/pos` - Add PO

### For Type Definitions

See: `/types/index.ts`

Look for:
- `Client`
- `ClientContact`
- `ClientEngagement`
- `PurchaseOrder`
- `ClientDocument`

---

## ✅ Quick Checklist

**Setting up a new client:**

- [ ] Gather client information (Legal Name, Tax ID, etc.)
- [ ] Collect contact details for key people
- [ ] Determine payment terms
- [ ] Identify timesheet cadence (weekly/bi-weekly/monthly)
- [ ] Check if VMS portal is used
- [ ] Navigate to Clients module
- [ ] Click "Add New Client"
- [ ] Fill Basic Info tab
- [ ] Add all contacts in Contacts tab
- [ ] Configure Settings tab
- [ ] Click "Create Client"
- [ ] Verify client appears in table

**Next:**
- [ ] Add engagement (future feature)
- [ ] Add PO to engagement (future feature)
- [ ] Upload MSA/SOW documents (future feature)
- [ ] Assign employees to client (via Projects module)

---

## 🎉 You're Ready!

You now know how to:
- ✅ Add new clients with multiple contacts
- ✅ Edit existing clients
- ✅ Configure payment and timesheet settings
- ✅ Set up VMS portal integration
- ✅ Search and filter clients
- ✅ Understand status indicators

**Start adding your clients now!** 🚀

Navigate to: **Sidebar → Core Modules → Clients**
