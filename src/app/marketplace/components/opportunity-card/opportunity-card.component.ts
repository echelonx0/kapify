import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Eye,
  ExternalLink,
  Clock,
  Building,
  TrendingUp,
  Award,
  Share2,
  Bookmark,
  MailIcon,
  CheckCheckIcon,
  LinkIcon,
} from 'lucide-angular';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { AuthService } from 'src/app/auth/production.auth.service';
import { finalize } from 'rxjs';
import { ShareService } from 'src/app/shared/services/share.service';
import { BookmarkService } from 'src/app/shared/services/bookmark.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-enhanced-opportunity-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: 'opportunity-card.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class KapifyOpportunityCardComponent {
  @Input() opportunity!: FundingOpportunity;
  @Input() canApply: boolean = false;
  @Input() canManage: boolean = false;
  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() manage = new EventEmitter<string>();
  @Output() signInToApply = new EventEmitter<void>();

  // Services
  private bookmarkService = inject(BookmarkService);
  private shareService = inject(ShareService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Icons
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  MapPinIcon = MapPin;
  UsersIcon = Users;
  EyeIcon = Eye;
  ExternalLinkIcon = ExternalLink;
  ClockIcon = Clock;
  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  AwardIcon = Award;
  ShareIcon = Share2;
  BookmarkIcon = Bookmark;
  mail = MailIcon;
  check = CheckCheckIcon;
  link = LinkIcon;
  // State
  isBookmarked = signal(false);
  isBookmarkLoading = signal(false);
  showShareMenu = signal(false);
  linkCopied = signal(false);

  ngOnInit() {
    this.checkBookmarkStatus();
  }

  private checkBookmarkStatus() {
    const user = this.authService.user();
    if (user?.id) {
      this.bookmarkService
        .isBookmarked(this.opportunity.id)
        .subscribe((bookmarked) => this.isBookmarked.set(bookmarked));
    }
  }

  // --- Share & Bookmark Methods ---

  onShare() {
    this.showShareMenu.set(!this.showShareMenu());
  }

  onCopyLink() {
    this.shareService
      .copyLink(this.opportunity.id)
      .then(() => {
        this.linkCopied.set(true);
        this.toastService.success('✓ Link copied to clipboard');

        setTimeout(() => {
          this.linkCopied.set(false);
          this.showShareMenu.set(false);
        }, 2000);
      })
      .catch((error) => {
        console.error('Copy link error:', error);
        this.toastService.error('Failed to copy link');
      });
  }

  onShareLinkedIn() {
    this.shareService.shareToLinkedIn(this.opportunity);
    this.showShareMenu.set(false);
    this.toastService.info('Opening LinkedIn...');
  }

  onShareTwitter() {
    this.shareService.shareToTwitter(this.opportunity);
    this.showShareMenu.set(false);
    this.toastService.info('Opening X (Twitter)...');
  }

  onShareEmail() {
    this.shareService.shareViaEmail(this.opportunity);
    this.showShareMenu.set(false);
    this.toastService.info('Opening email client...');
  }

  onBookmark() {
    const user = this.authService.user();
    if (!user) {
      this.signInToApply.emit();
      return;
    }

    this.isBookmarkLoading.set(true);
    this.bookmarkService
      .toggleBookmark(this.opportunity.id)
      .pipe(finalize(() => this.isBookmarkLoading.set(false)))
      .subscribe({
        next: (bookmarked) => {
          this.isBookmarked.set(bookmarked);
          const message = bookmarked
            ? '✓ Added to bookmarks'
            : '✓ Removed from bookmarks';
          this.toastService.success(message);
        },
        error: (error) => {
          console.error('Bookmark error:', error);
          this.toastService.error('Failed to update bookmark');
        },
      });
  }

  // --- Existing Methods ---

  private getPrimaryFundingType(): string | undefined {
    const ft = this.opportunity.fundingType;
    return Array.isArray(ft) ? ft[0] : ft;
  }

  private getAllFundingTypes(): string[] {
    const ft = this.opportunity.fundingType;
    return Array.isArray(ft) ? ft : ft ? [ft] : [];
  }

  onApply() {
    this.apply.emit(this.opportunity.id);
  }

  onViewDetails() {
    this.viewDetails.emit(this.opportunity.id);
  }

  onManage() {
    this.manage.emit(this.opportunity.id);
  }

  onSignInToApply() {
    this.signInToApply.emit();
  }

  getCardStatusClass(): string {
    return `card-${this.opportunity.status || 'active'}`;
  }

  getStatusBorderClass(): string {
    switch (this.opportunity.status) {
      case 'active':
        return 'bg-green-600';
      case 'closed':
        return 'bg-red-600';
      case 'paused':
        return 'bg-amber-600';
      default:
        return 'bg-green-600';
    }
  }

  getFundingTypeClass(): string {
    const primaryType = this.getPrimaryFundingType();
    switch (primaryType) {
      case 'equity':
        return 'bg-purple-50 text-purple-700 border border-purple-200/50';
      case 'debt':
        return 'bg-blue-50 text-blue-700 border border-blue-200/50';
      case 'grant':
        return 'bg-green-50 text-green-700 border border-green-200/50';
      case 'mezzanine':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200/50';
      case 'convertible':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200/50';
      case 'purchase_order':
        return 'bg-amber-50 text-amber-700 border border-amber-200/50';
      case 'invoice_financing':
        return 'bg-teal-50 text-teal-700 border border-teal-200/50';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200/50';
    }
  }

  formatFundingType(): string {
    const typeLabels: Record<string, string> = {
      equity: 'Equity',
      debt: 'Debt',
      mezzanine: 'Mezzanine',
      grant: 'Grant',
      convertible: 'Convertible',
      purchase_order: 'Purchase Order',
      invoice_financing: 'Invoice Financing',
    };

    const allTypes = this.getAllFundingTypes();
    return allTypes.map((t) => typeLabels[t] || t).join(', ');
  }

  formatAmountRange(): string {
    const currency = this.opportunity.currency || 'ZAR';
    const min = this.formatAmount(this.opportunity.minInvestment);
    const max = this.formatAmount(this.opportunity.maxInvestment);
    return `${currency} ${min} - ${max}`;
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  }

  formatDecisionTime(): string {
    if (this.opportunity.decisionTimeframe) {
      return `${this.opportunity.decisionTimeframe} days`;
    }
    return 'Not specified';
  }

  formatLocations(): string {
    if (!this.opportunity.eligibilityCriteria?.geographicRestrictions?.length) {
      return 'South Africa';
    }

    const locations =
      this.opportunity.eligibilityCriteria.geographicRestrictions;
    const formatted = locations.map((loc: string) =>
      loc.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    );

    if (formatted.length <= 2) {
      return formatted.join(' & ');
    }

    return `${formatted.slice(0, 2).join(', ')} +${formatted.length - 2}`;
  }

  formatApplicationCount(): string {
    const count = this.opportunity.currentApplications || 0;
    if (count === 0) return 'No applications yet';
    if (count === 1) return '1 application';
    if (count > 100) return '100+ applications';
    return `${count} applications`;
  }

  getDisplayIndustries(): string[] {
    const industries = this.opportunity.eligibilityCriteria?.industries || [];
    return industries.slice(0, 3);
  }

  formatIndustry(industry: string): string {
    return industry
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  getProgressPercentage(): number {
    if (
      !this.opportunity.totalAvailable ||
      this.opportunity.totalAvailable === 0
    ) {
      return 0;
    }
    const deployed = this.opportunity.amountDeployed || 0;
    return Math.min((deployed / this.opportunity.totalAvailable) * 100, 100);
  }

  formatProgress(): string {
    const percentage = this.getProgressPercentage();
    const remaining =
      this.opportunity.totalAvailable - (this.opportunity.amountDeployed || 0);

    if (percentage === 0) {
      return 'Fully available';
    }

    if (percentage >= 100) {
      return 'Fully deployed';
    }

    return `${this.formatAmount(remaining)} remaining`;
  }

  showApplicationCount(): boolean {
    return !!(
      this.opportunity.currentApplications &&
      this.opportunity.currentApplications > 0
    );
  }

  isPopular(): boolean {
    return !!(
      this.opportunity.currentApplications &&
      this.opportunity.currentApplications > 10
    );
  }

  trackByIndustry(index: number, industry: string): string {
    return industry;
  }
}
