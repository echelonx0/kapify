// // src/app/funder/components/application-detail/components/business-info/team-member/team-member.component.ts
// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, Users } from 'lucide-angular';

// export interface TeamMember {
//   id: string;
//   fullName: string;
//   role: string;
//   department?: string;
//   qualification?: string;
//   yearsOfExperience?: string | number;
// }

// @Component({
//   selector: 'app-team-member',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     @if (member) {
//     <div
//       class="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
//     >
//       <!-- Avatar + Name + Role -->
//       <div class="flex items-start gap-3 mb-3">
//         <div
//           class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
//           [ngClass]="getAvatarColor()"
//         >
//           {{ getInitials() }}
//         </div>

//         <div class="flex-1 min-w-0">
//           <p class="text-sm font-semibold text-slate-900 truncate">
//             {{ member.fullName }}
//           </p>
//           <p class="text-xs text-slate-600 truncate">{{ member.role }}</p>
//         </div>
//       </div>

//       <!-- Details Grid -->
//       <div class="space-y-2 text-xs">
//         @if (member.department) {
//         <div class="flex items-center gap-2">
//           <span class="text-slate-500 font-medium w-24">Department:</span>
//           <span class="text-slate-700">{{ member.department }}</span>
//         </div>
//         } @if (member.qualification) {
//         <div class="flex items-center gap-2">
//           <span class="text-slate-500 font-medium w-24">Qualification:</span>
//           <span
//             class="inline-block px-2 py-1 bg-teal-50 text-teal-700 rounded-full font-medium"
//           >
//             {{ member.qualification }}
//           </span>
//         </div>
//         } @if (member.yearsOfExperience) {
//         <div class="flex items-center gap-2">
//           <span class="text-slate-500 font-medium w-24">Experience:</span>
//           <span class="text-slate-700">
//             {{ member.yearsOfExperience }} years
//           </span>
//         </div>
//         }
//       </div>
//     </div>
//     }
//   `,
// })
// export class TeamMemberComponent {
//   @Input() member: TeamMember | null = null;
//   UsersIcon = Users;

//   getInitials(): string {
//     if (!this.member?.fullName) return '?';
//     const names = this.member.fullName.split(' ');
//     return names
//       .map((n) => n[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   }

//   getAvatarColor(): string {
//     const colors = [
//       'bg-teal-500',
//       'bg-blue-500',
//       'bg-amber-500',
//       'bg-green-500',
//       'bg-red-500',
//       'bg-purple-500',
//     ];
//     const index = this.member?.fullName?.charCodeAt(0) || 0;
//     return colors[index % colors.length];
//   }
// }

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TeamMember {
  id: string;
  fullName: string;
  role: string;
  department?: string;
  qualification?: string;
  yearsOfExperience?: string | number;
}

@Component({
  selector: 'app-team-member',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (member) {
    <div
      class="grid grid-cols-4 gap-4 px-6 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200"
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
          class="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full truncate"
        >
          {{ member.qualification }}
        </span>
        } @else {
        <p class="text-sm text-slate-500">—</p>
        }
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
