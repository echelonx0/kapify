import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Building,
  Hash,
  Briefcase,
  Calendar,
  Users,
  MapPin,
  FileText,
  ChevronDown,
  User,
  Mail,
  Phone,
} from 'lucide-angular';

import { ProfileData } from 'src/app/SMEs/profile/models/funding.models';
import { TeamMemberComponent } from '../team-member/team-member.component';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';

interface TeamMember {
  id: string;
  fullName: string;
  role: string;
  department?: string;
  qualification?: string;
  yearsOfExperience?: string | number;
  fieldOfStudy?: string;
}

interface Shareholder extends TeamMember {
  ownershipPercentage?: string;
}

interface RosterSection {
  id: 'shareholders' | 'management' | 'board' | 'committee';
  title: string;
  color: 'teal' | 'blue' | 'amber';
  members: TeamMember[] | Shareholder[];
  isExpanded: boolean;
}

interface PrimaryContact {
  fullName?: string;
  position?: string;
  email?: string;
  phone?: string;
  address?: string;
}

@Component({
  selector: 'app-business-info',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TeamMemberComponent],
  templateUrl: './business-info.component.html',
  styleUrls: ['./business-info.component.css'],
})
export class BusinessInfoComponent {
  @Input({ required: true }) profileData!: Partial<ProfileData>;
  @Input({ required: true })
  rawProfileData!: Partial<FundingApplicationProfile>;

  // Icons
  BuildingIcon = Building;
  HashIcon = Hash;
  BriefcaseIcon = Briefcase;
  CalendarIcon = Calendar;
  UsersIcon = Users;
  MapPinIcon = MapPin;
  FileTextIcon = FileText;
  ChevronDownIcon = ChevronDown;
  UserIcon = User;
  MailIcon = Mail;
  PhoneIcon = Phone;

  // Signals for roster expansion state
  shareholdersExpanded = signal(true);
  managementExpanded = signal(true);
  boardExpanded = signal(true);
  committeeExpanded = signal(true);

  rosters: RosterSection[] = [
    {
      id: 'shareholders',
      title: 'Shareholders',
      color: 'amber',
      members: [],
      isExpanded: true,
    },
    {
      id: 'management',
      title: 'Management Team',
      color: 'teal',
      members: [],
      isExpanded: true,
    },
    {
      id: 'committee',
      title: 'Management Committee',
      color: 'amber',
      members: [],
      isExpanded: true,
    },
    {
      id: 'board',
      title: 'Board of Directors',
      color: 'blue',
      members: [],
      isExpanded: true,
    },
  ];

  ngOnInit() {
    this.initializeRosters();
  }

  private initializeRosters() {
    // Initialize shareholders
    const ownership = this.rawProfileData.companyInfo?.ownership || [];
    this.rosters[0].members = this.normalizeShareholders(ownership);

    // Initialize other rosters
    if (!this.profileData.managementGovernance) return;

    const { managementTeam, boardOfDirectors, managementCommittee } =
      this.profileData.managementGovernance;

    this.rosters[1].members = this.normalizeMembers(managementTeam || []);
    this.rosters[2].members = this.normalizeMembers(boardOfDirectors || []);
    this.rosters[3].members = this.normalizeMembers(managementCommittee || []);
  }

  private normalizeShareholders(shareholders: any[]): Shareholder[] {
    return shareholders
      .filter((s) => s && s.ownerName)
      .map((s) => ({
        id: `shareholder-${Date.now()}-${Math.random()}`,
        fullName: s.ownerName || '',
        role: s.role || '',
        ownershipPercentage: s.ownershipPercentage
          ? `${s.ownershipPercentage}%`
          : undefined,
      }));
  }

  private normalizeMembers(members: any[]): TeamMember[] {
    return members
      .filter((m) => m && m.fullName)
      .map((m) => ({
        id: m.id || `${Date.now()}-${Math.random()}`,
        fullName: m.fullName || '',
        role: m.role || '',
        department: m.department || undefined,
        qualification: m.qualification || undefined,
        yearsOfExperience: m.yearsOfExperience || undefined,
        fieldOfStudy: m.fieldOfStudy || undefined,
      }));
  }

  toggleRoster(
    rosterId: 'shareholders' | 'management' | 'board' | 'committee'
  ) {
    if (rosterId === 'shareholders') {
      this.shareholdersExpanded.update((v) => !v);
    } else if (rosterId === 'management') {
      this.managementExpanded.update((v) => !v);
    } else if (rosterId === 'board') {
      this.boardExpanded.update((v) => !v);
    } else {
      this.committeeExpanded.update((v) => !v);
    }
  }

  isRosterExpanded(
    rosterId: 'shareholders' | 'management' | 'board' | 'committee'
  ): boolean {
    if (rosterId === 'shareholders') return this.shareholdersExpanded();
    if (rosterId === 'management') return this.managementExpanded();
    if (rosterId === 'board') return this.boardExpanded();
    return this.committeeExpanded();
  }

  getRosterMembers(rosterId: string): TeamMember[] | Shareholder[] {
    const roster = this.rosters.find((r) => r.id === rosterId);
    return roster?.members || [];
  }

  getRosterColor(color: 'teal' | 'blue' | 'amber'): {
    bg: string;
    text: string;
    border: string;
    icon: string;
  } {
    const colorMap = {
      teal: {
        bg: 'bg-teal-50',
        text: 'text-teal-900',
        border: 'border-teal-300/50',
        icon: 'text-teal-600',
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        border: 'border-blue-300/50',
        icon: 'text-blue-600',
      },
      amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-amber-300/50',
        icon: 'text-amber-600',
      },
    };
    return colorMap[color];
  }

  isShareholder(member: any): member is Shareholder {
    return 'ownershipPercentage' in member;
  }

  getBusinessInfo() {
    return this.profileData.businessInfo || null;
  }

  getBusinessDescription(): string | null {
    return this.profileData.businessInfo?.businessDescription || null;
  }

  /**
   * Get primary contact person details
   */
  getPrimaryContact(): PrimaryContact | null {
    const companyInfo = this.rawProfileData.companyInfo;
    const contactPerson = companyInfo?.contactPerson;

    if (!contactPerson) return null;

    // Get address - prefer operational, fallback to registered
    let address: string | undefined;
    const operationalAddr = companyInfo?.operationalAddress;
    const registeredAddr = companyInfo?.registeredAddress;

    if (operationalAddr) {
      const parts = [
        operationalAddr.street,
        operationalAddr.city,
        operationalAddr.province,
        operationalAddr.postalCode,
      ].filter(Boolean);
      address = parts.length > 0 ? parts.join(', ') : undefined;
    } else if (registeredAddr) {
      const parts = [
        registeredAddr.street,
        registeredAddr.city,
        registeredAddr.province,
        registeredAddr.postalCode,
      ].filter(Boolean);
      address = parts.length > 0 ? parts.join(', ') : undefined;
    }

    return {
      fullName: contactPerson.fullName,
      position: contactPerson.position,
      email: contactPerson.email,
      phone: contactPerson.phone,
      address,
    };
  }
}
