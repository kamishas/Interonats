# Entity-Relationship Diagram
## Comprehensive HR & Workforce Management Platform

This document contains the complete ER diagram for the application showing all entities, attributes, and relationships.

---

## 🎯 ER Diagram (Mermaid Format)

```mermaid
erDiagram
    %% ==========================================
    %% CORE ENTITIES
    %% ==========================================
    
    ORGANIZATIONS ||--o{ USERS : "has"
    ORGANIZATIONS ||--o{ EMPLOYEES : "employs"
    ORGANIZATIONS ||--o{ CLIENTS : "manages"
    ORGANIZATIONS ||--o{ VENDORS : "works_with"
    ORGANIZATIONS ||--o{ SUBSCRIPTIONS : "subscribes_to"
    ORGANIZATIONS ||--o{ BUSINESS_LICENSES : "holds"
    ORGANIZATIONS ||--o{ AUDIT_TRAILS : "tracks"
    
    ORGANIZATIONS {
        uuid id PK
        string name
        string industry
        string company_size
        string phone
        string address
        string city
        string state
        string zip
        string country
        string tax_id
        timestamp created_at
        timestamp updated_at
        string status "active|suspended|closed"
    }
    
    %% ==========================================
    %% USER MANAGEMENT
    %% ==========================================
    
    USERS ||--o{ EMPLOYEES : "can_be"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_TRAILS : "performs"
    USERS ||--o{ APPROVAL_WORKFLOWS : "approves"
    
    USERS {
        uuid id PK
        uuid organization_id FK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        string role "admin|super_admin|hr|recruiter|manager|employee|consultant|product-admin"
        boolean is_active
        timestamp last_login
        timestamp created_at
        timestamp updated_at
        json profile_data
    }
    
    %% ==========================================
    %% EMPLOYEE MANAGEMENT
    %% ==========================================
    
    EMPLOYEES ||--o{ EMPLOYEE_CLIENTS : "assigned_to"
    EMPLOYEES ||--o{ PROJECT_ASSIGNMENTS : "works_on"
    EMPLOYEES ||--o{ IMMIGRATION_CASES : "has"
    EMPLOYEES ||--o{ CERTIFICATIONS : "earns"
    EMPLOYEES ||--o{ DOCUMENTS : "uploads"
    EMPLOYEES ||--o{ TIMESHEETS : "submits"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "requests"
    EMPLOYEES ||--o{ PERFORMANCE_REVIEWS : "receives"
    EMPLOYEES ||--o{ EXPENSES : "incurs"
    
    EMPLOYEES {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK "nullable"
        string employee_id UK
        string first_name
        string last_name
        string email
        string phone
        string personal_email
        date date_of_birth
        string ssn_encrypted
        string address
        string city
        string state
        string zip
        string country
        string employment_type "full-time|part-time|contract|consultant"
        string classification "W2|1099|Corp-to-Corp"
        date hire_date
        date termination_date
        string status "active|inactive|onboarding|terminated"
        string department
        string job_title
        string manager_id FK
        decimal base_salary
        string work_authorization "US Citizen|Green Card|H1B|EAD|etc"
        boolean profile_completed
        int onboarding_progress
        timestamp created_at
        timestamp updated_at
        json emergency_contact
        json custom_fields
    }
    
    %% ==========================================
    %% CLIENT MANAGEMENT
    %% ==========================================
    
    CLIENTS ||--o{ EMPLOYEE_CLIENTS : "employs"
    CLIENTS ||--o{ PROJECTS : "owns"
    CLIENTS ||--o{ INVOICES : "receives"
    CLIENTS ||--o{ VENDOR_CLIENTS : "contracts_with"
    
    CLIENTS {
        uuid id PK
        uuid organization_id FK
        string client_id UK
        string client_name
        string industry
        string contact_person
        string contact_email
        string contact_phone
        string address
        string city
        string state
        string zip
        string country
        string tax_id
        string billing_address
        string payment_terms
        string status "active|inactive|pending"
        date contract_start
        date contract_end
        decimal contract_value
        string notes
        timestamp created_at
        timestamp updated_at
        json custom_fields
    }
    
    %% ==========================================
    %% EMPLOYEE-CLIENT RELATIONSHIP
    %% ==========================================
    
    EMPLOYEE_CLIENTS {
        uuid id PK
        uuid employee_id FK
        uuid client_id FK
        decimal billing_rate
        string billing_type "hourly|daily|monthly|project"
        decimal allocation_percentage
        date start_date
        date end_date
        string status "active|inactive|proposed"
        string role_at_client
        boolean is_primary
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% PROJECT MANAGEMENT
    %% ==========================================
    
    PROJECTS ||--o{ PROJECT_ASSIGNMENTS : "contains"
    PROJECTS ||--o{ TIMESHEETS : "tracks_time"
    PROJECTS ||--o{ INVOICES : "billed_for"
    
    PROJECTS {
        uuid id PK
        uuid client_id FK
        uuid organization_id FK
        string project_code UK
        string project_name
        string description
        date start_date
        date end_date
        string status "planning|active|on-hold|completed|cancelled"
        decimal budget
        string billing_type "T&M|Fixed|Retainer"
        string project_manager_id FK
        json milestones
        timestamp created_at
        timestamp updated_at
    }
    
    PROJECT_ASSIGNMENTS {
        uuid id PK
        uuid project_id FK
        uuid employee_id FK
        string role
        decimal billing_rate
        decimal allocation_percentage
        date start_date
        date end_date
        string status "active|inactive|proposed"
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% VENDOR MANAGEMENT
    %% ==========================================
    
    VENDORS ||--o{ SUBVENDORS : "manages"
    VENDORS ||--o{ CONTRACTORS : "employs"
    VENDORS ||--o{ VENDOR_CLIENTS : "works_for"
    
    VENDORS {
        uuid id PK
        uuid organization_id FK
        string vendor_id UK
        string vendor_name
        string vendor_type "staffing|consulting|contractor"
        string contact_person
        string contact_email
        string contact_phone
        string address
        string city
        string state
        string zip
        string tax_id
        string payment_terms
        string status "active|inactive|pending"
        decimal commission_rate
        timestamp created_at
        timestamp updated_at
    }
    
    SUBVENDORS {
        uuid id PK
        uuid vendor_id FK
        uuid organization_id FK
        string subvendor_name
        string contact_person
        string contact_email
        string contact_phone
        string status "active|inactive"
        decimal commission_rate
        timestamp created_at
        timestamp updated_at
    }
    
    CONTRACTORS {
        uuid id PK
        uuid vendor_id FK
        uuid organization_id FK
        string contractor_name
        string email
        string phone
        string specialization
        decimal hourly_rate
        string status "available|assigned|inactive"
        timestamp created_at
        timestamp updated_at
    }
    
    VENDOR_CLIENTS {
        uuid id PK
        uuid vendor_id FK
        uuid client_id FK
        date start_date
        date end_date
        string status "active|inactive"
        timestamp created_at
    }
    
    %% ==========================================
    %% IMMIGRATION MANAGEMENT
    %% ==========================================
    
    IMMIGRATION_CASES ||--o{ IMMIGRATION_DEPENDENTS : "includes"
    IMMIGRATION_CASES ||--o{ IMMIGRATION_COSTS : "incurs"
    IMMIGRATION_CASES ||--o{ IMMIGRATION_FILINGS : "contains"
    IMMIGRATION_CASES ||--o{ DOCUMENTS : "requires"
    
    IMMIGRATION_CASES {
        uuid id PK
        uuid employee_id FK
        uuid organization_id FK
        string case_number UK
        string visa_type "H1B|L1|O1|TN|E3|Green Card|EAD|etc"
        string current_status
        string case_type "New|Extension|Transfer|Amendment|Change of Status"
        date filing_date
        date approval_date
        date expiry_date
        date ead_begin_date
        date ead_end_date
        string priority "high|medium|low"
        uuid attorney_id FK
        string law_firm
        decimal total_cost
        string payment_responsibility "employer|employee|shared"
        string notes
        timestamp created_at
        timestamp updated_at
        json workflow_status
    }
    
    IMMIGRATION_DEPENDENTS {
        uuid id PK
        uuid case_id FK
        string first_name
        string last_name
        string relationship "spouse|child"
        date date_of_birth
        string passport_number
        string visa_type
        date visa_expiry
        timestamp created_at
        timestamp updated_at
    }
    
    IMMIGRATION_COSTS {
        uuid id PK
        uuid case_id FK
        string cost_type "attorney|filing|premium|medical|translation|other"
        decimal amount
        string paid_by "employer|employee"
        date payment_date
        string receipt_number
        string notes
        timestamp created_at
    }
    
    IMMIGRATION_FILINGS {
        uuid id PK
        uuid case_id FK
        string filing_type "I-129|I-140|I-485|I-765|I-131|etc"
        string receipt_number
        date filing_date
        date approval_date
        string status "pending|approved|denied|RFE"
        string notes
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% LICENSING & CERTIFICATIONS
    %% ==========================================
    
    BUSINESS_LICENSES {
        uuid id PK
        uuid organization_id FK
        string license_type "federal|state|local|industry"
        string license_name
        string license_number
        string issuing_authority
        string state "if applicable"
        string county "if applicable"
        string city "if applicable"
        date issue_date
        date expiry_date
        string status "active|expired|pending|suspended"
        decimal renewal_cost
        int reminder_days
        string reminder_frequency "30-60-90|60-90|90|custom"
        string document_path
        string notes
        timestamp created_at
        timestamp updated_at
    }
    
    CERTIFICATIONS {
        uuid id PK
        uuid employee_id FK
        string certification_name
        string certification_type "professional|technical|safety|compliance"
        string issuing_organization
        string certification_number
        date issue_date
        date expiry_date
        string status "active|expired|pending"
        boolean renewal_required
        int reminder_days
        string document_path
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% DOCUMENT MANAGEMENT
    %% ==========================================
    
    DOCUMENTS {
        uuid id PK
        uuid employee_id FK "nullable"
        uuid organization_id FK
        uuid immigration_case_id FK "nullable"
        string document_type
        string document_name
        string file_name
        string file_path
        string storage_bucket
        int file_size
        string mime_type
        string uploaded_by FK
        date upload_date
        date expiry_date
        string status "pending|approved|rejected|expired"
        string approval_status
        uuid approved_by FK "nullable"
        timestamp approved_at
        string rejection_reason
        boolean auto_requested
        string category
        json metadata
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% TIMESHEET & BILLING
    %% ==========================================
    
    TIMESHEETS {
        uuid id PK
        uuid employee_id FK
        uuid project_id FK
        uuid client_id FK
        uuid organization_id FK
        date work_date
        decimal hours_worked
        decimal overtime_hours
        string work_description
        string time_type "regular|overtime|holiday|sick|vacation"
        string status "draft|submitted|approved|rejected|invoiced"
        uuid submitted_by FK
        timestamp submitted_at
        uuid approved_by FK
        timestamp approved_at
        string rejection_reason
        decimal billing_rate
        decimal total_amount
        boolean billable
        string timesheet_period
        timestamp created_at
        timestamp updated_at
    }
    
    INVOICES ||--o{ INVOICE_ITEMS : "contains"
    
    INVOICES {
        uuid id PK
        uuid client_id FK
        uuid organization_id FK
        string invoice_number UK
        date invoice_date
        date due_date
        date payment_date
        string status "draft|sent|paid|overdue|cancelled"
        decimal subtotal
        decimal tax_amount
        decimal total_amount
        decimal amount_paid
        string payment_terms
        string payment_method
        string notes
        string billing_period_start
        string billing_period_end
        timestamp created_at
        timestamp updated_at
    }
    
    INVOICE_ITEMS {
        uuid id PK
        uuid invoice_id FK
        uuid timesheet_id FK "nullable"
        uuid project_id FK "nullable"
        string description
        decimal quantity
        decimal rate
        decimal amount
        timestamp created_at
    }
    
    EXPENSES {
        uuid id PK
        uuid employee_id FK
        uuid project_id FK "nullable"
        uuid organization_id FK
        string expense_type "travel|meals|supplies|equipment|other"
        decimal amount
        date expense_date
        string description
        string receipt_path
        string status "draft|submitted|approved|rejected|reimbursed"
        uuid approved_by FK
        timestamp approved_at
        date reimbursement_date
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% LEAVE MANAGEMENT
    %% ==========================================
    
    LEAVE_REQUESTS {
        uuid id PK
        uuid employee_id FK
        uuid organization_id FK
        string leave_type "vacation|sick|personal|parental|unpaid"
        date start_date
        date end_date
        decimal days_requested
        string reason
        string status "pending|approved|rejected|cancelled"
        uuid approved_by FK
        timestamp approved_at
        string rejection_reason
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% PERFORMANCE MANAGEMENT
    %% ==========================================
    
    PERFORMANCE_REVIEWS {
        uuid id PK
        uuid employee_id FK
        uuid reviewer_id FK
        uuid organization_id FK
        string review_period
        date review_date
        int rating
        string strengths
        string areas_for_improvement
        string goals
        string status "draft|completed|acknowledged"
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% WORKFLOW & APPROVALS
    %% ==========================================
    
    APPROVAL_WORKFLOWS {
        uuid id PK
        uuid employee_id FK
        uuid organization_id FK
        string workflow_type "onboarding|document|immigration|leave|expense"
        string current_stage
        int total_stages
        json stage_status
        json approval_chain
        string status "in-progress|completed|rejected"
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% NOTIFICATIONS
    %% ==========================================
    
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        string notification_type "expiry|approval|reminder|alert|info"
        string title
        string message
        string severity "low|medium|high|critical"
        boolean read
        string related_entity_type
        uuid related_entity_id
        string action_url
        timestamp created_at
        timestamp read_at
    }
    
    %% ==========================================
    %% SUBSCRIPTION MANAGEMENT
    %% ==========================================
    
    SUBSCRIPTIONS ||--|| SUBSCRIPTION_PLANS : "subscribes_to"
    
    SUBSCRIPTIONS {
        uuid id PK
        uuid organization_id FK
        uuid plan_id FK
        string billing_cycle "monthly|annual"
        string status "active|trial|suspended|cancelled"
        date current_period_start
        date current_period_end
        date next_billing_date
        decimal amount
        string payment_method
        timestamp created_at
        timestamp updated_at
    }
    
    SUBSCRIPTION_PLANS {
        uuid id PK
        string plan_name "free|starter|professional|enterprise|custom"
        string display_name
        decimal monthly_price
        decimal annual_price
        int max_employees
        int max_clients
        boolean immigration_module
        boolean licensing_module
        boolean advanced_reporting
        boolean api_access
        boolean custom_integrations
        boolean priority_support
        json features
        boolean is_active
        boolean is_custom
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% EXTERNAL INTEGRATIONS
    %% ==========================================
    
    EXTERNAL_INTEGRATIONS {
        uuid id PK
        uuid organization_id FK
        string module "timesheets|invoices"
        string provider "quickbooks|adp|paychex|gusto|custom"
        string custom_url
        boolean enabled
        boolean redirect_enabled
        json configuration
        timestamp created_at
        timestamp updated_at
    }
    
    %% ==========================================
    %% AUDIT TRAIL
    %% ==========================================
    
    AUDIT_TRAILS {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string action_type "create|update|delete|approve|reject"
        string entity_type
        uuid entity_id
        json old_values
        json new_values
        string ip_address
        string user_agent
        timestamp created_at
    }
```

