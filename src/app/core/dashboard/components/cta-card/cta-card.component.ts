import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Zap,
  Lightbulb,
  ArrowRight,
} from 'lucide-angular';

export interface CTAContent {
  title: string;
  description: string;
  buttonText: string;
  icon: any;
  gradient: 'teal' | 'amber' | 'blue' | 'green' | 'slate';
}

@Component({
  selector: 'app-primary-cta-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cta-card.component.html',
  styleUrls: ['./cta-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryCTACardComponent implements OnInit {
  @Input() content?: CTAContent;
  @Output() ctaClick = new EventEmitter<void>();

  // Icons
  ArrowRightIcon = ArrowRight;
  ZapIcon = Zap;
  LightbulbIcon = Lightbulb;

  // State
  isAnimating = signal(false);
  particlesVisible = signal(true);

  // Default content if none provided
  private defaultContent: CTAContent = {
    title: 'Take the Next Step',
    description:
      'Unlock new opportunities and accelerate your growth with our platform features.',
    buttonText: 'Get Started',
    icon: Zap,
    gradient: 'teal',
  };

  // Computed content with fallback
  ctaContent = computed(() => this.content || this.defaultContent);

  // Computed gradient class
  gradientClass = computed(() => {
    const gradient = this.ctaContent().gradient;
    const gradientMap = {
      teal: 'from-teal-500 to-teal-600',
      amber: 'from-amber-500 to-amber-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      slate: 'from-slate-500 to slate-600',
    };
    return gradientMap[gradient] || gradientMap.teal;
  });

  ngOnInit(): void {
    // Trigger entrance animation
    setTimeout(() => {
      this.isAnimating.set(true);
    }, 100);
  }

  handleClick(): void {
    this.ctaClick.emit();
  }

  // Generate random particles for background decoration
  getParticleStyle(index: number): any {
    const positions = [
      { top: '10%', left: '15%', size: '120px', delay: '0s' },
      { top: '60%', left: '80%', size: '180px', delay: '1s' },
      { top: '30%', right: '20%', size: '150px', delay: '2s' },
      { top: '80%', left: '40%', size: '100px', delay: '1.5s' },
    ];
    return positions[index % 4];
  }
}
