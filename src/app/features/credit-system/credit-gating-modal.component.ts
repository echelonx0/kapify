// src/app/ai/components/credit-gating-modal/credit-gating-modal.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  AlertCircle,
  DollarSign,
  X,
  Zap,
} from 'lucide-angular';

@Component({
  selector: 'app-credit-gating-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Backdrop -->
    @if (isOpen) {
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300"
      (click)="onCancel()"
    ></div>
    }

    <!-- Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
      [class.pointer-events-auto]="isOpen"
    >
      <div
        class="bg-white rounded-2xl shadow-lg w-full max-w-md transform transition-all duration-300"
        [class.scale-100]="isOpen"
        [class.scale-95]="!isOpen"
        [class.opacity-100]="isOpen"
        [class.opacity-0]="!isOpen"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-slate-200 flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"
            >
              <lucide-icon
                [img]="ZapIcon"
                [size]="16"
                class="text-amber-600"
              ></lucide-icon>
            </div>
            <h2 class="text-base font-semibold text-slate-900">
              Confirm Analysis
            </h2>
          </div>
          <button
            (click)="onCancel()"
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 space-y-4">
          <!-- Cost breakdown -->
          <div class="bg-amber-50 border border-amber-200/50 rounded-xl p-4">
            <div class="flex items-start space-x-3">
              <div
                class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <lucide-icon
                  [img]="DollarSignIcon"
                  [size]="16"
                  class="text-amber-600"
                ></lucide-icon>
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-amber-900 mb-1">
                  AI Analysis Cost
                </h3>
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-amber-700">Analysis</span>
                    <span class="font-semibold text-amber-900"
                      >{{ cost }} credits</span
                    >
                  </div>
                  <div
                    class="flex items-center justify-between text-sm pt-2 border-t border-amber-200/50"
                  >
                    <span class="font-semibold text-amber-900">Total</span>
                    <span class="text-lg font-bold text-amber-900"
                      >{{ cost }} credits</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Balance info -->
          <div
            class="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
          >
            <span class="text-sm text-slate-600">Available balance</span>
            <span class="font-semibold text-slate-900"
              >{{ currentBalance }} credits</span
            >
          </div>

          <!-- After deduction -->
          <div
            class="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
          >
            <span class="text-sm text-slate-600">After deduction</span>
            <span class="font-semibold text-slate-900"
              >{{ currentBalance - cost }} credits</span
            >
          </div>

          <!-- Info message -->
          <div
            class="flex items-start space-x-2 p-3 bg-blue-50 rounded-xl border border-blue-200/50"
          >
            <lucide-icon
              [img]="AlertCircleIcon"
              [size]="16"
              class="text-blue-600 flex-shrink-0 mt-0.5"
            ></lucide-icon>
            <p class="text-xs text-blue-700 leading-relaxed">
              This comprehensive analysis evaluates your investment readiness
              across financial metrics, market fit, team strength, and traction
              indicators.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3"
        >
          <button
            (click)="onCancel()"
            class="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="isLoading"
          >
            Cancel
          </button>
          <button
            (click)="onConfirm()"
            class="flex-1 px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            [disabled]="isLoading"
          >
            @if (isLoading) {
            <div
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>Processing...</span>
            } @else {
            <span>Confirm & Analyze</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CreditGatingModalComponent {
  @Input() isOpen = false;
  @Input() cost = 0;
  @Input() currentBalance = 0;
  @Input() isLoading = false;

  @Output() onConfirmClick = new EventEmitter<void>();
  @Output() onCancelClick = new EventEmitter<void>();

  // Icons
  ZapIcon = Zap;
  DollarSignIcon = DollarSign;
  XIcon = X;
  AlertCircleIcon = AlertCircle;

  onConfirm(): void {
    this.onConfirmClick.emit();
  }

  onCancel(): void {
    this.onCancelClick.emit();
  }
}
