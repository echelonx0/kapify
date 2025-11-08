// data-room-landing.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Folder,
  FileText,
  Share2,
  Lock,
  Sparkles,
  Search,
  Building2,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  Plus,
  Eye,
  Download,
  Calendar,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';

import {
  DocumentMetadata,
  SupabaseDocumentService,
} from 'src/app/shared/services/supabase-document.service';

interface SharedDocument {
  id: string;
  name: string;
  sharedWith: number;
  lastAccessed: Date;
  type: string;
}

interface GeneratableDocument {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

interface SharedDataRoom {
  id: string;
  companyName: string;
  sharedDate: Date;
  documentCount: number;
  status: 'active' | 'pending' | 'expired';
}

@Component({
  selector: 'app-data-room-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './data-room-landing.component.html',
  styles: [
    `
      .bento-card {
        background: white;
        border-radius: 24px;
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
      }

      .bento-card:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .stat-number {
        font-size: 3.5rem;
        font-weight: 700;
        line-height: 1;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in-up {
        animation: fadeInUp 0.5s ease-out;
      }

      .search-input:focus {
        outline: none;
        border-color: #f97316;
      }
    `,
  ],
})
export class DataRoomLandingComponent implements OnInit {
  // Icons
  FolderIcon = Folder;
  FileTextIcon = FileText;
  Share2Icon = Share2;
  LockIcon = Lock;
  SparklesIcon = Sparkles;
  SearchIcon = Search;
  Building2Icon = Building2;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  ShieldIcon = Shield;
  ArrowRightIcon = ArrowRight;
  PlusIcon = Plus;
  EyeIcon = Eye;
  DownloadIcon = Download;
  CalendarIcon = Calendar;

  private authService = inject(AuthService);
  private documentService = inject(SupabaseDocumentService);
  private router = inject(Router);

  // State
  searchQuery = signal('');
  currentUser = computed(() => this.authService.user());
  userType = computed(() => this.currentUser()?.userType || 'sme');

  // UI Signals
  isLoadingDocuments = signal(false);
  documentsError = signal<string | null>(null);
  userDocuments = signal<DocumentMetadata[]>([]);
  // SME Data
  sharedDocuments = signal<SharedDocument[]>([
    {
      id: '1',
      name: 'Financial Statements 2024',
      sharedWith: 3,
      lastAccessed: new Date('2025-10-25'),
      type: 'PDF',
    },
    {
      id: '2',
      name: 'Business Plan Q4',
      sharedWith: 5,
      lastAccessed: new Date('2025-10-28'),
      type: 'DOCX',
    },
  ]);
  ngOnInit(): void {
    this.fetchUserDocuments();
  }
  private fetchUserDocuments(): void {
    this.isLoadingDocuments.set(true);
    this.documentsError.set(null);

    this.documentService.getDocumentsByUser().subscribe({
      next: (docMap) => {
        // Convert Map to array for easier display
        const docs = Array.from(docMap.values());
        this.userDocuments.set(docs);
        this.isLoadingDocuments.set(false);
        console.log('✅ User documents loaded:', docs);
      },
      error: (err) => {
        console.error('❌ Failed to load user documents:', err);
        this.documentsError.set(err.message || 'Failed to load documents');
        this.isLoadingDocuments.set(false);
      },
    });
  }
  generatableDocuments = signal<GeneratableDocument[]>([
    {
      id: 'pitch-deck',
      title: 'Pitch Deck',
      description: 'Generate investor presentations',
      icon: this.FileTextIcon,
      color: 'teal',
    },
    {
      id: 'financial-model',
      title: 'Financial Model',
      description: 'Financial Modelling with Kapify',
      icon: this.TrendingUpIcon,
      color: 'green',
    },
    {
      id: 'compliance-docs',
      title: 'Compliance Pack',
      description: 'Complete your compliance checklist',
      icon: this.ShieldIcon,
      color: 'purple',
    },
  ]);

