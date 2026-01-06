// // src/app/SMEs/profile/public-page/public-profile.component.ts

// import { Component, signal, computed, inject, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import {
//   LucideAngularModule,
//   Building,
//   FileText,
//   Target,
//   Users,
//   TrendingUp,
//   DollarSign,
//   ExternalLink,
//   RefreshCw,
//   Calendar,
//   Share2,
//   File,
//   Image,
//   HouseIcon,
//   CircleCheckBig,
//   CircleAlert,
//   ChartColumn,
// } from 'lucide-angular';
// import { SMEPublicProfileService } from '../services/sme-public-profile.service';

// interface PublicProfileData {
//   slug: string;
//   organizationId: string;
//   organizationName: string;
//   organizationType: string;
//   companyName: string;
//   industry: string;
//   yearsInOperation: number;
//   employeeCount: string;
//   monthlyRevenue: string;
//   requestedFunding: string;
//   completionPercentage: number;
//   readinessScore: number;
//   lastUpdated: Date;
//   documents: PublicDocument[];
//   dataRoomUrl: string;
//   sections: PublicSectionView[];
// }

// interface PublicDocument {
//   id: string;
//   name: string;
//   type: string;
//   category: string;
//   fileSize: number;
//   uploadedAt: Date;
//   publicUrl: string;
//   verificationStatus:
//     | 'uploaded'
//     | 'processing'
//     | 'approved'
//     | 'rejected'
//     | 'verified';
// }

// interface PublicSectionView {
//   stepId: string;
//   title: string;
//   icon: any;
//   completed: boolean;
//   completionPercentage: number;
//   keyData: { label: string; value: string }[];
// }

// @Component({
//   selector: 'app-public-profile-view',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   templateUrl: './public-profile.component.html',
// })
// export class PublicProfileViewComponent implements OnInit {
//   private profileService = inject(SMEPublicProfileService);
//   private route = inject(ActivatedRoute);

//   // Icons
//   CheckCircleIcon = CircleCheckBig;
//   AlertCircleIcon = CircleAlert;
//   BuildingIcon = Building;
//   FileTextIcon = FileText;
//   BarChart3Icon = ChartColumn;
//   TargetIcon = Target;
//   UsersIcon = Users;
//   TrendingUpIcon = TrendingUp;
//   DollarSignIcon = DollarSign;
//   ExternalLinkIcon = ExternalLink;
//   RefreshIcon = RefreshCw;
//   CalendarIcon = Calendar;
//   ShareIcon = Share2;
//   FileIcon = File;
//   ImageIcon = Image;
//   HomeIcon = HouseIcon;

//   // State
//   isLoading = signal(false);
//   isRefreshing = signal(false);
//   error = signal<string | null>(null);
//   slug = signal<string>('');

//   // Data
//   profileData = signal<PublicProfileData | null>(null);

//   // Computed
//   isComplete = computed(() => {
//     const data = this.profileData();
//     return data ? data.completionPercentage === 100 : false;
//   });

//   readinessLevel = computed(() => {
//     const score = this.profileData()?.readinessScore || 0;
//     if (score >= 90) return 'excellent';
//     if (score >= 70) return 'good';
//     if (score >= 50) return 'fair';
//     return 'poor';
//   });

//   readinessMessage = computed(() => {
//     const level = this.readinessLevel();
//     const messages = {
//       excellent:
//         'Highly investment-ready with comprehensive business foundation',
//       good: 'Well-developed profile ready for serious evaluation',
//       fair: 'Solid foundation with room for strengthening',
//       poor: 'Early-stage profile, actively developing',
//     };
//     return messages[level];
//   });
//   constructor(private router: Router) {}
//   goHome() {
//     this.router.navigate(['/']);
//   }
//   ngOnInit() {
//     this.loadProfile();
//   }

//   private loadProfile() {
//     this.slug.set(this.route.snapshot.paramMap.get('slug') || '');

//     if (!this.slug()) {
//       this.error.set('Invalid profile link');
//       return;
//     }

//     this.isLoading.set(true);
//     this.profileService.getPublicProfile(this.slug()).subscribe({
//       next: (data) => {
//         this.profileData.set(data);
//         this.error.set(null);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Failed to load profile:', err);
//         this.error.set(
//           'Unable to load profile. This link may be invalid or expired.'
//         );
//         this.isLoading.set(false);
//       },
//     });
//   }

