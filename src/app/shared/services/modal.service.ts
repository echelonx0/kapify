// // src/app/shared/services/modal.service.ts
// import { Injectable, signal } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class ModalService {
//   // Track which modals are open
//   private openModals = signal<Set<string>>(new Set());

//   // Sector validation modal state
//   showSectorValidationModal = signal(false);

//   /**
//    * Check if sector validation has been completed
//    */
//   hasSectorValidation(): boolean {
//     return localStorage.getItem('sectorValidationCompleted') === 'true';
//   }

//   /**
//    * Show sector validation modal
//    */
//   openSectorValidation() {
//     this.showSectorValidationModal.set(true);
//     this.addOpenModal('sector-validation');
//   }

//   /**
//    * Close sector validation modal
//    */
//   closeSectorValidation() {
//     this.showSectorValidationModal.set(false);
//     this.removeOpenModal('sector-validation');
//   }

//   /**
//    * Clear sector validation (for testing or admin purposes)
//    */
//   clearSectorValidation() {
//     localStorage.removeItem('sectorValidationCompleted');
//     localStorage.removeItem('sectorValidationDate');
//   }

//   /**
//    * Check if any modal is currently open
//    */
//   isAnyModalOpen(): boolean {
//     return this.openModals().size > 0;
//   }

//   /**
//    * Add modal to open tracking
//    */
//   private addOpenModal(id: string) {
//     const modals = new Set(this.openModals());
//     modals.add(id);
//     this.openModals.set(modals);
//   }

//   /**
//    * Remove modal from open tracking
//    */
//   private removeOpenModal(id: string) {
//     const modals = new Set(this.openModals());
//     modals.delete(id);
//     this.openModals.set(modals);
//   }
// }
import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private toast = inject(ToastService);

  // Track which modals are open
  private openModals = signal<Set<string>>(new Set());

  // Sector validation modal state
  showSectorValidationModal = signal(false);

  // Confirmation modal state
  showConfirmModal = signal(false);
  confirmOptions = signal<ConfirmOptions | null>(null);

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
   * Show confirmation dialog
   * @param options Confirmation dialog options
   */
  confirm(options: ConfirmOptions): void {
    this.confirmOptions.set(options);
    this.showConfirmModal.set(true);
    this.addOpenModal('confirm-dialog');
  }

  /**
   * Handle confirmation dialog confirm
   */
  confirmAction(): void {
    const options = this.confirmOptions();
    if (options) {
      this.closeConfirmModal();
      // Execute the confirm callback
      options.onConfirm();
    }
  }

  /**
   * Handle confirmation dialog cancel
   */
  cancelAction(): void {
    const options = this.confirmOptions();
    if (options?.onCancel) {
      options.onCancel();
    }
    this.closeConfirmModal();
  }

  /**
   * Close confirmation modal
   */
  private closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.confirmOptions.set(null);
    this.removeOpenModal('confirm-dialog');
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
