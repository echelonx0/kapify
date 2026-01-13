// // import {
// //   Component,
// //   OnInit,
// //   inject,
// //   signal,
// //   computed,
// //   OnDestroy,
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { Subject } from 'rxjs';
// // import { takeUntil } from 'rxjs/operators';

// // import { DemographicsConfigService } from '../../services/demographics-config.service';
// // import { AdminDemographicsConfigService } from '../../services/admin-demographics-config.service';
// // import {
// //   DemographicCategory,
// //   DemographicField,
// //   DemographicFieldType,
// // } from 'src/app/shared/models/funding-application-demographics.model';

// // @Component({
// //   selector: 'app-demographics-config-manager',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule],
// //   templateUrl: './demographics-config.component.html',
// // })
// // export class DemographicsConfigManagerComponent implements OnInit, OnDestroy {
// //   private configService = inject(DemographicsConfigService);
// //   private adminService = inject(AdminDemographicsConfigService);
// //   private destroy$ = new Subject<void>();

// //   // STATE
// //   categories = signal<DemographicCategory[]>([]);
// //   selectedCategoryId = signal<string | null>(null);
// //   isLoading = signal(false);
// //   error = signal<string | null>(null);
// //   success = signal<string | null>(null);

// //   // MODALS
// //   showCategoryModal = signal(false);
// //   showFieldModal = signal(false);
// //   editingCategory = signal<DemographicCategory | null>(null);
// //   editingField = signal<DemographicField | null>(null);

// //   // CATEGORY FORM
// //   categoryForm = signal({
// //     label: '',
// //     description: '',
// //   });

// //   // FIELD FORM
// //   fieldForm = signal({
// //     name: '',
// //     label: '',
// //     type: 'text' as DemographicFieldType,
// //     required: false,
// //     min: '',
// //     max: '',
// //     optionsText: '',
// //     placeholder: '',
// //     helpText: '',
// //   });

// //   // COMPUTED
// //   selectedCategory = computed(() => {
// //     const id = this.selectedCategoryId();
// //     return this.categories().find((c) => c.id === id);
// //   });

// //   fieldsForCategory = computed(() => {
// //     return this.selectedCategory()?.fields || [];
// //   });

// //   configSource = computed(() => this.configService.getSource());

// //   ngOnInit(): void {
// //     this.loadConfig();
// //   }

// //   /**
// //    * Load config
// //    */
// //   private loadConfig(): void {
// //     this.isLoading.set(true);
// //     this.error.set(null);

// //     try {
// //       const config = this.configService.config();
// //       if (config?.categories) {
// //         this.categories.set(config.categories);
// //         if (config.categories.length > 0) {
// //           this.selectedCategoryId.set(config.categories[0].id);
// //         }
// //       }
// //     } catch (err: any) {
// //       this.error.set(err?.message || 'Failed to load config');
// //     } finally {
// //       this.isLoading.set(false);
// //     }
// //   }

// //   // ===== CATEGORY OPERATIONS =====

// //   openAddCategoryModal(): void {
// //     this.editingCategory.set(null);
// //     this.categoryForm.set({ label: '', description: '' });
// //     this.showCategoryModal.set(true);
// //   }

// //   openEditCategoryModal(category: DemographicCategory): void {
// //     this.editingCategory.set(category);
// //     this.categoryForm.set({
// //       label: category.label,
// //       description: category.description || '',
// //     });
// //     this.showCategoryModal.set(true);
// //   }

// //   closeCategoryModal(): void {
// //     this.showCategoryModal.set(false);
// //     this.editingCategory.set(null);
// //   }

// //   saveCategoryModal(): void {
// //     const form = this.categoryForm();
// //     if (!form.label.trim()) {
// //       this.error.set('Category label is required');
// //       return;
// //     }

// //     const isEdit = !!this.editingCategory();

