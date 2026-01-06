// marketplace-header.component.ts - Updated for Seamless Blend
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Zap, TrendingUp, Users } from 'lucide-angular';

@Component({
  selector: 'app-marketplace-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative overflow-hidden">
      <!-- Background Pattern -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400 opacity-90"
      ></div>
      <div
        class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20"
      ></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <!-- Main Title -->
          <h1
            class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
          >
            Funding
            <span
              class="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"
            >
              Opportunities
            </span>
          </h1>

          <!-- Subtitle -->
          <p
            class="text-xl md:text-2xl text-teal-100 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Connect with South African funders and accelerate your growth
            through intelligent matching
          </p>

          <!-- Stats Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div class="text-center">
              <div
                class="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3"
              >
                <lucide-icon [img]="UsersIcon" [size]="24" class="text-white" />
              </div>
              <div class="text-2xl font-bold text-white">5,000+</div>
              <div class="text-teal-200 text-sm">SMEs Connected</div>
            </div>
            <div class="text-center">
              <div
                class="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3"
              >
                <lucide-icon [img]="ZapIcon" [size]="24" class="text-white" />
              </div>
              <div class="text-2xl font-bold text-white">R2.5B+</div>
              <div class="text-teal-200 text-sm">Funding Deployed</div>
            </div>
            <div class="text-center">
              <div
                class="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3"
              >
                <lucide-icon
                  [img]="TrendingUpIcon"
                  [size]="24"
                  class="text-white"
                />
              </div>
              <div class="text-2xl font-bold text-white">94%</div>
              <div class="text-teal-200 text-sm">Success Rate</div>
            </div>
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
    `,
  ],
})
export class MarketplaceHeaderComponent {
  ZapIcon = Zap;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
}
