// src/app/admin/components/verification-modals/verification-modals.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { UiButtonComponent, UiCardComponent } from '../../../../shared/components';
import { VerificationOrganization } from '../../../services/organization-verification.service';

@Component({
  selector: 'app-verification-modals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiCardComponent],
  templateUrl: 'verification-modals.component.html',
})
export class VerificationModalsComponent {
  @Input() showApprovalModal: boolean = false;
  @Input() showRejectionModal: boolean = false;
  @Input() showInfoRequestModal: boolean = false;
  @Input() selectedOrganization: VerificationOrganization | null = null;
  @Input() approvalForm!: FormGroup;
  @Input() rejectionForm!: FormGroup;
  @Input() infoRequestForm!: FormGroup;

  @Output() modalClosed = new EventEmitter<void>();
  @Output() organizationApproved = new EventEmitter<void>();
  @Output() organizationRejected = new EventEmitter<void>();
  @Output() infoRequested = new EventEmitter<void>();
}