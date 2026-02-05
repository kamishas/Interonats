import type { CaseType } from "../types";

export interface WorkflowTemplateTask {
  taskName: string;
  description: string;
  estimatedDays: number;
  requiredDocuments: string[];
  assignedTo: 'Analyst' | 'Attorney' | 'HR' | 'Employee';
}

export interface WorkflowTemplate {
  caseType: CaseType;
  displayName: string;
  description: string;
  estimatedTotalDays: number;
  tasks: WorkflowTemplateTask[];
  requiredDocuments: string[];
  governmentFeeRange: string;
  attorneyFeeRange: string;
}

export const immigrationWorkflowTemplates: WorkflowTemplate[] = [
  {
    caseType: "H-1B Transfer",
    displayName: "H-1B Transfer",
    description: "Transfer H-1B sponsorship to new employer",
    estimatedTotalDays: 90,
    governmentFeeRange: "$460-$2,500",
    attorneyFeeRange: "$2,000-$4,000",
    requiredDocuments: [
      "Current I-797 Approval Notice",
      "Passport",
      "I-94",
      "Resume/CV",
      "Educational Documents",
      "Previous Paystubs",
      "Offer Letter"
    ],
    tasks: [
      {
        taskName: "Initial Consultation",
        description: "Review employee eligibility and gather initial information",
        estimatedDays: 2,
        requiredDocuments: ["Current I-797", "Passport", "Resume"],
        assignedTo: "Analyst"
      },
      {
        taskName: "LCA Preparation",
        description: "Prepare Labor Condition Application",
        estimatedDays: 5,
        requiredDocuments: ["Job Description", "Prevailing Wage Determination"],
        assignedTo: "Attorney"
      },
      {
        taskName: "LCA Filing",
        description: "File LCA with Department of Labor",
        estimatedDays: 7,
        requiredDocuments: ["LCA"],
        assignedTo: "Attorney"
      },
      {
        taskName: "LCA Posting",
        description: "Post LCA notice at workplace",
        estimatedDays: 10,
        requiredDocuments: ["LCA Approval"],
        assignedTo: "HR"
      },
      {
        taskName: "I-129 Preparation",
        description: "Prepare H-1B petition package",
        estimatedDays: 10,
        requiredDocuments: ["All required documents"],
        assignedTo: "Attorney"
      },
      {
        taskName: "I-129 Filing",
        description: "File H-1B petition with USCIS",
        estimatedDays: 2,
        requiredDocuments: ["I-129 Package", "Filing Fee"],
        assignedTo: "Attorney"
      },
      {
        taskName: "USCIS Processing",
        description: "Wait for USCIS adjudication",
        estimatedDays: 60,
        requiredDocuments: [],
        assignedTo: "Attorney"
      },
      {
        taskName: "Approval Processing",
        description: "Process approval notice and update records",
        estimatedDays: 3,
        requiredDocuments: ["I-797 Approval"],
        assignedTo: "Analyst"
      }
    ]
  },
  {
    caseType: "H-1B Amendment",
    displayName: "H-1B Amendment",
    description: "Amend H-1B for material changes (location, duties, salary)",
    estimatedTotalDays: 75,
    governmentFeeRange: "$460-$2,500",
    attorneyFeeRange: "$1,500-$3,000",
    requiredDocuments: [
      "Current I-797 Approval Notice",
      "Updated Job Description",
      "New Work Location Details",
      "Organizational Chart"
    ],
    tasks: [
      {
        taskName: "Change Analysis",
        description: "Analyze material changes requiring amendment",
        estimatedDays: 3,
        requiredDocuments: ["Current I-797", "Change Details"],
        assignedTo: "Attorney"
      },
      {
        taskName: "New LCA Filing",
        description: "File new LCA if location/wage changed",
        estimatedDays: 10,
        requiredDocuments: ["Updated Job Info"],
        assignedTo: "Attorney"
      },
      {
        taskName: "Amendment Preparation",
        description: "Prepare amended H-1B petition",
        estimatedDays: 10,
        requiredDocuments: ["All supporting documents"],
        assignedTo: "Attorney"
      },
      {
        taskName: "Amendment Filing",
        description: "File amended petition with USCIS",
        estimatedDays: 2,
        requiredDocuments: ["Amended I-129"],
        assignedTo: "Attorney"
      },
      {
        taskName: "USCIS Processing",
        description: "Wait for USCIS decision",
        estimatedDays: 45,
        requiredDocuments: [],
        assignedTo: "Attorney"
      },
      {
        taskName: "Approval Processing",
        description: "Update employee records with new approval",
        estimatedDays: 5,
        requiredDocuments: ["New I-797"],
        assignedTo: "Analyst"
      }
    ]
  },
  {
    caseType: "H-1B Extension",
    displayName: "H-1B Extension",
    description: "Extend H-1B status before expiration",
    estimatedTotalDays: 120,
    governmentFeeRange: "$460-$2,500",
    attorneyFeeRange: "$2,000-$3,500",
    requiredDocuments: [
      "Current I-797 Approval Notice",
      "Passport",
      "Recent Paystubs",
      "Employment Verification Letter",
      "Tax Returns"
    ],
    tasks: [
      {
        taskName: "Eligibility Review",
        description: "Confirm extension eligibility and timing",
        estimatedDays: 5,
        requiredDocuments: ["Current I-797", "Paystubs"],
        assignedTo: "Analyst"
      },
      {
        taskName: "LCA Filing",
        description: "File new LCA for extension period",
        estimatedDays: 10,
        requiredDocuments: ["Current Job Description"],
        assignedTo: "Attorney"
      },
      {
        taskName: "Document Collection",
        description: "Gather all required extension documents",
        estimatedDays: 10,
        requiredDocuments: ["All supporting documents"],
        assignedTo: "Employee"
      },
      {
        taskName: "Extension Preparation",
        description: "Prepare extension petition package",
        estimatedDays: 10,
        requiredDocuments: ["All documents"],
        assignedTo: "Attorney"
      },
      {
        taskName: "Extension Filing",
        description: "File extension petition with USCIS",
        estimatedDays: 2,
        requiredDocuments: ["I-129 Extension Package"],
        assignedTo: "Attorney"
      },
      {
        taskName: "USCIS Processing",
        description: "Wait for USCIS adjudication",
        estimatedDays: 75,
        requiredDocuments: [],
        assignedTo: "Attorney"
      },
      {
        taskName: "Approval Processing",
        description: "Process approval and update I-9",
        estimatedDays: 8,
        requiredDocuments: ["Extension Approval"],
        assignedTo: "HR"
      }
    ]
  },
  {
    caseType: "OPT Initial",
    displayName: "OPT Initial Application",
    description: "Apply for Optional Practical Training",
    estimatedTotalDays: 90,
    governmentFeeRange: "$410",
    attorneyFeeRange: "$500-$1,500",
    requiredDocuments: [
      "I-20 with OPT Recommendation",
      "Passport",
      "I-94",
      "Passport Photos",
      "Degree/Enrollment Verification"
    ],
    tasks: [
      {
        taskName: "DSO Consultation",
        description: "Meet with Designated School Official for OPT eligibility",
        estimatedDays: 3,
        requiredDocuments: ["Enrollment Verification"],
        assignedTo: "Employee"
      },
      {
        taskName: "I-20 Endorsement",
        description: "Obtain OPT recommendation on I-20",
        estimatedDays: 7,
        requiredDocuments: ["Current I-20"],
        assignedTo: "Employee"
      },
      {
        taskName: "I-765 Preparation",
        description: "Prepare EAD application package",
        estimatedDays: 5,
        requiredDocuments: ["All required documents"],
        assignedTo: "Analyst"
      },
      {
        taskName: "I-765 Filing",
        description: "File EAD application with USCIS",
        estimatedDays: 2,
        requiredDocuments: ["I-765 Package"],
        assignedTo: "Analyst"
      },
      {
        taskName: "USCIS Processing",
        description: "Wait for EAD card processing",
        estimatedDays: 65,
        requiredDocuments: [],
        assignedTo: "Analyst"
      },
      {
        taskName: "EAD Receipt",
        description: "Receive and verify EAD card",
        estimatedDays: 8,
        requiredDocuments: ["EAD Card"],
        assignedTo: "Employee"
      }
    ]
  },
  {
    caseType: "STEM OPT",
    displayName: "STEM OPT Extension",
    description: "24-month STEM extension for qualified STEM degree holders",
    estimatedTotalDays: 90,
    governmentFeeRange: "$410",
    attorneyFeeRange: "$800-$2,000",
    requiredDocuments: [
      "Current EAD Card",
      "I-20 with STEM Recommendation",
      "I-983 Training Plan",
      "Employer Letter",
      "STEM Degree Verification"
    ],
    tasks: [
      {
        taskName: "STEM Eligibility Verification",
        description: "Verify STEM degree from approved list",
        estimatedDays: 2,
        requiredDocuments: ["Degree Certificate", "CIP Code"],
        assignedTo: "Analyst"
      },
      {
        taskName: "I-983 Preparation",
        description: "Develop STEM Training Plan with employer",
        estimatedDays: 10,
        requiredDocuments: ["Job Description", "Learning Objectives"],
        assignedTo: "HR"
      },
      {
        taskName: "DSO I-20 Endorsement",
        description: "Obtain STEM OPT recommendation on I-20",
        estimatedDays: 7,
        requiredDocuments: ["I-983", "Current I-20"],
        assignedTo: "Employee"
      },
      {
        taskName: "I-765 Preparation",
        description: "Prepare STEM OPT extension application",
        estimatedDays: 5,
        requiredDocuments: ["All documents"],
        assignedTo: "Analyst"
      },
      {
        taskName: "I-765 Filing",
        description: "File STEM extension application",
        estimatedDays: 2,
        requiredDocuments: ["I-765 STEM Package"],
        assignedTo: "Analyst"
      },
      {
        taskName: "USCIS Processing",
        description: "Wait for STEM EAD processing",
        estimatedDays: 60,
        requiredDocuments: [],
        assignedTo: "Analyst"
      },
      {
        taskName: "EAD Receipt & I-983 Reporting",
        description: "Receive EAD and set up I-983 reporting schedule",
        estimatedDays: 4,
        requiredDocuments: ["STEM EAD Card"],
        assignedTo: "Employee"
      }
    ]
  },
  {
    caseType: "EAD Renewal",
    displayName: "EAD Renewal",
    description: "Renew Work Authorization Document",
    estimatedTotalDays: 90,
    governmentFeeRange: "$410",
    attorneyFeeRange: "$500-$1,200",
    requiredDocuments: [
      "Current EAD Card",
      "Passport",
      "I-94",
      "Passport Photos",
      "Supporting Status Documents"
    ],
    tasks: [
      {
        taskName: "Renewal Eligibility Check",
        description: "Verify EAD renewal eligibility and category",
        estimatedDays: 3,
        requiredDocuments: ["Current EAD"],
        assignedTo: "Analyst"
      },
      {
        taskName: "Document Collection",
        description: "Gather all renewal documents",
        estimatedDays: 7,
        requiredDocuments: ["All supporting documents"],
        assignedTo: "Employee"
      },
      {
        taskName: "I-765 Preparation",
        description: "Prepare EAD renewal application",
        estimatedDays: 5,
        requiredDocuments: ["All documents"],
        assignedTo: "Analyst"
      },
      {
        taskName: "I-765 Filing",
        description: "File renewal application with USCIS",
        estimatedDays: 2,
        requiredDocuments: ["Renewal Package"],
        assignedTo: "Analyst"
      },
      {
        taskName: "USCIS Processing",
        description: "Wait for EAD renewal processing",
        estimatedDays: 65,
        requiredDocuments: [],
        assignedTo: "Analyst"
      },
      {
        taskName: "New EAD Receipt",
        description: "Receive and verify new EAD card",
        estimatedDays: 8,
        requiredDocuments: ["New EAD"],
        assignedTo: "HR"
      }
    ]
  },
  {
    caseType: "LCA Filing",
    displayName: "Labor Condition Application",
    description: "File LCA with Department of Labor for H-1B employment",
    estimatedTotalDays: 14,
    governmentFeeRange: "$0",
    attorneyFeeRange: "$300-$800",
    requiredDocuments: [
      "Job Description",
      "Prevailing Wage Determination",
      "Work Location Details",
      "Employer Information"
    ],
    tasks: [
      {
        taskName: "Prevailing Wage Request",
        description: "Submit prevailing wage determination request",
        estimatedDays: 3,
        requiredDocuments: ["Job Details", "Work Location"],
        assignedTo: "Attorney"
      },
      {
        taskName: "LCA Preparation",
        description: "Prepare LCA application",
        estimatedDays: 3,
        requiredDocuments: ["Wage Determination", "Job Description"],
        assignedTo: "Attorney"
      },
      {
        taskName: "LCA Filing",
        description: "Submit LCA to DOL",
        estimatedDays: 1,
        requiredDocuments: ["LCA Form 9035"],
        assignedTo: "Attorney"
      },
      {
        taskName: "DOL Processing",
        description: "Wait for DOL certification",
        estimatedDays: 7,
        requiredDocuments: [],
        assignedTo: "Attorney"
      }
    ]
  },
  {
    caseType: "I-983 Training Plan",
    displayName: "I-983 Training Plan",
    description: "Develop and maintain STEM OPT training plan",
    estimatedTotalDays: 10,
    governmentFeeRange: "$0",
    attorneyFeeRange: "$500-$1,000",
    requiredDocuments: [
      "Job Description",
      "STEM Degree Information",
      "Employer Information",
      "Supervisor Details"
    ],
    tasks: [
      {
        taskName: "Training Plan Development",
        description: "Develop learning objectives and training plan",
        estimatedDays: 5,
        requiredDocuments: ["Job Description", "STEM Degree"],
        assignedTo: "HR"
      },
      {
        taskName: "Employer Review",
        description: "Employer and supervisor review and sign",
        estimatedDays: 3,
        requiredDocuments: ["Draft I-983"],
        assignedTo: "HR"
      },
      {
        taskName: "Student Signature",
        description: "Employee reviews and signs I-983",
        estimatedDays: 1,
        requiredDocuments: ["Signed I-983"],
        assignedTo: "Employee"
      },
      {
        taskName: "DSO Submission",
        description: "Submit to DSO for endorsement",
        estimatedDays: 1,
        requiredDocuments: ["Completed I-983"],
        assignedTo: "Employee"
      }
    ]
  }
];

export function getWorkflowTemplate(caseType: CaseType): WorkflowTemplate | undefined {
  return immigrationWorkflowTemplates.find(t => t.caseType === caseType);
}

export function getAllCaseTypes(): CaseType[] {
  return immigrationWorkflowTemplates.map(t => t.caseType);
}
