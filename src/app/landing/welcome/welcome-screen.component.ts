// src/app/welcome/welcome-screen.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Check,
  ArrowRight,
  UserCheck,
  FileText,
  Search,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Target,
  Play,
  MessageCircle,
  HelpCircle,
  User,
  Pause,
  Volume2,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/services/production.auth.service';
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
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  templateUrl: './welcome-screen.component.html',
  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes bounce-subtle {
        0%,
        20%,
        50%,
        80%,
        100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-8px);
        }
        60% {
          transform: translateY(-4px);
        }
      }

      @keyframes progress-fill {
        from {
          width: 0%;
        }
        to {
          width: var(--target-width);
        }
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

      .video-container {
        position: relative;
        border-radius: 0.75rem;
        overflow: hidden;
        background: #000;
        cursor: pointer;
      }

      .video-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          45deg,
          rgba(0, 0, 0, 0.3),
          rgba(0, 0, 0, 0.1)
        );
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .video-overlay:hover {
        background: linear-gradient(
          45deg,
          rgba(0, 0, 0, 0.5),
          rgba(0, 0, 0, 0.2)
        );
      }

      .play-button {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .play-button:hover {
        background: rgba(255, 255, 255, 1);
        transform: scale(1.1);
      }

      .video-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        padding: 20px 16px 16px;
        color: white;
      }

      .expanded-card {
        min-height: 140px;
      }
    `,
  ],
})
export class WelcomeScreenComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  // State
  profileCompletion = signal(25);
  isVideoPlaying = signal(false);
  videoElement: HTMLVideoElement | null = null;

  // Icon references
  readonly icons = {
    check: Check,
    arrowRight: ArrowRight,
    user: User,
    userCheck: UserCheck,
    fileText: FileText,
    search: Search,
    trendingUp: TrendingUp,
    shield: Shield,
    zap: Zap,
    users: Users,
    target: Target,
    play: Play,
    pause: Pause,
    volume2: Volume2,
    messageCircle: MessageCircle,
    helpCircle: HelpCircle,
  };

  // Welcome steps data
  welcomeSteps = signal<WelcomeStep[]>([
    {
      id: 'account-created',
      title: 'Account Created',
      description: 'Your Kapify account is ready to use',
      icon: this.icons.check,
      completed: true,
    },
    {
      id: 'profile-setup',
      title: 'Complete Your Business Profile',
      description: 'Add your company details and business information',
      icon: this.icons.user,
      completed: false,
    },
    {
      id: 'explore-funding',
      title: 'Discover Funding Options',
      description: 'Browse opportunities that match your business',
      icon: this.icons.search,
      completed: false,
    },
    {
      id: 'apply-funding',
      title: 'Submit Your First Application',
      description: 'Apply for funding that fits your needs',
      icon: this.icons.fileText,
      completed: false,
    },
  ]);

  // Onboarding cards data
  onboardingCards = signal<OnboardingCard[]>([
    {
      id: 'intelligent-matching',
      title: 'Intelligent Matching',
      description:
        'Our AI-powered system matches your business with the most suitable funding opportunities based on your profile and needs.',
      icon: this.icons.target,
      color: 'blue',
      action: 'Learn How It Works',
    },
    {
      id: 'comprehensive-database',
      title: 'Comprehensive Database',
      description:
        'Access thousands of funding opportunities from banks, investors, government programs, and private lenders across South Africa.',
      icon: this.icons.search,
      color: 'green',
      action: 'Browse Opportunities',
    },
    {
      id: 'application-tracking',
      title: 'Application Tracking',
      description:
        'Monitor all your funding applications in one place with real-time status updates and communication tools.',
      icon: this.icons.trendingUp,
      color: 'purple',
      action: 'See Dashboard',
    },
    {
      id: 'expert-guidance',
      title: 'Expert Guidance',
      description:
        'Get tips, best practices, and insights from funding experts to improve your application success rate.',
      icon: this.icons.users,
      color: 'orange',
      action: 'Get Tips',
    },
    {
      id: 'secure-platform',
      title: 'Bank-Level Security',
      description:
        'Your business data is protected with enterprise-grade security and compliance with local data protection laws.',
      icon: this.icons.shield,
      color: 'red',
      action: 'Learn About Security',
    },
    {
      id: 'fast-applications',
      title: 'Streamlined Process',
      description:
        'Apply to multiple funding sources quickly with reusable profiles and automated form filling.',
      icon: this.icons.zap,
      color: 'yellow',
      action: 'Start Applying',
    },
  ]);

  ngOnInit() {
    // this.calculateProfileCompletion();
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
    this.router.navigate(['/profile/home']);
  }

  exploreOpportunities(): void {
    this.router.navigate(['/funding/opportunities']);
  }

  skipToMainApp(): void {
    localStorage.setItem('welcomeCompleted', 'true');
    this.router.navigate(['/dashboard']);
  }

  toggleVideo(): void {
    if (!this.videoElement) {
      this.videoElement = document.querySelector(
        '#platform-video'
      ) as HTMLVideoElement;
    }

    if (this.videoElement) {
      if (this.isVideoPlaying()) {
        this.videoElement.pause();
        this.isVideoPlaying.set(false);
      } else {
        this.videoElement.play();
        this.isVideoPlaying.set(true);
      }
    }
  }

  onVideoEnded(): void {
    this.isVideoPlaying.set(false);
  }

  // Computed properties
  completedSteps = computed(() => {
    return this.welcomeSteps().filter((step) => step.completed).length;
  });

  totalSteps = computed(() => {
    return this.welcomeSteps().length;
  });
}
