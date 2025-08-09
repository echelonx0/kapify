 

// // src/app/shared/components/sidebar-nav.component.ts - UPDATED FOR DASHBOARD ROUTES
// import { Component, computed } from '@angular/core';
// import { Router, RouterModule } from '@angular/router';
// import { LucideAngularModule, Home, User, FileText, DollarSign, Settings, LogOut, Building } from 'lucide-angular';
// import { AuthService } from '../../auth/auth.service';

// interface NavItem {
//   label: string;
//   icon: any;
//   route: string;
//   userTypes: ('sme' | 'funder')[]; 
// }

// @Component({
//   selector: 'sidebar-nav',
//   standalone: true,
//   imports: [RouterModule, LucideAngularModule],
//   template: `
//     <nav class="fixed left-0 top-0 h-full w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4 z-40">
//       <!-- Logo -->
//       <button 
//         (click)="goToDashboard()"
//         class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center mb-8 hover:bg-primary-600 transition-colors"
//       >
//         <span class="text-white font-bold text-lg">K</span>
//       </button>

//       <!-- Navigation Items -->
//       <div class="flex flex-col space-y-2 flex-1">
//         @for (item of visibleNavItems(); track item.route) {
//           <a
//             [routerLink]="item.route"
//             routerLinkActive="bg-primary-50 text-primary-600"
//             [routerLinkActiveOptions]="{exact: item.route === '/dashboard/home'}"
//             class="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
//             [title]="item.label"
//           >
//             <lucide-icon [img]="item.icon" [size]="20" />
//           </a>
//         }
//       </div>

//       <!-- Bottom Actions -->
//       <div class="flex flex-col space-y-2">
//         <a
//           routerLink="/dashboard/settings"
//           routerLinkActive="bg-primary-50 text-primary-600"
//           class="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
//           title="Settings"
//         >
//           <lucide-icon [img]="SettingsIcon" [size]="20" />
//         </a>
//         <button
//           (click)="logout()"
//           class="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-red-100 hover:text-red-600 transition-colors"
//           title="Logout"
//         >
//           <lucide-icon [img]="LogOutIcon" [size]="20" />
//         </button>
//       </div>
//     </nav>
//   `
// })
// export class SidebarNavComponent {
//   HomeIcon = Home;
//   UserIcon = User;
//   FileTextIcon = FileText;
//   DollarSignIcon = DollarSign;
//   BuildingIcon = Building;
//   SettingsIcon = Settings;
//   LogOutIcon = LogOut;

//   private navItems: NavItem[] = [
//     { label: 'Home', icon: Home, route: '/dashboard/home', userTypes: ['sme', 'funder'] },
//     { label: 'Profile', icon: User, route: '/dashboard/profile', userTypes: ['sme'] },
//     { label: 'Applications', icon: FileText, route: '/dashboard/applications', userTypes: ['sme'] },
//     { label: 'Funding Opportunities', icon: DollarSign, route: '/dashboard/funding-opportunities', userTypes: ['sme'] },
//     { label: 'Funder Dashboard', icon: Building, route: '/dashboard/funder-dashboard', userTypes: ['funder'] },
//   ];

//   visibleNavItems = computed(() => {
//     const user = this.authService.user();
//     const userType = user?.user?.userType || 'sme';
//     const mappedUserType = this.mapUserTypeForNavigation(userType);
    
//     return this.navItems.filter(item => 
//       item.userTypes.includes(mappedUserType)
//     );
//   });

//   private mapUserTypeForNavigation(userType: string): 'sme' | 'funder' {
//     switch (userType) {
//       case 'sme': return 'sme';
//       case 'funder': return 'funder';
//       case 'admin':
//       case 'consultant': return 'funder';
//       default: return 'sme';
//     }
//   }

//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   goToDashboard() {
//     this.router.navigate(['/dashboard']);
//   }

//   logout() {
//     this.authService.logout();
//     this.router.navigate(['/']);
//   }
// }
 // src/app/shared/components/sidebar-nav.component.ts - UPDATED FOR APPLICATIONS ROUTES
import { Component, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Home, User, FileText, DollarSign, Settings, LogOut, Building } from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  icon: any;
  route: string;
  userTypes: ('sme' | 'funder')[]; 
}

@Component({
  selector: 'sidebar-nav',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  template: `
    <nav class="fixed left-0 top-0 h-full w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-4 z-40">
      <!-- Logo -->
      <button 
        (click)="goToDashboard()"
        class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center mb-8 hover:bg-primary-600 transition-colors"
      >
        <span class="text-white font-bold text-lg">K</span>
      </button>

      <!-- Navigation Items -->
      <div class="flex flex-col space-y-2 flex-1">
        @for (item of visibleNavItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary-50 text-primary-600"
            [routerLinkActiveOptions]="{exact: item.route === '/dashboard/home'}"
            class="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            [title]="item.label"
          >
            <lucide-icon [img]="item.icon" [size]="20" />
          </a>
        }
      </div>

      <!-- Bottom Actions -->
      <div class="flex flex-col space-y-2">
        <a
          routerLink="/dashboard/settings"
          routerLinkActive="bg-primary-50 text-primary-600"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          title="Settings"
        >
          <lucide-icon [img]="SettingsIcon" [size]="20" />
        </a>
        <button
          (click)="logout()"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <lucide-icon [img]="LogOutIcon" [size]="20" />
        </button>
      </div>
    </nav>
  `
})
export class SidebarNavComponent {
  HomeIcon = Home;
  UserIcon = User;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  BuildingIcon = Building;
  SettingsIcon = Settings;
  LogOutIcon = LogOut;

  private navItems: NavItem[] = [
    { label: 'Home', icon: Home, route: '/dashboard/home', userTypes: ['sme', 'funder'] },
    { label: 'Profile', icon: User, route: '/dashboard/profile', userTypes: ['sme'] },
    { label: 'Applications', icon: FileText, route: '/applications', userTypes: ['sme'] }, // Updated route
    { label: 'Funding Opportunities', icon: DollarSign, route: '/dashboard/funding-opportunities', userTypes: ['sme'] },
    { label: 'Funder Dashboard', icon: Building, route: '/dashboard/funder-dashboard', userTypes: ['funder'] },
  ];

  visibleNavItems = computed(() => {
    const user = this.authService.user();
    const userType = user?.user?.userType || 'sme';
    const mappedUserType = this.mapUserTypeForNavigation(userType);
    
    return this.navItems.filter(item => 
      item.userTypes.includes(mappedUserType)
    );
  });

  private mapUserTypeForNavigation(userType: string): 'sme' | 'funder' {
    switch (userType) {
      case 'sme': return 'sme';
      case 'funder': return 'funder';
      case 'admin':
      case 'consultant': return 'funder';
      default: return 'sme';
    }
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}