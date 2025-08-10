// src/app/profile/steps/management-governance.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, MoreHorizontal } from 'lucide-angular';
import { UiInputComponent, UiCardComponent, UiButtonComponent } from '../../../shared/components';
import { FundingApplicationProfileService } from '../../services/funding-profile.service';

interface ManagementMember {
  id: string;
  fullName: string;
  role: string;
  qualification: string;
  yearsOfExperience: number;
}

interface BoardMember {
  id: string;
  fullName: string;
  role: string;
  appointmentDate: string;
  independent: boolean;
}

interface CommitteeMember {
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
  imports: [ReactiveFormsModule, LucideAngularModule, UiInputComponent,  UiButtonComponent, FormsModule, ],
  templateUrl: 'management-governance.component.html'
})
export class ManagementGovernanceComponent implements OnInit {
  isSaving = signal(false);
  showMemberModal = signal(false);
  editingMemberType = signal<SectionKey>('management');
  editingMemberId = signal<string | null>(null);
  managementSearchTerm = '';

  memberForm: FormGroup;

  // Data
  managementTeam = signal<ManagementMember[]>([]);
  boardOfDirectors = signal<BoardMember[]>([]);
  managementCommittee = signal<CommitteeMember[]>([]);

  // Section states
  private sectionStates = signal<SectionStates>({
    management: true,
    board: false,
    committee: false
  });

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  PlusIcon = Plus;
  EditIcon = Edit;
  Trash2Icon = Trash2;
  SearchIcon = Search;
  MoreHorizontalIcon = MoreHorizontal;

  constructor(
    private fb: FormBuilder,
    private profileService: FundingApplicationProfileService
  ) {
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
  }

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

  // Management Team Methods
  addManagementMember() {
    this.editingMemberType.set('management');
    this.editingMemberId.set(null);
    this.memberForm.reset();
    this.showMemberModal.set(true);
  }

  // Board Methods
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

  // Committee Methods
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

  // Modal Methods
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

  private loadExistingData() {
    // Load mock data
    this.managementTeam.set([
      {
        id: '1',
        fullName: 'Jack Sparrow',
        role: 'Financial Director',
        qualification: 'Masters Degree',
        yearsOfExperience: 10
      },
      {
        id: '2',
        fullName: 'Elizabeth Swan',
        role: 'CEO',
        qualification: 'Honours Degree',
        yearsOfExperience: 8
      }
    ]);
  }

  private async saveData() {
    this.isSaving.set(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const governanceData = {
      managementTeam: this.managementTeam(),
      boardOfDirectors: this.boardOfDirectors(),
      managementCommittee: this.managementCommittee()
    };
    
    this.profileService.updateManagementGovernance(governanceData);
    this.isSaving.set(false);
  }
}
