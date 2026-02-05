# Client Management Workflows - Visual Guide

## 🎯 Complete Workflow Diagrams

---

## Workflow 1: Create New Client (Full Onboarding)

```
START: User clicks "Add New Client"
│
├─── STEP 1: Basic Info Tab ─────────────────────────┐
│    │                                                │
│    ├─ Legal Name: "Acme Inc." *                    │
│    ├─ DBA: "Acme Corp"                             │
│    ├─ Company Name: "Acme Corp" *                  │
│    ├─ Tax ID: "12-3456789" *                       │
│    ├─ Industry: "Technology"                       │
│    ├─ Payment Terms: "Net 30"                      │
│    ├─ Business Address: "123 Main St..."           │
│    └─ Billing Address: "456 Billing Ave..."        │
│                                                     │
│    Click: Next → Contacts Tab                      │
│                                                     │
├─── STEP 2: Contacts Tab ───────────────────────────┤
│    │                                                │
│    ├─ Contact 1 (Auto-created, Primary):           │
│    │  ├─ Type: Legal                               │
│    │  ├─ Name: "Jane Smith" *                      │
│    │  ├─ Email: "jane@acme.com" *                  │
│    │  ├─ Phone: "(555) 123-4567"                   │
│    │  ├─ ☐ Can Approve Timesheets                  │
│    │  └─ ☐ Can Approve Invoices                    │
│    │                                                │
│    ├─ Click "+ Add Contact"                        │
│    │                                                │
│    ├─ Contact 2:                                   │
│    │  ├─ Type: AP/Billing                          │
│    │  ├─ Name: "Bob Johnson"                       │
│    │  ├─ Email: "bob@acme.com"                     │
│    │  ├─ ☐ Can Approve Timesheets                  │
│    │  └─ ☑ Can Approve Invoices                    │
│    │                                                │
│    ├─ Click "+ Add Contact"                        │
│    │                                                │
│    └─ Contact 3:                                   │
│       ├─ Type: Timesheet Approver                  │
│       ├─ Name: "Alice Williams"                    │
│       ├─ Email: "alice@acme.com"                   │
│       ├─ ☑ Can Approve Timesheets                  │
│       └─ ☐ Can Approve Invoices                    │
│                                                     │
│    Click: Next → Settings Tab                      │
│                                                     │
├─── STEP 3: Settings Tab ───────────────────────────┤
│    │                                                │
│    ├─ Timesheet Cadence: "Weekly"                  │
│    ├─ Invoice Method: "Email"                      │
│    ├─ VMS Portal Type: "Fieldglass"                │
│    └─ VMS Portal URL: "https://acme.fieldglass..." │
│                                                     │
│    Click: "Create Client"                          │
│                                                     │
├─── VALIDATION ──────────────────────────────────────┤
│    │                                                │
│    ├─ Check: Legal Name? ✓                         │
│    ├─ Check: Company Name? ✓                       │
│    ├─ Check: Tax ID? ✓                             │
│    ├─ Check: At least 1 contact? ✓                 │
│    └─ Check: Contact has name & email? ✓           │
│                                                     │
├─── PROCESSING ──────────────────────────────────────┤
│    │                                                │
│    ├─ Generate client ID                           │
│    ├─ Generate contact IDs                         │
│    ├─ Set primary contact                          │
│    ├─ Initialize empty arrays (engagements, docs)  │
│    ├─ Set default flags                            │
│    └─ Save to database                             │
│                                                     │
└─── RESULT ──────────────────────────────────────────┘
     │
     ├─ ✅ Client created successfully
     ├─ Toast notification shown
     ├─ Dialog closes
     ├─ Table refreshes
     └─ New client appears in list

     Client Record Created:
     ┌──────────────────────────────────────┐
     │ Acme Corp                            │
     │ Legal: Acme Inc.                     │
     │ Tax ID: 12-3456789                   │
     │ Contacts: 3                          │
     │ Engagements: 0 (ready to add)        │
     │ Status: Active ✓                     │
     └──────────────────────────────────────┘
```

---

## Workflow 2: Check if Client Exists

