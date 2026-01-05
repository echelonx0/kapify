import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, Users, Zap } from 'lucide-angular';

@Component({
  selector: 'app-opportunities-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white border-b border-slate-200 py-6">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <!-- Title Section -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-slate-900">
            Funding Opportunities
          </h1>
          <p class="text-slate-600 text-base mt-2">
            Discover and apply to funding opportunities tailored to your
            business
          </p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Opportunities Stat -->
          <div
            class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/50"
          >
            <div
              class="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="TrendingUpIcon"
                [size]="20"
                class="text-teal-600"
              />
            </div>
            <div class="min-w-0">
              <p
                class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                Active Opportunities
              </p>
              <p class="text-2xl font-bold text-slate-900 mt-1">248</p>
            </div>
          </div>

          <!-- Total Funding Stat -->
          <div
            class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/50"
          >
            <div
              class="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon [img]="ZapIcon" [size]="20" class="text-teal-600" />
            </div>
            <div class="min-w-0">
              <p
                class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                Total Available
              </p>
              <p class="text-2xl font-bold text-slate-900 mt-1">R2.5B+</p>
            </div>
          </div>

          <!-- SMEs Connected Stat -->
          <div
            class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/50"
          >
            <div
              class="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="UsersIcon"
                [size]="20"
                class="text-teal-600"
              />
            </div>
            <div class="min-w-0">
              <p
                class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                SMEs Connected
              </p>
              <p class="text-2xl font-bold text-slate-900 mt-1">5,000+</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class OpportunitiesHeaderComponent {
  TrendingUpIcon = TrendingUp;
  ZapIcon = Zap;
  UsersIcon = Users;
}
