import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Building2, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-about-us-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- About Us Card Wrapper -->
    <div class="mt-2 cta-card-wrapper" [class.animate-in]="isAnimating()">
      <div
        class="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl text-white shadow-lg cta-card"
      >
        <!-- CONTENT: pinned to top -->
        <div class="relative z-10 content">
          <h2 class="text-lg lg:text-xl font-bold mb-2">About Kapify</h2>
          <p class="text-sm opacity-90 max-w-xl leading-relaxed">
            Kapify connects ambitious SMEs with the right funders, simplifying
            access to capital and accelerating sustainable business growth.
          </p>
          <button
            class="inline-flex items-center gap-2 mt-4 bg-white text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-slate-50 transition-colors duration-200"
            (click)="navigateToAbout()"
          >
            Learn more
            <lucide-icon [img]="ArrowRightIcon" [size]="16" />
          </button>
        </div>

        <!-- Decorative Icon (anchored) -->
        <div class="decorative-icon-wrapper">
          <div class="decorative-icon">
            <lucide-icon
              [img]="BuildingIcon"
              [size]="56"
              class="text-white opacity-35"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ===== CTA CARD (Top) ===== */
      .cta-card-wrapper {
        opacity: 0;
        transform: translateY(20px);
        transition:
          opacity 600ms ease,
          transform 600ms ease;
      }

      .cta-card-wrapper.animate-in {
        opacity: 1;
        transform: translateY(0);
      }

      .cta-card {
        position: relative;
        overflow: hidden;
        height: 220px;
        max-height: 220px;
        padding: 1.5rem;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      .content {
        max-width: 70%;
      }

      .content h2 {
        margin: 0 0 0.75rem 0;
        font-size: 1.125rem;
      }

      .content p {
        margin: 0;
        font-size: 0.875rem;
      }

      .content button {
        border: none;
        cursor: pointer;
      }

      .decorative-icon-wrapper {
        position: absolute;
        right: 1.25rem;
        bottom: 1.25rem;
      }

      .decorative-icon {
        width: 72px;
        height: 72px;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 1024px) {
        .cta-card {
          height: auto;
          max-height: none;
        }

        .content {
          max-width: 100%;
        }

        .decorative-icon-wrapper {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .cta-card-wrapper {
          animation: none;
        }
      }
    `,
  ],
})
export class AboutUsCardComponent implements OnInit {
  private router = inject(Router);

  // Icons
  BuildingIcon = Building2;
  ArrowRightIcon = ArrowRight;

  // State
  isAnimating = signal(false);

  ngOnInit(): void {
    // Animate card entrance
    setTimeout(() => this.isAnimating.set(true), 100);
  }

  navigateToAbout(): void {
    this.router.navigate(['/about']);
  }
}