```
SCENARIO: Adding consultant to potentially existing client

START: Consultant confirmation received
│
├─── SYSTEM AUTO-CHECK ──────────────────────────────┐
│    │                                                │
│    Query: GET /clients/check-existing              │
│           ?taxId=12-3456789                        │
│                                                     │
├─── DATABASE LOOKUP ─────────────────────────────────┤
│    │                                                │
│    Search all clients where:                       │
│    - taxId === "12-3456789" OR                     │
│    - companyName.toLowerCase() === "acme corp"     │
│                                                     │
├─── DECISION POINT ──────────────────────────────────┤
│    │                                                │
│    Found matching client?                          │
│    │                                                │
│    ├─── YES (Existing Client) ──────────────────┐  │
│    │    │                                        │  │
│    │    Response:                                │  │
│    │    {                                        │  │
│    │      exists: true,                          │  │
│    │      client: { id, name, ... },             │  │
│    │      requiresFullOnboarding: false,         │  │
│    │      message: "Existing client found.       │  │
│    │                Skip MSA, add PO only."      │  │
│    │    }                                        │  │
│    │    │                                        │  │
│    │    WORKFLOW:                                │  │
│    │    ├─ ⏭️  Skip MSA upload                   │  │
│    │    ├─ ⏭️  Skip SOW upload (optional)        │  │
│    │    ├─ ✅ Add PO to existing engagement      │  │
│    │    ├─ ✅ Link consultant to client          │  │
│    │    └─ ✅ Assign to project                  │  │
│    │                                             │  │
│    └─── NO (New Client) ────────────────────────┘  │
│         │                                           │
│         Response:                                   │
│         {                                           │
│           exists: false,                            │
│           client: null,                             │
│           requiresFullOnboarding: true,             │
│           message: "New client. Full onboarding    │
│                     required: MSA + PO +           │
│                     compliance docs."              │
│         }                                           │
│         │                                           │
│         WORKFLOW:                                   │
│         ├─ ✅ Create new client record              │
│         ├─ ✅ Upload MSA (required)                 │
│         ├─ ✅ Upload SOW (optional)                 │
│         ├─ ✅ Upload PO (required)                  │
│         ├─ ✅ Collect compliance docs               │
│         │  ├─ COI (Certificate of Insurance)       │
│         │  ├─ BAA (if healthcare)                  │
│         │  ├─ DPA (if data processing)             │
│         │  └─ Background check                     │
│         ├─ ✅ Link consultant to client             │
│         └─ ✅ Assign to project                     │
│                                                     │
└─── END ─────────────────────────────────────────────┘

Visual Decision Tree:

              Check Tax ID
                   ↓
         ┌─────────┴─────────┐
         │                   │
    Exists?             Doesn't Exist?
         │                   │
         ↓                   ↓
   Skip MSA           Full Onboarding
   Add PO Only        MSA + PO + Docs
         │                   │
         └────────┬──────────┘
                  ↓
          Link Consultant
          Assign to Project
                  ↓
                DONE
```

---

## Workflow 3: Add Multiple POs to Engagement

