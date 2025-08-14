 

// // Fixed version - keeps your imports, removes endless loading issues
// import { Injectable, signal, inject } from '@angular/core';
// import { Observable, from, throwError, BehaviorSubject, Subject, of, timer } from 'rxjs';
// import { tap, catchError, finalize, switchMap, retryWhen, delay, take, share, debounceTime, timeout } from 'rxjs/operators';
 
// import { AuthService } from '../../auth/production.auth.service';
// import { SharedSupabaseService } from '../../shared/services/supabase.service';

// export interface FunderOrganization {
//   id?: string;
//   userId: string;
//   name: string;
//   description?: string;
//   organizationType: 'investment_fund' | 'bank' | 'government' | 'ngo' | 'private_equity' | 'venture_capital';
//   legalName?: string;
//   registrationNumber?: string;
//   taxNumber?: string;
//   website?: string;
//   email?: string;
//   phone?: string;
//   addressLine1?: string;
//   addressLine2?: string;
//   city?: string;
//   province?: string;
//   postalCode?: string;
//   country: string;
//   foundedYear?: number;
//   employeeCount?: number;
//   assetsUnderManagement?: number;
//   status: 'active' | 'inactive' | 'pending_verification';
//   isVerified: boolean;
//   version?: number;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// export interface OnboardingStep {
//   id: string;
//   title: string;
//   shortTitle: string;
//   description: string;
//   completed: boolean;
//   required: boolean;
//   estimatedTime: string;
// }

// export interface OnboardingState {
//   currentStep: number;
//   totalSteps: number;
//   completionPercentage: number;
//   organization?: FunderOrganization;
//   isComplete: boolean;
//   canCreateOpportunities: boolean;
//   steps: OnboardingStep[];
// }

 
// @Injectable({
//   providedIn: 'root'
// })
// export class FunderOnboardingService {
//   private supabaseService = inject(SharedSupabaseService); // Use shared service
//   private authService = inject(AuthService);
//   private destroy$ = new Subject<void>();
//   private localStorageKey = 'funder-onboarding-data';
  
//   // FIX 1: Add debounced save to prevent spam
//   private saveSubject = new Subject<void>();
//   private currentSaveOperation$: Observable<any> | null = null;
  
//   // Simplified state management
//   isLoading = signal(false);
//   isSaving = signal(false);
//   error = signal<string | null>(null);
//   lastSavedLocally = signal<Date | null>(null);
//   lastSavedToDatabase = signal<Date | null>(null);
//   currentStep = signal<string>('organization-info');
//   connectionStatus = signal<'online' | 'offline' | 'reconnecting'>('online');

//   organizationData = signal<Partial<FunderOrganization>>({
//     country: 'South Africa',
//     version: 1
//   });

//   // Steps configuration
//   private steps: OnboardingStep[] = [
//     {
//       id: 'organization-info',
//       title: 'Basic Information',
//       shortTitle: 'Basic Info',
//       description: 'Organization name, type, description, and contact details',
//       completed: false,
//       required: true,
//       estimatedTime: '5 min'
//     },
//     {
//       id: 'legal-compliance',
//       title: 'Legal & Registration',
//       shortTitle: 'Legal Info',
//       description: 'Legal name, registration numbers, and compliance details',
//       completed: false,
//       required: true,
//       estimatedTime: '3 min'
//     },
//     {
//       id: 'verification',
//       title: 'Verification',
//       shortTitle: 'Get Verified',
//       description: 'Submit for verification to start funding',
//       completed: false,
//       required: false,
//       estimatedTime: '2 min'
//     }
//   ];

//   private onboardingStateSubject = new BehaviorSubject<OnboardingState>({
//     currentStep: 0,
//     totalSteps: 3,
//     completionPercentage: 0,
//     isComplete: false,
//     canCreateOpportunities: false,
//     steps: this.steps
//   });
  
//   onboardingState$ = this.onboardingStateSubject.asObservable();

//   constructor() {
//     console.log('🚀 FunderOnboardingService initialized - using shared Supabase client');
    
//     this.initializeService();
//     this.setupDebouncedSave();
//   }

//   private initializeService() {
//     this.loadFromLocalStorage();
    
//     // FIX 2: Simplified network monitoring without auto-sync loops
//     window.addEventListener('online', () => {
//       console.log('🌐 Connection restored');
//       this.connectionStatus.set('online');
//       this.error.set(null);
//     });
    
