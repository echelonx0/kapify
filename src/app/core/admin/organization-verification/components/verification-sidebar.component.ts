// src/app/admin/components/verification-sidebar/verification-sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VerificationOrganization } from '../../services/organization-verification.service';

@Component({
  selector: 'app-verification-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Search and Filter -->
      <div class="p-4 border-b border-neutral-100">
        <div class="space-y-3">
          <div class="relative">
            <input
              type="text"
              placeholder="Search organizations..."
              [value]="searchTerm"
              (input)="searchChanged.emit($any($event.target).value)"
              class="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <select 
            [value]="statusFilter"
            (change)="filterChanged.emit($any($event.target).value)"
            class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Organizations</option>
            <option value="pending">Pending Verification</option>
            <option value="with_docs">With Documents</option>
            <option value="no_docs">No Documents</option>
          </select>
        </div>
      </div>

      <!-- Organizations List -->
      <div class="flex-1 overflow-y-auto organization-list">
        <div *ngIf="isLoading" class="p-6 text-center">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p class="text-neutral-600">Loading organizations...</p>
        </div>

        <div *ngIf="!isLoading && organizations.length === 0" class="p-6 text-center">
          <svg class="w-12 h-12 text-neutral-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <p class="text-neutral-600">No organizations found</p>
        </div>

        <div class="space-y-1 p-2">
          <div 
            *ngFor="let org of organizations" 
            (click)="organizationSelected.emit(org)"
            class="organization-card p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm relative"
            [class]="selectedOrganization?.id === org.id 
              ? 'bg-primary-50 border-primary-200 shadow-sm selected' 
              : 'bg-white border-neutral-200 hover:border-neutral-300'"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-neutral-900 truncate">{{ org.name }}</h3>
                <p class="text-sm text-neutral-600 truncate">{{ org.legalName || 'No legal name provided' }}</p>
                
                <div class="flex items-center mt-2 space-x-2">
                  <span 
                    class="status-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    [class]="getOrganizationStatusBadge(org.status)"
                  >
                    {{ org.status | titlecase }}
                  </span>
                  
                  <span class="text-xs text-neutral-500">
                    {{ org.organizationType | titlecase }}
                  </span>
                </div>

                <div class="flex items-center justify-between mt-3 text-xs text-neutral-500">
                  <span>{{ formatDate(org.createdAt) }}</span>
                  <div class="flex items-center space-x-2">
                    <span class="flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      {{ org.documentCount || 0 }}
                    </span>
                    <span *ngIf="org.verificationThreadId" class="flex items-center text-primary-600">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      Messages
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerificationSidebarComponent {
  @Input() organizations: VerificationOrganization[] = [];
  @Input() selectedOrganization: VerificationOrganization | null = null;
  @Input() isLoading: boolean = false;
  @Input() searchTerm: string = '';
  @Input() statusFilter: string = 'all';
  
  @Output() organizationSelected = new EventEmitter<VerificationOrganization>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() filterChanged = new EventEmitter<string>();

  getOrganizationStatusBadge(status: string): string {
    const badges = {
      'pending_verification': 'bg-warning/20 text-warning border border-warning/30',
      'active': 'bg-primary-100 text-primary-800 border border-primary-200',
      'rejected': 'bg-red-100 text-red-800 border border-red-200'
    };
    return badges[status as keyof typeof badges] || 'bg-neutral-100 text-neutral-700 border border-neutral-200';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}