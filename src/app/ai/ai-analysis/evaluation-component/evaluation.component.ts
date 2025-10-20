import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Target, CheckCircle, TrendingUp, AlertTriangle, Loader2 } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-analysis-launcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './evaluation.component.html',
})
export class AnalysisLauncherComponent {
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  @Input() canAnalyze = false;
  @Input() validationIssues: string[] = [];
  @Input() isLoadingProfile = false;
  
  @Output() startAnalysis = new EventEmitter<void>();

  TargetIcon = Target;
  CheckCircleIcon = CheckCircle;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = AlertTriangle;
  Loader2Icon = Loader2;

  getAnalysisTitle(): string {
    const baseTitle = this.analysisMode === 'profile' 
      ? 'Business Profile Analysis' 
      : 'Opportunity Match Analysis';
    
    const perspective = this.analysisPerspective === 'sme' 
      ? 'Application Readiness' 
      : 'Investment Evaluation';
    
    return `${baseTitle} — ${perspective}`;
  }

  getAnalysisDescription(): string {
    if (this.analysisPerspective === 'sme') {
      return this.analysisMode === 'profile'
        ? 'Comprehensive evaluation of your business readiness for funding applications with actionable recommendations.'
        : 'Assessment of competitiveness and clear guidance to maximize funding success.';
    } else {
      return this.analysisMode === 'profile'
        ? 'Investment-focused evaluation of business viability and risk for funding decisions.'
        : 'Due diligence analysis of application quality and investment opportunity.';
    }
  }

  getAnalysisCapabilities() {
    if (this.analysisPerspective === 'sme') {
      return [
        { 
          icon: this.TargetIcon, 
          title: 'Readiness Check', 
          desc: 'Application competitiveness assessment', 
          color: 'blue' 
        },
        { 
          icon: this.CheckCircleIcon, 
          title: 'Eligibility Review', 
          desc: 'Requirements validation and gaps', 
          color: 'green' 
        },
        { 
          icon: this.TrendingUpIcon, 
          title: 'Improvement Plan', 
          desc: 'Actionable steps to strengthen profile', 
          color: 'purple' 
        }
      ];
    } else {
      return [
        { 
          icon: this.TargetIcon, 
          title: 'Risk Assessment', 
          desc: 'Investment risk evaluation', 
          color: 'red' 
        },
        { 
          icon: this.CheckCircleIcon, 
          title: 'Financial Review', 
          desc: 'Financial health and projections', 
          color: 'green' 
        },
        { 
          icon: this.TrendingUpIcon, 
          title: 'Team Analysis', 
          desc: 'Management capability assessment', 
          color: 'purple' 
        }
      ];
    }
  }

  getPrimaryActionText(): string {
    return this.analysisPerspective === 'sme' 
      ? 'Check Application Readiness' 
      : 'Evaluate Investment Opportunity';
  }

  handleStartAnalysis() {
    this.startAnalysis.emit();
  }
}