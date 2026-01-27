// import {
//   Component,
//   OnInit,
//   inject,
//   signal,
//   computed,
//   OnDestroy,
//   ViewChildren,
//   QueryList,
//   ElementRef,
//   HostListener,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute } from '@angular/router';
// import { Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { ActivityService } from 'src/app/shared/services/activity.service';
// import { DemographicCategory } from 'src/app/shared/models/funding-application-demographics.model';
// import { DemographicsConfigService } from 'src/app/core/services/demographics-config.service';
// import { DemographicsService } from 'src/app/core/services/demographics.service';
// import {
//   FundingRequestLayoutComponent,
//   LayoutHeader,
//   LayoutAction,
// } from '../funding-request-layout.component';
// import { FormSection } from '../form-section-navigator.component';

// /**
//  * DemographicsFormComponent with Section Navigation
//  *
//  * - Displays demographics categories as form sections
//  * - Section navigator sidebar for quick category navigation
//  * - Scroll-to-section when nav item clicked
//  * - Tracks active section based on scroll position
//  * - No new business logic, purely UI/navigation improvements
//  */
// @Component({
//   selector: 'app-demographics-form',
//   standalone: true,
//   imports: [CommonModule, FormsModule, FundingRequestLayoutComponent],
//   template: `
//     <!-- LAYOUT WITH SIDEBAR -->
//     <div class="flex h-full w-full">
//       <!-- MAIN CONTENT -->
//       <div class="flex-1 flex flex-col overflow-hidden">
//         <app-funding-request-layout
//           [header]="layoutHeader()"
//           [actions]="layoutActions()"
//           [metadata]="layoutMetadata()"
//           [error]="error"
//           [success]="successMessage"
//         >
//           <!-- LOADING STATE -->
//           <div
//             *ngIf="isLoading()"
//             class="flex items-center justify-center h-96"
//           >
//             <div class="text-center">
//               <div
//                 class="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"
//               ></div>
//               <p class="text-slate-600 font-semibold">
//                 Loading demographics...
//               </p>
//             </div>
//           </div>

//           <!-- FORM CONTENT -->
//           <div
//             *ngIf="!isLoading()"
//             class="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-8"
//             (scroll)="onContentScroll()"
//           >
//             <!-- CATEGORIES AS SECTIONS -->
//             @for (category of categories(); track trackByCategory($index,
//             category)) {
//             <section [attr.data-category]="category.id" class="form-section">
//               <div
//                 class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
//               >
//                 <!-- Category Header -->
//                 <div
//                   class="px-6 lg:px-8 py-6 border-b border-slate-200 bg-slate-50"
//                 >
//                   <h2 class="text-xl font-bold text-slate-900">
//                     {{ category.label }}
//                   </h2>
//                   <p class="text-sm text-slate-600 mt-2">
//                     {{ category.description || 'Complete this section' }}
//                   </p>

//                   <!-- Category Completion -->
//                   <div class="mt-4 flex items-center justify-between">
//                     <div class="text-xs text-slate-600 font-semibold">
//                       {{
//                         completionStatus().categoryCompletion[category.id]
//                           .filled || 0
//                       }}/{{
//                         completionStatus().categoryCompletion[category.id]
//                           .total || 0
//                       }}
//                       completed
//                     </div>
//                     <div
//                       class="h-2 w-32 bg-slate-200 rounded-full overflow-hidden"
//                     >
//                       <div
//                         class="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-500"
//                         [style.width.%]="
//                           completionStatus().categoryCompletion[category.id]
//                             .percentage || 0
//                         "
//                       ></div>
//                     </div>
//                   </div>
//                 </div>

//                 <!-- Fields -->
//                 <div class="px-6 lg:px-8 py-6 space-y-6">
//                   @for (field of category.fields; track trackByField($index,
//                   field)) {
//                   <div>
//                     <!-- Label -->
//                     <label
//                       [for]="category.id + '_' + field.name"
//                       class="block text-sm font-semibold text-slate-900 mb-2"
//                     >
//                       {{ field.label }}
//                       @if (field.required) {
//                       <span class="text-red-600 font-bold">*</span>
//                       }
//                     </label>

