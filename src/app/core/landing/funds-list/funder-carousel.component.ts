import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  Loader,
} from 'lucide-angular';

import { Subject, takeUntil } from 'rxjs';
import { PublicProfile } from 'src/app/funder/models/public-profile.models';
import { PublicProfileService } from 'src/app/funder/services/public-profile.service';
import { FunderCarouselCardComponent } from './funder-carousel-card.component';

@Component({
  selector: 'app-funder-carousel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FunderCarouselCardComponent],
  template: `
    <section class="py-28 bg-slate-950">
      <div class="max-w-7xl mx-auto px-6">
        <!-- Header -->
        <div class="mb-16">
          <span
            class="inline-block text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4"
          >
            Trusted Partners
          </span>
          <h2 class="text-5xl lg:text-6xl font-black text-white mb-2">
            Institutional Funders
          </h2>
          <p class="text-sm text-slate-300 max-w-2xl">
            Leading investment firms backing South African innovation. <br />
            Apply to verified funders with clear criteria.
          </p>
        </div>

        <!-- Carousel Container -->
        <div class="relative">
          <!-- Scroll Container -->
          <div
            #scrollContainer
            class="overflow-x-auto scrollbar-hide"
            (scroll)="onScroll()"
          >
            <div class="flex gap-6 pb-4">
              @for (profile of visibleProfiles(); track profile.id) {
                <div
                  class="flex-shrink-0 w-full sm:w-80 cursor-pointer"
                  (click)="navigateToProfile(profile.slug)"
                >
                  <app-funder-carousel-card [profile]="profile" />
                </div>
              }
              @if (isLoadingMore()) {
                <div
                  class="flex-shrink-0 w-full sm:w-80 flex items-center justify-center bg-slate-800 rounded-2xl border border-slate-700"
                >
                  <div class="text-center">
                    <lucide-icon
                      [img]="LoaderIcon"
                      [size]="32"
                      class="text-emerald-400 mx-auto mb-2 animate-spin"
                    />
                    <p class="text-sm text-slate-400">Loading funders...</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Navigation Arrows (Desktop Only) -->
          <div class="hidden lg:flex gap-3 mt-6 justify-end">
            <button
              (click)="scroll('left')"
              [disabled]="isAtStart()"
              class="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700"
              aria-label="Scroll left"
            >
              <lucide-icon [img]="ChevronLeftIcon" [size]="20" />
            </button>
            <button
              (click)="scroll('right')"
              [disabled]="isAtEnd()"
              class="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700"
              aria-label="Scroll right"
            >
              <lucide-icon [img]="ChevronRightIcon" [size]="20" />
            </button>
          </div>

          <!-- Loading State -->
          @if (isLoading() && visibleProfiles().length === 0) {
            <div class="text-center py-16">
              <lucide-icon
                [img]="LoaderIcon"
                [size]="48"
                class="text-emerald-500 mx-auto mb-4 animate-spin"
              />
              <p class="text-slate-400">Loading institutional funders...</p>
            </div>
          }

          <!-- Error State -->
          @if (error()) {
            <div
              class="bg-red-950/50 border border-red-800 rounded-xl p-6 text-center"
            >
              <p class="text-red-300 font-medium">
                Unable to load funders at this time
              </p>
              <button
                (click)="retry()"
                class="mt-3 px-4 py-2 bg-red-900/50 text-red-300 rounded-lg hover:bg-red-900 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          }
        </div>

        <!-- Empty State -->
        @if (!isLoading() && visibleProfiles().length === 0 && !error()) {
          <div class="text-center py-16">
            <p class="text-slate-400 text-lg">
              No funders available yet. Check back soon!
            </p>
          </div>
        }

        <!-- Scroll Indicator (Mobile) -->
        @if (visibleProfiles().length > 0) {
          <p class="text-xs text-slate-500 text-center mt-6 lg:hidden">
            Scroll horizontally to see more funders
          </p>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `,
  ],
})
export class FunderCarouselComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  private profileService = inject(PublicProfileService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // State
  allProfiles = signal<PublicProfile[]>([]);
  visibleProfiles = signal<PublicProfile[]>([]);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  error = signal<string | null>(null);

  // Pagination
  pageSize = 12;
  currentPage = 0;
  canLoadMore = true;

  // Scroll state
  private scrollPos = 0;
  canScrollLeft = signal(false);
  canScrollRight = signal(true);

  // Icons
  ChevronLeftIcon = ChevronLeft;
  ChevronRightIcon = ChevronRight;
  LoaderIcon = Loader;

  ngOnInit() {
    this.loadProfiles();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfiles() {
    this.isLoading.set(true);
    this.error.set(null);

    // Fetch all published profiles from database
    this.profileService
      .getAllPublishedProfiles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profiles) => {
          this.allProfiles.set(profiles);
          this.loadMoreProfiles();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load funders:', error);
          this.error.set('Failed to load funders');
          this.isLoading.set(false);
        },
      });
  }

  private loadMoreProfiles() {
    if (!this.canLoadMore) return;

    this.isLoadingMore.set(true);

    // Simulate async loading for better UX
    setTimeout(() => {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      const newProfiles = this.allProfiles().slice(start, end);

      if (newProfiles.length === 0) {
        this.canLoadMore = false;
        this.isLoadingMore.set(false);
        return;
      }

      this.visibleProfiles.set([...this.visibleProfiles(), ...newProfiles]);

      this.currentPage++;
      this.isLoadingMore.set(false);

      if (end >= this.allProfiles().length) {
        this.canLoadMore = false;
      }
    }, 200);
  }

  onScroll() {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;

    this.scrollPos = el.scrollLeft;
    this.updateArrowStates();

    // Infinite scroll: load more when near end
    const threshold = 200;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold) {
      this.loadMoreProfiles();
    }
  }

  scroll(direction: 'left' | 'right') {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;

    const scrollAmount = 400;
    const targetScroll =
      direction === 'left'
        ? el.scrollLeft - scrollAmount
        : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }

  private updateArrowStates() {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;

    this.canScrollLeft.set(el.scrollLeft > 0);
    this.canScrollRight.set(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 10,
    );
  }

  isAtStart(): boolean {
    return !this.canScrollLeft();
  }

  isAtEnd(): boolean {
    return !this.canScrollRight();
  }

  navigateToProfile(slug: string) {
    this.router.navigate(['/funder', slug]);
  }

  retry() {
    this.error.set(null);
    this.visibleProfiles.set([]);
    this.allProfiles.set([]);
    this.currentPage = 0;
    this.canLoadMore = true;
    this.loadProfiles();
  }
}
