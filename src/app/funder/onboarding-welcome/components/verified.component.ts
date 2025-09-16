// src/app/funder/components/verified-state/verified-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Trophy, CheckCircle, Shield, Sparkles, Briefcase, Users, ArrowRight, TrendingUp } from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-verified-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="h-full overflow-y-auto">
      <div class="p-4 lg:p-8 min-h-full flex items-center">
        <div class="w-full max-w-6xl mx-auto">
          
          <!-- Verified Header -->
          <div class="text-center mb-8">
            <div class="relative inline-block mb-6">
              <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <lucide-icon [img]="TrophyIcon" [size]="36" class="text-white" />
              </div>
              <div class="absolute -top-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-white" />
              </div>
            </div>
            
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">🎉 Verification Complete!</h1>
            <p class="text-base lg:text-lg text-slate-600 max-w-3xl mx-auto mb-4">
              Congratulations! Your organization has been verified on {{ verificationDate }}. You now have access to all premium features.
            </p>
            
            <!-- Verified Badge -->
            <div class="inline-flex items-center space-x-2 bg-green-100 border border-green-300 rounded-full px-4 py-2">
              <lucide-icon [img]="ShieldIcon" [size]="16" class="text-green-600" />
              <span class="text-sm font-semibold text-green-800">Verified Organization</span>
            </div>
          </div>

          <!-- Main Dashboard Cards -->
          <div class="grid lg:grid-cols-3 gap-6 mb-8">
            
            <!-- Primary Action Card -->
            <div class="lg:col-span-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white p-6 lg:p-8">
              <h3 class="text-xl lg:text-2xl font-bold mb-3">Ready to Make an Impact</h3>
              <p class="text-blue-100 mb-6 text-base lg:text-lg">
                Your verified status opens doors to premium opportunities. Start creating funding opportunities and connecting with top-tier SMEs.
              </p>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <lucide-icon [img]="BriefcaseIcon" [size]="24" class="text-white mb-2" />
                  <h4 class="font-semibold text-white">Create Opportunities</h4>
                  <p class="text-blue-100 text-sm">Start funding initiatives</p>
                </div>
                
                <div class="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <lucide-icon [img]="UsersIcon" [size]="24" class="text-white mb-2" />
                  <h4 class="font-semibold text-white">Browse SMEs</h4>
                  <p class="text-blue-100 text-sm">Discover partners</p>
                </div>
              </div>
              
              <div class="flex flex-col sm:flex-row gap-3">
                <ui-button 
                  variant="secondary" 
                  size="lg" 
                  class="flex-1"
                  (clicked)="onCreateOpportunity()"
                >
                  <lucide-icon [img]="BriefcaseIcon" [size]="18" class="mr-2" />
                  Create First Opportunity
                </ui-button>
                
                <ui-button 
                  variant="outline" 
                  size="lg" 
                  class="flex-1 border-white/30 text-white hover:bg-white/10"
                  (clicked)="onGoToDashboard()"
                >
                  <lucide-icon [img]="ArrowRightIcon" [size]="18" class="mr-2" />
                  Explore Dashboard
                </ui-button>
              </div>
            </div>

            <!-- Premium Features Card -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div class="text-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <lucide-icon [img]="SparklesIcon" [size]="20" class="text-white" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900">Premium Access</h3>
              </div>
              
              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-600" />
                  </div>
                  <span class="text-sm text-slate-700">Verified trust badge</span>
                </div>
                
                <div class="flex items-center space-x-3">
                  <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-600" />
                  </div>
                  <span class="text-sm text-slate-700">Priority support access</span>
                </div>
                
                <div class="flex items-center space-x-3">
                  <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-600" />
                  </div>
                  <span class="text-sm text-slate-700">Advanced analytics</span>
                </div>
                
                <div class="flex items-center space-x-3">
                  <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-600" />
                  </div>
                  <span class="text-sm text-slate-700">Enhanced visibility</span>
                </div>
                
                <div class="flex items-center space-x-3">
                  <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-600" />
                  </div>
                  <span class="text-sm text-slate-700">Premium matching</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Next Steps Grid -->
          <div class="grid md:grid-cols-3 gap-6">
            
            <!-- Create Opportunity -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer" (click)="onCreateOpportunity()">
              <div class="text-center">
                <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <lucide-icon [img]="BriefcaseIcon" [size]="24" class="text-blue-600" />
                </div>
                <h4 class="text-lg font-semibold text-slate-900 mb-2">Create Opportunity</h4>
                <p class="text-slate-600 text-sm mb-4">Start your first funding opportunity and begin connecting with SMEs.</p>
                <div class="inline-flex items-center text-blue-600 font-medium text-sm">
                  <span>Get started</span>
                  <lucide-icon [img]="ArrowRightIcon" [size]="16" class="ml-1" />
                </div>
              </div>
            </div>

            <!-- Browse SMEs -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer" (click)="onBrowseSMEs()">
              <div class="text-center">
                <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <lucide-icon [img]="UsersIcon" [size]="24" class="text-green-600" />
                </div>
                <h4 class="text-lg font-semibold text-slate-900 mb-2">Browse SMEs</h4>
                <p class="text-slate-600 text-sm mb-4">Discover verified SMEs looking for funding opportunities.</p>
                <div class="inline-flex items-center text-green-600 font-medium text-sm">
                  <span>Explore now</span>
                  <lucide-icon [img]="ArrowRightIcon" [size]="16" class="ml-1" />
                </div>
              </div>
            </div>

            <!-- View Dashboard -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer" (click)="onGoToDashboard()">
              <div class="text-center">
                <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <lucide-icon [img]="TrendingUpIcon" [size]="24" class="text-purple-600" />
                </div>
                <h4 class="text-lg font-semibold text-slate-900 mb-2">Full Dashboard</h4>
                <p class="text-slate-600 text-sm mb-4">Access your complete funding dashboard and analytics.</p>
                <div class="inline-flex items-center text-purple-600 font-medium text-sm">
                  <span>View dashboard</span>
                  <lucide-icon [img]="ArrowRightIcon" [size]="16" class="ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerifiedStateComponent {
  @Input() verificationDate!: string;
  
  @Output() createOpportunity = new EventEmitter<void>();
  @Output() browseSMEs = new EventEmitter<void>();
  @Output() goToDashboard = new EventEmitter<void>();

  // Icons
  TrophyIcon = Trophy;
  CheckCircleIcon = CheckCircle;
  ShieldIcon = Shield;
  SparklesIcon = Sparkles;
  BriefcaseIcon = Briefcase;
  UsersIcon = Users;
  ArrowRightIcon = ArrowRight;
  TrendingUpIcon = TrendingUp;

  onCreateOpportunity() {
    this.createOpportunity.emit();
  }

  onBrowseSMEs() {
    this.browseSMEs.emit();
  }

  onGoToDashboard() {
    this.goToDashboard.emit();
  }
}