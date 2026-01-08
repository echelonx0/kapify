// import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   Download,
//   RefreshCcw,
//   Loader2,
//   X,
//   File,
//   Table,
// } from 'lucide-angular';
// import { KapifyReportsExportService } from 'src/app/features/reports/services/kapify-reports-export.service';
// import { FormsModule } from '@angular/forms';
// export type ExportFormat = 'excel' | 'pdf' | 'csv';

// @Component({
//   selector: 'app-applications-review-header',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule, FormsModule],
//   template: `
//     <!-- Header Section -->
//     <div class="flex items-center justify-between">
//       <div>
//         <h1 class="text-3xl font-bold text-slate-900">Applications</h1>
//         <p class="text-slate-600 mt-2">Manage and review applications</p>
//       </div>

//       <div class="flex items-center gap-3">
//         <!-- Export Button -->
//         <button
//           (click)="openExportModal()"
//           [disabled]="exporting()"
//           class="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 active:bg-slate-950 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           <lucide-angular
//             *ngIf="!exporting()"
//             [img]="DownloadIcon"
//             size="16"
//           ></lucide-angular>
//           <lucide-angular
//             *ngIf="exporting()"
//             [img]="LoaderIcon"
//             size="16"
//             class="animate-spin"
//           ></lucide-angular>
//           {{ exporting() ? 'Exporting...' : 'Export Applications' }}
//         </button>

//         <!-- Refresh Button -->
//         <button
//           (click)="onRefresh()"
//           [disabled]="refreshing()"
//           class="px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//         >
//           <lucide-angular
//             [img]="RefreshIcon"
//             size="16"
//             [class.animate-spin]="refreshing()"
//           ></lucide-angular>
//           {{ refreshing() ? 'Refreshing...' : 'Refresh' }}
//         </button>
//       </div>
//     </div>

//     <!-- Export Modal -->
//     @if (modalOpen()) {
//     <div
//       (click)="closeExportModal()"
//       class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300"
//     ></div>

//     <div
//       class="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300"
//     >
//       <div
//         (click)="$event.stopPropagation()"
//         class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full mx-4 overflow-hidden"
//       >
//         <!-- Modal Header -->
//         <div
//           class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50"
//         >
//           <h2 class="text-lg font-bold text-slate-900">Export Applications</h2>
//           <button
//             (click)="closeExportModal()"
//             class="text-slate-600 hover:text-slate-900 transition-colors"
//           >
//             <lucide-angular [img]="CloseIcon" size="20"></lucide-angular>
//           </button>
//         </div>

//         <!-- Modal Content -->
//         <div class="p-6 space-y-6">
//           <!-- Format Selection -->
//           <div class="space-y-3">
//             <label class="block text-sm font-semibold text-slate-900">
//               Export Format
//             </label>
//             <div class="space-y-2">
//               <label
//                 class="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
//                 [class.border-teal-300]="selectedFormat() === 'excel'"
//                 [class.bg-teal-50]="selectedFormat() === 'excel'"
//               >
//                 <input
//                   type="radio"
//                   [(ngModel)]="selectedFormat"
//                   value="excel"
//                   class="w-4 h-4 text-teal-500 cursor-pointer"
//                 />
//                 <div class="ml-3 flex-1">
//                   <p class="text-sm font-medium text-slate-900">Excel</p>
//                   <p class="text-xs text-slate-600">
//                     Spreadsheet format for data analysis
//                   </p>
//                 </div>
//                 <lucide-angular
//                   [img]="TableIcon"
//                   size="20"
//                   class="text-slate-400"
//                 ></lucide-angular>
//               </label>

//               <label
//                 class="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
//                 [class.border-teal-300]="selectedFormat() === 'pdf'"
//                 [class.bg-teal-50]="selectedFormat() === 'pdf'"
//               >
//                 <input
//                   type="radio"
//                   [(ngModel)]="selectedFormat"
//                   value="pdf"
//                   class="w-4 h-4 text-teal-500 cursor-pointer"
//                 />
//                 <div class="ml-3 flex-1">
//                   <p class="text-sm font-medium text-slate-900">PDF</p>
//                   <p class="text-xs text-slate-600">
//                     Professional report format
//                   </p>
//                 </div>
//                 <lucide-angular
//                   [img]="FileIcon"
//                   size="20"
//                   class="text-slate-400"
//                 ></lucide-angular>
//               </label>

//               <label
//                 class="flex items-center p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
//                 [class.border-teal-300]="selectedFormat() === 'csv'"
//                 [class.bg-teal-50]="selectedFormat() === 'csv'"
//               >
//                 <input
//                   type="radio"
//                   [(ngModel)]="selectedFormat"
//                   value="csv"
//                   class="w-4 h-4 text-teal-500 cursor-pointer"
//                 />
//                 <div class="ml-3 flex-1">
//                   <p class="text-sm font-medium text-slate-900">CSV</p>
//                   <p class="text-xs text-slate-600">
//                     Comma-separated values format
//                   </p>
//                 </div>
//                 <lucide-angular
//                   [img]="TableIcon"
//                   size="20"
//                   class="text-slate-400"
//                 ></lucide-angular>
//               </label>
//             </div>
//           </div>

