
// src/app/auth/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/production.auth.service';
 
 

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.user();
    const requiredRoles = route.data['roles'] as string[];
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.userType);
    
    if (!hasRole) {
      // Redirect based on user type
      if (user.userType === 'sme') {
        this.router.navigate(['/dashboard']);
      } else if (user.userType === 'funder') {
        this.router.navigate(['/dashboard/funder-dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
      return false;
    }

    return true;
  }
}
