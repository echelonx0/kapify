 
// // shared-supabase.service.ts - Compatible with v2.38.4
// import { Injectable } from '@angular/core';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import { environment } from '../../../environments/environment';

// @Injectable({
//   providedIn: 'root'
// })
// export class SharedSupabaseService {
//   private static instance: SupabaseClient;
//   private static initPromise: Promise<SupabaseClient> | null = null;

//   constructor() {
//     if (!SharedSupabaseService.instance && !SharedSupabaseService.initPromise) {
//       SharedSupabaseService.initPromise = this.initializeClient();
//     }
//   }

//   private async initializeClient(): Promise<SupabaseClient> {
//     try {
//       // Clear any problematic storage keys
//       this.clearProblematicStorage();

//       SharedSupabaseService.instance = createClient(
//         environment.supabaseUrl, 
//         environment.supabaseAnonKey,
//         {
//           auth: {
//             // More conservative settings for stability
//             persistSession: true,
//             autoRefreshToken: true,
//             detectSessionInUrl: false,
//             flowType: 'pkce',
//             // Use a simple, unique storage key
//             storageKey: `sb-auth-token-${environment.supabaseProjectRef}`,
//             debug: false
//           },
//           db: { 
//             schema: 'public' 
//           },
//           global: {
//             headers: { 
//               'X-Client-Info': 'supabase-js-web'
//             }
//           }
//         }
//       );

//       console.log('✅ Supabase client initialized successfully');
//       return SharedSupabaseService.instance;
      
//     } catch (error) {
//       console.error('❌ Failed to initialize Supabase client:', error);
//       throw error;
//     } finally {
//       SharedSupabaseService.initPromise = null;
//     }
//   }

//   private clearProblematicStorage() {
//     if (typeof window === 'undefined') return;
    
//     try {
//       // Clear only problematic keys, not all Supabase keys
//       const keysToRemove = Object.keys(localStorage).filter(key => 
//         key.includes('sb-hsilpedhzelahseceats-auth-token-17') || // Remove timestamped keys
//         key.includes('lock:sb-') // Remove lock-related keys
//       );
      
//       keysToRemove.forEach(key => {
//         try {
//           localStorage.removeItem(key);
//         } catch (e) {
//           // Ignore individual removal errors
//         }
//       });
      
//       if (keysToRemove.length > 0) {
//         console.log(`🧹 Cleared ${keysToRemove.length} problematic storage keys`);
//       }
//     } catch (error) {
//       console.warn('⚠️ Could not clear storage:', error);
//     }
//   }

//   async getClient(): Promise<SupabaseClient> {
//     if (SharedSupabaseService.instance) {
//       return SharedSupabaseService.instance;
//     }
    
//     if (SharedSupabaseService.initPromise) {
//       return await SharedSupabaseService.initPromise;
//     }
    
//     SharedSupabaseService.initPromise = this.initializeClient();
//     return await SharedSupabaseService.initPromise;
//   }

//   get client(): SupabaseClient {
//     if (!SharedSupabaseService.instance) {
//       throw new Error('Supabase client not initialized. Use getClient() for async initialization.');
//     }
//     return SharedSupabaseService.instance;
//   }

//   // Convenience methods with error handling
//   get auth() {
//     return this.client.auth;
//   }

//   get from() {
//     return this.client.from.bind(this.client);
//   }

//   get rpc() {
//     return this.client.rpc.bind(this.client);
//   }

//   get storage() {
//     return this.client.storage;
//   }

//     get channel() {
//     return this.client.channel.bind(this.client);
//   }
//     // Add functions support for Edge Functions
//   get functions() {
//     return this.client.functions;
//   }

//   // Static cleanup method
//   static cleanup() {
//     if (SharedSupabaseService.instance) {
//       try {
//         // Safely stop auto refresh
//         const auth = SharedSupabaseService.instance.auth;
//         if (auth && typeof auth.stopAutoRefresh === 'function') {
//           auth.stopAutoRefresh();
//         }
//         console.log('🧹 Supabase client cleaned up');
//       } catch (error) {
//         console.warn('⚠️ Error during cleanup:', error);
//       }
//     }
//     SharedSupabaseService.instance = null as any;
//     SharedSupabaseService.initPromise = null;
//   }
// }

