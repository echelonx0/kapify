import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 lg:px-8 py-6">
          <h1 class="text-3xl font-bold text-slate-900">Buy Credits</h1>
          <p class="text-sm text-slate-600 mt-1">
            Purchase credits for funding applications
          </p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        @if (status() === 'success') {
        <!-- Success State -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-12 text-center"
        >
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg
              class="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            Payment Successful!
          </h2>
          <p class="text-slate-600 mb-6">
            Your credits have been added to your account.
          </p>

          <div
            class="bg-green-50 border border-green-200/50 rounded-xl p-6 mb-8 inline-block"
          >
            <p class="text-sm text-slate-600 mb-1">Session ID</p>
            <p class="font-mono text-xs text-slate-900 break-all">
              {{ sessionId() }}
            </p>
          </div>

          <div class="flex gap-4 justify-center">
            <button
              (click)="goToInvoices()"
              class="bg-teal-500 text-white font-medium rounded-xl px-6 py-2.5 text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
            >
              View Invoices
            </button>
            <button
              (click)="goToDashboard()"
              class="bg-slate-100 text-slate-700 font-medium rounded-xl px-6 py-2.5 text-sm hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        } @else if (status() === 'cancelled') {
        <!-- Cancelled State -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-12 text-center"
        >
          <div
            class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg
              class="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            Payment Cancelled
          </h2>
          <p class="text-slate-600 mb-8">
            You cancelled the payment. No charges were made.
          </p>

          <button
            (click)="goToPricing()"
            class="bg-teal-500 text-white font-medium rounded-xl px-6 py-2.5 text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
        } @else {
        <!-- Default State -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-12 text-center"
        >
          <div
            class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg
              class="w-8 h-8 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">
            Purchase Credits
          </h2>
          <p class="text-slate-600 mb-8">
            Get credits to apply for funding opportunities on Kapify
          </p>

          <div class="space-y-4 max-w-md mx-auto mb-8">
            <div class="border border-slate-200 rounded-xl p-4 text-left">
              <p class="text-sm font-semibold text-slate-900">Basic Package</p>
              <p class="text-2xl font-bold text-teal-600">R100</p>
              <p class="text-xs text-slate-600">10,000 credits</p>
            </div>
            <div class="border border-slate-200 rounded-xl p-4 text-left">
              <p class="text-sm font-semibold text-slate-900">
                Standard Package
              </p>
              <p class="text-2xl font-bold text-teal-600">R500</p>
              <p class="text-xs text-slate-600">50,000 credits</p>
            </div>
          </div>

          <button
            (click)="goToPricing()"
            class="bg-teal-500 text-white font-medium rounded-xl px-6 py-2.5 text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
          >
            Buy Credits
          </button>
        </div>
        }
      </main>
    </div>
  `,
})
export class CreditsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  status = signal<'success' | 'cancelled' | null>(null);
  sessionId = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const queryStatus = params['status'];
      const sessionId = params['session_id'];

      if (queryStatus === 'success' || queryStatus === 'cancelled') {
        this.status.set(queryStatus);
        if (sessionId) {
          this.sessionId.set(sessionId);
        }
      }
    });
  }

  goToInvoices() {
    this.router.navigate(['/invoice']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToPricing() {
    this.router.navigate(['/pricing']);
  }
}
