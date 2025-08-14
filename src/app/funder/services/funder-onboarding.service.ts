// src/app/funder/services/robust-funder-onboarding.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, Subject, of, timer } from 'rxjs';
import { tap, catchError, finalize, switchMap, retryWhen, concatMap, delay, take } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/production.auth.service';

export interface FunderOrganization {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  organizationType: 'investment_fund' | 'bank' | 'government' | 'ngo' | 'private_equity' | 'venture_capital';
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  website?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  foundedYear?: number;
  employeeCount?: number;
  assetsUnderManagement?: number;
  status: 'active' | 'inactive' | 'pending_verification';
  isVerified: boolean;
  version?: number; // For optimistic locking
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OnboardingStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime: string;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  organization?: FunderOrganization;
  isComplete: boolean;
  canCreateOpportunities: boolean;
  steps: OnboardingStep[];
}

interface LocalStorageData {
  organizationData: Partial<FunderOrganization>;
  currentStep: string;
  lastSaved: string;
  userId: string;
  version?: number;
}

interface SaveOperation {
  id: string;
  timestamp: number;
  data: Partial<FunderOrganization>;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  retryCount: number;
}

interface NetworkState {
  isOnline: boolean;
  lastChecked: number;
}

@Injectable({
  providedIn: 'root'
})
export class  FunderOnboardingService {
  private supabase: SupabaseClient;
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private localStorageKey = 'funder-onboarding-data';
  
  // Operation queue for handling concurrent saves
  private saveQueue: SaveOperation[] = [];
  private isProcessingQueue = false;
  private queueProcessor$ = new Subject<void>();

  // Network state tracking
  private networkState: NetworkState = {
    isOnline: navigator.onLine,
    lastChecked: Date.now()
  };

  // State management with improved reliability
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  lastSavedLocally = signal<Date | null>(null);
  lastSavedToDatabase = signal<Date | null>(null);
  currentStep = signal<string>('organization-info');
  connectionStatus = signal<'online' | 'offline' | 'reconnecting'>('online');

  // Local organization data with version tracking
  organizationData = signal<Partial<FunderOrganization>>({
    country: 'South Africa',
    version: 1
  });

  // Steps configuration
  private steps: OnboardingStep[] = [
    {
      id: 'organization-info',
      title: 'Basic Information',
      shortTitle: 'Basic Info',
      description: 'Organization name, type, description, and contact details',
      completed: false,
      required: true,
      estimatedTime: '5 min'
    },
    {
      id: 'legal-compliance',
      title: 'Legal & Registration',
      shortTitle: 'Legal Info',
      description: 'Legal name, registration numbers, and compliance details',
      completed: false,
      required: true,
      estimatedTime: '3 min'
    },
    {
      id: 'verification',
      title: 'Verification',
      shortTitle: 'Get Verified',
      description: 'Submit for verification to start funding',
      completed: false,
      required: false,
      estimatedTime: '2 min'
    }
  ];

  private onboardingStateSubject = new BehaviorSubject<OnboardingState>({
    currentStep: 0,
    totalSteps: 3,
    completionPercentage: 0,
    isComplete: false,
    canCreateOpportunities: false,
    steps: this.steps
  });
  
  onboardingState$ = this.onboardingStateSubject.asObservable();

  constructor() {
    console.log('🚀 RobustFunderOnboardingService initialized');
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    
    this.initializeService();
    this.setupNetworkMonitoring();
    this.setupQueueProcessor();
  }

  private initializeService() {
    this.loadFromLocalStorage();
    
    // Set up connection recovery
    window.addEventListener('online', () => this.handleConnectionRestore());
    window.addEventListener('offline', () => this.handleConnectionLost());
  }

  private setupNetworkMonitoring() {
    // Check network connectivity every 30 seconds
    timer(0, 30000).pipe(
      tap(() => this.checkNetworkConnectivity())
    ).subscribe();
  }

  private checkNetworkConnectivity() {
    const wasOnline = this.networkState.isOnline;
    this.networkState.isOnline = navigator.onLine;
    this.networkState.lastChecked = Date.now();

    if (!wasOnline && this.networkState.isOnline) {
      this.handleConnectionRestore();
    } else if (wasOnline && !this.networkState.isOnline) {
      this.handleConnectionLost();
    }

    this.connectionStatus.set(this.networkState.isOnline ? 'online' : 'offline');
  }

