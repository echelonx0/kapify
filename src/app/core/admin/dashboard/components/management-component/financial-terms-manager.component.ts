// src/app/admin/dashboard/components/fund-financial-terms-management.component.ts
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
  Eye,
  EyeOff,
} from 'lucide-angular';
import {
  FundFinancialTermsService,
  FundFinancialTerm,
} from 'src/app/core/admin/services/fund-financial-terms.service';

@Component({
  selector: 'app-fund-financial-terms-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-slate-900">
            Fund Financial Terms
          </h1>
          <p class="text-slate-600 mt-2">
            Manage investment terms, equity structures, and decision timeframes
          </p>
        </div>

        <!-- Add Term Form -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 class="text-lg font-bold text-slate-900 mb-4">
            Add Financial Term
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              [(ngModel)]="newTerm.field_name"
              placeholder="Field name (e.g., equityOffered)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              [(ngModel)]="newTerm.label"
              placeholder="Field label"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              [(ngModel)]="newTerm.placeholder"
              placeholder="Placeholder (optional)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              [(ngModel)]="newTerm.hint"
              placeholder="Hint (optional)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              [(ngModel)]="newTerm.input_type"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="textarea">Textarea</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <input
              type="text"
              [(ngModel)]="newTerm.field_group"
              placeholder="Field group (e.g., equity-terms)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              [(ngModel)]="newTerm.order_index"
              placeholder="Order"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              (click)="addTerm()"
              class="px-6 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors inline-flex items-center gap-2 justify-center"
            >
              <lucide-angular [img]="PlusIcon" class="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <!-- Terms List -->
        <div
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 class="font-bold text-slate-900">
              Terms ({{ allTerms().length }})
            </h3>
          </div>

          <div class="divide-y divide-slate-200">
            @for (term of sortedTerms(); track term.id) {
            <div
              class="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
            >
              @if (editingId() === term.id) {
              <!-- Edit Mode -->
              <div
                class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2"
              >
                <input
                  type="text"
                  [ngModel]="editingTerm().label"
                  (ngModelChange)="updateEditingTerm('label', $event)"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  [ngModel]="editingTerm().placeholder"
                  (ngModelChange)="updateEditingTerm('placeholder', $event)"
                  placeholder="Placeholder"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  [ngModel]="editingTerm().hint"
                  (ngModelChange)="updateEditingTerm('hint', $event)"
                  placeholder="Hint"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  [ngModel]="editingTerm().field_group"
                  (ngModelChange)="updateEditingTerm('field_group', $event)"
                  placeholder="Group"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="number"
                  [ngModel]="editingTerm().order_index"
                  (ngModelChange)="updateEditingTerm('order_index', $event)"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <select
                  [ngModel]="editingTerm().input_type"
                  (ngModelChange)="updateEditingTerm('input_type', $event)"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="textarea">Textarea</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              <button
                (click)="saveEdit(term.id)"
                class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
              >
                <lucide-angular [img]="CheckIcon" class="w-5 h-5" />
              </button>
              <button
                (click)="editingId.set(null)"
                class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <lucide-angular [img]="XIcon" class="w-5 h-5" />
              </button>
              } @else {
              <!-- View Mode -->
              <div class="flex-1">
                <p class="font-medium text-slate-900">{{ term.label }}</p>
                <div class="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p>
                    Field:
                    <code class="bg-slate-100 px-1.5 rounded">{{
                      term.field_name
                    }}</code>
                  </p>
                  <p>
                    Type: <span class="font-mono">{{ term.input_type }}</span> |
                    Group: {{ term.field_group || '—' }} | Order:
                    {{ term.order_index }}
                  </p>
                  @if (term.placeholder) {
                  <p>Placeholder: {{ term.placeholder }}</p>
                  } @if (term.hint) {
                  <p>Hint: {{ term.hint }}</p>
                  }
                </div>
              </div>
              <button
                (click)="toggleActive(term.id, !term.is_active)"
                [class.text-teal-600]="term.is_active"
                [class.text-slate-400]="!term.is_active"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                title="Toggle active"
              >
                <lucide-angular
                  [img]="term.is_active ? EyeIcon : EyeOffIcon"
                  class="w-5 h-5"
                />
              </button>
              <button
                (click)="startEdit(term)"
                class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <lucide-angular [img]="Edit2Icon" class="w-5 h-5" />
              </button>
              <button
                (click)="deleteTerm(term.id)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <lucide-angular [img]="Trash2Icon" class="w-5 h-5" />
              </button>
              }
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FundFinancialTermsManagementComponent implements OnInit {
  private service = inject(FundFinancialTermsService);

  readonly editingId = signal<string | null>(null);
  readonly editingTerm = signal<Partial<FundFinancialTerm>>({});

  PlusIcon = Plus;
  Trash2Icon = Trash2;
  Edit2Icon = Edit2;
  CheckIcon = Check;
  XIcon = X;
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;

  newTerm: any = {
    field_name: '',
    label: '',
    placeholder: '',
    hint: '',
    order_index: 0,
    is_required: true,
    input_type: 'text',
    field_group: '',
    is_active: true,
  };

  readonly allTerms = computed(() => this.service.allTerms());

  readonly sortedTerms = computed(() =>
    [...this.allTerms()].sort((a, b) => a.order_index - b.order_index)
  );

  async ngOnInit() {
    await this.service.loadAllTerms();
  }

  async addTerm() {
    if (!this.newTerm.field_name || !this.newTerm.label) {
      console.warn('Field name and label are required');
      return;
    }

    await this.service.createTerm({
      ...this.newTerm,
    });

    this.newTerm = {
      field_name: '',
      label: '',
      placeholder: '',
      hint: '',
      order_index: 0,
      is_required: true,
      input_type: 'text',
      field_group: '',
      is_active: true,
    };
  }

  startEdit(term: FundFinancialTerm) {
    this.editingId.set(term.id);
    this.editingTerm.set({ ...term });
  }

  updateEditingTerm(key: keyof FundFinancialTerm, value: any) {
    const current = this.editingTerm();
    this.editingTerm.set({ ...current, [key]: value });
  }

  async saveEdit(id: string) {
    await this.service.updateTerm(id, this.editingTerm());
    this.editingId.set(null);
    this.editingTerm.set({});
  }

  async deleteTerm(id: string) {
    if (confirm('Delete this term?')) {
      await this.service.deleteTerm(id);
    }
  }

  async toggleActive(id: string, isActive: boolean) {
    await this.service.toggleActive(id, isActive);
  }
}
