// src/app/SMEs/data-room/components/sharing/access-requests-list/access-requests-list.component.ts
import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, CheckCircle, XCircle, Eye, X } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { DataRoomSharingService } from '../../../services/data-room-sharing.service';
import { DataRoomAccessRequest, ApproveAccessRequestRequest, RejectAccessRequestRequest } from '../../../models/data-room.models';

@Component({
  selector: 'app-access-requests-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Access Requests</h2>
          <p class="text-gray-600 mt-1">Review and manage data room access requests</p>
        </div>
        @if (pendingCount() > 0) {
          <div class="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-medium">
            {{ pendingCount() }} Pending
          </div>
        }
      </div>

      @if (isLoading()) {
        <div class="text-center py-12">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading requests...</p>
        </div>
      } @else if (requests().length === 0) {
        <ui-card class="p-12">
          <div class="text-center">
            <lucide-icon [img]="ClockIcon" [size]="48" class="text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Access Requests</h3>
            <p class="text-gray-600">You don't have any pending access requests at the moment.</p>
          </div>
        </ui-card>
      } @else {
        <div class="space-y-4">
          @for (request of requests(); track request.id) {
            <ui-card class="p-6">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <!-- Request Header -->
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                      {{ getInitials(request.requester?.name || request.requester?.email || 'U') }}
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900">
                        {{ request.requester?.name || request.requester?.email }}
                      </h3>
                      <p class="text-sm text-gray-500">{{ request.organizationName }}</p>
                    </div>
                    <div [class]="'px-3 py-1 rounded-full text-xs font-medium ' + getStatusClass(request.status)">
                      {{ request.status }}
                    </div>
                  </div>

                  <!-- Request Details -->
                  <div class="space-y-3">
                    <div>
                      <p class="text-sm font-medium text-gray-700 mb-1">Request Reason:</p>
                      <p class="text-sm text-gray-600">{{ request.requestReason }}</p>
                    </div>

                    @if (request.requestedSections && request.requestedSections.length > 0) {
                      <div>
                        <p class="text-sm font-medium text-gray-700 mb-1">Requested Sections:</p>
                        <div class="flex flex-wrap gap-2">
                          @for (section of request.requestedSections; track section) {
                            <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {{ formatSectionKey(section) }}
                            </span>
                          }
                        </div>
                      </div>
                    }

                    <div class="flex items-center gap-4 text-xs text-gray-500">
                      <span>Contact: {{ request.contactEmail }}</span>
                      <span>•</span>
                      <span>Requested: {{ formatDate(request.createdAt) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                @if (request.status === 'pending') {
                  <div class="flex items-center gap-2 ml-4">
                    <ui-button variant="ghost" size="sm" (clicked)="viewDetails(request)">
                      <lucide-icon [img]="EyeIcon" [size]="16" />
                    </ui-button>
                    <ui-button  size="sm" (clicked)="openApproveModal(request)">
                      <lucide-icon [img]="CheckCircleIcon" [size]="16" class="mr-1" />
                      Approve
                    </ui-button>
                    <ui-button  size="sm" (clicked)="openRejectModal(request)">
                      <lucide-icon [img]="XCircleIcon" [size]="16" class="mr-1" />
                      Reject
                    </ui-button>
                  </div>
                } @else {
                  <div class="ml-4">
                    @if (request.reviewedAt) {
                      <p class="text-xs text-gray-500">
                        Reviewed {{ formatDate(request.reviewedAt) }}
                      </p>
                    }
                    @if (request.reviewNotes) {
                      <p class="text-xs text-gray-600 mt-1">{{ request.reviewNotes }}</p>
                    }
                  </div>
                }
              </div>
            </ui-card>
          }
        </div>
      }

      <!-- Approve Modal -->
      @if (selectedRequest() && showApproveModal()) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 bg-black bg-opacity-50" (click)="closeModals()"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Approve Access Request</h3>
                <button (click)="closeModals()" class="text-gray-400 hover:text-gray-600">
                  <lucide-icon [img]="XIcon" [size]="20" />
                </button>
              </div>

              <form [formGroup]="approveForm" (ngSubmit)="onApprove()" class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Permission Level *
                  </label>
                  <select
                    formControlName="permissionLevel"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="view">View Only</option>
                    <option value="download">View & Download</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    formControlName="expiresAt"
                    [min]="getMinDate()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <ui-button variant="outline" type="button" (clicked)="closeModals()" [disabled]="isProcessing()">
                    Cancel
                  </ui-button>
                  <ui-button variant="outline" type="submit" [disabled]="approveForm.invalid" [loading]="isProcessing()">
                    {{ isProcessing() ? 'Approving...' : 'Approve Request' }}
                  </ui-button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- Reject Modal -->
      @if (selectedRequest() && showRejectModal()) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 bg-black bg-opacity-50" (click)="closeModals()"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">Reject Access Request</h3>
                <button (click)="closeModals()" class="text-gray-400 hover:text-gray-600">
                  <lucide-icon [img]="XIcon" [size]="20" />
                </button>
              </div>

              <form [formGroup]="rejectForm" (ngSubmit)="onReject()" class="p-6 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection *
                  </label>
                  <textarea
                    formControlName="reviewNotes"
                    rows="4"
                    placeholder="Please provide a reason for rejecting this request..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  ></textarea>
                  @if (rejectForm.get('reviewNotes')?.touched && rejectForm.get('reviewNotes')?.errors) {
                    <p class="mt-1 text-sm text-red-600">Rejection reason is required</p>
                  }
                </div>

                <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <ui-button   type="button" (clicked)="closeModals()" [disabled]="isProcessing()">
                    Cancel
                  </ui-button>
                  <ui-button   type="submit" [disabled]="rejectForm.invalid" [loading]="isProcessing()">
                    {{ isProcessing() ? 'Rejecting...' : 'Reject Request' }}
                  </ui-button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AccessRequestsListComponent implements OnInit {
  @Input({ required: true }) organizationId!: string;

  private fb = inject(FormBuilder);
  private sharingService = inject(DataRoomSharingService);

  // Icons
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  EyeIcon = Eye;
  XIcon = X;

  // State
  requests = signal<DataRoomAccessRequest[]>([]);
  isLoading = signal(false);
  isProcessing = signal(false);
  selectedRequest = signal<DataRoomAccessRequest | null>(null);
  showApproveModal = signal(false);
  showRejectModal = signal(false);

  // Forms
  approveForm: FormGroup;
  rejectForm: FormGroup;

  // Computed
  pendingCount = signal(0);

  constructor() {
    this.approveForm = this.fb.group({
      permissionLevel: ['view', Validators.required],
      expiresAt: ['']
    });

    this.rejectForm = this.fb.group({
      reviewNotes: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);

    // this.sharingService.getIncomingRequests(this.organizationId).subscribe({
    //   next: (requests) => {
    //     this.requests.set(requests);
    //     this.pendingCount.set(requests.filter(r => r.status === 'pending').length);
    //     this.isLoading.set(false);
    //   },
    //   error: (err) => {
    //     console.error('Failed to load requests:', err);
    //     this.isLoading.set(false);
    //   }
    // });
  }

  viewDetails(request: DataRoomAccessRequest): void {
    // TODO: Implement detailed view
    console.log('View details:', request);
  }

  openApproveModal(request: DataRoomAccessRequest): void {
    this.selectedRequest.set(request);
    this.showApproveModal.set(true);
    this.approveForm.reset({ permissionLevel: 'view', expiresAt: '' });
  }

  openRejectModal(request: DataRoomAccessRequest): void {
    this.selectedRequest.set(request);
    this.showRejectModal.set(true);
    this.rejectForm.reset({ reviewNotes: '' });
  }

  closeModals(): void {
    this.showApproveModal.set(false);
    this.showRejectModal.set(false);
    this.selectedRequest.set(null);
  }

  async onApprove(): Promise<void> {
    if (this.approveForm.invalid || !this.selectedRequest()) return;

    this.isProcessing.set(true);

    try {
      const formValue = this.approveForm.value;
      const request: ApproveAccessRequestRequest = {
        requestId: this.selectedRequest()!.id,
        permissionLevel: formValue.permissionLevel,
        expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt) : undefined
      };

      await this.sharingService.approveAccessRequest(request).toPromise();

      this.closeModals();
      this.loadRequests();
    } catch (err: any) {
      console.error('Failed to approve request:', err);
      alert('Failed to approve request');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async onReject(): Promise<void> {
    if (this.rejectForm.invalid || !this.selectedRequest()) return;

    this.isProcessing.set(true);

    try {
      const formValue = this.rejectForm.value;
      const request: RejectAccessRequestRequest = {
        requestId: this.selectedRequest()!.id,
        reviewNotes: formValue.reviewNotes
      };

      await this.sharingService.rejectAccessRequest(request).toPromise();

      this.closeModals();
      this.loadRequests();
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      alert('Failed to reject request');
    } finally {
      this.isProcessing.set(false);
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-orange-100 text-orange-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'withdrawn': 'bg-gray-100 text-gray-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatSectionKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}