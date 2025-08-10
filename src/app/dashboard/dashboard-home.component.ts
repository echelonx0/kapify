 

// src/app/dashboard/pages/dashboard-home.component.ts
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  ExternalLink, 
  Search,
  Plus,
  Minus,
  TrendingUp,
  User,
  FileText,
  DollarSign,
  Building,
  Settings,
  ArrowRight
} from 'lucide-angular';
import { AuthService } from '../auth/auth.service';
 
import { ThreeDViewerComponent } from '../shared/components/three_d_viewer.component'; 
import { OpportunitiesService } from '../funding/services/opportunities.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
   
    
    ThreeDViewerComponent,
    FormsModule
  ],
  template: `
    <div class="relative min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white overflow-hidden">
      <!-- Full Screen 3D Globe Background -->
      <div class="absolute inset-0">
        <app-three-d-viewer 
          [objUrl]="'models/scene.gltf'"
          [modelScale]="2"
          [autoRotate]="true"
          [showMeshSphere]="true"
          class="w-full h-full">
        </app-three-d-viewer>
      </div>

      <!-- Middle Left - Platform Title -->
      <div class="absolute top-1/3 left-6 transform -translate-y-1/2 z-10">
        <div class="text-xs text-white/60 mb-2">AI-Powered</div>
        <h1 class="text-3xl font-bold mb-4">
          Kapify<br>
          Funding Platform
        </h1>
        <div class="text-xs text-white/60 mb-2">Bringing SMEs and Funding partners together</div>
        <button class="text-primary-400 text-sm hover:text-slate-300 transition-colors">
          HOW IT WORKS
        </button>
      </div>

      <!-- Middle Right - Main Statistics -->
      <div class="absolute top-1/3 right-6 transform -translate-y-1/2 z-10 w-64">
        <h2 class="text-xl font-light mb-6">Funding Statistics</h2>
        
        <div class="space-y-4">
          <div>
            <div class="text-sm text-white/60 mb-1">{{ monthlyLabel() }}</div>
            <div class="flex items-center space-x-2">
              <span class="text-3xl font-light">{{ monthlyValue() }}</span>
              <div class="flex items-center text-slate-400 text-sm">
                <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-1" />
                +32%
              </div>
            </div>
          </div>

          <div>
            <div class="text-sm text-white/60 mb-1">{{ yearlyLabel() }}</div>
            <div class="flex items-center space-x-2">
              <span class="text-3xl font-light">{{ yearlyValue() }}</span>
              <div class="flex items-center text-slate-400 text-sm">
                <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-1" />
                +12%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Right Controls -->
      <div class="absolute bottom-8 right-8 z-10 space-y-4">
        <!-- 3D/2D Toggle -->
        <div class="flex bg-white/20 backdrop-blur-sm rounded-lg overflow-hidden">
          <button class="px-4 py-2 bg-white text-black text-sm font-medium">3D</button>
          <button class="px-4 py-2 text-white text-sm font-medium hover:bg-white/20 transition-colors">2D</button>
        </div>

        <!-- Zoom Controls -->
        <div class="bg-white/20 backdrop-blur-sm rounded-lg p-2">
          <div class="text-center text-xs text-white mb-2">Zoom</div>
          <div class="flex flex-col space-y-1">
            <button class="w-8 h-8 rounded bg-white/30 flex items-center justify-center hover:bg-white/40 transition-colors">
              <lucide-icon [img]="PlusIcon" [size]="16" class="text-white" />
            </button>
            <button class="w-8 h-8 rounded bg-white/30 flex items-center justify-center hover:bg-white/40 transition-colors">
              <lucide-icon [img]="MinusIcon" [size]="16" class="text-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Panel - 45% of screen height -->
      <div class="absolute bottom-0 left-0 right-0 z-10 h-[45vh]">
        <div class="grid grid-cols-12 gap-0 h-full">
          <!-- Latest Opportunities -->
          <div class="col-span-8 bg-white rounded-tl-xl p-6 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-semibold text-black">Latest Opportunities</h3>
              <div class="relative">
                <lucide-icon [img]="SearchIcon" [size]="16" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search opportunities"
                  [(ngModel)]="searchQuery"
                  (input)="onSearchChange()"
                  class="bg-gray-100 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
            
            <!-- Opportunities Ticker -->
            <div class="flex-1 overflow-hidden relative">
              @if (filteredOpportunities().length > 0) {
                <div class="h-full">
                  <!-- Ticker animation container -->
                  <div class="animate-scroll space-y-3" [style.animation-duration]="tickerDuration()">
                    @for (opportunity of tickerOpportunities(); track opportunity.id) {
                      <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500 hover:bg-gray-100 transition-colors cursor-pointer"
                           (click)="navigateToOpportunity(opportunity.id)">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h4 class="font-medium text-gray-900 text-sm mb-1">{{ opportunity.title }}</h4>
                            <p class="text-xs text-gray-600 mb-2 line-clamp-2">{{ opportunity.shortDescription }}</p>
                            <div class="flex items-center space-x-4 text-xs text-gray-500">
                              <span class="bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                                {{ formatCurrency(opportunity.offerAmount, opportunity.currency) }}
                              </span>
                              <span class="capitalize">{{ opportunity.fundingType }}</span>
                              <span>{{ opportunity.applicationCount }} applications</span>
                            </div>
                          </div>
                          <lucide-icon [img]="ArrowRightIcon" [size]="16" class="text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="flex items-center justify-center h-full text-gray-500 text-sm">
                  @if (searchQuery()) {
                    No opportunities match your search.
                  } @else {
                    Loading opportunities...
                  }
                </div>
              }
            </div>
          </div>

          <!-- Platform Footer -->
          <div class="col-span-4 bg-slate-900 p-6 flex flex-col">
            <!-- Header -->
            <div class="mb-6">
              <h3 class="text-xl font-bold text-white mb-2">Powered by</h3>
              <div class="bg-primary-500 text-white px-3 py-1 rounded text-sm font-medium inline-block mb-2">
                Bokamoso Advisory Services
              </div>
              <p class="text-xs text-white/60">Kapify does not grant funding. We connect SMEs to opportunities. All parties are vetted.</p>
            </div>

            <!-- Navigation Links -->
            <div class="space-y-4 flex-1">
              <div>
                <h4 class="text-sm font-medium text-white/80 mb-3">Quick Access</h4>
                <div class="space-y-2">
                  @for (link of platformLinks(); track link.route) {
                    <button
                      (click)="navigateTo(link.route)"
                      class="flex items-center w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    >
                      <lucide-icon [img]="link.icon" [size]="16" class="mr-3 flex-shrink-0" />
                      <span class="flex-1">{{ link.label }}</span>
                      @if (link.badge && link.badge > 0) {
                        <span class="px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] text-center">
                          {{ link.badge > 99 ? '99+' : link.badge }}
                        </span>
                      }
                    </button>
                  }
                </div>
              </div>

              <!-- Platform Stats -->
              <div class="pt-4 border-t border-white/20">
                <h4 class="text-sm font-medium text-white/80 mb-3">Platform Stats</h4>
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div class="text-center p-2 bg-white/10 rounded">
                    <div class="font-bold text-white">{{ totalOpportunities() }}</div>
                    <div class="text-white/60">Active</div>
                  </div>
                  <div class="text-center p-2 bg-white/10 rounded">
                    <div class="font-bold text-white">{{ totalApplications() }}</div>
                    <div class="text-white/60">Apps</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="text-xs text-white/40 text-center pt-4 border-t border-white/20">
              © 2025 Kapify Platform
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .animate-scroll {
      animation: scroll linear infinite;
    }

    @keyframes scroll {
      0% {
        transform: translateY(0);
      }
      100% {
        transform: translateY(-50%);
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  private opportunitiesService = inject(OpportunitiesService);

  // Icons
  ExternalLinkIcon = ExternalLink;
  SearchIcon = Search;
  PlusIcon = Plus;
  MinusIcon = Minus;
  TrendingUpIcon = TrendingUp;
  UserIcon = User;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  BuildingIcon = Building;
  SettingsIcon = Settings;
  ArrowRightIcon = ArrowRight;

  // State
  opportunities = signal<any[]>([]);
  searchQuery = signal('');

  // Computed properties
  userType = computed(() => {
    const user = this.authService.user();
    return user?.userType || 'sme';
  });

  monthlyLabel = computed(() => {
    return this.userType() === 'sme' ? 'Monthly Applications' : 'Monthly Delivered';
  });

  monthlyValue = computed(() => {
    return this.userType() === 'sme' ? '3' : '1021';
  });

  yearlyLabel = computed(() => {
    return this.userType() === 'sme' ? 'Yearly Success Rate' : 'Yearly Delivered';
  });

  yearlyValue = computed(() => {
    return this.userType() === 'sme' ? '67%' : '4603';
  });

  filteredOpportunities = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.opportunities();
    
    return this.opportunities().filter(opp => 
      opp.title.toLowerCase().includes(query) ||
      opp.shortDescription.toLowerCase().includes(query) ||
      opp.eligibilityCriteria.industries.some((industry: string) => 
        industry.toLowerCase().includes(query)
      )
    );
  });

  // Create ticker with duplicated opportunities for smooth scrolling
  tickerOpportunities = computed(() => {
    const opportunities = this.filteredOpportunities();
    // Duplicate the opportunities to create seamless scrolling effect
    return [...opportunities, ...opportunities];
  });

  tickerDuration = computed(() => {
    const count = this.filteredOpportunities().length;
    // Adjust speed based on number of opportunities (slower for more items)
    return `${Math.max(20, count * 4)}s`;
  });

  totalOpportunities = computed(() => this.opportunities().length);
  
  totalApplications = computed(() => 
    this.opportunities().reduce((sum, opp) => sum + (opp.applicationCount || 0), 0)
  );

  platformLinks = computed(() => {
    const userType = this.userType();
    const baseLinks = [
      { label: 'Profile', icon: this.UserIcon, route: '/dashboard/profile', userTypes: ['sme'] },
      { label: 'Applications', icon: this.FileTextIcon, route: '/applications', userTypes: ['sme'], badge: 2 },
      { label: 'Opportunities', icon: this.DollarSignIcon, route: '/funding', userTypes: ['sme'] },
      { label: 'Funder Dashboard', icon: this.BuildingIcon, route: '/dashboard/funder-dashboard', userTypes: ['funder'] },
      { label: 'Settings', icon: this.SettingsIcon, route: '/dashboard/settings', userTypes: ['sme', 'funder'] }
    ];

    const mappedUserType = this.mapUserTypeForNavigation(userType);
    return baseLinks.filter(link => link.userTypes.includes(mappedUserType));
  });

  constructor(
    private router: Router,
    private authService: AuthService,
 
  ) {}

  ngOnInit() {
    this.loadOpportunities();
  }

  private loadOpportunities() {
    this.opportunitiesService.getOpportunitiesByStatus('active').subscribe({
      next: (opportunities) => {
        this.opportunities.set(opportunities);
      },
      error: (error) => {
        console.error('Failed to load opportunities:', error);
        this.opportunities.set([]);
      }
    });
  }

  private mapUserTypeForNavigation(userType: string): 'sme' | 'funder' {
    switch (userType) {
      case 'sme': return 'sme';
      case 'funder': return 'funder';
      case 'admin':
      case 'consultant': return 'funder';
      default: return 'sme';
    }
  }

  onSearchChange() {
    // The computed property will automatically update the filtered results
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  navigateToOpportunity(opportunityId: string) {
    this.router.navigate(['/funding', opportunityId]);
  }

  formatCurrency(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    });
    return formatter.format(amount);
  }
}