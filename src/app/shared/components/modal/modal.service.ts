// src/app/shared/services/action-modal.service.ts
import { Injectable } from '@angular/core';
import { signal, computed } from '@angular/core';

export type ActionType = 'delete' | 'duplicate' | 'publish-success' | 'publish-error';

export interface ModalData {
  actionType: ActionType;
  opportunityTitle: string;
  hasApplications?: boolean;
  applicationCount?: number;
  errorMessage?: string;
  opportunityId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActionModalService {
  // State
  private _isOpen = signal(false);
  private _data = signal<ModalData>({
    actionType: 'delete',
    opportunityTitle: '',
    hasApplications: false,
    applicationCount: 0
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

  // Callbacks
  private _onConfirm: (() => void) | null = null;
  private _onCancel: (() => void) | null = null;
  private _onSuccess: (() => void) | null = null;

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

  close() {
    this._isOpen.set(false);
  }

  confirm() {
    this._isLoading.set(true);
    this._errorMessage.set(null);
    this._onConfirm?.();
  }

  cancel() {
    if (!this._isLoading()) {
      this._onCancel?.();
      this.close();
    }
  }

  success() {
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

  showDelete(title: string, hasApplications: boolean, applicationCount: number) {
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
}