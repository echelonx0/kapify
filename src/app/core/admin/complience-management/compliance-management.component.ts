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
import { MessagingService } from 'src/app/features/messaging/services/messaging.service';

interface CompliancePage {
  id: string;
  title: string;
  subtitle: string;
  breadcrumb: string[];
  mainContent: string;
  sidebarTitle: string;
  displayOrder: number;
  tabs: ComplianceTab[];
  sidebarLinks: SidebarLink[];
  ctaLabel?: string;
  ctaUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface ComplianceTab {
  id: string;
  pageId: string;
  tabId: string;
  label: string;
  content: string;
  sortOrder: number;
}

interface SidebarLink {
  id: string;
  pageId: string;
  label: string;
  href: string;
  highlight: boolean;
  sortOrder: number;
}

interface UIState {
  editingTabId: string | null;
  isSaving: boolean;
  message: { type: 'success' | 'error' | null; text: string };
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-compliance-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compliance-management.component.html',
  styles: [
    `
      textarea {
        resize: vertical;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        line-height: 1.6;
      }

      ::ng-deep .prose h3 {
        @apply text-sm font-semibold text-slate-900 mt-2 mb-1;
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
  private messagingService = inject(MessagingService);
  private destroy$ = new Subject<void>();

  // State
  pages = signal<CompliancePage[]>([]);
  selectedPageId = signal<string | null>(null);
  uiState = signal<UIState>({
    editingTabId: null,
    isSaving: false,
    message: { type: null, text: '' },
    isLoading: false,
    error: null,
  });

  // Computed
  selectedPage = computed(() => {
    const pageId = this.selectedPageId();
    if (!pageId) return null;
    return this.pages().find((p) => p.id === pageId) || null;
  });

  ngOnInit() {
    this.loadPages();
  }

  /**
   * Load all compliance pages
   */
  loadPages(): void {
    this.uiState.update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    this.complianceService
      .loadPages()
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pages: CompliancePage[]) => {
          this.pages.set(pages);
          // Auto-select first page if none selected
          if (pages.length > 0 && !this.selectedPageId()) {
            this.selectPage(pages[0].id);
          }
          this.uiState.update((state) => ({ ...state, isLoading: false }));
        },
        error: (err) => {
          console.error('❌ Error loading pages:', err);
          this.uiState.update((state) => ({
            ...state,
            isLoading: false,
            error: 'Failed to load compliance pages',
          }));
          this.showMessage('error', 'Failed to load pages');
        },
      });
  }

  /**
   * Select a page and clear editing state
   */
  selectPage(pageId: string): void {
    this.selectedPageId.set(pageId);
    this.uiState.update((state) => ({
      ...state,
      editingTabId: null,
      message: { type: null, text: '' },
    }));
  }

  /**
   * Toggle edit mode for a tab
   */
  toggleEditTab(tabId: string | null): void {
    const current = this.uiState().editingTabId;
    this.uiState.update((state) => ({
      ...state,
      editingTabId: current === tabId ? null : tabId,
      message: { type: null, text: '' },
    }));
  }

  /**
   * Save tab content and sync to main_content
   */
  saveTab(tab: ComplianceTab): void {
    if (!tab.label.trim() || !tab.content.trim()) {
      this.showMessage('error', 'Tab title and content are required');
      return;
    }

    this.uiState.update((state) => ({ ...state, isSaving: true }));

    this.complianceService
      .updateTab(tab.pageId, tab.tabId, tab.label, tab.content)
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // After saving tab, sync all tabs to main_content
          this.syncTabsToMainContent(tab.pageId);

          this.showMessage('success', `"${tab.label}" saved successfully`);
          this.toggleEditTab(null);

          // Send message to admins
          this.messagingService
            .sendMessage(
              'system-admin-channel',
              `Compliance tab updated: ${tab.label}`,
              'system',
            )
            .catch((err) =>
              console.warn('Could not send admin notification:', err),
            );
        },
        error: (err: any) => {
          console.error('❌ Save failed:', err);
          this.showMessage(
            'error',
            `Failed to save: ${err?.message || 'Unknown error'}`,
          );
        },
        complete: () => {
          this.uiState.update((state) => ({ ...state, isSaving: false }));
        },
      });
  }

  /**
   * Sync all tabs content into main_content for frontend display
   * This combines all tab content into the main_content field
   */
  private syncTabsToMainContent(pageId: string): void {
    const page = this.selectedPage();
    if (!page) return;

    // Combine all tabs into HTML
    const combinedContent = this.combineTabs(page.tabs);

    // Update the page's main_content with combined tabs
    const updatedPage = { ...page, mainContent: combinedContent };

    // Update local state
    const pages = this.pages();
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex > -1) {
      pages[pageIndex] = updatedPage;
      this.pages.set([...pages]);
    }

    // Call service to update main_content in database
    this.complianceService
      .updatePage(pageId, { mainContent: combinedContent })
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Main content synced from tabs');
        },
        error: (err) => {
          console.warn('⚠️ Could not sync tabs to main content:', err);
          // Non-critical error - tab was saved but main_content wasn't updated
        },
      });
  }

  /**
   * Combine all tabs into single HTML content
   */
  private combineTabs(tabs: ComplianceTab[]): string {
    if (!tabs || tabs.length === 0) return '';

    return tabs
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((tab) => tab.content)
      .join('\n\n');
  }

  /**
   * Strip HTML tags for preview
   */
  stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Get last edited info
   */
  getLastEditedInfo(page: CompliancePage): string {
    if (!page.updatedAt) return 'Never edited';
    const date = new Date(page.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Edited today';
    if (diffDays === 1) return 'Edited yesterday';
    if (diffDays < 7) return `Edited ${diffDays} days ago`;
    return `Edited ${date.toLocaleDateString()}`;
  }

  /**
   * Show message with auto-dismiss
   */
  private showMessage(type: 'success' | 'error', text: string): void {
    this.uiState.update((state) => ({
      ...state,
      message: { type, text },
    }));

    setTimeout(() => {
      this.uiState.update((state) => ({
        ...state,
        message: { type: null, text: '' },
      }));
    }, 4000);
  }

  /**
   * TrackBy functions to prevent NG0955 errors
   */
  trackByPageId(_index: number, page: CompliancePage): string {
    return page.id;
  }

  trackByTabId(_index: number, tab: ComplianceTab): string {
    return `${tab.pageId}-${tab.tabId}`;
  }

  trackByLinkId(_index: number, link: SidebarLink): string {
    return link.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
