// src/app/SMEs/data-room/components/sections/management-team/management-team.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users } from 'lucide-angular';
import { UiCardComponent } from 'src/app/shared/components';

interface TeamMember {
  name?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  role?: string;
  experience?: string;
  education?: string;
  qualifications?: string;
}

@Component({
  selector: 'app-management-team',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiCardComponent
  ],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Management Team</h2>
      
      @if (managementTeam().length) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (member of managementTeam(); track $index) {
            <ui-card class="p-6">
              <div class="flex items-start gap-4">
                <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {{ getInitials(member) }}
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900">{{ getFullName(member) }}</h3>
                  <p class="text-primary-600 font-medium mb-2">{{ member.position || member.role }}</p>
                  <p class="text-gray-600 text-sm mb-2">{{ member.experience || 'Experience details not provided' }}</p>
                  <p class="text-gray-500 text-sm">{{ member.education || member.qualifications || 'Education details not provided' }}</p>
                </div>
              </div>
            </ui-card>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <lucide-icon [img]="UsersIcon" [size]="48" class="text-gray-400 mx-auto mb-4" />
          <p class="text-gray-600">Management team information not available</p>
          <p class="text-sm text-gray-400">Complete your management section to see team details</p>
        </div>
      }
    </div>
  `
})
export class ManagementTeamComponent {
  @Input() managementTeam = () => [] as TeamMember[];

  UsersIcon = Users;

  getFullName(member: TeamMember): string {
    return member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim();
  }

  getInitials(member: TeamMember): string {
    const fullName = this.getFullName(member);
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}