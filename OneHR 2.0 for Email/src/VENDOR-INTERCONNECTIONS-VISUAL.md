# Vendor & Contractor Interconnections - Visual Guide

## 🎯 Complete System Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HR PORTAL ECOSYSTEM                             │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────┐          ┌───────────────────┐
│     VENDORS       │◄────────►│    SUBVENDORS     │
│                   │  parent  │    (Tier 1-3)     │
│ • Legal Name      │  child   │                   │
│ • Tax ID          │          │ • Parent Link     │
│ • Type            │          │ • Tier Level      │
│ • Status          │          │                   │
└─────────┬─────────┘          └─────────┬─────────┘
          │                              │
          │                              │
          │ supplies       supplies      │
          └──────────┬───────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  CONTRACTORS   │
            │                │
            │ • Independent  │
            │ • W2/1099/C2C  │
            │ • Skills       │
            │ • Bill/Pay Rate│
            └────────┬───────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ CLIENTS │ │PROJECTS │ │EMPLOYEES│
    └─────────┘ └─────────┘ └─────────┘
```

---

## 📊 Relationship Matrix

### 1:N Relationships (One-to-Many)

| Parent Entity | → | Child Entities | Relationship Type |
|--------------|---|----------------|------------------|
| Vendor | → | Subvendors | 1 vendor → many subvendors |
| Vendor | → | Contractors | 1 vendor → many contractors |
| Subvendor | → | Contractors | 1 subvendor → many contractors |
| Client | → | Contractor Assignments | 1 client → many assignments |
| Project | → | Team Members | 1 project → many members |
| Contractor | → | Assignments | 1 contractor → many assignments |

### N:M Relationships (Many-to-Many)

| Entity A | ↔ | Entity B | Join Through |
|----------|---|----------|-------------|
| Contractors | ↔ | Clients | ContractorAssignment |
| Contractors | ↔ | Projects | ContractorAssignment |
| Projects | ↔ | Employees | ProjectAssignment |
| Projects | ↔ | Contractors | ContractorAssignment |

---

## 🔗 Connection Examples

### Example 1: Vendor Hierarchy

```
Tech Staffing Global (Parent Vendor)
├── Tax ID: 12-3456789
├── Type: Staffing Agency
├── Status: Active
├── Total Contractors: 45
│
├─── West Coast Branch (Subvendor - Tier 1)
│    ├── Tax ID: 98-7654321
│    ├── Parent: Tech Staffing Global
│    ├── Contractors: 20
│    │   ├─ John Doe (W2, Senior Dev, $150/hr)
│    │   ├─ Jane Smith (1099, Architect, $175/hr)
│    │   └─ ... (18 more)
│    │
│    └─── Regional Partners (Subvendor - Tier 2)
│         ├── Parent: West Coast Branch
│         └── Contractors: 5
│
└─── East Coast Branch (Subvendor - Tier 1)
     ├── Tax ID: 45-9876543
     ├── Parent: Tech Staffing Global
     └── Contractors: 20
```

---

### Example 2: Contractor Journey

```
CONTRACTOR: John Doe
├── Personal Info
│   ├─ Email: john.doe@example.com
│   ├─ Phone: (555) 123-4567
│   └─ Location: San Francisco, CA
│
├── Vendor Relationship
│   ├─ isIndependent: false
│   ├─ Vendor: Tech Staffing Global
│   └─ Subvendor: West Coast Branch
│
├── Professional Profile
│   ├─ Job Title: Senior Software Engineer
│   ├─ Type: W2
│   ├─ Skills: React, Node.js, AWS, Python
│   ├─ Experience: 8 years
│   └─ Work Auth: H1B (expires: 2025-12-31)
│
├── Financial
│   ├─ Bill Rate: $150/hr
│   ├─ Pay Rate: $100/hr
│   ├─ Markup: 50% ($50/hr)
│   └─ Est. Monthly Revenue: $8,000
│
├── Current Assignments (2)
│   │
│   ├─ Assignment 1
│   │  ├─ Client: Acme Corp
│   │  ├─ Project: Website Redesign
│   │  ├─ Role: Lead Developer
│   │  ├─ Allocation: 75%
│   │  ├─ Hours/Week: 30
│   │  ├─ Start: 2024-01-01
│   │  └─ Status: Active
│   │
│   └─ Assignment 2
│      ├─ Client: TechCo Inc
│      ├─ Project: Mobile App
│      ├─ Role: Senior Developer
│      ├─ Allocation: 25%
│      ├─ Hours/Week: 10
│      ├─ Start: 2024-03-15
│      └─ Status: Active
│
└── Status
    ├─ Overall: On Assignment
    ├─ Active Clients: 2
    ├─ Active Projects: 2
    └─ Availability: None (fully allocated)
