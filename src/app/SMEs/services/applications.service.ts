// // src/app/applications/services/application.service.ts
// import { Injectable } from '@angular/core';
// import { Observable, delay, BehaviorSubject } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { 
//   Application, 
 
//   ApplicationStatus, 
 
//   ReviewNote, 
// } from '../../shared/models/application.models'; 
 
// @Injectable({
//   providedIn: 'root'
// })
// export class ApplicationService {
//   private applicationsSubject = new BehaviorSubject<Application[]>([]);
//   private isInitialized = false;

//   constructor() {
//     this.initializeDummyData();
//   }

//   private initializeDummyData() {
//     if (this.isInitialized) return;

 

   
//     this.isInitialized = true;
//   }

//   // Get all applications for current user
//   getApplications(): Observable<Application[]> {
//     return this.applicationsSubject.asObservable().pipe(delay(300));
//   }

//   // Get application by ID
//   getApplicationById(id: string): Observable<Application | undefined> {
//     return this.applicationsSubject.asObservable().pipe(
//       delay(400),
//       map(applications => applications.find(app => app.id === id))
//     );
//   }

//   // Get applications by opportunity ID
//   getApplicationsByOpportunity(opportunityId: string): Observable<Application[]> {
//     return this.applicationsSubject.asObservable().pipe(
//       delay(300),
//       map(applications => applications.filter(app => app.opportunityId === opportunityId))
//     );
//   }

//   // Create new application
//   createApplication(applicationData: Partial<Application>): Observable<Application> {
//     const newApplication: Application = {
//       id: `app-${Date.now()}`,
//       smeId: 'user-001', // Current user
//       smeOrganizationId: 'org-1',
//       funderId: '', // Will be assigned based on opportunity
//       funderOrganizationId: '',
//       applicationNumber: `APP-2024-${String(Date.now()).slice(-3)}`,
//       status: 'draft',
//       currentStage: {
//         id: 'stage-draft',
//         name: 'Draft',
//         description: 'Application being prepared',
//         order: 0,
//         isRequired: true,
//         status: 'in_progress',
//         assignedTo: 'user-001',
//         estimatedDuration: 7,
//         actualStartDate: new Date(),
//         requirements: ['Complete application form', 'Upload required documents']
//       },
//       applicationSteps: [],
//       reviewNotes: [],
//       reviewTeam: [],
//       useOfFunds: [],
//       complianceChecks: [],
//       auditTrail: [],
//       messagesThread: `thread-${Date.now()}`,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       ...applicationData
//     } as Application;

//     return new Observable(observer => {
//       setTimeout(() => {
//         const currentApplications = this.applicationsSubject.value;
//         this.applicationsSubject.next([...currentApplications, newApplication]);
//         observer.next(newApplication);
//         observer.complete();
//       }, 800);
//     });
//   }

//   // Update application
//   updateApplication(id: string, updates: Partial<Application>): Observable<Application> {
//     return new Observable(observer => {
//       setTimeout(() => {
//         const currentApplications = this.applicationsSubject.value;
//         const index = currentApplications.findIndex(app => app.id === id);
        
//         if (index !== -1) {
//           const updatedApplication = {
//             ...currentApplications[index],
//             ...updates,
//             updatedAt: new Date()
//           };
          
//           const newApplications = [...currentApplications];
//           newApplications[index] = updatedApplication;
//           this.applicationsSubject.next(newApplications);
          
//           observer.next(updatedApplication);
//         } else {
//           observer.error('Application not found');
//         }
//         observer.complete();
//       }, 600);
//     });
//   }

//   // Add review note
//   addReviewNote(applicationId: string, note: Omit<ReviewNote, 'id' | 'createdAt'>): Observable<ReviewNote> {
//     const newNote: ReviewNote = {
//       id: `note-${Date.now()}`,
//       createdAt: new Date(),
//       ...note
//     };

//     return new Observable(observer => {
//       setTimeout(() => {
//         const currentApplications = this.applicationsSubject.value;
//         const appIndex = currentApplications.findIndex(app => app.id === applicationId);
        
//         if (appIndex !== -1) {
//           const app = currentApplications[appIndex];
//           const updatedApp = {
//             ...app,
//             reviewNotes: [...app.reviewNotes, newNote],
//             updatedAt: new Date()
//           };
          
//           const newApplications = [...currentApplications];
//           newApplications[appIndex] = updatedApp;
//           this.applicationsSubject.next(newApplications);
          
//           observer.next(newNote);
//         } else {
//           observer.error('Application not found');
//         }
//         observer.complete();
//       }, 400);
//     });
//   }

//   // Update application status
//   updateApplicationStatus(id: string, status: ApplicationStatus, reason?: string): Observable<Application> {
//     return this.updateApplication(id, { 
//       status, 
//       decisionReason: reason,
//       decisionDate: new Date()
//     });
//   }

//   // Withdraw application
//   withdrawApplication(id: string, reason: string): Observable<Application> {
//     return this.updateApplication(id, { 
//       status: 'withdrawn',
//       decisionReason: reason,
//       decisionDate: new Date()
//     });
//   }

//   // Get applications summary stats
//   getApplicationsStats(): Observable<{
//     total: number;
//     draft: number;
//     submitted: number;
//     underReview: number;
//     approved: number;
//     rejected: number;
//   }> {
//     return this.applicationsSubject.asObservable().pipe(
//       delay(200),
//       map(applications => {
//         const stats = {
//           total: applications.length,
//           draft: 0,
//           submitted: 0,
//           underReview: 0,
//           approved: 0,
//           rejected: 0
//         };

//         applications.forEach(app => {
//           switch (app.status) {
//             case 'draft':
//               stats.draft++;
//               break;
//             case 'submitted':
//               stats.submitted++;
//               break;
//             case 'under_review':
//             case 'due_diligence':
//             case 'investment_committee':
//               stats.underReview++;
//               break;
//             case 'approved':
//             case 'funded':
//               stats.approved++;
//               break;
//             case 'rejected':
//               stats.rejected++;
//               break;
//           }
//         });

//         return stats;
//       })
//     );
//   }
// }