//                     <!-- Input: Text -->
//                     @switch (field.type) { @case ('text') {
//                     <input
//                       [id]="category.id + '_' + field.name"
//                       type="text"
//                       [value]="
//                         formatFieldValue(
//                           demographicsData()[category.id][field.name]
//                         )
//                       "
//                       (change)="
//                         onFieldChange(
//                           category.id,
//                           field.name,
//                           $any($event.target).value
//                         )
//                       "
//                       [placeholder]="field.placeholder || 'Enter value'"
//                       class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//                     />
//                     } @case ('number') {
//                     <!-- Input: Number -->
//                     <input
//                       [id]="category.id + '_' + field.name"
//                       type="number"
//                       [value]="
//                         formatFieldValue(
//                           demographicsData()[category.id][field.name]
//                         )
//                       "
//                       (change)="
//                         onFieldChange(
//                           category.id,
//                           field.name,
//                           $any($event.target).value
//                         )
//                       "
//                       [min]="field.min"
//                       [max]="field.max"
//                       [placeholder]="field.placeholder || 'Enter number'"
//                       class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//                     />
//                     } @case ('percentage') {
//                     <!-- Input: Percentage -->
//                     <div class="flex items-center gap-2">
//                       <input
//                         [id]="category.id + '_' + field.name"
//                         type="number"
//                         [value]="
//                           formatFieldValue(
//                             demographicsData()[category.id][field.name]
//                           )
//                         "
//                         (change)="
//                           onFieldChange(
//                             category.id,
//                             field.name,
//                             $any($event.target).value
//                           )
//                         "
//                         min="0"
//                         max="100"
//                         [placeholder]="field.placeholder || '0-100'"
//                         class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//                       />
//                       <span class="text-lg font-black text-slate-900">%</span>
//                     </div>
//                     } @case ('dropdown') {
//                     <!-- Input: Dropdown -->
//                     <select
//                       [id]="category.id + '_' + field.name"
//                       [value]="
//                         formatFieldValue(
//                           demographicsData()[category.id][field.name]
//                         )
//                       "
//                       (change)="
//                         onFieldChange(
//                           category.id,
//                           field.name,
//                           $any($event.target).value
//                         )
//                       "
//                       class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       @for (option of field.options; track option) {
//                       <option [value]="option">{{ option }}</option>
//                       }
//                     </select>
//                     } }

//                     <!-- Help Text -->
//                     @if (field.helpText) {
//                     <p class="text-xs text-slate-600 mt-2">
//                       {{ field.helpText }}
//                     </p>
//                     }
//                   </div>
//                   }
//                 </div>
//               </div>
//             </section>
//             }

//             <!-- No categories message -->
//             @if (!categories().length) {
//             <div class="text-center py-12">
//               <p class="text-slate-600 font-semibold">
//                 No demographic categories configured yet.
//               </p>
//             </div>
//             }
//           </div>
//         </app-funding-request-layout>
//       </div>
//     </div>
//   `,
//   styles: [
//     `
//       :host {
//         display: block;
//         height: 100%;
//         width: 100%;
//       }

//       .form-section {
//         scroll-margin-top: 120px; /* Account for sticky header */
//       }
//     `,
//   ],
// })
// export class DemographicsFormComponent implements OnInit, OnDestroy {
//   demographicsService = inject(DemographicsService);
//   private activityService = inject(ActivityService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private configService = inject(DemographicsConfigService);
//   private destroy$ = new Subject<void>();

//   @ViewChildren('form-section', { read: ElementRef })
//   sectionRefs!: QueryList<ElementRef>;

//   // ===== STATE =====
//   isLoading = signal(false);
//   isSaving = signal(false);
//   error = signal<string | null>(null);
//   successMessage = signal<string | null>(null);
//   coverId = signal<string | null>(null);
//   activeSection = signal<string | null>(null);

//   // Demographics data
//   demographicsData = this.demographicsService.demographics;

//   // Categories as computed signal
//   categories = computed(() => {
//     const cfg = this.configService.config();
//     return cfg?.categories || [];
//   });

