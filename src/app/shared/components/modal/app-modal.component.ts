// src/app/shared/components/modal/opportunity-action-modal.component.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Trash2, Copy, AlertCircle, CheckCircle, X } from 'lucide-angular';
import { ActionModalService } from './modal.service';
 
@Component({
  selector: 'app-opportunity-action-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (modalService.isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" (keydown.escape)="cancel()">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50 cursor-pointer" (click)="cancel()"></div>
        
        <!-- Modal -->
        <div class="relative bg-white rounded-lg shadow-lg max-w-[420px] w-[90vw] overflow-hidden animate-slideUp">
          
          <!-- Close button -->
          <button
            type="button"
            class="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors z-10"
            (click)="cancel()"
            [disabled]="modalService.isLoading()"
            aria-label="Close modal"
          >
            <lucide-icon [img]="XIcon" size="20" class="text-gray-500" />
          </button>

          <!-- Header -->
          <div class="px-6 py-8 border-b border-gray-100 text-center pr-12">
            <div [class]="'w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ' + getIconBgClass()">
              <lucide-icon [img]="getIcon()" size="24" [class]="getIconColorClass()" />
            </div>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">{{ getTitle() }}</h2>
            <p class="text-sm text-gray-600 break-words">{{ getSubtitle() }}</p>
          </div>

          <!-- Body -->
          <div class="px-6 py-6">
            <!-- Publish Success State -->
            @if (modalService.actionType() === 'publish-success') {
              <div class="flex gap-3 p-3 rounded-lg bg-green-50 border border-green-100 mb-4">
                <lucide-icon [img]="CheckCircleIcon" size="20" class="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-green-900">Published successfully!</p>
                  <p class="text-sm text-green-700 mt-1">Your opportunity is now live and visible to businesses.</p>
                </div>
              </div>
            } @else if (modalService.actionType() === 'publish-error') {
              <!-- Publish Error State -->
              <div class="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
                <lucide-icon [img]="AlertCircleIcon" size="20" class="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-red-900">Publishing failed</p>
                  <p class="text-sm text-red-700 mt-1">{{ modalService.data().errorMessage }}</p>
                </div>
              </div>
            } @else {
              <!-- Delete/Duplicate States -->
              @if (modalService.errorMessage()) {
                <div class="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
                  <lucide-icon [img]="AlertCircleIcon" size="20" class="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-red-900">Error</p>
                    <p class="text-sm text-red-700 mt-1">{{ modalService.errorMessage() }}</p>
                  </div>
                </div>
              } @else {
                @switch (modalService.actionType()) {
                  @case ('delete') {
                    <div class="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
                      <lucide-icon [img]="AlertCircleIcon" size="20" class="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span class="text-sm text-amber-900">This action cannot be undone.</span>
                    </div>

                    @if (modalService.data().hasApplications && modalService.data().applicationCount! > 0) {
                      <div class="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <span class="text-sm text-blue-900">
                          <strong>{{ modalService.data().applicationCount }} active application(s)</strong> will be archived.
                        </span>
                      </div>
                    }
                  }
                  @case ('duplicate') {
                    <div class="flex gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                      <lucide-icon [img]="CheckCircleIcon" size="20" class="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p class="text-sm font-medium text-green-900">A copy will be created as a draft.</p>
                        <p class="text-sm text-green-700 mt-1">Edit and publish when ready.</p>
                      </div>
                    </div>
                  }
                }
              }
            }
          </div>

          <!-- Footer -->
          <div class="px-6 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
            <!-- Success/Error: Single close button -->
            @if (modalService.actionType() === 'publish-success' || modalService.actionType() === 'publish-error') {
              <button
                type="button"
                class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                (click)="success()"
                [disabled]="modalService.isLoading()"
              >
                {{ modalService.actionType() === 'publish-success' ? 'View Opportunity' : 'Got it' }}
              </button>
            } @else {
              <!-- Delete/Duplicate: Cancel + Action buttons -->
              <button
                type="button"
                class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                (click)="cancel()"
                [disabled]="modalService.isLoading()"
              >
                {{ modalService.errorMessage() ? 'Close' : 'Cancel' }}
              </button>
              @if (!modalService.errorMessage()) {
                <button
                  type="button"
                  class="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  [class]="getActionButtonClass()"
                  (click)="confirm()"
                  [disabled]="modalService.isLoading()"
                >
                  @if (modalService.isLoading()) {
                    <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  } @else {
                    {{ getActionButtonText() }}
                  }
                </button>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slideUp {
      animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class OpportunityActionModalComponent {
  modalService = inject(ActionModalService);

  // Icons
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  Trash2Icon = Trash2;
  CopyIcon = Copy;
  XIcon = X;

 
 
  // APPLY THIS FIX TO: src/app/shared/components/modal/opportunity-action-modal.component.ts

// Replace these 4 methods with proper defaults:

  getIcon() {
    const type = this.modalService.actionType();
    switch (this.modalService.actionType()) {
      case 'delete':
        return this.Trash2Icon;
      case 'duplicate':
        return this.CopyIcon;
      case 'publish-success':
        return this.CheckCircleIcon;
      case 'publish-error':
        return this.AlertCircleIcon;
      default:
        return this.AlertCircleIcon; // ← ADD THIS
    }
  }

  getIconBgClass(): string {
    switch (this.modalService.actionType()) {
      case 'delete':
        return 'bg-red-50';
      case 'duplicate':
        return 'bg-green-50';
      case 'publish-success':
        return 'bg-green-50';
      case 'publish-error':
        return 'bg-red-50';
      default:
        return 'bg-slate-50'; // ← ADD THIS
    }
  }

  getIconColorClass(): string {
    switch (this.modalService.actionType()) {
      case 'delete':
        return 'text-red-600';
      case 'duplicate':
        return 'text-green-600';
      case 'publish-success':
        return 'text-green-600';
      case 'publish-error':
        return 'text-red-600';
      default:
        return 'text-slate-600'; // ← ADD THIS
    }
  }

  getTitle(): string {
    switch (this.modalService.actionType()) {
      case 'delete':
        return 'Delete opportunity?';
      case 'duplicate':
        return 'Duplicate opportunity?';
      case 'publish-success':
        return 'Opportunity published!';
      case 'publish-error':
        return 'Publishing failed';
      default:
        return 'Confirm action?'; // ← ADD THIS
    }
  }

  getSubtitle(): string {
    const title = this.modalService.data().opportunityTitle || '';
    return `"${title}"`;
  }

  getActionButtonText(): string {
    switch (this.modalService.actionType()) {
      case 'delete':
        return 'Delete';
      case 'duplicate':
        return 'Create Copy';
      default:
        return 'Continue';
    }
  }

  getActionButtonClass(): string {
    switch (this.modalService.actionType()) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700';
      case 'duplicate':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  }

  confirm() {
    this.modalService.confirm();
  }

  cancel() {
    this.modalService.cancel();
  }

  success() {
    this.modalService.success();
  }
}