```

---

### Example 3: Project Team Composition

```
PROJECT: Cloud Migration Initiative
CLIENT: Acme Corp
DURATION: 2024-01-01 to 2024-06-30
BUDGET: $500,000

TEAM ROSTER:
┌─────────────────────────────────────────────────────────────┐
│ INTERNAL EMPLOYEES (3)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Sarah Johnson - Project Manager                         │
│    ├─ Type: Employee                                        │
│    ├─ Allocation: 100%                                      │
│    ├─ Hours/Week: 40                                        │
│    └─ Cost: Salary (internal)                               │
│                                                             │
│ 2. Michael Chen - DevOps Lead                              │
│    ├─ Type: Employee                                        │
│    ├─ Allocation: 100%                                      │
│    ├─ Hours/Week: 40                                        │
│    └─ Cost: Salary (internal)                               │
│                                                             │
│ 3. Emily Rodriguez - QA Manager                            │
│    ├─ Type: Employee                                        │
│    ├─ Allocation: 50%                                       │
│    ├─ Hours/Week: 20                                        │
│    └─ Cost: Salary (internal)                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ VENDOR CONTRACTORS (2)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 4. John Doe - Senior Software Engineer                     │
│    ├─ Type: Contractor (W2)                                 │
│    ├─ Vendor: Tech Staffing Global                          │
│    ├─ Subvendor: West Coast Branch                          │
│    ├─ Allocation: 75%                                       │
│    ├─ Hours/Week: 30                                        │
│    ├─ Bill Rate: $150/hr                                    │
│    ├─ Monthly Cost: $18,000                                 │
│    └─ Invoice To: Tech Staffing Global                      │
│                                                             │
│ 5. Alice Williams - Cloud Architect                        │
│    ├─ Type: Contractor (1099)                               │
│    ├─ Vendor: Cloud Solutions Inc                           │
│    ├─ Subvendor: None                                       │
│    ├─ Allocation: 100%                                      │
│    ├─ Hours/Week: 40                                        │
│    ├─ Bill Rate: $175/hr                                    │
│    ├─ Monthly Cost: $28,000                                 │
│    └─ Invoice To: Cloud Solutions Inc                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ INDEPENDENT CONTRACTORS (1)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 6. Bob Thompson - Security Consultant                      │
│    ├─ Type: Independent Contractor (Corp-to-Corp)           │
│    ├─ Vendor: None (Independent)                            │
│    ├─ Allocation: 50%                                       │
│    ├─ Hours/Week: 20                                        │
│    ├─ Bill Rate: $200/hr                                    │
│    ├─ Monthly Cost: $16,000                                 │
│    └─ Invoice To: Bob Thompson Consulting LLC               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

COST BREAKDOWN:
┌─────────────────────────────────────────────────────────────┐
│ Internal Employees                                          │
│   3 FTE @ avg $120k/yr = $30,000/month                      │
│                                                             │
│ Vendor Contractors                                          │
│   John Doe:    $18,000/month (Tech Staffing)                │
│   Alice:       $28,000/month (Cloud Solutions)              │
│   Subtotal:    $46,000/month                                │
│                                                             │
│ Independent Contractors                                     │
│   Bob:         $16,000/month                                │
│                                                             │
│ TOTAL PROJECT COST: $92,000/month                           │
│ 6-month estimate: $552,000                                  │
│                                                             │
│ BILLING STRUCTURE:                                          │
│   - Employees: Internal payroll                             │
│   - Vendor invoices: 2 separate (monthly)                   │
│   - Independent invoice: 1 (monthly)                        │
│   Total invoices: 3/month                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### Example 4: Multi-Client Contractor

