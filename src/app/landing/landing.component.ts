// // src/app/landing/landing.component.ts
// import { Component, signal, computed } from '@angular/core';
// import { 
//   LucideAngularModule, 
//   CheckCircle, 
//   Users, 
//   TrendingUp, 
//   Shield, 
//   Clock, 
//   Star,
//   ArrowRight,
//   Menu,
//   X,
//   MapPin,
//   Phone,
//   Mail
// } from 'lucide-angular';
// import { UiButtonComponent, UiCardComponent } from '../shared/components';

// interface Statistic {
//   value: string;
//   label: string;
//   description: string;
// }

// interface Feature {
//   icon: any;
//   title: string;
//   description: string;
// }

// interface Testimonial {
//   name: string;
//   company: string;
//   role: string;
//   content: string;
//   rating: number;
// }

// @Component({
//   selector: 'app-landing',
//   standalone: true,
//   imports: [LucideAngularModule, UiButtonComponent, UiCardComponent],
//   templateUrl: 'landing.component.html',
// })
// export class LandingComponent {
//   mobileMenuOpen = signal(false);
//   email = 'info@kapify.co.za'
//   // Icons
//   MenuIcon = Menu;
//   XIcon = X;
//   CheckCircleIcon = CheckCircle;
//   ArrowRightIcon = ArrowRight;
//   MapPinIcon = MapPin;
//   PhoneIcon = Phone;
//   MailIcon = Mail;
//   StarIcon = Star;

//   heroStats: Statistic[] = [
//     { value: '98%', label: 'Success Rate', description: 'Pre-qualified matches' },
//     { value: '48hrs', label: 'Response Time', description: 'Average funder response' }
//   ];

//   features: Feature[] = [
//     {
//       icon: Users,
//       title: 'Smart Matching',
//       description: 'Our AI connects you with funders who actually invest in businesses like yours.'
//     },
//     {
//       icon: Shield,
//       title: 'Pre-Qualification',
//       description: 'Rigorous vetting ensures only serious, qualified opportunities reach investors.'
//     },
//     {
//       icon: Clock,
//       title: 'Fast Process',
//       description: 'Get matched and receive funding decisions in days, not months.'
//     },
//     {
//       icon: TrendingUp,
//       title: 'Higher Success',
//       description: '98% of our pre-qualified applications receive funding offers.'
//     },
//     {
//       icon: CheckCircle,
//       title: 'FSCA Compliant',
//       description: 'Fully regulated and compliant with South African financial regulations.'
//     },
//     {
//       icon: Star,
//       title: 'Expert Support',
//       description: 'Dedicated support team guides you through every step of the process.'
//     }
//   ];

//   applicationSteps = [
//     { number: 1, title: 'Complete Profile', description: 'Tell us about your business' },
//     { number: 2, title: 'Get Qualified', description: 'We verify your application' },
//     { number: 3, title: 'Match & Fund', description: 'Connect with the right funder' }
//   ];

//   processSteps = [
//     {
//       number: 1,
//       title: 'Submit Application',
//       description: 'Complete our comprehensive business assessment and submit required documents.'
//     },
//     {
//       number: 2,
//       title: 'Smart Matching',
//       description: 'Our AI analyzes your profile and matches you with compatible funding partners.'
//     },
//     {
//       number: 3,
//       title: 'Get Funded',
//       description: 'Receive funding offers from pre-qualified investors within 48 hours.'
//     }
//   ];

//   testimonials: Testimonial[] = [
//     {
//       name: 'Thabo Mthembu',
//       company: 'TechFlow Solutions',
//       role: 'CEO',
//       content: 'Kapify connected us with the perfect investor in just 3 days. The pre-qualification process saved us months of pitching to wrong investors.',
//       rating: 5
//     },
//     {
//       name: 'Sarah van der Merwe',
//       company: 'GreenLeaf Organics',
//       role: 'Founder',
//       content: 'The platform made fundraising so much easier. We got multiple offers and closed our Series A in record time.',
//       rating: 5
//     },
//     {
//       name: 'Mandla Ndlovu',
//       company: 'Digital Marketing Pro',
//       role: 'Managing Director',
//       content: 'Professional service, excellent support team, and results that speak for themselves. Highly recommended.',
//       rating: 5
//     }
//   ];

