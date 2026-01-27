import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, Lock, FileText } from 'lucide-angular';

@Component({
  selector: 'app-data-integrity-section',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="bg-white border-t-2 border-b-2 border-slate-200">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <!-- Header with Icon -->
        <div class="flex items-start gap-4 mb-6">
          <div class="flex-1">
            <h3
              class="text-lg font-black text-slate-900 uppercase tracking-tight mb-2"
            >
              Data Integrity & Security
            </h3>
            <p class="text-slate-700 text-sm leading-relaxed mb-3">
              Kapify is committed to maintaining the highest standards of data
              integrity, security, and regulatory compliance in accordance with
              the Protection of Personal Information Act (POPIA), the General
              Data Protection Regulation (GDPR), the Financial Intelligence
              Centre Act (FICA), and all applicable South African financial
              services regulations including the National Credit Act (NCA), the
              Companies Act, and SARS compliance requirements. All personal and
              financial information is encrypted using industry-standard
              protocols, subject to comprehensive audit trails, and protected
              under our rigorous information governance framework.
            </p>
            <p class="text-slate-600 text-xs">
              For inquiries regarding our data security policy, compliance
              procedures, or privacy practices, please contact
              <a
                href="mailto:data.governance@kapify.africa"
                class="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >{{ email }}</a
              >
            </p>
          </div>
        </div>

        <!-- Compliance Links -->
        <div class="flex flex-wrap gap-3">
          <a
            routerLink="/compliance/security"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-teal-600 bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wide hover:bg-teal-100 transition-all duration-200"
          >
            <lucide-angular [img]="LockIcon" size="14"></lucide-angular>
            Security
          </a>

          <a
            routerLink="/compliance/privacy"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wide hover:border-slate-300 hover:bg-slate-100 transition-all duration-200"
          >
            <lucide-angular [img]="FileTextIcon" size="14"></lucide-angular>
            Privacy
          </a>

          <a
            routerLink="/compliance/aml-kyc"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wide hover:border-slate-300 hover:bg-slate-100 transition-all duration-200"
          >
            <lucide-angular [img]="FileTextIcon" size="14"></lucide-angular>
            AML/KYC
          </a>

          <a
            routerLink="/compliance/tax-compliance"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wide hover:border-slate-300 hover:bg-slate-100 transition-all duration-200"
          >
            <lucide-angular [img]="FileTextIcon" size="14"></lucide-angular>
            Tax Compliance
          </a>

          <a
            routerLink="/compliance/terms"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wide hover:border-slate-300 hover:bg-slate-100 transition-all duration-200"
          >
            <lucide-angular [img]="FileTextIcon" size="14"></lucide-angular>
            Terms
          </a>
        </div>
      </div>
    </div>
  `,
})
export class DataIntegritySectionComponent {
  readonly ShieldIcon = Shield;
  readonly LockIcon = Lock;
  readonly FileTextIcon = FileText;

  email = 'data.governance@kapify.africa';
}
