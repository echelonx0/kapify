// src/app/shared/components/enhanced-sidebar-nav.component.ts
import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Home, User, FileText, DollarSign, Settings, LogOut, Building, ChevronDown, Bell, BookOpen } from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';
import { ProfileManagementService } from '../../services/profile-management.service';

interface NavItem {
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
  templateUrl: 'sidenav.component.html'
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

  // State
  showNotifications = signal(false);
  isOnline = signal(true);
  unreadNotifications = signal(3); // TODO: Get from notifications service

  // Profile data
  currentUser = computed(() => this.profileService.currentUser());
  userDisplayName = computed(() => this.profileService.userDisplayName());

  isAdminUser = computed(() => {
    const user = this.currentUser(); 
    return user?.email === 'zivaigwe@gmail.com';
  });

  // Navigation items with potential badges
  private navItems: NavItem[] = [
    { label: 'Home', icon: Home, route: '/dashboard/home', userTypes: ['sme', 'funder'] },
    { label: 'Resources', icon: BookOpen, route: '/resources', userTypes: ['sme', 'funder'] },
    { label: 'Profile', icon: User, route: '/profile', userTypes: ['sme'] },
    { label: 'Funding Opportunities', icon: DollarSign, route: '/funding', userTypes: ['sme'] },
    { label: 'Manage', icon: Building, route: '/dashboard/funder-dashboard', userTypes: ['funder'] },
    { label: 'Applications', icon: FileText, route: '/applications', userTypes: ['sme', 'funder'], badge: 2 },  
    { label: 'Admin Console', icon: Settings, route: '/administrator/dashboard', userTypes: ['sme', 'funder'] }
  ];

  visibleNavItems = computed(() => {
    const user = this.authService.user();
    const userType = user?.userType || 'sme';
    const mappedUserType = this.mapUserTypeForNavigation(userType);
    const isAdmin = this.isAdminUser();
    
    return this.navItems.filter(item => {
      // Show admin route only for admin users
      if (item.route === '/administrator/dashboard') {
        return isAdmin;
      }
      
      // Show other routes based on user type
      return item.userTypes.includes(mappedUserType);
    });
  });

  ngOnInit() {
    // Load profile data if not already loaded
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => {
          console.error('Failed to load profile data:', error);
        }
      });
    }

    // Set up online status detection
    this.setupOnlineStatusDetection();
  }

  private setupOnlineStatusDetection() {
    this.isOnline.set(navigator.onLine);
    
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  private mapUserTypeForNavigation(userType: string): 'sme' | 'funder' {
    switch (userType) {
      case 'sme': return 'sme';
      case 'funder': return 'funder';
      case 'admin':
      case 'consultant': return 'funder';
      default: return 'sme';
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  toggleNotifications() {
    this.showNotifications.update(current => !current);
  }

  logout() {
    this.profileService.clearProfileData();
    this.authService.signOut();
    this.router.navigate(['/']);
  }

  getUserInitials(): string {
    return this.profileService.getUserInitials();
  }

  getUserTypeDisplayName(): string {
    const user = this.currentUser();
    return user ? this.profileService.getUserTypeDisplayName(user.userType) : '';
  }
}