---

## 📊 Entity Summaries

### **Core Business Entities (8)**
1. **ORGANIZATIONS** - Multi-tenant container for all data
2. **USERS** - Authentication and role-based access (8 roles)
3. **EMPLOYEES** - Worker records with classification tracking
4. **CLIENTS** - Customer organizations
5. **VENDORS** - Third-party staffing/consulting firms
6. **SUBVENDORS** - Second-tier vendor relationships
7. **CONTRACTORS** - Individual contract workers
8. **PROJECTS** - Client engagements and work tracking

### **Relationship Entities (3)**
9. **EMPLOYEE_CLIENTS** - Many-to-many employee-client assignments with rates
10. **PROJECT_ASSIGNMENTS** - Employee allocation to specific projects
11. **VENDOR_CLIENTS** - Vendor-client relationship tracking

### **Immigration Module (4)**
12. **IMMIGRATION_CASES** - Visa/work authorization tracking
13. **IMMIGRATION_DEPENDENTS** - Family members on dependent visas
14. **IMMIGRATION_COSTS** - Expense tracking for immigration processes
15. **IMMIGRATION_FILINGS** - Government filing tracking (I-129, I-140, etc.)

### **Compliance & Certifications (2)**
16. **BUSINESS_LICENSES** - Organization-level licensing (4 types)
17. **CERTIFICATIONS** - Employee certifications and credentials

