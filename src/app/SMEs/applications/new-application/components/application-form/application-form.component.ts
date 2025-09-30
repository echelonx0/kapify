// src/app/applications/components/new-application/components/application-form/application-form.component.ts

import { Component, input, output, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, DollarSign, AlertCircle, CheckCircle } from 'lucide-angular';
import { FundingOpportunity } from 'src/app/shared/models/funder.models';
import { ApplicationFormService } from '../../services/application-form.service';
import { ApplicationValidationService } from '../../services/application-validation.service';
import { CoverStatementUploadComponent } from '../file-upload/cover-statement-upload.component.ts';
 
@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule,
    CoverStatementUploadComponent
  ],
  templateUrl: './application-form.component.html',
  providers: [ApplicationValidationService]
})
export class ApplicationFormComponent implements OnInit {
  // Services
  private formService = inject(ApplicationFormService);
  private validationService = inject(ApplicationValidationService);

  // Inputs
  opportunity = input.required<FundingOpportunity>();
  
  // Outputs
  formChanged = output<void>();
  
  // Icons
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  // Expose form data
  formData = this.formService.formData;
  completionPercentage = this.formService.completionPercentage;

  ngOnInit(): void {
    // Any initialization logic
  }

  onRequestedAmountChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.formService.updateRequestedAmount(value);
    this.formChanged.emit();
  }

  onPurposeStatementChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.formService.updatePurposeStatement(value);
    this.formChanged.emit();
  }

  onUseOfFundsChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: this.opportunity().currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}