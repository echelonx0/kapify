// src/app/funder/components/organization-onboarding.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign
} from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { FunderOnboardingService, OnboardingState, FunderOrganization } from '../services/funder-onboarding.service';
 
interface OrganizationFormData {
  // Basic Information
  name: string;
  description: string;
  organizationType: 'investment_fund' | 'bank' | 'government' | 'ngo' | 'private_equity' | 'venture_capital' | '';
  
  // Legal Information
  legalName: string;
  registrationNumber: string;
  taxNumber: string;
  foundedYear: string;
  
  // Contact Information
  website: string;
  email: string;
  phone: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  
  // Organization Details
  employeeCount: string;
  assetsUnderManagement: string;
}

@Component({
  selector: 'app-organization-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiCardComponent,
    LucideAngularModule
  ],
  templateUrl: 'funder-organization-onboarding.component.html'
})
export class OrganizationOnboardingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  Building2Icon = Building2;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  ArrowRightIcon = ArrowRight;
  ArrowLeftIcon = ArrowLeft;
  ShieldIcon = Shield;
  FileTextIcon = FileText;
  MailIcon = Mail;
  PhoneIcon = Phone;
  MapPinIcon = MapPin;
  CalendarIcon = Calendar;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;

  // State
  currentView = signal<'form' | 'success' | 'verification'>('form');
  onboardingState = signal<OnboardingState | null>(null);
  isEditMode = signal(false);
  currentYear = new Date().getFullYear();

  // Form data
  formData = signal<OrganizationFormData>({
    name: '',
    description: '',
    organizationType: '',
    legalName: '',
    registrationNumber: '',
    taxNumber: '',
    foundedYear: '',
    website: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    employeeCount: '',
    assetsUnderManagement: ''
  });

  ngOnInit() {
    this.checkOnboardingStatus();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkOnboardingStatus() {
    this.onboardingService.checkOnboardingStatus().subscribe();
  }

  private setupSubscriptions() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.onboardingState.set(state);
        
        // If organization exists, populate form
        if (state.organization) {
          this.populateFormFromOrganization(state.organization);
          
          // Determine view based on state
          if (state.isComplete) {
            this.currentView.set('verification');
          } else if (state.canCreateOpportunities) {
            this.currentView.set('success');
          }
        }
      });
  }

  private populateFormFromOrganization(org: FunderOrganization) {
    this.formData.update(data => ({
      ...data,
      name: org.name || '',
      description: org.description || '',
      organizationType: org.organizationType || '',
      legalName: org.legalName || '',
      registrationNumber: org.registrationNumber || '',
      taxNumber: org.taxNumber || '',
      foundedYear: org.foundedYear?.toString() || '',
      website: org.website || '',
      email: org.email || '',
      phone: org.phone || '',
      addressLine1: org.addressLine1 || '',
      addressLine2: org.addressLine2 || '',
      city: org.city || '',
      province: org.province || '',
      postalCode: org.postalCode || '',
      country: org.country || 'South Africa',
      employeeCount: org.employeeCount?.toString() || '',
      assetsUnderManagement: org.assetsUnderManagement?.toString() || ''
    }));
  }

  // Form handling
  updateField(field: keyof OrganizationFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.value
    }));
  }

  isFormValid(): boolean {
    const data = this.formData();
    return !!(
      data.name &&
      data.description &&
      data.organizationType &&
      data.email &&
      data.phone &&
      data.addressLine1 &&
      data.city &&
      data.province &&
      data.country
    );
  }

  saveOrganization() {
    if (!this.isFormValid()) return;

    const organizationData: Partial<FunderOrganization> = {
      name: this.formData().name,
      description: this.formData().description,
      organizationType: this.formData().organizationType as any,
      legalName: this.formData().legalName || undefined,
      registrationNumber: this.formData().registrationNumber || undefined,
      taxNumber: this.formData().taxNumber || undefined,
      foundedYear: this.formData().foundedYear ? Number(this.formData().foundedYear) : undefined,
      website: this.formData().website || undefined,
      email: this.formData().email,
      phone: this.formData().phone,
      addressLine1: this.formData().addressLine1,
      addressLine2: this.formData().addressLine2 || undefined,
      city: this.formData().city,
      province: this.formData().province,
      postalCode: this.formData().postalCode || undefined,
      country: this.formData().country,
      employeeCount: this.formData().employeeCount ? Number(this.formData().employeeCount.split('-')[0]) : undefined,
      assetsUnderManagement: this.formData().assetsUnderManagement ? Number(this.formData().assetsUnderManagement) : undefined
    };

    if (this.isEditMode()) {
      this.onboardingService.updateOrganization(organizationData).subscribe({
        next: () => {
          this.currentView.set('success');
          this.isEditMode.set(false);
        },
        error: (error) => console.error('Failed to update organization:', error)
      });
    } else {
      this.onboardingService.createOrganization(organizationData).subscribe({
        next: () => {
          this.currentView.set('success');
        },
        error: (error) => console.error('Failed to create organization:', error)
      });
    }
  }

  // Navigation actions
  editOrganization() {
    this.isEditMode.set(true);
    this.currentView.set('form');
  }

  cancelEdit() {
    this.isEditMode.set(false);
    this.currentView.set('success');
    // Reset form to original data
    const org = this.onboardingState()?.organization;
    if (org) {
      this.populateFormFromOrganization(org);
    }
  }

  proceedToDashboard() {
    this.router.navigate(['/funder-dashboard']);
  }

  skipVerification() {
    this.router.navigate(['/funder-dashboard']);
  }

  requestVerification() {
    this.onboardingService.requestVerification().subscribe({
      next: (result) => {
        console.log('Verification requested:', result.message);
        this.router.navigate(['/funder-dashboard']);
      },
      error: (error) => console.error('Failed to request verification:', error)
    });
  }

  // UI helpers
  getStepClasses(stepIndex: number): string {
    const state = this.onboardingState();
    if (!state) return 'w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center';
    
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
    
    if (stepIndex < state.currentStep) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (stepIndex === state.currentStep) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-neutral-200 text-neutral-500`;
    }
  }

  getStepTextClasses(stepIndex: number): string {
    const state = this.onboardingState();
    if (!state) return 'text-sm font-medium text-neutral-500';
    
    if (stepIndex <= state.currentStep) {
      return 'text-sm font-medium text-neutral-900';
    } else {
      return 'text-sm font-medium text-neutral-500';
    }
  }
}