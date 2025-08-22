import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Global handler for lock errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('NavigatorLockAcquireTimeoutError')) {
      console.warn('Lock error ignored:', event.reason.message);
      event.preventDefault();
    }
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
