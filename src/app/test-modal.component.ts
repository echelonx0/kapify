// test-modal.component.ts - Create this as a separate component to test Preline
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Preline Modal Test</h2>
      
      <!-- Test Modal Trigger -->
      <button 
        type="button" 
        class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700" 
        data-hs-overlay="#test-modal">
        Open Test Modal
      </button>

      <!-- Debug Info -->
      <div class="mt-4 p-4 bg-gray-100 rounded">
        <h3 class="font-semibold mb-2">Debug Info:</h3>
        <p>Window HSStaticMethods: {{ hasHSStaticMethods ? 'Available' : 'Not Available' }}</p>
        <p>Window HSOverlay: {{ hasHSOverlay ? 'Available' : 'Not Available' }}</p>
      </div>

      <!-- Manual Test Button -->
      <button 
        type="button"
        (click)="openModalManually()"
        class="mt-2 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700">
        Open Modal Manually (Debug)
      </button>
    </div>

    <!-- Test Modal -->
    <div 
      id="test-modal" 
      class="hs-overlay hidden size-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none" 
      role="dialog" 
      tabindex="-1">
      
      <div class="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm pointer-events-auto">
          
          <!-- Header -->
          <div class="flex justify-between items-center py-3 px-4 border-b">
            <h3 class="font-bold text-gray-800">Test Modal</h3>
            <button 
              type="button" 
              class="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200" 
              data-hs-overlay="#test-modal">
              <span class="sr-only">Close</span>
              <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-4">
            <p class="text-gray-600">This is a test modal to verify Preline integration.</p>
            <p class="text-sm text-gray-500 mt-2">If you can see this modal, Preline is working correctly!</p>
          </div>

          <!-- Footer -->
          <div class="flex justify-end items-center gap-x-2 py-3 px-4 border-t">
            <button 
              type="button" 
              class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50" 
              data-hs-overlay="#test-modal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TestModalComponent implements OnInit {
  hasHSStaticMethods = false;
  hasHSOverlay = false;

  ngOnInit() {
    // Check if Preline is available
    this.hasHSStaticMethods = !!(window as any).HSStaticMethods;
    this.hasHSOverlay = !!(window as any).HSOverlay;

    console.log('HSStaticMethods available:', this.hasHSStaticMethods);
    console.log('HSOverlay available:', this.hasHSOverlay);

    // Initialize Preline if available
    if ((window as any).HSStaticMethods) {
      (window as any).HSStaticMethods.autoInit();
    }
  }

  openModalManually() {
    console.log('Opening modal manually...');
    
    const modalElement = document.getElementById('test-modal');
    if (!modalElement) {
      console.error('Modal element not found');
      return;
    }

    console.log('Modal element found:', modalElement);

    // Try different approaches
    if ((window as any).HSOverlay) {
      console.log('Using HSOverlay.open');
      (window as any).HSOverlay.open(modalElement);
    } else if ((window as any).HSStaticMethods) {
      console.log('Using HSStaticMethods');
      (window as any).HSStaticMethods.autoInit(['overlay']);
      setTimeout(() => {
        if ((window as any).HSOverlay) {
          (window as any).HSOverlay.open(modalElement);
        }
      }, 100);
    } else {
      console.error('Neither HSOverlay nor HSStaticMethods available');
      // Fallback: manually show modal
      modalElement.classList.remove('hidden');
      modalElement.classList.add('pointer-events-auto');
      
      const backdrop = modalElement.querySelector('.hs-overlay-open\\:opacity-100');
      if (backdrop) {
        backdrop.classList.add('hs-overlay-open:opacity-100', 'hs-overlay-open:mt-7', 'hs-overlay-open:duration-500');
      }
    }
  }
}