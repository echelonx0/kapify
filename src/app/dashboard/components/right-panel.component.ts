// right-panel.component.ts - FIXED VERSION
import { Component, signal, Input, Output, EventEmitter, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, ArrowLeft } from 'lucide-angular';
import { ActivityInboxComponent } from '../../messaging/messaging/messaging.component';

export type RightPanelContent = 
  | 'activity-inbox'
  | 'how-it-works'
  | 'funding-types'
  | 'security'
  | 'tips'
  | 'success-stories'
  | 'support';

interface PanelContentConfig {
  id: RightPanelContent;
  title: string;
  showCloseButton: boolean;
  scrollable: boolean;
}

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ActivityInboxComponent
  ],
  templateUrl: './right-panel.component.html',
})
export class RightPanelComponent implements OnDestroy {
  // Fix: Use regular @Input() instead of signal for content
  @Input() content: RightPanelContent = 'activity-inbox';
  @Output() contentChange = new EventEmitter<RightPanelContent>();

  // Icons
  XIcon = X;
  ArrowLeftIcon = ArrowLeft;

  // Create internal signal that syncs with the input
  private _currentContent = signal<RightPanelContent>('activity-inbox');

  constructor() {
    // Effect to sync input changes with internal signal
    effect(() => {
      this._currentContent.set(this.content);
    });
  }

  // Expose the current content as a computed signal
  currentContent = this._currentContent.asReadonly();

  // Panel configurations
  private panelConfigs: Record<RightPanelContent, PanelContentConfig> = {
    'activity-inbox': {
      id: 'activity-inbox',
      title: 'Recent Activity & Messages',
      showCloseButton: false,
      scrollable: false
    },
    'how-it-works': {
      id: 'how-it-works',
      title: 'How Kapify Works',
      showCloseButton: true,
      scrollable: true
    },
    'funding-types': {
      id: 'funding-types',
      title: 'Funding Types',
      showCloseButton: true,
      scrollable: true
    },
    'security': {
      id: 'security',
      title: 'Security & Compliance',
      showCloseButton: true,
      scrollable: true
    },
    'tips': {
      id: 'tips',
      title: 'Funding Tips',
      showCloseButton: true,
      scrollable: true
    },
    'success-stories': {
      id: 'success-stories',
      title: 'Success Stories',
      showCloseButton: true,
      scrollable: true
    },
    'support': {
      id: 'support',
      title: 'Expert Support',
      showCloseButton: true,
      scrollable: true
    }
  };

  // Mock data for funding types
  fundingTypes = [
    {
      id: 'debt',
      title: 'Debt Financing',
      description: 'Traditional loans with fixed repayment terms. Retain full ownership of your business.',
      range: 'R100K - R50M',
      term: '1-7 years',
      icon: '💰',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'equity',
      title: 'Equity Investment',
      description: 'Exchange ownership stake for capital investment. No repayment required.',
      range: 'R500K - R500M',
      term: '5-10 years',
      icon: '📊',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      id: 'mezzanine',
      title: 'Mezzanine Financing',
      description: 'Hybrid of debt and equity financing with conversion options.',
      range: 'R2M - R100M',
      term: '3-7 years',
      icon: '📈',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 'grants',
      title: 'Government Grants',
      description: 'Non-repayable funding from government programs and development agencies.',
      range: 'R50K - R5M',
      term: 'No repayment',
      icon: '🏛️',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  // Mock data for tips
  fundingTips = [
    {
      id: '1',
      title: 'Prepare Strong Financials',
      content: 'Clean, audited financial statements are essential. Include 3 years of historical data and 3-year projections.',
      action: 'Download Financial Template'
    },
    {
      id: '2',
      title: 'Know Your Numbers',
      content: 'Be able to explain every line item in your financial statements and justify your projections confidently.',
      action: null
    },
    {
      id: '3',
      title: 'Build Relationships Early',
      content: 'Start networking with potential funders before you need the money. Relationships take time to build.',
      action: 'Find Networking Events'
    },
    {
      id: '4',
      title: 'Perfect Your Pitch',
      content: 'A compelling pitch deck should tell a story: problem, solution, market, traction, team, and ask.',
      action: 'View Pitch Templates'
    },
    {
      id: '5',
      title: 'Show Market Validation',
      content: 'Demonstrate demand through customer testimonials, pilot programs, or pre-orders.',
      action: null
    }
  ];

  currentConfig() {
    return this.panelConfigs[this.currentContent()];
  }

  closePanel() {
    this._currentContent.set('activity-inbox');
    this.contentChange.emit('activity-inbox');
  }

  // Fix: Add ngOnChanges to handle input changes properly
  ngOnChanges() {
    if (this.content) {
      this._currentContent.set(this.content);
    }
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}