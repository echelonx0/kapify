// src/app/admin/dashboard/components/management-component/constants-management.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GripVertical,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-angular';
import {
  SupabaseConstantsService,
  Constant,
} from 'src/app/shared/services/supabas-constants.service';

interface NewConstantForm {
  value_key: string;
  display_label: string;
  description: string;
  order_index: number;
}

@Component({
  selector: 'app-constants-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: 'constants-management.component.html',
})
export class ConstantsManagementComponent implements OnInit {
  private constantsService = inject(SupabaseConstantsService);

  // State
  readonly selectedCategory = signal('funding_options');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showBackupHistory = signal(false);
  readonly editingId = signal<string | null>(null);

  // Data
  readonly allConstants = signal<Constant[]>([]);
  readonly backupHistory = signal<any[]>([]);

  // Form state - use writable signals with proper types
  readonly newConstant = signal<NewConstantForm>({
    value_key: '',
    display_label: '',
    description: '',
    order_index: 0,
  });

  readonly editingConstant = signal<Partial<Constant>>({});

  // Categories
  readonly categories = [
    'funding_options',
    'industries',
    'business_stages',
    'geographic_regions',
    'currencies',
  ];

  // Icons
  PlusIcon = Plus;
  Trash2Icon = Trash2;
  Edit2Icon = Edit2;
  CheckIcon = Check;
  XIcon = X;
  GripVerticalIcon = GripVertical;
  DownloadIcon = Download;
  RotateCcwIcon = RotateCcw;
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;
  AlertCircleIcon = AlertCircle;

  // Computed
  readonly filteredConstants = computed(() => {
    return this.allConstants()
      .filter((c) => c.category_key === this.selectedCategory())
      .sort((a, b) => a.order_index - b.order_index);
  });

  async ngOnInit() {
    await this.loadConstants();
  }

  async loadConstants(): Promise<void> {
    this.isLoading.set(true);
    try {
      const constants = await this.constantsService.getAllConstants();
      this.allConstants.set(constants);
      this.error.set(null);
      this.showSuccessMessage('Constants loaded');
    } catch (err) {
      console.error('Failed to load constants:', err);
      this.error.set('Failed to load constants');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadBackupHistory(): Promise<void> {
    try {
      const history = await this.constantsService.getBackupHistory(20);
      this.backupHistory.set(history);
    } catch (err) {
      console.error('Failed to load backup history:', err);
      this.error.set('Failed to load backup history');
    }
  }

  async addConstant(): Promise<void> {
    const constant = this.newConstant();
    if (!constant.value_key || !constant.display_label) {
      this.error.set('Value key and display label are required');
      return;
    }

    this.isLoading.set(true);
    try {
      const category = this.selectedCategory();
      // Get category ID from allConstants (they have the category_id)
      const categoryRecord = this.allConstants().find(
        (c) => c.category_key === category
      );
      const categoryId = categoryRecord?.category_id || '';

      await this.constantsService.createConstant(
        categoryId,
        category,
        constant.value_key,
        constant.display_label,
        constant.description || undefined
      );

      // Reset form
      this.newConstant.set({
        value_key: '',
        display_label: '',
        description: '',
        order_index: 0,
      });

      await this.loadConstants();
      this.showSuccessMessage('Constant added successfully');
    } catch (err) {
      console.error('Failed to add constant:', err);
      this.error.set('Failed to add constant');
    } finally {
      this.isLoading.set(false);
    }
  }

  startEdit(constant: Constant): void {
    this.editingId.set(constant.id);
    this.editingConstant.set({ ...constant });
  }

  async saveEdit(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const updates = this.editingConstant();
      await this.constantsService.updateConstant(id, updates);
      this.editingId.set(null);
      await this.loadConstants();
      this.showSuccessMessage('Constant updated successfully');
    } catch (err) {
      console.error('Failed to update constant:', err);
      this.error.set('Failed to update constant');
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.constantsService.toggleConstantActive(id, isActive);
      await this.loadConstants();
      this.showSuccessMessage(`Constant ${isActive ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to toggle constant:', err);
      this.error.set('Failed to toggle constant');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteConstant(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this constant?')) return;

    this.isLoading.set(true);
    try {
      await this.constantsService.deleteConstant(id);
      await this.loadConstants();
      this.showSuccessMessage('Constant deleted successfully');
    } catch (err) {
      console.error('Failed to delete constant:', err);
      this.error.set('Failed to delete constant');
    } finally {
      this.isLoading.set(false);
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    if (
      !confirm(
        'Restore from this backup? This will create a new version of the constant.'
      )
    )
      return;

    this.isLoading.set(true);
    try {
      await this.constantsService.restoreFromBackup(backupId);
      await this.loadConstants();
      this.showSuccessMessage('Backup restored successfully');
    } catch (err) {
      console.error('Failed to restore backup:', err);
      this.error.set('Failed to restore backup');
    } finally {
      this.isLoading.set(false);
    }
  }

  exportConstants(): void {
    const json = this.constantsService.exportConstantsAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `constants-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showSuccessMessage('Constants exported');
  }

  formatCategoryName(category: string): string {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
