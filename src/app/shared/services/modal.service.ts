// src/app/shared/services/modal.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  // Track which modals are open
  private openModals = signal<Set<string>>(new Set());

  // Sector validation modal state
  showSectorValidationModal = signal(false);

  /**
   * Check if sector validation has been completed
   */
  hasSectorValidation(): boolean {
    return localStorage.getItem('sectorValidationCompleted') === 'true';
  }

  /**
   * Show sector validation modal
   */
  openSectorValidation() {
    this.showSectorValidationModal.set(true);
    this.addOpenModal('sector-validation');
  }

  /**
   * Close sector validation modal
   */
  closeSectorValidation() {
    this.showSectorValidationModal.set(false);
    this.removeOpenModal('sector-validation');
  }

  /**
   * Clear sector validation (for testing or admin purposes)
   */
  clearSectorValidation() {
    localStorage.removeItem('sectorValidationCompleted');
    localStorage.removeItem('sectorValidationDate');
  }

  /**
   * Check if any modal is currently open
   */
  isAnyModalOpen(): boolean {
    return this.openModals().size > 0;
  }

  /**
   * Add modal to open tracking
   */
  private addOpenModal(id: string) {
    const modals = new Set(this.openModals());
    modals.add(id);
    this.openModals.set(modals);
  }

  /**
   * Remove modal from open tracking
   */
  private removeOpenModal(id: string) {
    const modals = new Set(this.openModals());
    modals.delete(id);
    this.openModals.set(modals);
  }
}
