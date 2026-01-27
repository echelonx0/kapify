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
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-angular';
import { OrganizationInvitationService } from '../services/organisation-invitation.service';
import { FormsModule } from '@angular/forms';

export interface ChangeRoleRequest {
  memberId: string;
  memberName: string;
  currentRole: string;
  newRole?: string;
}

@Component({
  selector: 'app-change-role-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      (click)="closeModal()"
    >
      <!-- Modal -->
      <div
        class="bg-white rounded-lg border-3 border-slate-300 shadow-lg max-w-md w-full"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b-3 border-slate-300 bg-slate-50 flex items-center justify-between"
        >
          <h3
            class="text-lg font-black text-slate-900 uppercase tracking-tight"
          >
            Change Role
          </h3>
          <button
            (click)="closeModal()"
            class="text-slate-600 hover:text-slate-900 transition-colors duration-200"
            aria-label="Close"
          >
            <lucide-icon [img]="XIcon" [size]="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 space-y-6">
          <!-- Member Info -->
          <div class="space-y-2">
            <p
              class="text-xs font-black text-slate-600 uppercase tracking-widest"
            >
              Team Member
            </p>
            <p class="text-base font-bold text-slate-900">
              {{ request.memberName }}
            </p>
          </div>

          <!-- Current Role -->
          <div class="space-y-2">
            <p
              class="text-xs font-black text-slate-600 uppercase tracking-widest"
            >
              Current Role
            </p>
            <div class="inline-block">
              <span
                [class]="
                  invitationService.getRoleDisplayBadgeClasses(
                    request.currentRole
                  )
                "
              >
                {{ invitationService.getRoleDisplayName(request.currentRole) }}
              </span>
            </div>
          </div>

          <!-- New Role Selection -->
          <div class="space-y-3">
            <p
              class="text-xs font-black text-slate-600 uppercase tracking-widest"
            >
              New Role
            </p>

            <div
              class="space-y-2 border-3 border-slate-300 rounded-lg p-4 bg-slate-50"
            >
              @for (role of availableRoles(); track role) {
                <label
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors duration-200 border-2"
                  [class]="
                    selectedRole() === role
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-300'
                  "
                >
                  <input
                    type="radio"
                    [value]="role"
                    [(ngModel)]="selectedRoleModel"
                    (change)="selectedRole.set(role)"
                    class="w-4 h-4 accent-teal-600"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-bold text-slate-900">
                      {{ invitationService.getRoleDisplayName(role) }}
                    </p>
                    <p class="text-xs text-slate-600 font-medium">
                      {{ invitationService.getRoleDescription(role) }}
                    </p>
                  </div>
                </label>
              }
            </div>
          </div>

          <!-- Warning if demoting -->
          @if (isDemoting()) {
            <div
              class="border-3 border-amber-400 rounded-lg p-4 bg-amber-50 flex items-start gap-3"
            >
              <lucide-icon
                [img]="AlertCircleIcon"
                [size]="20"
                class="text-amber-700 flex-shrink-0 mt-0.5 font-bold"
              />
              <div>
                <p class="text-sm font-bold text-amber-900">
                  This member will have fewer permissions
                </p>
                <p class="text-xs text-amber-700 mt-1 font-medium">
                  They will lose access to management features.
                </p>
              </div>
            </div>
          }

          <!-- Info: Cannot change owner -->
          @if (request.currentRole === 'owner') {
            <div
              class="border-3 border-red-400 rounded-lg p-4 bg-red-50 flex items-start gap-3"
            >
              <lucide-icon
                [img]="AlertCircleIcon"
                [size]="20"
                class="text-red-700 flex-shrink-0 mt-0.5 font-bold"
              />
              <div>
                <p class="text-sm font-bold text-red-900">
                  Cannot change owner role
                </p>
                <p class="text-xs text-red-700 mt-1 font-medium">
                  Owners cannot be demoted. Contact this member to transfer
                  ownership.
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Actions -->
        <div
          class="px-6 py-4 border-t-3 border-slate-300 bg-slate-50 flex gap-3"
        >
          <button
            (click)="closeModal()"
            class="flex-1 bg-slate-100 text-slate-900 font-black rounded-lg px-4 py-3.5 hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200 uppercase tracking-wide text-sm border-2 border-slate-400"
          >
            Cancel
          </button>
          <button
            (click)="confirmChange()"
            [disabled]="
              isConfirming() ||
              !selectedRole() ||
              request.currentRole === 'owner'
            "
            class="flex-1 bg-teal-600 text-white font-black rounded-lg px-4 py-3.5 hover:bg-teal-700 active:bg-teal-800 transition-colors duration-200 uppercase tracking-wide text-sm border-3 border-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (isConfirming()) {
              <div
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              <span>Updating...</span>
            } @else {
              <lucide-icon [img]="CheckCircleIcon" [size]="18" />
              <span>Confirm Change</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ChangeRoleModalComponent {
  invitationService = inject(OrganizationInvitationService);

  @Input() request!: ChangeRoleRequest;
  @Output() confirmed = new EventEmitter<{
    memberId: string;
    newRole: string;
  }>();
  @Output() cancelled = new EventEmitter<void>();

  // Icons
  XIcon = X;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  // State
  selectedRole = signal<string | null>(null);
  isConfirming = signal(false);
  selectedRoleModel: string = '';

  // Computed: available roles
  availableRoles = signal<string[]>([]);

  ngOnInit() {
    this.initializeAvailableRoles();
  }

  private initializeAvailableRoles(): void {
    const current = this.request.currentRole;
    const allRoles = ['owner', 'admin', 'member', 'viewer'];
    const available = allRoles.filter((role) => role !== current);

    this.availableRoles.set(available);

    if (available.length > 0) {
      this.selectedRole.set(available[0]);
      this.selectedRoleModel = available[0];
    }
  }

  isDemoting(): boolean {
    const roleHierarchy: Record<string, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      viewer: 1,
    };

    const currentLevel = roleHierarchy[this.request.currentRole] || 0;
    const newLevel = roleHierarchy[this.selectedRole() || ''] || 0;

    return newLevel < currentLevel;
  }

  confirmChange(): void {
    const newRole = this.selectedRole();
    if (!newRole) return;

    this.isConfirming.set(true);
    this.confirmed.emit({
      memberId: this.request.memberId,
      newRole,
    });
  }

  closeModal(): void {
    this.cancelled.emit();
  }
}
