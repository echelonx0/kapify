// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   ComplianceLayoutComponent,
//   CompliancePage,
// } from './compliance-layout.component';

// @Component({
//   selector: 'app-cookie-policy',
//   standalone: true,
//   imports: [CommonModule, ComplianceLayoutComponent],
//   template: `
//     <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
//   `,
// })
// export class CookiePolicyComponent {
//   pageData: CompliancePage = {
//     id: 'cookies',
//     title: 'Cookie Policy',
//     subtitle: 'How Kapify uses cookies and tracking technologies',
//     breadcrumb: ['Compliance', 'Cookie Policy'],
//     ctaLabel: 'Manage Cookie Settings',
//     ctaUrl: '#',
//     tabs: [
//       {
//         id: 'overview',
//         label: 'Overview',
//         content: '',
//       },
//       {
//         id: 'what-are-cookies',
//         label: 'What Are Cookies',
//         content: `
//           <h3>Understanding Cookies</h3>
//           <p>Cookies are small text files stored on your device that contain information about your browsing activity. They are used to:</p>
//           <ul>
//             <li>Remember login information and preferences</li>
//             <li>Track your activity for security purposes</li>
//             <li>Measure website performance and usage patterns</li>
//             <li>Personalize your experience</li>
//           </ul>
//           <h3>Types of Cookies</h3>
//           <ul>
//             <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
//             <li><strong>Persistent Cookies:</strong> Remain until expiration or deletion</li>
//             <li><strong>First-Party Cookies:</strong> Set by Kapify directly</li>
//             <li><strong>Third-Party Cookies:</strong> Set by our analytics and service partners</li>
//           </ul>
//           <h3>Similar Technologies</h3>
//           <p>We also use:</p>
//           <ul>
//             <li>Web beacons and pixel tags for tracking</li>
//             <li>Local storage for caching and preferences</li>
//             <li>Service workers for offline functionality</li>
//           </ul>
//         `,
//       },
//       {
//         id: 'cookie-types',
//         label: 'Cookie Categories',
//         content: `
//           <h3>Essential Cookies</h3>
//           <p><strong>Required for functionality - cannot be disabled</strong></p>
//           <ul>
//             <li>Session management and authentication</li>
//             <li>CSRF protection and security tokens</li>
//             <li>User preferences and language settings</li>
//             <li>Load balancing and infrastructure optimization</li>
//           </ul>
//           <h3>Performance Cookies</h3>
//           <p><strong>Improve website performance - require consent</strong></p>
//           <ul>
//             <li>Google Analytics - page views, user flow, bounce rate</li>
//             <li>Clarity Analytics - user session recordings and heatmaps</li>
//             <li>Performance monitoring - error tracking and latency</li>
//             <li>CDN optimization cookies</li>
//           </ul>
//           <h3>Marketing Cookies</h3>
//           <p><strong>Used for advertising - require consent</strong></p>
//           <ul>
//             <li>Google Ads - remarketing and conversion tracking</li>
//             <li>Facebook Pixel - audience insights and retargeting</li>
//             <li>Email provider tracking - open and click tracking</li>
//             <li>Third-party advertising networks</li>
//           </ul>
//         `,
//       },
//       {
//         id: 'cookie-management',
//         label: 'Managing Cookies',
//         content: `
//           <h3>Cookie Consent</h3>
//           <p>When you first visit Kapify, you will see a cookie banner. You can:</p>
//           <ul>
//             <li><strong>Accept All:</strong> Allow all cookies including marketing</li>
//             <li><strong>Reject All:</strong> Decline all non-essential cookies</li>
//             <li><strong>Manage Preferences:</strong> Choose which categories to enable</li>
//           </ul>
//           <h3>Changing Your Settings</h3>
//           <p>You can update your cookie preferences anytime by:</p>
//           <ul>
//             <li>Clicking the cookie settings link in the footer</li>
//             <li>Using your browser's cookie management tools</li>
//             <li>Contacting us at privacy@kapify.africa</li>
//           </ul>
//           <h3>Browser Controls</h3>
//           <p>Most browsers allow you to:</p>
//           <ul>
//             <li>Block all cookies (may break website functionality)</li>
//             <li>Block third-party cookies only</li>
//             <li>Clear cookies on browser close</li>
//             <li>Set specific cookie preferences per website</li>
//           </ul>
//           <p>Visit your browser's help documentation for specific instructions.</p>
//         `,
//       },
//     ],
//     mainContent: `
//       <h2>Cookie Policy</h2>
//       <p>Kapify uses cookies and similar tracking technologies to enhance your experience, measure website performance, and deliver targeted marketing. This policy explains how we use cookies and your choices regarding cookie usage.</p>
//       <h3>Why We Use Cookies</h3>
//       <ul>
//         <li><strong>Authentication:</strong> Keep you logged in securely</li>
//         <li><strong>Security:</strong> Protect against fraud and unauthorized access</li>
//         <li><strong>Preferences:</strong> Remember your settings and preferences</li>
//         <li><strong>Analytics:</strong> Understand how users interact with our platform</li>
//         <li><strong>Marketing:</strong> Show relevant ads and measure campaign effectiveness</li>
//       </ul>
//       <h3>Legal Basis</h3>
//       <p>We use cookies based on:</p>
//       <ul>
//         <li><strong>Consent:</strong> Your explicit agreement to cookie usage</li>
//         <li><strong>Legitimate Interest:</strong> To provide services and improve our platform</li>
//         <li><strong>Legal Obligation:</strong> To comply with security and fraud prevention regulations</li>
//       </ul>
//       <h3>Data Sharing</h3>
//       <p>We share cookie data with:</p>
//       <ul>
//         <li><strong>Google:</strong> Analytics and advertising services</li>
//         <li><strong>Microsoft:</strong> Clarity analytics</li>
//         <li><strong>Facebook:</strong> Pixel tracking and retargeting</li>
//         <li><strong>Service Providers:</strong> Under strict data processing agreements</li>
//       </ul>
//       <p>These third parties are bound by their own privacy policies and GDPR/POPIA compliance obligations.</p>
//     `,
//     sidebarTitle: 'Cookie Resources',
//     sidebarLinks: [
//       { label: 'Manage Cookie Settings', href: '#', highlight: true },
//       { label: 'Cookie List & Details', href: '#' },
//       {
//         label: 'Google Privacy Policy',
//         href: 'https://policies.google.com/privacy',
//       },
//       { label: 'Microsoft Privacy', href: 'https://privacy.microsoft.com' },
//       { label: 'Browser Controls Guide', href: '#' },
//       { label: 'Contact Privacy Team', href: 'mailto:privacy@kapify.africa' },
//     ],
//   };
// }

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceLayoutComponent } from './compliance-layout.component';
import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';

@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <div *ngIf="pageData$ | async as pageData">
      <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
    </div>
    <div
      *ngIf="(pageData$ | async) === null"
      class="p-8 text-center text-gray-500"
    >
      <p>Loading compliance page...</p>
    </div>
  `,
})
export class CookiePolicyComponent implements OnInit {
  private complianceService = inject(CompliancePageService);

  pageData$ = this.complianceService.getPage('cookies');

  ngOnInit() {
    // Subscribe to get data and debug
    this.pageData$.subscribe({
      next: (page) => {
        if (page) {
          console.log('✅ Cookie policy loaded:', page.title);
          console.log(page);
        } else {
          console.warn('⚠️ No page data returned');
        }
      },
      error: (err) => {
        console.error('❌ Error loading compliance page:', err);
      },
    });
  }
}
