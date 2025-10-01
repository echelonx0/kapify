// src/app/landing/landing.component.ts
import { Component, signal } from '@angular/core';
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
  Zap
} from 'lucide-angular';
import { LandingFooterComponent } from './landing-footer.component';
import { LandingHeaderComponent } from './landing-header.component';
import { Router } from '@angular/router';

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

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, LandingHeaderComponent, LandingFooterComponent],
  templateUrl: 'landing.component.html',
})
export class LandingComponent {

    constructor(private router: Router) {}

  mobileMenuOpen = signal(false);
  email = 'info@kapify.co.za';

  // Icons
  MenuIcon = Menu;
  XIcon = X;
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;
  MapPinIcon = MapPin;
  PhoneIcon = Phone;
  MailIcon = Mail;
  StarIcon = Star;
  TrendingUpIcon = TrendingUp;
  ClockIcon = Clock;
  ShieldIcon = Shield;
  UsersIcon = Users;
  TargetIcon = Target;
  ZapIcon = Zap;

  heroStats: Statistic[] = [
    { value: '98%', label: 'MATCH SUCCESS', description: 'Of matches get funded' },
    { value: '48hrs', label: 'RESPONSE TIME', description: 'Average funder response' }
  ];

  applicationSteps: ApplicationStep[] = [
    { number: 1, title: 'Submit Business Details', description: 'Tell us about your business' },
    { number: 2, title: 'Get AI Match', description: 'We find compatible funders' },
    { number: 3, title: 'Receive Offers', description: 'Funders contact you directly' }
  ];

  problemSolutions: ProblemSolution[] = [
    {
      problem: 'Wasted months applying to funders who never fund your industry',
      solution: 'AI matches you only with funders who fund your specific business type',
      icon: this.TargetIcon
    },
    {
      problem: '90% rejection rate because applications are poor fits',
      solution: '98% match rate because we eliminate bad fits upfront',
      icon: this.TrendingUpIcon
    },
    {
      problem: 'Nobody knows who actually wants to fund what',
      solution: 'Complete transparency on funder criteria and preferences',
      icon: this.UsersIcon
    },
    {
      problem: 'Both sides waste time on mismatched connections',
      solution: 'Both sides save time and close deals faster',
      icon: this.ZapIcon
    }
  ];

  smeBenefits: Benefit[] = [
    {
      icon: this.TargetIcon,
      title: 'Only Qualified Matches',
      description: 'Never waste time on funders who don\'t fund your industry or stage'
    },
    {
      icon: this.ClockIcon,
      title: 'Faster Applications', 
      description: 'Reuse your profile across multiple funders'
    },
    {
      icon: this.TrendingUpIcon,
      title: 'Higher Success Rate',
      description: '98% match rate vs 10% industry average'
    },
    {
      icon: this.ShieldIcon,
      title: 'No Upfront Fees',
      description: 'Only pay when you successfully receive funding'
    }
  ];

  funderBenefits: Benefit[] = [
    {
      icon: this.CheckCircleIcon,
      title: 'Pre-Qualified Deals',
      description: 'Only see businesses that match your criteria'
    },
    {
      icon: this.ShieldIcon,
      title: 'Complete Applications',
      description: 'Standardized, thorough applications'
    },
    {
      icon: this.TrendingUpIcon,
      title: 'Better ROI',
      description: 'Evaluate deals, not sort through poor fits'
    },
    {
      icon: this.UsersIcon,
      title: 'Market Access',
      description: 'Reach entire SA SME market through one platform'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Thabo Mthembu',
      company: 'TechFlow Solutions',
      role: 'CEO',
      content: 'Got 3 funding offers in one week after being rejected by banks for months.',
      amount: 'Funded: R2.5M Series A'
    },
    {
      name: 'Sarah van der Merwe', 
      company: 'GreenLeaf Organics',
      role: 'Founder',
      content: 'Matched with an impact investor who understood our business. Funded in 10 days.',
      amount: 'Funded: R800K Growth Capital'
    },
    {
      name: 'Mandla Ndlovu',
      company: 'Digital Marketing Pro',
      role: 'Managing Director', 
      content: 'Applied to 12 lenders over 6 months - all rejected. Kapify found the right one in 3 days.',
      amount: 'Funded: R1.2M Working Capital'
    }
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

  visitMarketPlace() {
   this.router.navigate(['/marketplace']);
  }

  register() {
  // Navigate to funder registration
    this.router.navigate(['/register'], { queryParams: { userType: 'funder' } });
  }

  watchDemo() {
    console.log('Watch demo...');
  }

  scrollToMatching() {
    const element = document.getElementById('matching-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  }
}