  private handleConnectionRestore() {
    console.log('🌐 Connection restored, processing queued operations');
    this.connectionStatus.set('reconnecting');
    
    // Process any queued saves
    this.queueProcessor$.next();
    
    // Auto-sync if we have unsaved local data
    const localData = this.organizationData();
    const lastDbSave = this.lastSavedToDatabase();
    const lastLocalSave = this.lastSavedLocally();
    
    if (lastLocalSave && (!lastDbSave || lastLocalSave > lastDbSave)) {
      console.log('🔄 Auto-syncing local changes to database');
      this.saveToDatabase().subscribe({
        next: () => this.connectionStatus.set('online'),
        error: () => this.connectionStatus.set('online') // Still mark as online
      });
    } else {
      this.connectionStatus.set('online');
    }
  }

  private handleConnectionLost() {
    console.log('🔌 Connection lost, switching to offline mode');
    this.connectionStatus.set('offline');
    this.error.set('Working offline - changes will sync when connection is restored');
    
    // Clear error after 5 seconds
    timer(5000).pipe(take(1)).subscribe(() => {
      if (this.error() === 'Working offline - changes will sync when connection is restored') {
        this.error.set(null);
      }
    });
  }

  // ===============================
  // QUEUE PROCESSOR FOR CONCURRENT SAVES
  // ===============================

  private setupQueueProcessor() {
    this.queueProcessor$.pipe(
      tap(() => this.processQueue()),
      concatMap(() => timer(100)) // Small delay between operations
    ).subscribe();
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.saveQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      while (this.saveQueue.length > 0) {
        const operation = this.saveQueue.shift()!;
        
        try {
          const result = await this.performDatabaseSave(operation.data, operation.retryCount);
          operation.resolve(result);
        } catch (error) {
          if (operation.retryCount < 3) {
            // Retry with exponential backoff
            operation.retryCount++;
            await this.delay(Math.pow(2, operation.retryCount) * 1000);
            this.saveQueue.unshift(operation); // Put back at front for retry
          } else {
            operation.reject(error);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===============================
  // LOCAL STORAGE WITH VERSION TRACKING
  // ===============================

  private saveToLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const dataToSave: LocalStorageData = {
        organizationData: this.organizationData(),
        currentStep: this.currentStep(),
        lastSaved: new Date().toISOString(),
        userId: user.id,
        version: this.organizationData().version || 1
      };

      localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
      console.log('✅ Saved to localStorage with version:', dataToSave.version);
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) {
        const parsedData: LocalStorageData = JSON.parse(saved);
        
        if (parsedData.userId === user.id) {
          this.organizationData.set({
            ...parsedData.organizationData,
            country: parsedData.organizationData.country || 'South Africa',
            version: parsedData.version || 1
          });
          this.currentStep.set(parsedData.currentStep || 'organization-info');
          this.lastSavedLocally.set(new Date(parsedData.lastSaved));
          this.updateStepCompletionFromData();
          console.log('✅ Loaded from localStorage with version:', parsedData.version);
        }
      }
    } catch (error) {
      console.error('❌ localStorage load failed:', error);
    }
  }

  // ===============================
  // ROBUST DATA UPDATE WITH QUEUING
  // ===============================

  updateOrganizationData(updates: Partial<FunderOrganization>) {
    console.log('📝 Updating organization data');
    
    this.organizationData.update(current => ({
      ...current,
      ...updates,
      version: (current.version || 1) + 1 // Increment version for optimistic locking
    }));
    
    this.saveToLocalStorage();
    this.updateStepCompletionFromData();
  }

  // ===============================
  // ROBUST DATABASE SAVE WITH RETRY LOGIC
  // ===============================

saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
  console.log('💾 Queuing database save...');
  
  if (!this.networkState.isOnline) {
    console.log('📱 Offline - data will sync when connection restored');
    return of({ success: true }); // Return success for offline mode
  }
  
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    this.error.set('Please log in to save');
    return throwError(() => new Error('User not authenticated'));
  }

