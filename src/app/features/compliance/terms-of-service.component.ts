// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   ComplianceLayoutComponent,
//   CompliancePage,
// } from './compliance-layout.component';

// @Component({
//   selector: 'app-terms-of-service',
//   standalone: true,
//   imports: [CommonModule, ComplianceLayoutComponent],
//   template: `
//     <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
//   `,
// })
// export class TermsOfServiceComponent {
//   pageData: CompliancePage = {
//     id: 'terms',
//     title: 'Terms of Service',
//     subtitle: 'The rules and responsibilities that govern your use of Kapify',
//     breadcrumb: ['Compliance', 'Terms of Service'],
//     ctaLabel: 'Download PDF',
//     ctaUrl: '#',
//     tabs: [
//       {
//         id: 'overview',
//         label: 'Overview',
//         content: '',
//       },
//       {
//         id: 'user-obligations',
//         label: 'User Obligations',
//         content: `
//           <h3>Your Responsibilities</h3>
//           <p>By using Kapify, you agree to:</p>
//           <ul>
//             <li>Provide accurate and complete information</li>
//             <li>Maintain confidentiality of your account credentials</li>
//             <li>Use the platform only for legitimate business purposes</li>
//             <li>Comply with all applicable laws and regulations</li>
//             <li>Not engage in fraud, money laundering, or illegal activity</li>
//             <li>Respect intellectual property rights</li>
//             <li>Not interfere with platform security or functionality</li>
//           </ul>
//           <h3>Account Security</h3>
//           <p>You are responsible for maintaining the security of your account. You must:</p>
//           <ul>
//             <li>Use a strong, unique password</li>
//             <li>Enable two-factor authentication (recommended)</li>
//             <li>Notify us immediately of any unauthorized access</li>
//             <li>Not share your login credentials with others</li>
//           </ul>
//         `,
//       },
//       {
//         id: 'platform-rules',
//         label: 'Platform Rules',
//         content: `
//           <h3>Prohibited Activities</h3>
//           <p>You may not use Kapify to:</p>
//           <ul>
//             <li>Engage in illegal activities or fraud</li>
//             <li>Harass, threaten, or abuse other users</li>
//             <li>Submit false or misleading information</li>
//             <li>Manipulate application statuses or funding amounts</li>
//             <li>Attempt to gain unauthorized access to systems</li>
//             <li>Transmit malware or harmful code</li>
//             <li>Engage in market manipulation or insider trading</li>
//           </ul>
//           <h3>Consequences of Violations</h3>
//           <p>Violations of these terms may result in:</p>
//           <ul>
//             <li>Immediate account suspension</li>
//             <li>Permanent account termination</li>
//             <li>Legal action and liability for damages</li>
//             <li>Reporting to regulatory authorities</li>
//           </ul>
//         `,
//       },
//       {
//         id: 'liability',
//         label: 'Liability',
//         content: `
//           <h3>Disclaimer</h3>
//           <p>Kapify provides the platform "as is" without warranties of any kind. We do not guarantee:</p>
//           <ul>
//             <li>Successful funding for submitted applications</li>
//             <li>Uninterrupted platform availability</li>
//             <li>Accuracy of all information on the platform</li>
//             <li>Specific outcomes or results</li>
//           </ul>
//           <h3>Limitation of Liability</h3>
//           <p>Kapify shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including loss of profits or data.</p>
//           <p>Our total liability is limited to the fees paid in the preceding 12 months.</p>
//         `,
//       },
//     ],
//     mainContent: `
//       <h2>Terms of Service</h2>
//       <p>These Terms of Service ("Terms") constitute a binding agreement between you ("User," "you," or "your") and Kapify ("Company," "we," "us," or "our"). By accessing or using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
//       <h3>Platform Overview</h3>
//       <p>Kapify is a funding marketplace that connects South African SMEs with institutional funders. The platform facilitates introductions and provides infrastructure for due diligence, but does not guarantee funding outcomes.</p>
//       <h3>Eligibility</h3>
//       <p>To use Kapify, you must:</p>
//       <ul>
//         <li>Be at least 18 years of age</li>
//         <li>Have the legal capacity to enter into agreements</li>
//         <li>Not be located in a sanctioned jurisdiction</li>
//         <li>Comply with all applicable laws in your jurisdiction</li>
//       </ul>
//       <h3>No Investment Advice</h3>
//       <p>Kapify does not provide investment advice. All funding decisions are made independently by verified funders on the platform. You should conduct your own due diligence and seek professional advice before entering into any funding agreements.</p>
//     `,
//     sidebarTitle: 'Terms Resources',
//     sidebarLinks: [
//       { label: 'Download Terms (PDF)', href: '#', highlight: true },
//       { label: 'Acceptable Use Policy', href: '#' },
//       { label: 'Platform Code of Conduct', href: '#' },
//       { label: 'Dispute Resolution', href: '#' },
//       { label: 'Contact Legal Team', href: 'mailto:legal@kapify.africa' },
//     ],
//   };
// }

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComplianceLayoutComponent,
  CompliancePage,
} from './compliance-layout.component';
import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <div *ngIf="pageData$ | async as pageData">
      <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
    </div>
  `,
})
export class TermsOfServiceComponent implements OnInit {
  private complianceService = inject(CompliancePageService);

  pageData$ = this.complianceService.getPage('terms');

  ngOnInit() {
    // Service automatically loads page on getPage() call
  }
}
