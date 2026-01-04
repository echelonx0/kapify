import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-angular';
import { FAQService, FAQ } from '../../services/faq.service';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-12">
          <h1 class="text-3xl font-bold text-slate-900">
            Frequently Asked Questions
          </h1>
          <p class="text-slate-600 mt-2">
            Find answers to common questions about Kapify
          </p>
        </div>

        <!-- Search -->
        <div class="mb-8">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search FAQs..."
              class="w-full pl-12 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        @if (isLoading()) {
        <div class="text-center py-12">
          <div class="text-slate-600">Loading FAQs...</div>
        </div>
        } @else if (error()) {
        <div class="bg-red-50 border border-red-200/50 rounded-xl p-6">
          <p class="text-red-700">{{ error() }}</p>
        </div>
        } @else {
        <!-- Categories -->
        @if (categories().length > 0) {
        <div class="mb-8">
          <div
            class="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto"
          >
            @for (cat of categories(); track cat) {
            <button
              (click)="setActiveCategory(cat)"
              [class.active]="activeCategory() === cat"
              class="px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all"
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
            <p class="text-slate-600">No FAQs found</p>
          </div>
          } @else { @for (faq of filteredFAQs(); track faq.id) {
          <div
            class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <button
              (click)="toggleFAQ(faq.id)"
              class="w-full px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors text-left"
            >
              <span class="font-semibold text-slate-900 text-base">{{
                faq.question
              }}</span>
              <lucide-angular
                [img]="
                  expandedFAQ() === faq.id ? ChevronUpIcon : ChevronDownIcon
                "
                class="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5"
              />
            </button>

            @if (expandedFAQ() === faq.id) {
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div class="prose prose-sm max-w-none text-slate-700">
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
export class FAQsComponent implements OnInit {
  private faqService = inject(FAQService);

  readonly SearchIcon = Search;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;

  isLoading = signal(false);
  error = signal<string | null>(null);
  allFAQs = signal<FAQ[]>([]);
  activeCategory = signal('');
  expandedFAQ = signal<string | null>(null);
  searchQuery = signal('');

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

    if (this.activeCategory()) {
      faqs = faqs.filter((f) => f.category === this.activeCategory());
    }

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

  private loadFAQs(): void {
    this.isLoading.set(true);
    console.log('Loading all FAQs');
    this.faqService.getFAQs().subscribe({
      next: (faqs) => {
        console.log('Loaded FAQs:', faqs);
        this.allFAQs.set(faqs);
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
        this.error.set('Failed to load FAQs');
        this.isLoading.set(false);
      },
    });
  }

  setActiveCategory(category: string): void {
    this.activeCategory.set(category);
  }

  toggleFAQ(id: string): void {
    this.expandedFAQ.set(this.expandedFAQ() === id ? null : id);
  }
}
