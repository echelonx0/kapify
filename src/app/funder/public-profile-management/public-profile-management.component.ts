// src/app/funder/components/public-profile-management/public-profile-management.component.ts
import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
 
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, Eye, Edit3, Save, Globe, ExternalLink, Plus, Trash2, Upload, Play, Users, Award, Target, DollarSign, Clock, Building2, ArrowLeft } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { PublicProfile, SuccessMetric, SocialLink, FundingArea, TeamMember } from '../models/public-profile.models';
import { FunderOnboardingService } from '../services/funder-onboarding.service';
import { PublicProfileService } from '../services/public-profile.service';
import { ProfileOptimizationWidgetComponent } from './profile-optimisation.component';

 

@Component({
  selector: 'app-public-profile-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, UiButtonComponent, ProfileOptimizationWidgetComponent],
  templateUrl: 'public-profile-management.component.html'

})
export class PublicProfileManagementComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
 
  private profileService = inject(PublicProfileService);
  private onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  EyeIcon = Eye;
  Edit3Icon = Edit3;
  SaveIcon = Save;
  GlobeIcon = Globe;
  ExternalLinkIcon = ExternalLink;
  PlusIcon = Plus;
  Trash2Icon = Trash2;
  UploadIcon = Upload;
  PlayIcon = Play;
  UsersIcon = Users;
  AwardIcon = Award;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  ClockIcon = Clock;
  Building2Icon = Building2;
