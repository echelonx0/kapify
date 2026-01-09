import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-angular';

export interface ApplicationSummary {
  totalApplications: number;
  approved: number;
  pending: number;
  avgMatchScore: number;
}

@Component({
  selector: 'app-applications-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Neo-Brutalist Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Applications -->
      <div
        class="bg-white rounded-xl border-2 border-slate-300 p-6 hover:shadow-lg transition-shadow duration-200"
      >
        <div class="mb-6">
          <div
            class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-slate-300 mb-3"
          >
            <lucide-angular
              [img]="FileTextIcon"
              size="24"
              class="text-slate-600"
            ></lucide-angular>
          </div>
          <p
            class="text-xs font-black text-slate-600 uppercase tracking-widest mb-2"
          >
            Total
          </p>
        </div>
        <p class="text-3xl font-black text-slate-900 tracking-tight">
          {{ summary.totalApplications }}
        </p>
        <p class="text-xs text-slate-500 font-semibold mt-2">Applications</p>
      </div>

      <!-- Approved -->
      <div
        class="bg-white rounded-xl border-2 border-green-400 p-6 hover:shadow-lg transition-shadow duration-200"
      >
        <div class="mb-6">
          <div
            class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center border-2 border-green-400 mb-3"
          >
            <lucide-angular
              [img]="ApprovedIcon"
              size="24"
              class="text-green-600"
            ></lucide-angular>
          </div>
          <p
            class="text-xs font-black text-green-700 uppercase tracking-widest mb-2"
          >
            Approved
          </p>
        </div>
        <p class="text-3xl font-black text-green-600 tracking-tight">
          {{ summary.approved }}
        </p>
        <p class="text-xs text-green-600 font-semibold mt-2">Success Rate</p>
      </div>

      <!-- Pending -->
      <div
        class="bg-white rounded-xl border-2 border-amber-400 p-6 hover:shadow-lg transition-shadow duration-200"
      >
        <div class="mb-6">
          <div
            class="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center border-2 border-amber-400 mb-3"
          >
            <lucide-angular
              [img]="PendingIcon"
              size="24"
              class="text-amber-600"
            ></lucide-angular>
          </div>
          <p
            class="text-xs font-black text-amber-700 uppercase tracking-widest mb-2"
          >
            In Progress
          </p>
        </div>
        <p class="text-3xl font-black text-amber-600 tracking-tight">
          {{ summary.pending }}
        </p>
        <p class="text-xs text-amber-600 font-semibold mt-2">Awaiting Review</p>
      </div>

      <!-- Avg Match Score -->
      <div
        class="bg-white rounded-xl border-2 border-teal-500 p-6 hover:shadow-lg transition-shadow duration-200"
      >
        <div class="mb-6">
          <div
            class="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center border-2 border-teal-500 mb-3"
          >
            <lucide-angular
              [img]="TrendingUpIcon"
              size="24"
              class="text-teal-600"
            ></lucide-angular>
          </div>
          <p
            class="text-xs font-black text-teal-700 uppercase tracking-widest mb-2"
          >
            Quality
          </p>
        </div>
        <p class="text-3xl font-black text-teal-600 tracking-tight">
          {{ summary.avgMatchScore }}<span class="text-lg">%</span>
        </p>
        <p class="text-xs text-teal-600 font-semibold mt-2">Avg Match Score</p>
      </div>
    </div>
  `,
})
export class ApplicationsStatsComponent {
  @Input() summary!: ApplicationSummary;

  readonly FileTextIcon = FileText;
  readonly ApprovedIcon = CheckCircle2;
  readonly PendingIcon = Clock;
  readonly TrendingUpIcon = TrendingUp;
}
