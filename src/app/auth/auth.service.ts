// src/app/auth/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { User } from '../shared/models/user.models';


export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false
  });

  // Public readonly signals
  user = this.authState.asReadonly();
  isAuthenticated = () => this.authState().isAuthenticated;
  isLoading = () => this.authState().isLoading;

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const user: User = {
        id: '1',
        email: email,
        firstName: email.split('@')[0],
        userType: 'sme',
        lastName: '',
        status: 'active',
        emailVerified: false,
        phoneVerified: false,
        accountTier: 'basic',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.authState.set({
        user,
        isAuthenticated: true,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this.authState.update(state => ({ ...state, isLoading: false }));
      return { success: false, error: 'Invalid credentials' };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      // Mock successful login
      const user: User = {
        id: '1',

        userType: 'sme',
        lastName: '',
        status: 'active',
        emailVerified: false,
        phoneVerified: false,
        accountTier: 'basic',
        createdAt: new Date(),
        updatedAt: new Date(),
        email: '',
        firstName: ''
      };


      this.authState.set({
        user,
        isAuthenticated: true,
        isLoading: false
      });

      return { success: true };
    } catch (error) {
      this.authState.update(state => ({ ...state, isLoading: false }));
      return { success: false, error: 'Registration failed' };
    }
  }

  logout() {
    this.authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }

  private setLoading(loading: boolean) {
    this.authState.update(state => ({ ...state, isLoading: loading }));
  }
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: 'sme' | 'funder';
  companyName?: string;
  agreeToTerms: boolean;
}
