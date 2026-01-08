import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ComplianceLayoutComponent,
  CompliancePage,
} from './compliance-layout.component';

@Component({
  selector: 'app-data-security',
  standalone: true,
  imports: [CommonModule, ComplianceLayoutComponent],
  template: `
    <app-compliance-layout [pageData]="pageData"></app-compliance-layout>
  `,
})
export class DataSecurityComponent {
  pageData: CompliancePage = {
    id: 'security',
    title: 'Data Security & Compliance',
    subtitle:
      'Industry-leading security measures protecting your financial data',
    breadcrumb: ['Compliance', 'Data Security'],
    ctaLabel: 'Security Whitepaper',
    ctaUrl: '#',
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        content: '',
      },
      {
        id: 'encryption',
        label: 'Encryption',
        content: `
          <h3>Data Encryption</h3>
          <p>All sensitive data is protected using industry-standard encryption:</p>
          <ul>
            <li><strong>In Transit:</strong> TLS 1.3 encryption for all data transmission</li>
            <li><strong>At Rest:</strong> AES-256 encryption for stored data</li>
            <li><strong>Database:</strong> Encrypted database backups with secure key management</li>
            <li><strong>API Communications:</strong> Encrypted REST API endpoints with OAuth 2.0</li>
          </ul>
          <h3>Key Management</h3>
          <p>Encryption keys are managed using:</p>
          <ul>
            <li>Hardware Security Modules (HSM) for key storage</li>
            <li>Regular key rotation and management</li>
            <li>Role-based access control to encryption keys</li>
            <li>Audit logging for all key access</li>
          </ul>
        `,
      },
      {
        id: 'access-control',
        label: 'Access Control',
        content: `
          <h3>Authentication & Authorization</h3>
          <p>We implement multi-layered access controls:</p>
          <ul>
            <li><strong>Two-Factor Authentication (2FA):</strong> Enhanced account security</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Users only access permitted data</li>
            <li><strong>Single Sign-On (SSO):</strong> Secure enterprise authentication</li>
            <li><strong>Session Management:</strong> Automatic logout after inactivity</li>
          </ul>
          <h3>Admin Controls</h3>
          <p>Administrative access is restricted to:</p>
          <ul>
            <li>Authorized personnel only with background checks</li>
            <li>All admin actions are logged and audited</li>
            <li>Multi-person approval for sensitive operations</li>
            <li>Regular access reviews and updates</li>
          </ul>
        `,
      },
      {
        id: 'compliance',
        label: 'Compliance Standards',
        content: `
          <h3>Regulatory Compliance</h3>
          <p>Kapify complies with major regulatory frameworks:</p>
          <ul>
            <li><strong>POPIA (Protection of Personal Information Act):</strong> South African data protection</li>
            <li><strong>GDPR (General Data Protection Regulation):</strong> EU data protection</li>
            <li><strong>POPIA Schedule 1:</strong> Financial Information Act compliance</li>
            <li><strong>FICA (Financial Intelligence Centre Act):</strong> AML/CFT requirements</li>
          </ul>
          <h3>Security Standards</h3>
          <p>We implement:</p>
          <ul>
            <li><strong>ISO 27001:</strong> Information security management system</li>
            <li><strong>SOC 2 Type II:</strong> Security and availability controls (in progress)</li>
            <li><strong>PCI-DSS:</strong> Payment card data protection (via trusted processors)</li>
            <li><strong>NIST Cybersecurity Framework:</strong> Industry-standard best practices</li>
          </ul>
        `,
      },
    ],
    mainContent: `
      <h2>Data Security & Compliance</h2>
      <p>Kapify prioritizes the security of your financial data with enterprise-grade infrastructure and compliance measures. We implement defense-in-depth strategies to protect against evolving threats.</p>
      <h3>Security Architecture</h3>
      <ul>
        <li><strong>Cloud Infrastructure:</strong> AWS with multi-region redundancy</li>
        <li><strong>DDoS Protection:</strong> AWS Shield Standard and Advanced protection</li>
        <li><strong>Web Application Firewall:</strong> ModSecurity and AWS WAF rules</li>
        <li><strong>Intrusion Detection:</strong> 24/7 monitoring and incident response</li>
        <li><strong>Regular Penetration Testing:</strong> Annual third-party security audits</li>
      </ul>
      <h3>Data Residency</h3>
      <p>Your data is stored in South Africa (AWS eu-south-1 region) with automatic backups to secondary regions for disaster recovery. You maintain full control over your data location and can request migration if needed.</p>
      <h3>Incident Response</h3>
      <p>In the event of a security incident, Kapify will:</p>
      <ul>
        <li>Investigate and contain the incident within 24 hours</li>
        <li>Notify affected users within 5 business days</li>
        <li>Provide transparent communication throughout remediation</li>
        <li>Implement preventive measures to avoid recurrence</li>
      </ul>
    `,
    sidebarTitle: 'Security Resources',
    sidebarLinks: [
      { label: 'Security Whitepaper', href: '#', highlight: true },
      { label: 'Penetration Test Report', href: '#' },
      {
        label: 'Security Incident Reporting',
        href: 'mailto:security@kapify.africa',
      },
      { label: 'Bug Bounty Program', href: '#' },
      { label: 'Infrastructure Status', href: 'https://status.kapify.africa' },
      { label: 'Security Team Contact', href: 'mailto:security@kapify.africa' },
    ],
  };
}
