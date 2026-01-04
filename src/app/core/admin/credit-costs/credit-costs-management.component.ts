// src/app/admin/credit-costs/credit-costs-management.component.ts
import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Coins,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  History,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
} from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import {
  CreditCostsService,
  CreditActionCost,
  CreditCostAuditEntry,
} from '../services/credit-costs.service';

interface EditingCost {
  action_key: string;
  cost: number;
  display_name: string;
  description: string;
  is_active: boolean;
}

interface NewCostForm {
  action_key: string;
  cost: number;
  display_name: string;
  description: string;
}

@Component({
  selector: 'app-credit-costs-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './credit-costs-management.component.html',
})
export class CreditCostsManagementComponent implements OnInit, OnDestroy {
  private costsService = inject(CreditCostsService);
  private destroy$ = new Subject<void>();

  // Icons
  readonly CoinsIcon = Coins;
  readonly Edit2Icon = Edit2;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly HistoryIcon = History;
  readonly RefreshCwIcon = RefreshCw;
  readonly AlertCircleIcon = AlertCircle;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ClockIcon = Clock;
  readonly UserIcon = User;
  readonly TrendingUpIcon = TrendingUp;
  readonly TrendingDownIcon = TrendingDown;

  // State
  readonly costs = signal<CreditActionCost[]>([]);
  readonly auditHistory = signal<CreditCostAuditEntry[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // UI State
  readonly editingKey = signal<string | null>(null);
  readonly showAddForm = signal(false);
  readonly showAuditHistory = signal(false);
  readonly isLoadingAudit = signal(false);

  // Edit form state
  readonly editingCost = signal<EditingCost | null>(null);

  // New cost form state
  readonly newCost = signal<NewCostForm>({
    action_key: '',
    cost: 0,
    display_name: '',
    description: '',
  });

  // Computed
  readonly activeCosts = computed(() =>
    this.costs().filter((c) => c.is_active)
  );

  readonly inactiveCosts = computed(() =>
    this.costs().filter((c) => !c.is_active)
  );

  readonly totalActiveActions = computed(() => this.activeCosts().length);

  readonly coreActions = ['view', 'generate', 'share', 'download'];

  ngOnInit(): void {
    this.loadCosts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  loadCosts(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.costsService
      .getAllCosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (costs) => {
          this.costs.set(costs);
          this.isLoading.set(false);
          this.showSuccess('Credit costs loaded');
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load costs');
          this.isLoading.set(false);
        },
      });
  }

