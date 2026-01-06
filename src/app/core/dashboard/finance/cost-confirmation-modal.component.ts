// src/app/data-room/components/cost-confirmation-modal.component.ts
import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertCircle, Zap, X } from 'lucide-angular';

@Component({
  selector: 'app-cost-confirmation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isOpen()) {
    <div class="cost-modal">
      <div class="cost-modal-content">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"
            >
              <lucide-icon
                [img]="AlertIcon"
                [size]="20"
                class="text-amber-600"
              />
            </div>
            <h2 class="text-xl font-bold text-slate-900">Credit Check</h2>
          </div>
          <button
            (click)="onClose.emit()"
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <lucide-icon [img]="XIcon" [size]="20" />
          </button>
        </div>

        <!-- Balance Info -->
        <div class="p-4 bg-slate-50 rounded-xl mb-6">
          <div class="text-sm text-slate-600 mb-2">Available Credits</div>
          <div class="text-3xl font-bold text-slate-900">
            {{ availableCredits() }}
          </div>
        </div>

        <!-- Cost Breakdown -->
        <div class="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="ZapIcon"
                [size]="16"
                class="text-orange-600"
              />
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-900">
                {{ actionLabel() }}
              </div>
              <div class="text-2xl font-bold text-orange-600 mt-1">
                {{ cost() }} credits
              </div>
              <div class="text-xs text-slate-600 mt-2">
                You'll have {{ remainingCredits() }} credits after this action
              </div>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3">
          <button
            (click)="onClose.emit()"
            class="flex-1 px-4 py-2.5 bg-slate-100 text-slate-900 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          @if (hasEnoughCredits()) {
          <button
            (click)="onConfirm.emit()"
            class="flex-1 px-4 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
          >
            Proceed
          </button>
          } @else {
          <button
            (click)="onPurchase.emit()"
            class="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Buy Credits
          </button>
          }
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .cost-modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 1rem;
      }

      .cost-modal-content {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      }
    `,
  ],
})
export class CostConfirmationModalComponent {
  isOpen = input(false);
  cost = input(0);
  availableCredits = input(0);
  actionLabel = input('Action');

  onClose = output<void>();
  onConfirm = output<void>();
  onPurchase = output<void>();

  AlertIcon = AlertCircle;
  ZapIcon = Zap;
  XIcon = X;

  hasEnoughCredits = (() => {
    const cost = this.cost();
    const available = this.availableCredits();
    return available >= cost;
  }).bind(this);

  remainingCredits = (() => {
    return Math.max(0, this.availableCredits() - this.cost());
  }).bind(this);
}
