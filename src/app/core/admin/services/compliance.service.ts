// import { Injectable, inject, signal } from '@angular/core';
// import { Observable, from, BehaviorSubject } from 'rxjs';
// import { map, tap, catchError } from 'rxjs/operators';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

// export interface CompliancePageTab {
//   id: string;
//   label: string;
//   content: string; // HTML content
//   sortOrder: number;
// }

// export interface ComplianceSidebarLink {
//   label: string;
//   href?: string;
//   highlight?: boolean;
//   sortOrder: number;
// }

// export interface ComplianceDocument {
//   id: string;
//   label: string;
//   fileName: string;
//   filePath: string;
//   fileUrl: string;
//   documentType: 'pdf' | 'form' | 'manual';
//   sortOrder: number;
// }

// export interface CompliancePage {
//   id: string;
//   title: string;
//   subtitle: string;
//   breadcrumb: string[];
//   mainContent: string; // HTML content
//   ctaLabel?: string;
//   ctaUrl?: string;
//   tabs: CompliancePageTab[];
//   sidebarTitle: string;
//   sidebarLinks: ComplianceSidebarLink[];
//   documents?: ComplianceDocument[];
//   displayOrder: number;
// }

// @Injectable({ providedIn: 'root' })
// export class CompliancePageService {
//   private supabase = inject(SharedSupabaseService);

//   private pagesSubject = new BehaviorSubject<Map<string, CompliancePage>>(
//     new Map()
//   );
//   pages$ = this.pagesSubject.asObservable();

//   isLoading = signal(false);
//   error = signal<string | null>(null);

//   /**
//    * Load all compliance pages
//    */
//   loadPages(): Observable<CompliancePage[]> {
//     this.isLoading.set(true);
//     return from(this.fetchAllPages()).pipe(
//       tap((pages) => {
//         const pageMap = new Map(pages.map((page) => [page.id, page]));
//         this.pagesSubject.next(pageMap);
//         this.isLoading.set(false);
//       }),
//       catchError((err) => {
//         console.error('Failed to load compliance pages:', err);
//         this.error.set('Failed to load compliance pages');
//         this.isLoading.set(false);
//         return from([]);
//       })
//     );
//   }

//   /**
//    * Get a specific compliance page by ID
//    */
//   getPage(pageId: string): Observable<CompliancePage | null> {
//     return from(this.fetchPage(pageId)).pipe(
//       tap((page) => {
//         if (page) {
//           const map = this.pagesSubject.value;
//           map.set(pageId, page);
//           this.pagesSubject.next(map);
//         }
//       }),
//       catchError((err) => {
//         console.error(`Failed to load compliance page ${pageId}:`, err);
//         this.error.set(`Failed to load page: ${err?.message}`);
//         return from([null]);
//       })
//     );
//   }

//   /**
//    * Fetch page from Supabase with all related data
//    */
//   private async fetchPage(pageId: string): Promise<CompliancePage | null> {
//     try {
//       // Fetch main page data
//       const { data: pageData, error: pageError } = await this.supabase
//         .from('compliance_pages')
//         .select('*')
//         .eq('id', pageId)
//         .single();

//       if (pageError) {
//         throw new Error(`Page fetch error: ${pageError.message}`);
//       }

//       if (!pageData) {
//         return null;
//       }

//       // Fetch tabs
//       const { data: tabsData, error: tabsError } = await this.supabase
//         .from('compliance_tabs')
//         .select('*')
//         .eq('page_id', pageId)
//         .order('sort_order', { ascending: true });

//       if (tabsError) {
//         console.warn('Failed to load tabs:', tabsError);
//       }

//       // Fetch sidebar links
//       const { data: linksData, error: linksError } = await this.supabase
//         .from('compliance_sidebar_links')
//         .select('*')
//         .eq('page_id', pageId)
//         .order('sort_order', { ascending: true });

//       if (linksError) {
//         console.warn('Failed to load sidebar links:', linksError);
//       }

//       // Fetch documents (optional)
//       const { data: docsData, error: docsError } = await this.supabase
//         .from('compliance_documents')
//         .select('*')
//         .eq('page_id', pageId)
//         .order('sort_order', { ascending: true });

//       if (docsError) {
//         console.warn('Failed to load documents:', docsError);
//       }

