import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  UserCheck,
  Briefcase,
  Target,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Trash2,
  ArrowLeft,
} from 'lucide-angular';
import {
  ExpertiseArea,
  EngagementType,
  ExecutiveApplicationService,
  ExecutiveApplicationFormData,
} from 'src/app/admin/services/executive-application.service';

interface ExpertiseOption {
  value: ExpertiseArea;
  label: string;
  description: string;
}

interface EngagementOption {
  value: EngagementType;
  label: string;
  description: string;
}

@Component({
  selector: 'app-executive-application-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './executive-application-form.component.html',
  styleUrls: ['./executive-application-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutiveApplicationFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private applicationService = inject(ExecutiveApplicationService);
  private destroy$ = new Subject<void>();

  // Icons
  UserCheckIcon = UserCheck;
  BriefcaseIcon = Briefcase;
  TargetIcon = Target;
  ClockIcon = Clock;
  MessageSquareIcon = MessageSquare;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  SaveIcon = Save;
  SendIcon = Send;
  Trash2Icon = Trash2;
  ArrowLeftIcon = ArrowLeft;

  // Form
  applicationForm!: FormGroup;

  // State
  isLoading = computed(() => this.applicationService.isLoading());
  isSaving = computed(() => this.applicationService.isSaving());
  error = computed(() => this.applicationService.error());
  existingApplication = signal<any>(null);
  showSuccessMessage = signal(false);
  successMessage = signal('');

  // Expertise options
  expertiseOptions: ExpertiseOption[] = [
    {
      value: 'finance',
      label: 'Finance & Accounting',
      description: 'Financial planning, analysis, and management',
    },
    {
      value: 'marketing',
      label: 'Marketing & Branding',
      description: 'Marketing strategy, branding, and growth',
    },
    {
      value: 'operations',
      label: 'Operations',
      description: 'Process optimization and operational excellence',
    },
    {
      value: 'technology',
      label: 'Technology & IT',
      description: 'Tech strategy, development, and infrastructure',
    },
    {
      value: 'strategy',
      label: 'Business Strategy',
      description: 'Strategic planning and business development',
    },
    {
      value: 'sales',
      label: 'Sales & Business Development',
      description: 'Sales strategy and customer acquisition',
    },
    {
      value: 'hr',
      label: 'Human Resources',
      description: 'Talent management and organizational development',
    },
    {
      value: 'legal',
      label: 'Legal & Compliance',
      description: 'Legal matters and regulatory compliance',
    },
    {
      value: 'product',
      label: 'Product Management',
      description: 'Product strategy and development',
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Specialized expertise in other areas',
    },
  ];

  // Engagement options
  engagementOptions: EngagementOption[] = [
    {
      value: 'mentorship',
      label: 'Mentorship',
      description: 'One-on-one guidance and coaching',
    },
    {
      value: 'advisory',
      label: 'Advisory Board',
      description: 'Strategic advisory board member',
    },
    {
      value: 'consulting',
      label: 'Consulting Projects',
      description: 'Short-term consulting engagements',
    },
    {
      value: 'board_member',
      label: 'Board Member',
      description: 'Formal board of directors role',
    },
    {
      value: 'part_time',
      label: 'Part-Time Executive',
      description: 'Fractional executive role',
    },
    {
      value: 'flexible',
      label: 'Flexible',
      description: 'Open to various engagement types',
    },
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadExistingApplication();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.applicationForm = this.fb.group({
      // Personal Information
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      location: [''],
      linkedinUrl: [
        '',
        [Validators.pattern(/^https?:\/\/(www\.)?linkedin\.com\/.+/)],
      ],

      // Professional Background
      roleTitle: ['', [Validators.required, Validators.minLength(2)]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      yearsExperience: [
        null,
        [Validators.required, Validators.min(0), Validators.max(70)],
      ],
      industry: [''],
      professionalSummary: [
        '',
        [
          Validators.required,
          Validators.minLength(50),
          Validators.maxLength(1000),
        ],
      ],

      // Expertise & Availability
      expertiseAreas: [[], [Validators.required, Validators.minLength(1)]],
      otherExpertise: [''],
      availabilityHoursPerWeek: [null, [Validators.min(1), Validators.max(40)]],
      preferredEngagementType: [
        [],
        [Validators.required, Validators.minLength(1)],
      ],

      // Motivation & Goals
      motivation: [
        '',
        [
          Validators.required,
          Validators.minLength(100),
          Validators.maxLength(1000),
        ],
      ],
      valueProposition: ['', [Validators.maxLength(500)]],

      // Optional References
      referenceName1: [''],
      referenceEmail1: ['', [Validators.email]],
      referenceName2: [''],
      referenceEmail2: ['', [Validators.email]],
    });

    // Show/hide other expertise field based on selection
    this.applicationForm
      .get('expertiseAreas')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((areas: ExpertiseArea[]) => {
        const otherControl = this.applicationForm.get('otherExpertise');
        if (areas.includes('other')) {
          otherControl?.setValidators([Validators.required]);
        } else {
          otherControl?.clearValidators();
          otherControl?.setValue('');
        }
        otherControl?.updateValueAndValidity();
      });
  }

  private loadExistingApplication(): void {
    this.applicationService
      .getCurrentApplication()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (application) => {
          if (application) {
            this.existingApplication.set(application);
            this.populateForm(application);

            // If already submitted, navigate to status page
            if (application.status !== 'draft') {
              this.router.navigate(['/subscriptions/executive/status']);
            }
          }
        },
        error: (error) => {
          console.error('Error loading application:', error);
        },
      });
  }

  private populateForm(application: any): void {
    this.applicationForm.patchValue({
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      location: application.location,
      linkedinUrl: application.linkedinUrl,
      roleTitle: application.roleTitle,
      companyName: application.companyName,
      yearsExperience: application.yearsExperience,
      industry: application.industry,
      professionalSummary: application.professionalSummary,
      expertiseAreas: application.expertiseAreas,
      otherExpertise: application.otherExpertise,
      availabilityHoursPerWeek: application.availabilityHoursPerWeek,
      preferredEngagementType: application.preferredEngagementType,
      motivation: application.motivation,
      valueProposition: application.valueProposition,
      referenceName1: application.referenceName1,
      referenceEmail1: application.referenceEmail1,
      referenceName2: application.referenceName2,
      referenceEmail2: application.referenceEmail2,
    });
  }

  // Toggle checkbox selection
  toggleExpertiseArea(area: ExpertiseArea): void {
    const currentAreas =
      this.applicationForm.get('expertiseAreas')?.value || [];
    const index = currentAreas.indexOf(area);

    if (index > -1) {
      currentAreas.splice(index, 1);
    } else {
      currentAreas.push(area);
    }

    this.applicationForm.patchValue({ expertiseAreas: currentAreas });
  }

  isExpertiseSelected(area: ExpertiseArea): boolean {
    const areas = this.applicationForm.get('expertiseAreas')?.value || [];
    return areas.includes(area);
  }

  toggleEngagementType(type: EngagementType): void {
    const currentTypes =
      this.applicationForm.get('preferredEngagementType')?.value || [];
    const index = currentTypes.indexOf(type);

    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }

    this.applicationForm.patchValue({ preferredEngagementType: currentTypes });
  }

  isEngagementSelected(type: EngagementType): boolean {
    const types =
      this.applicationForm.get('preferredEngagementType')?.value || [];
    return types.includes(type);
  }

  // Save as draft
  saveAsDraft(): void {
    if (!this.applicationForm.valid) {
      this.markFormGroupTouched(this.applicationForm);
      return;
    }

    const formData: ExecutiveApplicationFormData = this.applicationForm.value;

    this.applicationService
      .saveAsDraft(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Draft saved successfully');
        },
        error: (error) => {
          console.error('Error saving draft:', error);
        },
      });
  }

  // Submit application
  submitApplication(): void {
    if (!this.applicationForm.valid) {
      this.markFormGroupTouched(this.applicationForm);
      return;
    }

    const formData: ExecutiveApplicationFormData = this.applicationForm.value;

    this.applicationService
      .submitApplication(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Application submitted successfully!');
          setTimeout(() => {
            this.router.navigate(['/subscriptions/executive/status']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error submitting application:', error);
        },
      });
  }

  // Delete draft
  deleteDraft(): void {
    if (
      confirm(
        'Are you sure you want to delete this draft? This action cannot be undone.'
      )
    ) {
      this.applicationService
        .deleteDraft()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Draft deleted');
            this.applicationForm.reset();
          },
          error: (error) => {
            console.error('Error deleting draft:', error);
          },
        });
    }
  }

  // Go back
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // Utility methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.showSuccessMessage.set(true);
    setTimeout(() => {
      this.showSuccessMessage.set(false);
    }, 5000);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.applicationForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.applicationForm.get(fieldName);
    if (!field?.errors || !field?.touched) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Please enter a valid email address';
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }
    if (field.errors['min'])
      return `Minimum value is ${field.errors['min'].min}`;
    if (field.errors['max'])
      return `Maximum value is ${field.errors['max'].max}`;
    if (field.errors['pattern']) return 'Invalid format';

    return 'Invalid input';
  }

  getCharacterCount(fieldName: string): { current: number; max: number } {
    const field = this.applicationForm.get(fieldName);
    const value = field?.value || '';
    const max =
      fieldName === 'professionalSummary' || fieldName === 'motivation'
        ? 1000
        : 500;
    return { current: value.length, max };
  }
}
