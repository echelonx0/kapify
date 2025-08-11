// src/app/core/interceptors/supabase-auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/production.auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class SupabaseAuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept Supabase API calls
    if (!req.url.includes(environment.supabaseUrl)) {
      return next.handle(req);
    }

    // Get the auth token
    const token = this.authService.getAccessToken();
    
    if (!token) {
      return next.handle(req);
    }

    // Clone the request and add auth header
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'apikey': environment.supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    return next.handle(authReq);
  }
}

// Add to app.config.ts providers:
// {
//   provide: HTTP_INTERCEPTORS,
//   useClass: SupabaseAuthInterceptor,
//   multi: true
// }