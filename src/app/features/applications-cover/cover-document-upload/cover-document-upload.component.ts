import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { SupabaseDocumentService } from 'src/app/shared/services/supabase-document.service';

@Component({
  selector: 'app-cover-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cover-document-upload.component.html',
})
export class CoverDocumentUploadComponent implements OnInit {
  private documentService = inject(SupabaseDocumentService);
  private coverService = inject(FundingApplicationCoverService);

  @Input() cover: FundingApplicationCoverInformation | null = null;
  @Output() documentAttached =
    new EventEmitter<FundingApplicationCoverInformation>();
  @Output() cancel = new EventEmitter<void>();

  // File upload state
  private selectedFile = signal<File | null>(null);
  private isUploading = signal(false);
  private uploadError = signal<string | null>(null);
  private uploadProgress = signal(0);

  readonly file = this.selectedFile;
  readonly uploading = this.isUploading;
  readonly error = this.uploadError;
  readonly progress = this.uploadProgress;

  readonly canUpload = computed(() => {
    return this.selectedFile() !== null && !this.uploading();
  });

  readonly fileName = computed(() => {
    return this.selectedFile()?.name || 'No file selected';
  });

  readonly fileSize = computed(() => {
    const file = this.selectedFile();
    if (!file) return '';
    return this.formatFileSize(file.size);
  });

  ngOnInit() {
    // Subscribe to upload progress
    this.documentService.uploadProgress$.subscribe((progressMap) => {
      if (this.cover) {
        const documentKey = `cover_${this.cover.id}_document`;
        const progress = progressMap.get(documentKey);
        if (progress) {
          this.uploadProgress.set(progress.progress);
        }
      }
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validate file
      if (file.size > 52428800) {
        // 50MB
        this.uploadError.set('File too large (max 50MB)');
        this.selectedFile.set(null);
        return;
      }

      const validTypes = [
        'pdf',
        'doc',
        'docx',
        'jpg',
        'jpeg',
        'png',
        'xls',
        'xlsx',
      ];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !validTypes.includes(extension)) {
        this.uploadError.set(
          `Invalid file type. Allowed: ${validTypes.join(', ')}`
        );
        this.selectedFile.set(null);
        return;
      }

      this.uploadError.set(null);
      this.selectedFile.set(file);
      this.uploadProgress.set(0);
    }
  }

  /**
   * Upload document and attach to cover
   * Unified operation via service
   */
  async uploadDocument(): Promise<void> {
    if (!this.canUpload() || !this.cover || !this.selectedFile()) {
      return;
    }

    try {
      this.isUploading.set(true);
      this.uploadError.set(null);

      const file = this.selectedFile()!;
      console.log('📄 Uploading document for cover:', this.cover.id);

      // Service method returns Promise directly
      const result = await this.coverService.attachDocumentToCover(
        this.cover.id,
        file
      );

      if (result.success && result.cover) {
        console.log('✅ Document attached and cover updated');
        this.documentAttached.emit(result.cover);
        this.selectedFile.set(null);
      } else {
        this.uploadError.set(result.error || 'Upload failed');
      }
    } catch (err: any) {
      this.uploadError.set(err?.message || 'Upload failed');
      console.error('❌ Upload error:', err);
    } finally {
      this.isUploading.set(false);
    }
  }

  /**
   * Remove selected file
   */
  removeFile(): void {
    this.selectedFile.set(null);
    this.uploadProgress.set(0);
    this.uploadError.set(null);

    // Reset input
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
