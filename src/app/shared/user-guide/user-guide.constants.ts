// src/app/shared/constants/user-guide.constants.ts

export interface SubSection {
  id?: string;
  title: string;
  content?: string[];
  intro?: string;
  keyPoint?: string;
  description?: string;
  subsections?: SubSection[];
  features?: Array<{ label: string; description: string }>;
  notes?: string[];
  location?: string;
  process?: string[];
  criteria?: Array<{ title: string; description: string }>;
  matchStrengths?: Array<{ label: string; description: string }>;
  steps?: Array<{
    number: number;
    title: string;
    fields?: string[];
    description?: string;
    note?: string;
  }>;
  fields?: Array<{ title: string; description: string }>;
}

export interface Section {
  id: string;
  title: string;
  icon?: string;
  intro?: string;
  description?: string;
  elements?: string[];
  subsections?: SubSection[];
  uses?: Array<{ title: string; description: string }>;
  features?: string[];
  benefits?: string[];
  sections?: Array<{ title: string; description: string }>;
}

export const USER_GUIDE_CONTENT = {
  intro: {
    title: 'Kapify SME User Guide',
    subtitle: 'Empowering South African SMEs with Smart Funding Connections.',
    description:
      'This guide will help you navigate your SME dashboard to streamline your fundraising journey, manage your documents, and connect with the right investors.',
  },

  sections: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'Rocket',
      subsections: [
        {
          id: 'registration',
          title: 'Registration & Sign-In',
          content: [
            'Go to kapify.africa and click "Get Started". Select the SME/Business user type.',
            'Fill in the user login details and confirm password.',
            'Check your inbox for a verification link to activate your account. Click on the account verification link to verify your email.',
          ],
        },
        {
          id: 'profile',
          title: 'Completing Your Business Profile',
          intro:
            'Your profile acts as your "digital pitch." A complete profile increases your chances of a successful match.',
          keyPoint:
            'Your profile must be at least 70% complete to see and apply for funding opportunities.',
          subsections: [
            {
              title: 'Company Information',
              description:
                'Key contact person, business details, compliance matters & shareholder details.',
            },
            {
              title: 'Supporting Documents',
              description:
                'Upload supporting documents for due diligence. Financial statements, management accounts, tax PIN, etc.',
            },
            {
              title: 'Business Assessment',
              description:
                'Details about your back-office environment and operational setup.',
            },
            {
              title: 'Strategy Analysis',
              description:
                'Complete your SWOT analysis. Each element must have a minimum of 2 items captured.',
            },
            {
              title: 'Leadership & Governance',
              description:
                'Management team details, manpower information, and board or management committee details.',
            },
            {
              title: 'Financial Profile',
              description:
                'Capture all financial data using the provided template for income statement, balance sheet, and cash flow.',
              notes: [
                'Do NOT delete any lines on the template.',
                'You may rename sections, especially on the Balance sheet template.',
                "If you've deleted lines, download a fresh template and re-import.",
                'Click "Replace Data" to re-import financial data.',
              ],
            },
          ],
        },
        {
          id: 'home-features',
          title: 'Other Features on the Home Page',
          features: [
            { label: 'Learn More', description: 'Read the about us page.' },
            {
              label: 'Funding Readiness Guide',
              description: 'Receive guidance on being funding ready.',
            },
            {
              label: 'View FAQs',
              description: 'See frequently asked questions.',
            },
            {
              label: 'Contact Support',
              description: 'Raise a query or get assistance.',
            },
            {
              label: 'User Guide',
              description: 'See user guide-related help topics.',
            },
          ],
        },
      ],
    },

    {
      id: 'funding-opportunities',
      title: 'Funding Opportunities',
      icon: 'Target',
      intro:
        'This section lists all available funding opportunities from all funders on the platform.',
      elements: [
        'Name & description of the funding opportunity',
        'Funding type (debt, equity, PO funding, etc.)',
        'Industries the funding opportunity is meant for',
        'Funding Range: minimum and maximum amount you may request',
        'Eligibility Criteria: characteristics funders want to see',
        'Ineligibility Criteria: characteristics funders do not want to see',
      ],
      subsections: [
        {
          id: 'auto-matching',
          title: 'Auto-Matching',
          intro:
            'The platform has built-in auto-matching capabilities. Based on your business and funding needs, the platform matches you to funders.',
          location: 'Found under "Kapify Auto-Matching"',
          process: [
            'Kapify scans your business profile and funding opportunities to see which align with your business.',
            'All matching opportunities are provided in the auto-matching section.',
          ],
          criteria: [
            {
              title: 'Amount',
              description: 'Your funding ask. How much are you looking for?',
            },
            {
              title: 'Industry',
              description:
                "Does your business sector align with the funder's industry focus?",
            },
            {
              title: 'Business Stage',
              description:
                "Does your business stage align with the funder's criteria?",
            },
            {
              title: 'Investment Criteria',
              description:
                "Does your business align with the funder's investment criteria?",
            },
          ],
          matchStrengths: [
            {
              label: 'Weak Match',
              description:
                'Alignment with the funder is negative (not aligned) on most criteria.',
            },
            {
              label: 'Moderate Match',
              description:
                'Alignment is somewhat in the middle. Some criteria met, others not.',
            },
            {
              label: 'Strong Match',
              description:
                'Alignment is positive (aligned) on all or most criteria.',
            },
          ],
        },
        {
          id: 'apply-now',
          title: 'Apply Now',
          intro:
            'The Apply Now button allows you to apply for the funding opportunity through a 3-step process.',
          steps: [
            {
              number: 1,
              title: 'Application Details',
              fields: [
                'Funding Type: Select what funding type you are seeking based on funder options.',
                'Requested Amount: How much are you looking for?',
                'Funding Motivation: Provide a short funding motivation.',
                'Cover Letter (Optional): Upload detailed funding motivation explaining why this aligns with your business.',
                'Use of Funds: High-level summary of fund usage (e.g., delivery vehicle R250K, working capital R50K).',
              ],
            },
            {
              number: 2,
              title: 'Analysis',
              description:
                'AI-driven pre-qualification analysis of your funding readiness compared to funder requirements.',
              note: 'Your profile must be at least 70% complete to apply for funding opportunities.',
            },
            {
              number: 3,
              title: 'Review',
              description:
                'Review your funding application before final submission.',
            },
          ],
        },
      ],
    },

    {
      id: 'applications',
      title: 'Applications',
      icon: 'FileText',
      description:
        "View all funding applications you've made or those in draft stage.",
      features: [
        'View submitted and draft applications',
        'Withdraw previously submitted applications using the "Withdraw Application" button',
        'Track application status and progress',
      ],
    },

    {
      id: 'review',
      title: 'Review',
      icon: 'Eye',
      description:
        'Upload your business plan or proposal and get AI-powered analysis on its investability.',
      features: [
        'Upload business plan or proposal document',
        'Receive AI-generated investability feedback',
        'Download investment analysis report',
      ],
    },

    {
      id: 'data-room',
      title: 'Data Room',
      icon: 'Building',
      intro:
        'A secure, cloud-based space where you can upload, store, manage, and share important documents and information in an organised and controlled manner.',
      description:
        'Replaces traditional physical data rooms and email-based document sharing, making information access faster, safer, and more efficient.',
      uses: [
        {
          title: 'Due Diligence',
          description:
            'Enable investors, funders, or partners to securely review documents during funding, investment, or acquisition processes.',
        },
        {
          title: 'Secure Document Sharing',
          description:
            'Share sensitive information safely without relying on email or unsecured file transfers.',
        },
        {
          title: 'Collaboration',
          description:
            'Multiple stakeholders can access the same up-to-date documents in one place, reducing version control issues.',
        },
        {
          title: 'Compliance & Record-Keeping',
          description:
            'Store critical documents securely and easily retrieve them for regulatory, audit, or reporting purposes.',
        },
        {
          title: 'Efficiency & Transparency',
          description:
            'Speed up decision-making by providing authorised users with instant access to verified information.',
        },
      ],
    },

    {
      id: 'academy',
      title: 'Kapify Academy',
      icon: 'BookOpen',
      description:
        'The learning environment within Kapify designed to equip users with knowledge and skills needed to become funding-ready.',
      features: [
        'Structured learning content: short courses, masterclasses, guides, and practical tools',
        'Focus areas: financial management, compliance, business strategy, pitching for funding, funding options',
        'Practical, actionable resources for your fundraising journey',
      ],
    },

    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'Bell',
      description:
        'Stay informed about important activity and updates on the Kapify platform.',
      features: [
        'Real-time alerts and messages related to your account',
        'Funding match updates',
        'Messages from funders or other SMEs',
        'Document requests',
        'Application status changes',
        'Learning reminders from Kapify Academy',
        'Important system announcements',
      ],
      benefits: [
        'Stay up to date with progress on your funding journey',
        'Respond quickly to requests or messages',
        'Track key milestones and next steps',
        'Receive important platform and feature updates',
        'Easy reference to past notifications anytime',
      ],
    },

    {
      id: 'business-reports',
      title: 'Business Reports',
      icon: 'BarChart3',
      description:
        'Securely store and access all reports generated through the platform in one central location.',
      features: [
        'All platform-generated reports automatically saved',
        'Financial summaries, funding readiness reports, performance analyses, compliance reports',
      ],
      benefits: [
        'Keep all platform-generated reports in one place',
        'Track your business performance and progress over time',
        'Share reports easily with funders, advisors, or partners',
        'Maintain reliable records for review, audits, or decision-making',
      ],
    },

    {
      id: 'activity-log',
      title: 'Activity Log',
      icon: 'Clock',
      description:
        'Clear record of actions and events related to your account with timestamps.',
      features: [
        'Profile updates',
        'Document uploads',
        'Report generation',
        'Funding applications',
        'Data room access',
        'Interactions with other users',
      ],
    },

    {
      id: 'settings',
      title: 'Settings',
      icon: 'Settings',
      description:
        'Manage and customise your account preferences on the platform.',
      sections: [
        {
          title: 'Billing & Credits',
          description:
            'Manage your billings and purchase of credits. Some platform features are paid, others are free.',
        },
        {
          title: 'Team Management',
          description:
            'Add team members who are important to your fundraising process.',
        },
        {
          title: 'Account Settings',
          description:
            'Manage password and security preferences, review and adjust account permissions.',
        },
      ],
    },
  ] as Section[],
};

export const QUICK_LINKS = [
  { title: 'Getting Started', id: 'getting-started' },
  { title: 'Funding Opportunities', id: 'funding-opportunities' },
  { title: 'Applications', id: 'applications' },
  { title: 'Review & Analysis', id: 'review' },
  { title: 'Data Room', id: 'data-room' },
  { title: 'Academy', id: 'academy' },
  { title: 'Notifications', id: 'notifications' },
  { title: 'Business Reports', id: 'business-reports' },
];
