

// src/app/shared/components/sidebar-nav.component.ts
import { Component, signal } from '@angular/core';
import { 
  LucideAngularModule, 
  Home, 
  User, 
  Eye, 
  FileText, 
  Send, 
  HelpCircle, 
  Settings, 
  Moon 
} from 'lucide-angular';
import { UiTooltipComponent } from './ui-tooltip.component';

interface NavItem {
  id: string;
  icon: any;
  label: string;
  href: string;
}

@Component({
  selector: 'sidebar-nav',
  standalone: true,
  imports: [LucideAngularModule, UiTooltipComponent],
  template: `
    <div class="fixed left-0 top-0 h-full w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4 z-50">
      <!-- Logo -->
      <ui-tooltip text="Kapify">
        <div class="mb-8 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center cursor-pointer">
          <span class="text-white font-bold text-sm">K</span>
        </div>
      </ui-tooltip>

      <!-- Navigation Items -->
      <nav class="flex-1 flex flex-col space-y-2 w-full px-2">
        @for (item of navItems; track item.id) {
          <ui-tooltip [text]="item.label">
            <button
              (click)="setActiveItem(item.id)"
              [class]="getNavItemClasses(item.id)"
            >
              <lucide-icon [img]="item.icon" [size]="20" />
            </button>
          </ui-tooltip>
        }
      </nav>

      <!-- Bottom Actions -->
      <div class="space-y-2">
        <ui-tooltip text="Settings">
          <button class="w-12 h-12 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors">
            <lucide-icon [img]="SettingsIcon" [size]="20" />
          </button>
        </ui-tooltip>
        
        <ui-tooltip text="Dark Mode">
          <button class="w-12 h-12 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors">
            <lucide-icon [img]="MoonIcon" [size]="20" />
          </button>
        </ui-tooltip>
      </div>
    </div>
  `,
})
export class SidebarNavComponent {
  activeItem = signal('dashboard');
  
  SettingsIcon = Settings;
  MoonIcon = Moon;

  navItems: NavItem[] = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '#' },
    { id: 'profile', icon: User, label: 'Profile', href: '#' },
    { id: 'review', icon: Eye, label: 'Review', href: '#' },
    { id: 'documents', icon: FileText, label: 'Documents', href: '#' },
    { id: 'funding', icon: Send, label: 'Funding', href: '#' },
    { id: 'applications', icon: Send, label: 'Applications', href: '#' },
    { id: 'faq', icon: HelpCircle, label: 'FAQs', href: '#' },
  ];

  setActiveItem(id: string) {
    this.activeItem.set(id);
  }

  getNavItemClasses(itemId: string): string {
    const baseClasses = 'w-12 h-12 rounded-lg flex items-center justify-center transition-colors';
    const activeClasses = 'bg-primary-50 text-primary-600';
    const inactiveClasses = 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700';
    
    return `${baseClasses} ${this.activeItem() === itemId ? activeClasses : inactiveClasses}`;
  }
}