  const data = this.organizationData();
  if (!data.name?.trim()) {
    this.error.set('Organization name is required');
    return throwError(() => new Error('Organization name is required'));
  }

  // Create queued operation with proper typing
  return new Observable<{ success: boolean; organizationId?: string }>(observer => {
    const operation: SaveOperation = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      data: { ...data },
      resolve: (result: { success: boolean; organizationId?: string }) => {
        observer.next(result);
        observer.complete();
      },
      reject: (error: Error) => {
        observer.error(error);
      },
      retryCount: 0
    };

    this.saveQueue.push(operation);
    this.isSaving.set(true);
    this.error.set(null);
    
    // Trigger queue processing
    this.queueProcessor$.next();
  }).pipe(
    tap((result: { success: boolean; organizationId?: string }) => {
      console.log('✅ Database save completed:', result);
      this.lastSavedToDatabase.set(new Date());
    }),
    catchError((error: Error) => {
      console.error('❌ Database save failed:', error);
      this.handleSaveError(error);
      return throwError(() => error);
    }),
    finalize(() => {
      this.isSaving.set(false);
    })
  );
}

  private async performDatabaseSave(
    orgData: Partial<FunderOrganization>,
    retryCount: number
  ): Promise<{ success: boolean; organizationId?: string }> {
    const currentAuth = this.authService.user();
    if (!currentAuth) throw new Error('User not authenticated');

    console.log(`💾 Attempting database save (attempt ${retryCount + 1})`);

    try {
      // Use the database function for safe upsert
      const { data, error } = await this.supabase
        .rpc('upsert_funder_organization', {
          p_user_id: currentAuth.id,
          p_name: orgData.name || '',
          p_description: orgData.description,
          p_organization_type: orgData.organizationType || 'investment_fund',
          p_legal_name: orgData.legalName,
          p_registration_number: orgData.registrationNumber,
          p_tax_number: orgData.taxNumber,
          p_website: orgData.website,
          p_email: orgData.email,
          p_phone: orgData.phone,
          p_address_line1: orgData.addressLine1,
          p_address_line2: orgData.addressLine2,
          p_city: orgData.city,
          p_province: orgData.province,
          p_postal_code: orgData.postalCode,
          p_country: orgData.country || 'South Africa',
          p_founded_year: orgData.foundedYear,
          p_employee_count: orgData.employeeCount,
          p_assets_under_management: orgData.assetsUnderManagement,
          p_expected_version: orgData.version
        });

      if (error) {
        throw new Error(`Database function error: ${error.message}`);
      }

      const result = data[0];
      
      if (!result.success) {
        if (result.error_message?.includes('modified by another process')) {
          // Handle optimistic locking conflict
          await this.handleVersionConflict(result.current_version);
          throw new Error('Data conflict resolved, please try again');
        }
        throw new Error(result.error_message || 'Database operation failed');
      }

      // Update local version
      this.organizationData.update(current => ({
        ...current,
        id: result.organization_id,
        version: result.current_version
      }));

      return {
        success: true,
        organizationId: result.organization_id
      };

    } catch (error: any) {
      console.error(`❌ Database save attempt ${retryCount + 1} failed:`, error);
      
      // Determine if error is retryable
      if (this.isRetryableError(error) && retryCount < 2) {
        throw error; // Will be retried by queue processor
      }
      
      // Non-retryable error or max retries exceeded
      this.handlePermanentSaveError(error);
      throw error;
    }
  }

  private async handleVersionConflict(serverVersion: number) {
    console.log('🔄 Handling version conflict, refreshing data...');
    
    // Fetch latest data from server
    try {
      await this.refreshFromDatabase();
      console.log('✅ Data refreshed from server');
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
    }
  }

  private async refreshFromDatabase(): Promise<void> {
    const currentAuth = this.authService.user();
    if (!currentAuth) return;

    const { data, error } = await this.supabase
      .from('funder_organizations')
      .select('*')
      .eq('user_id', currentAuth.id)
      .single();

    if (!error && data) {
      const refreshedData = this.mapDatabaseToModel(data);
      this.organizationData.set(refreshedData);
      this.saveToLocalStorage();
    }
  }

  private isRetryableError(error: any): boolean {
    const retryableMessages = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'rate limit',
      'server error',
      'service unavailable'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  private handleSaveError(error: any) {
    let errorMessage = 'Failed to save organization';
    
    if (error.message?.includes('network') || error.message?.includes('connection')) {
      errorMessage = 'Connection issue - changes saved locally and will sync automatically';
    } else if (error.message?.includes('conflict')) {
      errorMessage = 'Data was modified elsewhere - please refresh and try again';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    this.error.set(errorMessage);
    
    // Auto-clear error after 10 seconds
    timer(10000).pipe(take(1)).subscribe(() => {
      if (this.error() === errorMessage) {
        this.error.set(null);
      }
    });
  }

  private handlePermanentSaveError(error: any) {
    console.error('💥 Permanent save error:', error);
    // Data is still safe in localStorage
    // Could trigger user notification or fallback behavior
  }

  // ===============================
  // STATUS CHECKING WITH RETRY
  // ===============================

  checkOnboardingStatus(): Observable<OnboardingState> {
    console.log('🔍 Checking onboarding status with retry logic...');
    
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return of(this.onboardingStateSubject.value);
    }

    return from(this.fetchStatusWithRetry(currentAuth.id)).pipe(
      tap(state => {
        this.onboardingStateSubject.next(state);
        console.log('✅ Status check completed');
      }),
      retryWhen(errors => 
        errors.pipe(
          tap(error => console.log('⚠️ Status check failed, retrying...', error)),
          delay(1000),
          take(3)
        )
      ),
      catchError(error => {
        console.error('❌ Status check failed after retries:', error);
        // Return current local state instead of failing
        return of(this.generateStateFromLocalData());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private async fetchStatusWithRetry(userId: string): Promise<OnboardingState> {
    try {
      // Use the completeness check function
      const { data: completenessData, error: completenessError } = await this.supabase
        .rpc('check_organization_completeness', { p_user_id: userId });

      if (completenessError) {
        throw new Error(`Completeness check failed: ${completenessError.message}`);
      }

      // Also fetch the organization data
      const { data: organization, error: orgError } = await this.supabase
        .from('funder_organizations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (orgError && orgError.code !== 'PGRST116') {
        throw new Error(`Organization fetch failed: ${orgError.message}`);
      }

      const completeness = completenessData[0];
      const mappedOrg = organization ? this.mapDatabaseToModel(organization) : null;

      if (mappedOrg) {
        // Update local data with database data
        this.organizationData.set(mappedOrg);
        this.saveToLocalStorage();
      }

      return {
        currentStep: this.determineCurrentStep(completeness),
        totalSteps: 3,
        completionPercentage: completeness?.completion_percentage || 0,
        organization: mappedOrg || undefined,
        isComplete: completeness?.is_complete || false,
        canCreateOpportunities: completeness?.can_create_opportunities || false,
        steps: this.updateStepsCompletion(completeness)
      };
      
    } catch (error) {
      console.error('❌ Error fetching status:', error);
      
      // If we're offline or there's a network error, use local data
      if (!this.networkState.isOnline || this.isNetworkError(error)) {
        return this.generateStateFromLocalData();
      }
      
      throw error;
    }
  }

  private generateStateFromLocalData(): OnboardingState {
    const localData = this.organizationData();
    const basicComplete = this.isBasicInfoValid();
    const legalComplete = this.isLegalInfoValid();
    
    return {
      currentStep: basicComplete ? (legalComplete ? 2 : 1) : 0,
      totalSteps: 3,
      completionPercentage: this.calculateLocalCompletionPercentage(),
      organization: localData as FunderOrganization,
      isComplete: basicComplete && legalComplete,
      canCreateOpportunities: basicComplete && legalComplete,
      steps: this.updateStepsFromLocalData()
    };
  }

  private determineCurrentStep(completeness: any): number {
    if (!completeness) return 0;
    
    const missingFields = completeness.missing_fields || [];
    const basicFields = ['Organization Name', 'Description', 'Email', 'Phone'];
    const legalFields = ['Legal Name', 'Registration Number', 'City', 'Province'];
    
    const hasBasicFields = !basicFields.some(field => missingFields.includes(field));
    const hasLegalFields = !legalFields.some(field => missingFields.includes(field));
    
    if (!hasBasicFields) return 0;
    if (!hasLegalFields) return 1;
    return 2;
  }

  private updateStepsCompletion(completeness: any): OnboardingStep[] {
    const missingFields = completeness?.missing_fields || [];
    const basicFields = ['Organization Name', 'Description', 'Email', 'Phone'];
    const legalFields = ['Legal Name', 'Registration Number', 'City', 'Province'];
    
    return this.steps.map(step => ({
      ...step,
      completed: step.id === 'organization-info' 
        ? !basicFields.some(field => missingFields.includes(field))
        : step.id === 'legal-compliance'
        ? !legalFields.some(field => missingFields.includes(field))
        : false
    }));
  }

  private updateStepsFromLocalData(): OnboardingStep[] {
    return this.steps.map(step => ({
      ...step,
      completed: step.id === 'organization-info' 
        ? this.isBasicInfoValid()
        : step.id === 'legal-compliance'
        ? this.isLegalInfoValid()
        : false
    }));
  }

  private isNetworkError(error: any): boolean {
    return error.message?.includes('network') || 
           error.message?.includes('fetch') ||
           error.name === 'NetworkError';
  }

  // ===============================
  // VERIFICATION WITH PROPER ERROR HANDLING
  // ===============================

  requestVerification(): Observable<{ success: boolean; message: string }> {
    console.log('🛡️ Requesting verification with retry logic...');
    
    if (!this.networkState.isOnline) {
      return throwError(() => new Error('Verification requires internet connection'));
    }

    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performVerificationRequest(currentAuth.id)).pipe(
      retryWhen(errors => 
        errors.pipe(
          tap(error => console.log('⚠️ Verification request failed, retrying...', error)),
          delay(2000),
          take(2)
        )
      ),
      catchError(error => {
        console.error('❌ Verification request failed:', error);
        this.error.set('Failed to request verification');
        return throwError(() => error);
      })
    );
  }

  private async performVerificationRequest(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('funder_organizations')
        .update({ 
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Verification request failed: ${error.message}`);
      }

      // Update local data
      this.organizationData.update(current => ({
        ...current,
        status: 'pending_verification' as const
      }));
      this.saveToLocalStorage();

      return {
        success: true,
        message: 'Verification request submitted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // VALIDATION METHODS (IMPROVED)
  // ===============================

  isBasicInfoValid(): boolean {
    const data = this.organizationData();
    return !!(
      data.name?.trim() &&
      data.description?.trim() &&
      data.organizationType &&
      data.email?.trim() &&
      data.phone?.trim()
    );
  }

  isLegalInfoValid(): boolean {
    const data = this.organizationData();
    return !!(
      data.legalName?.trim() &&
      data.registrationNumber?.trim() &&
      data.addressLine1?.trim() &&
      data.city?.trim() &&
      data.province &&
      data.country
    );
  }

  isReadyForVerification(): boolean {
    return this.isBasicInfoValid() && this.isLegalInfoValid();
  }

  isFullyComplete(): boolean {
    const data = this.organizationData();
    return this.isReadyForVerification() && !!data.id;
  }

  private calculateLocalCompletionPercentage(): number {
    const basicInfoComplete = this.isBasicInfoValid();
    const legalInfoComplete = this.isLegalInfoValid();
    
    if (basicInfoComplete && legalInfoComplete) return 100;
    if (basicInfoComplete) return 50;
    if (this.hasBasicData()) return 25;
    return 0;
  }

  private hasBasicData(): boolean {
    const data = this.organizationData();
    return !!(data.name?.trim() || data.email?.trim());
  }

  private updateStepCompletionFromData() {
    const basicInfoComplete = this.isBasicInfoValid();
    const legalInfoComplete = this.isLegalInfoValid();
    
    this.steps[0].completed = basicInfoComplete;
    this.steps[1].completed = legalInfoComplete;
    this.steps[2].completed = false;
    
    const completedRequiredSteps = this.steps.filter(step => step.required && step.completed).length;
    const totalRequiredSteps = this.steps.filter(step => step.required).length;
    
    let currentStepIndex = 0;
    if (basicInfoComplete && !legalInfoComplete) {
      currentStepIndex = 1;
    } else if (basicInfoComplete && legalInfoComplete) {
      currentStepIndex = 2;
    }
    
    const completionPercentage = Math.round((completedRequiredSteps / totalRequiredSteps) * 100);

    const state: OnboardingState = {
      currentStep: currentStepIndex,
      totalSteps: this.steps.length,
      completionPercentage,
      organization: this.organizationData() as FunderOrganization,
      isComplete: completionPercentage === 100,
      canCreateOpportunities: this.isReadyForVerification(),
      steps: [...this.steps]
    };

    this.onboardingStateSubject.next(state);
  }

  // ===============================
  // DATABASE MAPPING
  // ===============================

  private mapDatabaseToModel(dbOrg: any): FunderOrganization {
    return {
      id: dbOrg.id,
      userId: dbOrg.user_id,
      name: dbOrg.name,
      description: dbOrg.description,
      organizationType: dbOrg.organization_type,
      legalName: dbOrg.legal_name,
      registrationNumber: dbOrg.registration_number,
      taxNumber: dbOrg.tax_number,
      website: dbOrg.website,
      email: dbOrg.email,
      phone: dbOrg.phone,
      addressLine1: dbOrg.address_line1,
      addressLine2: dbOrg.address_line2,
      city: dbOrg.city,
      province: dbOrg.province,
      postalCode: dbOrg.postal_code,
      country: dbOrg.country,
      foundedYear: dbOrg.founded_year,
      employeeCount: dbOrg.employee_count,
      assetsUnderManagement: dbOrg.assets_under_management,
      status: dbOrg.status,
      isVerified: dbOrg.is_verified,
      version: dbOrg.version || 1,
      createdAt: new Date(dbOrg.created_at),
      updatedAt: new Date(dbOrg.updated_at)
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  getCurrentOrganization(): Partial<FunderOrganization> {
    return this.organizationData();
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [...this.steps];
  }

  canCreateOpportunities(): boolean {
    return this.onboardingStateSubject.value.canCreateOpportunities;
  }

  setCurrentStep(stepId: string) {
    if (this.steps.some(step => step.id === stepId)) {
      this.currentStep.set(stepId);
      this.saveToLocalStorage();
    }
  }

  getNextIncompleteStep(): string {
    if (!this.isBasicInfoValid()) {
      return 'organization-info';
    } else if (!this.isLegalInfoValid()) {
      return 'legal-compliance';
    } else {
      return 'verification';
    }
  }

  canAccessStep(stepId: string): boolean {
    switch (stepId) {
      case 'organization-info':
        return true;
      case 'legal-compliance':
        return this.isBasicInfoValid();
      case 'verification':
        return this.isReadyForVerification();
      default:
        return false;
    }
  }

  getStepProgress(): { completed: number; total: number; percentage: number } {
    const completedSteps = this.steps.filter(step => step.completed).length;
    const totalSteps = this.steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage
    };
  }

  // Force sync (manual trigger)
  forceSyncToDatabase(): Observable<void> {
    if (!this.networkState.isOnline) {
      return throwError(() => new Error('Cannot sync while offline'));
    }

    return this.saveToDatabase().pipe(
      switchMap(() => this.checkOnboardingStatus()),
      switchMap(() => of(void 0))
    );
  }

  // Clear all data (for logout)
  clearAllData(): void {
    this.organizationData.set({ country: 'South Africa', version: 1 });
    this.currentStep.set('organization-info');
    this.lastSavedLocally.set(null);
    this.lastSavedToDatabase.set(null);
    this.error.set(null);
    localStorage.removeItem(this.localStorageKey);
    
    // Clear queue
    this.saveQueue.length = 0;
    
    console.log('🧹 All onboarding data cleared');
  }

  // Cleanup on service destruction
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('online', this.handleConnectionRestore);
    window.removeEventListener('offline', this.handleConnectionLost);
  }
}