//   getStepClasses(index: number): string {
//     const completed = index < 1;
//     const active = index === 1;
    
//     if (completed) {
//       return 'w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium';
//     }
//     if (active) {
//       return 'w-8 h-8 bg-primary-100 text-primary-600 border-2 border-primary-500 rounded-full flex items-center justify-center text-sm font-medium';
//     }
//     return 'w-8 h-8 bg-neutral-200 text-neutral-500 rounded-full flex items-center justify-center text-sm font-medium';
//   }

//   getStars(rating: number): number[] {
//     return Array(rating).fill(0);
//   }

//   toggleMobileMenu() {
//     this.mobileMenuOpen.set(!this.mobileMenuOpen());
//   }

//   startApplication() {
//     // Navigate to application form
//     console.log('Starting application...');
//   }

//   openFunderPortal() {
//     // Navigate to funder portal
//     console.log('Opening funder portal...');
//   }

//   watchDemo() {
//     // Open demo modal or navigate to demo page
//     console.log('Watch demo...');
//   }

//   contactSales() {
//     // Open contact form or navigate to contact page
//     console.log('Contact sales...');
//   }
// }
 
// src/app/landing/landing.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  Star,
  ArrowRight,
  Menu,
  X,
  MapPin,
  Phone,
  Mail
} from 'lucide-angular';
import { LandingFooterComponent } from '../shared/components/landing-footer.component';
import { LandingHeaderComponent } from '../shared/components/landing-header.component';

interface Statistic {
  value: string;
  label: string;
  description: string;
}

interface Feature {
  icon: any;
  title: string;
  description: string;
}

interface ApplicationStep {
  number: number;
  title: string;
  description: string;
}

interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LucideAngularModule,    LandingHeaderComponent,
    LandingFooterComponent],
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
    { value: '98%', label: 'SUCCESS RATE', description: 'Pre-qualified matches' },
    { value: '48hrs', label: 'RESPONSE TIME', description: 'Average funder response' }
  ];

  features: Feature[] = [
    {
      icon: Users,
      title: 'Smart Matching',
      description: 'Our AI connects you with funders who actually invest in businesses like yours.'
    },
    {
      icon: Shield,
      title: 'Pre-Qualification',
      description: 'Rigorous vetting ensures only serious, qualified opportunities reach investors.'
    },
    {
      icon: Clock,
      title: 'Fast Process',
      description: 'Get matched and receive funding decisions in days, not months.'
    },
    {
      icon: TrendingUp,
      title: 'Higher Success',
      description: '98% of our pre-qualified applications receive funding offers.'
    },
    {
      icon: CheckCircle,
      title: 'FSCA Compliant',
      description: 'Fully regulated and compliant with South African financial regulations.'
    },
    {
      icon: Star,
      title: 'Expert Support',
      description: 'Dedicated support team guides you through every step of the process.'
    }
  ];

  applicationSteps: ApplicationStep[] = [
    { number: 1, title: 'Complete Profile', description: 'Tell us about your business' },
    { number: 2, title: 'Get Qualified', description: 'We verify your application' },
    { number: 3, title: 'Match & Fund', description: 'Connect with the right funder' }
  ];

  processSteps: ProcessStep[] = [
    {
      number: 1,
      title: 'Submit Application',
      description: 'Complete comprehensive business profile and submit required documents.'
    },
    {
      number: 2,
      title: 'Smart Matching',
      description: 'Our AI analyzes your profile and matches you with compatible funding partners.'
    },
    {
      number: 3,
      title: 'Get Funded',
      description: 'Receive funding offers from pre-qualified investors within 48 hours.'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Thabo Mthembu',
      company: 'TechFlow Solutions',
      role: 'CEO',
      content: 'Kapify connected us with the perfect investor in just 3 days. The pre-qualification process saved us months of pitching to wrong investors.',
      rating: 5
    },
    {
      name: 'Sarah van der Merwe',
      company: 'GreenLeaf Organics',
      role: 'Founder',
      content: 'The platform made fundraising so much easier. We got multiple offers and closed our Series A in record time.',
      rating: 5
    },
    {
      name: 'Mandla Ndlovu',
      company: 'Digital Marketing Pro',
      role: 'Managing Director',
      content: 'Professional service, excellent support team, and results that speak for themselves. Highly recommended.',
      rating: 5
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

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
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