```
CONTRACTOR: Jane Smith
STATUS: On Assignment
UTILIZATION: 150% (over-allocated)

┌─────────────────────────────────────────────────────────────┐
│ ACTIVE ASSIGNMENTS (3)                                      │
└─────────────────────────────────────────────────────────────┘

Assignment 1: PRIMARY
├─ Client: Acme Corp
├─ Project: Website Redesign
├─ Role: Lead Frontend Developer
├─ Allocation: 75%
├─ Hours/Week: 30
├─ Rate: $160/hr
├─ Start Date: 2024-01-01
├─ End Date: 2024-06-30
└─ Monthly Bill: $19,200

Assignment 2: SECONDARY
├─ Client: TechCo Inc
├─ Project: Mobile App Development
├─ Role: React Native Consultant
├─ Allocation: 50%
├─ Hours/Week: 20
├─ Rate: $150/hr
├─ Start Date: 2024-02-15
├─ End Date: 2024-05-15
└─ Monthly Bill: $12,000

Assignment 3: ADVISORY
├─ Client: StartupXYZ
├─ Project: Technical Advisory
├─ Role: Technical Advisor
├─ Allocation: 25%
├─ Hours/Week: 10
├─ Rate: $175/hr
├─ Start Date: 2024-03-01
├─ End Date: Ongoing
└─ Monthly Bill: $7,000

TOTALS:
├─ Total Allocation: 150% (over-allocated!)
├─ Total Hours/Week: 60 (exceeds 40hr standard)
├─ Total Monthly Revenue: $38,200
├─ Active Clients: 3
├─ Active Projects: 3
└─ ⚠️ WARNING: Over-allocated - review schedule
```

---

## 🔄 Data Flow Diagrams

### Flow 1: Vendor Supplies Contractor to Client

```
┌──────────┐
│  VENDOR  │
│          │
│ Tech     │
│ Staffing │
└────┬─────┘
     │
     │ employs
     ▼
┌──────────┐       assigned to      ┌──────────┐
│CONTRACTOR│───────────────────────►│  CLIENT  │
│          │                        │          │
│ John Doe │                        │ Acme Corp│
└────┬─────┘                        └────┬─────┘
     │                                   │
     │ works on                    has  │
     ▼                                   ▼
┌──────────┐◄───────────────────────┌──────────┐
│ PROJECT  │     belongs to         │  PO      │
│          │                        │          │
│ Website  │                        │PO-2024-01│
│ Redesign │                        │ $100,000 │
└──────────┘                        └──────────┘

INVOICE FLOW:
Acme Corp pays Tech Staffing $150/hr
Tech Staffing pays John Doe $100/hr
Tech Staffing keeps $50/hr margin
```

---

### Flow 2: Independent Contractor Direct Assignment

```
┌──────────────┐
│ INDEPENDENT  │
│  CONTRACTOR  │
│              │
│ Bob Thompson │
└──────┬───────┘
       │
       │ no vendor
       │ direct contract
       │
       ▼
┌──────────┐       assigned to      ┌──────────┐
│          │───────────────────────►│  CLIENT  │
│          │                        │          │
│          │                        │ Acme Corp│
└────┬─────┘                        └────┬─────┘
     │                                   │
     │ works on                    has  │
     ▼                                   ▼
┌──────────┐◄───────────────────────┌──────────┐
│ PROJECT  │     funded by          │  PO      │
│          │                        │          │
│ Security │                        │PO-2024-02│
│  Audit   │                        │ $50,000  │
└──────────┘                        └──────────┘

INVOICE FLOW:
Acme Corp pays Bob Thompson directly $200/hr
No middleman, no markup
Bob invoices through his LLC
```

---

### Flow 3: Subvendor Chain

```
┌────────────────┐
│ PARENT VENDOR  │
│                │
│ Global Staff   │
└───────┬────────┘
        │
        │ owns
        ▼
┌────────────────┐
│   SUBVENDOR    │
│                │
│  West Branch   │
└───────┬────────┘
        │
        │ employs
        ▼
┌────────────────┐        ┌────────────────┐
│  CONTRACTOR    │───────►│    CLIENT      │
│                │assigns │                │
│   Jane Smith   │        │   Acme Corp    │
└───────┬────────┘        └────────────────┘
        │
        │ works on
        ▼
┌────────────────┐
│    PROJECT     │
│                │
│ Mobile App Dev │
└────────────────┘

INVOICE CHAIN:
Acme Corp → Parent Vendor: $175/hr
Parent Vendor → Subvendor: $150/hr (margin: $25)
Subvendor → Contractor: $110/hr (margin: $40)
Total margins: $65/hr
```

---

## 📈 Status Transitions

### Contractor Status Flow

```
┌─────────────┐
│  AVAILABLE  │  ← Initial state
└──────┬──────┘
       │
       │ assigned to project
       ▼
┌─────────────┐
│   ACTIVE    │
└──────┬──────┘
       │
       │ starts work
       ▼
┌─────────────┐
│    ON       │
│ ASSIGNMENT  │  ← Working on project(s)
└──────┬──────┘
       │
       ├─────► Project completes ───┐
       │                            │
       │                            ▼
       │                      ┌─────────────┐
       │                      │  AVAILABLE  │ ← Ready for new work
       │                      └─────────────┘
       │
       ├─────► Leave/Break ───┐
       │                       │
       │                       ▼
       │                 ┌─────────────┐
       │                 │  INACTIVE   │ ← Temporarily unavailable
       │                 └─────────────┘
       │
       ├─────► Contract ends ───┐
       │                         │
       │                         ▼
       │                   ┌─────────────┐
       │                   │ TERMINATED  │ ← No longer working
       │                   └─────────────┘
       │
       └─────► Issues ───────┐
                             │
                             ▼
                       ┌─────────────┐
                       │ BLACKLISTED │ ← Not eligible for rehire
                       └─────────────┘
```

