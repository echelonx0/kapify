// src/app/admin/services/markdown.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface MarkdownContent {
  raw: string;
  html: SafeHtml;
  sections: MarkdownSection[];
}

export interface MarkdownSection {
  title: string;
  level: number;
  content: string;
  html: SafeHtml;
}

@Injectable({
  providedIn: 'root',
})
export class MarkdownService {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private cache = new Map<string, Observable<MarkdownContent>>();

  constructor() {
    this.configureMarked();
  }

  /**
   * Configure marked for better rendering
   */
  private configureMarked() {
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
    });

    // Custom renderer for better styling
    const renderer = new marked.Renderer();

    // Code blocks with better styling
    renderer.code = (token) => {
      const code = token.text;
      const lang = token.lang || 'plaintext';
      return `
        <div class="code-block">
          <div class="code-header">
            <span class="code-language">${lang}</span>
          </div>
          <pre><code class="language-${lang}">${this.escapeHtml(
        code
      )}</code></pre>
        </div>
      `;
    };

    // Inline code with styling
    renderer.codespan = (token) => {
      return `<code class="inline-code">${this.escapeHtml(token.text)}</code>`;
    };

    // Tables with Kapify styling
    renderer.table = (token) => {
      let header = '<thead><tr>';
      for (const cell of token.header) {
        header += `<th>${cell.text}</th>`;
      }
      header += '</tr></thead>';

      let body = '<tbody>';
      for (const row of token.rows) {
        body += '<tr>';
        for (const cell of row) {
          body += `<td>${cell.text}</td>`;
        }
        body += '</tr>';
      }
      body += '</tbody>';

      return `
        <div class="table-wrapper">
          <table class="markdown-table">
            ${header}
            ${body}
          </table>
        </div>
      `;
    };

    // Links with external indicator
    renderer.link = (token) => {
      const href = token.href;
      const title = token.title ? `title="${token.title}"` : '';
      const text = token.text;
      const isExternal = href?.startsWith('http');
      const target = isExternal
        ? 'target="_blank" rel="noopener noreferrer"'
        : '';
      const externalIcon = isExternal
        ? '<svg class="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
        : '';
      return `<a href="${href}" ${title} ${target} class="markdown-link">${text}${externalIcon}</a>`;
    };

    marked.use({ renderer });
  }

  /**
   * Load and parse markdown file
   */
  loadMarkdown(filePath: string): Observable<MarkdownContent> {
    // Check cache first
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    // Load from file
    const request = this.http.get(filePath, { responseType: 'text' }).pipe(
      map((raw) => this.parseMarkdown(raw)),
      catchError((error) => {
        console.error('Failed to load markdown:', error);
        return throwError(
          () => new Error(`Failed to load documentation from ${filePath}`)
        );
      }),
      shareReplay(1)
    );

    // Cache the observable
    this.cache.set(filePath, request);
    return request;
  }

  /**
   * Parse markdown string into structured content
   */
  parseMarkdown(raw: string): MarkdownContent {
    // Parse to HTML
    const htmlString = marked.parse(raw) as string;
    const html = this.sanitizer.sanitize(1, htmlString) || '';

    // Extract sections by headers
    const sections = this.extractSections(raw);

    return {
      raw,
      html: this.sanitizer.bypassSecurityTrustHtml(html),
      sections,
    };
  }

  /**
   * Extract sections from markdown based on headers
   */
  private extractSections(markdown: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];
    const lines = markdown.split('\n');

    let currentSection: Partial<MarkdownSection> | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check if line is a header
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          const content = currentContent.join('\n').trim();
          const htmlString = marked.parse(content) as string;
          sections.push({
            title: currentSection.title!,
            level: currentSection.level!,
            content,
            html: this.sanitizer.bypassSecurityTrustHtml(htmlString),
          });
        }

        // Start new section
        currentSection = {
          title: headerMatch[2].trim(),
          level: headerMatch[1].length,
        };
        currentContent = [];
      } else {
        // Add line to current section content
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      const content = currentContent.join('\n').trim();
      const htmlString = marked.parse(content) as string;
      sections.push({
        title: currentSection.title!,
        level: currentSection.level!,
        content,
        html: this.sanitizer.bypassSecurityTrustHtml(htmlString),
      });
    }

    return sections;
  }

  /**
   * Get section by title
   */
  getSection(
    content: MarkdownContent,
    title: string
  ): MarkdownSection | undefined {
    return content.sections.find(
      (s) => s.title.toLowerCase() === title.toLowerCase()
    );
  }

  /**
   * Get sections by level
   */
  getSectionsByLevel(
    content: MarkdownContent,
    level: number
  ): MarkdownSection[] {
    return content.sections.filter((s) => s.level === level);
  }

  /**
   * Clear cache for a specific file or all files
   */
  clearCache(filePath?: string) {
    if (filePath) {
      this.cache.delete(filePath);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
