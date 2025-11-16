// src/app/test/parser-test.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-angular';
import {
  ParsedFinancialData,
  ExcelFinancialParserService,
  ParseProgress,
} from '../SMEs/profile/steps/financial-analysis/utils/excel-parser.service';

interface TestResult {
  success: boolean;
  duration: number;
  data?: ParsedFinancialData;
  error?: string;
  logs: string[];
}

@Component({
  selector: 'app-parser-test',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Excel Parser Test Tool
          </h1>
          <p class="text-gray-600 mt-2">
            Upload your financial Excel file to test the parser
          </p>
        </div>

        <!-- Upload Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Select File</h2>

          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          >
            <input
              #fileInput
              type="file"
              accept=".xlsx,.xls"
              (change)="onFileSelected($event)"
              class="hidden"
              id="file-upload"
            />

            @if (!selectedFile()) {
            <div>
              <lucide-icon
                [name]="UploadIcon"
                [size]="48"
                class="mx-auto text-gray-400 mb-4"
              />
              <label
                for="file-upload"
                class="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <lucide-icon [name]="UploadIcon" [size]="20" class="mr-2" />
                Choose Excel File
              </label>
              <p class="text-sm text-gray-500 mt-2">
                Supports .xlsx and .xls files
              </p>
            </div>
            } @else {
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <lucide-icon
                  [name]="CheckCircleIcon"
                  [size]="24"
                  class="text-green-600"
                />
                <div class="text-left">
                  <p class="font-medium text-gray-900">
                    {{ selectedFile()!.name }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formatBytes(selectedFile()!.size) }}
                  </p>
                </div>
              </div>
              <button
                (click)="clearFile()"
                class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </div>
            }
          </div>

          @if (selectedFile()) {
          <div class="mt-4 flex space-x-3">
            <button
              (click)="runTest()"
              [disabled]="testing()"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ testing() ? 'Testing...' : 'Run Test' }}
            </button>

            <button
              (click)="toggleDebugMode()"
              class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Debug: {{ debugMode() ? 'ON' : 'OFF' }}
            </button>
          </div>
          }
        </div>

        <!-- Progress -->
        @if (progress()) {
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 class="font-semibold text-blue-900 mb-3">Parse Progress</h3>

          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-blue-700">{{
                progress()!.message
              }}</span>
              <span class="text-sm font-semibold text-blue-900"
                >{{ progress()!.progress }}%</span
              >
            </div>
            <div class="w-full bg-blue-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                [style.width.%]="progress()!.progress"
              ></div>
            </div>
          </div>

          <div class="flex items-center space-x-2 text-xs">
            <span
              [class]="
                progress()!.progress >= 10
                  ? 'text-blue-600 font-semibold'
                  : 'text-blue-400'
              "
              >Read</span
            >
            <span class="text-blue-300">→</span>
            <span
              [class]="
                progress()!.progress >= 30
                  ? 'text-blue-600 font-semibold'
                  : 'text-blue-400'
              "
              >Parse</span
            >
            <span class="text-blue-300">→</span>
            <span
              [class]="
                progress()!.progress >= 50
                  ? 'text-blue-600 font-semibold'
                  : 'text-blue-400'
              "
              >Extract</span
            >
            <span class="text-blue-300">→</span>
            <span
              [class]="
                progress()!.progress >= 80
                  ? 'text-blue-600 font-semibold'
                  : 'text-blue-400'
              "
              >Validate</span
            >
            <span class="text-blue-300">→</span>
            <span
              [class]="
                progress()!.stage === 'complete'
                  ? 'text-green-600 font-semibold'
                  : 'text-blue-400'
              "
              >Done</span
            >
          </div>
        </div>
        }

        <!-- Test Results -->
        @if (testResult()) {
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Test Results</h2>
            @if (testResult()!.success) {
            <div class="flex items-center text-green-600">
              <lucide-icon [name]="CheckCircleIcon" [size]="20" class="mr-2" />
              <span class="font-semibold">Success</span>
            </div>
            } @else {
            <div class="flex items-center text-red-600">
              <lucide-icon [name]="XCircleIcon" [size]="20" class="mr-2" />
              <span class="font-semibold">Failed</span>
            </div>
            }
          </div>

          <!-- Duration -->
          <div class="mb-4 p-3 bg-gray-50 rounded">
            <span class="text-sm text-gray-600">Parse Duration: </span>
            <span class="font-semibold text-gray-900"
              >{{ testResult()!.duration }}ms</span
            >
          </div>

          @if (testResult()!.error) {
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-start">
              <lucide-icon
                [name]="AlertCircleIcon"
                [size]="20"
                class="text-red-600 mr-2 mt-0.5"
              />
              <div>
                <p class="font-semibold text-red-900">Error</p>
                <p class="text-sm text-red-700 mt-1">
                  {{ testResult()!.error }}
                </p>
              </div>
            </div>
          </div>
          } @if (testResult()!.success && testResult()!.data) {
          <!-- Data Summary -->
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-sm text-green-600 font-semibold mb-1">
                Income Rows
              </p>
              <p class="text-2xl font-bold text-green-900">
                {{ testResult()!.data!.incomeStatement.length }}
              </p>
            </div>
            <div class="p-4 bg-purple-50 rounded-lg">
              <p class="text-sm text-purple-600 font-semibold mb-1">
                Ratio Rows
              </p>
              <p class="text-2xl font-bold text-purple-900">
                {{ testResult()!.data!.financialRatios.length }}
              </p>
            </div>
            <div class="p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-600 font-semibold mb-1">
                Time Periods
              </p>
              <p class="text-2xl font-bold text-blue-900">
                {{ testResult()!.data!.columnHeaders.length }}
              </p>
            </div>
          </div>

          <!-- Column Headers -->
          <div class="mb-6">
            <h3 class="font-semibold mb-2">Column Headers</h3>
            <div class="flex flex-wrap gap-2">
              @for (header of testResult()!.data!.columnHeaders; track header) {
              <span
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >{{ header }}</span
              >
              }
            </div>
          </div>

          <!-- Income Statement Sample -->
          <div class="mb-6">
            <h3 class="font-semibold mb-2">Income Statement (Sample)</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                    >
                      Label
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500"
                    >
                      Value 1
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500"
                    >
                      Value 2
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500"
                    >
                      Value 3
                    </th>
                    <th
                      class="px-4 py-2 text-center text-xs font-medium text-gray-500"
                    >
                      Editable
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  @for (row of testResult()!.data!.incomeStatement.slice(0, 5);
                  track row.label) {
                  <tr>
                    <td class="px-4 py-2 text-sm font-medium text-gray-900">
                      {{ row.label }}
                    </td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">
                      {{ formatNumber(row.values[0]) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">
                      {{ formatNumber(row.values[1]) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">
                      {{ formatNumber(row.values[2]) }}
                    </td>
                    <td class="px-4 py-2 text-center">
                      <span
                        [class]="
                          row.editable ? 'text-green-600' : 'text-gray-400'
                        "
                      >
                        {{ row.editable ? '✓' : '✗' }}
                      </span>
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Financial Ratios Sample -->
          <div class="mb-6">
            <h3 class="font-semibold mb-2">Financial Ratios (Sample)</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      class="px-4 py-2 text-left text-xs font-medium text-gray-500"
                    >
                      Label
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500"
                    >
                      Value 1
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500"
                    >
                      Value 2
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-medium text-gray-500"
                    >
                      Value 3
                    </th>
                    <th
                      class="px-4 py-2 text-center text-xs font-medium text-gray-500"
                    >
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  @for (row of testResult()!.data!.financialRatios.slice(0, 5);
                  track row.label) {
                  <tr>
                    <td class="px-4 py-2 text-sm font-medium text-gray-900">
                      {{ row.label }}
                    </td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">
                      {{ formatNumber(row.values[0]) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">
                      {{ formatNumber(row.values[1]) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-right text-gray-700">
                      {{ formatNumber(row.values[2]) }}
                    </td>
                    <td class="px-4 py-2 text-center">
                      <span
                        class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >{{ row.type }}</span
                      >
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          }

          <!-- Logs -->
          @if (testResult()!.logs.length > 0) {
          <div class="mt-6">
            <h3 class="font-semibold mb-2">Debug Logs</h3>
            <div
              class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto"
            >
              @for (log of testResult()!.logs; track $index) {
              <div class="mb-1">{{ log }}</div>
              }
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ParserTestComponent {
  private parser = inject(ExcelFinancialParserService);

  // Icons
  UploadIcon = Upload;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  AlertCircleIcon = AlertCircle;

  // State
  selectedFile = signal<File | null>(null);
  testing = signal(false);
  debugMode = signal(true);
  progress = signal<ParseProgress | null>(null);
  testResult = signal<TestResult | null>(null);

  // Logs capture
  private logs: string[] = [];

  constructor() {
    this.parser.setDebugMode(true);
    this.captureConsoleLogs();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile.set(file);
      this.testResult.set(null);
      this.progress.set(null);
      this.logs = [];
    }
  }

  clearFile() {
    this.selectedFile.set(null);
    this.testResult.set(null);
    this.progress.set(null);
    this.logs = [];
  }

  toggleDebugMode() {
    const newMode = !this.debugMode();
    this.debugMode.set(newMode);
    this.parser.setDebugMode(newMode);
  }

  async runTest() {
    const file = this.selectedFile();
    if (!file) return;

    this.testing.set(true);
    this.testResult.set(null);
    this.progress.set(null);
    this.logs = [];

    const startTime = performance.now();

    try {
      const data = await this.parser.parseFinancialExcel(
        file,
        (progressUpdate) => {
          this.progress.set(progressUpdate);
        }
      );

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const validation = this.parser.validateParsedData(data);

      this.testResult.set({
        success: validation.isValid,
        duration,
        data,
        logs: [...this.logs],
      });

      if (!validation.isValid) {
        this.testResult.update((result) => ({
          ...result!,
          error: validation.errors.join(', '),
        }));
      }
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      this.testResult.set({
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: [...this.logs],
      });
    } finally {
      this.testing.set(false);
    }
  }

  private captureConsoleLogs() {
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(' ');

      if (message.includes('[ExcelParser]')) {
        this.logs.push(message);
      }

      originalLog.apply(console, args);
    };
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatNumber(value: number): string {
    if (value === 0) return '-';
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
