// src/app/dashboard/components/settings/components/general-info/general-info.component.ts
import { Component, Input, Output, EventEmitter, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  LucideAngularModule, 
  Save, 
  Check,
  AlertCircle
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
  styles: [`
    :host {
      display: block;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
    }

    /* Focus ring animation */
    input:focus,
    select:focus,
    textarea:focus {
      animation: focusPulse 0.2s ease-out;
    }

    @keyframes focusPulse {
      from {
        box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.1);
      }
      to {
        box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
      }
    }

    /* Smooth transitions */
    input,
    select,
    textarea {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class GeneralInfoComponent implements OnInit {
  @Input() organization: OrganizationSettings | null = null;
  @Input() isLoading = false;
  @Output() organizationUpdated = new EventEmitter<OrganizationSettings>();

  private settingsService = inject(OrganizationSettingsService);
  private fb = inject(FormBuilder);

  // Icons
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;

  // Form
  generalForm!: FormGroup;

  // State
  uploadError = signal<string | null>(null);
  lastSaved = signal<Date | null>(null);
  initialFormValue: any = null;

  constructor() {
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
      description: ['', [Validators.required, Validators.minLength(10)]],
      organizationType: ['', [Validators.required]],
      assetsUnderManagement: ['']
    });

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
      assetsUnderManagement: this.organization.assetsUnderManagement?.toString() || ''
    };

    this.generalForm.patchValue(formValue);
    this.initialFormValue = this.generalForm.value;
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
        this.uploadError.set(error.message || 'Failed to save changes');
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