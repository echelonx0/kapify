// // src/app/shared/services/action-modal.service.ts
// import { Injectable } from '@angular/core';
// import { signal, computed } from '@angular/core';

// export type ActionType = 'delete' | 'duplicate' | 'publish-success' | 'publish-error';

// export interface ModalData {
//   actionType: ActionType;
//   opportunityTitle: string;
//   hasApplications?: boolean;
//   applicationCount?: number;
//   errorMessage?: string;
//   opportunityId?: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class ActionModalService {
//   // State
//   private _isOpen = signal(false);
//   private _data = signal<ModalData>({
//     actionType: 'delete',
//     opportunityTitle: '',
//     hasApplications: false,
//     applicationCount: 0
//   });
//   private _isLoading = signal(false);
//   private _errorMessage = signal<string | null>(null);

//   // Public accessors
//   isOpen = this._isOpen.asReadonly();
//   data = this._data.asReadonly();
//   isLoading = this._isLoading.asReadonly();
//   errorMessage = this._errorMessage.asReadonly();

//   // Computed for convenience
//   actionType = computed(() => this._data().actionType);

//   // Callbacks
//   private _onConfirm: (() => void) | null = null;
//   private _onCancel: (() => void) | null = null;
//   private _onSuccess: (() => void) | null = null;

//   open(data: ModalData, callbacks?: {
//     onConfirm?: () => void;
//     onCancel?: () => void;
//     onSuccess?: () => void;
//   }) {
//     this._data.set(data);
//     this._isLoading.set(false);
//     this._errorMessage.set(null);
    
//     this._onConfirm = callbacks?.onConfirm || null;
//     this._onCancel = callbacks?.onCancel || null;
//     this._onSuccess = callbacks?.onSuccess || null;
    
//     this._isOpen.set(true);
//   }

//   close() {
//     this._isOpen.set(false);
//   }

//   confirm() {
//     this._isLoading.set(true);
//     this._errorMessage.set(null);
//     this._onConfirm?.();
//   }

//   cancel() {
//     if (!this._isLoading()) {
//       this._onCancel?.();
//       this.close();
//     }
//   }

//   success() {
//     this._onSuccess?.();
//     this.close();
//   }

//   setError(message: string) {
//     this._isLoading.set(false);
//     this._errorMessage.set(message);
//   }

//   setLoading(loading: boolean) {
//     this._isLoading.set(loading);
//   }

//   showPublishSuccess(title: string) {
//     this._data.set({
//       actionType: 'publish-success',
//       opportunityTitle: title
//     });
//     this._isLoading.set(false);
//     this._errorMessage.set(null);
//     this._isOpen.set(true);
//   }

//   showPublishError(title: string, errorMessage: string) {
//     this._data.set({
//       actionType: 'publish-error',
//       opportunityTitle: title,
//       errorMessage
//     });
//     this._isLoading.set(false);
//     this._isOpen.set(true);
//   }

//   showDelete(title: string, hasApplications: boolean, applicationCount: number) {
//     this._data.set({
//       actionType: 'delete',
//       opportunityTitle: title,
//       hasApplications,
//       applicationCount
//     });
//     this._isLoading.set(false);
//     this._errorMessage.set(null);
//     this._isOpen.set(true);
//   }

//   showDuplicate(title: string) {
//     this._data.set({
//       actionType: 'duplicate',
//       opportunityTitle: title
//     });
//     this._isLoading.set(false);
//     this._errorMessage.set(null);
//     this._isOpen.set(true);
//   }
// }


// src/app/shared/services/action-modal.service.ts
import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

export type ActionType = 'delete' | 'duplicate' | 'publish-success' | 'publish-error' | 'withdraw' | 'withdraw-success' | 'withdraw-error';

