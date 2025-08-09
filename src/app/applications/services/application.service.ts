// // src/app/applications/services/application.service.ts
// import { Injectable, signal } from '@angular/core';
// import { Observable, of, delay } from 'rxjs';
// import { Application, ApplicationStatus } from '../../shared/models/application.models';

// @Injectable({
//   providedIn: 'root'
// })
// export class ApplicationService {
//   private applications = signal<Application[]>([]);

//   constructor() {
//     this.initializeMockData();
//   }

//   getApplication(id: string): Observable<Application> {
//     const application = this.applications().find(app => app.id === id);
//     if (application) {
//       return of(application).pipe(delay(300));
//     }
//     throw new Error('Application not found');
//   }

//   getApplications(): Observable<Application[]> {
//     return of(this.applications()).pipe(delay(300));
//   }

//   updateApplication(id: string, updates: Partial<Application>): Observable<Application> {
//     const applications = this.applications();
//     const index = applications.findIndex(app => app.id === id);
    
//     if (index === -1) {
//       throw new Error('Application not found');
//     }

//     const updatedApplication = {
//       ...applications[index],
//       ...updates,
//       updatedAt: new Date()
//     };

//     this.applications.update(apps => 
//       apps.map(app => app.id === id ? updatedApplication : app)
//     );

//     return of(updatedApplication).pipe(delay(300));
//   }

//   updateApplicationStatus(id: string, status: ApplicationStatus, reason?: string): Observable<Application> {
//     return this.updateApplication(id, {
//       status,
//       decisionReason: reason,
//       decisionDate: new Date()
//     });
//   }

//   private initializeMockData() {
//     const mockApplication: Application = {
//       id: '685188774651fc1b3b9f7cca',
//       smeId: 'sme-123',
//       smeOrganizationId: 'sme-org-123',
//       funderId: 'funder-123',
//       funderOrganizationId: 'bokamoso-private-equity',
//       opportunityId: 'opportunity-pif',

//       applicationNumber: 'APP-2024-001',
//       title: 'The Prosperity Impact Fund (PIF) Application',
//       description: 'Application for debt funding to expand operations and increase working capital',

//       requestedAmount: 1500000,
//       currency: 'ZAR',
//       fundingType: 'debt',

//       useOfFunds: [
//         {
//           category: 'working_capital',
//           description: 'Increase inventory and manage cash flow',
//           amount: 750000,
//           percentage: 50,
//           timeline: '6 months',
//           priority: 'high',
//           justification: 'Essential for meeting increased demand',
//           expectedImpact: 'Improve operational efficiency and customer satisfaction'
//         },
//         {
//           category: 'expansion',
//           description: 'Open new branch location',
//           amount: 500000,
//           percentage: 33.3,
//           timeline: '12 months',
//           priority: 'medium',
//           justification: 'Strategic expansion into new market',
//           expectedImpact: 'Increase revenue by 30% within 18 months'
//         },
//         {
//           category: 'equipment',
//           description: 'Purchase new machinery',
//           amount: 250000,
//           percentage: 16.7,
//           timeline: '3 months',
//           priority: 'medium',
//           justification: 'Replace aging equipment',
//           expectedImpact: 'Reduce maintenance costs and increase productivity'
//         }
//       ],

//       purposeStatement: 'To accelerate business growth through strategic expansion and operational improvements',

//       proposedTerms: {
//         interestRate: 12.5,
//         repaymentPeriod: 60,
//         repaymentStructure: 'Monthly payments of principal and interest',
//         securityOffered: 'Business assets and inventory',
//         personalGuarantees: true,
//         milestones: [
//           {
//             description: 'Complete branch setup',
//             targetDate: new Date(2025, 5, 30),
//             measurementCriteria: ['Branch operational and generating revenue'],
//             consequenceIfMissed: 'Delayed expansion and potential covenant breach'
//           }
//         ],
//         covenants: [
//           'Maintain debt-to-equity ratio below 2:1',
//           'Submit monthly financial statements'
//         ],
//         reportingRequirements: 'Monthly financial reports and quarterly business updates'
//       },

