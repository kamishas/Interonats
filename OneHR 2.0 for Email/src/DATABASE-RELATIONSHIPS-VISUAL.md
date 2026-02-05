# Database Relationship Visualization
## System Architecture & Data Flow

---

## 🏗️ High-Level System Architecture

```mermaid
graph TB
    subgraph "Multi-Tenant Layer"
        ORG[ORGANIZATIONS<br/>Tenant Isolation]
    end
    
    subgraph "User & Access Control"
        USERS[USERS<br/>8 Role Types]
        AUDIT[AUDIT_TRAILS<br/>Activity Logging]
    end
    
    subgraph "Employee Lifecycle"
        EMP[EMPLOYEES<br/>Core Records]
        ONBOARD[APPROVAL_WORKFLOWS<br/>Onboarding Process]
        OFFBOARD[Offboarding Data]
    end
    
    subgraph "Client & Project Management"
        CLI[CLIENTS<br/>Customer Orgs]
        PROJ[PROJECTS<br/>Engagements]
        EMPCLI[EMPLOYEE_CLIENTS<br/>Assignments & Rates]
        PROJASSIGN[PROJECT_ASSIGNMENTS<br/>Allocations]
    end
    
    subgraph "Vendor Ecosystem"
        VEN[VENDORS<br/>Primary Vendors]
        SUB[SUBVENDORS<br/>Sub-tier]
        CON[CONTRACTORS<br/>Individuals]
    end
    
    subgraph "Compliance & Immigration"
        IMM[IMMIGRATION_CASES<br/>Visa Tracking]
        IMMDEP[IMMIGRATION_DEPENDENTS]
        IMMCOST[IMMIGRATION_COSTS]
        IMMFILE[IMMIGRATION_FILINGS]
        LIC[BUSINESS_LICENSES<br/>4 Types]
        CERT[CERTIFICATIONS<br/>Employee Certs]
    end
    
    subgraph "Document Management"
        DOC[DOCUMENTS<br/>File Storage]
    end
    
    subgraph "Time & Billing"
        TIME[TIMESHEETS<br/>Time Entry]
        INV[INVOICES<br/>Client Billing]
        INVITEM[INVOICE_ITEMS]
        EXP[EXPENSES<br/>Reimbursements]
    end
    
    subgraph "HR Management"
        LEAVE[LEAVE_REQUESTS<br/>PTO Tracking]
        PERF[PERFORMANCE_REVIEWS<br/>Evaluations]
    end
    
    subgraph "System Services"
        NOTIF[NOTIFICATIONS<br/>Alerts & Reminders]
        SUB_SYS[SUBSCRIPTIONS<br/>Billing]
        PLANS[SUBSCRIPTION_PLANS<br/>Tiers]
        INTEG[EXTERNAL_INTEGRATIONS<br/>3rd Party APIs]
    end
    
    %% Organization Relationships
    ORG --> USERS
    ORG --> EMP
    ORG --> CLI
    ORG --> VEN
    ORG --> LIC
    ORG --> SUB_SYS
    ORG --> AUDIT
    
    %% User Relationships
    USERS --> EMP
    USERS --> NOTIF
    USERS --> AUDIT
    
    %% Employee Relationships
    EMP --> EMPCLI
    EMP --> PROJASSIGN
    EMP --> IMM
    EMP --> CERT
    EMP --> DOC
    EMP --> TIME
    EMP --> LEAVE
    EMP --> PERF
    EMP --> EXP
    EMP --> ONBOARD
    
    %% Client Relationships
    CLI --> EMPCLI
    CLI --> PROJ
    CLI --> INV
    
    %% Project Relationships
    PROJ --> PROJASSIGN
    PROJ --> TIME
    
    %% Immigration Relationships
    IMM --> IMMDEP
    IMM --> IMMCOST
    IMM --> IMMFILE
    IMM --> DOC
    
    %% Vendor Relationships
    VEN --> SUB
    VEN --> CON
    
    %% Billing Relationships
    TIME --> INV
    INV --> INVITEM
    
    %% Subscription Relationships
    SUB_SYS --> PLANS
    
    style ORG fill:#e1f5ff
    style USERS fill:#fff4e6
    style EMP fill:#e8f5e9
    style CLI fill:#f3e5f5
    style IMM fill:#fce4ec
    style TIME fill:#fff9c4
    style SUB_SYS fill:#e0f2f1
```

---

## 🔄 Data Flow by Business Process

### **1. Employee Onboarding Flow**