ArrowLeftIcon = ArrowLeft;
  // State
  profile = signal<PublicProfile | null>(null);
  organizationId = signal<string | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  isCreating = signal(false);
  isPublishing = signal(false);
  error = signal<string | null>(null);
  lastSaved = signal<Date | null>(null);

  // Form
  profileForm!: FormGroup;

  // Computed
  profileExists = computed(() => !!this.profile()?.id);
  isValid = computed(() => this.profileForm?.valid ?? false);
  hasChanges = computed(() => this.profileForm?.dirty ?? false);

  // Form Arrays
  get portfolioHighlightsArray() { return this.profileForm.get('portfolioHighlights') as FormArray; }
  get successMetricsArray() { return this.profileForm.get('successMetrics') as FormArray; }
  get socialLinksArray() { return this.profileForm.get('socialLinks') as FormArray; }
  get fundingAreasArray() { return this.profileForm.get('fundingAreas') as FormArray; }
  get teamMembersArray() { return this.profileForm.get('teamMembers') as FormArray; }

  ngOnInit() {
    this.initializeForm();
    this.loadOrganizationData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // INITIALIZATION
  // ===============================

  private initializeForm() {
    this.profileForm = this.fb.group({
      tagline: ['', [Validators.required, Validators.maxLength(120)]],
      elevator_pitch: ['', Validators.maxLength(300)],
      heroVideoUrl: [''],
      portfolioHighlights: this.fb.array([]),
      successMetrics: this.fb.array([]),
      investmentRange: this.fb.group({
        min: [null, [Validators.required, Validators.min(1)]],
        max: [null, [Validators.required, Validators.min(1)]],
        typical: [null],
        currency: ['ZAR']
      }),
      fundingAreas: this.fb.array([]),
      applicationProcess: ['Apply through our platform'],
      responseTimePromise: [''],
      socialLinks: this.fb.array([]),
      foundingStory: [''],
      investmentApproach: [''],
      teamMembers: this.fb.array([])
    });
  }

  private loadOrganizationData() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state?.organization?.id) {
          this.organizationId.set(state.organization.id);
          this.loadProfile(state.organization.id);
        }
      });
  }

  private loadProfile(organizationId: string) {
    this.isLoading.set(true);
    
    this.profileService.loadOrganizationProfile(organizationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          if (profile) {
            this.populateForm(profile);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load profile:', error);
          this.error.set('Failed to load profile');
          this.isLoading.set(false);
        }
      });
  }

    goBack() {
  window.history.back();
}
// Add this method to your component
saveProfile() {
  this.saveDraft();
}
  private populateForm(profile: PublicProfile) {
    // Basic fields
    this.profileForm.patchValue({
      tagline: profile.tagline,
      elevator_pitch: profile.elevator_pitch,
      heroVideoUrl: profile.heroVideo?.url,
      applicationProcess: profile.applicationProcess,
      responseTimePromise: profile.responseTimePromise,
      foundingStory: profile.foundingStory,
      investmentApproach: profile.investmentApproach
    });

    // Investment range
    if (profile.investmentRange) {
      this.profileForm.get('investmentRange')?.patchValue(profile.investmentRange);
    }

    // Arrays
    this.populatePortfolioHighlights(profile.portfolioHighlights);
    this.populateSuccessMetrics(profile.successMetrics);
    this.populateSocialLinks(profile.socialLinks);
    this.populateFundingAreas(profile.fundingAreas);
    this.populateTeamMembers(profile.teamMembers);

    // Mark as pristine after population
    this.profileForm.markAsPristine();
  }

  // ===============================
  // ARRAY POPULATION
  // ===============================

  private populatePortfolioHighlights(highlights: string[]) {
    const array = this.portfolioHighlightsArray;
    array.clear();
    highlights.forEach(highlight => {
      array.push(this.fb.control(highlight));
    });
  }

  private populateSuccessMetrics(metrics: SuccessMetric[]) {
    const array = this.successMetricsArray;
    array.clear();
    metrics.forEach(metric => {
      array.push(this.fb.group({
        label: [metric.label],
        value: [metric.value],
        emphasis: [metric.emphasis || false]
      }));
    });
  }

  private populateSocialLinks(links: SocialLink[]) {
    const array = this.socialLinksArray;
    array.clear();
    links.forEach(link => {
      array.push(this.fb.group({
        platform: [link.platform],
        url: [link.url]
      }));
    });
  }

  private populateFundingAreas(areas: FundingArea[]) {
    const array = this.fundingAreasArray;
    array.clear();
    areas.forEach(area => {
      array.push(this.fb.group({
        name: [area.name],
        description: [area.description],
        tagsInput: [area.tags.join(', ')]
      }));
    });
  }

  private populateTeamMembers(members: TeamMember[]) {
    const array = this.teamMembersArray;
    array.clear();
    members.forEach(member => {
      array.push(this.fb.group({
        name: [member.name],
        title: [member.title],
        bio: [member.bio],
        linkedinUrl: [member.linkedinUrl]
      }));
    });
  }

  // ===============================
  // ARRAY MANAGEMENT
  // ===============================

  addPortfolioHighlight() {
    this.portfolioHighlightsArray.push(this.fb.control(''));
  }

  removePortfolioHighlight(index: number) {
    this.portfolioHighlightsArray.removeAt(index);
  }

  addSuccessMetric() {
    this.successMetricsArray.push(this.fb.group({
      label: [''],
      value: [''],
      emphasis: [false]
    }));
  }

  removeSuccessMetric(index: number) {
    this.successMetricsArray.removeAt(index);
  }

  addSocialLink() {
    this.socialLinksArray.push(this.fb.group({
      platform: ['linkedin'],
      url: ['']
    }));
  }

  removeSocialLink(index: number) {
    this.socialLinksArray.removeAt(index);
  }

  addFundingArea() {
    this.fundingAreasArray.push(this.fb.group({
      name: [''],
      description: [''],
      tagsInput: ['']
    }));
  }

  removeFundingArea(index: number) {
    this.fundingAreasArray.removeAt(index);
  }

  addTeamMember() {
    this.teamMembersArray.push(this.fb.group({
      name: [''],
      title: [''],
      bio: [''],
      linkedinUrl: ['']
    }));
  }

  removeTeamMember(index: number) {
    this.teamMembersArray.removeAt(index);
  }

  // ===============================
  // ACTIONS
  // ===============================

  saveDraft() {
    if (!this.profileForm.valid) return;

    this.isSaving.set(true);
    const formData = this.getFormData();
    const orgId = this.organizationId();

    if (!orgId) {
      this.error.set('Organization not found');
      this.isSaving.set(false);
      return;
    }

    const saveOperation = this.profileExists() 
      ? this.profileService.updateProfile(this.profile()!.id, formData)
      : this.profileService.createProfile(orgId, formData);

    saveOperation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.lastSaved.set(new Date());
          this.profileForm.markAsPristine();
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Save failed:', error);
          this.error.set('Failed to save profile');
          this.isSaving.set(false);
        }
      });
  }

  createProfile() {
    this.isCreating.set(true);
    this.saveDraft();
    // saveDraft will handle the creation logic
    this.isCreating.set(false);
  }

  publishProfile() {
    if (!this.profile()?.id) {
      // Save first, then publish
      this.saveDraft();
      return;
    }

    this.isPublishing.set(true);
    
    this.profileService.publishProfile(this.profile()!.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.isPublishing.set(false);
        },
        error: (error) => {
          console.error('Publish failed:', error);
          this.error.set('Failed to publish profile');
          this.isPublishing.set(false);
        }
      });
  }

  previewProfile() {
    // Save current changes first, then open preview
    if (this.hasChanges()) {
      this.saveDraft();
    }
    
    if (this.profile()?.slug) {
      window.open(`/funder/${this.profile()!.slug}?preview=true`, '_blank');
    }
  }

  viewPublicProfile() {
    if (this.profile()?.slug) {
      window.open(`/funder/${this.profile()!.slug}`, '_blank');
    }
  }

  uploadVideo() {
    // TODO: Implement video upload functionality
    console.log('Video upload not implemented yet');
  }

  // ===============================
  // HELPERS
  // ===============================

  private getFormData(): Partial<PublicProfile> {
    const form = this.profileForm.value;
    
    return {
      tagline: form.tagline,
      elevator_pitch: form.elevator_pitch,
      heroVideo: form.heroVideoUrl ? { url: form.heroVideoUrl } : undefined,
      portfolioHighlights: form.portfolioHighlights.filter((h: string) => h.trim()),
      successMetrics: form.successMetrics.filter((m: any) => m.label && m.value),
      investmentRange: form.investmentRange,
      fundingAreas: form.fundingAreas
        .filter((a: any) => a.name)
        .map((a: any) => ({
          name: a.name,
          description: a.description,
          tags: a.tagsInput ? a.tagsInput.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
        })),
      applicationProcess: form.applicationProcess,
      responseTimePromise: form.responseTimePromise,
      socialLinks: form.socialLinks.filter((l: any) => l.url),
      foundingStory: form.foundingStory,
      investmentApproach: form.investmentApproach,
      teamMembers: form.teamMembers.filter((m: any) => m.name && m.title)
    };
  }

  getSlugPreview(): string {
    const tagline = this.profileForm.get('tagline')?.value || '';
    return this.profile()?.slug || this.generateSlug(tagline);
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
      .substring(0, 50) || 'organization';
  }

  formatLastSaved(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diff = now.getTime() - saved.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    return saved.toLocaleTimeString();
  }

  private setupAutoSave() {
    this.profileForm.valueChanges
      .pipe(
        debounceTime(30000), // Auto-save every 30 seconds
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.profileForm.valid && this.hasChanges() && !this.isSaving()) {
          this.saveDraft();
        }
      });
  }
}