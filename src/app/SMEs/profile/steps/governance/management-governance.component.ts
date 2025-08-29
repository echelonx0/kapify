// src/app/profile/steps/governance/management-governance.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, MoreHorizontal, Save, Clock } from 'lucide-angular';
import { UiInputComponent, UiButtonComponent } from '../../../../shared/components'; 
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
 
import { FundingProfileSetupService } from '../../../services/funding-profile-setup.service';
import { BusinessAssessment, ManagementStructure } from 'src/app/SMEs/applications/models/funding-application.models';
import { ManpowerComponent } from './manpower/manpower.component';

interface LocalManagementMember {
  id: string;
  fullName: string;
  role: string;
  qualification: string;
  yearsOfExperience: number;
}

interface LocalBoardMember {
  id: string;
  fullName: string;
  role: string;
  appointmentDate: string;
  independent: boolean;
}

interface LocalCommitteeMember {
  id: string;
  fullName: string;
  committee: string;
  role: string;
  description: string;
}

// Define section keys and state type
type SectionKey = 'management' | 'board' | 'committee';
type SectionStates = Record<SectionKey, boolean>;

@Component({
  selector: 'app-management-governance',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, UiInputComponent,
     UiButtonComponent, FormsModule, ManpowerComponent],
  templateUrl: 'management-governance.component.html'
})
export class ManagementGovernanceComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private fb = inject(FormBuilder);

  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  showMemberModal = signal(false);
  editingMemberType = signal<SectionKey>('management');
  editingMemberId = signal<string | null>(null);
  managementSearchTerm = '';
  
  // Yes/No question states
  hasBoard = signal(true);
  hasManagementCommittee = signal(true);

  memberForm: FormGroup;

  // Data
  managementTeam = signal<LocalManagementMember[]>([]);
  boardOfDirectors = signal<LocalBoardMember[]>([]);
  managementCommittee = signal<LocalCommitteeMember[]>([]);

  // Section states
  private sectionStates = signal<SectionStates>({
    management: true,
    board: false,
    committee: false
  });

  // Auto-save subscription
  private autoSaveSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  PlusIcon = Plus;
  EditIcon = Edit;
  Trash2Icon = Trash2;
  SearchIcon = Search;
  MoreHorizontalIcon = MoreHorizontal;
  SaveIcon = Save;
  ClockIcon = Clock;

  constructor() {
    this.memberForm = this.fb.group({
      fullName: ['', [Validators.required]],
      role: ['', [Validators.required]],
      qualification: [''],
      yearsOfExperience: [''],
      appointmentDate: [''],
      independent: [false],
      committee: [''],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadExistingData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // ===============================
  // DATA LOADING & SAVING
  // ===============================

  private loadExistingData() {
    const existingData = this.fundingApplicationService.data().managementStructure;
    if (existingData) {
      this.populateFromManagementStructure(existingData);
      // Set yes/no states based on existing data with proper null checks
      this.hasBoard.set(Boolean(existingData.boardOfDirectors?.length));
      this.hasManagementCommittee.set(Boolean(existingData.advisors?.length));
    } else {
      // Load mock data for demonstration
      this.managementTeam.set([
        
      ]);
      // Default to true for new applications
      this.hasBoard.set(true);
      this.hasManagementCommittee.set(true);
    }
  }

  private populateFromManagementStructure(data: ManagementStructure) {
    // Convert executive team to management team format
    if (data.executiveTeam) {
      const managementData: LocalManagementMember[] = data.executiveTeam.map(exec => ({
        id: exec.id,
        fullName: exec.fullName,
        role: exec.position,
        qualification: exec.qualifications,
        yearsOfExperience: exec.experience
      }));
      this.managementTeam.set(managementData);
    }

    // Convert management team
    if (data.managementTeam) {
      const managementData: LocalManagementMember[] = data.managementTeam.map(mgmt => ({
        id: mgmt.id,
        fullName: mgmt.fullName,
        role: mgmt.role,
        qualification: mgmt.qualification,
        yearsOfExperience: mgmt.yearsOfExperience
      }));
      // Merge with executive team or replace
      this.managementTeam.update(current => [...current, ...managementData]);
    }

    // Convert board of directors
    if (data.boardOfDirectors) {
      const boardData: LocalBoardMember[] = data.boardOfDirectors.map(board => ({
        id: board.id,
        fullName: board.fullName,
        role: board.role,
        appointmentDate: board.appointmentDate,
        independent: board.independent
      }));
      this.boardOfDirectors.set(boardData);
    }

    // Convert advisors to committee members
    if (data.advisors) {
      const committeeData: LocalCommitteeMember[] = data.advisors.map(advisor => ({
        id: advisor.id,
        fullName: advisor.fullName,
        committee: advisor.expertise,
        role: 'Advisor',
        description: advisor.contribution
      }));
      this.managementCommittee.set(committeeData);
    }
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds when data changes
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true)
    ).subscribe(() => {
      if (this.hasData() && !this.isSaving()) {
        this.saveData(false);
      }
    });
  }

  private debouncedSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      if (this.hasData() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000); // 2 second debounce
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      const managementStructureData = this.buildManagementStructureData();
      this.fundingApplicationService.updateManagementStructure(managementStructureData);
      
      if (isManual) {
        // Force save to backend for manual saves
        await this.fundingApplicationService.saveCurrentProgress();
      }
      
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save management structure:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildManagementStructureData(): ManagementStructure {
    const managementData = this.managementTeam();
    const boardData = this.hasBoard() ? this.boardOfDirectors() : [];
    const committeeData = this.hasManagementCommittee() ? this.managementCommittee() : [];

    return {
      // Convert local management team to executive team format
      executiveTeam: managementData.filter(m => 
        ['CEO', 'CFO', 'CTO', 'COO', 'Managing Director'].some(title => 
          m.role.toLowerCase().includes(title.toLowerCase())
        )
      ).map(exec => ({
        id: exec.id,
        fullName: exec.fullName,
        position: exec.role,
        qualifications: exec.qualification,
        experience: exec.yearsOfExperience,
        previousRoles: '', // Would need to add this field
        equity: undefined // Optional field
      })),

      // Convert to standard management team format
      managementTeam: managementData.map(mgmt => ({
        id: mgmt.id,
        fullName: mgmt.fullName,
        role: mgmt.role,
        department: this.getDepartmentFromRole(mgmt.role),
        qualification: mgmt.qualification,
        yearsOfExperience: mgmt.yearsOfExperience,
        reportsTo: undefined // Would need to add this field
      })),

      // Convert board of directors (only if hasBoard is true)
      boardOfDirectors: boardData.map(board => ({
        id: board.id,
        fullName: board.fullName,
        role: board.role,
        independent: board.independent,
        appointmentDate: board.appointmentDate,
        expertise: '', // Would need to add this field
        otherBoards: undefined // Optional field
      })),

      // Governance structure information
      governanceStructure: this.buildGovernanceDescription(),
      decisionMakingProcess: 'Board and executive team collaboration',
      reportingStructure: 'Hierarchical reporting to board of directors',

      // Advisory support (would be populated from committee data if needed)
      advisors: committeeData.map(committee => ({
        id: committee.id,
        fullName: committee.fullName,
        expertise: committee.committee,
        contribution: committee.description,
        compensation: undefined
      })),

      consultants: [] // Would be populated separately if needed
    };
  }

  private getDepartmentFromRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'CEO': 'Executive',
      'CFO': 'Finance',
      'CTO': 'Technology',
      'COO': 'Operations',
      'Financial Director': 'Finance',
      'Marketing Director': 'Marketing',
      'Operations Manager': 'Operations',
      'HR Manager': 'Human Resources'
    };

    for (const [key, department] of Object.entries(roleMap)) {
      if (role.toLowerCase().includes(key.toLowerCase())) {
        return department;
      }
    }
    return 'General Management';
  }

  private buildGovernanceDescription(): string {
    const boardCount = this.hasBoard() ? this.boardOfDirectors().length : 0;
    const managementCount = this.managementTeam().length;
    const committeeCount = this.hasManagementCommittee() ? this.managementCommittee().length : 0;

    let description = `Governance structure includes ${managementCount} management team members`;
    
    if (this.hasBoard()) {
      description += `, ${boardCount} board members`;
    }
    
    if (this.hasManagementCommittee()) {
      description += `, and ${committeeCount} committee members`;
    }
    
    description += '. ';
    
    if (this.hasBoard()) {
      description += 'Board provides strategic oversight while management handles day-to-day operations.';
    } else {
      description += 'Management team handles both strategic and operational decisions.';
    }

    return description;
  }

  // ===============================
  // YES/NO QUESTION METHODS
  // ===============================

  setHasBoard(value: boolean) {
    this.hasBoard.set(value);
    if (!value) {
      // Clear board data when set to No
      this.boardOfDirectors.set([]);
      // Collapse the section
      this.sectionStates.update(current => ({
        ...current,
        board: false
      }));
    }
    this.debouncedSave();
  }

  setHasManagementCommittee(value: boolean) {
    this.hasManagementCommittee.set(value);
    if (!value) {
      // Clear committee data when set to No
      this.managementCommittee.set([]);
      // Collapse the section
      this.sectionStates.update(current => ({
        ...current,
        committee: false
      }));
    }
    this.debouncedSave();
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

  getSectionExpanded(sectionId: SectionKey): boolean {
    return this.sectionStates()[sectionId];
  }

  toggleSection(sectionId: SectionKey) {
    // Don't allow toggling sections if the yes/no question is set to No
    if (sectionId === 'board' && !this.hasBoard()) return;
    if (sectionId === 'committee' && !this.hasManagementCommittee()) return;
    
    this.sectionStates.update(current => ({
      ...current,
      [sectionId]: !current[sectionId]
    }));
  }

  filteredManagementTeam() {
    if (!this.managementSearchTerm) {
      return this.managementTeam();
    }
    return this.managementTeam().filter(member =>
      member.fullName.toLowerCase().includes(this.managementSearchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(this.managementSearchTerm.toLowerCase())
    );
  }

  hasData(): boolean {
    return this.managementTeam().length > 0 || 
           (this.hasBoard() && this.boardOfDirectors().length > 0) || 
           (this.hasManagementCommittee() && this.managementCommittee().length > 0);
  }

  getTotalMembersCount(): number {
    let count = this.managementTeam().length;
    if (this.hasBoard()) count += this.boardOfDirectors().length;
    if (this.hasManagementCommittee()) count += this.managementCommittee().length;
    return count;
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return saved.toLocaleDateString();
  }

  // ===============================
  // MANAGEMENT TEAM METHODS
  // ===============================

  addManagementMember() {
    this.editingMemberType.set('management');
    this.editingMemberId.set(null);
    this.memberForm.reset();
    this.showMemberModal.set(true);
  }

  editManagementMember(id: string) {
    const member = this.managementTeam().find(m => m.id === id);
    if (member) {
      this.editingMemberType.set('management');
      this.editingMemberId.set(id);
      this.memberForm.patchValue(member);
      this.showMemberModal.set(true);
    }
  }

  deleteManagementMember(id: string) {
    if (confirm('Are you sure you want to delete this management team member?')) {
      this.managementTeam.update(current => current.filter(m => m.id !== id));
      this.saveData();
    }
  }

  // ===============================
  // BOARD METHODS
  // ===============================

  addBoardMember() {
    if (!this.hasBoard()) return;
    this.editingMemberType.set('board');
    this.editingMemberId.set(null);
    this.memberForm.reset();
    this.showMemberModal.set(true);
  }

  editBoardMember(id: string) {
    if (!this.hasBoard()) return;
    const member = this.boardOfDirectors().find(m => m.id === id);
    if (member) {
      this.editingMemberType.set('board');
      this.editingMemberId.set(id);
      this.memberForm.patchValue(member);
      this.showMemberModal.set(true);
    }
  }

  deleteBoardMember(id: string) {
    if (!this.hasBoard()) return;
    if (confirm('Are you sure you want to delete this board member?')) {
      this.boardOfDirectors.update(current => current.filter(m => m.id !== id));
      this.saveData();
    }
  }

  // ===============================
  // COMMITTEE METHODS
  // ===============================

  addCommitteeMember() {
    if (!this.hasManagementCommittee()) return;
    this.editingMemberType.set('committee');
    this.editingMemberId.set(null);
    this.memberForm.reset();
    this.showMemberModal.set(true);
  }

  editCommitteeMember(id: string) {
    if (!this.hasManagementCommittee()) return;
    const member = this.managementCommittee().find(m => m.id === id);
    if (member) {
      this.editingMemberType.set('committee');
      this.editingMemberId.set(id);
      this.memberForm.patchValue(member);
      this.showMemberModal.set(true);
    }
  }

  deleteCommitteeMember(id: string) {
    if (!this.hasManagementCommittee()) return;
    if (confirm('Are you sure you want to delete this committee member?')) {
      this.managementCommittee.update(current => current.filter(m => m.id !== id));
      this.saveData();
    }
  }

  // ===============================
  // MODAL METHODS
  // ===============================

  closeMemberModal() {
    this.showMemberModal.set(false);
    this.editingMemberId.set(null);
    this.memberForm.reset();
  }

  saveMember() {
    if (this.memberForm.valid) {
      const formValue = this.memberForm.value;
      const memberData = {
        id: this.editingMemberId() || Date.now().toString(),
        ...formValue
      };

      const type = this.editingMemberType();
      const isEditing = !!this.editingMemberId();

      // Check permissions before saving
      if (type === 'board' && !this.hasBoard()) return;
      if (type === 'committee' && !this.hasManagementCommittee()) return;

      if (type === 'management') {
        if (isEditing) {
          this.managementTeam.update(current =>
            current.map(m => m.id === memberData.id ? memberData : m)
          );
        } else {
          this.managementTeam.update(current => [...current, memberData]);
        }
      } else if (type === 'board') {
        if (isEditing) {
          this.boardOfDirectors.update(current =>
            current.map(m => m.id === memberData.id ? memberData : m)
          );
        } else {
          this.boardOfDirectors.update(current => [...current, memberData]);
        }
      } else if (type === 'committee') {
        if (isEditing) {
          this.managementCommittee.update(current =>
            current.map(m => m.id === memberData.id ? memberData : m)
          );
        } else {
          this.managementCommittee.update(current => [...current, memberData]);
        }
      }

      this.closeMemberModal();
      this.saveData();
    }
  }

getManpowerData() {
const current: Partial<BusinessAssessment> = this.fundingApplicationService.data().businessAssessment || {};

  return {
    hasSpecialistSkills: current.hasSpecialistSkills ?? false,
    specialistSkillsDetails: current.specialistSkillsDetails ?? '',
    isRequiredLabourAvailable: current.isRequiredLabourAvailable ?? true,
    labourAvailabilityDetails: current.labourAvailabilityDetails ?? '',
    hasOrganogram: current.hasOrganogram ?? true,
    organogramDescription: current.organogramDescription ?? '',
    isStaffUnionised: current.isStaffUnionised ?? false,
    unionDetails: current.unionDetails ?? '',
    hasSuccessionPlan: current.hasSuccessionPlan ?? true,
    successionPlanDetails: current.successionPlanDetails ?? '',
    hasSkillShortfall: current.hasSkillShortfall ?? false,
    skillShortfallDetails: current.skillShortfallDetails ?? '',
    hasLabourDisputes: current.hasLabourDisputes ?? false,
    labourDisputeDetails: current.labourDisputeDetails ?? ''
  };
}

onManpowerDataChanged(manpowerData: any) {
  const currentAssessment = this.fundingApplicationService.data().businessAssessment || {};
  const updatedAssessment = {
    ...currentAssessment,
    ...manpowerData
  };
  this.fundingApplicationService.updateBusinessAssessment(updatedAssessment);
}
}