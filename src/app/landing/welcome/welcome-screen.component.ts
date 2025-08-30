// src/app/welcome/welcome-screen.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  CheckCircle, 
  ArrowRight, 
  User, 
  FileText, 
  Search, 
  TrendingUp,
  Shield,
  Zap,
  Users,
  Target
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';
import { UiButtonComponent } from 'src/app/shared/components';
 
interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

interface OnboardingCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action?: string;
  route?: string;
}

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
      </div>

      <div class="relative z-10">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
          <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h1 class="text-xl font-bold text-slate-800">Welcome to Kapify</h1>
              </div>
              <button 
                (click)="skipToMainApp()"
                class="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <!-- Welcome Header -->
          <div class="text-center mb-12 animate-fade-in">
            <div class="w-20 h-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg animate-bounce-subtle">
              <lucide-icon [name]="'zap'" [size]="32" class="text-white"></lucide-icon>
            </div>
            <h1 class="text-4xl font-bold text-slate-900 mb-4">
              Welcome, {{ getUserName() }}!
            </h1>
            <p class="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              You've successfully joined South Africa's leading funding platform. 
              Let's get you set up to find the perfect funding opportunities for your business.
            </p>
          </div>

          <!-- Progress Overview -->
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-lg border border-slate-200/50 animate-slide-up [animation-delay:0.2s]">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 mb-2">Your Journey Starts Here</h2>
                <p class="text-slate-600">Complete your setup to unlock all platform features</p>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-primary-600 mb-1">{{ profileCompletion() }}%</div>
                <div class="text-sm text-slate-500">Profile Complete</div>
              </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-slate-200 rounded-full h-3 mb-8">
              <div 
                class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-1000 ease-out animate-progress-fill"
                [style.width.%]="profileCompletion()"
              ></div>
            </div>

            <!-- Quick Steps -->
            <div class="grid gap-4">
              <div 
                *ngFor="let step of welcomeSteps(); let i = index" 
                class="flex items-center p-4 rounded-xl border border-slate-200/50 hover:bg-slate-50/50 transition-all duration-200 animate-slide-up"
                [style.animation-delay]="(0.1 * i + 0.4) + 's'"
              >
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center mr-4 transition-colors"
                  [class]="step.completed ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'"
                >
                  <lucide-icon 
                    [name]="step.completed ? 'check-circle' : step.icon" 
                    [size]="16"
                  ></lucide-icon>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900">{{ step.title }}</h3>
                  <p class="text-sm text-slate-600">{{ step.description }}</p>
                </div>
                <div 
                  class="w-3 h-3 rounded-full transition-colors"
                  [class]="step.completed ? 'bg-primary-500' : 'bg-slate-300'"
                ></div>
              </div>
            </div>
          </div>

          <!-- Platform Features -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div 
              *ngFor="let card of onboardingCards(); let i = index" 
              class="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-slide-up"
              [style.animation-delay]="(0.1 * i + 0.6) + 's'"
              (click)="handleCardAction(card)"
            >
              <div 
                class="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                [class]="'bg-' + card.color + '-100'"
              >
                <lucide-icon 
                  [name]="card.icon" 
                  [size]="24" 
                  [class]="'text-' + card.color + '-600'"
                ></lucide-icon>
              </div>
              <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ card.title }}</h3>
              <p class="text-slate-600 text-sm leading-relaxed">{{ card.description }}</p>
              
              <div class="flex items-center mt-4 text-sm font-medium" [class]="'text-' + card.color + '-600'">
                {{ card.action || 'Learn More' }}
                <lucide-icon [name]="'arrow-right'" [size]="16" class="ml-2"></lucide-icon>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up [animation-delay:1s]">
            <ui-button
              variant="primary"
              size="lg"
              (clicked)="completeProfile()"
              class="w-full sm:w-auto"
            >
              <lucide-icon [name]="'user'" [size]="20" class="mr-2"></lucide-icon>
              Complete Your Profile
            </ui-button>
            
            <ui-button
              variant="outline"
              size="lg"
              (clicked)="exploreOpportunities()"
              class="w-full sm:w-auto"
            >
              <lucide-icon [name]="'search'" [size]="20" class="mr-2"></lucide-icon>
              Explore Opportunities
            </ui-button>
          </div>

          <!-- Help Section -->
          <div class="text-center mt-12 animate-fade-in [animation-delay:1.2s]">
            <p class="text-slate-600 mb-4">Need help getting started?</p>
            <div class="flex justify-center gap-4">
              <button class="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors">
                Watch Tutorial
              </button>
              <span class="text-slate-300">•</span>
              <button class="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors">
                Contact Support
              </button>
              <span class="text-slate-300">•</span>
              <button class="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors">
                FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce-subtle {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    @keyframes progress-fill {
      from { width: 0%; }
      to { width: var(--target-width); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.8s ease-out both;
    }
    
    .animate-slide-up {
      animation: slide-up 0.8s ease-out both;
    }
    
    .animate-bounce-subtle {
      animation: bounce-subtle 2s ease-in-out infinite;
    }
    
    .animate-progress-fill {
      animation: progress-fill 1.5s ease-out both;
    }
  `]
})
export class WelcomeScreenComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Icons
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;
  UserIcon = User;
  FileTextIcon = FileText;
  SearchIcon = Search;
  TrendingUpIcon = TrendingUp;
  ShieldIcon = Shield;
  ZapIcon = Zap;
  UsersIcon = Users;
  TargetIcon = Target;

  // State
  profileCompletion = signal(25); // Starting at 25% as requested

  // Welcome steps data
  welcomeSteps = signal<WelcomeStep[]>([
    {
      id: 'account-created',
      title: 'Account Created',
      description: 'Your Kapify account is ready to use',
      icon: 'check-circle',
      completed: true
    },
    {
      id: 'profile-setup',
      title: 'Complete Your Business Profile',
      description: 'Add your company details and business information',
      icon: 'user',
      completed: false
    },
    {
      id: 'explore-funding',
      title: 'Discover Funding Options',
      description: 'Browse opportunities that match your business',
      icon: 'search',
      completed: false
    },
    {
      id: 'apply-funding',
      title: 'Submit Your First Application',
      description: 'Apply for funding that fits your needs',
      icon: 'file-text',
      completed: false
    }
  ]);

  // Onboarding cards data
  onboardingCards = signal<OnboardingCard[]>([
    {
      id: 'intelligent-matching',
      title: 'Intelligent Matching',
      description: 'Our AI-powered system matches your business with the most suitable funding opportunities based on your profile and needs.',
      icon: 'target',
      color: 'blue',
      action: 'Learn How It Works'
    },
    {
      id: 'comprehensive-database',
      title: 'Comprehensive Database',
      description: 'Access thousands of funding opportunities from banks, investors, government programs, and private lenders across South Africa.',
      icon: 'search',
      color: 'green',
      action: 'Browse Opportunities'
    },
    {
      id: 'application-tracking',
      title: 'Application Tracking',
      description: 'Monitor all your funding applications in one place with real-time status updates and communication tools.',
      icon: 'trending-up',
      color: 'purple',
      action: 'See Dashboard'
    },
    {
      id: 'expert-guidance',
      title: 'Expert Guidance',
      description: 'Get tips, best practices, and insights from funding experts to improve your application success rate.',
      icon: 'users',
      color: 'orange',
      action: 'Get Tips'
    },
    {
      id: 'secure-platform',
      title: 'Bank-Level Security',
      description: 'Your business data is protected with enterprise-grade security and compliance with local data protection laws.',
      icon: 'shield',
      color: 'red',
      action: 'Learn About Security'
    },
    {
      id: 'fast-applications',
      title: 'Streamlined Process',
      description: 'Apply to multiple funding sources quickly with reusable profiles and automated form filling.',
      icon: 'zap',
      color: 'yellow',
      action: 'Start Applying'
    }
  ]);

  ngOnInit() {
    // You could load actual profile completion from user service here
    this.calculateProfileCompletion();
  }

  getUserName(): string {
    const user = this.authService.user();
    return user?.firstName || 'there';
  }

  calculateProfileCompletion(): void {
    // This would calculate based on actual user data
    // For now, starting at 25% as requested
    const user = this.authService.user();
    let completion = 25; // Base for having account created
    
    // Add logic to calculate completion based on profile fields
    // if (user?.companyName) completion += 15;
    // if (user?.businessDescription) completion += 20;
    // etc.
    
    this.profileCompletion.set(completion);
  }

  handleCardAction(card: OnboardingCard): void {
    switch (card.id) {
      case 'comprehensive-database':
        this.exploreOpportunities();
        break;
      case 'application-tracking':
        this.skipToMainApp();
        break;
      case 'fast-applications':
        this.completeProfile();
        break;
      default:
        // For other cards, you might want to show more info or navigate to specific pages
        console.log(`Action for ${card.title}`);
    }
  }

  completeProfile(): void {
    this.router.navigate(['/profile/setup']);
  }

  exploreOpportunities(): void {
    this.router.navigate(['/funding/opportunities']);
  }

  skipToMainApp(): void {
    // Mark welcome as completed and navigate to main dashboard
    localStorage.setItem('welcomeCompleted', 'true');
    this.router.navigate(['/dashboard']);
  }

  // Computed properties
  completedSteps = computed(() => {
    return this.welcomeSteps().filter(step => step.completed).length;
  });

  totalSteps = computed(() => {
    return this.welcomeSteps().length;
  });
}