### **Document Management (1)**
18. **DOCUMENTS** - File storage with approval workflows

### **Time & Billing (4)**
19. **TIMESHEETS** - Time entry with multi-level approval
20. **INVOICES** - Client billing
21. **INVOICE_ITEMS** - Line items for invoices
22. **EXPENSES** - Employee expense tracking and reimbursement

### **HR Management (2)**
23. **LEAVE_REQUESTS** - PTO and leave tracking
24. **PERFORMANCE_REVIEWS** - Employee performance evaluations

### **System Entities (5)**
25. **APPROVAL_WORKFLOWS** - Multi-stage approval tracking
26. **NOTIFICATIONS** - In-app notification system
27. **SUBSCRIPTIONS** - Organization subscription tracking
28. **SUBSCRIPTION_PLANS** - Available subscription tiers
29. **EXTERNAL_INTEGRATIONS** - Third-party system connections
30. **AUDIT_TRAILS** - Complete audit logging

---

## 🔗 Key Relationships

### **One-to-Many Relationships**
- Organization → Users (1:N)
- Organization → Employees (1:N)
- Organization → Clients (1:N)
- Employee → Immigration Cases (1:N)
- Employee → Timesheets (1:N)
- Client → Projects (1:N)
- Project → Timesheets (1:N)
- Invoice → Invoice Items (1:N)

