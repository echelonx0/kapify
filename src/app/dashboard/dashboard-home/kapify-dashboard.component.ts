// // applications-home.component.ts
// import { Component, signal, computed, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { 
//   LucideAngularModule, 
//   FileText, 
//   Clock, 
//   TrendingUp, 
//   DollarSign,
//   Plus,
//   Filter,
//   Eye,
//   Search,
//   X,
//   BookOpen,
//   Users,
//   Target,
//   CheckCircle,
//   ArrowRight,
//   Lightbulb,
//   Shield,
//   Zap
// } from 'lucide-angular';
// import { UiButtonComponent } from '../../shared/components';
// import { ActivityInboxComponent } from '../../shared/components/messaging/messaging.component';

// interface OnboardingCard {
//   id: string;
//   title: string;
//   description: string;
//   icon: any;
//   type: 'info' | 'action' | 'feature';
//   actionText?: string;
//   actionRoute?: string;
//   completed?: boolean;
//   color: string;
// }

// @Component({
//   selector: 'app-kapify-home',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     LucideAngularModule,
//     UiButtonComponent,
//     ActivityInboxComponent
//   ],
//   templateUrl: './kapify-dashboard.component.html',
//   styles: [`
//     .line-clamp-2 {
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//       overflow: hidden;
//     }
//   `]
// })
// export class KapifyDashboard implements OnInit {
//   // Icons
//   FileTextIcon = FileText;
//   ClockIcon = Clock;
//   TrendingUpIcon = TrendingUp;
//   DollarSignIcon = DollarSign;
//   PlusIcon = Plus;
//   FilterIcon = Filter;
//   EyeIcon = Eye;
//   SearchIcon = Search;
//   XIcon = X;
//   BookOpenIcon = BookOpen;
//   UsersIcon = Users;
//   TargetIcon = Target;
//   CheckCircleIcon = CheckCircle;
//   ArrowRightIcon = ArrowRight;
//   LightbulbIcon = Lightbulb;
//   ShieldIcon = Shield;
//   ZapIcon = Zap;

//   // State
//   isLoading = signal(false);

//   // Onboarding cards data
//   private onboardingData: OnboardingCard[] = [
//     {
//       id: 'how-it-works',
//       title: 'How Kapify Works',
//       description: 'Kapify connects your business with the right funding partners through our intelligent matching system. Complete your profile, get matched with suitable funders, and track your application progress all in one place.',
//       icon: this.BookOpenIcon,
//       type: 'info',
//       actionText: 'Learn the Process',
//       actionRoute: '/how-it-works',
//       color: 'blue'
//     },
//     {
//       id: 'funding-types',
//       title: 'Explore Funding Types',
//       description: 'Discover different funding options available including equity investment, debt financing, grants, and mezzanine funding. Each type has unique benefits depending on your business stage and needs.',
//       icon: this.DollarSignIcon,
//       type: 'feature',
//       actionText: 'View Funding Options',
//       actionRoute: '/funding-types',
//       color: 'green'
//     },
//     // {
//     //   id: 'success-stories',
//     //   title: 'Success Stories',
//     //   description: 'Read how other South African businesses have successfully raised capital through Kapify. Learn from their experiences and get inspired by their funding journeys.',
//     //   icon: this.TrendingUpIcon,
//     //   type: 'info',
//     //   actionText: 'Read Stories',
//     //   actionRoute: '/success-stories',
//     //   color: 'purple'
//     // },
//     // {
//     //   id: 'complete-profile',
//     //   title: 'Complete Your Business Profile',
//     //   description: 'A complete profile increases your chances of getting matched with the right funders by 300%. Add your business information, financial data, and growth plans.',
//     //   icon: this.TargetIcon,
//     //   type: 'action',
//     //   actionText: 'Complete Profile',
//     //   actionRoute: '/dashboard/profile',
//     //   color: 'orange'
//     // },
//     // {
//     //   id: 'security-compliance',
//     //   title: 'Security & Compliance',
//     //   description: 'Your data is protected with bank-level security. We comply with POPIA and international data protection standards to keep your business information safe.',
//     //   icon: this.ShieldIcon,
//     //   type: 'info',
//     //   actionText: 'Learn About Security',
//     //   actionRoute: '/security',
//     //   color: 'blue'
//     // },
//     // {
//     //   id: 'expert-support',
//     //   title: 'Expert Support Available',
//     //   description: 'Our funding specialists are ready to help you navigate the application process. Get personalized guidance to maximize your funding potential.',
//     //   icon: this.UsersIcon,
//     //   type: 'action',
//     //   actionText: 'Contact Support',
//     //   actionRoute: '/support',
//     //   color: 'green'
//     // },
//     // {
//     //   id: 'tips-best-practices',
//     //   title: 'Funding Tips & Best Practices',
//     //   description: 'Learn insider tips on creating compelling applications, preparing for investor meetings, and negotiating terms. Our guides are written by experienced funding professionals.',
//     //   icon: this.LightbulbIcon,
//     //   type: 'info',
//     //   actionText: 'View Tips',
//     //   actionRoute: '/tips',
//     //   color: 'yellow'
//     // }
//   ];

