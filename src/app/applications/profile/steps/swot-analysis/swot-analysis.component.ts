 
// src/app/profile/steps/swot-analysis.component.ts
import { Component, signal, OnInit, OnDestroy, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, X, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Info, Save, Clock } from 'lucide-angular';
import { CommonModule } from '@angular/common'; 
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { UiButtonComponent, UiCardComponent, UiInputComponent } from '../../../../shared/components';
import { UiSectionCardComponent } from '../../../../shared/components/ui-section-card.component';
import { UiTextareaComponent } from '../../../../shared/components/ui-textarea.component';
import { SWOTAnalysis } from '../../../models/funding-application.models';
import { FundingProfileSetupService } from '../../../services/funding-profile-setup.service';

type SWOTCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

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
export class SWOTAnalysisComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private fb = inject(FormBuilder);

  // Icons
  TrendingUpIcon = TrendingUp;
  PlusIcon = Plus;
  XIcon = X;
  CheckCircleIcon = CheckCircle;
  InfoIcon = Info;
  SaveIcon = Save;
  ClockIcon = Clock;

  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  
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

  // Auto-save subscription
  private autoSaveSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {}

  ngOnInit() {
    this.loadExistingData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // ===============================
  // DATA LOADING & SAVING
  // ===============================

  private loadExistingData() {
    const existingData = this.fundingApplicationService.data().swotAnalysis;
    if (existingData) {
      this.populateFromExistingData(existingData);
    }
  }

  private populateFromExistingData(data: SWOTAnalysis) {
    const sections = this.swotSections();
    
    // Map string arrays to SWOTItem arrays
    const mapStringsToItems = (strings: string[]): SWOTItem[] => {
      return strings.map(str => ({
        title: str.length > 50 ? str.substring(0, 50) + '...' : str,
        description: str,
        impact: 'medium' as const // Default impact level
      }));
    };

    // Update each section with existing data
    sections.forEach(section => {
      switch (section.category) {
        case 'strengths':
          section.items = mapStringsToItems(data.strengths || []);
          break;
        case 'weaknesses':
          section.items = mapStringsToItems(data.weaknesses || []);
          break;
        case 'opportunities':
          section.items = mapStringsToItems(data.opportunities || []);
          break;
        case 'threats':
          section.items = mapStringsToItems(data.threats || []);
          break;
      }
    });

    this.swotSections.set([...sections]);
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds when data changes
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true)
    ).subscribe(() => {
      if (this.hasAnyItems() && !this.isSaving()) {
        this.saveData(false);
      }
    });
  }

  private debouncedSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      if (this.hasAnyItems() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000); // 2 second debounce
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      const swotData = this.buildSWOTAnalysisData();
      this.fundingApplicationService.updateSwotAnalysis(swotData);
      
      if (isManual) {
        // Force save to backend for manual saves
        await this.fundingApplicationService.saveCurrentProgress();
      }
      
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save SWOT analysis:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildSWOTAnalysisData(): SWOTAnalysis {
    const sections = this.swotSections();
    
    return {
      strengths: sections.find(s => s.category === 'strengths')?.items.map(item => item.description) || [],
      weaknesses: sections.find(s => s.category === 'weaknesses')?.items.map(item => item.description) || [],
      opportunities: sections.find(s => s.category === 'opportunities')?.items.map(item => item.description) || [],
      threats: sections.find(s => s.category === 'threats')?.items.map(item => item.description) || [],
      
      // Additional strategic insights
      strategicPriorities: this.generateStrategicPriorities(),
      riskMitigation: this.generateRiskMitigation(),
      competitiveAdvantages: this.generateCompetitiveAdvantages()
    };
  }

  private generateStrategicPriorities(): string[] {
    const sections = this.swotSections();
    const priorities: string[] = [];
    
    // Generate priorities based on high-impact strengths and opportunities
    sections.forEach(section => {
      if (section.category === 'strengths' || section.category === 'opportunities') {
        const highImpactItems = section.items.filter(item => item.impact === 'high');
        highImpactItems.forEach(item => {
          priorities.push(`Leverage: ${item.title}`);
        });
      }
    });
    
    return priorities.slice(0, 5); // Limit to top 5 priorities
  }

  private generateRiskMitigation(): string[] {
    const sections = this.swotSections();
    const mitigations: string[] = [];
    
    // Generate mitigation strategies based on high-impact threats and weaknesses
    sections.forEach(section => {
      if (section.category === 'threats' || section.category === 'weaknesses') {
        const highImpactItems = section.items.filter(item => item.impact === 'high');
        highImpactItems.forEach(item => {
          mitigations.push(`Mitigate: ${item.title}`);
        });
      }
    });
    
    return mitigations.slice(0, 5); // Limit to top 5 mitigations
  }

  private generateCompetitiveAdvantages(): string[] {
    const strengthsSection = this.swotSections().find(s => s.category === 'strengths');
    if (!strengthsSection) return [];
    
    return strengthsSection.items
      .filter(item => item.impact === 'high' || item.impact === 'medium')
      .map(item => item.title)
      .slice(0, 3); // Limit to top 3 advantages
  }

  // ===============================
  // FORM MANAGEMENT
  // ===============================

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
      this.debouncedSave(); // Auto-save when item is added
      this.cancelAddItem();
    }
  }

  removeItem(category: SWOTCategory, index: number) {
    const sections = this.swotSections();
    const sectionIndex = sections.findIndex(s => s.category === category);
    
    if (sectionIndex !== -1) {
      sections[sectionIndex].items.splice(index, 1);
      this.swotSections.set([...sections]);
      this.debouncedSave(); // Auto-save when item is removed
    }
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

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
        description: 'We have built a loyal customer base over 5 years with 90% retention rate and strong word-of-mouth referrals that drive new business growth.'
      },
      weaknesses: {
        title: 'Limited marketing budget',
        description: 'Our current marketing budget constrains our ability to reach new markets and compete effectively with larger competitors in digital channels.'
      },
      opportunities: {
        title: 'Digital transformation trend',
        description: 'The industry shift towards digital presents opportunities for our tech solutions to capture market share from traditional competitors.'
      },
      threats: {
        title: 'Economic uncertainty',
        description: 'Current economic conditions may impact customer spending and demand, potentially affecting our revenue and growth projections.'
      }
    };
    
    return examples[category]?.[field] || '';
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return saved.toLocaleDateString();
  }

  // ===============================
  // VALIDATION HELPERS
  // ===============================

  isSWOTComplete(): boolean {
    const sections = this.swotSections();
    // Require at least 2 items in each category for a complete SWOT
    return sections.every(section => section.items.length >= 2);
  }

// Replace the getMinimumItemsNeeded method with this fixed version:

getMinimumItemsNeeded(): { category: SWOTCategory; needed: number; displayName: string }[] {
  const sections = this.swotSections();
  const minimumRequired = 2;
  
  // Proper singular forms for each category
  const singularForms: Record<SWOTCategory, string> = {
    'strengths': 'strength',
    'weaknesses': 'weakness', 
    'opportunities': 'opportunity',
    'threats': 'threat'
  };
  
  return sections
    .filter(section => section.items.length < minimumRequired)
    .map(section => {
      const needed = minimumRequired - section.items.length;
      return {
        category: section.category,
        needed: needed,
        displayName: needed > 1 
          ? section.category // Use plural for multiple items
          : singularForms[section.category] // Use proper singular
      };
    });
}
  // ===============================
  // NAVIGATION METHODS
  // ===============================

  goBack() {
    this.fundingApplicationService.previousStep();
  }

  async saveAndContinue() {
    await this.saveData(true);
    this.fundingApplicationService.nextStep();
  }
}