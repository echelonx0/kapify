// src/app/applications/components/new-application/services/application-validation.service.ts

import { Injectable } from '@angular/core';
 
import { FundingOpportunity } from 'src/app/shared/models/funder.models';
import { ApplicationFormData, ApplicationFormErrors, ApplicationFormValidation } from '../models/application-form.model';

@Injectable()
export class ApplicationValidationService {

  validateForm(
    formData: ApplicationFormData, 
    opportunity: FundingOpportunity | null
  ): ApplicationFormValidation {
    const errors: ApplicationFormErrors = {};

    // Validate requested amount
    if (!formData.requestedAmount) {
      errors.requestedAmount = 'Requested amount is required';
    } else if (opportunity) {
      const amount = parseFloat(formData.requestedAmount);
      if (isNaN(amount)) {
        errors.requestedAmount = 'Please enter a valid amount';
      } else if (amount < opportunity.minInvestment) {
        errors.requestedAmount = `Amount must be at least ${this.formatCurrency(opportunity.minInvestment)}`;
      } else if (amount > opportunity.maxInvestment) {
        errors.requestedAmount = `Amount cannot exceed ${this.formatCurrency(opportunity.maxInvestment)}`;
      }
    }

    // Validate purpose statement
    if (!formData.purposeStatement?.trim()) {
      errors.purposeStatement = 'Purpose statement is required';
    } else if (formData.purposeStatement.trim().length < 50) {
      errors.purposeStatement = 'Purpose statement must be at least 50 characters';
    }

    // Validate use of funds
    if (!formData.useOfFunds?.trim()) {
      errors.useOfFunds = 'Use of funds breakdown is required';
    } else if (formData.useOfFunds.trim().length < 50) {
      errors.useOfFunds = 'Use of funds must be at least 50 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  getAmountValidationMessage(
    requestedAmount: string,
    opportunity: FundingOpportunity | null
  ): string | null {
    if (!requestedAmount || !opportunity) {
      return null;
    }

    const amount = parseFloat(requestedAmount);
    if (isNaN(amount)) {
      return 'Please enter a valid amount';
    }

    if (amount < opportunity.minInvestment) {
      return `Amount must be at least ${this.formatCurrency(opportunity.minInvestment)}`;
    }

    if (amount > opportunity.maxInvestment) {
      return `Amount cannot exceed ${this.formatCurrency(opportunity.maxInvestment)}`;
    }

    return null;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}