// //     if (isEdit) {
// //       const cat = this.editingCategory()!;
// //       this.adminService
// //         .updateCategory(cat.id, {
// //           label: form.label,
// //           description: form.description || undefined,
// //         })
// //         .pipe(takeUntil(this.destroy$))
// //         .subscribe({
// //           next: () => {
// //             this.success.set('Category updated');
// //             this.closeCategoryModal();
// //             this.loadConfig();
// //             this.clearSuccess();
// //           },
// //           error: (err) => {
// //             this.error.set(err?.message || 'Failed to update category');
// //           },
// //         });
// //     } else {
// //       this.adminService
// //         .createCategory(
// //           this.generateKey(form.label),
// //           form.label,
// //           form.description
// //         )
// //         .pipe(takeUntil(this.destroy$))
// //         .subscribe({
// //           next: () => {
// //             this.success.set('Category created');
// //             this.closeCategoryModal();
// //             this.loadConfig();
// //             this.clearSuccess();
// //           },
// //           error: (err) => {
// //             this.error.set(err?.message || 'Failed to create category');
// //           },
// //         });
// //     }
// //   }

// //   deleteCategory(category: DemographicCategory): void {
// //     if (
// //       !confirm(
// //         `Delete category "${category.label}"? This will also delete all fields.`
// //       )
// //     ) {
// //       return;
// //     }

// //     this.adminService
// //       .deleteCategory(category.id)
// //       .pipe(takeUntil(this.destroy$))
// //       .subscribe({
// //         next: () => {
// //           this.success.set('Category deleted');
// //           this.loadConfig();
// //           this.clearSuccess();
// //         },
// //         error: (err) => {
// //           this.error.set(err?.message || 'Failed to delete category');
// //         },
// //       });
// //   }

// //   // ===== FIELD OPERATIONS =====

// //   openAddFieldModal(): void {
// //     if (!this.selectedCategory()) {
// //       this.error.set('Please select a category first');
// //       return;
// //     }

// //     this.editingField.set(null);
// //     this.fieldForm.set({
// //       name: '',
// //       label: '',
// //       type: 'text',
// //       required: false,
// //       min: '',
// //       max: '',
// //       optionsText: '',
// //       placeholder: '',
// //       helpText: '',
// //     });
// //     this.showFieldModal.set(true);
// //   }

// //   openEditFieldModal(field: DemographicField): void {
// //     this.editingField.set(field);
// //     this.fieldForm.set({
// //       name: field.name,
// //       label: field.label,
// //       type: field.type,
// //       required: field.required,
// //       min: field.min?.toString() || '',
// //       max: field.max?.toString() || '',
// //       optionsText: field.options?.join(', ') || '',
// //       placeholder: field.placeholder || '',
// //       helpText: field.helpText || '',
// //     });
// //     this.showFieldModal.set(true);
// //   }

// //   closeFieldModal(): void {
// //     this.showFieldModal.set(false);
// //     this.editingField.set(null);
// //   }

// //   saveFieldModal(): void {
// //     const form = this.fieldForm();
// //     const category = this.selectedCategory();

// //     if (!form.label.trim()) {
// //       this.error.set('Field label is required');
// //       return;
// //     }

// //     if (!category) {
// //       this.error.set('No category selected');
// //       return;
// //     }

// //     const fieldName = form.name.trim() || this.generateKey(form.label);
// //     if (!fieldName) {
// //       this.error.set('Could not generate field name');
// //       return;
// //     }

// //     const isEdit = !!this.editingField();

// //     const options =
// //       form.type === 'dropdown' && form.optionsText
// //         ? form.optionsText
// //             .split(',')
// //             .map((o) => o.trim())
// //             .filter((o) => o.length > 0)
// //         : undefined;

// //     const fieldOptions = {
// //       minValue: form.min ? parseInt(form.min, 10) : undefined,
// //       maxValue: form.max ? parseInt(form.max, 10) : undefined,
// //       optionsList: options,
// //       placeholder: form.placeholder || undefined,
// //       helpText: form.helpText || undefined,
// //     };

