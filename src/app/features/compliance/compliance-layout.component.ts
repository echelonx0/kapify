// import { Component, Input, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, ActivatedRoute } from '@angular/router';
// import { LucideAngularModule, ChevronRight } from 'lucide-angular';

// export interface CompliancePage {
//   id: string;
//   title: string;
//   subtitle: string;
//   breadcrumb: string[];
//   ctaLabel?: string;
//   ctaUrl?: string;
//   tabs: ComplianceTab[];
//   mainContent: string; // HTML content
//   sidebarTitle: string;
//   sidebarLinks: SidebarLink[];
// }

// export interface ComplianceTab {
//   id: string;
//   label: string;
//   content: string; // HTML content
// }

// export interface SidebarLink {
//   label: string;
//   href?: string;
//   highlight?: boolean;
// }

// @Component({
//   selector: 'app-compliance-layout',
//   standalone: true,
//   imports: [CommonModule, RouterModule, LucideAngularModule],
//   template: `
//     <div class="min-h-screen bg-teal-50">
//       <!-- Breadcrumb Navigation -->
//       <nav class="bg-white border-b border-teal-200">
//         <div class="max-w-7xl mx-auto px-6 py-3 text-sm text-teal-600">
//           <ol class="flex items-center gap-2">
//             <li>
//               <a href="/" class="hover:text-teal-900 transition-colors"
//                 >Kapify</a
//               >
//             </li>
//             @for (crumb of breadcrumbs; track $index) {
//             <li class="flex items-center gap-2">
//               <lucide-icon
//                 [img]="ChevronRightIcon"
//                 [size]="16"
//                 class="text-teal-400"
//               />
//               @if ($last) {
//               <span class="text-teal-900 font-medium">{{ crumb }}</span>
//               } @else {
//               <a href="#" class="hover:text-teal-900 transition-colors">{{
//                 crumb
//               }}</a>
//               }
//             </li>
//             }
//           </ol>
//         </div>
//       </nav>

//       <!-- Hero Section -->
//       <section
//         class="relative bg-teal-900 text-white overflow-hidden pt-20 pb-12"
//       >
//         <!-- Background animation -->
//         <div class="absolute inset-0">
//           <div
//             class="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
//           ></div>
//           <div
//             class="absolute -bottom-10 -left-10 w-96 h-96 bg-teal-700/20 rounded-full blur-3xl"
//           ></div>
//         </div>

//         <!-- Content -->
//         <div class="relative max-w-7xl mx-auto px-6">
//           <div class="max-w-2xl">
//             <h1 class="text-5xl lg:text-6xl font-black mb-4 leading-tight">
//               {{ pageData.title }}
//             </h1>
//             <p class="text-lg text-teal-300 mb-8">
//               {{ pageData.subtitle }}
//             </p>
//             @if (pageData.ctaLabel) {
//             <a
//               [href]="pageData.ctaUrl || '#'"
//               class="inline-block px-8 py-3 bg-white text-teal-900 font-bold rounded-full hover:bg-teal-100 transition-all"
//             >
//               {{ pageData.ctaLabel }}
//             </a>
//             }
//           </div>
//         </div>
//       </section>

//       <!-- Tab Navigation -->
//       <div class="bg-white border-b border-teal-200 sticky top-0 z-40">
//         <div class="max-w-7xl mx-auto px-6">
//           <div class="flex gap-8 overflow-x-auto scrollbar-hide">
//             @for (tab of pageData.tabs; track tab.id) {
//             <button
//               (click)="selectTab(tab.id)"
//               [class.border-teal-500]="activeTab === tab.id"
//               [class.text-teal-900]="activeTab === tab.id"
//               [class.border-transparent]="activeTab !== tab.id"
//               [class.text-teal-600]="activeTab !== tab.id"
//               class="px-1 py-4 border-b-2 transition-all whitespace-nowrap font-medium text-sm"
//             >
//               {{ tab.label }}
//             </button>
//             }
//           </div>
//         </div>
//       </div>