//   onboardingCards = signal<OnboardingCard[]>(this.onboardingData);

//   constructor(private router: Router) {}

//   ngOnInit() {
//     // Initialize component
//   }

//   // Computed properties for stats (repurposed as requested)
//   stats = computed(() => {
//     return {
//       total: 0, // Will be updated when user has applications
//       funders: 250, // Number of active funders on platform
//       successRate: 87, // Platform success rate
//       totalFunded: 2.4 // Billion ZAR funded through platform
//     };
//   });

//   // Actions
//   learnMore() {
//     this.router.navigate(['/how-it-works']);
//   }

//   startApplication() {
//     this.router.navigate(['/funding/applications/new']);
//   }

//   handleCardAction(card: OnboardingCard) {
//     if (card.actionRoute) {
//       this.router.navigate([card.actionRoute]);
//     }
//   }

//   // Utility methods for card styling
//   getCardBorderClass(color: string): string {
//     const classMap: Record<string, string> = {
//       blue: 'hover:border-blue-200',
//       green: 'hover:border-green-200',
//       purple: 'hover:border-purple-200',
//       orange: 'hover:border-orange-200',
//       yellow: 'hover:border-yellow-200'
//     };
//     return classMap[color] || 'hover:border-gray-200';
//   }

//   getCardIconClass(color: string): string {
//     const classMap: Record<string, string> = {
//       blue: 'bg-blue-100',
//       green: 'bg-green-100',
//       purple: 'bg-purple-100',
//       orange: 'bg-orange-100',
//       yellow: 'bg-yellow-100'
//     };
//     return classMap[color] || 'bg-gray-100';
//   }

//   getCardIconTextClass(color: string): string {
//     const classMap: Record<string, string> = {
//       blue: 'text-blue-600',
//       green: 'text-green-600',
//       purple: 'text-purple-600',
//       orange: 'text-orange-600',
//       yellow: 'text-yellow-600'
//     };
//     return classMap[color] || 'text-gray-600';
//   }

//   formatTotalFunded(): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       notation: 'compact',
//       maximumFractionDigits: 1
//     }).format(2400000000); // 2.4 billion
//   }
// }

// kapify-dashboard.component.ts (Updated)
import { Component, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  FileText, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Plus,
  Filter,
  Eye,
  Search,
  X,
  BookOpen,
  Users,
  Target,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import { RightPanelContent, RightPanelComponent } from '../components/right_panel.component';
 

interface OnboardingCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  type: 'info' | 'action' | 'feature';
  actionText?: string;
  actionRoute?: string;
  rightPanelContent?: RightPanelContent;
  completed?: boolean;
  color: string;
}

