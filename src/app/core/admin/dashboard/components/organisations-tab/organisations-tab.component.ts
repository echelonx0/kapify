// src/app/admin/organizations-tab.component.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent, UiCardComponent } from '../../../../shared/components';
import { DropdownOption } from '../../../../shared/components/ui/shared-ui-components';
import { AdminOrganization } from '../../../services/admin.service';
import { KapifyDropdownComponent } from '../../../../shared/components/ui/kapify-dropdown.component';
 

@Component({
  selector: 'organizations-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiCardComponent, KapifyDropdownComponent],
  templateUrl: './organisations-tab.component.html',
})
export class OrganizationsTabComponent {
  // Input data from parent
  @Input() organizations: AdminOrganization[] = [];
  @Input() filters!: { status: string; type: string; search: string };
  @Input() filterTrigger!: () => void; // Function to trigger reactivity in parent

  // Output events to parent
  @Output() view = new EventEmitter<AdminOrganization>();
  @Output() verify = new EventEmitter<AdminOrganization>();
  @Output() toggleStatus = new EventEmitter<AdminOrganization>();

  // Computed filtered organizations
  filteredOrganizations = computed(() => {
    this.filterTrigger?.();
    const currentFilters = this.filters;
    return this.organizations.filter(org => {
      const searchTerm = currentFilters.search.toLowerCase().trim();
      const matchesSearch = !searchTerm || 
        `${org.name || ''} ${org.city || ''} ${org.country || ''}`.toLowerCase().includes(searchTerm);

      const matchesStatus = !currentFilters.status || org.status === currentFilters.status;
      const matchesType = !currentFilters.type || org.organizationType === currentFilters.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  });

  // Dropdown options
  getOrganizationStatusOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'pending_verification', label: 'Pending Verification' },
      { value: 'verified', label: 'Verified' },
      { value: 'suspended', label: 'Suspended' }
    ];
  }

  getOrganizationTypeOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Types' },
      { value: 'sme', label: 'SME' },
      { value: 'investment_fund', label: 'Investment Fund' },
      { value: 'bank', label: 'Bank' },
      { value: 'government', label: 'Government' },
      { value: 'ngo', label: 'NGO' }
    ];
  }

  // Methods to emit actions to parent
  onView(org: AdminOrganization) { this.view.emit(org); }
  onVerify(org: AdminOrganization) { this.verify.emit(org); }
  onToggleStatus(org: AdminOrganization) { this.toggleStatus.emit(org); }
}