//       <!-- Main Content -->
//       <div class="max-w-7xl mx-auto px-6 py-16">
//         <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
//           <!-- Left: Main Content -->
//           <div class="lg:col-span-2 space-y-8">
//             @if (activeTab === 'overview') {
//             <div
//               class="prose prose-teal max-w-none"
//               [innerHTML]="pageData.mainContent"
//             ></div>
//             } @else { @for (tab of pageData.tabs; track tab.id) { @if (tab.id
//             === activeTab) {
//             <div
//               class="prose prose-teal max-w-none"
//               [innerHTML]="tab.content"
//             ></div>
//             } } }
//           </div>

//           <!-- Right: Sidebar -->
//           <div class="lg:col-span-1">
//             <!-- Resources Sidebar -->
//             <div
//               class="bg-white rounded-2xl border border-teal-200 p-6 sticky top-24"
//             >
//               <h3 class="text-lg font-bold text-teal-900 mb-6">
//                 {{ pageData.sidebarTitle }}
//               </h3>
//               <ul class="space-y-3">
//                 @for (link of pageData.sidebarLinks; track link.label) {
//                 <li>
//                   @if (link.href) {
//                   <a
//                     [href]="link.href"
//                     [class.text-teal-600]="link.highlight"
//                     [class.text-teal-700]="!link.highlight"
//                     class="hover:text-teal-600 transition-colors text-sm font-medium flex items-center gap-2"
//                   >
//                     {{ link.label }}
//                     @if (link.href && !link.href.startsWith('#')) {
//                     <lucide-icon [img]="ChevronRightIcon" [size]="14" />
//                     }
//                   </a>
//                   } @else {
//                   <span class="text-teal-700 text-sm font-medium">{{
//                     link.label
//                   }}</span>
//                   }
//                 </li>
//                 }
//               </ul>

//               <!-- Quick Contact -->
//               <div
//                 class="bg-teal-50 rounded-2xl border border-teal-200 p-6 mt-6"
//               >
//                 <h4 class="text-sm font-bold text-teal-900 mb-3">Questions?</h4>
//                 <p class="text-sm text-teal-600 mb-4">
//                   Contact our compliance team for more information.
//                 </p>
//                 <a
//                   href="mailto:compliance@kapify.africa"
//                   class="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm font-medium"
//                 >
//                   Email Us
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <!-- Footer -->
//       <footer class="bg-teal-900 text-teal-400 py-12 border-t border-teal-800">
//         <div class="max-w-7xl mx-auto px-6">
//           <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
//             <div>
//               <h4 class="text-white font-bold text-sm mb-4">Compliance</h4>
//               <ul class="space-y-2 text-sm">
//                 <li>
//                   <a
//                     href="/compliance/privacy"
//                     class="hover:text-white transition-colors"
//                     >Privacy Policy</a
//                   >
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/terms"
//                     class="hover:text-white transition-colors"
//                     >Terms of Service</a
//                   >
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/security"
//                     class="hover:text-white transition-colors"
//                     >Data Security</a
//                   >
//                 </li>
//               </ul>
//             </div>
//             <div>
//               <h4 class="text-white font-bold text-sm mb-4">Legal</h4>
//               <ul class="space-y-2 text-sm">
//                 <li>
//                   <a
//                     href="/compliance/tax-compliance"
//                     class="hover:text-white transition-colors"
//                     >Tax Compliance</a
//                   >
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/aml-kyc"
//                     class="hover:text-white transition-colors"
//                     >AML/KYC</a
//                   >
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/cookies"
//                     class="hover:text-white transition-colors"
//                     >Cookies</a
//                   >
//                 </li>
//               </ul>
//             </div>
//             <div>
//               <h4 class="text-white font-bold text-sm mb-4">Support</h4>
//               <ul class="space-y-2 text-sm">
//                 <li>
//                   <a
//                     href="mailto:support@kapify.africa"
//                     class="hover:text-white transition-colors"
//                     >Support</a
//                   >
//                 </li>
//                 <li>
//                   <a
//                     href="mailto:compliance@kapify.africa"
//                     class="hover:text-white transition-colors"
//                     >Compliance</a
//                   >
//                 </li>
//                 <li>
//                   <a href="/" class="hover:text-white transition-colors"
//                     >Back to Home</a
//                   >
//                 </li>
//               </ul>
//             </div>
//             <div>
//               <h4 class="text-white font-bold text-sm mb-4">Company</h4>
//               <ul class="space-y-2 text-sm">
//                 <li>
//                   <a href="/pricing" class="hover:text-white transition-colors"
//                     >Pricing</a
//                   >
//                 </li>
//                 <li>
//                   <a
//                     href="/marketplace"
//                     class="hover:text-white transition-colors"
//                     >Marketplace</a
//                   >
//                 </li>
//                 <li>
//                   <a href="/" class="hover:text-white transition-colors"
//                     >About</a
//                   >
//                 </li>
//               </ul>
//             </div>
//           </div>
//           <div class="border-t border-teal-800 pt-8 text-sm text-center">
//             <p>
//               &copy; {{ currentYear }} Kapify. All rights reserved. |
//               <a href="#" class="hover:text-white">Sitemap</a>
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   `,
//   styles: [
//     `
//       .scrollbar-hide {
//         -ms-overflow-style: none;
//         scrollbar-width: none;
//       }
//       .scrollbar-hide::-webkit-scrollbar {
//         display: none;
//       }

