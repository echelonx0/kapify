// src/app/dashboard/components/settings/components/general-info.component.ts
import { Component, Input, Output, EventEmitter, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  LucideAngularModule, 
  Building2, 
  Camera, 
  Save, 
  Check,
  AlertCircle,
  Upload
} from 'lucide-angular';
import { OrganizationSettings, OrganizationSettingsService } from '../../../services/organization-settings.service';

 
@Component({
  selector: 'app-general-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './general-info.component.html',
})
export class GeneralInfoComponent implements OnInit {
  @Input() organization: OrganizationSettings | null = null;
  @Input() isLoading = false;
  @Output() organizationUpdated = new EventEmitter<OrganizationSettings>();

  private settingsService = inject(OrganizationSettingsService);
  private fb = inject(FormBuilder);

  // Icons
  Building2Icon = Building2;
  CameraIcon = Camera;
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  UploadIcon = Upload;

  // Form
  generalForm!: FormGroup;

  // State
  isUploading = signal(false);
  uploadError = signal<string | null>(null);
  currentLogoUrl = signal<string | null>(null);
  lastSaved = signal<Date | null>(null);
  initialFormValue: any = null;

  constructor() {
    // Watch for last saved updates using effect
    effect(() => {
      const date = this.settingsService.lastSaved();
      this.lastSaved.set(date);
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  private initializeForm() {
    this.generalForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required]],
      organizationType: ['', [Validators.required]],
      employeeCount: [''],
      assetsUnderManagement: ['']
    });

    // Track form changes
    this.generalForm.valueChanges.subscribe(() => {
      this.uploadError.set(null);
    });
  }

  private populateForm() {
    if (!this.organization) return;

    const formValue = {
      name: this.organization.name || '',
      description: this.organization.description || '',
      organizationType: this.organization.organizationType || '',
      employeeCount: this.organization.employeeCount?.toString() || '',
      assetsUnderManagement: this.organization.assetsUnderManagement?.toString() || ''
    };

    this.generalForm.patchValue(formValue);
    this.initialFormValue = this.generalForm.value;
    this.currentLogoUrl.set(this.organization.logoUrl || null);
  }

  isFunder(): boolean {
    const orgType = this.organization?.organizationType;
    return ['investment_fund', 'venture_capital', 'private_equity', 'bank'].includes(orgType || '');
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialFormValue) return false;
    return JSON.stringify(this.generalForm.value) !== JSON.stringify(this.initialFormValue);
  }

  formatLastSaved(date: Date | null): string {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  triggerFileUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.settingsService.uploadLogo(file).subscribe({
      next: (logoUrl) => {
        this.currentLogoUrl.set(logoUrl);
        this.isUploading.set(false);
        // Clear the file input
        target.value = '';
      },
      error: (error) => {
        this.uploadError.set(error.message || 'Failed to upload logo');
        this.isUploading.set(false);
        target.value = '';
      }
    });
  }

  onSave() {
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      return;
    }

    const formValue = this.generalForm.value;
    const updates = {
      name: formValue.name?.trim(),
      description: formValue.description?.trim(),
      organizationType: formValue.organizationType,
      employeeCount: formValue.employeeCount ? parseInt(formValue.employeeCount) : undefined,
      assetsUnderManagement: formValue.assetsUnderManagement ? parseInt(formValue.assetsUnderManagement) : undefined
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => 
      updates[key as keyof typeof updates] === undefined && delete updates[key as keyof typeof updates]
    );

    this.settingsService.updateOrganization(updates).subscribe({
      next: (updatedOrg) => {
        this.organizationUpdated.emit(updatedOrg);
        this.initialFormValue = this.generalForm.value;
      },
      error: (error) => {
        console.error('Update failed:', error);
      }
    });
  }

  onReset() {
    if (this.initialFormValue) {
      this.generalForm.patchValue(this.initialFormValue);
    }
    this.uploadError.set(null);
  }
}