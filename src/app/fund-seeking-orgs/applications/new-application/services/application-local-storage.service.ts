import { Injectable } from '@angular/core';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';

export interface ApplicationSession {
  selectedCover: FundingApplicationCoverInformation | null;
  formData: {
    requestedAmount: string;
    purposeStatement: string;
    useOfFunds: string;
    fundingType: string;
  };
  timestamp: number;
}

/**
 * ApplicationStorageService
 *
 * Manages persistent storage for:
 * - Selected funding cover
 * - Associated form data
 * - Session metadata
 *
 * Uses nested structure for related data integrity.
 * Session storage for current session, localStorage for persistence.
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationStorageService {
  private readonly SESSION_KEY = 'kapify_application_session';
  private readonly SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save selected cover and form data to storage
   */
  saveSelectedCover(cover: FundingApplicationCoverInformation): void {
    try {
      const session: ApplicationSession = {
        selectedCover: cover,
        formData: {
          requestedAmount: cover.fundingAmount?.toString() || '',
          purposeStatement: cover.executiveSummary || '',
          useOfFunds: cover.useOfFunds || '',
          fundingType:
            cover.fundingTypes && cover.fundingTypes.length > 0
              ? cover.fundingTypes[0]
              : '',
        },
        timestamp: Date.now(),
      };

      // Save to both sessionStorage (fast) and localStorage (persistent)
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      console.log('✅ Application session saved:', cover.executiveSummary);
    } catch (error) {
      console.error('Error saving application session:', error);
    }
  }

  /**
   * Retrieve selected cover and form data from storage
   */
  getSelectedCover(): ApplicationSession | null {
    try {
      // Try sessionStorage first (faster)
      let sessionData = sessionStorage.getItem(this.SESSION_KEY);

      // Fall back to localStorage if session expired
      if (!sessionData) {
        sessionData = localStorage.getItem(this.SESSION_KEY);
      }

      if (!sessionData) {
        return null;
      }

      const session: ApplicationSession = JSON.parse(sessionData);

      // Check if session is still valid (within TTL)
      const age = Date.now() - session.timestamp;
      if (age > this.SESSION_TTL) {
        this.clearSelectedCover();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error retrieving application session:', error);
      return null;
    }
  }

  /**
   * Check if selected cover exists
   */
  hasSelectedCover(): boolean {
    return this.getSelectedCover() !== null;
  }

  /**
   * Clear stored session
   */
  clearSelectedCover(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.SESSION_KEY);
      console.log('🧹 Application session cleared');
    } catch (error) {
      console.error('Error clearing application session:', error);
    }
  }

  /**
   * Get just the cover data
   */
  getSavedCover(): FundingApplicationCoverInformation | null {
    const session = this.getSelectedCover();
    return session?.selectedCover || null;
  }

  /**
   * Get just the form data
   */
  getSavedFormData(): ApplicationSession['formData'] | null {
    const session = this.getSelectedCover();
    return session?.formData || null;
  }

  /**
   * Check session validity
   */
  isSessionValid(): boolean {
    const session = this.getSelectedCover();
    if (!session) return false;

    const age = Date.now() - session.timestamp;
    return age <= this.SESSION_TTL;
  }

  /**
   * Get remaining session time in milliseconds
   */
  getRemainingSessionTime(): number {
    const session = this.getSelectedCover();
    if (!session) return 0;

    const age = Date.now() - session.timestamp;
    const remaining = this.SESSION_TTL - age;

    return Math.max(0, remaining);
  }
}
