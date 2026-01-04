// src/app/admin/dashboard/components/back-office-questions-management.component.ts
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
  BackOfficeFormQuestionsService,
  BackOfficeFormQuestion,
} from 'src/app/core/admin/services/form-questions.service';

@Component({
  selector: 'app-back-office-questions-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-slate-900">
            Back Office Form Questions
          </h1>
          <p class="text-slate-600 mt-2">
            Manage form labels, placeholders, and field configuration
          </p>
        </div>

        <!-- Add Question Form -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h3 class="text-lg font-bold text-slate-900 mb-4">Add Question</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              [(ngModel)]="newQuestion.field_name"
              placeholder="Field name (e.g., accountingSystem)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              [(ngModel)]="newQuestion.label"
              placeholder="Question label"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              [(ngModel)]="newQuestion.placeholder"
              placeholder="Placeholder (optional)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              [(ngModel)]="newQuestion.hint"
              placeholder="Hint (optional)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              [(ngModel)]="newQuestion.input_type"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="textarea">Textarea</option>
            </select>
            <input
              type="text"
              [(ngModel)]="newQuestion.field_group"
              placeholder="Field group (e.g., accounting-row)"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              [(ngModel)]="newQuestion.order_index"
              placeholder="Order"
              class="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              (click)="addQuestion()"
              class="px-6 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors inline-flex items-center gap-2 justify-center"
            >
              <lucide-angular [img]="PlusIcon" class="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <!-- Questions List -->
        <div
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 class="font-bold text-slate-900">
              Questions ({{ allQuestions().length }})
            </h3>
          </div>

          <div class="divide-y divide-slate-200">
            @for (q of sortedQuestions(); track q.id) {
            <div
              class="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
            >
              @if (editingId() === q.id) {
              <!-- Edit Mode -->
              <div
                class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2"
              >
                <input
                  type="text"
                  [ngModel]="editingQuestion().label"
                  (ngModelChange)="updateEditingQuestion('label', $event)"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  [ngModel]="editingQuestion().placeholder"
                  (ngModelChange)="updateEditingQuestion('placeholder', $event)"
                  placeholder="Placeholder"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  [ngModel]="editingQuestion().hint"
                  (ngModelChange)="updateEditingQuestion('hint', $event)"
                  placeholder="Hint"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  [ngModel]="editingQuestion().field_group"
                  (ngModelChange)="updateEditingQuestion('field_group', $event)"
                  placeholder="Group"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="number"
                  [ngModel]="editingQuestion().order_index"
                  (ngModelChange)="updateEditingQuestion('order_index', $event)"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <select
                  [ngModel]="editingQuestion().input_type"
                  (ngModelChange)="updateEditingQuestion('input_type', $event)"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="textarea">Textarea</option>
                </select>
              </div>
              <button
                (click)="saveEdit(q.id)"
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
                <p class="font-medium text-slate-900">{{ q.label }}</p>
                <div class="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p>
                    Field:
                    <code class="bg-slate-100 px-1.5 rounded">{{
                      q.field_name
                    }}</code>
                  </p>
                  <p>
                    Type: <span class="font-mono">{{ q.input_type }}</span> |
                    Group: {{ q.field_group || '—' }} | Order:
                    {{ q.order_index }}
                  </p>
                  @if (q.placeholder) {
                  <p>Placeholder: {{ q.placeholder }}</p>
                  } @if (q.hint) {
                  <p>Hint: {{ q.hint }}</p>
                  }
                </div>
              </div>
              <button
                (click)="toggleActive(q.id, !q.is_active)"
                [class.text-teal-600]="q.is_active"
                [class.text-slate-400]="!q.is_active"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                title="Toggle active"
              >
                <lucide-angular
                  [img]="q.is_active ? EyeIcon : EyeOffIcon"
                  class="w-5 h-5"
                />
              </button>
              <button
                (click)="startEdit(q)"
                class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <lucide-angular [img]="Edit2Icon" class="w-5 h-5" />
              </button>
              <button
                (click)="deleteQuestion(q.id)"
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
export class BackOfficeQuestionsManagementComponent implements OnInit {
  private service = inject(BackOfficeFormQuestionsService);

  readonly editingId = signal<string | null>(null);
  readonly editingQuestion = signal<Partial<BackOfficeFormQuestion>>({});

  PlusIcon = Plus;
  Trash2Icon = Trash2;
  Edit2Icon = Edit2;
  CheckIcon = Check;
  XIcon = X;
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;

  newQuestion: any = {
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

  readonly allQuestions = computed(() => this.service.allQuestions());

  readonly sortedQuestions = computed(() =>
    [...this.allQuestions()].sort((a, b) => a.order_index - b.order_index)
  );

  async ngOnInit() {
    await this.service.loadAllQuestions();
  }

  async addQuestion() {
    if (!this.newQuestion.field_name || !this.newQuestion.label) {
      console.warn('Field name and label are required');
      return;
    }

    await this.service.createQuestion({
      ...this.newQuestion,
    });

    this.newQuestion = {
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

  startEdit(q: BackOfficeFormQuestion) {
    this.editingId.set(q.id);
    this.editingQuestion.set({ ...q });
  }

  updateEditingQuestion(key: keyof BackOfficeFormQuestion, value: any) {
    const current = this.editingQuestion();
    this.editingQuestion.set({ ...current, [key]: value });
  }

  async saveEdit(id: string) {
    await this.service.updateQuestion(id, this.editingQuestion());
    this.editingId.set(null);
    this.editingQuestion.set({});
  }

  async deleteQuestion(id: string) {
    if (confirm('Delete this question?')) {
      await this.service.deleteQuestion(id);
    }
  }

  async toggleActive(id: string, isActive: boolean) {
    await this.service.toggleActive(id, isActive);
  }
}
