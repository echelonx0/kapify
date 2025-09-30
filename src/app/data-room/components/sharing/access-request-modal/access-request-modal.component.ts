// src/app/SMEs/data-room/components/sharing/access-request-modal/access-request-modal.component.ts
import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, X, Lock, AlertCircle, CheckCircle, Building } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DataRoomSharingService } from '../../../services/data-room-sharing.service';
import { DataRoomSection, CreateAccessRequestRequest } from '../../../models/data-room.models';

@Component({
  selector: 'app-access-request-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black bg-opacity-50" (click)="close()"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <!-- Header -->
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="LockIcon" [size]="20" class="text-primary-600" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">Request Data Room Access</h2>
                  <p class="text-sm text-gray-500">{{ dataRoomTitle() }}</p>
                </div>
              </div>
              <button (click)="close()" class="text-gray-400 hover:text-gray-600">
                <lucide-icon [img]="XIcon" [size]="24" />
              </button>
            </div>

            <form [formGroup]="requestForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
              <!-- Info Box -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex gap-3">
                  <lucide-icon [img]="LockIcon" [size]="20" class="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 class="font-medium text-blue-900 mb-1">Access Request Process</h3>
                    <p class="text-sm text-blue-700">
                      The SME will review your request and decide whether to grant access. 
                      You'll be notified via email once they respond.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Organization Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Your Organization Name *
                </label>
                <div class="relative">
                  <input
                    type="text"
                    formControlName="organizationName"
                    placeholder="e.g., Acme Investment Partners"
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    [class.border-red-500]="requestForm.get('organizationName')?.touched && requestForm.get('organizationName')?.errors"
                  />
                  <lucide-icon [img]="BuildingIcon" [size]="20" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                @if (requestForm.get('organizationName')?.touched && requestForm.get('organizationName')?.errors) {
                  <p class="mt-1 text-sm text-red-600">Organization name is required</p>
                }
              </div>

              <!-- Contact Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  formControlName="contactEmail"
                  placeholder="your.email@company.com"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  [class.border-red-500]="requestForm.get('contactEmail')?.touched && requestForm.get('contactEmail')?.errors"
                />
                @if (requestForm.get('contactEmail')?.touched && requestForm.get('contactEmail')?.errors) {
                  <p class="mt-1 text-sm text-red-600">
                    @if (requestForm.get('contactEmail')?.errors?.['required']) {
                      Email is required
                    }
                    @if (requestForm.get('contactEmail')?.errors?.['email']) {
                      Please enter a valid email
                    }
                  </p>
                }
              </div>

              <!-- Request Reason -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Access Request *
                </label>
                <textarea
                  formControlName="requestReason"
                  rows="5"
                  placeholder="Please explain why you're requesting access to this data room. Include details about your investment interest, evaluation process, or partnership opportunity..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  [class.border-red-500]="requestForm.get('requestReason')?.touched && requestForm.get('requestReason')?.errors"
                ></textarea>
                <div class="flex items-center justify-between mt-1">
                  @if (requestForm.get('requestReason')?.touched && requestForm.get('requestReason')?.errors) {
                    <p class="text-sm text-red-600">
                      @if (requestForm.get('requestReason')?.errors?.['required']) {
                        Please provide a reason for your request
                      }
                      @if (requestForm.get('requestReason')?.errors?.['minlength']) {
                        Reason must be at least 50 characters
                      }
                    </p>
                  } @else {
                    <p class="text-xs text-gray-500">
                      {{ requestForm.get('requestReason')?.value?.length || 0 }} / 50 characters minimum
                    </p>
                  }
                </div>
              </div>

              <!-- Requested Sections -->
              @if (sections().length > 0) {
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Sections of Interest (Optional)
                  </label>
                  <p class="text-sm text-gray-500 mb-3">
                    Select specific sections you're interested in accessing
                  </p>

                  <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    @for (section of sections(); track section.id) {
                      <label class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="isSectionßSelected(section.sectionKey)"
                          (change)="toggleSection(section.sectionKey)"
                          class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <div class="flex-1">
                          <p class="font-medium text-gray-900">{{ section.title }}</p>
                          <p class="text-xs text-gray-500">{{ section.description }}</p>
                        </div>
                      </label>
                    }
                  </div>

                  @if (selectedSections().length > 0) {
                    <p class="mt-2 text-sm text-gray-600">
                      {{ selectedSections().length }} section(s) selected
                    </p>
                  }
                </div>
              }

              <!-- Error Message -->
              @if (error()) {
                <div class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <lucide-icon [img]="AlertCircleIcon" [size]="20" class="text-red-600 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-red-700">{{ error() }}</p>
                </div>
              }

              <!-- Success Message -->
              @if (success()) {
                <div class="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-green-700">Request Submitted Successfully!</p>
                    <p class="text-xs text-green-600 mt-1">
                      The SME will review your request and respond via email.
                    </p>
                  </div>
                </div>
              }

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <ui-button variant="outline" type="button" (clicked)="close()" [disabled]="isSubmitting()">
                  Cancel
                </ui-button>
                <ui-button
                  variant="primary"
                  type="submit"
                  [disabled]="requestForm.invalid || isSubmitting()"
                  [loading]="isSubmitting()"
                >
                  {{ isSubmitting() ? 'Submitting...' : 'Submit Request' }}
                </ui-button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class AccessRequestModalComponent {
  @Output() submitted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private sharingService = inject(DataRoomSharingService);

  // Icons
  XIcon = X;
  LockIcon = Lock;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  BuildingIcon = Building;

  // State
  isOpen = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Props
  dataRoomId = signal<string>('');
  dataRoomTitle = signal<string>('');
  sections = signal<DataRoomSection[]>([]);
  selectedSections = signal<string[]>([]);

  // Form
  requestForm: FormGroup;

  constructor() {
    this.requestForm = this.fb.group({
      organizationName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      requestReason: ['', [Validators.required, Validators.minLength(50)]]
    });
  }

  open(dataRoomId: string, dataRoomTitle: string, sections: DataRoomSection[] = []): void {
    this.dataRoomId.set(dataRoomId);
    this.dataRoomTitle.set(dataRoomTitle);
    this.sections.set(sections);
    this.isOpen.set(true);
    this.reset();
  }

  close(): void {
    if (!this.isSubmitting()) {
      this.isOpen.set(false);
      this.reset();
      this.closed.emit();
    }
  }

  toggleSection(sectionKey: string): void {
    const current = this.selectedSections();
    if (current.includes(sectionKey)) {
      this.selectedSections.set(current.filter(k => k !== sectionKey));
    } else {
      this.selectedSections.set([...current, sectionKey]);
    }
  }

  isSectionSelected(sectionKey: string): boolean {
    return this.selectedSections().includes(sectionKey);
  }

  async onSubmit(): Promise<void> {
    if (this.requestForm.invalid) return;

    this.isSubmitting.set(true);
    this.error.set(null);
    this.success.set(false);

    try {
      const formValue = this.requestForm.value;

      const request: CreateAccessRequestRequest = {
        dataRoomId: this.dataRoomId(),
        requestReason: formValue.requestReason,
        requestedSections: this.selectedSections().length > 0 ? this.selectedSections() : undefined,
        organizationName: formValue.organizationName,
        contactEmail: formValue.contactEmail
      };

      await this.sharingService.requestAccess(request).toPromise();

      this.success.set(true);

      setTimeout(() => {
        this.submitted.emit();
        this.close();
      }, 2000);

    } catch (err: any) {
      console.error('Failed to submit access request:', err);
      this.error.set(err.message || 'Failed to submit access request');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private reset(): void {
    this.requestForm.reset({
      organizationName: '',
      contactEmail: '',
      requestReason: ''
    });
    this.selectedSections.set([]);
    this.error.set(null);
    this.success.set(false);
  }
}