```
START: Client has active engagement
│
├─── ENGAGEMENT SETUP ────────────────────────────────┐
│    │                                                 │
│    Engagement: "2024 Staff Augmentation"            │
│    Client: Acme Corp                                │
│    Type: Staff Aug                                  │
│    Status: Active                                   │
│    Start: 2024-01-01                                │
│                                                      │
├─── PO #1: Initial PO (Role A) ──────────────────────┤
│    │                                                 │
│    ├─ PO Number: "PO-2024-001"                      │
│    ├─ PO Type: "Initial"                            │
│    ├─ Role: "Senior Developer"                      │
│    ├─ Start Date: 2024-01-01                        │
│    ├─ End Date: 2024-06-30                          │
│    ├─ Total Amount: $100,000                        │
│    ├─ Currency: USD                                 │
│    └─ Status: Active                                │
│         │                                            │
│         Validation:                                 │
│         ├─ End > Start? ✓                           │
│         ├─ Days until expiry: 180                   │
│         ├─ Expiry warning? ✗ (>30 days)             │
│         └─ Budget warning? ✗ (0% spent)             │
│                                                      │
│    PO Created:                                      │
│    ┌────────────────────────────────────┐           │
│    │ PO-2024-001                        │           │
│    │ Amount: $100,000                   │           │
│    │ Remaining: $100,000                │           │
│    │ Status: Active ✓                   │           │
│    └────────────────────────────────────┘           │
│                                                      │
├─── PO #2: Parallel PO (Role B) ─────────────────────┤
│    │                                                 │
│    ├─ PO Number: "PO-2024-002"                      │
│    ├─ PO Type: "Initial"                            │
│    ├─ Role: "QA Engineer"                           │
│    ├─ Start Date: 2024-02-01                        │
│    ├─ End Date: 2024-05-31                          │
│    ├─ Total Amount: $50,000                         │
│    ├─ Currency: USD                                 │
│    ├─ Related to: PO-2024-001 (parallel)            │
│    └─ Status: Active                                │
│         │                                            │
│         Validation:                                 │
│         ├─ End > Start? ✓                           │
│         ├─ Days until expiry: 120                   │
│         ├─ Expiry warning? ✗                        │
│         └─ Budget warning? ✗                        │
│                                                      │
│    Engagement Updated:                              │
│    ├─ Active PO Count: 2                            │
│    ├─ Total PO Value: $150,000                      │
│    ├─ Total Spent: $0                               │
│    └─ Total Remaining: $150,000                     │
│                                                      │
├─── TIME PASSES (Work performed) ────────────────────┤
│    │                                                 │
│    PO-2024-001:                                     │
│    ├─ Spent: $85,000                                │
│    ├─ Remaining: $15,000                            │
│    ├─ Utilization: 85%                              │
│    └─ Budget Warning: ⚠️ YES (>80%)                 │
│                                                      │
│    PO-2024-002:                                     │
│    ├─ Spent: $30,000                                │
│    ├─ Remaining: $20,000                            │
│    ├─ Utilization: 60%                              │
│    └─ Budget Warning: ✗ NO                          │
│                                                      │
├─── PO #3: Extension PO ─────────────────────────────┤
│    │                                                 │
│    ├─ PO Number: "PO-2024-003"                      │
│    ├─ PO Type: "Extension"                          │
│    ├─ Extends: PO-2024-001 (parent)                 │
│    ├─ Role: "Senior Developer" (same)               │
│    ├─ Start Date: 2024-07-01                        │
│    ├─ End Date: 2024-12-31                          │
│    ├─ Total Amount: $120,000                        │
│    ├─ Currency: USD                                 │
│    └─ Status: Active                                │
│         │                                            │
│         Validation:                                 │
│         ├─ End > Start? ✓                           │
│         ├─ Parent PO ending? ✓ (2024-06-30)         │
│         ├─ Continuity? ✓ (starts 2024-07-01)        │
│         └─ Budget warning? ✗                        │
│                                                      │
│    Engagement Updated:                              │
│    ├─ Active PO Count: 3                            │
│    ├─ Total PO Value: $270,000                      │
│    ├─ Total Spent: $115,000                         │
│    └─ Total Remaining: $155,000                     │
│                                                      │
├─── PO #4: Incremental Funding ──────────────────────┤
│    │                                                 │
│    Scenario: PO-2024-001 depleted, need more funds  │
│    │                                                 │
│    ├─ PO Number: "PO-2024-004"                      │
│    ├─ PO Type: "Incremental Funding"                │
│    ├─ Adds to: PO-2024-001                          │
│    ├─ Start Date: 2024-05-01 (immediate)            │
│    ├─ End Date: 2024-06-30 (same as parent)         │
│    ├─ Total Amount: $25,000                         │
│    └─ Status: Active                                │
│         │                                            │
│         Combined with PO-2024-001:                  │
│         ├─ Original: $100,000                       │
│         ├─ Additional: $25,000                      │
│         ├─ New Total: $125,000                      │
│         ├─ Spent: $85,000                           │
│         ├─ Remaining: $40,000                       │
│         └─ Budget Warning: ✗ (cleared)              │
│                                                      │
└─── FINAL STATE ─────────────────────────────────────┘
     │
     Engagement: "2024 Staff Augmentation"
     ├─ PO Count: 4 (3 active)
     ├─ Total Value: $295,000
     ├─ Total Spent: $115,000
     ├─ Total Remaining: $180,000
     │
     PO Details:
     ├─ PO-2024-001 + PO-2024-004 (combined)
     │  └─ $125K total, $85K spent, $40K remaining
     ├─ PO-2024-002 (parallel - different role)
     │  └─ $50K total, $30K spent, $20K remaining
     └─ PO-2024-003 (extension of PO-001)
        └─ $120K total, $0 spent, $120K remaining

Visual Timeline:

2024-01-01 ─────────────────────────────── 2024-12-31
     │                                            │
     ├─ PO-001 ───────────┤                      │
     │  (Sr Dev)      2024-06-30                 │
     │                                            │
     │  PO-002 ─────┤                             │
     │  (QA)    2024-05-31                        │
     │                                            │
     │              ├─ PO-004 ─┤                  │
     │              │ (Add'l)  │                  │
     │              2024-05-01 2024-06-30         │
     │                                            │
     │                      ├─ PO-003 ───────────┤
     │                      │  (Extension)       │
     │                   2024-07-01         2024-12-31
```