//     window.addEventListener('offline', () => {
//       console.log('🔌 Working offline');
//       this.connectionStatus.set('offline');
//       this.error.set('Working offline - changes will sync when connection is restored');
      
//       // Auto-clear offline message after 5 seconds
//       timer(5000).pipe(take(1)).subscribe(() => {
//         if (this.error() === 'Working offline - changes will sync when connection is restored') {
//           this.error.set(null);
//         }
//       });
//     });
//   }

//   // FIX 3: Debounced save to prevent endless saves
//   private setupDebouncedSave() {
//     this.saveSubject.pipe(
//       debounceTime(2000), // Wait 2 seconds after last change
//       switchMap(() => {
//         // Only auto-save if online and user is authenticated
//         if (!navigator.onLine || !this.authService.user()) {
//           return of({ success: true });
//         }
//         return this.performDatabaseSave();
//       }),
//       share() // Prevent multiple subscriptions
//     ).subscribe({
//       next: (result) => {
//         if (result.success) {
//           console.log('✅ Auto-save completed');
//           this.lastSavedToDatabase.set(new Date());
//         }
//       },
//       error: (error) => {
//         console.error('❌ Auto-save failed:', error);
//         // Don't show error for auto-save failures
//       }
//     });
//   }

//   // FIX 4: Simplified database save without complex queuing
//   saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
//     console.log('💾 Manual database save...');
    
//     // FIX 5: Prevent multiple simultaneous saves
//     if (this.currentSaveOperation$) {
//       console.log('⏳ Save already in progress, returning existing operation');
//       return this.currentSaveOperation$;
//     }
    
//     if (!navigator.onLine) {
//       console.log('📱 Offline - data saved locally');
//       return of({ success: true });
//     }
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.error.set('Please log in to save');
//       return throwError(() => new Error('User not authenticated'));
//     }

//     const data = this.organizationData();
//     if (!data.name?.trim()) {
//       this.error.set('Organization name is required');
//       return throwError(() => new Error('Organization name is required'));
//     }

//     this.currentSaveOperation$ = this.performDatabaseSave().pipe(
//       finalize(() => {
//         this.currentSaveOperation$ = null;
//         this.isSaving.set(false);
//       }),
//       share()
//     );

//     this.isSaving.set(true);
//     this.error.set(null);
    
//     return this.currentSaveOperation$;
//   }

//   // FIX 6: Simplified database operation with detailed debugging
//   private performDatabaseSave(): Observable<{ success: boolean; organizationId?: string }> {
//     console.log('🔄 performDatabaseSave() started');
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       console.error('❌ No authenticated user');
//       return throwError(() => new Error('User not authenticated'));
//     }

//     console.log('✅ User authenticated:', currentAuth.id);
//     const data = this.organizationData();
//     console.log('📋 Organization data to save:', data);
    
//     // Use simple upsert instead of complex RPC
//     const orgData = {
//       user_id: currentAuth.id,
//       name: data.name || '',
//       description: data.description,
//       organization_type: data.organizationType || 'investment_fund',
//       legal_name: data.legalName,
//       registration_number: data.registrationNumber,
//       tax_number: data.taxNumber,
//       website: data.website,
//       email: data.email,
//       phone: data.phone,
//       address_line1: data.addressLine1,
//       address_line2: data.addressLine2,
//       city: data.city,
//       province: data.province,
//       postal_code: data.postalCode,
//       country: data.country || 'South Africa',
//       founded_year: data.foundedYear,
//       employee_count: data.employeeCount,
//       assets_under_management: data.assetsUnderManagement,
//       status: data.status || 'active',
//       is_verified: data.isVerified || false,
//       updated_at: new Date().toISOString()
//     };

//     console.log('🚀 Attempting database upsert with data:', orgData);

//     return from(this.supabaseService.from('funder_organizations')
//       .upsert(orgData, { 
//         onConflict: 'user_id',
//         ignoreDuplicates: false 
//       })
//       .select()
//       .single()
//     ).pipe(
//       timeout(30000), // 30 second timeout instead of 10
//       tap(({ data: result, error }) => {
//         console.log('📡 Database response received');
//         console.log('🔍 Result:', result);
//         console.log('🔍 Error:', error);
        
//         if (error) {
//           console.error('❌ Database error details:', error);
//           throw new Error(`Database error: ${error.message}`);
//         }
        