### **Many-to-Many Relationships**
- Employees ↔ Clients (via EMPLOYEE_CLIENTS)
- Employees ↔ Projects (via PROJECT_ASSIGNMENTS)
- Vendors ↔ Clients (via VENDOR_CLIENTS)

### **Self-Referencing Relationships**
- Employees → Manager (Employee.manager_id)

### **Optional Relationships**
- Users ↔ Employees (User can exist without Employee profile)
- Documents → Immigration Cases (Documents can be general or case-specific)

---

## 🔐 Access Control

### **8 User Roles with Different Data Access:**

| Role | Scope | Access Level |
|------|-------|--------------|
| **product-admin** | Platform-wide | All organizations (read-only on org data, full control on subscriptions) |
| **super_admin** | Organization | Full access to all org data |
| **admin** | Organization | Full access to all org data |
| **hr** | Organization | Employee, immigration, licensing, documents |
| **recruiter** | Organization | Employee onboarding, client management |
| **manager** | Organization | Team timesheets, leave approvals, performance reviews |
| **employee** | Self | Own profile, timesheets, documents, leave requests |
| **consultant** | Self | Own profile, timesheets, documents |

---

## 💾 Data Storage

### **Encrypted Fields (AES-256-GCM)**
- Employee.ssn_encrypted
- Any sensitive personal information

