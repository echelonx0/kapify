// src/app/shared/financial-table/financial-data-table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, ChevronRight, Lock, Edit3 } from 'lucide-angular';

export interface FinancialTableRow {
  label: string;
  values: number[];
  editable: boolean;
  type?: 'currency' | 'percentage' | 'ratio';
  isCalculated?: boolean;
}

export interface FinancialTableSection {
  title: string;
  rows: FinancialTableRow[];
  collapsed?: boolean;
}

@Component({
  selector: 'app-financial-data-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: 'financial-data-table.component.html',
  styleUrl: 'financial-data-table.component.css'
})
export class FinancialDataTableComponent {
  @Input() sections: FinancialTableSection[] = [];
  @Input() columnHeaders: string[] = [];
  @Input() editMode = false;
  @Input() itemLabel = 'Item';
  
  @Output() cellValueChanged = new EventEmitter<{
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }>();

  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  LockIcon = Lock;
  EditIcon = Edit3;

  toggleSection(sectionIndex: number) {
    this.sections[sectionIndex].collapsed = !this.sections[sectionIndex].collapsed;
  }

  onCellFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.select();
    }
  }

  onCellBlur(event: Event, sectionIndex: number, rowIndex: number, colIndex: number) {
    const input = event.target as HTMLInputElement;
    if (input && input.value !== '') {
      const value = parseFloat(input.value) || 0;
      this.cellValueChanged.emit({
        sectionIndex,
        rowIndex,
        colIndex,
        value
      });
    }
  }

  formatValue(value: number, type?: string): string {
    if (value === 0 || value === null || value === undefined) return '-';
    
    if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    
    if (type === 'currency') {
      const formatted = new Intl.NumberFormat('en-ZA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Math.abs(value));
      return value < 0 ? `(${formatted})` : formatted;
    }
    
    if (type === 'ratio') {
      return value.toFixed(2);
    }
    
    return value.toFixed(2);
  }

  getInputStep(type?: string): string {
    if (type === 'percentage' || type === 'ratio') {
      return '0.01';
    }
    return '1';
  }
}