```mermaid
sequenceDiagram
    participant Recruiter
    participant System
    participant Employee
    participant HR
    participant Manager
    
    Recruiter->>System: Create Employee Record
    System->>System: Create APPROVAL_WORKFLOW
    System->>System: Stage 1: Personal Info
    System->>System: Stage 2: Emergency Contact
    System->>Employee: Send Welcome Email
    Employee->>System: Complete Profile
    System->>System: Stage 3: Document Collection
    Employee->>System: Upload Documents (I9, W4, etc)
    System->>HR: Request Document Review
    HR->>System: Approve Documents
    System->>System: Stage 4: Immigration (if applicable)
    HR->>System: Create Immigration Case
    System->>System: Stage 5: System Access
    System->>Manager: Assign to Projects
    Manager->>System: Create PROJECT_ASSIGNMENTS
    System->>System: Stage 6: Benefits Enrollment
    System->>System: Stage 7: Compliance Training
    System->>Employee: Grant Timesheet Access
    System->>System: Set EMPLOYEE.status = 'active'
```

### **2. Immigration Case Management Flow**

```mermaid
sequenceDiagram
    participant HR
    participant System
    participant Attorney
    participant Employee
    participant USCIS
    
    HR->>System: Create IMMIGRATION_CASE
    System->>System: Auto-prompt for EAD dates (if applicable)
    HR->>System: Add IMMIGRATION_DEPENDENTS
    HR->>System: Record IMMIGRATION_COSTS
    System->>Attorney: Notify (if assigned)
    Attorney->>System: Create IMMIGRATION_FILINGS
    System->>System: Track filing receipts
    Attorney->>System: Update status (RFE, Approved, etc)
    System->>Employee: Send notification
    System->>System: Create expiry reminder
    System->>NOTIF: 90/60/30 day alerts
```

### **3. Timesheet to Invoice Flow**

```mermaid
sequenceDiagram
    participant Employee
    participant System
    participant Manager
    participant HR
    participant Billing
    participant Client
    
    Employee->>System: Create TIMESHEET (status=draft)
    Employee->>System: Submit (status=submitted)
    System->>Manager: Notify for approval
    Manager->>System: Approve (status=approved)
    System->>HR: Request final approval
    HR->>System: Approve (status=approved)
    System->>Billing: Ready for invoicing
    Billing->>System: Create INVOICE
    System->>System: Create INVOICE_ITEMS from TIMESHEETS
    System->>System: Update TIMESHEET.status = 'invoiced'
    Billing->>Client: Send INVOICE
    Client->>System: Payment received
    System->>System: Update INVOICE.status = 'paid'
```

### **4. Multi-Client Assignment Flow**

```mermaid
sequenceDiagram
    participant Recruiter
    participant System
    participant Employee
    participant Client1
    participant Client2
    
    Recruiter->>System: Assign Employee to Client1
    System->>System: Create EMPLOYEE_CLIENTS (billing_rate=$100/hr)
    System->>System: Set allocation_percentage=60%
    Recruiter->>System: Assign same Employee to Client2
    System->>System: Create another EMPLOYEE_CLIENTS (billing_rate=$120/hr)
    System->>System: Set allocation_percentage=40%
    System->>System: Validate total allocation ≤ 100%
    Employee->>System: Submit timesheet for Client1
    System->>System: Use $100/hr billing_rate
    Employee->>System: Submit timesheet for Client2
    System->>System: Use $120/hr billing_rate
```

---

## 📊 Entity Relationship by Module

### **Employee Management Module**

```mermaid
erDiagram
    EMPLOYEES ||--o{ EMPLOYEE_CLIENTS : "assigned"
    EMPLOYEES ||--o{ PROJECT_ASSIGNMENTS : "works_on"
    EMPLOYEES ||--o{ DOCUMENTS : "uploads"
    EMPLOYEES ||--o{ TIMESHEETS : "submits"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "requests"
    EMPLOYEES ||--o{ EXPENSES : "incurs"
    EMPLOYEES ||--o{ PERFORMANCE_REVIEWS : "receives"
    EMPLOYEES ||--o{ CERTIFICATIONS : "earns"
    EMPLOYEES ||--o{ IMMIGRATION_CASES : "has"
    EMPLOYEES }|--|| USERS : "can_be"
    EMPLOYEES }o--|| EMPLOYEES : "reports_to"
```

### **Client Management Module**

```mermaid
erDiagram
    CLIENTS ||--o{ EMPLOYEE_CLIENTS : "employs"
    CLIENTS ||--o{ PROJECTS : "owns"
    CLIENTS ||--o{ INVOICES : "receives"
    CLIENTS ||--o{ VENDOR_CLIENTS : "contracts"
    CLIENTS }o--|| ORGANIZATIONS : "belongs_to"
```

### **Immigration Module**

```mermaid
erDiagram
    IMMIGRATION_CASES ||--o{ IMMIGRATION_DEPENDENTS : "includes"
    IMMIGRATION_CASES ||--o{ IMMIGRATION_COSTS : "incurs"
    IMMIGRATION_CASES ||--o{ IMMIGRATION_FILINGS : "contains"
    IMMIGRATION_CASES ||--o{ DOCUMENTS : "requires"
    IMMIGRATION_CASES }o--|| EMPLOYEES : "belongs_to"
    IMMIGRATION_CASES }o--|| ORGANIZATIONS : "managed_by"
```

### **Vendor Module**

