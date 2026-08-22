import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

const BRAND_COLOR_STORAGE_KEY = 'maiawall.brandColor';
const DEFAULT_BRAND_COLOR = '#c8102e';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    const storedColor = localStorage.getItem(BRAND_COLOR_STORAGE_KEY);
    this.applyBrandColor(storedColor || DEFAULT_BRAND_COLOR);
  }

  private applyBrandColor(color: string): void {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return;
    }

    const root = document.documentElement;
    const rgb = this.hexToRgb(color);
    root.style.setProperty('--color-primary', color);
    root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty('--color-primary-hover', this.mixWithBlack(color, 0.16));
    root.style.setProperty('--color-primary-soft', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
    root.style.setProperty('--color-primary-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`);
  }

  private hexToRgb(color: string): { r: number; g: number; b: number } {
    const normalizedColor = color.replace('#', '');
    return {
      r: parseInt(normalizedColor.slice(0, 2), 16),
      g: parseInt(normalizedColor.slice(2, 4), 16),
      b: parseInt(normalizedColor.slice(4, 6), 16),
    };
  }

  private mixWithBlack(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    const mix = (value: number) => Math.round(value * (1 - amount));
    return `#${[mix(rgb.r), mix(rgb.g), mix(rgb.b)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`;
  }
}