---

## Workflow 4: Document Upload & AI Extraction (Future)

```
START: User uploads MSA document
│
├─── UPLOAD ──────────────────────────────────────────┐
│    │                                                 │
│    ├─ File selected: MSA_Acme_2024.pdf              │
│    ├─ Document type: MSA                            │
│    ├─ Client: Acme Corp                             │
│    └─ Upload initiated                              │
│         │                                            │
│         ↓                                            │
│    File saved to Supabase Storage                   │
│    ├─ Bucket: client-documents                      │
│    ├─ Path: acme-corp/msa/MSA_Acme_2024.pdf         │
│    └─ URL: https://...storage.../MSA_Acme_2024.pdf  │
│                                                      │
├─── AI EXTRACTION ───────────────────────────────────┤
│    │                                                 │
│    ├─ Send to OpenAI GPT-4 Vision                   │
│    ├─ Prompt: "Extract client data from MSA"        │
│    └─ Processing...                                 │
│         │                                            │
│         ↓                                            │
│    Extraction Results:                              │
│                                                      │
│    CONTACTS EXTRACTED:                              │
│    ├─ Contact 1:                                    │
│    │  ├─ Name: "Jane Smith" (confidence: 95%)       │
│    │  ├─ Email: "jane@acme.com" (confidence: 98%)   │
│    │  ├─ Phone: "(555) 123-4567" (confidence: 90%)  │
│    │  └─ Role: "Legal" (confidence: 85%)            │
│    │                                                 │
│    ├─ Contact 2:                                    │
│    │  ├─ Name: "Bob Johnson" (confidence: 92%)      │
│    │  ├─ Email: "bob@acme.com" (confidence: 95%)    │
│    │  ├─ Phone: "(555) 234-5678" (confidence: 88%)  │
│    │  └─ Role: "AP/Billing" (confidence: 75%) ⚠️    │
│    │                                                 │
│    COMMERCIAL TERMS:                                │
│    ├─ Payment Terms: "Net 30" (confidence: 99%)     │
│    ├─ Rate Card: "$150/hr" (confidence: 92%)        │
│    ├─ Billing Cycle: "Weekly" (confidence: 88%)     │
│    ├─ Overtime Rules: "1.5x after 40hrs" (conf: 85%)│
│    └─ Holidays: "Federal holidays" (conf: 70%) ⚠️   │
│                                                      │
│    COMPLIANCE:                                      │
│    ├─ BG Check: "Required" (confidence: 95%)        │
│    ├─ Drug Test: "Required" (confidence: 92%)       │
│    ├─ Insurance GL: "$1M" (confidence: 88%)         │
│    ├─ Insurance PL: "$2M" (confidence: 88%)         │
│    └─ Training: "HIPAA" (confidence: 65%) ⚠️        │
│                                                      │
│    OPERATIONAL:                                     │
│    ├─ VMS Portal: "Fieldglass" (confidence: 98%)    │
│    ├─ Portal URL: "https://..." (confidence: 95%)   │
│    ├─ Invoice Route: "Email to AP" (conf: 82%)      │
│    └─ Dispute Window: "30 days" (conf: 72%) ⚠️      │
│                                                      │
├─── CONFIDENCE ANALYSIS ─────────────────────────────┤
│    │                                                 │
│    Threshold: 80% minimum confidence                │
│    │                                                 │
│    Low Confidence Fields (require review):          │
│    ├─ ⚠️ Contact 2 Role: 75%                        │
│    ├─ ⚠️ Holidays: 70%                              │
│    ├─ ⚠️ Training (HIPAA): 65%                      │
│    └─ ⚠️ Dispute Window: 72%                        │
│                                                      │
│    Extraction saved:                                │
│    ├─ ID: extraction-uuid-123                       │
│    ├─ Document ID: doc-uuid-456                     │
│    ├─ Low-confidence fields: 4                      │
│    ├─ Status: Pending Review                        │
│    └─ Assigned to: HR Team                          │
│                                                      │
├─── HUMAN REVIEW ────────────────────────────────────┤
│    │                                                 │
│    Review Dashboard:                                │
│    ┌──────────────────────────────────────────┐     │
│    │ MSA_Acme_2024.pdf - Pending Review       │     │
│    │                                          │     │
│    │ ✅ 25 fields extracted with high conf    │     │
│    │ ⚠️  4 fields need review                 │     │
│    │                                          │     │
│    │ Low Confidence Fields:                   │     │
│    │                                          │     │
│    │ 1. Contact 2 Role: "AP/Billing" (75%)    │     │
│    │    ☐ Accept  ☑ Correct to: [Legal ▼]    │     │
│    │                                          │     │
│    │ 2. Holidays: "Federal holidays" (70%)    │     │
│    │    ☑ Accept  ☐ Correct to: [_______]     │     │
│    │                                          │     │
│    │ 3. Training: "HIPAA" (65%)               │     │
│    │    ☑ Accept  ☐ Correct to: [_______]     │     │
│    │    ☑ Add: "PCI", "FERPA"                 │     │
│    │                                          │     │
│    │ 4. Dispute Window: "30 days" (72%)       │     │
│    │    ☑ Accept  ☐ Correct to: [_______]     │     │
│    │                                          │     │
│    │ Notes: [Verified all fields with legal] │     │
│    │                                          │     │
│    │        [Reject] [Approve & Apply]        │     │
│    └──────────────────────────────────────────┘     │
│                                                      │
│    HR clicks "Approve & Apply"                      │
│                                                      │
├─── APPLICATION ──────────────────────────────────────┤
│    │                                                 │
│    Applying extracted data to client record:        │
│    │                                                 │
│    ├─ Update Contact 2:                             │
│    │  └─ Role: "AP/Billing" → "Legal" (corrected)   │
│    │                                                 │
│    ├─ Add Commercial Terms:                         │
│    │  ├─ Payment Terms: "Net 30"                    │
│    │  ├─ Rate Card: "$150/hr"                       │
│    │  ├─ Billing Cycle: "Weekly"                    │
│    │  └─ Overtime: "1.5x after 40hrs"               │
│    │                                                 │
│    ├─ Add Compliance Requirements:                  │
│    │  ├─ Background Check: Required                 │
│    │  ├─ Drug Test: Required                        │
│    │  ├─ Insurance GL: $1M                          │
│    │  ├─ Insurance PL: $2M                          │
│    │  └─ Training: HIPAA, PCI, FERPA (corrected)    │
│    │                                                 │
│    ├─ Update VMS Portal:                            │
│    │  ├─ Type: "Fieldglass"                         │
│    │  └─ URL: "https://..."                         │
│    │                                                 │
│    └─ Update Operational:                           │
│       ├─ Invoice Route: "Email to AP"               │
│       └─ Dispute Window: "30 days"                  │
│                                                      │
│    Mark extraction as approved:                     │
│    ├─ Reviewed by: "admin@company.com"              │
│    ├─ Reviewed at: "2024-10-29T10:30:00Z"           │
│    ├─ Notes: "Verified all fields with legal"       │
│    └─ Approved: true                                │
│                                                      │
└─── RESULT ──────────────────────────────────────────┘
     │
     ✅ Client record enriched with MSA data
     ✅ 25+ fields auto-populated
     ✅ 4 fields human-verified
     ✅ Ready for engagement/PO creation
     
     Time saved: ~30 minutes of manual data entry
     Accuracy: 96% (25/29 fields correct)
     
     Client Record Updated:
     ┌──────────────────────────────────────┐
     │ Acme Corp                            │
     │                                      │
     │ ✅ Contacts: 2 (from MSA)            │
     │ ✅ Payment Terms: Net 30             │
     │ ✅ Billing: Weekly                   │
     │ ✅ VMS: Fieldglass                   │
     │ ✅ Compliance: BG, Drug, Insurance   │
     │ ✅ Training: HIPAA, PCI, FERPA       │
     │                                      │
     │ Status: Ready for engagement         │
     └──────────────────────────────────────┘
```