//   // Navigation sections derived from categories
//   navSections = computed<FormSection[]>(() => {
//     return this.categories().map((cat) => ({
//       id: cat.id,
//       label: cat.label,
//     }));
//   });

//   // Completion status
//   completionStatus = computed(() => {
//     return this.demographicsService.getCompletionStatus(
//       this.demographicsData()
//     );
//   });

//   // ===== LAYOUT CONFIG =====

//   layoutHeader = computed<LayoutHeader>(() => ({
//     title: 'Demographics',
//     subtitle: 'Tell us more about your business and impact',
//     badge: {
//       label: 'Complete',
//       value: this.completionStatus().completionPercentage,
//       color: 'teal' as const,
//     },
//   }));

//   layoutMetadata = computed(() => {
//     const savedAt = this.demographicsService.savedAt();
//     if (!savedAt) return 'Not saved yet';
//     return `Last saved: ${new Date(savedAt).toLocaleTimeString()}`;
//   });

//   layoutActions = computed<LayoutAction[]>(() => [
//     {
//       label: 'Cancel',
//       action: () => this.goBack(),
//       variant: 'secondary',
//       disabled: this.isSaving(),
//     },
//     {
//       label: 'Save Demographics',
//       action: () => this.saveDemographics(),
//       variant: 'primary',
//       loading: this.isSaving(),
//       disabled: this.isSaving(),
//     },
//   ]);

//   ngOnInit(): void {
//     // Set initial active section
//     if (this.categories().length > 0) {
//       this.activeSection.set(this.categories()[0].id);
//     }

