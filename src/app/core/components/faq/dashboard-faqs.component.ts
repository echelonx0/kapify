import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { FAQService, FAQ } from '../../services/faq.service';

@Component({
  selector: 'app-dashboard-faqs',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header with Back Button -->
        <div class="mb-8 flex items-center gap-4">
          <button
            (click)="goBack()"
            class="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            aria-label="Go back"
          >
            <lucide-angular
              [img]="ArrowLeftIcon"
              [size]="20"
              class="text-slate-600"
            />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </h1>
            <p class="text-slate-600 mt-1">
              Answers to help you get the most out of Kapify
            </p>
          </div>
        </div>

        <!-- Search -->
        <div class="mb-8">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search FAQs..."
              class="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
        <div class="text-center py-12">
          <div
            class="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"
          ></div>
          <p class="text-sm text-slate-600 mt-4">Loading FAQs...</p>
        </div>
        }

        <!-- Error State -->
        @else if (error()) {
        <div class="bg-red-50 border border-red-200/50 rounded-2xl p-6">
          <p class="text-red-700 font-medium">{{ error() }}</p>
        </div>
        }

        <!-- Main Content -->
        @else {
        <!-- Categories -->
        @if (categories().length > 0) {
        <div class="mb-8">
          <div
            class="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto scrollbar-hide"
          >
            @for (cat of categories(); track cat) {
            <button
              (click)="setActiveCategory(cat)"
              [class.active]="activeCategory() === cat"
              class="px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200"
              [ngClass]="{
                'bg-teal-500 text-white': activeCategory() === cat,
                'bg-slate-100 text-slate-700 hover:bg-slate-200':
                  activeCategory() !== cat
              }"
            >
              {{ cat | titlecase }}
            </button>
            }
          </div>
        </div>
        }

        <!-- FAQs List -->
        <div class="space-y-4">
          @if (filteredFAQs().length === 0) {
          <div class="text-center py-12">
            <p class="text-slate-600">No FAQs found matching your search</p>
          </div>
          } @else { @for (faq of filteredFAQs(); track faq.id) {
          <div
            class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            <button
              (click)="toggleFAQ(faq.id)"
              class="w-full px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors duration-200 text-left"
            >
              <span class="font-semibold text-slate-900 text-base">{{
                faq.question
              }}</span>
              <lucide-angular
                [img]="
                  expandedFAQ() === faq.id ? ChevronUpIcon : ChevronDownIcon
                "
                [size]="20"
                class="text-slate-600 flex-shrink-0 mt-0.5"
              />
            </button>

            @if (expandedFAQ() === faq.id) {
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div class="text-slate-700 text-sm leading-relaxed">
                {{ faq.answer }}
              </div>
            </div>
            }
          </div>
          } }
        </div>
        }
      </div>
    </div>
  `,
})
export class DashboardFAQsComponent implements OnInit {
  private faqService = inject(FAQService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly SearchIcon = Search;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly ArrowLeftIcon = ArrowLeft;

  // State Signals
  isLoading = signal(false);
  error = signal<string | null>(null);
  allFAQs = signal<FAQ[]>([]);
  activeCategory = signal('');
  expandedFAQ = signal<string | null>(null);
  searchQuery = signal('');

  // Computed Properties
  readonly categories = computed(() => {
    const cats = Array.from(new Set(this.allFAQs().map((f) => f.category)));

    return cats.sort((a, b) => {
      if (a === 'Getting Started') return -1;
      if (b === 'Getting Started') return 1;
      return a.localeCompare(b);
    });
  });

  readonly filteredFAQs = computed(() => {
    let faqs = this.allFAQs().sort((a, b) => a.sort_order - b.sort_order);

    // Filter by category
    if (this.activeCategory()) {
      faqs = faqs.filter((f) => f.category === this.activeCategory());
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      faqs = faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(query) ||
          f.answer.toLowerCase().includes(query)
      );
    }

    return faqs;
  });

  ngOnInit(): void {
    this.loadFAQs();
  }

  /**
   * Load FAQs filtered by current user type
   */
  private loadFAQs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const userType = this.authService.user()?.userType as
      | 'sme'
      | 'funder'
      | undefined;

    if (!userType) {
      this.error.set('Unable to determine user type. Please log in again.');
      this.isLoading.set(false);
      return;
    }

    this.faqService.getFAQsByUserType(userType).subscribe({
      next: (faqs) => {
        this.allFAQs.set(faqs);

        // Auto-select first category if available
        if (faqs.length > 0 && !this.activeCategory()) {
          const cats = new Set(faqs.map((f) => f.category));
          const firstCat = Array.from(cats).sort()[0];
          if (firstCat) this.setActiveCategory(firstCat);
          // Auto-select category
          const categories = this.categories();

          if (categories.length > 0) {
            const defaultCategory = categories.includes('Getting Started')
              ? 'Getting Started'
              : categories[0];

            this.setActiveCategory(defaultCategory);
          }
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load FAQs:', err);
        this.error.set('Failed to load FAQs. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Set active category filter
   */
  setActiveCategory(category: string): void {
    this.activeCategory.set(category);
  }

  /**
   * Toggle FAQ expansion
   */
  toggleFAQ(id: string): void {
    this.expandedFAQ.set(this.expandedFAQ() === id ? null : id);
  }

  /**
   * Navigate back to dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard/home']);
  }
}
