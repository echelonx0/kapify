// // src/app/profile/steps/documents-upload.component.ts
// import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
 
// import { LucideAngularModule, Upload, FileText, CheckCircle, X, Download, Trash2, ChevronDown, ChevronUp, Save, Clock } from 'lucide-angular';
// import { Subscription, interval } from 'rxjs';
 
// import { takeWhile } from 'rxjs/operators';
// import { SupportingDocuments } from '../../../applications/models/funding-application.models';
// import { FundingApplicationService } from '../../../applications/services/funding-application.service';
// import { UiCardComponent, UiButtonComponent } from '../../../shared/components';

// interface DocumentSection {
//   id: string;
//   title: string;
//   description: string;
//   expanded: boolean;
//   documents: DocumentUpload[];
// }

// interface DocumentUpload {
//   key: keyof SupportingDocuments;
//   label: string;
//   description: string;
//   required: boolean;
//   file?: File;
//   uploaded: boolean;
//   size?: number;
// }

// @Component({
//   selector: 'app-documents-upload',
//   standalone: true,
//   imports: [UiCardComponent, UiButtonComponent, LucideAngularModule],
//   templateUrl: 'documents-upload.component.html'
// })
// export class DocumentsUploadComponent implements OnInit, OnDestroy {
//   private fundingApplicationService = inject(FundingApplicationService);

//   // State signals
//   uploadProgress = signal(0);
//   isSaving = signal(false);
//   lastSaved = signal<Date | null>(null);
  
//   // Icons
//   UploadIcon = Upload;
//   FileTextIcon = FileText;
//   CheckCircleIcon = CheckCircle;
//   XIcon = X;
//   DownloadIcon = Download;
//   Trash2Icon = Trash2;
//   ChevronDownIcon = ChevronDown;
//   ChevronUpIcon = ChevronUp;
//   SaveIcon = Save;
//   ClockIcon = Clock;

//   // Auto-save subscription
//   private autoSaveSubscription?: Subscription;
//   private debounceTimer?: ReturnType<typeof setTimeout>;

//   documentSections = signal<DocumentSection[]>([
//     {
//       id: 'company',
//       title: 'Company Documents',
//       description: 'Please upload all required documents as shown below.',
//       expanded: true,
//       documents: [
//         {
//           key: 'companyRegistration',
//           label: 'Company profile',
//           description: 'Company Information Profile (CIP) or CIPC certificate',
//           required: true,
//           uploaded: false
//         },
//         {
//           key: 'taxClearanceCertificate',
//           label: 'Tax clearance certificate',
//           description: 'Current tax clearance certificate from SARS',
//           required: true,
//           uploaded: false
//         },
//         {
//           key: 'vatRegistration',
//           label: 'VAT registration document',
//           description: 'VAT registration certificate (if applicable)',
//           required: false,
//           uploaded: false
//         }
//       ]
//     },
//     {
//       id: 'financial',
//       title: 'Financial Reports',
//       description: 'Please upload the required financial reports.',
//       expanded: true,
//       documents: [
//         {
//           key: 'auditedFinancials',
//           label: 'Current year financials',
//           description: 'Latest audited or reviewed financial statements',
//           required: true,
//           uploaded: false
//         },
//         {
//           key: 'managementAccounts',
//           label: 'Management accounts',
//           description: 'Recent management accounts (last 3 months)',
//           required: true,
//           uploaded: false
//         },
//         {
//           key: 'bankStatements',
//           label: 'Bank statements',
//           description: 'Last 6 months bank statements',
//           required: true,
//           uploaded: false
//         },
//         {
//           key: 'assetRegister',
//           label: 'Asset register',
//           description: 'Current asset register with valuations',
//           required: false,
//           uploaded: false
//         },
//         {
//           key: 'financialProjections',
//           label: 'Financial projections',
//           description: 'Financial projections and cash flow forecasts',
//           required: true,
//           uploaded: false
//         }
//       ]
//     },
//     {
//       id: 'business',
//       title: 'Business Documents',
//       description: 'Business planning and operational documents.',
//       expanded: false,
//       documents: [
//         {
//           key: 'businessPlan',
//           label: 'Business plan',
//           description: 'Current business plan with financial projections',
//           required: false,
//           uploaded: false
//         },
//         {
//           key: 'salesPipeline',
//           label: 'Sales pipeline',
//           description: 'Current sales pipeline and customer contracts',
//           required: false,
//           uploaded: false
//         }
//       ]
//     },
//     {
//       id: 'additional',
//       title: 'Additional Requirements',
//       description: 'Please upload the following documents if they are available.',
//       expanded: false,
//       documents: [
//         {
//           key: 'lettersOfIntent',
//           label: 'Letters of intent',
//           description: 'Letters of intent from potential customers or partners',
//           required: false,
//           uploaded: false
//         },
//         {
//           key: 'supplierQuotations',
//           label: 'Quotations',
//           description: 'Quotations for equipment or services to be purchased',
//           required: false,
//           uploaded: false
//         },
//         {
//           key: 'customerContracts',
//           label: 'Customer contracts',
//           description: 'Existing customer contracts and agreements',
//           required: false,
//           uploaded: false
//         },
//         {
//           key: 'other',
//           label: 'Other documents',
//           description: 'Any other relevant supporting documents',
//           required: false,
//           uploaded: false
//         }
//       ]
//     }
//   ]);

