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
  templateUrl: 'swot-analysis.component.html'
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
  
  // Computed values - Fixed null safety
  itemForm = computed(() => this.itemFormBuilder() || this.createEmptyForm());
  
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

  // Create empty form for fallback
  private createEmptyForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      impact: ['', Validators.required]
    });
  }

  getActiveForm(): SWOTCategory | null {
    return this.activeForm();
  }

  // Check if form is valid (null-safe)
  isFormValid(): boolean {
    const form = this.itemFormBuilder();
    return form ? form.valid : false;
  }

  loadExistingData() {
    const profileData = this.profileService.data();
    if (profileData.swotAnalysis) {
      const sections = this.swotSections();
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
    const form = this.itemFormBuilder();
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
    
    // Uncomment when ready to save
    // this.profileService.updateProfile({ swotAnalysis: swotData });
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