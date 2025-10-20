// src/app/SMEs/data-room/data-room.component.ts
import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  LucideAngularModule,
  AlertCircle
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';
import { DataRoomService } from './services/data-room.service';
import { DataRoomDocumentService } from './services/data-room-document.service';
import { DataRoomSharingService } from './services/data-room-sharing.service';
import { DataRoomAccessService } from './services/data-room-access.service';

// Component imports
import { DataRoomHeaderComponent } from './components/data-room-header/data-room-header.component';
import { DataRoomSidebarComponent } from './components/data-room-sidebar/data-room-sidebar.component';
import { ExecutiveSummaryComponent } from './components/sections/executive-summary/executive-summary.component';
import { FinancialDashboardComponent } from './components/sections/financial-dashboard/financial-dashboard.component';
import { DocumentRepositoryComponent } from './components/document-repository/document-repository.component';
import { ManagementTeamComponent } from './components/sections/management-team/management-team.component';
import { LegalComplianceComponent, MarketAnalysisComponent } from './components/sections/market-analysis/market-analysis.component';
import { SharingModalComponent } from './components/sharing/sharing-modal/sharing-modal.component';
import { AccessRequestModalComponent } from './components/sharing/access-request-modal/access-request-modal.component';
import { AccessLogComponent } from './components/access-log/access-log.component';
import { AccessAnalyticsDashboardComponent } from './components/access-analytics/access-analytics-dashboard.component';
import { AccessRequestsListComponent } from './components/sharing/access-request/access-requests-list.component';

import { DataRoom, DataRoomView, UserPermissions, DataRoomSection } from './models/data-room.models';
import { FundingProfileBackendService } from '../SMEs/services/funding-profile-backend.service';
 
