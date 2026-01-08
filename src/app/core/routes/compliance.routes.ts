import { Routes } from '@angular/router';
import { AMLKYCComponent } from '../../features/compliance/aml-kyc.component';
import { CookiePolicyComponent } from '../../features/compliance/cookie-policy.component';
import { DataSecurityComponent } from '../../features/compliance/data-security.component';
import { PrivacyPolicyComponent } from '../../features/compliance/privacy-policy.component';
import { TaxComplianceComponent } from '../../features/compliance/tax-compliance.component';
import { TermsOfServiceComponent } from '../../features/compliance/terms-of-service.component';

export const complianceRoutes: Routes = [
  {
    path: 'privacy',
    component: PrivacyPolicyComponent,
    data: { title: 'Privacy Policy - Kapify' },
  },
  {
    path: 'terms',
    component: TermsOfServiceComponent,
    data: { title: 'Terms of Service - Kapify' },
  },
  {
    path: 'security',
    component: DataSecurityComponent,
    data: { title: 'Data Security & Compliance - Kapify' },
  },
  {
    path: 'tax-compliance',
    component: TaxComplianceComponent,
    data: { title: 'SARS & Tax Compliance - Kapify' },
  },
  {
    path: 'aml-kyc',
    component: AMLKYCComponent,
    data: { title: 'AML/KYC Policy - Kapify' },
  },
  {
    path: 'cookies',
    component: CookiePolicyComponent,
    data: { title: 'Cookie Policy - Kapify' },
  },
  {
    path: '',
    redirectTo: 'privacy',
    pathMatch: 'full',
  },
];
