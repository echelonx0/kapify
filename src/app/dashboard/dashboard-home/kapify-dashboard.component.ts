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
  templateUrl: './kapify-dashboard.component.html',
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