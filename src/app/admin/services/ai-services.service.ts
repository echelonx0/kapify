// src/app/admin/services/ai-services.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

export interface AiService {
  id: string;
  serviceName: string;
  displayName: string;
  description: string;
  category: 'intelligence' | 'analysis' | 'generation';
  edgeFunctionName: string;
  currentVersion: string;
  modelUsed: string;
  promptFilePath?: string;
  promptSummary?: string;
  lastPromptUpdate?: Date;
  isActive: boolean;
  isProduction: boolean;
  usesGrounding: boolean;
  hasDualMode: boolean;
  totalCalls: number;
  avgResponseTimeMs?: number;
  lastCalledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiPromptVersion {
  id: string;
  serviceId: string;
  versionNumber: string;
  versionLabel?: string;
  promptContent: string;
  pseudoCode?: string;
  changeSummary?: string;
  isCurrent: boolean;
  deployedAt?: Date;
  createdAt: Date;
}

export interface AiServiceSummary {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  servicesWithGrounding: number;
  dualModeServices: number;
}

@Injectable({
  providedIn: 'root',
})
export class AiServicesService {
  private supabase = inject(SharedSupabaseService);

  // State management
  private servicesSubject = new BehaviorSubject<AiService[]>([]);
  services$ = this.servicesSubject.asObservable();

  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    console.log('🤖 [AI Services] Service initialized');
  }

  // ============================================================================
  // AI SERVICES CRUD
  // ============================================================================

