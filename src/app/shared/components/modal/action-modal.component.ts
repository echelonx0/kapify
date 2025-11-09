import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-angular';
import { ActionModalService } from './modal.service';

@Component({
  selector: 'app-action-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './action-modal.component.html',
  styleUrls: ['./action-modal.component.css'],
})
export class ActionModalComponent {
  modalService = inject(ActionModalService);

  XIcon = X;
  AlertIcon = AlertTriangle;
  CheckIcon = CheckCircle;

  constructor() {
    // Optional effect for debugging
    effect(() => {
      if (this.modalService.isOpen()) {
        console.log('🟢 Modal opened with data:', this.modalService.data());
      }
    });
  }

  close() {
    this.modalService.close();
  }

  confirm() {
    // this.modalService.confirmAction();
  }
}
