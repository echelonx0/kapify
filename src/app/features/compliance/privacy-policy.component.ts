import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComplianceLayoutComponent,
  CompliancePage,
} from './compliance-layout.component';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
  `,
})
export class PrivacyPolicyComponent {
  pageData: CompliancePage = {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your personal data at Kapify',
    breadcrumb: ['Compliance', 'Privacy Policy'],
    ctaLabel: 'Download PDF',
    ctaUrl: '#',
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        content: '',
      },
      {
        id: 'collection',
        label: 'Data Collection',
        content: `
          <h3>What Data We Collect</h3>
          <p>Kapify collects personal data to provide our funding platform services. This includes:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email, phone number, company name</li>
            <li><strong>Business Data:</strong> Business registration, financial statements, tax records</li>
            <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent</li>
            <li><strong>Payment Information:</strong> Payment method and transaction history</li>
            <li><strong>Communication Data:</strong> Messages, support tickets, feedback</li>
          </ul>
          <p>We collect this data through:</p>
          <ul>
            <li>Direct submission via registration forms</li>
            <li>Automatic collection through cookies and analytics</li>
            <li>Third-party integrations (payment processors, compliance services)</li>
          </ul>
        `,
      },
      {
        id: 'usage',
        label: 'Data Usage',
        content: `
          <h3>How We Use Your Data</h3>
          <p>Your personal data is used for:</p>
          <ul>
            <li><strong>Service Delivery:</strong> Processing applications, matching funders, communications</li>
            <li><strong>Compliance:</strong> KYC/AML verification, tax reporting, regulatory requirements</li>
            <li><strong>Security:</strong> Fraud detection, account protection, abuse prevention</li>
            <li><strong>Analytics:</strong> Understanding user behavior to improve our platform</li>
            <li><strong>Marketing:</strong> Newsletters, product updates (with your consent)</li>
          </ul>
          <p>We do not sell your personal data to third parties. We only share data with:</p>
          <ul>
            <li>Service providers under strict confidentiality agreements</li>
            <li>Regulatory authorities when legally required</li>
            <li>Other parties with your explicit consent</li>
          </ul>
        `,
      },
      {
        id: 'rights',
        label: 'Your Rights',
        content: `
          <h3>Your Privacy Rights</h3>
          <p>Under POPIA (Protection of Personal Information Act) and GDPR, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request erasure of your data (subject to legal obligations)</li>
            <li><strong>Restriction:</strong> Limit how we use your data</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Withdraw Consent:</strong> Opt-out of marketing communications</li>
          </ul>
          <p>To exercise these rights, contact us at <strong>privacy@kapify.africa</strong></p>
        `,
      },
    ],
    mainContent: `
      <h2>Privacy Policy</h2>
      <p>Kapify ("we," "us," "our," or "Company") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.</p>
      <h3>Key Principles</h3>
      <ul>
        <li>We collect only necessary data to provide our services</li>
        <li>Your data is protected with industry-standard encryption</li>
        <li>You have full control over your personal information</li>
        <li>We comply with South African (POPIA) and international privacy laws</li>
      </ul>
      <h3>Data Retention</h3>
      <p>We retain your personal data for as long as necessary to provide services and comply with legal obligations. After account termination, we retain data for 7 years unless legally required otherwise.</p>
      <h3>Contact Us</h3>
      <p>For privacy inquiries, contact our Data Protection Officer at <strong>privacy@kapify.africa</strong></p>
    `,
    sidebarTitle: 'Privacy Resources',
    sidebarLinks: [
      { label: 'Download Privacy Policy (PDF)', href: '#', highlight: true },
      { label: 'POPIA Compliance', href: '#' },
      { label: 'GDPR Information', href: '#' },
      { label: 'Cookie Settings', href: '/compliance/cookies' },
      { label: 'Data Request Form', href: '#' },
      { label: 'Contact DPO', href: 'mailto:privacy@kapify.africa' },
    ],
  };
}