// //     if (isEdit) {
// //       const field = this.editingField()!;
// //       this.adminService
// //         .updateField(field.name, {
// //           label: form.label,
// //           type: form.type,
// //           required: form.required,
// //           min: fieldOptions.minValue,
// //           max: fieldOptions.maxValue,
// //           options: fieldOptions.optionsList,
// //           placeholder: fieldOptions.placeholder,
// //           helpText: fieldOptions.helpText,
// //         })
// //         .pipe(takeUntil(this.destroy$))
// //         .subscribe({
// //           next: () => {
// //             this.success.set('Field updated');
// //             this.closeFieldModal();
// //             this.loadConfig();
// //             this.clearSuccess();
// //           },
// //           error: (err) => {
// //             this.error.set(err?.message || 'Failed to update field');
// //           },
// //         });
// //     } else {
// //       this.adminService
// //         .createField(
// //           category.id,
// //           fieldName,
// //           form.label,
// //           form.type,
// //           form.required,
// //           fieldOptions
// //         )
// //         .pipe(takeUntil(this.destroy$))
// //         .subscribe({
// //           next: () => {
// //             this.success.set('Field created');
// //             this.closeFieldModal();
// //             this.loadConfig();
// //             this.clearSuccess();
// //           },
// //           error: (err) => {
// //             this.error.set(err?.message || 'Failed to create field');
// //           },
// //         });
// //     }
// //   }

// //   deleteField(field: DemographicField): void {
// //     if (!confirm(`Delete field "${field.label}"?`)) {
// //       return;
// //     }

// //     this.adminService
// //       .deleteField(field.name)
// //       .pipe(takeUntil(this.destroy$))
// //       .subscribe({
// //         next: () => {
// //           this.success.set('Field deleted');
// //           this.loadConfig();
// //           this.clearSuccess();
// //         },
// //         error: (err) => {
// //           this.error.set(err?.message || 'Failed to delete field');
// //         },
// //       });
// //   }

// //   // ===== UTILITIES =====

// //   private generateKey(label: string): string {
// //     return label
// //       .toLowerCase()
// //       .replace(/\s+/g, '')
// //       .replace(/[^a-z0-9]/g, '');
// //   }

// //   private clearSuccess(): void {
// //     setTimeout(() => this.success.set(null), 3000);
// //   }

// //   getFieldTypeDisplay(type: string): string {
// //     const map: Record<string, string> = {
// //       text: 'Text',
// //       number: 'Number',
// //       percentage: 'Percentage',
// //       dropdown: 'Dropdown',
// //     };
// //     return map[type] || type;
// //   }

// //   trackByCategory(index: number, cat: any): string {
// //     return cat.id;
// //   }

// //   trackByField(index: number, field: any): string {
// //     return field.name;
// //   }

// //   ngOnDestroy(): void {
// //     this.destroy$.next();
// //     this.destroy$.complete();
// //   }
// // }

// import {
//   Component,
//   OnInit,
//   inject,
//   signal,
//   computed,
//   OnDestroy,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';

// import { DemographicsConfigService } from '../../services/demographics-config.service';
// import { AdminDemographicsConfigService } from '../../services/admin-demographics-config.service';
// import {
//   DemographicCategory,
//   DemographicField,
//   DemographicFieldType,
// } from 'src/app/shared/models/funding-application-demographics.model';

// @Component({
//   selector: 'app-demographics-config-manager',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './demographics-config.component.html',
// })
// export class DemographicsConfigManagerComponent implements OnInit, OnDestroy {
//   private configService = inject(DemographicsConfigService);
//   private adminService = inject(AdminDemographicsConfigService);
//   private destroy$ = new Subject<void>();

//   // STATE
//   categories = signal<DemographicCategory[]>([]);
//   selectedCategoryId = signal<string | null>(null);
//   isLoading = signal(false);
//   error = signal<string | null>(null);
//   success = signal<string | null>(null);

