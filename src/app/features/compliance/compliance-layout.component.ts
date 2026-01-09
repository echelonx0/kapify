import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ChevronRight } from 'lucide-angular';

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
    <div class="min-h-screen bg-teal-50">
      <!-- Breadcrumb Navigation -->
      <nav class="bg-white border-b border-teal-200">
        <div class="max-w-7xl mx-auto px-6 py-3 text-sm text-teal-600">
          <ol class="flex items-center gap-2">
            <li>
              <a href="/" class="hover:text-teal-900 transition-colors"
                >Kapify</a
              >
            </li>
            @for (crumb of breadcrumbs; track $index) {
            <li class="flex items-center gap-2">
              <lucide-icon
                [img]="ChevronRightIcon"
                [size]="16"
                class="text-teal-400"
              />
              @if ($last) {
              <span class="text-teal-900 font-medium">{{ crumb }}</span>
              } @else {
              <a href="#" class="hover:text-teal-900 transition-colors">{{
                crumb
              }}</a>
              }
            </li>
            }
          </ol>
        </div>
      </nav>

      <!-- Hero Section -->
      <section
        class="relative bg-teal-900 text-white overflow-hidden pt-20 pb-12"
      >
        <!-- Background animation -->
        <div class="absolute inset-0">
          <div
            class="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
          ></div>
          <div
            class="absolute -bottom-10 -left-10 w-96 h-96 bg-teal-700/20 rounded-full blur-3xl"
          ></div>
        </div>

        <!-- Content -->
        <div class="relative max-w-7xl mx-auto px-6">
          <div class="max-w-2xl">
            <h1 class="text-5xl lg:text-6xl font-black mb-4 leading-tight">
              {{ pageData.title }}
            </h1>
            <p class="text-lg text-teal-300 mb-8">
              {{ pageData.subtitle }}
            </p>
            @if (pageData.ctaLabel) {
            <a
              [href]="pageData.ctaUrl || '#'"
              class="inline-block px-8 py-3 bg-white text-teal-900 font-bold rounded-full hover:bg-teal-100 transition-all"
            >
              {{ pageData.ctaLabel }}
            </a>
            }
          </div>
        </div>
      </section>

      <!-- Tab Navigation -->
      <div class="bg-white border-b border-teal-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex gap-8 overflow-x-auto scrollbar-hide">
            @for (tab of pageData.tabs; track tab.id) {
            <button
              (click)="selectTab(tab.id)"
              [class.border-teal-500]="activeTab === tab.id"
              [class.text-teal-900]="activeTab === tab.id"
              [class.border-transparent]="activeTab !== tab.id"
              [class.text-teal-600]="activeTab !== tab.id"
              class="px-1 py-4 border-b-2 transition-all whitespace-nowrap font-medium text-sm"
            >
              {{ tab.label }}
            </button>
            }
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-6 py-16">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <!-- Left: Main Content -->
          <div class="lg:col-span-2 space-y-8">
            @if (activeTab === 'overview') {
            <div
              class="prose prose-teal max-w-none"
              [innerHTML]="pageData.mainContent"
            ></div>
            } @else { @for (tab of pageData.tabs; track tab.id) { @if (tab.id
            === activeTab) {
            <div
              class="prose prose-teal max-w-none"
              [innerHTML]="tab.content"
            ></div>
            } } }
          </div>

          <!-- Right: Sidebar -->
          <div class="lg:col-span-1">
            <!-- Resources Sidebar -->
            <div
              class="bg-white rounded-2xl border border-teal-200 p-6 sticky top-24"
            >
              <h3 class="text-lg font-bold text-teal-900 mb-6">
                {{ pageData.sidebarTitle }}
              </h3>
              <ul class="space-y-3">
                @for (link of pageData.sidebarLinks; track link.label) {
                <li>
                  @if (link.href) {
                  <a
                    [href]="link.href"
                    [class.text-teal-600]="link.highlight"
                    [class.text-teal-700]="!link.highlight"
                    class="hover:text-teal-600 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    {{ link.label }}
                    @if (link.href && !link.href.startsWith('#')) {
                    <lucide-icon [img]="ChevronRightIcon" [size]="14" />
                    }
                  </a>
                  } @else {
                  <span class="text-teal-700 text-sm font-medium">{{
                    link.label
                  }}</span>
                  }
                </li>
                }
              </ul>

              <!-- Quick Contact -->
              <div
                class="bg-teal-50 rounded-2xl border border-teal-200 p-6 mt-6"
              >
                <h4 class="text-sm font-bold text-teal-900 mb-3">Questions?</h4>
                <p class="text-sm text-teal-600 mb-4">
                  Contact our compliance team for more information.
                </p>
                <a
                  href="mailto:compliance@kapify.africa"
                  class="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm font-medium"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="bg-teal-900 text-teal-400 py-12 border-t border-teal-800">
        <div class="max-w-7xl mx-auto px-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 class="text-white font-bold text-sm mb-4">Compliance</h4>
              <ul class="space-y-2 text-sm">
                <li>
                  <a
                    href="/compliance/privacy"
                    class="hover:text-white transition-colors"
                    >Privacy Policy</a
                  >
                </li>
                <li>
                  <a
                    href="/compliance/terms"
                    class="hover:text-white transition-colors"
                    >Terms of Service</a
                  >
                </li>
                <li>
                  <a
                    href="/compliance/security"
                    class="hover:text-white transition-colors"
                    >Data Security</a
                  >
                </li>
              </ul>
            </div>
            <div>
              <h4 class="text-white font-bold text-sm mb-4">Legal</h4>
              <ul class="space-y-2 text-sm">
                <li>
                  <a
                    href="/compliance/tax-compliance"
                    class="hover:text-white transition-colors"
                    >Tax Compliance</a
                  >
                </li>
                <li>
                  <a
                    href="/compliance/aml-kyc"
                    class="hover:text-white transition-colors"
                    >AML/KYC</a
                  >
                </li>
                <li>
                  <a
                    href="/compliance/cookies"
                    class="hover:text-white transition-colors"
                    >Cookies</a
                  >
                </li>
              </ul>
            </div>
            <div>
              <h4 class="text-white font-bold text-sm mb-4">Support</h4>
              <ul class="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:support@kapify.africa"
                    class="hover:text-white transition-colors"
                    >Support</a
                  >
                </li>
                <li>
                  <a
                    href="mailto:compliance@kapify.africa"
                    class="hover:text-white transition-colors"
                    >Compliance</a
                  >
                </li>
                <li>
                  <a href="/" class="hover:text-white transition-colors"
                    >Back to Home</a
                  >
                </li>
              </ul>
            </div>
            <div>
              <h4 class="text-white font-bold text-sm mb-4">Company</h4>
              <ul class="space-y-2 text-sm">
                <li>
                  <a href="/pricing" class="hover:text-white transition-colors"
                    >Pricing</a
                  >
                </li>
                <li>
                  <a
                    href="/marketplace"
                    class="hover:text-white transition-colors"
                    >Marketplace</a
                  >
                </li>
                <li>
                  <a href="/" class="hover:text-white transition-colors"
                    >About</a
                  >
                </li>
              </ul>
            </div>
          </div>
          <div class="border-t border-teal-800 pt-8 text-sm text-center">
            <p>
              &copy; {{ currentYear }} Kapify. All rights reserved. |
              <a href="#" class="hover:text-white">Sitemap</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }

      .prose {
        --tw-prose-body: rgb(51 65 85);
        --tw-prose-headings: rgb(15 23 42);
        --tw-prose-lead: rgb(71 85 99);
        --tw-prose-links: rgb(15 118 110);
        --tw-prose-bold: rgb(15 23 42);
        --tw-prose-counters: rgb(100 116 139);
        --tw-prose-bullets: rgb(100 116 139);
        --tw-prose-hr: rgb(226 232 240);
        --tw-prose-quotes: rgb(51 65 85);
        --tw-prose-quote-borders: rgb(226 232 240);
        --tw-prose-captions: rgb(71 85 99);
        --tw-prose-code: rgb(15 23 42);
        --tw-prose-pre-code: rgb(226 232 240);
        --tw-prose-pre-bg: rgb(15 23 42);
        --tw-prose-th-borders: rgb(203 213 225);
        --tw-prose-td-borders: rgb(226 232 240);
      }
    `,
  ],
})
export class ComplianceLayoutComponent implements OnInit {
  @Input() pageData!: CompliancePage;

  activeTab = 'overview';
  breadcrumbs: string[] = [];
  ChevronRightIcon = ChevronRight;
  currentYear = new Date().getFullYear();

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.breadcrumbs = this.pageData.breadcrumb;
    this.activeTab = 'overview';
  }

  selectTab(tabId: string) {
    this.activeTab = tabId;
    // Scroll to top of content
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
}