//         if (!result) {
//           console.error('❌ No result returned from database');
//           throw new Error('No data returned from database');
//         }
        
//         // Update local data with database result
//         this.organizationData.update(current => ({
//           ...current,
//           id: result.id,
//           version: (current.version || 1) + 1
//         }));
        
//         this.saveToLocalStorage();
//         console.log('✅ Database save successful, org ID:', result.id);
//       }),
//       switchMap(({ data: result }) => {
//         console.log('🎯 Mapping result to response object');
//         return of({ 
//           success: true, 
//           organizationId: result.id 
//         });
//       }),
//       retryWhen(errors => 
//         errors.pipe(
//           tap(error => {
//             console.log('⚠️ Save failed, will retry...', error.message);
//             console.log('📊 Error details:', error);
//           }),
//           delay(1000),
//           take(2) // Only retry twice
//         )
//       ),
//       catchError(error => {
//         console.error('💥 Save failed completely after retries:', error);
//         console.error('📊 Final error details:', error);
//         this.handleSaveError(error);
//         return throwError(() => error);
//       }),
//       finalize(() => {
//         console.log('🏁 performDatabaseSave() completed');
//       })
//     );
//   }

//   // FIX 7: Simplified data update
//   updateOrganizationData(updates: Partial<FunderOrganization>) {
//     console.log('📝 Updating organization data:', Object.keys(updates));
    
//     this.organizationData.update(current => ({
//       ...current,
//       ...updates
//     }));
    
//     this.saveToLocalStorage();
//     this.updateStepCompletionFromData();
    
//     // Trigger debounced save only if online
//     if (navigator.onLine) {
//       this.saveSubject.next();
//     }
//   }

//   // FIX 8: Much simplified status check
//   checkOnboardingStatus(): Observable<OnboardingState> {
//     console.log('🔍 Checking onboarding status...');
    
//     // Don't set loading if already loading to prevent UI flicker
//     if (!this.isLoading()) {
//       this.isLoading.set(true);
//     }
//     this.error.set(null);
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isLoading.set(false);
//       return of(this.generateStateFromLocalData());
//     }

//     // Simple database fetch without complex retry logic
//     return from(this.supabaseService.from('funder_organizations')
//       .select('*')
//       .eq('user_id', currentAuth.id)
//       .maybeSingle() // Use maybeSingle instead of single to avoid errors
//     ).pipe(
//       tap(({ data: organization, error }) => {
//         if (error) {
//           console.warn('⚠️ Status check error:', error.message);
//           // Don't throw, just continue with local data
//         }

//         if (organization) {
//           const mappedOrg = this.mapDatabaseToModel(organization);
//           this.organizationData.set(mappedOrg);
//           this.saveToLocalStorage();
//           console.log('✅ Organization data loaded from database');
//         } else {
//           console.log('ℹ️ No organization found, using local data');
//         }
//       }),
//       switchMap(() => {
//         const state = this.generateStateFromLocalData();
//         this.onboardingStateSubject.next(state);
//         return of(state);
//       }),
//       catchError(error => {
//         console.error('❌ Status check failed:', error);
//         // Always return local data instead of failing
//         const state = this.generateStateFromLocalData();
//         this.onboardingStateSubject.next(state);
//         return of(state);
//       }),
//       finalize(() => {
//         this.isLoading.set(false);
//       })
//     );
//   }

//   // Verification method
//   requestVerification(): Observable<{ success: boolean; message: string }> {
//     console.log('🛡️ Requesting verification...');
    
//     if (!navigator.onLine) {
//       return throwError(() => new Error('Verification requires internet connection'));
//     }

//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     if (!this.isReadyForVerification()) {
//       return throwError(() => new Error('Complete all required information first'));
//     }

//     return from(this.supabaseService.from('funder_organizations')
//       .update({ 
//         status: 'pending_verification',
//         updated_at: new Date().toISOString()
//       })
//       .eq('user_id', currentAuth.id)
//     ).pipe(
//       tap(({ error }) => {
//         if (error) {
//           throw new Error(`Verification request failed: ${error.message}`);
//         }

