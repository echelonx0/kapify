import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building2, X } from 'lucide-angular';

@Component({
  selector: 'app-about-us-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- About Us Card Wrapper -->
    <div class="mt-2 cta-card-wrapper" [class.animate-in]="isAnimating()">
      <div
        class="bg-gradient-to-r from-teal-500 to-teal-600
           rounded-2xl text-white shadow-lg cta-card"
      >
        <!-- Background Particles (decorative only) -->
        <div class="particles-container">
          @for (particle of particles; track particle) {
          <div
            class="particle"
            [style.top]="particle.top"
            [style.left]="particle.left"
            [style.right]="particle.right"
            [style.width]="particle.size"
            [style.height]="particle.size"
            [style.animation-delay]="particle.delay"
          ></div>
          }
        </div>

        <!-- CONTENT: pinned to top -->
        <div class="relative z-10 content">
          <h2 class="text-lg lg:text-xl font-bold mb-2">About Kapify</h2>

          <p class="text-sm opacity-90 max-w-xl leading-relaxed">
            Kapify connects ambitious SMEs with the right funders, simplifying
            access to capital and accelerating sustainable business growth.
          </p>

          <button
            class="inline-flex items-center gap-2 mt-4
               bg-white text-slate-900 font-semibold rounded-xl
               px-5 py-2.5 text-sm hover:bg-slate-50 transition"
            (click)="openModal()"
          >
            Learn more
          </button>
        </div>

        <!-- Decorative Icon (anchored, not floating vertically) -->
        <div class="decorative-icon-wrapper">
          <div class="decorative-icon">
            <lucide-icon
              [img]="BuildingIcon"
              [size]="56"
              class="text-white opacity-35"
            />
          </div>
        </div>

        <div class="border-glow"></div>
      </div>
    </div>

    <!-- Bottom Sheet Modal -->
    <div
      class="about-modal-backdrop"
      *ngIf="isModalOpen()"
      (click)="closeModal()"
    ></div>

    <div
      class="about-modal"
      *ngIf="isModalOpen()"
      role="dialog"
      aria-modal="true"
    >
      <div class="about-modal-header">
        <h3>About Kapify</h3>
        <button (click)="closeModal()" aria-label="Close">
          <lucide-icon [img]="CloseIcon" [size]="20" />
        </button>
      </div>

      <div class="about-modal-content">
        <section>
          <h4>Our Mission</h4>
          <p>
            Kapify exists to simplify the funding journey for SMEs. We believe
            access to capital should never be a barrier to innovation,
            expansion, or long-term success.
          </p>
        </section>

        <section>
          <h4>What We Offer</h4>
          <ul>
            <li>
              <strong>Effortless Connections:</strong> Direct access to aligned
              funders.
            </li>
            <li>
              <strong>Tailored Matching:</strong> Smart pairing with relevant
              funding options.
            </li>
            <li>
              <strong>Supportive Community:</strong> Guidance, insights, and
              shared learning.
            </li>
            <li>
              <strong>Secure & Transparent:</strong> Trust at every step of the
              process.
            </li>
          </ul>
        </section>

        <section>
          <h4>Who We Serve</h4>
          <p>
            We support SMEs across all sectors, from early-stage startups to
            scaling businesses, and funders eager to back the next wave of
            innovation.
          </p>
        </section>

        <section>
          <h4>Our Commitment</h4>
          <p>
            Kapify is committed to building a thriving ecosystem where
            businesses and funders collaborate for mutual, sustainable growth.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      /* Modal Backdrop */
      .about-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 40;
        backdrop-filter: blur(4px);
      }

      /* Bottom Sheet Modal */
      .about-modal {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        border-top-left-radius: 1.5rem;
        border-top-right-radius: 1.5rem;
        max-height: 85vh;
        z-index: 50;
        animation: slideUp 400ms ease-out;
        box-shadow: 0 -20px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .about-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .about-modal-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #0f172a;
      }

      .about-modal-header button {
        border-radius: 0.75rem;
        padding: 0.5rem;
        transition: background 200ms ease;
      }

      .about-modal-header button:hover {
        background: #f1f5f9;
      }

      .about-modal-content {
        padding: 1.5rem;
        overflow-y: auto;
        color: #334155;
      }

      .about-modal-content section + section {
        margin-top: 1.5rem;
      }

      .about-modal-content h4 {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #0f172a;
      }

      .about-modal-content ul {
        padding-left: 1.25rem;
        list-style: disc;
      }

      .about-modal-content li {
        margin-bottom: 0.5rem;
      }

      @media (prefers-reduced-motion: reduce) {
        .about-modal {
          animation: none;
        }
      }

      /* Wrapper unchanged */
      .cta-card-wrapper {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 600ms ease, transform 600ms ease;
      }

      .cta-card-wrapper.animate-in {
        opacity: 1;
        transform: translateY(0);
      }

      /* CARD: hard cap + top-aligned layout */
      .cta-card {
        position: relative;
        overflow: hidden;

        /* CRITICAL FIX */
        height: 220px;
        max-height: 220px;

        padding: 1.5rem;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      /* Content pinned to top-left */
      .content {
        max-width: 70%;
      }

      /* Decorative icon no longer affects height */
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

      /* Particles strictly decorative */
      .particles-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.12;
      }

      /* Border glow unchanged */
      .border-glow {
        position: absolute;
        inset: -2px;
        border-radius: inherit;
        background: linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.1),
          rgba(255, 255, 255, 0.3),
          rgba(255, 255, 255, 0.1)
        );
        opacity: 0;
        transition: opacity 300ms ease;
      }

      .cta-card:hover .border-glow {
        opacity: 1;
      }

      /* Responsive */
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
    `,
  ],
})
export class AboutUsCardComponent implements OnInit {
  BuildingIcon = Building2;
  CloseIcon = X;

  isAnimating = signal(false);
  isModalOpen = signal(false);

  particles = [
    { top: '10%', left: '15%', size: '120px', delay: '0s' },
    { top: '60%', left: '80%', size: '180px', delay: '1s' },
    { top: '30%', right: '20%', size: '150px', delay: '2s' },
    { top: '80%', left: '40%', size: '100px', delay: '1.5s' },
  ];

  ngOnInit(): void {
    setTimeout(() => this.isAnimating.set(true), 100);
  }

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }
}
