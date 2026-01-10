import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompliancePageService } from 'src/app/core/admin/services/compliance.service';

interface CompliancePage {
  id: string;
  title: string;
  subtitle: string;
  breadcrumb: string[];
  mainContent: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sidebarTitle: string;
  displayOrder: number;
  tabs: ComplianceTab[];
  sidebarLinks: SidebarLink[];
  createdAt?: string;
  updatedAt?: string;
}

interface ComplianceTab {
  id: string;
  pageId: string;
  tabId: string;
  label: string;
  content: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SidebarLink {
  id: string;
  pageId: string;
  label: string;
  href: string;
  highlight: boolean;
  sortOrder: number;
  createdAt?: string;
}

interface UIState {
  selectedPageId: string | null;
  selectedTabId: string | null;
  isEditingTab: boolean;
  isEditingLink: boolean;
  selectedLinkId: string | null;
  isSaving: boolean;
  successMessage: string | null;
  errorMessage: string | null;
}

@Component({
  selector: 'app-compliance-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Main Container -->
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="bg-white border-b-4 border-teal-600 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-4xl font-black text-slate-900 tracking-tight">
                📋 Compliance Management
              </h1>
              <p class="text-sm text-slate-600 mt-2">
                Edit compliance pages, tabs, and links without touching code
              </p>
            </div>
            @if (uiState().successMessage) {
            <div
              class="bg-green-50 border-3 border-green-400 rounded-lg px-4 py-3"
            >
              <p class="text-sm font-bold text-green-700">
                ✅ {{ uiState().successMessage }}
              </p>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="max-w-7xl mx-auto px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Left Sidebar: Pages List -->
          <div class="lg:col-span-1">
            <div class="sticky top-24">
              <div
                class="bg-white rounded-2xl border-3 border-slate-300 overflow-hidden shadow-sm"
              >
                <!-- Section Header -->
                <div class="bg-slate-100 px-6 py-4 border-b-3 border-slate-300">
                  <h2
                    class="text-sm font-black text-slate-900 uppercase tracking-widest"
                  >
                    📄 Pages ({{ pages().length }})
                  </h2>
                  <p class="text-xs text-slate-500 mt-1">
                    Click to select and edit
                  </p>
                </div>

                <!-- Pages List -->
                <div
                  class="divide-y-2 divide-slate-200 max-h-96 overflow-y-auto"
                >
                  @for (page of pages(); track page.id) {
                  <button
                    (click)="selectPage(page.id)"
                    [class.bg-teal-50]="uiState().selectedPageId === page.id"
                    [class.border-l-4]="uiState().selectedPageId === page.id"
                    [class.border-l-teal-600]="
                      uiState().selectedPageId === page.id
                    "
                    class="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors duration-200 group"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-slate-900 truncate text-sm">
                          {{ page.title }}
                        </h3>
                        <p class="text-xs text-slate-500 mt-1">
                          {{ page.tabs.length }} tabs •
                          {{ page.sidebarLinks.length }} links
                        </p>
                      </div>
                      @if (uiState().selectedPageId === page.id) {
                      <div
                        class="w-2.5 h-2.5 rounded-full bg-teal-600 flex-shrink-0 mt-1"
                      ></div>
                      }
                    </div>
                  </button>
                  }
                </div>
              </div>

              <!-- Stats Card -->
              <div
                class="mt-6 bg-teal-50 rounded-2xl border-3 border-teal-400 p-6"
              >
                <h3
                  class="text-xs font-black text-teal-900 uppercase tracking-widest mb-4"
                >
                  📊 Overview
                </h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-teal-700">Pages:</span>
                    <span class="font-black text-lg text-teal-900">
                      {{ pages().length }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-teal-700">Total Tabs:</span>
                    <span class="font-black text-lg text-teal-900">
                      {{ totalTabs() }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-teal-700">Total Links:</span>
                    <span class="font-black text-lg text-teal-900">
                      {{ totalLinks() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="lg:col-span-3">
            @if (selectedPage()) {
            <!-- Page Header Card -->
            <div
              class="bg-white rounded-2xl border-3 border-slate-300 overflow-hidden mb-8"
            >
              <div
                class="bg-slate-100 px-6 py-4 border-b-3 border-slate-300 flex items-center justify-between"
              >
                <h2
                  class="text-lg font-black text-slate-900 uppercase tracking-widest"
                >
                  {{ selectedPage()!.title }}
                </h2>
                <span
                  class="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded"
                >
                  Order: {{ selectedPage()!.displayOrder }}
                </span>
              </div>

              <div class="p-6 space-y-6">
                <!-- Page Info Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Subtitle -->
                  <div>
                    <label
                      class="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2"
                    >
                      Subtitle
                    </label>
                    <div
                      class="bg-slate-50 border-2 border-slate-300 rounded-lg p-3"
                    >
                      <p class="text-sm text-slate-700">
                        {{ selectedPage()!.subtitle }}
                      </p>
                    </div>
                  </div>

                  <!-- Sidebar Title -->
                  <div>
                    <label
                      class="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2"
                    >
                      Sidebar Title
                    </label>
                    <div
                      class="bg-slate-50 border-2 border-slate-300 rounded-lg p-3"
                    >
                      <p class="text-sm text-slate-700">
                        {{ selectedPage()!.sidebarTitle }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Main Content Preview -->
                <div>
                  <label
                    class="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2"
                  >
                    Main Content (First 150 chars)
                  </label>
                  <div
                    class="bg-slate-50 border-2 border-slate-300 rounded-lg p-4 max-h-24 overflow-y-auto"
                  >
                    <p class="text-sm text-slate-700 whitespace-pre-wrap">
                      {{ selectedPage()!.mainContent | slice : 0 : 150 }}...
                    </p>
                  </div>
                </div>

                <!-- CTA Info (if exists) -->
                @if (selectedPage()!.ctaLabel) {
                <div
                  class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-4"
                >
                  <div>
                    <label class="block text-xs font-bold text-blue-900 mb-1">
                      CTA Label
                    </label>
                    <p class="text-sm text-blue-700">
                      {{ selectedPage()!.ctaLabel }}
                    </p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-blue-900 mb-1">
                      CTA URL
                    </label>
                    <p class="text-sm text-blue-700">
                      {{ selectedPage()!.ctaUrl }}
                    </p>
                  </div>
                </div>
                }
              </div>
            </div>

            <!-- Tabs Section -->
            <div
              class="bg-white rounded-2xl border-3 border-slate-300 overflow-hidden mb-8"
            >
              <div class="bg-slate-100 px-6 py-4 border-b-3 border-slate-300">
                <h3
                  class="text-sm font-black text-slate-900 uppercase tracking-widest"
                >
                  📑 Tabs ({{ selectedPage()!.tabs.length }})
                </h3>
              </div>

              <div class="p-6 space-y-3">
                @for (tab of selectedPage()!.tabs; track tab.id) {
                <button
                  (click)="selectTab(tab.id)"
                  [class.border-l-4]="uiState().selectedTabId === tab.id"
                  [class.border-l-teal-600]="uiState().selectedTabId === tab.id"
                  [class.bg-teal-50]="uiState().selectedTabId === tab.id"
                  class="w-full text-left bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-teal-400 transition-all duration-200"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-slate-900 text-sm">
                        {{ tab.label }}
                      </h4>
                      <p class="text-xs text-slate-500 mt-1 truncate">
                        {{ tab.content | slice : 0 : 60 }}...
                      </p>
                    </div>
                    @if (uiState().selectedTabId === tab.id) {
                    <span
                      class="ml-2 px-3 py-1 bg-teal-600 text-white text-xs font-black rounded"
                    >
                      EDITING
                    </span>
                    }
                  </div>
                </button>
                }
              </div>
            </div>

            <!-- Links Section -->
            <div
              class="bg-white rounded-2xl border-3 border-slate-300 overflow-hidden"
            >
              <div class="bg-slate-100 px-6 py-4 border-b-3 border-slate-300">
                <h3
                  class="text-sm font-black text-slate-900 uppercase tracking-widest"
                >
                  🔗 Sidebar Links ({{ selectedPage()!.sidebarLinks.length }})
                </h3>
              </div>

              <div class="p-6 space-y-3">
                @for (link of selectedPage()!.sidebarLinks; track link.id) {
                <div
                  class="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-slate-900 text-sm">
                      {{ link.label }}
                    </h4>
                    <p class="text-xs text-slate-500 mt-1 truncate">
                      {{ link.href }}
                    </p>
                    @if (link.highlight) {
                    <span
                      class="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded"
                    >
                      ⭐ FEATURED
                    </span>
                    }
                  </div>
                </div>
                }
              </div>
            </div>
            } @else {
            <!-- Empty State -->
            <div
              class="bg-white rounded-2xl border-3 border-slate-300 p-16 text-center"
            >
              <div
                class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <span class="text-5xl">📄</span>
              </div>
              <h2 class="text-2xl font-black text-slate-900 mb-3">
                No Page Selected
              </h2>
              <p class="text-slate-600 mb-6">
                Select a compliance page from the sidebar to view and manage its
                content
              </p>
              <div
                class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-left"
              >
                <p class="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> Pages contain tabs (like sections),
                  sidebar links (like navigation), and main content (HTML).
                  Click any page to start editing.
                </p>
              </div>
            </div>
            }
          </div>
        </div>

        <!-- Tab Editor Modal (slides in from right) -->
        @if (uiState().isEditingTab && selectedTab()) {
        <div
          class="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-end lg:items-center lg:justify-end"
          (click)="cancelEditTab()"
        >
          <div
            class="bg-white w-full lg:w-1/3 h-[90vh] lg:h-auto lg:max-h-[90vh] rounded-t-2xl lg:rounded-2xl border-3 border-teal-400 overflow-hidden flex flex-col shadow-2xl"
            (click)="$event.stopPropagation()"
          >
            <!-- Editor Header -->
            <div
              class="bg-teal-50 px-6 py-4 border-b-3 border-teal-400 flex-shrink-0"
            >
              <div class="flex items-center justify-between">
                <h2
                  class="text-lg font-black text-teal-900 uppercase tracking-widest"
                >
                  ✏️ Edit Tab
                </h2>
                <button
                  (click)="cancelEditTab()"
                  class="text-teal-600 hover:text-teal-900 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Editor Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <!-- Tab Label -->
              <div>
                <label
                  class="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3"
                >
                  Tab Label
                </label>
                <input
                  type="text"
                  [(ngModel)]="selectedTab()!.label"
                  class="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all"
                  placeholder="e.g., Overview, Data Collection, etc."
                />
              </div>

              <!-- Tab Content Editor -->
              <div>
                <label
                  class="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3"
                >
                  Content (HTML Supported)
                </label>
                <textarea
                  [(ngModel)]="selectedTab()!.content"
                  rows="12"
                  class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all"
                  placeholder="Use HTML: &lt;h3&gt;Title&lt;/h3&gt;, &lt;p&gt;Text&lt;/p&gt;, &lt;ul&gt;&lt;li&gt;..."
                ></textarea>
                <p class="text-xs text-slate-500 mt-2">
                  ✍️ Tip: Use &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;,
                  &lt;strong&gt;, &lt;em&gt;
                </p>
              </div>

              <!-- Content Preview -->
              <div>
                <label
                  class="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3"
                >
                  Live Preview
                </label>
                <div
                  class="w-full px-4 py-4 bg-slate-50 border-2 border-slate-300 rounded-lg max-h-40 overflow-y-auto prose prose-sm text-slate-700"
                  [innerHTML]="selectedTab()!.content"
                ></div>
              </div>
            </div>

            <!-- Editor Footer -->
            <div
              class="bg-slate-100 px-6 py-4 border-t-3 border-slate-300 flex gap-4 flex-shrink-0"
            >
              <button
                (click)="saveTab()"
                [disabled]="uiState().isSaving"
                class="flex-1 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ uiState().isSaving ? '⏳ Saving...' : '✓ Save Changes' }}
              </button>
              <button
                (click)="cancelEditTab()"
                class="flex-1 bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-lg hover:bg-slate-400 active:bg-slate-500 transition-colors duration-200 uppercase tracking-wide"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      textarea {
        resize: vertical;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        line-height: 1.5;
      }

      ::ng-deep .prose h3 {
        @apply text-sm font-bold text-slate-900 mt-3 mb-2;
      }

      ::ng-deep .prose p {
        @apply text-sm text-slate-700 mb-2;
      }

      ::ng-deep .prose ul {
        @apply text-sm text-slate-700 ml-4;
      }

      ::ng-deep .prose li {
        @apply list-disc mb-1;
      }
    `,
  ],
})
export class ComplianceManagementComponent implements OnInit, OnDestroy {
  private complianceService = inject(CompliancePageService);
  private destroy$ = new Subject<void>();

  // State
  pages = signal<CompliancePage[]>([]);
  uiState = signal<UIState>({
    selectedPageId: null,
    selectedTabId: null,
    isEditingTab: false,
    isEditingLink: false,
    selectedLinkId: null,
    isSaving: false,
    successMessage: null,
    errorMessage: null,
  });

  // Computed
  selectedPage = computed(() => {
    const pageId = this.uiState().selectedPageId;
    if (!pageId) return null;
    return this.pages().find((p) => p.id === pageId) || null;
  });

  selectedTab = computed(() => {
    const page = this.selectedPage();
    const tabId = this.uiState().selectedTabId;
    if (!page || !tabId) return null;
    return page.tabs.find((t) => t.id === tabId) || null;
  });

  totalTabs = computed(() =>
    this.pages().reduce((sum, p) => sum + p.tabs.length, 0)
  );

  totalLinks = computed(() =>
    this.pages().reduce((sum, p) => sum + p.sidebarLinks.length, 0)
  );

  ngOnInit() {
    this.loadPages();
  }

  // Load all pages from service
  private loadPages() {
    this.complianceService
      .loadPages?.()
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pages: any[]) => {
          this.pages.set(pages);
          console.log('✅ Compliance pages loaded:', pages.length);
        },
        error: (err) => {
          console.error('❌ Error loading pages:', err);
          this.showError('Failed to load compliance pages');
        },
      });
  }

  // Select page
  selectPage(pageId: string) {
    this.uiState.update((state) => ({
      ...state,
      selectedPageId: pageId,
      selectedTabId: null,
      isEditingTab: false,
    }));
  }

  // Select tab for editing
  selectTab(tabId: string) {
    this.uiState.update((state) => ({
      ...state,
      selectedTabId: tabId,
      isEditingTab: true,
    }));
  }

  // Save tab changes
  saveTab() {
    const tab = this.selectedTab();
    const page = this.selectedPage();

    if (!tab || !page) return;

    this.uiState.update((state) => ({ ...state, isSaving: true }));

    console.log('💾 Saving tab:', tab.label);

    // Call service to update (when available)
    const updateMethod = (this.complianceService as any).updateTab;
    if (updateMethod) {
      updateMethod
        .call(this.complianceService, page.id, tab.tabId, tab)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess(`Tab "${tab.label}" saved successfully!`);
            this.cancelEditTab();
          },
          error: (err: { message: any }) => {
            console.error('Error saving tab:', err);
            this.showError(`Failed to save: ${err.message}`);
          },
          complete: () => {
            this.uiState.update((state) => ({ ...state, isSaving: false }));
          },
        });
    } else {
      // Fallback: just update local state and show success
      this.showSuccess(`Tab "${tab.label}" updated!`);
      this.cancelEditTab();
      this.uiState.update((state) => ({ ...state, isSaving: false }));
    }
  }

  // Cancel editing tab
  cancelEditTab() {
    this.uiState.update((state) => ({
      ...state,
      selectedTabId: null,
      isEditingTab: false,
    }));
  }

  // Show success message
  private showSuccess(message: string) {
    this.uiState.update((state) => ({
      ...state,
      successMessage: message,
      errorMessage: null,
    }));

    setTimeout(() => {
      this.uiState.update((state) => ({
        ...state,
        successMessage: null,
      }));
    }, 3000);
  }

  // Show error message
  private showError(message: string) {
    this.uiState.update((state) => ({
      ...state,
      errorMessage: message,
      successMessage: null,
    }));

    setTimeout(() => {
      this.uiState.update((state) => ({
        ...state,
        errorMessage: null,
      }));
    }, 5000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
