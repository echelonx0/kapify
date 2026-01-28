// src/app/data-room/components/data-room-landing.component.ts
import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
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
  AlertCircle,
  Zap,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import {
  OrgCreditService,
  OrgWallet,
} from 'src/app/shared/services/credit.service';
import {
  DocumentMetadata,
  SupabaseDocumentService,
} from 'src/app/shared/services/supabase-document.service';
import { PurchaseCreditsModalComponent } from 'src/app/core/dashboard/finance/credits/purchase-credits-modal.component';
import { CostConfirmationModalComponent } from 'src/app/core/dashboard/finance/cost-confirmation-modal.component';

// Cost model for data room actions
const ACTION_COSTS: Record<string, number> = {
  view: 10,
  generate: 50,
  share: 20,
  download: 15,
};

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

interface CostConfirmation {
  action: string;
  cost: number;
  isOpen: boolean;
  actionId?: string;
}

@Component({
  selector: 'app-data-room-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    PurchaseCreditsModalComponent,
    CostConfirmationModalComponent,
  ],
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

      .cost-modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 1rem;
      }

      .cost-modal-content {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      }
    `,
  ],
})
export class DataRoomLandingComponent implements OnInit, OnDestroy {
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
  AlertIcon = AlertCircle;
  ZapIcon = Zap;

  private authService = inject(AuthService);
  private documentService = inject(SupabaseDocumentService);
  private router = inject(Router);
  private creditService = inject(OrgCreditService);
  private destroy$ = new Subject<void>();

  // Organization ID for purchase modal
  orgId = computed(() => this.authService.getCurrentUserOrganizationId() || '');

  // State
  searchQuery = signal('');
  currentUser = computed(() => this.authService.user());
  userType = computed(() => this.currentUser()?.userType || 'sme');

  // Credits
  wallet = signal<OrgWallet | null>(null);
  isLoadingWallet = signal(false);
  showPurchaseModal = signal(false);

  // Cost confirmation modal
  costConfirmation = signal<CostConfirmation>({
    action: '',
    cost: 0,
    isOpen: false,
  });

  // UI Signals
  isLoadingDocuments = signal(false);
  documentsError = signal<string | null>(null);
  userDocuments = signal<DocumentMetadata[]>([]);

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

  hasEnoughCredits = computed(() => {
    const balance = this.wallet()?.balance || 0;
    return balance > 0;
  });

  creditsFormatted = computed(() => {
    const balance = this.wallet()?.balance || 0;
    return balance.toLocaleString('en-ZA');
  });

  ngOnInit() {
    // this.loadWallet();
    this.fetchUserDocuments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWallet() {
    this.isLoadingWallet.set(true);
    const orgId = this.authService.getCurrentUserOrganizationId();

    if (!orgId) {
      this.isLoadingWallet.set(false);
      return;
    }

    this.creditService
      .getOrCreateOrgWallet(orgId)
      .then((wallet) => {
        this.wallet.set(wallet);
        this.isLoadingWallet.set(false);
      })
      .catch((err) => {
        console.error('Failed to load wallet:', err);
        this.isLoadingWallet.set(false);
      });
  }

  private fetchUserDocuments(): void {
    this.isLoadingDocuments.set(true);
    this.documentsError.set(null);

    this.documentService.getDocumentsByUser().subscribe({
      next: (docMap) => {
        const docs = Array.from(docMap.values());
        this.userDocuments.set(docs);
        this.isLoadingDocuments.set(false);
      },
      error: (err) => {
        console.error('Failed to load user documents:', err);
        this.documentsError.set(err.message || 'Failed to load documents');
        this.isLoadingDocuments.set(false);
      },
    });
  }

  // Credit-gated action handler
  private requestAction(actionType: string, actionId?: string) {
    const cost = ACTION_COSTS[actionType] || 0;
    const balance = this.wallet()?.balance || 0;

    if (balance < cost) {
      this.costConfirmation.set({
        action: actionType,
        cost,
        isOpen: true,
        actionId,
      });
      return false;
    }

    return true;
  }

  confirmAndExecute() {
    const confirmation = this.costConfirmation();
    if (
      confirmation.isOpen &&
      this.requestAction(confirmation.action, confirmation.actionId)
    ) {
      this.executeAction(confirmation.action, confirmation.actionId);
      this.closeCostModal();
    }
  }

  private executeAction(action: string, actionId?: string) {
    switch (action) {
      case 'view':
        this.viewDocument(actionId || '');
        break;
      case 'generate':
        this.generateDocument(actionId || '');
        break;
      case 'share':
        this.shareDataRoom();
        break;
      case 'download':
        this.downloadResource(actionId || '');
        break;
    }
  }

  closeCostModal() {
    this.costConfirmation.set({
      ...this.costConfirmation(),
      isOpen: false,
    });
  }

  openPurchaseFromModal() {
    this.closeCostModal();
    this.showPurchaseModal.set(true);
  }

  closePurchaseModal() {
    this.showPurchaseModal.set(false);
    this.loadWallet();
  }

  // Actions with credit gating
  navigateToFullDataRoom() {
    if (this.requestAction('view')) {
      // this.router.navigate(['/data-room/full']);
    }
  }

  generateDocument(docType: string) {
    if (this.requestAction('generate', docType)) {
      console.log('Generating:', docType);
    }
  }

  viewDocument(documentKey: string) {
    if (this.requestAction('view', documentKey)) {
      console.log('Viewing document:', documentKey);
      this.documentService.downloadDocumentByKey(documentKey).subscribe({
        next: () => console.log('Download initiated'),
        error: (err) => console.error('Download failed:', err),
      });
    }
  }

  shareDataRoom() {
    if (this.requestAction('share')) {
      console.log('Sharing data room');
    }
  }

  managePermissions() {
    console.log('Managing permissions');
  }

  generateResource() {
    if (this.requestAction('generate')) {
      console.log('Generating resource');
    }
  }

  searchOrganizations() {
    const query = this.searchQuery();
    if (query.trim()) {
      console.log('Searching for:', query);
    }
  }

  downloadResource(resourceId: string) {
    if (this.requestAction('download', resourceId)) {
      console.log('Downloading:', resourceId);
    }
  }

  requestAccess(companyName: string) {
    if (this.requestAction('view')) {
      console.log('Requesting access to:', companyName);
    }
  }

  viewDataRoom(dataRoomId: string) {
    if (this.requestAction('view', dataRoomId)) {
      this.router.navigate(['/data-room', dataRoomId]);
    }
  }

  // Formatters
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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUploadDate(dateString: string): string {
    return this.formatDate(new Date(dateString));
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
      active: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      expired: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  }

  formatTransactionAmount(amount: number): string {
    return amount.toLocaleString('en-ZA');
  }
}