//         // Update local data
//         this.organizationData.update(current => ({
//           ...current,
//           status: 'pending_verification' as const
//         }));
//         this.saveToLocalStorage();
//       }),
//       switchMap(() => of({
//         success: true,
//         message: 'Verification request submitted successfully'
//       })),
//       catchError(error => {
//         console.error('❌ Verification request failed:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   private handleSaveError(error: any) {
//     let errorMessage = 'Failed to save organization';
    
//     if (!navigator.onLine) {
//       errorMessage = 'Working offline - changes saved locally';
//     } else if (error.message?.includes('permission') || error.message?.includes('auth')) {
//       errorMessage = 'Authentication required - please log in';
//     } else if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
//       errorMessage = 'Organization already exists';
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
    
//     this.error.set(errorMessage);
    
//     // Auto-clear error after 8 seconds
//     timer(8000).pipe(take(1)).subscribe(() => {
//       if (this.error() === errorMessage) {
//         this.error.set(null);
//       }
//     });
//   }

//   // Local storage methods
//   private saveToLocalStorage() {
//     try {
//       const user = this.authService.user();
//       if (!user) return;

//       const dataToSave = {
//         organizationData: this.organizationData(),
//         currentStep: this.currentStep(),
//         lastSaved: new Date().toISOString(),
//         userId: user.id,
//         version: this.organizationData().version || 1
//       };

//       localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
//       this.lastSavedLocally.set(new Date());
//     } catch (error) {
//       console.error('❌ localStorage save failed:', error);
//     }
//   }

//   private loadFromLocalStorage() {
//     try {
//       const user = this.authService.user();
//       if (!user) return;

//       const saved = localStorage.getItem(this.localStorageKey);
//       if (saved) {
//         const parsedData = JSON.parse(saved);
        
//         if (parsedData.userId === user.id) {
//           this.organizationData.set({
//             ...parsedData.organizationData,
//             country: parsedData.organizationData.country || 'South Africa',
//             version: parsedData.version || 1
//           });
//           this.currentStep.set(parsedData.currentStep || 'organization-info');
//           this.lastSavedLocally.set(new Date(parsedData.lastSaved));
//           this.updateStepCompletionFromData();
//         }
//       }
//     } catch (error) {
//       console.error('❌ localStorage load failed:', error);
//     }
//   }

//   // Utility methods
//   private generateStateFromLocalData(): OnboardingState {
//     const localData = this.organizationData();
//     const basicComplete = this.isBasicInfoValid();
//     const legalComplete = this.isLegalInfoValid();
    
//     let currentStepIndex = 0;
//     if (basicComplete && !legalComplete) {
//       currentStepIndex = 1;
//     } else if (basicComplete && legalComplete) {
//       currentStepIndex = 2;
//     }
    
//     const completionPercentage = this.calculateLocalCompletionPercentage();

//     return {
//       currentStep: currentStepIndex,
//       totalSteps: 3,
//       completionPercentage,
//       organization: localData as FunderOrganization,
//       isComplete: basicComplete && legalComplete,
//       canCreateOpportunities: this.isReadyForVerification(),
//       steps: this.updateStepsFromLocalData()
//     };
//   }

//   private updateStepsFromLocalData(): OnboardingStep[] {
//     return this.steps.map(step => ({
//       ...step,
//       completed: step.id === 'organization-info' 
//         ? this.isBasicInfoValid()
//         : step.id === 'legal-compliance'
//         ? this.isLegalInfoValid()
//         : false
//     }));
//   }

//   private updateStepCompletionFromData() {
//     const basicInfoComplete = this.isBasicInfoValid();
//     const legalInfoComplete = this.isLegalInfoValid();
    
//     this.steps[0].completed = basicInfoComplete;
//     this.steps[1].completed = legalInfoComplete;
//     this.steps[2].completed = false;
    
//     const state = this.generateStateFromLocalData();
//     this.onboardingStateSubject.next(state);
//   }

//   private calculateLocalCompletionPercentage(): number {
//     const basicInfoComplete = this.isBasicInfoValid();
//     const legalInfoComplete = this.isLegalInfoValid();
    
//     if (basicInfoComplete && legalInfoComplete) return 100;
//     if (basicInfoComplete) return 50;
//     if (this.hasBasicData()) return 25;
//     return 0;
//   }

//   private hasBasicData(): boolean {
//     const data = this.organizationData();
//     return !!(data.name?.trim() || data.email?.trim());
//   }

