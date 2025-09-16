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
  Mail
} from 'lucide-angular';
import { LandingFooterComponent } from './landing-footer.component';
import { LandingHeaderComponent } from './landing-header.component';

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

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, LandingHeaderComponent, LandingFooterComponent],
  templateUrl: 'landing.component.html',
})
export class LandingComponent {
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

  heroStats: Statistic[] = [
    { value: '98%', label: 'MATCH SUCCESS', description: 'Of matches get funded' },
    { value: '48hrs', label: 'RESPONSE TIME', description: 'Average funder response' }
  ];

  applicationSteps: ApplicationStep[] = [
    { number: 1, title: 'Submit Business Details', description: 'Tell us about your business' },
    { number: 2, title: 'Get AI Match', description: 'We find compatible funders' },
    { number: 3, title: 'Receive Offers', description: 'Funders contact you directly' }
  ];

  smeBenefits: Benefit[] = [
    {
      title: 'Only Qualified Matches',
      description: 'Never waste time on funders who don\'t fund your industry or stage'
    },
    {
      title: 'Faster Applications', 
      description: 'Reuse your profile across multiple funders - apply once, reach many'
    },
    {
      title: 'Higher Success Rate',
      description: '98% of our matches receive funding offers vs 10% industry average'
    },
    {
      title: 'No Upfront Fees',
      description: 'Only pay when you successfully receive funding'
    }
  ];

  funderBenefits: Benefit[] = [
    {
      title: 'Pre-Qualified Deals',
      description: 'Only see businesses that match your investment criteria'
    },
    {
      title: 'Complete Applications',
      description: 'Standardized, thorough applications with all required documents'
    },
    {
      title: 'Better ROI',
      description: 'Spend time evaluating deals, not sorting through poor fits'
    },
    {
      title: 'Market Access',
      description: 'Reach the entire South African SME market through one platform'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Thabo Mthembu',
      company: 'TechFlow Solutions',
      role: 'CEO',
      content: 'Got 3 funding offers in one week. Closed R2.5M Series A after being rejected by banks for months.',
      amount: 'Funded: R2.5M Series A'
    },
    {
      name: 'Sarah van der Merwe', 
      company: 'GreenLeaf Organics',
      role: 'Founder',
      content: 'Kapify matched us with an impact investor who actually understood our business. Funded in 10 days.',
      amount: 'Funded: R800K Growth Capital'
    },
    {
      name: 'Mandla Ndlovu',
      company: 'Digital Marketing Pro',
      role: 'Managing Director', 
      content: 'Applied to 12 traditional lenders over 6 months - all rejected. Kapify found the right funder in 3 days.',
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

  startApplication() {
    // Navigate to application form
    console.log('Starting application...');
  }

  openFunderPortal() {
    // Navigate to funder portal
    console.log('Opening funder portal...');
  }

  watchDemo() {
    // Open demo modal or navigate to demo page
    console.log('Watch demo...');
  }

  contactSales() {
    // Open contact form or navigate to contact page
    console.log('Contact sales...');
  }
}