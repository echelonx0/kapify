// import {
//   Component,
//   ChangeDetectionStrategy,
//   signal,
//   OnInit,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   Building2,
//   Lightbulb,
//   Users,
//   Target,
//   Handshake,
//   ArrowRight,
//   X,
// } from 'lucide-angular';

// @Component({
//   selector: 'app-about-us-card',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <!-- About Us Card Wrapper -->
//     <div class="mt-2 cta-card-wrapper" [class.animate-in]="isAnimating()">
//       <div
//         class="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl text-white shadow-lg cta-card"
//       >
//         <!-- CONTENT: pinned to top -->
//         <div class="relative z-10 content">
//           <h2 class="text-lg lg:text-xl font-bold mb-2">About Kapify</h2>
//           <p class="text-sm opacity-90 max-w-xl leading-relaxed">
//             Kapify connects ambitious SMEs with the right funders, simplifying
//             access to capital and accelerating sustainable business growth.
//           </p>
//           <button
//             class="inline-flex items-center gap-2 mt-4 bg-white text-slate-900 font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-slate-50 transition-colors duration-200"
//             (click)="openModal()"
//           >
//             Learn more
//             <lucide-icon [img]="ArrowRightIcon" [size]="16" />
//           </button>
//         </div>

//         <!-- Decorative Icon (anchored) -->
//         <div class="decorative-icon-wrapper">
//           <div class="decorative-icon">
//             <lucide-icon
//               [img]="BuildingIcon"
//               [size]="56"
//               class="text-white opacity-35"
//             />
//           </div>
//         </div>
//       </div>
//     </div>

//     <!-- Modal Backdrop -->
//     <div
//       class="about-modal-backdrop"
//       *ngIf="isModalOpen()"
//       (click)="closeModal()"
//     ></div>

//     <!-- Bottom Sheet Modal -->
//     <div
//       class="about-modal"
//       *ngIf="isModalOpen()"
//       role="dialog"
//       aria-modal="true"
//     >
//       <!-- Header -->
//       <div class="about-modal-header">
//         <div>
//           <h3>About Kapify</h3>
//           <p class="text-xs text-slate-500 mt-1">
//             Kapify: Bridging the Gap Between SMEs and Funders
//           </p>
//         </div>
//         <button
//           (click)="closeModal()"
//           aria-label="Close"
//           class="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
//         >
//           <lucide-icon [img]="CloseIcon" [size]="20" class="text-slate-600" />
//         </button>
//       </div>

//       <!-- Hero Section with full introductory text -->
//       <div class="about-modal-hero">
//         <div class="hero-icon">
//           <lucide-icon [img]="BuildingIcon" [size]="32" />
//         </div>
//         <h4>Welcome to Kapify</h4>
//         <p>
//           Kapify is a dynamic platform dedicated to empowering small and
//           medium-sized enterprises (SMEs) by connecting them directly with a
//           diverse network of funders. Founded with the vision to drive business
//           growth and innovation, Kapify serves as a bridge between ambitious
//           entrepreneurs and the financial support they need to thrive.
//         </p>
//       </div>

//       <!-- Feature Cards -->
//       <div class="about-modal-content">
//         <!-- Mission Card -->
//         <div class="feature-card accent-teal">
//           <div class="feature-icon accent-teal">
//             <lucide-icon [img]="TargetIcon" [size]="24" />
//           </div>
//           <div class="feature-content">
//             <h5>Our Mission</h5>
//             <p>
//               At Kapify, our mission is to simplify the funding journey for
//               SMEs. We believe that access to capital should not be a barrier to
//               creativity, expansion, or success. By streamlining the application
//               process and fostering transparent relationships, we help
//               businesses unlock new opportunities and reach their full
//               potential.
//             </p>
//           </div>
//         </div>

//         <!-- What We Offer Card -->
//         <div class="feature-card accent-blue">
//           <div class="feature-icon accent-blue">
//             <lucide-icon [img]="LightbulbIcon" [size]="24" />
//           </div>
//           <div class="feature-content">
//             <h5>What We Offer</h5>
//             <ul class="feature-list">
//               <li>
//                 <strong>Effortless Connections:</strong> SMEs can quickly
//                 discover and connect with funders who align with their goals and
//                 needs.
//               </li>
//               <li>
//                 <strong>Tailored Matching:</strong> Our platform uses smart
//                 matching technology to pair businesses with the most relevant
//                 funding options, saving time and increasing the chance of
//                 success.
//               </li>
//               <li>
//                 <strong>Supportive Community:</strong> Kapify isn't just a
//                 marketplace — it's a community where entrepreneurs can find
//                 guidance, share experiences, and learn from each other.
//               </li>
//               <li>
//                 <strong>Secure and Transparent:</strong> We prioritise data
//                 security and ensure that every step of the funding process is
//                 clear and trustworthy.
//               </li>
//             </ul>
//           </div>
//         </div>

