// src/app/dashboard/components/settings/components/contact-details.component.ts
import { Component, Input, Output, EventEmitter, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  LucideAngularModule, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Save, 
  Check,
  AlertCircle
} from 'lucide-angular';
import { OrganizationSettings, OrganizationSettingsService } from '../../../services/organization-settings.service';

 
@Component({
  selector: 'app-contact-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  templateUrl: './contact-details.component.html',
})
export class ContactDetailsComponent implements OnInit {
  @Input() organization: OrganizationSettings | null = null;
  @Input() isLoading = false;
  @Output() organizationUpdated = new EventEmitter<OrganizationSettings>();

  private settingsService = inject(OrganizationSettingsService);
  private fb = inject(FormBuilder);

  // Icons
  MailIcon = Mail;
  PhoneIcon = Phone;
  GlobeIcon = Globe;
  MapPinIcon = MapPin;
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;

  // Forms
  contactForm!: FormGroup;
  addressForm!: FormGroup;

  // State
  lastSaved = signal<Date | null>(null);
  initialContactValue: any = null;
  initialAddressValue: any = null;

  constructor() {
    // Watch for last saved updates using effect
    effect(() => {
      const date = this.settingsService.lastSaved();
      this.lastSaved.set(date);
    });
  }

  ngOnInit() {
    this.initializeForms();
    this.populateForms();
  }

  private initializeForms() {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/), Validators.maxLength(255)]]
    });

    this.addressForm = this.fb.group({
      addressLine1: ['', [Validators.required, Validators.maxLength(255)]],
      addressLine2: ['', [Validators.maxLength(255)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      province: ['', [Validators.required]],
      postalCode: ['', [Validators.maxLength(20)]],
      country: ['South Africa', [Validators.required]]
    });
  }

  private populateForms() {
    if (!this.organization) return;

    const contactValue = {
      email: this.organization.email || '',
      phone: this.organization.phone || '',
      website: this.organization.website || ''
    };

    const addressValue = {
      addressLine1: this.organization.addressLine1 || '',
      addressLine2: this.organization.addressLine2 || '',
      city: this.organization.city || '',
      province: this.organization.province || '',
      postalCode: this.organization.postalCode || '',
      country: this.organization.country || 'South Africa'
    };

    this.contactForm.patchValue(contactValue);
    this.addressForm.patchValue(addressValue);
    
    this.initialContactValue = this.contactForm.value;
    this.initialAddressValue = this.addressForm.value;
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialContactValue) return false;
    return JSON.stringify(this.contactForm.value) !== JSON.stringify(this.initialContactValue);
  }

  hasUnsavedAddressChanges(): boolean {
    if (!this.initialAddressValue) return false;
    return JSON.stringify(this.addressForm.value) !== JSON.stringify(this.initialAddressValue);
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
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const formValue = this.contactForm.value;
    const updates = {
      email: formValue.email?.trim(),
      phone: formValue.phone?.trim(),
      website: formValue.website?.trim() || undefined
    };

    // Remove empty strings
    Object.keys(updates).forEach(key => 
      updates[key as keyof typeof updates] === '' && delete updates[key as keyof typeof updates]
    );

    this.settingsService.updateOrganization(updates).subscribe({
      next: (updatedOrg) => {
        this.organizationUpdated.emit(updatedOrg);
        this.initialContactValue = this.contactForm.value;
      },
      error: (error) => {
        console.error('Contact update failed:', error);
      }
    });
  }

  onSaveAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const formValue = this.addressForm.value;
    const updates = {
      addressLine1: formValue.addressLine1?.trim(),
      addressLine2: formValue.addressLine2?.trim() || undefined,
      city: formValue.city?.trim(),
      province: formValue.province,
      postalCode: formValue.postalCode?.trim() || undefined,
      country: formValue.country
    };

    // Remove empty strings
    Object.keys(updates).forEach(key => 
      updates[key as keyof typeof updates] === '' && delete updates[key as keyof typeof updates]
    );

    this.settingsService.updateOrganization(updates).subscribe({
      next: (updatedOrg) => {
        this.organizationUpdated.emit(updatedOrg);
        this.initialAddressValue = this.addressForm.value;
      },
      error: (error) => {
        console.error('Address update failed:', error);
      }
    });
  }

  onReset() {
    if (this.initialContactValue) {
      this.contactForm.patchValue(this.initialContactValue);
    }
  }

  onResetAddress() {
    if (this.initialAddressValue) {
      this.addressForm.patchValue(this.initialAddressValue);
    }
  }
}