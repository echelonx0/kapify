
// insights-widget.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, TrendingUp, DollarSign, ExternalLink } from 'lucide-angular';

interface InsightItem {
  icon: any;
  iconColor: string;
  title: string;
  description: string;
  readTime: string;
}

@Component({
  selector: 'app-insights-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title text-white flex items-center">
          <lucide-icon [img]="FileTextIcon" [size]="18" class="mr-2" />
          Funding Insights
        </h3>
        <p class="section-description text-emerald-100 mt-1">
          Expert guidance to improve your funding success
        </p>
      </div>
      
      <div class="p-6">
        <div class="space-y-4">
          <article 
            *ngFor="let insight of insights"
            class="group cursor-pointer p-4 rounded-lg hover:bg-neutral-50 transition-all duration-200 border border-transparent hover:border-neutral-200">
            
            <div class="flex items-start space-x-3">
              <div class="icon-container w-10 h-10 mt-0.5" [class]="insight.iconColor">
                <lucide-icon [img]="insight.icon" [size]="16" />
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <h4 class="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors text-sm leading-tight mb-1">
                    {{ insight.title }}
                  </h4>
                  <lucide-icon [img]="ExternalLinkIcon" [size]="14" class="text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0 ml-2 mt-0.5" />
                </div>
                <p class="text-xs text-neutral-600 leading-relaxed mb-2">{{ insight.description }}</p>
                <div class="text-xs text-neutral-500">{{ insight.readTime }}</div>
              </div>
            </div>
          </article>
        </div>
        
        <div class="mt-6 pt-4 border-t border-neutral-100">
          <button class="w-full text-center py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            View All Resources →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }
  `]
})
export class InsightsWidgetComponent {
  FileTextIcon = FileText;
  ExternalLinkIcon = ExternalLink;

  insights: InsightItem[] = [
    {
      icon: FileText,
      iconColor: 'blue',
      title: 'Preparing Your Funding Application',
      description: 'Essential documents and strategies for a winning application',
      readTime: '5 min read'
    },
    {
      icon: TrendingUp,
      iconColor: 'green',
      title: 'Top Grant Programs in 2025',
      description: 'Latest government and private funding opportunities',
      readTime: '3 min read'
    },
    {
      icon: DollarSign,
      iconColor: 'neutral',
      title: 'Equity vs Debt: Making the Right Choice',
      description: 'Strategic comparison for growth-stage businesses',
      readTime: '7 min read'
    }
  ];
}
