export interface ApplicationProfileData {
  adminInformation?: Record<string, any>;
  supportingDocuments?: Record<string, any>;  
  businessReview?: Record<string, any>;
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  managementGovernance?: {
    managementTeam: any[];
    boardOfDirectors: any[];
    managementCommittee: any[];
  };
  businessPlan?: Record<string, any>;
  financialAnalysis?: Record<string, any>;
}
 

export interface ManagementMember {
  id: string;
  fullName: string;
  role: string;
  qualification: string;
  yearsOfExperience: number;
}

export interface BoardMember {
  id: string;
  fullName: string;
  role: string;
  independent: boolean;
  appointmentDate: string;
}

export interface CommitteeMember {
  id: string;
  fullName: string;
  committee: string;
  role: string;
}

export interface ProfileStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime?: string;
  priority?: 'high' | 'medium' | 'low';
}