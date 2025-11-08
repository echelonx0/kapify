import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Home,
  User,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Building,
  ChevronDown,
  Bell,
  BookOpen,
  BookCheck,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';
import { ProfileManagementService } from '../../services/profile-management.service';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  userTypes: ('sme' | 'funder')[];
  badge?: number;
}

@Component({
  selector: 'sidebar-nav',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, CommonModule],
  templateUrl: 'sidenav.component.html',
})
export class SidebarNavComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileManagementService);
  private router = inject(Router);

  // Icons
  HomeIcon = Home;
  UserIcon = User;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  BuildingIcon = Building;
  SettingsIcon = Settings;
  LogOutIcon = LogOut;
  BellIcon = Bell;
  ChevronDownIcon = ChevronDown;
  BookOpenIcon = BookOpen;
  BookCheckIcon = BookCheck;

  // State
  showNotifications = signal(false);
  isOnline = signal(true);
  unreadNotifications = signal(1);

  private readonly ADMIN_EMAILS = [
    'charles@bokamosoas.co.za',
    'admin@kapify.com',
    'support@kapify.com',
    'operations@kapify.com',
    'zivaigwe@gmail.com',
  ];

  currentUser = computed(() => this.profileService.currentUser());
  userDisplayName = computed(() => this.profileService.userDisplayName());

  isAdminUser = computed(() => {
    const user = this.currentUser();
    if (!user?.email) return false;
    return this.ADMIN_EMAILS.includes(user.email.toLowerCase());
  });

  private readonly navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      route: '/dashboard/home',
      userTypes: ['sme', 'funder'],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      route: '/profile',
      userTypes: ['sme'],
    },
    {
      id: 'funding',
      label: 'Funding Opportunities',
      icon: DollarSign,
      route: '/funding',
      userTypes: ['sme'],
    },
    {
      id: 'funder-manage',
      label: 'Manage',
      icon: Building,
      route: '/dashboard/funder-dashboard',
      userTypes: ['funder'],
    },
    {
      id: 'funder-opportunities',
      label: 'Opportunities',
      icon: BookCheck,
      route: '/dashboard/funder-dashboard',
      userTypes: ['funder'],
    },
    {
      id: 'funder-applications',
      label: 'Applications',
      icon: BookOpen,
      route: '/dashboard/funder-dashboard',
      userTypes: ['funder'],
    },
    {
      id: 'sme-applications',
      label: 'Applications',
      icon: FileText,
      route: '/applications',
      userTypes: ['sme'],
      badge: 2,
    },
    {
      id: 'data-room',
      label: 'Data Room',
      icon: FileText,
      route: '/profile/data-room',
      userTypes: ['sme'],
    },
    {
      id: 'academy',
      label: 'Kapify Academy',
      icon: BookOpen,
      route: '/dashboard/kapify-academy',
      userTypes: ['sme'],
    },
    {
      id: 'admin-console',
      label: 'Admin Console',
      icon: Settings,
      route: '/administrator',
      userTypes: ['funder'],
    },
  ];

  visibleNavItems = computed(() => {
    const user = this.authService.user();
    const userType = user?.userType || 'sme';
    const mappedUserType = this.mapUserTypeForNavigation(userType);
    const isAdmin = this.isAdminUser();

    return this.navItems.filter((item) => {
      if (item.route === '/administrator') return isAdmin;
      return item.userTypes.includes(mappedUserType);
    });
  });

  ngOnInit() {
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => console.error('Failed to load profile data:', error),
      });
    }
    this.setupOnlineStatusDetection();
  }

  private setupOnlineStatusDetection() {
    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  private mapUserTypeForNavigation(userType: string): 'sme' | 'funder' {
    switch (userType) {
      case 'sme':
        return 'sme';
      case 'funder':
      case 'admin':
      case 'consultant':
        return 'funder';
      default:
        return 'sme';
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  goToFunderTabFromLabel(label: string) {
    const labelMap: Record<
      string,
      'overview' | 'opportunities' | 'applications'
    > = {
      Manage: 'overview',
      Opportunities: 'opportunities',
      Applications: 'applications',
    };

    const tabId = labelMap[label];
    if (tabId) {
      this.router.navigate(['/funder/dashboard'], {
        queryParams: { tab: tabId },
      });
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  toggleNotifications() {
    this.showNotifications.update((v) => !v);
  }

  logout() {
    this.profileService.clearProfileData();
    this.authService.signOut();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    return this.profileService.getUserInitials();
  }

  getUserTypeDisplayName(): string {
    const user = this.currentUser();
    return user
      ? this.profileService.getUserTypeDisplayName(user.userType)
      : '';
  }

  trackByUnique(index: number, item: NavItem): string {
    return item.id;
  }
}
