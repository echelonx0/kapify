// src/app/SMEs/data-room/components/data-room-header/data-room-header.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Share2, Download, Sparkles, Lock, ArrowLeft } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DataRoom, UserPermissions } from '../../models/data-room.models';

@Component({
  selector: 'app-data-room-header',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    <div class="bg-white border-b border-gray-200 px-8 py-6">
      <div class="max-w-7xl mx-auto">
        <!-- Back Button (for viewers) -->
        @if (!permissions().canManage) {
          <button
            (click)="onBack()"
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <lucide-icon [img]="ArrowLeftIcon" [size]="20" />
            <span class="text-sm font-medium">Back to Applications</span>
          </button>
        }

        <!-- Main Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-3xl font-bold text-gray-900">
                {{ dataRoom()?.title || 'Investment Data Room' }}
              </h1>
              @if (!permissions().canManage) {
                <div class="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <lucide-icon [img]="LockIcon" [size]="14" />
                  Shared Access
                </div>
              }
            </div>
            
            @if (dataRoom()?.description) {
              <p class="text-gray-600 max-w-3xl">{{ dataRoom()!.description }}</p>
            } @else if (companyName()) {
              <p class="text-gray-600">
                Comprehensive due diligence materials for {{ companyName() }}
              </p>
            }

            <!-- Access Info for Viewers -->
            @if (!permissions().canManage && shareInfo()) {
              <div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span>Access level: <span class="font-medium text-gray-700">{{ getPermissionLabel() }}</span></span>
                @if (shareInfo()!.expiresAt) {
                  <span>Expires: <span class="font-medium text-gray-700">{{ formatDate(shareInfo()!.expiresAt!) }}</span></span>
                }
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            @if (permissions().canManage) {
              <!-- Owner Actions -->
              <ui-button 
                variant="outline"
                (clicked)="onEnhanceWithAI()"
                [loading]="isAIAnalyzing()"
                [disabled]="isAIAnalyzing()"
              >
                <lucide-icon 
                  [img]="SparklesIcon" 
                  [size]="16" 
                  [class]="isAIAnalyzing() ? 'animate-spin mr-2' : 'mr-2'"
                />
                {{ isAIAnalyzing() ? 'Analyzing...' : 'Enhance with AI' }}
              </ui-button>

              <ui-button variant="outline" (clicked)="onExport()">
                <lucide-icon [img]="DownloadIcon" [size]="16" class="mr-2" />
                Export
              </ui-button>

              <ui-button variant="primary" (clicked)="onShare()">
                <lucide-icon [img]="ShareIcon" [size]="16" class="mr-2" />
                Share Data Room
              </ui-button>

              <ui-button variant="ghost" (clicked)="onViewAccessLog()">
                <lucide-icon [img]="LockIcon" [size]="16" class="mr-2" />
                Access Log
              </ui-button>
            } @else {
              <!-- Viewer Actions -->
              @if (permissions().canDownload) {
                <ui-button variant="outline" (clicked)="onExport()">
                  <lucide-icon [img]="DownloadIcon" [size]="16" class="mr-2" />
                  Export
                </ui-button>
              }
            }
          </div>
        </div>

        <!-- Stats Bar (Owner Only) -->
        @if (permissions().canManage && stats()) {
          <div class="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p class="text-sm text-gray-500">Total Views</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats()!.totalViews }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Downloads</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats()!.totalDownloads }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Unique Viewers</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats()!.uniqueViewers }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Active Shares</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats()!.activeShares || 0 }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class DataRoomHeaderComponent {
  @Input({ required: true }) dataRoom!: () => DataRoom | null;
  @Input({ required: true }) permissions!: () => UserPermissions;
  @Input() companyName = () => '';
  @Input() isAIAnalyzing = () => false;
  @Input() stats = () => null as { totalViews: number; totalDownloads: number; uniqueViewers: number; activeShares?: number } | null;
  @Input() shareInfo = () => null as { expiresAt?: Date; permissionLevel?: string } | null;

  @Output() enhanceWithAI = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() viewAccessLog = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  // Icons
  ShareIcon = Share2;
  DownloadIcon = Download;
  SparklesIcon = Sparkles;
  LockIcon = Lock;
  ArrowLeftIcon = ArrowLeft;

  onEnhanceWithAI(): void {
    this.enhanceWithAI.emit();
  }

  onExport(): void {
    this.export.emit();
  }

  onShare(): void {
    this.share.emit();
  }

  onViewAccessLog(): void {
    this.viewAccessLog.emit();
  }

  onBack(): void {
    this.back.emit();
  }

  getPermissionLabel(): string {
    const level = this.shareInfo()?.permissionLevel;
    switch (level) {
      case 'view': return 'View Only';
      case 'download': return 'View & Download';
      case 'full': return 'Full Access';
      default: return 'Limited Access';
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}