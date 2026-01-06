// insights-widget.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, FileCheck, Zap, ArrowRight } from 'lucide-angular';
import { Router } from '@angular/router';

interface StepItem {
  icon: any;
  iconColor: string;
  stepNumber: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-insights-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="section-card mt-6">
      <div class="section-header">
        <h3 class="section-title">
          How to Use Kapify
        </h3>
        <p class="section-description">
          Get funding in 3 simple steps
        </p>
      </div>
      
      <div class="p-6">
        <div class="space-y-5">
          <div 
            *ngFor="let step of steps; let isLast = last"
            class="step-item">
            
            <div class="flex items-start space-x-4">
              <div class="step-icon-container" [class]="step.iconColor">
                <span class="step-number">{{ step.stepNumber }}</span>
              </div>
              
              <div class="flex-1 min-w-0">
                <h4 class="step-title">
                  {{ step.title }}
                </h4>
                <p class="step-description">{{ step.description }}</p>
              </div>
            </div>
            
            <div *ngIf="!isLast" class="step-connector">
              <lucide-icon [img]="ArrowRightIcon" [size]="16" class="step-arrow" />
            </div>
          </div>
        </div>
        
        <div class="cta-section">
          <button class="cta-button" (click)="startRegistration()">
            Start Your Funding Journey →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      overflow: hidden;
    }
    
    .section-header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 1.5rem;
    }
    
    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: white !important;
      margin: 0;
    }
    
    .section-description {
      color: rgba(255, 255, 255, 0.9) !important;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }
    
    .step-item {
      position: relative;
      padding-bottom: 1.25rem;
    }
    
    .step-item:last-child {
      padding-bottom: 0;
    }
    
    .step-icon-container {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .step-icon-container.blue {
      background-color: rgb(59 130 246);
      color: white;
    }
    
    .step-icon-container.green {
      background-color: rgb(34 197 94);
      color: white;
    }
    
    .step-icon-container.orange {
      background-color: rgb(249 115 22);
      color: white;
    }
    
    .step-number {
      font-weight: 700;
    }
    
    .step-title {
      font-weight: 600;
      color: rgb(17 24 39) !important;
      font-size: 0.875rem;
      line-height: 1.25;
      margin: 0 0 0.25rem 0;
    }
    
    .step-description {
      color: rgb(75 85 99) !important;
      font-size: 0.75rem;
      line-height: 1.5;
      margin: 0;
    }
    
    .step-connector {
      position: absolute;
      left: 1.25rem;
      top: 2.5rem;
      transform: translateX(-50%);
      padding: 0.5rem 0;
    }
    
    .step-arrow {
      color: rgb(156 163 175);
      transform: rotate(90deg);
    }
    
    .cta-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgb(229 231 235);
    }
    
    .cta-button {
      width: 100%;
      text-align: center;
      padding: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: rgb(5 150 105) !important;
      background: transparent;
      border: none;
      border-radius: 0.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    
    .cta-button:hover {
      color: rgb(4 120 87) !important;
      background-color: rgb(5 150 105 / 0.05);
    }
  `]
})
export class InsightsWidgetComponent {
  ArrowRightIcon = ArrowRight;

  constructor(private router: Router) {}

  steps: StepItem[] = [
       {
      icon: FileCheck,
      iconColor: 'green',
      stepNumber: 1,
      title: 'Create Pre-Qualified Profile',
      description: 'Build a Kapify profile with Intelligent Pre-Qualification'
    },
    {
      icon: Search,
      iconColor: 'blue',
      stepNumber: 2,
      title: 'Easy Apply to Funding Opportunities',
      description: 'Easily find and apply to opportunities that match your profile'
    },
 
    {
      icon: Zap,
      iconColor: 'orange',
      stepNumber: 3,
      title: 'Receive Quick Decisions',
      description: 'Get fast responses and funding approvals'
    }
  ];

  startRegistration() {
    this.router.navigate(['/register'], { queryParams: { userType: 'sme' } });
  }
}