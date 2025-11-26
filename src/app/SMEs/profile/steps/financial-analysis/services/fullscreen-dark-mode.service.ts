// src/app/SMEs/profile/steps/financial-analysis/services/fullscreen-dark-mode.service.ts
import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface DarkModeTheme {
  id: 'light' | 'dark' | 'advanced';
  name: string;
  colors: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    positive: string;
    negative: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FullscreenDarkModeService {
  private document = inject(DOCUMENT);

  // Signals
  isDarkMode = signal(false);
  isFullscreen = signal(false);
  currentTheme = signal<'light' | 'dark' | 'advanced'>('light');

  // CSS Variables Storage
  private cssVariables = new Map<string, string>();

  constructor() {
    this.initializeThemes();
    this.watchFullscreenChanges();
    this.setupDarkModeEffect();
  }

  /**
   * Initialize theme definitions
   */
  private initializeThemes(): void {
    // Light theme (default)
    this.setThemeVariables('light', {
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#f1f5f9',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-tertiary': '#94a3b8',
      '--border-color': '#e2e8f0',
      '--accent-teal': '#14b8a6',
      '--accent-teal-light': '#f0fdfa',
      '--accent-success': '#16a34a',
      '--accent-warning': '#d97706',
      '--accent-error': '#dc2626',
      '--accent-positive': '#10b981',
      '--accent-negative': '#ef4444',
      '--grid-line': 'rgba(226, 232, 240, 0.5)',
      '--input-bg': '#ffffff',
      '--input-border': '#cbd5e1',
      '--input-text': '#1e293b',
      '--button-bg': '#f1f5f9',
      '--button-hover': '#e2e8f0',
    });

    // Dark theme (Bloomberg Terminal inspired)
    this.setThemeVariables('dark', {
      '--bg-primary': '#0a0e27',
      '--bg-secondary': '#111629',
      '--bg-tertiary': '#1a1f3a',
      '--text-primary': '#e0e6ff',
      '--text-secondary': '#a3adc9',
      '--text-tertiary': '#7a8399',
      '--border-color': '#2d3a52',
      '--accent-teal': '#00d4aa',
      '--accent-teal-light': 'rgba(0, 212, 170, 0.1)',
      '--accent-success': '#00d084',
      '--accent-warning': '#ff9500',
      '--accent-error': '#ff4757',
      '--accent-positive': '#00d084',
      '--accent-negative': '#ff4757',
      '--grid-line': 'rgba(45, 58, 82, 0.3)',
      '--input-bg': '#0f1629',
      '--input-border': '#2d3a52',
      '--input-text': '#e0e6ff',
      '--button-bg': '#1a1f3a',
      '--button-hover': '#232d47',
    });

    // Advanced dark theme (ultra premium)
    this.setThemeVariables('advanced', {
      '--bg-primary': '#0d0d0d',
      '--bg-secondary': '#1a1a1a',
      '--bg-tertiary': '#242424',
      '--text-primary': '#f5f5f5',
      '--text-secondary': '#b0b0b0',
      '--text-tertiary': '#888888',
      '--border-color': '#404040',
      '--accent-teal': '#00d9ff',
      '--accent-teal-light': 'rgba(0, 217, 255, 0.08)',
      '--accent-success': '#00ff7f',
      '--accent-warning': '#ffaa00',
      '--accent-error': '#ff3333',
      '--accent-positive': '#00ff7f',
      '--accent-negative': '#ff3333',
      '--grid-line': 'rgba(64, 64, 64, 0.4)',
      '--input-bg': '#0f0f0f',
      '--input-border': '#404040',
      '--input-text': '#f5f5f5',
      '--button-bg': '#1f1f1f',
      '--button-hover': '#2a2a2a',
    });
  }

  /**
   * Store theme variables
   */
  private setThemeVariables(
    theme: string,
    variables: Record<string, string>
  ): void {
    Object.entries(variables).forEach(([key, value]) => {
      this.cssVariables.set(`${theme}:${key}`, value);
    });
  }

  /**
   * Watch fullscreen changes and auto-activate dark mode
   */
  private watchFullscreenChanges(): void {
    const checkFullscreen = () => {
      const isFs =
        !!this.document.fullscreenElement ||
        !!(this.document as any).webkitFullscreenElement ||
        !!(this.document as any).mozFullScreenElement ||
        !!(this.document as any).msFullscreenElement;
      this.isFullscreen.set(isFs);

      // Auto-activate advanced dark mode in fullscreen
      if (isFs && !this.isDarkMode()) {
        this.activateDarkMode('advanced');
      } else if (!isFs && this.isDarkMode()) {
        this.deactivateDarkMode();
      }
    };

    // Listen for fullscreen changes
    this.document.addEventListener('fullscreenchange', checkFullscreen);
    this.document.addEventListener('webkitfullscreenchange', checkFullscreen);
    this.document.addEventListener('mozfullscreenchange', checkFullscreen);
    this.document.addEventListener('MSFullscreenChange', checkFullscreen);

    // Check on component init
    checkFullscreen();
  }

  /**
   * Setup dark mode effect
   */
  private setupDarkModeEffect(): void {
    effect(() => {
      const isDark = this.isDarkMode();
      const theme = this.currentTheme();

      if (isDark) {
        this.applyTheme(theme);
        this.document.documentElement.classList.add('dark-mode-active');
      } else {
        this.removeTheme();
        this.document.documentElement.classList.remove('dark-mode-active');
      }
    });
  }

  /**
   * Apply theme variables to DOM
   */
  private applyTheme(theme: 'light' | 'dark' | 'advanced'): void {
    const root = this.document.documentElement;

    // Apply CSS variables
    this.cssVariables.forEach((value, key) => {
      const [themeId, varName] = key.split(':');
      if (themeId === theme) {
        root.style.setProperty(varName, value);
      }
    });

    // Apply dark mode class
    root.classList.add('dark-mode');
  }

  /**
   * Remove theme from DOM
   */
  private removeTheme(): void {
    const root = this.document.documentElement;
    root.classList.remove('dark-mode');
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--bg-tertiary');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-secondary');
    root.style.removeProperty('--text-tertiary');
    root.style.removeProperty('--border-color');
    root.style.removeProperty('--accent-teal');
    root.style.removeProperty('--accent-teal-light');
    root.style.removeProperty('--accent-success');
    root.style.removeProperty('--accent-warning');
    root.style.removeProperty('--accent-error');
    root.style.removeProperty('--accent-positive');
    root.style.removeProperty('--accent-negative');
    root.style.removeProperty('--grid-line');
    root.style.removeProperty('--input-bg');
    root.style.removeProperty('--input-border');
    root.style.removeProperty('--input-text');
    root.style.removeProperty('--button-bg');
    root.style.removeProperty('--button-hover');
  }

  /**
   * Activate dark mode
   */
  activateDarkMode(theme: 'dark' | 'advanced' = 'advanced'): void {
    this.isDarkMode.set(true);
    this.currentTheme.set(theme);
  }

  /**
   * Deactivate dark mode
   */
  deactivateDarkMode(): void {
    this.isDarkMode.set(false);
    this.currentTheme.set('light');
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(theme: 'dark' | 'advanced' = 'advanced'): void {
    if (this.isDarkMode()) {
      this.deactivateDarkMode();
    } else {
      this.activateDarkMode(theme);
    }
  }

  /**
   * Get current theme colors
   */
  getThemeColors(): DarkModeTheme['colors'] {
    const theme = this.currentTheme();
    const isDark = this.isDarkMode();

    if (!isDark) {
      return {
        bg: '#f8fafc',
        surface: '#ffffff',
        accent: '#14b8a6',
        text: '#0f172a',
        textSecondary: '#475569',
        border: '#e2e8f0',
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
        positive: '#10b981',
        negative: '#ef4444',
      };
    }

    if (theme === 'dark') {
      return {
        bg: '#0a0e27',
        surface: '#111629',
        accent: '#00d4aa',
        text: '#e0e6ff',
        textSecondary: '#a3adc9',
        border: '#2d3a52',
        success: '#00d084',
        warning: '#ff9500',
        error: '#ff4757',
        positive: '#00d084',
        negative: '#ff4757',
      };
    }

    // Advanced theme
    return {
      bg: '#0d0d0d',
      surface: '#1a1a1a',
      accent: '#00d9ff',
      text: '#f5f5f5',
      textSecondary: '#b0b0b0',
      border: '#404040',
      success: '#00ff7f',
      warning: '#ffaa00',
      error: '#ff3333',
      positive: '#00ff7f',
      negative: '#ff3333',
    };
  }

  /**
   * Get CSS variable value
   */
  getCSSVariable(variable: string): string {
    return (
      this.document.documentElement.style.getPropertyValue(variable).trim() ||
      ''
    );
  }

  /**
   * Check if dark mode is active
   */
  isDarkModeActive(): boolean {
    return this.isDarkMode();
  }

  /**
   * Check if in fullscreen
   */
  isInFullscreen(): boolean {
    return this.isFullscreen();
  }
}
