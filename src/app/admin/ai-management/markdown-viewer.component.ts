// src/app/admin/ai-management/markdown-viewer.component.ts
import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MarkdownService,
  MarkdownContent,
  MarkdownSection,
} from '../services/markdown.service';
import {
  LucideAngularModule,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  RefreshCw,
} from 'lucide-angular';

@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="markdown-viewer">
      @if (loading()) {
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <lucide-icon
            [img]="RefreshCwIcon"
            [size]="32"
            class="text-teal-500 animate-spin mx-auto mb-3"
          />
          <p class="text-sm text-slate-600">Loading documentation...</p>
        </div>
      </div>
      } @else if (error()) {
      <div class="bg-red-50 border border-red-200/50 rounded-xl p-6">
        <div class="flex items-start space-x-3">
          <lucide-icon
            [img]="FileTextIcon"
            [size]="20"
            class="text-red-600 flex-shrink-0"
          />
          <div>
            <h3 class="text-sm font-semibold text-red-900">
              Failed to Load Documentation
            </h3>
            <p class="text-xs text-red-700 mt-1">{{ error() }}</p>
            @if (filePath) {
            <p class="text-xs text-red-600 mt-2 font-mono">{{ filePath }}</p>
            }
          </div>
        </div>
      </div>
      } @else if (content()) {
      <!-- Navigation (Table of Contents) -->
      @if (showToc && content()!.sections.length > 0) {
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-900">
            Table of Contents
          </h3>
          <button
            (click)="toggleToc()"
            class="p-1 hover:bg-slate-200 rounded transition-colors"
          >
            <lucide-icon
              [img]="tocExpanded() ? ChevronDownIcon : ChevronRightIcon"
              [size]="16"
              class="text-slate-600"
            />
          </button>
        </div>

        @if (tocExpanded()) {
        <nav class="space-y-1">
          @for (section of getTopLevelSections(); track section.title) {
          <a
            (click)="scrollToSection(section.title)"
            class="block text-sm text-slate-700 hover:text-teal-600 hover:bg-white px-3 py-2 rounded-lg cursor-pointer transition-colors"
            [class.font-semibold]="section.level === 1"
            [style.padding-left.rem]="section.level"
          >
            {{ section.title }}
          </a>
          }
        </nav>
        }
      </div>
      }

      <!-- Markdown Content -->
      <div
        class="markdown-content bg-white rounded-2xl border border-slate-200 p-8"
        [innerHTML]="content()!.html"
      ></div>

      <!-- Actions -->
      <div class="flex items-center justify-between mt-6">
        <div class="flex items-center space-x-2">
          <button
            (click)="reload()"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
            Reload
          </button>
        </div>

        <div class="text-xs text-slate-500">
          {{ content()!.sections.length }} sections
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .markdown-content {
        /* Typography */
        font-size: 0.875rem;
        line-height: 1.7;
        color: #334155;
      }

      :host ::ng-deep .markdown-content h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 2rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
      }

      :host ::ng-deep .markdown-content h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 2rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      :host ::ng-deep .markdown-content h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #0f172a;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }

      :host ::ng-deep .markdown-content h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #334155;
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }

      :host ::ng-deep .markdown-content h5,
      :host ::ng-deep .markdown-content h6 {
        font-size: 1rem;
        font-weight: 600;
        color: #334155;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }

      :host ::ng-deep .markdown-content p {
        margin-bottom: 1rem;
      }

      :host ::ng-deep .markdown-content ul,
      :host ::ng-deep .markdown-content ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
      }

      :host ::ng-deep .markdown-content li {
        margin-bottom: 0.5rem;
      }

      :host ::ng-deep .markdown-content ul li {
        list-style-type: disc;
      }

      :host ::ng-deep .markdown-content ol li {
        list-style-type: decimal;
      }

      /* Code Blocks */
      :host ::ng-deep .markdown-content .code-block {
        margin: 1.5rem 0;
        border-radius: 0.75rem;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      :host ::ng-deep .markdown-content .code-header {
        background: #f1f5f9;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid #e2e8f0;
      }

      :host ::ng-deep .markdown-content .code-language {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      :host ::ng-deep .markdown-content pre {
        background: #f8fafc;
        padding: 1rem;
        overflow-x: auto;
        margin: 0;
      }

      :host ::ng-deep .markdown-content pre code {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        color: #334155;
        background: transparent;
        padding: 0;
        border: none;
      }

      /* Inline Code */
      :host ::ng-deep .markdown-content .inline-code,
      :host ::ng-deep .markdown-content code:not(pre code) {
        background: #f1f5f9;
        color: #0f172a;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875em;
        border: 1px solid #e2e8f0;
      }

      /* Links */
      :host ::ng-deep .markdown-content .markdown-link {
        color: #0d9488;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }

      :host ::ng-deep .markdown-content .markdown-link:hover {
        color: #0f766e;
        text-decoration: underline;
      }

      :host ::ng-deep .markdown-content .external-link-icon {
        display: inline-block;
        margin-left: 0.25rem;
        vertical-align: middle;
      }

      /* Tables */
      :host ::ng-deep .markdown-content .table-wrapper {
        overflow-x: auto;
        margin: 1.5rem 0;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
      }

      :host ::ng-deep .markdown-content .markdown-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      :host ::ng-deep .markdown-content .markdown-table thead {
        background: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
      }

      :host ::ng-deep .markdown-content .markdown-table th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #0f172a;
      }

      :host ::ng-deep .markdown-content .markdown-table td {
        padding: 0.75rem 1rem;
        border-top: 1px solid #e2e8f0;
      }

      :host ::ng-deep .markdown-content .markdown-table tbody tr:hover {
        background: #f8fafc;
      }

      /* Blockquotes */
      :host ::ng-deep .markdown-content blockquote {
        border-left: 4px solid #14b8a6;
        padding-left: 1rem;
        margin: 1.5rem 0;
        color: #475569;
        font-style: italic;
        background: #f0fdfa;
        padding: 1rem;
        border-radius: 0.5rem;
      }

      /* Horizontal Rules */
      :host ::ng-deep .markdown-content hr {
        border: none;
        border-top: 2px solid #e2e8f0;
        margin: 2rem 0;
      }

      /* Images */
      :host ::ng-deep .markdown-content img {
        max-width: 100%;
        height: auto;
        border-radius: 0.75rem;
        margin: 1.5rem 0;
        border: 1px solid #e2e8f0;
      }

      /* Strong/Bold */
      :host ::ng-deep .markdown-content strong {
        font-weight: 600;
        color: #0f172a;
      }

      /* Emphasis/Italic */
      :host ::ng-deep .markdown-content em {
        font-style: italic;
        color: #475569;
      }
    `,
  ],
})
export class MarkdownViewerComponent implements OnInit {
  @Input() filePath?: string;
  @Input() showToc = true;

  private markdownService = inject(MarkdownService);

  // Icons
  FileTextIcon = FileText;
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  ExternalLinkIcon = ExternalLink;
  DownloadIcon = Download;
  RefreshCwIcon = RefreshCw;

  // State
  content = signal<MarkdownContent | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  tocExpanded = signal(true);

  ngOnInit() {
    if (this.filePath) {
      this.loadMarkdown();
    }
  }

  loadMarkdown() {
    if (!this.filePath) {
      this.error.set('No file path provided');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.markdownService.loadMarkdown(this.filePath).subscribe({
      next: (content) => {
        this.content.set(content);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load documentation');
        this.loading.set(false);
      },
    });
  }

  reload() {
    this.markdownService.clearCache(this.filePath);
    this.loadMarkdown();
  }

  toggleToc() {
    this.tocExpanded.update((v) => !v);
  }

  getTopLevelSections(): MarkdownSection[] {
    if (!this.content()) return [];
    // Show h1, h2, and h3 sections in TOC
    return this.content()!.sections.filter((s) => s.level <= 3);
  }

  scrollToSection(title: string) {
    // Try multiple ID generation strategies
    const possibleIds = [
      title.toLowerCase().replace(/[^\w]+/g, '-'), // marked default
      title.toLowerCase().replace(/\s+/g, '-'), // simple spaces to dashes
      title.replace(/\s+/g, '-'), // preserve case
    ];

    for (const id of possibleIds) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Fallback: search by heading text
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const heading of Array.from(headings)) {
      if (heading.textContent?.trim() === title) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }
}
