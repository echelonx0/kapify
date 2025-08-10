// src/app/profile/steps/swot-analysis.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, X, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Info } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, UiCardComponent, UiInputComponent } from '../../../shared/components';
import { UiSectionCardComponent } from '../../../shared/components/ui-section-card.component';
import { UiTextareaComponent } from '../../../shared/components/ui-textarea.component';
import { SWOTCategory } from '../../../shared/models/swot.models';
import { ProfileService } from '../../profile.service';
 

interface SWOTItem {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

interface SWOTSection {
  category: SWOTCategory;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  items: SWOTItem[];
}

@Component({
  selector: 'app-swot-analysis',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
    UiTextareaComponent,
    UiSectionCardComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <ui-card>
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-blue-600" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral-900">SWOT Analysis</h2>
              <p class="text-neutral-600 mt-1">
                Analyze your business strengths, weaknesses, opportunities, and threats to provide strategic insights.
              </p>
            </div>
          </div>
          <div class="text-sm text-neutral-500">
            {{ getCompletionPercentage() }}% Complete
          </div>
        </div>
      </ui-card>

      <!-- Progress Indicator -->
      <div class="bg-white rounded-lg border border-neutral-200 p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-neutral-700">Overall Progress</span>
          <span class="text-sm text-neutral-600">{{ getCompletionPercentage() }}%</span>
        </div>
        <div class="w-full bg-neutral-200 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            [style.width.%]="getCompletionPercentage()"
          ></div>
        </div>
        <div class="grid grid-cols-4 gap-2 mt-3">
          @for (section of swotSections(); track section.category) {
            <div class="text-center">
              <div class="text-xs font-medium" [class]="section.color">{{ section.title }}</div>
              <div class="text-xs text-neutral-500">{{ section.items.length }} items</div>
            </div>
          }
        </div>
      </div>

      <!-- SWOT Sections -->
      @for (section of swotSections(); track section.category) {
        <ui-section-card 
          [title]="section.title" 
          [description]="section.description"
          [expanded]="true"
        >
          <div class="space-y-4">
            <!-- Existing Items -->
            @if (section.items.length > 0) {
              <div class="space-y-3">
                @for (item of section.items; track $index) {
                  <div class="border border-neutral-200 rounded-lg p-4" [class]="section.bgColor">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                          <lucide-icon [img]="section.icon" [size]="16" [class]="section.color" />
                          <h4 class="font-medium text-neutral-900">{{ item.title }}</h4>
                          <span 
                            class="px-2 py-1 text-xs rounded-full"
                            [class]="getImpactClass(item.impact)"
                          >
                            {{ item.impact | titlecase }} Impact
                          </span>
                        </div>
                        <p class="text-sm text-neutral-600">{{ item.description }}</p>
                      </div>
                      <ui-button 
                        variant="ghost" 
                        size="sm"
                        (clicked)="removeItem(section.category, $index)"
                      >
                        <lucide-icon [img]="XIcon" [size]="16" />
                      </ui-button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                <lucide-icon [img]="section.icon" [size]="48" class="mx-auto text-neutral-400 mb-2" />
                <p class="text-neutral-500">No {{ section.title.toLowerCase() }} added yet</p>
                <p class="text-sm text-neutral-400 mt-1">{{ getEmptyStateMessage(section.category) }}</p>
              </div>
            }

            <!-- Add New Item Form -->
            @if (getActiveForm() === section.category) {
              <form [formGroup]="itemForm()" (ngSubmit)="addItem(section.category)" class="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 mb-1">
                      {{ section.title.slice(0, -1) }} Title *
                    </label>
                    <ui-input
                      formControlName="title"
                      [placeholder]="getPlaceholder(section.category, 'title')"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 mb-1">
                      Description *
                    </label>
                    <ui-textarea
                      formControlName="description"
                      [placeholder]="getPlaceholder(section.category, 'description')"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 mb-1">
                      Impact Level *
                    </label>
                    <select 
                      formControlName="impact"
                      class="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select impact level</option>
                      <option value="low">Low Impact</option>
                      <option value="medium">Medium Impact</option>
                      <option value="high">High Impact</option>
                    </select>
                  </div>
                  
                  <div class="flex items-center justify-end space-x-3">
                    <ui-button 
                      variant="outline" 
                      type="button"
                      (clicked)="cancelAddItem()"
                    >
                      Cancel
                    </ui-button>
                    <ui-button 
                      variant="primary"
                      type="submit"
                      [disabled]="!itemForm().valid"
                    >
                      Add {{ section.title.slice(0, -1) }}
                    </ui-button>
                  </div>
                </div>
              </form>
            } @else {
              <ui-button 
                variant="outline" 
                (clicked)="startAddItem(section.category)"
                class="w-full"
              >
                <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
                Add {{ section.title.slice(0, -1) }}
              </ui-button>
            }
          </div>
        </ui-section-card>
      }

      <!-- Summary & Insights -->
      @if (hasAnyItems()) {
        <ui-card>
          <h3 class="text-lg font-semibold text-neutral-900 mb-4">SWOT Summary</h3>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-neutral-900 mb-2 flex items-center">
                <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-600 mr-2" />
                Internal Factors
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-600">Strengths:</span>
                  <span class="font-medium">{{ getItemCount('strengths') }} identified</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-600">Weaknesses:</span>
                  <span class="font-medium">{{ getItemCount('weaknesses') }} identified</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-neutral-900 mb-2 flex items-center">
                <lucide-icon [img]="InfoIcon" [size]="16" class="text-blue-600 mr-2" />
                External Factors
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-600">Opportunities:</span>
                  <span class="font-medium">{{ getItemCount('opportunities') }} identified</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-600">Threats:</span>
                  <span class="font-medium">{{ getItemCount('threats') }} identified</span>
                </div>
              </div>
            </div>
          </div>
          
          @if (getCompletionPercentage() === 100) {
            <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center">
                <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-600 mr-2" />
                <span class="text-sm font-medium text-green-800">SWOT Analysis Complete</span>
              </div>
              <p class="text-sm text-green-700 mt-1">
                You have successfully identified key factors across all SWOT categories. This analysis will help inform your strategic planning and funding applications.
              </p>
            </div>
          }
        </ui-card>
      }
    </div>
  `
})
export class SWOTAnalysisComponent implements OnInit {
  // Icons
  TrendingUpIcon = TrendingUp;
  PlusIcon = Plus;
  XIcon = X;
  CheckCircleIcon = CheckCircle;
  InfoIcon = Info;

  // Form state
  private activeForm = signal<SWOTCategory | null>(null);
  private itemFormBuilder = signal<FormGroup | null>(null);
  
  // Computed values
  itemForm = computed(() => this.itemFormBuilder());
  
  // SWOT data
  swotSections = signal<SWOTSection[]>([
    {
      category: 'strengths',
      title: 'Strengths',
      description: 'Internal positive factors that give your business an advantage',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      items: []
    },
    {
      category: 'weaknesses',
      title: 'Weaknesses', 
      description: 'Internal factors that place your business at a disadvantage',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      items: []
    },
    {
      category: 'opportunities',
      title: 'Opportunities',
      description: 'External factors that could give your business an advantage',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: []
    },
    {
      category: 'threats',
      title: 'Threats',
      description: 'External factors that could put your business at risk',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      items: []
    }
  ]);

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService
  ) {}

  ngOnInit() {
    this.loadExistingData();
  }

  getActiveForm(): SWOTCategory | null {
    return this.activeForm();
  }

  loadExistingData() {
    const profileData = this.profileService.data();
    if (profileData.swotAnalysis) {
      const sections = this.swotSections();
      
      // Convert simple arrays to structured items
      // sections.forEach(section => {
      //   const existingItems = profileData.swotAnalysis?.[section.category] || [];
      //   section.items = existingItems.map(item => ({
      //     title: typeof item === 'string' ? item : item.title || item,
      //     description: typeof item === 'string' ? '' : item.description || '',
      //     impact: typeof item === 'string' ? 'medium' : item.impact || 'medium'
      //   }));
      // });
      
      this.swotSections.set([...sections]);
    }
  }

  startAddItem(category: SWOTCategory) {
    this.activeForm.set(category);
    this.itemFormBuilder.set(this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      impact: ['', Validators.required]
    }));
  }

  cancelAddItem() {
    this.activeForm.set(null);
    this.itemFormBuilder.set(null);
  }

  addItem(category: SWOTCategory) {
    const form = this.itemForm();
    if (!form?.valid) return;

    const newItem: SWOTItem = form.value;
    const sections = this.swotSections();
    const sectionIndex = sections.findIndex(s => s.category === category);
    
    if (sectionIndex !== -1) {
      sections[sectionIndex].items.push(newItem);
      this.swotSections.set([...sections]);
      this.saveToProfile();
      this.cancelAddItem();
    }
  }

  removeItem(category: SWOTCategory, index: number) {
    const sections = this.swotSections();
    const sectionIndex = sections.findIndex(s => s.category === category);
    
    if (sectionIndex !== -1) {
      sections[sectionIndex].items.splice(index, 1);
      this.swotSections.set([...sections]);
      this.saveToProfile();
    }
  }

  private saveToProfile() {
    const sections = this.swotSections();
    const swotData = {
      strengths: sections.find(s => s.category === 'strengths')?.items || [],
      weaknesses: sections.find(s => s.category === 'weaknesses')?.items || [],
      opportunities: sections.find(s => s.category === 'opportunities')?.items || [],
      threats: sections.find(s => s.category === 'threats')?.items || []
    };
    
  //  this.profileService.updateProfile({ swotAnalysis: swotData });
  }

  getCompletionPercentage(): number {
    const sections = this.swotSections();
    const sectionsWithItems = sections.filter(s => s.items.length > 0).length;
    return Math.round((sectionsWithItems / sections.length) * 100);
  }

  hasAnyItems(): boolean {
    return this.swotSections().some(section => section.items.length > 0);
  }

  getItemCount(category: SWOTCategory): number {
    return this.swotSections().find(s => s.category === category)?.items.length || 0;
  }

  getImpactClass(impact: string): string {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  }

  getEmptyStateMessage(category: SWOTCategory): string {
    switch (category) {
      case 'strengths': return 'What gives your business a competitive advantage?';
      case 'weaknesses': return 'What areas need improvement in your business?';
      case 'opportunities': return 'What external opportunities can you leverage?';
      case 'threats': return 'What external risks should you be aware of?';
      default: return 'Click add to get started';
    }
  }

  getPlaceholder(category: SWOTCategory, field: 'title' | 'description'): string {
    const examples = {
      strengths: {
        title: 'Strong customer base',
        description: 'We have built a loyal customer base over 5 years with 90% retention rate...'
      },
      weaknesses: {
        title: 'Limited marketing budget',
        description: 'Our current marketing budget constrains our ability to reach new markets...'
      },
      opportunities: {
        title: 'Digital transformation trend',
        description: 'The industry shift towards digital presents opportunities for our tech solutions...'
      },
      threats: {
        title: 'Economic uncertainty',
        description: 'Current economic conditions may impact customer spending and demand...'
      }
    };
    
    return examples[category]?.[field] || '';
  }
}