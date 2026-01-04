// src/app/admin/ai-management/ai-services-registry.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  AiServicesService,
  AiService,
  AiServiceSummary,
} from '../services/ai-services.service';
import {
  LucideAngularModule,
  Sparkles,
  Zap,
  FileText,
  Activity,
  Search,
  RefreshCw,
  AlertCircle,
} from 'lucide-angular';

@Component({
  selector: 'app-ai-services-registry',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="max-w-7xl mx-auto px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-slate-900">
              AI Services Registry
            </h1>
            <p class="text-sm text-slate-600 mt-1">
              Manage AI edge functions, prompts, and analysis services
            </p>
          </div>

          <button
            (click)="refreshServices()"
            [disabled]="aiService.isLoading()"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
            Refresh
          </button>
        </div>

        <!-- Summary Stats -->
        @if (summary()) {
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide"
                >
                  Total Services
                </p>
                <p class="text-2xl font-bold text-slate-900 mt-1">
                  {{ summary()!.totalServices }}
                </p>
              </div>
              <div
                class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center"
              >
                <lucide-icon
                  [img]="SparklesIcon"
                  [size]="20"
                  class="text-slate-600"
                />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide"
                >
                  Active
                </p>
                <p class="text-2xl font-bold text-green-600 mt-1">
                  {{ summary()!.activeServices }}
                </p>
              </div>
              <div
                class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
              >
                <lucide-icon
                  [img]="ActivityIcon"
                  [size]="20"
                  class="text-green-600"
                />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide"
                >
                  Inactive
                </p>
                <p class="text-2xl font-bold text-red-600 mt-1">
                  {{ summary()!.inactiveServices }}
                </p>
              </div>
              <div
                class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"
              >
                <lucide-icon
                  [img]="AlertCircleIcon"
                  [size]="20"
                  class="text-red-600"
                />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide"
                >
                  With Grounding
                </p>
                <p class="text-2xl font-bold text-blue-600 mt-1">
                  {{ summary()!.servicesWithGrounding }}
                </p>
              </div>
              <div
                class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
              >
                <lucide-icon
                  [img]="SearchIcon"
                  [size]="20"
                  class="text-blue-600"
                />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide"
                >
                  Dual Mode
                </p>
                <p class="text-2xl font-bold text-purple-600 mt-1">
                  {{ summary()!.dualModeServices }}
                </p>
              </div>
              <div
                class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
              >
                <lucide-icon
                  [img]="ZapIcon"
                  [size]="20"
                  class="text-purple-600"
                />
              </div>
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Error State -->
      @if (aiService.error()) {
      <div
        class="mb-6 p-4 bg-red-50 border border-red-200/50 rounded-xl flex items-start space-x-3"
      >
        <lucide-icon
          [img]="AlertCircleIcon"
          [size]="20"
          class="text-red-600 flex-shrink-0 mt-0.5"
        />
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-red-900">
            Error Loading Services
          </h4>
          <p class="text-xs text-red-700 mt-1">{{ aiService.error() }}</p>
        </div>
        <button
          (click)="aiService.clearError()"
          class="text-xs text-red-700 hover:text-red-900 font-medium"
        >
          Dismiss
        </button>
      </div>
      }

      <!-- Loading State -->
      @if (aiService.isLoading() && services().length === 0) {
      <div
        class="bg-white rounded-2xl border border-slate-200 p-12 text-center"
      >
        <div
          class="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
        ></div>
        <p class="text-sm text-slate-600">Loading AI services...</p>
      </div>
      }

      <!-- Services List -->
      @if (!aiService.isLoading() || services().length > 0) { @if
      (services().length === 0) {
      <div
        class="bg-white rounded-2xl border border-slate-200 p-12 text-center"
      >
        <lucide-icon
          [img]="SparklesIcon"
          [size]="48"
          class="text-slate-300 mx-auto mb-4"
        />
        <h3 class="text-lg font-semibold text-slate-900 mb-2">
          No AI Services Found
        </h3>
        <p class="text-sm text-slate-600">
          AI services will appear here once configured.
        </p>
      </div>
      } @else {
      <div class="space-y-4">
        @for (service of filteredServices(); track service.id) {
        <div
          class="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
          (click)="viewService(service.id)"
        >
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-slate-900">
                    {{ service.displayName }}
                  </h3>

                  <!-- Status Badge -->
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-semibold border"
                    [class]="aiService.getStatusColor(service.isActive)"
                  >
                    {{ service.isActive ? 'Active' : 'Inactive' }}
                  </span>

                  <!-- Category Badge -->
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-semibold border"
                    [class]="aiService.getCategoryColor(service.category)"
                  >
                    {{ service.category }}
                  </span>
                </div>

                <p class="text-sm text-slate-600 leading-relaxed">
                  {{ service.description }}
                </p>
              </div>

              <!-- Service Icon -->
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-4"
                [class]="aiService.getCategoryColor(service.category)"
              >
                <lucide-icon
                  [img]="getServiceIcon(service.category)"
                  [size]="24"
                />
              </div>
            </div>

            <!-- Metadata Grid -->
            <div
              class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100"
            >
              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">
                  Edge Function
                </p>
                <p class="text-sm text-slate-900 font-mono">
                  {{ service.edgeFunctionName }}
                </p>
              </div>

              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">Model</p>
                <p class="text-sm text-slate-900">{{ service.modelUsed }}</p>
              </div>

              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">Version</p>
                <p class="text-sm text-slate-900">
                  {{ service.currentVersion }}
                </p>
              </div>

              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">
                  Features
                </p>
                <div class="flex items-center space-x-2 text-xs">
                  @if (service.usesGrounding) {
                  <span
                    class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg font-medium"
                    >Grounding</span
                  >
                  } @if (service.hasDualMode) {
                  <span
                    class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg font-medium"
                    >Dual Mode</span
                  >
                  }
                </div>
              </div>
            </div>

            <!-- Summary -->
            @if (service.promptSummary) {
            <div class="mt-4 pt-4 border-t border-slate-100">
              <p class="text-xs text-slate-600">
                <span class="font-semibold">Prompt Summary:</span>
                {{ service.promptSummary }}
              </p>
            </div>
            }
          </div>
        </div>
        }
      </div>
      } }
    </div>
  `,
})
export class AiServicesRegistryComponent implements OnInit {
  aiService = inject(AiServicesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Icons
  SparklesIcon = Sparkles;
  ZapIcon = Zap;
  FileTextIcon = FileText;
  ActivityIcon = Activity;
  SearchIcon = Search;
  RefreshCwIcon = RefreshCw;
  AlertCircleIcon = AlertCircle;

  // State
  services = signal<AiService[]>([]);
  summary = signal<AiServiceSummary | null>(null);
  searchQuery = signal('');

  // Computed
  filteredServices = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.services();

    return this.services().filter(
      (s) =>
        s.displayName.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.serviceName.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadServices();
    this.loadSummary();
  }

  private loadServices() {
    this.aiService.getServices().subscribe({
      next: (services) => {
        this.services.set(services);
      },
      error: (error) => {
        console.error('Failed to load services:', error);
      },
    });
  }

  private loadSummary() {
    this.aiService.getServiceSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
      },
      error: (error) => {
        console.error('Failed to load summary:', error);
      },
    });
  }

  refreshServices() {
    this.loadServices();
    this.loadSummary();
  }

  viewService(serviceId: string) {
    // Navigate to detail page using absolute path
    this.router.navigate(['/administrator/ai-management/services', serviceId]);
  }

  getServiceIcon(category: string): any {
    const icons: Record<string, any> = {
      intelligence: this.SearchIcon,
      analysis: this.ZapIcon,
      generation: this.FileTextIcon,
    };
    return icons[category] || this.SparklesIcon;
  }
}