//   ngOnInit() {
//     this.loadExistingData();
//     this.setupAutoSave();
//   }

//   ngOnDestroy() {
//     this.autoSaveSubscription?.unsubscribe();
//     if (this.debounceTimer) {
//       clearTimeout(this.debounceTimer);
//     }
//   }

//   // ===============================
//   // DATA LOADING & SAVING
//   // ===============================

//   private loadExistingData() {
//     const existingData = this.fundingApplicationService.data().supportingDocuments;
//     if (existingData) {
//       this.updateDocumentSectionsFromData(existingData);
//     }
//   }

// private updateDocumentSectionsFromData(data: SupportingDocuments) {
//   this.documentSections.update(sections => 
//     sections.map(section => ({
//       ...section,
//       documents: section.documents.map(doc => {
//         const fileData = data[doc.key];
//         const file = Array.isArray(fileData) ? fileData[0] : fileData;
//         return {
//           ...doc,
//           file: file as File | undefined,
//           uploaded: !!file,
//           size: file ? (file as unknown as File).size : undefined
//         };
//       })
//     }))
//   );
// }

//   private setupAutoSave() {
//     // Auto-save every 30 seconds when data changes
//     this.autoSaveSubscription = interval(30000).pipe(
//       takeWhile(() => true)
//     ).subscribe(() => {
//       if (this.hasDocumentData() && !this.isSaving()) {
//         this.saveData(false);
//       }
//     });
//   }

//   private debouncedSave() {
//     if (this.debounceTimer) {
//       clearTimeout(this.debounceTimer);
//     }
    
//     this.debounceTimer = setTimeout(() => {
//       if (this.hasDocumentData() && !this.isSaving()) {
//         this.saveData(false);
//       }
//     }, 2000) as ReturnType<typeof setTimeout>;
//   }

//   async saveManually() {
//     await this.saveData(true);
//   }

//   private async saveData(isManual: boolean = false) {
//     if (this.isSaving()) return;

//     this.isSaving.set(true);
    
//     try {
//       const documentsData = this.buildSupportingDocumentsData();
//       this.fundingApplicationService.updateSupportingDocuments(documentsData);
      
//       if (isManual) {
//         // Force save to backend for manual saves
//         await this.fundingApplicationService.saveCurrentProgress();
//       }
      
//       this.lastSaved.set(new Date());
//     } catch (error) {
//       console.error('Failed to save documents:', error);
//     } finally {
//       this.isSaving.set(false);
//     }
//   }

//   private buildSupportingDocumentsData(): SupportingDocuments {
//     const documentsData: SupportingDocuments = {};
    
//     this.documentSections().forEach(section => {
//       section.documents.forEach(doc => {
//         if (doc.file) {
//           // Handle different types of document arrays
//           if (doc.key === 'auditedFinancials' || doc.key === 'lettersOfIntent' || 
//               doc.key === 'supplierQuotations' || doc.key === 'customerContracts' || doc.key === 'other') {
//             // These are array types - for now, just use single file but structure for arrays
//             (documentsData[doc.key] as any) = [doc.file];
//           } else {
//             // Single file types
//             (documentsData[doc.key] as any) = doc.file;
//           }
//         }
//       });
//     });
    
