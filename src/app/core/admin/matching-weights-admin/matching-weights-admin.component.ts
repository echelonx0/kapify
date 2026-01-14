import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Save, X } from 'lucide-angular';

import { ToastService } from 'src/app/shared/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatchingWeights } from 'src/app/funding/marketplace/components/smart-suggestions/engine/matching-engine.model';
import { MatchingWeightsService } from 'src/app/funding/marketplace/components/smart-suggestions/engine/matchingweights.service';

@Component({
  selector: 'app-matching-weights-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  template: `
    <div
      class="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
    >
      <!-- Header -->
      <h2 class="text-xl font-bold text-slate-900 mb-6">
        Matching Weights Admin
      </h2>

      <!-- Loading -->
      <div *ngIf="isLoading()" class="text-center py-12">
        <p class="text-sm text-slate-600">Loading weights...</p>
      </div>

      <!-- Form -->
      <form *ngIf="!isLoading()" (ngSubmit)="save()" class="space-y-4">
        <div *ngFor="let key of weightKeys" class="flex items-center gap-4">
          <!-- Label with fixed width -->
          <label class="w-40 text-sm font-semibold text-slate-900 capitalize">
            {{ key }}
          </label>

          <!-- Input grows to fill remaining space, right-aligned -->
          <input
            type="number"
            [(ngModel)]="weights()[key]"
            name="{{ key }}"
            min="0"
            class="flex-1 text-right px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900
               placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
               transition-all duration-200"
          />
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 mt-6">
          <!-- Save -->
          <button
            type="submit"
            class="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white font-medium rounded-xl
               hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <lucide-icon [img]="SaveIcon" size="16" />
            Save
          </button>

          <!-- Reset -->
          <button
            type="button"
            (click)="reset()"
            class="px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl
               hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
})
export class MatchingWeightsAdminComponent implements OnInit {
  private weightsService = inject(MatchingWeightsService);
  private toast = inject(ToastService);

  SaveIcon = Save;
  isLoading = signal(true);
  weights = signal<MatchingWeights>({
    fundingType: 0,
    fundingAmount: 0,
    businessStage: 0,
    industry: 0,
    geography: 0,
    intent: 0,
    recencyBonus: 0,
    competitionBonus: 0,
  });

  weightKeys: (keyof MatchingWeights)[] = [
    'fundingType',
    'fundingAmount',
    'businessStage',
    'industry',
    'geography',
    'intent',
    'recencyBonus',
    'competitionBonus',
  ];

  ngOnInit() {
    this.loadWeights();
  }

  private async loadWeights() {
    this.isLoading.set(true);
    try {
      const w = await this.weightsService.getWeights();
      this.weights.set({ ...w });
    } catch {
      this.toast.error('Failed to load matching weights');
    } finally {
      this.isLoading.set(false);
    }
  }

  async save() {
    this.isLoading.set(true);
    try {
      await this.weightsService.saveWeights(this.weights());
      this.toast.success('Weights saved successfully');
    } catch {
      this.toast.error('Failed to save weights');
    } finally {
      this.isLoading.set(false);
    }
  }

  reset() {
    this.loadWeights();
  }
}
