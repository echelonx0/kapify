import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TeamMember {
  id: string;
  fullName: string;
  role: string;
  department?: string;
  qualification?: string;
  yearsOfExperience?: string | number;
  fieldOfStudy?: string;
}

@Component({
  selector: 'app-team-member',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (member) {
    <div
      class="grid grid-cols-5 gap-4 px-6 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200"
    >
      <!-- Name & Surname -->
      <div class="flex items-center min-w-0">
        <p class="text-sm font-medium text-slate-900 truncate">
          {{ member.fullName }}
        </p>
      </div>

      <!-- Department -->
      <div class="flex items-center min-w-0">
        <p class="text-sm text-slate-700 truncate">
          {{ member.department || '—' }}
        </p>
      </div>

      <!-- Qualification -->
      <div class="flex items-center min-w-0">
        @if (member.qualification) {
        <span
          class="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full"
        >
          {{ member.qualification }}
        </span>
        } @else {
        <p class="text-sm text-slate-500">—</p>
        }
      </div>

      <!-- Field of Study -->
      <div class="flex items-center min-w-0">
        <p class="text-sm text-slate-700 truncate">
          {{ member.fieldOfStudy || '—' }}
        </p>
      </div>

      <!-- Experience -->
      <div class="flex items-center min-w-0">
        <p class="text-sm text-slate-700 truncate">
          {{ formatExperience(member.yearsOfExperience) }}
        </p>
      </div>
    </div>
    }
  `,
})
export class TeamMemberComponent {
  @Input() member: TeamMember | null = null;

  formatExperience(experience?: string | number): string {
    if (!experience && experience !== 0) return '—';
    return `${experience} year${Number(experience) !== 1 ? 's' : ''}`;
  }
}