//   // Validation methods
//   isBasicInfoValid(): boolean {
//     const data = this.organizationData();
//     return !!(
//       data.name?.trim() &&
//       data.description?.trim() &&
//       data.organizationType &&
//       data.email?.trim() &&
//       data.phone?.trim()
//     );
//   }

//   isLegalInfoValid(): boolean {
//     const data = this.organizationData();
//     return !!(
//       data.legalName?.trim() &&
//       data.registrationNumber?.trim() &&
//       data.addressLine1?.trim() &&
//       data.city?.trim() &&
//       data.province &&
//       data.country
//     );
//   }

//   isReadyForVerification(): boolean {
//     return this.isBasicInfoValid() && this.isLegalInfoValid();
//   }

//   isFullyComplete(): boolean {
//     const data = this.organizationData();
//     return this.isReadyForVerification() && !!data.id;
//   }

//   // Database mapping
//   private mapDatabaseToModel(dbOrg: any): FunderOrganization {
//     return {
//       id: dbOrg.id,
//       userId: dbOrg.user_id,
//       name: dbOrg.name,
//       description: dbOrg.description,
//       organizationType: dbOrg.organization_type,
//       legalName: dbOrg.legal_name,
//       registrationNumber: dbOrg.registration_number,
//       taxNumber: dbOrg.tax_number,
//       website: dbOrg.website,
//       email: dbOrg.email,
//       phone: dbOrg.phone,
//       addressLine1: dbOrg.address_line1,
//       addressLine2: dbOrg.address_line2,
//       city: dbOrg.city,
//       province: dbOrg.province,
//       postalCode: dbOrg.postal_code,
//       country: dbOrg.country,
//       foundedYear: dbOrg.founded_year,
//       employeeCount: dbOrg.employee_count,
//       assetsUnderManagement: dbOrg.assets_under_management,
//       status: dbOrg.status,
//       isVerified: dbOrg.is_verified,
//       version: dbOrg.version || 1,
//       createdAt: new Date(dbOrg.created_at),
//       updatedAt: new Date(dbOrg.updated_at)
//     };
//   }

//   // Public utility methods
//   getCurrentOrganization(): Partial<FunderOrganization> {
//     return this.organizationData();
//   }

//   getOnboardingSteps(): OnboardingStep[] {
//     return [...this.steps];
//   }

//   canCreateOpportunities(): boolean {
//     return this.onboardingStateSubject.value.canCreateOpportunities;
//   }

//   setCurrentStep(stepId: string) {
//     if (this.steps.some(step => step.id === stepId)) {
//       this.currentStep.set(stepId);
//       this.saveToLocalStorage();
//     }
//   }

//   getNextIncompleteStep(): string {
//     if (!this.isBasicInfoValid()) {
//       return 'organization-info';
//     } else if (!this.isLegalInfoValid()) {
//       return 'legal-compliance';
//     } else {
//       return 'verification';
//     }
//   }

//   canAccessStep(stepId: string): boolean {
//     switch (stepId) {
//       case 'organization-info':
//         return true;
//       case 'legal-compliance':
//         return this.isBasicInfoValid();
//       case 'verification':
//         return this.isReadyForVerification();
//       default:
//         return false;
//     }
//   }

//   getStepProgress(): { completed: number; total: number; percentage: number } {
//     const completedSteps = this.steps.filter(step => step.completed).length;
//     const totalSteps = this.steps.length;
//     const percentage = Math.round((completedSteps / totalSteps) * 100);
    
//     return {
//       completed: completedSteps,
//       total: totalSteps,
//       percentage
//     };
//   }

//   // Manual sync method
//   forceSyncToDatabase(): Observable<void> {
//     if (!navigator.onLine) {
//       return throwError(() => new Error('Cannot sync while offline'));
//     }

//     return this.saveToDatabase().pipe(
//       switchMap(() => this.checkOnboardingStatus()),
//       switchMap(() => of(void 0))
//     );
//   }

//   // Clear all data (for logout)
//   clearAllData(): void {
//     this.organizationData.set({ country: 'South Africa', version: 1 });
//     this.currentStep.set('organization-info');
//     this.lastSavedLocally.set(null);
//     this.lastSavedToDatabase.set(null);
//     this.error.set(null);
//     localStorage.removeItem(this.localStorageKey);
    
//     // Clear any ongoing operations
//     this.currentSaveOperation$ = null;
    
