// // src/app/features/invoice/invoice-details-modal.component.ts
// // ✅ FIXED: All signal property access now uses formData().property syntax

// import {
//   Component,
//   Input,
//   Output,
//   EventEmitter,
//   signal,
//   computed,
//   inject,
// } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { ToastService } from '../../shared/services/toast.service';

// export interface InvoiceDetailsForm {
//   business_name: string;
//   legal_name?: string;
//   vat_number: string;
//   address_line1: string;
//   address_line2?: string;
//   city: string;
//   province: string;
//   postal_code: string;
// }

// export interface InvoiceDetailsSnapshot {
//   business_name: string;
//   legal_name?: string;
//   vat_number: string;
//   address_line1: string;
//   address_line2?: string;
//   city: string;
//   province: string;
//   postal_code: string;
//   country: string;
// }

// @Component({
//   selector: 'app-invoice-details-modal',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   template: `
//     <div
//       *ngIf="isOpen()"
//       class="fixed inset-0 z-50 flex items-center justify-center"
//     >
//       <!-- Backdrop -->
//       <div
//         class="absolute inset-0 bg-black/25 backdrop-blur-sm"
//         (click)="!isProcessing() && onCancel()"
//       ></div>

//       <!-- Modal -->
//       <div
//         class="relative bg-white rounded-2xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
//       >
//         <!-- Header -->
//         <div
//           class="sticky top-0 z-10 px-8 py-6 border-b border-slate-200 bg-slate-50/50"
//         >
//           <h2 class="text-xl font-bold text-slate-900">
//             {{
//               isEditMode()
//                 ? 'Edit Invoice Details'
//                 : 'Complete Invoice Information'
//             }}
//           </h2>
//           <p class="text-sm text-slate-600 mt-1">
//             {{
//               isEditMode()
//                 ? 'Update your invoice details before proceeding'
//                 : 'We need your billing information to generate professional invoices'
//             }}
//           </p>
//         </div>

//         <!-- Form Content -->
//         <div class="p-8 space-y-6">
//           <!-- Business Name (Required) -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               Business Name
//               <span class="text-teal-600">*</span>
//             </label>
//             <input
//               type="text"
//               [(ngModel)]="formData().business_name"
//               name="business_name"
//               placeholder="Your business name"
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//               [disabled]="isProcessing()"
//               required
//             />
//             <p class="text-xs text-slate-500 mt-1">
//               Will appear as the invoice recipient
//             </p>
//           </div>

//           <!-- Legal Name (Optional) -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               Legal Name
//               <span class="text-slate-400 font-normal">(Optional)</span>
//             </label>
//             <input
//               type="text"
//               [(ngModel)]="formData().legal_name"
//               name="legal_name"
//               placeholder="Legal entity name if different"
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//               [disabled]="isProcessing()"
//             />
//             <p class="text-xs text-slate-500 mt-1">
//               For official records (if different from business name)
//             </p>
//           </div>

//           <!-- VAT Number -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               VAT Number
//               <span class="text-slate-400 font-normal"
//                 >(10 digits or 0000000000)</span
//               >
//             </label>
//             <input
//               type="text"
//               [(ngModel)]="formData().vat_number"
//               name="vat_number"
//               placeholder="0000000000"
//               maxlength="10"
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 font-mono"
//               [disabled]="isProcessing()"
//               (blur)="onVatBlur()"
//             />
//             <p class="text-xs text-slate-500 mt-1">
//               {{
//                 isVatRegistered() ? '✓ VAT Registered' : 'Not VAT Registered'
//               }}
//             </p>
//           </div>

//           <!-- Address Line 1 (Required) -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               Address Line 1
//               <span class="text-teal-600">*</span>
//             </label>
//             <input
//               type="text"
//               [(ngModel)]="formData().address_line1"
//               name="address_line1"
//               placeholder="Street address"
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//               [disabled]="isProcessing()"
//               required
//             />
//           </div>

//           <!-- Address Line 2 (Optional) -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               Address Line 2
//               <span class="text-slate-400 font-normal">(Optional)</span>
//             </label>
//             <input
//               type="text"
//               [(ngModel)]="formData().address_line2"
//               name="address_line2"
//               placeholder="Apartment, suite, etc."
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//               [disabled]="isProcessing()"
//             />
//           </div>

//           <!-- City (Required) -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               City
//               <span class="text-teal-600">*</span>
//             </label>
//             <input
//               type="text"
//               [(ngModel)]="formData().city"
//               name="city"
//               placeholder="City"
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//               [disabled]="isProcessing()"
//               required
//             />
//           </div>