  /**
   * Get all AI services
   */
  getServices(): Observable<AiService[]> {
    console.log('🔍 [AI Services] Fetching all services');
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchServices()).pipe(
      tap((services) => {
        console.log(`✅ [AI Services] Loaded ${services.length} services`);
        this.servicesSubject.next(services);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ [AI Services] Failed to load services:', error);
        this.error.set(error.message || 'Failed to load AI services');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single service by ID
   */
  getServiceById(serviceId: string): Observable<AiService> {
    console.log('🔍 [AI Services] Fetching service:', serviceId);
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchServiceById(serviceId)).pipe(
      tap((service) => {
        console.log('✅ [AI Services] Service loaded:', service.displayName);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ [AI Services] Failed to load service:', error);
        this.error.set(error.message || 'Failed to load service');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get service summary statistics
   */
  getServiceSummary(): Observable<AiServiceSummary> {
    console.log('📊 [AI Services] Fetching summary stats');

    return from(this.fetchServiceSummary()).pipe(
      tap((summary) => {
        console.log('✅ [AI Services] Summary loaded:', summary);
      }),
      catchError((error) => {
        console.error('❌ [AI Services] Failed to load summary:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update service metadata
   */
  updateService(
    serviceId: string,
    updates: Partial<AiService>
  ): Observable<AiService> {
    console.log('💾 [AI Services] Updating service:', serviceId, updates);
    this.isLoading.set(true);

    return from(this.performUpdateService(serviceId, updates)).pipe(
      tap((updatedService) => {
        console.log(
          '✅ [AI Services] Service updated:',
          updatedService.displayName
        );

        // Update local cache
        const currentServices = this.servicesSubject.value;
        const updatedServices = currentServices.map((s) =>
          s.id === serviceId ? updatedService : s
        );
        this.servicesSubject.next(updatedServices);

        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ [AI Services] Update failed:', error);
        this.error.set(error.message || 'Failed to update service');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  // ============================================================================
  // PROMPT VERSIONS
  // ============================================================================

  /**
   * Get all prompt versions for a service
   */
  getPromptVersions(serviceId: string): Observable<AiPromptVersion[]> {
    console.log('📜 [AI Services] Fetching prompt versions for:', serviceId);

    return from(this.fetchPromptVersions(serviceId)).pipe(
      tap((versions) => {
        console.log(`✅ [AI Services] Loaded ${versions.length} versions`);
      }),
      catchError((error) => {
        console.error('❌ [AI Services] Failed to load versions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current prompt version for a service
   */
  getCurrentPromptVersion(
    serviceId: string
  ): Observable<AiPromptVersion | null> {
    console.log('📜 [AI Services] Fetching current prompt for:', serviceId);

    return from(this.fetchCurrentPromptVersion(serviceId)).pipe(
      tap((version) => {
        if (version) {
          console.log(
            '✅ [AI Services] Current version:',
            version.versionNumber
          );
        } else {
          console.log('ℹ️ [AI Services] No current version found');
        }
      }),
      catchError((error) => {
        console.error(
          '❌ [AI Services] Failed to load current version:',
          error
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Load prompt content from markdown file
   */
  loadPromptMarkdown(filePath: string): Observable<string> {
    console.log('📄 [AI Services] Loading prompt markdown:', filePath);

    return from(this.fetchPromptMarkdown(filePath)).pipe(
      tap(() => {
        console.log('✅ [AI Services] Markdown loaded');
      }),
      catchError((error) => {
        console.error('❌ [AI Services] Failed to load markdown:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================================================
  // PRIVATE IMPLEMENTATION
  // ============================================================================

  private async fetchServices(): Promise<AiService[]> {
    const { data, error } = await this.supabase
      .from('ai_services')
      .select('*')
      .order('display_name', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []).map(this.transformDatabaseToLocal);
  }

  private async fetchServiceById(serviceId: string): Promise<AiService> {
    const { data, error } = await this.supabase
      .from('ai_services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('Service not found');
    }

    return this.transformDatabaseToLocal(data);
  }

  private async fetchServiceSummary(): Promise<AiServiceSummary> {
    const { data, error } = await this.supabase
      .rpc('get_ai_services_summary')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Type assertion since RPC returns unknown
    const result = data as any;

    return {
      totalServices: result.total_services || 0,
      activeServices: result.active_services || 0,
      inactiveServices: result.inactive_services || 0,
      servicesWithGrounding: result.services_with_grounding || 0,
      dualModeServices: result.dual_mode_services || 0,
    };
  }

  private async performUpdateService(
    serviceId: string,
    updates: Partial<AiService>
  ): Promise<AiService> {
    const dbUpdates = this.transformLocalToDatabase(updates);

    const { data, error } = await this.supabase
      .from('ai_services')
      .update(dbUpdates)
      .eq('id', serviceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    return this.transformDatabaseToLocal(data);
  }

  private async fetchPromptVersions(
    serviceId: string
  ): Promise<AiPromptVersion[]> {
    const { data, error } = await this.supabase
      .from('ai_prompt_versions')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []).map(this.transformPromptVersionToLocal);
  }

  private async fetchCurrentPromptVersion(
    serviceId: string
  ): Promise<AiPromptVersion | null> {
    const { data, error } = await this.supabase
      .from('ai_prompt_versions')
      .select('*')
      .eq('service_id', serviceId)
      .eq('is_current', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return this.transformPromptVersionToLocal(data);
  }

  private async fetchPromptMarkdown(filePath: string): Promise<string> {
    try {
      // In real implementation, this would fetch from a file server or storage
      // For now, return placeholder
      return `# Prompt Markdown\n\nFile path: ${filePath}\n\nContent would be loaded here.`;
    } catch (error) {
      throw new Error(`Failed to load markdown: ${error}`);
    }
  }

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  private transformDatabaseToLocal(data: any): AiService {
    return {
      id: data.id,
      serviceName: data.service_name,
      displayName: data.display_name,
      description: data.description,
      category: data.category,
      edgeFunctionName: data.edge_function_name,
      currentVersion: data.current_version,
      modelUsed: data.model_used,
      promptFilePath: data.prompt_file_path,
      promptSummary: data.prompt_summary,
      lastPromptUpdate: data.last_prompt_update
        ? new Date(data.last_prompt_update)
        : undefined,
      isActive: data.is_active,
      isProduction: data.is_production,
      usesGrounding: data.uses_grounding,
      hasDualMode: data.has_dual_mode,
      totalCalls: data.total_calls || 0,
      avgResponseTimeMs: data.avg_response_time_ms,
      lastCalledAt: data.last_called_at
        ? new Date(data.last_called_at)
        : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private transformLocalToDatabase(data: Partial<AiService>): any {
    const dbData: any = {};

    if (data.serviceName) dbData.service_name = data.serviceName;
    if (data.displayName) dbData.display_name = data.displayName;
    if (data.description) dbData.description = data.description;
    if (data.category) dbData.category = data.category;
    if (data.edgeFunctionName)
      dbData.edge_function_name = data.edgeFunctionName;
    if (data.currentVersion) dbData.current_version = data.currentVersion;
    if (data.modelUsed) dbData.model_used = data.modelUsed;
    if (data.promptFilePath) dbData.prompt_file_path = data.promptFilePath;
    if (data.promptSummary) dbData.prompt_summary = data.promptSummary;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;
    if (data.isProduction !== undefined)
      dbData.is_production = data.isProduction;
    if (data.usesGrounding !== undefined)
      dbData.uses_grounding = data.usesGrounding;
    if (data.hasDualMode !== undefined) dbData.has_dual_mode = data.hasDualMode;

    return dbData;
  }

  private transformPromptVersionToLocal(data: any): AiPromptVersion {
    return {
      id: data.id,
      serviceId: data.service_id,
      versionNumber: data.version_number,
      versionLabel: data.version_label,
      promptContent: data.prompt_content,
      pseudoCode: data.pseudo_code,
      changeSummary: data.change_summary,
      isCurrent: data.is_current,
      deployedAt: data.deployed_at ? new Date(data.deployed_at) : undefined,
      createdAt: new Date(data.created_at),
    };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get category badge color
   */
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      intelligence: 'bg-blue-50 text-blue-700 border-blue-200/50',
      analysis: 'bg-teal-50 text-teal-700 border-teal-200/50',
      generation: 'bg-purple-50 text-purple-700 border-purple-200/50',
    };
    return colors[category] || 'bg-slate-50 text-slate-700 border-slate-200/50';
  }

  /**
   * Get status badge color
   */
  getStatusColor(isActive: boolean): string {
    return isActive
      ? 'bg-green-50 text-green-700 border-green-200/50'
      : 'bg-red-50 text-red-700 border-red-200/50';
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }
}