//   // MODALS
//   showCategoryModal = signal(false);
//   showFieldModal = signal(false);
//   editingCategory = signal<DemographicCategory | null>(null);
//   editingField = signal<DemographicField | null>(null);

//   // CATEGORY FORM
//   categoryForm = signal({
//     label: '',
//     description: '',
//   });

//   // FIELD FORM
//   fieldForm = signal({
//     name: '',
//     label: '',
//     type: 'text' as DemographicFieldType,
//     required: false,
//     min: '',
//     max: '',
//     optionsText: '',
//     placeholder: '',
//     helpText: '',
//   });

//   // COMPUTED
//   selectedCategory = computed(() => {
//     const id = this.selectedCategoryId();
//     return this.categories().find((c) => c.id === id);
//   });

//   fieldsForCategory = computed(() => {
//     return this.selectedCategory()?.fields || [];
//   });

//   configSource = computed(() => this.configService.getSource());

//   ngOnInit(): void {
//     this.loadConfig();
//   }

//   /**
//    * Load config - subscribe to service changes
//    * Service initializes asynchronously, so we listen for updates
//    */
//   private loadConfig(): void {
//     this.isLoading.set(true);
//     this.error.set(null);

//     // Subscribe to config changes (handles initial load + admin updates)
//     this.configService
//       .watchConfigChanges()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (config) => {
//           if (config?.categories) {
//             this.categories.set(config.categories);
//             // Only set initial selection if not already set
//             if (config.categories.length > 0 && !this.selectedCategoryId()) {
//               this.selectedCategoryId.set(config.categories[0].id);
//             }
//             this.isLoading.set(false);
//           }
//         },
//         error: (err: any) => {
//           this.error.set(err?.message || 'Failed to load config');
//           this.isLoading.set(false);
//         },
//       });
//   }

//   // ===== CATEGORY OPERATIONS =====

//   openAddCategoryModal(): void {
//     this.editingCategory.set(null);
//     this.categoryForm.set({ label: '', description: '' });
//     this.showCategoryModal.set(true);
//   }

//   openEditCategoryModal(category: DemographicCategory): void {
//     this.editingCategory.set(category);
//     this.categoryForm.set({
//       label: category.label,
//       description: category.description || '',
//     });
//     this.showCategoryModal.set(true);
//   }

//   closeCategoryModal(): void {
//     this.showCategoryModal.set(false);
//     this.editingCategory.set(null);
//   }

//   saveCategoryModal(): void {
//     const form = this.categoryForm();
//     if (!form.label.trim()) {
//       this.error.set('Category label is required');
//       return;
//     }

//     const isEdit = !!this.editingCategory();

