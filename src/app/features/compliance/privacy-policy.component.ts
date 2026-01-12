 

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComplianceLayoutComponent,
  CompliancePage,
} from './compliance-layout.component';
import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <div *ngIf="pageData$ | async as pageData">
      <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
    </div>
  `,
})
export class PrivacyPolicyComponent implements OnInit {
  private complianceService = inject(CompliancePageService);

  pageData$ = this.complianceService.getPage('privacy');

  ngOnInit() {
    // Service automatically loads page on getPage() call
  }
}
