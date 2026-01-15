import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  Check,
  AlertCircle,
  Info,
} from 'lucide-angular';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Represents one scoring factor in the matching engine
 */
interface ScoringFactor {
  key: string;
  label: string;
  weight: number; // % weight
  matched: boolean;
  contribution: number; // % contribution to final score
  explanation: string;
}

@Component({
  selector: 'app-scoring-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './scoring-breakdown.component.html',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate(
          '300ms cubic-bezier(0.4,0,0.2,1)',
          style({ transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms cubic-bezier(0.4,0,0.2,1)',
          style({ transform: 'translateX(100%)' })
        ),
      ]),
    ]),
  ],
})
export class ScoringBreakdownComponent implements OnInit {
  @Input() matchScore = 0;
  @Input() opportunity!: FundingOpportunity;

  /**
   * Expected to come directly from the matching engine
   * Example:
   * [
   *   { key: 'industry', matched: true, weight: 30, contribution: 30 }
   * ]
   */
  @Input() engineBreakdown: Array<{
    key: string;
    matched: boolean;
    weight: number;
    contribution: number;
  }> = [];

  @Output() close = new EventEmitter<void>();

  CloseIcon = X;
  CheckIcon = Check;
  AlertIcon = AlertCircle;
  InfoIcon = Info;

  factors = signal<ScoringFactor[]>([]);

  ngOnInit() {
    this.buildFactors();
  }

  private buildFactors() {
    const labelMap: Record<string, string> = {
      industry: 'Industry Match',
      funding: 'Funding Amount',
      stage: 'Business Stage',
      location: 'Location Eligibility',
    };

    const explanationMap: Record<string, string> = {
      industry: 'Your industry was compared to the funder’s target sectors.',
      funding: 'Your funding needs were checked against the allowed range.',
      stage: 'Your business stage was evaluated for eligibility.',
      location: 'Your location was checked against regional availability.',
    };

    this.factors.set(
      this.engineBreakdown.map((f) => ({
        key: f.key,
        label: labelMap[f.key] ?? f.key,
        weight: f.weight,
        matched: f.matched,
        contribution: f.contribution,
        explanation: explanationMap[f.key] ?? 'Evaluation performed.',
      }))
    );
  }

  matchGrade(): string {
    if (this.matchScore >= 85) return 'Excellent';
    if (this.matchScore >= 70) return 'Strong';
    if (this.matchScore >= 40) return 'Moderate';
    return 'Low';
  }

  scoreColor(): string {
    if (this.matchScore >= 85) return 'text-green-600';
    if (this.matchScore >= 70) return 'text-teal-600';
    if (this.matchScore >= 40) return 'text-amber-600';
    return 'text-red-600';
  }

  progressGradient(): string {
    if (this.matchScore >= 85)
      return 'bg-gradient-to-r from-green-400 to-green-500';
    if (this.matchScore >= 70)
      return 'bg-gradient-to-r from-teal-400 to-teal-500';
    if (this.matchScore >= 40)
      return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  }

  onClose() {
    this.close.emit();
  }
}