```mermaid
erDiagram
    VENDORS ||--o{ SUBVENDORS : "manages"
    VENDORS ||--o{ CONTRACTORS : "employs"
    VENDORS ||--o{ VENDOR_CLIENTS : "serves"
    VENDORS }o--|| ORGANIZATIONS : "works_with"
    VENDOR_CLIENTS }o--|| CLIENTS : "for"
```

### **Billing Module**

```mermaid
erDiagram
    TIMESHEETS }o--|| EMPLOYEES : "submitted_by"
    TIMESHEETS }o--|| PROJECTS : "for"
    TIMESHEETS }o--|| CLIENTS : "billed_to"
    INVOICES ||--o{ INVOICE_ITEMS : "contains"
    INVOICES }o--|| CLIENTS : "sent_to"
    INVOICE_ITEMS }o--o| TIMESHEETS : "from"
```

---

## 🎯 Key Database Indexes

### **Primary Indexes (UUID PKs)**
All entities have UUID primary keys for distributed scalability

### **Foreign Key Indexes**
```sql
-- Organization-level (for tenant isolation)
CREATE INDEX idx_employees_org ON EMPLOYEES(organization_id);
CREATE INDEX idx_clients_org ON CLIENTS(organization_id);
CREATE INDEX idx_users_org ON USERS(organization_id);

-- Employee relationships
CREATE INDEX idx_timesheets_emp ON TIMESHEETS(employee_id);
CREATE INDEX idx_immigration_emp ON IMMIGRATION_CASES(employee_id);
CREATE INDEX idx_documents_emp ON DOCUMENTS(employee_id);

-- Client relationships
CREATE INDEX idx_projects_client ON PROJECTS(client_id);
CREATE INDEX idx_invoices_client ON INVOICES(client_id);

-- Status queries
CREATE INDEX idx_employees_status ON EMPLOYEES(status);
CREATE INDEX idx_timesheets_status ON TIMESHEETS(status);
CREATE INDEX idx_immigration_status ON IMMIGRATION_CASES(current_status);

-- Date-based queries
CREATE INDEX idx_timesheets_date ON TIMESHEETS(work_date);
CREATE INDEX idx_licenses_expiry ON BUSINESS_LICENSES(expiry_date);
CREATE INDEX idx_immigration_expiry ON IMMIGRATION_CASES(expiry_date);

-- Unique constraints
CREATE UNIQUE INDEX idx_employees_emp_id ON EMPLOYEES(employee_id);
CREATE UNIQUE INDEX idx_users_email ON USERS(email);
CREATE UNIQUE INDEX idx_immigration_case_num ON IMMIGRATION_CASES(case_number);
```

---

## 🔐 Row-Level Security (RLS)

### **Multi-Tenant Isolation**
```sql
-- All queries automatically filtered by organization_id
-- Users can only access data from their organization
-- Product Admins can view (not modify) all organizations

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON employees
  FOR ALL
  USING (
    organization_id = current_user_organization_id()
    OR 
    current_user_role() = 'product-admin'
  );
```

### **Role-Based Access**
```sql
-- Employees can only see their own data
CREATE POLICY employee_self_access ON timesheets
  FOR SELECT
  USING (
    employee_id = current_user_employee_id()
    OR
    current_user_role() IN ('admin', 'super_admin', 'hr', 'manager')
  );
```

---

## 📈 Data Volume Estimates

| Entity | Expected Records/Year | Growth Rate |
|--------|---------------------|-------------|
| TIMESHEETS | 500K - 1M | High |
| NOTIFICATIONS | 100K - 500K | High |
| AUDIT_TRAILS | 50K - 200K | Medium-High |
| DOCUMENTS | 10K - 50K | Medium |
| EMPLOYEES | 1K - 10K | Low-Medium |
| CLIENTS | 100 - 1K | Low |
| IMMIGRATION_CASES | 100 - 500 | Low |
| INVOICES | 1K - 5K | Medium |

---

## 🔄 Data Lifecycle

### **Active Data** (< 1 year)
- All current employee records
- Active timesheets
- Pending approvals
- Active subscriptions

### **Historical Data** (1-7 years)
- Terminated employees
- Closed projects
- Paid invoices
- Completed immigration cases

### **Archived Data** (> 7 years)
- Legal compliance retention
- Audit trail preservation
- Moved to cold storage

---

## 🚀 Performance Optimization

### **Denormalization Strategies**
1. **Employee.onboarding_progress** - Cached calculation
2. **Client total contract value** - Cached from projects
3. **Timesheet.total_amount** - Pre-calculated billing

### **Caching Layer**
1. **Subscription limits** - Redis cache
2. **User permissions** - Session cache
3. **Organization settings** - Application cache

### **Query Optimization**
1. **Materialized views** for dashboard metrics
2. **Partial indexes** on active records only
3. **Partitioning** for timesheets by month

---

This visualization shows how all 30+ entities interconnect to create a comprehensive workforce management platform with multi-tenant support, role-based access, and complex workflow orchestration.
