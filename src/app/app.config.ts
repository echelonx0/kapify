// // src/app/app.config.ts - Fixed configuration
// import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
// import {
//   provideRouter,
//   withComponentInputBinding,
//   withEnabledBlockingInitialNavigation,
// } from '@angular/router';
// import {
//   provideHttpClient,
//   withInterceptorsFromDi,
// } from '@angular/common/http';
// import { HTTP_INTERCEPTORS } from '@angular/common/http';
// import { provideAnimations } from '@angular/platform-browser/animations';
// import { routes } from './app.routes';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getAuth, provideAuth } from '@angular/fire/auth';
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';
// import { getFunctions, provideFunctions } from '@angular/fire/functions';
// import { getStorage, provideStorage } from '@angular/fire/storage';
// import { getVertexAI, provideVertexAI } from '@angular/fire/vertexai';
// import { environment } from '../environments/environment';
// import { SupabaseAuthInterceptor } from './auth/interceptors/supabase.interceptor';

// import { provideToastr } from 'ngx-toastr';
// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideZoneChangeDetection({ eventCoalescing: true }),
//     provideRouter(
//       routes,
//       withComponentInputBinding(),
//       withEnabledBlockingInitialNavigation()
//     ),
//     // Use withInterceptorsFromDi() to allow DI-based interceptors
//     provideHttpClient(withInterceptorsFromDi()),
//     // Auth interceptor
//     {
//       provide: HTTP_INTERCEPTORS,
//       useClass: SupabaseAuthInterceptor,
//       multi: true,
//     },
//     provideAnimations(),
//     provideToastr(), // Toastr providers
//     // Firebase providers (for future migration)
//     provideFirebaseApp(() => initializeApp(environment.firebase)),
//     provideAuth(() => getAuth()),
//     provideFirestore(() => getFirestore()),
//     provideFunctions(() => getFunctions()),
//     provideStorage(() => getStorage()),
//     provideVertexAI(() => getVertexAI()),
//   ],
// };

// src/app/app.config.ts - Fixed configuration with auto scroll-to-top
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  Router,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getVertexAI, provideVertexAI } from '@angular/fire/vertexai';
import { environment } from '../environments/environment';
import { SupabaseAuthInterceptor } from './auth/interceptors/supabase.interceptor';
import { provideToastr } from 'ngx-toastr';
import { APP_INITIALIZER, inject } from '@angular/core';
import { filter } from 'rxjs';
import { NavigationEnd } from '@angular/router';

/**
 * Initialize scroll-to-top on route navigation
 */
function initializeScrollToTop() {
  const router = inject(Router);
  router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  return () => {};
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withEnabledBlockingInitialNavigation()
    ),
    // Use withInterceptorsFromDi() to allow DI-based interceptors
    provideHttpClient(withInterceptorsFromDi()),
    // Auth interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SupabaseAuthInterceptor,
      multi: true,
    },
    provideAnimations(),
    provideToastr(), // Toastr providers
    // Scroll to top on navigation
    {
      provide: APP_INITIALIZER,
      useFactory: initializeScrollToTop,
      multi: true,
    },
    // Firebase providers (for future migration)
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage()),
    provideVertexAI(() => getVertexAI()),
  ],
};