//       .prose {
//         --tw-prose-body: rgb(51 65 85);
//         --tw-prose-headings: rgb(15 23 42);
//         --tw-prose-lead: rgb(71 85 99);
//         --tw-prose-links: rgb(15 118 110);
//         --tw-prose-bold: rgb(15 23 42);
//         --tw-prose-counters: rgb(100 116 139);
//         --tw-prose-bullets: rgb(100 116 139);
//         --tw-prose-hr: rgb(226 232 240);
//         --tw-prose-quotes: rgb(51 65 85);
//         --tw-prose-quote-borders: rgb(226 232 240);
//         --tw-prose-captions: rgb(71 85 99);
//         --tw-prose-code: rgb(15 23 42);
//         --tw-prose-pre-code: rgb(226 232 240);
//         --tw-prose-pre-bg: rgb(15 23 42);
//         --tw-prose-th-borders: rgb(203 213 225);
//         --tw-prose-td-borders: rgb(226 232 240);
//       }
//     `,
//   ],
// })
// export class ComplianceLayoutComponent implements OnInit {
//   @Input() pageData!: CompliancePage;

//   activeTab = 'overview';
//   breadcrumbs: string[] = [];
//   ChevronRightIcon = ChevronRight;
//   currentYear = new Date().getFullYear();

//   private route = inject(ActivatedRoute);

//   ngOnInit() {
//     this.breadcrumbs = this.pageData.breadcrumb;
//     this.activeTab = 'overview';
//   }

//   selectTab(tabId: string) {
//     this.activeTab = tabId;
//     // Scroll to top of content
//     window.scrollTo({ top: 300, behavior: 'smooth' });
//   }
// }

import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ChevronRight, AlertCircle } from 'lucide-angular';

export interface CompliancePage {
  id: string;
  title: string;
  subtitle: string;
  breadcrumb: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  tabs: ComplianceTab[];
  mainContent: string; // HTML content
  sidebarTitle: string;
  sidebarLinks: SidebarLink[];
}

export interface ComplianceTab {
  id: string;
  label: string;
  content: string; // HTML content
}

export interface SidebarLink {
  label: string;
  href?: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-compliance-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Breadcrumb Navigation -->
      <nav class="bg-white border-b-4 border-slate-300">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <ol class="flex items-center gap-3 text-sm font-semibold">
            <li>
              <a
                href="/"
                class="text-slate-900 hover:text-teal-600 transition-colors duration-200"
              >
                KAPIFY
              </a>
            </li>
            @for (crumb of breadcrumbs; track $index) {
            <li class="flex items-center gap-3">
              <lucide-icon
                [img]="ChevronRightIcon"
                [size]="18"
                class="text-slate-400"
              />
              @if ($last) {
              <span class="text-slate-900 font-black">{{ crumb }}</span>
              } @else {
              <a
                href="#"
                class="text-slate-600 hover:text-teal-600 transition-colors duration-200"
                >{{ crumb }}</a
              >
              }
            </li>
            }
          </ol>
        </div>
      </nav>