---

## 🎯 Search & Filter Scenarios

### Scenario 1: Find Available Senior Developers

**Filters Applied:**
```
Status: Available
Job Title: Contains "Senior"
Skills: Includes "React"
Vendor: Any
Years Experience: >= 5
Bill Rate: <= $175/hr
Work Auth: US Citizen OR Green Card
```

**Results:**
```
3 contractors found:

1. John Doe
   - Senior Software Engineer
   - Skills: React, Node.js, AWS
   - Independent
   - $150/hr
   - Available immediately

2. Alice Williams  
   - Senior Full Stack Developer
   - Skills: React, Python, Docker
   - Vendor: Tech Staffing Global
   - $160/hr
   - Available in 2 weeks

3. Mike Johnson
   - Senior Frontend Developer
   - Skills: React, TypeScript, Vue
   - Vendor: Cloud Solutions
   - $170/hr
   - Available immediately
```

---

### Scenario 2: Find All Contractors from Specific Vendor

**Filters Applied:**
```
Vendor: Tech Staffing Global
Include Subvendors: Yes
Status: All
```

**Results:**
```
Tech Staffing Global (15 contractors)
├── Direct: 8 contractors
│   ├─ John Doe ($150/hr)
│   ├─ Jane Smith ($160/hr)
│   └─ ... 6 more
│
└── Via Subvendors: 7 contractors
    ├─ West Coast Branch: 5 contractors
    │  ├─ Bob Wilson ($140/hr)
    │  └─ ... 4 more
    │
    └─ East Coast Branch: 2 contractors
       ├─ Sarah Lee ($155/hr)
       └─ Tom Brown ($145/hr)
```

---

## 💰 Financial Tracking

### Revenue per Contractor

```
CONTRACTOR: John Doe
PERIOD: January 2024

┌─────────────────────────────────────────────────────────────┐
│ CLIENT BILLING                                              │
├─────────────────────────────────────────────────────────────┤
│ Acme Corp                                                   │
│   Hours: 120 hrs @ $150/hr                                  │
│   Total: $18,000                                            │
│                                                             │
│ TechCo Inc                                                  │
│   Hours: 40 hrs @ $150/hr                                   │
│   Total: $6,000                                             │
│                                                             │
│ GROSS REVENUE: $24,000                                      │
├─────────────────────────────────────────────────────────────┤
│ CONTRACTOR PAYMENT                                          │
├─────────────────────────────────────────────────────────────┤
│ Pay Rate: $100/hr                                           │
│ Hours: 160 hrs                                              │
│ Total: $16,000                                              │
├─────────────────────────────────────────────────────────────┤
│ NET MARGIN                                                  │
├─────────────────────────────────────────────────────────────┤
│ Revenue: $24,000                                            │
│ Cost: $16,000                                               │
│ Margin: $8,000 (33.3%)                                      │
│                                                             │
│ Vendor Share:                                               │
│   Tech Staffing: $8,000                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Summary

**The vendor, subvendor, and contractor system provides:**

1. ✅ **Hierarchical Vendor Management**
   - Parent vendors
   - Multi-tier subvendors
   - Consolidated reporting

2. ✅ **Flexible Contractor Tracking**
   - Independent contractors
   - Vendor-supplied contractors
   - Subvendor-supplied contractors

3. ✅ **Multi-Client Assignments**
   - Parallel project work
   - Different rates per client
   - Utilization tracking

4. ✅ **Mixed Workforce Projects**
   - Employees + contractors
   - Unified team view
   - Separate billing streams

5. ✅ **Financial Transparency**
   - Bill rate vs pay rate
   - Markup calculation
   - Revenue tracking
   - Cost analysis

6. ✅ **Complete Interconnections**
   - Vendors ↔ Contractors
   - Contractors ↔ Clients
   - Contractors ↔ Projects
   - Projects ↔ Mixed Teams

---

**Navigate to experience the complete system:**
- **Vendors:** Sidebar → Core Modules → Vendors
- **Subvendors:** Sidebar → Core Modules → Subvendors
- **Contractors:** Sidebar → Core Modules → Contractors
- **Projects:** Sidebar → Core Modules → Projects
