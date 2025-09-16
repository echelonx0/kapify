import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, Event as RouterEvent } from '@angular/router';
import { TestModalComponent } from './test-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
  `
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          // Check if HSStaticMethods exists before calling
          if (window.HSStaticMethods) {
            window.HSStaticMethods.autoInit();
          }
        }, 100);
      }
    });
  }
}