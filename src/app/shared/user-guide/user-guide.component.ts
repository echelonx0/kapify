// src/app/shared/pages/user-guide.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  LucideAngularModule,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-angular';
import { QUICK_LINKS, USER_GUIDE_CONTENT } from './user-guide.constants';

@Component({
  selector: 'app-user-guide',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './user-guide.component.html',
  styleUrls: ['./user-guide.component.css'],
})
export class UserGuideComponent {
  private location = inject(Location);

  content = USER_GUIDE_CONTENT;
  quickLinks = QUICK_LINKS;

  expandedSection = signal<string | null>('getting-started'); // Start with first section open
  showFloatingMenu = signal(false);

  ChevronDownIcon = ChevronDown;
  ArrowRightIcon = ArrowRight;
  MenuIcon = Menu;
  XIcon = X;
  ArrowLeftIcon = ArrowLeft;

  // Computed progress bar width based on expanded section
  progressWidth = computed(() => {
    const expanded = this.expandedSection();
    if (!expanded) return 0;

    const index = this.content.sections.findIndex((s) => s.id === expanded);
    if (index === -1) return 0;

    return ((index + 1) / this.content.sections.length) * 100;
  });

  goBack(): void {
    this.location.back();
  }

  toggleSection(sectionId: string): void {
    this.expandedSection.set(
      this.expandedSection() === sectionId ? null : sectionId
    );
  }

  scrollToSection(sectionId: string): void {
    this.expandedSection.set(sectionId);
    this.showFloatingMenu.set(false); // Close floating menu after selection
    const element = document.getElementById(sectionId);
    setTimeout(() => {
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  getIcon(iconName?: string) {
    const icons: Record<string, any> = {
      Rocket: 'rocket',
      Target: 'target',
      FileText: 'file-text',
      Eye: 'eye',
      Building: 'building',
      BookOpen: 'book-open',
      Bell: 'bell',
      BarChart3: 'bar-chart-3',
      Clock: 'clock',
      Settings: 'settings',
    };
    return icons[iconName || 'FileText'];
  }
}
