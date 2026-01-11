import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComplianceLayoutComponent,
  CompliancePage,
} from './compliance-layout.component';
import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <!-- Debug: Show what we're getting -->
    <div class="bg-yellow-100 p-4 mb-4">
      <p class="text-sm font-mono">
        Observable state:
        {{ (pageData$ | async) ? 'HAS DATA' : 'LOADING/NULL' }}
      </p>
    </div>

    <!-- Loading Placeholder -->
    @if (!(pageData$ | async)) {
    <div class="min-h-screen bg-slate-50 flex items-center justify-center">
      <div class="text-center">
        <div
          class="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin mx-auto mb-4"
        ></div>
        <p class="text-slate-600 font-medium">
          Loading compliance information...
        </p>
      </div>
    </div>
    }

    <!-- Content -->
    <div *ngIf="pageData$ | async as pageData">
      <p class="bg-green-100 p-4 mb-4">✅ Got data: {{ pageData.title }}</p>
      <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
    </div>
  `,
})
export class CookiePolicyComponent implements OnInit {
  private complianceService = inject(CompliancePageService);

  pageData$ = this.complianceService.getPage('cookies').pipe(
    tap((data) => {
      console.log('🍪 Cookie data received:', data);
      if (!data) console.warn('⚠️ Data is NULL');
    })
  );

  ngOnInit() {
    console.log('🍪 CookiePolicyComponent initialized');
  }
}
