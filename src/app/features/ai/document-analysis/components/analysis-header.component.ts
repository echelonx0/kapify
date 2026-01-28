import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import lottie from 'lottie-web';

@Component({
  selector: 'app-document-analysis-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="analysis-card-wrapper" [class.animate-in]="isAnimating()">
      <!-- Main Card -->
      <div class="analysis-card">
        <!-- Lottie Animation (Centered, Larger) -->
        <div class="animation-container" #animationContainer></div>

        <!-- Content Section -->
        <div class="content-section">
          <h2 class="card-title">Kapify Intelligence</h2>

          <p class="card-description">
            Proprietary analysis extracts key funding insights from your
            documents instantly. Understand your opportunities—faster.
          </p>

          <!-- Trust & Security Badge -->
          <div class="security-notice">
            <p class="security-text">
              Your documents stay private. Results saved in Business Reports for
              future reference.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ===== WRAPPER & ANIMATION ===== */
      .analysis-card-wrapper {
        opacity: 0;
        transform: translateY(20px);
        transition:
          opacity 600ms cubic-bezier(0.34, 1.56, 0.64, 1),
          transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .analysis-card-wrapper.animate-in {
        opacity: 1;
        transform: translateY(0);
      }

      /* ===== CARD STRUCTURE ===== */
      .analysis-card {
        background: linear-gradient(
          135deg,
          rgb(20, 184, 166) 0%,
          rgb(13, 148, 136) 100%
        );
        border-radius: 1rem;

        display: flex;
        flex-direction: column;
        align-items: center;

        color: white;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
      }

      /* ===== LOTTIE ANIMATION (LARGER & CENTERED) ===== */
      .animation-container {
        width: 100%;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 1rem;
        backdrop-filter: blur(8px);
        flex-shrink: 0;
      }

      ng-lottie {
        width: 100%;
        height: 100%;
      }

      /* ===== CONTENT SECTION ===== */
      .content-section {
        text-align: center;
        width: 100%;
      }

      .card-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 0.75rem 0;
        letter-spacing: -0.02em;
      }

      .card-description {
        font-size: 0.875rem;
        line-height: 1.5;

        opacity: 0.95;
        max-width: 100%;
      }

      /* ===== SECURITY NOTICE (TRUST BADGE) ===== */
      .security-notice {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.75rem;
        padding: 0.875rem 1rem;
        margin-top: 0.5rem;
      }

      .security-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        margin-top: 1px;
        opacity: 0.9;
      }

      .security-text {
        font-size: 0.75rem;
        line-height: 1.4;
        margin: 0;
        opacity: 0.9;
        text-align: left;
      }

      /* ===== RESPONSIVE: TABLET ===== */
      @media (min-width: 768px) {
        .analysis-card {
          padding: 2.5rem 2rem;
          gap: 2rem;
        }

        .animation-container {
          height: 240px;
        }

        .card-title {
          font-size: 1.5rem;
        }

        .card-description {
          font-size: 0.9375rem;
        }
      }

      /* ===== RESPONSIVE: DESKTOP ===== */
      @media (min-width: 1024px) {
        .analysis-card {
          padding: 3rem 2.5rem;
          flex-direction: row;
          align-items: center;
          gap: 2.5rem;
          text-align: left;
        }

        .animation-container {
          width: 200px;
          height: 200px;
          flex-shrink: 0;
        }

        .content-section {
          flex: 1;
          text-align: left;
        }

        .card-title {
          font-size: 1.875rem;
        }

        .card-description {
          font-size: 1rem;
          max-width: 100%;
        }

        .security-notice {
          margin-top: 1rem;
        }
      }

      /* ===== MOTION REDUCTION ===== */
      @media (prefers-reduced-motion: reduce) {
        .analysis-card-wrapper {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class DocumentAnalysisHeader implements OnInit {
  @ViewChild('animationContainer')
  animationContainer!: ElementRef<HTMLDivElement>;

  // Animation state
  isAnimating = signal(false);

  ngOnInit(): void {
    // Trigger entrance animation
    setTimeout(() => this.isAnimating.set(true), 100);

    // Load Lottie animation after view initializes
    setTimeout(() => this.loadLottieAnimation(), 150);
  }

  private loadLottieAnimation(): void {
    if (!this.animationContainer?.nativeElement) {
      console.warn('Animation container not found');
      return;
    }

    try {
      lottie.loadAnimation({
        container: this.animationContainer.nativeElement,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/lottie/document-analysis-loader.json',
      });
    } catch (error) {
      console.error('Failed to load Lottie animation:', error);
    }
  }
}
