import { Component, Input, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LayoutAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export interface LayoutHeader {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; action?: () => void }[];
  badge?: { label: string; value: string | number; color?: string };
}

/**
 * FundingRequestLayoutComponent
 *
 * Unified wrapper for all funding request views:
 * - Editor, Upload, Demographics
 *
 * Features:
 * - Sticky header with breadcrumbs and badge
 * - Scrollable content area
 * - Sticky footer with primary/secondary actions
 * - Centralized error/success messaging
 * - Neo-brutalist styling (border-3/4, bold typography)
 *
 * No data logic—purely presentational.
 */
@Component({
  selector: 'app-funding-request-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col bg-slate-50 ml-12">
      <!-- ===== HEADER ===== -->
      <div
        class="flex-shrink-0 px-4 lg:px-8 py-6 border-b-4 border-slate-200 bg-white sticky top-0 z-10"
      >
        <!-- Breadcrumbs (optional) -->
        <div
          *ngIf="header.breadcrumbs?.length"
          class="mb-4 flex items-center gap-2"
        >
          @for (crumb of header.breadcrumbs; track $index) {
          <button
            *ngIf="crumb.action"
            (click)="crumb.action()"
            class="text-xs font-semibold text-teal-600 hover:text-teal-700 uppercase tracking-widest"
          >
            {{ crumb.label }}
          </button>
          <span
            *ngIf="!crumb.action"
            class="text-xs font-semibold text-slate-600 uppercase tracking-widest"
          >
            {{ crumb.label }}
          </span>
          @if ($index < header.breadcrumbs!.length - 1) {
          <span class="text-slate-400">/</span>
          } }
        </div>

        <!-- Title + Badge -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">
              {{ header.title }}
            </h1>
            <p *ngIf="header.subtitle" class="text-sm text-slate-600 mt-2">
              {{ header.subtitle }}
            </p>
          </div>

          <!-- Badge (completion %, status, etc.) -->
          <div
            *ngIf="header.badge"
            class="text-right flex-shrink-0"
            [ngClass]="getBadgeColorClass(header.badge.color)"
          >
            <div class="text-3xl font-black">{{ header.badge.value }}</div>
            <p class="text-xs font-semibold mt-1">{{ header.badge.label }}</p>
          </div>
        </div>
      </div>

      <!-- ===== ERROR DISPLAY ===== -->
      <div
        *ngIf="error()"
        class="flex-shrink-0 px-4 lg:px-8 py-4 bg-red-50 border-b-4 border-red-400 flex items-center gap-3 justify-between animate-in fade-in duration-200"
      >
        <div class="flex items-center gap-3">
          <svg
            class="w-5 h-5 text-red-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <p class="font-bold text-red-700 text-sm">{{ error() }}</p>
        </div>
      </div>

      <!-- ===== SUCCESS DISPLAY ===== -->
      <div
        *ngIf="success()"
        class="flex-shrink-0 px-4 lg:px-8 py-4 bg-green-50 border-b-4 border-green-400 flex items-center gap-3 animate-in fade-in duration-200"
      >
        <svg
          class="w-5 h-5 text-green-600 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <p class="font-bold text-green-700 text-sm">{{ success() }}</p>
      </div>

      <!-- ===== CONTENT AREA ===== -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <ng-content />
      </div>

      <!-- ===== FOOTER: ACTIONS ===== -->
      <div
        *ngIf="actions.length"
        class="flex-shrink-0 sticky bottom-0 z-30 bg-white border-t-4 border-slate-300 px-4 lg:px-8 py-4 flex items-center justify-between gap-4 shadow-lg shadow-slate-200/20"
      >
        <!-- Left: Metadata (optional) -->
        <div *ngIf="metadata" class="text-xs text-slate-600">
          <p class="font-semibold">{{ metadata }}</p>
        </div>

        <!-- Right: Actions -->
        <div class="flex gap-3 ml-auto">
          @for (action of actions; track $index) {
          <button
            (click)="action.action()"
            [disabled]="action.disabled || action.loading"
            [ngClass]="{
              'bg-teal-600 text-white font-black border-3 border-teal-700 hover:bg-teal-700 active:bg-teal-800':
                action.variant === 'primary',
              'bg-slate-100 text-slate-700 font-semibold border border-slate-200 hover:bg-slate-200 active:bg-slate-300':
                action.variant === 'secondary' || !action.variant,
              'bg-red-50 text-red-700 font-semibold border border-red-200 hover:bg-red-100 active:bg-red-200':
                action.variant === 'danger',
              'opacity-50 cursor-not-allowed': action.disabled || action.loading,
            }"
            class="flex items-center justify-center gap-2 px-5 lg:px-6 py-2.5 rounded-lg text-sm uppercase tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            @if (action.loading) {
            <div
              class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            ></div>
            }
            <span>{{ action.label }}</span>
          </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }
    `,
  ],
})
export class FundingRequestLayoutComponent {
  @Input() header!: LayoutHeader;
  @Input() actions: LayoutAction[] = [];
  @Input() metadata?: string;
  @Input() error: Signal<string | null> = signal<string | null>(null);
  @Input() success: Signal<string | null> = signal<string | null>(null);

  /**
   * Map badge color to Tailwind classes
   */
  getBadgeColorClass(color?: string): string {
    switch (color) {
      case 'teal':
        return 'text-teal-600';
      case 'green':
        return 'text-green-600';
      case 'amber':
        return 'text-amber-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-teal-600';
    }
  }
}
