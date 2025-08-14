// shared-supabase.service.ts - SINGLE Supabase instance for entire app
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
 

@Injectable({
  providedIn: 'root'
})
export class SharedSupabaseService {
  private static instance: SupabaseClient;

  constructor() {
    if (!SharedSupabaseService.instance) {
      console.log('🔧 Creating SINGLE Supabase client instance');
      SharedSupabaseService.instance = createClient(
        environment.supabaseUrl, 
        environment.supabaseAnonKey,
        {
          db: {
            schema: 'public'
          },
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          },
          global: {
            headers: {
              'X-Client-Info': 'supabase-js-web'
            }
          }
        }
      );
    } else {
      console.log('♻️ Reusing existing Supabase client instance');
    }
  }

  get client(): SupabaseClient {
    return SharedSupabaseService.instance;
  }

  // Convenience methods
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
}