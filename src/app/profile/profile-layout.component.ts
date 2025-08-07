
// // // src/app/profile/profile-layout.component.ts
// import { Component, signal } from '@angular/core';
// import { Router, RouterOutlet } from '@angular/router';
// import { LucideAngularModule,  Check } from 'lucide-angular';
// import { UiButtonComponent, UiProgressComponent, UiCardComponent } from '../../shared/components';
// import { ProfileService } from '../profile.service';
 
// @Component({
//   selector: 'app-profile-layout',
//   standalone: true,
//   imports: [RouterOutlet, LucideAngularModule, UiButtonComponent, UiProgressComponent],
//   template: `
//     <div class="min-h-screen bg-neutral-50">
//       <!-- Header -->
//       <div class="bg-white border-b border-neutral-200">
//         <!-- Main Header -->
//         <div class="border-b border-neutral-200 py-4">
//           <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div class="flex items-center space-x-2 text-sm text-neutral-600 mb-2">
//               <span>Home</span>
//               <span>></span>
//               <span>Set up your profile</span>
//             </div>
//             <h1 class="text-2xl font-bold text-neutral-900">Complete Your Investment Readiness Profile</h1>
//             <p class="text-neutral-600 mt-2 max-w-4xl">
//               Welcome to your Investment Readiness Profile. Please provide the latest information about your business structure, 
//               operations, and relevant documents. This profile supports your funding applications and helps us understand your business better.
//             </p>
            
//             <!-- Help Banner -->
//             <div class="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4 max-w-4xl">
//               <div class="flex items-center space-x-2">
//                 <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
//                 <span class="text-sm text-primary-700">
//                   Request assistance with building your profile? 
//                   <button class="underline hover:no-underline font-medium">Click here</button>
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <!-- Step Navigation -->
//         <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div class="flex items-center justify-between space-x-4 overflow-x-auto">
//             @for (step of profileService.steps; track step.id; let i = $index) {
//               <button
//                 (click)="goToStep(step.id)"
//                 [class]="getStepButtonClasses(step, i)"
//                 [disabled]="!canAccessStep(step, i)"
//                 class="flex-shrink-0"
//               >
//                 <div class="flex flex-col items-center space-y-2">
//                   <div [class]="getStepIconClasses(step, i)">
//                     @if (step.completed) {
//                       <lucide-icon [img]="CheckIcon" [size]="16" class="text-white" />
//                     } @else {
//                       <span class="text-xs font-medium">{{ i + 1 }}</span>
//                     }
//                   </div>
//                   <div class="text-xs text-center max-w-20">
//                     <div [class]="getStepTextClasses(step, i)">{{ step.title }}</div>
//                   </div>
//                 </div>
//               </button>
//             }
//           </div>
//         </div>
//       </div>

//       <!-- Main Content -->
//       <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <!-- Current Step Info -->
//         <div class="mb-6">
//           <h2 class="text-xl font-semibold text-neutral-900">{{ getCurrentStepTitle() }}</h2>
//           <p class="text-neutral-600 mt-1">{{ getCurrentStepDescription() }}</p>
//         </div>
        
//         <router-outlet />
//       </main>

//       <!-- Footer Actions -->
//       <div class="bg-white border-t border-neutral-200 sticky bottom-0">
//         <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div class="flex items-center justify-end space-x-4">
//             @if (!isFirstStep()) {
//               <ui-button variant="outline" (clicked)="previousStep()">
//                 Back
//               </ui-button>
//             }
            
//             <ui-button 
//               variant="primary" 
//               (clicked)="saveChanges()"
//               [disabled]="isSaving()"
//             >
//               @if (isSaving()) {
//                 Saving...
//               } @else {
//                 Save Changes
//               }
//             </ui-button>
            
//             @if (isLastStep()) {
//               <ui-button 
//                 variant="primary"
//                 (clicked)="submitProfile()"
//                 [disabled]="!canSubmit() || isSubmitting()"
//               >
//                 @if (isSubmitting()) {
//                   Submitting...
//                 } @else {
//                   Save and Continue →
//                 }
//               </ui-button>
//             } @else {
//               <ui-button 
//                 variant="primary"
//                 (clicked)="saveAndContinue()"
//                 [disabled]="isSaving()"
//               >
//                 Save and Continue →
//               </ui-button>
//             }
//           </div>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class ProfileLayoutComponent {
//   isSaving = signal(false);
//   isSubmitting = signal(false);
  
