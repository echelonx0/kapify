import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import {
  KapifyReportsService,
  KapifyApplicationReport,
} from '../../services/kapify-reports.service';

@Component({
  selector: 'app-kapify-report-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `<div class="space-y-6">
    @if (report(); as r) {
    <!-- Report Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-teal-50 border border-teal-200/50 rounded-xl p-4">
        <p class="text-xs font-semibold text-teal-700 uppercase tracking-wider">
          Total Records
        </p>
        <p class="text-2xl font-bold text-teal-900 mt-2">
          {{ r.report_data.length }}
        </p>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p
          class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
        >
          Export Format
        </p>
        <p class="text-2xl font-bold text-slate-900 mt-2 uppercase">
          {{ r.export_config.format }}
        </p>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p
          class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
        >
          Fields Selected
        </p>
        <p class="text-2xl font-bold text-slate-900 mt-2">
          {{ r.export_config.selectedFields.length }}
        </p>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p
          class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
        >
          Total Amount Requested
        </p>
        <p class="text-2xl font-bold text-slate-900 mt-2">
          {{
            getTotalAmountRequested(r) | currency : 'ZAR' : 'symbol' : '1.0-0'
          }}
        </p>
      </div>
    </div>

    <!-- Data Table -->
    <div class="border border-slate-200 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- Table Header -->
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider"
              >
                Business Name
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider"
              >
                Industry
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider"
              >
                Contact
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider"
              >
                Amount Requested
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-slate-200">
            @for (record of paginatedData(); track record.id) {
            <tr class="hover:bg-slate-50 transition-colors duration-200">
              <!-- Business Name -->
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-slate-900">
                    {{ record.nameOfBusiness }}
                  </p>
                  <p class="text-xs text-slate-500">{{ record.province }}</p>
                </div>
              </td>

              <!-- Industry -->
              <td class="px-6 py-4">
                <p class="text-sm text-slate-600">{{ record.industry }}</p>
              </td>

              <!-- Contact -->
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-slate-900">
                    {{ record.firstName }} {{ record.surname }}
                  </p>
                  <p class="text-xs text-slate-500">{{ record.email }}</p>
                </div>
              </td>

              <!-- Amount Requested -->
              <td class="px-6 py-4">
                <p class="text-sm font-semibold text-teal-600">
                  {{
                    record.amountRequested
                      | currency : 'ZAR' : 'symbol' : '1.0-0'
                  }}
                </p>
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <span [class]="getStatusBadgeClass(record.applicationStatus)">
                  {{ record.applicationStatus }}
                </span>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    @if (totalDataPages() > 1) {
    <div
      class="flex items-center justify-between pt-4 border-t border-slate-200"
    >
      <p class="text-sm font-semibold text-slate-600">
        Showing {{ dataCurrentPage() * dataPageSize() + 1 }}-{{
          Math.min(
            (dataCurrentPage() + 1) * dataPageSize(),
            r.report_data.length
          )
        }}
        of {{ r.report_data.length }}
      </p>

      <div class="flex items-center gap-2">
        <button
          (click)="dataPreviousPage()"
          [disabled]="dataCurrentPage() === 0"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <lucide-angular [img]="ChevronUpIcon" size="16"></lucide-angular>
          Previous
        </button>

        <div class="flex items-center gap-1">
          <span class="text-sm text-slate-600 font-medium">
            {{ dataCurrentPage() + 1 }} / {{ totalDataPages() }}
          </span>
        </div>

        <button
          (click)="dataNextPage()"
          [disabled]="dataCurrentPage() >= totalDataPages() - 1"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <lucide-angular [img]="ChevronDownIcon" size="16"></lucide-angular>
        </button>
      </div>
    </div>
    } } @else {
    <!-- No Report Selected -->
    <div class="text-center py-12 text-slate-500">
      <p>No report selected</p>
    </div>
    }
  </div>`,
})
export class KapifyReportViewComponent {
  @Input() report = signal<KapifyApplicationReport | null>(null);
  @Output() onClose = new EventEmitter<void>();

  // Expose Math to template
  Math = Math;

  // Icons
  ChevronUpIcon = ChevronUp;
  ChevronDownIcon = ChevronDown;

  // Pagination state
  dataCurrentPage = signal(0);
  dataPageSize = signal(10);

  // Computed - Proper values, not functions
  totalDataPages = computed(() => {
    const r = this.report();
    return Math.ceil((r?.report_data?.length || 0) / this.dataPageSize());
  });

  paginatedData = computed(() => {
    const r = this.report();
    if (!r) return [];
    const start = this.dataCurrentPage() * this.dataPageSize();
    return r.report_data.slice(start, start + this.dataPageSize());
  });

  /**
   * Get total amount requested from all records
   */
  getTotalAmountRequested(report: KapifyApplicationReport): number {
    if (!report) return 0;

    return report.report_data.reduce(
      (sum, record) => sum + (record.amountRequested || 0),
      0
    );
  }

  /**
   * Get status badge styling
   */
  getStatusBadgeClass(status: string): string {
    const baseClass =
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border';

    switch (status) {
      case 'Approved':
        return `${baseClass} bg-green-50 text-green-700 border-green-200/50`;
      case 'Rejected':
        return `${baseClass} bg-red-50 text-red-700 border-red-200/50`;
      case 'Under Review':
        return `${baseClass} bg-amber-50 text-amber-700 border-amber-200/50`;
      default:
        return `${baseClass} bg-slate-100 text-slate-700 border-slate-200`;
    }
  }

  /**
   * Pagination
   */
  dataNextPage(): void {
    const maxPage = this.totalDataPages() - 1;

    if (this.dataCurrentPage() < maxPage) {
      this.dataCurrentPage.set(this.dataCurrentPage() + 1);
    }
  }

  dataPreviousPage(): void {
    if (this.dataCurrentPage() > 0) {
      this.dataCurrentPage.set(this.dataCurrentPage() - 1);
    }
  }
}
