import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';

/\*\*

- TOAST USAGE EXAMPLES
-
- Inject ToastService into any component or service and use these patterns:
  \*/

// ============================================
// 1. SUCCESS NOTIFICATIONS (auto-dismiss 4s)
// ============================================

export class ApplicationFormComponent {
private toastService = inject(ToastService);

saveApplication() {
// Default: auto-dismiss in 4 seconds
this.toastService.success('Application saved successfully');

    // Custom duration
    this.toastService.success('Draft saved', 3000);

    // Full control
    this.toastService.show({
      message: 'Application submitted!',
      type: 'success',
      autoDismiss: true,
      duration: 5000,
    });

}
}

// ============================================
// 2. ERROR NOTIFICATIONS (manual dismiss only)
// ============================================

export class ErrorHandlingComponent {
private toastService = inject(ToastService);

handleError(error: any) {
// Errors don't auto-dismiss by default
this.toastService.error(
'Failed to save application. Please try again.'
);

    // Keep error visible longer with manual dismiss
    this.toastService.show({
      message: `Error: ${error.message}`,
      type: 'error',
      autoDismiss: false,
    });

}
}

// ============================================
// 3. WARNING NOTIFICATIONS (auto-dismiss)
// ============================================

export class ValidationComponent {
private toastService = inject(ToastService);

validateForm() {
if (missingFields) {
this.toastService.warning(
'Please fill in all required fields',
5000
);
}
}
}

// ============================================
// 4. INFO NOTIFICATIONS (auto-dismiss)
// ============================================

export class InfoComponent {
private toastService = inject(ToastService);

shareProfile() {
const id = this.toastService.info('Profile link copied to clipboard');
// Can dismiss programmatically if needed
// setTimeout(() => this.toastService.dismiss(id), 2000);
}
}

// ============================================
// 5. OBSERVABLE PATTERN (async operations)
// ============================================

export class SubmissionComponent {
private toastService = inject(ToastService);

submitApplication(appId: string) {
const loadingToastId = this.toastService.show({
message: 'Submitting application...',
type: 'info',
autoDismiss: false,
});

    this.applicationService.submit(appId).subscribe({
      next: () => {
        this.toastService.dismiss(loadingToastId);
        this.toastService.success('Application submitted successfully!');
      },
      error: (error) => {
        this.toastService.dismiss(loadingToastId);
        this.toastService.error(
          `Submission failed: ${error.message}`
        );
      },
    });

}
}

// ============================================
// 6. PROGRAMMATIC DISMISS
// ============================================

export class DismissableComponent {
private toastService = inject(ToastService);

showTemporaryMessage() {
// Get toast ID for programmatic control
const toastId = this.toastService.info('Processing...', 10000);

    // Dismiss after operation completes
    setTimeout(() => {
      this.toastService.dismiss(toastId);
      this.toastService.success('Operation complete!');
    }, 3000);

}

dismissAll() {
this.toastService.dismissAll();
}
}

// ============================================
// 7. MULTI-STEP WORKFLOW
// ============================================

export class WorkflowComponent {
private toastService = inject(ToastService);

async processUpload(file: File) {
try {
// Step 1: Validation
const validateId = this.toastService.show({
message: 'Validating file...',
type: 'info',
autoDismiss: false,
});

      await this.validate(file);
      this.toastService.dismiss(validateId);

      // Step 2: Upload
      const uploadId = this.toastService.show({
        message: 'Uploading file...',
        type: 'info',
        autoDismiss: false,
      });

      await this.upload(file);
      this.toastService.dismiss(uploadId);

      // Success
      this.toastService.success('File uploaded successfully!');
    } catch (error) {
      this.toastService.error(
        `Upload failed: ${(error as Error).message}`
      );
    }

}

private validate(file: File): Promise<void> {
return new Promise((resolve) => setTimeout(resolve, 1000));
}

private upload(file: File): Promise<void> {
return new Promise((resolve) => setTimeout(resolve, 2000));
}
}
