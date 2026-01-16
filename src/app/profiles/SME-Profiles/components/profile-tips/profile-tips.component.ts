import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  FileText,
  BarChart3,
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Settings,
} from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

interface ProfileTip {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: 'teal' | 'green' | 'blue' | 'amber';
}

@Component({
  selector: 'app-profile-tips-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './profile-tips.component.html',
  styleUrls: ['./profile-tips.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('slideInFromLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate(
          '300ms cubic-bezier(0.34,1.56,0.64,1)',
          style({ transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms cubic-bezier(0.34,1.56,0.64,1)',
          style({ transform: 'translateX(-100%)' })
        ),
      ]),
    ]),
  ],
})
export class ProfileTipsModalComponent {
  @Output() close = new EventEmitter<void>();

  CloseIcon = X;

  tips: ProfileTip[] = [
    {
      id: 'description',
      title: 'Business Description',
      description:
        'Explain what your business does, who your customers are, and the problem you solve.',
      icon: FileText,
      color: 'teal',
    },
    {
      id: 'stage',
      title: 'Business Stage',
      description:
        'Select the stage that best reflects your current operations.',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      id: 'compliance',
      title: 'Compliance Documents',
      description:
        'Upload current compliance documents to build funder confidence.',
      icon: CheckCircle2,
      color: 'green',
    },
    {
      id: 'management',
      title: 'Management & Ownership',
      description:
        'Clearly state who owns and manages the business and their roles.',
      icon: Users,
      color: 'teal',
    },
    {
      id: 'financial',
      title: 'Financial Records',
      description:
        'Upload your most recent financial information. Ensure they are accurate and properly presented.',
      icon: BarChart3,
      color: 'amber',
    },
    {
      id: 'projections',
      title: 'Financial Projections',
      description:
        'Upload realistic financial projections and explain the key assumptions used.',
      icon: TrendingUp,
      color: 'green',
    },
    {
      id: 'funding',
      title: 'Funding Request',
      description:
        'Enter the exact amount of funding you require. State purpose and use of funds.',
      icon: DollarSign,
      color: 'teal',
    },
    {
      id: 'updates',
      title: 'Profile Updates',
      description:
        'Keep your profile updated to improve matching with funding opportunities.',
      icon: RefreshCw,
      color: 'blue',
    },
  ];

  getIconBgClass(color: string): string {
    const bgMap: Record<string, string> = {
      teal: 'bg-teal-100 border-teal-600 text-teal-700',
      green: 'bg-green-100 border-green-600 text-green-700',
      blue: 'bg-blue-100 border-blue-600 text-blue-700',
      amber: 'bg-amber-100 border-amber-600 text-amber-700',
    };
    return bgMap[color] || bgMap['teal'];
  }

  getTitleClass(color: string): string {
    const titleMap: Record<string, string> = {
      teal: 'text-teal-900',
      green: 'text-green-900',
      blue: 'text-blue-900',
      amber: 'text-amber-900',
    };
    return titleMap[color] || titleMap['teal'];
  }

  onClose() {
    this.close.emit();
  }
}
