// src/app/funding/services/draft-management.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, of, EMPTY } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { FundingOpportunityService } from 'src/app/funding/services/funding-opportunity.service';
 

export interface DraftSummary {
  hasDraft: boolean;
  completionPercentage: number;
  lastSaved: string | null;
  title: string | null;
  id: string | null;
  stepCount: number;
  completedSteps: number;
}

export interface DraftAction {
  type: 'save' | 'clear' | 'load' | 'auto_save';
  timestamp: Date;
  stepId?: string;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DraftManagementService {
  private opportunityService = inject(FundingOpportunityService);
  
  // Core state
  private draftSummarySubject = new BehaviorSubject<DraftSummary>({
    hasDraft: false,
    completionPercentage: 0,
    lastSaved: null,
    title: null,
    id: null,
    stepCount: 0,
    completedSteps: 0
  });

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private lastActionSubject = new BehaviorSubject<DraftAction | null>(null);
  
  // Public observables
  readonly draftSummary$ = this.draftSummarySubject.asObservable();
  readonly isLoading$ = this.isLoadingSubject.asObservable();
  readonly lastAction$ = this.lastActionSubject.asObservable();

  // Signals for reactive components
  readonly draftSummary = signal<DraftSummary>(this.draftSummarySubject.value);
  readonly isLoading = signal<boolean>(false);
  readonly hasUnsavedChanges = signal<boolean>(false);

  // Computed properties
  readonly canContinueDraft = computed(() => this.draftSummary().hasDraft);
  readonly draftTitle = computed(() => this.draftSummary().title || 'Untitled Opportunity');
  readonly completionText = computed(() => `${this.draftSummary().completionPercentage}% complete`);
  readonly lastSavedText = computed(() => this.formatLastSaved(this.draftSummary().lastSaved));

  constructor() {
    // Subscribe to draft summary changes and update signals
    this.draftSummary$.subscribe(summary => {
      this.draftSummary.set(summary);
    });

    this.isLoading$.subscribe(loading => {
      this.isLoading.set(loading);
    });

    // Auto-load draft summary on service creation
    this.loadDraftSummary().subscribe();
  }

  /**
   * Load current draft summary
   */
  loadDraftSummary(): Observable<DraftSummary> {
    this.isLoadingSubject.next(true);
    
    return this.opportunityService.getDraftSummary().pipe(
      map(summary => this.transformToDraftSummary(summary)),
      tap(summary => {
        this.draftSummarySubject.next(summary);
        this.recordAction({
          type: 'load',
          timestamp: new Date(),
          success: true
        });
      }),
      catchError(error => {
        console.error('Failed to load draft summary:', error);
        this.recordAction({
          type: 'load',
          timestamp: new Date(),
          success: false,
          error: error.message
        });
        return of(this.getEmptyDraftSummary());
      }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Check if user has draft and decide next action
   */
  checkDraftAndProceed(): Observable<'continue' | 'clear' | 'create_new'> {
    return this.loadDraftSummary().pipe(
      switchMap(summary => {
        if (!summary.hasDraft) {
          return of('create_new' as const);
        }

        // In a real app, you might show a modal here
        // For now, we'll use a simple confirm dialog
        const userChoice = confirm(
          `You have an existing draft: "${summary.title || 'Untitled'}"\n\n` +
          `Completion: ${summary.completionPercentage}%\n` +
          `Last saved: ${this.formatLastSaved(summary.lastSaved)}\n\n` +
          'Click OK to continue with your draft, or Cancel to start fresh.'
        );

        return of(userChoice ? 'continue' as const : 'clear' as const);
      })
    );
  }

  /**
   * Clear all drafts
   */
  clearAllDrafts(): Observable<void> {
    this.isLoadingSubject.next(true);
    
    return this.opportunityService.clearAllDrafts().pipe(
      map(() => void 0), // Convert {success: boolean} to void
      tap(() => {
        this.draftSummarySubject.next(this.getEmptyDraftSummary());
        this.hasUnsavedChanges.set(false);
        this.recordAction({
          type: 'clear',
          timestamp: new Date(),
          success: true
        });
      }),
      catchError(error => {
        console.error('Failed to clear drafts:', error);
        this.recordAction({
          type: 'clear',
          timestamp: new Date(),
          success: false,
          error: error.message
        });
        throw error;
      }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Save draft data for a specific step
   */
  saveDraftStep(stepId: string, data: any): Observable<void> {
    // Map step IDs to section types that your service understands
    const sectionType = this.mapStepToSection(stepId);
    
    return this.opportunityService.saveSection(sectionType, data).pipe(
      map(() => void 0), // Convert SaveSectionResponse to void
      tap(() => {
        this.hasUnsavedChanges.set(false);
        this.recordAction({
          type: 'save',
          timestamp: new Date(),
          stepId,
          success: true
        });
        // Refresh draft summary after save
        this.loadDraftSummary().subscribe();
      }),
      catchError(error => {
        console.error('Failed to save draft step:', error);
        this.recordAction({
          type: 'save',
          timestamp: new Date(),
          stepId,
          success: false,
          error: error.message
        });
        throw error;
      })
    );
  }

  /**
   * Auto-save draft data (debounced)
   */
  autoSaveDraftStep(stepId: string, data: any): Observable<void> {
    const sectionType = this.mapStepToSection(stepId);
    
    return this.opportunityService.saveSection(sectionType, data, true).pipe(
      map(() => void 0), // Convert SaveSectionResponse to void
      tap(() => {
        this.recordAction({
          type: 'auto_save',
          timestamp: new Date(),
          stepId,
          success: true
        });
        // Refresh summary but don't reset unsaved changes for auto-save
        this.loadDraftSummary().subscribe();
      }),
      catchError(error => {
        console.warn('Auto-save failed:', error);
        this.recordAction({
          type: 'auto_save',
          timestamp: new Date(),
          stepId,
          success: false,
          error: error.message
        });
        // Don't throw error for auto-save failures
        return EMPTY;
      })
    );
  }

  // Private helper methods

  /**
   * Map generic step IDs to your service's section types
   */
  private mapStepToSection(stepId: string): 'basic-info' | 'investment-terms' | 'eligibility-criteria' | 'application-process' | 'settings' {
    const stepMapping: Record<string, any> = {
      'basic-info': 'basic-info',
      'basic_info': 'basic-info',
      'step1': 'basic-info',
      'investment-terms': 'investment-terms',
      'investment_terms': 'investment-terms', 
      'step2': 'investment-terms',
      'eligibility-criteria': 'eligibility-criteria',
      'eligibility_criteria': 'eligibility-criteria',
      'step3': 'eligibility-criteria',
      'application-process': 'application-process',
      'application_process': 'application-process',
      'step4': 'application-process',
      'settings': 'settings',
      'step5': 'settings'
    };
    
    return stepMapping[stepId] || 'basic-info';
  }

  /**
   * Mark that user has unsaved changes
   */
  markUnsavedChanges(): void {
    this.hasUnsavedChanges.set(true);
  }

  /**
   * Get draft progress color based on completion percentage
   */
  getDraftProgressColor(): string {
    const completion = this.draftSummary().completionPercentage;
    
    if (completion >= 80) {
      return 'bg-gradient-to-r from-green-500 to-green-600';
    } else if (completion >= 50) {
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    } else {
      return 'bg-gradient-to-r from-orange-500 to-orange-600';
    }
  }

  /**
   * Get draft card styling classes
   */
  getDraftCardClasses(): string {
    const completion = this.draftSummary().completionPercentage;
    
    if (completion >= 80) {
      return 'border-l-green-500 bg-green-50';
    } else if (completion >= 50) {
      return 'border-l-blue-500 bg-blue-50';
    } else {
      return 'border-l-orange-500 bg-orange-50';
    }
  }

  /**
   * Get user-friendly status message
   */
  getDraftStatusMessage(): string {
    const summary = this.draftSummary();
    
    if (!summary.hasDraft) {
      return 'No draft available';
    }

    const completion = summary.completionPercentage;
    const lastSaved = this.formatLastSaved(summary.lastSaved);
    
    if (completion >= 80) {
      return `Almost done! ${completion}% complete • ${lastSaved}`;
    } else if (completion >= 50) {
      return `Making progress • ${completion}% complete • ${lastSaved}`;
    } else if (completion > 0) {
      return `Just getting started • ${completion}% complete • ${lastSaved}`;
    } else {
      return `Draft created • ${lastSaved}`;
    }
  }

  /**
   * Check if user should be prompted about unsaved changes
   */
  shouldPromptBeforeNavigation(): boolean {
    return this.hasUnsavedChanges() && this.draftSummary().hasDraft;
  }

  /**
   * Handle navigation away from draft
   */
  handleNavigationAway(autoSave: boolean = true): Observable<boolean> {
    if (!this.hasUnsavedChanges()) {
      return of(true);
    }

    if (autoSave && this.draftSummary().hasDraft) {
      // Auto-save before navigation
      return this.loadDraftSummary().pipe(
        map(() => {
          this.hasUnsavedChanges.set(false);
          return true;
        }),
        catchError(() => of(true))
      );
    }

    // Prompt user about unsaved changes
    const proceed = confirm(
      'You have unsaved changes that will be lost.\n\n' +
      'Do you want to leave without saving?'
    );

    if (proceed) {
      this.hasUnsavedChanges.set(false);
    }

    return of(proceed);
  }

  // Private helper methods

  private formatLastSaved(lastSaved: string | null): string {
    if (!lastSaved) return 'Never saved';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Saved yesterday';
    if (diffDays < 7) return `Saved ${diffDays} days ago`;
    
    return `Saved ${date.toLocaleDateString()}`;
  }

  private getEmptyDraftSummary(): DraftSummary {
    return {
      hasDraft: false,
      completionPercentage: 0,
      lastSaved: null,
      title: null,
      id: null,
      stepCount: 0,
      completedSteps: 0
    };
  }

  private transformToDraftSummary(data: any): DraftSummary {
    return {
      hasDraft: data.hasDraft || false,
      completionPercentage: data.completionPercentage || 0,
      lastSaved: data.lastSaved || null,
      title: data.title || null,
      id: data.id || null,
      stepCount: data.stepCount || 0,
      completedSteps: data.completedSteps || 0
    };
  }

  private recordAction(action: DraftAction): void {
    this.lastActionSubject.next(action);
    console.log('Draft action:', action);
  }
}