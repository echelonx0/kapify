

// src/app/shared/components/ui/avatar.component.ts
import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getAvatarClasses()">
      @if (src && !imageError()) {
        <img 
          [src]="src" 
          [alt]="alt"
          (error)="onImageError()"
          class="w-full h-full object-cover"
        />
      } @else {
        <span [class]="getInitialsClasses()">
          {{ initials() }}
        </span>
      }
      
      @if (showOnlineStatus && isOnline !== undefined) {
        <div [class]="getStatusClasses()"></div>
      }
    </div>
  `
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() alt: string = '';
  @Input() name: string = '';
  @Input() size: AvatarSize = 'md';
  @Input() isOnline?: boolean;
  @Input() showOnlineStatus: boolean = false;

  imageError = signal(false);

  initials = computed(() => {
    if (!this.name) return '';
    
    const names = this.name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  });

  onImageError() {
    this.imageError.set(true);
  }

  getAvatarClasses(): string {
    const baseClasses = 'relative inline-flex items-center justify-center rounded-full bg-neutral-100 overflow-hidden';
    
    const sizeClasses = {
      'xs': 'w-6 h-6',
      'sm': 'w-8 h-8', 
      'md': 'w-10 h-10',
      'lg': 'w-12 h-12',
      'xl': 'w-16 h-16'
    };

    return `${baseClasses} ${sizeClasses[this.size]}`;
  }

  getInitialsClasses(): string {
    const sizeClasses = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl'
    };

    return `font-medium text-neutral-600 ${sizeClasses[this.size]}`;
  }

  getStatusClasses(): string {
    const baseSizeClasses = {
      'xs': 'w-1.5 h-1.5',
      'sm': 'w-2 h-2',
      'md': 'w-2.5 h-2.5', 
      'lg': 'w-3 h-3',
      'xl': 'w-4 h-4'
    };

    const positionClasses = {
      'xs': 'bottom-0 right-0',
      'sm': 'bottom-0 right-0',
      'md': 'bottom-0 right-0',
      'lg': 'bottom-0.5 right-0.5',
      'xl': 'bottom-1 right-1'
    };

    const statusColor = this.isOnline ? 'bg-green-400' : 'bg-neutral-400';
    
    return `absolute ${baseSizeClasses[this.size]} ${positionClasses[this.size]} ${statusColor} border-2 border-white rounded-full`;
  }
}
