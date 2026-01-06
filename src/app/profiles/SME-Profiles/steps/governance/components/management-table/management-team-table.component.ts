import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Edit2, Trash2, Search } from 'lucide-angular';

export interface ManagementMember {
  id: string;
  fullName: string;
  role: string;
  qualification: string;
  fieldOfStudy?: string;
  yearsOfExperience: number;
}

@Component({
  selector: 'app-management-team-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <!-- Search Bar -->
    <div class="mb-4">
      <div class="relative">
        <lucide-icon
          [name]="'search'"
          [size]="16"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by name or role..."
          [(ngModel)]="searchTerm"
          class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
        />
      </div>
    </div>

    <!-- Table -->
    <div
      class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <table class="w-full divide-y divide-slate-200">
        <!-- Header -->
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left">
              <span
                class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                Full Name
              </span>
            </th>
            <th class="px-6 py-3 text-left">
              <span
                class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                Role
              </span>
            </th>
            <th class="px-6 py-3 text-left">
              <span
                class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                Qualification
              </span>
            </th>
            <th class="px-6 py-3 text-left">
              <span
                class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                Experience
              </span>
            </th>
            <th class="px-6 py-3 text-left">
              <span
                class="text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                Field of Study
              </span>
            </th>
            <th class="px-6 py-3 text-right">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="divide-y divide-slate-200">
          @if (filteredMembers().length > 0) { @for (member of
          filteredMembers(); track member.id) {
          <tr class="hover:bg-slate-50 transition-colors duration-200">
            <td class="px-6 py-4 text-sm font-medium text-slate-900">
              {{ member.fullName }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-700">
              {{ member.role }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-700">
              {{ member.qualification }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-700">
              {{ member.yearsOfExperience }} years
            </td>
            <td class="px-6 py-4 text-sm text-slate-700">
              {{ member.fieldOfStudy || '—' }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <!-- Edit Button -->
                <button
                  (click)="onEdit(member.id)"
                  class="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                  title="Edit member"
                >
                  <lucide-icon [name]="EditIcon" [size]="16" />
                </button>

                <!-- Delete Button -->
                <button
                  (click)="onDelete(member.id)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete member"
                >
                  <lucide-icon [name]="Trash2Icon" [size]="16" />
                </button>
              </div>
            </td>
          </tr>
          } } @else {
          <tr>
            <td colspan="6" class="px-6 py-8 text-center">
              <div class="text-slate-500">
                <p class="text-sm">
                  @if (members().length === 0) { No management team members
                  added yet. } @else { No results matching your search. }
                </p>
              </div>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    @if (members().length > 0) {
    <div class="mt-4 text-xs text-slate-600">
      Showing {{ filteredMembers().length }} of
      {{ members().length }} member<span *ngIf="members().length !== 1">s</span>
    </div>
    }
  `,
})
export class ManagementTeamTableComponent {
  // Inputs
  members = input<ManagementMember[]>([]);

  // Outputs
  edit = output<string>();
  delete = output<string>();

  // Search state
  searchTerm = signal('');

  // Icons
  EditIcon = 'edit-2';
  Trash2Icon = 'trash-2';
  SearchIcon = 'search';

  // Computed: Filter members based on search term
  filteredMembers = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) {
      return this.members();
    }

    return this.members().filter(
      (member) =>
        member.fullName.toLowerCase().includes(search) ||
        member.role.toLowerCase().includes(search) ||
        member.qualification.toLowerCase().includes(search) ||
        (member.fieldOfStudy?.toLowerCase().includes(search) ?? false)
    );
  });

  onEdit(memberId: string) {
    this.edit.emit(memberId);
  }

  onDelete(memberId: string) {
    this.delete.emit(memberId);
  }
}