//       // Transform and combine data
//       const page: CompliancePage = {
//         id: pageData.id,
//         title: pageData.title,
//         subtitle: pageData.subtitle,
//         breadcrumb: pageData.breadcrumb || ['Compliance', pageData.title],
//         mainContent: pageData.main_content || '',
//         ctaLabel: pageData.cta_label,
//         ctaUrl: pageData.cta_url,
//         sidebarTitle: pageData.sidebar_title || 'Resources',
//         displayOrder: pageData.display_order || 0,
//         tabs: (tabsData || []).map((tab) => ({
//           id: tab.tab_id,
//           label: tab.label,
//           content: tab.content || '',
//           sortOrder: tab.sort_order || 0,
//         })),
//         sidebarLinks: (linksData || []).map((link) => ({
//           label: link.label,
//           href: link.href,
//           highlight: link.highlight || false,
//           sortOrder: link.sort_order || 0,
//         })),
//         documents:
//           docsData && docsData.length > 0
//             ? (docsData || []).map((doc) => ({
//                 id: doc.id,
//                 label: doc.label,
//                 fileName: doc.file_name,
//                 filePath: doc.file_path,
//                 fileUrl: doc.file_url,
//                 documentType: doc.document_type || 'pdf',
//                 sortOrder: doc.sort_order || 0,
//               }))
//             : undefined,
//       };

//       return page;
//     } catch (error) {
//       console.error('Error fetching page:', error);
//       throw error;
//     }
//   }

//   /**
//    * Fetch all active compliance pages
//    */
//   private async fetchAllPages(): Promise<CompliancePage[]> {
//     try {
//       const { data: pagesData, error: pagesError } = await this.supabase
//         .from('compliance_pages')
//         .select('*')
//         .order('display_order', { ascending: true });

//       if (pagesError) {
//         throw new Error(`Pages fetch error: ${pagesError.message}`);
//       }

//       const pages: CompliancePage[] = [];

//       for (const pageData of pagesData || []) {
//         // Fetch tabs for each page
//         const { data: tabsData } = await this.supabase
//           .from('compliance_tabs')
//           .select('*')
//           .eq('page_id', pageData.id)
//           .order('sort_order', { ascending: true });

//         // Fetch sidebar links for each page
//         const { data: linksData } = await this.supabase
//           .from('compliance_sidebar_links')
//           .select('*')
//           .eq('page_id', pageData.id)
//           .order('sort_order', { ascending: true });

//         // Fetch documents for each page
//         const { data: docsData } = await this.supabase
//           .from('compliance_documents')
//           .select('*')
//           .eq('page_id', pageData.id)
//           .order('sort_order', { ascending: true });

//         const page: CompliancePage = {
//           id: pageData.id,
//           title: pageData.title,
//           subtitle: pageData.subtitle,
//           breadcrumb: pageData.breadcrumb || ['Compliance', pageData.title],
//           mainContent: pageData.main_content || '',
//           ctaLabel: pageData.cta_label,
//           ctaUrl: pageData.cta_url,
//           sidebarTitle: pageData.sidebar_title || 'Resources',
//           displayOrder: pageData.display_order || 0,
//           tabs: (tabsData || []).map((tab) => ({
//             id: tab.tab_id,
//             label: tab.label,
//             content: tab.content || '',
//             sortOrder: tab.sort_order || 0,
//           })),
//           sidebarLinks: (linksData || []).map((link) => ({
//             label: link.label,
//             href: link.href,
//             highlight: link.highlight || false,
//             sortOrder: link.sort_order || 0,
//           })),
//           documents:
//             docsData && docsData.length > 0
//               ? (docsData || []).map((doc) => ({
//                   id: doc.id,
//                   label: doc.label,
//                   fileName: doc.file_name,
//                   filePath: doc.file_path,
//                   fileUrl: doc.file_url,
//                   documentType: doc.document_type || 'pdf',
//                   sortOrder: doc.sort_order || 0,
//                 }))
//               : undefined,
//         };

//         pages.push(page);
//       }

//       return pages;
//     } catch (error) {
//       console.error('Error fetching all pages:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get cached page synchronously (after load)
//    */
//   getPageSync(pageId: string): CompliancePage | null {
//     return this.pagesSubject.value.get(pageId) || null;
//   }

//   /**
//    * Admin: Update page content
//    */
//   async updatePage(
//     pageId: string,
//     updates: Partial<Omit<CompliancePage, 'id'>>
//   ): Promise<void> {
//     const userId = this.supabase.getCurrentUserId();
//     if (!userId) {
//       throw new Error('User not authenticated');
//     }

//     const { error } = await this.supabase
//       .from('compliance_pages')
//       .update({
//         title: updates.title,
//         subtitle: updates.subtitle,
//         main_content: updates.mainContent,
//         cta_label: updates.ctaLabel,
//         cta_url: updates.ctaUrl,
//         sidebar_title: updates.sidebarTitle,
//         updated_by: userId,
//         updated_at: new Date().toISOString(),
//       })
//       .eq('id', pageId);

//     if (error) {
//       throw new Error(`Failed to update page: ${error.message}`);
//     }

//     // Reload page to refresh cache
//     await this.fetchPage(pageId);
//   }

