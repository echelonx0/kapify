// src/app/profile/guards/unsaved-changes.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { StepSaveService } from '../services/step-save.service';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard
  implements CanDeactivate<CanComponentDeactivate>
{
  private stepSaveService = inject(StepSaveService);

  canDeactivate(
    component: CanComponentDeactivate
  ): Observable<boolean> | Promise<boolean> | boolean {
    // If component has its own canDeactivate, use it
    if (component && component.canDeactivate) {
      return component.canDeactivate();
    }

    // Otherwise check step service for unsaved changes
    if (this.stepSaveService.hasUnsavedChanges()) {
      const message = this.stepSaveService.getUnsavedWarningMessage();
      return confirm(message);
    }

    return true;
  }
}