import { Injectable, OnDestroy } from '@angular/core';
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { shareReplay, takeUntil, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * SharedSupabaseService
 * - Single, lazy-initialized Supabase client
 * - Proper session lifecycle with Observable-based auth state
 * - Maintains all existing method signatures for backward compatibility
 * - Automatic cleanup and memory leak prevention
 */
@Injectable({
  providedIn: 'root'
})
export class SharedSupabaseService implements OnDestroy {
  private static instance: SupabaseClient | null = null;
  private static initPromise: Promise<void> | null = null;

  // Auth state streams
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private authChangeSubject = new Subject<{ event: AuthChangeEvent; session: Session | null }>();
  private destroy$ = new Subject<void>();

  // Public observables (components subscribe once at app init)
  public session$ = this.sessionSubject.asObservable().pipe(shareReplay(1));
  public authChange$ = this.authChangeSubject.asObservable().pipe(shareReplay(1));

  constructor() {
    this.initializeOnce();
  }

  /**
   * Initialize Supabase client once, safely
   */
  private initializeOnce(): void {
    if (SharedSupabaseService.instance) {
      // Already initialized
      return;
    }

    if (SharedSupabaseService.initPromise) {
      // Initialization in progress, wait for it
      return;
    }

    SharedSupabaseService.initPromise = this.performInitialization();
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<void> {
    try {
      this.clearProblematicStorage();

      SharedSupabaseService.instance = createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            flowType: 'pkce',
            storageKey: `sb-auth-token-${environment.supabaseProjectRef}`,
            debug: false
          },
          db: { schema: 'public' },
          global: {
            headers: { 'X-Client-Info': 'supabase-js-web' }
          }
        }
      );

      // Set up auth state listener once
      this.setupAuthListener();

      // Get initial session
      const { data } = await SharedSupabaseService.instance.auth.getSession();
      if (data?.session) {
        this.sessionSubject.next(data.session);
      }

      console.log('✅ Supabase initialized successfully');
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      throw error;
    } finally {
      SharedSupabaseService.initPromise = null;
    }
  }

  /**
   * Set up one-time auth state change listener
   */
  private setupAuthListener(): void {
    if (!SharedSupabaseService.instance) return;

    SharedSupabaseService.instance.auth.onAuthStateChange((event, session) => {
      this.sessionSubject.next(session);
      this.authChangeSubject.next({ event, session });
      console.log(`🔐 Auth state changed: ${event}`, session?.user?.email || 'no user');
    });
  }

  /**
   * Clear problematic storage keys left from previous sessions
   */
  private clearProblematicStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.includes('sb-hsilpedhzelahseceats-auth-token-17') ||
        key.includes('lock:sb-')
      );

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore
        }
      });

      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleared ${keysToRemove.length} problematic storage keys`);
      }
    } catch (error) {
      console.warn('⚠️ Could not clear storage:', error);
    }
  }

  /**
   * Get the Supabase client (synchronous, safe after init)
   */
  get client(): SupabaseClient {
    if (!SharedSupabaseService.instance) {
      throw new Error('Supabase client not initialized');
    }
    return SharedSupabaseService.instance;
  }

  /**
   * Get current session synchronously (for legacy code)
   * ⚠️ Use session$ Observable instead for new code
   */
  get session(): Session | null {
    return this.sessionSubject.value;
  }

  /**
   * Convenience accessors - maintain backward compatibility
   */
  get auth() {
    return this.client.auth;
  }

  get from() {
    return this.client.from.bind(this.client);
  }

  get rpc() {
    return this.client.rpc.bind(this.client);
  }

  get storage() {
    return this.client.storage;
  }

  get channel() {
    return this.client.channel.bind(this.client);
  }

  get functions() {
    return this.client.functions;
  }

  /**
   * Get current session as Observable (preferred)
   */
  getSession(): Observable<Session | null> {
    return this.session$;
  }

  /**
   * Watch for auth state changes
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const subscription = this.authChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ event, session }) => {
        callback(event, session);
      });
    return subscription;
  }

  /**
   * Get current user ID synchronously (null-safe)
   */
  getCurrentUserId(): string | null {
    return this.sessionSubject.value?.user?.id || null;
  }

  /**
   * Ensure client is ready before operations
   */
  async ensureInitialized(): Promise<void> {
    if (SharedSupabaseService.instance) return;

    if (SharedSupabaseService.initPromise) {
      await SharedSupabaseService.initPromise;
    } else {
      this.initializeOnce();
      if (SharedSupabaseService.initPromise) {
        await SharedSupabaseService.initPromise;
      }
    }
  }

  /**
   * Wait for session to be available
   */
  async waitForSession(): Promise<Session | null> {
    await this.ensureInitialized();
    return new Promise(resolve => {
      const subscription = this.session$.subscribe(session => {
        if (session) {
          subscription.unsubscribe();
          resolve(session);
        }
      });

      // Timeout after 5s
      setTimeout(() => {
        subscription.unsubscribe();
        resolve(this.sessionSubject.value);
      }, 5000);
    });
  }

  /**
   * Cleanup on app destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sessionSubject.complete();
    this.authChangeSubject.complete();
  }

  /**
   * Static cleanup (for testing or app shutdown)
   */
  static cleanup(): void {
    if (SharedSupabaseService.instance) {
      try {
        const auth = SharedSupabaseService.instance.auth;
        if (auth && typeof auth.stopAutoRefresh === 'function') {
          auth.stopAutoRefresh();
        }
      } catch (error) {
        console.warn('⚠️ Error during cleanup:', error);
      }
    }
    SharedSupabaseService.instance = null;
    SharedSupabaseService.initPromise = null;
  }
}