export interface ModalData {
  actionType: ActionType;
  opportunityTitle?: string;
  applicationTitle?: string;
  hasApplications?: boolean;
  applicationCount?: number;
  errorMessage?: string;
  message?: string;
  opportunityId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActionModalService {
  // State
  private _isOpen = signal(false);
  private _data = signal<ModalData>({
    actionType: 'delete'
  });
  private _isLoading = signal(false);
  private _errorMessage = signal<string | null>(null);

  // Public accessors
  isOpen = this._isOpen.asReadonly();
  data = this._data.asReadonly();
  isLoading = this._isLoading.asReadonly();
  errorMessage = this._errorMessage.asReadonly();

  // Computed for convenience
  actionType = computed(() => this._data().actionType);

  // Event streams for reactive patterns
  private confirmSubject = new Subject<void>();
  private cancelSubject = new Subject<void>();
  private successSubject = new Subject<void>();

  public confirmed$ = this.confirmSubject.asObservable();
  public cancelled$ = this.cancelSubject.asObservable();
  public succeeded$ = this.successSubject.asObservable();

  // Callbacks (legacy pattern support)
  private _onConfirm: (() => void) | null = null;
  private _onCancel: (() => void) | null = null;
  private _onSuccess: (() => void) | null = null;

  // ============================================
  // BACKWARD COMPATIBLE: OLD PATTERN
  // ============================================
  
  /**
   * Legacy open method - maintains backward compatibility
   */
  open(data: ModalData, callbacks?: {
    onConfirm?: () => void;
    onCancel?: () => void;
    onSuccess?: () => void;
  }) {
    this._data.set(data);
    this._isLoading.set(false);
    this._errorMessage.set(null);
    
    this._onConfirm = callbacks?.onConfirm || null;
    this._onCancel = callbacks?.onCancel || null;
    this._onSuccess = callbacks?.onSuccess || null;
    
    this._isOpen.set(true);
  }

  /**
   * Legacy convenience methods - keep existing API
   */
  showPublishSuccess(title: string) {
    this._data.set({
      actionType: 'publish-success',
      opportunityTitle: title
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showPublishError(title: string, errorMessage: string) {
    this._data.set({
      actionType: 'publish-error',
      opportunityTitle: title,
      errorMessage
    });
    this._isLoading.set(false);
    this._isOpen.set(true);
  }

  showDelete(title: string, hasApplications: boolean = false, applicationCount: number = 0) {
    this._data.set({
      actionType: 'delete',
      opportunityTitle: title,
      hasApplications,
      applicationCount
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showDuplicate(title: string) {
    this._data.set({
      actionType: 'duplicate',
      opportunityTitle: title
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  // ============================================
  // NEW WITHDRAW METHODS
  // ============================================

  showWithdrawConfirm(applicationTitle: string, applicationNumber?: string) {
    this._data.set({
      actionType: 'withdraw',
      applicationTitle,
      message: applicationNumber ? `Application #${applicationNumber}` : undefined
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showWithdrawSuccess(applicationTitle: string) {
    this._data.set({
      actionType: 'withdraw-success',
      applicationTitle,
      message: 'Your application has been withdrawn successfully. You can reapply anytime.'
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showWithdrawError(applicationTitle: string, errorMessage: string) {
    this._data.set({
      actionType: 'withdraw-error',
      applicationTitle,
      errorMessage
    });
    this._isLoading.set(false);
    this._isOpen.set(true);
  }

  // ============================================
  // CORE CONTROL METHODS
  // ============================================

  close() {
    this._isOpen.set(false);
  }

  confirm() {
    this._isLoading.set(true);
    this._errorMessage.set(null);
    this.confirmSubject.next();
    this._onConfirm?.();
  }

  cancel() {
    if (!this._isLoading()) {
      this.cancelSubject.next();
      this._onCancel?.();
      this.close();
    }
  }

  success() {
    this.successSubject.next();
    this._onSuccess?.();
    this.close();
  }

  setError(message: string) {
    this._isLoading.set(false);
    this._errorMessage.set(message);
  }

  setLoading(loading: boolean) {
    this._isLoading.set(loading);
  }

  // ============================================
  // HELPER METHODS (for components to use)
  // ============================================

  isSuccessState(): boolean {
    const type = this.actionType();
    return type.includes('-success');
  }

  isErrorState(): boolean {
    const type = this.actionType();
    return type.includes('-error');
  }

  isConfirmationState(): boolean {
    const type = this.actionType();
    return ['delete', 'duplicate', 'withdraw'].includes(type);
  }

  getColorScheme(): 'red' | 'green' | 'amber' | 'blue' {
    switch (this.actionType()) {
      case 'delete':
      case 'publish-error':
      case 'withdraw-error':
        return 'red';
      case 'duplicate':
      case 'publish-success':
      case 'withdraw-success':
        return 'green';
      case 'withdraw':
        return 'amber';
      default:
        return 'blue';
    }
  }

  getActionButtonText(): string {
    switch (this.actionType()) {
      case 'delete':
        return 'Delete';
      case 'duplicate':
        return 'Create Copy';
      case 'withdraw':
        return 'Withdraw Application';
      default:
        return 'Continue';
    }
  }


  
}