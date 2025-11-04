import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionService } from '../services/version.service';
import { LandingHeaderComponent } from 'src/app/landing/landing-header.component';

@Component({
  selector: 'app-version-info',
  standalone: true,
  imports: [CommonModule, LandingHeaderComponent],
  template: `
    <landing-header />
    <div
      class="mt-6 border-t border-neutral-200 pt-4 text-sm text-neutral-700 ml-8 mr-8 mt-20"
    >
      <div
        class="inline-flex items-center space-x-2 border px-2 py-1 rounded-lg text-xs mb-2"
        [ngClass]="versionService.getEnvironmentBadgeClass()"
      >
        <span>{{ versionService.shortVersion() }}</span>
        <span class="opacity-70">•</span>
        <span>{{ versionService.environment() }}</span>
        <span class="opacity-70">•</span>
        <span>{{ versionService.buildDate() }}</span>
      </div>

      <div class="mt-2">
        <p class="font-semibold text-neutral-800">
          What’s new in {{ versionService.shortVersion() }}
        </p>
        <ul class="list-disc list-inside space-y-1 mt-1 text-neutral-600">
          <li>Marketplace opportunities now include short descriptions.</li>
          <li>Data room removed from founder side for simpler experience.</li>
          <li>Header and CTA buttons improved for logged-in users.</li>
          <li>Requested amount display fixed in applications.</li>
        </ul>
      </div>

      <div
        class="mt-4 border-t border-neutral-200 pt-3 text-xs text-neutral-500"
      >
        Build {{ versionService.buildNumber() }} • Commit
        {{ versionService.commitHash() }}
      </div>
    </div>
  `,
})
export class VersionInfoComponent {
  versionService = inject(VersionService);
}
