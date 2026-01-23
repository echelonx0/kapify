// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   ComplianceLayoutComponent,
//   CompliancePage,
// } from './compliance-layout.component';
// import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';

// @Component({
//   selector: 'app-privacy-policy',
//   standalone: true,
//   imports: [CommonModule, ComplianceLayoutComponent],
//   template: `
//     <div *ngIf="pageData$ | async as pageData">
//       <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
//     </div>
//   `,
// })
// export class PrivacyPolicyComponent implements OnInit {
//   private complianceService = inject(CompliancePageService);

//   pageData$ = this.complianceService.getPage('privacy');

//   ngOnInit() {
//     // Service automatically loads page on getPage() call
//   }
// }
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ComplianceLayoutComponent } from './compliance-layout.component';
import {
  CompliancePageService,
  CompliancePage,
} from 'src/app/core/admin/services/compliance.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    @if (isLoading()) {
      <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="text-center">
          <div
            class="w-12 h-12 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin mx-auto"
          ></div>
          <p class="text-sm text-slate-600 mt-4">Loading Privacy Policy...</p>
        </div>
      </div>
    } @else if (error()) {
      <div
        class="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      >
        <div
          class="bg-red-50 border border-red-200/50 rounded-xl p-6 max-w-md text-center"
        >
          <p class="text-red-700 font-medium">{{ error() }}</p>
          <button
            (click)="loadPage()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    } @else if (pageData()) {
      <app-compliance-layout [pageData]="pageData()"></app-compliance-layout>
    }
  `,
})
export class PrivacyPolicyComponent implements OnInit, OnDestroy {
  private complianceService = inject(CompliancePageService);
  private destroy$ = new Subject<void>();

  pageData = signal<any>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadPage();
  }

  loadPage(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.complianceService
      .getPage('privacy')
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: CompliancePage | null) => {
          if (!page) {
            this.error.set('Privacy policy not found');
            this.isLoading.set(false);
            return;
          }

          // Transform service data to layout component format
          const transformedPage = {
            id: page.id,
            title: page.title,
            subtitle: page.subtitle,
            breadcrumb: page.breadcrumb || ['Compliance', 'Privacy Policy'],
            mainContent: page.mainContent || '',
            ctaLabel: page.ctaLabel || undefined,
            ctaUrl: page.ctaUrl || undefined,
            sidebarTitle: page.sidebarTitle || 'Privacy Resources',
            sidebarLinks: (page.sidebarLinks || []).map((link) => ({
              label: link.label,
              href: link.href,
              highlight: link.highlight || false,
            })),
          };

          this.pageData.set(transformedPage);
          this.isLoading.set(false);
          console.log('✅ Privacy Policy loaded:', transformedPage);
        },
        error: (err) => {
          const message = err?.message || 'Failed to load privacy policy';
          console.error('❌ Error loading privacy policy:', err);
          this.error.set(message);
          this.isLoading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