//           <!-- Province (Required) -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               Province
//               <span class="text-teal-600">*</span>
//             </label>
//             <select
//               [(ngModel)]="formData().province"
//               name="province"
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white"
//               [disabled]="isProcessing()"
//               required
//             >
//               <option value="">Select a province</option>
//               <option value="Western Cape">Western Cape</option>
//               <option value="Eastern Cape">Eastern Cape</option>
//               <option value="Northern Cape">Northern Cape</option>
//               <option value="Free State">Free State</option>
//               <option value="KwaZulu-Natal">KwaZulu-Natal</option>
//               <option value="Gauteng">Gauteng</option>
//               <option value="Limpopo">Limpopo</option>
//               <option value="Mpumalanga">Mpumalanga</option>
//               <option value="North West">North West</option>
//             </select>
//           </div>

//           <!-- Postal Code (Required) -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               Postal Code
//               <span class="text-teal-600">*</span>
//             </label>
//             <input
//               type="text"
//               [(ngModel)]="formData().postal_code"
//               name="postal_code"
//               placeholder="e.g., 8000"
//               class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//               [disabled]="isProcessing()"
//               required
//             />
//           </div>

//           <!-- Validation Summary -->
//           <div
//             *ngIf="validationErrors().length > 0"
//             class="bg-red-50 border border-red-200/50 rounded-xl p-4"
//           >
//             <p class="text-sm font-semibold text-red-700 mb-2">
//               Please fix the following:
//             </p>
//             <ul class="space-y-1">
//               <li
//                 *ngFor="let error of validationErrors()"
//                 class="text-sm text-red-700"
//               >
//                 • {{ error }}
//               </li>
//             </ul>
//           </div>
//         </div>

//         <!-- Footer -->
//         <div
//           class="sticky bottom-0 z-10 px-8 py-4 border-t border-slate-200 bg-white flex gap-3 justify-end"
//         >
//           <button
//             (click)="onCancel()"
//             [disabled]="isProcessing()"
//             class="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             Cancel
//           </button>
//           <button
//             (click)="onConfirm()"
//             [disabled]="isProcessing() || !isFormValid()"
//             class="px-6 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {{ isProcessing() ? 'Saving...' : 'Confirm Details' }}
//           </button>
//         </div>
//       </div>
//     </div>
//   `,
// })
// export class InvoiceDetailsModalComponent {
//   @Input() isOpen = signal(false);
//   @Input() isEditMode = signal(false);
//   @Input() initialData?: Partial<InvoiceDetailsForm>;
//   @Output() confirmed = new EventEmitter<InvoiceDetailsSnapshot>();
//   @Output() cancelled = new EventEmitter<void>();

//   private toastService = inject(ToastService);

//   // ✅ Form data as signal - template accesses with formData().property
//   formData = signal<InvoiceDetailsForm>({
//     business_name: '',
//     legal_name: '',
//     vat_number: '0000000000',
//     address_line1: '',
//     address_line2: '',
//     city: '',
//     province: '',
//     postal_code: '',
//   });

//   isProcessing = signal(false);

//   // Computed values
//   isVatRegistered = computed(() => {
//     return this.formData().vat_number !== '0000000000';
//   });

//   validationErrors = computed(() => {
//     const errors: string[] = [];
//     const form = this.formData();

//     if (!form.business_name?.trim()) {
//       errors.push('Business name is required');
//     }
//     if (!form.address_line1?.trim()) {
//       errors.push('Address line 1 is required');
//     }
//     if (!form.city?.trim()) {
//       errors.push('City is required');
//     }
//     if (!form.province?.trim()) {
//       errors.push('Province is required');
//     }
//     if (!form.postal_code?.trim()) {
//       errors.push('Postal code is required');
//     }
//     if (form.vat_number && !/^\d{10}$/.test(form.vat_number)) {
//       errors.push('VAT number must be exactly 10 digits');
//     }

//     return errors;
//   });

//   isFormValid = computed(() => {
//     return this.validationErrors().length === 0;
//   });

//   ngOnInit() {
//     if (this.initialData) {
//       this.formData.set({
//         ...this.formData(),
//         ...this.initialData,
//       });
//     }
//   }

//   onVatBlur() {
//     let vat = this.formData().vat_number;
//     // Remove non-digits
//     vat = vat.replace(/\D/g, '');
//     // Pad to 10 digits
//     vat = vat.padEnd(10, '0').substring(0, 10);
//     this.formData.update((current) => ({ ...current, vat_number: vat }));
//   }

