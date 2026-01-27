import {
  Component,
  signal,
  computed,
  inject,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  FileText,
  Users,
  Flag,
  MessageSquare,
  Clock,
  Send,
  CircleCheckBig,
  CircleX,
  CircleAlert,
} from 'lucide-angular';
import { FundingApplication } from 'src/app/fund-seeking-orgs/models/application.models';
import {
  ApplicationStatusService,
  StatusAction,
} from 'src/app/funder/services/application-status.service';

type ActionCategory = 'internal' | 'external';

@Component({
  selector: 'app-status-management-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './status-management-modal.component.html',
  styleUrls: ['./status-management-modal.component.css'],
})
export class StatusManagementModalComponent {
  @Input() application!: FundingApplication;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() actionCompleted = new EventEmitter<void>();

  // Services
  private statusService = inject(ApplicationStatusService);

  // Icons
  XIcon = X;
  CheckCircleIcon = CircleCheckBig;
  XCircleIcon = CircleX;
  FileTextIcon = FileText;
  UsersIcon = Users;
  FlagIcon = Flag;
  AlertCircleIcon = CircleAlert;
  MessageSquareIcon = MessageSquare;
  ClockIcon = Clock;
  SendIcon = Send;

  // State
  activeCategory = signal<ActionCategory>('external');
  selectedAction = signal<StatusAction | null>(null);
  comment = signal('');
  isProcessing = computed(() => this.statusService.isProcessing());
  error = signal<string | null>(null);
  priorityLevel = signal<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Computed
  actions = computed(() => this.statusService.getAvailableActions());

  filteredActions = computed(() =>
    this.actions().filter((a) => a.category === this.activeCategory())
  );

  canSubmit = computed(() => {
    const action = this.selectedAction();
    if (!action) return false;
    if (action.requiresComment && !this.comment().trim()) return false;
    return true;
  });

  // ===============================
  // ACTION HANDLERS
  // ===============================

  setCategory(category: ActionCategory) {
    this.activeCategory.set(category);
    this.selectedAction.set(null);
    this.comment.set('');
    this.error.set(null);
  }

  selectAction(action: StatusAction) {
    this.selectedAction.set(action);
    this.error.set(null);

    // Pre-fill comment template
    const template = this.statusService.getCommentTemplate(action.id);
    this.comment.set(template);
  }

  async submitAction() {
    const action = this.selectedAction();
    if (!action || !this.canSubmit()) return;

    this.error.set(null);

    try {
      await this.statusService
        .submitAction({
          action,
          applicationId: this.application.id,
          comment: this.comment(),
          priorityLevel: this.priorityLevel(),
        })
        .toPromise();

      this.actionCompleted.emit();
      this.closeModal();
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Failed to complete action'
      );
    }
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

  // ===============================
  // UTILITY METHODS
  // ===============================

  getActionColorClass(actionId: string): string {
    const colorMap: Record<string, string> = {
      approve: 'text-green-600',
      reject: 'text-red-600',
      request_documents: 'text-blue-600',
      request_info: 'text-teal-600',
      request_amendments: 'text-amber-600',
      refer_committee: 'text-indigo-600',
      add_note: 'text-slate-600',
      flag_review: 'text-amber-600',
      set_priority: 'text-pink-600',
      request_peer_review: 'text-teal-600',
    };
    return colorMap[actionId] || 'text-slate-600';
  }

  getActionIcon(actionId: string): any {
    const iconMap: Record<string, any> = {
      approve: this.CheckCircleIcon,
      reject: this.XCircleIcon,
      request_documents: this.FileTextIcon,
      request_info: this.MessageSquareIcon,
      request_amendments: this.FileTextIcon,
      refer_committee: this.UsersIcon,
      add_note: this.FileTextIcon,
      flag_review: this.FlagIcon,
      set_priority: this.AlertCircleIcon,
      request_peer_review: this.UsersIcon,
    };
    return iconMap[actionId] || this.FileTextIcon;
  }

  getActionBgColor(actionId: string): string {
    const colorMap: Record<string, string> = {
      approve: 'bg-green-100',
      reject: 'bg-red-100',
      request_documents: 'bg-blue-100',
      request_info: 'bg-teal-100',
      request_amendments: 'bg-amber-100',
      refer_committee: 'bg-indigo-100',
      add_note: 'bg-slate-100',
      flag_review: 'bg-amber-100',
      set_priority: 'bg-pink-100',
      request_peer_review: 'bg-teal-100',
    };
    return colorMap[actionId] || 'bg-slate-100';
  }
}