//   /**
//    * Admin: Update tab content
//    */
//   async updateTab(
//     pageId: string,
//     tabId: string,
//     content: string
//   ): Promise<void> {
//     const userId = this.supabase.getCurrentUserId();
//     if (!userId) {
//       throw new Error('User not authenticated');
//     }

//     const { error } = await this.supabase
//       .from('compliance_tabs')
//       .update({
//         content,
//         updated_by: userId,
//         updated_at: new Date().toISOString(),
//       })
//       .eq('page_id', pageId)
//       .eq('tab_id', tabId);

//     if (error) {
//       throw new Error(`Failed to update tab: ${error.message}`);
//     }

//     // Reload page to refresh cache
//     await this.fetchPage(pageId);
//   }

//   /**
//    * Admin: Create new page
//    */
//   async createPage(page: Omit<CompliancePage, 'id'>): Promise<string> {
//     const userId = this.supabase.getCurrentUserId();
//     if (!userId) {
//       throw new Error('User not authenticated');
//     }

//     const { data, error } = await this.supabase
//       .from('compliance_pages')
//       .insert([
//         {
//           title: page.title,
//           subtitle: page.subtitle,
//           breadcrumb: page.breadcrumb,
//           main_content: page.mainContent,
//           cta_label: page.ctaLabel,
//           cta_url: page.ctaUrl,
//           sidebar_title: page.sidebarTitle,
//           display_order: page.displayOrder,
//           created_by: userId,
//         },
//       ])
//       .select('id')
//       .single();

//     if (error) {
//       throw new Error(`Failed to create page: ${error.message}`);
//     }

//     return data.id;
//   }
// }

import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface CompliancePageTab {
  id: string;
  pageId: string;
  tabId: string;
  label: string;
  content: string;
  sortOrder: number;
}

export interface ComplianceSidebarLink {
  id: string;
  pageId: string;
  label: string;
  href: string;
  highlight: boolean;
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
  mainContent: string;
  ctaLabel?: string;
  ctaUrl?: string;
  tabs: CompliancePageTab[];
  sidebarTitle: string;
  sidebarLinks: ComplianceSidebarLink[];
  documents?: ComplianceDocument[];
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

@Injectable({ providedIn: 'root' })
export class CompliancePageService {
  private supabase = inject(SharedSupabaseService);

  private pagesSubject = new BehaviorSubject<CompliancePage[]>([]);
  pages$ = this.pagesSubject.asObservable();

  isLoading = signal(false);
  error = signal<string | null>(null);

  /**
   * Load all compliance pages
   * Returns Observable<CompliancePage[]> for proper async subscription
   */
  loadPages(): Observable<CompliancePage[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchAllPages()).pipe(
      tap((pages) => {
        this.pagesSubject.next(pages);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const message = `Failed to load compliance pages: ${err?.message || 'Unknown error'}`;
        console.error('❌ ' + message, err);
        this.error.set(message);
        this.isLoading.set(false);
        return throwError(() => new Error(message));
      }),
    );
  }

  /**
   * Get a specific compliance page by ID
   */
  getPage(pageId: string): Observable<CompliancePage | null> {
    return from(this.fetchPage(pageId)).pipe(
      tap((page) => {
        if (page) {
          const pages = this.pagesSubject.value;
          const index = pages.findIndex((p) => p.id === pageId);
          if (index > -1) {
            pages[index] = page;
          } else {
            pages.push(page);
          }
          this.pagesSubject.next([...pages]);
        }
      }),
      catchError((err) => {
        const message = `Failed to load page ${pageId}: ${err?.message || 'Unknown error'}`;
        console.error('❌ ' + message, err);
        this.error.set(message);
        return throwError(() => new Error(message));
      }),
    );
  }

