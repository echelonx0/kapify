
// src/app/shared/components/dashboard-header.component.ts
import { Component } from '@angular/core';
import { LucideAngularModule, Bell } from 'lucide-angular';

@Component({
  selector: 'dashboard-header',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <header class="bg-white border-b border-neutral-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">Welcome Senkosi</h1>
          <p class="text-sm text-neutral-600 mt-1">
            Complete your application process to access tools and funding that will help manage and grow your business effectively. 
            Your progress is being saved automatically to provide you a seamless experience. Get investor ready today!
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <button class="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg">
            <lucide-icon [img]="BellIcon" [size]="20" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div class="w-8 h-8 bg-neutral-300 rounded-full"></div>
        </div>
      </div>
    </header>
  `,
})
export class DashboardHeaderComponent {
  BellIcon = Bell;
}
