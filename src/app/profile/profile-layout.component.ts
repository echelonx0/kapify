 
// src/app/profile/profile-layout.component.ts - SIMPLE LAYOUT
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../shared/components';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent],
  template: `

   <div class=" bg-neutral-50 flex">
      <sidebar-nav />
      
     
        <main class="flex-1">
          <router-outlet />
        </main>
  
    </div>
  `
})
export class ProfileLayoutComponent {}