//     return documentsData;
//   }

//   private hasDocumentData(): boolean {
//     return this.documentSections().some(section => 
//       section.documents.some(doc => doc.uploaded)
//     );
//   }

//   // ===============================
//   // UI INTERACTIONS
//   // ===============================

//   toggleSection(sectionId: string) {
//     this.documentSections.update(sections =>
//       sections.map(section =>
//         section.id === sectionId
//           ? { ...section, expanded: !section.expanded }
//           : section
//       )
//     );
//   }

//   onDragOver(event: DragEvent) {
//     event.preventDefault();
//     event.stopPropagation();
//     const target = event.currentTarget as HTMLElement;
//     target.classList.add('border-primary-500', 'bg-primary-50');
//   }

//   onDragLeave(event: DragEvent) {
//     event.preventDefault();
//     event.stopPropagation();
//     const target = event.currentTarget as HTMLElement;
//     target.classList.remove('border-primary-500', 'bg-primary-50');
//   }

//   onDrop(event: DragEvent, documentKey: keyof SupportingDocuments) {
//     event.preventDefault();
//     event.stopPropagation();
    
//     const target = event.currentTarget as HTMLElement;
//     target.classList.remove('border-primary-500', 'bg-primary-50');
    
//     const files = event.dataTransfer?.files;
//     if (files && files.length > 0) {
//       this.processFile(files[0], documentKey);
//     }
//   }

//   async onFileSelected(event: Event, documentKey: keyof SupportingDocuments) {
//     const input = event.target as HTMLInputElement;
//     const file = input.files?.[0];
    
//     if (file) {
//       await this.processFile(file, documentKey);
//       // Clear the input so the same file can be selected again
//       input.value = '';
//     }
//   }

//   private async processFile(file: File, documentKey: keyof SupportingDocuments) {
//     // Validate file size (10MB limit)
//     if (file.size > 10 * 1024 * 1024) {
//       alert('File size must be less than 10MB');
//       return;
//     }

//     // Validate file type
//     const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
//     const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
//     if (!allowedTypes.includes(fileExtension)) {
//       alert('Please upload only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, or PNG files');
//       return;
//     }

//     // Simulate upload progress
//     this.uploadProgress.set(0);
//     const interval = setInterval(() => {
//       this.uploadProgress.update(p => {
//         if (p >= 100) {
//           clearInterval(interval);
          
//           // Update the document in the sections
//           this.documentSections.update(sections =>
//             sections.map(section => ({
//               ...section,
//               documents: section.documents.map(doc =>
//                 doc.key === documentKey
//                   ? { ...doc, file, uploaded: true, size: file.size }
//                   : doc
//               )
//             }))
//           );
          
//           // Trigger debounced save
//           this.debouncedSave();
//           return 100;
//         }
//         return p + 10;
//       });
//     }, 50);
//   }

//   removeFile(documentKey: keyof SupportingDocuments) {
//     this.documentSections.update(sections =>
//       sections.map(section => ({
//         ...section,
//         documents: section.documents.map(doc =>
//           doc.key === documentKey
//             ? { ...doc, file: undefined, uploaded: false, size: undefined }
//             : doc
//         )
//       }))
//     );
    
//     // Trigger debounced save
//     this.debouncedSave();
//   }

//   downloadFile(doc: DocumentUpload) {
//     if (doc.file) {
//       const url = URL.createObjectURL(doc.file);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = doc.file.name;
//       a.click();
//       URL.revokeObjectURL(url);
//     }
//   }

//   formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   getLastSavedText(): string {
//     const saved = this.lastSaved();
//     if (!saved) return '';
    
//     const now = new Date();
//     const diffMs = now.getTime() - saved.getTime();
//     const diffMins = Math.floor(diffMs / 60000);
    
//     if (diffMins < 1) return 'just now';
//     if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
//     return saved.toLocaleDateString();
//   }

//   // ===============================
//   // COMPUTED VALUES
//   // ===============================

//   totalDocuments = () => {
//     return this.documentSections().reduce((total, section) => 
//       total + section.documents.length, 0
//     );
//   };

//   completedDocuments = () => {
//     return this.documentSections().reduce((total, section) => 
//       total + section.documents.filter(doc => doc.uploaded).length, 0
//     );
//   };

