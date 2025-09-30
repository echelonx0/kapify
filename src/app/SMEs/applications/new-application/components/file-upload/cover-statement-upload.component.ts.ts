// src/app/applications/components/new-application/components/file-upload/cover-statement-upload.component.ts

import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, FileText, X, CheckCircle } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-cover-statement-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cover-statement-upload.component.html'
})
export class CoverStatementUploadComponent {
  // Outputs
  fileSelected = output<File | undefined>();
  
  // State
  selectedFile = signal<File | undefined>(undefined);
  isDragging = signal(false);
  
  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  XIcon = X;
  CheckCircleIcon = CheckCircle;

  // Constants
  readonly ACCEPTED_TYPES = '.pdf,.doc,.docx';
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document');
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      alert('File size must be less than 5MB');
      return;
    }

    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  removeFile(): void {
    this.selectedFile.set(undefined);
    this.fileSelected.emit(undefined);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}