  /**
   * Fetch a single page with all related data
   */
  private async fetchPage(pageId: string): Promise<CompliancePage | null> {
    try {
      // Fetch main page
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
        console.warn('⚠️ Failed to load tabs:', tabsError);
      }

      // Fetch sidebar links
      const { data: linksData, error: linksError } = await this.supabase
        .from('compliance_sidebar_links')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (linksError) {
        console.warn('⚠️ Failed to load sidebar links:', linksError);
      }

      // Fetch documents
      const { data: docsData, error: docsError } = await this.supabase
        .from('compliance_documents')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (docsError) {
        console.warn('⚠️ Failed to load documents:', docsError);
      }

      // Transform to proper types
      const page: CompliancePage = {
        id: pageData.id,
        title: pageData.title,
        subtitle: pageData.subtitle,
        breadcrumb: pageData.breadcrumb || ['Compliance', pageData.title],
        mainContent: pageData.main_content || '',
        ctaLabel: pageData.cta_label || undefined,
        ctaUrl: pageData.cta_url || undefined,
        sidebarTitle: pageData.sidebar_title || 'Resources',
        displayOrder: pageData.display_order || 0,
        createdAt: pageData.created_at,
        updatedAt: pageData.updated_at,
        updatedBy: pageData.updated_by,
        tabs: (tabsData || []).map((tab) => ({
          id: tab.id,
          pageId: tab.page_id,
          tabId: tab.tab_id,
          label: tab.label,
          content: tab.content || '',
          sortOrder: tab.sort_order || 0,
        })),
        sidebarLinks: (linksData || []).map((link) => ({
          id: link.id,
          pageId: link.page_id,
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
      console.error('❌ Error fetching page:', error);
      throw error;
    }
  }

  /**
   * Fetch all compliance pages in a single operation
   * This prevents the "Cannot coerce result to single JSON object" error
   * by handling array response properly
   */
  private async fetchAllPages(): Promise<CompliancePage[]> {
    try {
      // Fetch all page records
      const { data: pagesData, error: pagesError } = await this.supabase
        .from('compliance_pages')
        .select('*')
        .order('display_order', { ascending: true });

      if (pagesError) {
        throw new Error(`Pages fetch error: ${pagesError.message}`);
      }

      // Return early if no pages
      if (!pagesData || pagesData.length === 0) {
        return [];
      }

      // Map through pages and fetch related data
      const pages: CompliancePage[] = await Promise.all(
        (pagesData || []).map((pageData) => this.transformPageData(pageData)),
      );

      return pages;
    } catch (error) {
      console.error('❌ Error fetching all pages:', error);
      throw error;
    }
  }

  /**
   * Transform raw database page data to CompliancePage type
   */
  private async transformPageData(pageData: any): Promise<CompliancePage> {
    try {
      // Fetch tabs for this page
      const { data: tabsData } = await this.supabase
        .from('compliance_tabs')
        .select('*')
        .eq('page_id', pageData.id)
        .order('sort_order', { ascending: true });

      // Fetch sidebar links for this page
      const { data: linksData } = await this.supabase
        .from('compliance_sidebar_links')
        .select('*')
        .eq('page_id', pageData.id)
        .order('sort_order', { ascending: true });

      // Fetch documents for this page
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
        ctaLabel: pageData.cta_label || undefined,
        ctaUrl: pageData.cta_url || undefined,
        sidebarTitle: pageData.sidebar_title || 'Resources',
        displayOrder: pageData.display_order || 0,
        createdAt: pageData.created_at,
        updatedAt: pageData.updated_at,
        updatedBy: pageData.updated_by,
        tabs: (tabsData || []).map((tab) => ({
          id: tab.id,
          pageId: tab.page_id,
          tabId: tab.tab_id,
          label: tab.label,
          content: tab.content || '',
          sortOrder: tab.sort_order || 0,
        })),
        sidebarLinks: (linksData || []).map((link) => ({
          id: link.id,
          pageId: link.page_id,
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
      console.error('❌ Error transforming page data:', error);
      throw error;
    }
  }

  /**
   * Get cached page synchronously (after load)
   */
  getPageSync(pageId: string): CompliancePage | null {
    return this.pagesSubject.value.find((p) => p.id === pageId) || null;
  }

  /**
   * Update a compliance page
   */
  updatePage(
    pageId: string,
    updates: Partial<Omit<CompliancePage, 'id'>>,
  ): Observable<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
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
        .eq('id', pageId),
    ).pipe(
      tap(() => {
        // Refresh the page in cache
        this.getPage(pageId).subscribe();
      }),
      map(() => undefined),
      catchError((err) => {
        const message = `Failed to update page: ${err?.message || 'Unknown error'}`;
        console.error('❌ ' + message, err);
        return throwError(() => new Error(message));
      }),
    );
  }

  /**
   * Update a compliance tab
   * Returns Observable for proper async chaining
   */
  updateTab(
    pageId: string,
    tabId: string,
    label: string,
    content: string,
  ): Observable<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('compliance_tabs')
        .update({
          label,
          content,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('page_id', pageId)
        .eq('tab_id', tabId),
    ).pipe(
      tap(() => {
        // Refresh the page in cache
        this.getPage(pageId).subscribe();
      }),
      map(() => undefined),
      catchError((err) => {
        const message = `Failed to update tab: ${err?.message || 'Unknown error'}`;
        console.error('❌ ' + message, err);
        return throwError(() => new Error(message));
      }),
    );
  }

  /**
   * Create a new compliance page
   */
  createPage(page: Omit<CompliancePage, 'id'>): Observable<string> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
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
        .single(),
    ).pipe(
      map((data: any) => data.id),
      tap(() => {
        // Refresh pages list
        this.loadPages().subscribe();
      }),
      catchError((err) => {
        const message = `Failed to create page: ${err?.message || 'Unknown error'}`;
        console.error('❌ ' + message, err);
        return throwError(() => new Error(message));
      }),
    );
  }
}
