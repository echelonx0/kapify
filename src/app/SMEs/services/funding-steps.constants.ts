import { FundingApplicationStep } from '../applications/models/funding-application.models';
import { Building, FileText, BarChart3, Target, Users, TrendingUp, DollarSign } from 'lucide-angular';

export const FUNDING_STEPS: FundingApplicationStep[] = [
  {
    id: 'company-info',
    title: 'Company Information',
    description: 'Registration & operational details',
    completed: false,
    required: true,
    estimatedTime: '10 minutes'
  },
  {
    id: 'documents',
    title: 'Supporting Documents',
    description: 'Required business documentation',
    completed: false,
    required: true,
    estimatedTime: '15 minutes',
    dependencies: ['company-info']
  },
  {
    id: 'business-assessment',
    title: 'Business Assessment',
    description: 'Operations & market position',
    completed: false,
    required: true,
    estimatedTime: '20 minutes'
  },
  {
    id: 'swot-analysis',
    title: 'Strategic Analysis',
    description: 'Strengths, opportunities & risks',
    completed: false,
    required: true,
    estimatedTime: '15 minutes'
  },
  {
    id: 'management',
    title: 'Leadership & Governance',
    description: 'Management team & structure',
    completed: false,
    required: true,
    estimatedTime: '12 minutes'
  },
  {
    id: 'business-strategy',
    title: 'Business Strategy',
    description: 'Strategic plan & projections',
    completed: false,
    required: true,
    estimatedTime: '25 minutes'
  },
  {
    id: 'financial-profile',
    title: 'Financial Profile',
    description: 'Performance & funding requirements',
    completed: false,
    required: true,
    estimatedTime: '18 minutes'
  }
];

// Step configuration for UI (icons, priorities, short titles)
export const STEP_UI_CONFIG = {
  'company-info': {
    shortTitle: 'Company Info',
    icon: Building,
    priority: 'high' as const
  },
  'documents': {
    shortTitle: 'Documents',
    icon: FileText,
    priority: 'high' as const
  },
  'business-assessment': {
    shortTitle: 'Business Review',
    icon: BarChart3,
    priority: 'high' as const
  },
  'swot-analysis': {
    shortTitle: 'SWOT Analysis',
    icon: Target,
    priority: 'medium' as const
  },
  'management': {
    shortTitle: 'Management',
    icon: Users,
    priority: 'high' as const
  },
  'business-strategy': {
    shortTitle: 'Strategy',
    icon: TrendingUp,
    priority: 'medium' as const
  },
  'financial-profile': {
    shortTitle: 'Financials',
    icon: DollarSign,
    priority: 'high' as const
  }
};

// Field labels for missing fields detection
export const STEP_FIELD_LABELS = {
  'company-info': {
    companyName: 'Company Name',
    registrationNumber: 'Registration Number',
    industryType: 'Industry Type',
    businessActivity: 'Business Activity',
    businessStage: 'Business Stage',
    bbbeeLevel: 'B-BBEE Level',
    cipcReturns: 'CIPC Returns',
    incomeTaxNumber: 'Income Tax Number',
    workmansCompensation: 'Workman\'s Compensation'
  },
  'documents': {
    businessRegistration: 'Business Registration',
    financialStatements: 'Financial Statements',
    taxClearance: 'Tax Clearance',
    bankStatements: 'Bank Statements'
  },
  'business-assessment': {
    marketSize: 'Market Size',
    competitivePosition: 'Competitive Position',
    operations: 'Operations Summary'
  },
  'swot-analysis': {
    strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    opportunities: 'Opportunities',
    threats: 'Threats'
  },
  'management': {
    ceoName: 'CEO Name',
    ceoExperience: 'CEO Experience',
    teamStructure: 'Team Structure'
  },
  'business-strategy': {
    executiveSummary: 'Executive Summary',
    missionStatement: 'Mission Statement',
    fundingRequirements: 'Funding Requirements'
  },
  'financial-profile': {
    monthlyRevenue: 'Monthly Revenue',
    monthlyCosts: 'Monthly Costs',
    currentAssets: 'Current Assets'
  }
};

// Data section mapping
export const SECTION_DATA_KEYS = {
  'company-info': 'companyInfo',
  'documents': 'supportingDocuments',
  'business-assessment': 'businessAssessment',
  'swot-analysis': 'swotAnalysis',
  'management': 'managementStructure',
  'business-strategy': 'businessStrategy',
  'financial-profile': 'financialProfile'
} as const;

// Auto-save configuration
export const AUTO_SAVE_CONFIG = {
  debounceMs: 30000, // 30 seconds
  localStorageKey: 'funding_application_draft'
};