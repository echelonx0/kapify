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
  Eye,
  Copy,
} from 'lucide-angular';
import {
  SupabaseDocumentService,
  DocumentUploadResult,
} from '../../../shared/services/supabase-document.service';

export interface ProfileImage {
  url: string;
  fileName: string;
  uploadedAt: Date;
  size: string;
  type: 'logo' | 'hero' | 'team';
}

@Component({
  selector: 'app-public-profile-logo-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-4">
      @if (previewUrl()) {
      <!-- Image Preview -->
      <div
        class="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3 flex-1">
          <div
            class="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden"
          >
            <img
              [src]="previewUrl()"
              [alt]="'Preview: ' + imageType"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-900">{{ fileName() }}</p>
            <p class="text-xs text-slate-600">{{ fileSize() }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="viewImage()"
            class="p-2 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            <lucide-icon [img]="EyeIcon" [size]="18" />
          </button>
          <button
            type="button"
            (click)="copyImageUrl()"
            class="p-2 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            <lucide-icon [img]="CopyIcon" [size]="18" />
          </button>
          <button
            type="button"
            (click)="removeLogo()"
            class="p-2 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
          >
            <lucide-icon [img]="XIcon" [size]="18" />
          </button>
        </div>
      </div>
      } @else {
      <!-- Upload Zone -->
      <div
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
        [class]="
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ' +
          (isDragging()
            ? 'border-teal-500 bg-teal-50'
            : 'border-slate-200 bg-slate-50 hover:border-teal-400')
        "
      >
        <div class="flex flex-col items-center gap-3">
          <div
            class="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center"
          >
            <lucide-icon [img]="UploadIcon" [size]="24" class="text-teal-600" />
          </div>

          <div>
            <p class="text-sm font-medium text-slate-900">
              @if (isUploading()) {
              <span>Uploading...</span>
              } @else {
              <span
                >Drag image here or
                <span class="text-teal-600 font-semibold">click</span></span
              >
              }
            </p>
            <p class="text-xs text-slate-600 mt-1">
              PNG, JPG or SVG • Max 10MB
            </p>
          </div>
        </div>
      </div>
      <input
        #fileInput
        type="file"
        [accept]="acceptedFormats"
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

      <!-- Progress Bar -->
      @if (isUploading()) {
      <div class="space-y-2">
        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700"
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
export class PublicProfileLogoUploadComponent {
  private documentService = inject(SupabaseDocumentService);

  @Input() imageType: 'logo' | 'hero' | 'team' = 'logo';
  @Input() currentImageUrl?: string;
  @Output() imageUploaded = new EventEmitter<ProfileImage>();
  @Output() imageRemoved = new EventEmitter<void>();

  // Icons
  UploadIcon = Upload;
  XIcon = X;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  EyeIcon = Eye;
  CopyIcon = Copy;

  // State
  isDragging = signal(false);
  isUploading = signal(false);
  error = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  fileName = signal<string>('');
  fileSize = signal<string>('');
  uploadProgress = signal<number>(0);

  acceptedFormats = 'image/png,image/jpeg,image/svg+xml';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

  ngOnInit() {
    if (this.currentImageUrl) {
      this.previewUrl.set(this.currentImageUrl);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.handleFile(files[0]);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.handleFile(input.files[0]);
  }

  private handleFile(file: File) {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Please upload PNG, JPG, or SVG');
      return;
    }
    if (file.size > this.MAX_FILE_SIZE) {
      this.error.set('File size must be less than 10MB');
      return;
    }

    this.error.set(null);

    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);

    this.uploadImage(file);
  }

  private uploadImage(file: File) {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    const documentKey = `profile_${this.imageType}_${Date.now()}`;

    this.documentService.uploadProgress$.subscribe((progressMap) => {
      const progress = progressMap.get(documentKey);
      if (progress) this.uploadProgress.set(progress.progress);
    });

    this.documentService
      .uploadDocument(file, documentKey, undefined, 'profile-images')
      .subscribe({
        next: (result: DocumentUploadResult) => {
          this.isUploading.set(false);
          this.fileName.set(result.originalName);
          this.fileSize.set(this.formatFileSize(result.fileSize));

          this.imageUploaded.emit({
            url: result.publicUrl,
            fileName: result.originalName,
            uploadedAt: new Date(),
            size: this.fileSize(),
            type: this.imageType,
          });
        },
        error: (error) => {
          this.isUploading.set(false);
          this.error.set(error?.message || 'Upload failed');
          this.previewUrl.set(null);
        },
      });
  }

  removeLogo() {
    this.previewUrl.set(null);
    this.fileName.set('');
    this.fileSize.set('');
    this.error.set(null);
    this.imageRemoved.emit();
  }

  viewImage() {
    if (this.previewUrl()) window.open(this.previewUrl()!, '_blank');
  }

  copyImageUrl() {
    const url = this.previewUrl();
    if (url) navigator.clipboard.writeText(url);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
