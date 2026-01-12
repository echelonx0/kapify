import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';

@Component({
  selector: 'app-cover-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cover-list.component.html',
})
export class CoverListComponent {
  @Input() covers: FundingApplicationCoverInformation[] = [];
  @Input() defaultCoverId: string | null = null;

  @Output() editCover = new EventEmitter<string>();
  @Output() createNew = new EventEmitter<void>();
  @Output() setDefault = new EventEmitter<string>();
  @Output() deleteCover = new EventEmitter<string>();
  @Output() uploadDocument = new EventEmitter<string>();
  @Output() copyCover = new EventEmitter<string>();

  trackById(index: number, cover: FundingApplicationCoverInformation): string {
    return cover.id;
  }

  getCoverTypeLabel(cover: FundingApplicationCoverInformation): string {
    return cover.isDefault ? 'Default Template' : 'Custom Cover';
  }

  getCompletionPercentage(cover: FundingApplicationCoverInformation): number {
    let filled = 0;
    const total = 6; // 6 matching fields

    if (cover.industries.length > 0) filled++;
    if (cover.fundingAmount > 0) filled++;
    if (cover.fundingTypes.length > 0) filled++;
    if (cover.businessStages.length > 0) filled++;
    if (cover.location) filled++;
    if (cover.useOfFunds) filled++;

    return Math.round((filled / total) * 100);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }
}
