// // loading-state.component.ts
// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-loading-state',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="card p-12 text-center">
//       <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
//       <h3 class="text-lg font-semibold text-neutral-900 mb-2">Loading Opportunities</h3>
//       <p class="text-neutral-600">Finding the best funding matches for you...</p>
//     </div>
//   `
// })
// export class LoadingStateComponent {}

// // empty-state.component.ts
// import { Component, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, Search, Filter } from 'lucide-angular';

// @Component({
//   selector: 'app-empty-state',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     <div class="empty-state">
//       <div class="empty-icon">
//         <lucide-icon [img]="SearchIcon" [size]="32" class="text-neutral-400" />
//       </div>
//       <h3 class="empty-title">No funding opportunities found</h3>
//       <p class="empty-description">
//         We couldn't find any opportunities matching your current criteria. 
//         Try adjusting your filters or search terms to discover more funding options.
//       </p>
      
//       <div class="flex flex-col sm:flex-row gap-3 justify-center">
//         <button 
//           (click)="clearFilters.emit()"
//           class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all duration-200">
//           <lucide-icon [img]="FilterIcon" [size]="16" />
//           Clear all filters
//         </button>
        
//         <button class="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200">
//           <lucide-icon [img]="SearchIcon" [size]="16" />
//           Browse all opportunities
//         </button>
//       </div>
//     </div>
//   `
// })
// export class EmptyStateComponent {
//   @Output() clearFilters = new EventEmitter<void>();
  
//   SearchIcon = Search;
//   FilterIcon = Filter;
// }

// // insights-widget.component.ts
// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, FileText, TrendingUp, DollarSign, ExternalLink } from 'lucide-angular';

// interface InsightItem {
//   icon: any;
//   iconColor: string;
//   title: string;
//   description: string;
//   readTime: string;
// }

// @Component({
//   selector: 'app-insights-widget',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     <div class="section-card">
//       <div class="section-header">
//         <h3 class="section-title text-white flex items-center">
//           <lucide-icon [img]="FileTextIcon" [size]="18" class="mr-2" />
//           Funding Insights
//         </h3>
//         <p class="section-description text-emerald-100 mt-1">
//           Expert guidance to improve your funding success
//         </p>
//       </div>
      
//       <div class="p-6">
//         <div class="space-y-4">
//           <article 
//             *ngFor="let insight of insights"
//             class="group cursor-pointer p-4 rounded-lg hover:bg-neutral-50 transition-all duration-200 border border-transparent hover:border-neutral-200">
            
//             <div class="flex items-start space-x-3">
//               <div class="icon-container w-10 h-10 mt-0.5" [class]="insight.iconColor">
//                 <lucide-icon [img]="insight.icon" [size]="16" />
//               </div>
              
//               <div class="flex-1 min-w-0">
//                 <div class="flex items-start justify-between">
//                   <h4 class="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors text-sm leading-tight mb-1">
//                     {{ insight.title }}
//                   </h4>
//                   <lucide-icon [img]="ExternalLinkIcon" [size]="14" class="text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0 ml-2 mt-0.5" />
//                 </div>
//                 <p class="text-xs text-neutral-600 leading-relaxed mb-2">{{ insight.description }}</p>
//                 <div class="text-xs text-neutral-500">{{ insight.readTime }}</div>
//               </div>
//             </div>
//           </article>
//         </div>
        
//         <div class="mt-6 pt-4 border-t border-neutral-100">
//           <button class="w-full text-center py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
//             View All Resources →
//           </button>
//         </div>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .section-header {
//       background: linear-gradient(135deg, #059669 0%, #047857 100%);
//     }
//   `]
// })
// export class InsightsWidgetComponent {
//   FileTextIcon = FileText;
//   ExternalLinkIcon = ExternalLink;

