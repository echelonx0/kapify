// // src/app/dashboard/pages/dashboard-home.component.ts
// import { Component, signal, computed, OnInit, inject, OnDestroy } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { 
//   LucideAngularModule, 
//   ExternalLink, 
//   Search,
//   Plus,
//   Minus,
//   TrendingUp,
//   User,
//   FileText,
//   DollarSign,
//   Building,
//   Settings,
//   ArrowRight
// } from 'lucide-angular';
// import { FormsModule } from '@angular/forms';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { ThreeDViewerComponent } from '../../shared/components/three_d_viewer.component'; 
 
// import { FundingOpportunity } from '../../shared/models/funder.models';
// import { AuthService } from '../../auth/production.auth.service';
// import { SMEOpportunitiesService } from '../../funding/services/opportunities.service';

// @Component({
//   selector: 'app-dashboard-home',
//   standalone: true,
//   imports: [
//     CommonModule,
//     LucideAngularModule,
//     ThreeDViewerComponent,
//     FormsModule
//   ],
//   templateUrl: 'dashboard-home.component.html',
//   styles: [`
//     :host {
//       display: block;
//       height: 100vh;
//       overflow: hidden;
//     }

//     .line-clamp-2 {
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//       overflow: hidden;
//     }

//     .animate-scroll {
//       animation: scroll linear infinite;
//     }

//     @keyframes scroll {
//       0% {
//         transform: translateY(0);
//       }
//       100% {
//         transform: translateY(-50%);
//       }
//     }
//   `]
// })
// export class DashboardHomeComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();
//   private opportunitiesService = inject(SMEOpportunitiesService);
//   private authService = inject(AuthService);

//   // Icons
//   ExternalLinkIcon = ExternalLink;
//   SearchIcon = Search;
//   PlusIcon = Plus;
//   MinusIcon = Minus;
//   TrendingUpIcon = TrendingUp;
//   UserIcon = User;
//   FileTextIcon = FileText;
//   DollarSignIcon = DollarSign;
//   BuildingIcon = Building;
//   SettingsIcon = Settings;
//   ArrowRightIcon = ArrowRight;

//   // State signals from service
//   opportunities = signal<FundingOpportunity[]>([]);
//   isLoading = computed(() => this.opportunitiesService.isLoading());
//   error = computed(() => this.opportunitiesService.error());
//   searchQuery = signal('');

//   // Computed properties
//   userType = computed(() => {
//     const user = this.authService.user();
//     return user?.userType || 'sme';
//   });

//   monthlyLabel = computed(() => {
//     return this.userType() === 'sme' ? 'Monthly Applications' : 'Monthly Delivered';
//   });

//   monthlyValue = computed(() => {
//     return this.userType() === 'sme' ? '3' : '1021';
//   });

//   yearlyLabel = computed(() => {
//     return this.userType() === 'sme' ? 'Yearly Success Rate' : 'Yearly Delivered';
//   });

//   yearlyValue = computed(() => {
//     return this.userType() === 'sme' ? '67%' : '4603';
//   });

//   filteredOpportunities = computed(() => {
//     const query = this.searchQuery().toLowerCase().trim();
//     const opportunities = this.opportunities();
    
//     if (!query) return opportunities;
    
//     return opportunities.filter(opp => 
//       opp.title.toLowerCase().includes(query) ||
//       opp.shortDescription.toLowerCase().includes(query) ||
//       opp.fundingType.toLowerCase().includes(query)   ||
//       (opp.eligibilityCriteria?.industries && 
//        Array.isArray(opp.eligibilityCriteria.industries) &&
//        opp.eligibilityCriteria.industries.some((industry: string) => 
//          industry.toLowerCase().includes(query)
//        ))
//     );
//   });

//   // Create ticker with duplicated opportunities for smooth scrolling
//   tickerOpportunities = computed(() => {
//     const opportunities = this.filteredOpportunities();
//     // Duplicate the opportunities to create seamless scrolling effect
//     return [...opportunities, ...opportunities];
//   });

//   tickerDuration = computed(() => {
//     const count = this.filteredOpportunities().length;
//     // Adjust speed based on number of opportunities (slower for more items)
//     return `${Math.max(20, count * 4)}s`;
//   });

//   totalOpportunities = computed(() => this.opportunities().length);
  
//   totalApplications = computed(() => 
//     this.opportunities().reduce((sum, opp) => sum + (opp.applicationCount || 0), 0)
//   );

