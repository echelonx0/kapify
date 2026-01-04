import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-angular';
import { FAQService, FAQ } from 'src/app/core/services/faq.service';

@Component({
  selector: 'app-faq-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-slate-900 mb-8">FAQ Management</h1>

        <!-- Create/Edit Form -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 class="text-lg font-bold text-slate-900 mb-6">
            {{ editingId() ? 'Edit FAQ' : 'Create FAQ' }}
          </h2>

          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2"
                  >Question</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.question"
                  placeholder="FAQ question"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2"
                  >Category</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.category"
                  placeholder="e.g., Getting Started"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-slate-900 mb-2"
                  >User Type</label
                >
                <select
                  [(ngModel)]="formData.user_type"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="sme">SME</option>
                  <option value="funder">Funder</option>
                  <option value="both">Both</option>
                </select>
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

            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2"
                >Answer</label
              >
              <textarea
                [(ngModel)]="formData.answer"
                rows="6"
                placeholder="FAQ answer"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              ></textarea>
            </div>

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

            <div class="flex gap-3 pt-4 border-t border-slate-200">
              <button
                (click)="saveFAQ()"
                [disabled]="!formData.question || !formData.answer"
                class="px-6 py-2.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
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

        <!-- FAQs List -->
        <div
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 class="font-bold text-slate-900">All FAQs</h3>
          </div>

          <div class="divide-y divide-slate-200">
            @for (faq of sortedFAQs(); track faq.id) {
            <div
              class="px-6 py-4 hover:bg-slate-50 transition-colors flex items-start gap-4"
            >
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-slate-900">{{ faq.question }}</h4>
                <p class="text-sm text-slate-600 mt-1">
                  {{ faq.category }} • {{ faq.user_type | uppercase }}
                </p>
                <p class="text-xs text-slate-500 mt-2 line-clamp-2">
                  {{ faq.answer }}
                </p>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  (click)="toggleActive(faq.id, !faq.is_active)"
                  [class.text-teal-600]="faq.is_active"
                  [class.text-slate-400]="!faq.is_active"
                  class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <lucide-angular
                    [img]="faq.is_active ? Eye : EyeOff"
                    class="w-5 h-5"
                  />
                </button>
                <button
                  (click)="startEdit(faq)"
                  class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <lucide-angular [img]="Edit2Icon" class="w-5 h-5" />
                </button>
                <button
                  (click)="deleteFAQ(faq.id)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <lucide-angular [img]="Trash2Icon" class="w-5 h-5" />
                </button>
              </div>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FAQManagementComponent implements OnInit {
  private faqService = inject(FAQService);

  readonly Edit2Icon = Edit2;
  readonly Trash2Icon = Trash2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  editingId = signal<string | null>(null);
  allFAQs = signal<FAQ[]>([]);

  readonly sortedFAQs = computed(() =>
    [...this.allFAQs()].sort((a, b) => a.sort_order - b.sort_order)
  );

  formData: Partial<FAQ> = {
    question: '',
    answer: '',
    category: '',
    user_type: 'both',
    sort_order: 0,
    is_active: true,
  };

  async ngOnInit() {
    await this.loadFAQs();
  }

  private async loadFAQs() {
    try {
      const faqs = await this.faqService.getAdminFAQs();
      this.allFAQs.set(faqs);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    }
  }

  async saveFAQ() {
    if (!this.formData.question || !this.formData.answer) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (this.editingId()) {
        await this.faqService.updateFAQ(
          this.editingId()!,
          this.formData as any
        );
      } else {
        await this.faqService.createFAQ(this.formData as any);
      }

      this.resetForm();
      await this.loadFAQs();
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      alert('Failed to save FAQ');
    }
  }

  startEdit(faq: FAQ) {
    this.editingId.set(faq.id);
    this.formData = { ...faq };
  }

  cancelEdit() {
    this.resetForm();
  }

  private resetForm() {
    this.editingId.set(null);
    this.formData = {
      question: '',
      answer: '',
      category: '',
      user_type: 'both',
      sort_order: 0,
      is_active: true,
    };
  }

  async toggleActive(id: string, isActive: boolean) {
    try {
      await this.faqService.updateFAQ(id, { is_active: isActive });
      await this.loadFAQs();
    } catch (err) {
      console.error('Failed to toggle FAQ:', err);
    }
  }

  async deleteFAQ(id: string) {
    if (!confirm('Delete this FAQ?')) return;

    try {
      await this.faqService.deleteFAQ(id);
      await this.loadFAQs();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      alert('Failed to delete FAQ');
    }
  }
}
