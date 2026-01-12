import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DemographicCategory,
  DemographicField,
  DemographicFieldType,
} from 'src/app/shared/models/funding-application-demographics.model';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { DemographicsConfigService } from '../../services/demographics-config.service';

/**
 * AdminDemographicsConfigComponent
 * - Manage demographic categories and fields
 * - CRUD operations with Supabase sync
 * - Drag-drop reordering
 * - Activity logging for all changes
 */
@Component({
  selector: 'app-admin-demographics-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header
        class="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 py-6"
      >
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-slate-900">
              Demographic Configuration
            </h1>
            <p class="text-slate-600 mt-1">
              Manage demographic fields and categories
            </p>
          </div>

          <div class="flex items-center gap-3">
            @if (configService.isUsingFallback()) {
            <div
              class="px-4 py-2 bg-amber-50 border border-amber-200/50 rounded-xl"
            >
              <p class="text-xs font-semibold text-amber-700">
                Using local config (Supabase unavailable)
              </p>
            </div>
            }

            <button
              (click)="refreshConfig()"
              [disabled]="configService.isLoading()"
              class="px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{
                configService.isLoading() ? 'Refreshing...' : 'Refresh Config'
              }}
            </button>

            <button
              (click)="openCategoryModal()"
              class="px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
            >
              + New Category
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-6xl mx-auto px-8 py-8">
        @if (configService.isLoading()) {
        <div class="text-center py-12">
          <div
            class="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"
          ></div>
          <p class="text-slate-600 mt-4">Loading configuration...</p>
        </div>
        } @else if (configService.error()) {
        <div class="bg-amber-50 border border-amber-200/50 rounded-xl p-4 mb-6">
          <p class="text-sm font-semibold text-amber-700">
            {{ configService.error() }}
          </p>
        </div>
        } @else {
        <!-- Categories List -->
        <div class="space-y-6">
          @for ( category of configService.categories(); track category.id; let
          i = $index ) {
          <div
            class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <!-- Category Header -->
            <div
              class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-move hover:bg-slate-100 transition-colors duration-200"
              (click)="toggleCategoryExpanded(category.id)"
              draggable="true"
              (dragstart)="onCategoryDragStart($event, i)"
              (dragover)="onCategoryDragOver($event, i)"
              (drop)="onCategoryDrop($event, i)"
              (dragend)="onCategoryDragEnd()"
            >
              <div class="flex items-center gap-3 flex-1">
                <span class="text-sm font-semibold text-slate-500">{{
                  i + 1
                }}</span>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-slate-900">
                    {{ category.label }}
                  </h3>
                  @if (category.description) {
                  <p class="text-sm text-slate-600">
                    {{ category.description }}
                  </p>
                  }
                </div>
                <span
                  class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full"
                >
                  {{ category.fields.length }} fields
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  (click)="editCategory(category); $event.stopPropagation()"
                  class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  (click)="
                    deleteCategory(category.id); $event.stopPropagation()
                  "
                  class="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>

            <!-- Category Fields -->
            @if (isExpanded(category.id)) {
            <div class="p-6 space-y-3">
              @for ( field of category.fields; track field.name; let fi = $index
              ) {
              <div
                class="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors"
                draggable="true"
                (dragstart)="onFieldDragStart($event, category.id, fi)"
                (dragover)="onFieldDragOver($event, category.id, fi)"
                (drop)="onFieldDrop($event, category.id, fi)"
                (dragend)="onFieldDragEnd()"
              >
                <div class="flex items-center gap-3 flex-1">
                  <span class="text-xs font-semibold text-slate-500">{{
                    fi + 1
                  }}</span>
                  <div class="flex-1">
                    <div class="font-semibold text-slate-900">
                      {{ field.label }}
                    </div>
                    <div class="text-xs text-slate-600 space-x-2 mt-1">
                      <span
                        class="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-700"
                      >
                        {{ field.type }}
                      </span>
                      @if (field.required) {
                      <span
                        class="inline-block px-2 py-0.5 bg-red-50 text-red-700 rounded"
                      >
                        Required
                      </span>
                      } @if (field.min !== undefined) {
                      <span class="inline-block text-slate-600">
                        Min: {{ field.min }}
                      </span>
                      } @if (field.max !== undefined) {
                      <span class="inline-block text-slate-600">
                        Max: {{ field.max }}
                      </span>
                      }
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    (click)="editField(category.id, field)"
                    class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    (click)="deleteField(category.id, field.name)"
                    class="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
              }

              <!-- Add Field Button -->
              <button
                (click)="openFieldModal(category.id)"
                class="w-full py-2.5 text-teal-600 font-medium border-2 border-dashed border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
              >
                + Add Field
              </button>
            </div>
            }
          </div>
          }
        </div>
        }
      </main>

      <!-- Category Modal -->
      @if (showCategoryModal()) {
      <div
        class="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closeCategoryModal()"
      >
        <div
          class="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-2xl font-bold text-slate-900 mb-6">
            {{ editingCategory() ? 'Edit Category' : 'New Category' }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Category Key <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="categoryFormData.categoryKey"
                [disabled]="!!editingCategory()"
                placeholder="e.g., shareholding"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:opacity-60"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Label <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="categoryFormData.label"
                placeholder="e.g., Shareholding"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Description
              </label>
              <textarea
                [(ngModel)]="categoryFormData.description"
                placeholder="Optional description"
                rows="3"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <button
              (click)="closeCategoryModal()"
              class="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="saveCategory()"
              [disabled]="
                !categoryFormData.label || !categoryFormData.categoryKey
              "
              class="flex-1 px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      }

      <!-- Field Modal -->
      @if (showFieldModal()) {
      <div
        class="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="closeFieldModal()"
      >
        <div
          class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-lg max-h-96 overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-2xl font-bold text-slate-900 mb-6">
            {{ editingField() ? 'Edit Field' : 'New Field' }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Field Name <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="fieldFormData.name"
                [disabled]="!!editingField()"
                placeholder="e.g., blackOwnership (camelCase)"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:opacity-60"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Label <span class="text-red-600">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="fieldFormData.label"
                placeholder="e.g., Black Ownership (%)"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Type <span class="text-red-600">*</span>
              </label>
              <select
                [(ngModel)]="fieldFormData.type"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="percentage">Percentage</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>

            <div>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  [(ngModel)]="fieldFormData.required"
                  class="w-4 h-4 rounded border-slate-300"
                />
                <span class="text-sm font-semibold text-slate-900">
                  Required
                </span>
              </label>
            </div>

            @if ( fieldFormData.type === 'number' || fieldFormData.type ===
            'percentage' ) {
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2">
                  Min Value
                </label>
                <input
                  type="number"
                  [(ngModel)]="fieldFormData.min"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2">
                  Max Value
                </label>
                <input
                  type="number"
                  [(ngModel)]="fieldFormData.max"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            } @if (fieldFormData.type === 'dropdown') {
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Options (comma-separated)
              </label>
              <textarea
                [(ngModel)]="fieldFormData.optionsText"
                placeholder="e.g., Urban, Township, Rural"
                rows="3"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              ></textarea>
            </div>
            }

            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Placeholder
              </label>
              <input
                type="text"
                [(ngModel)]="fieldFormData.placeholder"
                placeholder="e.g., e.g., 45"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Help Text
              </label>
              <textarea
                [(ngModel)]="fieldFormData.helpText"
                placeholder="Optional help text"
                rows="2"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <button
              (click)="closeFieldModal()"
              class="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="saveField()"
              [disabled]="!fieldFormData.label || !fieldFormData.name"
              class="flex-1 px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class AdminDemographicsConfigComponent implements OnInit {
  configService = inject(DemographicsConfigService);
  private supabase = inject(SharedSupabaseService);
  private activityService = inject(ActivityService);

  // ===== STATE =====
  expandedCategories = signal<Set<string>>(new Set());
  showCategoryModal = signal(false);
  showFieldModal = signal(false);
  editingCategory = signal<DemographicCategory | null>(null);
  editingField = signal<{
    categoryId: string;
    field: DemographicField;
  } | null>(null);

  categoryFormData = {
    categoryKey: '',
    label: '',
    description: '',
  };

  fieldFormData = {
    name: '',
    label: '',
    type: 'text' as DemographicFieldType,
    required: false,
    min: undefined as number | undefined,
    max: undefined as number | undefined,
    placeholder: '',
    helpText: '',
    optionsText: '',
  };

  private draggedCategory?: number;
  private draggedField?: { categoryIndex: number; fieldIndex: number };

  ngOnInit(): void {
    // Config loads automatically
  }

  // ===== CATEGORY MANAGEMENT =====

  isExpanded(categoryId: string): boolean {
    return this.expandedCategories().has(categoryId);
  }

  toggleCategoryExpanded(categoryId: string): void {
    const expanded = new Set(this.expandedCategories());
    if (expanded.has(categoryId)) {
      expanded.delete(categoryId);
    } else {
      expanded.add(categoryId);
    }
    this.expandedCategories.set(expanded);
  }

  openCategoryModal(): void {
    this.editingCategory.set(null);
    this.categoryFormData = { categoryKey: '', label: '', description: '' };
    this.showCategoryModal.set(true);
  }

  editCategory(category: DemographicCategory): void {
    this.editingCategory.set(category);
    this.categoryFormData = {
      categoryKey: category.id,
      label: category.label,
      description: category.description || '',
    };
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.editingCategory.set(null);
  }

  async saveCategory(): Promise<void> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      if (this.editingCategory()) {
        // Update
        const { error } = await this.supabase
          .from('demographics_categories')
          .update({
            label: this.categoryFormData.label,
            description: this.categoryFormData.description,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('category_key', this.categoryFormData.categoryKey);

        if (error) throw error;

        this.activityService.trackProfileActivity(
          'updated',
          `Demographic category "${this.categoryFormData.label}" updated`,
          'demographics_category_updated'
        );
      } else {
        // Create
        const { error } = await this.supabase
          .from('demographics_categories')
          .insert({
            category_key: this.categoryFormData.categoryKey,
            label: this.categoryFormData.label,
            description: this.categoryFormData.description,
            created_by: userId,
          });

        if (error) throw error;

        this.activityService.trackProfileActivity(
          'updated',
          `Demographic category "${this.categoryFormData.label}" created`,
          'demographics_category_created'
        );
      }

      await this.configService.refresh();
      this.closeCategoryModal();
    } catch (error: any) {
      alert(`Error saving category: ${error?.message}`);
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    if (!confirm('Delete this category and all its fields?')) return;

    try {
      const { error } = await this.supabase
        .from('demographics_categories')
        .delete()
        .eq('category_key', categoryId);

      if (error) throw error;

      this.activityService.trackProfileActivity(
        'updated',
        `Demographic category "${categoryId}" deleted`,
        'demographics_category_deleted'
      );

      await this.configService.refresh();
    } catch (error: any) {
      alert(`Error deleting category: ${error?.message}`);
    }
  }

  // ===== FIELD MANAGEMENT =====

  openFieldModal(categoryId: string): void {
    this.editingField.set(null);
    this.fieldFormData = {
      name: '',
      label: '',
      type: 'text',
      required: false,
      min: undefined,
      max: undefined,
      placeholder: '',
      helpText: '',
      optionsText: '',
    };
    // Store categoryId in a temporary way - we'll retrieve it when saving
    (window as any).__currentFieldCategoryId = categoryId;
    this.showFieldModal.set(true);
  }

  editField(categoryId: string, field: DemographicField): void {
    this.editingField.set({ categoryId, field });
    this.fieldFormData = {
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      min: field.min,
      max: field.max,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      optionsText: field.options?.join(', ') || '',
    };
    (window as any).__currentFieldCategoryId = categoryId;
    this.showFieldModal.set(true);
  }

  closeFieldModal(): void {
    this.showFieldModal.set(false);
    this.editingField.set(null);
  }

  async saveField(): Promise<void> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const categoryId =
        this.editingField()?.categoryId ||
        (window as any).__currentFieldCategoryId;
      const category = this.configService.getCategory(categoryId);
      if (!category) throw new Error('Category not found');

      const options =
        this.fieldFormData.type === 'dropdown'
          ? this.fieldFormData.optionsText
              .split(',')
              .map((o) => o.trim())
              .filter((o) => o)
          : null;

      if (this.editingField()) {
        // Update
        const { error } = await this.supabase
          .from('demographics_fields')
          .update({
            label: this.fieldFormData.label,
            type: this.fieldFormData.type,
            is_required: this.fieldFormData.required,
            min_value: this.fieldFormData.min,
            max_value: this.fieldFormData.max,
            placeholder: this.fieldFormData.placeholder,
            help_text: this.fieldFormData.helpText,
            options: options,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('field_name', this.fieldFormData.name)
          .eq('category_id', category.id);

        if (error) throw error;

        this.activityService.trackProfileActivity(
          'updated',
          `Field "${this.fieldFormData.label}" updated in "${category.label}"`,
          'demographics_field_updated'
        );
      } else {
        // Create
        const { error } = await this.supabase
          .from('demographics_fields')
          .insert({
            category_id: category.id,
            field_name: this.fieldFormData.name,
            label: this.fieldFormData.label,
            type: this.fieldFormData.type,
            is_required: this.fieldFormData.required,
            min_value: this.fieldFormData.min,
            max_value: this.fieldFormData.max,
            placeholder: this.fieldFormData.placeholder,
            help_text: this.fieldFormData.helpText,
            options: options,
            created_by: userId,
          });

        if (error) throw error;

        this.activityService.trackProfileActivity(
          'updated',
          `Field "${this.fieldFormData.label}" created in "${category.label}"`,
          'demographics_field_created'
        );
      }

      await this.configService.refresh();
      this.closeFieldModal();
    } catch (error: any) {
      alert(`Error saving field: ${error?.message}`);
    }
  }

  async deleteField(categoryId: string, fieldName: string): Promise<void> {
    if (!confirm('Delete this field?')) return;

    try {
      const category = this.configService.getCategory(categoryId);
      if (!category) throw new Error('Category not found');

      const { error } = await this.supabase
        .from('demographics_fields')
        .delete()
        .eq('field_name', fieldName)
        .eq('category_id', category.id);

      if (error) throw error;

      this.activityService.trackProfileActivity(
        'updated',
        `Field "${fieldName}" deleted from "${category.label}"`,
        'demographics_field_deleted'
      );

      await this.configService.refresh();
    } catch (error: any) {
      alert(`Error deleting field: ${error?.message}`);
    }
  }

  // ===== DRAG & DROP =====

  onCategoryDragStart(e: DragEvent, index: number): void {
    this.draggedCategory = index;
  }

  onCategoryDragOver(e: DragEvent, index: number): void {
    e.preventDefault();
  }

  onCategoryDrop(e: DragEvent, index: number): void {
    e.preventDefault();
    if (this.draggedCategory === undefined) return;
    // Reordering logic would go here
  }

  onCategoryDragEnd(): void {
    this.draggedCategory = undefined;
  }

  onFieldDragStart(e: DragEvent, categoryId: string, index: number): void {
    this.draggedField = { categoryIndex: 0, fieldIndex: index };
  }

  onFieldDragOver(e: DragEvent, categoryId: string, index: number): void {
    e.preventDefault();
  }

  onFieldDrop(e: DragEvent, categoryId: string, index: number): void {
    e.preventDefault();
    // Reordering logic would go here
  }

  onFieldDragEnd(): void {
    this.draggedField = undefined;
  }

  // ===== UTILITIES =====

  async refreshConfig(): Promise<void> {
    await this.configService.refresh();
  }
}
