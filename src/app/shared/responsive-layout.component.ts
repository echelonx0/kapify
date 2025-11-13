import {
  Component,
  Input,
  signal,
  HostListener,
  effect,
  computed,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Menu, X } from 'lucide-angular';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Mobile Overlay Backdrop -->
    @if (sidebarOpen() && isMobile()) {
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-30"
      (click)="closeSidebar()"
    ></div>
    }

    <div class="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <!-- SIDEBAR WRAPPER -->
      <div
        [class.hidden]="!sidebarOpen() && isMobile()"
        [class]="sidebarClasses()"
      >
        <ng-content select="[app-sidebar]"></ng-content>
      </div>

      <!-- MAIN CONTENT AREA -->
      <div
        class="flex-1 flex flex-col min-h-screen lg:min-h-auto overflow-y-auto"
      >
        <!-- STICKY HEADER -->
        @if (shouldShowHeader()) {
        <div class="sticky top-0 z-40 bg-white border-b border-slate-200">
          <div class="flex items-center px-4 py-4 lg:px-8 lg:py-4">
            <!-- Mobile Menu Toggle -->
            <button
              class="lg:hidden flex-shrink-0 -ml-2 p-2 text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors duration-200"
              (click)="toggleSidebar()"
              aria-label="Toggle menu"
            >
              <lucide-angular
                [img]="sidebarOpen() ? XIcon : MenuIcon"
                [size]="24"
              ></lucide-angular>
            </button>

            <!-- Header Content -->
            <div class="flex-1 min-w-0">
              <ng-content select="[app-header]"></ng-content>
            </div>
          </div>
        </div>
        }

        <!-- PAGE CONTENT -->
        <main class="flex-1 px-4 py-6 lg:px-8 lg:py-6">
          <ng-content select="[app-content]"></ng-content>
        </main>
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
export class ResponsiveLayoutComponent {
  @Input() showHeader: boolean | WritableSignal<boolean> = true;

  // State
  sidebarOpen = signal(false);
  isMobileViewport = signal(false);

  // Icons
  MenuIcon = Menu;
  XIcon = X;

  // Computed
  sidebarClasses = computed(() => {
    const base =
      'lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-slate-200 bg-white';

    if (this.isMobileViewport()) {
      return `${base} fixed left-0 top-0 bottom-0 z-40 w-64 overflow-y-auto transition-transform duration-300 ${
        this.sidebarOpen() ? 'translate-x-0' : '-translate-x-full'
      }`;
    }

    return `${base} relative`;
  });

  isMobile = () => this.isMobileViewport();

  /**
   * Determine if header should be shown
   * Handles both boolean and WritableSignal<boolean> inputs
   */
  shouldShowHeader(): boolean {
    // Check if showHeader is a signal (has call signature / is function)
    if (typeof (this.showHeader as any) === 'function') {
      // It's a signal, call it to get the value
      return (this.showHeader as WritableSignal<boolean>)();
    }
    // It's a plain boolean value
    return this.showHeader as boolean;
  }

  constructor() {
    this.detectViewport();
    this.setupViewportListener();
  }

  private detectViewport() {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    this.isMobileViewport.set(width < 1024);
  }

  private setupViewportListener() {
    effect(() => {
      // Will reactively update when viewport changes
      this.detectViewport();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.detectViewport();
    // Close sidebar on resize to desktop
    if (!this.isMobileViewport()) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update((state) => !state);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  openSidebar() {
    this.sidebarOpen.set(true);
  }
}
