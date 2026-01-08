import {
  Component,
  signal,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Send,
  CircleCheckBig,
} from 'lucide-angular';

import { AuthService } from 'src/app/auth/services/production.auth.service';
import {
  SupportService,
  SupportCategory,
  CreateSupportTicketInput,
} from './support.service';

@Component({
  selector: 'app-support-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      (click)="closeModal()"
    >
      <!-- Modal -->
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col lg:flex-row"
        (click)="$event.stopPropagation()"
      >
        <!-- Left Panel - Contact Info (Hidden on mobile, visible on lg) -->
        <div
          class="hidden lg:flex lg:w-2/5 bg-slate-50 p-8 flex-col justify-between border-r border-slate-200"
        >
          <div>
            <p
              class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2"
            >
              Get In Touch
            </p>
            <h2 class="text-3xl font-bold text-slate-900 mb-4">Contact Us</h2>
            <p class="text-sm text-slate-600 leading-relaxed mb-8">
              We're here to help. Reach out to us through any of these channels
              and we'll get back to you as soon as possible.
            </p>
          </div>

          <!-- Contact Methods -->
          <div class="space-y-6">
            <!-- Location -->
            <div class="flex gap-4">
              <div
                class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon
                  [img]="MapPinIcon"
                  [size]="20"
                  class="text-teal-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 text-sm">Location</h3>
                <p class="text-xs text-slate-600 mt-1">
                  Cape Town, Western Cape<br />
                  South Africa
                </p>
              </div>
            </div>

            <!-- Phone -->
            <div class="flex gap-4">
              <div
                class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon
                  [img]="PhoneIcon"
                  [size]="20"
                  class="text-teal-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 text-sm">
                  Phone / WhatsApp
                </h3>
                <p class="text-xs text-slate-600 mt-1">+27 (0) 21 XXX XXXX</p>
              </div>
            </div>

            <!-- Email -->
            <div class="flex gap-4">
              <div
                class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon
                  [img]="MailIcon"
                  [size]="20"
                  class="text-teal-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 text-sm">E-mail</h3>
                <p class="text-xs text-slate-600 mt-1">{{ supportEmail }}</p>
              </div>
            </div>

            <!-- Booking -->
            <div class="flex gap-4">
              <div
                class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon
                  [img]="CalendarIcon"
                  [size]="20"
                  class="text-teal-600"
                />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 text-sm">
                  Booking a Schedule
                </h3>
                <p class="text-xs text-slate-600 mt-1">Via Calendly</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel - Form -->
        <div class="w-full lg:w-3/5 p-6 lg:p-8 overflow-y-auto">
          <!-- Close Button (Mobile & Desktop) -->
          <button
            (click)="closeModal()"
            class="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Close modal"
          >
            <lucide-icon [img]="XIcon" [size]="24" class="text-slate-600" />
          </button>

          <!-- Success State -->
          @if (isSubmitted()) {
          <div
            class="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div
              class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
            >
              <lucide-icon
                [img]="CheckCircleIcon"
                [size]="32"
                class="text-green-600"
              />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Thank You!</h3>
            <p class="text-sm text-slate-600 mb-6 max-w-sm">
              Your support request has been received. We'll review it and get
              back to you shortly.
            </p>
            <button
              (click)="closeModal()"
              class="inline-flex items-center gap-2 bg-teal-500 text-white font-medium rounded-xl px-6 py-2.5 text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
          } @else {
          <!-- Form Header -->
          <div class="mb-8">
            <p
              class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2"
            >
              Contact Us
            </p>
            <h2 class="text-2xl lg:text-3xl font-bold text-slate-900">
              Fill Up The Form
            </h2>
          </div>

          <!-- Form -->
          <form (ngSubmit)="submitForm()" class="space-y-5">
            <!-- Name & Email Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Name -->
              <div>
                <label
                  for="name"
                  class="block text-xs font-semibold text-slate-900 mb-2"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  placeholder="Your name"
                  required
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
                  [disabled]="isLoading()"
                />
              </div>

              <!-- Email -->
              <div>
                <label
                  for="email"
                  class="block text-xs font-semibold text-slate-900 mb-2"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
                  [disabled]="isLoading()"
                />
              </div>
            </div>

            <!-- Category -->
            <div>
              <label
                for="category"
                class="block text-xs font-semibold text-slate-900 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                [(ngModel)]="formData.category"
                name="category"
                required
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white"
                [disabled]="isLoading()"
              >
                <option value="" disabled>Select a category</option>
                <option value="account">Account & Profile</option>
                <option value="technical">Technical Issues</option>
                <option value="billing">Billing & Payments</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Subject -->
            <div>
              <label
                for="subject"
                class="block text-xs font-semibold text-slate-900 mb-2"
              >
                Subject
              </label>
              <input
                id="subject"
                type="text"
                [(ngModel)]="formData.subject"
                name="subject"
                placeholder="Brief subject of your inquiry"
                required
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
                [disabled]="isLoading()"
              />
            </div>

            <!-- Message -->
            <div>
              <label
                for="message"
                class="block text-xs font-semibold text-slate-900 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                [(ngModel)]="formData.message"
                name="message"
                placeholder="Tell us how we can help..."
                required
                rows="5"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 resize-none"
                [disabled]="isLoading()"
              ></textarea>
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
            <div
              class="p-3 bg-red-50 border border-red-200/50 rounded-lg flex gap-3"
            >
              <div
                class="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <span class="text-xs font-bold text-red-600">!</span>
              </div>
              <p class="text-sm text-red-700">{{ errorMessage() }}</p>
            </div>
            }

            <!-- Submit Button -->
            <div class="pt-4">
              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full inline-flex items-center justify-center gap-2 bg-teal-500 text-white font-medium rounded-xl px-6 py-3 text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isLoading()) {
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                <span>Sending...</span>
                } @else {
                <lucide-icon [img]="SendIcon" [size]="16" />
                <span>Send Message</span>
                }
              </button>
            </div>
          </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportModalComponent implements OnInit {
  private supportService = inject(SupportService);
  private authService = inject(AuthService);

  // Icons
  XIcon = X;
  MapPinIcon = MapPin;
  PhoneIcon = Phone;
  MailIcon = Mail;
  CalendarIcon = Calendar;
  SendIcon = Send;
  CheckCircleIcon = CircleCheckBig;
  supportEmail = 'support@kapify.africa';
  // State
  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string | null>(null);

  formData = {
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '' as SupportCategory,
  };

  ngOnInit(): void {
    this.prefillUserData();
  }

  private prefillUserData(): void {
    const user = this.authService.user();
    if (user) {
      this.formData.email = user.email || '';
      // Name could come from profile, but we leave it empty for user to fill
    }
  }

  submitForm(): void {
    // Validate
    if (
      !this.formData.name.trim() ||
      !this.formData.email.trim() ||
      !this.formData.subject.trim() ||
      !this.formData.message.trim() ||
      !this.formData.category
    ) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const input: CreateSupportTicketInput = {
      name: this.formData.name.trim(),
      email: this.formData.email.trim(),
      subject: this.formData.subject.trim(),
      message: this.formData.message.trim(),
      category: this.formData.category,
    };

    this.supportService.createTicket(input).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.message || 'Failed to send message. Please try again.'
        );
        console.error('Support ticket error:', error);
      },
    });
  }

  closeModal(): void {
    // This will be handled by parent component
    // Emit or use a signal to trigger close
    window.dispatchEvent(new CustomEvent('closeSupport'));
  }
}