@Component({
  selector: 'app-data-room',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DataRoomHeaderComponent,
    DataRoomSidebarComponent,
    ExecutiveSummaryComponent,
    FinancialDashboardComponent,
    DocumentRepositoryComponent,
    ManagementTeamComponent,
    MarketAnalysisComponent,
    LegalComplianceComponent,
    SharingModalComponent,
    AccessRequestModalComponent,
    AccessRequestsListComponent,
    AccessLogComponent,
    AccessAnalyticsDashboardComponent
  ],
  templateUrl: './data-room.component.html',
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: #f8fafc;
    }

    :host ::ng-deep .data-room-content {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class DataRoomComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dataRoomService = inject(DataRoomService);
  private documentService = inject(DataRoomDocumentService);
  private sharingService = inject(DataRoomSharingService);
  private accessService = inject(DataRoomAccessService);
  private profileService = inject(FundingProfileBackendService);

  @ViewChild(SharingModalComponent) sharingModal!: SharingModalComponent;
  @ViewChild(AccessRequestModalComponent) accessRequestModal!: AccessRequestModalComponent;

  // Icons
  AlertCircleIcon = AlertCircle;

  // State Signals
  dataRoomView = signal<DataRoomView | null>(null);
  profileData = signal<any>(null);
  isLoading = signal(false);
  isAIAnalyzing = signal(false);
  error = signal<string | null>(null);
  activeSection = signal<string>('executive');
  
  // Route Params
  dataRoomId = signal<string>('');
  applicantId = signal<string | null>(null);

  // Current User
  currentUser = computed(() => this.authService.user());
  currentUserId = computed(() => this.currentUser()?.id || '');

  // Computed Properties - User Permissions
  permissions = computed<UserPermissions>(() => {
    return this.dataRoomView()?.permissions || {
      canView: false,
      canDownload: false,
      canManage: false,
      canShare: false,
      canExport: false,
      accessibleSections: [],
      accessibleDocumentIds: []
    };
  });

  // Computed Properties - Data Room
  dataRoom = computed(() => this.dataRoomView()?.dataRoom || null);
  
  sections = computed<DataRoomSection[]>(() => {
    return this.dataRoomView()?.sections || [];
  });

  // Computed Properties - Company Info
  companyInfo = computed(() => {
    const profile = this.profileData();
    if (!profile) return null;
    
    return {
      companyName: profile.businessInfo?.companyName || profile.companyInfo?.companyName || '',
      registrationNumber: profile.businessInfo?.registrationNumber || profile.companyInfo?.registrationNumber || '',
      industry: profile.businessInfo?.industry || profile.companyInfo?.industry,
      yearsInOperation: profile.businessInfo?.yearsInOperation || 0,
      description: profile.businessInfo?.companyDescription || profile.companyInfo?.description || ''
    };
  });

  // Computed Properties - Financial Metrics
  financialMetrics = computed(() => {
    const profile = this.profileData();
    if (!profile?.financialInfo && !profile?.financialProfile) return null;
    
    const financial = profile.financialInfo || profile.financialProfile;
    return {
      monthlyRevenue: financial.monthlyRevenue || 0,
      annualRevenue: (financial.monthlyRevenue || 0) * 12,
      monthlyExpenses: financial.monthlyExpenses || financial.monthlyCosts || 0,
      profitMargin: financial.profitMargin || 0,
      projectedGrowth: financial.projectedGrowth || 0,
      ebitda: financial.ebitda || 0,
      currentAssets: financial.currentAssets || 0
    };
  });

  // Computed Properties - Funding Info
  fundingInfo = computed(() => {
    const profile = this.profileData();
    return profile?.fundingInfo || null;
  });

  // Computed Properties - Management Team
  managementTeam = computed(() => {
    const profile = this.profileData();
    if (!profile) return [];
    
    return profile.managementGovernance?.managementTeam || 
           profile.managementStructure?.executiveTeam || [];
  });

  // Computed Properties - Company Name
  companyName = computed(() => {
    return this.companyInfo()?.companyName || '';
  });

  // State - Market Intelligence & Metadata
  marketIntelligence = signal<any>(null);
  documentCounts = signal(new Map<string, number>());
  sectionStatuses = signal(new Map<string, 'complete' | 'pending' | 'missing'>());
  accessStats = signal<any>(null);
  shareInfo = signal<any>(null);

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Subscribe to route params
    this.route.params.subscribe(params => {
      this.applicantId.set(params['applicantId'] || null);
    });

    // Subscribe to query params for section
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.activeSection.set(params['section']);
      }
    });

    this.loadDataRoom();
  }

  async loadDataRoom(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const userId = this.applicantId() || this.currentUserId();
      
      // Get or create data room
      const dataRoom = await this.dataRoomService.getOrCreateDataRoom(userId).toPromise();
      this.dataRoomId.set(dataRoom!.id);

      // Load data room view with permissions
      const view = await this.dataRoomService.getDataRoomView(dataRoom!.id, this.currentUserId()).toPromise();
      this.dataRoomView.set(view!);

      // Load profile data
      const profile = this.applicantId()
        ? await this.profileService.loadSavedProfileForUser(this.applicantId()!).toPromise()
        : await this.profileService.loadSavedProfile().toPromise();
      this.profileData.set(profile);

      // Load document counts
      await this.loadDocumentCounts();

      // Load access stats or share info based on permissions
      if (view!.permissions.canManage) {
        await this.loadAccessStats();
      } else {
        await this.loadShareInfo();
      }

      // Track access
      this.accessService.logAccess({
        dataRoomId: dataRoom!.id,
        actionType: 'view'
      }).subscribe();

    } catch (err: any) {
      console.error('Failed to load data room:', err);
      this.error.set(err.message || 'Failed to load data room');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadDocumentCounts(): Promise<void> {
    try {
      const docs = await this.documentService.getAllDocuments(this.dataRoomId()).toPromise();
      const counts = new Map<string, number>();
      
      docs?.forEach(doc => {
        if (doc.sectionId) {
          counts.set(doc.sectionId, (counts.get(doc.sectionId) || 0) + 1);
        }
      });
      
      this.documentCounts.set(counts);
    } catch (err) {
      console.error('Failed to load document counts:', err);
    }
  }

  private async loadAccessStats(): Promise<void> {
    try {
      const summary = await this.accessService.getAccessSummary(this.dataRoomId()).toPromise();
      this.accessStats.set(summary);
    } catch (err) {
      console.error('Failed to load access stats:', err);
    }
  }

  private async loadShareInfo(): Promise<void> {
    try {
      const status = await this.sharingService.checkAccess(this.dataRoomId(), this.currentUserId()).toPromise();
      this.shareInfo.set(status);
    } catch (err) {
      console.error('Failed to load share info:', err);
    }
  }

  navigateToSection(sectionKey: string): void {
    this.activeSection.set(sectionKey);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: sectionKey },
      queryParamsHandling: 'merge'
    });

    // Track section view
    this.accessService.trackSectionView(sectionKey, this.dataRoomId()).subscribe();
  }

  async enhanceWithAI(): Promise<void> {
    this.isAIAnalyzing.set(true);
    
    try {
      const response = await fetch('/functions/v1/analyze-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisMode: 'market_intelligence',
          businessProfile: this.profileData(),
          enhancedInsights: true
        })
      });

      if (!response.ok) throw new Error('AI analysis failed');
      
      const aiResult = await response.json();
      this.marketIntelligence.set(aiResult);
      
    } catch (err: any) {
      console.error('AI enhancement failed:', err);
      alert('Failed to enhance with AI');
    } finally {
      this.isAIAnalyzing.set(false);
    }
  }

  exportDataRoom(): void {
    const exportData = {
      dataRoom: this.dataRoomView()?.dataRoom,
      profile: this.profileData(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-room-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.accessService.logAccess({
      dataRoomId: this.dataRoomId(),
      actionType: 'export'
    }).subscribe();
  }

  openSharingModal(): void {
    const sections = this.sections();
    this.documentService.getAllDocuments(this.dataRoomId()).subscribe({
      next: (docs) => {
        const availableUsers: any[] = [];
        this.sharingModal.open(this.dataRoomId(), sections, docs, availableUsers);
      }
    });
  }

  onDataRoomShared(): void {
    this.loadAccessStats();
  }

  onAccessRequestSubmitted(): void {
    alert('Access request submitted successfully');
  }

  onModalClosed(): void {
    // Handle modal close if needed
  }

  navigateBack(): void {
    this.router.navigate(['/applications']);
  }
}