  loadAuditHistory(): void {
    this.isLoadingAudit.set(true);
    this.showAuditHistory.set(true);

    this.costsService
      .getAuditHistory(50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.auditHistory.set(history);
          this.isLoadingAudit.set(false);
        },
        error: (err) => {
          console.error('Failed to load audit history:', err);
          this.isLoadingAudit.set(false);
        },
      });
  }

  // ===============================
  // NEW COST FORM UPDATES
  // ===============================

  updateNewCostActionKey(value: string): void {
    const current = this.newCost();
    this.newCost.set({ ...current, action_key: value });
  }

  updateNewCostDisplayName(value: string): void {
    const current = this.newCost();
    this.newCost.set({ ...current, display_name: value });
  }

  updateNewCostCost(value: number): void {
    const current = this.newCost();
    this.newCost.set({ ...current, cost: value });
  }

  updateNewCostDescription(value: string): void {
    const current = this.newCost();
    this.newCost.set({ ...current, description: value });
  }

  // ===============================
  // EDITING COST FORM UPDATES
  // ===============================

  updateEditingDisplayName(value: string): void {
    const current = this.editingCost();
    if (current) {
      this.editingCost.set({ ...current, display_name: value });
    }
  }

  updateEditingCost(value: number): void {
    const current = this.editingCost();
    if (current) {
      this.editingCost.set({ ...current, cost: value });
    }
  }

  updateEditingDescription(value: string): void {
    const current = this.editingCost();
    if (current) {
      this.editingCost.set({ ...current, description: value });
    }
  }

  // ===============================
  // EDIT OPERATIONS
  // ===============================

  startEdit(cost: CreditActionCost): void {
    this.editingKey.set(cost.action_key);
    this.editingCost.set({
      action_key: cost.action_key,
      cost: cost.cost,
      display_name: cost.display_name,
      description: cost.description || '',
      is_active: cost.is_active,
    });
  }

  cancelEdit(): void {
    this.editingKey.set(null);
    this.editingCost.set(null);
  }

  saveEdit(): void {
    const editing = this.editingCost();
    if (!editing) return;

    this.isLoading.set(true);

    this.costsService
      .updateCost({
        action_key: editing.action_key,
        cost: editing.cost,
        display_name: editing.display_name,
        description: editing.description || undefined,
        is_active: editing.is_active,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.showSuccess(
            `Cost updated: ${result.old_cost} → ${result.new_cost} credits`
          );
          this.cancelEdit();
          this.loadCosts();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to update cost');
          this.isLoading.set(false);
        },
      });
  }

  // ===============================
  // TOGGLE ACTIVE STATE
  // ===============================

  toggleActive(cost: CreditActionCost): void {
    // Don't allow disabling core actions
    if (this.coreActions.includes(cost.action_key) && cost.is_active) {
      this.error.set('Core actions cannot be disabled');
      return;
    }

    this.isLoading.set(true);

    this.costsService
      .updateCost({
        action_key: cost.action_key,
        is_active: !cost.is_active,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess(`Action ${cost.is_active ? 'disabled' : 'enabled'}`);
          this.loadCosts();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to toggle action');
          this.isLoading.set(false);
        },
      });
  }

  // ===============================
  // ADD NEW ACTION
  // ===============================

  openAddForm(): void {
    this.showAddForm.set(true);
    this.newCost.set({
      action_key: '',
      cost: 0,
      display_name: '',
      description: '',
    });
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.newCost.set({
      action_key: '',
      cost: 0,
      display_name: '',
      description: '',
    });
  }

  saveNewCost(): void {
    const newCostData = this.newCost();

    // Validation
    if (!newCostData.action_key.trim()) {
      this.error.set('Action key is required');
      return;
    }
    if (!newCostData.display_name.trim()) {
      this.error.set('Display name is required');
      return;
    }
    if (newCostData.cost < 0) {
      this.error.set('Cost must be 0 or greater');
      return;
    }

    // Format action key (lowercase, underscores)
    const formattedKey = newCostData.action_key
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    this.isLoading.set(true);

    this.costsService
      .addCost({
        action_key: formattedKey,
        cost: newCostData.cost,
        display_name: newCostData.display_name.trim(),
        description: newCostData.description?.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('New action cost added');
          this.cancelAdd();
          this.loadCosts();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to add action cost');
          this.isLoading.set(false);
        },
      });
  }

  // ===============================
  // DELETE ACTION
  // ===============================

  deleteAction(cost: CreditActionCost): void {
    // Prevent deletion of core actions
    if (this.coreActions.includes(cost.action_key)) {
      this.error.set('Core actions cannot be deleted. Use disable instead.');
      return;
    }

    if (
      !confirm(`Delete action "${cost.display_name}"? This cannot be undone.`)
    ) {
      return;
    }

    this.isLoading.set(true);

    this.costsService
      .deleteCost(cost.action_key)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Action deleted');
          this.loadCosts();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to delete action');
          this.isLoading.set(false);
        },
      });
  }

  // ===============================
  // HELPERS
  // ===============================

  isCoreAction(actionKey: string): boolean {
    return this.coreActions.includes(actionKey);
  }

  isEditing(actionKey: string): boolean {
    return this.editingKey() === actionKey;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return this.formatDate(dateString);
  }

  getAuditIcon(action: string): typeof TrendingUp {
    switch (action) {
      case 'credit_cost_updated':
        return this.Edit2Icon;
      case 'credit_cost_created':
        return this.PlusIcon;
      case 'credit_cost_deleted':
        return this.Trash2Icon;
      default:
        return this.CoinsIcon;
    }
  }

  getAuditColor(action: string): string {
    switch (action) {
      case 'credit_cost_updated':
        return 'bg-teal-100 text-teal-600';
      case 'credit_cost_created':
        return 'bg-green-100 text-green-600';
      case 'credit_cost_deleted':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getCostChangeIndicator(entry: CreditCostAuditEntry): {
    show: boolean;
    increased: boolean;
    diff: number;
  } {
    const oldCost = entry.metadata?.old_cost;
    const newCost = entry.metadata?.new_cost;

    if (oldCost === undefined || newCost === undefined) {
      return { show: false, increased: false, diff: 0 };
    }

    return {
      show: oldCost !== newCost,
      increased: newCost > oldCost,
      diff: Math.abs(newCost - oldCost),
    };
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  closeError(): void {
    this.error.set(null);
  }

  closeAuditHistory(): void {
    this.showAuditHistory.set(false);
  }

  trackByActionKey(index: number, cost: CreditActionCost): string {
    return cost.action_key;
  }

  trackByAuditId(index: number, entry: CreditCostAuditEntry): string {
    return entry.id;
  }
}