//   totalRequiredDocuments = () => {
//     return this.documentSections().reduce((total, section) => 
//       total + section.documents.filter(doc => doc.required).length, 0
//     );
//   };

//   completedRequiredDocuments = () => {
//     return this.documentSections().reduce((total, section) => 
//       total + section.documents.filter(doc => doc.required && doc.uploaded).length, 0
//     );
//   };

//   allRequiredDocumentsUploaded = () => {
//     return this.completedRequiredDocuments() === this.totalRequiredDocuments();
//   };

//   getCompletionPercentage = () => {
//     const total = this.totalRequiredDocuments();
//     const completed = this.completedRequiredDocuments();
//     return total > 0 ? Math.round((completed / total) * 100) : 0;
//   };

//   // ===============================
//   // NAVIGATION
//   // ===============================

//   goBack() {
//     this.fundingApplicationService.previousStep();
//   }

//   async saveAndContinue() {
//     if (!this.allRequiredDocumentsUploaded()) {
//       alert('Please upload all required documents before continuing.');
//       return;
//     }

//     // Save current progress
//     await this.saveData(true);
    
//     // Navigate to next step
//     this.fundingApplicationService.nextStep();
//   }
// }

// src/app/profile/steps/documents-upload.component.ts - Complete Implementation
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core'; 
import { LucideAngularModule, Upload, FileText, CheckCircle, X, Download, Trash2, ChevronDown, ChevronUp, Save, Clock } from 'lucide-angular';
 
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { FundingApplicationService } from '../../../services/funding-application.service';
import { UiCardComponent, UiButtonComponent } from '../../../../shared/components';

interface DocumentSection {
  id: string;
  title: string;
  description: string;
  expanded: boolean;
  documents: DocumentUpload[];
}

