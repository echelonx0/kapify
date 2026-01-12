import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-disclaimer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border-t-2 border-b-2 border-slate-200">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <p class="text-slate-700 text-sm leading-relaxed">
          <strong>Disclaimer:</strong> Kapify facilitates connections and
          provides due diligence infrastructure. All investment decisions are
          made independently by the funders on the platform. Kapify does not
          guarantee that any application for funding will be successful or that
          any Funder will offer terms to a User.
        </p>
      </div>
    </div>
  `,
})
export class PlatformDisclaimerComponent {}
