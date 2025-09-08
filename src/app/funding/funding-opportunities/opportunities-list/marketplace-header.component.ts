// marketplace-header.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Zap, TrendingUp, Users } from 'lucide-angular';

@Component({
  selector: 'app-marketplace-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative overflow-hidden mb-8">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 opacity-90"></div>
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20"></div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <!-- Main Title -->
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Kapify Funding 
            <span class="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Marketplace
            </span>
          </h1>
          
          <!-- Subtitle -->
          <p class="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto mb-8 leading-relaxed">
            Connect with South African funders and accelerate your growth through intelligent matching
          </p>
          
          <!-- Stats Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3">
                <lucide-icon [img]="UsersIcon" [size]="24" class="text-white" />
              </div>
              <div class="text-2xl font-bold text-white">5,000+</div>
              <div class="text-primary-200 text-sm">SMEs Connected</div>
            </div>
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3">
                <lucide-icon [img]="ZapIcon" [size]="24" class="text-white" />
              </div>
              <div class="text-2xl font-bold text-white">R2.5B+</div>
              <div class="text-primary-200 text-sm">Funding Deployed</div>
            </div>
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3">
                <lucide-icon [img]="TrendingUpIcon" [size]="24" class="text-white" />
              </div>
              <div class="text-2xl font-bold text-white">94%</div>
              <div class="text-primary-200 text-sm">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bottom Wave -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 48h1440V0c-120 32-240 48-360 48S600 32 480 32 240 16 120 16 0 32 0 48z" fill="rgb(250, 250, 250)"/>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MarketplaceHeaderComponent {
  ZapIcon = Zap;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
}