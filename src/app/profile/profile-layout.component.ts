 
// src/app/profile/profile-layout.component.ts - SIMPLE LAYOUT
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <router-outlet />
    </div>
  `
})
export class ProfileLayoutComponent {}