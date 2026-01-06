import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  AlertCircle,
  Zap,
  X,
} from 'lucide-angular';
import { OrgWallet } from 'src/app/shared/services/credit.service';

@Component({
  selector: 'app-cost-confirmation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/25 backdrop-blur-sm"
        (click)="onCancel.emit()"
      ></div>

      <!-- Modal -->
      <div
        class="relative bg-white rounded-2xl shadow-md max-w-sm w-full overflow-hidden"
      >
        <!-- Header with Icon -->
        <div
          class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-orange-50/50"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-amber-100 flex items-center justify-center rounded-lg"
            >
              <lucide-icon
                [img]="AlertCircleIcon"
                [size]="20"
                class="text-amber-600"
              ></lucide-icon>
            </div>
            <h2 class="text-lg font-bold text-slate-900">Confirm Analysis</h2>
          </div>
          <button
            (click)="onCancel.emit()"
            class="text-slate-400 hover:text-slate-600 transition-colors duration-200"
          >
            <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Balance Display -->
          <div
            class="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/50"
          >
            <div class="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">
              Available Balance
            </div>
            <div class="text-3xl font-bold text-slate-900">
              {{ formatCurrency(wallet.balance) }}
            </div>
            <div class="text-xs text-slate-600 mt-2">
              You have enough credits for this analysis
            </div>
          </div>

          <!-- Cost Breakdown -->
          <div
            class="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <lucide-icon
                  [img]="ZapIcon"
                  [size]="16"
                  class="text-amber-600"
                ></lucide-icon>
              </div>
              <div class="flex-1">
                <div class="text-sm font-semibold text-slate-900">
                  Document Analysis
                </div>
                <div class="text-2xl font-bold text-amber-600 mt-1">
                  {{ costFormatted }}
                </div>
                <div class="text-xs text-slate-600 mt-2">
                  AI-powered analysis with market intelligence
                </div>
              </div>
            </div>
          </div>

          <!-- What's Included -->
          <div class="space-y-3">
            <div class="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              What's Included
            </div>
            <div class="space-y-2">
              @for (item of includedFeatures; track item) {
              <div class="flex items-start gap-2">
                <div class="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-slate-700">{{ item }}</span>
              </div>
              }
            </div>
          </div>

          <!-- Balance After -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/50">
            <div class="text-xs text-slate-600 mb-1">Balance After Analysis</div>
            <div class="text-lg font-semibold text-slate-900">
              {{ formatCurrency(wallet.balance - costInCents) }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex gap-3"
        >
          <button
            (click)="onCancel.emit()"
            class="flex-1 px-4 py-2.5 bg-slate-100 text-slate-900 rounded-xl font-medium hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            (click)="onConfirm.emit()"
            class="flex-1 px-4 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
          >
            Proceed to Analysis
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class CostConfirmationModalComponent {
  AlertCircleIcon = AlertCircle;
  ZapIcon = Zap;
  XIcon = X;

  @Input() wallet!: OrgWallet;
  @Input() costInCents: number = 5000; // Default 50 ZAR in cents
  @Input() costFormatted: string = 'R50.00';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  includedFeatures = [
    'Investment score & success probability',
    'Real-time market intelligence',
    'Risk assessment & recommendations',
    'Downloadable report',
  ];

  formatCurrency(cents: number): string {
    const zar = cents / 100;
    return zar.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    });
  }
}
