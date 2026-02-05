# OneHR 2.0 Project Schema

## 1. System Architecture

*   **Frontend**: React (Vite) + TypeScript + TailwindCSS
*   **Backend**: Python FastAPI Services (Onboarding, Auth, User, etc.) running on AWS Lambda
*   **Database**: PostgreSQL
*   **Authentication**: JWT-based auth with Role-Based Access Control (RBAC)
*   **Storage**: AWS S3 for document storage

---

## 2. Database Schema (Backend)

### Table: `onboarding_requests`
*Core table for managing employee data and onboarding lifecycles.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the employee/request |
| `organization_id` | UUID | Links employee to a specific organization (tenant) |
| `first_name` | VARCHAR | Employee first name |
| `last_name` | VARCHAR | Employee last name |
| `email` | VARCHAR | Employee email address |
| `phone` | VARCHAR | Contact number |
| `position` | VARCHAR | Job title/Role |
| `department` | VARCHAR | Assigned department |
| `manager` | VARCHAR | Manager's name |
| `start_date` | DATE | Employment start date |
| `status` | VARCHAR | `invited`, `profile_submitted`, `pending_documents`, `awaiting_hr_review`, `completed` |
| `employment_type` | VARCHAR | `W2`, `C2C`, `1099`, etc. |
| `classification` | VARCHAR | `billable`, `non-billable`, `operational` |
| `salary` | DECIMAL | Annual compensation |
| `visa_status` | VARCHAR | `H1B`, `GC`, `Citizen`, `OPT`, etc. |
| `recruiter_id` | UUID | ID of the recruiter/HR who created the record |
| `employee_user_id` | UUID | ID of the linked user account (once registered) |
| `invite_token` | VARCHAR | Unique token for signup invitations |
| `invite_expires_at` | TIMESTAMP | Expiration for the invite link |
| `client_id` | UUID | Primary client assignment (if applicable) |
| `client_ids` | JSONB | List of multiple client assignments |
| `address` | VARCHAR | Residential address line 1 |
| `city` | VARCHAR | Residential city |
| `state` | VARCHAR | Residential state |
| `zip_code` | VARCHAR | Residential zip code |
| `ssn_encrypted` | VARCHAR | Encrypted Social Security Number |
| `emergency_contacts`| JSONB | Array of contact objects |
| `profile_completed` | BOOLEAN | Flag if employee has finished their setup |
| `can_access_timesheets`| BOOLEAN | Flag to enable/disable timesheet module access |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### Table: `onboarding_documents`
*Stores all uploaded documents for employees.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique document ID |
| `onboarding_id` | UUID (FK) | Link to `onboarding_requests` |
| `doc_type` | VARCHAR | `Government-issued ID`, `Work Authorization`, `Release Forms`, etc. |
| `file_name` | VARCHAR | Original file name |
| `storage_url` | VARCHAR | S3 path/URL key |
| `status` | VARCHAR | `pending`, `uploaded`, `pending_review`, `approved`, `rejected` |
| `notes` | TEXT | Rejection reasons or admin notes |
| `uploaded_by` | UUID | User ID who uploaded the file |
| `created_at` | TIMESTAMP | Upload timestamp |
| `expiry_date` | DATE | (Optional) Expiration date for things like Visas/Licenses |

### Table: `document_requests`
*Specific requests from HR for documents needed from an employee.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique request ID |
| `employee_id` | UUID (FK) | Link to `onboarding_requests` |
| `document_type` | VARCHAR | Type of document requested |
| `description` | TEXT | Description or instructions |
| `status` | VARCHAR | `requested`, `uploaded`, `overdue` |
| `mandatory` | BOOLEAN | If the document is blocking |
| `due_date` | DATE | Expected submission date |

### Table: `users` (Auth Service)
*Central user repository.*

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique User ID |
| `email` | VARCHAR | Login email |
| `password_hash` | VARCHAR | Hashed password |
| `role` | VARCHAR | `admin`, `hr`, `employee`, `recruiter`, `product-admin`, etc. |
| `first_name` | VARCHAR | User first name |
| `last_name` | VARCHAR | User last name |
| `organization_id` | UUID | Tenant association |

---

## 3. Frontend Data Models (TypeScript)

### `Employee` Interface
```typescript
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;           // 'active', 'inactive'
  onboardingStatus: string; // 'invited' | 'profile_submitted' | 'pending_documents' | 'awaiting_hr_review' | 'completed'
  position?: string;
  department?: string;
  startDate?: string;
  manager?: string;
  workAuthorizationDoc?: string;
  visaStatus?: string;
  onboardingDocuments?: EmployeeDocument[]; 
  workflow?: OnboardingWorkflow;
  // ... plus address and contact fields
}
```

### `OnboardingWorkflow` Interface
```typescript
interface OnboardingWorkflow {
  currentStage: WorkflowStage; // 'hr-setup' | 'employee-setup' | 'hr-review' | 'completed'
  classificationVerified?: boolean;
  tasks: WorkflowTask[];
}
```

### `EmployeeDocument` Interface
```typescript
interface EmployeeDocument {
  id: string;
  documentType: string;
  documentName: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'pending_review';
  rejectionReason?: string;
  storageUrl?: string;
  // ... plus metadata
}
```

---

## 4. API Structure

### Employee Management (Onboarding Service)
*   `GET /employee`: List all employees (filterable).
*   `GET /employee/{id}`: Get detailed employee profile.
*   `POST /employee`: Create new employee (HR Setup).
*   `PUT /employee/{id}/profile`: Update employee profile (Employee Setup).
*   `DELETE /employee/{id}`: Remove employee record.
*   `POST /employees/{id}/complete-onboarding`: Finalize process.

### Document Management
*   `GET /employee/{id}/documents`: List all documents for an employee.
*   `POST /employee/{id}/document-requests`: HR requests a document.
*   `PUT /onboarding/requests/{id}/documents/{docId}`: Update status (Approve/Reject).
*   `GET /onboarding/requests/{id}/documents/{docId}/download`: Get S3 signed URL.

### Client Portal
*   `GET /client-portal/timesheets`: Fetch timesheets for approval.
*   `POST /timesheets/{id}/approve`: Approve/Reject timesheets.

### Authentication
*   `POST /auth/login`: Authenticate and receive JWT.
*   `POST /auth/invite/validate`: Validate invite tokens.
