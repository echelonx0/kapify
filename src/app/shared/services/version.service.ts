// src/app/shared/services/version.service.ts
import { Injectable, signal } from '@angular/core';

export interface VersionInfo {
  version: string;
  buildDate: string;
  environment: 'development' | 'staging' | 'production';
  buildNumber?: string;
  commitHash?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  // Global version signal accessible throughout the app
  private versionInfo = signal<VersionInfo>({
    version: '2.9.14',
    buildDate: '16th December, 2025',
    environment: 'production',
    buildNumber: '1',
    commitHash: 'bb6b208', // First 7 chars of git commit
  });

  // Public read-only access
  public readonly version = this.versionInfo.asReadonly();

  // Computed convenience properties
  public readonly versionString = () => this.versionInfo().version;
  public readonly buildDate = () => this.versionInfo().buildDate;
  public readonly environment = () => this.versionInfo().environment;
  public readonly buildNumber = () => this.versionInfo().buildNumber;
  public readonly commitHash = () => this.versionInfo().commitHash;

  // Formatted version strings for different use cases
  public readonly shortVersion = () => `v${this.versionInfo().version}`;
  public readonly fullVersion = () =>
    `v${this.versionInfo().version} (${this.versionInfo().buildNumber})`;
  public readonly detailedVersion = () => {
    const info = this.versionInfo();
    return `v${info.version} • Build ${info.buildNumber} • ${info.buildDate}`;
  };

  // Method to update version info (for build processes)
  updateVersionInfo(info: Partial<VersionInfo>) {
    this.versionInfo.update((current) => ({ ...current, ...info }));
  }

  // Get environment-specific styling
  getEnvironmentBadgeClass(): string {
    const env = this.environment();
    switch (env) {
      case 'development':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'staging':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'production':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  }

  // Check if this is a development build
  isDevelopment = () => this.environment() === 'development';
  isProduction = () => this.environment() === 'production';
}