//   onConfirm() {
//     if (!this.isFormValid()) {
//       this.toastService.error('Please fix validation errors');
//       return;
//     }

//     this.isProcessing.set(true);

//     const form = this.formData();
//     const snapshot: InvoiceDetailsSnapshot = {
//       business_name: form.business_name,
//       legal_name: form.legal_name || form.business_name,
//       vat_number: form.vat_number,
//       address_line1: form.address_line1,
//       address_line2: form.address_line2,
//       city: form.city,
//       province: form.province,
//       postal_code: form.postal_code,
//       country: 'South Africa',
//     };

//     // Simulate async processing
//     setTimeout(() => {
//       this.confirmed.emit(snapshot);
//       this.isProcessing.set(false);
//       this.isOpen.set(false);
//     }, 500);
//   }

//   onCancel() {
//     if (this.isProcessing()) return;
//     this.cancelled.emit();
//     this.isOpen.set(false);
//   }
// }

// src/app/features/invoice/invoice-details-modal.component.ts
// ✅ CORRECT FIX:
// 1. @Input signals now accept boolean values via signal.set()
// 2. Respects existing PaystackService.InvoiceDetailsSnapshot interface
// 3. legal_name is ALWAYS string (required, not optional)

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/services/toast.service';
import { InvoiceDetailsSnapshot } from '../../core/dashboard/services/paystack.service';

export interface InvoiceDetailsForm {
  business_name: string;
  legal_name: string; // ✅ REQUIRED - not optional
  vat_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
}

