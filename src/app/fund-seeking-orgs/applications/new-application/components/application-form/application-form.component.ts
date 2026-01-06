import {
  Component,
  input,
  output,
  inject,
  OnInit,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText } from 'lucide-angular';
import { ApplicationFormService } from '../../services/application-form.service';
import { ApplicationValidationService } from '../../services/application-validation.service';
import { UiTextareaComponent } from 'src/app/shared/components/ui-textarea.component';
import { CoverStatementUploadComponent } from '../file-upload/cover-statement-upload.component.ts';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import {
  SelectOption,
  UiSelectComponent,
} from 'src/app/shared/components/ui-select/ui-select.component';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CoverStatementUploadComponent,
    UiTextareaComponent,
    UiSelectComponent,
  ],
  templateUrl: './application-form.component.html',
  providers: [ApplicationValidationService],
})
export class ApplicationFormComponent implements OnInit {
  private formService = inject(ApplicationFormService);
  private validationService = inject(ApplicationValidationService);

  opportunity = input.required<FundingOpportunity>();
  formChanged = output<void>();

  FileTextIcon = FileText;
  formData = this.formService.formData;
  completionPercentage = this.formService.completionPercentage;

  // Compute funding type options from opportunity
  fundingTypeOptions = computed<SelectOption[]>(() => {
    const opp = this.opportunity();
    if (!opp?.fundingType || !Array.isArray(opp.fundingType)) {
      return [];
    }
    return opp.fundingType.map((type) => ({
      label: this.formatFundingTypeLabel(type),
      value: type,
    }));
  });
  ngOnInit(): void {
    // Initialization
  }

  // Replace fundingTypeModel with this computed getter
  get fundingTypeModel(): string {
    return this.formData().fundingType || '';
  }

  set fundingTypeModel(value: string) {
    this.formService.updateFundingType(value);
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

  getFundingTypeError(): string | undefined {
    return (
      this.validationService.validateForm(this.formData(), this.opportunity())
        .errors.fundingType || undefined
    );
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
      maximumFractionDigits: 0,
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

  // Add this to formData tracking
  onFundingTypeChange(value: string | number | boolean): void {
    this.formService.updateFundingType(value as string);
    this.formChanged.emit();
  }

  // Helper to format funding type labels (e.g., "debt" → "Debt Financing")
  private formatFundingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      debt: 'Debt Financing',
      equity: 'Equity Investment',
      mezzanine: 'Mezzanine Financing',
      convertible: 'Convertible Note',
      grant: 'Grant',
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }
}
