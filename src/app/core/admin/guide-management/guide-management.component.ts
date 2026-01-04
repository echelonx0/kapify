import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-angular';
import { GuideService, Guide, GuideStat } from '../services/guide.service';

@Component({
  selector: 'app-guide-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-slate-900">Guides Management</h1>
          <p class="text-slate-600 mt-2">
            Create and manage funding readiness guides
          </p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <p class="text-xs font-semibold text-slate-500 uppercase">
              Total Guides
            </p>
            <p class="text-3xl font-bold text-slate-900 mt-2">
              {{ allGuides().length }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <p class="text-xs font-semibold text-slate-500 uppercase">Active</p>
            <p class="text-3xl font-bold text-teal-600 mt-2">
              {{ activeGuidesCount() }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <p class="text-xs font-semibold text-slate-500 uppercase">
              Categories
            </p>
            <p class="text-3xl font-bold text-slate-900 mt-2">
              {{ categories().length }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <p class="text-xs font-semibold text-slate-500 uppercase">
              Total Views
            </p>
            <p class="text-3xl font-bold text-slate-900 mt-2">
              {{ totalViews() }}
            </p>
          </div>
        </div>

        <!-- Create Guide Form -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 class="text-lg font-bold text-slate-900 mb-6">
            {{ editingId() ? 'Edit Guide' : 'Create New Guide' }}
          </h2>

          <div class="space-y-6">
            <!-- Title & Category Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2"
                  >Title</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.title"
                  placeholder="e.g., The Basics Checklist"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2"
                  >Category</label
                >
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="formData.category"
                    list="categories-list"
                    placeholder="e.g., basics, financial, strategic"
                    class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <datalist id="categories-list">
                    @for (cat of categories(); track cat) {
                    <option [value]="cat">{{ cat }}</option>
                    }
                  </datalist>
                </div>
              </div>
            </div>

            <!-- Icon & Description -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2"
                  >Icon</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.icon"
                  placeholder="e.g., check-square, dollar-sign, chart-bar"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-xs text-slate-600"
                />
                <p class="text-xs text-slate-500 mt-1">Lucide icon name</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2"
                  >Sort Order</label
                >
                <input
                  type="number"
                  [(ngModel)]="formData.sort_order"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Short Description (for card preview)
              </label>
              <textarea
                [(ngModel)]="formData.description"
                rows="2"
                placeholder="Brief description shown on guide cards..."
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              ></textarea>
              <p class="text-xs text-slate-500 mt-1">
                {{ formData.description?.length || 0 }}/150 characters
              </p>
            </div>

            <!-- Content (Markdown) -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Content (Markdown supported)
              </label>
              <textarea
                [(ngModel)]="formData.content"
                rows="10"
                placeholder="Enter guide content in markdown format..."
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
              ></textarea>
              <p class="text-xs text-slate-500 mt-1">
                Supports **bold**, _italic_, # headings, - lists, etc.
              </p>
            </div>

            <!-- Active Toggle -->
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.is_active"
                  class="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span class="text-sm font-semibold text-slate-900">Active</span>
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 pt-4 border-t border-slate-200">
              <button
                (click)="saveGuide()"
                [disabled]="
                  !formData.title || !formData.category || !formData.content
                "
                class="px-6 py-2.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ editingId() ? 'Update' : 'Create' }}
              </button>
              @if (editingId()) {
              <button
                (click)="cancelEdit()"
                class="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              }
            </div>
          </div>
        </div>

        <!-- Guides List -->
        <div
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 class="font-bold text-slate-900">All Guides</h3>
          </div>

          <div class="divide-y divide-slate-200">
            @for (guide of sortedGuides(); track guide.id) {
            <div
              class="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
            >
              <div class="w-1 h-12 bg-teal-500 rounded-full"></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold text-slate-900">
                    {{ guide.title }}
                  </h4>
                  <span
                    class="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold"
                  >
                    {{ guide.category }}
                  </span>
                </div>
                <p class="text-sm text-slate-600 mt-1 line-clamp-1">
                  {{ guide.description }}
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  {{ guide.content.length }} chars | Order:
                  {{ guide.sort_order }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button
                  (click)="toggleActive(guide.id, !guide.is_active)"
                  [class.text-teal-600]="guide.is_active"
                  [class.text-slate-400]="!guide.is_active"
                  class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <lucide-angular
                    [img]="guide.is_active ? Eye : EyeOff"
                    class="w-5 h-5"
                  />
                </button>
                <button
                  (click)="startEdit(guide)"
                  class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <lucide-angular [img]="Edit2" class="w-5 h-5" />
                </button>
                <button
                  (click)="deleteGuide(guide.id)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <lucide-angular [img]="Trash2" class="w-5 h-5" />
                </button>
              </div>
            </div>
            }
          </div>
        </div>

        <!-- Stats Table -->
        @if (stats().length > 0) {
        <div
          class="mt-8 bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 class="font-bold text-slate-900">Guide Statistics</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    class="text-left px-6 py-3 text-xs font-semibold text-slate-600"
                  >
                    Guide
                  </th>
                  <th
                    class="text-left px-6 py-3 text-xs font-semibold text-slate-600"
                  >
                    Category
                  </th>
                  <th
                    class="text-left px-6 py-3 text-xs font-semibold text-slate-600"
                  >
                    Views
                  </th>
                  <th
                    class="text-left px-6 py-3 text-xs font-semibold text-slate-600"
                  >
                    Last Viewed
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                @for (stat of stats(); track stat.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-6 py-3 text-sm font-medium text-slate-900">
                    {{ stat.title }}
                  </td>
                  <td class="px-6 py-3 text-sm text-slate-600">
                    {{ stat.category }}
                  </td>
                  <td class="px-6 py-3 text-sm font-semibold text-slate-900">
                    {{ stat.total_views }}
                  </td>
                  <td class="px-6 py-3 text-sm text-slate-500">
                    {{
                      stat.last_viewed_at
                        ? (stat.last_viewed_at | date : 'short')
                        : '—'
                    }}
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class GuideManagementComponent implements OnInit {
  private guideService = inject(GuideService);

  readonly editingId = signal<string | null>(null);
  readonly allGuides = signal<Guide[]>([]);
  readonly stats = signal<GuideStat[]>([]);

  readonly categories = computed(() => {
    const cats = new Set(this.allGuides().map((g) => g.category));
    return Array.from(cats).sort();
  });

  readonly sortedGuides = computed(() =>
    [...this.allGuides()].sort((a, b) => a.sort_order - b.sort_order)
  );

  // Computed stats
  readonly activeGuidesCount = computed(
    () => this.allGuides().filter((g) => g.is_active).length
  );

  readonly totalViews = computed(() =>
    this.stats().reduce((sum, stat) => sum + (stat.total_views || 0), 0)
  );

  // Icon imports for template
  Plus = Plus;
  Edit2 = Edit2;
  Trash2 = Trash2;
  Eye = Eye;
  EyeOff = EyeOff;

  formData: Partial<Guide> = {
    title: '',
    description: '',
    icon: 'book',
    category: '',
    content: '',
    sort_order: 0,
    is_active: true,
  };

  async ngOnInit() {
    await this.loadGuides();
    await this.loadStats();
  }

  private async loadGuides() {
    try {
      const guides = await this.guideService.getGuidesForAdmin();
      this.allGuides.set(guides);
    } catch (err) {
      console.error('Failed to load guides:', err);
    }
  }

  private async loadStats() {
    try {
      const stats = await this.guideService.getGuideStats();
      this.stats.set(stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async saveGuide() {
    if (
      !this.formData.title ||
      !this.formData.category ||
      !this.formData.content
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (this.editingId()) {
        await this.guideService.updateGuide(this.editingId()!, {
          ...this.formData,
        } as any);
      } else {
        await this.guideService.createGuide(this.formData as any);
      }

      this.resetForm();
      await this.loadGuides();
      await this.loadStats();
    } catch (err) {
      console.error('Failed to save guide:', err);
      alert('Failed to save guide');
    }
  }

  startEdit(guide: Guide) {
    this.editingId.set(guide.id);
    this.formData = { ...guide };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
  }

  private resetForm() {
    this.editingId.set(null);
    this.formData = {
      title: '',
      description: '',
      icon: 'book',
      category: '',
      content: '',
      sort_order: 0,
      is_active: true,
    };
  }

  async toggleActive(id: string, isActive: boolean) {
    try {
      await this.guideService.updateGuide(id, { is_active: isActive });
      await this.loadGuides();
    } catch (err) {
      console.error('Failed to toggle guide:', err);
    }
  }

  async deleteGuide(id: string) {
    if (!confirm('Delete this guide? This cannot be undone.')) return;

    try {
      await this.guideService.deleteGuide(id);
      await this.loadGuides();
      await this.loadStats();
    } catch (err) {
      console.error('Failed to delete guide:', err);
      alert('Failed to delete guide');
    }
  }
}
