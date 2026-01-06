import {
  Component,
  signal,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  effect,
  ChangeDetectionStrategy,
  Inject,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-angular';
import { ActivityInboxComponent } from '../../../features/messaging/messaging/messaging.component';
import { VersionService } from 'src/app/shared/services/version.service';

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
  showBackButton: boolean;
}

interface FundingType {
  id: string;
  title: string;
  description: string;
  range: string;
  term: string;
  icon: string;
  color?: 'teal' | 'green' | 'blue' | 'amber';
}

interface Tip {
  id: string;
  title: string;
  content: string;
  action?: string;
}

interface SecurityFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: 'green' | 'slate' | 'teal';
}

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ActivityInboxComponent],
  templateUrl: './right-panel.component.html',
  styleUrl: './right-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RightPanelComponent implements OnDestroy {
  @Input() content: RightPanelContent = 'activity-inbox';
  @Input() userType: string = 'sme';
  @Output() contentChange = new EventEmitter<RightPanelContent>();

  // Icons
  ArrowLeftIcon = ArrowLeft;
  CheckCircle2Icon = CheckCircle2;
  AlertCircleIcon = AlertCircle;
  InfoIcon = Info;

  // Internal signal that syncs with input
  private _currentContent = signal<RightPanelContent>('activity-inbox');
  currentContent = this._currentContent.asReadonly();
  versionService = inject(VersionService);
  version = this.versionService.versionString();

  // Panel configurations
  private panelConfigs: Record<RightPanelContent, PanelContentConfig> = {
    'activity-inbox': {
      id: 'activity-inbox',
      title: 'Recent Activity',
      showBackButton: false,
    },
    'how-it-works': {
      id: 'how-it-works',
      title: 'How Kapify Works',
      showBackButton: true,
    },
    'funding-types': {
      id: 'funding-types',
      title: 'Funding Types',
      showBackButton: true,
    },
    security: {
      id: 'security',
      title: 'Security & Compliance',
      showBackButton: true,
    },
    tips: {
      id: 'tips',
      title: 'Funding Tips',
      showBackButton: true,
    },
    'success-stories': {
      id: 'success-stories',
      title: 'Success Stories',
      showBackButton: true,
    },
    support: {
      id: 'support',
      title: 'Expert Support',
      showBackButton: true,
    },
  };

  // Funding types data
  fundingTypes: FundingType[] = [
    {
      id: 'debt',
      title: 'Debt Financing',
      description: 'Traditional loans with fixed repayment terms.',
      range: 'R100K - R50M',
      term: '1-7 years',
      icon: '💰',
      color: 'blue',
    },
    {
      id: 'equity',
      title: 'Equity Investment',
      description: 'Exchange ownership stake for capital investment.',
      range: 'R500K - R500M',
      term: '5-10 years',
      icon: '📊',
      color: 'green',
    },
    {
      id: 'mezzanine',
      title: 'Mezzanine Financing',
      description: 'Hybrid of debt and equity with conversion options.',
      range: 'R2M - R100M',
      term: '3-7 years',
      icon: '📈',
      color: 'amber',
    },
    {
      id: 'grants',
      title: 'Government Grants',
      description: 'Non-repayable funding from government programs.',
      range: 'R50K - R5M',
      term: 'No repayment',
      icon: '🏛️',
      color: 'teal',
    },
  ];

  // Tips data
  fundingTips: Tip[] = [
    {
      id: '1',
      title: 'Prepare Strong Financials',
      content:
        'Clean, audited financial statements are essential. Include 3 years of historical data and 3-year projections.',
      action: 'Download Template',
    },
    {
      id: '2',
      title: 'Know Your Numbers',
      content:
        'Be able to explain every line item in your statements and justify projections confidently.',
    },
    {
      id: '3',
      title: 'Build Relationships',
      content:
        'Start networking with potential funders before you need money. Relationships take time to build.',
      action: 'Find Events',
    },
    {
      id: '4',
      title: 'Perfect Your Pitch',
      content:
        'A compelling pitch should tell a story: problem, solution, market, traction, team, and ask.',
      action: 'View Templates',
    },
    {
      id: '5',
      title: 'Show Market Validation',
      content:
        'Demonstrate demand through customer testimonials, pilot programs, or pre-orders.',
    },
  ];

  // Security features data
  securityFeatures: SecurityFeature[] = [
    {
      id: 'encryption',
      title: 'Bank-Level Security',
      description: '256-bit SSL encryption protects all data transmission.',
      icon: CheckCircle2,
      color: 'green',
    },
    {
      id: 'popia',
      title: 'POPIA Compliant',
      description: 'Full compliance with South African privacy regulations.',
      icon: CheckCircle2,
      color: 'slate',
    },
    {
      id: 'iso',
      title: 'ISO 27001 Certified',
      description: 'International security management standards.',
      icon: CheckCircle2,
      color: 'teal',
    },
  ];

  constructor() {
    // Sync input changes with internal signal
    effect(() => {
      this._currentContent.set(this.content);
    });
  }

  currentConfig() {
    return this.panelConfigs[this.currentContent()];
  }

  goBack() {
    this._currentContent.set('activity-inbox');
    this.contentChange.emit('activity-inbox');
  }

  // Color mapping utilities
  getFundingTypeColors(color: string): {
    bg: string;
    icon: string;
    text: string;
  } {
    const colorMap: Record<string, { bg: string; icon: string; text: string }> =
      {
        teal: {
          bg: 'bg-teal-100',
          icon: 'text-teal-600',
          text: 'text-teal-700',
        },
        green: {
          bg: 'bg-green-100',
          icon: 'text-green-600',
          text: 'text-green-700',
        },
        blue: {
          bg: 'bg-blue-100',
          icon: 'text-blue-600',
          text: 'text-blue-700',
        },
        amber: {
          bg: 'bg-amber-100',
          icon: 'text-amber-600',
          text: 'text-amber-700',
        },
      };
    return colorMap[color] || colorMap['teal'];
  }

  getSecurityIconBg(color: string): string {
    const colorMap: Record<string, string> = {
      green: 'bg-green-100',
      slate: 'bg-slate-100',
      teal: 'bg-teal-100',
    };
    return colorMap[color] || 'bg-slate-100';
  }

  getSecurityIconColor(color: string): string {
    const colorMap: Record<string, string> = {
      green: 'text-green-600',
      slate: 'text-slate-600',
      teal: 'text-teal-600',
    };
    return colorMap[color] || 'text-slate-600';
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}