@Component({
  selector: 'app-kapify-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    RightPanelComponent
  ],
  template: `
    <div class="h-screen bg-gray-50 flex">
      <!-- Left Side - Onboarding Content (60%) -->
      <div class="w-3/5 flex flex-col h-screen">
        <!-- Stats Section - Fixed -->
        <div class="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div class="grid grid-cols-4 gap-6">
            <div class="text-center">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <lucide-icon [img]="FileTextIcon" [size]="24" class="text-green-600" />
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ stats().total }}</div>
              <div class="text-sm text-gray-600">Applications</div>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <lucide-icon [img]="UsersIcon" [size]="24" class="text-blue-600" />
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ stats().funders }}</div>
              <div class="text-sm text-gray-600">Active Funders</div>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <lucide-icon [img]="TrendingUpIcon" [size]="24" class="text-purple-600" />
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ stats().successRate }}%</div>
              <div class="text-sm text-gray-600">Success Rate</div>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <lucide-icon [img]="DollarSignIcon" [size]="24" class="text-green-600" />
              </div>
              <div class="text-2xl font-bold text-gray-900">{{ formatTotalFunded() }}</div>
              <div class="text-sm text-gray-600">Total Funded</div>
            </div>
          </div>
        </div>

        <!-- Scrollable Cards Section -->
        <div class="flex-1 overflow-y-auto">
          <div class="p-6 space-y-4">
            @for (card of onboardingCards(); track card.id) {
              <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
                   [class]="getCardBorderClass(card.color)"
                   (click)="handleCardAction(card)">
                <!-- Card Header -->
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-start space-x-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                         [class]="getCardIconClass(card.color)">
                      <lucide-icon [img]="card.icon" [size]="20" [class]="getCardIconTextClass(card.color)" />
                    </div>
                    
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <h3 class="text-lg font-semibold text-gray-900">{{ card.title }}</h3>
                        @if (card.completed) {
                          <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-500" />
                        }
                      </div>
                      <p class="text-gray-600 mt-1 leading-relaxed">{{ card.description }}</p>
                    </div>
                  </div>
                  
                  <!-- Indicate clickable -->
                  <div class="flex items-center text-gray-400">
                    <lucide-icon [img]="ArrowRightIcon" [size]="16" />
                  </div>
                </div>
                
                <!-- Card Action Text -->
                @if (card.actionText && !card.completed) {
                  <div class="mt-2 pt-4 border-t border-gray-100">
                    <span class="text-sm text-gray-500 flex items-center">
                      <lucide-icon [img]="EyeIcon" [size]="14" class="mr-1" />
                      Click to {{ card.actionText.toLowerCase() }} in the side panel
                    </span>
                  </div>
                }
              </div>
            }

            <!-- Call to Action Card -->
            <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-8 text-white mt-8">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-xl font-bold mb-2">Explore Kapify Subscription</h3>
                  <p class="text-green-100 mb-4 max-w-md">
                   Get Expanded features and Tooling.
                  </p>
                  <ui-button variant="outline" (clicked)="startApplication()" class="bg-white text-green-600 border-white hover:bg-green-50">
                    Start Your Subscription
                    <lucide-icon [img]="ArrowRightIcon" [size]="16" class="ml-2" />
                  </ui-button>
                </div>
                <div class="hidden md:block">
                  <lucide-icon [img]="ZapIcon" [size]="80" class="text-green-200 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

     
<!-- Right Side - Dynamic Panel (40%) -->
<div class="w-2/5 h-screen flex flex-col">
  <app-right-panel 
    [content]="rightPanelContent" 
    (contentChange)="onRightPanelContentChange($event)" 
    class="flex-1 overflow-y-auto" />
</div>


  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class KapifyDashboard implements OnInit {
  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  PlusIcon = Plus;
  FilterIcon = Filter;
  EyeIcon = Eye;
  SearchIcon = Search;
  XIcon = X;
  BookOpenIcon = BookOpen;
  UsersIcon = Users;
  TargetIcon = Target;
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;
  LightbulbIcon = Lightbulb;
  ShieldIcon = Shield;
  ZapIcon = Zap;

  // State
  isLoading = signal(false);
  rightPanelContent = signal<RightPanelContent>('activity-inbox');

  // Updated onboarding cards data with right panel mappings
  private onboardingData: OnboardingCard[] = [
    {
      id: 'how-it-works',
      title: 'How Kapify Works',
      description: 'Kapify connects your business with the right funding partners through our intelligent matching system. Complete your profile, get matched with suitable funders, and track your application progress all in one place.',
      icon: this.BookOpenIcon,
      type: 'info',
      actionText: 'Learn the Process',
      rightPanelContent: 'how-it-works',
      color: 'blue'
    },
    {
      id: 'funding-types',
      title: 'Explore Funding Types',
      description: 'Discover different funding options available including equity investment, debt financing, grants, and mezzanine funding. Each type has unique benefits depending on your business stage and needs.',
      icon: this.DollarSignIcon,
      type: 'feature',
      actionText: 'View Funding Options',
      rightPanelContent: 'funding-types',
      color: 'green'
    },
    {
      id: 'tips-best-practices',
      title: 'Funding Tips & Best Practices',
      description: 'Learn insider tips on creating compelling applications, preparing for investor meetings, and negotiating terms. Our guides are written by experienced funding professionals.',
      icon: this.LightbulbIcon,
      type: 'info',
      actionText: 'View Tips',
      rightPanelContent: 'tips',
      color: 'yellow'
    },
    {
      id: 'security-compliance',
      title: 'Security & Compliance',
      description: 'Your data is protected with bank-level security. We comply with POPIA and international data protection standards to keep your business information safe.',
      icon: this.ShieldIcon,
      type: 'info',
      actionText: 'Learn About Security',
      rightPanelContent: 'security',
      color: 'blue'
    }
  ];

  onboardingCards = signal<OnboardingCard[]>(this.onboardingData);

  constructor(private router: Router) {}

  ngOnInit() {
    // Initialize component
  }

  // Computed properties for stats
  stats = computed(() => {
    return {
      total: 0, // Will be updated when user has applications
      funders: 250, // Number of active funders on platform
      successRate: 87, // Platform success rate
      totalFunded: 2.4 // Billion ZAR funded through platform
    };
  });

  // Actions
  learnMore() {
    this.router.navigate(['/how-it-works']);
  }

  startApplication() {
    this.router.navigate(['/funding/applications/new']);
  }

  handleCardAction(card: OnboardingCard) {
    if (card.rightPanelContent) {
      // Show content in right panel
      this.rightPanelContent.set(card.rightPanelContent);
    } else if (card.actionRoute) {
      // Navigate to external route
      this.router.navigate([card.actionRoute]);
    }
  }

  onRightPanelContentChange(content: RightPanelContent) {
    this.rightPanelContent.set(content);
  }

  // Utility methods for card styling
  getCardBorderClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'hover:border-blue-200',
      green: 'hover:border-green-200',
      purple: 'hover:border-purple-200',
      orange: 'hover:border-orange-200',
      yellow: 'hover:border-yellow-200'
    };
    return classMap[color] || 'hover:border-gray-200';
  }

  getCardIconClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      orange: 'bg-orange-100',
      yellow: 'bg-yellow-100'
    };
    return classMap[color] || 'bg-gray-100';
  }

  getCardIconTextClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600'
    };
    return classMap[color] || 'text-gray-600';
  }

  formatTotalFunded(): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(2400000000); // 2.4 billion
  }
}