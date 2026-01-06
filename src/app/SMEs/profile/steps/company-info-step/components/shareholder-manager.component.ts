// import {
//   Component,
//   signal,
//   input,
//   output,
//   OnInit,
//   inject,
//   computed,
// } from '@angular/core';
// import {
//   ReactiveFormsModule,
//   FormBuilder,
//   FormGroup,
//   Validators,
// } from '@angular/forms';
// import { LucideAngularModule, Plus, Edit, Trash2 } from 'lucide-angular';
// import {
//   UiInputComponent,
//   UiButtonComponent,
// } from '../../../../../shared/components';

// export interface Shareholder {
//   id: string;
//   fullName: string;
//   currentShareholding: number;
//   postInvestmentShareholding: number;
// }

// @Component({
//   selector: 'app-shareholder-manager',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     LucideAngularModule,
//     UiInputComponent,
//     UiButtonComponent,
//   ],
//   templateUrl: './shareholder-manager.component.html',
// })
// export class ShareholderManagerComponent implements OnInit {
//   private fb = inject(FormBuilder);

//   // Inputs
//   shareholders = input<Shareholder[]>([]);

//   // Outputs
//   shareholdersChange = output<Shareholder[]>();

//   // UI State
//   showModal = signal(false);
//   editingIndex = signal(-1);
//   shareholderForm: FormGroup;

//   // Icons
//   PlusIcon = Plus;
//   EditIcon = Edit;
//   Trash2Icon = Trash2;

//   // Computed: Form title
//   modalTitle = computed(() => {
//     return this.editingIndex() !== -1 ? 'Edit Shareholder' : 'Add Shareholder';
//   });

//   // Computed: Button text
//   submitButtonText = computed(() => {
//     return this.editingIndex() !== -1
//       ? 'Update Shareholder'
//       : 'Add Shareholder';
//   });

//   constructor() {
//     this.shareholderForm = this.createShareholderForm();
//   }

//   ngOnInit() {
//     // Component initialization if needed
//   }

//   // ===============================
//   // FORM CREATION
//   // ===============================

//   private createShareholderForm(): FormGroup {
//     return this.fb.group({
//       fullName: ['', [Validators.required]],
//       currentShareholding: [
//         '',
//         [Validators.required, Validators.min(0), Validators.max(100)],
//       ],
//       postInvestmentShareholding: [
//         '',
//         [Validators.required, Validators.min(0), Validators.max(100)],
//       ],
//     });
//   }

//   // ===============================
//   // MODAL OPERATIONS
//   // ===============================

//   openAddModal() {
//     this.shareholderForm.reset();
//     this.editingIndex.set(-1);
//     this.showModal.set(true);
//   }

//   openEditModal(index: number) {
//     const shareholder = this.shareholders()[index];
//     this.shareholderForm.patchValue(shareholder);
//     this.editingIndex.set(index);
//     this.showModal.set(true);
//   }

//   closeModal() {
//     this.showModal.set(false);
//     this.editingIndex.set(-1);
//     this.shareholderForm.reset();
//   }

//   // ===============================
//   // SHAREHOLDER CRUD
//   // ===============================

//   saveShareholder() {
//     if (!this.shareholderForm.valid) return;

//     const formValue = this.shareholderForm.value;
//     const updatedShareholders = [...this.shareholders()];

//     if (this.editingIndex() !== -1) {
//       // Update existing
//       updatedShareholders[this.editingIndex()] = {
//         ...updatedShareholders[this.editingIndex()],
//         fullName: formValue.fullName,
//         currentShareholding: formValue.currentShareholding,
//         postInvestmentShareholding: formValue.postInvestmentShareholding,
//       };
//     } else {
//       // Add new
//       updatedShareholders.push({
//         id: Date.now().toString(),
//         fullName: formValue.fullName,
//         currentShareholding: formValue.currentShareholding,
//         postInvestmentShareholding: formValue.postInvestmentShareholding,
//       });
//     }

//     this.shareholdersChange.emit(updatedShareholders);
//     this.closeModal();
//   }

//   deleteShareholder(index: number) {
//     if (!confirm('Delete this shareholder?')) return;

//     const updatedShareholders = this.shareholders().filter(
//       (_, i) => i !== index
//     );
//     this.shareholdersChange.emit(updatedShareholders);
//   }

//   // ===============================
//   // HELPERS
//   // ===============================

//   getFieldError(fieldName: string): string | undefined {
//     const field = this.shareholderForm.get(fieldName);
//     if (!field?.errors || !field.touched) return undefined;

//     if (field.errors['required'])
//       return `${this.getFieldLabel(fieldName)} is required`;
//     if (field.errors['min']) return 'Value must be 0 or greater';
//     if (field.errors['max']) return 'Value cannot exceed 100';

//     return undefined;
//   }

