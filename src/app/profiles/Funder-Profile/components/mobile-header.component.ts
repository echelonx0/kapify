// src/app/funder/components/mobile-header/mobile-header.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lg:hidden bg-white border-b border-slate-200 p-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-900">{{ greeting }}, {{ userName }}</h1>
          <p class="text-sm text-slate-600">{{ currentDate }}</p>
        </div>
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <span class="text-sm font-bold text-white">{{ userInitials }}</span>
        </div>
      </div>
    </div>
  `
})
export class MobileHeaderComponent {
  @Input() greeting!: string;
  @Input() userName!: string;
  @Input() currentDate!: string;
  @Input() userInitials!: string;
}