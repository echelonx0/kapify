// src/app/shared/services/activity.service.ts - UPDATED WITH DATABASE INTEGRATION
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseActivityService, Activity } from './database-activity.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private databaseService = inject(DatabaseActivityService);

  constructor() {
    //  console.log('ActivityService initialized with real database backend');
  }

  // ===============================
  // CORE ACTIVITY OPERATIONS (Maintaining original interface)
  // ===============================

  /**
   * Fetch the latest activities - now returns real database data
   */
  getActivities(): Observable<Activity[]> {
    return this.databaseService.getActivities();
  }

  /**
   * Get activities with pagination
   */
  getActivitiesPaged(page: number, pageSize: number): Observable<Activity[]> {
    // Map the new interface to the old one for backward compatibility
    return this.databaseService
      .getActivitiesPaged(page, pageSize)
      .pipe(map((result) => result.activities));
  }

  /**
   * Get activity by ID
   */
  getActivityById(id: number): Observable<Activity> {
    // Convert number ID to string for database service
    return this.databaseService.getActivityById(id.toString()).pipe(
      map((activity) => {
        if (!activity) {
          throw new Error('Activity not found');
        }
        return activity;
      })
    );
  }

  /**
   * Create new activity
   */
  createActivity(activity: Partial<Activity>): Observable<Activity> {
    return this.databaseService.createActivity({
      type: activity.type || 'system',
      action: 'created',
      message: activity.message || 'Activity created',
      entityType: activity.entityType,
      entityId: activity.entityId,
      amount: activity.amount,
      status: activity.status || 'completed',
      method: activity.method,
      metadata: activity.metadata,
    });
  }

  /**
   * Delete activity (for backward compatibility)
   */
  deleteActivity(id: number): Observable<void> {
    // Note: In the database version, we might not want to actually delete activities
    // for audit purposes. This could mark them as deleted instead.
    console.warn(
      'Activity deletion not implemented in database version for audit purposes'
    );
    throw new Error('Activity deletion not supported');
  }

  // ===============================
  // ENHANCED METHODS (New functionality)
  // ===============================

  /**
   * Track application activities automatically
   */
  trackApplicationActivity(
    action:
      | 'created'
      | 'updated'
      | 'submitted'
      | 'approved'
      | 'rejected'
      | 'withdrawn',
    applicationId: string,
    message: string,
    amount?: number
  ): void {
    this.databaseService.trackApplicationActivity(
      action,
      applicationId,
      message,
      amount
    );
  }

  /**
   * Track funding activities automatically
   */
  trackFundingActivity(
    action: 'approved' | 'disbursed' | 'repaid' | 'defaulted',
    message: string,
    amount: number,
    entityId?: string,
    method?: string
  ): void {
    this.databaseService.trackFundingActivity(
      action,
      message,
      amount,
      entityId,
      method
    );
  }

  /**
   * Track profile activities automatically
   */
  trackProfileActivity(
    action: 'created' | 'updated' | 'completed' | 'verified',
    message: string,
    profileSection?: string
  ): void {
    this.databaseService.trackProfileActivity(action, message, profileSection);
  }

  /**
   * Track document activities automatically
   */
  trackDocumentActivity(
    action: 'uploaded' | 'updated' | 'verified' | 'rejected',
    message: string,
    documentId?: string,
    documentType?: string
  ): void {
    this.databaseService.trackDocumentActivity(
      action,
      message,
      documentId,
      documentType
    );
  }

  // ===============================
  // UTILITY METHODS (Maintaining original interface)
  // ===============================

  /**
   * Format amount for display in Rand
   */
  formatAmount(amount: number): string {
    return this.databaseService.formatAmount(amount);
  }

  /**
   * Format relative time
   */
  formatRelativeTime(timestamp: string | Date): string {
    return this.databaseService.formatRelativeTime(timestamp);
  }

  // ===============================
  // REACTIVE DATA STREAMS
  // ===============================

  /**
   * Observable stream of activities (for reactive components)
   */
  get activities$(): Observable<Activity[]> {
    return this.databaseService.activities$;
  }

  /**
   * Current loading state
   */
  get isLoading() {
    return this.databaseService.isLoading;
  }

  /**
   * Current error state
   */
  get error() {
    return this.databaseService.error;
  }

  // ===============================
  // CACHE MANAGEMENT
  // ===============================

  /**
   * Clear activity cache (useful for refresh)
   */
  clearCache(): void {
    this.databaseService.clearCache();
  }

  /**
   * Get current activities from cache (without triggering API call)
   */
  getCurrentActivities(): Activity[] {
    return this.databaseService.getCurrentActivities();
  }

  // ===============================
  // NEW UTILITY METHODS
  // ===============================

  /**
   * Get activity type display name
   */
  getActivityTypeDisplayName(type: Activity['type']): string {
    return this.databaseService.getActivityTypeDisplayName(type);
  }

  /**
   * Get activity type color for UI
   */
  getActivityTypeColor(type: Activity['type']): string {
    return this.databaseService.getActivityTypeColor(type);
  }
}
