// // src/app/applications/components/new-application/components/application-form/application-form.component.ts

// import { Component, input, output, inject, OnInit, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { LucideAngularModule, FileText, DollarSign, AlertCircle, CheckCircle } from 'lucide-angular';
// import { FundingOpportunity } from 'src/app/shared/models/funder.models';
// import { ApplicationFormService } from '../../services/application-form.service';
// import { ApplicationValidationService } from '../../services/application-validation.service';
// import { CoverStatementUploadComponent } from '../file-upload/cover-statement-upload.component.ts';
 
// @Component({
//   selector: 'app-application-form',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     FormsModule, 
//     LucideAngularModule,
//     CoverStatementUploadComponent
//   ],
//   templateUrl: './application-form.component.html',
//   providers: [ApplicationValidationService]
// })
// export class ApplicationFormComponent implements OnInit {
//   // Services
//   private formService = inject(ApplicationFormService);
//   private validationService = inject(ApplicationValidationService);

//   // Inputs
//   opportunity = input.required<FundingOpportunity>();
  
//   // Outputs
//   formChanged = output<void>();
  
//   // Icons
//   FileTextIcon = FileText;
//   DollarSignIcon = DollarSign;
//   AlertCircleIcon = AlertCircle;
//   CheckCircleIcon = CheckCircle;

//   // Expose form data
//   formData = this.formService.formData;
//   completionPercentage = this.formService.completionPercentage;

//   ngOnInit(): void {
//     // Any initialization logic
//   }

//   onRequestedAmountChange(event: Event): void {
//     const value = (event.target as HTMLInputElement).value;
//     this.formService.updateRequestedAmount(value);
//     this.formChanged.emit();
//   }

//   onPurposeStatementChange(event: Event): void {
//     const value = (event.target as HTMLTextAreaElement).value;
//     this.formService.updatePurposeStatement(value);
//     this.formChanged.emit();
//   }

//   onUseOfFundsChange(event: Event): void {
//     const value = (event.target as HTMLTextAreaElement).value;
//     this.formService.updateUseOfFunds(value);
//     this.formChanged.emit();
//   }

//   onCoverStatementUploaded(file: File | undefined): void {
//     this.formService.updateCoverStatement(file);
//     this.formChanged.emit();
//   }

//   getAmountValidationMessage(): string | null {
//     return this.validationService.getAmountValidationMessage(
//       this.formData().requestedAmount,
//       this.opportunity()
//     );
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: this.opportunity().currency || 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   }
// }

import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText } from 'lucide-angular';
import { FundingOpportunity } from 'src/app/shared/models/funder.models';
import { ApplicationFormService } from '../../services/application-form.service';
import { ApplicationValidationService } from '../../services/application-validation.service'; 
import { UiTextareaComponent } from 'src/app/shared/components/ui-textarea.component';
import { CoverStatementUploadComponent } from '../file-upload/cover-statement-upload.component.ts';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule,
    CoverStatementUploadComponent,
    UiTextareaComponent
  ],
  templateUrl: './application-form.component.html',
  providers: [ApplicationValidationService]
})
export class ApplicationFormComponent implements OnInit {
  private formService = inject(ApplicationFormService);
  private validationService = inject(ApplicationValidationService);

  opportunity = input.required<FundingOpportunity>();
  formChanged = output<void>();

  FileTextIcon = FileText;

  formData = this.formService.formData;
  completionPercentage = this.formService.completionPercentage;

  ngOnInit(): void {
    // Initialization
  }

  onRequestedAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.formService.updateRequestedAmount(value);
    this.formChanged.emit();
  }

  onPurposeStatementChange(value: string): void {
    this.formService.updatePurposeStatement(value);
    this.formChanged.emit();
  }

  onUseOfFundsChange(value: string): void {
    this.formService.updateUseOfFunds(value);
    this.formChanged.emit();
  }

  onCoverStatementUploaded(file: File | undefined): void {
    this.formService.updateCoverStatement(file);
    this.formChanged.emit();
  }

  getAmountValidationMessage(): string | null {
    return this.validationService.getAmountValidationMessage(
      this.formData().requestedAmount,
      this.opportunity()
    );
  }

  getPurposeError(): string | null {
    const purpose = this.formData().purposeStatement;
    if (!purpose || purpose.length < 50) {
      return 'Minimum 50 characters required';
    }
    return null;
  }

  getUseOfFundsError(): string | null {
    const useOfFunds = this.formData().useOfFunds;
    if (!useOfFunds || useOfFunds.length < 50) {
      return 'Minimum 50 characters required';
    }
    return null;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: this.opportunity().currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(amount: number | null | undefined): string {
  if (!amount) return '';
  return amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 });
}

onAmountInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const rawValue = input.value.replace(/,/g, '');
  
  if (!/^\d*$/.test(rawValue)) {
    return;
  }

  this.formService.updateRequestedAmount(rawValue);
  this.formChanged.emit();
}

validateAmount(): void {
  // Validation happens on blur
}

getFormattedAmount(): string {
  const amount = this.formData().requestedAmount;
  if (!amount) return '';
  
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
}