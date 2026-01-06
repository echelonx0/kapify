// newsletter-signup.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Mail, CheckCircle } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="relative w-full overflow-hidden mt-6">
      <!-- Animated Background Shapes -->
      <div class="absolute inset-0 overflow-hidden z-0">
        <div
          class="absolute w-96 h-96 -top-24 -right-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-15 animate-pulse"
          style="animation: float 8s ease-in-out infinite;"
        ></div>
        <div
          class="absolute w-72 h-72 -bottom-20 -left-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 opacity-15 animate-pulse"
          style="animation: float 10s ease-in-out infinite 1s;"
        ></div>
        <div
          class="absolute w-56 h-56 top-1/2 left-1/4 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 opacity-15 animate-pulse"
          style="animation: float 12s ease-in-out infinite 2s;"
        ></div>
      </div>

      <!-- Main Card -->
      <div
        class="relative z-10 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/20 rounded-2xl p-8 backdrop-blur-md min-h-96 flex flex-col justify-center shadow-2xl transition-all hover:border-slate-600/40 hover:shadow-3xl"
      >
        <!-- Success State -->
        <div
          *ngIf="isSubscribed()"
          class="flex flex-col items-center justify-center text-center animate-in fade-in duration-400"
        >
          <div
            class="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 flex items-center justify-center mb-4 animate-in scale-in-95 duration-500"
          >
            <lucide-icon
              [img]="CheckCircleIcon"
              [size]="32"
              class="text-green-400"
            />
          </div>
          <h3
            class="text-lg font-bold text-white mb-1 animate-in slide-in-from-top duration-500 delay-200"
          >
            Welcome aboard!
          </h3>
          <p
            class="text-sm text-slate-300 animate-in slide-in-from-top duration-500 delay-300"
          >
            Check your inbox in 24 hours
          </p>
        </div>

        <!-- Email Form -->
        <div *ngIf="!isSubscribed()" class="animate-in fade-in duration-400">
          <!-- Icon Header -->
          <div
            class="flex justify-center mb-6 animate-in slide-in-from-top duration-500 delay-100"
          >
            <div
              class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-slate-600/30 flex items-center justify-center text-blue-300 animate-pulse"
            >
              <lucide-icon [img]="MailIcon" [size]="24" />
            </div>
          </div>

          <!-- Content -->
          <div class="text-center mb-6">
            <h3
              class="text-xl font-bold text-white mb-1 animate-in slide-in-from-top duration-500 delay-200"
            >
              Weekly opportunities
            </h3>
            <p
              class="text-sm text-slate-300 animate-in slide-in-from-top duration-500 delay-300"
            >
              Curated funding matches every week
            </p>
          </div>

          <!-- Input & Button -->
          <div
            class="flex gap-2 mb-4 animate-in slide-in-from-bottom duration-500 delay-300"
          >
            <input
              type="email"
              placeholder="your@email.com"
              [(ngModel)]="emailAddress"
              [disabled]="isSubmitting()"
              class="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm placeholder-slate-500 transition-all focus:outline-none focus:border-blue-500/50 focus:bg-slate-900/70 focus:ring-3 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            />
            <button
              (click)="subscribe()"
              [disabled]="!isValidEmail() || isSubmitting()"
              class="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span *ngIf="!isSubmitting()" class="block">Send</span>
              <div
                *ngIf="isSubmitting()"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
            </button>
          </div>

          <!-- Trust Badge -->
          <p class="text-xs text-slate-500 text-center">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>

      <!-- CSS Animations -->
      <style>
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      </style>
    </div>
  `,
})
export class NewsletterSignupComponent {
  MailIcon = Mail;
  CheckCircleIcon = CheckCircle;

  emailAddress = '';
  isSubmitting = signal(false);
  isSubscribed = signal(false);

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.emailAddress);
  }

  async subscribe() {
    if (!this.isValidEmail() || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would integrate with your actual newsletter service
      // await this.newsletterService.subscribe(this.emailAddress);

      this.isSubscribed.set(true);
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      // Handle error - show error message
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
