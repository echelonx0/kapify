// // src/app/applications/services/application-document.service.ts
// import { Injectable, signal } from '@angular/core';
// import { Observable, of, delay, throwError } from 'rxjs';
// import { DocumentSection } from '../models/application.models';

// // export interface ApplicationDocument {
// //   id: string;
// //   key: string;
// //   label: string;
// //   description: string;
// //   required: boolean;
// //   file?: File;
// //   uploaded: boolean;
// //   uploadedAt?: Date;
// //   size?: number;
// //   url?: string;
// //   version?: number;
// //   status: 'missing' | 'uploaded' | 'approved' | 'rejected';
// //   rejectionReason?: string;
// // }

// // export interface DocumentSection {
// //   id: string;
// //   title: string;
// //   description: string;
// //   expanded: boolean;
// //   documents: ApplicationDocument[];
// // }

// @Injectable({
//   providedIn: 'root'
// })
// export class ApplicationDocumentService {
//   private documentSections = signal<DocumentSection[]>([]);

//   constructor() {
//     this.initializeMockData();
//   }

//   getApplicationDocuments(applicationId: string): Observable<DocumentSection[]> {
//     // In real implementation, filter by applicationId
//     return of(this.documentSections()).pipe(delay(300));
//   }

//   uploadDocument(applicationId: string, documentId: string, file: File): Observable<{ success: boolean; url: string }> {
//     // Mock upload - in real implementation, upload to storage service
//     return of({ 
//       success: true, 
//       url: `https://storage.example.com/applications/${applicationId}/documents/${documentId}/${file.name}`
//     }).pipe(delay(2000));
//   }

//   removeDocument(applicationId: string, documentId: string): Observable<void> {
//     return of(void 0).pipe(delay(300));
//   }

// updateDocumentStatus(applicationId: string, documentId: string, status: ApplicationDocument['status'], reason?: string): Observable<ApplicationDocument> {
//   // Find and update document status
//   const sections = this.documentSections();
//   let updatedDocument: ApplicationDocument | null = null;

//   const updatedSections = sections.map(section => ({
//     ...section,
//     documents: section.documents.map(doc => {
//       if (doc.id === documentId) {
//         updatedDocument = {
//           ...doc,
//           status,
//           rejectionReason: reason
//         };
//         return updatedDocument;
//       }
//       return doc;
//     })
//   }));

//   this.documentSections.set(updatedSections);
  
//   if (updatedDocument) {
//     // return of(updatedDocument).pipe(delay(300));
//   }
  
//   return throwError(() => new Error('Document not found'));
// }

