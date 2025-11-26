// src/app/shared/services/action-modal.service.ts
import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

export type ActionType =
  | 'delete'
  | 'duplicate'
  | 'publish-success'
  | 'publish-error'
  | 'withdraw'
  | 'withdraw-success'
  | 'withdraw-error'
  | 'info' // ← NEW: Generic info modal
  | 'success' // ← NEW: Generic success modal
  | 'error' // ← NEW: Generic error modal
  | 'warning'; // ← NEW: Generic warning modal

export interface ModalData {
  actionType: ActionType;
  opportunityTitle?: string;
  applicationTitle?: string;
  hasApplications?: boolean;
  applicationCount?: number;
  errorMessage?: string;
  message?: string;
  opportunityId?: string;
  // NEW: Generic modal fields
  title?: string;
  subtitle?: string;
  actionText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ActionModalService {
  // State
  private _isOpen = signal(false);
  private _data = signal<ModalData>({
    actionType: 'delete',
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
   * NOW EXTENDED: Supports generic modals with title/subtitle
   */
  open(
    actionTypeOrData: ActionType | ModalData,
    dataOrCallbacks?:
      | Partial<ModalData>
      | {
          onConfirm?: () => void;
          onCancel?: () => void;
          onSuccess?: () => void;
        },
    callbacks?: {
      onConfirm?: () => void;
      onCancel?: () => void;
      onSuccess?: () => void;
    }
  ) {
    let finalData: ModalData;
    let finalCallbacks: typeof callbacks | undefined;

    // Handle overloaded signatures
    if (typeof actionTypeOrData === 'string') {
      // open('info', { title: 'X', subtitle: 'Y' }, callbacks)
      finalData = {
        actionType: actionTypeOrData,
        ...(dataOrCallbacks as Partial<ModalData>),
      };
      finalCallbacks = callbacks;
    } else {
      // open({ actionType: 'info', title: 'X' }, callbacks)
      finalData = actionTypeOrData;
      finalCallbacks = dataOrCallbacks as typeof callbacks;
    }

    this._data.set(finalData);
    this._isLoading.set(false);
    this._errorMessage.set(null);

    this._onConfirm = finalCallbacks?.onConfirm || null;
    this._onCancel = finalCallbacks?.onCancel || null;
    this._onSuccess = finalCallbacks?.onSuccess || null;

    this._isOpen.set(true);
  }

  /**
   * Legacy convenience methods - keep existing API
   */
  showPublishSuccess(title: string) {
    this._data.set({
      actionType: 'publish-success',
      opportunityTitle: title,
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showPublishError(title: string, errorMessage: string) {
    this._data.set({
      actionType: 'publish-error',
      opportunityTitle: title,
      errorMessage,
    });
    this._isLoading.set(false);
    this._isOpen.set(true);
  }

  showDelete(
    title: string,
    hasApplications: boolean = false,
    applicationCount: number = 0
  ) {
    this._data.set({
      actionType: 'delete',
      opportunityTitle: title,
      hasApplications,
      applicationCount,
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showDuplicate(title: string) {
    this._data.set({
      actionType: 'duplicate',
      opportunityTitle: title,
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  // ============================================
  // WITHDRAW METHODS
  // ============================================

  showWithdrawConfirm(applicationTitle: string, applicationNumber?: string) {
    this._data.set({
      actionType: 'withdraw',
      applicationTitle,
      message: applicationNumber
        ? `Application #${applicationNumber}`
        : undefined,
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showWithdrawSuccess(applicationTitle: string) {
    this._data.set({
      actionType: 'withdraw-success',
      applicationTitle,
      message:
        'Your application has been withdrawn successfully. You can reapply anytime.',
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  showWithdrawError(applicationTitle: string, errorMessage: string) {
    this._data.set({
      actionType: 'withdraw-error',
      applicationTitle,
      errorMessage,
    });
    this._isLoading.set(false);
    this._isOpen.set(true);
  }

  // ============================================
  // NEW: GENERIC MODAL METHODS (DATA ROOM)
  // ============================================

  /**
   * Show generic info modal (blue)
   * Usage: modalService.showInfo('Coming Soon', 'This feature will be available soon')
   */
  showInfo(title: string, subtitle: string, actionText: string = 'Got it') {
    this._data.set({
      actionType: 'info',
      title,
      subtitle,
      actionText,
      showCancel: false,
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  /**
   * Show generic success modal (green)
   */
  showSuccess(
    title: string,
    subtitle: string,
    actionText: string = 'Continue'
  ) {
    this._data.set({
      actionType: 'success',
      title,
      subtitle,
      actionText,
      showCancel: false,
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
    this._isOpen.set(true);
  }

  /**
   * Show generic error modal (red)
   */
  showError(
    title: string,
    subtitle: string,
    errorMessage?: string,
    actionText: string = 'Got it'
  ) {
    this._data.set({
      actionType: 'error',
      title,
      subtitle,
      errorMessage,
      actionText,
      showCancel: false,
    });
    this._isLoading.set(false);
    this._isOpen.set(true);
  }

  /**
   * Show generic warning modal (amber)
   */
  showWarning(
    title: string,
    subtitle: string,
    actionText: string = 'Understood',
    cancelText: string = 'Cancel'
  ) {
    this._data.set({
      actionType: 'warning',
      title,
      subtitle,
      actionText,
      cancelText,
      showCancel: true,
    });
    this._isLoading.set(false);
    this._errorMessage.set(null);
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
    return type.includes('-success') || type === 'success';
  }

  isErrorState(): boolean {
    const type = this.actionType();
    return type.includes('-error') || type === 'error';
  }

  isConfirmationState(): boolean {
    const type = this.actionType();
    return ['delete', 'duplicate', 'withdraw', 'warning'].includes(type);
  }

  isGenericModal(): boolean {
    const type = this.actionType();
    return ['info', 'success', 'error', 'warning'].includes(type);
  }

  getColorScheme(): 'red' | 'green' | 'amber' | 'blue' {
    switch (this.actionType()) {
      case 'delete':
      case 'publish-error':
      case 'withdraw-error':
      case 'error':
        return 'red';
      case 'duplicate':
      case 'publish-success':
      case 'withdraw-success':
      case 'success':
        return 'green';
      case 'withdraw':
      case 'warning':
        return 'amber';
      case 'info':
      default:
        return 'blue';
    }
  }

  getActionButtonText(): string {
    // Use custom action text if provided
    const customText = this._data().actionText;
    if (customText) return customText;

    // Fall back to defaults
    switch (this.actionType()) {
      case 'delete':
        return 'Delete';
      case 'duplicate':
        return 'Create Copy';
      case 'withdraw':
        return 'Withdraw Application';
      case 'info':
      case 'error':
        return 'Got it';
      case 'success':
        return 'Continue';
      case 'warning':
        return 'Understood';
      default:
        return 'Continue';
    }
  }
}
