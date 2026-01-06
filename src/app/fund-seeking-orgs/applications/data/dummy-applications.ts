import { Application } from '../../shared/models/application.models';

export const dummyApplications: Application[] = [
  {
      id: 'app-001',
      smeId: 'user-001',
      smeOrganizationId: 'org-1',
      funderId: 'funder-user-001',
      funderOrganizationId: 'funder-org-001',
      opportunityId: 'opp-001',
      applicationNumber: 'APP-2024-001',
      title: 'Growth Capital for TechFlow Solutions',
      description: 'Seeking R5M growth capital to expand operations and develop new technology platform for fintech solutions.',
      requestedAmount: 5000000,
      currency: 'ZAR',
      fundingType: 'equity',
      useOfFunds: [
          {
              category: 'expansion',
              description: 'New office setup and team expansion',
              amount: 2000000,
              percentage: 40,
              timeline: '6 months',
              priority: 'high',
              justification: 'Critical for capturing market opportunity',
              expectedImpact: 'Increase market presence in Cape Town and Durban'
          },
          {
              category: 'r_and_d',
              description: 'Technology platform development',
              amount: 1500000,
              percentage: 30,
              timeline: '12 months',
              priority: 'high',
              justification: 'Core differentiator in competitive market',
              expectedImpact: 'Launch of proprietary AI-driven platform'
          },
          {
              category: 'working_capital',
              description: 'Operational cash flow support',
              amount: 1000000,
              percentage: 20,
              timeline: '18 months',
              priority: 'medium',
              justification: 'Support scaling operations',
              expectedImpact: 'Smooth operations during growth phase'
          },
          {
              category: 'marketing',
              description: 'Brand awareness and customer acquisition',
              amount: 500000,
              percentage: 10,
              timeline: '12 months',
              priority: 'medium',
              justification: 'Essential for user base growth',
              expectedImpact: 'Double customer base within 12 months'
          }
      ],
      purposeStatement: 'TechFlow Solutions aims to become the leading fintech platform in Southern Africa...',
      proposedTerms: {
          equityOffered: 25,
          valuationExpected: 20000000,
          boardSeats: 1,
          votingRights: 'Minority shareholder rights with veto on major decisions',
          liquidationPreference: 1,
          milestones: [
              {
                  //name: 'User Base Growth',
                  description: 'Achieve 100,000 active users',
                  targetDate: new Date('2025-06-01'),


                  measurementCriteria: [],
                  consequenceIfMissed: '',
                  name: ''
              },
              {
                  description: 'Launch new AI-driven platform',
                  targetDate: new Date('2025-09-01'),
                  measurementCriteria: [],
                  consequenceIfMissed: '',
                  name: ''
              }
          ],
          reportingRequirements: 'Monthly financial reports, quarterly board meetings, annual audited financials'
      },
      smeProfileId: 'profile-001',
      swotAnalysisId: 'swot-001',
      businessPlanId: 'plan-001',
      pitchDeckId: 'deck-001',
      status: 'under_review',
      currentStage: {
          stage: 'initial_review',
          status: 'in_progress',
          startDate: new Date('2024-07-20'),
          owner: 'funder-user-001',
          notes: 'Initial review underway',
          documents: ['doc-verification', 'risk-analysis']
      },
      applicationSteps: [
          {
              id: 'step-submit',
              stepNumber: 1,
              name: 'Application Submitted',
              description: 'Application successfully submitted',
              status: 'completed',
              completedDate: new Date('2024-07-15'),
              owner: 'user-001',
              requiredDocuments: [],
              deliverables: []
          },
          {
              id: 'step-review',
              stepNumber: 2,
              name: 'Initial Review',
              description: 'Investment team conducts initial review',
              status: 'in_progress',
              owner: 'funder-user-001',
              requiredDocuments: ['financials', 'business-plan'],
              deliverables: ['review-report']
          },
          {
              id: 'step-due-diligence',
              stepNumber: 3,
              name: 'Due Diligence',
              description: 'Comprehensive due diligence process',
              status: 'pending',
              owner: 'funder-user-001',
              requiredDocuments: ['contracts', 'tax-certificates'],
              deliverables: []
          }
      ],
      matchScore: 87,
      assignedReviewer: 'funder-user-001',
      reviewTeam: ['funder-user-001', 'funder-user-002'],
      reviewNotes: [
          {
              id: 'note-001',
              reviewerId: 'funder-user-001',
              reviewerName: 'Sarah Johnson',
              category: 'general',
              content: 'Strong application with clear value proposition. Team has good track record.',
              sentiment: 'positive',
              isPrivate: false,
              tags: ['team', 'value-proposition'],
              createdAt: new Date('2024-07-22')
          },
          {
              id: 'note-002',
              reviewerId: 'funder-user-002',
              reviewerName: 'David Chen',
              category: 'financial',
              content: 'Financial projections look aggressive but achievable. Need more detail on customer acquisition costs.',
              sentiment: 'neutral',
              isPrivate: true,
              tags: ['financials', 'projections'],
              createdAt: new Date('2024-07-23')
          }
      ],
      messagesThread: 'thread-001',
      lastCommunication: new Date('2024-07-23'),
      submittedAt: new Date('2024-07-15'),
      reviewStartedAt: new Date('2024-07-20'),
      complianceChecks: [],
      auditTrail: [],
      createdAt: new Date('2024-07-15'),
      updatedAt: new Date('2024-07-23'),
      dueDiligenceDocuments: []
  },

  // Application 2
  {
      id: 'app-002',
      smeId: 'user-001',
      smeOrganizationId: 'org-1',
      funderId: 'funder-user-003',
      funderOrganizationId: 'funder-org-002',
      opportunityId: 'opp-003',
      applicationNumber: 'APP-2024-002',
      title: 'Working Capital Facility',
      description: 'Short-term working capital facility to support seasonal business fluctuations.',
      requestedAmount: 1500000,
      currency: 'ZAR',
      fundingType: 'debt',
      useOfFunds: [
          {
              category: 'working_capital',
              description: 'Inventory purchase for peak season',
              amount: 1200000,
              percentage: 80,
              timeline: '3 months',
              priority: 'high',
              justification: 'Essential for meeting Q4 demand',
              expectedImpact: 'Support 300% increase in Q4 sales'
          },
          {
              category: 'equipment',
              description: 'Additional warehouse equipment',
              amount: 300000,
              percentage: 20,
              timeline: '2 months',
              priority: 'medium',
              justification: 'Improve operational efficiency',
              expectedImpact: 'Reduce fulfillment time by 40%'
          }
      ],
      purposeStatement: 'Secure working capital to handle seasonal demand surge and maintain service levels.',
      proposedTerms: {
          interestRate: 12.5,
          repaymentPeriod: 12,
          repaymentStructure: 'Monthly interest + bullet principal',
          securityOffered: 'Inventory and accounts receivable',
          personalGuarantees: true,
          reportingRequirements: 'Monthly management accounts'
      },
      smeProfileId: 'profile-001',
      swotAnalysisId: 'swot-002',
      status: 'draft',
      currentStage: {
          stage: 'submission',
          status: 'in_progress',
          startDate: new Date('2024-08-01'),
          owner: 'user-001',
          documents: ['application-form']
      },
      applicationSteps: [
          {
              id: 'step-draft',
              stepNumber: 0,
              name: 'Draft Application',
              description: 'Preparing application',
              status: 'in_progress',
              owner: 'user-001',
              requiredDocuments: ['application-form'],
              deliverables: []
          }
      ],
      assignedReviewer: undefined,
      reviewTeam: [],
      reviewNotes: [],
      messagesThread: 'thread-002',
      complianceChecks: [],
      auditTrail: [],
      createdAt: new Date('2024-08-01'),
      updatedAt: new Date('2024-08-05'),
      dueDiligenceDocuments: []
  },

  // Application 3
  {
      id: 'app-003',
      smeId: 'user-001',
      smeOrganizationId: 'org-1',
      funderId: 'funder-user-004',
      funderOrganizationId: 'funder-org-003',
      opportunityId: 'opp-002',
      applicationNumber: 'APP-2024-003',
      title: 'Equipment Finance for Manufacturing Expansion',
      description: 'Equipment financing for new manufacturing line to increase production capacity.',
      requestedAmount: 3000000,
      currency: 'ZAR',
      fundingType: 'debt',
      useOfFunds: [
          {
              category: 'equipment',
              description: 'Manufacturing equipment purchase',
              amount: 3000000,
              percentage: 100,
              timeline: '1 month',
              priority: 'high',
              justification: 'Core business expansion requirement',
              expectedImpact: 'Double production capacity'
          }
      ],
      purposeStatement: 'Acquire specialized manufacturing equipment to meet growing demand and expand into new product lines.',
      proposedTerms: {
          interestRate: 10.5,
          repaymentPeriod: 60,
          repaymentStructure: 'Monthly principal and interest',
          securityOffered: 'Equipment being financed',
          personalGuarantees: false,
          reportingRequirements: 'Quarterly financial statements'
      },
      smeProfileId: 'profile-001',
      swotAnalysisId: 'swot-003',
      status: 'approved',
      currentStage: {
          stage: 'funding',
          status: 'completed',
          startDate: new Date('2024-06-15'),
          endDate: new Date('2024-07-10'),
          owner: 'funder-user-004',
          documents: ['final-docs', 'legal-review']
      },
      applicationSteps: [
          {
              id: 'step-submit',
              stepNumber: 1,
              name: 'Application Submitted',
              description: 'Application successfully submitted',
              status: 'completed',
              completedDate: new Date('2024-06-01'),
              owner: 'user-001',
              requiredDocuments: [],
              deliverables: []
          },
          {
              id: 'step-review',
              stepNumber: 2,
              name: 'Initial Review',
              description: 'Investment team conducts initial review',
              status: 'completed',
              completedDate: new Date('2024-06-10'),
              owner: 'funder-user-004',
              requiredDocuments: [],
              deliverables: ['review-report']
          },
          {
              id: 'step-due-diligence',
              stepNumber: 3,
              name: 'Due Diligence',
              description: 'Comprehensive due diligence process',
              status: 'completed',
              completedDate: new Date('2024-06-25'),
              owner: 'funder-user-004',
              requiredDocuments: [],
              deliverables: []
          },
          {
              id: 'step-committee',
              stepNumber: 4,
              name: 'Investment Committee',
              description: 'Investment committee review and approval',
              status: 'completed',
              completedDate: new Date('2024-07-05'),
              owner: 'committee',
              requiredDocuments: [],
              deliverables: []
          },
          {
              id: 'step-approved',
              stepNumber: 5,
              name: 'Approved',
              description: 'Application approved',
              status: 'completed',
              completedDate: new Date('2024-07-10'),
              owner: 'funder-user-004',
              requiredDocuments: [],
              deliverables: []
          }
      ],
      matchScore: 94,
      assignedReviewer: 'funder-user-004',
      reviewTeam: ['funder-user-004'],
      reviewNotes: [
          {
              id: 'note-003',
              reviewerId: 'funder-user-004',
              reviewerName: 'Michael Roberts',
              category: 'general',
              content: 'Excellent application. Strong business case, good collateral coverage.',
              sentiment: 'positive',
              isPrivate: false,
              tags: ['excellent', 'strong-case'],
              createdAt: new Date('2024-06-12')
          }
      ],
      messagesThread: 'thread-003',
      lastCommunication: new Date('2024-07-10'),
      submittedAt: new Date('2024-06-01'),
      reviewStartedAt: new Date('2024-06-05'),
      complianceChecks: [],
      auditTrail: [],
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-07-10'),
      dueDiligenceDocuments: []
  }
];
