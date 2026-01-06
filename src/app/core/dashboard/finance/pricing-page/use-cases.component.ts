import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FileText,
  PieChart,
  Zap,
  BarChart3,
  Lock,
  Share2,
  ArrowRight,
} from 'lucide-angular';

interface Feature {
  id: string;
  icon: any;
  title: string;
  description: string;
}

@Component({
  selector: 'app-use-cases',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-8">
        <!-- Header -->
        <div class="mb-16">
          <p
            class="text-center text-slate-600 max-w-3xl mx-auto text-lg leading-relaxed"
          >
            Kapify makes fundraising easy for funders and organisations raising
            funding. We give you an integrated suite of tools to manage your
            documents, your fund and the application process. Instead of
            managing tools from different places, you use Kapify as the central
            hub for all your documents and applications.
          </p>
        </div>

        <div class="grid lg:grid-cols-3 gap-12">
          <!-- Features Grid (Left: 2 cols) -->
          <div class="lg:col-span-2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              @for (feature of features(); track feature.id) {
              <div>
                <div class="flex items-start gap-4">
                  <div
                    class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 text-teal-600"
                  >
                    <lucide-icon [img]="feature.icon" [size]="20" />
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-slate-900 mb-2">
                      {{ feature.title }}
                    </h3>
                    <p class="text-sm text-slate-600 leading-relaxed">
                      {{ feature.description }}
                    </p>
                  </div>
                </div>
              </div>
              }
            </div>
          </div>

          <!-- CTA Card (Right: 1 col) -->
          <div
            class="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-100 flex flex-col justify-center"
          >
            <div
              class="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center text-white mb-4"
            >
              <lucide-icon [img]="ZapIcon" [size]="24" />
            </div>

            <h3 class="text-xl font-bold text-slate-900 mb-3">
              Centralize Your Fundraising
            </h3>

            <p class="text-sm text-slate-600 mb-6 leading-relaxed">
              Stop juggling multiple platforms. Manage documents, applications,
              and your entire fund lifecycle in one place.
            </p>

            <button
              class="w-full px-4 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Get Started Free
              <lucide-icon [img]="ArrowRightIcon" [size]="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class UseCasesComponent {
  FileTextIcon = FileText;
  PieChartIcon = PieChart;
  ZapIcon = Zap;
  BarChartIcon = BarChart3;
  LockIcon = Lock;
  Share2Icon = Share2;
  ArrowRightIcon = ArrowRight;

  features = signal<Feature[]>([
    {
      id: 'documents',
      icon: this.FileTextIcon,
      title: 'Manage Documents',
      description:
        'Organize and store all your fundraising documents in one secure place.',
    },
    {
      id: 'applications',
      icon: this.BarChartIcon,
      title: 'Track Applications',
      description:
        'Monitor the entire lifecycle of fund applications from submission to decision.',
    },
    {
      id: 'fund-management',
      icon: this.PieChartIcon,
      title: 'Fund Management',
      description:
        'Manage fund details, terms, and investor information centrally.',
    },
    {
      id: 'process',
      icon: this.ZapIcon,
      title: 'Streamline Process',
      description:
        'Automate workflows and reduce manual work in your fundraising operations.',
    },
    {
      id: 'security',
      icon: this.LockIcon,
      title: 'Enterprise Security',
      description:
        'Keep your sensitive fundraising data protected with bank-level encryption.',
    },
    {
      id: 'collaboration',
      icon: this.Share2Icon,
      title: 'Team Collaboration',
      description:
        'Invite team members and work together seamlessly on fund management.',
    },
  ]);
}
