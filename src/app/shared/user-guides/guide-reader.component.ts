import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
} from 'lucide-angular';
import { Guide } from 'src/app/core/admin/services/guide.service';
import { marked } from 'marked';

@Component({
  selector: 'app-guide-reader',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-backdrop-fade-in"
      (click)="onBackdropClick()"
    >
      <!-- Main Reader Container -->
      <div
        class="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-modal-slide-up"
      >
        <!-- Hero Header Section -->
        <div
          class="relative bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-8 lg:px-12 py-12 lg:py-16 overflow-hidden"
        >
          <!-- Background Decorative Elements -->
          <div
            class="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full -mr-48 -mt-24"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-72 h-72 bg-teal-300/5 rounded-full -ml-36 -mb-24"
          ></div>

          <!-- Close Button -->
          <button
            (click)="close.emit()"
            class="absolute top-6 lg:top-8 right-6 lg:right-8 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 z-10 group"
          >
            <lucide-angular
              [img]="CloseIcon"
              [size]="24"
              class="text-white group-hover:scale-110 transition-transform"
            />
          </button>

          <!-- Header Content -->
          <div class="relative z-20">
            <!-- Category Badge -->
            <div class="inline-block mb-4">
              <span
                class="px-4 py-2 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur-sm border border-white/30 uppercase tracking-widest"
              >
                {{ guide.category }}
              </span>
            </div>

            <!-- Title -->
            <h1
              class="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight max-w-3xl"
            >
              {{ guide.title }}
            </h1>

            <!-- Description -->
            <p class="text-lg text-white/90 max-w-2xl leading-relaxed">
              {{ guide.description }}
            </p>

            <!-- Metadata -->
            <div
              class="flex flex-wrap items-center gap-8 mt-8 pt-8 border-t border-white/20"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20"
                >
                  <lucide-angular
                    [img]="ClockIcon"
                    [size]="18"
                    class="text-white"
                  />
                </div>
                <div>
                  <p class="text-white/70 text-sm">Read Time</p>
                  <p class="text-white font-semibold">
                    {{ guide.content.length }} mins
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20"
                >
                  <lucide-angular
                    [img]="BookIcon"
                    [size]="18"
                    class="text-white"
                  />
                </div>
                <div>
                  <p class="text-white/70 text-sm">Module</p>
                  <p class="text-white font-semibold">
                    {{ guide.category | titlecase }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto">
          <div class="px-8 lg:px-12 py-12 lg:py-16 prose prose-sm max-w-none">
            <div [innerHTML]="guideHtml()"></div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div
          class="border-t border-slate-200 bg-white px-8 lg:px-12 py-6 flex items-center justify-between sticky bottom-0"
        >
          <button
            (click)="close.emit()"
            class="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors duration-200"
          >
            Close
          </button>

          <div class="flex items-center gap-3">
            @if (hasPrev) {
            <button
              (click)="navigatePrev.emit()"
              class="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors duration-200 group"
            >
              <lucide-angular
                [img]="ChevronLeftIcon"
                [size]="20"
                class="group-hover:-translate-x-0.5 transition-transform"
              />
            </button>
            } @if (nextGuide) {
            <button
              (click)="navigateNext.emit()"
              class="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 group"
            >
              Next Guide
              <lucide-angular
                [img]="ChevronRightIcon"
                [size]="18"
                class="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
            } @else {
            <div class="px-4 py-2 text-sm text-slate-500">All guides read!</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --animation-duration: 400ms;
      }

      @keyframes backdropFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes modalSlideUp {
        from {
          opacity: 0;
          transform: translateY(40px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      :host ::ng-deep {
        .animate-backdrop-fade-in {
          animation: backdropFadeIn var(--animation-duration) ease-out;
        }

        .animate-modal-slide-up {
          animation: modalSlideUp var(--animation-duration)
            cubic-bezier(0.16, 1, 0.3, 1);
        }

        .prose {
          @apply text-slate-700;
        }

        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4 {
          @apply text-slate-900 font-bold;
        }

        .prose h1 {
          @apply text-3xl mb-6 mt-8;
        }

        .prose h2 {
          @apply text-2xl mb-4 mt-7;
        }

        .prose h3 {
          @apply text-xl mb-3 mt-6;
        }

        .prose h4 {
          @apply text-lg mb-2 mt-5;
        }

        .prose p {
          @apply mb-4 leading-relaxed;
        }

        .prose ul,
        .prose ol {
          @apply mb-6 ml-6;
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

        .prose blockquote {
          @apply border-l-4 border-teal-300 pl-6 py-2 italic text-slate-700 bg-teal-50/30 py-4 px-6 rounded-lg;
        }

        .prose code {
          @apply bg-slate-100 text-slate-900 px-2 py-1 rounded font-mono text-sm;
        }

        .prose pre {
          @apply bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto mb-6;
        }

        .prose pre code {
          @apply bg-transparent text-inherit px-0 py-0;
        }

        .prose table {
          @apply border-collapse border border-slate-200 mb-6;
        }

        .prose td,
        .prose th {
          @apply border border-slate-200 px-4 py-3 text-left;
        }

        .prose th {
          @apply bg-teal-50 font-semibold text-slate-900;
        }

        .prose tbody tr:hover {
          @apply bg-teal-50/50;
        }

        .prose a {
          @apply text-teal-600 hover:text-teal-700 underline;
        }

        .prose hr {
          @apply border-slate-200 my-8;
        }
      }
    `,
  ],
})
export class GuideReaderComponent {
  @Input() guide!: Guide;
  @Input() nextGuide: Guide | null = null;
  @Input() hasPrev = false;

  @Output() close = new EventEmitter<void>();
  @Output() navigateNext = new EventEmitter<void>();
  @Output() navigatePrev = new EventEmitter<void>();

  // Icons
  CloseIcon = X;
  ChevronLeftIcon = ChevronLeft;
  ChevronRightIcon = ChevronRight;
  ClockIcon = Clock;
  BookIcon = BookOpen;

  guideHtml = computed(() => {
    if (!this.guide) return '';
    return marked(this.guide.content) as string;
  });

  onBackdropClick() {
    this.close.emit();
  }
}
