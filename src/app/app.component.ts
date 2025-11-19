// import { Component, OnInit } from '@angular/core';
// import {
//   NavigationEnd,
//   Router,
//   RouterOutlet,
//   Event as RouterEvent,
// } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [RouterOutlet],
//   template: ` <router-outlet /> `,
// })
// export class AppComponent implements OnInit {
//   constructor(private router: Router) {}

//   ngOnInit() {
//     this.router.events.subscribe((event: RouterEvent) => {
//       if (event instanceof NavigationEnd) {
//         setTimeout(() => {
//           // Check if HSStaticMethods exists before calling
//           if (window.HSStaticMethods) {
//             window.HSStaticMethods.autoInit();
//           }
//         }, 100);
//       }
//     });
//   }
// }
import { Component, OnInit } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterOutlet,
  Event as RouterEvent,
} from '@angular/router';
import { ToastComponent } from './shared/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <app-toast />
    <router-outlet />
  `,
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