      <!-- Hero Section - Bold Neo-Brutalist -->
      <section
        class="relative bg-slate-900 text-white pt-24 pb-16 overflow-hidden"
      >
        <div class="absolute inset-0 overflow-hidden">
          <div
            class="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse"
          ></div>
          <div
            class="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl"
          ></div>
        </div>

        <div class="relative max-w-7xl mx-auto px-6">
          <div
            class="max-w-3xl space-y-6 animate-fade-in"
            style="animation: fadeIn 600ms ease-out forwards"
          >
            <div class="space-y-2">
              <div
                class="inline-block px-4 py-2 bg-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-lg border-2 border-teal-400 mb-4"
              >
                COMPLIANCE DOCUMENTATION
              </div>
              <h1
                class="text-5xl lg:text-6xl font-black leading-tight tracking-tight"
              >
                {{ pageData.title }}
              </h1>
            </div>

            <p class="text-lg text-slate-300 font-semibold max-w-2xl">
              {{ pageData.subtitle }}
            </p>

            @if (pageData.ctaLabel) {
            <a
              [href]="pageData.ctaUrl || '#'"
              class="inline-block px-8 py-4 bg-teal-600 text-white font-black uppercase tracking-wide rounded-lg border-3 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 mt-6"
            >
              {{ pageData.ctaLabel }}
            </a>
            }
          </div>
        </div>
      </section>

      <!-- Tab Navigation - Bold Border -->
      <div
        class="bg-white border-b-4 border-slate-300 sticky top-0 z-40"
        style="animation: slideDown 400ms ease-out"
      >
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex gap-8 overflow-x-auto scrollbar-hide">
            @for (tab of pageData.tabs; track tab.id) {
            <button
              (click)="selectTab(tab.id)"
              [class.bg-teal-50]="activeTab === tab.id"
              [class.border-b-4]="activeTab === tab.id"
              [class.border-teal-600]="activeTab === tab.id"
              [class.text-slate-900]="activeTab === tab.id"
              [class.font-black]="activeTab === tab.id"
              [class.border-b-2]="activeTab !== tab.id"
              [class.border-slate-200]="activeTab !== tab.id"
              [class.text-slate-600]="activeTab !== tab.id"
              [class.font-semibold]="activeTab !== tab.id"
              class="px-2 py-4 transition-all duration-200 whitespace-nowrap text-sm uppercase tracking-wide"
              style="animation: slideUp 300ms ease-out"
            >
              {{ tab.label }}
            </button>
            }
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="max-w-7xl mx-auto px-6 py-20">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <!-- Left: Content Area with Rich Prose -->
          <div class="lg:col-span-2 space-y-12">
            @if (activeTab === 'overview') {
            <div
              class="prose-neobrutalist max-w-none"
              [innerHTML]="pageData.mainContent"
              style="animation: fadeInUp 600ms ease-out forwards"
            ></div>
            } @else { @for (tab of pageData.tabs; track tab.id) { @if (tab.id
            === activeTab) {
            <div
              class="prose-neobrutalist max-w-none"
              [innerHTML]="tab.content"
              style="animation: fadeInUp 600ms ease-out forwards"
            ></div>
            } } }
          </div>

          <!-- Right: Bold Sidebar -->
          <div class="lg:col-span-1">
            <!-- Resources Card -->
            <div
              class="bg-white rounded-lg border-3 border-slate-300 p-8 sticky top-32 space-y-6 transition-all duration-200 hover:border-teal-400"
              style="animation: slideInRight 500ms ease-out forwards"
            >
              <div class="space-y-2">
                <h3
                  class="text-2xl font-black text-slate-900 uppercase tracking-tight"
                >
                  {{ pageData.sidebarTitle }}
                </h3>
                <div class="w-12 h-1 bg-teal-600 rounded-full"></div>
              </div>

