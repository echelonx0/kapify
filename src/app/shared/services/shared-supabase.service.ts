 
// shared-supabase.service.ts - Compatible with v2.38.4
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedSupabaseService {
  private static instance: SupabaseClient;
  private static initPromise: Promise<SupabaseClient> | null = null;

  constructor() {
    if (!SharedSupabaseService.instance && !SharedSupabaseService.initPromise) {
      SharedSupabaseService.initPromise = this.initializeClient();
    }
  }

  private async initializeClient(): Promise<SupabaseClient> {
    try {
      // Clear any problematic storage keys
      this.clearProblematicStorage();

      SharedSupabaseService.instance = createClient(
        environment.supabaseUrl, 
        environment.supabaseAnonKey,
        {
          auth: {
            // More conservative settings for stability
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            flowType: 'pkce',
            // Use a simple, unique storage key
            storageKey: `sb-auth-token-${environment.supabaseProjectRef}`,
            debug: false
          },
          db: { 
            schema: 'public' 
          },
          global: {
            headers: { 
              'X-Client-Info': 'supabase-js-web'
            }
          }
        }
      );

      console.log('✅ Supabase client initialized successfully');
      return SharedSupabaseService.instance;
      
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      throw error;
    } finally {
      SharedSupabaseService.initPromise = null;
    }
  }

  private clearProblematicStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear only problematic keys, not all Supabase keys
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('sb-hsilpedhzelahseceats-auth-token-17') || // Remove timestamped keys
        key.includes('lock:sb-') // Remove lock-related keys
      );
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal errors
        }
      });
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleared ${keysToRemove.length} problematic storage keys`);
      }
    } catch (error) {
      console.warn('⚠️ Could not clear storage:', error);
    }
  }

  async getClient(): Promise<SupabaseClient> {
    if (SharedSupabaseService.instance) {
      return SharedSupabaseService.instance;
    }
    
    if (SharedSupabaseService.initPromise) {
      return await SharedSupabaseService.initPromise;
    }
    
    SharedSupabaseService.initPromise = this.initializeClient();
    return await SharedSupabaseService.initPromise;
  }

  get client(): SupabaseClient {
    if (!SharedSupabaseService.instance) {
      throw new Error('Supabase client not initialized. Use getClient() for async initialization.');
    }
    return SharedSupabaseService.instance;
  }

  // Convenience methods with error handling
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

  // Static cleanup method
  static cleanup() {
    if (SharedSupabaseService.instance) {
      try {
        // Safely stop auto refresh
        const auth = SharedSupabaseService.instance.auth;
        if (auth && typeof auth.stopAutoRefresh === 'function') {
          auth.stopAutoRefresh();
        }
        console.log('🧹 Supabase client cleaned up');
      } catch (error) {
        console.warn('⚠️ Error during cleanup:', error);
      }
    }
    SharedSupabaseService.instance = null as any;
    SharedSupabaseService.initPromise = null;
  }
}