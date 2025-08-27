 
// src/app/profile/steps/governance/management-governance.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, MoreHorizontal, Save, Clock } from 'lucide-angular';
import { UiInputComponent, UiButtonComponent } from '../../../../shared/components'; 
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { ManagementStructure } from '../../../models/funding-application.models';
import { FundingProfileSetupService } from '../../../services/funding-profile-setup.service';

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
  imports: [ReactiveFormsModule, LucideAngularModule, UiInputComponent, UiButtonComponent, FormsModule],
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
    } else {
      // Load mock data for demonstration
      this.managementTeam.set([
        
      ]);
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

    // Note: managementCommittee would need to be added to the ManagementStructure interface
    // For now, initialize as empty
    this.managementCommittee.set([]);
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
    const boardData = this.boardOfDirectors();
    const committeeData = this.managementCommittee();

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

      // Convert board of directors
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
      advisors: this.managementCommittee().map(committee => ({
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
    const boardCount = this.boardOfDirectors().length;
    const managementCount = this.managementTeam().length;
    const committeeCount = this.managementCommittee().length;

    return `Governance structure includes ${boardCount} board members, ${managementCount} management team members, and ${committeeCount} committee members. Board provides strategic oversight while management handles day-to-day operations.`;
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

  getSectionExpanded(sectionId: SectionKey): boolean {
    return this.sectionStates()[sectionId];
  }

  toggleSection(sectionId: SectionKey) {
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
           this.boardOfDirectors().length > 0 || 
           this.managementCommittee().length > 0;
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
    this.editingMemberType.set('board');
    this.editingMemberId.set(null);
    this.memberForm.reset();
    this.showMemberModal.set(true);
  }

  editBoardMember(id: string) {
    const member = this.boardOfDirectors().find(m => m.id === id);
    if (member) {
      this.editingMemberType.set('board');
      this.editingMemberId.set(id);
      this.memberForm.patchValue(member);
      this.showMemberModal.set(true);
    }
  }

  deleteBoardMember(id: string) {
    if (confirm('Are you sure you want to delete this board member?')) {
      this.boardOfDirectors.update(current => current.filter(m => m.id !== id));
      this.saveData();
    }
  }

  // ===============================
  // COMMITTEE METHODS
  // ===============================

  addCommitteeMember() {
    this.editingMemberType.set('committee');
    this.editingMemberId.set(null);
    this.memberForm.reset();
    this.showMemberModal.set(true);
  }

  editCommitteeMember(id: string) {
    const member = this.managementCommittee().find(m => m.id === id);
    if (member) {
      this.editingMemberType.set('committee');
      this.editingMemberId.set(id);
      this.memberForm.patchValue(member);
      this.showMemberModal.set(true);
    }
  }

  deleteCommitteeMember(id: string) {
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
}