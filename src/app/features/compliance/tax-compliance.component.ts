// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   ComplianceLayoutComponent,
//   CompliancePage,
// } from './compliance-layout.component';

// @Component({
//   selector: 'app-tax-compliance',
//   standalone: true,
//   imports: [CommonModule, ComplianceLayoutComponent],
//   template: `
//     <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
//   `,
// })
// export class TaxComplianceComponent {
//   pageData: CompliancePage = {
//     id: 'tax-compliance',
//     title: 'SARS & Tax Compliance',
//     subtitle:
//       'How Kapify ensures South African tax reporting and regulatory compliance',
//     breadcrumb: ['Compliance', 'Tax Compliance'],
//     ctaLabel: 'SARS Compliance Guide',
//     ctaUrl: '#',
//     tabs: [
//       {
//         id: 'overview',
//         label: 'Overview',
//         content: '',
//       },
//       {
//         id: 'income-tax',
//         label: 'Income Tax',
//         content: `
//           <h3>Reporting Obligations</h3>
//           <p>SMEs using Kapify must report funding received as income:</p>
//           <ul>
//             <li>Equity investments are taxable as capital gains or ordinary income depending on structure</li>
//             <li>Loans are not taxable income but must be tracked separately</li>
//             <li>Interest paid on loans is deductible as a business expense</li>
//             <li>Equity stakes in your company trigger capital gains tax on disposal</li>
//           </ul>
//           <h3>Documentation</h3>
//           <p>Kapify provides:</p>
//           <ul>
//             <li>Annual transaction statements showing all funding received</li>
//             <li>Detailed breakdowns of equity vs. loan components</li>
//             <li>Interest calculation schedules for loan tranches</li>
//             <li>Export functionality for tax filings (CSV, PDF)</li>
//           </ul>
//           <p>Keep these records for SARS compliance. Standard retention period is 5 years.</p>
//         `,
//       },
//       {
//         id: 'bbbee',
//         label: 'BBBEE Compliance',
//         content: `
//           <h3>Black Economic Empowerment</h3>
//           <p>Kapify supports BBBEE compliance by:</p>
//           <ul>
//             <li><strong>Funder Verification:</strong> All funders are BBBEE-certified or compliant</li>
//             <li><strong>Ownership Tracking:</strong> Platform tracks equity ownership for scorecards</li>
//             <li><strong>Reporting:</strong> Generate BBBEE compliance reports for your organization</li>
//             <li><strong>Scorecard Integration:</strong> Export data to BBBEE software systems</li>
//           </ul>
//           <h3>Equity Transaction Records</h3>
//           <p>For each equity investment, Kapify maintains:</p>
//           <ul>
//             <li>Funder identity and BBBEE status</li>
//             <li>Equity percentage transferred</li>
//             <li>Transaction date and valuation</li>
//             <li>Share certificates and legal documentation</li>
//           </ul>
//           <p>All information is exportable in BBBEE-compliant formats.</p>
//         `,
//       },
//       {
//         id: 'vat',
//         label: 'VAT & Withholding Tax',
//         content: `
//           <h3>Value Added Tax (VAT)</h3>
//           <p>VAT treatment on Kapify transactions:</p>
//           <ul>
//             <li><strong>Kapify Fees:</strong> 15% VAT applies to platform charges</li>
//             <li><strong>Funding Received:</strong> Generally not subject to VAT (financial supply exemption)</li>
//             <li><strong>Interest Payments:</strong> Not subject to VAT</li>
//             <li><strong>Equity Transactions:</strong> Not subject to VAT</li>
//           </ul>
//           <h3>Withholding Tax</h3>
//           <p>Funders may need to withhold tax on interest payments:</p>
//           <ul>
//             <li>Interest withholding tax: 20% (unless exempted)</li>
//             <li>Dividends: No withholding if paid to South African resident</li>
//             <li>Kapify provides withholding tax certificates (IT3(a)) as required</li>
//           </ul>
//           <p>Consult your tax advisor regarding your specific situation.</p>
//         `,
//       },
//     ],
//     mainContent: `
//       <h2>SARS & Tax Compliance</h2>
//       <p>Kapify operates in full compliance with South African Revenue Service (SARS) regulations and helps users meet their tax obligations. This guide explains your tax responsibilities when using our platform.</p>
//       <h3>Key Tax Principles</h3>
//       <ul>
//         <li>All funding received must be reported to SARS</li>
//         <li>Different tax treatment applies to debt vs. equity funding</li>
//         <li>Interest on loans is deductible but must be properly documented</li>
//         <li>Equity investments trigger capital gains tax on exit</li>
//         <li>Kapify provides detailed records to support tax compliance</li>
//       </ul>
//       <h3>Kapify's Tax Support</h3>
//       <p>To help you meet tax obligations, Kapify:</p>
//       <ul>
//         <li>Maintains detailed records of all transactions</li>
//         <li>Generates annual compliance reports</li>
//         <li>Provides data exports in tax-ready formats</li>
//         <li>Tracks income, interest, and capital gains separately</li>
//         <li>Coordinates with your tax accountant as needed</li>
//       </ul>
//       <p><strong>Important:</strong> Kapify is not a tax advisor. Always consult a qualified tax professional regarding your specific situation and obligations.</p>
//       <h3>CIPC & Company Registration</h3>
//       <p>For corporate transformations or ownership changes resulting from equity funding:</p>
//       <ul>
//         <li>Kapify assists with documentation preparation</li>
//         <li>You are responsible for CIPC registration updates</li>
//         <li>Ownership changes must be filed within 21 days</li>
//         <li>Share certificates must be updated in company records</li>
//       </ul>
//     `,
//     sidebarTitle: 'Tax Compliance Resources',
//     sidebarLinks: [
//       { label: 'SARS Compliance Guide', href: '#', highlight: true },
//       { label: 'Income Declaration Template', href: '#' },
//       { label: 'VAT Tax Guide', href: '#' },
//       { label: 'BBBEE Reporting Guide', href: '#' },
//       { label: 'Tax Forms & Templates', href: '#' },
//       { label: 'Contact Tax Support', href: 'mailto:tax@kapify.africa' },
//     ],
//   };
// }

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceLayoutComponent } from './compliance-layout.component';
import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';

@Component({
  selector: 'app-tax-compliance',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <div *ngIf="pageData$ | async as pageData">
      <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
    </div>
  `,
})
export class TaxComplianceComponent implements OnInit {
  private complianceService = inject(CompliancePageService);

  pageData$ = this.complianceService.getPage('tax-compliance');

  ngOnInit() {
    // Service automatically loads page on getPage() call
  }
}
