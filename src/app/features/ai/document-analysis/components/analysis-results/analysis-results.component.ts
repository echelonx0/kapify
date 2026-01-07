// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   Download,
//   Eye,
//   Globe,
//   TrendingUp,
//   CheckCircle,
//   Clock,
//   Building,
// } from 'lucide-angular';
// import { UiButtonComponent } from 'src/app/shared/components';
// import { DocumentAnalysisResult } from '../../../services/funder-document-analysis.service';

// @Component({
//   selector: 'app-analysis-results',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule, UiButtonComponent],
//   templateUrl: './analysis-results.component.html',
// })
// export class AnalysisResultsComponent {
//   @Input({ required: true }) result!: DocumentAnalysisResult;
//   @Input({ required: true }) uploadedFileName!: string;

//   // Icons
//   DownloadIcon = Download;
//   EyeIcon = Eye;
//   GlobeIcon = Globe;
//   TrendingUpIcon = TrendingUp;
//   CheckCircleIcon = CheckCircle;
//   ClockIcon = Clock;
//   BuildingIcon = Building;

//   /* ===== UI HELPERS (copied verbatim) ===== */

//   getTimingClasses(timing: string): string {
//     switch (timing) {
//       case 'favorable':
//         return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 text-green-600';
//       case 'neutral':
//         return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100 text-gray-600';
//       case 'challenging':
//         return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100 text-red-600';
//       default:
//         return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100 text-gray-600';
//     }
//   }

//   getPositionClasses(position: string): string {
//     switch (position) {
//       case 'strong':
//         return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 text-green-600';
//       case 'moderate':
//         return 'bg-gradient-to-br from-stone-50 to-slate-50 border-stone-100 text-stone-600';
//       case 'weak':
//         return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 text-orange-600';
//       default:
//         return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100 text-gray-600';
//     }
//   }

//   getRiskSeverityBadge(severity: string): string {
//     const base = 'px-2 py-1 rounded text-xs font-medium';
//     switch (severity) {
//       case 'high':
//         return `${base} bg-red-100 text-red-800`;
//       case 'medium':
//         return `${base} bg-orange-100 text-orange-800`;
//       case 'low':
//         return `${base} bg-yellow-100 text-yellow-800`;
//       default:
//         return `${base} bg-gray-100 text-gray-800`;
//     }
//   }

//   getTimeAgo(dateString: string): string {
//     const date = new Date(dateString);
//     const diff = Date.now() - date.getTime();
//     const mins = Math.floor(diff / 60000);

//     if (mins < 1) return 'just now';
//     if (mins < 60) return `${mins} minutes ago`;

//     const hrs = Math.floor(mins / 60);
//     if (hrs < 24) return `${hrs} hours ago`;

//     return `${Math.floor(hrs / 24)} days ago`;
//   }
// }

import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Download,
  Eye,
  Globe,
  TrendingUp,
  CheckCircle,
  Clock,
  Building,
  ChevronDown,
  X,
  ExternalLink,
  Lightbulb,
} from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DocumentAnalysisResult } from '../../../services/funder-document-analysis.service';

@Component({
  selector: 'app-analysis-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './analysis-results.component.html',
  styleUrls: ['./analysis-results.component.css'],
})
export class AnalysisResultsComponent {
  @Input({ required: true }) result!: DocumentAnalysisResult;
  @Input({ required: true }) uploadedFileName!: string;

  // State
  showMethodologyModal = signal(false);
  expandedAccordion = signal<string | null>(null);

  // Icons
  DownloadIcon = Download;
  EyeIcon = Eye;
  GlobeIcon = Globe;
  TrendingUpIcon = TrendingUp;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  BuildingIcon = Building;
  ChevronDownIcon = ChevronDown;
  XIcon = X;
  ExternalLinkIcon = ExternalLink;
  LightbulbIcon = Lightbulb;

  toggleAccordion(section: string): void {
    this.expandedAccordion.set(
      this.expandedAccordion() === section ? null : section
    );
  }

  openLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  /* ===== UI HELPERS ===== */

  getTimingClasses(timing: string): string {
    switch (timing) {
      case 'favorable':
        return 'bg-green-50 border-green-200/50 text-green-600';
      case 'neutral':
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
      case 'challenging':
        return 'bg-red-50 border-red-200/50 text-red-600';
      default:
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
    }
  }

  getPositionClasses(position: string): string {
    switch (position) {
      case 'strong':
        return 'bg-green-50 border-green-200/50 text-green-600';
      case 'moderate':
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
      case 'weak':
        return 'bg-orange-50 border-orange-200/50 text-orange-600';
      default:
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
    }
  }

  getRiskSeverityBadge(severity: string): string {
    const base = 'px-2 py-1 rounded text-xs font-medium';
    switch (severity) {
      case 'high':
        return `${base} bg-red-100 text-red-800`;
      case 'medium':
        return `${base} bg-amber-100 text-amber-800`;
      case 'low':
        return `${base} bg-yellow-100 text-yellow-800`;
      default:
        return `${base} bg-slate-100 text-slate-800`;
    }
  }

  getSourceTypeColor(type: string): string {
    const base = 'px-2.5 py-1 rounded-lg text-xs font-medium';
    switch (type?.toLowerCase()) {
      case 'research':
        return `${base} bg-blue-50 text-blue-700 border border-blue-200/50`;
      case 'news':
        return `${base} bg-amber-50 text-amber-700 border border-amber-200/50`;
      case 'analyst':
        return `${base} bg-purple-50 text-purple-700 border border-purple-200/50`;
      case 'company':
        return `${base} bg-teal-50 text-teal-700 border border-teal-300/50`;
      default:
        return `${base} bg-slate-50 text-slate-700 border border-slate-200/50`;
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minutes ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;

    return `${Math.floor(hrs / 24)} days ago`;
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  }
}