//   refreshProfile() {
//     this.isRefreshing.set(true);
//     this.profileService.getPublicProfile(this.slug()).subscribe({
//       next: (data) => {
//         this.profileData.set(data);
//         this.isRefreshing.set(false);
//       },
//       error: (err) => {
//         console.error('Failed to refresh:', err);
//         this.isRefreshing.set(false);
//       },
//     });
//   }

//   shareProfile() {
//     const url = window.location.href;
//     if (navigator.share) {
//       navigator.share({
//         title: this.profileData()?.companyName || 'Business Profile',
//         url: url,
//       });
//     } else {
//       navigator.clipboard.writeText(url);
//       alert('Profile link copied to clipboard');
//     }
//   }

//   getSectionIcon(stepId: string): any {
//     const iconMap: { [key: string]: any } = {
//       'company-info': Building,
//       documents: FileText,
//       'business-assessment': ChartColumn,
//       'swot-analysis': Target,
//       management: Users,
//       'business-strategy': TrendingUp,
//       'financial-profile': DollarSign,
//     };
//     return iconMap[stepId] || CircleAlert;
//   }

//   getDocumentIcon(fileType: string): string {
//     const iconMap: { [key: string]: string } = {
//       pdf: 'FileText',
//       doc: 'FileText',
//       docx: 'FileText',
//       xls: 'BarChart3',
//       xlsx: 'BarChart3',
//       jpg: 'Image',
//       png: 'Image',
//       jpeg: 'Image',
//       csv: 'BarChart3',
//       txt: 'FileText',
//     };
//     return iconMap[fileType.toLowerCase()] || 'File';
//   }

//   formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
//   }

//   getReadinessBadgeClass(level: string): string {
//     const classes = {
//       excellent: 'bg-green-50 border-green-200 text-green-700',
//       good: 'bg-teal-50 border-teal-300 text-teal-700',
//       fair: 'bg-amber-50 border-amber-200 text-amber-700',
//       poor: 'bg-slate-100 border-slate-200 text-slate-700',
//     };
//     return classes[level as keyof typeof classes] || classes.poor;
//   }

//   formatCurrency(value: string | number | undefined): string {
//     if (!value) return 'Not specified';

//     const valueStr = typeof value === 'number' ? value.toString() : value;
//     if (valueStr === 'Not specified' || valueStr === 'Not provided')
//       return valueStr;

//     const numValue = parseFloat(valueStr.replace(/[^\d.-]/g, ''));
//     if (isNaN(numValue)) return valueStr;

//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(numValue);
//   }

//   formatDate(date: Date): string {
//     return new Date(date).toLocaleDateString('en-ZA', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   }

//   getCompletionColor(percentage: number): string {
//     if (percentage === 100)
//       return 'bg-gradient-to-r from-green-400 to-green-500';
//     if (percentage >= 75) return 'bg-gradient-to-r from-teal-400 to-teal-500';
//     if (percentage >= 50) return 'bg-gradient-to-r from-amber-400 to-amber-500';
//     return 'bg-gradient-to-r from-slate-400 to-slate-500';
//   }
// }

import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  Building,
  FileText,
  Target,
  Users,
  TrendingUp,
  DollarSign,
  ExternalLink,
  RefreshCw,
  Calendar,
  Share2,
  File,
  Image,
  HouseIcon,
  CircleCheckBig,
  CircleAlert,
  ChartColumn,
} from 'lucide-angular';
import { SMEPublicProfileService } from '../services/sme-public-profile.service';

interface PublicProfileData {
  slug: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  companyName: string;
  industry: string;
  yearsInOperation: number;
  employeeCount: string;
  monthlyRevenue: string;
  requestedFunding: string;
  completionPercentage: number;
  readinessScore: number;
  lastUpdated: Date;
  documents: PublicDocument[];
  dataRoomUrl: string;
  sections: PublicSectionView[];
}

interface PublicDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  fileSize: number;
  uploadedAt: Date;
  publicUrl: string;
  verificationStatus:
    | 'uploaded'
    | 'processing'
    | 'approved'
    | 'rejected'
    | 'verified';
}

interface PublicSectionView {
  stepId: string;
  title: string;
  icon: any;
  completed: boolean;
  completionPercentage: number;
  keyData: { label: string; value: string }[];
}

