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
  template: `
    <div class="border-l border-gray-200 flex flex-col h-full bg-white">
      <!-- Panel Header -->
      <div class="flex-shrink-0 border-b border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">{{ currentConfig().title }}</h2>
          @if (currentConfig().showCloseButton) {
            <button 
              (click)="closePanel()"
              class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Activity Inbox">
              <lucide-icon [img]="ArrowLeftIcon" [size]="20" class="text-gray-500" />
            </button>
          }
        </div>
      </div>

      <!-- Panel Content -->
      <div class="flex-1" [class.overflow-y-auto]="currentConfig().scrollable">
        @switch (currentContent()) {
          @case ('activity-inbox') {
            <app-activity-inbox />
          }
          @case ('how-it-works') {
            <div class="p-6 space-y-6">
              <div class="prose prose-sm max-w-none">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">How Kapify Works</h3>
                
                <div class="space-y-4">
                  <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div class="flex">
                      <div class="ml-3">
                        <h4 class="text-sm font-medium text-blue-800">Step 1: Complete Your Profile</h4>
                        <p class="mt-1 text-sm text-blue-700">Build a comprehensive business profile that showcases your company's strengths and funding needs.</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-green-50 border-l-4 border-green-400 p-4">
                    <div class="flex">
                      <div class="ml-3">
                        <h4 class="text-sm font-medium text-green-800">Step 2: Get Matched</h4>
                        <p class="mt-1 text-sm text-green-700">Our AI system matches you with relevant funders based on your industry, stage, and funding requirements.</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-purple-50 border-l-4 border-purple-400 p-4">
                    <div class="flex">
                      <div class="ml-3">
                        <h4 class="text-sm font-medium text-purple-800">Step 3: Apply & Track</h4>
                        <p class="mt-1 text-sm text-purple-700">Submit applications through our streamlined process and track progress in real-time.</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-orange-50 border-l-4 border-orange-400 p-4">
                    <div class="flex">
                      <div class="ml-3">
                        <h4 class="text-sm font-medium text-orange-800">Step 4: Secure Funding</h4>
                        <p class="mt-1 text-sm text-orange-700">Connect directly with funders, negotiate terms, and close your funding round.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">Average Timeline</h4>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li>• Profile completion: 2-3 hours</li>
                    <li>• First matches: Within 24 hours</li>
                    <li>• Application responses: 2-4 weeks</li>
                    <li>• Funding completion: 6-12 weeks</li>
                  </ul>
                </div>
              </div>
            </div>
          }
          @case ('funding-types') {
            <div class="p-6 space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Funding Types Available</h3>
              
              <div class="space-y-4">
                @for (fundingType of fundingTypes; track fundingType.id) {
                  <div class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div class="flex items-start space-x-3">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                           [class]="fundingType.iconBg">
                        <span class="text-xs font-bold" [class]="fundingType.iconColor">{{ fundingType.icon }}</span>
                      </div>
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900">{{ fundingType.title }}</h4>
                        <p class="text-sm text-gray-600 mt-1">{{ fundingType.description }}</p>
                        <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Range: {{ fundingType.range }}</span>
                          <span>•</span>
                          <span>Term: {{ fundingType.term }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          @case ('tips') {
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Funding Tips</h3>
              
              <!-- Scrolling Tips Ticker -->
              <div class="mb-6 bg-blue-50 rounded-lg p-3 overflow-hidden">
                <div class="whitespace-nowrap animate-scroll">
                  <span class="text-blue-800 font-medium">💡 Tip: </span>
                  <span class="text-blue-700">Complete financial statements increase approval chances by 45% • Always prepare 3 years of projections • Network before you need funding • </span>
                </div>
              </div>

              <div class="space-y-4">
                @for (tip of fundingTips; track tip.id) {
                  <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">{{ tip.title }}</h4>
                    <p class="text-sm text-gray-600">{{ tip.content }}</p>
                    @if (tip.action) {
                      <button class="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        {{ tip.action }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }
          @case ('security') {
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Security & Compliance</h3>
              
              <div class="space-y-6">
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div class="flex items-center space-x-2 mb-2">
                    <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="font-medium text-green-800">Bank-Level Security</span>
                  </div>
                  <p class="text-sm text-green-700">256-bit SSL encryption protects all data transmission</p>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-center space-x-2 mb-2">
                    <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="font-medium text-blue-800">POPIA Compliant</span>
                  </div>
                  <p class="text-sm text-blue-700">Full compliance with South African privacy regulations</p>
                </div>

                <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div class="flex items-center space-x-2 mb-2">
                    <div class="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="font-medium text-purple-800">ISO 27001</span>
                  </div>
                  <p class="text-sm text-purple-700">International security management standards</p>
                </div>

                <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 class="font-medium text-yellow-800 mb-2">Data Protection Promise</h4>
                  <p class="text-sm text-yellow-700">
                    Your business data is never shared without explicit permission. 
                    We use advanced encryption and access controls to ensure your 
                    sensitive financial information remains confidential.
                  </p>
                </div>
              </div>
            </div>
          }
          @default {
            <div class="p-6 text-center text-gray-500">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">📋</span>
              </div>
              <h3 class="font-medium text-gray-900 mb-2">Welcome to Kapify</h3>
              <p class="text-sm">Click on any card to learn more about our platform and funding process.</p>
            </div>
          }
        }
      </div>
    </div>

    <!-- Custom Styles -->
    <style>
      @keyframes scroll {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      
      .animate-scroll {
        animation: scroll 20s linear infinite;
      }
    </style>
  `
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
      title: 'Recent Activity',
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