//       smeProfileId: 'profile-123',
//       swotAnalysisId: 'swot-123',

//       status: 'under_review',
//       currentStage: {
//         stage: 'due_diligence',
//         status: 'in_progress',
//         startDate: new Date(2024, 10, 16),
//         owner: 'reviewer-123',
//         notes: 'Detailed review of financials and business operations in progress',
//         documents: ['financial_statements', 'tax_returns', 'bank_statements']
//       },

//       applicationSteps: [
//         {
//           stepNumber: 1,
//           name: 'Administration Information',
//           description: 'Business and contact details',
//           status: 'completed',
//           completedDate: new Date(2024, 10, 15),
//           owner: 'sme-123',
//           requiredDocuments: ['company_registration', 'tax_certificate'],
//           deliverables: ['Admin info form'],
//           notes: 'All administrative details completed and verified'
//         },
//         {
//           stepNumber: 2,
//           name: 'Document Upload',
//           description: 'Required supporting documents',
//           status: 'completed',
//           completedDate: new Date(2024, 10, 16),
//           owner: 'sme-123',
//           requiredDocuments: ['financial_statements', 'business_plan'],
//           deliverables: ['All required documents'],
//           notes: 'Documents uploaded and under review'
//         },
//         {
//           stepNumber: 3,
//           name: 'Business Review',
//           description: 'Operational assessment',
//           status: 'in_progress',
//           owner: 'reviewer-123',
//           requiredDocuments: ['swot_analysis', 'market_research'],
//           deliverables: ['Business assessment report'],
//           notes: 'Currently under review by assessment team'
//         }
//       ],

//       assignedReviewer: 'reviewer-123',
//       reviewTeam: ['reviewer-123', 'analyst-456'],
//       reviewNotes: [
//         {
//           id: 'note-1',
//           reviewerId: 'reviewer-123',
//           reviewerName: 'John Smith',
//           category: 'financial',
//           content: 'Strong cash flow history, but need more detail on expansion projections',
//           sentiment: 'neutral',
//           isPrivate: true,
//           tags: ['financial', 'cash_flow', 'expansion'],
//           createdAt: new Date(2024, 10, 20)
//         }
//       ],

//       messagesThread: 'thread-123',

//       submittedAt: new Date(2024, 10, 15),
//       reviewStartedAt: new Date(2024, 10, 16),

//       complianceChecks: [
//         {
//           checkType: 'kyc',
//           status: 'passed',
//           checkedDate: new Date(2024, 10, 16),
//           checkedBy: 'compliance-officer-1'
//         },
//         {
//           checkType: 'aml',
//           status: 'passed',
//           checkedDate: new Date(2024, 10, 16),
//           checkedBy: 'compliance-officer-1'
//         }
//       ],

//       auditTrail: [
//         {
//           id: 'audit-1',
//           action: 'application_submitted',
//           entity: 'application',
//           entityId: '685188774651fc1b3b9f7cca',
//           changes: { status: 'submitted' },
//           performedBy: 'sme-123',
//           performedAt: new Date(2024, 10, 15),
//           reason: 'Initial application submission'
//         },
//         {
//           id: 'audit-2',
//           action: 'status_updated',
//           entity: 'application',
//           entityId: '685188774651fc1b3b9f7cca',
//           changes: { status: 'under_review', previousStatus: 'submitted' },
//           performedBy: 'funder-123',
//           performedAt: new Date(2024, 10, 16),
//           reason: 'Started initial review process'
//         }
//       ],

//       createdAt: new Date(2024, 10, 10),
//       updatedAt: new Date(2024, 10, 20),
//       dueDiligenceDocuments: []
//     };

//     this.applications.set([mockApplication]);
//   }
// }