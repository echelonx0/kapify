import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComplianceLayoutComponent,
  CompliancePage,
} from './compliance-layout.component';

@Component({
  selector: 'app-aml-kyc',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
  `,
})
export class AMLKYCComponent {
  pageData: CompliancePage = {
    id: 'aml-kyc',
    title: 'AML/KYC Policy',
    subtitle: 'Anti-Money Laundering and Know Your Customer compliance',
    breadcrumb: ['Compliance', 'AML/KYC'],
    ctaLabel: 'Verification Guidelines',
    ctaUrl: '#',
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        content: '',
      },
      {
        id: 'kyc-process',
        label: 'KYC Process',
        content: `
          <h3>Know Your Customer (KYC)</h3>
          <p>All users must complete KYC verification to use Kapify:</p>
          <ul>
            <li><strong>Individual Verification:</strong> Government-issued ID, proof of address</li>
            <li><strong>Business Verification:</strong> CIPC registration, UIN, business address</li>
            <li><strong>Beneficial Owner Identification:</strong> Identify all owners and controllers</li>
            <li><strong>Source of Funds:</strong> Declaration of funding source</li>
            <li><strong>Purpose of Account:</strong> Business purpose and funding objectives</li>
          </ul>
          <h3>Verification Levels</h3>
          <ul>
            <li><strong>Level 1:</strong> Basic identity verification (phone, email)</li>
            <li><strong>Level 2:</strong> Enhanced KYC (ID, address proof, business details)</li>
            <li><strong>Level 3:</strong> Full verification (beneficial owners, source of funds, enhanced due diligence)</li>
          </ul>
          <p>Higher transaction limits require higher verification levels.</p>
        `,
      },
      {
        id: 'aml-monitoring',
        label: 'AML Monitoring',
        content: `
          <h3>Anti-Money Laundering Monitoring</h3>
          <p>Kapify monitors all transactions for suspicious activity:</p>
          <ul>
            <li><strong>Transaction Monitoring:</strong> Real-time screening for unusual patterns</li>
            <li><strong>Sanctions Screening:</strong> Check against OFAC, UN, and local sanction lists</li>
            <li><strong>PEP Screening:</strong> Screen for Politically Exposed Persons</li>
            <li><strong>Enhanced Due Diligence:</strong> Additional scrutiny for high-risk customers</li>
            <li><strong>Beneficial Owner Verification:</strong> Verify true owners of entities</li>
          </ul>
          <h3>Red Flags</h3>
          <p>We take action if we detect:</p>
          <ul>
            <li>Structuring of transactions to avoid reporting thresholds</li>
            <li>Rapid movement of funds with no clear business purpose</li>
            <li>Transactions with sanctioned jurisdictions or entities</li>
            <li>Use of multiple accounts to obscure activity</li>
            <li>Inconsistencies between stated purpose and actual usage</li>
          </ul>
        `,
      },
      {
        id: 'suspicious-activity',
        label: 'Reporting',
        content: `
          <h3>Suspicious Activity Reporting (SAR)</h3>
          <p>Kapify reports suspicious activity to the Financial Intelligence Centre (FIC) as required by FICA:</p>
          <ul>
            <li>Suspicious Activity Reports submitted within 30 days of detection</li>
            <li>All SARs are filed with the FIC's INFOLEAK system</li>
            <li>Reporting is confidential and you will not be notified</li>
            <li>We maintain records of all reports for audit purposes</li>
          </ul>
          <h3>Customer Due Diligence</h3>
          <p>Ongoing monitoring includes:</p>
          <ul>
            <li>Periodic review of customer KYC information (annually)</li>
            <li>Updating profiles when changes occur</li>
            <li>Re-screening against sanctions lists quarterly</li>
            <li>Enhanced monitoring for high-risk customers</li>
          </ul>
          <h3>Cooperation with Authorities</h3>
          <p>Kapify cooperates fully with law enforcement and regulatory authorities, including:</p>
          <ul>
            <li>Responding to information requests from FIC</li>
            <li>Providing transaction records and customer information</li>
            <li>Supporting investigations as legally required</li>
          </ul>
        `,
      },
    ],
    mainContent: `
      <h2>AML/KYC Policy</h2>
      <p>Kapify is committed to preventing money laundering, terrorist financing, and other illicit financial activities. We comply with the Financial Intelligence Centre Act (FICA) and implement robust Know Your Customer (KYC) and Anti-Money Laundering (AML) procedures.</p>
      <h3>Regulatory Framework</h3>
      <p>Our AML/KYC program is based on:</p>
      <ul>
        <li><strong>FICA (2001):</strong> South African anti-money laundering legislation</li>
        <li><strong>FATF Recommendations:</strong> Financial Action Task Force standards</li>
        <li><strong>FIC Guidance:</strong> Financial Intelligence Centre guidance notes</li>
        <li><strong>Best Practices:</strong> Industry-standard AML/KYC procedures</li>
      </ul>
      <h3>Core Principles</h3>
      <ul>
        <li>Know every customer and beneficial owner</li>
        <li>Understand the purpose and expected nature of transactions</li>
        <li>Monitor for suspicious activity continuously</li>
        <li>Report suspicious activity to FIC promptly</li>
        <li>Maintain detailed records and audit trails</li>
        <li>Conduct enhanced due diligence for high-risk customers</li>
      </ul>
      <h3>Account Restrictions</h3>
      <p>We may suspend or terminate accounts for:</p>
      <ul>
        <li>Failure to complete KYC verification</li>
        <li>Providing false or misleading information</li>
        <li>Suspicious transaction patterns</li>
        <li>Involvement with sanctioned entities or individuals</li>
        <li>Non-compliance with our verification requests</li>
      </ul>
    `,
    sidebarTitle: 'AML/KYC Resources',
    sidebarLinks: [
      { label: 'Verification Guidelines', href: '#', highlight: true },
      { label: 'Document Requirements', href: '#' },
      { label: 'FICA Compliance Info', href: '#' },
      { label: 'Sanctions List Queries', href: '#' },
      { label: 'Report Suspicious Activity', href: 'mailto:aml@kapify.africa' },
      { label: 'Compliance Contact', href: 'mailto:compliance@kapify.africa' },
    ],
  };
}
