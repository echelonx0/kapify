// src/app/funder/components/application-detail/components/status-management-modal/status-management-modal.component.ts

import { Component, signal, computed, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  X,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Flag,
  AlertCircle,
  MessageSquare,
  Calendar,
  Clock,
  Send
} from 'lucide-angular';

import { FundingApplication, ApplicationMetadata } from 'src/app/SMEs/models/application.models';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
import { MessagingService } from 'src/app/messaging/services/messaging.service';

type ActionCategory = 'internal' | 'external';

interface StatusAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: ActionCategory;
  status?: FundingApplication['status'];
  internalStatus?: 'committee_review' | 'pending_documents' | 'pending_amendments' | 'flagged_review' | 'peer_review';
  requiresComment: boolean;
  createsThread?: boolean;
  colorClass: string;
}

@Component({
  selector: 'app-status-management-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './status-management-modal.component.html',
  styleUrls: ['./status-management-modal.component.css']
})
export class StatusManagementModalComponent {
  @Input() application!: FundingApplication;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() actionCompleted = new EventEmitter<void>();

  // Services
  private applicationService = inject(ApplicationManagementService);
  private messagingService = inject(MessagingService);

  // Icons
  XIcon = X;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  FileTextIcon = FileText;
  UsersIcon = Users;
  FlagIcon = Flag;
  AlertCircleIcon = AlertCircle;
  MessageSquareIcon = MessageSquare;
  CalendarIcon = Calendar;
  ClockIcon = Clock;
  SendIcon = Send;

  // State
  activeCategory = signal<ActionCategory>('external');
  selectedAction = signal<StatusAction | null>(null);
  comment = signal('');
  isProcessing = signal(false);
  error = signal<string | null>(null);
  priorityLevel = signal<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Available actions
  actions = computed((): StatusAction[] => [
    // EXTERNAL ACTIONS
    {
      id: 'approve',
      label: 'Approve Application',
      description: 'Approve this application for funding',
      icon: this.CheckCircleIcon,
      category: 'external',
      status: 'approved',
      requiresComment: false,
      createsThread: true,
      colorClass: 'text-green-600'
    },
    {
      id: 'reject',
      label: 'Reject Application',
      description: 'Reject this application with reason',
      icon: this.XCircleIcon,
      category: 'external',
      status: 'rejected',
      requiresComment: true,
      createsThread: true,
      colorClass: 'text-red-600'
    },
    {
      id: 'request_documents',
      label: 'Request Additional Documents',
      description: 'Request specific documents from applicant',
      icon: this.FileTextIcon,
      category: 'external',
      status: 'under_review',
      internalStatus: 'pending_documents',
      requiresComment: true,
      createsThread: true,
      colorClass: 'text-blue-600'
    },
    {
      id: 'request_info',
      label: 'Request Clarification',
      description: 'Ask applicant for more information',
      icon: this.MessageSquareIcon,
      category: 'external',
      status: 'under_review',
      requiresComment: true,
      createsThread: true,
      colorClass: 'text-purple-600'
    },
    {
      id: 'request_amendments',
      label: 'Request Amendments',
      description: 'Request changes to the application',
      icon: this.FileTextIcon,
      category: 'external',
      status: 'under_review',
      internalStatus: 'pending_amendments',
      requiresComment: true,
      createsThread: true,
      colorClass: 'text-orange-600'
    },

    // INTERNAL ACTIONS
    {
      id: 'refer_committee',
      label: 'Refer to Investment Committee',
      description: 'Send to committee for review',
      icon: this.UsersIcon,
      category: 'internal',
      status: 'under_review',
      internalStatus: 'committee_review',
      requiresComment: false,
      colorClass: 'text-indigo-600'
    },
    {
      id: 'add_note',
      label: 'Add Internal Note',
      description: 'Add private note visible only to team',
      icon: this.FileTextIcon,
      category: 'internal',
      requiresComment: true,
      colorClass: 'text-gray-600'
    },
    {
      id: 'flag_review',
      label: 'Flag for Additional Review',
      description: 'Mark for deeper analysis',
      icon: this.FlagIcon,
      category: 'internal',
      internalStatus: 'flagged_review',
      requiresComment: true,
      colorClass: 'text-yellow-600'
    },
    {
      id: 'set_priority',
      label: 'Set Priority Level',
      description: 'Change application priority',
      icon: this.AlertCircleIcon,
      category: 'internal',
      requiresComment: false,
      colorClass: 'text-pink-600'
    },
    {
      id: 'request_peer_review',
      label: 'Request Peer Review',
      description: 'Ask colleague to review',
      icon: this.UsersIcon,
      category: 'internal',
      internalStatus: 'peer_review',
      requiresComment: true,
      colorClass: 'text-teal-600'
    }
  ]);

