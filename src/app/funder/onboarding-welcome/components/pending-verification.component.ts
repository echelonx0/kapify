// src/app/funder/components/pending-verification-state/pending-verification-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, CheckCircle, Trophy, ArrowRight, Briefcase } from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-pending-verification-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="h-full overflow-hidden flex items-center">
      <div class="w-full max-w-4xl mx-auto text-center px-4 lg:px-8">
        
        <div class="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <lucide-icon [img]="ClockIcon" [size]="36" class="text-white" />
        </div>
        
        <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">Verification In Progress</h1>
        <p class="text-base lg:text-lg text-slate-600 mb-6">
          Your verification request was submitted on {{ verificationDate }}. Our team is reviewing your application.
        </p>

        <!-- Timeline - More Compact -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:p-6 mb-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">Verification Timeline</h3>
          
          <div class="space-y-3">
            <div class="flex items-center space-x-4">
              <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-white" />
              </div>
              <div class="flex-1 text-left">
                <h4 class="font-semibold text-slate-900">Application Submitted</h4>
                <p class="text-sm text-slate-600">{{ verificationDate }}</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
              <div class="flex-1 text-left">
                <h4 class="font-semibold text-slate-900">Under Review</h4>
                <p class="text-sm text-slate-600">Typically takes 2-3 business days</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <div class="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                <lucide-icon [img]="TrophyIcon" [size]="16" class="text-slate-600" />
              </div>
              <div class="flex-1 text-left">
                <h4 class="font-semibold text-slate-500">Verification Complete</h4>
                <p class="text-sm text-slate-400">You'll receive an email notification</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Continue Without Waiting - More Compact -->
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 lg:p-6">
          <h3 class="text-lg font-semibold text-blue-900 mb-2">Continue Using the Platform</h3>
          <p class="text-blue-800 mb-4 text-sm lg:text-base">
            You don't need to wait for verification to start using our platform. Begin exploring opportunities now!
          </p>
          
          <div class="grid md:grid-cols-2 gap-3">
            <ui-button 
              variant="primary" 
              size="md" 
              class="w-full"
              (clicked)="onGoToDashboard()"
            >
              <lucide-icon [img]="ArrowRightIcon" [size]="18" class="mr-2" />
              Go to Dashboard
            </ui-button>
            
            <ui-button 
              variant="outline" 
              size="md" 
              class="w-full"
              (clicked)="onCreateOpportunity()"
            >
              <lucide-icon [img]="BriefcaseIcon" [size]="18" class="mr-2" />
              Create Opportunity
            </ui-button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PendingVerificationStateComponent {
  @Input() verificationDate!: string;
  
  @Output() goToDashboard = new EventEmitter<void>();
  @Output() createOpportunity = new EventEmitter<void>();

  // Icons
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  TrophyIcon = Trophy;
  ArrowRightIcon = ArrowRight;
  BriefcaseIcon = Briefcase;

  onGoToDashboard() {
    this.goToDashboard.emit();
  }

  onCreateOpportunity() {
    this.createOpportunity.emit();
  }
}