

// src/app/shared/components/index.ts
 
 
export { UiButtonComponent } from './ui-button.component';
export { UiCardComponent } from './ui-card.component';
export { UiProgressComponent } from './ui-progress.component';
export { UiInputComponent } from './ui-input.component';
export { UiStatusBadgeComponent } from './ui-status-badge.component';
export { UiTooltipComponent } from './ui-tooltip.component';
export { UiProgressStepComponent } from './ui-progress-step.component';
export { SidebarNavComponent } from './sidebar-nav.component';
export { DashboardHeaderComponent } from './dashboard-header.component';


// // Usage example in a component:
// // src/app/dashboard/dashboard.component.ts
// import { Component } from '@angular/core';
// import { 
//   UiCardComponent, 
//   UiButtonComponent, 
//   UiProgressComponent,
//   UiStatusBadgeComponent 
// } from '../shared/components';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [UiCardComponent, UiButtonComponent, UiProgressComponent, UiStatusBadgeComponent],
//   template: `
//     <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <h1 class="text-2xl font-bold text-neutral-900 mb-8">Welcome Senkosi</h1>
      
//       <ui-card title="Let's get you going" subtitle="Fill out your profile and make an application" [padding]="false">
//         <div class="p-6">
//           <ui-progress [value]="66" label="Step 2 of 3" color="success" />
//           <div class="mt-6 space-y-4">
//             <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
//               <div class="flex items-center">
//                 <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
//                   <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
//                     <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
//                   </svg>
//                 </div>
//                 <span class="text-sm font-medium text-green-800">Verify your email address</span>
//               </div>
//             </div>
            
//             <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
//               <div class="flex items-center">
//                 <div class="w-5 h-5 bg-neutral-300 rounded-full mr-3"></div>
//                 <span class="text-sm font-medium text-neutral-700">Create your Bokamoso Advisory Services profile</span>
//               </div>
//               <ui-button size="sm" (clicked)="resumeProfile()">Resume Profile</ui-button>
//             </div>
//           </div>
//         </div>
//       </ui-card>

//       <ui-card title="Available Funding" subtitle="Explore the latest funding opportunities available for your business." class="mt-8">
//         <div class="space-y-4">
//           <div class="flex items-start space-x-4 p-4 border border-neutral-200 rounded-lg">
//             <img src="/assets/kapify-logo.svg" alt="Kapify" class="w-12 h-12 rounded">
//             <div class="flex-1">
//               <h3 class="font-semibold text-neutral-900">The Prosperity Impact Fund (PIF)</h3>
//               <div class="flex flex-wrap gap-2 mt-2 mb-3">
//                 <ui-status-badge text="Pure Debt" color="primary" />
//                 <ui-status-badge text="Working Capital Solutions" color="success" />
//                 <ui-status-badge text="Invoice Financing" color="warning" />
//               </div>
//               <p class="text-sm text-neutral-600">Financial support program for SMEs and community-driven projects...</p>
//               <div class="flex space-x-3 mt-4">
//                 <ui-button variant="primary" size="sm">View Application</ui-button>
//                 <ui-button variant="outline" size="sm">View Opportunity</ui-button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </ui-card>
//     </div>
//   `,
// })
// export class DashboardComponent {
//   resumeProfile() {
//     // Handle resume profile action
//   }
// }