  stats = computed(() => {
    if (this.userType() === 'sme') {
      return {
        totalDocuments: 12,
        sharedWith: 8,
        totalViews: 124,
      };
    } else {
      return {
        dataRoomsAccessed: 5,
        pendingRequests: 2,
      };
    }
  });

  // Funder Data
  sharedDataRooms = signal<SharedDataRoom[]>([
    {
      id: '1',
      companyName: 'TechCorp Solutions',
      sharedDate: new Date('2025-10-20'),
      documentCount: 15,
      status: 'active',
    },
    {
      id: '2',
      companyName: 'Green Energy SA',
      sharedDate: new Date('2025-10-22'),
      documentCount: 22,
      status: 'active',
    },
  ]);

  // Actions
  navigateToFullDataRoom() {
    // this.router.navigate(['/data-room/full']);
  }

  generateDocument(docType: string) {
    console.log('Generating:', docType);
    // Will implement document generation flow
  }

  viewSharedDocument(docId: string) {
    console.log('Viewing document:', docId);
  }

  searchOrganizations() {
    const query = this.searchQuery();
    if (query.trim()) {
      console.log('Searching for:', query);
      // Will implement search
    }
  }
  shareDataRoom() {}
  managePermissions() {}
  generateResource() {}

  requestAccess(companyName: string) {
    console.log('Requesting access to:', companyName);
  }

  viewDataRoom(dataRoomId: string) {
    this.router.navigate(['/data-room', dataRoomId]);
  }

  getDocIconColor(color: string): string {
    const colors: Record<string, string> = {
      teal: 'bg-teal-100 text-teal-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
    };
    return colors[color] || 'bg-slate-100 text-slate-600';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  }

  // Add to data-room-landing.component.ts

  viewDocument(documentKey: string): void {
    console.log('Viewing document:', documentKey);
    // Navigate to document viewer or trigger download
    this.documentService.downloadDocumentByKey(documentKey).subscribe({
      next: () => console.log('Download initiated'),
      error: (err) => console.error('Download failed:', err),
    });
  }

  getDocumentIcon(mimeType: string): any {
    if (mimeType.includes('pdf')) return this.FileTextIcon;
    if (mimeType.includes('word') || mimeType.includes('document'))
      return this.FileTextIcon;
    if (mimeType.includes('sheet') || mimeType.includes('excel'))
      return this.TrendingUpIcon;
    if (mimeType.includes('image')) return this.EyeIcon;
    return this.FileTextIcon;
  }

