// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, Zap, X, CheckCircle2 } from 'lucide-angular';
// import { OrgWallet } from 'src/app/shared/services/credit.service';

// @Component({
//   selector: 'app-cost-confirmation-modal',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <!-- Backdrop -->
//       <div
//         class="absolute inset-0 bg-black/25 backdrop-blur-sm"
//         (click)="onCancel.emit()"
//       ></div>

//       <!-- Modal - Two Column Layout -->
//       <div
//         class="relative bg-white rounded-2xl shadow-md max-w-2xl w-full overflow-hidden border border-slate-200"
//       >
//         <div class="grid grid-cols-2 gap-0 min-h-[500px]">
//           <!-- LEFT COLUMN: Balance & Features -->
//           <div
//             class="px-8 py-8 border-r border-slate-200 flex flex-col justify-between"
//           >
//             <!-- Header -->
//             <div>
//               <h2 class="text-xl font-bold text-slate-900 mb-1">
//                 Confirm Analysis
//               </h2>
//               <p class="text-sm text-slate-600">
//                 Kapify Intelligence will analyze your document
//               </p>
//             </div>

//             <!-- Available Balance -->
//             <div class="mt-6">
//               <div
//                 class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3"
//               >
//                 Available Balance
//               </div>
//               <div
//                 class="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6"
//               >
//                 <div class="text-3xl font-bold text-slate-900">
//                   {{ formatCurrency(wallet.balance) }}
//                 </div>
//                 <div class="text-xs text-green-600 font-medium mt-2">
//                   ✓ Sufficient funds
//                 </div>
//               </div>
//             </div>

//             <!-- Features List -->
//             <div>
//               <div
//                 class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3"
//               >
//                 What You'll Get
//               </div>
//               <div class="space-y-2.5">
//                 @for (item of includedFeatures; track item) {
//                 <div class="flex items-start gap-2.5">
//                   <lucide-icon
//                     [img]="CheckIcon"
//                     [size]="16"
//                     class="text-green-600 flex-shrink-0 mt-0.5"
//                   ></lucide-icon>
//                   <span class="text-sm text-slate-700">{{ item }}</span>
//                 </div>
//                 }
//               </div>
//             </div>
//           </div>

//           <!-- RIGHT COLUMN: Cost & Action -->
//           <div
//             class="px-8 py-8 flex flex-col justify-between bg-gradient-to-br from-teal-50/50 to-emerald-50/30"
//           >
//             <!-- Cost Section -->
//             <div>
//               <div
//                 class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3"
//               >
//                 Analysis Cost
//               </div>

//               <!-- Cost Display -->
//               <div class="mb-8">
//                 <div class="flex items-baseline gap-2 mb-1">
//                   <span class="text-5xl font-bold text-slate-900">
//                     {{ costFormatted }}
//                   </span>
//                   <span class="text-sm text-slate-600">one-time</span>
//                 </div>
//                 <p class="text-xs text-slate-600 mt-2">
//                   Investment analysis with market intelligence
//                 </p>
//               </div>

//               <!-- Cost Breakdown -->
//               <div
//                 class="p-4 bg-white border border-slate-200 rounded-xl space-y-3 mb-6"
//               >
//                 <div class="flex items-start gap-2">
//                   <lucide-icon
//                     [img]="ZapIcon"
//                     [size]="16"
//                     class="text-teal-600 flex-shrink-0 mt-0.5"
//                   ></lucide-icon>
//                   <div class="flex-1 min-w-0">
//                     <div class="text-xs font-semibold text-slate-900">
//                       Kapify Intelligence Processing
//                     </div>
//                     <div class="text-xs text-slate-600 mt-0.5">
//                       Powered by Claude AI
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <!-- Balance After -->
//               <div class="p-3 bg-white border border-slate-200 rounded-xl">
//                 <div class="text-xs text-slate-600 mb-1">Balance After</div>
//                 <div class="text-lg font-semibold text-slate-900">
//                   {{ formatCurrency(wallet.balance - costInCents) }}
//                 </div>
//               </div>
//             </div>

//             <!-- Action Buttons -->
//             <div class="space-y-2">
//               <button
//                 (click)="onConfirm.emit()"
//                 class="w-full px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 shadow-sm hover:shadow-md"
//               >
//                 Proceed to Analysis
//               </button>
//               <button
//                 (click)="onCancel.emit()"
//                 class="w-full px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>

//         <!-- Close Button (top right) -->
//         <button
//           (click)="onCancel.emit()"
//           class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1"
//         >
//           <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
//         </button>
//       </div>
//     </div>
//   `,
//   styles: [],
// })
// export class CostConfirmationModalComponent {
//   CheckIcon = CheckCircle2;
//   ZapIcon = Zap;
//   XIcon = X;

//   @Input() wallet!: OrgWallet;
//   @Input() costInCents: number = 5000; // Default 50 ZAR in cents
//   @Input() costFormatted: string = 'R50.00';

//   @Output() onConfirm = new EventEmitter<void>();
//   @Output() onCancel = new EventEmitter<void>();

//   includedFeatures = [
//     'Investment score & success probability',
//     'Real-time market intelligence',
//     'Competitive positioning analysis',
//     'Risk assessment & recommendations',
//     'Downloadable report',
//   ];

//   formatCurrency(cents: number): string {
//     const zar = cents / 100;
//     return zar.toLocaleString('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       minimumFractionDigits: 0,
//     });
//   }
// }

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Zap, X, CheckCircle2 } from 'lucide-angular';
import { OrgWallet } from 'src/app/shared/services/credit.service';

