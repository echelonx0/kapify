
// newsletter-signup.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Mail, Users, Clock, CheckCircle, Send } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="card-gradient mt-4">
      <div class="card-content bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden relative">
        
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')]"></div>
        </div>
        
        <div class="relative z-10">
          <!-- Header -->
          <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <lucide-icon [img]="MailIcon" [size]="28" />
            </div>
            <h3 class="text-xl font-bold mb-2">Stay in the loop</h3>
            <p class="text-primary-100 text-sm leading-relaxed">
              Get exclusive funding opportunities and expert insights delivered weekly
            </p>
          </div>
          
          <!-- Success State -->
          <div *ngIf="isSubscribed()" class="text-center py-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-2xl mb-4">
              <lucide-icon [img]="CheckCircleIcon" [size]="28" class="text-green-300" />
            </div>
            <h3 class="text-lg font-bold mb-2">Welcome aboard!</h3>
            <p class="text-primary-100 text-sm">
              You'll receive your first funding insights email within 24 hours.
            </p>
          </div>
          
          <!-- Email Form -->
          <div *ngIf="!isSubscribed()" class="space-y-4 mb-6">
            <div class="relative">
              <input 
                type="email" 
                placeholder="Enter your email address"
                [(ngModel)]="emailAddress"
                [disabled]="isSubmitting()"
                class="w-full px-4 py-4 rounded-xl  border border-white/20   text-white focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all backdrop-blur-sm disabled:opacity-50"
              />
            </div>
            <button 
              (click)="subscribe()"
              [disabled]="!isValidEmail() || isSubmitting()"
              class="w-full bg-white text-primary-600 py-4 rounded-xl font-semibold hover:bg-neutral-100 transition-all transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2">
              
              <span *ngIf="isSubmitting()">
                <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                Subscribing...
              </span>
              
              <span *ngIf="!isSubmitting()">
              
                Get Access
              </span>
            </button>
          </div>
          
          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center">
              <div class="flex items-center justify-center mb-2">
                <lucide-icon [img]="UsersIcon" [size]="16" class="text-white/80" />
              </div>
              <div class="text-lg font-bold">5,000+</div>
              <div class="text-xs text-primary-200">Subscribers</div>
            </div>
            <div class="text-center">
              <div class="flex items-center justify-center mb-2">
                <lucide-icon [img]="ClockIcon" [size]="16" class="text-white/80" />
              </div>
              <div class="text-lg font-bold">Weekly</div>
              <div class="text-xs text-primary-200">Updates</div>
            </div>
            <div class="text-center">
              <div class="flex items-center justify-center mb-2">
                <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-white/80" />
              </div>
              <div class="text-lg font-bold">Free</div>
              <div class="text-xs text-primary-200">Forever</div>
            </div>
          </div>
          
          <!-- Benefits List -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-sm">
              <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-300" />
              <span class="text-primary-100">Early access to new opportunities</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-300" />
              <span class="text-primary-100">Expert funding strategies & tips</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-300" />
              <span class="text-primary-100">Market insights & trends</span>
            </div>
          </div>
          
          <!-- Trust Badge -->
          <div class="text-center pt-4 border-t border-white/20">
            <p class="text-xs text-primary-200">
              No spam, unsubscribe anytime. Privacy guaranteed.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NewsletterSignupComponent {
  MailIcon = Mail;
  UsersIcon = Users;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  SendIcon = Send;

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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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