  getDocumentIconColor(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'bg-red-100 text-red-600';
    if (mimeType.includes('word') || mimeType.includes('document'))
      return 'bg-teal-100 text-teal-600';
    if (mimeType.includes('sheet') || mimeType.includes('excel'))
      return 'bg-green-100 text-green-600';
    if (mimeType.includes('image')) return 'bg-purple-100 text-purple-600';
    return 'bg-slate-100 text-slate-600';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      uploaded: 'bg-teal-100 text-teal-700',
      processing: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  }
  // Add this helper method to your component
  formatUploadDate(dateString: string): string {
    return this.formatDate(new Date(dateString));
  }
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// // data-room-landing.component.ts - REWIRED VERSION
// import {
//   Component,
//   signal,
//   computed,
//   inject,
//   OnInit,
//   OnDestroy,
// } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import {
//   LucideAngularModule,
//   Folder,
//   FileText,
//   Share2,
//   Lock,
//   Sparkles,
//   Search,
//   Building2,
//   Users,
//   TrendingUp,
//   Shield,
//   ArrowRight,
//   Plus,
//   Eye,
//   Download,
//   Calendar,
// } from 'lucide-angular';
// import { Subject, takeUntil, forkJoin } from 'rxjs';
// import { AuthService } from 'src/app/auth/production.auth.service';
// import { DataRoomService } from '../services/data-room.service';
// import { DataRoomDocumentService } from '../services/data-room-document.service';
// import { DataRoomSharingService } from '../services/data-room-sharing.service';
// import { DataRoomAccessService } from '../services/data-room-access.service';
// import { ActionModalService } from 'src/app/shared/components/modal/modal.service';
// import {
//   DataRoom,
//   DataRoomDocument,
//   DataRoomShare,
//   DataRoomAccessRequest,
// } from '../models/data-room.models';

// interface SharedDataRoom {
//   id: string;
//   companyName: string;
//   sharedDate: Date;
//   documentCount: number;
//   status: 'active' | 'pending' | 'expired';
// }

// interface GeneratableDocument {
//   id: string;
//   title: string;
//   description: string;
//   icon: any;
//   color: string;
// }

// @Component({
//   selector: 'app-data-room-landing',
//   standalone: true,
//   imports: [CommonModule, FormsModule, LucideAngularModule],
//   templateUrl: './data-room-landing.component.html',
//   styles: [
//     `
//       .bento-card {
//         background: white;
//         border-radius: 24px;
//         border: 1px solid #e2e8f0;
//         transition: all 0.3s ease;
//       }

//       .bento-card:hover {
//         box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
//         transform: translateY(-2px);
//       }

//       .stat-number {
//         font-size: 3.5rem;
//         font-weight: 700;
//         line-height: 1;
//       }

//       @keyframes fadeInUp {
//         from {
//           opacity: 0;
//           transform: translateY(20px);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0);
//         }
//       }

//       .animate-fade-in-up {
//         animation: fadeInUp 0.5s ease-out;
//       }

//       .search-input:focus {
//         outline: none;
//         border-color: #f97316;
//       }
//     `,
//   ],
// })
// export class DataRoomLandingComponent implements OnInit, OnDestroy {
//   // Icons
//   FolderIcon = Folder;
//   FileTextIcon = FileText;
//   Share2Icon = Share2;
//   LockIcon = Lock;
//   SparklesIcon = Sparkles;
//   SearchIcon = Search;
//   Building2Icon = Building2;
//   UsersIcon = Users;
//   TrendingUpIcon = TrendingUp;
//   ShieldIcon = Shield;
//   ArrowRightIcon = ArrowRight;
//   PlusIcon = Plus;
//   EyeIcon = Eye;
//   DownloadIcon = Download;
//   CalendarIcon = Calendar;

//   // Services
//   private authService = inject(AuthService);
//   private dataRoomService = inject(DataRoomService);
//   private documentService = inject(DataRoomDocumentService);
//   private sharingService = inject(DataRoomSharingService);
//   private accessService = inject(DataRoomAccessService);
//   private modalService = inject(ActionModalService);
//   private router = inject(Router);
//   private destroy$ = new Subject<void>();

//   // State
//   searchQuery = signal('');
//   currentUser = computed(() => this.authService.user());
//   userType = computed(() => this.currentUser()?.userType || 'sme');

//   // Data Room State
//   dataRoom = signal<DataRoom | null>(null);
//   dataRoomDocuments = signal<DataRoomDocument[]>([]);
//   activeShares = signal<DataRoomShare[]>([]);
//   incomingRequests = signal<DataRoomAccessRequest[]>([]);
//   receivedShares = signal<DataRoomShare[]>([]);

//   // UI State
//   isLoadingDocuments = signal(false);
//   documentsError = signal<string | null>(null);

//   // Platform Assistance Documents
//   generatableDocuments = signal<GeneratableDocument[]>([
//     {
//       id: 'pitch-deck',
//       title: 'Pitch Deck',
//       description: 'Generate investor presentations',
//       icon: this.FileTextIcon,
//       color: 'teal',
//     },
//     {
//       id: 'financial-model',
//       title: 'Financial Model',
//       description: 'Financial Modelling with Kapify',
//       icon: this.TrendingUpIcon,
//       color: 'green',
//     },
//     {
//       id: 'compliance-docs',
//       title: 'Compliance Pack',
//       description: 'Complete your compliance checklist',
//       icon: this.ShieldIcon,
//       color: 'purple',
//     },
//   ]);

//   // Computed Stats
//   stats = computed(() => {
//     if (this.userType() === 'sme') {
//       return {
//         totalDocuments: this.dataRoomDocuments().length,
//         sharedWith: this.activeShares().length,
//         totalViews: 0, // Will be populated from access logs
//       };
//     } else {
//       return {
//         dataRoomsAccessed: this.receivedShares().length,
//         pendingRequests: this.incomingRequests().length,
//       };
//     }
//   });

//   // Shared Data Rooms (for funders)
//   sharedDataRooms = computed(() => {
//     return this.receivedShares().map((share) => ({
//       id: share.dataRoomId,
//       companyName: 'Company Name', // Will be enriched with actual org data
//       sharedDate: share.createdAt,
//       documentCount: 0, // Will be populated
//       status: share.status as 'active' | 'pending' | 'expired',
//     }));
//   });

//   ngOnInit(): void {
//     this.initializeDataRoom();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Initialize data room and load all data
//    */
//   private initializeDataRoom(): void {
//     this.isLoadingDocuments.set(true);
//     this.documentsError.set(null);

//     this.dataRoomService
//       .getOrCreateDataRoom()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (dataRoom) => {
//           this.dataRoom.set(dataRoom);
//           this.loadDataRoomData(dataRoom.id);
//         },
//         error: (error) => {
//           console.error('❌ Failed to initialize data room:', error);
//           this.documentsError.set('Failed to load data room');
//           this.isLoadingDocuments.set(false);
//         },
//       });
//   }

//   /**
//    * Load all data room related data in parallel
//    */
//   private loadDataRoomData(dataRoomId: string): void {
//     const requests = {
//       documents: this.documentService.getAllDocuments(dataRoomId),
//       shares: this.sharingService.getActiveShares(dataRoomId),
//     };

//     // Add funder-specific requests
//     if (this.userType() === 'funder') {
//       forkJoin({
//         ...requests,
//         received: this.sharingService.getReceivedShares(),
//         incoming: this.sharingService.getIncomingRequests(),
//       })
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: (data) => {
//             this.dataRoomDocuments.set(data.documents);
//             this.activeShares.set(data.shares);
//             this.receivedShares.set(data.received);
//             this.incomingRequests.set(data.incoming);
//             this.isLoadingDocuments.set(false);
//           },
//           error: (error) => {
//             console.error('❌ Failed to load data room data:', error);
//             this.documentsError.set('Failed to load data');
//             this.isLoadingDocuments.set(false);
//           },
//         });
//     } else {
//       // SME requests
//       forkJoin({
//         ...requests,
//         incoming: this.sharingService.getIncomingRequests(),
//       })
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: (data) => {
//             this.dataRoomDocuments.set(data.documents);
//             this.activeShares.set(data.shares);
//             this.incomingRequests.set(data.incoming);
//             this.isLoadingDocuments.set(false);
//           },
//           error: (error) => {
//             console.error('❌ Failed to load data room data:', error);
//             this.documentsError.set('Failed to load data');
//             this.isLoadingDocuments.set(false);
//           },
//         });
//     }

//     // Track page view
//     this.accessService
//       .trackSectionView('landing', dataRoomId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe();
//   }

//   // ===================================
//   // ACTIONS
//   // ===================================

//   /**
//    * Navigate to full data room view
//    */
//   navigateToFullDataRoom(): void {
//     const dataRoom = this.dataRoom();
//     if (!dataRoom) {
//       this.showComingSoonModal('Full Data Room View');
//       return;
//     }

//     // Navigate to full data room
//     this.router.navigate(['/data-room', dataRoom.id]);
//   }

//   /**
//    * View document details and track access
//    */
//   viewDocument(documentId: string): void {
//     const dataRoom = this.dataRoom();
//     if (!dataRoom) return;

//     // Track document view
//     this.accessService
//       .trackDocumentView(documentId, dataRoom.id)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe();

//     // Get document and download
//     this.documentService
//       .downloadDocument(documentId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (blob) => {
//           const url = window.URL.createObjectURL(blob);
//           const link = document.createElement('a');
//           link.href = url;
//           link.download = 'document';
//           link.click();
//           window.URL.revokeObjectURL(url);
//         },
//         error: (error) => {
//           console.error('❌ Download failed:', error);
//           this.modalService.showError(
//             'Download Failed',
//             'Could not download document',
//             error.message
//           );
//         },
//       });
//   }

//   /**
//    * Generate document (coming soon)
//    */
//   generateDocument(docType: string): void {
//     this.showComingSoonModal(`${docType} Generation`);
//   }

//   /**
//    * Search organizations (coming soon)
//    */
//   searchOrganizations(): void {
//     const query = this.searchQuery();
//     if (!query.trim()) return;

//     this.showComingSoonModal('Organization Search');
//   }

//   /**
//    * View shared data room
//    */
//   viewDataRoom(dataRoomId: string): void {
//     this.router.navigate(['/data-room', dataRoomId]);
//   }

//   // ===================================
//   // UI HELPERS
//   // ===================================

//   /**
//    * Show coming soon modal
//    */
//   private showComingSoonModal(feature: string): void {
//     this.modalService.showInfo(
//       'Coming Soon',
//       `${feature} will be available soon`
//     );
//   }

//   /**
//    * Get document icon based on mime type
//    */

//   /**
//    * Get document icon color based on mime type
//    */

//   /**
//    * Get icon color class for generated documents
//    */
//   getDocIconColor(color: string): string {
//     const colors: Record<string, string> = {
//       teal: 'bg-teal-100 text-teal-600',
//       green: 'bg-green-100 text-green-600',
//       purple: 'bg-purple-100 text-purple-600',
//       orange: 'bg-orange-100 text-orange-600',
//     };
//     return colors[color] || 'bg-slate-100 text-slate-600';
//   }

//   /**
//    * Get status color for shares
//    */
//   getStatusColor(status: string): string {
//     const colors: Record<string, string> = {
//       active: 'bg-green-100 text-green-700',
//       pending: 'bg-amber-100 text-amber-700',
//       expired: 'bg-red-100 text-red-700',
//       revoked: 'bg-slate-100 text-slate-700',
//     };
//     return colors[status] || 'bg-slate-100 text-slate-700';
//   }

//   /**
//    * Format date relative to now
//    */
//   formatDate(date: Date): string {
//     const now = new Date();
//     const diff = now.getTime() - date.getTime();
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));

//     if (days === 0) return 'Today';
//     if (days === 1) return 'Yesterday';
//     if (days < 7) return `${days} days ago`;
//     return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
//   }

//   /**
//    * Format upload date
//    */
//   formatUploadDate(dateString: string): string {
//     return this.formatDate(new Date(dateString));
//   }

//   /**
//    * Format file size
//    */

//   // In data-room-landing.component.ts

//   // Update helper methods to handle undefined:

//   getDocumentIcon(mimeType?: string): any {
//     if (!mimeType) return this.FileTextIcon;
//     if (mimeType.includes('pdf')) return this.FileTextIcon;
//     if (mimeType.includes('word') || mimeType.includes('document'))
//       return this.FileTextIcon;
//     if (mimeType.includes('sheet') || mimeType.includes('excel'))
//       return this.TrendingUpIcon;
//     if (mimeType.includes('image')) return this.EyeIcon;
//     return this.FileTextIcon;
//   }

//   getDocumentIconColor(mimeType?: string): string {
//     if (!mimeType) return 'bg-slate-100 text-slate-600';
//     if (mimeType.includes('pdf')) return 'bg-red-100 text-red-600';
//     if (mimeType.includes('word') || mimeType.includes('document'))
//       return 'bg-teal-100 text-teal-600';
//     if (mimeType.includes('sheet') || mimeType.includes('excel'))
//       return 'bg-green-100 text-green-600';
//     if (mimeType.includes('image')) return 'bg-purple-100 text-purple-600';
//     return 'bg-slate-100 text-slate-600';
//   }

//   formatFileSize(bytes?: number): string {
//     if (!bytes || bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }
// }