//   insights: InsightItem[] = [
//     {
//       icon: FileText,
//       iconColor: 'blue',
//       title: 'Preparing Your Funding Application',
//       description: 'Essential documents and strategies for a winning application',
//       readTime: '5 min read'
//     },
//     {
//       icon: TrendingUp,
//       iconColor: 'green',
//       title: 'Top Grant Programs in 2025',
//       description: 'Latest government and private funding opportunities',
//       readTime: '3 min read'
//     },
//     {
//       icon: DollarSign,
//       iconColor: 'neutral',
//       title: 'Equity vs Debt: Making the Right Choice',
//       description: 'Strategic comparison for growth-stage businesses',
//       readTime: '7 min read'
//     }
//   ];
// }

// // newsletter-signup.component.ts
// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, Mail, Users, Clock, CheckCircle } from 'lucide-angular';

// @Component({
//   selector: 'app-newsletter-signup',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     <div class="card-gradient">
//       <div class="card-content bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white overflow-hidden relative">
        
//         <!-- Background Pattern -->
//         <div class="absolute inset-0 opacity-10">
//           <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')]"></div>
//         </div>
        
//         <div class="relative z-10">
//           <!-- Header -->
//           <div class="text-center mb-6">
//             <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
//               <lucide-icon [img]="MailIcon" [size]="28" />
//             </div>
//             <h3 class="text-xl font-bold mb-2">Stay Ahead of Funding</h3>
//             <p class="text-primary-100 text-sm leading-relaxed">
//               Get exclusive funding opportunities and expert insights delivered weekly
//             </p>
//           </div>
          
//           <!-- Email Input -->
//           <div class="space-y-4 mb-6">
//             <div class="relative">
//               <input 
//                 type="email" 
//                 placeholder="Enter your email address"
//                 class="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 placeholder-white/70 text-white focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all backdrop-blur-sm"
//               />
//             </div>
//             <button class="w-full bg-white text-primary-600 py-4 rounded-xl font-semibold hover:bg-neutral-100 transition-all transform hover:-translate-y-0.5 shadow-lg">
//               Subscribe for Free
//             </button>
//           </div>
          
//           <!-- Stats Grid -->
//           <div class="grid grid-cols-3 gap-4 mb-6">
//             <div class="text-center">
//               <div class="flex items-center justify-center mb-2">
//                 <lucide-icon [img]="UsersIcon" [size]="16" class="text-white/80" />
//               </div>
//               <div class="text-lg font-bold">5,000+</div>
//               <div class="text-xs text-primary-200">Subscribers</div>
//             </div>
//             <div class="text-center">
//               <div class="flex items-center justify-center mb-2">
//                 <lucide-icon [img]="ClockIcon" [size]="16" class="text-white/80" />
//               </div>
//               <div class="text-lg font-bold">Weekly</div>
//               <div class="text-xs text-primary-200">Updates</div>
//             </div>
//             <div class="text-center">
//               <div class="flex items-center justify-center mb-2">
//                 <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-white/80" />
//               </div>
//               <div class="text-lg font-bold">Free</div>
//               <div class="text-xs text-primary-200">Forever</div>
//             </div>
//           </div>
          
//           <!-- Benefits List -->
//           <div class="space-y-2 mb-4">
//             <div class="flex items-center gap-2 text-sm">
//               <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-300" />
//               <span class="text-primary-100">Early access to new opportunities</span>
//             </div>
//             <div class="flex items-center gap-2 text-sm">
//               <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-300" />
//               <span class="text-primary-100">Expert funding strategies & tips</span>
//             </div>
//             <div class="flex items-center gap-2 text-sm">
//               <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-300" />
//               <span class="text-primary-100">Market insights & trends</span>
//             </div>
//           </div>
          
//           <!-- Trust Badge -->
//           <div class="text-center pt-4 border-t border-white/20">
//             <p class="text-xs text-primary-200">
//               No spam, unsubscribe anytime. Privacy guaranteed.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class NewsletterSignupComponent {
//   MailIcon = Mail;
//   UsersIcon = Users;
//   ClockIcon = Clock;
//   CheckCircleIcon = CheckCircle;