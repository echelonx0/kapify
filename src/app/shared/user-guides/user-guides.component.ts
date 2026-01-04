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
} from 'lucide-angular';
import { marked } from 'marked';
import { GuideService, Guide } from 'src/app/admin/services/guide.service';

@Component({
  selector: 'app-user-guides',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-12">
          <h1 class="text-3xl font-bold text-slate-900">
            Funding Readiness Guide
          </h1>
          <p class="text-slate-600 mt-2">
            Master the essentials to prepare your business for funding success
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-3">
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
              class="bg-red-50 border border-red-200/50 rounded-xl p-6 text-center"
            >
              <p class="text-red-700">{{ error() }}</p>
            </div>
            } @else {
            <!-- Category Tabs -->
            <div class="mb-8">
              <div
                class="flex gap-2 border-b border-slate-200 overflow-x-auto pb-4"
              >
                @for (category of categories(); track category) {
                <button
                  (click)="setActiveCategory(category)"
                  [class.active]="activeCategory() === category"
                  class="px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200"
                  [ngClass]="{
                    'bg-teal-500 text-white shadow-md':
                      activeCategory() === category,
                    'bg-slate-100 text-slate-700 hover:bg-slate-200':
                      activeCategory() !== category
                  }"
                >
                  {{ category | titlecase }}
                </button>
                }
              </div>
            </div>

            <!-- Guide Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              @for (guide of guidesInCategory(); track guide.id) {
              <div
                (click)="selectGuide(guide)"
                class="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-teal-300/50 transition-all duration-200 group"
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
                  class="flex items-center justify-between text-xs text-slate-500"
                >
                  <span>{{ guide.content.length }} min read</span>
                  @if (viewedGuides().has(guide.id)) {
                  <span class="text-teal-600 font-semibold">✓ Read</span>
                  }
                </div>
              </div>
              }
            </div>
            }
          </div>

          <!-- Sidebar: Recommendations & Stats -->
          <div class="lg:col-span-1">
            <!-- Recommended Next -->
            <div
              class="bg-white rounded-2xl border border-slate-200 p-6 sticky top-8"
            >
              <h3 class="font-bold text-slate-900 mb-4">Recommended Next</h3>
              <div class="space-y-3">
                @for (guide of recommendedGuides(); track guide.id) {
                <button
                  (click)="selectGuide(guide)"
                  class="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors group"
                >
                  <p
                    class="text-sm font-semibold text-slate-900 group-hover:text-teal-600 line-clamp-2"
                  >
                    {{ guide.title }}
                  </p>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ guide.category | titlecase }}
                  </p>
                </button>
                } @if (recommendedGuides().length === 0) {
                <p class="text-sm text-slate-500 italic">
                  You've explored all guides!
                </p>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Full Guide Modal -->
        @if (selectedGuide()) {
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          (click)="closeGuide()"
        >
          <div
            class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <!-- Modal Header -->
            <div
              class="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between"
            >
              <div>
                <span
                  class="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold mb-2"
                >
                  {{ selectedGuide()!.category | titlecase }}
                </span>
                <h2 class="text-2xl font-bold text-slate-900">
                  {{ selectedGuide()!.title }}
                </h2>
              </div>
              <button
                (click)="closeGuide()"
                class="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div class="p-8 prose prose-sm max-w-none">
              <div [innerHTML]="selectedGuideHtml()"></div>
            </div>

            <!-- Modal Footer -->
            <div
              class="border-t border-slate-200 p-6 bg-slate-50 flex gap-3 justify-between"
            >
              <button
                (click)="closeGuide()"
                class="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              @if (nextGuide()) {
              <button
                (click)="selectGuide(nextGuide()!)"
                class="px-6 py-2.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
              >
                Next Guide →
              </button>
              }
            </div>
          </div>
        </div>
        }
      </div>
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
    `,
  ],
})
export class UserGuidesComponent implements OnInit {
  private guideService = inject(GuideService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly allGuides = signal<Guide[]>([]);
  readonly activeCategory = signal('');
  readonly selectedGuide = signal<Guide | null>(null);
  readonly viewedGuides = signal<Set<string>>(new Set());
  readonly recommendedGuides = signal<Guide[]>([]);

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

  readonly selectedGuideHtml = computed(() => {
    const guide = this.selectedGuide();
    if (!guide) return '';
    return marked(guide.content) as string;
  });

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

  async ngOnInit() {
    await this.loadGuides();
  }

  private async loadGuides() {
    this.isLoading.set(true);
    try {
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
    } catch (err) {
      console.error('Error:', err);
      this.error.set('An error occurred');
      this.isLoading.set(false);
    }
  }

  private async loadRecommendations() {
    const recommended = await this.guideService.getRandomUnviewedGuides(3);
    this.recommendedGuides.set(recommended);
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
    // Map icon names to lucide-angular icon objects
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
