// import { Component, Input, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { LucideAngularModule, ChevronRight } from 'lucide-angular';

// // Simple interface without tabs
// export interface CompliancePage {
//   id: string;
//   title: string;
//   subtitle: string;
//   breadcrumb: string[];
//   mainContent: string; // HTML content
//   ctaLabel?: string;
//   ctaUrl?: string;
//   sidebarTitle: string;
//   sidebarLinks: SidebarLink[];
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
//     <div class="min-h-screen bg-slate-50">
//       <!-- Breadcrumb Navigation -->
//       <nav class="bg-white border-b-4 border-slate-300">
//         <div class="max-w-7xl mx-auto px-6 py-4">
//           <ol class="flex items-center gap-3 text-sm font-semibold">
//             <li>
//               <a
//                 href="/"
//                 class="text-slate-900 hover:text-teal-600 transition-colors duration-200"
//               >
//                 KAPIFY
//               </a>
//             </li>
//             @for (crumb of breadcrumbs; track $index) {
//               <li class="flex items-center gap-3">
//                 <lucide-icon
//                   [img]="ChevronRightIcon"
//                   [size]="18"
//                   class="text-slate-400"
//                 />
//                 @if ($last) {
//                   <span class="text-slate-900 font-black">{{ crumb }}</span>
//                 } @else {
//                   <a
//                     href="#"
//                     class="text-slate-600 hover:text-teal-600 transition-colors duration-200"
//                     >{{ crumb }}</a
//                   >
//                 }
//               </li>
//             }
//           </ol>
//         </div>
//       </nav>

//       <!-- Hero Section - Bold Neo-Brutalist -->
//       <section
//         class="relative bg-slate-900 text-white pt-24 pb-16 overflow-hidden"
//       >
//         <div class="absolute inset-0 overflow-hidden">
//           <div
//             class="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse"
//           ></div>
//           <div
//             class="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl"
//           ></div>
//         </div>

//         <div class="relative max-w-7xl mx-auto px-6">
//           <div class="max-w-3xl space-y-6">
//             <div class="space-y-2">
//               <div
//                 class="inline-block px-4 py-2 bg-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-lg border-2 border-teal-400 mb-4"
//               >
//                 COMPLIANCE DOCUMENTATION
//               </div>
//               <h1
//                 class="text-5xl lg:text-6xl font-black leading-tight tracking-tight"
//               >
//                 {{ pageData.title }}
//               </h1>
//             </div>

//             <p class="text-lg text-slate-300 font-semibold max-w-2xl">
//               {{ pageData.subtitle }}
//             </p>

//             @if (pageData.ctaLabel && pageData.ctaUrl) {
//               <a
//                 [href]="pageData.ctaUrl"
//                 class="inline-block px-8 py-4 bg-teal-600 text-white font-black uppercase tracking-wide rounded-lg border-3 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 mt-6"
//               >
//                 {{ pageData.ctaLabel }}
//               </a>
//             }
//           </div>
//         </div>
//       </section>

//       <!-- Main Content Grid -->
//       <div class="max-w-7xl mx-auto px-6 py-20">
//         <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
//           <!-- Left: Content Area with Rich Prose -->
//           <div class="lg:col-span-2 space-y-12">
//             <div
//               class="prose-neobrutalist max-w-none prose prose-lg"
//               [innerHTML]="pageData.mainContent"
//             ></div>
//           </div>

//           <!-- Right: Bold Sidebar -->
//           <div class="lg:col-span-1">
//             <!-- Resources Card -->
//             <div
//               class="bg-white rounded-lg border-3 border-slate-300 p-8 sticky top-32 space-y-6 transition-all duration-200 hover:border-teal-400"
//             >
//               <div class="space-y-2">
//                 <h3
//                   class="text-2xl font-black text-slate-900 uppercase tracking-tight"
//                 >
//                   {{ pageData.sidebarTitle }}
//                 </h3>
//                 <div class="w-12 h-1 bg-teal-600 rounded-full"></div>
//               </div>

//               <ul class="space-y-4">
//                 @for (link of pageData.sidebarLinks; track link.label) {
//                   <li class="group">
//                     @if (link.href) {
//                       <a
//                         [href]="link.href"
//                         class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200"
//                         [class.bg-teal-50]="link.highlight"
//                         [class.border-teal-400]="link.highlight"
//                         [class.text-teal-900]="link.highlight"
//                         [class.font-bold]="link.highlight"
//                         [class.border-slate-200]="!link.highlight"
//                         [class.text-slate-700]="!link.highlight"
//                         [class.font-semibold]="!link.highlight"
//                         [class.hover:bg-slate-100]="!link.highlight"
//                       >
//                         <span class="text-sm">{{ link.label }}</span>
//                         @if (link.href && !link.href.startsWith('#')) {
//                           <lucide-icon
//                             [img]="ChevronRightIcon"
//                             [size]="16"
//                             class="group-hover:translate-x-1 transition-transform duration-200"
//                           />
//                         }
//                       </a>
//                     } @else {
//                       <span
//                         class="block px-4 py-3 text-slate-900 text-sm font-black uppercase tracking-widest"
//                       >
//                         {{ link.label }}
//                       </span>
//                     }
//                   </li>
//                 }
//               </ul>