//   platformLinks = computed(() => {
//     const userType = this.userType();
//     console.log(userType)
//     const baseLinks = [
//       { label: 'Profile', icon: this.UserIcon, route: '/dashboard/profile', userTypes: ['sme'] },
//       { label: 'Applications', icon: this.FileTextIcon, route: '/applications', userTypes: ['sme'], badge: 2 },
//       { label: 'Opportunities', icon: this.DollarSignIcon, route: '/funding', userTypes: ['sme'] },
//       { label: 'Funder Dashboard', icon: this.BuildingIcon, route: '/dashboard/funder-dashboard', userTypes: ['funder'] },
//       { label: 'Settings', icon: this.SettingsIcon, route: '/dashboard/settings', userTypes: ['sme', 'funder'] }
//     ];

//     const mappedUserType = this.mapUserTypeForNavigation(userType);
//     return baseLinks.filter(link => link.userTypes.includes(mappedUserType));
//   });

//   constructor(
//     private router: Router
//   ) {}

//   ngOnInit() {

//     const currentUser = this.authService.user();
//   // console.log('=== USER DEBUG INFO ===');
//   // console.log('Current user:', currentUser);
//   // console.log('User ID:', currentUser?.id);
//   // console.log('User metadata:', currentUser?.user_metadata);
//   // console.log('User type:', currentUser?.user_metadata?.user_type);
//   // console.log('Raw user meta data:', currentUser?.raw_user_meta_data);
//   // console.log('=== END DEBUG ===');

//   // // Test direct Supabase auth
//   // this.supabase.auth.getUser().then(({ data: { user }, error }) => {
//   //   console.log('=== SUPABASE AUTH DEBUG ===');
//   //   console.log('Supabase user:', user);
//   //   console.log('Supabase user metadata:', user?.user_metadata);
//   //   console.log('Supabase raw metadata:', user?.raw_user_meta_data);
//   //   console.log('Auth error:', error);
//   //   console.log('=== END SUPABASE DEBUG ===');
//   // });

//     this.loadOpportunities();
    
//     // Subscribe to opportunities stream from service
//     this.opportunitiesService.opportunities$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(opportunities => {
//         this.opportunities.set(opportunities);
//       });
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   loadOpportunities() {
//     this.opportunitiesService.loadActiveOpportunities()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (opportunities) => {
//           // Opportunities are automatically updated via the service stream
//           console.log(`Loaded ${opportunities.length} opportunities`);
//         },
//         error: (error) => {
//           console.error('Failed to load opportunities:', error);
//           // Error is automatically handled by the service
//         }
//       });
//   }

//   onSearchChange() {
//     // If we want to implement server-side search for better performance
//     const query = this.searchQuery().trim();
    
//     if (query.length > 2) {
//       // Debounce and search on server
//       this.performServerSearch(query);
//     } else if (query.length === 0) {
//       // Reset to all opportunities
//       this.loadOpportunities();
//     }
//     // For short queries, use client-side filtering via computed property
//   }

//   private performServerSearch(query: string) {
//     this.opportunitiesService.searchOpportunities({ searchQuery: query })
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (opportunities) => {
//           console.log(`Search returned ${opportunities.length} results for "${query}"`);
//         },
//         error: (error) => {
//           console.error('Search failed:', error);
//         }
//       });
//   }

//   private mapUserTypeForNavigation(userType: string): 'sme' | 'funder' {
//     switch (userType) {
//       case 'sme': return 'sme';
//       case 'funder': return 'funder';
//       case 'admin':
//       case 'consultant': return 'funder';
//       default: return 'sme';
//     }
//   }

//   navigateTo(route: string) {
//     this.router.navigate([route]);
//   }

//   navigateToOpportunity(opportunityId: string) {
//     // Track interaction for analytics
//     this.opportunitiesService.trackUserInteraction(opportunityId, 'view');
//     this.router.navigate(['/funding', opportunityId]);
//   }

//   formatCurrency(amount: number, currency: string): string {
//     try {
//       const formatter = new Intl.NumberFormat('en-ZA', {
//         style: 'currency',
//         currency: currency,
//         notation: 'compact',
//         maximumFractionDigits: 1
//       });
//       return formatter.format(amount);
//     } catch (error) {
//       // Fallback for invalid currency codes
//       return `${currency} ${amount.toLocaleString()}`;
//     }
//   }
// }