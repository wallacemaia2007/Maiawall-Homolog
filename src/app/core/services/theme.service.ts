import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');
  readonly darkTheme = computed(() => this.mode() === 'dark');

  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.mode();
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  toggleMode(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }
}
