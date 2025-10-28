// credits-explanation.component.ts
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CreditCard,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  FileText,
  Eye,
  MessageSquare,
  Download,
  Users,
  ArrowRight,
  Info,
  DollarSign,
  Clock,
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
  savings?: string;
}

interface CreditAction {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: any;
  color: string;
}

@Component({
  selector: 'app-credits-explanation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  templateUrl: './credit-system-info.component.html',
  styles: [],
})
export class CreditsExplanationComponent {
  // Icons
  CreditCardIcon = CreditCard;
  ZapIcon = Zap;
  ShieldIcon = Shield;
  TrendingUpIcon = TrendingUp;
  CheckCircleIcon = CheckCircle;
  FileTextIcon = FileText;
  EyeIcon = Eye;
  MessageSquareIcon = MessageSquare;
  DownloadIcon = Download;
  UsersIcon = Users;
  ArrowRightIcon = ArrowRight;
  InfoIcon = Info;
  DollarSignIcon = DollarSign;
  ClockIcon = Clock;

  private router = inject(Router);

  // State
  selectedPackageId = signal<string>('medium');

  // Credit packages
  packages = signal<CreditPackage[]>([
    {
      id: 'starter',
      credits: 50,
      price: 500,
      pricePerCredit: 10,
    },
    {
      id: 'medium',
      credits: 150,
      price: 1350,
      pricePerCredit: 9,
      popular: true,
      savings: 'Save 10%',
    },
    {
      id: 'pro',
      credits: 300,
      price: 2400,
      pricePerCredit: 8,
      savings: 'Save 20%',
    },
    {
      id: 'enterprise',
      credits: 500,
      price: 3500,
      pricePerCredit: 7,
      savings: 'Save 30%',
    },
  ]);

  // What credits do
  creditActions = signal<CreditAction[]>([
    {
      id: 'view-application',
      title: 'View Full Application',
      description:
        'Access complete business profile, financials, and documents',
      cost: 5,
      icon: this.EyeIcon,
      color: 'blue',
    },
    {
      id: 'download-documents',
      title: 'Download Documents',
      description:
        'Get financial statements, business plans, and supporting docs',
      cost: 3,
      icon: this.DownloadIcon,
      color: 'green',
    },
    {
      id: 'contact-business',
      title: 'Contact Business',
      description: 'Initiate direct communication with the business owner',
      cost: 2,
      icon: this.MessageSquareIcon,
      color: 'purple',
    },
    {
      id: 'request-meeting',
      title: 'Request Meeting',
      description: 'Schedule a formal pitch or due diligence meeting',
      cost: 8,
      icon: this.UsersIcon,
      color: 'orange',
    },
  ]);

  // Benefits of credit system
  benefits = signal([
    {
      title: 'Pay Only for What You Use',
      description:
        'No monthly subscriptions or recurring fees. Buy credits when you need them.',
      icon: this.DollarSignIcon,
    },
    {
      title: 'Credits Never Expire',
      description:
        'Your credits stay active indefinitely. Use them at your own pace.',
      icon: this.ClockIcon,
    },
    {
      title: 'Transparent Pricing',
      description:
        'Every action has a clear credit cost. No hidden fees or surprises.',
      icon: this.ShieldIcon,
    },
    {
      title: 'Volume Discounts',
      description:
        'Buy more credits at once to unlock better rates and save up to 30%.',
      icon: this.TrendingUpIcon,
    },
  ]);

  // Actions
  selectPackage(packageId: string) {
    this.selectedPackageId.set(packageId);
  }

  purchaseCredits() {
    const selectedPackage = this.packages().find(
      (p) => p.id === this.selectedPackageId()
    );
    if (selectedPackage) {
      this.router.navigate(['/checkout'], {
        queryParams: {
          package: selectedPackage.id,
          credits: selectedPackage.credits,
          amount: selectedPackage.price,
        },
      });
    }
  }

  goToApplications() {
    this.router.navigate(['/funding/applications']);
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  getActionIconClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
    };
    return classMap[color] || 'bg-slate-100 text-slate-600';
  }
}
