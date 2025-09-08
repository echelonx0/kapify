// learning-resources.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideAngularModule, Play, Filter } from 'lucide-angular';

interface VideoResource {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: VideoCategory;
  youtubeId: string;
  thumbnailUrl: string;
  views: string;
}

type VideoCategory = 'all' | 'funding-tips' | 'business-planning' | 'pitch-deck' | 'financial-planning' | 'application-process';

interface CategoryConfig {
  id: VideoCategory;
  label: string;
  color: string;
}

@Component({
  selector: 'app-learning-resources',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="learning-resources-container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="header-title">Learning Resources</h1>
        <p class="header-subtitle">Watch expert-led videos to help you succeed in your funding journey</p>
      </div>

      <!-- Main Layout -->
      <div class="resources-layout">
        <!-- Left Sidebar -->
        <div class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-title-container">
              <lucide-icon [img]="PlayIcon" [size]="20" class="title-icon"></lucide-icon>
              <h2 class="sidebar-title">Video Library</h2>
            </div>
            
            <div class="category-filter">
              @for (category of categories; track category.id) {
                <button 
                  class="category-button"
                  [class.active]="selectedCategory() === category.id"
                  (click)="selectCategory(category.id)"
                >
                  {{ category.label }}
                </button>
              }
            </div>
          </div>

          <div class="video-list">
            @if (filteredVideos().length === 0) {
              <div class="empty-videos">
                <lucide-icon [img]="FilterIcon" [size]="24" class="empty-icon"></lucide-icon>
                <p>No videos in this category</p>
              </div>
            } @else {
              @for (video of filteredVideos(); track video.id) {
                <div 
                  class="video-item"
                  [class.active]="selectedVideo()?.id === video.id"
                  (click)="selectVideo(video)"
                >
                  <div class="video-thumbnail">
                    <img [src]="video.thumbnailUrl" [alt]="video.title + ' thumbnail'">
                    <span class="video-duration">{{ video.duration }}</span>
                    <div class="play-overlay">
                      <lucide-icon [img]="PlayIcon" [size]="16"></lucide-icon>
                    </div>
                  </div>
                  
                  <div class="video-info">
                    <h3 class="video-title">{{ video.title }}</h3>
                    <div class="video-meta">
                      <span class="category-tag" [attr.data-category]="video.category">
                        {{ getCategoryLabel(video.category) }}
                      </span>
                      <span class="meta-separator">•</span>
                      <span class="view-count">{{ video.views }} views</span>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- Right Panel -->
        <div class="video-panel">
          @if (selectedVideo(); as video) {
            <div class="video-player-container">
              <iframe 
                class="video-player"
                [src]="getVideoEmbedUrl(video.youtubeId)"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
              </iframe>
            </div>

            <div class="video-details">
              <h2 class="video-details-title">{{ video.title }}</h2>
              <div class="video-details-meta">
                <span class="category-tag" [attr.data-category]="video.category">
                  {{ getCategoryLabel(video.category) }}
                </span>
                <span class="meta-separator">•</span>
                <span class="duration">{{ video.duration }} duration</span>
                <span class="meta-separator">•</span>
                <span class="views">{{ video.views }} views</span>
              </div>
              <div class="video-details-description">
                {{ video.description }}
              </div>
            </div>
          } @else {
            <div class="empty-state">
              <div class="empty-icon">
                <lucide-icon [img]="PlayIcon" [size]="32"></lucide-icon>
              </div>
              <h3 class="empty-title">Select a video to start watching</h3>
              <p class="empty-description">Choose from our curated collection of funding and business resources</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./learning-resources.component.css']
})
export class LearningResourcesComponent {
  // Icons
  PlayIcon = Play;
  FilterIcon = Filter;

  // State
  selectedCategory = signal<VideoCategory>('all');
  selectedVideo = signal<VideoResource | null>(null);

  // Categories configuration
  categories: CategoryConfig[] = [
    { id: 'all', label: 'All', color: 'neutral' },
    { id: 'funding-tips', label: 'Funding Tips', color: 'blue' },
    { id: 'business-planning', label: 'Business Planning', color: 'green' },
    { id: 'application-process', label: 'Application Process', color: 'purple' },
    { id: 'pitch-deck', label: 'Pitch Deck', color: 'orange' }
  ];

  // Sample video data - replace with your actual content
  videos: VideoResource[] = [
    {
      id: '1',
      title: 'How to Write a Winning Grant Proposal',
      description: 'Learn the essential elements of a successful grant proposal from industry experts. This comprehensive guide covers everything from research and planning to writing techniques that capture funders\' attention and demonstrate your project\'s value and impact.',
      duration: '12:34',
      category: 'funding-tips',
      youtubeId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      views: '2.3k'
    },
    {
      id: '2',
      title: 'Complete Your Business Profile for Success',
      description: 'A step-by-step guide to completing your business profile effectively. Understand what funders are looking for and how to present your business in the best possible light to increase your chances of funding approval.',
      duration: '8:45',
      category: 'business-planning',
      youtubeId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      views: '1.8k'
    },
    {
      id: '3',
      title: 'Navigating the Application Process',
      description: 'Master the funding application process with expert tips and insider knowledge. Learn how to avoid common pitfalls, prepare required documents, and manage your application timeline effectively.',
      duration: '15:22',
      category: 'application-process',
      youtubeId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      views: '5.2k'
    },
    {
      id: '4',
      title: 'Creating a Compelling Pitch Deck',
      description: 'Discover what investors and funders want to see in your pitch deck. Learn the essential slides, design principles, and storytelling techniques that make your presentation stand out from the competition.',
      duration: '10:18',
      category: 'pitch-deck',
      youtubeId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      views: '3.1k'
    },
    {
      id: '5',
      title: 'Understanding Different Types of Funding',
      description: 'Explore the various funding options available to businesses, from grants and loans to equity investment. Understand which type of funding is right for your business stage and goals.',
      duration: '7:33',
      category: 'funding-tips',
      youtubeId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      views: '4.7k'
    }
  ];

  // Computed properties
  filteredVideos = computed(() => {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.videos;
    }
    return this.videos.filter(video => video.category === category);
  });

  constructor(private sanitizer: DomSanitizer) {
    // Auto-select first video on load
    if (this.videos.length > 0) {
      this.selectedVideo.set(this.videos[0]);
    }
  }

  selectCategory(category: VideoCategory): void {
    this.selectedCategory.set(category);
    
    // Auto-select first video in filtered list
    const filtered = this.filteredVideos();
    if (filtered.length > 0) {
      this.selectedVideo.set(filtered[0]);
    } else {
      this.selectedVideo.set(null);
    }
  }

  selectVideo(video: VideoResource): void {
    this.selectedVideo.set(video);
  }

  getCategoryLabel(category: VideoCategory): string {
    const config = this.categories.find(c => c.id === category);
    return config?.label || category;
  }

  getVideoEmbedUrl(youtubeId: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}