//   private initializeMockData() {
//     const mockSections: DocumentSection[] = [
//       {
//         id: 'company-documents',
//         title: 'Company Documents',
//         description: 'Core business registration and profile documents',
//         expanded: true,
//         documents: [
//           {
//             id: 'company-profile',
//             key: 'company_profile',
//             label: 'Company Profile',
//             description: 'Comprehensive business profile document',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 15),
//             size: 65536,
//             url: 'https://storage.example.com/pbp_company_profile.pdf',
//             version: 1,
//             status: 'approved'
//           },
//           {
//             id: 'ck-documents',
//             key: 'ck_documents',
//             label: 'CK Documents',
//             description: 'Company registration and compliance documents',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 15),
//             size: 85264,
//             url: 'https://storage.example.com/ck_documents.pdf',
//             version: 1,
//             status: 'approved'
//           },
//           {
//             id: 'tax-pin',
//             key: 'tax_pin',
//             label: 'Tax PIN Certificate',
//             description: 'Current tax compliance certificate',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 15),
//             size: 208896,
//             url: 'https://storage.example.com/tax_pin.pdf',
//             version: 1,
//             status: 'rejected',
//             rejectionReason: 'Document is expired. Please provide a current tax clearance certificate dated within the last 3 months.'
//           },
//           {
//             id: 'bee-prestige',
//             key: 'bee_certificate',
//             label: 'BEE Certificate',
//             description: 'B-BBEE verification certificate',
//             required: false,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 15),
//             size: 256000,
//             url: 'https://storage.example.com/bee-prestige.pdf',
//             version: 1,
//             status: 'approved'
//           },
//           {
//             id: 'share-register',
//             key: 'share_register',
//             label: 'Share Register',
//             description: 'Current shareholder register',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 16),
//             size: 49152,
//             url: 'https://storage.example.com/pbp_share_register.pdf',
//             version: 1,
//             status: 'uploaded'
//           },
//           {
//             id: 'pitch-deck-v1',
//             key: 'pitch_deck',
//             label: 'Pitch Deck',
//             description: 'Investment presentation and business overview',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 16),
//             size: 1310720,
//             url: 'https://storage.example.com/pbp_pitch_deck_v1.pdf',
//             version: 1,
//             status: 'uploaded'
//           },
//           {
//             id: 'pitch-deck-v2',
//             key: 'pitch_deck_updated',
//             label: 'Updated Pitch Deck',
//             description: 'Revised investment presentation',
//             required: false,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 18),
//             size: 1310720,
//             url: 'https://storage.example.com/pbp_pitch_deck_v2.pdf',
//             version: 2,
//             status: 'uploaded'
//           }
//         ]
//       },
//       {
//         id: 'financial-reports',
//         title: 'Financial Reports',
//         description: 'Financial statements and analysis documents',
//         expanded: false,
//         documents: [
//           {
//             id: 'management-accounts-2024',
//             key: 'management_accounts_current',
//             label: 'Management Accounts (Aug 2024)',
//             description: 'Latest monthly management accounts',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 15),
//             size: 101376,
//             url: 'https://storage.example.com/manaccs_cy_aug_2024.pdf',
//             version: 1,
//             status: 'approved'
//           },
//           {
//             id: 'afs-feb-2023',
//             key: 'annual_financial_statements_2023',
//             label: 'Annual Financial Statements (Feb 2023)',
//             description: 'Audited annual financial statements',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 15),
//             size: 254976,
//             url: 'https://storage.example.com/afs_28_feb_2023.pdf',
//             version: 1,
//             status: 'approved'
//           },
//           {
//             id: 'afs-feb-2024',
//             key: 'annual_financial_statements_2024',
//             label: 'Annual Financial Statements (Feb 2024)',
//             description: 'Most recent audited financial statements',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 15),
//             size: 254976,
//             url: 'https://storage.example.com/afs_28_feb_2024.pdf',
//             version: 1,
//             status: 'approved'
//           },
//           {
//             id: 'business-plan',
//             key: 'business_plan',
//             label: 'Business Plan',
//             description: 'Detailed business plan with financial projections',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 16),
//             size: 102400,
//             url: 'https://storage.example.com/business_plan_test_data.pdf',
//             version: 1,
//             status: 'uploaded'
//           },
//           {
//             id: 'financial-projections',
//             key: 'financial_projections',
//             label: 'Financial Projections',
//             description: '3-year financial projections spreadsheet',
//             required: true,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 16),
//             size: 107520,
//             url: 'https://storage.example.com/financial_projections.xlsx',
//             version: 1,
//             status: 'uploaded'
//           },
//           {
//             id: 'financial-proj-vs2',
//             key: 'financial_projections_v2',
//             label: 'Updated Financial Projections',
//             description: 'Revised financial model with updated assumptions',
//             required: false,
//             uploaded: true,
//             uploadedAt: new Date(2024, 10, 17),
//             size: 107520,
//             url: 'https://storage.example.com/financial_proj_vs2.xlsx',
//             version: 2,
//             status: 'uploaded'
//           }
//         ]
//       },
//       {
//         id: 'additional-requirements',
//         title: 'Additional Requirements',
//         description: 'Supplementary documents and supporting materials',
//         expanded: false,
//         documents: [
//           {
//             id: 'bank-statements',
//             key: 'bank_statements',
//             label: 'Bank Statements (6 months)',
//             description: 'Business bank statements for the last 6 months',
//             required: true,
//             uploaded: false,
//             status: 'missing'
//           },
//           {
//             id: 'trade-references',
//             key: 'trade_references',
//             label: 'Trade References',
//             description: 'References from key suppliers and customers',
//             required: false,
//             uploaded: false,
//             status: 'missing'
//           },
//           {
//             id: 'insurance-schedule',
//             key: 'insurance_schedule',
//             label: 'Insurance Schedule',
//             description: 'Current business insurance coverage details',
//             required: false,
//             uploaded: false,
//             status: 'missing'
//           }
//         ]
//       }
//     ];

//     this.documentSections.set(mockSections);
//   }
// }