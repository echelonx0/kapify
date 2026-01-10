import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface CompliancePageTab {
  id: string;
  label: string;
  content: string; // HTML content
  sortOrder: number;
}

export interface ComplianceSidebarLink {
  label: string;
  href?: string;
  highlight?: boolean;
  sortOrder: number;
}

export interface ComplianceDocument {
  id: string;
  label: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  documentType: 'pdf' | 'form' | 'manual';
  sortOrder: number;
}

export interface CompliancePage {
  id: string;
  title: string;
  subtitle: string;
  breadcrumb: string[];
  mainContent: string; // HTML content
  ctaLabel?: string;
  ctaUrl?: string;
  tabs: CompliancePageTab[];
  sidebarTitle: string;
  sidebarLinks: ComplianceSidebarLink[];
  documents?: ComplianceDocument[];
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class CompliancePageService {
  private supabase = inject(SharedSupabaseService);

  private pagesSubject = new BehaviorSubject<Map<string, CompliancePage>>(
    new Map()
  );
  pages$ = this.pagesSubject.asObservable();

  isLoading = signal(false);
  error = signal<string | null>(null);

  /**
   * Load all compliance pages
   */
  loadPages(): Observable<CompliancePage[]> {
    this.isLoading.set(true);
    return from(this.fetchAllPages()).pipe(
      tap((pages) => {
        const pageMap = new Map(pages.map((page) => [page.id, page]));
        this.pagesSubject.next(pageMap);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        console.error('Failed to load compliance pages:', err);
        this.error.set('Failed to load compliance pages');
        this.isLoading.set(false);
        return from([]);
      })
    );
  }

  /**
   * Get a specific compliance page by ID
   */
  getPage(pageId: string): Observable<CompliancePage | null> {
    return from(this.fetchPage(pageId)).pipe(
      tap((page) => {
        if (page) {
          const map = this.pagesSubject.value;
          map.set(pageId, page);
          this.pagesSubject.next(map);
        }
      }),
      catchError((err) => {
        console.error(`Failed to load compliance page ${pageId}:`, err);
        this.error.set(`Failed to load page: ${err?.message}`);
        return from([null]);
      })
    );
  }

  /**
   * Fetch page from Supabase with all related data
   */
  private async fetchPage(pageId: string): Promise<CompliancePage | null> {
    try {
      // Fetch main page data
      const { data: pageData, error: pageError } = await this.supabase
        .from('compliance_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (pageError) {
        throw new Error(`Page fetch error: ${pageError.message}`);
      }

      if (!pageData) {
        return null;
      }

      // Fetch tabs
      const { data: tabsData, error: tabsError } = await this.supabase
        .from('compliance_tabs')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (tabsError) {
        console.warn('Failed to load tabs:', tabsError);
      }

      // Fetch sidebar links
      const { data: linksData, error: linksError } = await this.supabase
        .from('compliance_sidebar_links')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (linksError) {
        console.warn('Failed to load sidebar links:', linksError);
      }

      // Fetch documents (optional)
      const { data: docsData, error: docsError } = await this.supabase
        .from('compliance_documents')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (docsError) {
        console.warn('Failed to load documents:', docsError);
      }

      // Transform and combine data
      const page: CompliancePage = {
        id: pageData.id,
        title: pageData.title,
        subtitle: pageData.subtitle,
        breadcrumb: pageData.breadcrumb || ['Compliance', pageData.title],
        mainContent: pageData.main_content || '',
        ctaLabel: pageData.cta_label,
        ctaUrl: pageData.cta_url,
        sidebarTitle: pageData.sidebar_title || 'Resources',
        displayOrder: pageData.display_order || 0,
        tabs: (tabsData || []).map((tab) => ({
          id: tab.tab_id,
          label: tab.label,
          content: tab.content || '',
          sortOrder: tab.sort_order || 0,
        })),
        sidebarLinks: (linksData || []).map((link) => ({
          label: link.label,
          href: link.href,
          highlight: link.highlight || false,
          sortOrder: link.sort_order || 0,
        })),
        documents:
          docsData && docsData.length > 0
            ? (docsData || []).map((doc) => ({
                id: doc.id,
                label: doc.label,
                fileName: doc.file_name,
                filePath: doc.file_path,
                fileUrl: doc.file_url,
                documentType: doc.document_type || 'pdf',
                sortOrder: doc.sort_order || 0,
              }))
            : undefined,
      };

      return page;
    } catch (error) {
      console.error('Error fetching page:', error);
      throw error;
    }
  }

  /**
   * Fetch all active compliance pages
   */
  private async fetchAllPages(): Promise<CompliancePage[]> {
    try {
      const { data: pagesData, error: pagesError } = await this.supabase
        .from('compliance_pages')
        .select('*')
        .order('display_order', { ascending: true });

      if (pagesError) {
        throw new Error(`Pages fetch error: ${pagesError.message}`);
      }

      const pages: CompliancePage[] = [];

      for (const pageData of pagesData || []) {
        // Fetch tabs for each page
        const { data: tabsData } = await this.supabase
          .from('compliance_tabs')
          .select('*')
          .eq('page_id', pageData.id)
          .order('sort_order', { ascending: true });

        // Fetch sidebar links for each page
        const { data: linksData } = await this.supabase
          .from('compliance_sidebar_links')
          .select('*')
          .eq('page_id', pageData.id)
          .order('sort_order', { ascending: true });

        // Fetch documents for each page
        const { data: docsData } = await this.supabase
          .from('compliance_documents')
          .select('*')
          .eq('page_id', pageData.id)
          .order('sort_order', { ascending: true });

        const page: CompliancePage = {
          id: pageData.id,
          title: pageData.title,
          subtitle: pageData.subtitle,
          breadcrumb: pageData.breadcrumb || ['Compliance', pageData.title],
          mainContent: pageData.main_content || '',
          ctaLabel: pageData.cta_label,
          ctaUrl: pageData.cta_url,
          sidebarTitle: pageData.sidebar_title || 'Resources',
          displayOrder: pageData.display_order || 0,
          tabs: (tabsData || []).map((tab) => ({
            id: tab.tab_id,
            label: tab.label,
            content: tab.content || '',
            sortOrder: tab.sort_order || 0,
          })),
          sidebarLinks: (linksData || []).map((link) => ({
            label: link.label,
            href: link.href,
            highlight: link.highlight || false,
            sortOrder: link.sort_order || 0,
          })),
          documents:
            docsData && docsData.length > 0
              ? (docsData || []).map((doc) => ({
                  id: doc.id,
                  label: doc.label,
                  fileName: doc.file_name,
                  filePath: doc.file_path,
                  fileUrl: doc.file_url,
                  documentType: doc.document_type || 'pdf',
                  sortOrder: doc.sort_order || 0,
                }))
              : undefined,
        };

        pages.push(page);
      }

      return pages;
    } catch (error) {
      console.error('Error fetching all pages:', error);
      throw error;
    }
  }

  /**
   * Get cached page synchronously (after load)
   */
  getPageSync(pageId: string): CompliancePage | null {
    return this.pagesSubject.value.get(pageId) || null;
  }

  /**
   * Admin: Update page content
   */
  async updatePage(
    pageId: string,
    updates: Partial<Omit<CompliancePage, 'id'>>
  ): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await this.supabase
      .from('compliance_pages')
      .update({
        title: updates.title,
        subtitle: updates.subtitle,
        main_content: updates.mainContent,
        cta_label: updates.ctaLabel,
        cta_url: updates.ctaUrl,
        sidebar_title: updates.sidebarTitle,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId);

    if (error) {
      throw new Error(`Failed to update page: ${error.message}`);
    }

    // Reload page to refresh cache
    await this.fetchPage(pageId);
  }

  /**
   * Admin: Update tab content
   */
  async updateTab(
    pageId: string,
    tabId: string,
    content: string
  ): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { error } = await this.supabase
      .from('compliance_tabs')
      .update({
        content,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('page_id', pageId)
      .eq('tab_id', tabId);

    if (error) {
      throw new Error(`Failed to update tab: ${error.message}`);
    }

    // Reload page to refresh cache
    await this.fetchPage(pageId);
  }

  /**
   * Admin: Create new page
   */
  async createPage(page: Omit<CompliancePage, 'id'>): Promise<string> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('compliance_pages')
      .insert([
        {
          title: page.title,
          subtitle: page.subtitle,
          breadcrumb: page.breadcrumb,
          main_content: page.mainContent,
          cta_label: page.ctaLabel,
          cta_url: page.ctaUrl,
          sidebar_title: page.sidebarTitle,
          display_order: page.displayOrder,
          created_by: userId,
        },
      ])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create page: ${error.message}`);
    }

    return data.id;
  }
}
