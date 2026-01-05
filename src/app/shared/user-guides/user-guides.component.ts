import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CheckSquare,
  DollarSign,
  BarChart3,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Target,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-angular';
import { GuideService, Guide } from 'src/app/core/admin/services/guide.service';
import { GuideReaderComponent } from './guide-reader.component';

@Component({
  selector: 'app-user-guides',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, GuideReaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Hero Header -->
      <div class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <div class="flex items-center mb-6">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mr-4"
            >
              <lucide-angular
                [img]="SparklesIcon"
                [size]="24"
                class="text-white"
              />
            </div>
            <div>
              <h1 class="text-3xl lg:text-4xl font-bold text-slate-900">
                Funding Readiness Guide
              </h1>
              <p class="text-slate-600 mt-1">
                Master the essentials to prepare your business for funding
                success
              </p>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (stat of stats(); track stat.label) {
            <div class="bg-slate-50 rounded-2xl p-6">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-3xl font-bold text-slate-900 mb-1">
                    {{ stat.value }}
                  </div>
                  <div class="text-sm text-slate-600">{{ stat.label }}</div>
                </div>
                <div
                  class="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center"
                >
                  <lucide-angular
                    [img]="stat.icon"
                    [size]="24"
                    class="text-teal-600"
                  />
                </div>
              </div>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        @if (isLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="relative w-12 h-12 mx-auto mb-4">
              <div
                class="absolute top-0 left-0 w-12 h-12 border-4 border-teal-200 rounded-full"
              ></div>
              <div
                class="absolute top-0 left-0 w-12 h-12 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"
              ></div>
            </div>
            <p class="text-slate-600 font-medium">Loading guides...</p>
          </div>
        </div>
        } @else if (error()) {
        <div
          class="bg-red-50 border border-red-200/50 rounded-2xl p-6 text-center"
        >
          <p class="text-red-700">{{ error() }}</p>
        </div>
        } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content Area -->
          <div class="lg:col-span-2">
            <!-- Featured Guide -->
            @if (featuredGuide()) {
            <div
              class="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8 hover:shadow-md hover:border-teal-300/50 transition-all duration-200 cursor-pointer animate-fade-in"
              (click)="selectGuide(featuredGuide()!)"
            >
              <div
                class="h-48 bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center relative overflow-hidden group"
              >
                <div
                  class="w-24 h-24 rounded-2xl bg-teal-400 opacity-20 absolute -top-12 -right-12 group-hover:scale-110 transition-transform"
                ></div>
                <div
                  class="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <lucide-angular
                    [img]="getIconForGuide(featuredGuide()!)"
                    [size]="40"
                    class="text-white"
                  />
                </div>
              </div>
              <div class="p-6 lg:p-8">
                <span
                  class="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full mb-3"
                >
                  {{ featuredGuide()!.category | titlecase }}
                </span>
                <h2 class="text-2xl font-bold text-slate-900 mb-3">
                  {{ featuredGuide()!.title }}
                </h2>
                <p class="text-slate-600 mb-4 line-clamp-2">
                  {{ featuredGuide()!.description }}
                </p>
                <div class="flex items-center text-sm text-slate-500">
                  <lucide-angular [img]="ClockIcon" [size]="16" class="mr-2" />
                  <span>{{ featuredGuide()!.content.length }} min read</span>
                </div>
              </div>
            </div>
            }

            <!-- Category Tabs -->
            <div class="mb-8">
              <div class="bg-slate-100 rounded-2xl p-2 flex flex-wrap gap-2">
                @for (category of categories(); track category) {
                <button
                  (click)="setActiveCategory(category)"
                  [class.active]="activeCategory() === category"
                  class="tab-button px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200"
                  [ngClass]="{
                    'bg-white text-teal-600 shadow-sm border border-slate-200':
                      activeCategory() === category,
                    'bg-transparent text-slate-600 hover:text-slate-900':
                      activeCategory() !== category
                  }"
                >
                  {{ category | titlecase }}
                </button>
                }
              </div>
            </div>

            <!-- Guides Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              @for (guide of guidesInCategory(); track guide.id) {
              <div
                (click)="selectGuide(guide)"
                class="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-teal-300/50 transition-all duration-200 group animate-fade-in"
                [style.animation-delay.ms]="$index * 50"
              >
                <!-- Icon Background -->
                <div
                  class="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                >
                  <lucide-angular
                    [img]="getIconForGuide(guide)"
                    class="w-7 h-7 text-teal-600"
                  />
                </div>

                <!-- Title -->
                <h3 class="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                  {{ guide.title }}
                </h3>

                <!-- Description -->
                <p class="text-sm text-slate-600 mb-4 line-clamp-2">
                  {{ guide.description }}
                </p>

                <!-- Metadata -->
                <div
                  class="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100"
                >
                  <span>{{ guide.content.length }} min read</span>
                  @if (viewedGuides().has(guide.id)) {
                  <span class="text-teal-600 font-semibold">✓ Read</span>
                  }
                </div>
              </div>
              }
            </div>
          </div>

          <!-- Sidebar: Recommendations -->
          <div class="lg:col-span-1">
            <div
              class="bg-white rounded-2xl border border-slate-200 p-6 sticky top-8 h-fit animate-fade-in"
            >
              <h3 class="font-bold text-slate-900 mb-4 text-lg">
                Recommended Next
              </h3>
              <div class="space-y-3">
                @for (guide of recommendedGuides(); track guide.id) {
                <button
                  (click)="selectGuide(guide)"
                  class="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-teal-50 transition-colors group border border-slate-100 hover:border-teal-200/50"
                >
                  <p
                    class="text-sm font-semibold text-slate-900 group-hover:text-teal-600 line-clamp-2 transition-colors"
                  >
                    {{ guide.title }}
                  </p>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ guide.category | titlecase }}
                  </p>
                  <div
                    class="flex items-center text-teal-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span class="text-xs font-medium">Read guide</span>
                    <lucide-angular
                      [img]="ArrowRightIcon"
                      [size]="14"
                      class="ml-1"
                    />
                  </div>
                </button>
                } @if (recommendedGuides().length === 0) {
                <p class="text-sm text-slate-500 italic text-center py-8">
                  You've explored all guides!
                </p>
                }
              </div>
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Guide Reader Component -->
      @if (selectedGuide()) {
      <app-guide-reader
        [guide]="selectedGuide()!"
        [nextGuide]="nextGuide() || null"
        [hasPrev]="hasPreviousGuide()"
        (close)="closeGuide()"
        (navigateNext)="navigateToNext()"
        (navigatePrev)="navigateToPrev()"
      />
      }
    </div>
  `,
  styles: [
    `
      :host ::ng-deep {
        .prose {
          @apply text-slate-700;
        }
        .prose h1,
        .prose h2,
        .prose h3 {
          @apply text-slate-900 font-bold;
        }
        .prose h1 {
          @apply text-2xl mb-4 mt-6;
        }
        .prose h2 {
          @apply text-xl mb-3 mt-5;
        }
        .prose h3 {
          @apply text-lg mb-2 mt-4;
        }
        .prose p {
          @apply mb-3;
        }
        .prose ul,
        .prose ol {
          @apply mb-4 ml-4;
        }
        .prose li {
          @apply mb-2;
        }
        .prose strong {
          @apply font-bold text-slate-900;
        }
        .prose em {
          @apply italic text-slate-700;
        }
        .prose table {
          @apply border-collapse border border-slate-200 mb-4;
        }
        .prose td,
        .prose th {
          @apply border border-slate-200 px-3 py-2 text-left;
        }
        .prose th {
          @apply bg-slate-100 font-semibold;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.5s ease-out forwards;
        opacity: 0;
      }

      .tab-button {
        @apply transition-all duration-200;
      }
    `,
  ],
})
export class UserGuidesComponent implements OnInit {
  private guideService = inject(GuideService);

  // Icons
  SparklesIcon = Sparkles;
  ClockIcon = Clock;
  ArrowRightIcon = ArrowRight;

  // State
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly allGuides = signal<Guide[]>([]);
  readonly activeCategory = signal('');
  readonly selectedGuide = signal<Guide | null>(null);
  readonly viewedGuides = signal<Set<string>>(new Set());
  readonly recommendedGuides = signal<Guide[]>([]);

  // Computed
  readonly categories = computed(() => {
    const cats = new Set(this.allGuides().map((g) => g.category));
    return Array.from(cats).sort();
  });

  readonly guidesInCategory = computed(() => {
    const guides = this.allGuides().filter(
      (g) => g.category === this.activeCategory()
    );
    return guides.sort((a, b) => a.sort_order - b.sort_order);
  });

  readonly featuredGuide = computed(() => {
    const guides = this.allGuides();
    return guides.length > 0 ? guides[0] : null;
  });

  readonly stats = computed(() => [
    { label: 'Modules', value: this.allGuides().length, icon: BookOpen },
    {
      label: 'Total Read Time',
      value: this.calculateTotalReadTime() + ' mins',
      icon: Clock,
    },
    { label: 'Categories', value: this.categories().length, icon: Target },
  ]);

  readonly nextGuide = computed(() => {
    const current = this.selectedGuide();
    if (!current) return null;

    const currentIdx = this.guidesInCategory().findIndex(
      (g) => g.id === current.id
    );
    if (
      currentIdx === -1 ||
      currentIdx === this.guidesInCategory().length - 1
    ) {
      return null;
    }

    return this.guidesInCategory()[currentIdx + 1];
  });

  readonly hasPreviousGuide = computed(() => {
    const current = this.selectedGuide();
    if (!current) return false;

    const currentIdx = this.guidesInCategory().findIndex(
      (g) => g.id === current.id
    );
    return currentIdx > 0;
  });

  ngOnInit() {
    this.loadGuides();
  }

  private loadGuides() {
    this.isLoading.set(true);
    this.guideService.getAllGuides().subscribe({
      next: (guides) => {
        this.allGuides.set(guides);
        if (guides.length > 0) {
          this.setActiveCategory(guides[0].category);
        }
        this.loadRecommendations();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load guides:', err);
        this.error.set('Failed to load guides');
        this.isLoading.set(false);
      },
    });
  }

  private loadRecommendations() {
    this.guideService.getRandomUnviewedGuides(3).then((recommended) => {
      this.recommendedGuides.set(recommended);
    });
  }

  private calculateTotalReadTime(): number {
    return this.allGuides().reduce((total, g) => total + g.content.length, 0);
  }

  setActiveCategory(category: string) {
    this.activeCategory.set(category);
  }

  selectGuide(guide: Guide) {
    this.selectedGuide.set(guide);
    this.trackView(guide.id);
  }

  closeGuide() {
    this.selectedGuide.set(null);
  }

  navigateToNext() {
    const next = this.nextGuide();
    if (next) {
      this.selectGuide(next);
    }
  }

  navigateToPrev() {
    const current = this.selectedGuide();
    if (!current) return;

    const currentIdx = this.guidesInCategory().findIndex(
      (g) => g.id === current.id
    );
    if (currentIdx > 0) {
      this.selectGuide(this.guidesInCategory()[currentIdx - 1]);
    }
  }

  private trackView(guideId: string) {
    this.guideService.trackGuideView(guideId).subscribe({
      next: () => {
        this.viewedGuides.update((viewed) => {
          viewed.add(guideId);
          return new Set(viewed);
        });
        this.loadRecommendations();
      },
    });
  }

  getIconForGuide(guide: Guide): any {
    const iconMap: Record<string, any> = {
      'check-square': CheckSquare,
      'dollar-sign': DollarSign,
      'chart-bar': BarChart3,
      'trending-up': TrendingUp,
      'alert-circle': AlertCircle,
      book: BookOpen,
      target: Target,
      users: Users,
    };

    return iconMap[guide.icon] || BookOpen;
  }
}
