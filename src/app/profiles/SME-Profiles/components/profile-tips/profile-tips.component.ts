import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';

interface ProfileTip {
  id: string;
  title: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-profile-tips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden"
    >
      <!-- Header - Sticky -->
      <div
        class="sticky top-0 z-10 bg-white px-4 py-3 border-b border-slate-200"
        [@fadeIn]
      >
        <h3 class="text-sm font-semibold text-slate-900">
          Tips to improve your profile
        </h3>
      </div>

      <!-- Content - Scrollable -->
      <div
        class="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
      >
        <div class="space-y-2">
          @for (tip of tips; track tip.id) {
          <div
            class="border-2 border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors duration-200 cursor-pointer"
            (click)="toggleTip(tip.id)"
            [@fadeInUp]
          >
            <!-- Title - Always Visible -->
            <div class="flex items-center justify-between p-3">
              <h3
                class="text-xs font-bold uppercase tracking-wide text-slate-700"
              >
                {{ tip.title }}
              </h3>
              <svg
                class="w-4 h-4 text-slate-500 transition-transform duration-300 flex-shrink-0"
                [class.rotate-180]="expandedTipId === tip.id"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            <!-- Description - Expandable -->
            <div
              [@expandCollapse]="
                expandedTipId === tip.id ? 'expanded' : 'collapsed'
              "
              class="overflow-hidden"
            >
              <p class="text-xs text-slate-600 leading-relaxed px-3 pb-3">
                {{ tip.description }}
              </p>
            </div>
          </div>
          }
        </div>

        <!-- Footer Info Box -->
        <div
          class="mt-4 p-3 bg-slate-50 border-2 border-slate-300 rounded-lg"
          [@fadeIn]
        >
          <p class="text-xs font-bold text-slate-900 uppercase tracking-wide">
            💡 Pro Tip
          </p>
          <p class="text-xs text-slate-700 leading-relaxed mt-1.5">
            Complete all sections to improve your matching with funders. The
            more complete your profile, the better opportunities you'll unlock.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      /* Custom scrollbar styles */
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }

      .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb {
        background-color: rgb(203 213 225);
        border-radius: 3px;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background-color: rgb(148 163 184);
      }
    `,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({
          height: '0px',
          opacity: 0,
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          opacity: 1,
        })
      ),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ]),
    ]),
  ],
})
export class ProfileTipsComponent {
  expandedTipId: string | null = null;

  tips: ProfileTip[] = [
    {
      id: 'description',
      title: 'Business Description',
      description:
        'Explain what your business does, who your customers are, and the problem you solve.',
      color: 'teal',
    },
    {
      id: 'stage',
      title: 'Business Stage',
      description:
        'Select the stage that best reflects your current operations.',
      color: 'blue',
    },
    {
      id: 'compliance',
      title: 'Compliance Documents',
      description:
        'Upload current compliance documents to build funder confidence.',
      color: 'green',
    },
    {
      id: 'management',
      title: 'Management & Ownership',
      description:
        'Clearly state who owns and manages the business and their roles.',
      color: 'teal',
    },
    {
      id: 'financial',
      title: 'Financial Records',
      description:
        'Upload your most recent financial information. Ensure they are accurate and properly presented.',
      color: 'amber',
    },
    {
      id: 'projections',
      title: 'Financial Projections',
      description:
        'Upload realistic financial projections and explain the key assumptions used.',
      color: 'green',
    },
    {
      id: 'funding',
      title: 'Funding Request',
      description:
        'Enter the exact amount of funding you require. State purpose and use of funds.',
      color: 'teal',
    },
    {
      id: 'updates',
      title: 'Profile Updates',
      description:
        'Keep your profile updated to improve matching with funding opportunities.',
      color: 'blue',
    },
  ];

  toggleTip(tipId: string): void {
    this.expandedTipId = this.expandedTipId === tipId ? null : tipId;
  }
}
