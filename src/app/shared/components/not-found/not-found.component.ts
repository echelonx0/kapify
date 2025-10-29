import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Home, ArrowLeft, Search } from 'lucide-angular';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4"
    >
      <div class="max-w-lg w-full text-center">
        <!-- Large 404 -->
        <div class="mb-8">
          <h1 class="text-9xl font-bold text-neutral-200 leading-none">404</h1>
          <div class="relative -mt-8">
            <div class="absolute inset-0 flex items-center justify-center">
              <lucide-icon
                [img]="SearchIcon"
                [size]="48"
                class="text-neutral-400"
              ></lucide-icon>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-neutral-900 mb-3">
            Page Not Found
          </h2>
          <p class="text-neutral-600 text-lg leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Don't
            worry, let's get you back on track.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-4">
          <button
            (click)="goBack()"
            class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <lucide-icon
              [img]="ArrowLeftIcon"
              [size]="20"
              class="mr-2"
            ></lucide-icon>
            Go Back
          </button>

          <a
            routerLink="/dashboard"
            class="w-full border-2 border-neutral-300 hover:border-primary-300 hover:bg-primary-50 text-neutral-700 hover:text-primary-700 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            <lucide-icon
              [img]="HomeIcon"
              [size]="20"
              class="mr-2"
            ></lucide-icon>
            Go to Dashboard
          </a>
        </div>

        <!-- Help Text -->
        <div class="mt-8 pt-6 border-t border-neutral-200">
          <p class="text-sm text-neutral-500">
            Need help?
            <a
              href="mailto:support@kapify.co.za"
              class="text-primary-600 hover:text-primary-700 font-medium"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  HomeIcon = Home;
  ArrowLeftIcon = ArrowLeft;
  SearchIcon = Search;

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback if no history
      window.location.href = '/dashboard';
    }
  }
}
