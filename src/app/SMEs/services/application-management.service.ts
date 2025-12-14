// src/app/SMEs/services/application-management.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import {
  DocumentMetadata,
  SupabaseDocumentService,
} from 'src/app/shared/services/supabase-document.service';
import {
  DocumentSection,
  FundingApplication,
  ApplicationFilter,
  ApplicationStats,
  ApplicantDocument,
} from '../models/application.models';
import { ReviewNote } from '../profile/models/sme-profile.models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationManagementService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  // Loading states
  isLoading = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  error = signal<string | null>(null);
  private documentService = inject(SupabaseDocumentService);
  // Document cache to avoid repeated queries
  private documentCache = new Map<string, DocumentSection>();

  /**
   * Get all applications for a specific opportunity - ENHANCED WITH DOCUMENTS
   */
  getApplicationsByOpportunity(
    opportunityId: string,
    includeDocuments: boolean = false
  ): Observable<FundingApplication[]> {
    this.isLoading.set(true);
    this.error.set(null);

    console.log(
      'Fetching applications for opportunity:',
      opportunityId,
      'with documents:',
      includeDocuments
    );

    return from(
      this.fetchApplicationsSimplified(opportunityId, includeDocuments)
    ).pipe(
      tap((apps) => {
        console.log('Applications loaded:', apps.length);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('Error loading applications:', error);
        this.error.set('Failed to load applications');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all applications for opportunities in the funder's organization - ENHANCED WITH DOCUMENTS
   */
  getApplicationsByOrganization(
    organizationId: string,
    filter?: ApplicationFilter,
    includeDocuments: boolean = false
  ): Observable<FundingApplication[]> {
    this.isLoading.set(true);
    this.error.set(null);

    console.log('Fetching applications for organization:', organizationId);

    return from(
      this.fetchApplicationsByOrganization(
        organizationId,
        filter,
        includeDocuments
      )
    ).pipe(
      tap((apps) => {
        console.log('Organization applications loaded:', apps.length);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('Error loading organization applications:', error);
        this.error.set('Failed to load organization applications');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get applications with full user details AND documents
   */
  getApplicationsWithDetails(
    opportunityId: string
  ): Observable<FundingApplication[]> {
    return from(this.fetchApplicationsWithDetails(opportunityId));
  }

  /**
   * Get single application by ID - ENHANCED WITH DOCUMENTS
   */
  getApplicationById(applicationId: string): Observable<FundingApplication> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchSingleApplicationWithDocuments(applicationId)).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.error.set('Failed to load application details');
        this.isLoading.set(false);
        console.error('Error loading application:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // UPDATE APPLICATION STATUS
  // ===============================

  /**
   * Update application status and stage
   */
  updateApplicationStatus(
    applicationId: string,
    status: FundingApplication['status'],
    stage?: FundingApplication['stage'],
    reviewNote?: string
  ): Observable<FundingApplication> {
    this.isUpdating.set(true);
    this.error.set(null);

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.isUpdating.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.updateApplicationInSupabase(
        applicationId,
        status,
        stage,
        currentUser,
        reviewNote
      )
    ).pipe(
      tap(() => this.isUpdating.set(false)),
      catchError((error) => {
        this.error.set('Failed to update application status');
        this.isUpdating.set(false);
        console.error('Error updating application:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add review note to application
   */
  addReviewNote(
    applicationId: string,
    note: string,
    type: ReviewNote['type'] = 'internal'
  ): Observable<FundingApplication> {
    this.error.set(null);
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.addReviewNoteToSupabase(applicationId, note, type, currentUser)
    ).pipe(
      catchError((error) => {
        this.error.set('Failed to add review note');
        console.error('Error adding review note:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Request additional information from applicant
   */
  requestAdditionalInfo(
    applicationId: string,
    requestMessage: string
  ): Observable<FundingApplication> {
    return this.addReviewNote(
      applicationId,
      requestMessage,
      'request_info'
    ).pipe(
      tap(() => {
        console.log(
          'Additional information requested for application:',
          applicationId
        );
      })
    );
  }

  // ===============================
  // DOCUMENT MANAGEMENT
  // ===============================

  /**
   * Get documents for a specific applicant - NEW METHOD
   */
  getApplicantDocuments(applicantId: string): Observable<DocumentSection> {
    return from(this.fetchApplicantDocuments(applicantId)).pipe(
      catchError((error) => {
        console.error('Error loading applicant documents:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh document cache for an applicant - NEW METHOD
   */
  refreshDocumentCache(applicantId: string): void {
    this.documentCache.delete(applicantId);
  }

  /**
   * Get document download URL - NEW METHOD
   */
  getDocumentDownloadUrl(
    applicantId: string,
    documentType: string
  ): Observable<string | null> {
    return from(this.generateDocumentDownloadUrl(applicantId, documentType));
  }

  // ===============================
  // STATISTICS
  // ===============================

  /**
   * Get application statistics for an opportunity
   */
  getApplicationStats(
    opportunityId?: string,
    organizationId?: string
  ): Observable<ApplicationStats> {
    return from(this.fetchApplicationStats(opportunityId, organizationId)).pipe(
      catchError((error) => {
        this.error.set('Failed to load application statistics');
        console.error('Error loading stats:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get applications with user details AND documents
   */
  private async fetchApplicationsWithDetails(
    opportunityId: string
  ): Promise<FundingApplication[]> {
    try {
      // First get applications with documents
      const applications = await this.fetchApplicationsSimplified(
        opportunityId,
        true
      );

      if (applications.length === 0) {
        return applications;
      }

      // Get unique applicant IDs
      const applicantIds = [
        ...new Set(applications.map((app) => app.applicantId)),
      ];

      // Fetch applicant details
      try {
        const { data: usersData } = await this.supabase
          .from('profiles')
          .select('*')
          .in('id', applicantIds);

        // Map user data to applications
        if (usersData) {
          applications.forEach((app) => {
            const userData = usersData.find((u) => u.id === app.applicantId);
            if (userData) {
              app.applicant = {
                id: userData.id,
                firstName: userData.first_name || '',
                lastName: userData.last_name || '',
                email: userData.email || '',
                companyName: userData.company_name,
                industry: userData.industry,
                registrationNumber: userData.registration_number,
              };
            }
          });
        }
      } catch (userError) {
        console.warn('Could not load user details:', userError);
        // Continue without user data
      }

      return applications;
    } catch (error) {
      console.error('Error in fetchApplicationsWithDetails:', error);
      throw error;
    }
  }

  private transformServiceDocumentsToSection(
    documentsMap: Map<string, DocumentMetadata>
  ): DocumentSection {
    const documents: DocumentSection = {};

    documentsMap.forEach((metadata, documentKey) => {
      const document: ApplicantDocument = {
        id: metadata.id,
        fileName: metadata.originalName,
        fileType: metadata.mimeType,
        fileSize: metadata.fileSize,
        uploadDate: new Date(metadata.uploadedAt),
        documentType: metadata.documentKey,
        status: metadata.status === 'uploaded' ? 'verified' : 'pending',
        downloadUrl: metadata.publicUrl,
        metadata: {
          userId: metadata.userId,
          filePath: metadata.filePath,
          category: metadata.category,
          originalName: metadata.originalName,
          uploadedAt: metadata.uploadedAt,
          updatedAt: metadata.updatedAt,
        },
      };

      documents[documentKey] = document;
    });

    return documents;
  }

  private transformRawDocumentData(rawDocData: any): DocumentSection {
    console.log('🔄 [DEBUG] Transforming raw document data:', rawDocData);

    const documents: DocumentSection = {};

    // Expected document types from the profile system
    const documentTypes = [
      'companyRegistration',
      'taxClearanceCertificate',
      'auditedFinancials',
      'businessPlan',
      'bankStatements',
    ];

    let foundDocuments = 0;

    documentTypes.forEach((docType) => {
      const docData = rawDocData[docType];
      // console.log(`📄 [DEBUG] Processing document type '${docType}':`, docData);

      if (docData) {
        foundDocuments++;
        // Handle different document data structures
        if (typeof docData === 'string') {
          // Simple filename/URL
          // console.log(
          //   `📄 [DEBUG] Document '${docType}' is string type:`,
          //   docData
          // );
          documents[docType] = {
            id: `${docType}_${Date.now()}`,
            fileName: docData,
            fileType: this.extractFileType(docData),
            fileSize: 0, // Unknown from current data
            uploadDate: new Date(), // Default to now
            documentType: docType,
            status: 'verified', // Assume verified if present
            downloadUrl: docData.startsWith('http') ? docData : undefined,
            metadata: {},
          };
        } else if (typeof docData === 'object' && docData !== null) {
          // Structured document object
          console.log(
            `📄 [DEBUG] Document '${docType}' is object type:`,
            docData
          );
          documents[docType] = {
            id: docData.id || `${docType}_${Date.now()}`,
            fileName: docData.fileName || docData.name || `${docType} document`,
            fileType:
              docData.fileType ||
              docData.type ||
              this.extractFileType(docData.fileName || ''),
            fileSize: docData.fileSize || docData.size || 0,
            uploadDate: docData.uploadDate
              ? new Date(docData.uploadDate)
              : new Date(),
            documentType: docType,
            status: docData.status || 'verified',
            downloadUrl: docData.downloadUrl || docData.url,
            metadata: docData.metadata || {},
          };
        } else {
          console.log(
            `⚠️ [DEBUG] Document '${docType}' has unexpected data type:`,
            typeof docData,
            docData
          );
        }
      } else {
        console.log(`📭 [DEBUG] Document '${docType}' not found or empty`);
      }
    });

    // console.log(
    //   `✅ [DEBUG] Document transformation complete. Found ${foundDocuments} documents out of ${documentTypes.length} expected types`
    // );
    // console.log('📋 [DEBUG] Final document types:', Object.keys(documents));

    return documents;
  }

  /**
   * Extract file type from filename - NEW METHOD
   */
  private extractFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    return typeMap[extension || ''] || 'application/octet-stream';
  }

  /**
   * Transform document section for application response - NEW METHOD
   */
  private transformDocumentsForApplication(
    documentSection: DocumentSection
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    Object.entries(documentSection).forEach(([docType, docData]) => {
      if (docData) {
        transformed[docType] = {
          id: docData.id,
          name: docData.fileName,
          type: docData.fileType,
          size: docData.fileSize,
          uploadDate: docData.uploadDate.toISOString(),
          status: docData.status,
          downloadUrl: docData.downloadUrl,
          category: docType,
          metadata: docData.metadata,
        };
      }
    });

    return transformed;
  }

  /**
   * Enrich applications with document data - NEW METHOD
   */
  private async enrichApplicationsWithDocuments(
    applications: FundingApplication[]
  ): Promise<FundingApplication[]> {
    try {
      // console.log(
      //   '📄 [DEBUG] Enriching',
      //   applications.length,
      //   'applications with documents'
      // );

      // Get unique applicant IDs
      const applicantIds = [
        ...new Set(applications.map((app) => app.applicantId)),
      ];

      // Fetch documents for all applicants in parallel
      const documentPromises = applicantIds.map((id) =>
        this.fetchApplicantDocuments(id)
      );
      const documentsResults = await Promise.allSettled(documentPromises);

      // Create applicant -> documents mapping
      const documentsMap = new Map<string, DocumentSection>();
      applicantIds.forEach((applicantId, index) => {
        const result = documentsResults[index];
        if (result.status === 'fulfilled') {
          documentsMap.set(applicantId, result.value);
        } else {
          console.warn(
            'Failed to load documents for applicant:',
            applicantId,
            result.reason
          );
          documentsMap.set(applicantId, {});
        }
      });

      // Enrich applications with their documents
      applications.forEach((app) => {
        const documentsData = documentsMap.get(app.applicantId) || {};
        app.documents = this.transformDocumentsForApplication(documentsData);
      });

      // console.log('✅ [DEBUG] Applications enriched with documents');
      return applications;
    } catch (error) {
      console.error(
        '💥 [DEBUG] Error enriching applications with documents:',
        error
      );
      // Return applications without documents rather than failing completely
      return applications;
    }
  }

  // ===============================
  // EXISTING METHODS (Updated where needed)
  // ===============================

  private async updateApplicationInSupabase(
    applicationId: string,
    status: FundingApplication['status'],
    stage?: FundingApplication['stage'],
    reviewer?: any,
    reviewNote?: string
  ): Promise<FundingApplication> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (stage) {
        updateData.stage = stage;
      }

      // Set timestamp fields based on status
      if (status === 'under_review' && !updateData.review_started_at) {
        updateData.review_started_at = new Date().toISOString();
      }

      if (status === 'approved' || status === 'rejected') {
        updateData.decided_at = new Date().toISOString();
        updateData.reviewed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update application: ${error.message}`);
      }

      // Add review note if provided
      if (reviewNote && reviewer) {
        await this.addReviewNoteToSupabase(
          applicationId,
          reviewNote,
          'internal',
          reviewer
        );
      }

      const transformedApp = this.transformApplicationData(data);

      // Fetch documents for the updated application
      const documentsData = await this.fetchApplicantDocuments(
        transformedApp.applicantId,
        applicationId
      );
      transformedApp.documents =
        this.transformDocumentsForApplication(documentsData);

      return transformedApp;
    } catch (error) {
      console.error('Error updating application in Supabase:', error);
      throw error;
    }
  }

  private async addReviewNoteToSupabase(
    applicationId: string,
    note: string,
    type: ReviewNote['type'],
    reviewer: any
  ): Promise<FundingApplication> {
    try {
      // Get current application
      const { data: currentApp, error: fetchError } = await this.supabase
        .from('applications')
        .select('review_notes')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch application: ${fetchError.message}`);
      }

      // Create new review note
      const newNote: ReviewNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewerId: reviewer.id,
        reviewerName:
          `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewer.email,
        note,
        type,
        createdAt: new Date(),
        isRead: false,
      };

      // Append to existing notes
      const existingNotes = currentApp.review_notes || [];
      const updatedNotes = [...existingNotes, newNote];

      // Update application
      const { data, error } = await this.supabase
        .from('applications')
        .update({
          review_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add review note: ${error.message}`);
      }

      const transformedApp = this.transformApplicationData(data);

      // Fetch documents for the application

      const documentsData = await this.fetchApplicantDocuments(
        transformedApp.applicantId,
        applicationId
      );
      transformedApp.documents =
        this.transformDocumentsForApplication(documentsData);

      return transformedApp;
    } catch (error) {
      console.error('Error adding review note to Supabase:', error);
      throw error;
    }
  }

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  private transformApplicationsData(rawData: any[]): FundingApplication[] {
    // console.log(
    //   '🔄 [DEBUG] transformApplicationsData called with:',
    //   rawData.length,
    //   'items'
    // );

    try {
      const transformed = rawData.map((item, index) => {
        // console.log(`🔄 [DEBUG] Transforming item ${index}:`, item.id);
        return this.transformApplicationData(item);
      });

      // console.log(
      //   '✅ [DEBUG] Successfully transformed',
      //   transformed.length,
      //   'applications'
      // );
      return transformed;
    } catch (error) {
      console.error('💥 [DEBUG] Error in transformApplicationsData:', error);
      throw error;
    }
  }

  private transformApplicationData(rawData: any): FundingApplication {
    console.log('🔄 [DEBUG] Transforming single application:', rawData.id);

    try {
      const transformed = {
        id: rawData.id,
        applicantId: rawData.applicant_id,
        opportunityId: rawData.opportunity_id,
        title: rawData.title,
        description: rawData.description,
        status: rawData.status,
        stage: rawData.stage,
        formData: rawData.form_data || {},
        documents: rawData.documents || {}, // Will be enriched with actual documents later
        reviewNotes: rawData.review_notes || [],
        terms: rawData.terms || {},
        submittedAt: rawData.submitted_at
          ? new Date(rawData.submitted_at)
          : undefined,
        reviewStartedAt: rawData.review_started_at
          ? new Date(rawData.review_started_at)
          : undefined,
        reviewedAt: rawData.reviewed_at
          ? new Date(rawData.reviewed_at)
          : undefined,
        decidedAt: rawData.decided_at
          ? new Date(rawData.decided_at)
          : undefined,
        createdAt: new Date(rawData.created_at),
        updatedAt: new Date(rawData.updated_at),
        aiAnalysisStatus: rawData.ai_analysis_status,
        aiMatchScore: rawData.ai_match_score,
        applicant: {
          id: rawData.applicant_id,
          firstName: 'Loading...',
          lastName: '',
          email: '',
        },
      };

      console.log(
        '✅ [DEBUG] Successfully transformed application:',
        transformed.id
      );
      return transformed;
    } catch (error) {
      console.error('💥 [DEBUG] Error transforming single application:', error);
      throw error;
    }
  }

  private calculateStats(applications: any[]): ApplicationStats {
    const total = applications.length;
    const byStatus: Record<string, number> = {};
    const byStage: Record<string, number> = {};

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let recentActivity = 0;

    let totalProcessingTime = 0;
    let completedApplications = 0;

    applications.forEach((app) => {
      // Count by status
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;

      // Count by stage
      byStage[app.stage] = (byStage[app.stage] || 0) + 1;

      // Recent activity
      const updatedAt = new Date(app.updated_at);
      if (updatedAt >= sevenDaysAgo) {
        recentActivity++;
      }

      // Processing time for completed applications
      if (
        (app.status === 'approved' || app.status === 'rejected') &&
        app.created_at &&
        app.updated_at
      ) {
        const created = new Date(app.created_at);
        const completed = new Date(app.updated_at);
        const processingDays = Math.ceil(
          (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalProcessingTime += processingDays;
        completedApplications++;
      }
    });

    const averageProcessingTime =
      completedApplications > 0
        ? Math.round(totalProcessingTime / completedApplications)
        : 0;

    return {
      total,
      byStatus,
      byStage,
      recentActivity,
      averageProcessingTime,
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Clear document cache - useful for refreshing data
   */
  clearDocumentCache(): void {
    this.documentCache.clear();
    console.log('Document cache cleared');
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; applicantIds: string[] } {
    return {
      size: this.documentCache.size,
      applicantIds: Array.from(this.documentCache.keys()),
    };
  }

  // from Headers

  /**
   * FALLBACK: Direct query for specific user (when funder views applicant documents)
   */
  private async fetchDocumentsDirectlyForUser(
    applicantId: string
  ): Promise<DocumentSection> {
    try {
      console.log('🔍 [DOCS-FALLBACK] Direct query for user:', applicantId);

      // Query documents table directly for the specific applicant
      const { data: docs, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('user_id', applicantId)
        .eq('status', 'uploaded')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.warn('⚠️ [DOCS-FALLBACK] Database query error:', error);
        return {};
      }

      if (!docs || docs.length === 0) {
        console.log('📭 [DOCS-FALLBACK] No documents found in database');
        return {};
      }

      console.log(
        '📄 [DOCS-FALLBACK] Found documents in database:',
        docs.length
      );

      // Transform database results
      const documents: DocumentSection = {};

      docs.forEach((doc) => {
        const document: ApplicantDocument = {
          id: doc.id,
          fileName: doc.original_name,
          fileType: doc.mime_type,
          fileSize: doc.file_size,
          uploadDate: new Date(doc.uploaded_at),
          documentType: doc.document_key,
          status: 'verified',
          downloadUrl: doc.public_url,
          metadata: {
            userId: doc.user_id,
            filePath: doc.file_path,
            category: doc.category,
            originalName: doc.original_name,
            uploadedAt: doc.uploaded_at,
            updatedAt: doc.updated_at,
          },
        };

        documents[doc.document_key] = document;
      });

      console.log(
        '✅ [DOCS-FALLBACK] Direct query documents transformed:',
        Object.keys(documents)
      );
      return documents;
    } catch (error) {
      console.error('💥 [DOCS-FALLBACK] Direct query failed:', error);
      return {};
    }
  }

  /**
   * ENHANCED: Use existing service for download URLs
   */
  private async generateDocumentDownloadUrl(
    applicantId: string,
    documentType: string
  ): Promise<string | null> {
    try {
      console.log(
        '🔗 [DOCS] Generating download URL via service for:',
        documentType
      );

      // Use the existing service method
      const signedUrl = await this.documentService
        .downloadDocumentByKey(documentType)
        .toPromise();

      console.log('✅ [DOCS] Generated signed URL via service');
      return signedUrl || null;
    } catch (error) {
      console.error(
        '💥 [DOCS] Error generating download URL via service:',
        error
      );

      // FALLBACK: Direct public URL fetch
      return await this.generateDirectDownloadUrl(applicantId, documentType);
    }
  }

  /**
   * FALLBACK: Direct download URL generation
   */
  private async generateDirectDownloadUrl(
    applicantId: string,
    documentType: string
  ): Promise<string | null> {
    try {
      // Query for the document
      const { data: doc, error } = await this.supabase
        .from('documents')
        .select('public_url, file_path')
        .eq('user_id', applicantId)
        .eq('document_key', documentType)
        .single();

      if (error || !doc) {
        console.warn('⚠️ [DOCS] Document not found for direct URL generation');
        return null;
      }

      // Return public URL if available, otherwise generate signed URL
      if (doc.public_url) {
        return doc.public_url;
      }

      // Generate signed URL for private files
      const { data } = await this.supabase.storage
        .from('platform-documents')
        .createSignedUrl(doc.file_path, 3600);

      return data?.signedUrl || null;
    } catch (error) {
      console.error('💥 [DOCS] Direct URL generation failed:', error);
      return null;
    }
  }

  /**
   * ENHANCED: Check if applicant has documents using existing service
   */
  async hasDocuments(applicantId: string): Promise<boolean> {
    try {
      const documents = await this.fetchApplicantDocuments(applicantId);
      return Object.keys(documents).length > 0;
    } catch {
      return false;
    }
  }

  /**
   * ENHANCED: Get document summary using existing service structure
   */
  async getDocumentSummary(applicantId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    verified: number;
    pending: number;
  }> {
    try {
      const documents = await this.fetchApplicantDocuments(applicantId);
      const docValues = Object.values(documents).filter(
        (doc) => doc !== undefined
      );

      const summary = {
        total: docValues.length,
        byType: {} as Record<string, number>,
        verified: 0,
        pending: 0,
      };

      docValues.forEach((doc) => {
        // Count by type
        summary.byType[doc.documentType] =
          (summary.byType[doc.documentType] || 0) + 1;

        // Count by status
        if (doc.status === 'verified') {
          summary.verified++;
        } else {
          summary.pending++;
        }
      });

      return summary;
    } catch {
      return { total: 0, byType: {}, verified: 0, pending: 0 };
    }
  }

  private async fetchApplicationsSimplified(
    opportunityId: string,
    includeDocuments: boolean = false
  ): Promise<FundingApplication[]> {
    try {
      console.log(
        '🔍 [DEBUG] Starting fetchApplicationsSimplified with documents:',
        includeDocuments
      );
      console.log('🎯 [DEBUG] Opportunity ID:', opportunityId);

      // FIXED: Correct Supabase query syntax
      const { data, error } = await this.supabase
        .from('applications')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .not('status', 'in', '(withdrawn,draft)') // ✅ FIXED: Correct syntax
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🚫 [DEBUG] Supabase error details:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('📭 [DEBUG] No applications found');
        return [];
      }

      console.log('✅ [DEBUG] Raw applications found:', data.length);

      // Transform applications
      let applications = this.transformApplicationsData(data);

      // Optionally load documents for all applications
      if (includeDocuments) {
        applications = await this.enrichApplicationsWithDocuments(applications);
      }

      return applications;
    } catch (error) {
      console.error('💥 [DEBUG] Error in fetchApplicationsSimplified:', error);
      throw error;
    }
  }

  // ===============================
  // FIXED: fetchApplicationsByOrganization method
  // ===============================
  private async fetchApplicationsByOrganization(
    organizationId: string,
    filter?: ApplicationFilter,
    includeDocuments: boolean = false
  ): Promise<FundingApplication[]> {
    try {
      console.log('Querying applications for organization:', organizationId);

      // First, get opportunities for this organization
      const { data: opportunities, error: oppError } = await this.supabase
        .from('funding_opportunities')
        .select('id')
        .eq('organization_id', organizationId);

      if (oppError) {
        throw new Error(`Failed to fetch opportunities: ${oppError.message}`);
      }

      if (!opportunities || opportunities.length === 0) {
        console.log('No opportunities found for organization:', organizationId);
        return [];
      }

      const opportunityIds = opportunities.map((opp) => opp.id);
      console.log('Found opportunities:', opportunityIds.length);

      // FIXED: Correct query syntax
      let query = this.supabase
        .from('applications')
        .select('*')
        .in('opportunity_id', opportunityIds)
        .not('status', 'in', '(withdrawn,draft)'); // ✅ FIXED: Correct syntax

      // Apply filters
      if (filter?.status?.length) {
        query = query.in('status', filter.status);
      }

      if (filter?.stage?.length) {
        query = query.in('stage', filter.stage);
      }

      if (filter?.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.start.toISOString())
          .lte('created_at', filter.dateRange.end.toISOString());
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('No applications found for organization opportunities');
        return [];
      }

      console.log('Raw applications found:', data.length);
      let applications = this.transformApplicationsData(data);

      // Apply search filter (client-side)
      if (filter?.searchQuery) {
        const searchLower = filter.searchQuery.toLowerCase();
        applications = applications.filter(
          (app) =>
            app.title.toLowerCase().includes(searchLower) ||
            app.description?.toLowerCase().includes(searchLower)
        );
      }

      // Optionally load documents
      if (includeDocuments) {
        applications = await this.enrichApplicationsWithDocuments(applications);
      }

      return applications;
    } catch (error) {
      console.error('Error in fetchApplicationsByOrganization:', error);
      throw error;
    }
  }

  // ===============================
  // FIXED: fetchApplicationStats method
  // ===============================
  private async fetchApplicationStats(
    opportunityId?: string,
    organizationId?: string
  ): Promise<ApplicationStats> {
    try {
      let query = this.supabase
        .from('applications')
        .select('*', { count: 'exact' });

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }

      // FIXED: Use individual not() calls or alternative approach
      // Option 1: Use individual not() calls
      query = query
        .not('status', 'eq', 'withdrawn')
        .not('status', 'eq', 'draft');

      // Alternative Option 2: Use neq (not equal) for each
      // query = query
      //   .neq('status', 'withdrawn')
      //   .neq('status', 'draft');

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      return this.calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  }

  /**
   * Get all applications a funder can manage
   * Fetches applications from all active opportunities
   */
  getAllManageableApplications(
    includeDocuments: boolean = false
  ): Observable<FundingApplication[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchAllManageableApplications(includeDocuments)).pipe(
      tap((apps) => {
        console.log('✅ All manageable applications loaded:', apps.length);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('Error loading manageable applications:', error);
        this.error.set('Failed to load applications');
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  private async fetchAllManageableApplications(
    includeDocuments: boolean = false
  ): Promise<FundingApplication[]> {
    try {
      console.log('🔍 Fetching all manageable applications');

      // Get all active opportunities
      const { data: opportunities, error: oppError } = await this.supabase
        .from('funding_opportunities')
        .select('id')
        .in('status', ['active', 'paused']);

      if (oppError) {
        console.error('Failed to fetch opportunities:', oppError);
        return [];
      }

      if (!opportunities?.length) {
        console.log('📭 No active opportunities found');
        return [];
      }

      const opportunityIds = opportunities.map((opp) => opp.id);
      console.log('✅ Found opportunities:', opportunityIds.length);

      // Get applications for all those opportunities
      const { data, error } = await this.supabase
        .from('applications')
        .select('*')
        .in('opportunity_id', opportunityIds)
        .not('status', 'in', '(withdrawn,draft)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch applications:', error);
        return [];
      }

      if (!data?.length) {
        console.log('📭 No applications found');
        return [];
      }

      console.log('✅ Applications found:', data.length);

      let applications = this.transformApplicationsData(data);

      // Optionally enrich with documents
      if (includeDocuments) {
        applications = await this.enrichApplicationsWithDocuments(applications);
      }

      return applications;
    } catch (error) {
      console.error('💥 Error in fetchAllManageableApplications:', error);
      return [];
    }
  }

  // ADD THIS LOGGING TO: fetchSingleApplicationWithDocuments()

  private async fetchSingleApplicationWithDocuments(
    applicationId: string
  ): Promise<FundingApplication> {
    try {
      console.log(
        '🔍 [DEBUG] Fetching single application with documents:',
        applicationId
      );

      const { data, error } = await this.supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Application not found');
      }

      const application = this.transformApplicationData(data);
      console.log('📋 [STEP 1] After transformApplicationData:', {
        id: application.id,
        hasDocuments: Object.keys(application.documents).length > 0,
        documents: application.documents,
      });

      // ✅ FIXED: Pass applicationId here too
      console.log('📋 [STEP 2] Calling fetchApplicantDocuments with:', {
        applicantId: application.applicantId,
        applicationId: applicationId,
      });

      const documentsData = await this.fetchApplicantDocuments(
        application.applicantId,
        applicationId // ← PASS THIS
      );

      console.log('📋 [STEP 3] After fetchApplicantDocuments:', {
        keys: Object.keys(documentsData),
        hasData: Object.keys(documentsData).length > 0,
        documentsData: documentsData,
      });

      application.documents =
        this.transformDocumentsForApplication(documentsData);

      console.log('📋 [STEP 4] After transformDocumentsForApplication:', {
        keys: Object.keys(application.documents),
        hasDocuments: Object.keys(application.documents).length > 0,
        documents: application.documents,
      });

      return application;
    } catch (error) {
      console.error(
        '💥 [DEBUG] Error fetching single application with documents:',
        error
      );
      throw error;
    }
  }

  private async fetchApplicantDocuments(
    applicantId: string,
    applicationId?: string
  ): Promise<DocumentSection> {
    try {
      console.log(
        '🔍 [DOCS] Fetching documents for applicant:',
        applicantId,
        'application:',
        applicationId
      );

      // ✅ FIXED: Use direct query to bypass RLS filtering issues
      // The service's getDocumentsByUserId() has RLS issues when filtering by applicationId
      // The fallback query works perfectly, so use it as primary
      const documents = await this.fetchDocumentsDirectlyForUser(applicantId);

      console.log(
        '📄 [DOCS] Documents fetched:',
        Object.keys(documents).length
      );

      if (Object.keys(documents).length === 0) {
        console.log('📭 [DOCS] No documents found');
        return {};
      }

      console.log('✅ [DOCS] Documents retrieved:', Object.keys(documents));
      return documents;
    } catch (error) {
      console.error('💥 [DOCS] Error fetching documents:', error);
      return {};
    }
  }
}
