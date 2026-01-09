import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Building2,
  Target,
  Lightbulb,
  Users,
  Handshake,
  ChevronLeft,
} from 'lucide-angular';

interface FeatureCard {
  icon: any;
  title: string;
  description: string | string[];
  accent: 'teal' | 'blue' | 'slate';
}

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Container -->
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div
          class="max-w-6xl mx-auto px-4 lg:px-8 py-6 flex items-center gap-4"
        >
          <button
            (click)="navigateBack()"
            class="p-2 rounded-xl hover:bg-slate-100 transition-colors duration-200 flex items-center justify-center"
            aria-label="Go back"
          >
            <lucide-icon
              [img]="ChevronLeftIcon"
              [size]="20"
              class="text-slate-600"
            />
          </button>
          <h1 class="text-2xl font-bold text-slate-900">About Kapify</h1>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <!-- Hero Section -->
        <section class="mb-16">
          <div class="space-y-6">
            <div>
              <h2 class="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Bridging the Gap Between SMEs and Funders
              </h2>
              <p
                class="text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl"
              >
                Kapify is a dynamic platform dedicated to empowering small and
                medium-sized enterprises (SMEs) by connecting them directly with
                a diverse network of funders. Founded with the vision to drive
                business growth and innovation, Kapify serves as a bridge
                between ambitious entrepreneurs and the financial support they
                need to thrive.
              </p>
            </div>
          </div>
        </section>

        <!-- Mission Section -->
        <section class="mb-16">
          <div class="bg-white rounded-2xl border border-slate-200 p-8 lg:p-10">
            <div class="flex gap-6">
              <div
                class="w-12 h-12 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon [img]="TargetIcon" [size]="24" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-slate-900 mb-3">
                  Our Mission
                </h3>
                <p class="text-slate-600 leading-relaxed">
                  At Kapify, our mission is to simplify the funding journey for
                  SMEs. We believe that access to capital should not be a
                  barrier to creativity, expansion, or success. By streamlining
                  the application process and fostering transparent
                  relationships, we help businesses unlock new opportunities and
                  reach their full potential.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Features Grid -->
        <section>
          <h2 class="text-2xl font-bold text-slate-900 mb-8">What We Offer</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (feature of features; track feature.title) {
            <div
              class="bg-white rounded-2xl border transition-all duration-200 hover:shadow-md"
              [ngClass]="getBorderClass(feature.accent)"
            >
              <div class="p-6 lg:p-8">
                <!-- Icon -->
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center mb-4 flex-shrink-0"
                  [ngClass]="getIconClass(feature.accent)"
                >
                  <lucide-icon [img]="feature.icon" [size]="24" />
                </div>

                <!-- Title -->
                <h3 class="text-lg font-bold text-slate-900 mb-3">
                  {{ feature.title }}
                </h3>

                <!-- Description -->
                @if (typeof feature.description === 'string') {
                <p class="text-sm text-slate-600 leading-relaxed">
                  {{ feature.description }}
                </p>
                } @else {
                <ul class="space-y-2">
                  @for (item of feature.description; track item) {
                  <li class="text-sm text-slate-600 leading-relaxed">
                    {{ item }}
                  </li>
                  }
                </ul>
                }
              </div>
            </div>
            }
          </div>
        </section>

        <!-- Who We Serve -->
        <section class="mt-16">
          <div
            class="bg-teal-50 rounded-2xl border border-teal-300/50 p-8 lg:p-10"
          >
            <div class="flex gap-6">
              <div
                class="w-12 h-12 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon [img]="UsersIcon" [size]="24" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-slate-900 mb-3">
                  Who We Serve
                </h3>
                <p class="text-slate-700 leading-relaxed">
                  Kapify is designed for SMEs across all sectors looking for
                  financial backing, whether you're just starting out or seeking
                  to scale your existing operations. Our platform also welcomes
                  funders — from venture capitalists and angel investors to
                  grant providers and financial institutions — who are eager to
                  support the next wave of business innovation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Commitment -->
        <section class="mt-16">
          <div class="bg-white rounded-2xl border border-slate-200 p-8 lg:p-10">
            <div class="flex gap-6">
              <div
                class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon [img]="HandshakeIcon" [size]="24" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-slate-900 mb-3">
                  Our Commitment
                </h3>
                <p class="text-slate-600 leading-relaxed">
                  We are committed to nurturing a thriving ecosystem where
                  businesses and funders collaborate for mutual growth. Through
                  Kapify, we aim to make funding more accessible, equitable, and
                  impactful for every SME.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="mt-16 text-center">
          <div
            class="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-12 text-white"
          >
            <h2 class="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p class="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Whether you're an entrepreneur seeking capital or a funder ready
              to invest in promising ventures, Kapify is your partner on the
              journey to success.
            </p>
            <button
              (click)="navigateToHome()"
              class="inline-flex items-center gap-2 bg-white text-teal-600 font-semibold rounded-xl px-8 py-3 hover:bg-slate-50 transition-colors duration-200"
            >
              Join Kapify Today
            </button>
          </div>
        </section>
      </main>

      <!-- Footer Spacing -->
      <div class="h-8"></div>
    </div>
  `,
})
export class AboutUsComponent implements OnInit {
  private router = inject(Router);

  // Icons
  ChevronLeftIcon = ChevronLeft;
  TargetIcon = Target;
  LightbulbIcon = Lightbulb;
  UsersIcon = Users;
  HandshakeIcon = Handshake;
  BuildingIcon = Building2;

  // Type utility
  typeof = (obj: any) => typeof obj;

  features: FeatureCard[] = [
    {
      icon: Lightbulb,
      title: 'Effortless Connections',
      description:
        'SMEs can quickly discover and connect with funders who align with their goals and needs.',
      accent: 'teal',
    },
    {
      icon: Target,
      title: 'Tailored Matching',
      description:
        'Our platform uses smart matching technology to pair businesses with the most relevant funding options, saving time and increasing the chance of success.',
      accent: 'blue',
    },
    {
      icon: Users,
      title: 'Supportive Community',
      description:
        "Kapify isn't just a marketplace — it's a community where entrepreneurs can find guidance, share experiences, and learn from each other.",
      accent: 'teal',
    },
    {
      icon: Handshake,
      title: 'Secure & Transparent',
      description:
        'We prioritise data security and ensure that every step of the funding process is clear and trustworthy.',
      accent: 'slate',
    },
  ];

  ngOnInit(): void {
    // Page initialization if needed
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Get border styling based on accent color
   */
  getBorderClass(accent: 'teal' | 'blue' | 'slate'): string {
    const borderMap: Record<string, string> = {
      teal: 'border-teal-200',
      blue: 'border-blue-200',
      slate: 'border-slate-200',
    };
    return `border-slate-200 ${borderMap[accent]}`;
  }

  /**
   * Get icon background and text color based on accent
   */
  getIconClass(accent: 'teal' | 'blue' | 'slate'): string {
    const iconMap: Record<string, string> = {
      teal: 'bg-teal-100 text-teal-600',
      blue: 'bg-blue-100 text-blue-600',
      slate: 'bg-slate-100 text-slate-600',
    };
    return iconMap[accent];
  }
}
