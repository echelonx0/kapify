// category-filters.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building, DollarSign, FileText, TrendingUp, RefreshCw, Zap } from 'lucide-angular';

interface CategoryButton {
  type: string;
  label: string;
  icon: any;
  gradient: string;
  description: string;
}

@Component({
  selector: 'app-category-filters',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-neutral-900 mb-2">Browse by Category</h2>
        <p class="text-neutral-600">Discover funding opportunities tailored to your business needs</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <!-- All Categories Button -->
        <button 
          (click)="selectCategory('')"
          [class]="getCategoryClasses('')"
          class="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
          <div class="relative z-10 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl mb-3 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
              <lucide-icon [img]="ZapIcon" [size]="20" class="text-neutral-700" />
            </div>
            <div class="font-semibold text-white text-sm mb-1">All Types</div>
            <div class="text-xs text-white/80">View everything</div>
          </div>
        </button>

        <!-- Category Buttons -->
        <button 
          *ngFor="let category of categories"
          (click)="selectCategory(category.type)"
          [class]="getCategoryClasses(category.type)"
          class="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
          
          <!-- Background Gradient -->
          <div class="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
               [class]="category.gradient"></div>
          
          <!-- Content -->
          <div class="relative z-10 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
              <lucide-icon [img]="category.icon" [size]="20" class="text-white" />
            </div>
            <div class="font-semibold text-white text-sm mb-1">{{ category.label }}</div>
            <div class="text-xs text-white/80">{{ category.description }}</div>
          </div>
          
          <!-- Selection Indicator -->
          <div *ngIf="selectedType === category.type" 
               class="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .category-selected {
      box-shadow: 0 8px 25px -5px rgba(34, 197, 94, 0.4), 0 8px 10px -6px rgba(34, 197, 94, 0.1);
      transform: translateY(-2px) scale(1.02);
    }
    
    .category-default {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
  `]
})
export class CategoryFiltersComponent {
  @Input() selectedType: string = '';
  @Output() typeSelected = new EventEmitter<string>();

  ZapIcon = Zap;

  categories: CategoryButton[] = [
    {
      type: 'equity',
      label: 'Equity',
      icon: Building,
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
      description: 'Ownership stake'
    },
    {
      type: 'debt',
      label: 'Debt',
      icon: DollarSign,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
      description: 'Loans & credit'
    },
    {
      type: 'grant',
      label: 'Grants',
      icon: FileText,
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      description: 'Non-repayable'
    },
    {
      type: 'mezzanine',
      label: 'Mezzanine',
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      description: 'Hybrid funding'
    },
    {
      type: 'convertible',
      label: 'Convertible',
      icon: RefreshCw,
      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      description: 'Future equity'
    }
  ];

  selectCategory(type: string) {
    this.typeSelected.emit(type);
  }

  getCategoryClasses(type: string): string {
    const baseClasses = 'shadow-lg hover:shadow-xl';
    
    if (type === '') {
      // All categories button
      const isSelected = this.selectedType === '';
      const gradientClass = 'bg-gradient-to-br from-neutral-600 to-neutral-700';
      const selectionClass = isSelected ? 'category-selected' : 'category-default';
      return `${baseClasses} ${gradientClass} ${selectionClass}`;
    }
    
    const isSelected = this.selectedType === type;
    const selectionClass = isSelected ? 'category-selected' : 'category-default';
    return `${baseClasses} ${selectionClass}`;
  }
}