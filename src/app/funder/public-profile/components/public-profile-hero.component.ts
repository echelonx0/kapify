import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicProfile } from 'src/app/funder/models/public-profile.models';

interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
}

@Component({
  selector: 'app-funder-hero-enhanced',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (profile) {
      <section
        class="relative overflow-hidden bg-slate-950  pb-0 min-h-screen flex items-center"
      >
        <!-- Animated Gradient Background -->
        <div class="absolute inset-0">
          <!-- Primary gradient -->
          <div
            class="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 opacity-100"
          ></div>

          <!-- Animated gradient overlays -->
          <div
            class="absolute top-0 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse"
          ></div>
          <div
            class="absolute bottom-1/4 -left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"
            [style.animation]="'float 8s ease-in-out infinite'"
          ></div>
          <div
            class="absolute top-1/2 left-1/2 w-80 h-80 bg-slate-500/5 rounded-full blur-3xl"
            [style.animation]="'float 10s ease-in-out infinite 2s'"
          ></div>

          <!-- Particle canvas background -->
          <div class="absolute inset-0 opacity-30">
            @for (particle of particles(); track particle.id) {
              <div
                class="absolute rounded-full"
                [style.width.px]="particle.size"
                [style.height.px]="particle.size"
                [style.left.%]="particle.x"
                [style.top.%]="particle.y"
                [style.background]="particle.color"
                [style.opacity]="particle.opacity"
                [style.animation]="
                  'float ' + particle.duration + 's ease-in-out infinite'
                "
                [style.animation-delay.s]="particle.delay"
                [style.filter]="'blur(1px)'"
              ></div>
            }
          </div>
        </div>

        <!-- Content -->
        <div class="relative max-w-7xl mx-auto px-6 w-full">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            <!-- LEFT: Text Content -->
            <div class="space-y-10 py-16 lg:py-36 flex flex-col justify-center">
              <!-- Badge with animation -->
              @if (
                profile &&
                profile.certifications &&
                profile.certifications.length > 0
              ) {
                <div
                  class="inline-flex items-center gap-2 w-fit"
                  [style.animation]="'fadeInUp 0.8s ease-out'"
                >
                  <div
                    class="h-2 w-2 rounded-full bg-teal-400 animate-pulse"
                  ></div>
                  <p
                    class="text-xs uppercase tracking-widest text-teal-300 font-bold"
                  >
                    Backed by institutional capital
                  </p>
                </div>
              }

              <!-- Headline with stagger -->
              <div
                class="space-y-6"
                [style.animation]="'fadeInUp 1s ease-out 0.2s backwards'"
              >
                <h1
                  class="text-2xl lg:text-3xl xl:text-4xl font-black text-white leading-none tracking-tighter"
                >
                  {{ profile.tagline }}
                </h1>
                <div
                  class="h-1.5 w-32 bg-gradient-to-r from-teal-400 via-teal-400 to-cyan-400"
                  [style.animation]="'slideInLeft 0.8s ease-out 0.4s backwards'"
                ></div>
              </div>

              <!-- Subheading with fade -->
              @if (profile.elevator_pitch) {
                <p
                  class="text-lg lg:text-xl text-slate-200 leading-relaxed max-w-2xl"
                  [style.animation]="'fadeInUp 1s ease-out 0.6s backwards'"
                >
                  {{ profile.elevator_pitch }}
                </p>
              }

              <!-- Trust badges with scale -->
              @if (
                profile &&
                profile.certifications &&
                profile.certifications.length > 0
              ) {
                <div
                  class="flex flex-wrap gap-2"
                  [style.animation]="'fadeInUp 1s ease-out 0.8s backwards'"
                >
                  @for (
                    cert of profile.certifications.slice(0, 4);
                    track cert
                  ) {
                    <span
                      class="text-xs font-semibold text-slate-200 px-3 py-1.5 rounded-full bg-white/5 border border-teal-500/30 backdrop-blur-sm hover:bg-white/10 hover:border-teal-400/50 transition-all duration-300"
                    >
                      ✓ {{ cert }}
                    </span>
                  }
                </div>
              }

              <!-- CTAs with hover -->
              <div
                class="flex flex-col sm:flex-row gap-4 pt-4"
                [style.animation]="'fadeInUp 1s ease-out 1s backwards'"
              >
                <button
                  (click)="apply()"
                  class="group px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-all shadow-2xl hover:shadow-teal-500/50 hover:scale-105 inline-flex items-center gap-3 w-fit"
                >
                  Apply Now
                  <svg
                    class="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
                @if (profile && profile.heroVideo && profile.heroVideo.url) {
                  <button
                    (click)="playVideo()"
                    class="px-8 py-4 border-2 border-slate-400 text-white font-semibold rounded-lg hover:border-teal-400 hover:bg-white/5 transition-all inline-flex items-center gap-3"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
                      />
                    </svg>
                    Watch
                  </button>
                }
              </div>
            </div>

            <!-- RIGHT: Visual with gradient animation -->
            <div class="relative lg:py-0 py-12">
              <!-- Animated glow -->
              <div
                class="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-teal-500/20 to-teal-500/5 rounded-full blur-3xl"
                [style.animation]="'float 12s ease-in-out infinite'"
              ></div>

              <!-- Hero Container -->
              <div
                class="relative h-96 lg:h-full min-h-[400px] flex items-center justify-center"
                [style.animation]="'fadeInUp 1.2s ease-out 0.4s backwards'"
              >
                @if (profile && profile.heroVideo && profile.heroVideo.url) {
                  <!-- Video Hero -->
                  <div
                    class="relative w-full h-full group cursor-pointer"
                    (click)="playVideo()"
                  >
                    <div
                      class="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-500 shadow-2xl"
                    ></div>
                    <div
                      class="relative inset-1 rounded-3xl overflow-hidden bg-slate-900"
                    >
                      @if (
                        profile &&
                        profile.heroVideo &&
                        profile.heroVideo.thumbnail
                      ) {
                        <img
                          [src]="profile.heroVideo.thumbnail"
                          alt="Hero"
                          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      } @else {
                        <div
                          class="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"
                        ></div>
                      }
                      <div
                        class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent group-hover:from-black/20 transition-colors flex items-center justify-center"
                      >
                        <button
                          class="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-125 group-hover:bg-teal-400 transition-all"
                        >
                          <svg
                            class="w-7 h-7 text-white ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                } @else {
                  <!-- Gradient-only hero (no image) -->
                  <div class="relative w-full h-full">
                    <div
                      class="absolute inset-0 bg-gradient-to-br from-teal-500/40 to-slate-700/40 rounded-3xl transform -rotate-6 shadow-2xl group-hover:rotate-0 transition-transform duration-500"
                    ></div>
                    <div
                      class="relative inset-1 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 overflow-hidden"
                    >
                      <!-- Animated gradient mesh background -->
                      <div class="absolute inset-0">
                        <div
                          class="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-transparent"
                          [style.animation]="'shimmer 3s ease-in-out infinite'"
                        ></div>
                        <div
                          class="absolute inset-0 bg-gradient-to-bl from-slate-500/10 to-transparent"
                          [style.animation]="
                            'shimmer 4s ease-in-out infinite 1s'
                          "
                        ></div>
                      </div>

                      <!-- Center badge -->
                      <div
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <div
                          class="text-center space-y-4"
                          [style.animation]="'pulse 2s ease-in-out infinite'"
                        >
                          <div
                            class="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto"
                          >
                            <svg
                              class="w-10 h-10 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-2a4 4 0 00-8 0v2h8z"
                              />
                            </svg>
                          </div>
                          <p class="text-sm font-semibold text-slate-200">
                            {{ profile.organizationName }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Proof points -->
              @if (
                profile &&
                profile.portfolioHighlights &&
                profile.portfolioHighlights.length > 0
              ) {
                <div
                  class="hidden lg:block absolute -bottom-4 -left-8 space-y-3 bg-gradient-to-br from-white/95 to-slate-50 backdrop-blur-md p-6 rounded-2xl shadow-2xl max-w-xs"
                  [style.animation]="'fadeInUp 1s ease-out 1.2s backwards'"
                >
                  @for (
                    highlight of profile.portfolioHighlights.slice(0, 2);
                    track highlight
                  ) {
                    <div class="flex items-start gap-3">
                      <div
                        class="w-5 h-5 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center"
                      >
                        <svg
                          class="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                      <span class="text-sm font-semibold text-slate-900">{{
                        highlight
                      }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Diagonal divider -->
        <div
          class="absolute bottom-0 left-0 right-0 h-32 bg-white transform -skew-y-2 -mb-1"
        ></div>

        <!-- Animations -->
        <style>
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px) translateX(0px);
            }
            50% {
              transform: translateY(-20px) translateX(10px);
            }
          }

          @keyframes shimmer {
            0%,
            100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.7;
            }
          }

          @keyframes pulse {
            0%,
            100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.8;
            }
          }
        </style>
      </section>
    } @else {
      <section
        class="min-h-screen bg-slate-950 flex items-center justify-center"
      >
        <div class="text-center">
          <p class="text-slate-400">Profile loading...</p>
        </div>
      </section>
    }
  `,
  styles: [
    `
      :host ::ng-deep {
        /* Ensure animations run smoothly */
        * {
          will-change: auto;
        }
      }
    `,
  ],
})
export class FunderPublicProfileHeader implements OnInit, OnDestroy {
  @Input() profile: PublicProfile | null = null;

  particles = signal<Particle[]>([]);
  private animationFrameId: number | null = null;

  ngOnInit() {
    if (this.profile) {
      this.generateParticles();
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private generateParticles() {
    const particleCount = 20;
    const newParticles: Particle[] = [];
    const colors = [
      'rgba(15, 191, 168, 0.5)', // teal
      'rgba(148, 163, 184, 0.3)', // slate
      'rgba(6, 182, 212, 0.4)', // cyan
      'rgba(30, 144, 255, 0.3)', // blue
    ];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: `particle-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    this.particles.set(newParticles);
  }

  apply() {
    // Navigate or open application modal
  }

  playVideo() {
    if (this.profile && this.profile.heroVideo && this.profile.heroVideo.url) {
      window.open(this.profile.heroVideo.url, '_blank');
    }
  }
}