//   CheckIcon = Check;
  
//   constructor(
//     public profileService: ProfileService,
//     private router: Router
//   ) {}
  
//   getCurrentStepTitle(): string {
//     const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
//     return currentStep?.title || '';
//   }
  
//   getCurrentStepDescription(): string {
//     const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
//     const descriptions: { [key: string]: string } = {
//       'admin': 'Fill in your company\'s key administrative details to help us understand your business structure and operational setup. Ensure all required fields are completed accurately.',
//       'documents': 'Please provide the necessary documents to support your investment readiness profile. Accurate and complete documentation helps expedite the review process.',
//       'business-review': 'Provide comprehensive information about your business operations, market position, and competitive landscape.',
//       'swot': 'Analyze your business strengths, weaknesses, opportunities, and threats to provide investors with strategic insights.',
//       'management': 'Provide detailed information about the governance structures and key personnel managing your organization. This section helps us understand the leadership and oversight in place to ensure effective business operations.',
//       'business-plan': 'Share your strategic business plan, including market analysis, financial projections, and growth strategies.',
//       'financial': 'Provide detailed financial information including historical performance, current financial position, and future projections.'
//     };
//     return descriptions[currentStep?.id || ''] || currentStep?.description || '';
//   }
  
//   goToStep(stepId: string) {
//     this.profileService.setCurrentStep(stepId);
//     this.router.navigate(['/profile', stepId]);
//   }
  
//   previousStep() {
//     this.profileService.previousStep();
//     this.router.navigate(['/profile', this.profileService.currentStepId()]);
//   }
  
//   async saveChanges() {
//     this.isSaving.set(true);
//     // Simulate save
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     this.isSaving.set(false);
//   }
  
//   async saveAndContinue() {
//     this.isSaving.set(true);
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     this.isSaving.set(false);
    
//     this.profileService.nextStep();
//     this.router.navigate(['/profile', this.profileService.currentStepId()]);
//   }
  
//   async submitProfile() {
//     this.isSubmitting.set(true);
//     const result = await this.profileService.submitProfile();
//     this.isSubmitting.set(false);
    
//     if (result.success) {
//       this.router.navigate(['/profile-complete']);
//     }
//   }
  
//   isFirstStep = () => this.profileService.currentStepIndex() === 0;
//   isLastStep = () => this.profileService.currentStepIndex() === this.profileService.steps.length - 1;
  
//   canAccessStep(step: any, index: number): boolean {
//     const currentIndex = this.profileService.currentStepIndex();
//     return index <= currentIndex || step.completed;
//   }
  
//   canSubmit(): boolean {
//     return this.profileService.steps.every(step => step.completed);
//   }
  
//   getStepButtonClasses(step: any, index: number): string {
//     return 'hover:bg-neutral-50 transition-colors rounded-lg p-2';
//   }
  
//   getStepIconClasses(step: any, index: number): string {
//     const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2';
//     const currentIndex = this.profileService.currentStepIndex();
    
//     if (step.completed) {
//       return `${baseClasses} bg-primary-500 border-primary-500 text-white`;
//     } else if (index === currentIndex) {
//       return `${baseClasses} bg-white border-primary-500 text-primary-600`;
//     } else {
//       return `${baseClasses} bg-neutral-200 border-neutral-300 text-neutral-600`;
//     }
//   }
  
//   getStepTextClasses(step: any, index: number): string {
//     const currentIndex = this.profileService.currentStepIndex();
//     if (index === currentIndex) {
//       return 'font-medium text-primary-600 border-b-2 border-primary-500 pb-1';
//     }
//     return 'text-neutral-600';
//   }
// }

// src/app/profile/profile-layout.component.ts - SIMPLE LAYOUT
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <router-outlet />
    </div>
  `
})
export class ProfileLayoutComponent {}