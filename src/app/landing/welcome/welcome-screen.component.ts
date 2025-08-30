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
  Target,
  Play,
  MessageCircle,
  HelpCircle
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
  templateUrl: './welcome-screen.component.html',
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
      40% { transform: translateY(-8px); }
      60% { transform: translateY(-4px); }
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

  // State
  profileCompletion = signal(25);

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
    this.calculateProfileCompletion();
  }

  getUserName(): string {
    const user = this.authService.user();
    return user?.firstName || 'there';
  }

  calculateProfileCompletion(): void {
    const user = this.authService.user();
    let completion = 25; // Base for having account created
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