---

## Workflow 5: PO Expiry Warning System

```
BACKGROUND PROCESS: Daily check for expiring POs

START: Nightly cron job (12:00 AM)
│
├─── SCAN ALL CLIENTS ────────────────────────────────┐
│    │                                                 │
│    Get all clients with engagements                 │
│    │                                                 │
│    For each client:                                 │
│    └─ For each engagement:                          │
│       └─ For each PO:                               │
│          │                                           │
│          ├─ Check if Active                         │
│          ├─ Has end date?                           │
│          └─ Calculate days until expiry             │
│                                                      │
├─── EXAMPLE CLIENT: Acme Corp ───────────────────────┤
│    │                                                 │
│    Engagement: "2024 Q1 Consulting"                 │
│    │                                                 │
│    ├─ PO-2024-001:                                  │
│    │  ├─ Status: Active ✓                           │
│    │  ├─ End Date: 2024-11-15                       │
│    │  ├─ Today: 2024-10-29                          │
│    │  ├─ Days Until Expiry: 17 days                 │
│    │  ├─ Within 30 days? YES ⚠️                     │
│    │  └─ Set expiryWarning: true                    │
│    │     │                                           │
│    │     Action:                                    │
│    │     ├─ Flag PO with warning                    │
│    │     ├─ Mark client hasExpiringPOs: true        │
│    │     └─ Add to notification queue               │
│    │                                                 │
│    ├─ PO-2024-002:                                  │
│    │  ├─ Status: Active ✓                           │
│    │  ├─ End Date: 2025-03-31                       │
│    │  ├─ Days Until Expiry: 153 days                │
│    │  ├─ Within 30 days? NO ✓                       │
│    │  └─ No warning needed                          │
│    │                                                 │
│    └─ PO-2024-003:                                  │
│       ├─ Status: Fully Utilized                     │
│       ├─ Skip (not active)                          │
│       └─ No warning needed                          │
│                                                      │
├─── BUDGET WARNINGS ──────────────────────────────────┤
│    │                                                 │
│    PO-2024-001:                                     │
│    ├─ Total Amount: $100,000                        │
│    ├─ Spent Amount: $87,500                         │
│    ├─ Remaining: $12,500                            │
│    ├─ Utilization: 87.5%                            │
│    ├─ Over 80%? YES ⚠️                              │
│    └─ Set budgetWarning: true                       │
│        │                                             │
│        Action:                                      │
│        ├─ Flag PO with budget warning               │
│        └─ Add to notification queue                 │
│                                                      │
├─── NOTIFICATIONS ───────────────────────────────────┤
│    │                                                 │
│    Generate notifications for:                      │
│    │                                                 │
│    ├─ Email to Account Manager:                     │
│    │  │                                             │
│    │  ┌───────────────────────────────────┐         │
│    │  │ Subject: PO Expiring Soon - Acme  │         │
│    │  │                                   │         │
│    │  │ Dear Account Manager,             │         │
│    │  │                                   │         │
│    │  │ The following PO is expiring in   │         │
│    │  │ 17 days:                          │         │
│    │  │                                   │         │
│    │  │ PO-2024-001                       │         │
│    │  │ Client: Acme Corp                 │         │
│    │  │ End Date: 2024-11-15              │         │
│    │  │ Remaining: $12,500 (12.5%)        │         │
│    │  │                                   │         │
│    │  │ ⚠️ Budget Warning: 87.5% utilized │         │
│    │  │                                   │         │
│    │  │ Action Required:                  │         │
│    │  │ - Request extension PO, or        │         │
│    │  │ - Request incremental funding, or │         │
│    │  │ - Prepare for PO closure          │         │
│    │  │                                   │         │
│    │  │ [View in Portal]                  │         │
│    │  └───────────────────────────────────┘         │
│    │                                                 │
│    ├─ Dashboard Alert:                              │
│    │  │                                             │
│    │  Expiring POs Widget:                          │
│    │  ┌───────────────────────────────────┐         │
│    │  │ ⚠️ Expiring POs (3)               │         │
│    │  │                                   │         │
│    │  │ PO-2024-001 - Acme Corp           │         │
│    │  │ 17 days | 87% spent               │         │
│    │  │                                   │         │
│    │  │ PO-2024-007 - TechCo              │         │
│    │  │ 25 days | 45% spent               │         │
│    │  │                                   │         │
│    │  │ PO-2024-012 - GlobalInc           │         │
│    │  │ 8 days | 92% spent ⚠️              │         │
│    │  │                                   │         │
│    │  │ [View All Expiring POs]           │         │
│    │  └───────────────────────────────────┘         │
│    │                                                 │
│    └─ In-App Notification:                          │
│       │                                             │
│       🔔 New notification                           │
│       ├─ PO-2024-001 expiring in 17 days            │
│       └─ Click to view details                      │
│                                                      │
├─── TABLE INDICATORS ────────────────────────────────┤
│    │                                                 │
│    Client Table Updated:                            │
│    ┌──────────┬─────┬────────┬─────────┐            │
│    │ Company  │ ... │ Status │ Actions │            │
│    ├──────────┼─────┼────────┼─────────┤            │
│    │ Acme     │ ... │ Active │ [Edit]  │            │
│    │ Corp     │     │  ⚠️     │         │            │
│    │          │     │        │         │            │
│    │ TechCo   │ ... │ Active │ [Edit]  │            │
│    │          │     │  ⚠️     │         │            │
│    └──────────┴─────┴────────┴─────────┘            │
│                                                      │
│    Hover over ⚠️ shows:                             │
│    "1 PO expiring within 30 days"                   │
│                                                      │
└─── END ─────────────────────────────────────────────┘
     │
     ✅ All POs checked
     ✅ Warnings flagged
     ✅ Notifications sent
     ✅ Dashboard updated
     ✅ Table indicators refreshed
     
     Next run: Tomorrow 12:00 AM
```

