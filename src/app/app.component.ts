import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
  `
})
export class AppComponent {}

// // Update app.component.ts to use landing page
// // src/app/app.component.ts
// import { Component } from '@angular/core';
// import { LandingComponent } from './landing/landing.component';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [LandingComponent],
//   template: `<app-landing />`,
// })
// export class AppComponent {}