@Component({
  selector: 'app-public-profile-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './public-profile.component.html',
})
export class PublicProfileViewComponent implements OnInit {
  private profileService = inject(SMEPublicProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Icons
  CheckCircleIcon = CircleCheckBig;
  AlertCircleIcon = CircleAlert;
  BuildingIcon = Building;
  FileTextIcon = FileText;
  BarChart3Icon = ChartColumn;
  TargetIcon = Target;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  ExternalLinkIcon = ExternalLink;
  RefreshIcon = RefreshCw;
  CalendarIcon = Calendar;
  ShareIcon = Share2;
  FileIcon = File;
  ImageIcon = Image;
  HomeIcon = HouseIcon;

  // State
  isLoading = signal(false);
  isRefreshing = signal(false);
  error = signal<string | null>(null);
  slug = signal<string>('');
  activeTab = signal<'profile' | 'documents' | 'metrics'>('profile');

  // Data
  profileData = signal<PublicProfileData | null>(null);

  // Computed
  readinessLevel = computed(() => {
    const score = this.profileData()?.readinessScore || 0;
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  });

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.slug.set(this.route.snapshot.paramMap.get('slug') || '');

    if (!this.slug()) {
      this.error.set('Invalid profile link');
      return;
    }

    this.isLoading.set(true);
    this.profileService.getPublicProfile(this.slug()).subscribe({
      next: (data) => {
        this.profileData.set(data);
        this.error.set(null);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.error.set(
          'Unable to load profile. This link may be invalid or expired.'
        );
        this.isLoading.set(false);
      },
    });
  }

  refreshProfile() {
    this.isRefreshing.set(true);
    this.profileService.getPublicProfile(this.slug()).subscribe({
      next: (data) => {
        this.profileData.set(data);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        console.error('Failed to refresh:', err);
        this.isRefreshing.set(false);
      },
    });
  }

  shareProfile() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: this.profileData()?.companyName || 'Business Profile',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard');
    }
  }

  getCompanyTagline(): string {
    const data = this.profileData();
    if (!data) return '';

    const industry = data.industry || 'Business';
    const years = data.yearsInOperation || 0;
    return `${industry} • Operating since ${new Date().getFullYear() - years}`;
  }

  getBusinessOverview(): string {
    const data = this.profileData();
    if (!data) return '';

    const industry = data.industry || 'this industry';
    const years = data.yearsInOperation || 0;
    const employees = data.employeeCount || 'a growing';
    const funding = data.requestedFunding || 'undisclosed';

    return `${
      data.companyName
    } is a ${years}-year-old ${industry.toLowerCase()} company with ${employees} employees. The organization is seeking ${funding} in funding to fuel their next phase of growth and market expansion. With a focus on sustainable operations and strategic partnerships, the company has built a solid foundation in their market segment.`;
  }

  getSectionIcon(stepId: string): any {
    const iconMap: { [key: string]: any } = {
      'company-info': Building,
      documents: FileText,
      'business-assessment': ChartColumn,
      'swot-analysis': Target,
      management: Users,
      'business-strategy': TrendingUp,
      'financial-profile': DollarSign,
    };
    return iconMap[stepId] || CircleAlert;
  }

  getDocumentIcon(fileType: string): string {
    const iconMap: { [key: string]: string } = {
      pdf: 'FileText',
      doc: 'FileText',
      docx: 'FileText',
      xls: 'BarChart3',
      xlsx: 'BarChart3',
      jpg: 'Image',
      png: 'Image',
      jpeg: 'Image',
      csv: 'BarChart3',
      txt: 'FileText',
    };
    return iconMap[fileType.toLowerCase()] || 'File';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatCurrency(value: string | number | undefined): string {
    if (!value) return 'Not specified';

    const valueStr = typeof value === 'number' ? value.toString() : value;
    if (valueStr === 'Not specified' || valueStr === 'Not provided')
      return valueStr;

    const numValue = parseFloat(valueStr.replace(/[^\d.-]/g, ''));
    if (isNaN(numValue)) return valueStr;

    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getCompletionColor(percentage: number): string {
    if (percentage === 100)
      return 'bg-gradient-to-r from-green-400 to-green-500';
    if (percentage >= 75) return 'bg-gradient-to-r from-teal-400 to-teal-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-slate-400 to-slate-500';
  }

  getReadinessTextColor(level: string): string {
    const colors = {
      excellent: 'text-green-700',
      good: 'text-teal-700',
      fair: 'text-amber-700',
      poor: 'text-slate-700',
    };
    return colors[level as keyof typeof colors] || colors.poor;
  }
}
