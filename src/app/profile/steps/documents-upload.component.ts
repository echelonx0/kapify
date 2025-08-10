// src/app/profile/steps/documents-upload.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { UiCardComponent, UiButtonComponent } from '../../shared/components';
import { LucideAngularModule, Upload, FileText, CheckCircle, X, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-angular';
import { FundingApplicationProfileService, ProfileData } from '../../applications/services/funding-profile.service';

interface DocumentSection {
  id: string;
  title: string;
  description: string;
  expanded: boolean;
  documents: DocumentUpload[];
}

interface DocumentUpload {
  key: keyof ProfileData['documents'];
  label: string;
  description: string;
  required: boolean;
  file?: File;
  uploaded: boolean;
  size?: number;
}

@Component({
  selector: 'app-documents-upload',
  standalone: true,
  imports: [UiCardComponent, UiButtonComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-2xl font-bold text-neutral-900">Document Upload</h2>
        <p class="text-neutral-600 mt-2">
          Please provide the necessary documents to support your investment readiness profile. 
          Accurate and complete documentation helps expedite the review process and enhances the credibility of your application.
        </p>
      </div>

      <!-- Help Link -->
      <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div class="flex items-center space-x-2">
      <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-primary-500" />

          <span class="text-sm text-primary-700">
            Request assistance with building your profile? 
            <button class="underline hover:no-underline font-medium">Click here</button>
          </span>
        </div>
      </div>

      <!-- Document Sections -->
      @for (section of documentSections(); track section.id) {
        <ui-card [padding]="false">
          <!-- Section Header -->
          <button
            (click)="toggleSection(section.id)"
            class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
          >
            <div>
              <h3 class="text-lg font-semibold text-neutral-900">{{ section.title }}</h3>
              <p class="text-sm text-neutral-600 mt-1">{{ section.description }}</p>
            </div>
            <lucide-icon 
              [img]="section.expanded ? ChevronUpIcon : ChevronDownIcon" 
              [size]="20" 
              class="text-neutral-400"
            />
          </button>

          <!-- Section Content -->
          @if (section.expanded) {
            <div class="px-6 pb-6 border-t border-neutral-200">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                @for (doc of section.documents; track doc.key) {
                  <div class="border border-neutral-200 rounded-lg p-4">
                    <!-- Document Header -->
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex-1">
                        <h4 class="font-medium text-neutral-900 text-sm">{{ doc.label }}</h4>
                        @if (doc.uploaded) {
                          <div class="flex items-center space-x-2 mt-1">
                            <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-green-500" />
                            <span class="text-xs text-green-600">Uploaded</span>
                          </div>
                        }
                      </div>
                      @if (doc.required) {
                        <span class="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-medium">Required</span>
                      }
                    </div>

                    <!-- File Display or Upload Area -->
                    @if (doc.file) {
                      <!-- Uploaded File Display -->
                      <div class="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-2">
                            <lucide-icon [img]="FileTextIcon" [size]="16" class="text-primary-600" />
                            <div>
                              <div class="text-sm font-medium text-neutral-900">{{ doc.file.name }}</div>
                              <div class="text-xs text-neutral-500">{{ formatFileSize(doc.file.size) }}</div>
                            </div>
                          </div>
                          <div class="flex items-center space-x-2">
                            <button
                              (click)="downloadFile(doc)"
                              class="text-neutral-500 hover:text-primary-600 transition-colors p-1"
                              title="Download"
                            >
                              <lucide-icon [img]="DownloadIcon" [size]="16" />
                            </button>
                            <button
                              (click)="removeFile(doc.key)"
                              class="text-neutral-500 hover:text-red-600 transition-colors p-1"
                              title="Remove"
                            >
                              <lucide-icon [img]="Trash2Icon" [size]="16" />
                            </button>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <!-- Upload Area -->
                      <div class="relative">
                        <div 
                          class="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
                          (dragover)="onDragOver($event)"
                          (dragleave)="onDragLeave($event)"
                          (drop)="onDrop($event, doc.key)"
                        >
                          <lucide-icon [img]="UploadIcon" [size]="24" class="text-neutral-400 mx-auto mb-2" />
                          <p class="text-xs text-neutral-600 mb-1">Click to upload or drag and drop</p>
                          <p class="text-xs text-neutral-500">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          [accept]="'.pdf,.doc,.docx,.xls,.xlsx'"
                          (change)="onFileSelected($event, doc.key)"
                          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </ui-card>
      }

      <!-- Upload Progress -->
      @if (uploadProgress() > 0 && uploadProgress() < 100) {
        <ui-card>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-neutral-700">Uploading documents...</span>
              <span class="text-neutral-500">{{ uploadProgress() }}%</span>
            </div>
            <div class="w-full bg-neutral-200 rounded-full h-2">
              <div 
                class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                [style.width.%]="uploadProgress()"
              ></div>
            </div>
          </div>
        </ui-card>
      }

      <!-- Summary -->
      <ui-card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-neutral-900">Upload Summary</h3>
            <p class="text-sm text-neutral-600">
              {{ completedDocuments() }} of {{ totalDocuments() }} documents uploaded
              ({{ completedRequiredDocuments() }} of {{ totalRequiredDocuments() }} required)
            </p>
          </div>
          
          @if (allRequiredDocumentsUploaded()) {
            <div class="flex items-center space-x-2 text-green-600">
              <lucide-icon [img]="CheckCircleIcon" [size]="20" />
              <span class="font-medium">Ready to proceed</span>
            </div>
          } @else {
            <div class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {{ totalRequiredDocuments() - completedRequiredDocuments() }} required remaining
            </div>
          }
        </div>
      </ui-card>

      <!-- Action Buttons -->
      <div class="flex justify-between items-center pt-4">
        <ui-button variant="outline" (clicked)="goBack()">
          ← Back
        </ui-button>
        
        <ui-button 
          variant="primary" 
          (clicked)="saveAndContinue()"
          [disabled]="!allRequiredDocumentsUploaded() || isSaving()"
        >
          @if (isSaving()) {
            Saving...
          } @else {
            Save and Continue →
          }
        </ui-button>
      </div>
    </div>
  `
})
export class DocumentsUploadComponent implements OnInit {
  uploadProgress = signal(0);
  isSaving = signal(false);
  
  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  CheckCircleIcon = CheckCircle;
  XIcon = X;
  DownloadIcon = Download;
  Trash2Icon = Trash2;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  documentSections = signal<DocumentSection[]>([
    {
      id: 'company',
      title: 'Company Documents',
      description: 'Please upload all required documents as shown below.',
      expanded: true,
      documents: [
        {
          key: 'cipDocument',
          label: 'Company profile',
          description: 'Company Information Profile (CIP) or CIPC certificate',
          required: true,
          uploaded: false
        },
        {
          key: 'businessPlan',
          label: 'Business plan',
          description: 'Current business plan with financial projections',
          required: false,
          uploaded: false
        },
        {
          key: 'taxClearance',
          label: 'Company registration document',
          description: 'CIPC registration or incorporation documents',
          required: true,
          uploaded: false
        },
        {
          key: 'managementAccounts',
          label: 'Shareholder register',
          description: 'Current shareholder register and ownership structure',
          required: false,
          uploaded: false
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      description: 'Please upload the required financial reports.',
      expanded: true,
      documents: [
        {
          key: 'financialStatements',
          label: 'Current year financials',
          description: 'Latest audited or reviewed financial statements',
          required: true,
          uploaded: false
        },
        {
          key: 'bankStatements',
          label: 'Prior year financial statement year 1',
          description: 'Previous year audited financial statements',
          required: true,
          uploaded: false
        },
        {
          key: 'managementAccounts',
          label: 'Prior year financial statement year 2',
          description: 'Two years ago audited financial statements',
          required: false,
          uploaded: false
        },
        {
          key: 'taxClearance',
          label: 'Asset register',
          description: 'Current asset register with valuations',
          required: false,
          uploaded: false
        },
        {
          key: 'businessPlan',
          label: 'Financial projections',
          description: 'Financial projections and cash flow forecasts',
          required: true,
          uploaded: false
        },
        {
          key: 'cipDocument',
          label: 'Sales pipeline',
          description: 'Current sales pipeline and customer contracts',
          required: false,
          uploaded: false
        }
      ]
    },
    {
      id: 'additional',
      title: 'Additional Requirements',
      description: 'Please upload the following documents if they are available.',
      expanded: false,
      documents: [
        {
          key: 'businessPlan',
          label: 'Letter of intent',
          description: 'Letters of intent from potential customers or partners',
          required: false,
          uploaded: false
        },
        {
          key: 'taxClearance',
          label: 'Quotations',
          description: 'Quotations for equipment or services to be purchased',
          required: false,
          uploaded: false
        },
        {
          key: 'cipDocument',
          label: 'Mou or sale of agreements',
          description: 'Memorandums of understanding or sale agreements',
          required: false,
          uploaded: false
        },
        {
          key: 'managementAccounts',
          label: 'Other',
          description: 'Any other relevant supporting documents',
          required: false,
          uploaded: false
        }
      ]
    }
  ]);

  constructor(private profileService: FundingApplicationProfileService) {}

  ngOnInit() {
    const existingData = this.profileService.data().documents;
    if (existingData) {
      // Update document sections with existing data
      this.documentSections.update(sections => 
        sections.map(section => ({
          ...section,
          documents: section.documents.map(doc => ({
            ...doc,
            file: existingData[doc.key],
            uploaded: !!existingData[doc.key],
            size: existingData[doc.key]?.size
          }))
        }))
      );
    }
  }

  toggleSection(sectionId: string) {
    this.documentSections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('border-primary-500', 'bg-primary-50');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-50');
  }

  onDrop(event: DragEvent, documentKey: keyof ProfileData['documents']) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-50');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0], documentKey);
    }
  }

  async onFileSelected(event: Event, documentKey: keyof ProfileData['documents']) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      await this.processFile(file, documentKey);
      // Clear the input so the same file can be selected again
      input.value = '';
    }
  }

  private async processFile(file: File, documentKey: keyof ProfileData['documents']) {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload only PDF, DOC, DOCX, XLS, or XLSX files');
      return;
    }

    // Simulate upload progress
    this.uploadProgress.set(0);
    const interval = setInterval(() => {
      this.uploadProgress.update(p => {
        if (p >= 100) {
          clearInterval(interval);
          
          // Update the document in the sections
          this.documentSections.update(sections =>
            sections.map(section => ({
              ...section,
              documents: section.documents.map(doc =>
                doc.key === documentKey
                  ? { ...doc, file, uploaded: true, size: file.size }
                  : doc
              )
            }))
          );
          
          this.saveDocuments();
          return 100;
        }
        return p + 10;
      });
    }, 50);
  }

  removeFile(documentKey: keyof ProfileData['documents']) {
    this.documentSections.update(sections =>
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc =>
          doc.key === documentKey
            ? { ...doc, file: undefined, uploaded: false, size: undefined }
            : doc
        )
      }))
    );
    
    this.saveDocuments();
  }

  downloadFile(doc: DocumentUpload) {
    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Computed values
  totalDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.length, 0
    );
  };

  completedDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.uploaded).length, 0
    );
  };

  totalRequiredDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.required).length, 0
    );
  };

  completedRequiredDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.required && doc.uploaded).length, 0
    );
  };

  allRequiredDocumentsUploaded = () => {
    return this.completedRequiredDocuments() === this.totalRequiredDocuments();
  };

  private saveDocuments() {
    const documentsData: Partial<ProfileData['documents']> = {};
    
    this.documentSections().forEach(section => {
      section.documents.forEach(doc => {
        if (doc.file) {
          documentsData[doc.key] = doc.file;
        }
      });
    });
    
    this.profileService.updateDocuments(documentsData);
  }

  goBack() {
    // Navigate to previous step
    this.profileService.previousStep();
  }

  async saveAndContinue() {
    if (!this.allRequiredDocumentsUploaded()) {
      alert('Please upload all required documents before continuing.');
      return;
    }

    this.isSaving.set(true);
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.saveDocuments();
    this.isSaving.set(false);
    
    // Navigate to next step or completion
    this.profileService.nextStep();
  }
}