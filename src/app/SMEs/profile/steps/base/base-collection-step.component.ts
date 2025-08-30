// src/app/SMEs/profile/steps/base/base-collection-step.component.ts
import { signal, computed, Directive } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseFormStepComponent } from './base-form-step.component';

export interface CollectionItem {
  id: string;
  [key: string]: any;
}

export interface CollectionSection {
  id: string;
  title: string;
  description: string;
  expanded: boolean;
  items: CollectionItem[];
  required?: boolean;
  minItems?: number;
  maxItems?: number;
}

export interface CollectionValidation {
  sectionId: string;
  isValid: boolean;
  errors: string[];
  missingCount: number;
}

@Directive()
export abstract class BaseCollectionStepComponent<T extends CollectionItem = CollectionItem> 
  extends BaseFormStepComponent {

  // Collection state
  protected collections = signal<CollectionSection[]>([]);
  protected activeForm = signal<string | null>(null);
  protected editingItemId = signal<string | null>(null);
  protected showModal = signal(false);

  // Computed values
  totalItems = computed(() => 
    this.collections().reduce((total, section) => total + section.items.length, 0)
  );

  completedSections = computed(() =>
    this.collections().filter(section => this.isSectionComplete(section)).length
  );

  overallProgress = computed(() => {
    const total = this.collections().length;
    const completed = this.completedSections();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  // ===============================
  // ABSTRACT METHODS FOR COLLECTIONS
  // ===============================

  /**
   * Get the form for adding/editing items
   */
  abstract getItemForm(): FormGroup;

  /**
   * Initialize collection sections
   */
  abstract initializeCollections(): CollectionSection[];

  /**
   * Create a new item from form data
   */
  abstract createItemFromForm(formData: any): T;

  /**
   * Get default item data for form
   */
  abstract getDefaultItemData(): any;

  // ===============================
  // COLLECTION MANAGEMENT
  // ===============================

  /**
   * Initialize collections in derived class
   */
  protected setupCollections(): void {
    const sections = this.initializeCollections();
    this.collections.set(sections);
  }

  /**
   * Add new item to a collection
   */
  addItem(sectionId: string): void {
    const form = this.getItemForm();
    if (!form.valid) {
      this.markAllFieldsTouched();
      return;
    }

    const newItem = this.createItemFromForm(form.value);
    this.collections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
    );

    this.closeModal();
    this.triggerAutoSave();
  }

  /**
   * Update existing item in collection
   */
  updateItem(sectionId: string, itemId: string): void {
    const form = this.getItemForm();
    if (!form.valid) {
      this.markAllFieldsTouched();
      return;
    }

    const updatedItem = { ...this.createItemFromForm(form.value), id: itemId };
    this.collections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? updatedItem : item
              )
            }
          : section
      )
    );

    this.closeModal();
    this.triggerAutoSave();
  }

  /**
   * Remove item from collection
   */
  removeItem(sectionId: string, itemId: string): void {
    if (!confirm('Are you sure you want to delete this item?')) return;

    this.collections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, items: section.items.filter(item => item.id !== itemId) }
          : section
      )
    );

    this.triggerAutoSave();
  }

  /**
   * Move item to different position
   */
  moveItem(sectionId: string, fromIndex: number, toIndex: number): void {
    this.collections.update(sections =>
      sections.map(section => {
        if (section.id !== sectionId) return section;
        
        const items = [...section.items];
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);
        
        return { ...section, items };
      })
    );

    this.triggerAutoSave();
  }

  // ===============================
  // MODAL MANAGEMENT
  // ===============================

  /**
   * Open modal to add new item
   */
  openAddModal(sectionId: string): void {
    this.activeForm.set(sectionId);
    this.editingItemId.set(null);
    this.getItemForm().reset(this.getDefaultItemData());
    this.showModal.set(true);
  }

  /**
   * Open modal to edit existing item
   */
  openEditModal(sectionId: string, itemId: string): void {
    const section = this.collections().find(s => s.id === sectionId);
    const item = section?.items.find(i => i.id === itemId);
    
    if (!item) return;

    this.activeForm.set(sectionId);
    this.editingItemId.set(itemId);
    this.getItemForm().patchValue(item);
    this.showModal.set(true);
  }

  /**
   * Close modal and reset form
   */
  closeModal(): void {
    this.showModal.set(false);
    this.activeForm.set(null);
    this.editingItemId.set(null);
    this.getItemForm().reset();
  }

  /**
   * Save item (add or update based on editing state)
   */
  saveItem(): void {
    const sectionId = this.activeForm();
    const itemId = this.editingItemId();
    
    if (!sectionId) return;

    if (itemId) {
      this.updateItem(sectionId, itemId);
    } else {
      this.addItem(sectionId);
    }
  }

  // ===============================
  // SECTION MANAGEMENT
  // ===============================

  /**
   * Toggle section expansion
   */
  toggleSection(sectionId: string): void {
    this.collections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  }

  /**
   * Check if section is expanded
   */
  isSectionExpanded(sectionId: string): boolean {
    return this.collections().find(s => s.id === sectionId)?.expanded ?? false;
  }

  /**
   * Check if section meets completion criteria
   */
  isSectionComplete(section: CollectionSection): boolean {
    const minItems = section.minItems || (section.required ? 1 : 0);
    return section.items.length >= minItems;
  }

  /**
   * Get section by ID
   */
  getSection(sectionId: string): CollectionSection | undefined {
    return this.collections().find(s => s.id === sectionId);
  }

  // ===============================
  // VALIDATION HELPERS
  // ===============================

  /**
   * Validate all collections
   */
  validateCollections(): CollectionValidation[] {
    return this.collections().map(section => ({
      sectionId: section.id,
      isValid: this.isSectionComplete(section),
      errors: this.getSectionErrors(section),
      missingCount: Math.max(0, (section.minItems || 0) - section.items.length)
    }));
  }

  /**
   * Get validation errors for a section
   */
  private getSectionErrors(section: CollectionSection): string[] {
    const errors: string[] = [];
    const minItems = section.minItems || (section.required ? 1 : 0);
    
    if (section.items.length < minItems) {
      const needed = minItems - section.items.length;
      errors.push(`${section.title} needs ${needed} more item${needed > 1 ? 's' : ''}`);
    }

    if (section.maxItems && section.items.length > section.maxItems) {
      const excess = section.items.length - section.maxItems;
      errors.push(`${section.title} has ${excess} too many items (max: ${section.maxItems})`);
    }

    return errors;
  }

  /**
   * Check if all required collections are complete
   */
  areAllRequiredSectionsComplete(): boolean {
    return this.collections()
      .filter(section => section.required)
      .every(section => this.isSectionComplete(section));
  }

  // ===============================
  // OVERRIDE BASE METHODS
  // ===============================

  /**
   * Check if component has data
   */
  hasFormData(): boolean {
    return this.totalItems() > 0;
  }

  /**
   * Custom validation including collection requirements
   */
  protected override customValidation() {
    const baseValidation = super.customValidation();
    const collectionValidations = this.validateCollections();
    
    const collectionErrors = collectionValidations
      .filter(v => !v.isValid)
      .flatMap(v => v.errors);

    return {
      isValid: baseValidation.isValid && collectionErrors.length === 0,
      errors: [...baseValidation.errors, ...collectionErrors],
      warnings: baseValidation.warnings,
      missingFields: baseValidation.missingFields
    };
  }

  /**
   * Get completion percentage based on sections completed
   */
  override getCompletionPercentage(): number {
    return this.overallProgress();
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Get item count for a specific section
   */
  getSectionItemCount(sectionId: string): number {
    return this.getSection(sectionId)?.items.length ?? 0;
  }

  /**
   * Check if section has minimum required items
   */
  hasMinimumItems(sectionId: string): boolean {
    const section = this.getSection(sectionId);
    if (!section) return false;
    
    const minItems = section.minItems || (section.required ? 1 : 0);
    return section.items.length >= minItems;
  }

  /**
   * Get missing items count for section
   */
  getMissingItemsCount(sectionId: string): number {
    const section = this.getSection(sectionId);
    if (!section) return 0;
    
    const minItems = section.minItems || (section.required ? 1 : 0);
    return Math.max(0, minItems - section.items.length);
  }

  /**
   * Generate unique ID for new items
   */
  protected generateItemId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Trigger auto-save after collection changes
   */
  private triggerAutoSave(): void {
    this.hasUnsavedChanges.set(true);
    // Trigger the debounced save from base class
    if (this.autoSaveConfig.saveOnFormChange) {
      this.saveData(false);
    }
  }

  // ===============================
  // SEARCH AND FILTERING
  // ===============================

  /**
   * Filter items in a section based on search term
   */
  filterSectionItems(sectionId: string, searchTerm: string): CollectionItem[] {
    const section = this.getSection(sectionId);
    if (!section || !searchTerm.trim()) return section?.items || [];

    const term = searchTerm.toLowerCase();
    return section.items.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(term)
      )
    );
  }

  /**
   * Get items sorted by a specific field
   */
  getSortedItems(sectionId: string, sortBy: string, ascending = true): CollectionItem[] {
    const section = this.getSection(sectionId);
    if (!section) return [];

    return [...section.items].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal < bVal) return ascending ? -1 : 1;
      if (aVal > bVal) return ascending ? 1 : -1;
      return 0;
    });
  }
}