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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Applications -->
      <div
        class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"
          >
            <lucide-angular
              [img]="FileTextIcon"
              size="20"
              class="text-slate-600"
            ></lucide-angular>
          </div>
          <span
            class="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full"
            >Total</span
          >
        </div>
        <p class="text-sm text-slate-600 font-medium">Total Applications</p>
        <p class="text-2xl font-bold text-slate-900 mt-2">
          {{ summary.totalApplications }}
        </p>
      </div>

      <!-- Approved -->
      <div
        class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"
          >
            <lucide-angular
              [img]="ApprovedIcon"
              size="20"
              class="text-green-600"
            ></lucide-angular>
          </div>
          <span
            class="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full"
            >Success</span
          >
        </div>
        <p class="text-sm text-slate-600 font-medium">Approved</p>
        <p class="text-2xl font-bold text-green-600 mt-2">
          {{ summary.approved }}
        </p>
      </div>

      <!-- Pending -->
      <div
        class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"
          >
            <lucide-angular
              [img]="PendingIcon"
              size="20"
              class="text-amber-600"
            ></lucide-angular>
          </div>
          <span
            class="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"
            >Pending</span
          >
        </div>
        <p class="text-sm text-slate-600 font-medium">In Progress</p>
        <p class="text-2xl font-bold text-amber-600 mt-2">
          {{ summary.pending }}
        </p>
      </div>

      <!-- Avg Match Score -->
      <div
        class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"
          >
            <lucide-angular
              [img]="TrendingUpIcon"
              size="20"
              class="text-teal-600"
            ></lucide-angular>
          </div>
          <span
            class="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full"
            >Match</span
          >
        </div>
        <p class="text-sm text-slate-600 font-medium">Avg Match Score</p>
        <p class="text-2xl font-bold text-teal-600 mt-2">
          {{ summary.avgMatchScore }}%
        </p>
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