### **File Storage (Supabase Storage)**
- Documents.file_path
- Certifications.document_path
- Business_Licenses.document_path
- Expenses.receipt_path

### **Key-Value Store**
- Used for flexible configuration
- Temporary data
- Session management

---

## 📈 Cardinality Summary

### **High Volume Entities** (100,000+ records)
- TIMESHEETS
- NOTIFICATIONS
- AUDIT_TRAILS
- DOCUMENTS

### **Medium Volume Entities** (1,000-10,000 records)
- EMPLOYEES
- CLIENTS
- PROJECTS
- IMMIGRATION_CASES
- INVOICES
- LEAVE_REQUESTS

### **Low Volume Entities** (< 1,000 records)
- ORGANIZATIONS
- USERS
- VENDORS
- SUBSCRIPTION_PLANS

---

## 🔄 Workflow Integration

### **Multi-Stage Workflows Tracked:**
1. **Employee Onboarding** (7 stages, 30+ tasks)
2. **Immigration Case Processing** (5-department approval)
3. **Document Approval** (HR review)
4. **Timesheet Approval** (Manager → HR → Billing)
5. **Leave Request Approval** (Manager → HR)
6. **Expense Approval** (Manager → Finance)

---

## 🎯 Business Rules Enforced

1. **Employee Classification** → Must complete onboarding before timesheet access
2. **Immigration Tracking** → Auto-prompt for EAD dates based on visa type
3. **License Expiry** → Automatic reminders at 30/60/90 days
4. **Timesheet Status** → Cannot modify after "invoiced" status
5. **Subscription Limits** → Enforced based on plan (max employees, features)
6. **Multi-Client Support** → Employees can have multiple clients with different rates
7. **Document Approval** → Required for compliance documents

---

This ER diagram represents the complete data model for your comprehensive HR & Workforce Management Platform with 30 entities and complex relationship management.
