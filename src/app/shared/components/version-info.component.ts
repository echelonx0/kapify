import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { VersionService } from '../services/version.service';
import {
  ChangelogService,
  ChangelogEntry,
  RoadmapItem,
  IssueItem,
  ChangelogData,
} from '../services/changelog.service';
import { LandingHeaderComponent } from 'src/app/core/landing/components/landing-header.component';
import { Observable, tap } from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-version-info',
  standalone: true,
  imports: [CommonModule, LandingHeaderComponent, AsyncPipe, NgForOf, NgIf],
  animations: [
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', overflow: 'hidden', opacity: 0 })
      ),
      state(
        'expanded',
        style({ height: '*', overflow: 'visible', opacity: 1 })
      ),
      transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
    ]),
  ],
  template: `
    <landing-header />
    <div
      class="mt-20 border-t border-neutral-200 pt-4 text-sm text-neutral-700 ml-8 mr-8"
    >
      <!-- Version Badge -->
      <div
        class="inline-flex items-center space-x-2 border px-2 py-1 rounded-lg text-xs mb-4"
        [ngClass]="versionService.getEnvironmentBadgeClass()"
      >
        <span>{{ versionService.shortVersion() }}</span>
        <span class="opacity-70">•</span>
        <span>{{ versionService.environment() }}</span>
        <span class="opacity-70">•</span>
        <span>{{ versionService.buildDate() }}</span>
      </div>

      <!-- Changelog -->
      <div *ngIf="changelog$ | async as data">
        <!-- All Versions -->
        <ng-container *ngFor="let v of data.versions; let i = index">
          <div class="border-b border-neutral-200 py-2">
            <button
              class="w-full text-left flex justify-between items-center font-semibold text-neutral-800"
              (click)="toggleVersion(i)"
            >
              <span>What’s new in {{ v.version }} ({{ v.date }})</span>
              <span class="text-xs opacity-60">{{
                expandedVersions[i] ? '▲' : '▼'
              }}</span>
            </button>
            <ul
              [@expandCollapse]="expandedVersions[i] ? 'expanded' : 'collapsed'"
              class="list-disc list-inside space-y-1 mt-2 text-neutral-600"
            >
              <li *ngFor="let highlight of v.highlights">
                <span
                  class="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs mr-1"
                  >✅</span
                >
                {{ highlight }}
              </li>
            </ul>
          </div>
        </ng-container>

        <!-- Roadmap Section -->
        <div class="border-b border-neutral-200 py-2 mt-4">
          <button
            class="w-full text-left flex justify-between items-center font-semibold text-neutral-800"
            (click)="toggleRoadmap()"
          >
            <span>🚀 Roadmap</span>
            <span class="text-xs opacity-60">{{
              roadmapExpanded ? '▲' : '▼'
            }}</span>
          </button>
          <ul
            [@expandCollapse]="roadmapExpanded ? 'expanded' : 'collapsed'"
            class="list-disc list-inside space-y-1 mt-2 text-neutral-600"
          >
            <li
              *ngFor="let item of data.roadmap"
              class="flex justify-between items-center"
            >
              <span>🚀 {{ item.item }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-semibold"
                [ngClass]="{
                  'bg-yellow-100 text-yellow-800': item.status === 'Planned',
                  'bg-blue-100 text-blue-800': item.status === 'In Progress',
                  'bg-green-100 text-green-800': item.status === 'Completed'
                }"
              >
                {{ item.status }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Issues / Bug Tracker Section -->
        <div class="border-b border-neutral-200 py-2 mt-4">
          <button
            class="w-full text-left flex justify-between items-center font-semibold text-neutral-800"
            (click)="toggleIssues()"
          >
            <span>🐞 Bug Tracker / Issues</span>
            <span class="text-xs opacity-60">{{
              issuesExpanded ? '▲' : '▼'
            }}</span>
          </button>
          <ul
            [@expandCollapse]="issuesExpanded ? 'expanded' : 'collapsed'"
            class="list-disc list-inside space-y-1 mt-2 text-neutral-600"
          >
            <li *ngFor="let issue of data.issues" class="flex items-center">
              <span
                class="px-2 py-0.5 rounded-full text-xs mr-2"
                [ngClass]="
                  issue.done
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                "
              >
                {{ issue.done ? '✅' : '🐞' }}
              </span>
              {{ issue.issue }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Build Metadata -->
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
  changelogService = inject(ChangelogService);

  changelog$: Observable<ChangelogData> = this.changelogService.loadAll();

  expandedVersions: boolean[] = [];
  roadmapExpanded = false;
  issuesExpanded = false;

  constructor() {
    this.changelog$.subscribe((data) => {
      // Auto-expand latest version
      this.expandedVersions = data.versions.map((v, i) => i === 0);
      this.roadmapExpanded = false;
      this.issuesExpanded = false;
    });
  }

  toggleVersion(index: number) {
    this.expandedVersions[index] = !this.expandedVersions[index];
  }

  toggleRoadmap() {
    this.roadmapExpanded = !this.roadmapExpanded;
  }

  toggleIssues() {
    this.issuesExpanded = !this.issuesExpanded;
  }
}
