// src/app/SMEs/data-room/components/data-room-sidebar/data-room-sidebar.component.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Target, BarChart3, FileText, Users, TrendingUp, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-angular';
import { DataRoomSection, UserPermissions } from '../../models/data-room.models';

@Component({
  selector: 'app-data-room-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div class="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <lucide-icon [img]="FileTextIcon" [size]="24" class="text-white" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">Data Room</h3>
            <p class="text-sm text-gray-500">
              {{ permissions().canManage ? 'Manage' : 'View' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="p-4">
        @for (section of accessibleSections(); track section.id) {
          <button
            (click)="onSelectSection(section.sectionKey)"
            [class]="getSectionButtonClass(section.sectionKey)"
            [disabled]="!section.isEnabled"
          >
            <lucide-icon 
              [img]="getSectionIcon(section.sectionKey)" 
              [size]="20"
              [class]="getIconClass(section.sectionKey)"
            />
            <span class="font-medium text-left flex-1">{{ section.title }}</span>
            
            <!-- Document Count -->
            @if (getDocumentCount(section.id) > 0) {
              <span class="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                {{ getDocumentCount(section.id) }}
              </span>
            }
            
            <!-- Status Icon -->
            @if (getSectionStatus(section.sectionKey) === 'complete') {
              <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-500" />
            }
            @if (getSectionStatus(section.sectionKey) === 'pending') {
              <lucide-icon [img]="ClockIcon" [size]="16" class="text-orange-500" />
            }
            @if (getSectionStatus(section.sectionKey) === 'missing') {
              <lucide-icon [img]="AlertCircleIcon" [size]="16" class="text-gray-400" />
            }
          </button>
        }
      </nav>

      <!-- Section Info -->
      @if (activeSection()) {
        <div class="p-4 border-t border-gray-200">
          <div class="bg-gray-50 rounded-lg p-3">
            <h4 class="text-sm font-medium text-gray-900 mb-1">
              {{ getActiveSectionTitle() }}
            </h4>
            <p class="text-xs text-gray-600">
              {{ getActiveSectionDescription() }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .section-button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid transparent;
      transition: all 0.2s;
      background: none;
      text-align: left;
      cursor: pointer;
    }

    .section-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .section-button.active {
      background-color: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }

    .section-button:not(.active):not(:disabled) {
      color: #374151;
    }

    .section-button:not(.active):not(:disabled):hover {
      background-color: #f9fafb;
    }
  `]
})
export class DataRoomSidebarComponent {
  @Input({ required: true }) sections!: () => DataRoomSection[];
  @Input({ required: true }) activeSection!: () => string;
  @Input({ required: true }) permissions!: () => UserPermissions;
  @Input() documentCounts = () => new Map<string, number>();
  @Input() sectionStatuses = () => new Map<string, 'complete' | 'pending' | 'missing'>();

  @Output() selectSection = new EventEmitter<string>();

  // Icons
  TargetIcon = Target;
  BarChart3Icon = BarChart3;
  FileTextIcon = FileText;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  ShieldIcon = Shield;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;

  // Computed accessible sections based on permissions
  accessibleSections = computed(() => {
    const allSections = this.sections();
    const accessibleKeys = this.permissions().accessibleSections;
    
    return allSections.filter(section => 
      accessibleKeys.includes(section.sectionKey) && section.isEnabled
    );
  });

  onSelectSection(sectionKey: string): void {
    this.selectSection.emit(sectionKey);
  }

  getSectionButtonClass(sectionKey: string): string {
    const baseClass = 'section-button';
    const isActive = this.activeSection() === sectionKey;
    return `${baseClass} ${isActive ? 'active' : ''}`;
  }

  getIconClass(sectionKey: string): string {
    const isActive = this.activeSection() === sectionKey;
    return isActive ? 'text-primary-600' : 'text-gray-400';
  }

  getSectionIcon(sectionKey: string): any {
    const iconMap: Record<string, any> = {
      'executive': this.TargetIcon,
      'financials': this.BarChart3Icon,
      'documents': this.FileTextIcon,
      'management': this.UsersIcon,
      'market': this.TrendingUpIcon,
      'legal': this.ShieldIcon
    };
    return iconMap[sectionKey] || this.FileTextIcon;
  }

  getDocumentCount(sectionId: string): number {
    return this.documentCounts().get(sectionId) || 0;
  }

  getSectionStatus(sectionKey: string): 'complete' | 'pending' | 'missing' {
    return this.sectionStatuses().get(sectionKey) || 'missing';
  }

  getActiveSectionTitle(): string {
    const section = this.sections().find(s => s.sectionKey === this.activeSection());
    return section?.title || '';
  }

  getActiveSectionDescription(): string {
    const section = this.sections().find(s => s.sectionKey === this.activeSection());
    return section?.description || '';
  }
}