// src/app/profile/components/navigation-help.component.ts
import { Component, signal } from '@angular/core';
import { LucideAngularModule, Info, X, CheckCircle, Clock, Lock } from 'lucide-angular';
 
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from 'src/app/shared/components';
 

@Component({
  selector: 'app-navigation-help',
  standalone: true,
  imports: [LucideAngularModule, UiButtonComponent, CommonModule],
  template: `
    <!-- Help Trigger Button -->
    <button 
      (click)="toggleHelp()"
      class="fixed bottom-20 right-6 z-40 w-12 h-12 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-all duration-200 flex items-center justify-center lg:hidden"
      title="Navigation Help"
    >
      <lucide-icon [img]="InfoIcon" [size]="20" />
    </button>

    <!-- Help Modal -->
    @if (showHelp()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black bg-opacity-25" (click)="closeHelp()"></div>
        
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full relative">
          <!-- Header -->
          <div class="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-neutral-900">Navigation Guide</h3>
            <button (click)="closeHelp()" class="p-1 hover:bg-neutral-100 rounded">
              <lucide-icon [img]="XIcon" [size]="20" class="text-neutral-500" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-4 space-y-4">
            <p class="text-sm text-neutral-600">
              You can navigate freely between most sections. Here's what each status means:
            </p>

            <!-- Status Legend -->
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="CheckCircleIcon" [size]="14" class="text-white" />
                </div>
                <div>
                  <div class="text-sm font-medium text-neutral-900">Complete</div>
                  <div class="text-xs text-neutral-600">Section finished - you can return anytime</div>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="ClockIcon" [size]="14" class="text-white" />
                </div>
                <div>
                  <div class="text-sm font-medium text-neutral-900">In Progress</div>
                  <div class="text-xs text-neutral-600">Currently working on this section</div>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-neutral-200 rounded-lg flex items-center justify-center">
                  <span class="text-xs font-medium text-neutral-600">1</span>
                </div>
                <div>
                  <div class="text-sm font-medium text-neutral-900">Available</div>
                  <div class="text-xs text-neutral-600">Ready to start - click to begin</div>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="LockIcon" [size]="14" class="text-neutral-400" />
                </div>
                <div>
                  <div class="text-sm font-medium text-neutral-900">Locked</div>
                  <div class="text-xs text-neutral-600">Complete required sections first</div>
                </div>
              </div>
            </div>

            <!-- Tips -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 class="text-sm font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
              <ul class="text-xs text-blue-800 space-y-1">
                <li>• Most sections can be completed in any order</li>
                <li>• Your progress is saved automatically</li>
                <li>• Required sections are marked with red badges</li>
                <li>• You can return to edit completed sections anytime</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-neutral-200">
            <ui-button variant="primary" size="sm" class="w-full" (clicked)="closeHelp()">
              Got it!
            </ui-button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .fixed {
      position: fixed;
    }
    
    .transition-all {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
    }

    button:hover {
      transform: translateY(-1px);
    }

    button:active {
      transform: translateY(0);
    }
  `]
})
export class NavigationHelpComponent {
  showHelp = signal(false);
  
  // Icons
  InfoIcon = Info;
  XIcon = X;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  LockIcon = Lock;

  toggleHelp() {
    this.showHelp.update(show => !show);
  }

  closeHelp() {
    this.showHelp.set(false);
  }
}