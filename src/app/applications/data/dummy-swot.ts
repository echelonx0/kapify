import { SWOTAnalysis } from "../../shared/models/swot.models";

export const dummySWOTAnalyses: SWOTAnalysis[] = [
  {
    id: 'swot-001',
    smeId: 'user-001',
    applicationId: 'app-001',
    profileId: 'profile-001',
    
    strengths: [
      {
        id: 'str-001',
        category: 'strengths',
        title: 'Strong Technical Team',
        description: 'Experienced development team with fintech expertise',
        evidence: '15+ years combined experience, 3 senior developers with banking background',
        impact: 'high',
        controllability: 'high',
        priority: 1,
        urgency: 'medium',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Showcase team credentials in pitch', 'Consider technical advisory board'],
        leverageStrategy: 'Leverage team expertise for rapid product development and market credibility',
        relatedFinancialMetrics: ['Development cost efficiency', 'Time to market'],
        relatedBusinessPlanAreas: ['Technology roadmap', 'Team structure'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      },
      {
        id: 'str-002',
        category: 'strengths',
        title: 'First-Mover Advantage',
        description: 'Early entry into SA digital payments market',
        evidence: 'Product launched 6 months before major competitors',
        impact: 'high',
        controllability: 'medium',
        priority: 2,
        urgency: 'high',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Build network effects', 'Establish brand recognition'],
        leverageStrategy: 'Capitalize on early market position to build defensible moats',
        relatedFinancialMetrics: ['Market share', 'Customer acquisition cost'],
        relatedBusinessPlanAreas: ['Go-to-market strategy', 'Competitive positioning'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      },
      {
        id: 'str-003',
        category: 'strengths',
        title: 'Strong Early Customer Adoption',
        description: 'High user engagement and positive feedback',
        evidence: '2,500+ active users, 4.8/5 app store rating, 85% monthly retention',
        impact: 'high',
        controllability: 'high',
        priority: 1,
        urgency: 'low',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: false,
        leverageStrategy: 'Use customer testimonials and metrics to drive investor confidence',
        relatedFinancialMetrics: ['Monthly recurring revenue', 'Customer lifetime value'],
        relatedBusinessPlanAreas: ['Customer acquisition', 'Product-market fit'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      }
    ],
    
    weaknesses: [
      {
        id: 'weak-001',
        category: 'weaknesses',
        title: 'Limited Financial Resources',
        description: 'Current runway only extends 8 months without additional funding',
        evidence: 'Current burn rate R350k/month, R2.8M remaining capital',
        impact: 'critical',
        controllability: 'medium',
        priority: 1,
        urgency: 'high',
        strategicRelevance: 'high',
        investmentRelevance: 'medium',
        actionRequired: true,
        suggestedActions: ['Secure bridge funding', 'Reduce burn rate', 'Accelerate revenue generation'],
        mitigationStrategy: 'Immediate fundraising combined with operational efficiency improvements',
        relatedFinancialMetrics: ['Burn rate', 'Runway', 'Cash position'],
        relatedBusinessPlanAreas: ['Financial projections', 'Funding strategy'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      },
      {
        id: 'weak-002',
        category: 'weaknesses',
        title: 'Regulatory Compliance Gaps',
        description: 'Some regulatory requirements still pending completion',
        evidence: 'POPIA compliance 80% complete, FSB registration in progress',
        impact: 'high',
        controllability: 'high',
        priority: 2,
        urgency: 'high',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Complete POPIA compliance', 'Accelerate FSB registration'],
        mitigationStrategy: 'Dedicated compliance workstream with external legal support',
        relatedFinancialMetrics: ['Compliance costs', 'Legal expenses'],
        relatedBusinessPlanAreas: ['Risk management', 'Regulatory strategy'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      }
    ],
    
    opportunities: [
      {
        id: 'opp-001',
        category: 'opportunities',
        title: 'Growing Digital Payments Market',
        description: 'SA digital payments market growing 25% annually',
        evidence: 'FNB digital payments up 30% YoY, PayShap adoption accelerating',
        impact: 'high',
        probability: 'high',
        controllability: 'low',
        priority: 1,
        urgency: 'high',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Accelerate market penetration', 'Build strategic partnerships'],
        leverageStrategy: 'Position as the leading innovator in the growing digital payments space',
        relatedFinancialMetrics: ['Total addressable market', 'Market share'],
        relatedBusinessPlanAreas: ['Market analysis', 'Revenue projections'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      },
      {
        id: 'opp-002',
        category: 'opportunities',
        title: 'Corporate Partnership Opportunities',
        description: 'Banks seeking fintech partnerships for innovation',
        evidence: 'Discovery Bank, TymeBank actively partnering with fintechs',
        impact: 'high',
        probability: 'medium',
        controllability: 'medium',
        priority: 2,
        urgency: 'medium',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Develop partnership strategy', 'Engage with bank innovation teams'],
        leverageStrategy: 'Leverage partnerships for distribution, credibility, and funding',
        relatedFinancialMetrics: ['Partnership revenue', 'Customer acquisition through partners'],
        relatedBusinessPlanAreas: ['Partnership strategy', 'Business development'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      }
    ],
    
    threats: [
      {
        id: 'threat-001',
        category: 'threats',
        title: 'Regulatory Changes',
        description: 'Potential new regulations on fintech companies',
        evidence: 'SARB consultation paper on crypto and digital payments',
        impact: 'high',
        probability: 'medium',
        controllability: 'low',
        priority: 1,
        urgency: 'medium',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Monitor regulatory developments', 'Engage with industry bodies'],
        mitigationStrategy: 'Stay ahead of regulatory curve through proactive compliance',
        relatedFinancialMetrics: ['Compliance costs', 'Regulatory risk reserves'],
        relatedBusinessPlanAreas: ['Risk management', 'Regulatory strategy'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      },
      {
        id: 'threat-002',
        category: 'threats',
        title: 'Big Tech Competition',
        description: 'Google Pay, Apple Pay expanding in SA market',
        evidence: 'Google Pay launched in SA, Apple Pay rumored for 2025',
        impact: 'high',
        probability: 'high',
        controllability: 'low',
        priority: 2,
        urgency: 'high',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Differentiate product offering', 'Focus on unique value proposition'],
        mitigationStrategy: 'Compete on specialized features and local market understanding',
        relatedFinancialMetrics: ['Customer retention rate', 'Competitive positioning metrics'],
        relatedBusinessPlanAreas: ['Competitive strategy', 'Product differentiation'],
        createdBy: 'user-001',
        createdAt: new Date('2024-07-10')
      }
    ],
    
    strategicMatrix: {
      soStrategies: [
        {
          id: 'so-001',
          type: 'SO',
          title: 'Leverage Technical Expertise for Market Leadership',
          description: 'Use strong technical team to capitalize on growing digital payments market',
          relatedStrengths: ['str-001', 'str-002'],
          relatedOpportunities: ['opp-001'],
          implementationPlan: 'Accelerate product development while building market awareness and strategic partnerships',
          requiredResources: 'Development team (R2M), Marketing budget (R1M), Partnership resources (R500k)',
          timeline: '6-12 months',
          expectedOutcome: 'Establish market leadership position with 15% market share',
          successMetrics: ['Market share growth', 'Product feature leadership', 'Partnership count'],
          priority: 'high',
          feasibility: 'high',
          impact: 'high',
          fundingRequired: true,
          estimatedCost: 3500000,
          expectedROI: 250
        }
      ],
      woStrategies: [
        {
          id: 'wo-001',
          type: 'WO',
          title: 'Partnership-Driven Compliance Strategy',
          description: 'Use corporate partnerships to address compliance gaps and funding needs',
          relatedWeaknesses: ['weak-001', 'weak-002'],
          relatedOpportunities: ['opp-002'],
          implementationPlan: 'Identify strategic partners who can provide compliance support and funding through partnership deals',
          requiredResources: 'Business development team (R800k), Legal support (R400k), Compliance expertise (R600k)',
          timeline: '3-6 months',
          expectedOutcome: 'Accelerated compliance and funding through strategic partnerships',
          successMetrics: ['Partnership deals signed', 'Compliance milestones achieved', 'Funding secured'],
          priority: 'high',
          feasibility: 'medium',
          impact: 'high',
          fundingRequired: true,
          estimatedCost: 1800000,
          expectedROI: 180
        }
      ],
      stStrategies: [
        {
          id: 'st-001',
          type: 'ST',
          title: 'First-Mover Defensive Strategy',
          description: 'Use first-mover advantage to build defenses against Big Tech competition',
          relatedStrengths: ['str-002', 'str-003'],
          relatedThreats: ['threat-002'],
          implementationPlan: 'Build switching costs through network effects, loyalty programs, and strong brand positioning',
          requiredResources: 'Product development (R1.5M), Customer loyalty programs (R800k), Brand building (R1.2M)',
          timeline: '12-18 months',
          expectedOutcome: 'Strong market position resistant to Big Tech competition',
          successMetrics: ['Customer retention rate', 'Net promoter score', 'Brand recognition'],
          priority: 'medium',
          feasibility: 'high',
          impact: 'high',
          fundingRequired: true,
          estimatedCost: 3500000,
          expectedROI: 200
        }
      ],
      wtStrategies: [
        {
          id: 'wt-001',
          type: 'WT',
          title: 'Risk Mitigation and Survival Strategy',
          description: 'Address financial constraints while preparing for regulatory changes',
          relatedWeaknesses: ['weak-001', 'weak-002'],
          relatedThreats: ['threat-001'],
          implementationPlan: 'Secure immediate bridge funding while completing compliance requirements and establishing regulatory monitoring',
          requiredResources: 'Emergency funding (R2M), Compliance resources (R500k), Legal support (R300k)',
          timeline: '3-6 months',
          expectedOutcome: 'Stabilized operations with full regulatory compliance',
          successMetrics: ['Runway extended', 'Compliance completion rate', 'Regulatory risk score'],
          priority: 'high',
          feasibility: 'medium',
          impact: 'medium',
          fundingRequired: true,
          estimatedCost: 2800000,
          expectedROI: 120
        }
      ]
    },
    
    keyInsights: [
      'Strong technical foundation provides competitive advantage but needs immediate funding support',
      'Market timing is excellent but window of opportunity may be limited',
      'Regulatory compliance is critical for investor confidence and market access',
      'Partnership strategy could address multiple weaknesses simultaneously'
    ],
    
    actionPlan: [
      {
        id: 'action-001',
        title: 'Secure Bridge Funding',
        description: 'Secure 6-month bridge funding to extend runway',
        sourceCategory: 'weaknesses',
        sourceSWOTItems: ['weak-001'],
        actionType: 'mitigate',
        priority: 'high',
        implementationSteps: [
          {
            step: 1,
            description: 'Prepare pitch deck and financial documentation',
            dueDate: new Date('2024-08-01'),
            status: 'completed',
            owner: 'user-001',
            deliverables: ['Pitch deck', 'Financial statements', 'Due diligence folder']
          },
          {
            step: 2,
            description: 'Reach out to existing investors and angels',
            dueDate: new Date('2024-08-10'),
            status: 'in_progress',
            owner: 'user-001',
            deliverables: ['Investor meetings scheduled', 'Term sheet negotiations']
          },
          {
            step: 3,
            description: 'Close bridge funding round',
            dueDate: new Date('2024-08-15'),
            status: 'pending',
            owner: 'user-001',
            deliverables: ['Signed term sheet', 'Funds in bank account']
          }
        ],
        requiredResources: [
          {
            type: 'human',
            description: 'Management time for fundraising',
            estimatedCost: 50000,
            availability: 'available',
            priority: 'critical'
          },
          {
            type: 'financial',
            description: 'Legal and advisory fees',
            estimatedCost: 150000,
            availability: 'needs_funding',
            priority: 'important'
          }
        ],
        timeline: {
          startDate: new Date('2024-07-15'),
          endDate: new Date('2024-08-15'),
          phases: [
            {
              name: 'Preparation',
              startDate: new Date('2024-07-15'),
              endDate: new Date('2024-08-01'),
              deliverables: ['Documentation complete', 'Investor list prepared']
            },
            {
              name: 'Outreach',
              startDate: new Date('2024-08-01'),
              endDate: new Date('2024-08-10'),
              deliverables: ['Meetings conducted', 'Interest confirmed']
            },
            {
              name: 'Closing',
              startDate: new Date('2024-08-10'),
              endDate: new Date('2024-08-15'),
              deliverables: ['Terms agreed', 'Funds received']
            }
          ]
        },
        successMetrics: [
          {
            name: 'Funding Amount',
            description: 'Total bridge funding secured',
            targetValue: 2000000,
            unit: 'ZAR',
            measurementFrequency: 'weekly',
            dataSource: 'Bank statements',
            currentValue: 0
          },
          {
            name: 'Runway Extension',
            description: 'Additional months of runway',
            targetValue: 6,
            unit: 'months',
            measurementFrequency: 'monthly',
            dataSource: 'Financial model',
            currentValue: 8
          }
        ],
        milestones: [
          {
            name: 'Investor Meetings Completed',
            description: 'All target investors have been pitched',
            targetDate: new Date('2024-08-08'),
            status: 'pending',
            successCriteria: ['10+ investor meetings', 'At least 3 interested parties']
          },
          {
            name: 'Term Sheet Signed',
            description: 'Bridge funding terms agreed',
            targetDate: new Date('2024-08-12'),
            status: 'pending',
            successCriteria: ['Signed term sheet', 'Acceptable valuation and terms']
          }
        ],
        owner: 'user-001',
        stakeholders: ['CFO', 'Board members', 'Legal counsel'],
        status: 'in_progress',
        completionPercentage: 35,
        requiresFunding: false,
        fundingPriority: 'high',
        createdAt: new Date('2024-07-10'),
        updatedAt: new Date('2024-07-25')
      },
      {
        id: 'action-002',
        title: 'Complete Regulatory Compliance',
        description: 'Finalize POPIA compliance and FSB registration',
        sourceCategory: 'weaknesses',
        sourceSWOTItems: ['weak-002', 'threat-001'],
        actionType: 'mitigate',
        priority: 'high',
        implementationSteps: [
          {
            step: 1,
            description: 'Complete POPIA compliance assessment',
            dueDate: new Date('2024-08-20'),
            status: 'in_progress',
            owner: 'compliance-lead',
            deliverables: ['POPIA compliance certificate', 'Updated privacy policy']
          },
          {
            step: 2,
            description: 'Submit FSB registration documents',
            dueDate: new Date('2024-09-01'),
            status: 'pending',
            owner: 'compliance-lead',
            dependencies: [1],
            deliverables: ['FSB application submitted', 'Supporting documentation']
          },
          {
            step: 3,
            description: 'Obtain FSB approval',
            dueDate: new Date('2024-09-15'),
            status: 'pending',
            owner: 'compliance-lead',
            dependencies: [2],
            deliverables: ['FSB registration approval', 'License certificate']
          }
        ],
        requiredResources: [
          {
            type: 'expertise',
            description: 'Legal and compliance consulting',
            estimatedCost: 400000,
            availability: 'needs_acquisition',
            priority: 'critical'
          },
          {
            type: 'human',
            description: 'Internal compliance coordinator',
            estimatedCost: 200000,
            availability: 'available',
            priority: 'important'
          }
        ],
        timeline: {
          startDate: new Date('2024-07-15'),
          endDate: new Date('2024-09-15'),
          phases: [
            {
              name: 'POPIA Compliance',
              startDate: new Date('2024-07-15'),
              endDate: new Date('2024-08-20'),
              deliverables: ['Gap analysis complete', 'Compliance measures implemented']
            },
            {
              name: 'FSB Registration',
              startDate: new Date('2024-08-20'),
              endDate: new Date('2024-09-15'),
              deliverables: ['Application submitted', 'Approval received']
            }
          ]
        },
        successMetrics: [
          {
            name: 'POPIA Compliance Score',
            description: 'Percentage of POPIA requirements met',
            targetValue: 100,
            unit: 'percentage',
            measurementFrequency: 'weekly',
            dataSource: 'Compliance audit',
            currentValue: 80
          },
          {
            name: 'FSB Registration Status',
            description: 'FSB registration approval status',
            targetValue: 1,
            unit: 'boolean',
            measurementFrequency: 'weekly',
            dataSource: 'FSB correspondence',
            currentValue: 0
          }
        ],
        milestones: [
          {
            name: 'POPIA Compliance Certified',
            description: 'Full POPIA compliance achieved',
            targetDate: new Date('2024-08-20'),
            status: 'pending',
            successCriteria: ['100% compliance score', 'External audit passed']
          },
          {
            name: 'FSB Registration Approved',
            description: 'FSB license obtained',
            targetDate: new Date('2024-09-15'),
            status: 'pending',
            successCriteria: ['License certificate received', 'All conditions met']
          }
        ],
        owner: 'compliance-lead',
        stakeholders: ['Legal counsel', 'CEO', 'CTO'],
        status: 'in_progress',
        completionPercentage: 60,
        requiresFunding: true,
        estimatedCost: 600000,
        fundingPriority: 'high',
        createdAt: new Date('2024-07-10'),
        updatedAt: new Date('2024-07-20')
      }
    ],
    
    swotScores: {
      strengthsScore: 85,
      weaknessesScore: 65,
      opportunitiesScore: 90,
      threatsScore: 70,
      overallScore: 82,
      investorReadinessImpact: 78,
      industryComparison: {
        industry: 'Fintech',
        benchmarkSource: 'Industry SWOT database',
        relativePosition: 'above_average',
        keyDifferentiators: ['Technical expertise', 'Market timing', 'Early adoption']
      }
    },
    
    priorityMatrix: {
      quickWins: [
        {
          swotItemId: 'str-003',
          title: 'Strong Early Customer Adoption',
          category: 'strengths',
          impact: 'high',
          controllability: 'high',
          investmentRelevance: 'high'
        }
      ],
      strategicInitiatives: [
        {
          swotItemId: 'weak-001',
          title: 'Limited Financial Resources',
          category: 'weaknesses',
          impact: 'critical',
          controllability: 'medium',
          investmentRelevance: 'low'
        },
        {
          swotItemId: 'opp-001',
          title: 'Growing Digital Payments Market',
          category: 'opportunities',
          impact: 'high',
          controllability: 'low',
          investmentRelevance: 'high'
        }
      ],
      fillInProjects: [
        {
          swotItemId: 'str-001',
          title: 'Strong Technical Team',
          category: 'strengths',
          impact: 'high',
          controllability: 'high',
          investmentRelevance: 'high'
        }
      ],
      monitorItems: [
        {
          swotItemId: 'threat-001',
          title: 'Regulatory Changes',
          category: 'threats',
          impact: 'high',
          controllability: 'low',
          investmentRelevance: 'high'
        }
      ]
    },
    
    analysisContext: {
      industryContext: 'South African Fintech sector experiencing rapid growth',
      competitiveContext: 'Early stage market with few established players',
      economicContext: 'Post-COVID digital transformation driving adoption',
      marketConditions: 'Favorable for innovative payment solutions',
      timeframe: '12 months - subject to quarterly review'
    },
    
    completedBy: 'user-001',
    version: 1,
    isTemplate: false,
    
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-07-15')
  },
  
  // Second SWOT for app-002
  {
    id: 'swot-002',
    smeId: 'user-001',
    applicationId: 'app-002',
    profileId: 'profile-001',
    
    strengths: [
      {
        id: 'str-004',
        category: 'strengths',
        title: 'Established Customer Base',
        description: 'Loyal customer base with predictable seasonal patterns',
        evidence: '500+ recurring customers, 3-year average relationship',
        impact: 'medium',
        controllability: 'high',
        priority: 1,
        urgency: 'low',
        strategicRelevance: 'high',
        investmentRelevance: 'medium',
        actionRequired: false,
        leverageStrategy: 'Maximize seasonal opportunities with existing customers',
        relatedFinancialMetrics: ['Customer lifetime value', 'Repeat purchase rate'],
        relatedBusinessPlanAreas: ['Customer retention', 'Revenue forecasting'],
        createdBy: 'user-001',
        createdAt: new Date('2024-08-01')
      }
    ],
    
    weaknesses: [
      {
        id: 'weak-003',
        category: 'weaknesses',
        title: 'Seasonal Cash Flow Volatility',
        description: 'Significant cash flow variations between seasons',
        evidence: 'Q4 revenue 300% of Q2, working capital gaps',
        impact: 'high',
        controllability: 'medium',
        priority: 1,
        urgency: 'high',
        strategicRelevance: 'high',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Implement cash flow forecasting', 'Diversify revenue streams'],
        mitigationStrategy: 'Working capital facility to smooth seasonal variations',
        relatedFinancialMetrics: ['Working capital', 'Cash conversion cycle'],
        relatedBusinessPlanAreas: ['Financial management', 'Revenue diversification'],
        createdBy: 'user-001',
        createdAt: new Date('2024-08-01')
      }
    ],
    
    opportunities: [
      {
        id: 'opp-003',
        category: 'opportunities',
        title: 'Peak Season Demand',
        description: 'Q4 seasonal surge provides growth opportunity',
        evidence: 'Historical Q4 growth of 250-300%',
        impact: 'high',
        probability: 'high',
        controllability: 'medium',
        priority: 1,
        urgency: 'high',
        strategicRelevance: 'medium',
        investmentRelevance: 'high',
        actionRequired: true,
        suggestedActions: ['Prepare inventory', 'Scale operations'],
        leverageStrategy: 'Maximize seasonal revenue opportunity',
        relatedFinancialMetrics: ['Seasonal revenue', 'Inventory turnover'],
        relatedBusinessPlanAreas: ['Operations planning', 'Inventory management'],
        createdBy: 'user-001',
        createdAt: new Date('2024-08-01')
      }
    ],
    
    threats: [
      {
        id: 'threat-003',
        category: 'threats',
        title: 'Supply Chain Disruptions',
        description: 'Risk of inventory shortages during peak season',
        evidence: 'Previous delays from overseas suppliers',
        impact: 'high',
        probability: 'medium',
        controllability: 'medium',
        priority: 1,
        urgency: 'high',
        strategicRelevance: 'medium',
        investmentRelevance: 'medium',
        actionRequired: true,
        suggestedActions: ['Diversify suppliers', 'Increase safety stock'],
        mitigationStrategy: 'Multiple supplier relationships and early ordering',
        relatedFinancialMetrics: ['Inventory costs', 'Stockout costs'],
        relatedBusinessPlanAreas: ['Supply chain management', 'Risk mitigation'],
        createdBy: 'user-001',
        createdAt: new Date('2024-08-01')
      }
    ],
    
    strategicMatrix: {
      soStrategies: [
        {
          id: 'so-002',
          type: 'SO',
          title: 'Leverage Customer Base for Peak Season',
          description: 'Use established customer relationships to maximize Q4 opportunities',
          relatedStrengths: ['str-004'],
          relatedOpportunities: ['opp-003'],
          implementationPlan: 'Early communication to existing customers about Q4 offerings and pre-orders',
          requiredResources: 'Marketing budget (R200k), inventory preparation (R800k)',
          timeline: '3 months',
          expectedOutcome: 'Increased Q4 revenue by 40% through existing customer base',
          successMetrics: ['Customer pre-order rate', 'Q4 revenue growth', 'Customer satisfaction'],
          priority: 'high',
          feasibility: 'high',
          impact: 'high',
          fundingRequired: true,
          estimatedCost: 1000000,
          expectedROI: 300
        }
      ],
      woStrategies: [
        {
          id: 'wo-002',
          type: 'WO',
          title: 'Working Capital Optimization',
          description: 'Address cash flow volatility while capitalizing on peak season',
          relatedWeaknesses: ['weak-003'],
          relatedOpportunities: ['opp-003'],
          implementationPlan: 'Secure working capital facility and implement cash flow management systems',
          requiredResources: 'Banking relationships, financial management systems (R300k)',
          timeline: '2 months',
          expectedOutcome: 'Smooth cash flow operations and maximized seasonal opportunities',
          successMetrics: ['Cash flow variance', 'Working capital efficiency', 'Revenue capture'],
          priority: 'high',
          feasibility: 'medium',
          impact: 'high',
          fundingRequired: true,
          estimatedCost: 300000,
          expectedROI: 200
        }
      ],
      stStrategies: [
        {
          id: 'st-002',
          type: 'ST',
          title: 'Supply Chain Risk Mitigation',
          description: 'Use customer loyalty to build resilience against supply disruptions',
          relatedStrengths: ['str-004'],
          relatedThreats: ['threat-003'],
          implementationPlan: 'Build supplier diversity while maintaining customer communication about potential impacts',
          requiredResources: 'Supplier development (R400k), inventory management (R600k)',
          timeline: '6 months',
          expectedOutcome: 'Resilient supply chain with maintained customer satisfaction',
          successMetrics: ['Supplier diversity index', 'Stockout incidents', 'Customer retention'],
          priority: 'medium',
          feasibility: 'high',
          impact: 'medium',
          fundingRequired: true,
          estimatedCost: 1000000,
          expectedROI: 150
        }
      ],
      wtStrategies: [
        {
          id: 'wt-002',
          type: 'WT',
          title: 'Cash Flow and Supply Risk Management',
          description: 'Address both cash flow volatility and supply chain risks',
          relatedWeaknesses: ['weak-003'],
          relatedThreats: ['threat-003'],
          implementationPlan: 'Implement integrated cash flow and inventory management with supplier diversification',
          requiredResources: 'Working capital facility (R1.5M), supplier development (R500k)',
          timeline: '4 months',
          expectedOutcome: 'Stable operations resilient to seasonal and supply chain risks',
          successMetrics: ['Cash flow stability', 'Supply reliability', 'Operational continuity'],
          priority: 'high',
          feasibility: 'medium',
          impact: 'high',
          fundingRequired: true,
          estimatedCost: 2000000,
          expectedROI: 180
        }
      ]
    },
    
    keyInsights: [
      'Working capital facility essential for seasonal business model',
      'Strong customer relationships provide stable foundation',
      'Timing critical for peak season preparation'
    ],
    
    actionPlan: [
      {
        id: 'action-003',
        title: 'Secure Working Capital Facility',
        description: 'Arrange R1.5M working capital facility',
        sourceCategory: 'weaknesses',
        sourceSWOTItems: ['weak-003', 'opp-003'],
        actionType: 'mitigate',
        priority: 'high',
        implementationSteps: [
          {
            step: 1,
            description: 'Prepare financial documentation for bank',
            dueDate: new Date('2024-08-10'),
            status: 'completed',
            owner: 'user-001',
            deliverables: ['Financial statements', 'Cash flow projections', 'Business plan']
          },
          {
            step: 2,
            description: 'Submit working capital facility application',
            dueDate: new Date('2024-08-15'),
            status: 'in_progress',
            owner: 'user-001',
            dependencies: [1],
            deliverables: ['Application submitted', 'Bank meetings scheduled']
          },
          {
            step: 3,
            description: 'Negotiate terms and close facility',
            dueDate: new Date('2024-08-20'),
            status: 'pending',
            owner: 'user-001',
            dependencies: [2],
            deliverables: ['Facility agreement signed', 'Credit line available']
          }
        ],
        requiredResources: [
          {
            type: 'financial',
            description: 'Bank fees and legal costs',
            estimatedCost: 75000,
            availability: 'needs_funding',
            priority: 'important'
          },
          {
            type: 'human',
            description: 'Management time for bank negotiations',
            estimatedCost: 25000,
            availability: 'available',
            priority: 'critical'
          }
        ],
        timeline: {
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-08-20'),
          phases: [
            {
              name: 'Documentation',
              startDate: new Date('2024-08-01'),
              endDate: new Date('2024-08-10'),
              deliverables: ['Financial package complete', 'Bank selection finalized']
            },
            {
              name: 'Application',
              startDate: new Date('2024-08-10'),
              endDate: new Date('2024-08-15'),
              deliverables: ['Application submitted', 'Initial bank feedback']
            },
            {
              name: 'Negotiation',
              startDate: new Date('2024-08-15'),
              endDate: new Date('2024-08-20'),
              deliverables: ['Terms negotiated', 'Facility activated']
            }
          ]
        },
        successMetrics: [
          {
            name: 'Facility Amount',
            description: 'Working capital facility approved',
            targetValue: 1500000,
            unit: 'ZAR',
            measurementFrequency: 'weekly',
            dataSource: 'Bank correspondence',
            currentValue: 0
          },
          {
            name: 'Interest Rate',
            description: 'Cost of working capital',
            targetValue: 12,
            unit: 'percentage',
            measurementFrequency: 'monthly',
            dataSource: 'Facility agreement',
            currentValue: 0
          }
        ],
        milestones: [
          {
            name: 'Bank Application Submitted',
            description: 'Complete application package submitted to bank',
            targetDate: new Date('2024-08-15'),
            status: 'pending',
            successCriteria: ['All documentation submitted', 'Bank confirms receipt']
          },
          {
            name: 'Facility Approved',
            description: 'Working capital facility approved and available',
            targetDate: new Date('2024-08-20'),
            status: 'pending',
            successCriteria: ['Signed facility agreement', 'Credit line active']
          }
        ],
        owner: 'user-001',
        stakeholders: ['CFO', 'Bank relationship manager'],
        status: 'in_progress',
        completionPercentage: 25,
        requiresFunding: false,
        fundingPriority: 'high',
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-08-05')
      }
    ],
    
    swotScores: {
      strengthsScore: 70,
      weaknessesScore: 75,
      opportunitiesScore: 85,
      threatsScore: 60,
      overallScore: 72,
      investorReadinessImpact: 68,
      industryComparison: {
        industry: 'Retail',
        benchmarkSource: 'Retail industry benchmarks',
        relativePosition: 'average',
        keyDifferentiators: ['Customer loyalty', 'Seasonal expertise']
      }
    },
    
    priorityMatrix: {
      quickWins: [
        {
          swotItemId: 'str-004',
          title: 'Established Customer Base',
          category: 'strengths',
          impact: 'medium',
          controllability: 'high',
          investmentRelevance: 'medium'
        }
      ],
      strategicInitiatives: [
        {
          swotItemId: 'weak-003',
          title: 'Seasonal Cash Flow Volatility',
          category: 'weaknesses',
          impact: 'high',
          controllability: 'medium',
          investmentRelevance: 'high'
        },
        {
          swotItemId: 'opp-003',
          title: 'Peak Season Demand',
          category: 'opportunities',
          impact: 'high',
          controllability: 'medium',
          investmentRelevance: 'high'
        }
      ],
      fillInProjects: [
        {
          swotItemId: 'threat-003',
          title: 'Supply Chain Disruptions',
          category: 'threats',
          impact: 'high',
          controllability: 'medium',
          investmentRelevance: 'medium'
        }
      ],
      monitorItems: []
    },
    
    analysisContext: {
      industryContext: 'Retail sector with strong seasonal patterns',
      competitiveContext: 'Established market position',
      economicContext: 'Consumer spending showing resilience',
      marketConditions: 'Favorable for seasonal businesses',
      timeframe: '6 months - seasonal focus'
    },
    
    completedBy: 'user-001',
    version: 1,
    isTemplate: false,
    
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-05')
  }
];