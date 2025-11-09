// src/app/marketplace/services/share.service.ts
import { Injectable } from '@angular/core';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Injectable({ providedIn: 'root' })
export class ShareService {
  constructor() {}

  /**
   * Copy opportunity link to clipboard
   */
  copyLink(opportunityId: string): Promise<void> {
    const url = `${window.location.origin}/opportunity/${opportunityId}`;
    return navigator.clipboard.writeText(url);
  }

  /**
   * Share to LinkedIn
   */
  shareToLinkedIn(opportunity: FundingOpportunity): void {
    const url = `${window.location.origin}/opportunity/${opportunity.id}`;
    const message = `Check out this funding opportunity: "${opportunity.title}" on Kapify`;

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`;

    window.open(
      linkedInUrl,
      'linkedin-share',
      'width=600,height=400,menubar=no,toolbar=no,scrollbars=yes'
    );
  }

  /**
   * Share to Twitter
   */
  shareToTwitter(opportunity: FundingOpportunity): void {
    const url = `${window.location.origin}/opportunity/${opportunity.id}`;
    const amount = this.formatAmount(opportunity.offerAmount);
    const text = `🎯 Funding Alert: ${opportunity.title} - Up to ${opportunity.currency} ${amount} available. Apply now on @KapifyZA`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;

    window.open(
      twitterUrl,
      'twitter-share',
      'width=600,height=400,menubar=no,toolbar=no,scrollbars=yes'
    );
  }

  /**
   * Share via Email
   */
  shareViaEmail(opportunity: FundingOpportunity): void {
    const url = `${window.location.origin}/opportunity/${opportunity.id}`;
    const subject = `Funding Opportunity: ${opportunity.title}`;
    const body = `Check out this amazing funding opportunity on Kapify:\n\n${opportunity.shortDescription}\n\n${url}`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  /**
   * Get shareable URL
   */
  getShareUrl(opportunityId: string): string {
    return `${window.location.origin}/opportunity/${opportunityId}`;
  }

  /**
   * Format amount for display
   */
  private formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }
}
