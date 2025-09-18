// src/app/dashboard/components/settings/components/legal-info.component.ts
import { Component, Input, Output, EventEmitter, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  LucideAngularModule, 
  FileText, 
  Shield, 
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Save, 
  Check,
  AlertCircle
} from 'lucide-angular';
import { OrganizationSettings, OrganizationSettingsService } from '../../../services/organization-settings.service';

 
@Component({
  selector: 'app-legal-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './legal-info.component.html',
})
export class LegalInfoComponent implements OnInit {
  @Input() organization: OrganizationSettings | null = null;
  @Input() isLoading = false;
  @Output() organizationUpdated = new EventEmitter<OrganizationSettings>();

  private settingsService = inject(OrganizationSettingsService);
  private fb = inject(FormBuilder);

  // Icons
  FileTextIcon = FileText;
  ShieldIcon = Shield;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  XCircleIcon = XCircle;
  AlertTriangleIcon = AlertTriangle;
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;

  // Form
  legalForm!: FormGroup;

  // State
  lastSaved = signal<Date | null>(null);
  initialFormValue: any = null;
  isRequestingVerification = signal(false);

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
    this.legalForm = this.fb.group({
      legalName: ['', [Validators.required, Validators.maxLength(255)]],
      registrationNumber: ['', [Validators.required, Validators.maxLength(100)]],
      fspLicenseNumber: ['', [Validators.maxLength(100)]],
      ncrNumber: ['', [Validators.maxLength(50)]]
    });
  }

  private populateForm() {
    if (!this.organization) return;

    const formValue = {
      legalName: this.organization.legalName || '',
      registrationNumber: this.organization.registrationNumber || '',
      fspLicenseNumber: this.organization.fspLicenseNumber || '',
      ncrNumber: this.organization.ncrNumber || ''
    };

    this.legalForm.patchValue(formValue);
    this.initialFormValue = this.legalForm.value;
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialFormValue) return false;
    return JSON.stringify(this.legalForm.value) !== JSON.stringify(this.initialFormValue);
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

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  getVerificationStatusClasses(): string {
    const baseClasses = 'flex items-center px-3 py-1 rounded-full text-xs font-medium';
    
    if (this.organization?.isVerified) {
      return `${baseClasses} bg-green-100 text-green-700`;
    }
    
    switch (this.organization?.status) {
      case 'pending_verification':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'verification_rejected':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-700`;
    }
  }

  getVerificationIcon() {
    if (this.organization?.isVerified) {
      return this.CheckCircleIcon;
    }
    
    switch (this.organization?.status) {
      case 'pending_verification':
        return this.ClockIcon;
      case 'verification_rejected':
        return this.XCircleIcon;
      default:
        return this.ShieldIcon;
    }
  }

  getVerificationStatusText(): string {
    if (this.organization?.isVerified) {
      return 'Verified';
    }
    
    switch (this.organization?.status) {
      case 'pending_verification':
        return 'Pending Verification';
      case 'verification_rejected':
        return 'Verification Rejected';
      default:
        return 'Not Verified';
    }
  }

  canRequestVerification(): boolean {
    return !!(
      this.organization?.legalName?.trim() &&
      this.organization?.registrationNumber?.trim() &&
      this.organization?.addressLine1?.trim() &&
      this.organization?.city?.trim() &&
      this.organization?.province &&
      this.organization?.country
    );
  }

  requestVerification() {
    if (!this.canRequestVerification()) {
      return;
    }

    this.isRequestingVerification.set(true);

    this.settingsService.requestVerification().subscribe({
      next: () => {
        this.isRequestingVerification.set(false);
        // The organization will be updated automatically through the service
      },
      error: (error) => {
        console.error('Verification request failed:', error);
        this.isRequestingVerification.set(false);
      }
    });
  }

  onSave() {
    if (this.legalForm.invalid) {
      this.legalForm.markAllAsTouched();
      return;
    }

    const formValue = this.legalForm.value;
    const updates = {
      legalName: formValue.legalName?.trim(),
      registrationNumber: formValue.registrationNumber?.trim(),
      fspLicenseNumber: formValue.fspLicenseNumber?.trim() || undefined,
      ncrNumber: formValue.ncrNumber?.trim() || undefined
    };

    // Remove empty strings
    Object.keys(updates).forEach(key => 
      updates[key as keyof typeof updates] === '' && delete updates[key as keyof typeof updates]
    );

    this.settingsService.updateOrganization(updates).subscribe({
      next: (updatedOrg) => {
        this.organizationUpdated.emit(updatedOrg);
        this.initialFormValue = this.legalForm.value;
      },
      error: (error) => {
        console.error('Legal info update failed:', error);
      }
    });
  }

  onReset() {
    if (this.initialFormValue) {
      this.legalForm.patchValue(this.initialFormValue);
    }
  }
}