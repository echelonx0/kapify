// src/app/SMEs/data-room/components/sharing/sharing-modal/sharing-modal.component.ts
import { Component, Output, EventEmitter, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Search, CheckSquare, Square, Calendar, AlertCircle, CheckCircle, Users } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DataRoomSharingService } from '../../../services/data-room-sharing.service';
import { DataRoomSection, DataRoomDocument, ShareRecipient, CreateShareRequest } from '../../../models/data-room.models';

@Component({
  selector: 'app-sharing-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,  
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black bg-opacity-50" (click)="close()"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Share Data Room</h2>
              <button (click)="close()" class="text-gray-400 hover:text-gray-600">
                <lucide-icon [img]="XIcon" [size]="24" />
              </button>
            </div>

            <form [formGroup]="shareForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
              <!-- User Search/Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Share with User *
                </label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    [ngModelOptions]="{standalone: true}"
                    (ngModelChange)="onSearchChange()"
                    placeholder="Search by email or name..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <lucide-icon [img]="SearchIcon" [size]="20" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                @if (searchQuery && filteredUsers().length > 0) {
                  <div class="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    @for (user of filteredUsers(); track user.userId) {
                      <button
                        type="button"
                        (click)="selectUser(user)"
                        class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p class="font-medium text-gray-900">{{ user.email }}</p>
                          @if (user.name) {
                            <p class="text-sm text-gray-500">{{ user.name }}</p>
                          }
                          @if (user.companyName) {
                            <p class="text-xs text-gray-400">{{ user.companyName }}</p>
                          }
                        </div>
                        @if (user.userType) {
                          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {{ user.userType }}
                          </span>
                        }
                      </button>
                    }
                  </div>
                }

                @if (selectedUser()) {
                  <div class="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ selectedUser()!.email }}</p>
                      @if (selectedUser()!.name) {
                        <p class="text-sm text-gray-600">{{ selectedUser()!.name }}</p>
                      }
                    </div>
                    <button type="button" (click)="clearSelectedUser()" class="text-red-600 hover:text-red-700">
                      <lucide-icon [img]="XIcon" [size]="20" />
                    </button>
                  </div>
                }
              </div>

              <!-- Permission Level -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Permission Level *
                </label>
                <div class="space-y-2">
                  <label class="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      formControlName="permissionLevel"
                      value="view"
                      class="mt-1"
                    />
                    <div>
                      <p class="font-medium text-gray-900">View Only</p>
                      <p class="text-sm text-gray-600">Can view documents but cannot download</p>
                    </div>
                  </label>

                  <label class="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      formControlName="permissionLevel"
                      value="download"
                      class="mt-1"
                    />
                    <div>
                      <p class="font-medium text-gray-900">View & Download</p>
                      <p class="text-sm text-gray-600">Can view and download documents</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Section Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Accessible Sections
                </label>
                <p class="text-sm text-gray-500 mb-3">Select specific sections or leave empty for all sections</p>

                <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  @for (section of sections(); track section.id) {
                    <label class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="isSectionSelected(section.sectionKey)"
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

              <!-- Document Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Specific Documents (Optional)
                </label>
                <p class="text-sm text-gray-500 mb-3">Leave empty to share all shareable documents</p>

                <!-- Document Search -->
                <input
                  type="text"
                  [(ngModel)]="documentSearchQuery"
                  [ngModelOptions]="{standalone: true}"
                  placeholder="Search documents..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                />

                <div class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  @for (doc of filteredDocuments(); track doc.id) {
                    <label class="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="isDocumentSelected(doc.id)"
                        (change)="toggleDocument(doc.id)"
                        [disabled]="!doc.isShareable"
                        class="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-900 truncate">{{ doc.title }}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {{ doc.category }}
                          </span>
                          <span class="text-xs text-gray-500">{{ doc.documentType }}</span>
                          @if (!doc.isShareable) {
                            <span class="text-xs text-red-600">(Not shareable)</span>
                          }
                        </div>
                      </div>
                    </label>
                  }
                </div>

                @if (selectedDocuments().length > 0) {
                  <p class="mt-2 text-sm text-gray-600">
                    {{ selectedDocuments().length }} document(s) selected
                  </p>
                }
              </div>

              <!-- Expiration Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Access Expiration (Optional)
                </label>
                <input
                  type="date"
                  formControlName="expiresAt"
                  [min]="getMinDate()"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p class="mt-1 text-xs text-gray-500">Leave empty for permanent access</p>
              </div>

              <!-- Internal Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes (Optional)
                </label>
                <textarea
                  formControlName="internalNotes"
                  rows="3"
                  placeholder="Add private notes about this share (only visible to you)..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                ></textarea>
              </div>

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
                  <p class="text-sm text-green-700">Data room shared successfully!</p>
                </div>
              }

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <ui-button variant="outline" type="button" (clicked)="close()" [disabled]="isSharing()">
                  Cancel
                </ui-button>
                <ui-button
                  variant="primary"
                  type="submit"
                  [disabled]="!canSubmit()"
                  [loading]="isSharing()"
                >
                  {{ isSharing() ? 'Sharing...' : 'Share Data Room' }}
                </ui-button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class SharingModalComponent {
  @Output() shared = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private sharingService = inject(DataRoomSharingService);

  // Icons
  XIcon = X;
  SearchIcon = Search;
  CheckSquareIcon = CheckSquare;
  SquareIcon = Square;
  CalendarIcon = Calendar;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  UsersIcon = Users;

  // State
  isOpen = signal(false);
  isSharing = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Props
  dataRoomId = signal<string>('');
  sections = signal<DataRoomSection[]>([]);
  documents = signal<DataRoomDocument[]>([]);
  availableUsers = signal<ShareRecipient[]>([]);

  // Search & Selection
  searchQuery = '';
  documentSearchQuery = '';
  selectedUser = signal<ShareRecipient | null>(null);
  selectedSections = signal<string[]>([]);
  selectedDocuments = signal<string[]>([]);

  // Form
  shareForm: FormGroup;

  // Computed
  filteredUsers = computed(() => {
    if (!this.searchQuery) return [];
    const query = this.searchQuery.toLowerCase();
    return this.availableUsers().filter(user =>
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.companyName?.toLowerCase().includes(query)
    );
  });

  filteredDocuments = computed(() => {
    const docs = this.documents().filter(doc => doc.isShareable);
    if (!this.documentSearchQuery) return docs;
    const query = this.documentSearchQuery.toLowerCase();
    return docs.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.shareForm = this.fb.group({
      permissionLevel: ['view', Validators.required],
      expiresAt: [''],
      internalNotes: ['']
    });
  }

  open(dataRoomId: string, sections: DataRoomSection[], documents: DataRoomDocument[], users: ShareRecipient[]): void {
    this.dataRoomId.set(dataRoomId);
    this.sections.set(sections);
    this.documents.set(documents);
    this.availableUsers.set(users);
    this.isOpen.set(true);
    this.reset();
  }

  close(): void {
    if (!this.isSharing()) {
      this.isOpen.set(false);
      this.reset();
      this.closed.emit();
    }
  }

  onSearchChange(): void {
    // Triggers computed recalculation
  }

  selectUser(user: ShareRecipient): void {
    this.selectedUser.set(user);
    this.searchQuery = '';
  }

  clearSelectedUser(): void {
    this.selectedUser.set(null);
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

  toggleDocument(documentId: string): void {
    const current = this.selectedDocuments();
    if (current.includes(documentId)) {
      this.selectedDocuments.set(current.filter(id => id !== documentId));
    } else {
      this.selectedDocuments.set([...current, documentId]);
    }
  }

  isDocumentSelected(documentId: string): boolean {
    return this.selectedDocuments().includes(documentId);
  }

  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  canSubmit(): boolean {
    return this.shareForm.valid && !!this.selectedUser();
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.isSharing.set(true);
    this.error.set(null);
    this.success.set(false);

    try {
      const formValue = this.shareForm.value;
      
      const request: CreateShareRequest = {
        dataRoomId: this.dataRoomId(),
        sharedWithUserId: this.selectedUser()!.userId,
        permissionLevel: formValue.permissionLevel,
        allowedSections: this.selectedSections().length > 0 ? this.selectedSections() : undefined,
        documentIds: this.selectedDocuments().length > 0 ? this.selectedDocuments() : undefined,
        expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt) : undefined,
        internalNotes: formValue.internalNotes || undefined
      };

      await this.sharingService.shareDataRoom(request).toPromise();

      this.success.set(true);

      setTimeout(() => {
        this.shared.emit();
        this.close();
      }, 1500);

    } catch (err: any) {
      console.error('Failed to share data room:', err);
      this.error.set(err.message || 'Failed to share data room');
    } finally {
      this.isSharing.set(false);
    }
  }

  private reset(): void {
    this.shareForm.reset({
      permissionLevel: 'view',
      expiresAt: '',
      internalNotes: ''
    });
    this.searchQuery = '';
    this.documentSearchQuery = '';
    this.selectedUser.set(null);
    this.selectedSections.set([]);
    this.selectedDocuments.set([]);
    this.error.set(null);
    this.success.set(false);
  }
}