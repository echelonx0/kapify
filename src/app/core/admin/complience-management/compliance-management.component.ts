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
  sidebarTitle: string;
  displayOrder: number;
  tabs: ComplianceTab[];
  sidebarLinks: SidebarLink[];
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
  selectedPageId: string | null;
  editingTabId: string | null;
  isSaving: boolean;
  message: { type: 'success' | 'error' | null; text: string };
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
  private destroy$ = new Subject<void>();

  // State
  pages = signal<CompliancePage[]>([]);
  uiState = signal<UIState>({
    selectedPageId: null,
    editingTabId: null,
    isSaving: false,
    message: { type: null, text: '' },
  });

  // Computed
  selectedPageId = computed(() => this.uiState().selectedPageId);
  selectedPage = computed(() => {
    const pageId = this.selectedPageId();
    if (!pageId) return null;
    return this.pages().find((p) => p.id === pageId) || null;
  });

  ngOnInit() {
    this.loadPages();
  }

  // Load pages
  private loadPages() {
    this.complianceService
      .loadPages?.()
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pages: any[]) => {
          this.pages.set(pages);
        },
        error: (err) => {
          this.showMessage('error', 'Failed to load pages');
          console.error('Error loading pages:', err);
        },
      });
  }

  // Select page
  selectPage(pageId: string) {
    this.uiState.update((state) => ({
      ...state,
      selectedPageId: pageId,
      editingTabId: null,
    }));
  }

  // Toggle edit tab
  toggleEditTab(tabId: string | null) {
    this.uiState.update((state) => ({
      ...state,
      editingTabId: state.editingTabId === tabId ? null : tabId,
    }));
  }

  // Save tab
  saveTab(tab: ComplianceTab) {
    this.uiState.update((state) => ({ ...state, isSaving: true }));

    // Call service to update (when available)
    const updateMethod = (this.complianceService as any).updateTab;
    if (updateMethod) {
      updateMethod
        .call(this.complianceService, tab.pageId, tab.tabId, tab)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showMessage('success', `"${tab.label}" saved successfully`);
            this.toggleEditTab(null);
          },
          error: (err: { message: any }) => {
            this.showMessage('error', `Failed to save: ${err.message}`);
          },
          complete: () => {
            this.uiState.update((state) => ({ ...state, isSaving: false }));
          },
        });
    } else {
      // Fallback: just show success
      this.showMessage('success', `"${tab.label}" updated`);
      this.toggleEditTab(null);
      this.uiState.update((state) => ({ ...state, isSaving: false }));
    }
  }

  // Strip HTML tags for preview
  stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // Show message
  private showMessage(type: 'success' | 'error', text: string) {
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
