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
  Eye,
  MessageSquare,
  Download,
  Users,
  ArrowRight,
  Clock,
  DollarSign,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import {
  OrgCreditService,
  OrgWallet,
} from 'src/app/shared/services/credit.service';

import { PurchaseCreditsModalComponent } from 'src/app/dashboard/finance/billing/purchase-credits-modal.component';
import { PricingPackagesComponent } from '../pricing-packages/pricing-packages.component';

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
  imports: [
    CommonModule,
    LucideAngularModule,

    PurchaseCreditsModalComponent,
    PricingPackagesComponent,
  ],
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
  EyeIcon = Eye;
  MessageSquareIcon = MessageSquare;
  DownloadIcon = Download;
  UsersIcon = Users;
  ArrowRightIcon = ArrowRight;
  ClockIcon = Clock;
  DollarSignIcon = DollarSign;

  private router = inject(Router);
  private creditService = inject(OrgCreditService);
  private authService = inject(AuthService);

  // State
  isPurchaseModalOpen = signal(false);
  selectedPackageId = signal<string>('medium');
  wallet = signal<OrgWallet | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

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

  ngOnInit() {
    this.loadWallet();
  }

  private loadWallet() {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) return;

    this.isLoading.set(true);
    this.creditService
      .getOrCreateOrgWallet(orgId)
      .then((wallet) => {
        this.wallet.set(wallet);
        this.isLoading.set(false);
      })
      .catch((err) => {
        console.error('Failed to load wallet:', err);
        this.error.set('Failed to load wallet');
        this.isLoading.set(false);
      });
  }

  onPackageSelected(packageId: string) {
    this.selectedPackageId.set(packageId);
  }

  openPurchaseModal() {
    this.isPurchaseModalOpen.set(true);
  }

  closePurchaseModal() {
    this.isPurchaseModalOpen.set(false);
  }

  onPurchaseSuccess() {
    this.closePurchaseModal();
    this.loadWallet();
  }

  goToApplications() {
    this.router.navigate(['/funding/applications']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatCredits(amount: number): string {
    return amount.toLocaleString('en-ZA');
  }

  getActionIconClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-amber-100 text-amber-600',
    };
    return classMap[color] || 'bg-slate-100 text-slate-600';
  }
}