  filteredActions = computed(() => 
    this.actions().filter(a => a.category === this.activeCategory())
  );

  canSubmit = computed(() => {
    const action = this.selectedAction();
    if (!action) return false;
    if (action.requiresComment && !this.comment().trim()) return false;
    return true;
  });

  setCategory(category: ActionCategory) {
    this.activeCategory.set(category);
    this.selectedAction.set(null);
    this.comment.set('');
    this.error.set(null);
  }

  selectAction(action: StatusAction) {
    this.selectedAction.set(action);
    this.error.set(null);
    
    // Pre-fill comment templates for common actions
    if (action.id === 'request_documents') {
      this.comment.set('Please provide the following documents:\n\n1. \n2. \n3. ');
    } else if (action.id === 'request_info') {
      this.comment.set('We need clarification on the following:\n\n');
    } else if (action.id === 'reject') {
      this.comment.set('After careful review, we have decided not to proceed with your application because:\n\n');
    } else if (action.id === 'approve') {
      this.comment.set('Congratulations! Your application has been approved.');
    } else {
      this.comment.set('');
    }
  }

  async submitAction() {
    const action = this.selectedAction();
    if (!action || !this.canSubmit()) return;

    this.isProcessing.set(true);
    this.error.set(null);

    try {
      // Build metadata updates
      const metadataUpdates: Partial<ApplicationMetadata> = {};
      
      if (action.internalStatus) {
        metadataUpdates.internalStatus = action.internalStatus;
        metadataUpdates.internalStatusUpdatedAt = new Date().toISOString();
      }

      if (action.id === 'set_priority') {
        metadataUpdates.priority = this.priorityLevel();
        metadataUpdates.priorityUpdatedAt = new Date().toISOString();
      }

      if (action.id === 'add_note') {
        metadataUpdates.internalNotes = [
          ...(this.application.metadata?.internalNotes || []),
          {
            note: this.comment().trim(),
            createdAt: new Date().toISOString(),
            createdBy: 'current_user' // Replace with actual user from auth
          }
        ];
      }

      // Update application status if needed
      if (action.status) {
        await this.applicationService
          .updateApplicationStatus(
            this.application.id,
            action.status,
            undefined,
            this.comment().trim() || undefined
          )
          .toPromise();
      }

      // Update metadata if we have updates
      if (Object.keys(metadataUpdates).length > 0) {
        await this.updateApplicationMetadata(metadataUpdates);
      }

      // Create message thread if needed
      if (action.createsThread) {
        await this.createMessageThread(action);
      }

      this.actionCompleted.emit();
      this.closeModal();
      
    } catch (error) {
      console.error('Error executing action:', error);
      this.error.set('Failed to complete action. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async updateApplicationMetadata(updates: Partial<ApplicationMetadata>) {
    // Use the generic update method with proper typing
    const currentMetadata = this.application.metadata || {};
    
    await this.applicationService
      .updateApplicationStatus(
        this.application.id,
        this.application.status, // Keep current status
        undefined,
        undefined,
        // {
        //   metadata: {
        //     ...currentMetadata,
        //     ...updates
        //   }
        // }
      )
      .toPromise();
  }

  private async createMessageThread(action: StatusAction) {
    const subject = this.getThreadSubject(action);
    const message = this.comment().trim();
    
    if (!message) return;

    const threadId = await this.messagingService.createApplicationThread(
      this.application.id,
      subject
    );

    if (threadId) {
      await this.messagingService.sendMessage(threadId, message, 'message');
    }
  }

  private getThreadSubject(action: StatusAction): string {
    const subjectMap: Record<string, string> = {
      approve: `Application Approved: ${this.application.title}`,
      reject: `Application Status: ${this.application.title}`,
      request_documents: `Document Request: ${this.application.title}`,
      request_info: `Information Request: ${this.application.title}`,
      request_amendments: `Amendment Request: ${this.application.title}`
    };
    return subjectMap[action.id] || `Re: ${this.application.title}`;
  }

  closeModal() {
    this.selectedAction.set(null);
    this.comment.set('');
    this.error.set(null);
    this.activeCategory.set('external');
    this.close.emit();
  }

  onCommentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.comment.set(target.value);
  }

  onPriorityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.priorityLevel.set(target.value as any);
  }
}