//         <!-- Who We Serve Card -->
//         <div class="feature-card accent-slate">
//           <div class="feature-icon accent-slate">
//             <lucide-icon [img]="UsersIcon" [size]="24" />
//           </div>
//           <div class="feature-content">
//             <h5>Who We Serve</h5>
//             <p>
//               Kapify is designed for SMEs across all sectors looking for
//               financial backing, whether you're just starting out or seeking to
//               scale your existing operations. Our platform also welcomes funders
//               — from venture capitalists and angel investors to grant providers
//               and financial institutions — who are eager to support the next
//               wave of business innovation.
//             </p>
//           </div>
//         </div>

//         <!-- Commitment Card -->
//         <div class="feature-card accent-teal">
//           <div class="feature-icon accent-teal">
//             <lucide-icon [img]="HandshakeIcon" [size]="24" />
//           </div>
//           <div class="feature-content">
//             <h5>Our Commitment</h5>
//             <p>
//               We are committed to nurturing a thriving ecosystem where
//               businesses and funders collaborate for mutual growth. Through
//               Kapify, we aim to make funding more accessible, equitable, and
//               impactful for every SME.
//             </p>
//           </div>
//         </div>

//         <!-- Join Us Card -->
//         <div class="feature-card accent-blue">
//           <div class="feature-icon accent-blue">
//             <lucide-icon [img]="ArrowRightIcon" [size]="24" />
//           </div>
//           <div class="feature-content">
//             <h5>Join Us</h5>
//             <p>
//               Whether you're an entrepreneur seeking capital or a funder ready
//               to invest in promising ventures, Kapify is your partner on the
//               journey to success. Join our platform today and be part of a
//               movement that's transforming the future of SME funding.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   `,
//   styles: [
//     `
//       /* ===== MODAL BACKDROP ===== */
//       .about-modal-backdrop {
//         position: fixed;
//         inset: 0;
//         background: rgba(0, 0, 0, 0.4);
//         z-index: 40;
//         backdrop-filter: blur(4px);
//         animation: fadeIn 300ms ease-out;
//       }

//       @keyframes fadeIn {
//         from {
//           opacity: 0;
//         }
//         to {
//           opacity: 1;
//         }
//       }

//       /* ===== MODAL CONTAINER ===== */
//       .about-modal {
//         position: fixed;
//         left: 0;
//         right: 0;
//         bottom: 0;
//         background: white;
//         border-top-left-radius: 1.5rem;
//         border-top-right-radius: 1.5rem;
//         max-height: 90vh;
//         z-index: 50;
//         animation: slideUp 400ms ease-out;
//         box-shadow: 0 -20px 40px rgba(0, 0, 0, 0.15);
//         display: flex;
//         flex-direction: column;
//       }

//       @keyframes slideUp {
//         from {
//           transform: translateY(100%);
//         }
//         to {
//           transform: translateY(0);
//         }
//       }

//       /* ===== MODAL HEADER ===== */
//       .about-modal-header {
//         display: flex;
//         justify-content: space-between;
//         align-items: flex-start;
//         gap: 1rem;
//         padding: 1.5rem;
//         border-bottom: 1px solid #e2e8f0;
//         background: #f8fafc;
//         border-top-left-radius: 1.5rem;
//         border-top-right-radius: 1.5rem;
//       }

//       .about-modal-header h3 {
//         font-size: 1.25rem;
//         font-weight: 700;
//         color: #0f172a;
//         margin: 0;
//       }

//       .about-modal-header p {
//         margin: 0;
//       }

//       /* ===== HERO SECTION ===== */
//       .about-modal-hero {
//         padding: 2rem 1.5rem;
//         background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
//         border-bottom: 1px solid #e2e8f0;
//         text-align: center;
//       }

//       .hero-icon {
//         width: 3rem;
//         height: 3rem;
//         border-radius: 0.75rem;
//         background: #0d9488;
//         color: white;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         margin: 0 auto 1rem;
//       }

//       .about-modal-hero h4 {
//         font-size: 1.125rem;
//         font-weight: 600;
//         color: #0f172a;
//         margin: 0 0 0.75rem 0;
//       }

//       .about-modal-hero p {
//         font-size: 0.875rem;
//         color: #475569;
//         line-height: 1.5;
//         max-width: 32rem;
//         margin: 0 auto;
//       }

//       /* ===== CONTENT AREA ===== */
//       .about-modal-content {
//         padding: 1.5rem;
//         overflow-y: auto;
//         flex: 1;
//         display: flex;
//         flex-direction: column;
//         gap: 1rem;
//       }

