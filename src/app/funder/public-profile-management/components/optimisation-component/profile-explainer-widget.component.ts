import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Globe,
  Users,
  TrendingUp,
  Zap,
  ChevronDown,
} from 'lucide-angular';

interface Benefit {
  icon: any;
  title: string;
  description: string;
}

@Component({
  selector: 'app-profile-explainer-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: 'profile-explainer-widget.component.html',
  styleUrls: ['profile-explainer-widget.component.css'],
})
export class ProfileExplainerWidgetComponent {
  // Icons
  GlobeIcon = Globe;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  ZapIcon = Zap;
  ChevronDownIcon = ChevronDown;

  // State
  isExpanded = signal(false);

  // Benefits
  benefits: Benefit[] = [
    {
      icon: Globe,
      title: 'Get Discovered',
      description:
        'Your profile appears in Kapify search results, reaching qualified SMEs who are looking for funding.',
    },
    {
      icon: Users,
      title: 'Attract Quality Applications',
      description:
        'A complete profile attracts 3x more applications from SMEs that align with your investment criteria.',
    },
    {
      icon: TrendingUp,
      title: 'Build Credibility Fast',
      description:
        'Showcase your track record, team, and investment approach before SMEs even apply.',
    },
    {
      icon: Zap,
      title: 'Start in Minutes',
      description:
        'Most funders complete their profile in under 15 minutes. No complex setup required.',
    },
  ];

  // Quick checklist for what makes a complete profile
  completionSteps = [
    'Mission/Vision statement',
    'Investment range (min, max, typical)',
    'Focus areas or industries',
    'Team overview or key contacts',
    'Your investment approach',
  ];

  /**
   * Toggle expanded state
   * When collapsing: scroll to top smoothly
   * When expanding: just expand (no scroll)
   */
  toggleExpanded() {
    if (this.isExpanded()) {
      // Collapse and scroll to top
      this.isExpanded.set(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Just expand
      this.isExpanded.set(true);
    }
  }

  /**
   * Legacy method for scrolling to specific sections
   * (Can be removed if not used elsewhere)
   */
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.isExpanded.set(false);
    }
  }
}