//   private getFieldLabel(fieldName: string): string {
//     const labels: Record<string, string> = {
//       fullName: 'Full name',
//       currentShareholding: 'Current shareholding',
//       postInvestmentShareholding: 'Post investment shareholding',
//     };
//     return labels[fieldName] || fieldName;
//   }
// }

import {
  Component,
  signal,
  input,
  output,
  OnInit,
  inject,
  computed,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LucideAngularModule, Plus, Edit, Trash2 } from 'lucide-angular';
import {
  UiInputComponent,
  UiButtonComponent,
} from '../../../../../shared/components';

export interface Shareholder {
  id: string;
  fullName: string;
  currentShareholding: number;
  postInvestmentShareholding: number;
}

@Component({
  selector: 'app-shareholder-manager',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    UiInputComponent,
    UiButtonComponent,
  ],
  templateUrl: './shareholder-manager.component.html',
})
export class ShareholderManagerComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  shareholders = input<Shareholder[]>([]);

  // Outputs
  shareholdersChange = output<Shareholder[]>();

  // UI State
  showModal = signal(false);
  editingIndex = signal(-1);
  shareholderForm: FormGroup;

  // Icons
  PlusIcon = Plus;
  EditIcon = Edit;
  Trash2Icon = Trash2;

  // Computed: Form title
  modalTitle = computed(() => {
    return this.editingIndex() !== -1 ? 'Edit Shareholder' : 'Add Shareholder';
  });

  // Computed: Button text
  submitButtonText = computed(() => {
    return this.editingIndex() !== -1
      ? 'Update Shareholder'
      : 'Add Shareholder';
  });

  constructor() {
    this.shareholderForm = this.createShareholderForm();
  }

  ngOnInit() {
    // Component initialization if needed
  }

  // ===============================
  // FORM CREATION
  // ===============================

  private createShareholderForm(): FormGroup {
    return this.fb.group({
      isJuristicPerson: ['', [Validators.required]],
      fullName: ['', [Validators.required]],
      currentShareholding: [
        '',
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      postInvestmentShareholding: [
        '',
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });
  }

  // ===============================
  // MODAL OPERATIONS
  // ===============================

  openAddModal() {
    this.shareholderForm.reset();
    this.editingIndex.set(-1);
    this.showModal.set(true);
  }

  openEditModal(index: number) {
    const shareholder = this.shareholders()[index];
    const isJuristic = shareholder.fullName.includes('(juristic person)');
    const baseName = shareholder.fullName.replace(' (juristic person)', '');

    this.shareholderForm.patchValue({
      isJuristicPerson: isJuristic.toString(),
      fullName: baseName,
      currentShareholding: shareholder.currentShareholding,
      postInvestmentShareholding: shareholder.postInvestmentShareholding,
    });
    this.editingIndex.set(index);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingIndex.set(-1);
    this.shareholderForm.reset();
  }

  // ===============================
  // SHAREHOLDER CRUD
  // ===============================

  saveShareholder() {
    if (!this.shareholderForm.valid) return;

    const formValue = this.shareholderForm.value;
    let fullName = formValue.fullName;

    // Append "(juristic person)" if selected
    if (
      formValue.isJuristicPerson === 'true' ||
      formValue.isJuristicPerson === true
    ) {
      fullName = `${fullName} (juristic person)`;
    }

    const updatedShareholders = [...this.shareholders()];

    if (this.editingIndex() !== -1) {
      // Update existing
      updatedShareholders[this.editingIndex()] = {
        ...updatedShareholders[this.editingIndex()],
        fullName,
        currentShareholding: formValue.currentShareholding,
        postInvestmentShareholding: formValue.postInvestmentShareholding,
      };
    } else {
      // Add new
      updatedShareholders.push({
        id: Date.now().toString(),
        fullName,
        currentShareholding: formValue.currentShareholding,
        postInvestmentShareholding: formValue.postInvestmentShareholding,
      });
    }

    this.shareholdersChange.emit(updatedShareholders);
    this.closeModal();
  }

  deleteShareholder(index: number) {
    if (!confirm('Delete this shareholder?')) return;

    const updatedShareholders = this.shareholders().filter(
      (_, i) => i !== index
    );
    this.shareholdersChange.emit(updatedShareholders);
  }

  // ===============================
  // HELPERS
  // ===============================

  getFieldError(fieldName: string): string | undefined {
    const field = this.shareholderForm.get(fieldName);
    if (!field?.errors || !field.touched) return undefined;

    if (field.errors['required'])
      return `${this.getFieldLabel(fieldName)} is required`;
    if (field.errors['min']) return 'Value must be 0 or greater';
    if (field.errors['max']) return 'Value cannot exceed 100';

    return undefined;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      isJuristicPerson: 'Juristic person selection',
      fullName: 'Full name',
      currentShareholding: 'Current shareholding',
      postInvestmentShareholding: 'Post investment shareholding',
    };
    return labels[fieldName] || fieldName;
  }
}
