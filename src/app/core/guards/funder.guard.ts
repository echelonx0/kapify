
// src/app/funder/guards/funder-auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs'; 
import { AuthService } from '../auth/production.auth.service';

@Injectable({
  providedIn: 'root'
})
export class FunderAuthGuard implements CanActivate {
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(): Observable<boolean> {
    const currentUser = this.authService.user();
    
    if (!currentUser) {
      this.router.navigate(['/auth/login']);
      return of(false);
    }

    if (currentUser.userType !== 'funder') {
      // Redirect SMEs to their dashboard
      this.router.navigate(['/dashboard']);
      return of(false);
    }

    return of(true);
  }
}