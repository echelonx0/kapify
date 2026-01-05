// kapify-academy.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  LucideAngularModule,
  Play,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Award,
  Download,
  ExternalLink,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/services/production.auth.service';

interface VideoResource {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  youtubeId: string;
  thumbnailUrl: string;
  views: string;
  forUserType: ('sme' | 'funder' | 'both')[];
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'template' | 'webinar' | 'article';
  icon: any;
  color: string;
  downloadUrl?: string;
  externalUrl?: string;
  duration?: string;
  forUserType: ('sme' | 'funder' | 'both')[];
}

interface Tab {
  id: string;
  label: string;
  icon: any;
  count?: number;
}

@Component({
  selector: 'app-kapify-academy',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kapify-academy.component.html',
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

      .video-thumbnail {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
      }

      .video-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .video-thumbnail:hover img {
        transform: scale(1.05);
      }

      .play-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .video-thumbnail:hover .play-overlay {
        opacity: 1;
      }

      .tab-button {
        padding: 12px 24px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: transparent;
        color: #64748b;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tab-button:hover {
        background: #f8fafc;
        color: #334155;
      }

      .tab-button.active {
        background: #fff;
        border-color: #e2e8f0;
        color: #f97316;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .video-modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 24px;
      }

      .video-modal-content {
        width: 100%;
        max-width: 1200px;
        background: white;
        border-radius: 24px;
        overflow: hidden;
      }

      .video-player {
        width: 100%;
        aspect-ratio: 16 / 9;
        border: none;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
      }
    `,
  ],
})
export class KapifyAcademyComponent implements OnInit {
  // Icons
  PlayIcon = Play;
  BookOpenIcon = BookOpen;
  FileTextIcon = FileText;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  AwardIcon = Award;
  DownloadIcon = Download;
  ExternalLinkIcon = ExternalLink;
  ClockIcon = Clock;
  ArrowRightIcon = ArrowRight;
  SparklesIcon = Sparkles;

  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  // State
  activeTab = signal<string>('videos');
  selectedVideo = signal<VideoResource | null>(null);
  showVideoModal = signal(false);
  currentUser = computed(() => this.authService.user());
  userType = computed(() => this.currentUser()?.userType || 'sme');

  // Tabs
  tabs: Tab[] = [
    { id: 'videos', label: 'Video Library', icon: this.PlayIcon },
    { id: 'guides', label: 'Guides & Templates', icon: this.FileTextIcon },
    { id: 'webinars', label: 'Webinars', icon: this.UsersIcon },
    { id: 'courses', label: 'Courses', icon: this.AwardIcon },
  ];

  // Videos - Dynamic based on user type
  private allVideos: VideoResource[] = [
    // SME Videos
    {
      id: '1',
      title: 'How to Write a Winning Grant Proposal',
      description:
        'Learn the essential elements of a successful grant proposal from industry experts.',
      duration: '12:34',
      category: 'Funding Tips',
      youtubeId: 'IUIUB72nSKs',
      thumbnailUrl: 'https://img.youtube.com/vi/IUIUB72nSKs/mqdefault.jpg',
      views: '2.3k',
      forUserType: ['sme', 'both'],
    },
    {
      id: '2',
      title: 'Complete Your Business Profile for Success',
      description:
        'A step-by-step guide to completing your business profile effectively.',
      duration: '8:45',
      category: 'Business Planning',
      youtubeId: 'XtyH-WHoals',
      thumbnailUrl: 'https://img.youtube.com/vi/XtyH-WHoals/mqdefault.jpg',
      views: '1.8k',
      forUserType: ['sme', 'both'],
    },
    {
      id: '3',
      title: 'Creating a Compelling Pitch Deck',
      description:
        'Discover what investors want to see in your pitch deck presentation.',
      duration: '10:18',
      category: 'Pitch Deck',
      youtubeId: 'IUIUB72nSKs',
      thumbnailUrl: 'https://img.youtube.com/vi/IUIUB72nSKs/mqdefault.jpg',
      views: '3.1k',
      forUserType: ['sme', 'both'],
    },

    // Funder Videos
    {
      id: '4',
      title: 'Due Diligence Best Practices',
      description:
        'Learn how to conduct thorough due diligence on potential investments.',
      duration: '15:22',
      category: 'Investment Strategy',
      youtubeId: 'XtyH-WHoals',
      thumbnailUrl: 'https://img.youtube.com/vi/XtyH-WHoals/mqdefault.jpg',
      views: '5.2k',
      forUserType: ['funder', 'both'],
    },
    {
      id: '5',
      title: 'Portfolio Management for Impact Investors',
      description:
        'Strategies for building and managing a diversified investment portfolio.',
      duration: '18:45',
      category: 'Portfolio Management',
      youtubeId: 'IUIUB72nSKs',
      thumbnailUrl: 'https://img.youtube.com/vi/IUIUB72nSKs/mqdefault.jpg',
      views: '4.7k',
      forUserType: ['funder', 'both'],
    },
    {
      id: '6',
      title: 'Evaluating Financial Statements',
      description:
        'Master the art of analyzing SME financial statements for investment decisions.',
      duration: '13:30',
      category: 'Financial Analysis',
      youtubeId: 'XtyH-WHoals',
      thumbnailUrl: 'https://img.youtube.com/vi/XtyH-WHoals/mqdefault.jpg',
      views: '6.1k',
      forUserType: ['funder', 'both'],
    },
  ];

  // Resources - Dynamic based on user type
  private allResources: Resource[] = [
    // SME Resources
    {
      id: 'r1',
      title: 'Business Plan Template',
      description:
        'Professional business plan template with all essential sections',
      type: 'template',
      icon: this.FileTextIcon,
      color: 'blue',
      downloadUrl: '/assets/templates/business-plan.docx',
      forUserType: ['sme', 'both'],
    },
    {
      id: 'r2',
      title: 'Financial Projection Spreadsheet',
      description:
        '3-year financial projection model with automatic calculations',
      type: 'template',
      icon: this.TrendingUpIcon,
      color: 'green',
      downloadUrl: '/assets/templates/financial-projections.xlsx',
      forUserType: ['sme', 'both'],
    },
    {
      id: 'r3',
      title: 'Pitch Deck Guide',
      description: 'Complete guide to creating investor-ready pitch decks',
      type: 'guide',
      icon: this.BookOpenIcon,
      color: 'purple',
      externalUrl: '/guides/pitch-deck',
      forUserType: ['sme', 'both'],
    },
    {
      id: 'r4',
      title: 'Grant Application Checklist',
      description: 'Never miss a requirement with our comprehensive checklist',
      type: 'guide',
      icon: this.AwardIcon,
      color: 'orange',
      downloadUrl: '/assets/guides/grant-checklist.pdf',
      forUserType: ['sme', 'both'],
    },

    // Funder Resources
    {
      id: 'r5',
      title: 'Due Diligence Checklist',
      description:
        'Comprehensive checklist for evaluating investment opportunities',
      type: 'template',
      icon: this.FileTextIcon,
      color: 'blue',
      downloadUrl: '/assets/templates/due-diligence.xlsx',
      forUserType: ['funder', 'both'],
    },
    {
      id: 'r6',
      title: 'Investment Committee Report Template',
      description:
        'Standardized template for presenting deals to your committee',
      type: 'template',
      icon: this.UsersIcon,
      color: 'purple',
      downloadUrl: '/assets/templates/ic-report.docx',
      forUserType: ['funder', 'both'],
    },
    {
      id: 'r7',
      title: 'Financial Analysis Framework',
      description: 'Step-by-step framework for analyzing SME financials',
      type: 'guide',
      icon: this.TrendingUpIcon,
      color: 'green',
      externalUrl: '/guides/financial-analysis',
      forUserType: ['funder', 'both'],
    },
  ];

  // Computed filtered content
  // Computed filtered content
  videos = computed(() => {
    const type = this.userType() as 'sme' | 'funder';
    return this.allVideos.filter(
      (v) => v.forUserType.includes(type) || v.forUserType.includes('both')
    );
  });

  resources = computed(() => {
    const type = this.userType() as 'sme' | 'funder';
    return this.allResources.filter(
      (r) => r.forUserType.includes(type) || r.forUserType.includes('both')
    );
  });

  stats = computed(() => {
    if (this.userType() === 'sme') {
      return [
        { label: 'Video Courses', value: '12+', icon: this.PlayIcon },
        { label: 'Templates', value: '25+', icon: this.FileTextIcon },
        { label: 'Success Rate', value: '87%', icon: this.TrendingUpIcon },
      ];
    } else {
      return [
        { label: 'Expert Content', value: '15+', icon: this.PlayIcon },
        { label: 'Resources', value: '30+', icon: this.FileTextIcon },
        { label: 'Active Users', value: '250+', icon: this.UsersIcon },
      ];
    }
  });

  welcomeMessage = computed(() => {
    if (this.userType() === 'sme') {
      return {
        title: 'Kapify Academy',
        subtitle:
          'Learn everything you need to secure funding and grow your business',
      };
    } else {
      return {
        title: 'Kapify Academy',
        subtitle:
          'Master investment strategies and due diligence best practices',
      };
    }
  });

  ngOnInit() {
    // Auto-select first video
    const videos = this.videos();
    if (videos.length > 0) {
      this.selectedVideo.set(videos[0]);
    }
  }

  selectTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  selectVideo(video: VideoResource) {
    this.selectedVideo.set(video);
    this.showVideoModal.set(true);
  }

  closeVideoModal() {
    this.showVideoModal.set(false);
  }

  getVideoEmbedUrl(youtubeId: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getResourceIconColor(color: string): string {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
    };
    return colors[color] || 'bg-slate-100 text-slate-600';
  }

  downloadResource(resource: Resource) {
    if (resource.downloadUrl) {
      window.open(resource.downloadUrl, '_blank');
    }
  }

  openExternalResource(resource: Resource) {
    if (resource.externalUrl) {
      window.open(resource.externalUrl, '_blank');
    }
  }
}
