import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Upload,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-angular';
import {
  SupabaseDocumentService,
  DocumentUploadResult,
} from '../../../shared/services/supabase-document.service';

@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-3">
      <!-- Label -->
      <label class="block text-sm font-semibold text-slate-900">
        Organization Logo
        <span class="text-slate-400 font-normal ml-1">(Optional)</span>
      </label>

      <!-- Upload Zone or Preview -->
      @if (previewUrl()) {
      <!-- Preview State -->
      <div class="relative">
        <div
          class="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200/50 flex items-center justify-center flex-shrink-0 overflow-hidden"
            >
              <img
                [src]="previewUrl()"
                alt="Logo preview"
                class="w-full h-full object-contain"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-900">{{ fileName() }}</p>
              <p class="text-xs text-slate-600">{{ fileSize() }}</p>
            </div>
          </div>

          <button
            (click)="removeLogo()"
            type="button"
            class="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors duration-200"
            title="Remove logo"
          >
            <lucide-icon [img]="XIcon" [size]="18" />
          </button>
        </div>

        <!-- Upload Success Badge -->
        @if (isUploaded()) {
        <div
          class="absolute -top-2 -right-2 bg-green-600 text-white rounded-full p-1.5 shadow-sm"
        >
          <lucide-icon [img]="CheckIcon" [size]="14" />
        </div>
        }
      </div>
      } @else {
      <!-- Upload Zone -->
      <div
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class]="
          'border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ' +
          (isDragging()
            ? 'border-teal-500 bg-teal-50'
            : 'border-slate-200 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/50')
        "
        (click)="fileInput.click()"
      >
        <div class="flex flex-col items-center gap-2">
          <div
            class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"
          >
            <lucide-icon [img]="UploadIcon" [size]="20" class="text-teal-600" />
          </div>

          <div>
            <p class="text-sm font-medium text-slate-900">
              @if (isUploading()) {
              <span class="flex items-center justify-center gap-1">
                <span
                  class="inline-block w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"
                ></span>
                Uploading logo...
              </span>
              } @else { Drag your logo here or
              <span class="text-teal-600 font-semibold">click to browse</span>
              }
            </p>
            <p class="text-xs text-slate-600 mt-1">PNG, JPG or SVG • Max 5MB</p>
          </div>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input
        #fileInput
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        hidden
        (change)="onFileSelected($event)"
        [disabled]="isUploading()"
      />
      }

      <!-- Error Message -->
      @if (error()) {
      <div
        class="flex items-start gap-3 p-4 bg-red-50 border border-red-200/50 rounded-xl"
      >
        <lucide-icon
          [img]="AlertCircleIcon"
          [size]="18"
          class="text-red-600 flex-shrink-0 mt-0.5"
        />
        <p class="text-sm text-red-700">{{ error() }}</p>
      </div>
      }

      <!-- Upload Progress -->
      @if (isUploading()) {
      <div class="space-y-2">
        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
            [style.width.%]="uploadProgress()"
          ></div>
        </div>
        <p class="text-xs text-slate-600 text-right">{{ uploadProgress() }}%</p>
      </div>
      }
    </div>
  `,
  styles: [],
})
export class LogoUploadComponent {
  private documentService = inject(SupabaseDocumentService);

  @Input() currentLogoUrl?: string;
  @Output() logoUploaded = new EventEmitter<{
    url: string;
    fileName: string;
  }>();
  @Output() logoRemoved = new EventEmitter<void>();

  // Icons
  UploadIcon = Upload;
  XIcon = X;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  ImageIcon = ImageIcon;

  // State
  isDragging = signal(false);
  isUploading = signal(false);
  isUploaded = signal(false);
  error = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  fileName = signal<string>('');
  fileSize = signal<string>('');
  uploadProgress = signal<number>(0);

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
  private readonly LOGO_CATEGORY = 'logos';

  ngOnInit() {
    if (this.currentLogoUrl) {
      this.previewUrl.set(this.currentLogoUrl);
      this.isUploaded.set(true);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Please upload a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.error.set('File size must be less than 5MB');
      return;
    }

    // Clear errors
    this.error.set(null);
    this.isUploaded.set(false);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    this.uploadLogo(file);
  }

  private uploadLogo(file: File) {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    const documentKey = `logo_${Date.now()}`;

    // Subscribe to progress updates
    this.documentService.uploadProgress$.subscribe((progressMap) => {
      const progress = progressMap.get(documentKey);
      if (progress) {
        this.uploadProgress.set(progress.progress);
      }
    });

    // Upload document
    this.documentService
      .uploadDocument(file, documentKey, undefined, this.LOGO_CATEGORY)
      .subscribe({
        next: (result: DocumentUploadResult) => {
          this.isUploading.set(false);
          this.isUploaded.set(true);
          this.fileName.set(result.originalName);
          this.fileSize.set(this.formatFileSize(result.fileSize));

          // Emit success
          this.logoUploaded.emit({
            url: result.publicUrl,
            fileName: result.originalName,
          });
        },
        error: (error) => {
          this.isUploading.set(false);
          this.error.set(error?.message || 'Failed to upload logo');
          this.previewUrl.set(null);
        },
      });
  }

  removeLogo() {
    this.previewUrl.set(null);
    this.fileName.set('');
    this.fileSize.set('');
    this.isUploaded.set(false);
    this.error.set(null);
    this.logoRemoved.emit();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