interface DocumentUpload {
  key: string; // Changed to string to handle all document types
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
  templateUrl: 'documents-upload.component.html'
})
export class DocumentsUploadComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingApplicationService);

  // State signals
  uploadProgress = signal(0);
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  
  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  CheckCircleIcon = CheckCircle;
  XIcon = X;
  DownloadIcon = Download;
  Trash2Icon = Trash2;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  SaveIcon = Save;
  ClockIcon = Clock;

  // Auto-save subscription
  private autoSaveSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  // Document storage for all uploaded files
  private uploadedDocuments = signal<{ [key: string]: File }>({});

  documentSections = signal<DocumentSection[]>([
    {
      id: 'company',
      title: 'Company Documents',
      description: 'Please upload all required documents as shown below.',
      expanded: true,
      documents: [
        {
          key: 'companyProfile',
          label: 'Company profile',
          description: 'Company Information Profile (CIP) or CIPC certificate',
          required: true,
          uploaded: false
        },
        {
          key: 'companyRegistrationDocument',
          label: 'Company registration document',
          description: 'CIPC registration or incorporation documents',
          required: true,
          uploaded: false
        },
        {
          key: 'taxPin',
          label: 'Tax pin',
          description: 'Tax PIN document from SARS',
          required: true,
          uploaded: false
        },
        {
          key: 'beeAffidavit',
          label: 'Bee affidavit',
          description: 'B-BBEE affidavit or certificate',
          required: false,
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
          key: 'shareholderRegister',
          label: 'Shareholder register',
          description: 'Current shareholder register and ownership structure',
          required: false,
          uploaded: false
        },
        {
          key: 'fundingApplicationRequest',
          label: 'Funding application request',
          description: 'Formal funding application request document',
          required: false,
          uploaded: false
        },
        {
          key: 'pitchDeck',
          label: 'Pitch deck',
          description: 'Investment pitch deck presentation',
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
          key: 'currentYearFinancials',
          label: 'Current year financials',
          description: 'Latest audited or reviewed financial statements',
          required: true,
          uploaded: false
        },
        {
          key: 'priorYearFinancialYear1',
          label: 'Prior year financial statement year 1',
          description: 'Previous year audited financial statements',
          required: true,
          uploaded: false
        },
        {
          key: 'priorYearFinancialYear2',
          label: 'Prior year financial statement year 2',
          description: 'Two years ago audited financial statements',
          required: false,
          uploaded: false
        },
        {
          key: 'assetRegister',
          label: 'Asset register',
          description: 'Current asset register with valuations',
          required: false,
          uploaded: false
        },
        {
          key: 'financialProjections',
          label: 'Financial projections',
          description: 'Financial projections and cash flow forecasts',
          required: true,
          uploaded: false
        },
        {
          key: 'salesPipeline',
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
          key: 'letterOfIntent',
          label: 'Letter of intent',
          description: 'Letters of intent from potential customers or partners',
          required: false,
          uploaded: false
        },
        {
          key: 'quotations',
          label: 'Quotations',
          description: 'Quotations for equipment or services to be purchased',
          required: false,
          uploaded: false
        },
        {
          key: 'mouOrSaleAgreements',
          label: 'Mou or sale of agreements',
          description: 'Memorandums of understanding or sale agreements',
          required: false,
          uploaded: false
        },
        {
          key: 'other',
          label: 'Other',
          description: 'Any other relevant supporting documents',
          required: false,
          uploaded: false
        }
      ]
    }
  ]);

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
    const existingData = this.fundingApplicationService.data().supportingDocuments;
    if (existingData) {
      this.updateDocumentSectionsFromData(existingData);
    }
  }

  private updateDocumentSectionsFromData(data: any) {
    // Update uploaded documents signal
    const uploadedDocs: { [key: string]: File } = {};
    
    this.documentSections.update(sections => 
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc => {
          const file = data[doc.key];
          if (file) {
            uploadedDocs[doc.key] = file;
          }
          return {
            ...doc,
            file: file as File,
            uploaded: !!file,
            size: file?.size
          };
        })
      }))
    );
    
    this.uploadedDocuments.set(uploadedDocs);
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds when data changes
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true)
    ).subscribe(() => {
      if (this.hasDocumentData() && !this.isSaving()) {
        this.saveData(false);
      }
    });
  }

  private debouncedSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      if (this.hasDocumentData() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000) as ReturnType<typeof setTimeout>;
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      const documentsData = this.buildSupportingDocumentsData();
      this.fundingApplicationService.updateSupportingDocuments(documentsData);
      
      if (isManual) {
        // Force save to backend for manual saves
        await this.fundingApplicationService.saveCurrentProgress();
      }
      
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save documents:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildSupportingDocumentsData(): any {
    const documentsData: any = {};
    const uploaded = this.uploadedDocuments();
    
    // Map all uploaded documents to the appropriate structure
    Object.keys(uploaded).forEach(key => {
      documentsData[key] = uploaded[key];
    });
    
    return documentsData;
  }

  private hasDocumentData(): boolean {
    const uploaded = this.uploadedDocuments();
    return Object.keys(uploaded).length > 0;
  }

  // ===============================
  // UI INTERACTIONS
  // ===============================

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

  onDrop(event: DragEvent, documentKey: string) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-50');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0], documentKey);
    }
  }

  async onFileSelected(event: Event, documentKey: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      await this.processFile(file, documentKey);
      // Clear the input so the same file can be selected again
      input.value = '';
    }
  }

  private async processFile(file: File, documentKey: string) {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, or PNG files');
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
          
          // Update uploaded documents signal
          this.uploadedDocuments.update(current => ({
            ...current,
            [documentKey]: file
          }));
          
          // Trigger debounced save
          this.debouncedSave();
          return 100;
        }
        return p + 10;
      });
    }, 50);
  }

  removeFile(documentKey: string) {
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
    
    // Remove from uploaded documents signal
    this.uploadedDocuments.update(current => {
      const updated = { ...current };
      delete updated[documentKey];
      return updated;
    });
    
    // Trigger debounced save
    this.debouncedSave();
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
  // COMPUTED VALUES
  // ===============================

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

  getCompletionPercentage = () => {
    const total = this.totalRequiredDocuments();
    const completed = this.completedRequiredDocuments();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // ===============================
  // NAVIGATION
  // ===============================

  goBack() {
    this.fundingApplicationService.previousStep();
  }

  async saveAndContinue() {
    if (!this.allRequiredDocumentsUploaded()) {
      alert('Please upload all required documents before continuing.');
      return;
    }

    // Save current progress
    await this.saveData(true);
    
    // Navigate to next step
    this.fundingApplicationService.nextStep();
  }
}