//           <!-- Include Filters Toggle -->
//           <div class="space-y-3">
//             <label class="flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 [(ngModel)]="includeFiltersInExport"
//                 class="w-4 h-4 rounded border-slate-300 text-teal-500 focus:ring-2 focus:ring-teal-500 cursor-pointer"
//               />
//               <span class="ml-2 text-sm font-medium text-slate-700">
//                 Export only filtered results
//               </span>
//             </label>
//             <p class="text-xs text-slate-600 ml-6">
//               When enabled, only applications matching current filters will be
//               exported
//             </p>
//           </div>

//           <!-- Info Box -->
//           <div class="bg-teal-50 border border-teal-200/50 rounded-xl p-4">
//             <p class="text-sm text-teal-700">
//               Your export will include all application details, status, match
//               scores, and completion information.
//             </p>
//           </div>

//           <!-- Actions -->
//           <div class="flex items-center gap-3 pt-4 border-t border-slate-200">
//             <button
//               (click)="executeExport()"
//               [disabled]="exporting()"
//               class="flex-1 bg-teal-500 text-white font-medium py-2.5 rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               <lucide-angular
//                 *ngIf="!exporting()"
//                 [img]="DownloadIcon"
//                 size="16"
//               ></lucide-angular>
//               <lucide-angular
//                 *ngIf="exporting()"
//                 [img]="LoaderIcon"
//                 size="16"
//                 class="animate-spin"
//               ></lucide-angular>
//               {{ exporting() ? 'Exporting...' : 'Export' }}
//             </button>

//             <button (click)="openReportBuilder.emit()">Download Reports</button>
//             <button
//               (click)="closeExportModal()"
//               [disabled]="exporting()"
//               class="flex-1 bg-slate-100 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//     }
//   `,
// })
// export class ApplicationsReviewHeaderComponent {
//   @Output() refresh = new EventEmitter<void>();
//   @Output() export = new EventEmitter<{
//     format: ExportFormat;
//     includeFilters: boolean;
//   }>();

//   private exportService = inject(KapifyReportsExportService);
//   @Output() openReportBuilder = new EventEmitter<void>();
//   modalOpen = signal(false);
//   exporting = signal(false);
//   refreshing = signal(false);
//   selectedFormat = signal<ExportFormat>('excel');
//   includeFiltersInExport = signal(true);

//   readonly DownloadIcon = Download;
//   readonly RefreshIcon = RefreshCcw;
//   readonly LoaderIcon = Loader2;
//   readonly CloseIcon = X;
//   readonly FileIcon = File;
//   readonly TableIcon = Table;

//   openExportModal(): void {
//     this.modalOpen.set(true);
//   }

//   closeExportModal(): void {
//     this.modalOpen.set(false);
//   }

//   async executeExport(): Promise<void> {
//     this.exporting.set(true);

//     try {
//       this.export.emit({
//         format: this.selectedFormat(),
//         includeFilters: this.includeFiltersInExport(),
//       });

//       // Brief delay to show export happening
//       await new Promise((resolve) => setTimeout(resolve, 500));
//     } catch (error) {
//       console.error('Export failed:', error);
//     } finally {
//       this.exporting.set(false);
//       this.closeExportModal();
//     }
//   }

//   onRefresh(): void {
//     this.refreshing.set(true);
//     this.refresh.emit();

//     // Reset after a brief moment
//     setTimeout(() => {
//       this.refreshing.set(false);
//     }, 1000);
//   }
// }

import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Download,
  RefreshCcw,
  Loader2,
  X,
  File,
  Table,
  Zap,
} from 'lucide-angular';
import { KapifyReportsExportService } from 'src/app/features/reports/services/kapify-reports-export.service';
import { FormsModule } from '@angular/forms';
export type ExportFormat = 'excel' | 'pdf' | 'csv';

@Component({
  selector: 'app-applications-review-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './applications-review-header.component.html',
  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scale-in {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }

      .animate-scale-in {
        animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      input[type='radio'],
      input[type='checkbox'] {
        accent-color: rgb(20 184 166);
      }
    `,
  ],
})
export class ApplicationsReviewHeaderComponent {
  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<{
    format: ExportFormat;
    includeFilters: boolean;
  }>();

  private exportService = inject(KapifyReportsExportService);
  @Output() openReportBuilder = new EventEmitter<void>();
  modalOpen = signal(false);
  exporting = signal(false);
  refreshing = signal(false);
  selectedFormat = signal<ExportFormat>('excel');
  includeFiltersInExport = signal(true);

  readonly DownloadIcon = Download;
  readonly RefreshIcon = RefreshCcw;
  readonly LoaderIcon = Loader2;
  readonly CloseIcon = X;
  readonly FileIcon = File;
  readonly TableIcon = Table;
  readonly ZapIcon = Zap;

  openExportModal(): void {
    this.modalOpen.set(true);
  }

  closeExportModal(): void {
    this.modalOpen.set(false);
  }

  async executeExport(): Promise<void> {
    this.exporting.set(true);

    try {
      this.export.emit({
        format: this.selectedFormat(),
        includeFilters: this.includeFiltersInExport(),
      });

      // Brief delay to show export happening
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      this.exporting.set(false);
      this.closeExportModal();
    }
  }

  onRefresh(): void {
    this.refreshing.set(true);
    this.refresh.emit();

    // Reset after a brief moment
    setTimeout(() => {
      this.refreshing.set(false);
    }, 1000);
  }
}