//       /* ===== FEATURE CARDS ===== */
//       .feature-card {
//         display: flex;
//         gap: 1rem;
//         padding: 1.25rem;
//         background: white;
//         border: 1px solid #e2e8f0;
//         border-radius: 1rem;
//         transition: all 200ms ease;
//       }

//       .feature-card:hover {
//         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
//         border-color: #cbd5e1;
//       }

//       /* Accent color variants */
//       .feature-card.accent-teal {
//         border-color: #ccf7f1;
//         border-left: 3px solid #0d9488;
//       }

//       .feature-card.accent-teal:hover {
//         background: #f0fdfa;
//       }

//       .feature-card.accent-blue {
//         border-color: #bfdbfe;
//         border-left: 3px solid #2563eb;
//       }

//       .feature-card.accent-blue:hover {
//         background: #f0f9ff;
//       }

//       .feature-card.accent-slate {
//         border-color: #cbd5e1;
//         border-left: 3px solid #64748b;
//       }

//       .feature-card.accent-slate:hover {
//         background: #f8fafc;
//       }

//       /* Feature Icon */
//       .feature-icon {
//         width: 2.5rem;
//         height: 2.5rem;
//         border-radius: 0.75rem;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         flex-shrink: 0;
//         color: white;
//       }

//       .feature-icon.accent-teal {
//         background: #0d9488;
//       }

//       .feature-icon.accent-blue {
//         background: #2563eb;
//       }

//       .feature-icon.accent-slate {
//         background: #64748b;
//       }

//       /* Feature Content */
//       .feature-content {
//         flex: 1;
//         min-width: 0;
//       }

//       .feature-content h5 {
//         font-size: 0.95rem;
//         font-weight: 600;
//         color: #0f172a;
//         margin: 0 0 0.5rem 0;
//       }

//       .feature-content p {
//         font-size: 0.875rem;
//         color: #475569;
//         line-height: 1.5;
//         margin: 0;
//       }

//       /* Feature List */
//       .feature-list {
//         list-style: none;
//         padding: 0;
//         margin: 0;
//         display: flex;
//         flex-direction: column;
//         gap: 0.75rem;
//       }

//       .feature-list li {
//         font-size: 0.875rem;
//         color: #475569;
//         line-height: 1.5;
//       }

//       .feature-list strong {
//         color: #0f172a;
//         font-weight: 600;
//       }

//       /* ===== CTA CARD (Top) ===== */
//       .cta-card-wrapper {
//         opacity: 0;
//         transform: translateY(20px);
//         transition: opacity 600ms ease, transform 600ms ease;
//       }

//       .cta-card-wrapper.animate-in {
//         opacity: 1;
//         transform: translateY(0);
//       }

//       .cta-card {
//         position: relative;
//         overflow: hidden;
//         height: 220px;
//         max-height: 220px;
//         padding: 1.5rem;
//         display: flex;
//         align-items: flex-start;
//         justify-content: space-between;
//       }

//       .content {
//         max-width: 70%;
//       }

//       .content h2 {
//         margin: 0 0 0.75rem 0;
//         font-size: 1.125rem;
//       }

//       .content p {
//         margin: 0;
//         font-size: 0.875rem;
//       }

//       .content button {
//         border: none;
//         cursor: pointer;
//       }

//       .decorative-icon-wrapper {
//         position: absolute;
//         right: 1.25rem;
//         bottom: 1.25rem;
//       }

//       .decorative-icon {
//         width: 72px;
//         height: 72px;
//         border-radius: 1rem;
//         background: rgba(255, 255, 255, 0.12);
//         backdrop-filter: blur(6px);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//       }

//       /* ===== RESPONSIVE ===== */
//       @media (max-width: 1024px) {
//         .cta-card {
//           height: auto;
//           max-height: none;
//         }

//         .content {
//           max-width: 100%;
//         }

//         .decorative-icon-wrapper {
//           display: none;
//         }
//       }

//       @media (prefers-reduced-motion: reduce) {
//         .about-modal {
//           animation: none;
//         }

//         .about-modal-backdrop {
//           animation: none;
//         }
//       }
//     `,
//   ],
// })
// export class AboutUsCardComponent implements OnInit {
//   // Icons
//   BuildingIcon = Building2;
//   LightbulbIcon = Lightbulb;
//   UsersIcon = Users;
//   TargetIcon = Target;
//   HandshakeIcon = Handshake;
//   ArrowRightIcon = ArrowRight;
//   CloseIcon = X;

//   // State
//   isAnimating = signal(false);
//   isModalOpen = signal(false);

//   ngOnInit(): void {
//     // Animate card entrance
//     setTimeout(() => this.isAnimating.set(true), 100);
//   }

//   openModal(): void {
//     this.isModalOpen.set(true);
//   }

//   closeModal(): void {
//     this.isModalOpen.set(false);
//   }
// }
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
        transition: opacity 600ms ease, transform 600ms ease;
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