//               <!-- Quick Contact Box -->
//               <div
//                 class="bg-slate-100 rounded-lg border-3 border-slate-300 p-6 space-y-4 mt-8 pt-8 border-t-4"
//               >
//                 <h4 class="text-lg font-black text-slate-900 uppercase">
//                   Questions?
//                 </h4>
//                 <p class="text-sm text-slate-700 font-semibold leading-relaxed">
//                   Contact our compliance team for support.
//                 </p>
//                 <a
//                   href="mailto:compliance@kapify.africa"
//                   class="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg border-2 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 font-black text-sm uppercase tracking-wide"
//                 >
//                   EMAIL US
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <!-- Footer -->
//       <footer
//         class="bg-slate-900 text-slate-300 py-16 border-t-4 border-slate-700"
//       >
//         <div class="max-w-7xl mx-auto px-6">
//           <div class="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
//             <div class="space-y-4">
//               <h4
//                 class="text-white font-black text-sm uppercase tracking-widest"
//               >
//                 Compliance
//               </h4>
//               <ul class="space-y-3">
//                 <li>
//                   <a
//                     href="/compliance/privacy"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Privacy Policy
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/terms"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Terms of Service
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/security"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Data Security
//                   </a>
//                 </li>
//               </ul>
//             </div>

//             <div class="space-y-4">
//               <h4
//                 class="text-white font-black text-sm uppercase tracking-widest"
//               >
//                 Legal
//               </h4>
//               <ul class="space-y-3">
//                 <li>
//                   <a
//                     href="/compliance/tax-compliance"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Tax Compliance
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/aml-kyc"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     AML/KYC
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="/compliance/cookies"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Cookies
//                   </a>
//                 </li>
//               </ul>
//             </div>

//             <div class="space-y-4">
//               <h4
//                 class="text-white font-black text-sm uppercase tracking-widest"
//               >
//                 Support
//               </h4>
//               <ul class="space-y-3">
//                 <li>
//                   <a
//                     href="mailto:support@kapify.africa"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Support
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="mailto:compliance@kapify.africa"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Compliance
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="/"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Back to Home
//                   </a>
//                 </li>
//               </ul>
//             </div>

//             <div class="space-y-4">
//               <h4
//                 class="text-white font-black text-sm uppercase tracking-widest"
//               >
//                 Company
//               </h4>
//               <ul class="space-y-3">
//                 <li>
//                   <a
//                     href="/pricing"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Pricing
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="/marketplace"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     Marketplace
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href="/"
//                     class="text-sm font-semibold hover:text-teal-400 transition-colors duration-200"
//                   >
//                     About
//                   </a>
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div
//             class="border-t-4 border-slate-700 pt-8 text-xs text-center font-semibold uppercase tracking-widest"
//           >
//             <p>
//               &copy; {{ currentYear }} Kapify Africa. All rights reserved. |
//               <a href="#" class="hover:text-teal-400 transition-colors"
//                 >Sitemap</a
//               >
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   `,
//   styleUrl: './compliance-layout.component.css',
// })
// export class ComplianceLayoutComponent implements OnInit {
//   @Input() pageData!: CompliancePage;

//   ChevronRightIcon = ChevronRight;
//   breadcrumbs: string[] = [];
//   currentYear = new Date().getFullYear();

//   ngOnInit() {
//     this.breadcrumbs = this.pageData.breadcrumb || [];
//     console.log('✅ Compliance page loaded:', this.pageData.title);
//   }
// }

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronRight } from 'lucide-angular';

// Simple interface without tabs
export interface CompliancePage {
  id: string;
  title: string;
  subtitle: string;
  breadcrumb: string[];
  mainContent: string; // HTML content
  ctaLabel?: string;
  ctaUrl?: string;
  sidebarTitle: string;
  sidebarLinks: SidebarLink[];
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
          <div class="max-w-3xl space-y-6">
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

            @if (pageData.ctaLabel && pageData.ctaUrl) {
              <a
                [href]="pageData.ctaUrl"
                class="inline-block px-8 py-4 bg-teal-600 text-white font-black uppercase tracking-wide rounded-lg border-3 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 mt-6"
              >
                {{ pageData.ctaLabel }}
              </a>
            }
          </div>
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="max-w-7xl mx-auto px-6 py-20">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <!-- Left: Content Area with Slate Background -->
          <div class="lg:col-span-2">
            <div
              class="bg-slate-800 rounded-2xl border-3 border-slate-700 p-8 lg:p-12 space-y-8"
            >
              <!-- Content with justified text and white text -->
              <div
                class="prose prose-invert max-w-none
                [&_h2]:text-white [&_h2]:font-black [&_h2]:text-3xl [&_h2]:mb-6
                [&_h3]:text-white [&_h3]:font-bold [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-4
                [&_h4]:text-slate-100 [&_h4]:font-semibold [&_h4]:text-lg [&_h4]:mt-6 [&_h4]:mb-3
                [&_p]:text-slate-100 [&_p]:font-medium [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-justify
                [&_ul]:text-slate-100 [&_ul]:space-y-3 [&_ul]:ml-6 [&_ul]:mb-4
                [&_li]:text-slate-100 [&_li]:text-justify
                [&_strong]:text-white [&_strong]:font-bold
                [&_em]:text-slate-200
                [&_a]:text-teal-400 [&_a]:font-semibold [&_a]:hover:text-teal-300 [&_a]:transition-colors"
                [innerHTML]="pageData.mainContent"
              ></div>
            </div>
          </div>

          <!-- Right: Bold Sidebar -->
          <div class="lg:col-span-1">
            <!-- Resources Card -->
            <div
              class="bg-white rounded-lg border-3 border-slate-300 p-8 sticky top-32 space-y-6 transition-all duration-200 hover:border-teal-400"
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
                  <li class="group">
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

  ChevronRightIcon = ChevronRight;
  breadcrumbs: string[] = [];
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.breadcrumbs = this.pageData.breadcrumb || [];
    console.log('✅ Compliance page loaded:', this.pageData.title);
  }
}