              <ul class="space-y-4">
                @for (link of pageData.sidebarLinks; track link.label) {
                <li
                  class="group"
                  style="animation: slideInRight 500ms ease-out forwards; animation-delay: calc(var(--index) * 50ms)"
                >
                  @if (link.href) {
                  <a
                    [href]="link.href"
                    class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200"
                    [class.bg-teal-50]="link.highlight"
                    [class.border-teal-400]="link.highlight"
                    [class.text-teal-900]="link.highlight"
                    [class.font-bold]="link.highlight"
                    [class.border-slate-200]="!link.highlight"
                    [class.text-slate-700]="!link.highlight"
                    [class.font-semibold]="!link.highlight"
                    [class.hover:bg-slate-100]="!link.highlight"
                  >
                    <span class="text-sm">{{ link.label }}</span>
                    @if (link.href && !link.href.startsWith('#')) {
                    <lucide-icon
                      [img]="ChevronRightIcon"
                      [size]="16"
                      class="group-hover:translate-x-1 transition-transform duration-200"
                    />
                    }
                  </a>
                  } @else {
                  <span
                    class="block px-4 py-3 text-slate-900 text-sm font-black uppercase tracking-widest"
                  >
                    {{ link.label }}
                  </span>
                  }
                </li>
                }
              </ul>

              <!-- Quick Contact Box -->
              <div
                class="bg-slate-100 rounded-lg border-3 border-slate-300 p-6 space-y-4 mt-8 pt-8 border-t-4"
              >
                <h4 class="text-lg font-black text-slate-900 uppercase">
                  Questions?
                </h4>
                <p class="text-sm text-slate-700 font-semibold leading-relaxed">
                  Contact our compliance team for support.
                </p>
                <a
                  href="mailto:compliance@kapify.africa"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg border-2 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 font-black text-sm uppercase tracking-wide"
                >
                  EMAIL US
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer
        class="bg-slate-900 text-slate-300 py-16 border-t-4 border-slate-700"
      >
        <div class="max-w-7xl mx-auto px-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div class="space-y-4">
              <h4
                class="text-white font-black text-sm uppercase tracking-widest"
              >
                Compliance
              </h4>
              <ul class="space-y-3">
                <li>
                  <a
                    href="/compliance/privacy"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/compliance/terms"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/compliance/security"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Data Security
                  </a>
                </li>
              </ul>
            </div>

            <div class="space-y-4">
              <h4
                class="text-white font-black text-sm uppercase tracking-widest"
              >
                Legal
              </h4>
              <ul class="space-y-3">
                <li>
                  <a
                    href="/compliance/tax-compliance"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Tax Compliance
                  </a>
                </li>
                <li>
                  <a
                    href="/compliance/aml-kyc"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    AML/KYC
                  </a>
                </li>
                <li>
                  <a
                    href="/compliance/cookies"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Cookies
                  </a>
                </li>
              </ul>
            </div>

            <div class="space-y-4">
              <h4
                class="text-white font-black text-sm uppercase tracking-widest"
              >
                Support
              </h4>
              <ul class="space-y-3">
                <li>
                  <a
                    href="mailto:support@kapify.africa"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:compliance@kapify.africa"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Compliance
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Back to Home
                  </a>
                </li>
              </ul>
            </div>

            <div class="space-y-4">
              <h4
                class="text-white font-black text-sm uppercase tracking-widest"
              >
                Company
              </h4>
              <ul class="space-y-3">
                <li>
                  <a
                    href="/pricing"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="/marketplace"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    Marketplace
                  </a>
                </li>
                <li>
                  <a
                    href="/"
                    class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
                  >
                    About
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            class="border-t-4 border-slate-700 pt-8 text-xs text-center font-semibold uppercase tracking-widest"
          >
            <p>
              &copy; {{ currentYear }} Kapify Africa. All rights reserved. |
              <a href="#" class="hover:text-teal-400 transition-colors"
                >Sitemap</a
              >
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styleUrl: './compliance-layout.component.css',
})
export class ComplianceLayoutComponent implements OnInit {
  @Input() pageData!: CompliancePage;

  activeTab = 'overview';
  breadcrumbs: string[] = [];
  ChevronRightIcon = ChevronRight;
  AlertCircleIcon = AlertCircle;
  currentYear = new Date().getFullYear();

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.breadcrumbs = this.pageData.breadcrumb;
    this.activeTab = 'overview';
  }

  selectTab(tabId: string) {
    this.activeTab = tabId;
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}