@Component({
  selector: 'app-invoice-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/25 backdrop-blur-sm"
        (click)="!isProcessing && onCancel()"
      ></div>

      <!-- Modal -->
      <div
        class="relative bg-white rounded-2xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 px-8 py-6 border-b border-slate-200 bg-slate-50/50"
        >
          <h2 class="text-xl font-bold text-slate-900">
            {{
              isEditMode
                ? 'Edit Invoice Details'
                : 'Complete Invoice Information'
            }}
          </h2>
          <p class="text-sm text-slate-600 mt-1">
            {{
              isEditMode
                ? 'Update your invoice details before proceeding'
                : 'We need your billing information to generate professional invoices'
            }}
          </p>
        </div>

        <!-- Form Content -->
        <div class="p-8 space-y-6">
          <!-- Business Name (Required) -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Business Name
              <span class="text-teal-600">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="formData.business_name"
              name="business_name"
              placeholder="Your business name"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              [disabled]="isProcessing"
              required
            />
            <p class="text-xs text-slate-500 mt-1">
              Will appear as the invoice recipient
            </p>
          </div>

          <!-- Legal Name (Required) -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Legal Name
              <span class="text-teal-600">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="formData.legal_name"
              name="legal_name"
              placeholder="Legal entity name"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              [disabled]="isProcessing"
              required
            />
            <p class="text-xs text-slate-500 mt-1">
              For official records and invoices
            </p>
          </div>

          <!-- VAT Number -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              VAT Number
              <span class="text-slate-400 font-normal"
                >(10 digits or 0000000000)</span
              >
            </label>
            <input
              type="text"
              [(ngModel)]="formData.vat_number"
              name="vat_number"
              placeholder="0000000000"
              maxlength="10"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 font-mono"
              [disabled]="isProcessing"
              (blur)="onVatBlur()"
            />
            <p class="text-xs text-slate-500 mt-1">
              {{
                isVatRegistered ? '✓ VAT Registered' : 'Not VAT Registered'
              }}
            </p>
          </div>

          <!-- Address Line 1 (Required) -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Address Line 1
              <span class="text-teal-600">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="formData.address_line1"
              name="address_line1"
              placeholder="Street address"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              [disabled]="isProcessing"
              required
            />
          </div>

          <!-- Address Line 2 (Optional) -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Address Line 2
              <span class="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              [(ngModel)]="formData.address_line2"
              name="address_line2"
              placeholder="Apartment, suite, etc."
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              [disabled]="isProcessing"
            />
          </div>

          <!-- City (Required) -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              City
              <span class="text-teal-600">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="formData.city"
              name="city"
              placeholder="City"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              [disabled]="isProcessing"
              required
            />
          </div>

          <!-- Province (Required) -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Province
              <span class="text-teal-600">*</span>
            </label>
            <select
              [(ngModel)]="formData.province"
              name="province"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white"
              [disabled]="isProcessing"
              required
            >
              <option value="">Select a province</option>
              <option value="Western Cape">Western Cape</option>
              <option value="Eastern Cape">Eastern Cape</option>
              <option value="Northern Cape">Northern Cape</option>
              <option value="Free State">Free State</option>
              <option value="KwaZulu-Natal">KwaZulu-Natal</option>
              <option value="Gauteng">Gauteng</option>
              <option value="Limpopo">Limpopo</option>
              <option value="Mpumalanga">Mpumalanga</option>
              <option value="North West">North West</option>
            </select>
          </div>

          <!-- Postal Code (Required) -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Postal Code
              <span class="text-teal-600">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="formData.postal_code"
              name="postal_code"
              placeholder="e.g., 8000"
              class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              [disabled]="isProcessing"
              required
            />
          </div>

          <!-- Validation Summary -->
          <div
            *ngIf="validationErrors.length > 0"
            class="bg-red-50 border border-red-200/50 rounded-xl p-4"
          >
            <p class="text-sm font-semibold text-red-700 mb-2">
              Please fix the following:
            </p>
            <ul class="space-y-1">
              <li
                *ngFor="let error of validationErrors"
                class="text-sm text-red-700"
              >
                • {{ error }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="sticky bottom-0 z-10 px-8 py-4 border-t border-slate-200 bg-white flex gap-3 justify-end"
        >
          <button
            (click)="onCancel()"
            [disabled]="isProcessing"
            class="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            (click)="onConfirm()"
            [disabled]="isProcessing || !isFormValid"
            class="px-6 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isProcessing ? 'Saving...' : 'Confirm Details' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class InvoiceDetailsModalComponent implements OnInit {
  // ✅ @Input as plain properties that accept boolean values
  @Input() isOpen = false;
  @Input() isEditMode = false;
  @Input() initialData?: Partial<InvoiceDetailsForm>;
  @Output() confirmed = new EventEmitter<InvoiceDetailsSnapshot>();
  @Output() cancelled = new EventEmitter<void>();

  private toastService = inject(ToastService);

  // ✅ Form data as plain object (not signal) for two-way binding
  formData: InvoiceDetailsForm = {
    business_name: '',
    legal_name: '',
    vat_number: '0000000000',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
  };

  isProcessing = false;

  // Computed values as getters
  get isVatRegistered(): boolean {
    return this.formData.vat_number !== '0000000000';
  }

  get validationErrors(): string[] {
    const errors: string[] = [];

    if (!this.formData.business_name?.trim()) {
      errors.push('Business name is required');
    }
    if (!this.formData.legal_name?.trim()) {
      errors.push('Legal name is required');
    }
    if (!this.formData.address_line1?.trim()) {
      errors.push('Address line 1 is required');
    }
    if (!this.formData.city?.trim()) {
      errors.push('City is required');
    }
    if (!this.formData.province?.trim()) {
      errors.push('Province is required');
    }
    if (!this.formData.postal_code?.trim()) {
      errors.push('Postal code is required');
    }
    if (this.formData.vat_number && !/^\d{10}$/.test(this.formData.vat_number)) {
      errors.push('VAT number must be exactly 10 digits');
    }

    return errors;
  }

  get isFormValid(): boolean {
    return this.validationErrors.length === 0;
  }

  ngOnInit() {
    if (this.initialData) {
      this.formData = {
        ...this.formData,
        ...this.initialData,
      } as InvoiceDetailsForm;
    }
  }

  onVatBlur() {
    let vat = this.formData.vat_number;
    // Remove non-digits
    vat = vat.replace(/\D/g, '');
    // Pad to 10 digits
    vat = vat.padEnd(10, '0').substring(0, 10);
    this.formData.vat_number = vat;
  }

  onConfirm() {
    if (!this.isFormValid) {
      this.toastService.error('Please fix validation errors');
      return;
    }

    this.isProcessing = true;

    const snapshot: InvoiceDetailsSnapshot = {
      business_name: this.formData.business_name,
      legal_name: this.formData.legal_name,
      vat_number: this.formData.vat_number,
      address_line1: this.formData.address_line1,
      address_line2: this.formData.address_line2,
      city: this.formData.city,
      province: this.formData.province,
      postal_code: this.formData.postal_code,
      country: 'South Africa',
    };

    // Simulate async processing
    setTimeout(() => {
      this.confirmed.emit(snapshot);
      this.isProcessing = false;
      this.isOpen = false;
    }, 500);
  }

  onCancel() {
    if (this.isProcessing) return;
    this.cancelled.emit();
    this.isOpen = false;
  }
}