//     console.log('🧹 All onboarding data cleared');
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//     window.removeEventListener('online', () => {});
//     window.removeEventListener('offline', () => {});
//   }
// }

// Hybrid Funder Onboarding Service - Simple core with component compatibility
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, of, BehaviorSubject, timer } from 'rxjs';
import { tap, catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/supabase.service';

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
  version?: number;
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

@Injectable({
  providedIn: 'root'
})
export class FunderOnboardingService {
  private supabaseService = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private localStorageKey = 'funder-onboarding-data';
  
  // Simple state
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  lastSavedLocally = signal<Date | null>(null);
  lastSavedToDatabase = signal<Date | null>(null);
  currentStep = signal<string>('organization-info');
  
  organizationData = signal<Partial<FunderOrganization>>({
    country: 'South Africa'
  });

  // Steps
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

  // Observable state for components that need it
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
    console.log('🚀 Hybrid FunderOnboardingService initialized');
    this.loadFromLocalStorage();
    this.updateStateFromData();
  }

  // ===============================
  // CORE DATA OPERATIONS
  // ===============================

  // Update data locally only
  updateOrganizationData(updates: Partial<FunderOrganization>) {
    this.organizationData.update(current => ({
      ...current,
      ...updates
    }));
    this.saveToLocalStorage();
    this.updateStateFromData();
  }

  // Save to database - simple and clean
  saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
    const user = this.authService.user();
    if (!user) {
      this.error.set('Please log in to save');
      return throwError(() => new Error('Not authenticated'));
    }

    const data = this.organizationData();
    if (!data.name?.trim()) {
      this.error.set('Organization name is required');
      return throwError(() => new Error('Name required'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    // Simple data mapping
    const orgData = {
      user_id: user.id,
      name: data.name,
      description: data.description || null,
      organization_type: data.organizationType || 'investment_fund',
      legal_name: data.legalName || null,
      registration_number: data.registrationNumber || null,
      tax_number: data.taxNumber || null,
      website: data.website || null,
      email: data.email || null,
      phone: data.phone || null,
      address_line1: data.addressLine1 || null,
      address_line2: data.addressLine2 || null,
      city: data.city || null,
      province: data.province || null,
      postal_code: data.postalCode || null,
      country: data.country || 'South Africa',
      founded_year: data.foundedYear || null,
      employee_count: data.employeeCount || null,
      assets_under_management: data.assetsUnderManagement || null,
      status: data.status || 'active',
      is_verified: data.isVerified || false,
      updated_at: new Date().toISOString()
    };

    return from(
      this.supabaseService.from('funder_organizations')
        .upsert(orgData, { onConflict: 'user_id' })
        .select()
        .single()
    ).pipe(
      tap(({ data: result, error }) => {
        if (error) {
          throw error;
        }
        
        // Update local data with ID
        this.organizationData.update(current => ({
          ...current,
          id: result.id
        }));
        this.saveToLocalStorage();
        this.lastSavedToDatabase.set(new Date());
        this.updateStateFromData();
      }),
      switchMap(({ data: result }) => of({ success: true, organizationId: result.id })),
      catchError(error => {
        console.error('Save failed:', error);
        this.error.set(error.message || 'Failed to save');
        this.isSaving.set(false);
        return throwError(() => error);
      }),
      tap(() => {
        this.isSaving.set(false);
        console.log('✅ Saved successfully');
      })
    );
  }

  // Load from database - called by components that need fresh data
  checkOnboardingStatus(): Observable<OnboardingState> {
    const user = this.authService.user();
    if (!user) {
      return of(this.getOnboardingState());
    }

    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.supabaseService.from('funder_organizations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
    ).pipe(
      tap(({ data: org, error }) => {
        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (org) {
          const mapped = this.mapDatabaseToModel(org);
          this.organizationData.set(mapped);
          this.saveToLocalStorage();
        }
      }),
      switchMap(() => {
        const state = this.getOnboardingState();
        this.onboardingStateSubject.next(state);
        return of(state);
      }),
      catchError(error => {
        console.error('Load failed:', error);
        this.error.set('Failed to load data');
        this.isLoading.set(false);
        const state = this.getOnboardingState();
        this.onboardingStateSubject.next(state);
        return of(state);
      }),
      tap(() => {
        this.isLoading.set(false);
      })
    );
  }

  // Request verification
  requestVerification(): Observable<{ success: boolean; message: string }> {
    if (!this.isReadyForVerification()) {
      return throwError(() => new Error('Complete all required information first'));
    }

    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabaseService.from('funder_organizations')
        .update({ 
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    ).pipe(
      tap(({ error }) => {
        if (error) {
          throw new Error(`Verification request failed: ${error.message}`);
        }

        this.organizationData.update(current => ({
          ...current,
          status: 'pending_verification' as const
        }));
        this.saveToLocalStorage();
        this.updateStateFromData();
      }),
      switchMap(() => of({
        success: true,
        message: 'Verification request submitted successfully'
      })),
      catchError(error => {
        console.error('Verification request failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // COMPONENT COMPATIBILITY METHODS
  // ===============================

  // Get current state - used by many components
  getOnboardingState(): OnboardingState {
    const data = this.organizationData();
    const basicComplete = this.isBasicInfoValid();
    const legalComplete = this.isLegalInfoValid();
    
    let currentStepIndex = 0;
    if (basicComplete && !legalComplete) {
      currentStepIndex = 1;
    } else if (basicComplete && legalComplete) {
      currentStepIndex = 2;
    }
    
    let completionPercentage = 0;
    if (basicComplete && legalComplete) completionPercentage = 100;
    else if (basicComplete) completionPercentage = 50;
    else if (data.name?.trim()) completionPercentage = 25;

    return {
      currentStep: currentStepIndex,
      totalSteps: 3,
      completionPercentage,
      organization: data as FunderOrganization,
      isComplete: basicComplete && legalComplete,
      canCreateOpportunities: basicComplete && legalComplete,
      steps: this.steps.map(step => ({
        ...step,
        completed: step.id === 'organization-info' 
          ? basicComplete
          : step.id === 'legal-compliance'
          ? legalComplete
          : false
      }))
    };
  }

  // Update internal state and broadcast to subscribers
  private updateStateFromData() {
    const state = this.getOnboardingState();
    this.onboardingStateSubject.next(state);
  }

  // Step management methods used by layout component
  setCurrentStep(stepId: string) {
    if (this.steps.some(step => step.id === stepId)) {
      this.currentStep.set(stepId);
      this.saveToLocalStorage();
    }
  }

  getOnboardingSteps(): OnboardingStep[] {
    return this.steps.map(step => ({
      ...step,
      completed: step.id === 'organization-info' 
        ? this.isBasicInfoValid()
        : step.id === 'legal-compliance'
        ? this.isLegalInfoValid()
        : false
    }));
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
    const steps = this.getOnboardingSteps();
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage
    };
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

  // ===============================
  // VALIDATION METHODS
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

  canCreateOpportunities(): boolean {
    return this.isReadyForVerification();
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
  // LOCAL STORAGE
  // ===============================

  private saveToLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const dataToSave = {
        organizationData: this.organizationData(),
        currentStep: this.currentStep(),
        lastSaved: new Date().toISOString(),
        userId: user.id
      };

      localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
    } catch (error) {
      console.error('localStorage save failed:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        if (parsedData.userId === user.id) {
          this.organizationData.set({
            ...parsedData.organizationData,
            country: parsedData.organizationData.country || 'South Africa'
          });
          this.currentStep.set(parsedData.currentStep || 'organization-info');
          if (parsedData.lastSaved) {
            this.lastSavedLocally.set(new Date(parsedData.lastSaved));
          }
        }
      }
    } catch (error) {
      console.error('localStorage load failed:', error);
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  getCurrentOrganization(): Partial<FunderOrganization> {
    return this.organizationData();
  }

  clearAllData(): void {
    this.organizationData.set({ country: 'South Africa' });
    this.currentStep.set('organization-info');
    this.lastSavedLocally.set(null);
    this.lastSavedToDatabase.set(null);
    this.error.set(null);
    
    const user = this.authService.user();
    if (user) {
      localStorage.removeItem(this.localStorageKey);
    }
    
    this.updateStateFromData();
    console.log('🧹 All onboarding data cleared');
  }

  // For error handling with auto-clear
  private handleError(error: any, customMessage?: string) {
    const errorMessage = customMessage || error.message || 'An error occurred';
    this.error.set(errorMessage);
    
    // Auto-clear error after 8 seconds
    timer(8000).pipe(take(1)).subscribe(() => {
      if (this.error() === errorMessage) {
        this.error.set(null);
      }
    });
  }
}