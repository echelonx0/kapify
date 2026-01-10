import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComplianceLayoutComponent,
  CompliancePage,
} from './compliance-layout.component';
import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';

@Component({
  selector: 'app-aml-kyc',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <div *ngIf="pageData$ | async as pageData">
      <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
    </div>
  `,
})
export class AMLKYCComponent implements OnInit {
  private complianceService = inject(CompliancePageService);

  pageData$ = this.complianceService.getPage('aml-kyc');

  ngOnInit() {
    // Service automatically loads page on getPage() call
  }
}
