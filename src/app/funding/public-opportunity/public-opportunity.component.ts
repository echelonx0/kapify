// src/app/funding/public-opportunity/public-opportunity.component.ts
import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SMEOpportunitiesService } from '../services/opportunities.service';
import { FundingOpportunity } from '../../funder/create-opportunity/shared/funding.interfaces';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-public-opportunity',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './public-opportunity.component.html',
})
export class PublicOpportunityComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private destroy$ = new Subject<void>();

  // State
  opportunity = signal<FundingOpportunity | null>(null);
  isLoading = signal(true);
  linkCopied = signal(false);

  ngOnInit() {
    const opportunityId = this.route.snapshot.paramMap.get('id');
    if (opportunityId) {
      this.loadOpportunity(opportunityId);
    }
  }

  loadOpportunity(id: string) {
    this.isLoading.set(true);
    this.opportunitiesService.getOpportunityById(id).subscribe({
      next: (opportunity) => {
        this.opportunity.set(opportunity || null);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading opportunity:', error);
        this.isLoading.set(false);
      },
    });
  }

  // Navigation
  goBack() {
    window.history.back();
  }

  goToLogin() {
    const opp = this.opportunity();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: `/applications/new?opportunityId=${opp?.id}` },
    });
  }

  goToRegister() {
    const opp = this.opportunity();
    this.router.navigate(['/register'], {
      queryParams: { redirectTo: `applications/new?opportunityId=${opp?.id}` },
    });
  }

  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  // Formatting helpers
  getInitials(title: string): string {
    return title
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatFundingType(type: string): string {
    const types: Record<string, string> = {
      equity: 'Equity Investment',
      debt: 'Debt Financing',
      mezzanine: 'Mezzanine Financing',
      grant: 'Grant Funding',
      convertible: 'Convertible Note',
    };
    return types[type] || type;
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }

  formatFullAmount(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  formatDeadline(dateString: string | Date | undefined): string {
    if (!dateString) return 'TBD';
    try {
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      return this.formatDate(date);
    } catch {
      return 'TBD';
    }
  }

  formatBusinessStages(stages: string[]): string {
    const formatted = stages.map((stage) =>
      stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );

    if (formatted.length <= 2) {
      return formatted.join(' and ');
    }

    return `${formatted.slice(0, -1).join(', ')}, and ${
      formatted[formatted.length - 1]
    }`;
  }

  formatIndustryDescription(industry: string): string {
    const descriptions: Record<string, string> = {
      technology: 'Technology and Digital Transformation',
      manufacturing: 'Manufacturing and Industrial',
      retail: 'Retail and Consumer Goods',
      agriculture: 'Agriculture and Food Processing',
      healthcare: 'Health and Wellness',
      fintech: 'Financial Technology',
      education: 'Education and Skills Development',
      energy: 'Renewable Energy and Environmental Sustainability',
      logistics: 'Logistics and Transportation',
      professional_services: 'Professional Services',
    };
    return descriptions[industry] || industry;
  }
}