//     if (isEdit) {
//       const cat = this.editingCategory()!;
//       this.adminService
//         .updateCategory(cat.id, {
//           label: form.label,
//           description: form.description || undefined,
//         })
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: () => {
//             this.success.set('Category updated');
//             this.closeCategoryModal();
//             this.clearSuccess();
//           },
//           error: (err) => {
//             this.error.set(err?.message || 'Failed to update category');
//           },
//         });
//     } else {
//       this.adminService
//         .createCategory(
//           this.generateKey(form.label),
//           form.label,
//           form.description
//         )
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: () => {
//             this.success.set('Category created');
//             this.closeCategoryModal();
//             this.clearSuccess();
//           },
//           error: (err) => {
//             this.error.set(err?.message || 'Failed to create category');
//           },
//         });
//     }
//   }

//   deleteCategory(category: DemographicCategory): void {
//     if (
//       !confirm(
//         `Delete category "${category.label}"? This will also delete all fields.`
//       )
//     ) {
//       return;
//     }

//     this.adminService
//       .deleteCategory(category.id)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: () => {
//           this.success.set('Category deleted');
//           this.clearSuccess();
//         },
//         error: (err) => {
//           this.error.set(err?.message || 'Failed to delete category');
//         },
//       });
//   }

//   // ===== FIELD OPERATIONS =====

//   openAddFieldModal(): void {
//     if (!this.selectedCategory()) {
//       this.error.set('Please select a category first');
//       return;
//     }

//     this.editingField.set(null);
//     this.fieldForm.set({
//       name: '',
//       label: '',
//       type: 'text',
//       required: false,
//       min: '',
//       max: '',
//       optionsText: '',
//       placeholder: '',
//       helpText: '',
//     });
//     this.showFieldModal.set(true);
//   }

//   openEditFieldModal(field: DemographicField): void {
//     this.editingField.set(field);
//     this.fieldForm.set({
//       name: field.name,
//       label: field.label,
//       type: field.type,
//       required: field.required,
//       min: field.min?.toString() || '',
//       max: field.max?.toString() || '',
//       optionsText: field.options?.join(', ') || '',
//       placeholder: field.placeholder || '',
//       helpText: field.helpText || '',
//     });
//     this.showFieldModal.set(true);
//   }

//   closeFieldModal(): void {
//     this.showFieldModal.set(false);
//     this.editingField.set(null);
//   }

//   saveFieldModal(): void {
//     const form = this.fieldForm();
//     const category = this.selectedCategory();

//     if (!form.label.trim()) {
//       this.error.set('Field label is required');
//       return;
//     }

//     if (!category) {
//       this.error.set('No category selected');
//       return;
//     }

//     const fieldName = form.name.trim() || this.generateKey(form.label);
//     if (!fieldName) {
//       this.error.set('Could not generate field name');
//       return;
//     }

//     const isEdit = !!this.editingField();

//     const options =
//       form.type === 'dropdown' && form.optionsText
//         ? form.optionsText
//             .split(',')
//             .map((o) => o.trim())
//             .filter((o) => o.length > 0)
//         : undefined;

//     const fieldOptions = {
//       minValue: form.min ? parseInt(form.min, 10) : undefined,
//       maxValue: form.max ? parseInt(form.max, 10) : undefined,
//       optionsList: options,
//       placeholder: form.placeholder || undefined,
//       helpText: form.helpText || undefined,
//     };

//     if (isEdit) {
//       const field = this.editingField()!;
//       this.adminService
//         .updateField(field.name, {
//           label: form.label,
//           type: form.type,
//           required: form.required,
//           min: fieldOptions.minValue,
//           max: fieldOptions.maxValue,
//           options: fieldOptions.optionsList,
//           placeholder: fieldOptions.placeholder,
//           helpText: fieldOptions.helpText,
//         })
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: () => {
//             this.success.set('Field updated');
//             this.closeFieldModal();
//             this.clearSuccess();
//           },
//           error: (err) => {
//             this.error.set(err?.message || 'Failed to update field');
//           },
//         });
//     } else {
//       this.adminService
//         .createField(
//           category.id,
//           fieldName,
//           form.label,
//           form.type,
//           form.required,
//           fieldOptions
//         )
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: () => {
//             this.success.set('Field created');
//             this.closeFieldModal();
//             this.clearSuccess();
//           },
//           error: (err) => {
//             this.error.set(err?.message || 'Failed to create field');
//           },
//         });
//     }
//   }

//   deleteField(field: DemographicField): void {
//     if (!confirm(`Delete field "${field.label}"?`)) {
//       return;
//     }

//     this.adminService
//       .deleteField(field.name)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: () => {
//           this.success.set('Field deleted');
//           this.clearSuccess();
//         },
//         error: (err) => {
//           this.error.set(err?.message || 'Failed to delete field');
//         },
//       });
//   }

//   // ===== UTILITIES =====

//   private generateKey(label: string): string {
//     return label
//       .toLowerCase()
//       .replace(/\s+/g, '')
//       .replace(/[^a-z0-9]/g, '');
//   }

//   private clearSuccess(): void {
//     setTimeout(() => this.success.set(null), 3000);
//   }

//   getFieldTypeDisplay(type: string): string {
//     const map: Record<string, string> = {
//       text: 'Text',
//       number: 'Number',
//       percentage: 'Percentage',
//       dropdown: 'Dropdown',
//     };
//     return map[type] || type;
//   }

//   trackByCategory(index: number, cat: any): string {
//     return cat.id;
//   }

//   trackByField(index: number, field: any): string {
//     return field.name;
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DemographicsConfigService } from '../../services/demographics-config.service';
import { AdminDemographicsConfigService } from '../../services/admin-demographics-config.service';

import {
  DemographicCategory,
  DemographicField,
  DemographicFieldType,
} from 'src/app/shared/models/funding-application-demographics.model';
import { MessagingService } from 'src/app/features/messaging/services/messaging.service';

@Component({
  selector: 'app-demographics-config-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demographics-config.component.html',
})
export class DemographicsConfigManagerComponent implements OnInit, OnDestroy {
  private configService = inject(DemographicsConfigService);
  private adminService = inject(AdminDemographicsConfigService);
  private messagingService = inject(MessagingService);
  private destroy$ = new Subject<void>();

  // STATE
  categories = signal<DemographicCategory[]>([]);
  selectedCategoryId = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // MODALS
  showCategoryModal = signal(false);
  showFieldModal = signal(false);
  editingCategory = signal<DemographicCategory | null>(null);
  editingField = signal<DemographicField | null>(null);

  // CATEGORY FORM
  categoryForm = signal({
    label: '',
    description: '',
  });

  // FIELD FORM
  fieldForm = signal({
    name: '',
    label: '',
    type: 'text' as DemographicFieldType,
    required: false,
    min: '',
    max: '',
    optionsText: '',
    placeholder: '',
    helpText: '',
  });

  // COMPUTED
  selectedCategory = computed(() => {
    const id = this.selectedCategoryId();
    return this.categories().find((c) => c.id === id);
  });

  fieldsForCategory = computed(() => {
    return this.selectedCategory()?.fields || [];
  });

  configSource = computed(() => this.configService.getSource());

  ngOnInit(): void {
    this.loadConfig();
  }

  /**
   * Load config - subscribe to service changes
   */
  private loadConfig(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.configService
      .watchConfigChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          if (config?.categories) {
            this.categories.set(config.categories);
            if (config.categories.length > 0 && !this.selectedCategoryId()) {
              this.selectedCategoryId.set(config.categories[0].id);
            }
            this.isLoading.set(false);
          }
        },
        error: (err: any) => {
          this.error.set(err?.message || 'Failed to load config');
          this.isLoading.set(false);
        },
      });
  }

  // ===== NAVIGATION =====

  selectCategory(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
  }

  // ===== CATEGORY OPERATIONS =====

  openAddCategoryModal(): void {
    this.editingCategory.set(null);
    this.categoryForm.set({ label: '', description: '' });
    this.error.set(null);
    this.showCategoryModal.set(true);
  }

  openEditCategoryModal(category: DemographicCategory): void {
    this.editingCategory.set(category);
    this.categoryForm.set({
      label: category.label,
      description: category.description || '',
    });
    this.error.set(null);
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.editingCategory.set(null);
  }

  saveCategoryModal(): void {
    const form = this.categoryForm();
    if (!form.label.trim()) {
      this.error.set('Category label is required');
      return;
    }

    const isEdit = !!this.editingCategory();

    if (isEdit) {
      this.updateCategory();
    } else {
      this.createCategory(form);
    }
  }

  private createCategory(form: any): void {
    this.adminService
      .createCategory(
        this.generateKey(form.label),
        form.label,
        form.description
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Category created');
          this.closeCategoryModal();
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to create category');
        },
      });
  }

  private updateCategory(): void {
    const cat = this.editingCategory()!;
    const form = this.categoryForm();

    this.adminService
      .updateCategory(cat.id, {
        label: form.label,
        description: form.description || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Category updated');
          this.closeCategoryModal();
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to update category');
        },
      });
  }

  deleteCategory(category: DemographicCategory): void {
    if (
      !confirm(
        `Delete "${category.label}"? This will also delete all ${category.fields.length} fields.`
      )
    ) {
      return;
    }

    this.adminService
      .deleteCategory(category.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Category deleted');
          if (this.selectedCategoryId() === category.id) {
            this.selectedCategoryId.set(null);
          }
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to delete category');
        },
      });
  }

  // ===== FIELD OPERATIONS =====

  openAddFieldModal(): void {
    if (!this.selectedCategory()) {
      this.error.set('Please select a category first');
      return;
    }

    this.editingField.set(null);
    this.fieldForm.set({
      name: '',
      label: '',
      type: 'text',
      required: false,
      min: '',
      max: '',
      optionsText: '',
      placeholder: '',
      helpText: '',
    });
    this.error.set(null);
    this.showFieldModal.set(true);
  }

  openEditFieldModal(field: DemographicField): void {
    this.editingField.set(field);
    this.fieldForm.set({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      min: field.min?.toString() || '',
      max: field.max?.toString() || '',
      optionsText: field.options?.join(', ') || '',
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
    });
    this.error.set(null);
    this.showFieldModal.set(true);
  }

  closeFieldModal(): void {
    this.showFieldModal.set(false);
    this.editingField.set(null);
  }

  saveFieldModal(): void {
    const form = this.fieldForm();
    const category = this.selectedCategory();

    if (!form.label.trim()) {
      this.error.set('Field label is required');
      return;
    }

    if (!category) {
      this.error.set('No category selected');
      return;
    }

    const fieldName = form.name.trim() || this.generateKey(form.label);
    if (!fieldName) {
      this.error.set('Could not generate field name');
      return;
    }

    const isEdit = !!this.editingField();
    const options = this.parseDropdownOptions(form);

    if (isEdit) {
      this.updateField(fieldName, form, options);
    } else {
      this.createField(category, fieldName, form, options);
    }
  }

  private createField(
    category: DemographicCategory,
    fieldName: string,
    form: any,
    options?: string[]
  ): void {
    this.adminService
      .createField(
        category.id,
        fieldName,
        form.label,
        form.type,
        form.required,
        {
          minValue: form.min ? parseInt(form.min, 10) : undefined,
          maxValue: form.max ? parseInt(form.max, 10) : undefined,
          optionsList: options,
          placeholder: form.placeholder || undefined,
          helpText: form.helpText || undefined,
        }
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Field created');
          this.closeFieldModal();
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to create field');
        },
      });
  }

  private updateField(fieldName: string, form: any, options?: string[]): void {
    this.adminService
      .updateField(fieldName, {
        label: form.label,
        type: form.type,
        required: form.required,
        min: form.min ? parseInt(form.min, 10) : undefined,
        max: form.max ? parseInt(form.max, 10) : undefined,
        options,
        placeholder: form.placeholder || undefined,
        helpText: form.helpText || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Field updated');
          this.closeFieldModal();
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to update field');
        },
      });
  }

  deleteField(field: DemographicField): void {
    if (!confirm(`Delete field "${field.label}"?`)) {
      return;
    }

    this.adminService
      .deleteField(field.name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Field deleted');
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to delete field');
        },
      });
  }

  // ===== UTILITIES =====

  private parseDropdownOptions(form: any): string[] | undefined {
    if (form.type === 'dropdown' && form.optionsText) {
      return form.optionsText
        .split(',')
        .map((o: string) => o.trim())
        .filter((o: string) => o.length > 0);
    }
    return undefined;
  }

  private generateKey(label: string): string {
    return label
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private showSuccess(message: string): void {
    this.success.set(message);
    setTimeout(() => this.success.set(null), 3000);
  }

  getFieldTypeDisplay(type: string): string {
    const map: Record<string, string> = {
      text: 'Text',
      number: 'Number',
      percentage: 'Percentage',
      dropdown: 'Dropdown',
    };
    return map[type] || type;
  }

  trackByCategory(index: number, cat: any): string {
    return cat.id;
  }

  trackByField(index: number, field: any): string {
    return field.name;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
