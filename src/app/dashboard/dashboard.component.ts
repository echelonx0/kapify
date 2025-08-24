
// // src/app/dashboard/dashboard.component.ts
// import { Component, signal } from '@angular/core';
// import { 
//   LucideAngularModule, 
//   ExternalLink, 
//   Eye, 
//   ChevronDown, 
//   Circle 
// } from 'lucide-angular';
// import { 
//   UiCardComponent, 
//   UiButtonComponent, 
//   UiProgressComponent,
//   UiStatusBadgeComponent 
// } from '../shared/components';
// import { UiProgressStepComponent } from '../shared/components/ui-progress-step.component';
// import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
// import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [
//     LucideAngularModule,
//     UiCardComponent,
//     UiButtonComponent,
//     UiProgressComponent,
//     UiStatusBadgeComponent,
//     UiProgressStepComponent,
//     SidebarNavComponent,
//     DashboardHeaderComponent
//   ],
//   templateUrl: 'dashboard.component.html'
// })
// export class DashboardComponent {
//   showInstructions = signal(false);
  
//   ExternalLinkIcon = ExternalLink;
//   EyeIcon = Eye;
//   ChevronDownIcon = ChevronDown;
//   CircleIcon = Circle;

//   chevronClasses() {
//     return `text-neutral-400 transform transition-transform ${this.showInstructions() ? 'rotate-180' : ''}`;
//   }

//   resumeProfile() {
//     console.log('Resume profile clicked');
//   }

//   viewApplication() {
//     console.log('View application clicked');
//   }

//   viewOpportunity() {
//     console.log('View opportunity clicked');
//   }

//   toggleInstructions() {
//     this.showInstructions.set(!this.showInstructions());
//   }
// }
 