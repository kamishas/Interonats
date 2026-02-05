export type WorkflowStage = 
  | 'hr-setup'        // HR creates employee record
  | 'employee-setup'  // Employee completes profile & uploads documents
  | 'hr-review'       // HR reviews employee submission
  | 'completed';      // Onboarding complete

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export type EmployeeClassification = 'billable' | 'non-billable' | 'operational';

export interface WorkflowTask {
  id: string;
  taskName: string;
  workflowStage: WorkflowStage;
  assignedDepartment: 'HR' | 'Employee';
  status: TaskStatus;
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  completedBy?: string;
  notes?: string;
}

export interface OnboardingWorkflow {
  currentStage: WorkflowStage;
  tasks: WorkflowTask[];
  initiatedBy?: string;
  initiatedDate?: string;
  completedDate?: string;
  
  // HR Setup Stage
  hrSetupComplete?: boolean;
  hrSetupCompletedDate?: string;
  
  // Employee Setup Stage
  profileCompleted?: boolean;
  documentsUploaded?: boolean;
  employeeSetupCompleteDate?: string;
  
  // HR Review Stage
  hrReviewComplete?: boolean;
  hrReviewedBy?: string;
  hrReviewedDate?: string;
  hrReviewNotes?: string;
  
  // Classification (simplified)
  classificationVerified?: boolean;
  employeeClassification?: EmployeeClassification;
}

// Immigration Document Request Types
export type DocumentRequestStatus = 'pending' | 'uploaded' | 'cancelled';

export interface DocumentRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  description: string;
  requestedBy: string;
  requestedByName: string;
  requestedDate: string;
  dueDate?: string;
  status: DocumentRequestStatus;
  uploadedDate?: string;
  uploadedFileUrl?: string;
  notes?: string;
  module: 'immigration';
}