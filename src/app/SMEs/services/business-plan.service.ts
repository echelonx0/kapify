// src/app/applications/services/business-plan.service.ts  
import { Injectable, signal, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { environment } from '../../../environments/environment';

// Business plan section interfaces
export interface BusinessPlanSection {
  id?: string;
  userId: string;
  sectionType: string;
  data: Record<string, any>;
  completed: boolean;
  completionPercentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessPlanProfile {
  companyInfo: any;
  executiveSummary: any;
  marketAnalysis: any;
  productsServices: any;
  marketingPlan: any;
  operationsPlan: any;
  managementTeam: any;
  financialProjections: any;
  fundingRequest: any;
  appendix: any;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessPlanService {
  private authService = inject(AuthService);
  private supabase: SupabaseClient;
  
  // State management
  private sectionsSubject = new BehaviorSubject<BusinessPlanSection[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private savingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Signals
  sections = signal<BusinessPlanSection[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  lastSavedAt = signal<Date | null>(null);

  // Observables
  sections$ = this.sectionsSubject.asObservable();
  isLoading$ = this.loadingSubject.asObservable();
  isSaving$ = this.savingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  // Section types
  readonly SECTION_TYPES = [
    'company_info',
    'executive_summary', 
    'market_analysis',
    'products_services',
    'marketing_plan',
    'operations_plan',
    'management_team',
    'financial_projections',
    'funding_request',
    'appendix'
  ] as const;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    this.initializeService();
  }

  // ===============================
  // INITIALIZATION
  // ===============================

  private initializeService(): void {
    // Load data when user authentication changes
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadBusinessPlan();
      } else {
        this.clearState();
      }
    });
  }

  // ===============================
  // LOAD BUSINESS PLAN
  // ===============================

  loadBusinessPlan(): Observable<BusinessPlanSection[]> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.setLoading(true);
    this.setError(null);

    return from(this.performLoadBusinessPlan(currentUser.id)).pipe(
      tap(sections => {
        this.sections.set(sections);
        this.sectionsSubject.next(sections);
        console.log('✅ Business plan loaded:', sections.length, 'sections');
      }),
      catchError(error => {
        console.error('❌ Failed to load business plan:', error);
        this.setError('Failed to load business plan data');
        return throwError(() => error);
      }),
      tap(() => this.setLoading(false))
    );
  }

  private async performLoadBusinessPlan(userId: string): Promise<BusinessPlanSection[]> {
    const { data, error } = await this.supabase
      .from('business_plan_sections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  // ===============================
  // SAVE BUSINESS PLAN SECTIONS
  // ===============================

  saveSection(sectionType: string, data: Record<string, any>, completed: boolean = false): Observable<BusinessPlanSection> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.setSaving(true);
    this.setError(null);

    const completionPercentage = this.calculateSectionCompletion(data, completed);

    return from(this.performSaveSection(currentUser.id, sectionType, data, completed, completionPercentage)).pipe(
      tap(savedSection => {
        this.updateLocalSection(savedSection);
        this.lastSavedAt.set(new Date());
        console.log('✅ Section saved:', sectionType);
      }),
      catchError(error => {
        console.error('❌ Failed to save section:', error);
        this.setError(`Failed to save ${sectionType}`);
        return throwError(() => error);
      }),
      tap(() => this.setSaving(false))
    );
  }

  private async performSaveSection(
    userId: string, 
    sectionType: string, 
    data: Record<string, any>, 
    completed: boolean,
    completionPercentage: number
  ): Promise<BusinessPlanSection> {
    
    const sectionData = {
      user_id: userId,
      section_type: sectionType,
      data: data,
      completed: completed,
      completion_percentage: completionPercentage,
      updated_at: new Date().toISOString()
    };

    // Use upsert to insert or update
    const { data: result, error } = await this.supabase
      .from('business_plan_sections')
      .upsert(sectionData, {
        onConflict: 'user_id,section_type',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Save failed: ${error.message}`);
    }

    return {
      id: result.id,
      userId: result.user_id,
      sectionType: result.section_type,
      data: result.data,
      completed: result.completed,
      completionPercentage: result.completion_percentage,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  // ===============================
  // SAVE COMPLETE BUSINESS PLAN
  // ===============================

  saveCompleteBusinessPlan(profileData: BusinessPlanProfile): Observable<{success: boolean; savedSections: string[]}> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.setSaving(true);
    this.setError(null);

    return from(this.performSaveCompleteBusinessPlan(currentUser.id, profileData)).pipe(
      tap(result => {
        this.lastSavedAt.set(new Date());
        console.log('✅ Complete business plan saved:', result.savedSections);
      }),
      catchError(error => {
        console.error('❌ Failed to save complete business plan:', error);
        this.setError('Failed to save complete business plan');
        return throwError(() => error);
      }),
      tap(() => this.setSaving(false))
    );
  }

  private async performSaveCompleteBusinessPlan(userId: string, profileData: BusinessPlanProfile): Promise<{success: boolean; savedSections: string[]}> {
    const savedSections: string[] = [];
    const sectionsToSave = [];

    // Prepare all sections for batch upsert
    for (const [key, value] of Object.entries(profileData)) {
      if (value && Object.keys(value).length > 0) {
        const sectionType = this.camelToSnakeCase(key);
        const completionPercentage = this.calculateSectionCompletion(value, true);
        
        sectionsToSave.push({
          user_id: userId,
          section_type: sectionType,
          data: value,
          completed: true,
          completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        });
        
        savedSections.push(sectionType);
      }
    }

    if (sectionsToSave.length === 0) {
      throw new Error('No data to save');
    }

    // Batch upsert all sections
    const { error } = await this.supabase
      .from('business_plan_sections')
      .upsert(sectionsToSave, {
        onConflict: 'user_id,section_type',
        ignoreDuplicates: false
      });

    if (error) {
      throw new Error(`Batch save failed: ${error.message}`);
    }

    // Update local state
    this.loadBusinessPlan().subscribe();

    return {
      success: true,
      savedSections
    };
  }

  // ===============================
  // GET SECTION DATA
  // ===============================

  getSection(sectionType: string): BusinessPlanSection | null {
    const sections = this.sections();
    return sections.find(section => section.sectionType === sectionType) || null;
  }

  getSectionData(sectionType: string): Record<string, any> {
    const section = this.getSection(sectionType);
    return section?.data || {};
  }

  isSectionCompleted(sectionType: string): boolean {
    const section = this.getSection(sectionType);
    return section?.completed || false;
  }

  getSectionCompletionPercentage(sectionType: string): number {
    const section = this.getSection(sectionType);
    return section?.completionPercentage || 0;
  }

  // ===============================
  // DELETE SECTION
  // ===============================

  deleteSection(sectionType: string): Observable<boolean> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performDeleteSection(currentUser.id, sectionType)).pipe(
      tap(() => {
        this.removeLocalSection(sectionType);
        console.log('✅ Section deleted:', sectionType);
      }),
      catchError(error => {
        console.error('❌ Failed to delete section:', error);
        this.setError(`Failed to delete ${sectionType}`);
        return throwError(() => error);
      })
    );
  }

  private async performDeleteSection(userId: string, sectionType: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('business_plan_sections')
      .delete()
      .eq('user_id', userId)
      .eq('section_type', sectionType);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return true;
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private calculateSectionCompletion(data: Record<string, any>, isCompleted: boolean): number {
    if (isCompleted) return 100;
    
    const totalFields = Object.keys(data).length;
    if (totalFields === 0) return 0;
    
    const filledFields = Object.values(data).filter(value => 
      value !== null && 
      value !== undefined && 
      value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
    
    return Math.round((filledFields / totalFields) * 100);
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private updateLocalSection(section: BusinessPlanSection): void {
    const currentSections = this.sections();
    const existingIndex = currentSections.findIndex(s => s.sectionType === section.sectionType);
    
    if (existingIndex >= 0) {
      currentSections[existingIndex] = section;
    } else {
      currentSections.push(section);
    }
    
    this.sections.set([...currentSections]);
    this.sectionsSubject.next([...currentSections]);
  }

  private removeLocalSection(sectionType: string): void {
    const currentSections = this.sections().filter(s => s.sectionType !== sectionType);
    this.sections.set(currentSections);
    this.sectionsSubject.next(currentSections);
  }

  private clearState(): void {
    this.sections.set([]);
    this.sectionsSubject.next([]);
    this.setError(null);
    this.setLoading(false);
    this.setSaving(false);
  }

  private setLoading(loading: boolean): void {
    this.isLoading.set(loading);
    this.loadingSubject.next(loading);
  }

  private setSaving(saving: boolean): void {
    this.isSaving.set(saving);
    this.savingSubject.next(saving);
  }

  private setError(error: string | null): void {
    this.error.set(error);
    this.errorSubject.next(error);
  }

  // ===============================
  // COMPUTED PROPERTIES
  // ===============================

  getOverallCompletion(): number {
    const sections = this.sections();
    if (sections.length === 0) return 0;
    
    const totalCompletion = sections.reduce((sum, section) => sum + section.completionPercentage, 0);
    return Math.round(totalCompletion / sections.length);
  }

  getCompletedSectionsCount(): number {
    return this.sections().filter(section => section.completed).length;
  }

  getTotalSectionsCount(): number {
    return this.SECTION_TYPES.length;
  }
}