//     // Get cover ID from route params
//     this.route.queryParams
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((params) => {
//         const id = params['coverId'];
//         if (id) {
//           this.coverId.set(id);
//           this.loadDemographics(id);
//         }
//       });
//   }

//   /**
//    * Load demographics for the funding request
//    */
//   private async loadDemographics(coverId: string): Promise<void> {
//     try {
//       this.isLoading.set(true);
//       this.error.set(null);

//       await this.demographicsService.loadDemographics(coverId);

//       this.activityService.trackProfileActivity(
//         'updated',
//         'Opened demographics form',
//         'demographics_form_opened'
//       );
//     } catch (err: any) {
//       this.error.set(err?.message || 'Failed to load demographics');
//       console.error('❌ Load error:', err);
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   /**
//    * Handle field value change
//    */
//   onFieldChange(categoryId: string, fieldName: string, value: any): void {
//     this.demographicsService.setFieldValue(categoryId, fieldName, value);
//     this.error.set(null);
//   }

//   /**
//    * Save demographics
//    */
//   saveDemographics(): void {
//     const coverId = this.coverId();
//     if (!coverId) {
//       this.error.set('No funding request selected');
//       return;
//     }

//     this.isSaving.set(true);
//     const data = this.demographicsData();

//     this.demographicsService
//       .saveDemographics(coverId, data)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: () => {
//           this.successMessage.set('Demographics saved successfully');
//           setTimeout(() => this.successMessage.set(null), 3000);

//           this.activityService.trackProfileActivity(
//             'updated',
//             'Demographics saved successfully',
//             'demographics_saved_success'
//           );

//           // Navigate back after save
//           setTimeout(() => this.goBack(), 1500);
//         },
//         error: (err) => {
//           this.isSaving.set(false);
//           this.error.set(err?.message || 'Failed to save demographics');
//           console.error('❌ Save error:', err);
//         },
//       });
//   }

//   /**
//    * Scroll to section
//    */
//   scrollToSection(sectionId: string): void {
//     this.activeSection.set(sectionId);

//     // Find element by data attribute
//     setTimeout(() => {
//       const element = document.querySelector(
//         `section[data-category="${sectionId}"]`
//       ) as HTMLElement;

//       if (element) {
//         element.scrollIntoView({
//           behavior: 'smooth',
//           block: 'start',
//         });
//       }
//     }, 0);
//   }

//   /**
//    * Track active section on scroll
//    */
//   @HostListener('window:scroll', ['$event'])
//   onContentScroll(): void {
//     // Track which section is in viewport
//     const threshold = 200;
//     const sections = document.querySelectorAll('section[data-category]');

//     for (let section of sections) {
//       const rect = (section as HTMLElement).getBoundingClientRect();
//       if (rect.top < threshold && rect.bottom > 0) {
//         this.activeSection.set(
//           (section as HTMLElement).getAttribute('data-category') || ''
//         );
//         break;
//       }
//     }
//   }

//   /**
//    * Go back to funding request editor
//    */
//   goBack(): void {
//     const coverId = this.coverId();
//     if (coverId) {
//       this.router.navigate([], {
//         relativeTo: this.route.parent,
//         queryParams: {
//           mode: 'edit',
//           coverId,
//           view: null,
//         },
//         queryParamsHandling: 'merge',
//       });
//     } else {
//       this.router.navigate(['..'], { relativeTo: this.route });
//     }
//   }

//   /**
//    * Format field value for display
//    */
//   formatFieldValue(value: any): string {
//     if (value === null || value === undefined) return '';
//     return String(value);
//   }

//   /**
//    * Track by category for *ngFor
//    */
//   trackByCategory(index: number, category: DemographicCategory): string {
//     return category.id;
//   }

//   /**
//    * Track by field for *ngFor
//    */
//   trackByField(index: number, field: any): string {
//     return field.id || field.name || '';
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
  ViewChildren,
  QueryList,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { DemographicCategory } from 'src/app/shared/models/funding-application-demographics.model';
import { DemographicsConfigService } from 'src/app/core/services/demographics-config.service';
import { DemographicsService } from 'src/app/core/services/demographics.service';
import {
  FundingRequestLayoutComponent,
  LayoutHeader,
  LayoutAction,
} from '../funding-request-layout.component';
import { FormSection } from '../form-section-navigator.component';

/**
 * DemographicsFormComponent with Section Navigation
 *
 * - Displays demographics categories as form sections
 * - Section navigator sidebar for quick category navigation
 * - Scroll-to-section when nav item clicked
 * - Tracks active section based on scroll position
 * - No new business logic, purely UI/navigation improvements
 */
@Component({
  selector: 'app-demographics-form',
  standalone: true,
  imports: [CommonModule, FormsModule, FundingRequestLayoutComponent],
  template: `
    <!-- LAYOUT WITH SIDEBAR -->
    <div class="flex h-full w-full">
      <!-- MAIN CONTENT -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-funding-request-layout
          [header]="layoutHeader()"
          [actions]="layoutActions()"
          [metadata]="layoutMetadata()"
          [error]="error"
          [success]="successMessage"
        >
          <!-- LOADING STATE -->
          <div
            *ngIf="isLoading()"
            class="flex items-center justify-center h-96"
          >
            <div class="text-center">
              <div
                class="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"
              ></div>
              <p class="text-slate-600 font-semibold">
                Loading demographics...
              </p>
            </div>
          </div>

          <!-- FORM CONTENT -->
          <div
            *ngIf="!isLoading()"
            class="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-8"
            (scroll)="onContentScroll()"
          >
            <!-- CATEGORIES AS SECTIONS -->
            @for (category of categories(); track trackByCategory($index,
            category)) {
            <section [attr.data-category]="category.id" class="form-section">
              <div
                class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <!-- Category Header -->
                <div
                  class="px-6 lg:px-8 py-6 border-b border-slate-200 bg-slate-50"
                >
                  <h2 class="text-xl font-bold text-slate-900">
                    {{ category.label }}
                  </h2>
                  <p class="text-sm text-slate-600 mt-2">
                    {{ category.description || 'Complete this section' }}
                  </p>

                  <!-- Category Completion -->
                  <div class="mt-4 flex items-center justify-between">
                    <div class="text-xs text-slate-600 font-semibold">
                      {{
                        completionStatus().categoryCompletion[category.id]
                          .filled || 0
                      }}/{{
                        completionStatus().categoryCompletion[category.id]
                          .total || 0
                      }}
                      completed
                    </div>
                    <div
                      class="h-2 w-32 bg-slate-200 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-500"
                        [style.width.%]="
                          completionStatus().categoryCompletion[category.id]
                            .percentage || 0
                        "
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Fields -->
                <div class="px-6 lg:px-8 py-6 space-y-6">
                  @for (field of category.fields; track trackByField($index,
                  field)) {
                  <div>
                    <!-- Label -->
                    <label
                      [for]="category.id + '_' + field.name"
                      class="block text-sm font-semibold text-slate-900 mb-2"
                    >
                      {{ field.label }}
                      @if (field.required) {
                      <span class="text-red-600 font-bold">*</span>
                      }
                    </label>

                    <!-- Input: Text -->
                    @switch (field.type) { @case ('text') {
                    <input
                      [id]="category.id + '_' + field.name"
                      type="text"
                      [value]="getFieldValue(category.id, field.name)"
                      (change)="
                        onFieldChange(
                          category.id,
                          field.name,
                          $any($event.target).value
                        )
                      "
                      [placeholder]="field.placeholder || 'Enter value'"
                      class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    />
                    } @case ('number') {
                    <!-- Input: Number -->
                    <input
                      [id]="category.id + '_' + field.name"
                      type="number"
                      [value]="getFieldValue(category.id, field.name)"
                      (change)="
                        onFieldChange(
                          category.id,
                          field.name,
                          $any($event.target).value
                        )
                      "
                      [min]="field.min"
                      [max]="field.max"
                      [placeholder]="field.placeholder || 'Enter number'"
                      class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    />
                    } @case ('percentage') {
                    <!-- Input: Percentage -->
                    <div class="flex items-center gap-2">
                      <input
                        [id]="category.id + '_' + field.name"
                        type="number"
                        [value]="getFieldValue(category.id, field.name)"
                        (change)="
                          onFieldChange(
                            category.id,
                            field.name,
                            $any($event.target).value
                          )
                        "
                        min="0"
                        max="100"
                        [placeholder]="field.placeholder || '0-100'"
                        class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                      />
                      <span class="text-lg font-black text-slate-900">%</span>
                    </div>
                    } @case ('dropdown') {
                    <!-- Input: Dropdown -->
                    <select
                      [id]="category.id + '_' + field.name"
                      [value]="getFieldValue(category.id, field.name)"
                      (change)="
                        onFieldChange(
                          category.id,
                          field.name,
                          $any($event.target).value
                        )
                      "
                      class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                    >
                      <option value="">-- Select --</option>
                      @for (option of field.options; track option) {
                      <option [value]="option">{{ option }}</option>
                      }
                    </select>
                    } }

                    <!-- Help Text -->
                    @if (field.helpText) {
                    <p class="text-xs text-slate-600 mt-2">
                      {{ field.helpText }}
                    </p>
                    }
                  </div>
                  }
                </div>
              </div>
            </section>
            }

            <!-- No categories message -->
            @if (!categories().length) {
            <div class="text-center py-12">
              <p class="text-slate-600 font-semibold">
                No demographic categories configured yet.
              </p>
            </div>
            }
          </div>
        </app-funding-request-layout>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .form-section {
        scroll-margin-top: 120px; /* Account for sticky header */
      }
    `,
  ],
})
export class DemographicsFormComponent implements OnInit, OnDestroy {
  demographicsService = inject(DemographicsService);
  private activityService = inject(ActivityService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private configService = inject(DemographicsConfigService);
  private destroy$ = new Subject<void>();

  @ViewChildren('form-section', { read: ElementRef })
  sectionRefs!: QueryList<ElementRef>;

  // ===== STATE =====
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  coverId = signal<string | null>(null);
  activeSection = signal<string | null>(null);

  // Demographics data
  demographicsData = this.demographicsService.demographics;

  // Categories as computed signal
  categories = computed(() => {
    const cfg = this.configService.config();
    return cfg?.categories || [];
  });

  // Navigation sections derived from categories
  navSections = computed<FormSection[]>(() => {
    return this.categories().map((cat) => ({
      id: cat.id,
      label: cat.label,
    }));
  });

  // Completion status
  completionStatus = computed(() => {
    return this.demographicsService.getCompletionStatus(
      this.demographicsData()
    );
  });

  // ===== LAYOUT CONFIG =====

  layoutHeader = computed<LayoutHeader>(() => ({
    title: 'Demographics',
    subtitle: 'Tell us more about your business and impact',
    badge: {
      label: 'Complete',
      value: this.completionStatus().completionPercentage,
      color: 'teal' as const,
    },
  }));

  layoutMetadata = computed(() => {
    const savedAt = this.demographicsService.savedAt();
    if (!savedAt) return 'Not saved yet';
    return `Last saved: ${new Date(savedAt).toLocaleTimeString()}`;
  });

  layoutActions = computed<LayoutAction[]>(() => [
    {
      label: 'Cancel',
      action: () => this.goBack(),
      variant: 'secondary',
      disabled: this.isSaving(),
    },
    {
      label: 'Save Demographics',
      action: () => this.saveDemographics(),
      variant: 'primary',
      loading: this.isSaving(),
      disabled: this.isSaving(),
    },
  ]);

  ngOnInit(): void {
    // Set initial active section
    if (this.categories().length > 0) {
      this.activeSection.set(this.categories()[0].id);
    }

    // Get cover ID from route params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['coverId'];
        if (id) {
          this.coverId.set(id);
          this.loadDemographics(id);
        }
      });
  }

  /**
   * Load demographics for the funding request
   */
  private async loadDemographics(coverId: string): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      await this.demographicsService.loadDemographics(coverId);

      this.activityService.trackProfileActivity(
        'updated',
        'Opened demographics form',
        'demographics_form_opened'
      );
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to load demographics');
      console.error('❌ Load error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Safely get field value with null coalescing
   * Returns empty string if path doesn't exist
   */
  getFieldValue(categoryId: string, fieldName: string): string {
    try {
      const categoryData = this.demographicsData()[categoryId];
      if (!categoryData) return '';

      const value = categoryData[fieldName];
      if (value === null || value === undefined) return '';

      return String(value);
    } catch (error) {
      return '';
    }
  }

  /**
   * Handle field value change
   */
  onFieldChange(categoryId: string, fieldName: string, value: any): void {
    this.demographicsService.setFieldValue(categoryId, fieldName, value);
    this.error.set(null);
  }

  /**
   * Save demographics
   */
  saveDemographics(): void {
    const coverId = this.coverId();
    if (!coverId) {
      this.error.set('No funding request selected');
      return;
    }

    this.isSaving.set(true);
    const data = this.demographicsData();

    this.demographicsService
      .saveDemographics(coverId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage.set('Demographics saved successfully');
          setTimeout(() => this.successMessage.set(null), 3000);

          this.activityService.trackProfileActivity(
            'updated',
            'Demographics saved successfully',
            'demographics_saved_success'
          );

          // Navigate back after save
          setTimeout(() => this.goBack(), 1500);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.error.set(err?.message || 'Failed to save demographics');
          console.error('❌ Save error:', err);
        },
      });
  }

  /**
   * Scroll to section
   */
  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);

    // Find element by data attribute
    setTimeout(() => {
      const element = document.querySelector(
        `section[data-category="${sectionId}"]`
      ) as HTMLElement;

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 0);
  }

  /**
   * Track active section on scroll
   */
  @HostListener('window:scroll', ['$event'])
  onContentScroll(): void {
    // Track which section is in viewport
    const threshold = 200;
    const sections = document.querySelectorAll('section[data-category]');

    for (let section of sections) {
      const rect = (section as HTMLElement).getBoundingClientRect();
      if (rect.top < threshold && rect.bottom > 0) {
        this.activeSection.set(
          (section as HTMLElement).getAttribute('data-category') || ''
        );
        break;
      }
    }
  }

  /**
   * Go back to funding request editor
   */
  goBack(): void {
    const coverId = this.coverId();
    if (coverId) {
      this.router.navigate([], {
        relativeTo: this.route.parent,
        queryParams: {
          mode: 'edit',
          coverId,
          view: null,
        },
        queryParamsHandling: 'merge',
      });
    } else {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  /**
   * Track by category for *ngFor
   */
  trackByCategory(index: number, category: DemographicCategory): string {
    return category.id;
  }

  /**
   * Track by field for *ngFor
   */
  trackByField(index: number, field: any): string {
    return field.id || field.name || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
