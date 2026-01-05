import {
  Component,
  computed,
  signal,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  User,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Building,
  Bell,
  BookOpen,
  BookCheck,
  Menu,
  X,
  House,
  Axis3d,
  BinaryIcon,
  FolderOpen,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/services/production.auth.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNavComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileManagementService);
  private router = inject(Router);

  // Icons
  HomeIcon = House;
  UserIcon = User;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  BuildingIcon = Building;
  SettingsIcon = Settings;
  LogOutIcon = LogOut;
  BellIcon = Bell;
  BookOpenIcon = BookOpen;
  BookCheckIcon = BookCheck;
  MenuIcon = Menu;
  CloseIcon = X;
  Axis3dIcon = Axis3d;
  BinaryIcon = BinaryIcon;
  FolderOpenIcon = FolderOpen;

  // State - Mobile Menu
  showMobileMenu = signal(false);

  // State - Notifications
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
      icon: House,
      route: '/dashboard/home',
      userTypes: ['funder'],
    },
    {
      id: 'profile',
      label: 'Home',
      icon: User,
      route: '/profile',
      userTypes: ['sme'],
    },
    {
      id: 'review',
      label: 'Review',
      icon: Axis3d,
      route: '/profile/review',
      userTypes: ['sme'],
    },
    {
      id: 'funding',
      label: 'Funding Opportunities',
      icon: DollarSign,
      route: '/funding/opportunities',
      userTypes: ['sme'],
    },
    {
      id: 'funder-opportunities',
      label: 'Opportunities',
      icon: FolderOpen,
      route: '/funder/dashboard',
      userTypes: ['funder'],
    },
    {
      id: 'funder-applications',
      label: 'Applications',
      icon: BinaryIcon,
      route: '/funder/applications',
      userTypes: ['funder'],
    },
    {
      id: 'sme-applications',
      label: 'Applications',
      icon: BinaryIcon,
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

  ngOnInit(): void {
    this.setupProfileData();
    this.setupOnlineStatusDetection();
    this.setupMobileMenuCloseOnNavigation();
  }

  private setupProfileData(): void {
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => console.error('Failed to load profile data:', error),
      });
    }
  }

  private setupOnlineStatusDetection(): void {
    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  private setupMobileMenuCloseOnNavigation(): void {
    this.router.events.subscribe(() => {
      if (this.showMobileMenu()) {
        this.closeMobileMenu();
      }
    });
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

  // Navigation Actions
  goToDashboard(): void {
    const user = this.authService.user();
    const userType = user?.userType || 'sme';

    // Route based on user type
    if (
      userType === 'funder' ||
      userType === 'admin' ||
      userType === 'consultant'
    ) {
      this.router.navigate(['/funder/dashboard']);
    } else {
      this.router.navigate(['/profile']);
    }
    this.closeMobileMenu();
  }

  // Mobile Menu Management
  toggleMobileMenu(): void {
    this.showMobileMenu.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }

  // Auth Actions
  logout(): void {
    this.profileService.clearProfileData();
    this.authService.signOut();
    this.router.navigate(['/login']);
  }

  // User Display Helpers
  getUserInitials(): string {
    return this.profileService.getUserInitials();
  }

  getUserTypeDisplayName(): string {
    const user = this.currentUser();
    return user
      ? this.profileService.getUserTypeDisplayName(user.userType)
      : '';
  }

  // Track By Function
  trackByUnique(index: number, item: NavItem): string {
    return item.id;
  }
}
