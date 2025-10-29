// src/app/profile/steps/business-assessment/manpower/manpower.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {
  LucideAngularModule,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  Upload,
} from 'lucide-angular';
import { UiInputComponent } from 'src/app/shared/components';
import { SupabaseDocumentService } from 'src/app/shared/services/supabase-document.service';

export interface ManpowerData {
  hasSpecialistSkills?: boolean;
  specialistSkillsDetails?: string;
  isRequiredLabourAvailable?: boolean;
  labourAvailabilityDetails?: string;
  hasOrganogram?: boolean;
  organogramDocumentId?: string;
  isStaffUnionised?: boolean;
  unionDetails?: string;
  hasSuccessionPlan?: boolean;
  successionPlanDetails?: string;
  hasSkillShortfall?: boolean;
  skillShortfallDetails?: string;
  hasLabourDisputes?: boolean;
  labourDisputeDetails?: string;
}

@Component({
  selector: 'app-manpower',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './manpower.component.html',
})
export class ManpowerComponent implements OnInit {
  @Input() initialData: ManpowerData = {};
  @Output() dataChanged = new EventEmitter<ManpowerData>();

  private fb = inject(FormBuilder);

  // State
  isExpanded = signal(false);
  manpowerForm: FormGroup;

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  private documentService = inject(SupabaseDocumentService);

  UploadIcon = Upload;
  FileTextIcon = FileText;
  Trash2Icon = Trash2;

  // Document state
  organogramDocumentId = signal<string | undefined>(undefined);
  organogramFileName = signal<string | undefined>(undefined);
  isUploadingOrganogram = signal(false);

  constructor() {
    this.manpowerForm = this.fb.group({
      hasSpecialistSkills: [false],
      specialistSkillsDetails: [''],
      isRequiredLabourAvailable: [true],
      labourAvailabilityDetails: [''],
      hasOrganogram: [true],
      organogramDocumentId: [''],
      isStaffUnionised: [false],
      unionDetails: [''],
      hasSuccessionPlan: [true],
      successionPlanDetails: [''],
      hasSkillShortfall: [false],
      skillShortfallDetails: [''],
      hasLabourDisputes: [false],
      labourDisputeDetails: [''],
    });
  }

  ngOnInit() {
    // Populate form with initial data
    if (this.initialData && Object.keys(this.initialData).length > 0) {
      this.manpowerForm.patchValue(this.initialData);

      // Load organogram document if exists
      if (this.initialData.organogramDocumentId) {
        this.organogramDocumentId.set(this.initialData.organogramDocumentId);
        this.loadOrganogramFileName();
      }

      this.isExpanded.set(true);
    }

    // Subscribe to form changes
    this.manpowerForm.valueChanges.subscribe((value) => {
      this.dataChanged.emit(value);
    });
  }

  private loadOrganogramFileName(): void {
    this.documentService.getDocumentsByUser().subscribe({
      next: (docs) => {
        const organogramDoc = docs.get('organogram');
        if (organogramDoc) {
          this.organogramFileName.set(organogramDoc.originalName);
        }
      },
    });
  }

  toggleSection() {
    this.isExpanded.set(!this.isExpanded());
  }

  // Helper methods for template
  getBooleanValue(controlName: string): boolean {
    return this.manpowerForm.get(controlName)?.value === true;
  }

  setBooleanValue(controlName: string, value: boolean) {
    this.manpowerForm.get(controlName)?.setValue(value);
  }

  // Calculate completion for progress tracking
  getCompletionPercentage(): number {
    const formValue = this.manpowerForm.value;
    let answered = 0;
    let total = 0;

    // Count base questions (always count these)
    const baseQuestions = [
      'hasSpecialistSkills',
      'isRequiredLabourAvailable',
      'hasOrganogram',
      'isStaffUnionised',
      'hasSuccessionPlan',
      'hasSkillShortfall',
      'hasLabourDisputes',
    ];

    baseQuestions.forEach((question) => {
      total++;
      if (formValue[question] !== null && formValue[question] !== undefined) {
        answered++;
      }
    });

    // Count conditional detail fields only if their parent is true
    if (
      formValue.hasSpecialistSkills &&
      formValue.specialistSkillsDetails?.trim()
    ) {
      answered++;
    }
    if (formValue.hasSpecialistSkills) total++;

    if (formValue.hasOrganogram && formValue.organogramDescription?.trim()) {
      answered++;
    }
    if (formValue.hasOrganogram) total++;

    if (formValue.isStaffUnionised && formValue.unionDetails?.trim()) {
      answered++;
    }
    if (formValue.isStaffUnionised) total++;

    if (
      formValue.hasSuccessionPlan &&
      formValue.successionPlanDetails?.trim()
    ) {
      answered++;
    }
    if (formValue.hasSuccessionPlan) total++;

    if (
      formValue.hasSkillShortfall &&
      formValue.skillShortfallDetails?.trim()
    ) {
      answered++;
    }
    if (formValue.hasSkillShortfall) total++;

    if (formValue.hasLabourDisputes && formValue.labourDisputeDetails?.trim()) {
      answered++;
    }
    if (formValue.hasLabourDisputes) total++;

    return total > 0 ? Math.round((answered / total) * 100) : 0;
  }

  hasData(): boolean {
    const formValue = this.manpowerForm.value;
    return Object.values(formValue).some(
      (value) =>
        value !== null && value !== undefined && value !== '' && value !== false
    );
  }

  // Organogram file upload methods
  onOrganogramFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.isUploadingOrganogram.set(true);

    this.documentService
      .uploadDocument(file, 'organogram', undefined, 'business-assessment')
      .subscribe({
        next: (result) => {
          this.organogramDocumentId.set(result.id);
          this.organogramFileName.set(result.originalName);
          this.manpowerForm.patchValue({ organogramDocumentId: result.id });
          this.isUploadingOrganogram.set(false);
        },
        error: (error) => {
          console.error('Organogram upload failed:', error);
          this.isUploadingOrganogram.set(false);
          alert('Upload failed. Please try again.');
        },
      });
  }

  downloadOrganogram(): void {
    if (!this.organogramDocumentId()) return;
    this.documentService.downloadDocumentByKey('organogram').subscribe();
  }

  deleteOrganogram(): void {
    if (!this.organogramDocumentId()) return;
    if (!confirm('Delete organogram document?')) return;

    this.documentService.deleteDocumentByKey('organogram').subscribe({
      next: () => {
        this.organogramDocumentId.set(undefined);
        this.organogramFileName.set(undefined);
        this.manpowerForm.patchValue({ organogramDocumentId: '' });
      },
      error: (error) => {
        console.error('Delete failed:', error);
        alert('Failed to delete document.');
      },
    });
  }
}