---

## Visual Summary: Complete System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LIFECYCLE                        │
└─────────────────────────────────────────────────────────────┘

1. CREATE CLIENT
   │
   ├─ Basic Info → Contacts → Settings
   ├─ Validation
   ├─ Save to DB
   └─ ✅ Client Created
   
2. CHECK EXISTING (Before adding consultant)
   │
   ├─ Query by Tax ID
   ├─ Found? → Skip MSA
   └─ Not found? → Full onboarding

3. ADD ENGAGEMENT
   │
   ├─ Engagement details
   ├─ Link MSA/SOW
   └─ ✅ Engagement Active

4. ADD PURCHASE ORDERS
   │
   ├─ Initial PO
   ├─ Parallel POs (multiple roles)
   ├─ Extension POs (timeline)
   └─ Incremental Funding POs

5. UPLOAD DOCUMENTS
   │
   ├─ Upload file
   ├─ AI extraction
   ├─ Human review
   └─ ✅ Data applied

6. MONITOR & MAINTAIN
   │
   ├─ Daily expiry checks
   ├─ Budget warnings
   ├─ Compliance monitoring
   └─ ✅ Proactive alerts

┌─────────────────────────────────────────────────────────────┐
│                  DATA FLOW OVERVIEW                          │
└─────────────────────────────────────────────────────────────┘

UI Layer (React)
    ↓
Component: ClientManagementAdvanced
    ↓
API Calls: /clients/advanced/*
    ↓
Backend: Hono Server
    ↓
Validation & Business Logic
    ↓
Database: Supabase KV Store
    ↓
Storage: client:advanced:{id}
```

---

**These workflows ensure comprehensive client management with automation, validation, and proactive monitoring!** 🚀
