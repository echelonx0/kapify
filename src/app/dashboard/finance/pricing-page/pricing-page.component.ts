import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Check,
  Phone,
  ArrowRight,
  Eye,
  Download,
  MessageSquare,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-angular';
import { LandingHeaderComponent } from 'src/app/landing/landing-header.component';
import { UseCasesComponent } from './use-cases.component';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  credits: number;
  popular?: boolean;
  savings?: string;
  features: string[];
  cta: string;
}

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    LandingHeaderComponent,
    UseCasesComponent,
  ],
  templateUrl: './pricing-page.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PricingPageComponent {
  private router = inject(Router);

  // Icons
  CheckIcon = Check;
  PhoneIcon = Phone;
  ArrowRightIcon = ArrowRight;
  EyeIcon = Eye;
  DownloadIcon = Download;
  MessageSquareIcon = MessageSquare;
  UsersIcon = Users;
  ZapIcon = Zap;
  ShieldIcon = Shield;
  TrendingUpIcon = TrendingUp;
  ClockIcon = Clock;
  DollarSignIcon = DollarSign;
  supportEmail = 'contact support@kapify.africa';
  tiers = signal<PricingTier[]>([
    {
      id: 'starter',
      name: 'Starter',
      price: 500,
      credits: 50000,
      features: [
        'View 100 applications',
        'Download 50 documents',
        'Send 25 messages',
      ],
      cta: 'Get Started',
    },
    {
      id: 'medium',
      name: 'Medium',
      price: 1350,
      credits: 150000,
      popular: true,
      savings: 'Save 10%',
      features: [
        'View 300+ applications',
        'Download 150 documents',
        'Send 75 messages',
      ],
      cta: 'Choose Plan',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 2400,
      credits: 300000,
      savings: 'Save 20%',
      features: [
        'Unlimited application views',
        'Unlimited document downloads',
        'Send 200 messages',
      ],
      cta: 'Choose Plan',
    },
  ]);

  faqs = signal([
    {
      id: 'expire',
      q: 'Do credits expire?',
      a: 'No. Your credits remain active indefinitely. Use them at your own pace.',
    },
    {
      id: 'refund',
      q: 'Can I get a refund?',
      a: 'Credits are non-refundable. However, they never expire, so you can use them anytime.',
    },
    {
      id: 'upgrade',
      q: 'Can I upgrade later?',
      a: 'Yes. You can purchase additional credits whenever you need them.',
    },
    {
      id: 'team',
      q: 'Do you offer team plans?',
      a: 'Enterprise plans support team collaboration. Contact us for custom pricing.',
    },
  ]);

  formatCredits(amount: number): string {
    return amount.toLocaleString('en-ZA');
  }

  onSelectPlan(tierId: string): void {}

  onContactSales(): void {
    window.open(
      'mailto:support@kapify.africa?subject=Enterprise%20Plan%20Inquiry',
      '_blank'
    );
  }

  onSignUp(): void {
    this.router.navigate(['/register']);
  }

  onLearnMore(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onScheduleDemo() {}
}
