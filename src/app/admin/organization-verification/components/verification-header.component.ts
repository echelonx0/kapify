// src/app/admin/components/verification-header/verification-header.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../shared/components';
import { VerificationStats } from '../../services/organization-verification.service';

@Component({
  selector: 'app-verification-header',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  template: `
    <div class="bg-white border-b border-neutral-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">Organization Verification</h1>
          <p class="text-neutral-600 mt-1">Review and approve organization verification requests</p>
        </div>
        <div class="flex items-center space-x-4">
          <ui-button variant="outline" size="sm" (clicked)="refreshRequested.emit()">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </ui-button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-4 gap-4 mt-6">
        <div class="bg-gradient-to-r from-warning/10 to-warning/20 rounded-xl p-4 border border-warning/30 stats-card pending">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-warning">{{ stats.pendingCount }}</p>
              <p class="text-sm text-warning/80">Pending Review</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200 stats-card approved">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-primary-200 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-primary-800">{{ stats.approvedToday }}</p>
              <p class="text-sm text-primary-700">Approved Today</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200 stats-card rejected">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-red-800">{{ stats.rejectedToday }}</p>
              <p class="text-sm text-red-700">Rejected Today</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl p-4 border border-neutral-200 stats-card total">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-800">{{ stats.totalProcessed }}</p>
              <p class="text-sm text-neutral-700">Total Processed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerificationHeaderComponent {
  @Input() stats!: VerificationStats;
  @Output() refreshRequested = new EventEmitter<void>();
}