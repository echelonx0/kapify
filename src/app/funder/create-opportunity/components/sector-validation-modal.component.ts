// src/app/funder/create-opportunity/components/sector-validation-modal.component.ts
import { Component, inject, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, CheckCircle, XCircle, AlertCircle, ShieldCheck } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ModalService } from 'src/app/shared/services/modal.service';

@Component({
  selector: 'app-sector-validation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  animations: [
    trigger('modalBackdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalContent', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
      ])
    ])
  ],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto" [@modalBackdrop]>
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>
      
      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div 
          class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          [@modalContent]
        >
          <!-- Header -->
          <div class="bg-gradient-to-r from-primary-50 to-green-50 px-8 py-6 border-b border-gray-100">
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <lucide-angular [img]="ShieldCheckIcon" [size]="24" class="text-primary-600"></lucide-angular>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Eligible Sectors</h2>
                <p class="text-sm text-gray-600 mt-1">Verify your opportunity aligns with platform requirements</p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="px-8 py-6 overflow-y-auto max-h-[50vh]">
            <!-- Why Section -->
            <div class="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <lucide-angular [img]="AlertCircleIcon" [size]="18" class="text-blue-600 mt-0.5 flex-shrink-0"></lucide-angular>
                <div>
                  <h4 class="text-sm font-semibold text-blue-900 mb-1">Why we check this</h4>
                  <p class="text-xs text-blue-800 leading-relaxed">
                    Our platform supports businesses across core economic sectors. This ensures 
                    meaningful matches between funders and enterprises driving sustainable growth.
                  </p>
                </div>
              </div>
            </div>

            <!-- Sectors Grid -->
            <div class="space-y-2">
              <h3 class="text-sm font-semibold text-gray-900 mb-3">Supported Sectors</h3>
              @for (sector of sectors; track sector) {
                <div class="flex items-start space-x-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <lucide-angular [img]="CheckCircleIcon" [size]="16" class="text-green-500 mt-0.5 flex-shrink-0"></lucide-angular>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ sector.name }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ sector.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <!-- Confirmation Checkbox -->
            <label class="flex items-start space-x-3 mb-6 cursor-pointer group">
              <input 
                type="checkbox" 
                [(ngModel)]="isConfirmed"
                class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 mt-0.5 cursor-pointer"
              />
              <span class="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                I confirm my funding opportunity falls within one or more of the sectors listed above
              </span>
            </label>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between space-x-3">
              <button
                (click)="handleDecline()"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                My Sector Not Listed
              </button>
              
              <button
                (click)="handleConfirm()"
                [disabled]="!isConfirmed()"
                class="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 flex items-center"
              >
                Continue to Create Opportunity
                <lucide-angular [img]="CheckCircleIcon" [size]="16" class="ml-2"></lucide-angular>
              </button>
            </div>

            <!-- Helper Text -->
            @if (!isConfirmed()) {
              <p class="text-xs text-gray-500 mt-3 text-center">
                Please confirm to proceed
              </p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Custom scrollbar */
    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 10px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
  `]
})
export class SectorValidationModalComponent implements OnInit {
  private router = inject(Router);
   modalService = inject(ModalService);
  // Icons
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  AlertCircleIcon = AlertCircle;
  ShieldCheckIcon = ShieldCheck;

  // State
  isConfirmed = signal(false);

  // Sectors data
  sectors = [
    { name: 'Primary Agriculture', description: 'Cultivation of crops and farming of livestock' },
    { name: 'Agro-Processing', description: 'Processing agricultural products into food, beverages, textiles' },
    { name: 'Mining & Quarrying', description: 'Extraction of minerals, metals, and natural resources' },
    { name: 'Manufacturing', description: 'Production of goods from raw materials' },
    { name: 'Construction', description: 'Building infrastructure, homes, roads, bridges' },
    { name: 'Energy & Utilities', description: 'Production and supply of electricity, gas, energy services' },
    { name: 'Water & Waste Management', description: 'Clean water provision, sanitation, waste disposal' },
    { name: 'Wholesale & Retail Trade', description: 'Bulk purchasing for resale or direct consumer sales' },
    { name: 'Transport & Logistics', description: 'Movement of goods and people across modalities' },
    { name: 'Tourism & Hospitality', description: 'Accommodation, food, leisure services for travellers' },
    { name: 'Information & Communication Technology', description: 'Software, telecoms, IT support services' },
    { name: 'Financial Services & Insurance', description: 'Banking, investment, credit, insurance products' },
    { name: 'Real Estate & Property', description: 'Land, housing, and commercial property management' },
    { name: 'Professional & Technical Services', description: 'Consulting, research, legal, expert services' },
    { name: 'Education & Training', description: 'Learning institutions and skills development' },
    { name: 'Healthcare & Social Services', description: 'Medical care, wellness, community support' },
    { name: 'Arts, Culture & Entertainment', description: 'Media, film, music, cultural activities' },
    { name: 'Public Administration & Defence', description: 'Government services, policy, defence' },
    { name: 'Non-Profit & Community Services', description: 'Social, environmental, community-focused organizations' }
  ];

  ngOnInit() {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    // Restore body scroll
    document.body.style.overflow = '';
  }

  handleConfirm() {
    if (!this.isConfirmed()) return;

    // Store validation in localStorage
    localStorage.setItem('sectorValidationCompleted', 'true');
    localStorage.setItem('sectorValidationDate', new Date().toISOString());

    // Close modal - parent will handle this via event or service
    this.close();
  }

  handleDecline() {
    // Redirect back - user's opportunity doesn't fit
    window.location.href = '/funder/dashboard';
  }

  private close() {
    // Use the modal service to close
   
    this.modalService.closeSectorValidation();
  }
}
