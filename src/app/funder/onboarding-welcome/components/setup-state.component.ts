// src/app/funder/components/setup-state/setup-state.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building2, ArrowRight, Upload, Clock, Shield, Sparkles, FileText } from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-setup-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
 <div class="h-full flex flex-col">
  <div class="flex-1 flex items-center justify-center p-4 lg:p-8">
    <div class="w-full max-w-6xl mx-auto">
          
          <!-- Welcome Header -->
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <lucide-icon [img]="Building2Icon" [size]="36" class="text-white" />
            </div>
            
            <h1 class="text-2xl lg:text-4xl font-bold text-slate-900 mb-4">Welcome to the Platform</h1>
            <p class="text-base lg:text-lg text-slate-600 max-w-3xl mx-auto mb-6">
              Set up your organization profile to start connecting with verified SMEs and creating funding opportunities.
            </p>
            
            <!-- Setup Benefits -->
            <div class="flex flex-wrap justify-center items-center gap-4 lg:gap-6 mb-8">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <lucide-icon [img]="ClockIcon" [size]="16" class="text-blue-600" />
                </div>
                <span class="text-sm font-medium text-slate-700">15 minutes setup</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <lucide-icon [img]="ShieldIcon" [size]="16" class="text-green-600" />
                </div>
                <span class="text-sm font-medium text-slate-700">Bank-grade security</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <lucide-icon [img]="SparklesIcon" [size]="16" class="text-purple-600" />
                </div>
                <span class="text-sm font-medium text-slate-700">Instant verification</span>
              </div>
            </div>
          </div>

          <!-- Setup Cards -->
          <div class="grid lg:grid-cols-2 gap-6 mb-8">
            
            <!-- Primary Setup Card -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 p-6 lg:p-8">
              <div class="text-center">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <lucide-icon [img]="ArrowRightIcon" [size]="24" class="text-white" />
                </div>
                
                <h3 class="text-xl font-semibold text-slate-900 mb-3">Create Organization Profile</h3>
                <p class="text-slate-600 mb-6 leading-relaxed">
                  Complete the guided setup to create your funding organization profile and start connecting with SMEs.
                </p>
                
                <ui-button 
                  variant="primary" 
                  size="lg" 
                  class="w-full"
                  (clicked)="onStartSetup()"
                >
                  <lucide-icon [img]="Building2Icon" [size]="18" class="mr-2" />
                  Start Setup Process
                </ui-button>
              </div>
            </div>

            <!-- Import/Continue Card -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 lg:p-8">
              <div class="text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <lucide-icon [img]="UploadIcon" [size]="24" class="text-slate-600" />
                </div>
                
                <h3 class="text-xl font-semibold text-slate-900 mb-3">Import Existing Data</h3>
                <p class="text-slate-600 mb-6 leading-relaxed">
                  Have organization documents ready? Upload them to speed up the setup process.
                </p>
                
                <ui-button 
                  variant="outline" 
                  size="lg" 
                  class="w-full"
                  (clicked)="onLoadExisting()"
                >
                  <lucide-icon [img]="UploadIcon" [size]="18" class="mr-2" />
                  Import Documents
                </ui-button>
              </div>
            </div>
          </div>

          <!-- Process Overview -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
            <h3 class="text-xl font-semibold text-slate-900 mb-6 text-center">Setup Process</h3>
            <div class="grid md:grid-cols-3 gap-6">
              
              <div class="text-center relative">
                <div class="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 relative">
                  <lucide-icon [img]="Building2Icon" [size]="24" class="text-blue-600" />
                  <div class="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-xs font-bold text-white">1</span>
                  </div>
                </div>
                <h4 class="text-lg font-semibold text-slate-900 mb-2">Basic Information</h4>
                <p class="text-sm text-slate-600 mb-3">Organization details and contact information</p>
                <div class="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">5 minutes</div>
                
                <!-- Connection Line -->
                <div class="hidden md:block absolute top-8 left-full w-full h-0.5 bg-slate-200 transform -translate-y-1/2"></div>
              </div>

              <div class="text-center relative">
                <div class="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 relative">
                  <lucide-icon [img]="FileTextIcon" [size]="24" class="text-green-600" />
                  <div class="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <span class="text-xs font-bold text-white">2</span>
                  </div>
                </div>
                <h4 class="text-lg font-semibold text-slate-900 mb-2">Legal & Compliance</h4>
                <p class="text-sm text-slate-600 mb-3">Registration details and compliance information</p>
                <div class="inline-block bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">7 minutes</div>
                
                <!-- Connection Line -->
                <div class="hidden md:block absolute top-8 left-full w-full h-0.5 bg-slate-200 transform -translate-y-1/2"></div>
              </div>

              <div class="text-center">
                <div class="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4 relative">
                  <lucide-icon [img]="ShieldIcon" [size]="24" class="text-purple-600" />
                  <div class="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-xs font-bold text-white">3</span>
                  </div>
                </div>
                <h4 class="text-lg font-semibold text-slate-900 mb-2">Verification</h4>
                <p class="text-sm text-slate-600 mb-3">Optional verification for enhanced credibility</p>
                <div class="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">3 minutes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SetupStateComponent {
  @Output() startSetup = new EventEmitter<void>();
  @Output() loadExisting = new EventEmitter<void>();

  // Icons
  Building2Icon = Building2;
  ArrowRightIcon = ArrowRight;
  UploadIcon = Upload;
  ClockIcon = Clock;
  ShieldIcon = Shield;
  SparklesIcon = Sparkles;
  FileTextIcon = FileText;

  onStartSetup() {
    this.startSetup.emit();
  }

  onLoadExisting() {
    this.loadExisting.emit();
  }
}