import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Clock,
  Shield,
  Users,
  Target,
  Zap,
  ArrowDown,
  Building,
  FileText,
  Filter,
  ShieldCheck,
  XCircle,
  Play,
} from 'lucide-angular';
import { LandingFooterComponent } from './footer/landing-footer.component';
import { LandingHeaderComponent } from './landing-header.component';
import { Router } from '@angular/router';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

interface Statistic {
  value: string;
  label: string;
  description: string;
}

interface ApplicationStep {
  number: number;
  title: string;
  description: string;
}

interface Benefit {
  icon: any;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  company: string;
  role: string;
  content: string;
  amount: string;
}

interface ProblemSolution {
  problem: string;
  solution: string;
  icon: any;
}

interface AudienceView {
  type: 'business' | 'funder';
  headline: string;
  description: string;
  benefits: Benefit[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    LandingHeaderComponent,
    LandingFooterComponent,
  ],
  templateUrl: 'landing.component.html',
  styleUrl: 'landing.component.css',
})
export class LandingComponent {
  isPlaying = false;
  videoUrl: SafeResourceUrl | null = null;

  // === Toggle State ===
  activeAudience = signal<'business' | 'funder'>('business');

  // === Computed Values ===
  currentView = computed(() => this.audienceViews[this.activeAudience()]);
  isBusinessView = computed(() => this.activeAudience() === 'business');
  isFunderView = computed(() => this.activeAudience() === 'funder');

  constructor(private router: Router, private sanitizer: DomSanitizer) {}

  mobileMenuOpen = signal(false);
  email = 'info@kapify.africa';

  // === Icons ===
  ArrowRightIcon = ArrowRight;
  PlayIcon = Play;
  ShieldCheckIcon = ShieldCheck;
  BuildingIcon = Building;
  TargetIcon = Target;
  ZapIcon = Zap;
  FileTextIcon = FileText;
  TrendingUpIcon = TrendingUp;
  FilterIcon = Filter;
  ClockIcon = Clock;
  UsersIcon = Users;

  // Icons
  MenuIcon = Menu;
  XIcon = X;
  CheckCircleIcon = CheckCircle;

  MapPinIcon = MapPin;
  PhoneIcon = Phone;
  MailIcon = Mail;
  StarIcon = Star;

  ShieldIcon = Shield;

  XCircleIcon = XCircle;
  ArrowDownIcon = ArrowDown;

  // === Audience-Specific Content (Replaces "Why Choose Kapify") ===
  audienceViews: Record<'business' | 'funder', AudienceView> = {
    business: {
      type: 'business',
      headline: 'For Businesses',
      description: 'Stop wasting time on rejections',
      benefits: [
        {
          icon: this.TargetIcon,
          title: 'Smart Matching',
          description:
            'Only apply to funders who actually fund your industry, stage, and region',
        },
        {
          icon: this.ZapIcon,
          title: 'Quick Response time',
          description:
            'Get funding decisions in days, not months. No more waiting in the dark',
        },
        {
          icon: this.FileTextIcon,
          title: 'One Profile, Multiple Opportunities',
          description:
            'Complete your profile once, apply to dozens of opportunities with one click',
        },
      ],
    },
    funder: {
      type: 'funder',
      headline: 'For Funders',
      description: 'Stop reviewing bad-fit applications',
      benefits: [
        {
          icon: this.FilterIcon,
          title: 'Pre-Qualified Pipeline',
          description:
            'Only see businesses that match your exact funding criteria and thesis',
        },
        {
          icon: this.ClockIcon,
          title: '80% Less Time on Review',
          description:
            'Standardized data, verified financials, and complete profiles save hours per deal',
        },
        {
          icon: this.UsersIcon,
          title: 'Better Deal Flow',
          description:
            "Access vetted businesses you'd never find through traditional channels",
        },
      ],
    },
  };

  heroStats: Statistic[] = [
    {
      value: '98%',
      label: 'MATCH SUCCESS',
      description: 'Of matches get funded',
    },
    {
      value: '48hrs',
      label: 'RESPONSE TIME',
      description: 'Average funder response',
    },
  ];

  applicationSteps: ApplicationStep[] = [
    {
      number: 1,
      title: 'Submit Business Details',
      description: 'Tell us about your business',
    },
    {
      number: 2,
      title: 'Get AI Match',
      description: 'We find compatible funders',
    },
    {
      number: 3,
      title: 'Receive Offers',
      description: 'Funders contact you directly',
    },
  ];

  problemSolutions: ProblemSolution[] = [
    {
      problem: 'Wasted months applying to funders who never fund your industry',
      solution:
        'AI matches you only with funders who fund your specific business type',
      icon: this.TargetIcon,
    },
    {
      problem: '90% rejection rate because applications are poor fits',
      solution: '98% match rate because we eliminate bad fits upfront',
      icon: this.TrendingUpIcon,
    },
    {
      problem: 'Nobody knows who actually wants to fund what',
      solution: 'Complete transparency on funder criteria and preferences',
      icon: this.UsersIcon,
    },
    {
      problem: 'Both sides waste time on mismatched connections',
      solution: 'Both sides save time and close deals faster',
      icon: this.ZapIcon,
    },
  ];

  smeBenefits: Benefit[] = [
    {
      icon: this.TargetIcon,
      title: 'Only Qualified Matches',
      description:
        "Never waste time on funders who don't fund your industry or stage",
    },
    {
      icon: this.ClockIcon,
      title: 'Faster Applications',
      description: 'Reuse your profile across multiple funders',
    },
    {
      icon: this.TrendingUpIcon,
      title: 'Higher Success Rate',
      description: '98% match rate vs 10% industry average',
    },
    {
      icon: this.ShieldIcon,
      title: 'No Upfront Fees',
      description: 'Only pay when you successfully receive funding',
    },
  ];

  funderBenefits: Benefit[] = [
    {
      icon: this.CheckCircleIcon,
      title: 'Pre-Qualified Deals',
      description: 'Only see businesses that match your criteria',
    },
    {
      icon: this.ShieldIcon,
      title: 'Complete Applications',
      description: 'Standardized, thorough applications',
    },
    {
      icon: this.TrendingUpIcon,
      title: 'Better ROI',
      description: 'Evaluate deals, not sort through poor fits',
    },
    {
      icon: this.UsersIcon,
      title: 'Market Access',
      description: 'Reach entire SA SME market through one platform',
    },
  ];

  getStepClasses(index: number): string {
    const completed = index < 1;
    const active = index === 1;

    if (completed) {
      return 'w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold';
    }
    if (active) {
      return 'w-12 h-12 bg-green-100 text-green-600 border-2 border-green-500 rounded-full flex items-center justify-center text-lg font-bold';
    }
    return 'w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-lg font-bold';
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  toggleAudience(audience: 'business' | 'funder') {
    this.activeAudience.set(audience);
  }

  visitMarketPlace() {
    this.router.navigate(['/marketplace']);
  }

  register() {
    this.router.navigate(['/register'], {
      queryParams: { userType: 'funder' },
    });
  }

  watchDemo() {
    console.log('Watch demo...');
  }

  currentYear = new Date().getFullYear();

  openVideoModal() {
    console.log('Video modal opened');
    alert('🎥 Play Kapify Intro Video (modal placeholder)');
  }

  scrollToMatching() {
    const element = document.getElementById('matching-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  }
}