@Component({
  selector: 'app-cost-confirmation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/25 backdrop-blur-sm"
        (click)="onCancel.emit()"
      ></div>

      <!-- Modal - Two Column Layout -->
      <div
        class="relative bg-white rounded-2xl shadow-md max-w-2xl w-full overflow-hidden border border-slate-200"
      >
        <div class="grid grid-cols-2 gap-0 min-h-[550px]">
          <!-- LEFT COLUMN: Balance & Features -->
          <div
            class="px-8 py-8 border-r border-slate-200 flex flex-col justify-between"
          >
            <!-- Header -->
            <div>
              <h2 class="text-xl font-bold text-slate-900 mb-1">
                Confirm Analysis
              </h2>
              <p class="text-sm text-slate-600">
                Kapify Intelligence will analyze your document
              </p>
            </div>

            <!-- Available Balance -->
            <div class="mt-6">
              <div
                class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3"
              >
                Available Balance
              </div>
              <div
                class="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6"
              >
                <div class="text-3xl font-bold text-slate-900">
                  {{ formatCurrency(wallet.balance) }}
                </div>
                <div class="text-xs text-green-600 font-medium mt-2">
                  ✓ Sufficient funds
                </div>
              </div>
            </div>

            <!-- Features List -->
            <div>
              <div
                class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3"
              >
                What You'll Get
              </div>
              <div class="space-y-2.5">
                @for (item of includedFeatures; track item) {
                <div class="flex items-start gap-2.5">
                  <lucide-icon
                    [img]="CheckIcon"
                    [size]="16"
                    class="text-green-600 flex-shrink-0 mt-0.5"
                  ></lucide-icon>
                  <span class="text-sm text-slate-700">{{ item }}</span>
                </div>
                }
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Cost, Company Name & Action -->
          <div
            class="px-8 py-8 flex flex-col justify-between bg-gradient-to-br from-teal-50/50 to-emerald-50/30"
          >
            <!-- Company Name Input -->
            <div>
              <div
                class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3"
              >
                Company Information
              </div>

              <!-- Company Name Input -->
              <div class="mb-6">
                <label
                  for="company-name"
                  class="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Company Name
                  <span class="text-red-600">*</span>
                </label>
                <input
                  id="company-name"
                  type="text"
                  [(ngModel)]="companyName"
                  placeholder="Company name"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  (keyup.enter)="isCompanyNameValid() && onConfirm.emit()"
                />
                <p class="text-xs text-slate-600 mt-2">
                  Enter the company name this proposal is from. We need this to
                  save your analysis for you to review later
                </p>
                @if (showCompanyError()) {
                <p class="text-xs text-red-600 mt-2 font-medium">
                  Please enter a company name
                </p>
                }
              </div>

              <!-- Cost Section -->
              <div>
                <div
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3"
                >
                  Analysis Cost
                </div>

                <!-- Cost Display -->
                <div class="mb-8">
                  <div class="flex items-baseline gap-2 mb-1">
                    <span class="text-5xl font-bold text-slate-900">
                      {{ costFormatted }}
                    </span>
                    <span class="text-sm text-slate-600">one-time</span>
                  </div>
                  <p class="text-xs text-slate-600 mt-2">
                    Investment analysis with market intelligence
                  </p>
                </div>

                <!-- Cost Breakdown -->
                <div
                  class="p-4 bg-white border border-slate-200 rounded-xl space-y-3 mb-6"
                >
                  <div class="flex items-start gap-2">
                    <lucide-icon
                      [img]="ZapIcon"
                      [size]="16"
                      class="text-teal-600 flex-shrink-0 mt-0.5"
                    ></lucide-icon>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-slate-900">
                        Kapify Intelligence Processing
                      </div>
                      <div class="text-xs text-slate-600 mt-0.5">
                        Powered by Claude AI
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Balance After -->
                <div class="p-3 bg-white border border-slate-200 rounded-xl">
                  <div class="text-xs text-slate-600 mb-1">Balance After</div>
                  <div class="text-lg font-semibold text-slate-900">
                    {{ formatCurrency(wallet.balance - costInCents) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
              <button
                (click)="handleConfirm()"
                [disabled]="!isCompanyNameValid()"
                class="w-full px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Analysis
              </button>
              <button
                (click)="onCancel.emit()"
                class="w-full px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Close Button (top right) -->
        <button
          (click)="onCancel.emit()"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1"
        >
          <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class CostConfirmationModalComponent {
  CheckIcon = CheckCircle2;
  ZapIcon = Zap;
  XIcon = X;

  @Input() wallet!: OrgWallet;
  @Input() costInCents: number = 5000; // Default 50 ZAR in cents
  @Input() costFormatted: string = 'R50.00';

  @Output() onConfirm = new EventEmitter<string>(); // Emit company name
  @Output() onCancel = new EventEmitter<void>();

  companyName = signal('');
  showCompanyError = signal(false);

  includedFeatures = [
    'Investment score & success probability',
    'Real-time market intelligence',
    'Competitive positioning analysis',
    'Risk assessment & recommendations',
    'Downloadable report',
  ];

  isCompanyNameValid(): boolean {
    return this.companyName().trim().length > 0;
  }

  handleConfirm() {
    if (!this.isCompanyNameValid()) {
      this.showCompanyError.set(true);
      return;
    }
    this.onConfirm.emit(this.companyName().trim());
  }

  formatCurrency(cents: number): string {
    const zar = cents / 100;
    return zar.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    });
  }
}
