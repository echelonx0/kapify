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

  // Admin email configuration
  private readonly ADMIN_EMAILS = [
    'charles@bokamosoas.co.za',
    'admin@kapify.com',
    'support@kapify.com',
    'operations@kapify.com',
    'zivaigwe@gmail.com'
    // Add more admin emails as needed
  ];

  // Profile data
  currentUser = computed(() => this.profileService.currentUser());
  userDisplayName = computed(() => this.profileService.userDisplayName());

  isAdminUser = computed(() => {
    const user = this.currentUser(); 
    if (!user?.email) return false;
    
    return this.ADMIN_EMAILS.includes(user.email.toLowerCase());
  });

  // Navigation items with potential badges
  private navItems: NavItem[] = [
    { label: 'Home', icon: Home, route: '/dashboard/home', userTypes: ['sme', 'funder'] },
    { label: 'Profile', icon: User, route: '/profile', userTypes: ['sme'] },
    { label: 'Funding Opportunities', icon: DollarSign, route: '/funding', userTypes: ['sme'] },
    { label: 'Manage', icon: Building, route: '/dashboard/funder-dashboard', userTypes: ['funder'] },
    { label: 'Applications', icon: FileText, route: '/applications', userTypes: ['sme'], badge: 2 }, 
    { label: 'Data Room', icon: FileText, route: '/profile/data-room', userTypes: ['sme', 'funder'] },
    { label: 'Resources', icon: BookOpen, route: '/dashboard/resources', userTypes: ['sme', 'funder'] },
  { label: 'Admin Console', icon: Settings, route: '/administrator', userTypes: ['sme', 'funder'] }
  ];

  visibleNavItems = computed(() => {
    const user = this.authService.user();
    const userType = user?.userType || 'sme';
    const mappedUserType = this.mapUserTypeForNavigation(userType);
    const isAdmin = this.isAdminUser();
    
    return this.navItems.filter(item => {
      // Show admin route only for admin users
      if (item.route === '/admin') {
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

  // Method to check if a specific email is an admin (for external use)
  isEmailAdmin(email: string): boolean {
    return this.ADMIN_EMAILS.includes(email.toLowerCase());
  }

  // Method to get the list of admin emails (for external use)
  getAdminEmails(): string[] {
    return [...this.ADMIN_EMAILS];
  }

  // Method to add admin email dynamically (for future use)
  addAdminEmail(email: string): void {
    const normalizedEmail = email.toLowerCase();
    if (!this.ADMIN_EMAILS.includes(normalizedEmail)) {
      this.ADMIN_EMAILS.push(normalizedEmail);
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
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    return this.profileService.getUserInitials();
  }

  getUserTypeDisplayName(): string {
    const user = this.currentUser();
    return user ? this.profileService.getUserTypeDisplayName(user.userType) : '';
  }
}